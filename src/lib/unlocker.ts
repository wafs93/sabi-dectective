import type { UnlockedClue } from "@/lib/types";

// Decides when to ask the server about a confront, for one case.
// - Off (the case has no locked clues): never asks.
// - Asks once per suspect + clue, however many times that confront is replayed.
// - Never throws and never waits on anything but the request itself.

export type Unlocker = {
  attempt: (suspectId: string, clueId: string) => Promise<UnlockedClue | null>;
};

export function createUnlocker({
  enabled,
  request,
  heldUnlockedIds,
  onUnlocked,
}: {
  enabled: boolean;
  request: (suspectId: string, clueId: string, heldUnlockedIds: string[]) => Promise<UnlockedClue | null>;
  heldUnlockedIds: () => string[];
  onUnlocked: (clue: UnlockedClue) => void;
}): Unlocker {
  const asked = new Set<string>();
  return {
    async attempt(suspectId, clueId) {
      if (!enabled) return null;
      const key = `${suspectId}:${clueId}`;
      if (asked.has(key)) return null;
      asked.add(key);
      let clue: UnlockedClue | null = null;
      try {
        clue = await request(suspectId, clueId, heldUnlockedIds());
      } catch {
        return null;
      }
      // Already held after all (e.g. unlocked by another route): nothing new to show.
      if (!clue || heldUnlockedIds().includes(clue.id)) return null;
      onUnlocked(clue);
      return clue;
    },
  };
}

// ---- Combine: connecting two clues in the Casebook ----

export type CombineOutcome =
  | { status: "unlocked"; clue: UnlockedClue }
  // They do connect, but the player already holds what they reveal.
  | { status: "already-unlocked" }
  | { status: "no-match" }
  // This pair already failed this session: not sent again.
  | { status: "already-tried" }
  // Couldn't check (error, rate limit, timeout, offline): the player may try again.
  | { status: "error" }
  // The switch is off, or the two clues are the same: nothing is sent.
  | { status: "off" };

// The same pair in either order gives the same key.
export const pairKey = (a: string, b: string) => (a < b ? `${a}+${b}` : `${b}+${a}`);

export type Combiner = {
  connect: (a: string, b: string) => Promise<CombineOutcome>;
  hasTried: (a: string, b: string) => boolean;
};

export function createCombiner({
  enabled,
  request,
  heldUnlockedIds,
  onUnlocked,
}: {
  enabled: boolean;
  request: (
    clueIds: readonly [string, string],
    heldUnlockedIds: string[],
  ) => Promise<
    | { status: "unlocked"; clue: UnlockedClue }
    | { status: "already-unlocked" }
    | { status: "no-match" }
    | { status: "error" }
  >;
  heldUnlockedIds: () => string[];
  onUnlocked: (clue: UnlockedClue, from: readonly [string, string]) => void;
}): Combiner {
  // Pairs that didn't connect, for this session only.
  const failed = new Set<string>();
  const pending = new Set<string>();
  return {
    hasTried: (a, b) => failed.has(pairKey(a, b)),
    async connect(a, b) {
      if (!enabled || a === b) return { status: "off" };
      const key = pairKey(a, b);
      if (failed.has(key)) return { status: "already-tried" };
      if (pending.has(key)) return { status: "off" };
      pending.add(key);
      try {
        const answer = await request([a, b], heldUnlockedIds());
        if (answer.status === "unlocked") {
          if (heldUnlockedIds().includes(answer.clue.id)) return { status: "already-unlocked" };
          onUnlocked(answer.clue, [a, b]);
          return answer;
        }
        if (answer.status === "no-match") failed.add(key);
        return answer;
      } catch {
        return { status: "error" };
      } finally {
        pending.delete(key);
      }
    },
  };
}

// ---- Locked slots ----

export type UnlockKind = "confront" | "combine";
export type UnlockRecord = Record<string, { kind: UnlockKind; from?: readonly [string, string] }>;

// The hidden clues still to find, by how each is revealed. Starts from the case's public
// summary and takes away one slot for every clue unlocked: of its own kind when known,
// otherwise the last slot left. The count is always right, whatever is known.
export function remainingSlots(
  summary: readonly UnlockKind[],
  unlockedIds: readonly string[],
  record: UnlockRecord,
): UnlockKind[] {
  const left = [...summary];
  let unknown = 0;
  for (const id of new Set(unlockedIds)) {
    const i = record[id] ? left.indexOf(record[id].kind) : -1;
    if (i >= 0) left.splice(i, 1);
    else unknown++;
  }
  return left.slice(0, Math.max(0, left.length - unknown));
}
