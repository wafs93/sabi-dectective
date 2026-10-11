import { afterEach, describe, expect, it, vi } from "vitest";
import { MAX_UNLOCKED_CLUES as PROGRESS_MAX } from "@/lib/game";
import { isMissingTable, rulesFromRows, type UnlockData } from "@/server/locked";
import { createRateLimiter } from "@/server/rate-limit";
import { createUnlockHandler, MAX_BODY_BYTES, MAX_UNLOCKED_CLUES, parseUnlockRequest } from "@/server/unlock";
import { CASE_ID as CASE1_ID } from "./fixtures";
import {
  CASE99_CLUES,
  CASE99_ID,
  CASE99_LOCKED,
  CASE99_SUSPECTS,
  case99LockedClues,
  case99Rules,
} from "./fixtures/case99";

const { alpha, beta } = CASE99_SUSPECTS;
const { redSock, blueSock, rubberDuck } = CASE99_CLUES;
const { confessionNote, matchingPair } = CASE99_LOCKED;
const UNKNOWN_CASE = "11111111-1111-4111-8111-0000000000ff";

const case99Data: UnlockData = {
  rules: case99Rules,
  lockedClues: case99LockedClues.map(({ id, name, found_description, icon_image_url }) => ({
    id,
    name,
    found_description,
    icon_image_url,
  })),
};
// Case 1 has no locked clues: no rules, no content.
const loadUnlockData = async (id: string): Promise<UnlockData | null> =>
  id === CASE99_ID ? case99Data : id === CASE1_ID ? { rules: [], lockedClues: [] } : null;

const handler = (overrides: Partial<Parameters<typeof createUnlockHandler>[0]> = {}) =>
  createUnlockHandler({
    loadUnlockData,
    limiter: createRateLimiter({ limit: 1000, windowMs: 60_000 }),
    ...overrides,
  });

const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("http://localhost/api/unlock", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "1.2.3.4", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const confront = (suspectId: string, clueId: string, extra = {}) => ({
  caseId: CASE99_ID,
  kind: "confront",
  suspectId,
  clueId,
  ...extra,
});
const combine = (a: string, b: string, extra = {}) => ({ caseId: CASE99_ID, kind: "combine", clueIds: [a, b], ...extra });

async function call(body: unknown, h = handler()) {
  const res = await h(post(body));
  const text = await res.text();
  return { status: res.status, text, json: JSON.parse(text), res };
}

// Nothing about the rules or any other locked clue may come back.
function expectNothingExtra(text: string, allowedLockedId?: string) {
  for (const c of case99LockedClues) {
    if (c.id === allowedLockedId) continue;
    expect(text).not.toContain(c.id);
    expect(text).not.toContain(c.name);
    expect(text).not.toContain(c.found_description);
  }
  // Only these fields may appear anywhere in a response: no rules, sources, kinds or counts.
  const keys = new Set<string>();
  const collect = (v: unknown): void => {
    if (Array.isArray(v)) v.forEach(collect);
    else if (v && typeof v === "object") {
      for (const [k, inner] of Object.entries(v)) {
        keys.add(k);
        collect(inner);
      }
    }
  };
  collect(JSON.parse(text));
  const allowed = ["status", "message", "clue", "clueId", "id", "name", "found_description", "icon_image_url"];
  for (const k of keys) expect(allowed).toContain(k);
  for (const id of [...Object.values(CASE99_SUSPECTS), ...Object.values(CASE99_CLUES)]) {
    expect(text).not.toContain(id);
  }
}

afterEach(() => vi.restoreAllMocks());

describe("POST /api/unlock: unlocking", () => {
  it("a matching confront returns just that clue", async () => {
    const r = await call(confront(alpha, rubberDuck));
    expect(r.status).toBe(200);
    expect(r.res.headers.get("cache-control")).toBe("no-store");
    expect(r.json).toEqual({ status: "unlocked", clue: case99Data.lockedClues[0] });
    expect(Object.keys(r.json.clue).sort()).toEqual(["found_description", "icon_image_url", "id", "name"]);
    expectNothingExtra(r.text, confessionNote);
  });

  it("a matching combine returns just that clue, in either order", async () => {
    for (const body of [combine(redSock, blueSock), combine(blueSock, redSock)]) {
      const r = await call(body);
      expect(r.json).toEqual({ status: "unlocked", clue: case99Data.lockedClues[1] });
      expectNothingExtra(r.text, matchingPair);
    }
  });

  it("accepts upper-case ids", async () => {
    const r = await call(confront(alpha.toUpperCase(), rubberDuck.toUpperCase()));
    expect(r.json.status).toBe("unlocked");
  });

  it.each([
    ["the wrong suspect", confront(beta, rubberDuck)],
    ["the wrong clue", confront(alpha, redSock)],
    ["a combine rule's clue as a confront", confront(alpha, blueSock)],
    ["clues that don't belong together", combine(redSock, rubberDuck)],
    ["a clue with itself", combine(redSock, redSock)],
    ["unknown ids", combine("33333333-3333-4333-8333-0000000000aa", blueSock)],
    ["a suspect from another case", confront("22222222-2222-4222-8222-000000000001", rubberDuck)],
  ])("%s gets the same plain no, with no hint", async (_label, body) => {
    const r = await call(body);
    expect(r.status).toBe(200);
    expect(r.json).toEqual({ status: "no-match", message: "These don't connect." });
    expectNothingExtra(r.text);
  });

  it("reports an already-unlocked clue by id only", async () => {
    const r = await call(confront(alpha, rubberDuck, { unlockedClueIds: [confessionNote] }));
    expect(r.json).toEqual({ status: "already-unlocked", clueId: confessionNote });
    const c = await call(combine(blueSock, redSock, { unlockedClueIds: [matchingPair.toUpperCase()] }));
    expect(c.json).toEqual({ status: "already-unlocked", clueId: matchingPair });
    expectNothingExtra(c.text, matchingPair);
  });

  it("holding one locked clue doesn't affect the other", async () => {
    const r = await call(combine(redSock, blueSock, { unlockedClueIds: [confessionNote] }));
    expect(r.json.status).toBe("unlocked");
  });

  it("a case with no locked clues says so, for any valid attempt", async () => {
    for (const body of [
      { caseId: CASE1_ID, kind: "confront", suspectId: alpha, clueId: rubberDuck },
      { caseId: CASE1_ID, kind: "combine", clueIds: [redSock, blueSock] },
    ]) {
      const r = await call(body);
      expect(r.status).toBe(200);
      expect(r.json).toEqual({ status: "no-unlocks", message: "No unlocks for this case." });
    }
  });

  it("404 for an unknown case", async () => {
    const r = await call({ ...confront(alpha, rubberDuck), caseId: UNKNOWN_CASE });
    expect(r.status).toBe(404);
  });

  it("a rule whose locked clue is missing gets the plain no, and is logged", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const broken = async () => ({ rules: case99Rules, lockedClues: [] });
    const r = await call(confront(alpha, rubberDuck), handler({ loadUnlockData: broken }));
    expect(r.json.status).toBe("no-match");
    expect(log).toHaveBeenCalled();
  });
});

