import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CASE1_CLUES, CASE1_ID, CASE1_SUSPECTS } from "@/data/case1-ids";
import { case2Fallback } from "@/data/case2-fallback";
import { CASE2_CLUES, CASE2_ID, CASE2_SUSPECTS } from "@/data/case2-ids";
import { interrogations } from "@/data/interrogations";
import { evaluateAccusation, type CaseSolution } from "@/engine/scoring";

const sqlFile = (name: string) => readFileSync(join(process.cwd(), "supabase", name), "utf8");
const publicSql = sqlFile("migrations/005_case2.sql");
const solutionSql = sqlFile("migrations/006_case2_solution.sql");
const seedSql = sqlFile("seed.sql");
const quoted = (s: string) => `'${s.replaceAll("'", "''")}'`;
const unquote = (v: string) => v.replace(/,$/, "").replace(/^'|'$/g, "").replaceAll("''", "'");
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/;

// The ten values of 006's insert, one per line: ids, the two id arrays, then title/text pairs.
const solutionValues = solutionSql
  .slice(solutionSql.indexOf("values (") + "values (".length, solutionSql.indexOf("\n)\non conflict"))
  .trim()
  .split("\n")
  .map((line) => line.trim());
const idsIn = (s: string) => s.match(/[0-9a-f]{8}-[0-9a-f-]{27}/g) ?? [];
const solution: CaseSolution = {
  solutionSuspectId: unquote(solutionValues[1]),
  keyClueIds: idsIn(solutionValues[2]),
  redHerringClueIds: idsIn(solutionValues[3]),
  texts: {
    cracked: { title: unquote(solutionValues[4]), text: unquote(solutionValues[5]) },
    close: { title: unquote(solutionValues[6]), text: unquote(solutionValues[7]) },
    missed: { title: unquote(solutionValues[8]), text: unquote(solutionValues[9]) },
  },
};
const resultTexts = Object.values(solution.texts).map((t) => t.text);

const case2Ids = [CASE2_ID, ...Object.values(CASE2_SUSPECTS), ...Object.values(CASE2_CLUES)];
const case1Ids = [CASE1_ID, ...Object.values(CASE1_SUSPECTS), ...Object.values(CASE1_CLUES)];

describe("Case 2 ids", () => {
  it("use the same UUID format as Case 1 and never collide with it", () => {
    for (const id of [...case2Ids, ...case1Ids]) expect(id).toMatch(UUID);
    expect(new Set([...case1Ids, ...case2Ids]).size).toBe(case1Ids.length + case2Ids.length);
  });

  it("has 4 suspects and 5 clues", () => {
    expect(case2Fallback.suspects).toHaveLength(4);
    expect(case2Fallback.clues).toHaveLength(5);
  });
});

describe("Case 2 offline copy", () => {
  it("is Case 2, The Second Buyer, with the canonical briefing", () => {
    expect(case2Fallback.caseData).toMatchObject({
      id: CASE2_ID,
      case_number: 2,
      title: "The Second Buyer",
      briefing_text:
        "Mama Nkechi's family land at Ajah is due to be sold to a developer tomorrow morning. Tonight the original Certificate of Occupancy vanished from the family safe. Find out who took it, and why.",
    });
  });

  it("matches migration 005 and seed.sql word for word", () => {
    const { caseData, suspects, clues } = case2Fallback;
    const strings = [
      caseData.id,
      caseData.title,
      caseData.briefing_text,
      ...suspects.flatMap((s) => [s.id, s.name, s.connection ?? "", s.motive ?? ""]),
      ...clues.flatMap((c) => [c.id, c.name, c.found_description ?? ""]),
    ];
    for (const s of strings) {
      expect(publicSql).toContain(quoted(s));
      expect(seedSql).toContain(quoted(s));
    }
    for (const row of [...suspects, ...clues]) expect(row.case_id).toBe(CASE2_ID);
  });

  it("holds no answer data", () => {
    const shipped = JSON.stringify([case2Fallback, interrogations]);
    for (const field of ["solution", "key_clue", "red_herring", "keyClue", "redHerring"]) {
      expect(shipped).not.toContain(field);
    }
    // No run of 8 words from any result text appears in the shipped story or dialogue.
    for (const text of resultTexts) {
      for (const part of text.split("{accused}")) {
        const words = part.trim().split(/\s+/).filter(Boolean);
        for (let i = 0; i + 8 <= words.length; i++) {
          expect(shipped).not.toContain(words.slice(i, i + 8).join(" "));
        }
      }
    }
  });
});

