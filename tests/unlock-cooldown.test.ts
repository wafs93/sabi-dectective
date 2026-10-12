import { describe, expect, it, vi } from "vitest";
import { requestCombineUnlock } from "@/lib/api";
import { RATE_LIMITED, SERVER_TROUBLE, SLOW_CONNECTION, cooldownMessage, unlockFailureMessage } from "@/lib/slow-request";
import type { UnlockData } from "@/server/locked";
import { createRateLimiter } from "@/server/rate-limit";
import { COOLDOWN_MESSAGE, createUnlockHandler } from "@/server/unlock";
import { createGuessGuard, GUESS_LIMIT } from "@/server/unlocks";
import { CASE99_CLUES, CASE99_ID, CASE99_LOCKED, CASE99_SUSPECTS, case99LockedClues, case99Rules } from "./fixtures/case99";

const { alpha, beta } = CASE99_SUSPECTS;
const { redSock, blueSock, rubberDuck } = CASE99_CLUES;
const MIN = 60_000;

const data: UnlockData = {
  rules: case99Rules,
  lockedClues: case99LockedClues.map(({ id, name, found_description, icon_image_url }) => ({ id, name, found_description, icon_image_url })),
};

// The real route's setup, on a clock the test moves.
function setup() {
  let t = 1_000_000;
  const now = () => t;
  const handler = createUnlockHandler({
    loadUnlockData: async (id) => (id === CASE99_ID ? data : null),
    limiter: createRateLimiter({ limit: 30, windowMs: MIN, now }),
    guard: createGuessGuard({ now }),
  });
  const send = async (body: unknown, ip = "1.2.3.4") => {
    const res = await handler(
      new Request("http://localhost/api/unlock", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": ip },
        body: JSON.stringify(body),
      }),
    );
    const text = await res.text();
    return { status: res.status, text, json: JSON.parse(text), retryAfter: res.headers.get("retry-after") };
  };
  return {
    send,
    // A wrong guess: Beta has nothing to say about the rubber duck.
    wrong: (ip?: string) => send({ caseId: CASE99_ID, kind: "confront", suspectId: beta, clueId: rubberDuck }, ip),
    right: (ip?: string) => send({ caseId: CASE99_ID, kind: "confront", suspectId: alpha, clueId: rubberDuck }, ip),
    rightCombine: (ip?: string) => send({ caseId: CASE99_ID, kind: "combine", clueIds: [redSock, blueSock] }, ip),
    wait: (ms: number) => void (t += ms),
  };
}

// 10 wrong attempts, spaced so the 30 a minute limit never comes into it.
async function guessWrong(s: ReturnType<typeof setup>, n: number, ip?: string) {
  for (let i = 0; i < n; i++) {
    s.wait(5_000);
    const r = await s.wrong(ip);
    expect(r.json.status, `wrong guess ${i + 1}`).toBe("no-match");
  }
}

