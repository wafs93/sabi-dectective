import "server-only";
import type { LockedClue, UnlockData } from "@/server/locked";
import { clientIp, type RateLimiter } from "@/server/rate-limit";
import { checkCombine, checkConfront } from "@/server/unlocks";

// POST /api/unlock: checks one confront or combine against the case's private rules.
// It answers only about the one attempt: the revealed clue, or a plain "no". It never
// returns the rules, other locked clues, or how many there are.

export const MAX_BODY_BYTES = 4096;
// Same cap as saved progress keeps (MAX_UNLOCKED_CLUES in src/lib/game.ts).
export const MAX_UNLOCKED_CLUES = 50;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type UnlockRequest =
  | { caseId: string; kind: "confront"; suspectId: string; clueId: string; unlockedClueIds: string[] }
  | { caseId: string; kind: "combine"; clueIds: [string, string]; unlockedClueIds: string[] };

export type UnlockResponse =
  | { status: "unlocked"; clue: LockedClue }
  | { status: "already-unlocked"; clueId: string }
  | { status: "no-match"; message: string }
  | { status: "no-unlocks"; message: string };

export type UnlockDeps = {
  loadUnlockData: (caseId: string) => Promise<UnlockData | null>;
  limiter: RateLimiter;
};

const isUuid = (v: unknown): v is string => typeof v === "string" && UUID_RE.test(v);
const lower = (id: string) => id.toLowerCase();

export function parseUnlockRequest(
  body: unknown,
): { ok: true; value: UnlockRequest } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, error: "Body must be a JSON object." };
  }
  const { caseId, kind, suspectId, clueId, clueIds, unlockedClueIds = [] } = body as Record<string, unknown>;
  if (!isUuid(caseId)) return { ok: false, error: "caseId must be a UUID." };
  if (!Array.isArray(unlockedClueIds)) return { ok: false, error: "unlockedClueIds must be an array." };
  if (unlockedClueIds.length > MAX_UNLOCKED_CLUES) {
    return { ok: false, error: `unlockedClueIds can hold at most ${MAX_UNLOCKED_CLUES} items.` };
  }
  if (!unlockedClueIds.every(isUuid)) return { ok: false, error: "Every unlockedClueId must be a UUID." };
  const held = [...new Set(unlockedClueIds.map(lower))];

  if (kind === "confront") {
    if (!isUuid(suspectId)) return { ok: false, error: "suspectId must be a UUID." };
    if (!isUuid(clueId)) return { ok: false, error: "clueId must be a UUID." };
    return {
      ok: true,
      value: { caseId: lower(caseId), kind, suspectId: lower(suspectId), clueId: lower(clueId), unlockedClueIds: held },
    };
  }
  if (kind === "combine") {
    if (!Array.isArray(clueIds) || clueIds.length !== 2) {
      return { ok: false, error: "clueIds must be an array of exactly two clue ids." };
    }
    if (!clueIds.every(isUuid)) return { ok: false, error: "Every clueId must be a UUID." };
    return {
      ok: true,
      value: {
        caseId: lower(caseId),
        kind,
        clueIds: [lower(clueIds[0]), lower(clueIds[1])],
        unlockedClueIds: held,
      },
    };
  }
  return { ok: false, error: 'kind must be "confront" or "combine".' };
}

const NO_MATCH: UnlockResponse = { status: "no-match", message: "These don't connect." };
const NO_UNLOCKS: UnlockResponse = { status: "no-unlocks", message: "No unlocks for this case." };

function json(status: number, body: unknown, headers: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export function createUnlockHandler(deps: UnlockDeps) {
  return async function POST(request: Request): Promise<Response> {
    try {
      const limit = deps.limiter.take(clientIp(request));
      if (!limit.allowed) {
        return json(
          429,
          { error: "Too many tries. Wait a minute and try again." },
          { "Retry-After": String(limit.retryAfterSeconds) },
        );
      }

      const declared = Number(request.headers.get("content-length") ?? 0);
      if (declared > MAX_BODY_BYTES) return json(400, { error: "Request body is too large." });

      const raw = await request.text();
      if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
        return json(400, { error: "Request body is too large." });
      }

      let body: unknown;
      try {
        body = JSON.parse(raw);
      } catch {
        return json(400, { error: "Body must be valid JSON." });
      }

      const parsed = parseUnlockRequest(body);
      if (!parsed.ok) return json(400, { error: parsed.error });
      const req = parsed.value;

      let data: UnlockData | null;
      try {
        data = await deps.loadUnlockData(req.caseId);
      } catch (err) {
        console.error("unlock: could not load unlock rules:", err instanceof Error ? err.message : err);
        return json(503, { error: "The case file is unavailable right now. Try again shortly." });
      }
      if (!data) return json(404, { error: "Unknown case." });
      if (data.rules.length === 0) return json(200, NO_UNLOCKS);

      const check =
        req.kind === "confront"
          ? checkConfront(data.rules, { suspectId: req.suspectId, clueId: req.clueId }, req.unlockedClueIds)
          : checkCombine(data.rules, req.clueIds, req.unlockedClueIds);

      if (check.status === "no-match") return json(200, NO_MATCH);
      if (check.status === "already-unlocked") {
        return json(200, { status: "already-unlocked", clueId: check.clueId } satisfies UnlockResponse);
      }

      const clue = data.lockedClues.find((c) => c.id === check.clueId);
      if (!clue) {
        // A rule pointing at a locked clue of another case or a missing row: a data mistake.
        // Logged for us; the player just gets the plain answer.
        console.error("unlock: rule matched but its locked clue is missing for this case:", check.clueId);
        return json(200, NO_MATCH);
      }
      const { id, name, found_description, icon_image_url } = clue;
      return json(200, {
        status: "unlocked",
        clue: { id, name, found_description, icon_image_url },
      } satisfies UnlockResponse);
    } catch (err) {
      console.error("unlock: unexpected error:", err instanceof Error ? err.message : err);
      return json(500, { error: "Something went wrong. Try again." });
    }
  };
}