describe("Case 2 interrogations", () => {
  it("covers all four suspects with 2 or 3 questions each", () => {
    for (const id of Object.values(CASE2_SUSPECTS)) {
      const script = interrogations[id];
      expect(script?.openingLine).toBeTruthy();
      expect(script.questions.length).toBeGreaterThanOrEqual(2);
      expect(script.questions.length).toBeLessThanOrEqual(3);
    }
  });

  it("only unlocks with Case 2 clues, and every confront has text and a reply", () => {
    const case2Clues: string[] = Object.values(CASE2_CLUES);
    const used = new Set<string>();
    for (const id of Object.values(CASE2_SUSPECTS)) {
      for (const q of interrogations[id].questions) {
        if (!q.unlockedByClueId) continue;
        expect(case2Clues).toContain(q.unlockedByClueId);
        expect(q.confrontText).toBeTruthy();
        expect(q.confrontedAnswer).toBeTruthy();
        used.add(q.unlockedByClueId);
      }
    }
    // Every clue appears, so no file can single one out (see scripts/check-bundle.mjs).
    expect([...used].sort()).toEqual([...case2Clues].sort());
  });

  it("uses question ids that don't clash with any other case", () => {
    const ids = Object.values(interrogations).flatMap((s) => s.questions.map((q) => q.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("names Kunle only in his own confront lines, never in an opening or default answer", () => {
    for (const script of Object.values(interrogations)) {
      expect(script.openingLine).not.toMatch(/Kunle|Balogun|A\.\s?O\.\s?B/);
      for (const q of script.questions) expect(q.defaultAnswer).not.toMatch(/Kunle|Balogun|A\.\s?O\.\s?B/);
    }
  });
});

describe("Case 2 answer (migration 006, read on the server only)", () => {
  const score = (suspectId: string, clueIds: string[], name: string) =>
    evaluateAccusation(solution, { suspectId, clueIds }, name);

  it("names Barrister Kunle, with the toll receipt and second agreement as key clues", () => {
    expect(solution.solutionSuspectId).toBe(CASE2_SUSPECTS.kunle);
    expect(solution.keyClueIds.sort()).toEqual(
      [CASE2_CLUES.tollReceipt, CASE2_CLUES.secondAgreement].sort(),
    );
    expect(solution.redHerringClueIds.sort()).toEqual(
      [CASE2_CLUES.debtLetter, CASE2_CLUES.tornNote].sort(),
    );
  });

  it("scores the same three tiers as Case 1", () => {
    const k = CASE2_SUSPECTS.kunle;
    const both = [CASE2_CLUES.tollReceipt, CASE2_CLUES.secondAgreement];
    expect(score(k, both, "Barrister Kunle")).toMatchObject({ outcome: "cracked", title: "Case Cracked" });
    expect(score(k, [...both, CASE2_CLUES.keyLog], "Barrister Kunle").outcome).toBe("cracked");
    expect(score(k, [CASE2_CLUES.tollReceipt], "Barrister Kunle")).toMatchObject({
      outcome: "close",
      title: "Close Call",
    });
    expect(score(k, [CASE2_CLUES.keyLog], "Barrister Kunle").outcome).toBe("close");
    const missed = score(CASE2_SUSPECTS.ada, both, "Ada");
    expect(missed).toMatchObject({ outcome: "missed", title: "Missed It" });
    expect(missed.explanation.startsWith("Ada didn't take the deed")).toBe(true);
    expect(missed.explanation).not.toContain("{accused}");
  });

  it("only writes Case 2's row, and seed.sql holds the same answer", () => {
    expect(solutionValues[0]).toBe(`${quoted(CASE2_ID)},`);
    expect(solutionSql).not.toContain(CASE1_ID);
    expect(publicSql).not.toContain(CASE1_ID);
    for (const v of solutionValues) expect(seedSql).toContain(v.replace(/,$/, ""));
  });
});
