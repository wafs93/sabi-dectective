import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Casebook, { type CasebookLocked } from "@/components/Casebook";
import { CASE_NUMBERS, hasLockedClues, hiddenClueKinds } from "@/data/cases";
import { requestCombineUnlock } from "@/lib/api";
import {
  addUnlockedClue,
  clearProgress,
  heldClues,
  parseUnlockRecord,
  readProgress,
  readUnlockRecord,
  writeProgress,
  writeUnlockRecord,
  type LoadedCase,
} from "@/lib/game";
import type { Progress, UnlockedClue } from "@/lib/types";
import { createCombiner, pairKey, remainingSlots, type UnlockKind, type UnlockRecord } from "@/lib/unlocker";
import type { UnlockData } from "@/server/locked";
import { createRateLimiter } from "@/server/rate-limit";
import { createUnlockHandler } from "@/server/unlock";
import { CASE99_CLUES, CASE99_ID, CASE99_LOCKED, case99LockedClues, case99Public, case99Rules } from "./fixtures/case99";

const { redSock, blueSock, rubberDuck } = CASE99_CLUES;
const { confessionNote, matchingPair } = CASE99_LOCKED;
const strip = ({ id, name, found_description, icon_image_url }: UnlockedClue) => ({ id, name, found_description, icon_image_url });
const pair = strip(case99LockedClues[1]);
const data: UnlockData = { rules: case99Rules, lockedClues: case99LockedClues.map(strip) };
// Case 99's public summary, as a switched-on case would have it in src/data/cases.ts.
const SUMMARY: UnlockKind[] = ["confront", "combine"];
const bundle: LoadedCase = { ...case99Public, source: "local" };

// The real /api/unlock code, fed Case 99 through injected data, standing in for the network.
function mockRoute({ limit = 1000 } = {}) {
  const handler = createUnlockHandler({
    loadUnlockData: async (id) => (id === CASE99_ID ? data : null),
    limiter: createRateLimiter({ limit, windowMs: 60_000 }),
  });
  const fetchImpl = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) =>
    handler(new Request(`http://localhost${url}`, { ...init, headers: { ...init?.headers, "x-forwarded-for": "1.2.3.4" } })),
  );
  return fetchImpl as unknown as typeof fetch & ReturnType<typeof vi.fn>;
}

function combinerWith(fetchImpl: typeof fetch, { enabled = true, held = [] as string[] } = {}) {
  const unlocked: { clue: UnlockedClue; from: readonly [string, string] }[] = [];
  const combiner = createCombiner({
    enabled,
    request: (clueIds, h) => requestCombineUnlock(CASE99_ID, clueIds, h, { fetchImpl }),
    heldUnlockedIds: () => [...held, ...unlocked.map((u) => u.clue.id)],
    onUnlocked: (clue, from) => unlocked.push({ clue, from }),
  });
  return { combiner, unlocked };
}

describe("the public summary and switch", () => {
  it("is off, with no hidden clues, for Cases 1 and 2 and the test case (Case 3 has its own test)", () => {
    for (const n of [...CASE_NUMBERS.filter((n) => n !== 3), 99]) {
      expect(hasLockedClues(n)).toBe(false);
      expect(hiddenClueKinds(n)).toEqual([]);
    }
  });
});

describe("requestCombineUnlock", () => {
  it("returns the clue for a pair that connects, in either order", async () => {
    const fetchImpl = mockRoute();
    expect(await requestCombineUnlock(CASE99_ID, [redSock, blueSock], [], { fetchImpl })).toEqual({ status: "unlocked", clue: pair });
    expect(await requestCombineUnlock(CASE99_ID, [blueSock, redSock], [], { fetchImpl })).toEqual({ status: "unlocked", clue: pair });
    const sent = JSON.parse(String(fetchImpl.mock.calls[0][1].body));
    expect(sent).toEqual({ caseId: CASE99_ID, kind: "combine", clueIds: [redSock, blueSock], unlockedClueIds: [] });
  });

  it("says no-match for a pair that doesn't, and already-unlocked when held", async () => {
    const fetchImpl = mockRoute();
    expect(await requestCombineUnlock(CASE99_ID, [redSock, rubberDuck], [], { fetchImpl })).toEqual({ status: "no-match" });
    expect(await requestCombineUnlock(CASE99_ID, [redSock, blueSock], [matchingPair], { fetchImpl })).toEqual({
      status: "already-unlocked",
    });
  });

  it("says error for a failing call, a 429, a timeout or a bad answer", async () => {
    const failing = (async () => {
      throw new TypeError("Failed to fetch");
    }) as typeof fetch;
    expect(await requestCombineUnlock(CASE99_ID, [redSock, blueSock], [], { fetchImpl: failing })).toEqual({ status: "error" });
    const limited = mockRoute({ limit: 1 });
    await requestCombineUnlock(CASE99_ID, [redSock, rubberDuck], [], { fetchImpl: limited });
    expect(await requestCombineUnlock(CASE99_ID, [redSock, blueSock], [], { fetchImpl: limited })).toEqual({ status: "error", reason: "rate-limited" });
    const hangs = ((_u: RequestInfo | URL, init?: RequestInit) =>
      new Promise((_r, reject) => init?.signal?.addEventListener("abort", () => reject(new Error("aborted"))))) as typeof fetch;
    expect(await requestCombineUnlock(CASE99_ID, [redSock, blueSock], [], { fetchImpl: hangs, timeoutMs: 30 })).toEqual({ status: "error" });
    const bad = (async () => Response.json({ status: "unlocked", clue: { id: "nope" } })) as typeof fetch;
    expect(await requestCombineUnlock(CASE99_ID, [redSock, blueSock], [], { fetchImpl: bad })).toEqual({ status: "error" });
  });
});

