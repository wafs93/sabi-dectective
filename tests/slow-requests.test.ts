import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { REQUEST_TIMEOUT_MS, requestCombineUnlock, requestConfrontAnswer, submitAccusation } from "@/lib/api";
import { addUnlockedClue } from "@/lib/game";
import {
  SLOW_CONNECTION,
  STILL_WORKING,
  STILL_WORKING_AFTER_MS,
  createSingleFlight,
  withStillWorking,
} from "@/lib/slow-request";
import type { Progress, UnlockedClue } from "@/lib/types";
import { createCombiner, createUnlocker } from "@/lib/unlocker";
import { CASE99_CLUES, CASE99_ID, CASE99_LOCKED, CASE99_SUSPECTS, case99LockedClues } from "./fixtures/case99";

const { alpha } = CASE99_SUSPECTS;
const { redSock, rubberDuck } = CASE99_CLUES;
const note: UnlockedClue = (({ id, name, found_description, icon_image_url }) => ({ id, name, found_description, icon_image_url }))(
  case99LockedClues[0],
);
const unlockedReply = { status: "unlocked", clue: note };
const verdict = { outcome: "cracked", title: "Case Cracked", explanation: "x", feedback: [] };

// A fetch that answers after `ms`, or fails like a real one when its request is aborted.
function slowFetch(ms: number, body: unknown) {
  const fetchMock = vi.fn(
    (_url: unknown, init?: RequestInit) =>
      new Promise<Response>((resolve, reject) => {
        const timer = setTimeout(() => resolve(Response.json(body)), ms);
        init?.signal?.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(new DOMException("The operation was aborted.", "AbortError"));
        });
      }),
  );
  return { fetchImpl: fetchMock as unknown as typeof fetch, fetchMock };
}

// Lets pending promises settle while the fake clock moves on.
const advance = (ms: number) => vi.advanceTimersByTimeAsync(ms);

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("timeouts", () => {
  it("wait 20 seconds for /api/unlock and /api/accuse", () => {
    expect(REQUEST_TIMEOUT_MS).toBe(20_000);
  });
});

describe("Still working... after 3 seconds", () => {
  it("is not shown for a reply within 3 seconds", async () => {
    const onSlow = vi.fn();
    const p = withStillWorking(new Promise((r) => setTimeout(() => r("ok"), STILL_WORKING_AFTER_MS - 100)), onSlow);
    await advance(STILL_WORKING_AFTER_MS + 1000);
    expect(await p).toBe("ok");
    expect(onSlow).not.toHaveBeenCalled();
  });

  it("is shown once the request has waited 3 seconds, and the reply still arrives", async () => {
    const onSlow = vi.fn();
    const p = withStillWorking(new Promise((r) => setTimeout(() => r("ok"), 15_000)), onSlow);
    await advance(STILL_WORKING_AFTER_MS - 1);
    expect(onSlow).not.toHaveBeenCalled();
    await advance(1);
    expect(onSlow).toHaveBeenCalledTimes(1);
    await advance(12_000);
    expect(await p).toBe("ok");
    expect(onSlow).toHaveBeenCalledTimes(1);
    expect(STILL_WORKING).toBe("Still working...");
  });
});

describe("a slow reply under 20 seconds succeeds", () => {
  it("confront unlock", async () => {
    const { fetchImpl } = slowFetch(15_000, unlockedReply);
    const p = requestConfrontAnswer(CASE99_ID, alpha, rubberDuck, [], { fetchImpl });
    await advance(15_000);
    expect(await p).toEqual({ status: "unlocked", clue: note });
  });

  it("combine unlock", async () => {
    const { fetchImpl } = slowFetch(19_000, unlockedReply);
    const p = requestCombineUnlock(CASE99_ID, [redSock, rubberDuck], [], { fetchImpl });
    await advance(19_000);
    expect(await p).toEqual({ status: "unlocked", clue: note });
  });

  it("accusation", async () => {
    const { fetchImpl } = slowFetch(19_000, verdict);
    const p = submitAccusation(CASE99_ID, { suspectId: alpha, citedClueIds: [rubberDuck] }, { fetchImpl });
    await advance(19_000);
    expect(await p).toEqual({ ok: true, result: verdict });
  });
});

describe("a reply over 20 seconds shows the retry message", () => {
  it("confront: the unlocker reports an error, and the screen offers the retry", async () => {
    const { fetchImpl } = slowFetch(25_000, unlockedReply);
    const unlocked: UnlockedClue[] = [];
    const unlocker = createUnlocker({
      enabled: true,
      request: (s, c, h) => requestConfrontAnswer(CASE99_ID, s, c, h, { fetchImpl }),
      heldUnlockedIds: () => unlocked.map((u) => u.id),
      onUnlocked: (clue) => unlocked.push(clue),
    });
    const p = unlocker.attempt(alpha, rubberDuck);
    await advance(REQUEST_TIMEOUT_MS);
    expect(await p).toEqual({ status: "error" });
    expect(unlocked).toEqual([]);
    expect(SLOW_CONNECTION).toBe("Slow connection. Tap to try again.");
  });

  it("combine: the pair is not marked as tried, so it can be sent again", async () => {
    const { fetchImpl } = slowFetch(25_000, unlockedReply);
    const combiner = createCombiner({
      enabled: true,
      request: (pair, held) => requestCombineUnlock(CASE99_ID, pair, held, { fetchImpl }),
      heldUnlockedIds: () => [],
      onUnlocked: () => {},
    });
    const p = combiner.connect(redSock, rubberDuck);
    await advance(REQUEST_TIMEOUT_MS);
    expect(await p).toEqual({ status: "error" });
    expect(combiner.hasTried(redSock, rubberDuck)).toBe(false);
  });

  it("accusation: says Slow connection. Tap to try again. and marks it retryable", async () => {
    const { fetchImpl } = slowFetch(25_000, verdict);
    const p = submitAccusation(CASE99_ID, { suspectId: alpha, citedClueIds: [rubberDuck] }, { fetchImpl });
    await advance(REQUEST_TIMEOUT_MS);
    expect(await p).toEqual({ ok: false, message: SLOW_CONNECTION, retry: true });
  });
});

