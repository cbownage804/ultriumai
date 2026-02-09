import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Pause,
  Play,
  BellOff,
  RefreshCw,
  Server,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { format, addDays, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface MaintenanceWindow {
  id: string;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  timezone: string;
  recurrence: "once" | "daily" | "weekly" | "monthly";
  daysOfWeek?: number[];
  suppressAlerts: boolean;
  allowPatching: boolean;
  allowReboots: boolean;
  deviceGroups: string[];
  isActive: boolean;
  nextOccurrence?: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export function MaintenanceWindowManager() {
  const { user } = useAuth();
  const [windows, setWindows] = useState<MaintenanceWindow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newWindow, setNewWindow] = useState<Partial<MaintenanceWindow>>({
    name: "", description: "", startTime: "02:00", endTime: "06:00",
    timezone: "UTC", recurrence: "weekly", daysOfWeek: [0],
    suppressAlerts: true, allowPatching: true, allowReboots: false,
    deviceGroups: ["all"], isActive: true,
  });

  useEffect(() => { if (user) loadWindows(); }, [user]);

  const loadWindows = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data } = await (supabase as any)
        .from('vanguard_maintenance_windows')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setWindows(data.map((w: any) => ({
          id: w.id, name: w.name, description: w.description || '',
          startTime: w.start_time, endTime: w.end_time, timezone: w.timezone || 'UTC',
          recurrence: w.recurrence, daysOfWeek: w.days_of_week,
          suppressAlerts: w.suppress_alerts, allowPatching: w.allow_patching,
          allowReboots: w.allow_reboots, deviceGroups: w.device_groups || ['all'],
          isActive: w.is_active, nextOccurrence: w.next_occurrence,
        })));
      }
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  const toggleWindow = async (id: string) => {
    const w = windows.find(w => w.id === id);
    if (!w) return;
    await (supabase as any).from('vanguard_maintenance_windows')
      .update({ is_active: !w.isActive }).eq('id', id);
    toast.success("Maintenance window updated");
    loadWindows();
  };

  const deleteWindow = async (id: string) => {
    await (supabase as any).from('vanguard_maintenance_windows').delete().eq('id', id);
    toast.success("Maintenance window deleted");
    loadWindows();
  };

  const createWindow = async () => {
    if (!newWindow.name || !user) return;
    const { error } = await (supabase as any).from('vanguard_maintenance_windows').insert({
      user_id: user.id, name: newWindow.name, description: newWindow.description,
      start_time: newWindow.startTime, end_time: newWindow.endTime,
      timezone: newWindow.timezone, recurrence: newWindow.recurrence,
      days_of_week: newWindow.daysOfWeek, suppress_alerts: newWindow.suppressAlerts,
      allow_patching: newWindow.allowPatching, allow_reboots: newWindow.allowReboots,
      device_groups: newWindow.deviceGroups, is_active: true,
      next_occurrence: addDays(new Date(), 1).toISOString(),
    });
    if (error) { toast.error('Failed to create window'); return; }
    setCreateOpen(false);
    setNewWindow({
      name: "", description: "", startTime: "02:00", endTime: "06:00",
      timezone: "UTC", recurrence: "weekly", daysOfWeek: [0],
      suppressAlerts: true, allowPatching: true, allowReboots: false,
      deviceGroups: ["all"], isActive: true,
    });
    toast.success("Maintenance window created");
    loadWindows();
  };

  const getRecurrenceLabel = (window: MaintenanceWindow) => {
    switch (window.recurrence) {
      case "once": return "One-time";
      case "daily": return "Daily";
      case "weekly": {
        const days = window.daysOfWeek?.map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label).join(", ");
        return `Weekly on ${days}`;
      }
      case "monthly": return "Monthly";
      default: return window.recurrence;
    }
  };

  const activeWindows = windows.filter(w => w.isActive);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-cyan-500" />
              Maintenance Windows
            </CardTitle>
            <CardDescription>
              Schedule maintenance periods to suppress alerts and allow automated actions
            </CardDescription>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Schedule Window
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Maintenance Window</DialogTitle>
                <DialogDescription>Schedule a time period for maintenance activities</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Window Name</Label>
                  <Input value={newWindow.name} onChange={(e) => setNewWindow({ ...newWindow, name: e.target.value })} placeholder="e.g., Weekly Server Patching" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={newWindow.description} onChange={(e) => setNewWindow({ ...newWindow, description: e.target.value })} placeholder="Optional description" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input type="time" value={newWindow.startTime} onChange={(e) => setNewWindow({ ...newWindow, startTime: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input type="time" value={newWindow.endTime} onChange={(e) => setNewWindow({ ...newWindow, endTime: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Recurrence</Label>
                  <Select value={newWindow.recurrence} onValueChange={(v: any) => setNewWindow({ ...newWindow, recurrence: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">One-time</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newWindow.recurrence === "weekly" && (
                  <div className="space-y-2">
                    <Label>Days of Week</Label>
                    <div className="flex gap-2">
                      {DAYS_OF_WEEK.map(day => (
                        <Button key={day.value} size="sm" variant={newWindow.daysOfWeek?.includes(day.value) ? "default" : "outline"}
                          onClick={() => {
                            const days = newWindow.daysOfWeek || [];
                            setNewWindow({ ...newWindow, daysOfWeek: days.includes(day.value) ? days.filter(d => d !== day.value) : [...days, day.value] });
                          }}>{day.label}</Button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div><Label>Suppress Alerts</Label><p className="text-xs text-muted-foreground">Mute all alerts during this window</p></div>
                    <Switch checked={newWindow.suppressAlerts} onCheckedChange={(checked) => setNewWindow({ ...newWindow, suppressAlerts: checked })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div><Label>Allow Patching</Label><p className="text-xs text-muted-foreground">Enable patch deployments</p></div>
                    <Switch checked={newWindow.allowPatching} onCheckedChange={(checked) => setNewWindow({ ...newWindow, allowPatching: checked })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div><Label>Allow Reboots</Label><p className="text-xs text-muted-foreground">Permit automatic reboots</p></div>
                    <Switch checked={newWindow.allowReboots} onCheckedChange={(checked) => setNewWindow({ ...newWindow, allowReboots: checked })} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button onClick={createWindow} disabled={!newWindow.name}>Create Window</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {activeWindows.length > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-center gap-2 text-yellow-600">
              <Pause className="h-5 w-5" />
              <span className="font-medium">Maintenance Mode Active</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {activeWindows.length} maintenance window(s) currently in effect. Alerts may be suppressed.
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
        <ScrollArea className="h-[400px]">
          <div className="space-y-3 pr-4">
            {windows.map(window => (
              <div key={window.id} className={cn("p-4 rounded-lg border transition-colors", window.isActive ? "border-primary/30 bg-primary/5" : "bg-muted/30 opacity-60")}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{window.name}</h4>
                      <Badge variant={window.isActive ? "default" : "secondary"}>{window.isActive ? "Active" : "Disabled"}</Badge>
                      <Badge variant="outline" className="text-xs">{getRecurrenceLabel(window)}</Badge>
                    </div>
                    {window.description && <p className="text-sm text-muted-foreground mt-1">{window.description}</p>}
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground"><Clock className="h-4 w-4" />{window.startTime} - {window.endTime} ({window.timezone})</div>
                      {window.nextOccurrence && window.isActive && (
                        <div className="flex items-center gap-1 text-muted-foreground"><Calendar className="h-4 w-4" />Next: {format(parseISO(window.nextOccurrence), "MMM d, yyyy")}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      {window.suppressAlerts && <Badge variant="outline" className="text-xs"><BellOff className="h-3 w-3 mr-1" />Alerts Muted</Badge>}
                      {window.allowPatching && <Badge variant="outline" className="text-xs"><RefreshCw className="h-3 w-3 mr-1" />Patching OK</Badge>}
                      {window.allowReboots && <Badge variant="outline" className="text-xs"><AlertTriangle className="h-3 w-3 mr-1" />Reboots OK</Badge>}
                      <Badge variant="outline" className="text-xs"><Server className="h-3 w-3 mr-1" />{window.deviceGroups.join(", ")}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={window.isActive} onCheckedChange={() => toggleWindow(window.id)} />
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteWindow(window.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            ))}
            {windows.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No maintenance windows scheduled</p>
                <p className="text-sm">Create a window to schedule maintenance periods</p>
              </div>
            )}
          </div>
        </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
