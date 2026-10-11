import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Casebook from "@/components/Casebook";
import Result from "@/components/Result";
import { caseArt } from "@/data/art";
import { case1Fallback } from "@/data/case1-fallback";
import { case2Fallback } from "@/data/case2-fallback";
import { heldClues, type LoadedCase } from "@/lib/game";
import type { Progress, SavedResult, UnlockedClue } from "@/lib/types";
import { CASE99_CLUES, CASE99_ID, CASE99_LOCKED, case99LockedClues, case99Public } from "./fixtures/case99";

const { redSock, blueSock, rubberDuck } = CASE99_CLUES;
const { confessionNote, matchingPair } = CASE99_LOCKED;
const case99: LoadedCase = { ...case99Public, source: "local" };
const case1: LoadedCase = { ...case1Fallback, source: "local" };
const case2: LoadedCase = { ...case2Fallback, source: "local" };

const asUnlocked = (id: string, extra: Partial<UnlockedClue> = {}): UnlockedClue => {
  const c = case99LockedClues.find((l) => l.id === id)!;
  return { id: c.id, name: c.name, found_description: c.found_description, icon_image_url: c.icon_image_url, ...extra };
};
const progress = (found: string[], unlocked?: UnlockedClue[]): Progress => ({
  foundClueIds: found,
  contradictions: [],
  ...(unlocked && { unlockedClues: unlocked }),
});
// What every screen showed before this change: the public clues found, in case order.
const before = (bundle: LoadedCase, p: Progress) => bundle.clues.filter((c) => p.foundClueIds.includes(c.id));
const subsets = <T,>(xs: T[]): T[][] => xs.reduce<T[][]>((acc, x) => [...acc, ...acc.map((s) => [...s, x])], [[]]);

describe("heldClues", () => {
  it.each([
    ["Case 1", case1],
    ["Case 2", case2],
  ])("%s with no unlocks gives exactly today's list, for every set of found clues", (_n, bundle) => {
    for (const found of subsets(bundle.clues.map((c) => c.id))) {
      // Found in a scrambled order: the result still follows case order.
      const p = progress([...found].reverse());
      expect(heldClues(bundle, p)).toStrictEqual(before(bundle, p));
      // The very same objects, so screens render exactly as before.
      heldClues(bundle, p).forEach((c, i) => expect(c).toBe(before(bundle, p)[i]));
      expect(heldClues(bundle, { ...p, unlockedClues: [] })).toStrictEqual(before(bundle, p));
    }
  });

  it("adds unlocked clues after the public ones, shaped like public clues", () => {
    const withImage = asUnlocked(confessionNote, { icon_image_url: "/art/locked/q7Zt4pLx9.jpg" });
    const held = heldClues(case99, progress([redSock, confessionNote], [withImage]));
    expect(held.map((c) => c.id)).toEqual([redSock, confessionNote]);
    expect(held[1]).toEqual({
      id: confessionNote,
      case_id: CASE99_ID,
      name: "Test locked confession note",
      icon_image_url: "/art/locked/q7Zt4pLx9.jpg",
      found_description: withImage.found_description,
    });
  });

  it("keeps public clues in case order and unlocked clues in the order unlocked", () => {
    const held = heldClues(
      case99,
      progress([rubberDuck, matchingPair, redSock, confessionNote], [asUnlocked(matchingPair), asUnlocked(confessionNote)]),
    );
    expect(held.map((c) => c.id)).toEqual([redSock, rubberDuck, matchingPair, confessionNote]);
  });

  it("lets a public clue win over an unlocked one with the same id", () => {
    const impostor = asUnlocked(confessionNote, { id: blueSock, name: "Saved copy of the blue sock" });
    const held = heldClues(case99, progress([blueSock], [impostor]));
    expect(held).toHaveLength(1);
    expect(held[0]).toBe(case99.clues[1]);
    expect(held[0].name).toBe("Test blue sock");
  });

  it("an unlocked clue matching a public clue the player hasn't found adds nothing", () => {
    const impostor = asUnlocked(confessionNote, { id: rubberDuck, name: "Saved duck" });
    expect(heldClues(case99, progress([], [impostor]))).toEqual([]);
  });

  it("shows each unlocked clue once, keeping the first", () => {
    const first = asUnlocked(matchingPair);
    const again = asUnlocked(matchingPair, { name: "Second copy" });
    const held = heldClues(case99, progress([matchingPair], [first, again, { ...first, id: matchingPair.toUpperCase() }]));
    expect(held.map((c) => c.name)).toEqual([first.name]);
  });

  it("ignores malformed saved entries", () => {
    const junk = [
      null,
      "x",
      { id: "not-a-uuid", name: "x", found_description: null, icon_image_url: null },
      { ...asUnlocked(confessionNote), name: "" },
      { ...asUnlocked(confessionNote), icon_image_url: "https://evil.example/x.jpg" },
      asUnlocked(matchingPair),
    ] as unknown as UnlockedClue[];
    expect(heldClues(case99, progress([matchingPair], junk)).map((c) => c.id)).toEqual([matchingPair]);
    expect(heldClues(case99, { ...progress([]), unlockedClues: "nope" as unknown as UnlockedClue[] })).toEqual([]);
  });
});

