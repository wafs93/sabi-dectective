import { loadUnlockData } from "@/server/locked";
import { createRateLimiter } from "@/server/rate-limit";
import { createUnlockHandler } from "@/server/unlock";

export const POST = createUnlockHandler({
  loadUnlockData,
  limiter: createRateLimiter({ limit: 30, windowMs: 60_000 }),
});
