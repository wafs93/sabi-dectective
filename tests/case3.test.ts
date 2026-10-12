import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CASE3_CLUES, CASE3_ID, CASE3_SUSPECTS, case3Fallback } from "@/data/case3/case3";
import { insertRows, sqlString, uuids, wordRuns } from "./helpers/sql";

// Everything here is read from the SQL files; the rules never live in app code.
const read = (p: string) => readFileSync(join(process.cwd(), "supabase", p), "utf8");
const sql010 = read("migrations/010_case3.sql");
const sql011 = read("migrations/011_case3_private.sql");
const seed = read("seed.sql");
const quoted = (s: string) => `'${s.replaceAll("'", "''")}'`;

const suspects = insertRows(sql010, "suspects").map((r) => ({ id: uuids(r.id)[0], name: sqlString(r.name)! }));
const visible = insertRows(sql010, "clues").map((r) => ({ id: uuids(r.id)[0], name: sqlString(r.name)!, desc: sqlString(r.found_description)! }));
const hidden = insertRows(sql011, "locked_clues").map((r) => ({
  id: uuids(r.id)[0],
  case_id: uuids(r.case_id)[0],
  name: sqlString(r.name)!,
  desc: sqlString(r.found_description)!,
  image: r.icon_image_url,
}));
const rules = insertRows(sql011, "clue_unlocks").map((r) => ({
  id: uuids(r.id)[0],
  kind: sqlString(r.kind) as "confront" | "combine",
  suspect: uuids(r.suspect_id)[0] ?? null,
  sources: uuids(r.source_clue_ids),
  unlocks: uuids(r.unlocks_clue_id)[0],
}));
const [solutionRow] = insertRows(sql011, "case_solutions");
const solution = {
  culprit: uuids(solutionRow.solution_suspect_id)[0],
  key: uuids(solutionRow.key_clue_ids),
  redHerrings: uuids(solutionRow.red_herring_clue_ids),
  texts: ["cracked_text", "close_text", "missed_text"].map((c) => sqlString(solutionRow[c])!),
};

// The spec, by code, to check the SQL against.
const VISIBLE_NAMES = ["Fake dating profiles", "Kelvin's phone chat", "Hope Bridge donation list", "Kelvin's bank statement", "Yinka's receipt book", "Compliance flag memo", "Campaign finance filing", "Raid report"];
const HIDDEN_NAMES: Record<string, string> = {
  K1: "Transfer instruction slip", K2: "Kelvin's scam ledger", K3: "Yinka's carbon copies", K4: "Flag closure emails",
  K5: "Foundation approval register", K6: "Special Projects ledger", K7: "Recovered payroll files", K8: "Chidi's wallet list",
  M1: "Foundation receipts match", M2: "Courier vehicle record", M3: "Approval login trail", M4: "Flag closure timing",
  M5: "Kelvin's own money", M6: "Chidi's different pattern", M7: "SIM batch record", M8: "The full chain",
  F1: "Sanni's login trail", F2: "Land purchase record", F3: "Office line trace", F4: "Signed Special Projects order",
};
const SUSPECT_NAMES = ['Kelvin "KP" Okoro', "Hon. Ifeanyi Madu", "Dr. Sanni Bello", "Mrs. Bisola Madu", "Mr. Yinka Adewale", "Aisha Lawal", "Segun Alabi", "Oga Chidi Eze"];
const SPEC_RULES: Record<string, [string, string] | [string, string, string]> = {
  K1: ["confront", "Kelvin", "V4"], K2: ["confront", "Kelvin", "V1"], K3: ["confront", "Yinka", "V5"], K4: ["confront", "Aisha", "V6"],
  K5: ["confront", "Bisola", "V3"], K6: ["confront", "Sanni", "V7"], K7: ["confront", "Segun", "V7"], K8: ["confront", "Chidi", "V2"],
  M1: ["combine", "K1", "V3"], M2: ["combine", "K3", "V7"], M3: ["combine", "K5", "K6"], M4: ["combine", "K4", "V6"],
  M5: ["combine", "K2", "V4"], M6: ["combine", "K8", "V4"], M7: ["combine", "V8", "K3"], M8: ["combine", "M1", "M2"],
  F1: ["combine", "M8", "M3"], F2: ["combine", "M1", "K6"], F3: ["combine", "M7", "M4"], F4: ["combine", "F1", "F3"],
};
const idOf = (code: string): string =>
  code.startsWith("V") ? visible[Number(code.slice(1)) - 1].id : hidden.find((h) => h.name === HIDDEN_NAMES[code])!.id;
