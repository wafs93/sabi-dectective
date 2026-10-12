import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CASE_NUMBERS, hasLockedClues } from "@/data/cases";
import { requestConfrontAnswer, requestConfrontUnlock } from "@/lib/api";
import { addUnlockedClue, heldClues, readProgress, writeProgress, type LoadedCase } from "@/lib/game";
import type { Progress, UnlockedClue } from "@/lib/types";
import { createUnlocker } from "@/lib/unlocker";
import type { UnlockData } from "@/server/locked";
import { createRateLimiter } from "@/server/rate-limit";
import { createUnlockHandler } from "@/server/unlock";
import { CASE99_CLUES, CASE99_ID, CASE99_LOCKED, CASE99_SUSPECTS, case99LockedClues, case99Public, case99Rules } from "./fixtures/case99";

const { alpha, beta } = CASE99_SUSPECTS;
const { redSock, rubberDuck } = CASE99_CLUES;
const { confessionNote } = CASE99_LOCKED;
const note: UnlockedClue = (({ id, name, found_description, icon_image_url }) => ({ id, name, found_description, icon_image_url }))(
  case99LockedClues[0],
);
const data: UnlockData = {
  rules: case99Rules,
  lockedClues: case99LockedClues.map(({ id, name, found_description, icon_image_url }) => ({ id, name, found_description, icon_image_url })),
};

// The real /api/unlock code, fed Case 99 through injected data, standing in for the network.
function mockRoute({ limit = 1000 } = {}) {
  const handler = createUnlockHandler({
    loadUnlockData: async (id) => (id === CASE99_ID ? data : null),
    limiter: createRateLimiter({ limit, windowMs: 60_000 }),
  });
  const calls: unknown[] = [];
  const fetchImpl = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    calls.push(JSON.parse(String(init?.body)));
    return handler(new Request(`http://localhost${url}`, { ...init, headers: { ...init?.headers, "x-forwarded-for": "1.2.3.4" } }));
  }) as unknown as typeof fetch;
  return { fetchImpl, calls, fetchMock: fetchImpl as unknown as ReturnType<typeof vi.fn> };
}
const ask = (fetchImpl: typeof fetch, suspectId: string, clueId: string, held: string[] = []) =>
  requestConfrontUnlock(CASE99_ID, suspectId, clueId, held, { fetchImpl });

describe("the per-case switch", () => {
  it("is off for every real case, and for anything unknown", () => {
    for (const n of [...CASE_NUMBERS, 0, 99, Number.NaN]) expect(hasLockedClues(n)).toBe(false);
  });
});

