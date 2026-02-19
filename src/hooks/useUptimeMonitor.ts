import { useState, useCallback, useRef } from 'react';

export interface UptimeCheck {
  id: string;
  timestamp: Date;
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  statusCode: number;
}

export interface UptimeStats {
  uptimePercentage: number;
  avgResponseTime: number;
  totalChecks: number;
  downtimeMinutes: number;
  lastCheck?: UptimeCheck;
}

export function useUptimeMonitor() {
  const [checks, setChecks] = useState<UptimeCheck[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [url, setUrl] = useState<string>('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const performCheck = useCallback(async (targetUrl: string): Promise<UptimeCheck> => {
    const start = performance.now();
    try {
      const res = await fetch(targetUrl, { method: 'HEAD', mode: 'no-cors' });
      const responseTime = Math.round(performance.now() - start);
      const check: UptimeCheck = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        status: responseTime > 3000 ? 'degraded' : 'up',
        responseTime,
        statusCode: res.status || 200,
      };
      setChecks(prev => [check, ...prev].slice(0, 500));
      return check;
    } catch {
      const responseTime = Math.round(performance.now() - start);
      const check: UptimeCheck = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        status: 'down',
        responseTime,
        statusCode: 0,
      };
      setChecks(prev => [check, ...prev].slice(0, 500));
      return check;
    }
  }, []);

  const startMonitoring = useCallback((targetUrl: string, intervalMs = 300000) => {
    setUrl(targetUrl);
    setIsMonitoring(true);
    performCheck(targetUrl);
    intervalRef.current = setInterval(() => performCheck(targetUrl), intervalMs);
  }, [performCheck]);

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsMonitoring(false);
  }, []);

  const getStats = useCallback((): UptimeStats => {
    if (checks.length === 0) return { uptimePercentage: 100, avgResponseTime: 0, totalChecks: 0, downtimeMinutes: 0 };
    const upChecks = checks.filter(c => c.status !== 'down').length;
    const avgRT = Math.round(checks.reduce((s, c) => s + c.responseTime, 0) / checks.length);
    const downChecks = checks.length - upChecks;
    return {
      uptimePercentage: Math.round((upChecks / checks.length) * 10000) / 100,
      avgResponseTime: avgRT,
      totalChecks: checks.length,
      downtimeMinutes: downChecks * 5,
      lastCheck: checks[0],
    };
  }, [checks]);

  return { checks, isMonitoring, url, startMonitoring, stopMonitoring, performCheck, getStats };
}
