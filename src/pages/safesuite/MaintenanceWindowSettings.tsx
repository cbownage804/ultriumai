/**
 * MaintenanceWindowSettings — org's allowed windows for automatic
 * remediations.
 */
import { useEffect, useState, useCallback } from 'react';
import { Loader2, Plus, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type Mode = 'immediate' | 'business_hours' | 'overnight' | 'weekends' | 'custom';

interface Window {
  id: string;
  name: string;
  mode: Mode;
  timezone: string;
  weekday_mask: number;
  start_time: string | null;
  end_time: string | null;
  active: boolean;
}

const MODE_LABEL: Record<Mode, string> = {
  immediate: 'Immediately (24/7)',
  business_hours: 'Business hours (Mon–Fri, 9am–5pm)',
  overnight: 'Overnight (10pm–6am)',
  weekends: 'Weekends only',
  custom: 'Custom schedule',
};

export default function MaintenanceWindowSettings() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Window[] | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('wrayth_maintenance_windows')
      .select('id, name, mode, timezone, weekday_mask, start_time, end_time, active')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    setRows((data as unknown as Window[]) ?? []);
  }, [user?.id]);

  useEffect(() => { void load(); }, [load]);

  async function addWindow() {
    if (!user?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('wrayth_maintenance_windows').insert({
        user_id: user.id,
        name: 'New window',
        mode: 'business_hours',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        weekday_mask: 62, // Mon–Fri
        start_time: '09:00',
        end_time: '17:00',
        active: true,
      });
      if (error) throw error;
      toast.success('Window added.');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add');
    } finally {
      setSaving(false);
    }
  }

  async function patch(id: string, patch: Partial<Window>) {
    await supabase.from('wrayth_maintenance_windows').update(patch).eq('id', id);
    await load();
  }

  async function remove(id: string) {
    await supabase.from('wrayth_maintenance_windows').delete().eq('id', id);
    await load();
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <header className="flex items-start gap-3">
        <Clock className="h-7 w-7 text-violet-300 mt-1" />
        <div>
          <h1 className="text-2xl font-semibold">Maintenance windows</h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            When can Ray run automatic remediations? Windows apply to queued
            jobs only — a manual Fix Now click always runs immediately.
          </p>
        </div>
      </header>

      {rows === null ? (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading windows…
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No windows defined</CardTitle>
            <CardDescription>
              With no windows, Ray runs automatic fixes at any time. Add a window to constrain to business hours or overnight.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={addWindow} disabled={saving} className="min-h-[44px]">
              <Plus className="h-4 w-4 mr-2" /> Add a window
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((w) => (
            <Card key={w.id}>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <Input
                    value={w.name}
                    onChange={(e) => setRows((rs) => rs!.map((x) => x.id === w.id ? { ...x, name: e.target.value } : x))}
                    onBlur={() => patch(w.id, { name: w.name })}
                    className="max-w-xs"
                  />
                  <div className="flex-1" />
                  <div className="flex items-center gap-2">
                    <Label className="text-[11px] text-muted-foreground">Active</Label>
                    <Switch checked={w.active} onCheckedChange={(v) => patch(w.id, { active: v })} />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(w.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Mode</Label>
                    <Select value={w.mode} onValueChange={(v) => patch(w.id, { mode: v as Mode })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(MODE_LABEL) as Mode[]).map((m) => (
                          <SelectItem key={m} value={m}>{MODE_LABEL[m]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {w.mode === 'custom' && (
                    <>
                      <div>
                        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Start</Label>
                        <Input type="time" value={w.start_time ?? ''} onChange={(e) => patch(w.id, { start_time: e.target.value })} />
                      </div>
                      <div>
                        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">End</Label>
                        <Input type="time" value={w.end_time ?? ''} onChange={(e) => patch(w.id, { end_time: e.target.value })} />
                      </div>
                    </>
                  )}
                </div>

                <Badge variant="outline" className="text-[11px]">
                  Timezone: {w.timezone}
                </Badge>
              </CardContent>
            </Card>
          ))}
          <Button variant="outline" onClick={addWindow} disabled={saving}>
            <Plus className="h-4 w-4 mr-2" /> Add another window
          </Button>
        </div>
      )}
    </div>
  );
}