describe("screens show held clues", () => {
  const p99 = progress([redSock, confessionNote], [asUnlocked(confessionNote, { icon_image_url: "/art/locked/q7Zt4pLx9.jpg" })]);

  it("Casebook lists public and unlocked evidence, with the unlocked image path", () => {
    const html = renderToStaticMarkup(createElement(Casebook, { bundle: case99, art: null, progress: p99 }));
    expect(html).toContain("Evidence (2)");
    expect(html).toContain("Test red sock");
    expect(html).toContain("Test locked confession note");
    expect(html).toContain("/art/locked/q7Zt4pLx9.jpg");
    expect(html).not.toContain("Test blue sock");
  });

  it.each([
    ["Case 1", case1, [case1.clues[0].id, case1.clues[2].id]],
    ["Case 2", case2, [case2.clues[0].id, case2.clues[3].id, case2.clues[4].id]],
  ])("%s Casebook renders the same with or without an empty unlock list", (_n, bundle, found) => {
    const art = caseArt(bundle.caseData.case_number);
    const plain = renderToStaticMarkup(createElement(Casebook, { bundle, art, progress: progress(found) }));
    const empty = renderToStaticMarkup(createElement(Casebook, { bundle, art, progress: progress(found, []) }));
    expect(empty).toBe(plain);
    expect(plain).toContain(`Evidence (${found.length})`);
  });

  it("Result names unlocked evidence in Evidence cited", () => {
    const saved: SavedResult = {
      accusation: { suspectId: case99.suspects[0].id, citedClueIds: [redSock, confessionNote] },
      result: { outcome: "close", title: "Close Call", explanation: "TEST ONLY.", feedback: [] },
    };
    const html = renderToStaticMarkup(
      createElement(Result, { bundle: case99, saved, progress: p99, onPlayAgain: () => {}, onHome: () => {} }),
    );
    expect(html).toContain("Test red sock, Test locked confession note");
  });

  it("Case 1 Result names cited evidence exactly as before", () => {
    const [ledger, , footprint] = case1.clues;
    const saved: SavedResult = {
      accusation: { suspectId: case1.suspects[0].id, citedClueIds: [footprint.id, ledger.id] },
      result: { outcome: "cracked", title: "Case Cracked", explanation: "x", feedback: [] },
    };
    const html = renderToStaticMarkup(
      createElement(Result, {
        bundle: case1,
        saved,
        progress: progress([ledger.id, footprint.id]),
        onPlayAgain: () => {},
        onHome: () => {},
      }),
    );
    // Case order, as before: the ledger comes before the footprint in the case file.
    expect(html).toContain(`${ledger.name}, ${footprint.name}`);
  });
});
