import { useCallback, useRef } from 'react';

export interface CompileTelemetryEntry {
  id: string;
  timestamp: number;
  tier: 'vite' | 'vite-retry' | 'vanilla';
  success: boolean;
  durationMs: number;
  htmlLength: number;
  fileCount: number;
  errorMessage?: string;
  failureReason?: 'timeout' | 'syntax' | 'network' | 'memory' | 'unknown';
}

export interface CompileTelemetrySummary {
  totalCompiles: number;
  successRate: number;
  avgDurationMs: number;
  viteSuccessRate: number;
  topFailureReasons: { reason: string; count: number }[];
  last10: CompileTelemetryEntry[];
}

const STORAGE_KEY = 'ai-builder-compile-telemetry';
const MAX_ENTRIES = 100;

/**
 * Lightweight compile telemetry tracker.
 * Records every compile attempt (Vite, retry, worker fallback) with timing,
 * success/failure, and failure reasons. Persisted in localStorage.
 */
export function useCompileTelemetry() {
  const entriesRef = useRef<CompileTelemetryEntry[]>([]);

  // Load on first access
  if (entriesRef.current.length === 0) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) entriesRef.current = JSON.parse(raw);
    } catch {}
  }

  const persist = useCallback(() => {
    try {
      const trimmed = entriesRef.current.slice(-MAX_ENTRIES);
      entriesRef.current = trimmed;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {}
  }, []);

  const recordCompile = useCallback((entry: Omit<CompileTelemetryEntry, 'id' | 'timestamp'>) => {
    const full: CompileTelemetryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    entriesRef.current.push(full);
    persist();
    return full;
  }, [persist]);

  const getSummary = useCallback((): CompileTelemetrySummary => {
    const entries = entriesRef.current;
    if (entries.length === 0) {
      return {
        totalCompiles: 0, successRate: 100, avgDurationMs: 0,
        viteSuccessRate: 100,
        topFailureReasons: [], last10: [],
      };
    }

    const successes = entries.filter(e => e.success);
    const viteEntries = entries.filter(e => e.tier === 'vite' || e.tier === 'vite-retry');
    const viteSuccesses = viteEntries.filter(e => e.success);
    const workerEntries = entries.filter(e => e.tier === 'worker');

    // Count failure reasons
    const reasonCounts = new Map<string, number>();
    for (const e of entries.filter(e => !e.success && e.failureReason)) {
      const r = e.failureReason!;
      reasonCounts.set(r, (reasonCounts.get(r) || 0) + 1);
    }
    const topFailureReasons = Array.from(reasonCounts.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalCompiles: entries.length,
      successRate: (successes.length / entries.length) * 100,
      avgDurationMs: entries.reduce((s, e) => s + e.durationMs, 0) / entries.length,
      viteSuccessRate: viteEntries.length > 0 ? (viteSuccesses.length / viteEntries.length) * 100 : 100,
      workerFallbackRate: entries.length > 0 ? (workerEntries.length / entries.length) * 100 : 0,
      topFailureReasons,
      last10: entries.slice(-10).reverse(),
    };
  }, []);

  const clearTelemetry = useCallback(() => {
    entriesRef.current = [];
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { recordCompile, getSummary, clearTelemetry };
}

/**
 * Classify an error message into a failure reason category.
 */
export function classifyFailure(errorMessage: string): CompileTelemetryEntry['failureReason'] {
  const msg = errorMessage.toLowerCase();
  if (msg.includes('timeout') || msg.includes('timed out')) return 'timeout';
  if (msg.includes('syntax') || msg.includes('unexpected') || msg.includes('unbalanced') || msg.includes('unterminated')) return 'syntax';
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('503') || msg.includes('busy')) return 'network';
  if (msg.includes('memory') || msg.includes('oom') || msg.includes('heap')) return 'memory';
  return 'unknown';
}
