import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  MAX_UNLOCKED_CLUES,
  parseUnlockedClues,
  readProgress,
  writeProgress,
} from "@/lib/game";
import type { Progress, UnlockedClue } from "@/lib/types";
import { CASE99_CLUES, CASE99_LOCKED, case99LockedClues } from "./fixtures/case99";

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

const key = (n: number) => `sabi-detective:case-${n}:progress`;

// Saves exactly as the game writes them today.
const case1Save =
  '{"foundClueIds":["33333333-3333-4333-8333-000000000001","33333333-3333-4333-8333-000000000003"],' +
  '"contradictions":[{"suspectId":"22222222-2222-4222-8222-000000000001","questionId":"chuks-paid",' +
  '"suspectName":"Chuks","question":"Were you paid last month?","clueName":"Torn wage ledger page",' +
  '"confrontText":"This ledger says you\'re owed two months\' pay.","answer":"Okay, fine, I was vexed."}]}';
const case2Save =
  '{"foundClueIds":["33333333-3333-4333-8333-000000000201"],' +
  '"contradictions":[{"suspectId":"22222222-2222-4222-8222-000000000202","questionId":"kunle-where",' +
  '"suspectName":"Barrister Kunle","question":"Where were you last night?","clueName":"Toll receipt, 01:48",' +
  '"confrontText":"This toll receipt was on your back seat.","answer":"That must be my driver."}]}';

const unlocked = (id: string, extra: Partial<UnlockedClue> = {}): UnlockedClue => ({
  id,
  name: "Test unlocked clue",
  found_description: "TEST ONLY. Fake text.",
  icon_image_url: null,
  ...extra,
});
const id = (n: number) => `33333333-3333-4333-8333-${String(n).padStart(12, "0")}`;

describe("old Case 1 and Case 2 saves", () => {
  it.each([
    [1, case1Save],
    [2, case2Save],
  ])("Case %i reads exactly as before, with no unlockedClues field", (n, saved) => {
    store.set(key(n), saved);
    const progress = readProgress(n);
    expect(progress).toStrictEqual(JSON.parse(saved));
    expect(Object.keys(progress)).toEqual(["foundClueIds", "contradictions"]);
    expect("unlockedClues" in progress).toBe(false);
  });

  it.each([
    [1, case1Save],
    [2, case2Save],
  ])("Case %i writes back the same text it read", (n, saved) => {
    store.set(key(n), saved);
    writeProgress(n, readProgress(n));
    expect(store.get(key(n))).toBe(saved);
  });

  it("writing without unlocks stores exactly the text the game stored before", () => {
    const progress: Progress = { foundClueIds: [id(1)], contradictions: [] };
    writeProgress(1, progress);
    expect(store.get(key(1))).toBe(`{"foundClueIds":["${id(1)}"],"contradictions":[]}`);
    // An empty list is left out too.
    writeProgress(1, { ...progress, unlockedClues: [] });
    expect(store.get(key(1))).toBe(`{"foundClueIds":["${id(1)}"],"contradictions":[]}`);
  });
});

describe("saves with unlocked clues", () => {
  it("survive a write and read", () => {
    const progress: Progress = {
      foundClueIds: [id(1), id(9)],
      contradictions: [],
      unlockedClues: [unlocked(id(9), { icon_image_url: "/art/locked/a1B2_c3-D4.jpg" })],
    };
    writeProgress(3, progress);
    expect(JSON.parse(store.get(key(3))!)).toEqual(progress);
    expect(readProgress(3)).toStrictEqual(progress);
  });

  it("a Case 99 save with both locked clues round-trips", () => {
    const progress: Progress = {
      foundClueIds: [...Object.values(CASE99_CLUES), ...Object.values(CASE99_LOCKED)],
      contradictions: [],
      unlockedClues: case99LockedClues.map(({ id, name, found_description, icon_image_url }) => ({
        id,
        name,
        found_description,
        icon_image_url,
      })),
    };
    writeProgress(99, progress);
    const back = readProgress(99);
    expect(back).toStrictEqual(progress);
    expect(back.unlockedClues!.map((c) => c.id)).toEqual(Object.values(CASE99_LOCKED));
    for (const c of back.unlockedClues!) expect(back.foundClueIds).toContain(c.id);
  });

  it("a save whose unlockedClues are all bad reads like an old save", () => {
    store.set(key(1), `{"foundClueIds":["${id(1)}"],"contradictions":[],"unlockedClues":[{"id":"nope"}]}`);
    expect(Object.keys(readProgress(1))).toEqual(["foundClueIds", "contradictions"]);
  });
});

