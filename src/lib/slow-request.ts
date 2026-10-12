import type { UnlockFailure } from "@/lib/api";

// Feedback for requests that can be slow on mobile data (/api/unlock and /api/accuse).
// - After STILL_WORKING_AFTER_MS with no reply, the screen says STILL_WORKING.
// - If the request times out or fails, the screen offers SLOW_CONNECTION as a retry.
// - One request at a time per button: a double tap sends one request.

export const STILL_WORKING_AFTER_MS = 3000;
export const STILL_WORKING = "Still working...";
export const SLOW_CONNECTION = "Slow connection. Tap to try again.";
export const SERVER_TROUBLE = "Couldn't check that right now. Tap to try again.";
export const RATE_LIMITED = "Too many tries at once. Wait a minute, then try again.";
// Under a minute in seconds ("45 seconds"), otherwise in whole minutes, rounded up ("4 minutes").
export const waitText = (seconds: number) => {
  const s = Math.max(1, Math.ceil(seconds));
  if (s < 60) return `${s} ${s === 1 ? "second" : "seconds"}`;
  const m = Math.ceil(s / 60);
  return `${m} ${m === 1 ? "minute" : "minutes"}`;
};
export const cooldownMessage = (seconds: number) =>
  `Take a breath and look over your evidence. You can try again in ${waitText(seconds)}.`;

// What to show when an unlock check couldn't be made, and whether tapping it should send the
// same check again. A cooldown or rate limit is never retried by a tap or by itself.
export function unlockFailureMessage(failure: UnlockFailure): { text: string; retry: boolean } {
  if (!("reason" in failure)) return { text: SLOW_CONNECTION, retry: true };
  switch (failure.reason) {
    case "cooldown":
      return { text: cooldownMessage(failure.retryAfterSeconds), retry: false };
    case "rate-limited":
      return { text: RATE_LIMITED, retry: false };
    case "server":
      return { text: SERVER_TROUBLE, retry: true };
    default:
      return { text: SLOW_CONNECTION, retry: true };
  }
}

// Waits for the request, calling onSlow once if it is still waiting after `afterMs`.
export async function withStillWorking<T>(
  task: Promise<T>,
  onSlow: () => void,
  afterMs = STILL_WORKING_AFTER_MS,
): Promise<T> {
  const timer = setTimeout(onSlow, afterMs);
  try {
    return await task;
  } finally {
    clearTimeout(timer);
  }
}

export type SingleFlight = {
  isBusy: () => boolean;
  // Runs the task unless one is already in flight, in which case nothing is sent.
  run: <T>(task: () => Promise<T>) => Promise<{ sent: true; value: T } | { sent: false }>;
};

export function createSingleFlight(): SingleFlight {
  let busy = false;
  return {
    isBusy: () => busy,
    async run(task) {
      if (busy) return { sent: false };
      busy = true;
      try {
        return { sent: true, value: await task() };
      } finally {
        busy = false;
      }
    },
  };
}