describe("POST /api/unlock: validation", () => {
  const valid = confront(alpha, rubberDuck);
  it.each([
    ["not JSON", "{oops"],
    ["a JSON array", "[]"],
    ["JSON null", "null"],
    ["missing caseId", { kind: "confront", suspectId: alpha, clueId: rubberDuck }],
    ["caseId not a uuid", { ...valid, caseId: "case-99" }],
    ["missing kind", { caseId: CASE99_ID, suspectId: alpha, clueId: rubberDuck }],
    ["an unknown kind", { ...valid, kind: "guess" }],
    ["confront without a suspect", { caseId: CASE99_ID, kind: "confront", clueId: rubberDuck }],
    ["confront with a non-uuid suspect", { ...valid, suspectId: "Alpha" }],
    ["confront with a non-uuid clue", { ...valid, clueId: 7 }],
    ["combine without clueIds", { caseId: CASE99_ID, kind: "combine" }],
    ["combine with one clue", { caseId: CASE99_ID, kind: "combine", clueIds: [redSock] }],
    ["combine with three clues", { caseId: CASE99_ID, kind: "combine", clueIds: [redSock, blueSock, rubberDuck] }],
    ["combine with a non-uuid clue", combine(redSock, "blue sock")],
    ["unlockedClueIds not an array", { ...valid, unlockedClueIds: confessionNote }],
    ["unlockedClueIds with a non-uuid", { ...valid, unlockedClueIds: ["note"] }],
    ["too many unlockedClueIds", { ...valid, unlockedClueIds: Array(MAX_UNLOCKED_CLUES + 1).fill(confessionNote) }],
  ])("400 for %s", async (_label, body) => {
    const r = await call(body);
    expect(r.status).toBe(400);
    expect(typeof r.json.error).toBe("string");
  });

  it("400 when the body is larger than the limit", async () => {
    const r = await call({ ...valid, padding: "x".repeat(MAX_BODY_BYTES) });
    expect(r.status).toBe(400);
  });

  it("400 when content-length claims a body larger than the limit", async () => {
    const res = await handler()(post(valid, { "content-length": String(MAX_BODY_BYTES + 1) }));
    expect(res.status).toBe(400);
  });

  it("parseUnlockRequest lower-cases ids and de-duplicates the held list", () => {
    expect(parseUnlockRequest({ ...valid, suspectId: alpha.toUpperCase(), unlockedClueIds: [confessionNote, confessionNote.toUpperCase()] })).toEqual({
      ok: true,
      value: { caseId: CASE99_ID, kind: "confront", suspectId: alpha, clueId: rubberDuck, unlockedClueIds: [confessionNote] },
    });
  });

  it("uses the same unlocked-clue cap as saved progress", () => {
    expect(MAX_UNLOCKED_CLUES).toBe(PROGRESS_MAX);
  });
});

