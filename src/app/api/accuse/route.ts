import { createAccuseHandler } from "@/server/accuse";
import { createRateLimiter } from "@/server/rate-limit";
import { loadScoringData } from "@/server/solutions";

export const POST = createAccuseHandler({
  loadScoringData,
  limiter: createRateLimiter({ limit: 10, windowMs: 60_000 }),
});