describe("the guessing cooldown", () => {
  it("after 10 wrong attempts, refuses the next for 2 minutes, even a right one", async () => {
    const s = setup();
    expect(GUESS_LIMIT).toBe(10);
    await guessWrong(s, 10);
    const refused = await s.right();
    expect(refused.status).toBe(429);
    expect(refused.json).toEqual({ status: "cooldown", error: COOLDOWN_MESSAGE, retryAfterSeconds: 120 });
    expect(refused.retryAfter).toBe("120");
    expect((await s.wrong()).status).toBe(429);
    // Other players are not affected.
    expect((await s.right("5.6.7.8")).json.status).toBe("unlocked");
    // Over after 2 minutes.
    s.wait(2 * MIN);
    expect((await s.right()).json.status).toBe("unlocked");
  });

  it("a correct unlock still works under the limit, and does not count as wrong", async () => {
    const s = setup();
    await guessWrong(s, 9);
    const right = await s.right();
    expect(right.status).toBe(200);
    expect(right.json.status).toBe("unlocked");
    expect((await s.rightCombine()).json.status).toBe("unlocked");
    // Still 9 wrong: the 10th wrong one is answered, the one after is refused.
    expect((await s.wrong()).json.status).toBe("no-match");
    expect((await s.right()).status).toBe(429);
  });

  it("a correct unlock does not reset the count", async () => {
    const s = setup();
    await guessWrong(s, 5);
    await s.right();
    await guessWrong(s, 5);
    expect((await s.right()).status).toBe(429);
  });

  it("doubles each time it is hit again: 2, 4, 8, 16, then 30 minutes at most", async () => {
    const s = setup();
    const seen: number[] = [];
    for (let round = 0; round < 6; round++) {
      await guessWrong(s, 10);
      const r = await s.wrong();
      expect(r.status).toBe(429);
      seen.push(r.json.retryAfterSeconds);
      s.wait(r.json.retryAfterSeconds * 1000);
    }
    expect(seen).toEqual([120, 240, 480, 960, 1800, 1800]);
  });

  it("forgets the penalty level after a quiet hour", async () => {
    const s = setup();
    await guessWrong(s, 10);
    s.wait(2 * MIN + 60 * MIN);
    await guessWrong(s, 10);
    expect((await s.wrong()).json.retryAfterSeconds).toBe(120);
  });

  it("the refused reply says nothing about clues, suspects or pairs", async () => {
    const s = setup();
    await guessWrong(s, 10);
    for (const r of [await s.right(), await s.rightCombine(), await s.wrong()]) {
      expect(Object.keys(r.json).sort()).toEqual(["error", "retryAfterSeconds", "status"]);
      const lower = r.text.toLowerCase();
      for (const id of [...Object.values(CASE99_CLUES), ...Object.values(CASE99_LOCKED), ...Object.values(CASE99_SUSPECTS), CASE99_ID]) {
        expect(lower).not.toContain(id);
      }
      for (const c of case99LockedClues) expect(r.text).not.toContain(c.name);
      expect(lower).not.toMatch(/clue|pair|close|suspect|connect|match/);
      // Every refusal reads the same, whatever was tried.
      expect(r.text).toBe(JSON.stringify({ status: "cooldown", error: COOLDOWN_MESSAGE, retryAfterSeconds: r.json.retryAfterSeconds }));
    }
  });

  it("a real player making 9 wrong guesses is never blocked", async () => {
    const s = setup();
    // 9 wrong guesses, with right ones in between.
    for (let i = 0; i < 9; i++) {
      expect((await s.wrong()).status).toBe(200);
      if (i % 3 === 0) expect((await s.rightCombine()).status).toBe(200);
      s.wait(30_000);
    }
    expect((await s.right()).status).toBe(200);
    // Ten minutes on, the old ones no longer count: 9 more are fine too.
    s.wait(10 * MIN);
    await guessWrong(s, 9);
    expect((await s.right()).status).toBe(200);
  });

  it("keeps the existing 30 a minute limit", async () => {
    const s = setup();
    for (let i = 0; i < 30; i++) expect((await s.right()).status).toBe(200);
    const r = await s.right();
    expect(r.status).toBe(429);
    expect(r.json).toEqual({ error: "Too many tries. Wait a minute and try again." });
  });
});

describe("what the player sees", () => {
  const replyWith = (status: number, body: unknown) => {
    const fetchMock = vi.fn(async () => Response.json(body, { status }));
    return { fetchImpl: fetchMock as unknown as typeof fetch, fetchMock };
  };

  it("a cooldown: a calm message with the minutes left, no retry, and no automatic resend", async () => {
    const { fetchImpl, fetchMock } = replyWith(429, { status: "cooldown", error: COOLDOWN_MESSAGE, retryAfterSeconds: 240 });
    const answer = await requestCombineUnlock(CASE99_ID, [redSock, blueSock], [], { fetchImpl });
    expect(answer).toEqual({ status: "error", reason: "cooldown", retryAfterSeconds: 240 });
    expect(unlockFailureMessage(answer as Parameters<typeof unlockFailureMessage>[0])).toEqual({
      text: "Take a breath and look over your evidence. You can try again in 4 minutes.",
      retry: false,
    });
    await new Promise((r) => setTimeout(r, 50));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(cooldownMessage(61)).toBe("Take a breath and look over your evidence. You can try again in 2 minutes.");
    expect(cooldownMessage(45)).toBe("Take a breath and look over your evidence. You can try again in 1 minute.");
  });

  it("each kind of failure has its own wording", async () => {
    const limited = await requestCombineUnlock(CASE99_ID, [redSock, blueSock], [], replyWith(429, { error: "Too many tries." }));
    expect(limited).toEqual({ status: "error", reason: "rate-limited" });
    const server = await requestCombineUnlock(CASE99_ID, [redSock, blueSock], [], replyWith(503, { error: "x" }));
    expect(server).toEqual({ status: "error", reason: "server" });
    const texts = [
      unlockFailureMessage({ status: "error" }),
      unlockFailureMessage({ status: "error", reason: "server" }),
      unlockFailureMessage({ status: "error", reason: "rate-limited" }),
      unlockFailureMessage({ status: "error", reason: "cooldown", retryAfterSeconds: 120 }),
    ];
    expect(texts.map((t) => t.text)).toEqual([SLOW_CONNECTION, SERVER_TROUBLE, RATE_LIMITED, cooldownMessage(120)]);
    expect(new Set(texts.map((t) => t.text)).size).toBe(4);
    // Only a slow connection or a server problem can be tapped to send again.
    expect(texts.map((t) => t.retry)).toEqual([true, true, false, false]);
  });
});
