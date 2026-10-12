// Feedback for requests that can be slow on mobile data (/api/unlock and /api/accuse).
// - After STILL_WORKING_AFTER_MS with no reply, the screen says STILL_WORKING.
// - If the request times out or fails, the screen offers SLOW_CONNECTION as a retry.
// - One request at a time per button: a double tap sends one request.

export const STILL_WORKING_AFTER_MS = 3000;
export const STILL_WORKING = "Still working...";
export const SLOW_CONNECTION = "Slow connection. Tap to try again.";

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
