import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useDeferredHook — delays initialization of expensive hooks until after
 * the first paint, reducing mount-time overhead.
 * 
 * Returns `true` after the specified delay (default 3s), signaling that
 * deferred hooks can now be initialized.
 */
export function useDeferredMount(delayMs = 3000): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(() => setReady(true), { timeout: delayMs });
      return () => (window as any).cancelIdleCallback(id);
    } else {
      const timer = setTimeout(() => setReady(true), delayMs);
      return () => clearTimeout(timer);
    }
  }, [delayMs]);

  return ready;
}

/**
 * Creates a no-op stub matching the shape of a hook's return value.
 * Use this to provide safe defaults before the real hook initializes.
 */
export function createNoopStub<T extends Record<string, any>>(shape: T): T {
  return shape;
}

/**
 * useThrottledEffect — like useEffect but throttled to run at most once
 * every `intervalMs` milliseconds. Prevents effect storms from rapid
 * state changes.
 */
export function useThrottledEffect(
  effect: () => void | (() => void),
  deps: any[],
  intervalMs: number,
) {
  const lastRunRef = useRef(0);
  const cleanupRef = useRef<(() => void) | void>();
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const now = Date.now();
    const elapsed = now - lastRunRef.current;

    if (elapsed >= intervalMs) {
      lastRunRef.current = now;
      cleanupRef.current = effect();
    } else {
      if (pendingRef.current) clearTimeout(pendingRef.current);
      pendingRef.current = setTimeout(() => {
        lastRunRef.current = Date.now();
        cleanupRef.current = effect();
        pendingRef.current = null;
      }, intervalMs - elapsed);
    }

    return () => {
      if (pendingRef.current) clearTimeout(pendingRef.current);
      if (typeof cleanupRef.current === 'function') cleanupRef.current();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * useSyncRef — replaces the pattern:
 *   const ref = useRef(value);
 *   useEffect(() => { ref.current = value; }, [value]);
 * 
 * With a direct assignment (no useEffect overhead):
 *   const ref = useSyncRef(value);
 */
export function useSyncRef<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
