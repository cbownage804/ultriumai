import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Clock, Database, Globe, Package, TrendingDown, TrendingUp } from 'lucide-react';

interface Metric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
}

const PerformanceProfilerTab = () => {
  const metrics: Metric[] = [
    { label: 'Avg Page Load', value: '1.2s', change: '-0.3s', trend: 'down', icon: <Clock className="h-5 w-5" /> },
    { label: 'API Latency (p95)', value: '245ms', change: '+12ms', trend: 'up', icon: <Globe className="h-5 w-5" /> },
    { label: 'DB Query Avg', value: '18ms', change: '-5ms', trend: 'down', icon: <Database className="h-5 w-5" /> },
    { label: 'Bundle Size', value: '2.4MB', change: '+120KB', trend: 'up', icon: <Package className="h-5 w-5" /> },
  ];

  const slowQueries = [
    { query: 'SELECT * FROM tickets JOIN ... WHERE ...', avg: '340ms', calls: 1240, table: 'tickets' },
    { query: 'SELECT * FROM vanguard_agents WHERE ...', avg: '180ms', calls: 890, table: 'vanguard_agents' },
    { query: 'SELECT * FROM atlas_documents WHERE ...', avg: '120ms', calls: 2100, table: 'atlas_documents' },
    { query: 'SELECT * FROM security_events ORDER BY ...', avg: '95ms', calls: 560, table: 'security_events' },
  ];

  const slowRoutes = [
    { route: '/vanguard/horizon', loadTime: '2.8s', lcp: '3.1s', cls: '0.05' },
    { route: '/ai-studio/app-builder', loadTime: '2.4s', lcp: '2.9s', cls: '0.02' },
    { route: '/admin', loadTime: '1.9s', lcp: '2.2s', cls: '0.01' },
    { route: '/dashboard', loadTime: '1.1s', lcp: '1.4s', cls: '0.03' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Zap className="h-6 w-6" /> Performance Profiler</h2>
        <p className="text-muted-foreground">Page load times, query performance, and bundle analysis</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(m => (
          <Card key={m.label}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-muted-foreground">{m.icon}</div>
                <Badge variant="secondary" className={`text-xs gap-1 ${m.trend === 'down' ? 'text-green-500' : m.trend === 'up' ? 'text-destructive' : ''}`}>
                  {m.trend === 'down' ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                  {m.change}
                </Badge>
              </div>
              <p className="text-2xl font-bold">{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Database className="h-5 w-5" /> Slowest Queries</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {slowQueries.map((q, i) => (
              <div key={i} className="p-3 border rounded-lg">
                <p className="text-xs font-mono truncate text-muted-foreground">{q.query}</p>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="outline" className="text-xs">{q.table}</Badge>
                  <span className="text-xs font-medium">{q.avg} avg</span>
                  <span className="text-xs text-muted-foreground">{q.calls.toLocaleString()} calls</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min(parseInt(q.avg) / 3.4, 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Globe className="h-5 w-5" /> Slowest Routes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {slowRoutes.map((r, i) => (
              <div key={i} className="p-3 border rounded-lg">
                <p className="text-sm font-mono font-medium">{r.route}</p>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <span>Load: <strong>{r.loadTime}</strong></span>
                  <span>LCP: <strong>{r.lcp}</strong></span>
                  <span>CLS: <strong>{r.cls}</strong></span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${parseFloat(r.loadTime) > 2 ? 'bg-destructive' : parseFloat(r.loadTime) > 1.5 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${Math.min(parseFloat(r.loadTime) / 3 * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PerformanceProfilerTab;
