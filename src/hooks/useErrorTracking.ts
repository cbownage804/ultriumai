import { useState, useCallback } from 'react';

export interface TrackedError {
  id: string;
  message: string;
  stack?: string;
  component?: string;
  url: string;
  timestamp: Date;
  occurrences: number;
  lastSeen: Date;
  severity: 'error' | 'warning' | 'fatal';
  resolved: boolean;
  userContext?: Record<string, string>;
}

export interface ErrorStats {
  totalErrors: number;
  unresolvedCount: number;
  errorRate: number;
  topErrors: TrackedError[];
  errorsByHour: { hour: string; count: number }[];
}

export function useErrorTracking() {
  const [errors, setErrors] = useState<TrackedError[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);

  const captureError = useCallback((message: string, stack?: string, component?: string, severity: TrackedError['severity'] = 'error') => {
    setErrors(prev => {
      const existing = prev.find(e => e.message === message && !e.resolved);
      if (existing) {
        return prev.map(e => e.id === existing.id ? { ...e, occurrences: e.occurrences + 1, lastSeen: new Date() } : e);
      }
      return [{
        id: crypto.randomUUID(),
        message,
        stack,
        component,
        url: typeof location !== 'undefined' ? location.href : '',
        timestamp: new Date(),
        occurrences: 1,
        lastSeen: new Date(),
        severity,
        resolved: false,
      }, ...prev].slice(0, 500);
    });
  }, []);

  const resolveError = useCallback((id: string) => {
    setErrors(prev => prev.map(e => e.id === id ? { ...e, resolved: true } : e));
  }, []);

  const deleteError = useCallback((id: string) => {
    setErrors(prev => prev.filter(e => e.id !== id));
  }, []);

  const getStats = useCallback((): ErrorStats => {
    const unresolved = errors.filter(e => !e.resolved);
    const hourCounts = new Map<string, number>();
    const last24h = new Date(Date.now() - 86400000);
    for (const e of errors.filter(e => e.timestamp >= last24h)) {
      const h = e.timestamp.toISOString().slice(0, 13);
      hourCounts.set(h, (hourCounts.get(h) || 0) + e.occurrences);
    }
    return {
      totalErrors: errors.reduce((s, e) => s + e.occurrences, 0),
      unresolvedCount: unresolved.length,
      errorRate: errors.length > 0 ? Math.round((unresolved.length / errors.length) * 100) : 0,
      topErrors: [...unresolved].sort((a, b) => b.occurrences - a.occurrences).slice(0, 10),
      errorsByHour: [...hourCounts.entries()].sort().map(([hour, count]) => ({ hour, count })),
    };
  }, [errors]);

  const generateErrorBoundary = useCallback((): string => {
    return `class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) {
    fetch('/api/errors', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: error.message, stack: error.stack, component: info.componentStack })
    });
  }
  render() {
    if (this.state.hasError) return <div className="p-4 bg-red-50 text-red-600 rounded-lg">Something went wrong</div>;
    return this.props.children;
  }
}`;
  }, []);

  return { errors, isCapturing, captureError, resolveError, deleteError, getStats, setIsCapturing, generateErrorBoundary };
}
