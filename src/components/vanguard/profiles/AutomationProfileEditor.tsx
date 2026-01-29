import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Zap,
  Clock,
  Calendar,
  Settings,
  Terminal,
  Package,
  Shield,
  RefreshCw,
  Plus,
  Trash2,
  Save,
  Play,
} from "lucide-react";
import { toast } from "sonner";

export interface ScheduleConfig {
  type: 'once' | 'daily' | 'weekly' | 'monthly';
  time: string;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  enabled: boolean;
}

export interface AutomationTask {
  id: string;
  name: string;
  type: 'script' | 'patch' | 'software_install' | 'software_uninstall' | 'reboot' | 'cleanup';
  config: Record<string, any>;
  order: number;
  enabled: boolean;
}

export interface AutomationProfile {
  id: string;
  name: string;
  description?: string;
  schedule: ScheduleConfig;
  tasks: AutomationTask[];
  runOnConnect: boolean;
  notifyOnComplete: boolean;
  notifyOnFailure: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AutomationProfileEditorProps {
  profile?: AutomationProfile;
  onSave: (profile: Omit<AutomationProfile, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const taskTypeLabels = {
  script: { label: 'Run Script', icon: Terminal },
  patch: { label: 'Install Patches', icon: Shield },
  software_install: { label: 'Install Software', icon: Package },
  software_uninstall: { label: 'Uninstall Software', icon: Trash2 },
  reboot: { label: 'Reboot Device', icon: RefreshCw },
  cleanup: { label: 'Disk Cleanup', icon: Settings },
};

export function AutomationProfileEditor({ profile, onSave, onCancel }: AutomationProfileEditorProps) {
  const [name, setName] = useState(profile?.name || '');
  const [description, setDescription] = useState(profile?.description || '');
  const [schedule, setSchedule] = useState<ScheduleConfig>(profile?.schedule || {
    type: 'weekly',
    time: '02:00',
    daysOfWeek: [0], // Sunday
    enabled: true,
  });
  const [tasks, setTasks] = useState<AutomationTask[]>(profile?.tasks || []);
  const [runOnConnect, setRunOnConnect] = useState<boolean>(profile?.runOnConnect || false);
  const [notifyOnComplete, setNotifyOnComplete] = useState<boolean>(profile?.notifyOnComplete ?? true);
  const [notifyOnFailure, setNotifyOnFailure] = useState<boolean>(profile?.notifyOnFailure ?? true);

  const addTask = (type: AutomationTask['type']) => {
    const defaults: Record<string, Record<string, any>> = {
      script: { script: '', shell: 'powershell', timeout: 300 },
      patch: { categories: ['security', 'critical'], rebootIfNeeded: false },
      software_install: { packages: [], manager: 'chocolatey' },
      software_uninstall: { packages: [] },
      reboot: { delay: 0, force: false },
      cleanup: { tempFiles: true, recyclingBin: true, windowsUpdate: true },
    };

    const newTask: AutomationTask = {
      id: crypto.randomUUID(),
      name: taskTypeLabels[type].label,
      type,
      config: defaults[type],
      order: tasks.length,
      enabled: true,
    };
    setTasks([...tasks, newTask]);
  };

  const updateTask = (id: string, updates: Partial<AutomationTask>) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Profile name is required');
      return;
    }
    onSave({ name, description, schedule, tasks, runOnConnect, notifyOnComplete, notifyOnFailure });
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Automation Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Profile Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Weekly Maintenance"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Switch
              checked={schedule.enabled}
              onCheckedChange={(v) => setSchedule({ ...schedule, enabled: v })}
            />
            <Label>Enable scheduled execution</Label>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={schedule.type}
                onValueChange={(v: any) => setSchedule({ ...schedule, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">One Time</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={schedule.time}
                onChange={(e) => setSchedule({ ...schedule, time: e.target.value })}
              />
            </div>

            {schedule.type === 'monthly' && (
              <div className="space-y-2">
                <Label>Day of Month</Label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={schedule.dayOfMonth || 1}
                  onChange={(e) => setSchedule({ ...schedule, dayOfMonth: parseInt(e.target.value) })}
                />
              </div>
            )}
          </div>

          {schedule.type === 'weekly' && (
            <div className="space-y-2">
              <Label>Days of Week</Label>
              <div className="flex gap-2">
                {daysOfWeek.map((day, i) => (
                  <Button
                    key={day}
                    variant={schedule.daysOfWeek?.includes(i) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const current = schedule.daysOfWeek || [];
                      const updated = current.includes(i)
                        ? current.filter(d => d !== i)
                        : [...current, i];
                      setSchedule({ ...schedule, daysOfWeek: updated });
                    }}
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Switch checked={runOnConnect} onCheckedChange={setRunOnConnect} />
            <Label>Run when device comes online (if missed scheduled run)</Label>
          </div>
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Automation Tasks</CardTitle>
            <CardDescription>Tasks will run in order from top to bottom</CardDescription>
          </div>
          <Select onValueChange={(v: any) => addTask(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Add task..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="script">Run Script</SelectItem>
              <SelectItem value="patch">Install Patches</SelectItem>
              <SelectItem value="software_install">Install Software</SelectItem>
              <SelectItem value="software_uninstall">Uninstall Software</SelectItem>
              <SelectItem value="cleanup">Disk Cleanup</SelectItem>
              <SelectItem value="reboot">Reboot Device</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No tasks configured</p>
              <p className="text-sm">Add tasks to automate device maintenance</p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-2">
              {tasks.map((task, index) => {
                const TaskIcon = taskTypeLabels[task.type].icon;
                return (
                  <AccordionItem key={task.id} value={task.id} className="border rounded-lg">
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-muted-foreground text-sm w-6">{index + 1}.</span>
                        <TaskIcon className="h-4 w-4" />
                        <span className={!task.enabled ? 'text-muted-foreground' : ''}>
                          {task.name}
                        </span>
                        {!task.enabled && <Badge variant="secondary">Disabled</Badge>}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={task.enabled}
                            onCheckedChange={(v) => updateTask(task.id, { enabled: v })}
                          />
                          <Label>Enabled</Label>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500"
                          onClick={() => deleteTask(task.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label>Task Name</Label>
                        <Input
                          value={task.name}
                          onChange={(e) => updateTask(task.id, { name: e.target.value })}
                        />
                      </div>

                      {/* Task-specific configuration */}
                      {task.type === 'script' && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Shell</Label>
                            <Select
                              value={task.config.shell}
                              onValueChange={(v) => updateTask(task.id, { config: { ...task.config, shell: v } })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="powershell">PowerShell</SelectItem>
                                <SelectItem value="cmd">CMD</SelectItem>
                                <SelectItem value="bash">Bash</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Script</Label>
                            <Textarea
                              value={task.config.script}
                              onChange={(e) => updateTask(task.id, { config: { ...task.config, script: e.target.value } })}
                              placeholder="Enter script..."
                              rows={5}
                              className="font-mono text-sm"
                            />
                          </div>
                        </div>
                      )}

                      {task.type === 'patch' && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Patch Categories</Label>
                            <div className="flex flex-wrap gap-2">
                              {['security', 'critical', 'important', 'optional'].map(cat => (
                                <Button
                                  key={cat}
                                  variant={task.config.categories?.includes(cat) ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => {
                                    const current = task.config.categories || [];
                                    const updated = current.includes(cat)
                                      ? current.filter((c: string) => c !== cat)
                                      : [...current, cat];
                                    updateTask(task.id, { config: { ...task.config, categories: updated } });
                                  }}
                                >
                                  {cat}
                                </Button>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={task.config.rebootIfNeeded}
                              onCheckedChange={(v) => updateTask(task.id, { config: { ...task.config, rebootIfNeeded: v } })}
                            />
                            <Label>Reboot if needed after patching</Label>
                          </div>
                        </div>
                      )}

                      {(task.type === 'software_install' || task.type === 'software_uninstall') && (
                        <div className="space-y-2">
                          <Label>Packages (comma-separated)</Label>
                          <Input
                            value={task.config.packages?.join(', ') || ''}
                            onChange={(e) => updateTask(task.id, { 
                              config: { 
                                ...task.config, 
                                packages: e.target.value.split(',').map((p: string) => p.trim()).filter(Boolean)
                              } 
                            })}
                            placeholder="e.g., googlechrome, 7zip, vscode"
                          />
                        </div>
                      )}

                      {task.type === 'cleanup' && (
                        <div className="space-y-2">
                          <Label>Cleanup Options</Label>
                          <div className="space-y-2">
                            {[
                              { key: 'tempFiles', label: 'Temporary files' },
                              { key: 'recyclingBin', label: 'Recycle Bin' },
                              { key: 'windowsUpdate', label: 'Windows Update cache' },
                              { key: 'browserCache', label: 'Browser cache' },
                            ].map(opt => (
                              <div key={opt.key} className="flex items-center gap-2">
                                <Checkbox
                                  checked={task.config[opt.key]}
                                  onCheckedChange={(v) => updateTask(task.id, { 
                                    config: { ...task.config, [opt.key]: v } 
                                  })}
                                />
                                <Label>{opt.label}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {task.type === 'reboot' && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Delay (seconds)</Label>
                            <Input
                              type="number"
                              value={task.config.delay || 0}
                              onChange={(e) => updateTask(task.id, { config: { ...task.config, delay: parseInt(e.target.value) } })}
                              min={0}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={task.config.force}
                              onCheckedChange={(v) => updateTask(task.id, { config: { ...task.config, force: v } })}
                            />
                            <Label>Force reboot (don't wait for applications)</Label>
                          </div>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Switch checked={notifyOnComplete} onCheckedChange={setNotifyOnComplete} />
            <Label>Notify on successful completion</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={notifyOnFailure} onCheckedChange={setNotifyOnFailure} />
            <Label>Notify on failure</Label>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Profile
        </Button>
      </div>
    </div>
  );
}
