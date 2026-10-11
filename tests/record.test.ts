import { describe, expect, it } from "vitest";
import {
  bestResult,
  caseStatus,
  casesSolved,
  emptyRecord,
  parseRecord,
  rankFor,
  recordVerdict,
  type PlayerRecord,
} from "@/lib/record";
import type { Progress, ResultTier, SavedResult } from "@/lib/types";

const noProgress: Progress = { foundClueIds: [], contradictions: [] };
const saved = (outcome: ResultTier): SavedResult => ({
  accusation: { suspectId: "s", citedClueIds: [] },
  result: { outcome, title: "t", explanation: "e", feedback: [] },
});
const withCases = (n: number, tier: ResultTier = "cracked"): PlayerRecord => {
  let r = emptyRecord;
  for (let i = 1; i <= n; i++) r = recordVerdict(r, i, tier);
  return r;
};

describe("rankFor", () => {
  it.each([
    [0, "Rookie"],
    [1, "Junior Detective"],
    [2, "Junior Detective"],
    [3, "Detective"],
    [5, "Detective"],
    [6, "Senior Detective"],
    [9, "Senior Detective"],
    [10, "Chief"],
    [250, "Chief"],
  ])("%i solved -> %s", (n, rank) => {
    expect(rankFor(n)).toBe(rank);
  });

  it("treats bad numbers as zero", () => {
    expect(rankFor(-3)).toBe("Rookie");
    expect(rankFor(Number.NaN)).toBe("Rookie");
  });
});

describe("casesSolved and bestResult", () => {
  it("counts Cracked and Close Call as solved, not Missed", () => {
    let r = recordVerdict(emptyRecord, 1, "cracked");
    r = recordVerdict(r, 2, "close");
    r = recordVerdict(r, 3, "missed");
    expect(casesSolved(r)).toBe(2);
  });

  it("drives the rank from the record", () => {
    expect(rankFor(casesSolved(withCases(3)))).toBe("Detective");
    expect(rankFor(casesSolved(withCases(4, "missed")))).toBe("Rookie");
  });

  it("replaying a case never counts it twice", () => {
    let r = recordVerdict(emptyRecord, 1, "close");
    r = recordVerdict(r, 1, "cracked");
    r = recordVerdict(r, 1, "missed");
    expect(casesSolved(r)).toBe(1);
    expect(r.cases["1"]).toEqual({ best: "cracked", last: "missed", plays: 3 });
  });

  it("best result is the strongest verdict, or null", () => {
    expect(bestResult(emptyRecord)).toBeNull();
    expect(bestResult(withCases(1, "missed"))).toBe("missed");
    expect(bestResult(recordVerdict(withCases(1, "missed"), 2, "close"))).toBe("close");
  });

  it("recordVerdict does not change the record it was given", () => {
    const before = withCases(1, "close");
    const copy = JSON.parse(JSON.stringify(before));
    recordVerdict(before, 1, "cracked");
    expect(before).toEqual(copy);
  });
});

describe("caseStatus", () => {
  const base = { caseNumber: 1, savedResult: null, progress: noProgress, record: emptyRecord };

  it("is New with nothing saved", () => {
    expect(caseStatus(base)).toBe("new");
  });

  it("is In progress once a clue or contradiction is saved", () => {
    expect(caseStatus({ ...base, progress: { ...noProgress, foundClueIds: ["c"] } })).toBe(
      "in-progress",
    );
    const contradiction = {
      suspectId: "s",
      questionId: "q",
      suspectName: "n",
      question: "q",
      clueName: "c",
      confrontText: "t",
      answer: "a",
    };
    expect(caseStatus({ ...base, progress: { ...noProgress, contradictions: [contradiction] } })).toBe(
      "in-progress",
    );
  });

  it.each(["cracked", "close", "missed"] as const)("shows the finished verdict: %s", (tier) => {
    expect(caseStatus({ ...base, savedResult: saved(tier) })).toBe(tier);
  });

  it("a finished game wins over leftover progress", () => {
    expect(
      caseStatus({ ...base, savedResult: saved("close"), progress: { ...noProgress, foundClueIds: ["c"] } }),
    ).toBe("close");
  });

  it("after Play again, shows the last verdict until a new game starts", () => {
    const record = recordVerdict(emptyRecord, 1, "missed");
    expect(caseStatus({ ...base, record })).toBe("missed");
    expect(caseStatus({ ...base, record, progress: { ...noProgress, foundClueIds: ["c"] } })).toBe(
      "in-progress",
    );
  });

  it("ignores other cases in the record", () => {
    expect(caseStatus({ ...base, record: recordVerdict(emptyRecord, 2, "cracked") })).toBe("new");
  });
});

describe("parseRecord (untrusted localStorage)", () => {
  it.each([null, undefined, 42, "x", [], {}, { cases: null }, { cases: "x" }])(
    "returns an empty record for %j",
    (raw) => {
      expect(parseRecord(raw)).toEqual(emptyRecord);
    },
  );

  it("keeps valid entries and drops bad ones", () => {
    const r = parseRecord({
      version: 1,
      cases: {
        "1": { best: "cracked", last: "close", plays: 2 },
        "2": { best: "winner", last: "close", plays: 1 },
        abc: { best: "cracked", last: "cracked", plays: 1 },
        "3": { best: "missed", last: "missed", plays: -5 },
        "4": "nope",
      },
    });
    expect(r).toEqual({
      version: 1,
      cases: {
        "1": { best: "cracked", last: "close", plays: 2 },
        "3": { best: "missed", last: "missed", plays: 1 },
      },
    });
  });
});
