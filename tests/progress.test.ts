import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearProgress,
  emptyProgress,
  readProgress,
  readResult,
  writeProgress,
  writeResult,
} from "@/lib/game";
import { readRecord, recordVerdict, writeRecord } from "@/lib/record";
import type { Progress, SavedResult } from "@/lib/types";

// A Map-backed stand-in for the browser's localStorage.
let store: Map<string, string>;
beforeEach(() => {
  store = new Map();
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
  };
});
afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

const progress = (...clueIds: string[]): Progress => ({ foundClueIds: clueIds, contradictions: [] });
const saved: SavedResult = {
  accusation: { suspectId: "s", citedClueIds: ["c"] },
  result: { outcome: "close", title: "Close Call", explanation: "e", feedback: [] },
};

describe("progress for more than one case", () => {
  it("reads Case 1 progress saved before cases were numbered in the app", () => {
    // The exact key and format earlier versions wrote.
    store.set(
      "sabi-detective:case-1:progress",
      JSON.stringify({ foundClueIds: ["clue-a"], contradictions: [] }),
    );
    expect(readProgress(1)).toEqual(progress("clue-a"));
    expect(readProgress(2)).toEqual(emptyProgress);
  });

  it("keeps each case's progress and result apart", () => {
    writeProgress(1, progress("a"));
    writeProgress(2, progress("b", "c"));
    writeResult(2, saved);
    expect(readProgress(1)).toEqual(progress("a"));
    expect(readProgress(2)).toEqual(progress("b", "c"));
    expect(readResult(1)).toBeNull();
    expect(readResult(2)).toEqual(saved);
    expect([...store.keys()].sort()).toEqual([
      "sabi-detective:case-1:progress",
      "sabi-detective:case-2:progress",
      "sabi-detective:case-2:result",
    ]);
  });

  it("Play again on one case leaves the other untouched", () => {
    writeProgress(1, progress("a"));
    writeResult(1, saved);
    writeProgress(2, progress("b"));
    clearProgress(1);
    expect(readProgress(1)).toEqual(emptyProgress);
    expect(readResult(1)).toBeNull();
    expect(readProgress(2)).toEqual(progress("b"));
  });

  it("keeps one record keyed by case number, with Case 1's entry intact", () => {
    store.set(
      "sabi-detective:record",
      JSON.stringify({ version: 1, cases: { "1": { best: "cracked", last: "missed", plays: 2 } } }),
    );
    writeRecord(recordVerdict(readRecord(), 2, "close"));
    expect(JSON.parse(store.get("sabi-detective:record")!)).toEqual({
      version: 1,
      cases: {
        "1": { best: "cracked", last: "missed", plays: 2 },
        "2": { best: "close", last: "close", plays: 1 },
      },
    });
  });
});
