import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CASE3_CLUES, CASE3_SUSPECTS, case3Fallback } from "@/data/case3/case3";
import { case3Interrogations } from "@/data/case3/dialogue";
import { insertRows, sqlString, uuids, wordRuns } from "./helpers/sql";

const repo = process.cwd();
const sql011 = readFileSync(join(repo, "supabase/migrations/011_case3_private.sql"), "utf8");
const hidden = insertRows(sql011, "locked_clues").map((r) => ({ id: uuids(r.id)[0], name: sqlString(r.name)!, desc: sqlString(r.found_description)! }));
const rules = insertRows(sql011, "clue_unlocks").map((r) => ({
  id: uuids(r.id)[0],
  kind: sqlString(r.kind),
  suspect: uuids(r.suspect_id)[0] ?? null,
  sources: uuids(r.source_clue_ids),
}));
const [solution] = insertRows(sql011, "case_solutions");
const resultTexts = ["cracked_text", "close_text", "missed_text"].map((c) => sqlString(solution[c])!);

const suspectIds = Object.values(CASE3_SUSPECTS);
const publicClueIds: string[] = Object.values(CASE3_CLUES);
const scripts = Object.entries(case3Interrogations);
const allLines = scripts.flatMap(([, s]) => [
  s.openingLine,
  ...s.questions.flatMap((q) => [q.text, q.defaultAnswer, q.confrontText ?? "", q.confrontedAnswer ?? ""]),
]);
const dialogueText = JSON.stringify(case3Interrogations);
const dialogueLower = allLines.join("\n").toLowerCase();
const confronts = scripts.flatMap(([suspect, s]) =>
  s.questions.filter((q) => q.unlockedByClueId).map((q) => ({ suspect, clue: q.unlockedByClueId!, q })),
);
const pair = (s: string, c: string) => `${s}|${c}`;
const unlockPairs = new Set(rules.filter((r) => r.kind === "confront").map((r) => pair(r.suspect!, r.sources[0])));

