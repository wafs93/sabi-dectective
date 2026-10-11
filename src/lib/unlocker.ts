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