const suspectOf = (word: string) => suspects.find((s) => s.name.includes(word))!.id;
const codeOf = new Map([...Object.keys(HIDDEN_NAMES), ...VISIBLE_NAMES.map((_, i) => `V${i + 1}`)].map((c) => [idOf(c), c]));

describe("Case 3 public rows and the offline copy", () => {
  it("has the case, 8 suspects and 8 visible clues, in order, with the given ids", () => {
    expect(case3Fallback.caseData).toMatchObject({ id: "11111111-1111-4111-8111-000000000003", case_number: 3, title: "The Clean Money" });
    expect(suspects.map((s) => s.name)).toEqual(SUSPECT_NAMES);
    expect(suspects.map((s) => s.id)).toEqual(SUSPECT_NAMES.map((_, i) => `22222222-2222-4222-8222-${String(301 + i).padStart(12, "0")}`));
    expect(visible.map((v) => v.name)).toEqual(VISIBLE_NAMES);
    expect(visible.map((v) => v.id)).toEqual(VISIBLE_NAMES.map((_, i) => `33333333-3333-4333-8333-${String(301 + i).padStart(12, "0")}`));
  });

  it("matches 010 and seed.sql word for word", () => {
    const { caseData, suspects: s, clues } = case3Fallback;
    const strings = [
      caseData.id,
      caseData.title,
      caseData.briefing_text,
      ...s.flatMap((x) => [x.id, x.name, x.connection!, x.motive!]),
      ...clues.flatMap((c) => [c.id, c.name, c.found_description!]),
    ];
    for (const x of strings) {
      expect(sql010).toContain(quoted(x));
      expect(seed).toContain(quoted(x));
    }
    expect(s.map((x) => x.id)).toEqual(Object.values(CASE3_SUSPECTS));
    expect(clues.map((c) => c.id)).toEqual(Object.values(CASE3_CLUES));
    expect(CASE3_ID).toBe(caseData.id);
  });

  it("holds no hidden clue, rule or answer data", () => {
    const shipped = JSON.stringify(case3Fallback);
    for (const h of hidden) {
      expect(shipped).not.toContain(h.id);
      expect(shipped).not.toContain(h.name);
      for (const run of wordRuns(h.desc)) expect(shipped).not.toContain(run);
    }
    for (const r of rules) expect(shipped).not.toContain(r.id);
    for (const t of solution.texts) for (const run of wordRuns(t)) expect(shipped).not.toContain(run);
    for (const field of ["solution", "key_clue", "red_herring", "locked", "unlocks", "source_clue"]) expect(shipped).not.toContain(field);
  });

  it("the seed adds Case 3's public rows only, without deleting anything", () => {
    const section = seed.slice(seed.indexOf('-- ---- Case 3 "The Clean Money"'));
    expect(section).not.toMatch(/delete from|case_solutions|locked_clues|clue_unlocks|solution_suspect_id/);
    expect(section.match(/on conflict \(id\) do nothing;/g)).toHaveLength(3);
  });
});

