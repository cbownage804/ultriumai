import { devLog } from '@/lib/logger';
/**
 * Supabase Resilience Utilities
 * Provides timeout wrappers and graceful fallbacks for all Supabase operations
 * to keep the app usable during infrastructure degradation.
 */

const DEFAULT_TIMEOUT_MS = 10_000; // 10 seconds
const EDGE_FN_TIMEOUT_MS = 15_000; // 15 seconds for edge functions

/**
 * Wrap any async operation with an AbortController-based timeout.
 * Returns a fallback value if the operation times out or fails.
 */
export async function withTimeout<T>(
  operation: (signal?: AbortSignal) => Promise<T>,
  fallback: T,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  label?: string
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await operation(controller.signal);
    return result;
  } catch (err: any) {
    if (err?.name === 'AbortError' || controller.signal.aborted) {
      devLog.warn(`[Resilience] ${label ?? 'Operation'} timed out after ${timeoutMs}ms — using fallback`);
    } else {
      devLog.warn(`[Resilience] ${label ?? 'Operation'} failed — using fallback`, err?.message);
    }
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Race a promise against a timeout. Unlike withTimeout, this doesn't use AbortController,
 * so it works with any promise (including Supabase SDK calls that don't accept signals).
 */
export function withDeadline<T>(
  promise: Promise<T>,
  fallback: T,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  label?: string
): Promise<T> {
  return new Promise<T>((resolve) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        devLog.warn(`[Resilience] ${label ?? 'Operation'} timed out after ${timeoutMs}ms — using fallback`);
        resolve(fallback);
      }
    }, timeoutMs);

    promise
      .then((result) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(result);
        }
      })
      .catch((err) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          devLog.warn(`[Resilience] ${label ?? 'Operation'} failed — using fallback`, err?.message);
          resolve(fallback);
        }
      });
  });
}

/**
 * Resilient edge function invocation.
 * Wraps supabase.functions.invoke with a timeout and returns a typed fallback on failure.
 */
export async function resilientEdgeFn<T>(
  invoke: () => Promise<{ data: T | null; error: any }>,
  fallback: T,
  label?: string,
  timeoutMs: number = EDGE_FN_TIMEOUT_MS
): Promise<T> {
  return withDeadline(
    invoke().then(({ data, error }) => {
      if (error) throw error;
      return data as T;
    }),
    fallback,
    timeoutMs,
    label
  );
}

/**
 * Resilient Supabase query.
 * Wraps a .from().select() chain with a timeout and fallback.
 */
export async function resilientQuery<T>(
  query: PromiseLike<{ data: T | null; error: any }>,
  fallback: T,
  label?: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  return withDeadline(
    Promise.resolve(query).then(({ data, error }) => {
      if (error) throw error;
      return data as T;
    }),
    fallback,
    timeoutMs,
    label
  );
}

/**
 * Track Supabase health status across the app.
 * Components can use this to show degraded-mode indicators.
 */
let _degradedMode = false;
let _degradedSince: Date | null = null;
const _listeners = new Set<(degraded: boolean) => void>();

export function setDegradedMode(degraded: boolean) {
  if (_degradedMode === degraded) return;
  _degradedMode = degraded;
  _degradedSince = degraded ? new Date() : null;
  _listeners.forEach((fn) => fn(degraded));
}

export function isDegradedMode(): boolean {
  return _degradedMode;
}

export function onDegradedModeChange(fn: (degraded: boolean) => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}
