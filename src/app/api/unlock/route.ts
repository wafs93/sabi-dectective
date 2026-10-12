import { loadUnlockData } from "@/server/locked";
import { createRateLimiter } from "@/server/rate-limit";
import { createUnlockHandler } from "@/server/unlock";
import { createGuessGuard } from "@/server/unlocks";

export const POST = createUnlockHandler({
  loadUnlockData,
  limiter: createRateLimiter({ limit: 30, windowMs: 60_000 }),
  // 25 wrong attempts in 10 minutes: a cooldown of 1, 2, 4, 8, then 15 minutes at most.
  guard: createGuessGuard(),
});
