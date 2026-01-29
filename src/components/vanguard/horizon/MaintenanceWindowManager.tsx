import { useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { format, addDays, isBefore, isAfter, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface MaintenanceWindow {
  id: string;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  timezone: string;
  recurrence: "once" | "daily" | "weekly" | "monthly";
  daysOfWeek?: number[]; // 0 = Sunday
  suppressAlerts: boolean;
  allowPatching: boolean;
  allowReboots: boolean;
  deviceGroups: string[];
  isActive: boolean;
  nextOccurrence?: string;
}

const DEFAULT_WINDOWS: MaintenanceWindow[] = [
  {
    id: "mw-1",
    name: "Weekly Server Maintenance",
    description: "Patching and reboots for production servers",
    startTime: "02:00",
    endTime: "06:00",
    timezone: "UTC",
    recurrence: "weekly",
    daysOfWeek: [0], // Sunday
    suppressAlerts: true,
    allowPatching: true,
    allowReboots: true,
    deviceGroups: ["production-servers"],
    isActive: true,
    nextOccurrence: addDays(new Date(), 3).toISOString(),
  },
  {
    id: "mw-2",
    name: "Workstation Updates",
    description: "Windows updates for workstations during lunch",
    startTime: "12:00",
    endTime: "13:00",
    timezone: "America/New_York",
    recurrence: "daily",
    suppressAlerts: false,
    allowPatching: true,
    allowReboots: false,
    deviceGroups: ["workstations"],
    isActive: true,
    nextOccurrence: new Date().toISOString(),
  },
  {
    id: "mw-3",
    name: "Emergency Maintenance",
    description: "One-time emergency patching window",
    startTime: "22:00",
    endTime: "23:59",
    timezone: "UTC",
    recurrence: "once",
    suppressAlerts: true,
    allowPatching: true,
    allowReboots: true,
    deviceGroups: ["all"],
    isActive: false,
    nextOccurrence: addDays(new Date(), 1).toISOString(),
  },
];

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
  const [windows, setWindows] = useState<MaintenanceWindow[]>(DEFAULT_WINDOWS);
  const [createOpen, setCreateOpen] = useState(false);
  const [editWindow, setEditWindow] = useState<MaintenanceWindow | null>(null);
  const [newWindow, setNewWindow] = useState<Partial<MaintenanceWindow>>({
    name: "",
    description: "",
    startTime: "02:00",
    endTime: "06:00",
    timezone: "UTC",
    recurrence: "weekly",
    daysOfWeek: [0],
    suppressAlerts: true,
    allowPatching: true,
    allowReboots: false,
    deviceGroups: ["all"],
    isActive: true,
  });

  const toggleWindow = (id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isActive: !w.isActive } : w));
    toast.success("Maintenance window updated");
  };

  const deleteWindow = (id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
    toast.success("Maintenance window deleted");
  };

  const createWindow = () => {
    if (!newWindow.name) return;
    const mw: MaintenanceWindow = {
      id: `mw-${Date.now()}`,
      name: newWindow.name,
      description: newWindow.description || "",
      startTime: newWindow.startTime || "02:00",
      endTime: newWindow.endTime || "06:00",
      timezone: newWindow.timezone || "UTC",
      recurrence: newWindow.recurrence || "weekly",
      daysOfWeek: newWindow.daysOfWeek,
      suppressAlerts: newWindow.suppressAlerts ?? true,
      allowPatching: newWindow.allowPatching ?? true,
      allowReboots: newWindow.allowReboots ?? false,
      deviceGroups: newWindow.deviceGroups || ["all"],
      isActive: true,
      nextOccurrence: addDays(new Date(), 1).toISOString(),
    };
    setWindows(prev => [...prev, mw]);
    setCreateOpen(false);
    setNewWindow({
      name: "",
      description: "",
      startTime: "02:00",
      endTime: "06:00",
      timezone: "UTC",
      recurrence: "weekly",
      daysOfWeek: [0],
      suppressAlerts: true,
      allowPatching: true,
      allowReboots: false,
      deviceGroups: ["all"],
      isActive: true,
    });
    toast.success("Maintenance window created");
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

  const isWindowActive = (window: MaintenanceWindow) => {
    if (!window.isActive) return false;
    // Simplified: just check if it's scheduled for today
    // In production, you'd check actual time ranges
    return window.isActive;
  };

  const activeWindows = windows.filter(isWindowActive);
  const upcomingWindows = windows.filter(w => w.isActive && w.nextOccurrence);

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
                <DialogDescription>
                  Schedule a time period for maintenance activities
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Window Name</Label>
                  <Input
                    value={newWindow.name}
                    onChange={(e) => setNewWindow({ ...newWindow, name: e.target.value })}
                    placeholder="e.g., Weekly Server Patching"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={newWindow.description}
                    onChange={(e) => setNewWindow({ ...newWindow, description: e.target.value })}
                    placeholder="Optional description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={newWindow.startTime}
                      onChange={(e) => setNewWindow({ ...newWindow, startTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={newWindow.endTime}
                      onChange={(e) => setNewWindow({ ...newWindow, endTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Recurrence</Label>
                  <Select
                    value={newWindow.recurrence}
                    onValueChange={(v: any) => setNewWindow({ ...newWindow, recurrence: v })}
                  >
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
                        <Button
                          key={day.value}
                          size="sm"
                          variant={newWindow.daysOfWeek?.includes(day.value) ? "default" : "outline"}
                          onClick={() => {
                            const days = newWindow.daysOfWeek || [];
                            setNewWindow({
                              ...newWindow,
                              daysOfWeek: days.includes(day.value)
                                ? days.filter(d => d !== day.value)
                                : [...days, day.value],
                            });
                          }}
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Suppress Alerts</Label>
                      <p className="text-xs text-muted-foreground">Mute all alerts during this window</p>
                    </div>
                    <Switch
                      checked={newWindow.suppressAlerts}
                      onCheckedChange={(checked) => setNewWindow({ ...newWindow, suppressAlerts: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Patching</Label>
                      <p className="text-xs text-muted-foreground">Enable patch deployments</p>
                    </div>
                    <Switch
                      checked={newWindow.allowPatching}
                      onCheckedChange={(checked) => setNewWindow({ ...newWindow, allowPatching: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Reboots</Label>
                      <p className="text-xs text-muted-foreground">Permit automatic reboots</p>
                    </div>
                    <Switch
                      checked={newWindow.allowReboots}
                      onCheckedChange={(checked) => setNewWindow({ ...newWindow, allowReboots: checked })}
                    />
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
        {/* Active Windows Banner */}
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

        {/* Windows List */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-3 pr-4">
            {windows.map(window => (
              <div
                key={window.id}
                className={cn(
                  "p-4 rounded-lg border transition-colors",
                  window.isActive 
                    ? "border-primary/30 bg-primary/5" 
                    : "bg-muted/30 opacity-60"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{window.name}</h4>
                      <Badge variant={window.isActive ? "default" : "secondary"}>
                        {window.isActive ? "Active" : "Disabled"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getRecurrenceLabel(window)}
                      </Badge>
                    </div>
                    {window.description && (
                      <p className="text-sm text-muted-foreground mt-1">{window.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {window.startTime} - {window.endTime} ({window.timezone})
                      </div>
                      {window.nextOccurrence && window.isActive && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Next: {format(parseISO(window.nextOccurrence), "MMM d, yyyy")}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      {window.suppressAlerts && (
                        <Badge variant="outline" className="text-xs">
                          <BellOff className="h-3 w-3 mr-1" />
                          Alerts Muted
                        </Badge>
                      )}
                      {window.allowPatching && (
                        <Badge variant="outline" className="text-xs">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Patching OK
                        </Badge>
                      )}
                      {window.allowReboots && (
                        <Badge variant="outline" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Reboots OK
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        <Server className="h-3 w-3 mr-1" />
                        {window.deviceGroups.join(", ")}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={window.isActive}
                      onCheckedChange={() => toggleWindow(window.id)}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => deleteWindow(window.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
      </CardContent>
    </Card>
  );
}