describe("parseUnlockedClues (untrusted storage)", () => {
  it.each([undefined, null, 42, "x", {}, { 0: unlocked(id(1)) }])("treats %j as no unlocks", (raw) => {
    expect(parseUnlockedClues(raw)).toEqual([]);
  });

  it("drops malformed entries and keeps the good ones", () => {
    const good = unlocked(id(1));
    const bad = [
      null,
      "string",
      [],
      { ...good, id: "not-a-uuid" },
      { ...good, id: 7 },
      { ...good, name: "" },
      { ...good, name: "   " },
      { ...good, name: 5 },
      { ...good, found_description: 5 },
      { ...good, icon_image_url: 5 },
      { name: "missing id", found_description: null, icon_image_url: null },
      { id: id(2), name: "missing description and image" },
    ];
    expect(parseUnlockedClues([...bad, good])).toEqual([good]);
  });

  it("only accepts images from public/art/locked/", () => {
    const ok = ["/art/locked/x.jpg", "/art/locked/Ab_9-z.jpeg", "/art/locked/a.png", "/art/locked/a.webp"];
    const bad = [
      "https://evil.example/x.jpg",
      "//evil.example/x.jpg",
      "javascript:alert(1)",
      "data:image/png;base64,AAAA",
      "/art/clue-toll-receipt.jpg",
      "/art/locked/../clue-toll-receipt.jpg",
      "/art/locked/sub/x.jpg",
      "/art/locked/x.svg",
      "/art/locked/x.jpg?y=1",
      "",
    ];
    ok.forEach((url, i) =>
      expect(parseUnlockedClues([unlocked(id(i + 1), { icon_image_url: url })])).toHaveLength(1),
    );
    for (const url of bad) expect(parseUnlockedClues([unlocked(id(1), { icon_image_url: url })]), url).toEqual([]);
  });

  it("drops oversized text", () => {
    expect(parseUnlockedClues([unlocked(id(1), { name: "n".repeat(201) })])).toEqual([]);
    expect(parseUnlockedClues([unlocked(id(1), { found_description: "d".repeat(2001) })])).toEqual([]);
    expect(parseUnlockedClues([unlocked(id(1), { name: "n".repeat(200) })])).toHaveLength(1);
    expect(parseUnlockedClues([unlocked(id(1), { found_description: "d".repeat(2000) })])).toHaveLength(1);
  });

  it(`keeps at most ${MAX_UNLOCKED_CLUES} entries`, () => {
    const many = Array.from({ length: MAX_UNLOCKED_CLUES + 10 }, (_, i) => unlocked(id(i + 1)));
    const kept = parseUnlockedClues(many);
    expect(kept).toHaveLength(MAX_UNLOCKED_CLUES);
    expect(kept[0].id).toBe(id(1));
  });

  it("keeps the first of any repeated id, whatever its letter case", () => {
    const first = unlocked(id(1), { name: "First" });
    const kept = parseUnlockedClues([first, unlocked(id(1), { name: "Second" }), { ...first, id: id(1).toUpperCase() }]);
    expect(kept).toEqual([first]);
  });

  it("copies only the known fields", () => {
    const kept = parseUnlockedClues([{ ...unlocked(id(1)), isKey: true, solution: "x" }]);
    expect(Object.keys(kept[0]).sort()).toEqual(["found_description", "icon_image_url", "id", "name"]);
  });
});
