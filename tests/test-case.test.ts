import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { HomeCase } from "@/components/Home";
import * as copy from "@/data/test-case/case99";
import { emptyRecord, recordVerdict, todaysCase } from "@/lib/record";
import * as fixture from "./fixtures/case99";

const migration = (name: string) => readFileSync(join(process.cwd(), "supabase/migrations", name), "utf8");
const sql008 = migration("008_case99_test.sql");
const sql009 = migration("009_case99_cleanup.sql");
const quoted = (s: string) => `'${s.replaceAll("'", "''")}'`;

// The registry modules read the flag when they load, so each test loads them fresh.
async function withFlag(on: boolean) {
  vi.resetModules();
  if (on) vi.stubEnv("NEXT_PUBLIC_ENABLE_TEST_CASE", "1");
  else vi.stubEnv("NEXT_PUBLIC_ENABLE_TEST_CASE", "");
  const cases = await import("@/data/cases");
  const { interrogations } = await import("@/data/interrogations");
  return { ...cases, interrogations };
}
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("the build-time flag", () => {
  it("off: registers nothing for Case 99", async () => {
    const m = await withFlag(false);
    expect(m.TEST_CASE_NUMBERS).toEqual([]);
    expect(m.listCases().map((c) => c.caseNumber)).toEqual([1, 2, 3]);
    expect(m.listCases().some((c) => c.test)).toBe(false);
    expect(m.caseFallback(99)).toBeNull();
    expect(m.hasLockedClues(99)).toBe(false);
    expect(m.hiddenClueKinds(99)).toEqual([]);
    expect(m.interrogations[copy.CASE99_SUSPECTS.alpha]).toBeUndefined();
  });

  it("on: registers Case 99 as a test case, after the real cases, with its switch", async () => {
    const m = await withFlag(true);
    expect(m.listCases()).toEqual([
      { caseNumber: 1, title: "The Empty Stall", playable: true },
      { caseNumber: 2, title: "The Second Buyer", playable: true },
      { caseNumber: 3, title: null, playable: false },
      { caseNumber: 99, title: "Test Locker", playable: true, test: true },
    ]);
    expect(m.isTestCase(99)).toBe(true);
    expect(m.isTestCase(1)).toBe(false);
    expect(m.caseFallback(99)).toEqual(copy.case99Fallback);
    expect(m.hasLockedClues(99)).toBe(true);
    expect(m.hiddenClueKinds(99)).toEqual(["confront", "combine"]);
    expect(m.interrogations[copy.CASE99_SUSPECTS.alpha]).toEqual(copy.case99Interrogations[copy.CASE99_SUSPECTS.alpha]);
  });

  it("on: Case 1 and Case 2 are unchanged", async () => {
    const off = await withFlag(false);
    const before = { c1: off.caseFallback(1), c2: off.caseFallback(2), lock1: off.hasLockedClues(1), lock2: off.hasLockedClues(2) };
    const on = await withFlag(true);
    expect({ c1: on.caseFallback(1), c2: on.caseFallback(2), lock1: on.hasLockedClues(1), lock2: on.hasLockedClues(2) }).toEqual(before);
    expect(on.hasLockedClues(1) || on.hasLockedClues(2)).toBe(false);
  });

  it("on: Case 99 never becomes Today's case", async () => {
    const m = await withFlag(true);
    const real = m.listCases().filter((c) => c.playable && !c.test).map((c) => c.caseNumber);
    expect(real).toEqual([1, 2]);
    const both = recordVerdict(recordVerdict(emptyRecord, 1, "cracked"), 2, "close");
    expect(todaysCase(real, emptyRecord)).toBe(1);
    expect(todaysCase(real, both)).toBe(2);
  });
});

describe("Home and the TEST ONLY card", () => {
  const card = (caseNumber: number, playable: boolean, extra: Partial<HomeCase> = {}): HomeCase => ({
    caseNumber,
    title: playable ? `Title ${caseNumber}` : null,
    art: null,
    playable,
    status: "new",
    hasSavedResult: false,
    ...extra,
  });
  const cases = [card(1, true), card(2, true), card(3, false), card(99, true, { title: "Test Locker", test: true, status: "in-progress" })];
  // Home reads the flag when it loads, so it is loaded fresh for each setting.
  const render = async (flag: boolean, todayCaseNumber = 1) => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_ENABLE_TEST_CASE", flag ? "1" : "");
    const { default: FreshHome } = await import("@/components/Home");
    return renderToStaticMarkup(
      createElement(FreshHome, { cases, todayCaseNumber, rank: "Rookie", solved: 0, best: null, usingLocalData: false, onOpenCase: () => {} }),
    );
  };

  it("shows the card last, muted and labelled TEST ONLY, only with the flag on", async () => {
    const html = await render(true);
    expect(html).toContain("TEST ONLY");
    expect(html).toContain("Test Locker");
    expect(html.indexOf("Test Locker")).toBeGreaterThan(html.indexOf("Coming soon"));
    expect(html).toContain("Case 99 · In progress");
    const off = await render(false);
    expect(off).not.toContain("TEST ONLY");
    expect(off).not.toContain("Test Locker");
  });

  it("never shows a test case as Today's case, and leaves the stats as given", async () => {
    const html = await render(true, 99);
    expect(html).not.toContain("Today&#x27;s case");
    expect(html).toContain(">Rookie<");
    expect(html).toContain(">None yet<");
  });
});

