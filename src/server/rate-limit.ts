import "server-only";

// Fixed-window limiter kept in memory. Per server instance only: on Vercel each
// instance has its own counts and they reset on cold start. Good enough to slow
// down guessing; use a shared store (e.g. Redis) when real abuse matters.
export type RateLimiter = {
  take: (key: string) => { allowed: boolean; retryAfterSeconds: number };
};

export function createRateLimiter({
  limit,
  windowMs,
  now = Date.now,
  maxKeys = 10_000,
}: {
  limit: number;
  windowMs: number;
  now?: () => number;
  maxKeys?: number;
}): RateLimiter {
  const windows = new Map<string, { count: number; resetAt: number }>();

  return {
    take(key) {
      const t = now();
      if (windows.size >= maxKeys) {
        for (const [k, w] of windows) if (w.resetAt <= t) windows.delete(k);
        if (windows.size >= maxKeys) windows.clear();
      }

      let w = windows.get(key);
      if (!w || w.resetAt <= t) {
        w = { count: 0, resetAt: t + windowMs };
        windows.set(key, w);
      }
      w.count++;
      return {
        allowed: w.count <= limit,
        retryAfterSeconds: Math.max(1, Math.ceil((w.resetAt - t) / 1000)),
      };
    },
  };
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
