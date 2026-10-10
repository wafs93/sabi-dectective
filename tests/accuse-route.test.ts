import { afterEach, describe, expect, it, vi } from "vitest";
import { createAccuseHandler, MAX_BODY_BYTES, parseAccuseRequest } from "@/server/accuse";
import { createRateLimiter } from "@/server/rate-limit";
import {
  BISI,
  CASE_ID,
  CHUKS,
  FOOTPRINT,
  GATE_LOG,
  LEDGER,
  SECRETS,
  scoringData,
} from "./fixtures";

const handler = (overrides: Partial<Parameters<typeof createAccuseHandler>[0]> = {}) =>
  createAccuseHandler({
    loadScoringData: async (id) => (id === CASE_ID ? scoringData : null),
    limiter: createRateLimiter({ limit: 1000, windowMs: 60_000 }),
    ...overrides,
  });

const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("http://localhost/api/accuse", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "1.2.3.4", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const valid = { caseId: CASE_ID, suspectId: CHUKS, clueIds: [LEDGER, FOOTPRINT] };

afterEach(() => vi.restoreAllMocks());

describe("POST /api/accuse: outcomes", () => {
  it.each([
    [{ suspectId: CHUKS, clueIds: [LEDGER, FOOTPRINT] }, "cracked"],
    [{ suspectId: CHUKS, clueIds: [GATE_LOG] }, "close"],
    [{ suspectId: CHUKS, clueIds: [] }, "close"],
    [{ suspectId: BISI, clueIds: [LEDGER, FOOTPRINT] }, "missed"],
  ])("%j -> %s, with no answer data in the response", async (input, outcome) => {
    const res = await handler()(post({ caseId: CASE_ID, ...input }));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const text = await res.text();
    expect(JSON.parse(text).outcome).toBe(outcome);
    for (const secret of SECRETS) expect(text).not.toContain(secret);
  });

  it("missed text uses the accused suspect's name", async () => {
    const res = await handler()(post({ caseId: CASE_ID, suspectId: BISI, clueIds: [] }));
    expect((await res.json()).explanation).toBe("Alhaja Bisi didn't do it.");
  });

  it("dedupes duplicate clue ids and accepts upper-case uuids", async () => {
    const res = await handler()(
      post({ caseId: CASE_ID, suspectId: CHUKS, clueIds: [LEDGER, LEDGER.toUpperCase(), FOOTPRINT] }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).outcome).toBe("cracked");
  });
});

describe("POST /api/accuse: validation", () => {
  it.each([
    ["not JSON", "{oops"],
    ["a JSON array", "[]"],
    ["JSON null", "null"],
    ["missing caseId", { suspectId: CHUKS, clueIds: [] }],
    ["caseId not a uuid", { ...valid, caseId: "case-1" }],
    ["suspectId not a uuid", { ...valid, suspectId: "Chuks" }],
    ["suspectId a number", { ...valid, suspectId: 1 }],
    ["clueIds not an array", { ...valid, clueIds: LEDGER }],
    ["clueIds containing a non-uuid", { ...valid, clueIds: [LEDGER, "Muddy footprint"] }],
    ["clueIds containing a number", { ...valid, clueIds: [42] }],
    ["too many clueIds", { ...valid, clueIds: Array(21).fill(LEDGER) }],
    ["a suspect from another case", { ...valid, suspectId: "22222222-2222-4222-8222-0000000000ff" }],
    ["a clue from another case", { ...valid, clueIds: ["33333333-3333-4333-8333-0000000000ff"] }],
  ])("400 for %s", async (_label, body) => {
    const res = await handler()(post(body));
    expect(res.status).toBe(400);
    expect(typeof (await res.json()).error).toBe("string");
  });

  it("400 when the body is larger than the limit", async () => {
    const big = { ...valid, padding: "x".repeat(MAX_BODY_BYTES) };
    expect((await handler()(post(big))).status).toBe(400);
  });

  it("400 when content-length claims a body larger than the limit", async () => {
    const res = await handler()(post(valid, { "content-length": String(MAX_BODY_BYTES + 1) }));
    expect(res.status).toBe(400);
  });

  it("404 for an unknown case", async () => {
    const res = await handler()(post({ ...valid, caseId: "11111111-1111-4111-8111-0000000000ff" }));
    expect(res.status).toBe(404);
  });

  it("parseAccuseRequest returns lower-cased, de-duplicated ids", () => {
    const r = parseAccuseRequest({ ...valid, clueIds: [LEDGER.toUpperCase(), LEDGER] });
    expect(r).toEqual({ ok: true, value: { ...valid, clueIds: [LEDGER] } });
  });
});

describe("POST /api/accuse: errors", () => {
  it("503 without leaking the error when the answer can't be loaded", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await handler({
      loadScoringData: async () => {
        throw new Error("connect failed: key=super-secret-value");
      },
    })(post(valid));
    expect(res.status).toBe(503);
    const text = await res.text();
    expect(text).not.toContain("super-secret-value");
    expect(text).not.toMatch(/at .*\.ts/);
  });

  it("500 without leaking anything on an unexpected error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await handler({
      limiter: {
        take: () => {
          throw new Error("boom super-secret-value");
        },
      },
    })(post(valid));
    expect(res.status).toBe(500);
    expect(await res.text()).not.toContain("super-secret-value");
  });

  it("the real route returns 503 (not a crash) when the service key is missing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const { POST } = await import("@/app/api/accuse/route");
    const res = await POST(post(valid));
    expect(res.status).toBe(503);
    vi.unstubAllEnvs();
  });
});

describe("rate limiting", () => {
  it("returns 429 with Retry-After once an IP goes over the limit", async () => {
    const h = handler({ limiter: createRateLimiter({ limit: 3, windowMs: 60_000 }) });
    for (let i = 0; i < 3; i++) expect((await h(post(valid))).status).toBe(200);
    const blocked = await h(post(valid));
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("retry-after"))).toBeGreaterThan(0);
    // Another IP is unaffected.
    expect((await h(post(valid, { "x-forwarded-for": "5.6.7.8" }))).status).toBe(200);
  });

  it("counts bad requests too, so invalid spam is also limited", async () => {
    const h = handler({ limiter: createRateLimiter({ limit: 2, windowMs: 60_000 }) });
    await h(post("{bad"));
    await h(post("{bad"));
    expect((await h(post(valid))).status).toBe(429);
  });

  it("allows requests again after the window resets", () => {
    let t = 0;
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: () => t });
    expect(limiter.take("ip").allowed).toBe(true);
    expect(limiter.take("ip").allowed).toBe(false);
    t = 1000;
    expect(limiter.take("ip").allowed).toBe(true);
  });

  it("uses the first x-forwarded-for address as the key", async () => {
    const h = handler({ limiter: createRateLimiter({ limit: 1, windowMs: 60_000 }) });
    expect((await h(post(valid, { "x-forwarded-for": "9.9.9.9, 10.0.0.1" }))).status).toBe(200);
    expect((await h(post(valid, { "x-forwarded-for": "9.9.9.9, 10.0.0.2" }))).status).toBe(429);
  });
});
