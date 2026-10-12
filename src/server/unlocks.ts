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

// ---- Guessing guard ----
// Counts WRONG unlock attempts (a confront or combine that reveals nothing) per client.
// 25 wrong within 10 minutes starts a cooldown: 1 minute, then 2, 4, 8, capped at 15, doubling
// each time it is hit again. A correct unlock is never counted and never lowers the penalty.
// The penalty level is forgotten after a quiet hour (no cooldown hit). Kept in memory, per server
// instance, like the rate limiter: it resets on a cold start and is not shared between instances.

export const GUESS_LIMIT = 25;
export const GUESS_WINDOW_MS = 10 * 60_000;
export const COOLDOWN_BASE_MS = 60_000;
export const COOLDOWN_MAX_MS = 15 * 60_000;
export const PENALTY_MEMORY_MS = 60 * 60_000;

export type GuessGuard = {
  // Before checking an attempt: is this client in a cooldown?
  check: (key: string) => { allowed: true } | { allowed: false; retryAfterSeconds: number };
  // After an attempt that revealed nothing.
  recordWrong: (key: string) => void;
};

type GuessState = { wrong: number[]; level: number; blockedUntil: number; lastBlockAt: number };

export function createGuessGuard({
  limit = GUESS_LIMIT,
  windowMs = GUESS_WINDOW_MS,
  baseMs = COOLDOWN_BASE_MS,
  maxMs = COOLDOWN_MAX_MS,
  memoryMs = PENALTY_MEMORY_MS,
  now = Date.now,
  maxKeys = 10_000,
}: {
  limit?: number;
  windowMs?: number;
  baseMs?: number;
  maxMs?: number;
  memoryMs?: number;
  now?: () => number;
  maxKeys?: number;
} = {}): GuessGuard {
  const clients = new Map<string, GuessState>();

  const forgotten = (s: GuessState, t: number) =>
    s.blockedUntil <= t && s.wrong.every((w) => w <= t - windowMs) && s.lastBlockAt <= t - memoryMs;

  const state = (key: string, t: number): GuessState => {
    if (clients.size >= maxKeys) {
      for (const [k, s] of clients) if (forgotten(s, t)) clients.delete(k);
      if (clients.size >= maxKeys) clients.clear();
    }
    let s = clients.get(key);
    if (!s) {
      s = { wrong: [], level: 0, blockedUntil: 0, lastBlockAt: 0 };
      clients.set(key, s);
    }
    if (s.level > 0 && s.blockedUntil <= t && s.lastBlockAt <= t - memoryMs) s.level = 0;
    return s;
  };

  return {
    check(key) {
      const t = now();
      const s = state(key, t);
      if (s.blockedUntil > t) return { allowed: false, retryAfterSeconds: Math.ceil((s.blockedUntil - t) / 1000) };
      return { allowed: true };
    },
    recordWrong(key) {
      const t = now();
      const s = state(key, t);
      s.wrong = s.wrong.filter((w) => w > t - windowMs);
      s.wrong.push(t);
      if (s.wrong.length >= limit) {
        s.level++;
        s.blockedUntil = t + Math.min(baseMs * 2 ** (s.level - 1), maxMs);
        s.lastBlockAt = t;
        // A fresh count once the cooldown is over.
        s.wrong = [];
      }
    },
  };
}