describe("POST /api/unlock: errors", () => {
  it("503 without leaking the error when the rules can't be loaded", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await call(
      confront(alpha, rubberDuck),
      handler({
        loadUnlockData: async () => {
          throw new Error("connect failed: key=super-secret-value");
        },
      }),
    );
    expect(r.status).toBe(503);
    expect(r.text).not.toContain("super-secret-value");
  });

  it("500 without leaking anything on an unexpected error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const h = handler({
      limiter: {
        take: () => {
          throw new Error("boom super-secret-value");
        },
      },
    });
    const r = await call(confront(alpha, rubberDuck), h);
    expect(r.status).toBe(500);
    expect(r.text).not.toContain("super-secret-value");
  });

  it("the real route returns 503 (not a crash) when the service key is missing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const { POST } = await import("@/app/api/unlock/route");
    expect((await POST(post(confront(alpha, rubberDuck)))).status).toBe(503);
    vi.unstubAllEnvs();
  });
});

describe("POST /api/unlock: rate limiting", () => {
  it("returns 429 with Retry-After once an IP goes over the limit", async () => {
    const h = handler({ limiter: createRateLimiter({ limit: 3, windowMs: 60_000 }) });
    for (let i = 0; i < 3; i++) expect((await h(post(combine(redSock, rubberDuck)))).status).toBe(200);
    const blocked = await h(post(combine(redSock, blueSock)));
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("retry-after"))).toBeGreaterThan(0);
    // A blocked try never reveals anything.
    expect(await blocked.text()).not.toContain(matchingPair);
    expect((await h(post(combine(redSock, blueSock), { "x-forwarded-for": "5.6.7.8" }))).status).toBe(200);
  });

  it("counts bad requests too", async () => {
    const h = handler({ limiter: createRateLimiter({ limit: 2, windowMs: 60_000 }) });
    await h(post("{bad"));
    await h(post("{bad"));
    expect((await h(post(confront(alpha, rubberDuck)))).status).toBe(429);
  });

  it("the real route allows 30 tries a minute", async () => {
    const src = await import("node:fs").then((fs) => fs.readFileSync("src/app/api/unlock/route.ts", "utf8"));
    expect(src).toContain("createRateLimiter({ limit: 30, windowMs: 60_000 })");
  });
});

describe("loading rules from the private tables", () => {
  it("turns rows into rules and skips rows of the wrong shape", () => {
    expect(
      rulesFromRows([
        { kind: "confront", suspect_id: alpha, source_clue_ids: [rubberDuck], unlocks_clue_id: confessionNote },
        { kind: "combine", suspect_id: null, source_clue_ids: [redSock, blueSock], unlocks_clue_id: matchingPair },
        { kind: "confront", suspect_id: null, source_clue_ids: [rubberDuck], unlocks_clue_id: confessionNote },
        { kind: "confront", suspect_id: alpha, source_clue_ids: [redSock, blueSock], unlocks_clue_id: confessionNote },
        { kind: "combine", suspect_id: null, source_clue_ids: [redSock], unlocks_clue_id: matchingPair },
        { kind: "combine", suspect_id: null, source_clue_ids: [redSock, redSock], unlocks_clue_id: matchingPair },
        { kind: "combine", suspect_id: null, source_clue_ids: null, unlocks_clue_id: matchingPair },
        { kind: "magic", suspect_id: alpha, source_clue_ids: [redSock], unlocks_clue_id: matchingPair },
      ]),
    ).toEqual(case99Rules);
  });

  it("treats a table that doesn't exist yet as no locked clues, and nothing else", () => {
    expect(isMissingTable({ code: "PGRST205" })).toBe(true);
    expect(isMissingTable({ code: "42P01" })).toBe(true);
    expect(isMissingTable({ code: "42501" })).toBe(false);
    expect(isMissingTable({})).toBe(false);
    expect(isMissingTable(null)).toBe(false);
  });
});
