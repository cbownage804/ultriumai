import { useState, useCallback } from 'react';

export interface PageView {
  id: string;
  path: string;
  referrer: string;
  userAgent: string;
  device: 'desktop' | 'mobile' | 'tablet';
  timestamp: Date;
  sessionId: string;
  country?: string;
}

export interface AnalyticsSummary {
  totalViews: number;
  uniqueVisitors: number;
  topPages: { path: string; views: number }[];
  topReferrers: { referrer: string; count: number }[];
  deviceBreakdown: { device: string; count: number }[];
  viewsOverTime: { date: string; views: number }[];
}

export function useBuiltInAnalytics() {
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [isTracking, setIsTracking] = useState(false);

  const detectDevice = useCallback((ua: string): PageView['device'] => {
    if (/Mobi|Android/i.test(ua)) return 'mobile';
    if (/Tablet|iPad/i.test(ua)) return 'tablet';
    return 'desktop';
  }, []);

  const trackPageView = useCallback((path: string, referrer = '', userAgent = navigator.userAgent) => {
    const view: PageView = {
      id: crypto.randomUUID(),
      path,
      referrer,
      userAgent,
      device: detectDevice(userAgent),
      timestamp: new Date(),
      sessionId: sessionStorage.getItem('analytics_session') || (() => { const id = crypto.randomUUID(); sessionStorage.setItem('analytics_session', id); return id; })(),
    };
    setPageViews(prev => [...prev, view].slice(-10000));
    return view;
  }, [detectDevice]);

  const getSummary = useCallback((days = 30): AnalyticsSummary => {
    const cutoff = new Date(Date.now() - days * 86400000);
    const filtered = pageViews.filter(v => v.timestamp >= cutoff);
    const sessions = new Set(filtered.map(v => v.sessionId));

    const pageCounts = new Map<string, number>();
    const refCounts = new Map<string, number>();
    const deviceCounts = new Map<string, number>();
    const dateCounts = new Map<string, number>();

    for (const v of filtered) {
      pageCounts.set(v.path, (pageCounts.get(v.path) || 0) + 1);
      if (v.referrer) refCounts.set(v.referrer, (refCounts.get(v.referrer) || 0) + 1);
      deviceCounts.set(v.device, (deviceCounts.get(v.device) || 0) + 1);
      const dateKey = v.timestamp.toISOString().slice(0, 10);
      dateCounts.set(dateKey, (dateCounts.get(dateKey) || 0) + 1);
    }

    return {
      totalViews: filtered.length,
      uniqueVisitors: sessions.size,
      topPages: [...pageCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([path, views]) => ({ path, views })),
      topReferrers: [...refCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([referrer, count]) => ({ referrer, count })),
      deviceBreakdown: [...deviceCounts.entries()].map(([device, count]) => ({ device, count })),
      viewsOverTime: [...dateCounts.entries()].sort().map(([date, views]) => ({ date, views })),
    };
  }, [pageViews]);

  const startTracking = useCallback(() => setIsTracking(true), []);
  const stopTracking = useCallback(() => setIsTracking(false), []);

  const generateTrackingScript = useCallback((): string => {
    return `<script>
(function() {
  var sid = sessionStorage.getItem('_asid') || (function() { var id = Math.random().toString(36).slice(2); sessionStorage.setItem('_asid', id); return id; })();
  fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: location.pathname, referrer: document.referrer, ua: navigator.userAgent, sid: sid })
  });
})();
</script>`;
  }, []);

  return { pageViews, isTracking, trackPageView, getSummary, startTracking, stopTracking, generateTrackingScript };
}
