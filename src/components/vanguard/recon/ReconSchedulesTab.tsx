import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Calendar, Clock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useState as useStateR, useEffect, useCallback } from 'react';

interface Schedule {
  id: string;
  schedule_name: string;
  scan_type: string;
  frequency: string;
  next_run_at: string | null;
  is_active: boolean;
  vanguard_agents?: { id: string; name: string; hostname: string } | null;
}

export function ReconSchedulesTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    schedule_name: '',
    scan_type: 'vuln_scan',
    frequency: 'monthly',
    targets: '',
  });

  const fetchSchedules = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('recon-scan-orchestrator', {
        body: { action: 'list_schedules' },
      });
      if (error) throw error;
      setSchedules(data.schedules || []);
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  const handleCreate = async () => {
    if (!form.schedule_name || !form.targets) return;
    try {
      const targets = form.targets.split(',').map(t => t.trim()).filter(Boolean);
      await supabase.functions.invoke('recon-scan-orchestrator', {
        body: {
          action: 'create_schedule',
          schedule: { ...form, targets, next_run_at: new Date().toISOString() },
        },
      });
      toast({ title: 'Schedule created', description: form.schedule_name });
      setShowCreate(false);
      setForm({ schedule_name: '', scan_type: 'vuln_scan', frequency: 'monthly', targets: '' });
      await fetchSchedules();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const toggleSchedule = async (id: string, active: boolean) => {
    await supabase.functions.invoke('recon-scan-orchestrator', {
      body: { action: 'toggle_schedule', schedule_id: id, is_active: active },
    });
    await fetchSchedules();
  };

  const freqLabels: Record<string, string> = {
    once: 'One-time', daily: 'Daily', weekly: 'Weekly', biweekly: 'Bi-weekly', monthly: 'Monthly', quarterly: 'Quarterly',
  };

  const scanLabels: Record<string, string> = {
    port_scan: 'Port Scan', vuln_scan: 'Vulnerability Scan', service_enum: 'Service Enum',
    full_pentest: 'Full Pentest', web_scan: 'Web Scan', ssl_audit: 'SSL Audit',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Scan Schedules</h2>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-1" /> New Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0f0f14] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Create Recurring Scan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Schedule Name</Label>
                <Input placeholder="Monthly internal vuln scan" value={form.schedule_name}
                  onChange={e => setForm(f => ({ ...f, schedule_name: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Scan Type</Label>
                  <Select value={form.scan_type} onValueChange={v => setForm(f => ({ ...f, scan_type: v }))}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#0f0f14] border-white/10">
                      {Object.entries(scanLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Frequency</Label>
                  <Select value={form.frequency} onValueChange={v => setForm(f => ({ ...f, frequency: v }))}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#0f0f14] border-white/10">
                      {Object.entries(freqLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Targets</Label>
                <Input placeholder="192.168.1.0/24, 10.0.0.0/8" value={form.targets}
                  onChange={e => setForm(f => ({ ...f, targets: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white font-mono text-sm" />
              </div>
              <Button onClick={handleCreate} className="w-full bg-blue-600 hover:bg-blue-700">Create Schedule</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-white/30" /></div>
      ) : schedules.length === 0 ? (
        <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
          <CardContent className="py-12 text-center text-white/30">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>No schedules yet. Create recurring scans for continuous monitoring.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {schedules.map(sched => (
            <Card key={sched.id} className="bg-black/40 border-white/10 backdrop-blur-xl">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-white">{sched.schedule_name}</p>
                      <p className="text-xs text-white/40">
                        {scanLabels[sched.scan_type] || sched.scan_type} • {freqLabels[sched.frequency] || sched.frequency}
                        {sched.next_run_at && <> • Next: {new Date(sched.next_run_at).toLocaleDateString()}</>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={sched.is_active ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}>
                      {sched.is_active ? 'Active' : 'Paused'}
                    </Badge>
                    <Switch checked={sched.is_active} onCheckedChange={v => toggleSchedule(sched.id, v)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
