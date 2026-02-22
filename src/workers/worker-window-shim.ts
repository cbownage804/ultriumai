/**
 * Worker window shim — must be the FIRST import in any Web Worker file.
 *
 * Vite's React Refresh preamble accesses `window`, which doesn't exist in
 * Web Workers. By importing this shim first, `window` is defined before
 * any other module (which may have the preamble injected) evaluates.
 *
 * ES module evaluation is depth-first: this module's body runs before
 * sibling imports are evaluated.
 */
if (typeof window === 'undefined') {
  (self as any).window = self;
}

export {};