describe("retrying never unlocks the same clue twice", () => {
  it("a confront that timed out can be retried; once answered it is never sent again", async () => {
    let progress: Progress = { foundClueIds: [rubberDuck], contradictions: [] };
    let delay = 25_000;
    const fetchMock = vi.fn((_u: unknown, init?: RequestInit) => slowFetch(delay, unlockedReply).fetchImpl(_u as string, init));
    const onUnlocked = vi.fn((clue: UnlockedClue) => {
      progress = addUnlockedClue(progress, clue);
    });
    const unlocker = createUnlocker({
      enabled: true,
      request: (s, c, h) => requestConfrontAnswer(CASE99_ID, s, c, h, { fetchImpl: fetchMock as unknown as typeof fetch }),
      heldUnlockedIds: () => (progress.unlockedClues ?? []).map((u) => u.id),
      onUnlocked,
    });
    const first = unlocker.attempt(alpha, rubberDuck);
    await advance(REQUEST_TIMEOUT_MS);
    expect(await first).toEqual({ status: "error" });

    delay = 1000;
    const retry = unlocker.attempt(alpha, rubberDuck);
    await advance(1000);
    expect(await retry).toEqual({ status: "unlocked", clue: note });
    expect(await unlocker.attempt(alpha, rubberDuck)).toEqual({ status: "nothing" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(onUnlocked).toHaveBeenCalledTimes(1);
    expect(progress.unlockedClues).toEqual([note]);
    expect(progress.foundClueIds.filter((id) => id === CASE99_LOCKED.confessionNote)).toHaveLength(1);
  });

  it("a late reply for a clue already held adds nothing", async () => {
    const { fetchImpl } = slowFetch(1000, unlockedReply);
    const onUnlocked = vi.fn();
    const combiner = createCombiner({
      enabled: true,
      request: (pair, held) => requestCombineUnlock(CASE99_ID, pair, held, { fetchImpl }),
      heldUnlockedIds: () => [note.id],
      onUnlocked,
    });
    const p = combiner.connect(redSock, rubberDuck);
    await advance(1000);
    expect(await p).toEqual({ status: "already-unlocked" });
    expect(onUnlocked).not.toHaveBeenCalled();
  });
});

describe("a double tap sends one request", () => {
  it("confront: the second tap while the first is out sends nothing", async () => {
    const { fetchImpl, fetchMock } = slowFetch(5000, unlockedReply);
    const unlocker = createUnlocker({
      enabled: true,
      request: (s, c, h) => requestConfrontAnswer(CASE99_ID, s, c, h, { fetchImpl }),
      heldUnlockedIds: () => [],
      onUnlocked: () => {},
    });
    const a = unlocker.attempt(alpha, rubberDuck);
    const b = unlocker.attempt(alpha, rubberDuck);
    expect(await b).toEqual({ status: "busy" });
    await advance(5000);
    expect(await a).toEqual({ status: "unlocked", clue: note });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("Connect: two taps before the screen updates send one request", async () => {
    const { fetchImpl, fetchMock } = slowFetch(5000, unlockedReply);
    const combiner = createCombiner({
      enabled: true,
      request: (pair, held) => requestCombineUnlock(CASE99_ID, pair, held, { fetchImpl }),
      heldUnlockedIds: () => [],
      onUnlocked: () => {},
    });
    // The Casebook guards its Connect button with a single flight, as here.
    const flight = createSingleFlight();
    const tap = () => flight.run(() => combiner.connect(redSock, rubberDuck));
    const [first, second] = [tap(), tap()];
    expect(await second).toEqual({ sent: false });
    await advance(5000);
    expect(await first).toEqual({ sent: true, value: { status: "unlocked", clue: note } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    // Free again afterwards.
    expect(flight.isBusy()).toBe(false);
  });

  it("Submit accusation: two taps send one request", async () => {
    const { fetchImpl, fetchMock } = slowFetch(5000, verdict);
    const flight = createSingleFlight();
    const tap = () => flight.run(() => submitAccusation(CASE99_ID, { suspectId: alpha, citedClueIds: [rubberDuck] }, { fetchImpl }));
    const [first, second] = [tap(), tap()];
    expect(await second).toEqual({ sent: false });
    await advance(5000);
    expect(await first).toEqual({ sent: true, value: { ok: true, result: verdict } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
