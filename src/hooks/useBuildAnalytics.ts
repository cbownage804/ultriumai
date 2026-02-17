import { useState, useCallback, useEffect } from 'react';

export interface BuildMetric {
  id: string;
  timestamp: Date;
  type: 'build' | 'fix' | 'discuss';
  durationMs: number;
  filesGenerated: number;
  creditsUsed: number;
  success: boolean;
  errorCount: number;
  validationScore: number;
  promptLength: number;
  phaseNumber?: number;
}

interface BuildAnalytics {
  totalBuilds: number;
  successRate: number;
  avgBuildTime: number;
  totalCreditsUsed: number;
  avgCreditsPerBuild: number;
  totalFilesGenerated: number;
  avgValidationScore: number;
  errorRate: number;
  buildsByHour: { hour: number; count: number }[];
  creditsByDay: { date: string; credits: number }[];
  recentMetrics: BuildMetric[];
}

const STORAGE_KEY = 'ai-builder-analytics';
const MAX_METRICS = 200;

export function useBuildAnalytics() {
  const [metrics, setMetrics] = useState<BuildMetric[]>([]);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setMetrics(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      }
    } catch { /* ignore */ }
  }, []);

  // Persist
  useEffect(() => {
    if (metrics.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics.slice(-MAX_METRICS)));
      } catch { /* ignore */ }
    }
  }, [metrics]);

  const recordBuild = useCallback((metric: Omit<BuildMetric, 'id' | 'timestamp'>) => {
    const entry: BuildMetric = {
      ...metric,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setMetrics(prev => [...prev.slice(-MAX_METRICS + 1), entry]);
  }, []);

  const getAnalytics = useCallback((): BuildAnalytics => {
    if (metrics.length === 0) {
      return {
        totalBuilds: 0, successRate: 100, avgBuildTime: 0, totalCreditsUsed: 0,
        avgCreditsPerBuild: 0, totalFilesGenerated: 0, avgValidationScore: 100,
        errorRate: 0, buildsByHour: [], creditsByDay: [], recentMetrics: [],
      };
    }

    const builds = metrics.filter(m => m.type === 'build' || m.type === 'fix');
    const successes = builds.filter(m => m.success);

    // Group by hour
    const hourCounts = new Map<number, number>();
    for (const m of builds) {
      const hour = m.timestamp.getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    }
    const buildsByHour = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      count: hourCounts.get(h) || 0,
    }));

    // Group credits by day (last 14 days)
    const dayCounts = new Map<string, number>();
    for (const m of metrics) {
      const day = m.timestamp.toISOString().split('T')[0];
      dayCounts.set(day, (dayCounts.get(day) || 0) + m.creditsUsed);
    }
    const creditsByDay = Array.from(dayCounts.entries())
      .map(([date, credits]) => ({ date, credits }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14);

    return {
      totalBuilds: builds.length,
      successRate: builds.length > 0 ? (successes.length / builds.length) * 100 : 100,
      avgBuildTime: builds.length > 0 ? builds.reduce((s, m) => s + m.durationMs, 0) / builds.length : 0,
      totalCreditsUsed: metrics.reduce((s, m) => s + m.creditsUsed, 0),
      avgCreditsPerBuild: builds.length > 0 ? metrics.reduce((s, m) => s + m.creditsUsed, 0) / builds.length : 0,
      totalFilesGenerated: builds.reduce((s, m) => s + m.filesGenerated, 0),
      avgValidationScore: builds.length > 0 ? builds.reduce((s, m) => s + m.validationScore, 0) / builds.length : 100,
      errorRate: builds.length > 0 ? (builds.filter(m => m.errorCount > 0).length / builds.length) * 100 : 0,
      buildsByHour,
      creditsByDay,
      recentMetrics: metrics.slice(-20).reverse(),
    };
  }, [metrics]);

  const clearAnalytics = useCallback(() => {
    setMetrics([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { metrics, recordBuild, getAnalytics, clearAnalytics };
}
