import { afterEach, describe, expect, it, vi } from "vitest";
import {
  COLD_OPEN_LINES,
  INTRO_SEEN_KEY,
  nextColdOpenLine,
  readIntroSeen,
  shouldShowIntro,
  writeIntroSeen,
} from "@/lib/intro";

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    setItem: (k: string, v: string) => void data.set(k, String(v)),
    removeItem: (k: string) => void data.delete(k),
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("shouldShowIntro (first-time vs returning players)", () => {
  const flags = ["introSeen", "hasProgress", "hasSavedResult", "hasRecord"] as const;
  // Every combination of the four flags.
  const combos = Array.from({ length: 16 }, (_, n) =>
    Object.fromEntries(flags.map((f, i) => [f, Boolean(n & (1 << i))])) as Record<
      (typeof flags)[number],
      boolean
    >,
  );

  it("shows the intro only when nothing at all is saved", () => {
    for (const c of combos) {
      const expected = !c.introSeen && !c.hasProgress && !c.hasSavedResult && !c.hasRecord;
      expect(shouldShowIntro(c)).toBe(expected);
    }
  });

  it.each(flags)("a player with only %s set goes straight home", (flag) => {
    const c = { introSeen: false, hasProgress: false, hasSavedResult: false, hasRecord: false };
    expect(shouldShowIntro({ ...c, [flag]: true })).toBe(false);
  });
});

describe("cold open lines", () => {
  it("has the four lines in order", () => {
    expect(COLD_OPEN_LINES).toEqual([
      "6:12 AM — LAGOS",
      "The market should have been opening.",
      "But one stall remained locked.",
      "And someone had left in a hurry.",
    ]);
  });

  it("steps one line at a time, then finishes", () => {
    const total = COLD_OPEN_LINES.length;
    let s = { line: 0, done: false };
    const seen = [s.line];
    while (!s.done) {
      s = nextColdOpenLine(s, total);
      if (!s.done) seen.push(s.line);
    }
    expect(seen).toEqual([0, 1, 2, 3]);
    expect(s).toEqual({ line: 3, done: true });
  });

  it("stays finished once done", () => {
    const done = { line: 3, done: true };
    expect(nextColdOpenLine(done, 4)).toBe(done);
  });
});

describe("intro seen flag (skip and finish)", () => {
  it("is not seen on a fresh browser, and is seen after skipping", () => {
    const storage = fakeStorage();
    vi.stubGlobal("window", { localStorage: storage });
    expect(readIntroSeen()).toBe(false);
    writeIntroSeen();
    expect(readIntroSeen()).toBe(true);
    expect(storage.data.get(INTRO_SEEN_KEY)).toBe("1");
  });

  it("writing the flag never changes saved progress, result or the home record", () => {
    const saved = {
      "sabi-detective:case-1:progress": '{"foundClueIds":["c"],"contradictions":[]}',
      "sabi-detective:case-1:result": '{"result":{"outcome":"close"}}',
      "sabi-detective:record": '{"version":1,"cases":{"1":{"best":"close","last":"close","plays":1}}}',
    };
    const storage = fakeStorage(saved);
    vi.stubGlobal("window", { localStorage: storage });
    writeIntroSeen();
    for (const [k, v] of Object.entries(saved)) expect(storage.data.get(k)).toBe(v);
    expect([...storage.data.keys()].sort()).toEqual([...Object.keys(saved), INTRO_SEEN_KEY].sort());
  });

  it("only the exact value counts as seen", () => {
    vi.stubGlobal("window", { localStorage: fakeStorage({ [INTRO_SEEN_KEY]: "yes" }) });
    expect(readIntroSeen()).toBe(false);
  });

  it("broken storage means not seen, and writing does not throw", () => {
    const boom = () => {
      throw new Error("blocked");
    };
    vi.stubGlobal("window", { localStorage: { getItem: boom, setItem: boom } });
    expect(readIntroSeen()).toBe(false);
    expect(() => writeIntroSeen()).not.toThrow();
  });
});
