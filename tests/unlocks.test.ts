import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkCombine, checkConfront, remainingLocked } from "@/server/unlocks";
import {
  CASE99_CLUES,
  CASE99_ID,
  CASE99_LOCKED,
  CASE99_SUSPECTS,
  case99LockedClues,
  case99Public,
  case99Rules,
} from "./fixtures/case99";

const { alpha, beta } = CASE99_SUSPECTS;
const { redSock, blueSock, rubberDuck } = CASE99_CLUES;
const { confessionNote, matchingPair } = CASE99_LOCKED;
const lockedIds = case99LockedClues.map((c) => c.id);
const UNKNOWN = "44444444-4444-4444-8444-000000000000";

describe("checkConfront", () => {
  it("reveals the locked clue for the right suspect and clue", () => {
    expect(checkConfront(case99Rules, { suspectId: alpha, clueId: rubberDuck })).toEqual({
      status: "unlocked",
      clueId: confessionNote,
    });
  });

  it("does nothing for the wrong suspect", () => {
    expect(checkConfront(case99Rules, { suspectId: beta, clueId: rubberDuck })).toEqual({
      status: "no-match",
    });
  });

  it("does nothing for the wrong clue", () => {
    expect(checkConfront(case99Rules, { suspectId: alpha, clueId: redSock })).toEqual({
      status: "no-match",
    });
  });

  it("never matches a combine rule's clues", () => {
    expect(checkConfront(case99Rules, { suspectId: alpha, clueId: blueSock }).status).toBe("no-match");
  });

  it("says already unlocked when the player has the clue", () => {
    expect(
      checkConfront(case99Rules, { suspectId: alpha, clueId: rubberDuck }, [confessionNote]),
    ).toEqual({ status: "already-unlocked", clueId: confessionNote });
  });

  it("does nothing for unknown ids", () => {
    expect(checkConfront(case99Rules, { suspectId: UNKNOWN, clueId: rubberDuck }).status).toBe("no-match");
    expect(checkConfront(case99Rules, { suspectId: alpha, clueId: UNKNOWN }).status).toBe("no-match");
    expect(checkConfront(case99Rules, { suspectId: "", clueId: "" }).status).toBe("no-match");
    expect(checkConfront([], { suspectId: alpha, clueId: rubberDuck }).status).toBe("no-match");
  });
});

describe("checkCombine", () => {
  it("reveals the locked clue in either order", () => {
    const unlocked = { status: "unlocked", clueId: matchingPair };
    expect(checkCombine(case99Rules, [redSock, blueSock])).toEqual(unlocked);
    expect(checkCombine(case99Rules, [blueSock, redSock])).toEqual(unlocked);
  });

  it("does nothing for clues that don't belong together", () => {
    expect(checkCombine(case99Rules, [redSock, rubberDuck]).status).toBe("no-match");
    expect(checkCombine(case99Rules, [rubberDuck, blueSock]).status).toBe("no-match");
  });

  it("never connects a clue with itself", () => {
    for (const id of [redSock, blueSock, rubberDuck]) {
      expect(checkCombine(case99Rules, [id, id]).status).toBe("no-match");
    }
    // Even if a rule were written that way by mistake.
    const selfRule = [{ kind: "combine" as const, clueIds: [redSock, redSock] as const, unlocksClueId: matchingPair }];
    expect(checkCombine(selfRule, [redSock, redSock]).status).toBe("no-match");
  });

  it("never matches a confront rule", () => {
    expect(checkCombine(case99Rules, [alpha, rubberDuck]).status).toBe("no-match");
  });

  it("says already unlocked when the player has the clue, in either order", () => {
    const already = { status: "already-unlocked", clueId: matchingPair };
    expect(checkCombine(case99Rules, [redSock, blueSock], [matchingPair])).toEqual(already);
    expect(checkCombine(case99Rules, [blueSock, redSock], [matchingPair, confessionNote])).toEqual(already);
  });

  it("does nothing for unknown ids", () => {
    expect(checkCombine(case99Rules, [UNKNOWN, blueSock]).status).toBe("no-match");
    expect(checkCombine(case99Rules, [redSock, UNKNOWN]).status).toBe("no-match");
    expect(checkCombine([], [redSock, blueSock]).status).toBe("no-match");
  });
});

describe("remainingLocked", () => {
  it("lists every locked clue with how it unlocks, before anything is found", () => {
    expect(remainingLocked(lockedIds, case99Rules)).toEqual([
      { clueId: confessionNote, kinds: ["confront"] },
      { clueId: matchingPair, kinds: ["combine"] },
    ]);
  });

  it("drops clues as they are unlocked", () => {
    expect(remainingLocked(lockedIds, case99Rules, [matchingPair])).toEqual([
      { clueId: confessionNote, kinds: ["confront"] },
    ]);
    expect(remainingLocked(lockedIds, case99Rules, [confessionNote, matchingPair])).toEqual([]);
  });

  it("ignores unknown or public ids in the unlocked list", () => {
    expect(remainingLocked(lockedIds, case99Rules, [UNKNOWN, redSock])).toHaveLength(2);
  });

  it("lists both kinds once each when a clue has more than one way in", () => {
    const rules = [
      ...case99Rules,
      { kind: "combine" as const, clueIds: [rubberDuck, redSock] as const, unlocksClueId: confessionNote },
      { kind: "confront" as const, suspectId: beta, clueId: rubberDuck, unlocksClueId: confessionNote },
    ];
    expect(remainingLocked([confessionNote], rules)).toEqual([
      { clueId: confessionNote, kinds: ["confront", "combine"] },
    ]);
  });
});

describe("Case 99 fixture", () => {
  it("has 2 suspects, 3 public clues, and 2 locked clues kept apart from them", () => {
    expect(case99Public.suspects).toHaveLength(2);
    expect(case99Public.clues).toHaveLength(3);
    expect(case99LockedClues).toHaveLength(2);
    const publicIds = case99Public.clues.map((c) => c.id);
    for (const id of lockedIds) expect(publicIds).not.toContain(id);
    for (const c of [...case99Public.clues, ...case99LockedClues]) expect(c.case_id).toBe(CASE99_ID);
  });

  it("has one confront rule and one combine rule, each unlocking a locked clue", () => {
    expect(case99Rules.map((r) => r.kind).sort()).toEqual(["combine", "confront"]);
    expect(case99Rules.map((r) => r.unlocksClueId).sort()).toEqual([...lockedIds].sort());
  });

  it("is obviously fake", () => {
    const text = JSON.stringify([case99Public, case99LockedClues]);
    for (const c of [...case99Public.clues, ...case99LockedClues]) {
      expect(c.found_description).toMatch(/^TEST ONLY\./);
      expect(c.name).toMatch(/^Test /);
    }
    expect(text).not.toMatch(/Chuks|Kunle|Lagos|Ajah/);
  });

  it("is never referred to by app code", () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((f) => {
        const p = join(dir, f);
        return statSync(p).isDirectory() ? walk(p) : [p];
      });
    for (const file of walk(join(process.cwd(), "src"))) {
      const body = readFileSync(file, "utf8");
      expect(body, file).not.toMatch(/tests\/|fixtures|case99|Test Locker|0000000099\d\d/);
    }
  });
});
