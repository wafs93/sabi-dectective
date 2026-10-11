import "server-only";
import { evaluateAccusation, type CaseSolution } from "@/engine/scoring";
import { clientIp, type RateLimiter } from "@/server/rate-limit";

export const MAX_BODY_BYTES = 2048;
export const MAX_CLUE_IDS = 20;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AccuseRequest = { caseId: string; suspectId: string; clueIds: string[] };

export type ScoringData = {
  solution: CaseSolution;
  suspects: { id: string; name: string }[];
  clueIds: string[];
  // The case's locked clues: once unlocked, a player may cite them too.
  lockedClueIds?: string[];
};

export type AccuseDeps = {
  loadScoringData: (caseId: string) => Promise<ScoringData | null>;
  limiter: RateLimiter;
};

const isUuid = (v: unknown): v is string => typeof v === "string" && UUID_RE.test(v);

export function parseAccuseRequest(
  body: unknown,
): { ok: true; value: AccuseRequest } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, error: "Body must be a JSON object." };
  }
  const { caseId, suspectId, clueIds } = body as Record<string, unknown>;
  if (!isUuid(caseId)) return { ok: false, error: "caseId must be a UUID." };
  if (!isUuid(suspectId)) return { ok: false, error: "suspectId must be a UUID." };
  if (!Array.isArray(clueIds)) return { ok: false, error: "clueIds must be an array." };
  if (clueIds.length > MAX_CLUE_IDS) {
    return { ok: false, error: `clueIds can hold at most ${MAX_CLUE_IDS} items.` };
  }
  if (!clueIds.every(isUuid)) return { ok: false, error: "Every clueId must be a UUID." };

  const lower = (id: string) => id.toLowerCase();
  return {
    ok: true,
    value: {
      caseId: lower(caseId),
      suspectId: lower(suspectId),
      clueIds: [...new Set(clueIds.map(lower))],
    },
  };
}

function json(status: number, body: unknown, headers: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export function createAccuseHandler(deps: AccuseDeps) {
  return async function POST(request: Request): Promise<Response> {
    try {
      const limit = deps.limiter.take(clientIp(request));
      if (!limit.allowed) {
        return json(
          429,
          { error: "Too many accusations. Wait a minute and try again." },
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

      const parsed = parseAccuseRequest(body);
      if (!parsed.ok) return json(400, { error: parsed.error });
      const { caseId, suspectId, clueIds } = parsed.value;

      let data: ScoringData | null;
      try {
        data = await deps.loadScoringData(caseId);
      } catch (err) {
        console.error("accuse: could not load case solution:", err instanceof Error ? err.message : err);
        return json(503, { error: "The case file is unavailable right now. Try again shortly." });
      }
      if (!data) return json(404, { error: "Unknown case." });

      const suspect = data.suspects.find((s) => s.id === suspectId);
      if (!suspect) return json(400, { error: "Unknown suspect for this case." });
      const caseClues = new Set([...data.clueIds, ...(data.lockedClueIds ?? [])]);
      if (!clueIds.every((id) => caseClues.has(id))) {
        return json(400, { error: "Unknown clue for this case." });
      }

      return json(200, evaluateAccusation(data.solution, { suspectId, clueIds }, suspect.name));
    } catch (err) {
      console.error("accuse: unexpected error:", err instanceof Error ? err.message : err);
      return json(500, { error: "Something went wrong. Try again." });
    }
  };
}
