import type { Accusation, AccusationResult } from "@/lib/types";

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
