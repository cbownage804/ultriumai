import { useState, useEffect } from 'react';

/**
 * Returns a `ready` boolean that starts false and flips to true
 * after the browser is idle (requestIdleCallback) or 100ms fallback.
 * Use this to defer non-critical hook initialization until after first paint.
 */
export function useDeferredMount(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(() => setReady(true));
      return () => cancelIdleCallback(id);
    } else {
      const id = setTimeout(() => setReady(true), 100);
      return () => clearTimeout(id);
    }
  }, []);

  return ready;
}
