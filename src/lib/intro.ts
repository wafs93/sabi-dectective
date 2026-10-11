// The opening sequence: COLD OPEN -> TITLE -> (Home for now; the case file comes later).
// It plays once, for first-time players only. Its "seen" flag has its own key and
// never touches saved progress, the saved result or the home screen record.

export type IntroStep = "cold-open" | "title";

export const COLD_OPEN_LINES = [
  "6:12 AM — LAGOS",
  "The market should have been opening.",
  "But one stall remained locked.",
  "And someone had left in a hurry.",
] as const;

// How long each line stays on screen (fade in, hold, fade out).
export const LINE_MS = 2800;

export type ColdOpenState = { line: number; done: boolean };

// Advance one line; after the last line the cold open is done.
export function nextColdOpenLine(state: ColdOpenState, total: number): ColdOpenState {
  if (state.done) return state;
  const line = state.line + 1;
  return line >= total ? { line: total - 1, done: true } : { line, done: false };
}

// A returning player is anyone who has seen the intro or has anything saved.
export function shouldShowIntro({
  introSeen,
  hasProgress,
  hasSavedResult,
  hasRecord,
}: {
  introSeen: boolean;
  hasProgress: boolean;
  hasSavedResult: boolean;
  hasRecord: boolean;
}): boolean {
  return !introSeen && !hasProgress && !hasSavedResult && !hasRecord;
}

// ---- localStorage ----

export const INTRO_SEEN_KEY = "sabi-detective:intro-seen";

export function readIntroSeen(): boolean {
  try {
    return window.localStorage.getItem(INTRO_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeIntroSeen(): void {
  try {
    window.localStorage.setItem(INTRO_SEEN_KEY, "1");
  } catch {
    // Storage unavailable: the intro may show again next visit, which is harmless.
  }
}
