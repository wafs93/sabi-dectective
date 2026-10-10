import { describe, expect, it } from "vitest";
import { evaluateAccusation } from "@/engine/scoring";
import { BISI, CHUKS, FOOTPRINT, GATE_LOG, LEDGER, SECRETS, solution } from "./fixtures";

const score = (suspectId: string, clueIds: string[], name = "Chuks") =>
  evaluateAccusation(solution, { suspectId, clueIds }, name);

describe("evaluateAccusation", () => {
  it("cracked: right suspect with every key clue", () => {
    const r = score(CHUKS, [LEDGER, FOOTPRINT]);
    expect(r.outcome).toBe("cracked");
    expect(r.title).toBe("Case Cracked");
    expect(r.explanation).toBe("Cracked text.");
  });

  it("cracked: extra non-key clues don't hurt", () => {
    expect(score(CHUKS, [GATE_LOG, FOOTPRINT, LEDGER]).outcome).toBe("cracked");
  });

  it("close: right suspect with only one key clue", () => {
    const r = score(CHUKS, [LEDGER]);
    expect(r.outcome).toBe("close");
    expect(r.feedback.join(" ")).toContain("1 of 2");
  });

  it("close: right suspect with only a non-key clue", () => {
    expect(score(CHUKS, [GATE_LOG]).outcome).toBe("close");
  });

  it("close: right suspect with no clues", () => {
    const r = score(CHUKS, []);
    expect(r.outcome).toBe("close");
    expect(r.feedback.join(" ")).toContain("none of the evidence");
  });

  it("missed: wrong suspect even with every key clue", () => {
    expect(score(BISI, [LEDGER, FOOTPRINT], "Alhaja Bisi").outcome).toBe("missed");
  });

  it("missed: wrong suspect with no clues", () => {
    expect(score(BISI, [], "Alhaja Bisi").outcome).toBe("missed");
  });

  it("missed text names whoever was accused", () => {
    const r = score("99999999-9999-4999-8999-999999999999", [], "Some Stranger");
    expect(r.outcome).toBe("missed");
    expect(r.explanation).toBe("Some Stranger didn't do it.");
    expect(r.explanation).not.toContain("{accused}");
  });

  it("duplicate clue ids are not counted twice", () => {
    const r = score(CHUKS, [LEDGER, LEDGER]);
    expect(r.outcome).toBe("close");
    expect(r.feedback.join(" ")).toContain("1 of 2");
  });

  it("a case with no key clues can never be cracked", () => {
    const r = evaluateAccusation(
      { ...solution, keyClueIds: [] },
      { suspectId: CHUKS, clueIds: [LEDGER] },
      "Chuks",
    );
    expect(r.outcome).toBe("close");
  });

  it("is deterministic", () => {
    expect(score(CHUKS, [LEDGER])).toEqual(score(CHUKS, [LEDGER]));
  });

  it("never returns the solution or key clue ids", () => {
    for (const r of [score(CHUKS, [LEDGER, FOOTPRINT]), score(CHUKS, [LEDGER]), score(BISI, [])]) {
      const body = JSON.stringify(r);
      for (const secret of SECRETS) expect(body).not.toContain(secret);
      expect(Object.keys(r).sort()).toEqual(["explanation", "feedback", "outcome", "title"]);
    }
  });
});
