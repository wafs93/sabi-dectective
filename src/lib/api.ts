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

// Asks the server whether confronting this suspect with this clue reveals a locked clue.
// Returns the clue only on a clear "unlocked"; anything else (no match, already held, no
// unlocks, an error, a rate limit, a timeout, no connection) is null. It never throws.
// The answer is untrusted: the clue is checked like saved progress before it is used.
export const UNLOCK_TIMEOUT_MS = 5000;

export async function requestConfrontUnlock(
  caseId: string,
  suspectId: string,
  clueId: string,
  unlockedClueIds: string[],
  { fetchImpl = fetch, timeoutMs = UNLOCK_TIMEOUT_MS }: { fetchImpl?: typeof fetch; timeoutMs?: number } = {},
): Promise<UnlockedClue | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl("/api/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId, kind: "confront", suspectId, clueId, unlockedClueIds }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { status?: unknown; clue?: unknown };
    if (body?.status !== "unlocked") return null;
    return parseUnlockedClues([body.clue])[0] ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
