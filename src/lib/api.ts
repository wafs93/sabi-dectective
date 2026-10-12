import { parseUnlockedClues } from "@/lib/game";
import type { Accusation, AccusationResult, UnlockedClue } from "@/lib/types";

export type SubmitOutcome =
  | { ok: true; result: AccusationResult }
  | { ok: false; message: string };

const RECONNECT = "Reconnect to submit your accusation. Your progress is saved.";

export async function submitAccusation(
  caseId: string,
  accusation: Accusation,
): Promise<SubmitOutcome> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { ok: false, message: RECONNECT };
  }

  let res: Response;
  try {
    res = await fetch("/api/accuse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caseId,
        suspectId: accusation.suspectId,
        clueIds: accusation.citedClueIds,
      }),
    });
  } catch {
    return { ok: false, message: RECONNECT };
  }

  if (res.ok) {
    try {
      return { ok: true, result: (await res.json()) as AccusationResult };
    } catch {
      return { ok: false, message: RECONNECT };
    }
  }
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

export const UNLOCK_TIMEOUT_MS = 5000;

export type UnlockAnswer =
  | { status: "unlocked"; clue: UnlockedClue }
  | { status: "already-unlocked" }
  // No match, or the case has no unlocks at all: either way, nothing connects.
  | { status: "no-match" }
  | { status: "error" };

type UnlockOptions = { fetchImpl?: typeof fetch; timeoutMs?: number };

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

// Does confronting this suspect with this clue reveal a locked clue? The clue, or null for
// anything else (no match, already held, no unlocks, an error).
export async function requestConfrontUnlock(
  caseId: string,
  suspectId: string,
  clueId: string,
  unlockedClueIds: string[],
  options: UnlockOptions = {},
): Promise<UnlockedClue | null> {
  const answer = await postUnlock({ caseId, kind: "confront", suspectId, clueId, unlockedClueIds }, options);
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