describe("requestConfrontUnlock (talking to /api/unlock)", () => {
  it("a confront that unlocks returns the clue, after sending the right request", async () => {
    const { fetchImpl, calls } = mockRoute();
    expect(await ask(fetchImpl, alpha, rubberDuck, [])).toEqual(note);
    expect(calls).toEqual([{ caseId: CASE99_ID, kind: "confront", suspectId: alpha, clueId: rubberDuck, unlockedClueIds: [] }]);
  });

  it("a confront that doesn't unlock returns null", async () => {
    const { fetchImpl } = mockRoute();
    expect(await ask(fetchImpl, beta, rubberDuck)).toBeNull();
    expect(await ask(fetchImpl, alpha, redSock)).toBeNull();
  });

  it("an already-unlocked clue returns null and sends the held ids", async () => {
    const { fetchImpl, calls } = mockRoute();
    expect(await ask(fetchImpl, alpha, rubberDuck, [confessionNote])).toBeNull();
    expect((calls[0] as { unlockedClueIds: string[] }).unlockedClueIds).toEqual([confessionNote]);
  });

  it("a case with no unlocks returns null", async () => {
    const { fetchImpl } = mockRoute();
    const r = await requestConfrontUnlock("11111111-1111-4111-8111-000000000001", alpha, rubberDuck, [], {
      fetchImpl: (async () => Response.json({ status: "no-unlocks", message: "No unlocks for this case." })) as typeof fetch,
    });
    expect(r).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("a failing call returns null and never throws", async () => {
    const failing = (async () => {
      throw new TypeError("Failed to fetch");
    }) as typeof fetch;
    await expect(ask(failing, alpha, rubberDuck)).resolves.toBeNull();
    const broken = (async () => new Response("not json", { status: 200 })) as typeof fetch;
    await expect(ask(broken, alpha, rubberDuck)).resolves.toBeNull();
    const down = (async () => Response.json({ error: "x" }, { status: 503 })) as typeof fetch;
    await expect(ask(down, alpha, rubberDuck)).resolves.toBeNull();
  });

  it("a rate-limited call returns null", async () => {
    const { fetchImpl } = mockRoute({ limit: 1 });
    expect(await ask(fetchImpl, beta, rubberDuck)).toBeNull(); // uses up the one try
    expect(await ask(fetchImpl, alpha, rubberDuck)).toBeNull(); // 429, even though it would match
  });

  it("gives up after the timeout and returns null", async () => {
    const hangs = ((_url: RequestInfo | URL, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
      })) as typeof fetch;
    const started = Date.now();
    expect(await requestConfrontUnlock(CASE99_ID, alpha, rubberDuck, [], { fetchImpl: hangs, timeoutMs: 30 })).toBeNull();
    expect(Date.now() - started).toBeLessThan(1000);
  });

  it("ignores an answer whose clue doesn't pass the saved-progress checks", async () => {
    const bad = (async () =>
      Response.json({ status: "unlocked", clue: { ...note, icon_image_url: "https://evil.example/x.jpg" } })) as typeof fetch;
    expect(await ask(bad, alpha, rubberDuck)).toBeNull();
  });
});

describe("createUnlocker (when to ask)", () => {
  const unlockerWith = (fetchImpl: typeof fetch, { enabled = true, held = [] as string[] } = {}) => {
    const unlocked: UnlockedClue[] = [];
    const unlocker = createUnlocker({
      enabled,
      request: (s, c, h) => requestConfrontAnswer(CASE99_ID, s, c, h, { fetchImpl }),
      heldUnlockedIds: () => [...held, ...unlocked.map((u) => u.id)],
      onUnlocked: (clue) => unlocked.push(clue),
    });
    return { unlocker, unlocked };
  };

  it("with the switch off, makes no call at all", async () => {
    const { fetchImpl, fetchMock } = mockRoute();
    const { unlocker, unlocked } = unlockerWith(fetchImpl, { enabled: false });
    expect(await unlocker.attempt(alpha, rubberDuck)).toEqual({ status: "nothing" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(unlocked).toEqual([]);
  });

  it("unlocks once, then never asks about the same confront again", async () => {
    const { fetchImpl, fetchMock } = mockRoute();
    const { unlocker, unlocked } = unlockerWith(fetchImpl);
    expect(await unlocker.attempt(alpha, rubberDuck)).toEqual({ status: "unlocked", clue: note });
    expect(await unlocker.attempt(alpha, rubberDuck)).toEqual({ status: "nothing" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(unlocked).toEqual([note]);
  });

  it("asks once per suspect and clue pair", async () => {
    const { fetchImpl, fetchMock } = mockRoute();
    const { unlocker } = unlockerWith(fetchImpl);
    await unlocker.attempt(beta, rubberDuck);
    await unlocker.attempt(beta, rubberDuck);
    await unlocker.attempt(alpha, rubberDuck);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shows nothing for a clue the player already holds", async () => {
    const { fetchImpl } = mockRoute();
    const { unlocker, unlocked } = unlockerWith(fetchImpl, { held: [confessionNote] });
    expect(await unlocker.attempt(alpha, rubberDuck)).toEqual({ status: "nothing" });
    expect(unlocked).toEqual([]);
  });

  it("a failing or rate-limited call reveals nothing and reports an error the player can retry", async () => {
    const failing = (async () => {
      throw new Error("offline");
    }) as typeof fetch;
    const a = unlockerWith(failing);
    expect(await a.unlocker.attempt(alpha, rubberDuck)).toEqual({ status: "error" });
    expect(a.unlocked).toEqual([]);
    const limited = (async () => Response.json({ error: "x" }, { status: 429 })) as typeof fetch;
    const b = unlockerWith(limited);
    expect(await b.unlocker.attempt(alpha, rubberDuck)).toEqual({ status: "error", reason: "rate-limited" });
    expect(b.unlocked).toEqual([]);
  });

  it("a request function that throws is caught", async () => {
    const unlocker = createUnlocker({
      enabled: true,
      request: async () => {
        throw new Error("boom");
      },
      heldUnlockedIds: () => [],
      onUnlocked: () => {
        throw new Error("must not be called");
      },
    });
    await expect(unlocker.attempt(alpha, rubberDuck)).resolves.toEqual({ status: "error" });
  });
});

describe("an unlocked clue in saved progress", () => {
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

  it("addUnlockedClue adds it to both lists, once", () => {
    const start: Progress = { foundClueIds: [rubberDuck], contradictions: [] };
    const once = addUnlockedClue(start, note);
    expect(once).toEqual({ foundClueIds: [rubberDuck, confessionNote], contradictions: [], unlockedClues: [note] });
    expect(addUnlockedClue(once, note)).toBe(once);
    expect(start).toEqual({ foundClueIds: [rubberDuck], contradictions: [] });
  });

  it("survives a reload, the way the game saves it", async () => {
    // As the game does it: unlock from a confront, then update and save progress.
    const { fetchImpl } = mockRoute();
    let progress: Progress = { foundClueIds: [rubberDuck], contradictions: [] };
    const unlocker = createUnlocker({
      enabled: true,
      request: (s, c, h) => requestConfrontAnswer(CASE99_ID, s, c, h, { fetchImpl }),
      heldUnlockedIds: () => (progress.unlockedClues ?? []).map((u) => u.id),
      onUnlocked: (clue) => {
        progress = addUnlockedClue(progress, clue);
        writeProgress(99, progress);
      },
    });
    await unlocker.attempt(alpha, rubberDuck);

    // Reload: read it back and build the evidence list the screens show.
    const reloaded = readProgress(99);
    expect(reloaded.unlockedClues).toEqual([note]);
    expect(reloaded.foundClueIds).toContain(confessionNote);
    const bundle: LoadedCase = { ...case99Public, source: "local" };
    expect(heldClues(bundle, reloaded).map((c) => c.name)).toEqual(["Test rubber duck", "Test locked confession note"]);
  });
});