// Phrases that would give away a hidden clue. The fixed list plus every 5-word run of every
// hidden clue description, read from 011.
const BANNED = [
  "Special Projects", "95 percent", "signed order", "Land purchase", "office line", "SIM batch", "login trail",
  "CMP-07", "vehicle record", "carbon cop", "transport pool", "big client", "senior manager", "crypto wallet",
  "scam takings", "payroll", "approval register", "transfer instruction", "5 percent", "N3,100,000", "within 48 hours",
  "campaign car", "second set of", "end with the boy", "same batch", "approved by a login", "registered to the campaign",
];
const derived = hidden.flatMap((h) => wordRuns(h.desc, 5)).map((r) => r.toLowerCase().replace(/[.,:;"]+$/, ""));

describe("Case 3 dialogue: structure", () => {
  it("covers all 8 suspects, in order, with the ids from case3.ts", () => {
    expect(scripts.map(([id]) => id)).toEqual(suspectIds);
    expect(case3Fallback.suspects.map((s) => s.id)).toEqual(suspectIds);
  });

  it("gives every suspect an opening line and 6 to 8 answered questions", () => {
    for (const [id, s] of scripts) {
      expect(s.openingLine.trim(), id).not.toBe("");
      expect(s.questions.length, id).toBeGreaterThanOrEqual(6);
      expect(s.questions.length, id).toBeLessThanOrEqual(8);
      for (const q of s.questions) {
        expect(q.text.trim(), q.id).not.toBe("");
        expect(q.defaultAnswer.trim(), q.id).not.toBe("");
        // A confront needs all three parts, which also make its Casebook contradiction entry.
        if (q.unlockedByClueId || q.confrontText || q.confrontedAnswer) {
          expect(q.unlockedByClueId && q.confrontText && q.confrontedAnswer, q.id).toBeTruthy();
        }
      }
    }
  });

  it("uses question ids that are unique across every case", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_ENABLE_CASE3", "1");
    const { interrogations } = await import("@/data/interrogations");
    vi.unstubAllEnvs();
    vi.resetModules();
    const ids = Object.values(interrogations).flatMap((s) => s.questions.map((q) => q.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(interrogations[suspectIds[0]]).toEqual(case3Interrogations[suspectIds[0]]);
  });

  it("has no double quotes inside lines (the bundle check matches lines exactly)", () => {
    for (const line of allLines) expect(line).not.toContain('"');
  });
});

describe("Case 3 dialogue: confronts", () => {
  it("are keyed by the 8 visible clue ids only", () => {
    for (const c of confronts) expect(publicClueIds, c.q.id).toContain(c.clue);
  });

  it("include exactly the 8 unlock confronts from 011, for the right suspect and clue", () => {
    expect(unlockPairs.size).toBe(8);
    const unlocking = confronts.filter((c) => unlockPairs.has(pair(c.suspect, c.clue)));
    expect(new Set(unlocking.map((c) => pair(c.suspect, c.clue)))).toEqual(unlockPairs);
    expect(unlocking).toHaveLength(8);
  });

  it("add 6 to 8 more confronts that unlock nothing", () => {
    const others = confronts.filter((c) => !unlockPairs.has(pair(c.suspect, c.clue)));
    expect(others.length).toBeGreaterThanOrEqual(6);
    expect(others.length).toBeLessThanOrEqual(8);
    // No suspect and clue pair is offered twice.
    expect(new Set(confronts.map((c) => pair(c.suspect, c.clue))).size).toBe(confronts.length);
  });

  it("put only facts from the visible clue in the confront line (no hidden amounts or details)", () => {
    for (const c of confronts) {
      const clue = case3Fallback.clues.find((x) => x.id === c.clue)!;
      for (const amount of c.q.confrontText!.match(/N[\d,]+\d/g) ?? []) {
        expect(clue.found_description, `${c.q.id}: ${amount}`).toContain(amount);
      }
      for (const date of c.q.confrontText!.match(/\b\d{1,2} (July|August|September|October)\b/g) ?? []) {
        expect(clue.found_description, `${c.q.id}: ${date}`).toContain(date);
      }
    }
  });
});

describe("Case 3 dialogue: gives nothing away", () => {
  it("contains no hidden clue id, no rule id, and no hidden clue name", () => {
    for (const h of hidden) {
      expect(dialogueText).not.toContain(h.id);
      expect(dialogueLower).not.toContain(h.name.toLowerCase());
    }
    for (const r of rules) expect(dialogueText).not.toContain(r.id);
  });

  it("contains no 8-word run from a hidden clue description or a result text", () => {
    for (const text of [...hidden.map((h) => h.desc), ...resultTexts]) {
      for (const run of wordRuns(text)) expect(dialogueLower, run).not.toContain(run.toLowerCase());
    }
  });

  it("contains none of the hidden clues' distinctive phrases", () => {
    for (const phrase of BANNED) expect(dialogueLower, phrase).not.toContain(phrase.toLowerCase());
    expect(derived.length).toBeGreaterThan(200);
    for (const phrase of derived) expect(dialogueLower, phrase).not.toContain(phrase);
  });

  it("never names Hon. Madu as the culprit", () => {
    expect(dialogueLower).not.toMatch(/madu (did it|is the culprit|is guilty|ordered|signed|arranged|bought|owns the land)/);
    expect(dialogueLower).not.toMatch(/(in|under) (hon\.? )?madu'?s name/);
  });

  it("has no runtime imports, so a flag-off build can drop it", () => {
    const src = readFileSync(join(repo, "src/data/case3/dialogue.ts"), "utf8");
    expect(src.match(/^import (?!type ).*$/gm)).toBeNull();
    expect(readFileSync(join(repo, "src/data/interrogations.ts"), "utf8")).toContain(
      'if (process.env.NEXT_PUBLIC_ENABLE_CASE3 === "1") Object.assign(interrogations, case3Interrogations);',
    );
  });
});

describe("the bundle check and Case 3 dialogue", () => {
  let dirs: string[] = [];
  afterEach(() => {
    for (const d of dirs) rmSync(d, { recursive: true, force: true });
    dirs = [];
  });
  // Runs the bundle check on a tiny fake build: the real supabase/ and src/data/case3/.
  function checkBundle(browserFile: string, case3Flag: boolean) {
    const dir = mkdtempSync(join(tmpdir(), "sabi-c3-"));
    dirs.push(dir);
    cpSync(join(repo, "supabase"), join(dir, "supabase"), { recursive: true });
    for (const f of readdirSync(join(dir, "supabase/migrations"))) if (f.endsWith("_test.sql")) rmSync(join(dir, "supabase/migrations", f));
    mkdirSync(join(dir, "src/data"), { recursive: true });
    cpSync(join(repo, "src/data/case3"), join(dir, "src/data/case3"), { recursive: true });
    mkdirSync(join(dir, ".next/static/chunks"), { recursive: true });
    writeFileSync(join(dir, ".next/static/chunks/app.js"), browserFile);
    const env: NodeJS.ProcessEnv = { ...process.env, NEXT_PUBLIC_ENABLE_CASE3: case3Flag ? "1" : "" };
    delete env.SUPABASE_SERVICE_ROLE_KEY;
    delete env.NEXT_PUBLIC_ENABLE_TEST_CASE;
    const r = spawnSync(process.execPath, [join(repo, "scripts/check-bundle.mjs")], { cwd: dir, env, encoding: "utf8" });
    return { code: r.status, out: r.stdout + r.stderr };
  }

  it("flag off: fails when a line of Case 3 dialogue is in the build", () => {
    const line = case3Interrogations[suspectIds[5]].questions[0].defaultAnswer;
    const r = checkBundle(`var a=${JSON.stringify(line)};`, false);
    expect(r.out).toContain(`contains Case 3 "${line}"`);
    expect(r.code).toBe(1);
  });

  it("flag on: the dialogue may ship", () => {
    const r = checkBundle(`var p=${JSON.stringify(case3Fallback)};var d=${JSON.stringify(case3Interrogations)};`, true);
    expect(r.code).toBe(0);
  });

  it("flag on: a hidden clue name inside a dialogue line is caught", () => {
    const tainted = { ...case3Interrogations };
    const kelvin = tainted[suspectIds[0]];
    tainted[suspectIds[0]] = { ...kelvin, openingLine: `${kelvin.openingLine} Ask me about the Special Projects ledger.` };
    const r = checkBundle(`var p=${JSON.stringify(case3Fallback)};var d=${JSON.stringify(tainted)};`, true);
    expect(r.out).toContain('contains "Special Projects ledger"');
    expect(r.code).toBe(1);
  });
});
