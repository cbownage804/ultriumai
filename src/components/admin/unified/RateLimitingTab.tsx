import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Gauge, Save, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface RateLimit {
  id: string;
  scope: string;
  endpoint: string;
  rpm: number;
  rpd: number;
  enabled: boolean;
  currentUsage: number;
  throttled: number;
}

const RateLimitingTab = () => {
  const [limits, setLimits] = useState<RateLimit[]>([
    { id: '1', scope: 'Global Default', endpoint: '/*', rpm: 60, rpd: 10000, enabled: true, currentUsage: 42, throttled: 3 },
    { id: '2', scope: 'AI Chat', endpoint: '/api/chat', rpm: 20, rpd: 500, enabled: true, currentUsage: 15, throttled: 12 },
    { id: '3', scope: 'Auth Endpoints', endpoint: '/auth/*', rpm: 10, rpd: 100, enabled: true, currentUsage: 4, throttled: 0 },
    { id: '4', scope: 'File Upload', endpoint: '/api/upload', rpm: 5, rpd: 50, enabled: true, currentUsage: 1, throttled: 0 },
    { id: '5', scope: 'Webhook Delivery', endpoint: '/webhooks/*', rpm: 100, rpd: 50000, enabled: false, currentUsage: 0, throttled: 0 },
  ]);

  const update = (id: string, field: keyof RateLimit, value: any) => {
    setLimits(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const usagePercent = (l: RateLimit) => Math.round((l.currentUsage / l.rpm) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Gauge className="h-6 w-6" /> Rate Limiting</h2>
          <p className="text-muted-foreground">Configure API rate limits and monitor throttled requests</p>
        </div>
        <Button onClick={() => toast.success('Rate limits saved')} className="gap-2"><Save className="h-4 w-4" /> Save All</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="py-4 text-center"><p className="text-2xl font-bold">{limits.reduce((a, l) => a + l.currentUsage, 0)}</p><p className="text-xs text-muted-foreground">Current RPM</p></CardContent></Card>
        <Card><CardContent className="py-4 text-center"><p className="text-2xl font-bold text-destructive">{limits.reduce((a, l) => a + l.throttled, 0)}</p><p className="text-xs text-muted-foreground">Throttled (24h)</p></CardContent></Card>
        <Card><CardContent className="py-4 text-center"><p className="text-2xl font-bold">{limits.filter(l => l.enabled).length}/{limits.length}</p><p className="text-xs text-muted-foreground">Active Rules</p></CardContent></Card>
      </div>

      <div className="space-y-3">
        {limits.map(limit => (
          <Card key={limit.id} className={!limit.enabled ? 'opacity-60' : ''}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Switch checked={limit.enabled} onCheckedChange={v => update(limit.id, 'enabled', v)} />
                  <div>
                    <p className="text-sm font-medium">{limit.scope}</p>
                    <p className="text-xs text-muted-foreground font-mono">{limit.endpoint}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {limit.throttled > 0 && <Badge variant="destructive" className="text-xs gap-1"><AlertTriangle className="h-3 w-3" />{limit.throttled} throttled</Badge>}
                  <Badge variant="secondary" className="text-xs">{usagePercent(limit)}% usage</Badge>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-8">RPM</span>
                  <Input type="number" value={limit.rpm} onChange={e => update(limit.id, 'rpm', parseInt(e.target.value) || 1)} className="w-24 h-8 text-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-8">RPD</span>
                  <Input type="number" value={limit.rpd} onChange={e => update(limit.id, 'rpd', parseInt(e.target.value) || 1)} className="w-24 h-8 text-sm" />
                </div>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${usagePercent(limit) > 80 ? 'bg-destructive' : usagePercent(limit) > 50 ? 'bg-amber-500' : 'bg-primary'}`} style={{ width: `${Math.min(usagePercent(limit), 100)}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RateLimitingTab;
