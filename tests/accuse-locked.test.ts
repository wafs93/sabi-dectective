import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CASE2_CLUES, CASE2_ID, CASE2_SUSPECTS } from "@/data/case2-ids";
import { evaluateAccusation, type CaseSolution } from "@/engine/scoring";
import { createAccuseHandler, type ScoringData } from "@/server/accuse";
import { createRateLimiter } from "@/server/rate-limit";
import { CASE_ID as CASE1_ID, scoringData as case1Data } from "./fixtures";
import { CASE99_LOCKED } from "./fixtures/case99";

// Case 2's real answer, read from migration 006 (one value per line).
const sql = readFileSync(join(process.cwd(), "supabase/migrations/006_case2_solution.sql"), "utf8");
const v = sql
  .slice(sql.indexOf("values (") + "values (".length, sql.indexOf("\n)\non conflict"))
  .trim()
  .split("\n")
  .map((l) => l.trim().replace(/,$/, ""));
const str = (s: string) => s.replace(/^'|'$/g, "").replaceAll("''", "'");
const ids = (s: string) => s.match(/[0-9a-f]{8}-[0-9a-f-]{27}/g) ?? [];
const case2Solution: CaseSolution = {
  solutionSuspectId: str(v[1]),
  keyClueIds: ids(v[2]),
  redHerringClueIds: ids(v[3]),
  texts: {
    cracked: { title: str(v[4]), text: str(v[5]) },
    close: { title: str(v[6]), text: str(v[7]) },
    missed: { title: str(v[8]), text: str(v[9]) },
  },
};
const case2Names: Record<string, string> = {
  [CASE2_SUSPECTS.dele]: "Uncle Dele",
  [CASE2_SUSPECTS.kunle]: "Barrister Kunle",
  [CASE2_SUSPECTS.ada]: "Ada",
  [CASE2_SUSPECTS.musa]: "Alhaji Musa",
};
const case2Data: ScoringData = {
  solution: case2Solution,
  suspects: Object.entries(case2Names).map(([id, name]) => ({ id, name })),
  clueIds: Object.values(CASE2_CLUES),
};

// Made-up locked clue ids: one for Case 1, one for Case 2 (never in any real data).
const C1_LOCKED = "33333333-3333-4333-8333-0000000001a1";
const C2_LOCKED = "33333333-3333-4333-8333-0000000002a1";

const handlerFor = (byCase: Record<string, ScoringData>) =>
  createAccuseHandler({
    loadScoringData: async (id) => byCase[id] ?? null,
    limiter: createRateLimiter({ limit: 100_000, windowMs: 60_000 }),
  });
const before = handlerFor({ [CASE1_ID]: case1Data, [CASE2_ID]: case2Data });
const withLocked = handlerFor({
  [CASE1_ID]: { ...case1Data, lockedClueIds: [C1_LOCKED] },
  [CASE2_ID]: { ...case2Data, lockedClueIds: [C2_LOCKED] },
});

const post = (body: unknown) =>
  new Request("http://localhost/api/accuse", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "1.2.3.4" },
    body: JSON.stringify(body),
  });
const accuse = async (h: typeof before, body: unknown) => {
  const res = await h(post(body));
  return { status: res.status, body: await res.json() };
};
const subsets = <T,>(xs: T[]): T[][] =>
  xs.reduce<T[][]>((acc, x) => [...acc, ...acc.map((s) => [...s, x])], [[]]);

describe("accusations with locked clues known to the server", () => {
  it.each([
    ["Case 1", CASE1_ID, case1Data],
    ["Case 2", CASE2_ID, case2Data],
  ])("%s: every possible accusation gives exactly the same result as before", async (_n, caseId, data) => {
    let count = 0;
    for (const suspect of data.suspects) {
      for (const clueIds of subsets(data.clueIds)) {
        const body = { caseId, suspectId: suspect.id, clueIds };
        const a = await accuse(before, body);
        const b = await accuse(withLocked, body);
        expect(b).toEqual(a);
        // And the same as the scoring engine, which is unchanged.
        expect(a.body).toEqual(evaluateAccusation(data.solution, { suspectId: suspect.id, clueIds }, suspect.name));
        count++;
      }
    }
    expect(count).toBe(data.suspects.length * 2 ** data.clueIds.length);
  });

  it.each([
    ["Case 1", CASE1_ID, "22222222-2222-4222-8222-000000000001", ["33333333-3333-4333-8333-000000000001", "33333333-3333-4333-8333-000000000003"], "22222222-2222-4222-8222-000000000002", "Case Cracked", "Alhaja Bisi didn't do it"],
    ["Case 2", CASE2_ID, CASE2_SUSPECTS.kunle, [CASE2_CLUES.tollReceipt, CASE2_CLUES.secondAgreement], CASE2_SUSPECTS.ada, "Case Cracked", "Ada didn't take the deed"],
  ])("%s: cracked, close and missed are unchanged", async (_n, caseId, culprit, keys, innocent, crackedTitle, missedStart) => {
    const cracked = await accuse(withLocked, { caseId, suspectId: culprit, clueIds: keys });
    expect(cracked.body).toMatchObject({ outcome: "cracked", title: crackedTitle });
    const close = await accuse(withLocked, { caseId, suspectId: culprit, clueIds: [keys[0]] });
    expect(close.body).toMatchObject({ outcome: "close", title: "Close Call" });
    const missed = await accuse(withLocked, { caseId, suspectId: innocent, clueIds: keys });
    expect(missed.body.outcome).toBe("missed");
    expect(missed.body.explanation.startsWith(missedStart)).toBe(true);
  });

  it("accepts a locked clue of the same case, without changing the outcome", async () => {
    const keys = [CASE2_CLUES.tollReceipt, CASE2_CLUES.secondAgreement];
    const r = await accuse(withLocked, { caseId: CASE2_ID, suspectId: CASE2_SUSPECTS.kunle, clueIds: [...keys, C2_LOCKED] });
    expect(r.status).toBe(200);
    expect(r.body.outcome).toBe("cracked");
    const alone = await accuse(withLocked, { caseId: CASE2_ID, suspectId: CASE2_SUSPECTS.kunle, clueIds: [C2_LOCKED] });
    expect(alone.status).toBe(200);
    expect(alone.body.outcome).toBe("close");
  });

  it.each([
    ["Case 2's locked clue cited in Case 1", CASE1_ID, C2_LOCKED],
    ["Case 1's locked clue cited in Case 2", CASE2_ID, C1_LOCKED],
    ["a Case 99 locked clue cited in Case 2", CASE2_ID, CASE99_LOCKED.confessionNote],
  ])("rejects %s as unknown", async (_label, caseId, lockedId) => {
    const suspectId = caseId === CASE1_ID ? case1Data.suspects[0].id : CASE2_SUSPECTS.kunle;
    const r = await accuse(withLocked, { caseId, suspectId, clueIds: [lockedId] });
    expect(r.status).toBe(400);
    expect(r.body.error).toBe("Unknown clue for this case.");
  });

  it("without any locked clues, a locked id is still unknown (as before)", async () => {
    const r = await accuse(before, { caseId: CASE2_ID, suspectId: CASE2_SUSPECTS.kunle, clueIds: [C2_LOCKED] });
    expect(r.status).toBe(400);
  });
});
