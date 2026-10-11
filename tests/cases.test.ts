import { describe, expect, it } from "vitest";
import { caseArt } from "@/data/art";
import { case1Art } from "@/data/case1-art";
import { case2Art } from "@/data/case2-art";
import { case1Fallback } from "@/data/case1-fallback";
import { case2Fallback } from "@/data/case2-fallback";
import { CASE_NUMBERS, caseFallback, listCases } from "@/data/cases";
import { emptyRecord, recordVerdict, todaysCase } from "@/lib/record";
import type { CaseBundle } from "@/lib/types";

const case2: CaseBundle = {
  caseData: { ...case1Fallback.caseData, id: "case-2", case_number: 2, title: "Case Two" },
  suspects: [],
  clues: [],
};

describe("case lookup by number", () => {
  it("finds Case 1's offline copy and art unchanged", () => {
    expect(caseFallback(1)).toBe(case1Fallback);
    expect(caseFallback(1)?.caseData.title).toBe("The Empty Stall");
    expect(caseArt(1)).toBe(case1Art);
  });

  it("returns null for cases that aren't in the code", () => {
    for (const n of [0, 3, 99, Number.NaN]) {
      expect(caseFallback(n)).toBeNull();
      expect(caseArt(n)).toBeNull();
    }
  });

  it("lists Cases 1 to 3 in order, with Cases 1 and 2 playable and Case 3 locked", () => {
    expect(CASE_NUMBERS).toEqual([1, 2, 3]);
    expect(listCases()).toEqual([
      { caseNumber: 1, title: "The Empty Stall", playable: true },
      { caseNumber: 2, title: "The Second Buyer", playable: true },
      { caseNumber: 3, title: null, playable: false },
    ]);
  });

  it("finds Case 2's offline copy and art", () => {
    expect(caseFallback(2)).toBe(case2Fallback);
    expect(caseArt(2)).toBe(case2Art);
  });

  it("makes Case 2 playable once its data is in the code; Case 3 stays locked", () => {
    expect(listCases([1, 2, 3], { 1: case1Fallback, 2: case2 })).toEqual([
      { caseNumber: 1, title: "The Empty Stall", playable: true },
      { caseNumber: 2, title: "Case Two", playable: true },
      { caseNumber: 3, title: null, playable: false },
    ]);
  });
});

describe("todaysCase", () => {
  it("is the first playable case without a verdict", () => {
    expect(todaysCase([1, 2], emptyRecord)).toBe(1);
    expect(todaysCase([1, 2], recordVerdict(emptyRecord, 1, "missed"))).toBe(2);
    expect(todaysCase([1, 2], recordVerdict(emptyRecord, 2, "cracked"))).toBe(1);
  });

  it("stays on the newest playable case once all have a verdict", () => {
    expect(todaysCase([1], recordVerdict(emptyRecord, 1, "cracked"))).toBe(1);
    const both = recordVerdict(recordVerdict(emptyRecord, 1, "close"), 2, "missed");
    expect(todaysCase([1, 2], both)).toBe(2);
  });

  it("ignores verdicts for cases that aren't playable", () => {
    expect(todaysCase([1], recordVerdict(emptyRecord, 3, "cracked"))).toBe(1);
    expect(todaysCase([], emptyRecord)).toBeNull();
  });
});
