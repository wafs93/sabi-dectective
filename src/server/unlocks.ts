import "server-only";

// Locked clues: the rules that reveal a hidden clue. Pure functions, no network.
// Server only: the rules and locked clue ids must never reach the browser before
// the player unlocks them. The future /api/unlock route reuses these.

export type UnlockRule =
  // Confronting this suspect with this clue reveals the locked clue.
  | { kind: "confront"; suspectId: string; clueId: string; unlocksClueId: string }
  // Connecting these two clues (in either order) reveals the locked clue.
  | { kind: "combine"; clueIds: readonly [string, string]; unlocksClueId: string };

export type UnlockKind = UnlockRule["kind"];

export type UnlockCheck =
  | { status: "unlocked"; clueId: string }
  // The rule matches, but the player already has that clue.
  | { status: "already-unlocked"; clueId: string }
  | { status: "no-match" };

const NO_MATCH: UnlockCheck = { status: "no-match" };

function result(clueId: string, alreadyUnlocked: readonly string[]): UnlockCheck {
  return alreadyUnlocked.includes(clueId)
    ? { status: "already-unlocked", clueId }
    : { status: "unlocked", clueId };
}

export function checkConfront(
  rules: readonly UnlockRule[],
  attempt: { suspectId: string; clueId: string },
  alreadyUnlocked: readonly string[] = [],
): UnlockCheck {
  const rule = rules.find(
    (r) => r.kind === "confront" && r.suspectId === attempt.suspectId && r.clueId === attempt.clueId,
  );
  return rule ? result(rule.unlocksClueId, alreadyUnlocked) : NO_MATCH;
}

export function checkCombine(
  rules: readonly UnlockRule[],
  [a, b]: readonly [string, string],
  alreadyUnlocked: readonly string[] = [],
): UnlockCheck {
  // A clue can't be connected with itself.
  if (a === b) return NO_MATCH;
  const rule = rules.find(
    (r) =>
      r.kind === "combine" &&
      ((r.clueIds[0] === a && r.clueIds[1] === b) || (r.clueIds[0] === b && r.clueIds[1] === a)),
  );
  return rule ? result(rule.unlocksClueId, alreadyUnlocked) : NO_MATCH;
}

// The locked clues still hidden, in case order, each with the ways it can be revealed.
// This is what the locked slots will show: the unlock type, never the content.
export function remainingLocked(
  lockedClueIds: readonly string[],
  rules: readonly UnlockRule[],
  alreadyUnlocked: readonly string[] = [],
): { clueId: string; kinds: UnlockKind[] }[] {
  return lockedClueIds
    .filter((id) => !alreadyUnlocked.includes(id))
    .map((clueId) => ({
      clueId,
      kinds: [...new Set(rules.filter((r) => r.unlocksClueId === clueId).map((r) => r.kind))],
    }));
}