describe("Case 3 hidden clues and rules", () => {
  it("has 20 hidden clues with the given names, random version 4 ids and no image yet", () => {
    expect(hidden.map((h) => h.name).sort()).toEqual(Object.values(HIDDEN_NAMES).sort());
    const ids = hidden.map((h) => h.id);
    expect(new Set(ids).size).toBe(20);
    for (const h of hidden) {
      expect(h.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(h.id).not.toMatch(/^(\d)\1{7}-/); // not the 11111111/22222222/33333333 pattern
      expect(h.case_id).toBe(CASE3_ID);
      expect(h.image).toBe("null");
    }
    // Random, not a sequence: no two ids share their first 8 characters.
    expect(new Set(ids.map((id) => id.slice(0, 8))).size).toBe(20);
  });

  it("never inserts a hidden clue id into the public clues table", () => {
    const publicIds = [...insertRows(sql010, "clues"), ...insertRows(seed, "clues")].flatMap((r) => uuids(r.id));
    for (const h of hidden) expect(publicIds).not.toContain(h.id);
    expect(sql010).not.toMatch(/locked_clues|clue_unlocks|case_solutions/);
  });

  it("has exactly one rule per hidden clue, matching the spec", () => {
    expect(rules).toHaveLength(20);
    expect(new Set(rules.map((r) => r.unlocks)).size).toBe(20);
    for (const [code, spec] of Object.entries(SPEC_RULES)) {
      const rule = rules.find((r) => r.unlocks === idOf(code))!;
      expect(rule.kind, code).toBe(spec[0]);
      if (spec[0] === "confront") {
        expect(rule.suspect, code).toBe(suspectOf(spec[1]));
        expect(rule.sources, code).toEqual([idOf(spec[2]!)]);
      } else {
        expect(rule.suspect, code).toBeNull();
        expect(rule.sources, code).toEqual([idOf(spec[1]), idOf(spec[2]!)]);
      }
    }
    expect(new Set(rules.map((r) => r.id)).size).toBe(20);
  });

  it("no rule uses its own clue as a source, and there are no cycles", () => {
    for (const r of rules) expect(r.sources).not.toContain(r.unlocks);
    const ruleFor = new Map(rules.map((r) => [r.unlocks, r]));
    const state = new Map<string, "visiting" | "done">();
    const visit = (id: string, path: string[]) => {
      if (state.get(id) === "done") return;
      expect(state.get(id), `cycle: ${[...path, codeOf.get(id)].join(" -> ")}`).not.toBe("visiting");
      state.set(id, "visiting");
      for (const s of ruleFor.get(id)?.sources ?? []) visit(s, [...path, codeOf.get(id)!]);
      state.set(id, "done");
    };
    for (const h of hidden) visit(h.id, []);
  });

  it("REACHABILITY: from the 8 visible clues, every hidden clue can be unlocked", () => {
    const held = new Set(visible.map((v) => v.id));
    const allSuspects = new Set(suspects.map((s) => s.id));
    const roundOf = new Map<string, number>();
    for (let round = 1; round <= 25; round++) {
      // Each round applies every rule whose sources were held before the round started.
      const before = new Set(held);
      for (const r of rules) {
        if (held.has(r.unlocks)) continue;
        const ok = r.kind === "confront" ? allSuspects.has(r.suspect!) && before.has(r.sources[0]) : r.sources.every((s) => before.has(s));
        if (ok) {
          held.add(r.unlocks);
          roundOf.set(r.unlocks, round);
        }
      }
      if (held.size === before.size) break;
    }
    for (const h of hidden) expect(held.has(h.id), `${codeOf.get(h.id)} unreachable`).toBe(true);
    for (const code of ["F2", "F3", "F4"]) expect(held.has(idOf(code))).toBe(true);
    // K clues in round 1, M1-M7 in round 2, M8, F2 and F3 in round 3, F1 in round 4, F4 in round 5.
    expect(Object.fromEntries(["K1", "M7", "M8", "F2", "F3", "F1", "F4"].map((c) => [c, roundOf.get(idOf(c))]))).toEqual({
      K1: 1, M7: 2, M8: 3, F2: 3, F3: 3, F1: 4, F4: 5,
    });
  });

  it("F4 needs at least 14 unlocks: itself and every hidden clue it depends on", () => {
    const ruleFor = new Map(rules.map((r) => [r.unlocks, r]));
    const needed = new Set<string>();
    const add = (id: string) => {
      if (!ruleFor.has(id) || needed.has(id)) return;
      needed.add(id);
      for (const s of ruleFor.get(id)!.sources) add(s);
    };
    add(idOf("F4"));
    expect([...needed].map((id) => codeOf.get(id)).sort()).toEqual(
      ["F1", "F3", "F4", "K1", "K3", "K4", "K5", "K6", "M1", "M2", "M3", "M4", "M7", "M8"].sort(),
    );
    expect(needed.size).toBe(14);
  });
});

describe("Case 3 answer", () => {
  it("names a real suspect, Hon. Ifeanyi Madu, with hidden key clues F2, F3 and F4", () => {
    expect(suspects.map((s) => s.id)).toContain(solution.culprit);
    expect(solution.culprit).toBe("22222222-2222-4222-8222-000000000302");
    expect(solution.key).toEqual(["F2", "F3", "F4"].map(idOf));
    for (const id of solution.key) expect(hidden.map((h) => h.id)).toContain(id);
    expect(solution.redHerrings).toEqual(["V1", "K7", "K8"].map(idOf));
    expect(solution.texts[2]).toContain("{accused}");
  });
});

describe("Case 3 facts stay consistent", () => {
  const allText = [case3Fallback.caseData.briefing_text, ...visible.map((v) => v.desc), ...hidden.map((h) => h.desc), ...solution.texts,
    ...case3Fallback.suspects.flatMap((s) => [s.connection!, s.motive!])];

  it("every amount is one of the case's amounts", () => {
    const allowed = ["N62,000,000", "N186,000,000", "N58,900,000", "N3,100,000", "N2,000,000"];
    for (const t of allText) for (const amount of t.match(/N[\d,]+\d/g) ?? []) expect(allowed, t).toContain(amount);
  });

  it("every date is one of the case's dates", () => {
    const allowed = ["28 July", "28 August", "28 September", "30 July", "30 August", "30 September", "2 October", "3 October", "12 September", "14 September"];
    const months = /\b(\d{1,2}) (January|February|March|April|May|June|July|August|September|October|November|December)\b/g;
    for (const t of allText) for (const m of t.match(months) ?? []) expect(allowed, t).toContain(m);
    for (const t of allText) expect(t).not.toMatch(/\b(?!40\b|95\b|5\b|24\b|48\b|28th\b)\d+ (accounts|percent|hours)\b/);
  });

  it("only F2, F3 and F4 point at Madu himself", () => {
    const early = [...visible.map((v) => v.desc), ...hidden.filter((h) => !["F2", "F3", "F4"].includes(codeOf.get(h.id)!)).map((h) => h.desc)];
    for (const t of early) expect(t).not.toMatch(/Ifeanyi|Hon\.|Madu himself|Madu's/);
    for (const code of ["F2", "F3", "F4"]) expect(hidden.find((h) => h.id === idOf(code))!.desc).toMatch(/Madu/);
  });
});

describe("the Case 3 build-time flag", () => {
  async function withFlag(on: boolean) {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_ENABLE_CASE3", on ? "1" : "");
    return import("@/data/cases");
  }
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("off: Case 3 stays the locked Coming soon card, with no data", async () => {
    const m = await withFlag(false);
    expect(m.listCases().find((c) => c.caseNumber === 3)).toEqual({ caseNumber: 3, title: null, playable: false });
    expect(m.caseFallback(3)).toBeNull();
    expect(m.hasLockedClues(3)).toBe(false);
    expect(m.hiddenClueKinds(3)).toEqual([]);
  });

  it("on: Case 3 is playable with its public slot summary (8 by questioning, 12 by connecting)", async () => {
    const m = await withFlag(true);
    expect(m.listCases().find((c) => c.caseNumber === 3)).toEqual({ caseNumber: 3, title: "The Clean Money", playable: true });
    expect(m.caseFallback(3)).toEqual(case3Fallback);
    expect(m.hasLockedClues(3)).toBe(true);
    const kinds = m.hiddenClueKinds(3);
    expect(kinds.filter((k) => k === "confront")).toHaveLength(8);
    expect(kinds.filter((k) => k === "combine")).toHaveLength(12);
    expect(kinds).toHaveLength(hidden.length);
    // Case 1 and Case 2 are untouched.
    expect(m.hasLockedClues(1) || m.hasLockedClues(2)).toBe(false);
  });
});
