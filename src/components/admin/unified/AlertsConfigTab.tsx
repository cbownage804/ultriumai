import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Bell, Plus, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface AlertConfig {
  id: string;
  name: string;
  description?: string;
  alert_type: string;
  is_enabled: boolean;
  threshold_value: number;
  time_window_minutes: number;
  cooldown_minutes: number;
  last_triggered_at?: string;
}

const alertTypes = [
  { value: 'error_spike', label: 'Error Spike' },
  { value: 'ticket_spike', label: 'Ticket Spike' },
  { value: 'service_degradation', label: 'Service Degradation' },
  { value: 'user_anomaly', label: 'User Anomaly' },
  { value: 'security_event', label: 'Security Event' },
];

const AlertsConfigTab = () => {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<AlertConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', alert_type: 'error_spike', threshold_value: 5, time_window_minutes: 60, cooldown_minutes: 30 });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('admin_alert_configs').select('*').order('created_at', { ascending: false });
    setConfigs((data as any) || []);
    setLoading(false);
  };

  const create = async () => {
    if (!form.name) { toast.error('Name required'); return; }
    const { error } = await supabase.from('admin_alert_configs').insert({ ...form, created_by: user?.id });
    if (error) { toast.error('Failed to create'); return; }
    toast.success('Alert rule created');
    setShowCreate(false);
    setForm({ name: '', description: '', alert_type: 'error_spike', threshold_value: 5, time_window_minutes: 60, cooldown_minutes: 30 });
    load();
  };

  const toggle = async (id: string, enabled: boolean) => {
    await supabase.from('admin_alert_configs').update({ is_enabled: enabled }).eq('id', id);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from('admin_alert_configs').delete().eq('id', id);
    toast.success('Deleted');
    load();
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Bell className="h-6 w-6" /> Automated Alerts</h2>
          <p className="text-muted-foreground">Configure alert rules for proactive issue detection</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} className="gap-2"><RefreshCw className="h-4 w-4" /> Refresh</Button>
          <Button onClick={() => setShowCreate(!showCreate)} className="gap-2"><Plus className="h-4 w-4" /> New Rule</Button>
        </div>
      </div>

      {showCreate && (
        <Card>
          <CardContent className="pt-4 space-y-4">
            <Input placeholder="Alert name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Textarea placeholder="Description..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Select value={form.alert_type} onValueChange={v => setForm(f => ({ ...f, alert_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{alertTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
              <div>
                <label className="text-xs text-muted-foreground">Threshold</label>
                <Input type="number" value={form.threshold_value} onChange={e => setForm(f => ({ ...f, threshold_value: +e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Window (min)</label>
                <Input type="number" value={form.time_window_minutes} onChange={e => setForm(f => ({ ...f, time_window_minutes: +e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Cooldown (min)</label>
                <Input type="number" value={form.cooldown_minutes} onChange={e => setForm(f => ({ ...f, cooldown_minutes: +e.target.value }))} />
              </div>
            </div>
            <Button onClick={create}>Create Rule</Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {loading ? <p className="text-center text-muted-foreground py-8">Loading...</p> :
         configs.length === 0 ? <p className="text-center text-muted-foreground py-8">No alert rules configured</p> :
         configs.map(c => (
          <Card key={c.id}>
            <CardContent className="pt-4 flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{c.name}</h3>
                  <Badge variant="outline">{alertTypes.find(t => t.value === c.alert_type)?.label}</Badge>
                  {!c.is_enabled && <Badge variant="secondary">Disabled</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{c.description || `Triggers when ${c.alert_type} exceeds ${c.threshold_value} in ${c.time_window_minutes}min`}</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={c.is_enabled} onCheckedChange={v => toggle(c.id, v)} />
                <Button variant="ghost" size="sm" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AlertsConfigTab;
