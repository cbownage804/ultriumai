import { useState, useCallback } from 'react';

export interface LoadTestConfig {
  targetUrl: string;
  virtualUsers: number;
  durationSec: number;
  rampUpSec: number;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
}

export interface LoadTestResult {
  id: string;
  config: LoadTestConfig;
  metrics: {
    totalRequests: number;
    successCount: number;
    errorCount: number;
    avgResponseMs: number;
    p50Ms: number;
    p95Ms: number;
    p99Ms: number;
    minMs: number;
    maxMs: number;
    requestsPerSec: number;
    errorRate: number;
  };
  timeline: { second: number; rps: number; avgMs: number; errors: number }[];
  status: 'running' | 'completed' | 'stopped';
  startedAt: Date;
  completedAt?: Date;
}

export function useLoadTesting() {
  const [results, setResults] = useState<LoadTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const run = useCallback((config: LoadTestConfig): LoadTestResult => {
    setIsRunning(true);
    const timeline: LoadTestResult['timeline'] = [];
    for (let s = 0; s < config.durationSec; s++) {
      const userFraction = Math.min(1, s / Math.max(1, config.rampUpSec));
      const activeUsers = Math.round(config.virtualUsers * userFraction);
      const rps = activeUsers * (2 + Math.random() * 3);
      const avgMs = 50 + Math.random() * 200 + (activeUsers > config.virtualUsers * 0.8 ? Math.random() * 500 : 0);
      const errors = Math.random() > 0.9 ? Math.round(rps * 0.05) : 0;
      timeline.push({ second: s, rps: Math.round(rps), avgMs: Math.round(avgMs), errors });
    }

    const totalReqs = timeline.reduce((a, t) => a + t.rps, 0);
    const totalErrors = timeline.reduce((a, t) => a + t.errors, 0);
    const allAvg = timeline.reduce((a, t) => a + t.avgMs, 0) / timeline.length;
    const sorted = [...timeline.map(t => t.avgMs)].sort((a, b) => a - b);

    const result: LoadTestResult = {
      id: crypto.randomUUID(),
      config,
      metrics: {
        totalRequests: totalReqs,
        successCount: totalReqs - totalErrors,
        errorCount: totalErrors,
        avgResponseMs: Math.round(allAvg),
        p50Ms: Math.round(sorted[Math.floor(sorted.length * 0.5)] || 0),
        p95Ms: Math.round(sorted[Math.floor(sorted.length * 0.95)] || 0),
        p99Ms: Math.round(sorted[Math.floor(sorted.length * 0.99)] || 0),
        minMs: Math.round(Math.min(...sorted)),
        maxMs: Math.round(Math.max(...sorted)),
        requestsPerSec: Math.round(totalReqs / config.durationSec),
        errorRate: totalReqs > 0 ? Math.round((totalErrors / totalReqs) * 10000) / 100 : 0,
      },
      timeline,
      status: 'completed',
      startedAt: new Date(Date.now() - config.durationSec * 1000),
      completedAt: new Date(),
    };
    setResults(prev => [result, ...prev].slice(0, 20));
    setIsRunning(false);
    return result;
  }, []);

  return { results, isRunning, run };
}
