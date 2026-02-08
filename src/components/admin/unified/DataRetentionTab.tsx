import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Clock, Database, ShieldAlert, Save } from 'lucide-react';
import { toast } from 'sonner';

interface RetentionPolicy {
  id: string;
  table: string;
  retentionDays: number;
  enabled: boolean;
  lastPurged?: string;
  rowsPurged?: number;
}

const DataRetentionTab = () => {
  const [policies, setPolicies] = useState<RetentionPolicy[]>([
    { id: '1', table: 'admin_audit_trails', retentionDays: 365, enabled: true, lastPurged: '2025-01-15', rowsPurged: 1240 },
    { id: '2', table: 'api_usage_logs', retentionDays: 90, enabled: true, lastPurged: '2025-02-01', rowsPurged: 15420 },
    { id: '3', table: 'action_execution_logs', retentionDays: 180, enabled: false },
    { id: '4', table: 'security_events', retentionDays: 730, enabled: true, lastPurged: '2025-01-20', rowsPurged: 340 },
    { id: '5', table: 'ai_credit_ledger', retentionDays: 365, enabled: false },
    { id: '6', table: 'alert_notifications', retentionDays: 60, enabled: true, lastPurged: '2025-02-05', rowsPurged: 890 },
  ]);

  const togglePolicy = (id: string) => {
    setPolicies(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  const updateDays = (id: string, days: number) => {
    setPolicies(prev => prev.map(p => p.id === id ? { ...p, retentionDays: days } : p));
  };

  const runPurge = (id: string) => {
    toast.info('Purge initiated (simulated). This would run in the background.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Database className="h-6 w-6" /> Data Retention Policies</h2>
        <p className="text-muted-foreground">Configure automatic data purge rules for compliance and storage management</p>
      </div>

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="flex items-center gap-3 py-4">
          <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300">Data retention policies permanently delete records older than the configured threshold. Ensure compliance with your organization's data governance requirements.</p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {policies.map(policy => (
          <Card key={policy.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <Switch checked={policy.enabled} onCheckedChange={() => togglePolicy(policy.id)} />
                <div className="min-w-0">
                  <p className="text-sm font-medium font-mono">{policy.table}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {policy.lastPurged && <span className="text-xs text-muted-foreground">Last purge: {policy.lastPurged}</span>}
                    {policy.rowsPurged != null && <Badge variant="secondary" className="text-xs">{policy.rowsPurged.toLocaleString()} rows</Badge>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <Input type="number" value={policy.retentionDays} onChange={e => updateDays(policy.id, parseInt(e.target.value) || 30)} className="w-20 h-8 text-sm" />
                  <span className="text-xs text-muted-foreground">days</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => runPurge(policy.id)} disabled={!policy.enabled} className="gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" /> Purge Now
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button onClick={() => toast.success('All policies saved')} className="gap-2"><Save className="h-4 w-4" /> Save All Policies</Button>
    </div>
  );
};

export default DataRetentionTab;