describe("createCombiner", () => {
  it("unlocks a pair that connects, in either order, and records where it came from", async () => {
    for (const order of [[redSock, blueSock], [blueSock, redSock]] as const) {
      const { combiner, unlocked } = combinerWith(mockRoute());
      expect(await combiner.connect(order[0], order[1])).toEqual({ status: "unlocked", clue: pair });
      expect(unlocked).toEqual([{ clue: pair, from: order }]);
    }
  });

  it("a pair that doesn't connect is remembered and never sent twice, in either order", async () => {
    const fetchImpl = mockRoute();
    const { combiner, unlocked } = combinerWith(fetchImpl);
    expect(await combiner.connect(redSock, rubberDuck)).toEqual({ status: "no-match" });
    expect(combiner.hasTried(rubberDuck, redSock)).toBe(true);
    expect(await combiner.connect(redSock, rubberDuck)).toEqual({ status: "already-tried" });
    expect(await combiner.connect(rubberDuck, redSock)).toEqual({ status: "already-tried" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(unlocked).toEqual([]);
  });

  it("a failing call can be tried again", async () => {
    let fail = true;
    const route = mockRoute();
    const flaky = (async (u: RequestInfo | URL, i?: RequestInit) => {
      if (fail) throw new TypeError("offline");
      return route(u, i);
    }) as typeof fetch;
    const { combiner, unlocked } = combinerWith(flaky);
    expect(await combiner.connect(redSock, blueSock)).toEqual({ status: "error" });
    expect(combiner.hasTried(redSock, blueSock)).toBe(false);
    fail = false;
    expect(await combiner.connect(redSock, blueSock)).toEqual({ status: "unlocked", clue: pair });
    expect(unlocked).toHaveLength(1);
  });

  it("a rate-limited call says error, isn't remembered as tried, and shows nothing", async () => {
    const limited = (async () => Response.json({ error: "Too many tries." }, { status: 429 })) as typeof fetch;
    const { combiner, unlocked } = combinerWith(limited);
    expect(await combiner.connect(redSock, blueSock)).toEqual({ status: "error", reason: "rate-limited" });
    expect(combiner.hasTried(redSock, blueSock)).toBe(false);
    expect(unlocked).toEqual([]);
  });

  it("with the switch off, or the same clue twice, sends nothing", async () => {
    const fetchImpl = mockRoute();
    expect(await combinerWith(fetchImpl, { enabled: false }).combiner.connect(redSock, blueSock)).toEqual({ status: "off" });
    expect(await combinerWith(fetchImpl).combiner.connect(redSock, redSock)).toEqual({ status: "off" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("an already-held clue shows nothing new", async () => {
    const { combiner, unlocked } = combinerWith(mockRoute(), { held: [matchingPair] });
    expect(await combiner.connect(redSock, blueSock)).toEqual({ status: "already-unlocked" });
    expect(unlocked).toEqual([]);
  });

  it("pairKey is the same in either order", () => {
    expect(pairKey(redSock, blueSock)).toBe(pairKey(blueSock, redSock));
    expect(pairKey(redSock, blueSock)).not.toBe(pairKey(redSock, rubberDuck));
  });
});

describe("locked slots", () => {
  it("start as the summary and shrink as clues are unlocked, by kind", () => {
    expect(remainingSlots(SUMMARY, [], {})).toEqual(["confront", "combine"]);
    const record: UnlockRecord = { [matchingPair]: { kind: "combine", from: [redSock, blueSock] } };
    expect(remainingSlots(SUMMARY, [matchingPair], record)).toEqual(["confront"]);
    const both: UnlockRecord = { ...record, [confessionNote]: { kind: "confront" } };
    expect(remainingSlots(SUMMARY, [matchingPair, confessionNote], both)).toEqual([]);
  });

  it("keep the count right when how a clue was found isn't known", () => {
    expect(remainingSlots(SUMMARY, [matchingPair], {})).toHaveLength(1);
    expect(remainingSlots(SUMMARY, [matchingPair, confessionNote, "x", "y"], {})).toEqual([]);
    expect(remainingSlots(SUMMARY, [matchingPair, matchingPair], {})).toHaveLength(1);
  });
});

describe("the unlock record and reloads", () => {
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

  it("a combined clue survives a reload, with its slot gone and its connection kept", async () => {
    // As the game does it: connect, then save progress and the record.
    let progress: Progress = { foundClueIds: [redSock, blueSock], contradictions: [] };
    let record: UnlockRecord = {};
    const fetchImpl = mockRoute();
    const combiner = createCombiner({
      enabled: true,
      request: (ids, held) => requestCombineUnlock(CASE99_ID, ids, held, { fetchImpl }),
      heldUnlockedIds: () => (progress.unlockedClues ?? []).map((u) => u.id),
      onUnlocked: (clue, from) => {
        progress = addUnlockedClue(progress, clue);
        record = { ...record, [clue.id]: { kind: "combine", from } };
        writeProgress(99, progress);
        writeUnlockRecord(99, record);
      },
    });
    await combiner.connect(blueSock, redSock);

    const reloaded = readProgress(99);
    const reloadedRecord = readUnlockRecord(99);
    expect(heldClues(bundle, reloaded).map((c) => c.name)).toEqual(["Test red sock", "Test blue sock", "Test locked matching pair"]);
    expect(remainingSlots(SUMMARY, (reloaded.unlockedClues ?? []).map((c) => c.id), reloadedRecord)).toEqual(["confront"]);
    expect(reloadedRecord).toEqual({ [matchingPair]: { kind: "combine", from: [blueSock, redSock] } });
    // Saved progress keeps its format: the record lives under its own key.
    expect(Object.keys(JSON.parse(store.get("sabi-detective:case-99:progress")!))).toEqual(["foundClueIds", "contradictions", "unlockedClues"]);
  });

  it("Play again clears the record with the progress", () => {
    writeProgress(99, { foundClueIds: [redSock], contradictions: [] });
    writeUnlockRecord(99, { [confessionNote]: { kind: "confront" } });
    clearProgress(99);
    expect(store.size).toBe(0);
  });

  it("ignores anything malformed in the record", () => {
    expect(parseUnlockRecord(null)).toEqual({});
    expect(parseUnlockRecord([])).toEqual({});
    expect(
      parseUnlockRecord({
        "not-a-uuid": { kind: "confront" },
        [confessionNote]: { kind: "confront", extra: 1 },
        [matchingPair]: { kind: "combine", from: [redSock, blueSock] },
        [redSock]: { kind: "combine", from: [blueSock, blueSock] },
        [blueSock]: { kind: "combine" },
        [rubberDuck]: { kind: "magic" },
      }),
    ).toEqual({
      [confessionNote]: { kind: "confront" },
      [matchingPair]: { kind: "combine", from: [redSock, blueSock] },
    });
  });
});

describe("the Casebook", () => {
  const progress: Progress = {
    foundClueIds: [redSock, blueSock, matchingPair],
    contradictions: [],
    unlockedClues: [pair],
  };
  const locked: CasebookLocked = {
    onConnect: async () => ({ status: "off" }),
    triedPairs: [],
    connections: [{ clueId: matchingPair, from: [redSock, blueSock] }],
    slots: ["confront"],
  };
  const render = (props: Partial<Parameters<typeof Casebook>[0]>) =>
    renderToStaticMarkup(createElement(Casebook, { bundle, art: null, progress, ...props }));

  it("with the switch on: Connect evidence, connected links and the remaining slots", () => {
    const html = render({ locked });
    expect(html).toContain("Connect evidence");
    expect(html.match(/🔗 Connected: revealed Test locked matching pair/g)).toHaveLength(2);
    expect(html).toContain("Hidden evidence (1 left)");
    expect(html).toContain("Revealed by questioning");
    expect(html).not.toContain("Revealed by connecting clues");
    // Slots never show a locked clue's content.
    expect(html).not.toContain("Test locked confession note");
  });

  it("with the switch off: no button, no slots, no links", () => {
    const html = render({});
    expect(html).not.toContain("Connect evidence");
    expect(html).not.toContain("Hidden evidence");
    expect(html).not.toContain("Connected:");
  });

  it("needs two clues before offering to connect", () => {
    const one: Progress = { foundClueIds: [redSock], contradictions: [] };
    expect(render({ progress: one, locked })).not.toContain("Connect evidence");
  });
});
