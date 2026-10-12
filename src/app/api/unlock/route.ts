import { loadUnlockData } from "@/server/locked";
import { createRateLimiter } from "@/server/rate-limit";
import { createUnlockHandler } from "@/server/unlock";
import { createGuessGuard } from "@/server/unlocks";

export const POST = createUnlockHandler({
  loadUnlockData,
  limiter: createRateLimiter({ limit: 30, windowMs: 60_000 }),
  // 10 wrong attempts in 10 minutes: a cooldown of 2, 4, 8... up to 30 minutes.
  guard: createGuessGuard(),
});