describe("the app's copy of Case 99", () => {
  it("is identical to the test fixture's public parts", () => {
    expect(copy.CASE99_ID).toBe(fixture.CASE99_ID);
    expect(copy.CASE99_SUSPECTS).toEqual(fixture.CASE99_SUSPECTS);
    expect(copy.CASE99_CLUES).toEqual(fixture.CASE99_CLUES);
    expect(copy.case99Fallback).toEqual(fixture.case99Public);
    expect(copy.case99Interrogations).toEqual(fixture.case99Interrogations);
    expect(Object.keys(copy).sort()).toEqual(["CASE99_CLUES", "CASE99_ID", "CASE99_SUSPECTS", "case99Fallback", "case99Interrogations"]);
  });

  it("holds no answer data: no locked clues, rules or result texts", () => {
    const shipped = JSON.stringify(copy);
    for (const c of fixture.case99LockedClues) {
      expect(shipped).not.toContain(c.id);
      expect(shipped).not.toContain(c.name);
      expect(shipped).not.toContain(c.found_description);
    }
    for (const id of Object.values(fixture.CASE99_RULE_IDS)) expect(shipped).not.toContain(id);
    for (const { text } of Object.values(fixture.case99Solution.texts)) {
      for (const part of text.split("{accused}")) {
        const words = part.trim().split(/\s+/);
        for (let i = 0; i + 8 <= words.length; i++) expect(shipped).not.toContain(words.slice(i, i + 8).join(" "));
      }
    }
    for (const field of ["solution", "keyClue", "key_clue", "redHerring", "unlocks", "source_clue", "locked_", "Test locked"]) {
      expect(shipped).not.toContain(field);
    }
  });
});

describe("008_case99_test.sql and 009_case99_cleanup.sql", () => {
  const publicIds = [fixture.CASE99_ID, ...Object.values(fixture.CASE99_SUSPECTS), ...Object.values(fixture.CASE99_CLUES)];
  const privateIds = [...Object.values(fixture.CASE99_LOCKED), ...Object.values(fixture.CASE99_RULE_IDS)];

  it("inserts exactly the fixture's public story", () => {
    for (const s of [
      fixture.case99Public.caseData.title,
      fixture.case99Public.caseData.briefing_text,
      ...fixture.case99Public.suspects.flatMap((s) => [s.id, s.name, s.connection!, s.motive!]),
      ...fixture.case99Public.clues.flatMap((c) => [c.id, c.name, c.found_description!]),
    ]) {
      expect(sql008).toContain(quoted(s));
    }
  });

  it("inserts the answer, locked clues and rules from the fixture, privately", () => {
    for (const { title, text } of Object.values(fixture.case99Solution.texts)) {
      expect(sql008).toContain(quoted(title));
      expect(sql008).toContain(quoted(text));
    }
    for (const c of fixture.case99LockedClues) {
      for (const s of [c.id, c.name, c.found_description]) expect(sql008).toContain(quoted(s));
    }
    expect(sql008).toContain(`array[${fixture.case99Solution.keyClueIds.map(quoted).join(", ")}]::uuid[]`);
    const r = fixture.case99Rules;
    expect(sql008).toContain(`'confront',\n    ${quoted((r[0] as { suspectId: string }).suspectId)},\n    array[${quoted((r[0] as { clueId: string }).clueId)}]::uuid[],\n    ${quoted(r[0].unlocksClueId)}`);
    expect(sql008).toContain(`'combine',\n    null,\n    array[${(r[1] as { clueIds: readonly string[] }).clueIds.map(quoted).join(", ")}]::uuid[],\n    ${quoted(r[1].unlocksClueId)}`);
  });

  it("never puts a locked clue in the public clues table, and all text is TEST ONLY", () => {
    const publicClues = sql008.slice(sql008.indexOf("insert into public.clues"), sql008.indexOf("-- ---- Private"));
    for (const id of Object.values(fixture.CASE99_LOCKED)) expect(publicClues).not.toContain(id);
    const texts = [...sql008.replace(/--.*$/gm, "").matchAll(/'((?:[^']|'')*)'/g)]
      .map((m) => m[1])
      .filter((t) => t.length >= 12 && !/^[0-9a-f-]{36}$/.test(t));
    expect(texts.length).toBeGreaterThan(15);
    // Everything is TEST ONLY text or a Test name, apart from the standard verdict titles
    // that every case uses and the Result screen shows.
    for (const t of texts) expect(t, t).toMatch(/^(TEST ONLY\.|Test |Case Cracked$|Close Call$|Missed It$)/);
  });

  it("is safe to re-run: every insert skips rows that already exist", () => {
    const inserts = sql008.match(/insert into public\.\w+/g)!;
    expect(inserts).toHaveLength(6);
    expect(sql008.match(/on conflict \((id|case_id)\) do nothing;/g)).toHaveLength(6);
    expect(sql008).not.toMatch(/\b(update|delete|drop|alter|truncate)\b/i);
  });

  it("the cleanup deletes only Case 99's rows, by id, and the case last and only if empty", () => {
    const sql = sql009.replace(/--.*$/gm, "");
    for (const id of [...publicIds, ...privateIds]) expect(sql).toContain(id);
    const ids = [...new Set(sql.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g))];
    expect(ids.sort()).toEqual([...publicIds, ...privateIds].sort());
    const statements = sql.split(";").map((s) => s.trim()).filter(Boolean);
    expect(statements.filter((s) => s.startsWith("delete from"))).toHaveLength(6);
    expect(statements.at(-2)).toMatch(/^delete from public\.cases c/);
    expect(statements.at(-2)).toContain("not exists (select 1 from public.clue_unlocks u where u.case_id = c.id)");
    expect(sql).not.toMatch(/\b(insert|update|drop|alter|truncate)\b/i);
  });
});
