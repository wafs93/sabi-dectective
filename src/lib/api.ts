import { parseUnlockedClues } from "@/lib/game";
import { SLOW_CONNECTION } from "@/lib/slow-request";
import type { Accusation, AccusationResult, UnlockedClue } from "@/lib/types";

// /api/unlock and /api/accuse can take several seconds on slow mobile data, so they wait
// this long before giving up. These are the only requests made from this file.
export const REQUEST_TIMEOUT_MS = 20_000;

export type SubmitOutcome =
  | { ok: true; result: AccusationResult }
  // retry: it timed out or the connection failed, so the same accusation can simply be sent again.
  | { ok: false; message: string; retry?: true };

type RequestOptions = { fetchImpl?: typeof fetch; timeoutMs?: number };

const RECONNECT = "Reconnect to submit your accusation. Your progress is saved.";

export async function submitAccusation(
  caseId: string,
  accusation: Accusation,
  { fetchImpl = fetch, timeoutMs = REQUEST_TIMEOUT_MS }: RequestOptions = {},
): Promise<SubmitOutcome> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { ok: false, message: RECONNECT };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetchImpl("/api/accuse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caseId,
        suspectId: accusation.suspectId,
        clueIds: accusation.citedClueIds,
      }),
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timer);
    // Timed out or the connection dropped.
    return { ok: false, message: SLOW_CONNECTION, retry: true };
  }

  if (res.ok) {
    try {
      return { ok: true, result: (await res.json()) as AccusationResult };
    } catch {
      return { ok: false, message: SLOW_CONNECTION, retry: true };
    } finally {
      clearTimeout(timer);
    }
  }
  clearTimeout(timer);
  if (res.status === 429) {
    return { ok: false, message: "Too many accusations. Wait a minute and try again." };
  }
  if (res.status >= 500) return { ok: false, message: RECONNECT };

  let message = "That accusation could not be checked.";
  try {
    const body = (await res.json()) as { error?: unknown };
    if (typeof body.error === "string") message = body.error;
  } catch {
    // keep default
  }
  return { ok: false, message };
}

// ---- /api/unlock ----
// The answer is untrusted: an unlocked clue is checked like saved progress before it is
// used. These never throw: an error, a rate limit, a timeout or no connection is "error".

export const UNLOCK_TIMEOUT_MS = REQUEST_TIMEOUT_MS;

export type UnlockAnswer =
  | { status: "unlocked"; clue: UnlockedClue }
  | { status: "already-unlocked" }
  // No match, or the case has no unlocks at all: either way, nothing connects.
  | { status: "no-match" }
  | { status: "error" };

type UnlockOptions = RequestOptions;

async function postUnlock(
  body: Record<string, unknown>,
  { fetchImpl = fetch, timeoutMs = UNLOCK_TIMEOUT_MS }: UnlockOptions = {},
): Promise<UnlockAnswer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl("/api/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) return { status: "error" };
    const answer = (await res.json()) as { status?: unknown; clue?: unknown };
    switch (answer?.status) {
      case "unlocked": {
        const clue = parseUnlockedClues([answer.clue])[0];
        return clue ? { status: "unlocked", clue } : { status: "error" };
      }
      case "already-unlocked":
        return { status: "already-unlocked" };
      case "no-match":
      case "no-unlocks":
        return { status: "no-match" };
      default:
        return { status: "error" };
    }
  } catch {
    return { status: "error" };
  } finally {
    clearTimeout(timer);
  }
}

// Does confronting this suspect with this clue reveal a locked clue? The full answer, so the
// game can tell "nothing to reveal" from "couldn't check" (which the player may retry).
export function requestConfrontAnswer(
  caseId: string,
  suspectId: string,
  clueId: string,
  unlockedClueIds: string[],
  options: UnlockOptions = {},
): Promise<UnlockAnswer> {
  return postUnlock({ caseId, kind: "confront", suspectId, clueId, unlockedClueIds }, options);
}

// The same, as the clue or null for anything else (no match, already held, no unlocks, an error).
export async function requestConfrontUnlock(
  caseId: string,
  suspectId: string,
  clueId: string,
  unlockedClueIds: string[],
  options: UnlockOptions = {},
): Promise<UnlockedClue | null> {
  const answer = await requestConfrontAnswer(caseId, suspectId, clueId, unlockedClueIds, options);
  return answer.status === "unlocked" ? answer.clue : null;
}

// Do these two clues connect to reveal a locked clue?
export function requestCombineUnlock(
  caseId: string,
  clueIds: readonly [string, string],
  unlockedClueIds: string[],
  options: UnlockOptions = {},
): Promise<UnlockAnswer> {
  return postUnlock({ caseId, kind: "combine", clueIds: [...clueIds], unlockedClueIds }, options);
}
