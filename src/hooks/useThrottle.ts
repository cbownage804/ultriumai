import { useCallback, useRef } from 'react';

/**
 * Hook that throttles a callback function.
 * Useful for rate-limiting user interactions in demos.
 * 
 * @param callback - The function to throttle
 * @param delay - Minimum time between calls in milliseconds
 * @returns Throttled function
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const lastCall = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCall.current;

      if (timeSinceLastCall >= delay) {
        lastCall.current = now;
        callback(...args);
      } else {
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Schedule the call for when the delay period ends
        timeoutRef.current = setTimeout(() => {
          lastCall.current = Date.now();
          callback(...args);
        }, delay - timeSinceLastCall);
      }
    },
    [callback, delay]
  );
}

/**
 * Hook that debounces a callback function.
 * Useful for search inputs and form validation.
 * 
 * @param callback - The function to debounce
 * @param delay - Wait time after last call in milliseconds
 * @returns Debounced function
 */
export function useDebounce<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}
