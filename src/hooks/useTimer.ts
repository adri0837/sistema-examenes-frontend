import { useState, useEffect, useRef } from 'react';

interface UseTimerOptions {
  /** Total seconds to count down from. Changing this resets the timer. */
  seconds: number | null;
  /** Whether the timer should be actively counting */
  running: boolean;
  /** Called exactly once when timer reaches 0 */
  onExpire?: () => void;
  /**
   * Identity key: when this changes, the timer resets even if `seconds` is the same.
   * Use this for per-question timer identity (e.g. question index).
   */
  questionKey?: string;
}

/**
 * Ref-based countdown timer.
 *
 * Key difference from a naive setInterval: uses an absolute `end` timestamp
 * (Date.now() + seconds*1000), so the display is accurate from the first
 * render regardless of React batching, render delays, or effect scheduling.
 */
export function useTimer({ seconds, running, onExpire, questionKey }: UseTimerOptions): number | null {
  // Initialize state so the FIRST paint shows the correct value when running
  const init = running && seconds !== null && seconds > 0 ? seconds : (seconds ?? null);
  const [remaining, setRemaining] = useState<number | null>(init);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    // Not running → show null/0, no interval
    if (!running || seconds === null || seconds <= 0) {
      setRemaining(seconds ?? null);
      return;
    }

    // Absolute end time — this is the key to accuracy
    const end = Date.now() + seconds * 1000;
    setRemaining(seconds); // shows correct value IMMEDIATELY on next paint

    const id = setInterval(() => {
      const r = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setRemaining(r);
      if (r <= 0) {
        clearInterval(id);
        // Use ref to avoid stale closures on onExpire
        onExpireRef.current?.();
      }
    }, 500);

    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, running, questionKey]);

  return remaining;
}
