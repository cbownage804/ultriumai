import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Calendar, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause,
  AlertTriangle,
  CheckCircle,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScheduleRule {
  id: string;
  name: string;
  scriptId: string;
  scriptName: string;
  agentIds: string[];
  agentNames: string[];
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  customCron?: string;
  startDate: string;
  startTime: string;
  endDate?: string;
  timezone: string;
  isActive: boolean;
  lastRun?: string;
  nextRun: string;
  maxRetries: number;
  retryDelay: number; // minutes
  runOnFailure: boolean;
  notifyOnSuccess: boolean;
  notifyOnFailure: boolean;
  parameters?: Record<string, any>;
  weekdays?: number[]; // 0-6 (Sunday-Saturday)
  monthlyDay?: number; // 1-31
  conditions?: {
    onlyIfOnline: boolean;
    skipIfRecentRun: boolean;
    recentRunHours: number;
    maxConcurrentRuns: number;
  };
}

interface ScheduleManagerProps {
  schedules: ScheduleRule[];
  availableScripts: Array<{ id: string; name: string; }>;
  availableAgents: Array<{ id: string; hostname: string; }>;
  onSaveSchedule: (schedule: ScheduleRule) => void;
  onDeleteSchedule: (scheduleId: string) => void;
  onToggleSchedule: (scheduleId: string, isActive: boolean) => void;
  onRunNow: (scheduleId: string) => void;
  trigger?: React.ReactNode;
}

export const ScheduleManager = ({
  schedules,
  availableScripts,
  availableAgents,
  onSaveSchedule,
  onDeleteSchedule,
  onToggleSchedule,
  onRunNow,
  trigger
}: ScheduleManagerProps) => {
  const [open, setOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleRule | null>(null);
  const [schedule, setSchedule] = useState<Partial<ScheduleRule>>({
    name: '',
    scriptId: '',
    agentIds: [],
    frequency: 'daily',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    timezone: 'America/New_York',
    isActive: true,
    maxRetries: 3,
    retryDelay: 5,
    runOnFailure: false,
    notifyOnSuccess: false,
    notifyOnFailure: true,
    weekdays: [1, 2, 3, 4, 5], // Monday-Friday
    monthlyDay: 1,
    conditions: {
      onlyIfOnline: true,
      skipIfRecentRun: false,
      recentRunHours: 1,
      maxConcurrentRuns: 1
    }
  });
  
  const { toast } = useToast();

  const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'UTC',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo'
  ];

  const openDialog = (scheduleToEdit?: ScheduleRule) => {
    if (scheduleToEdit) {
      setEditingSchedule(scheduleToEdit);
      setSchedule(scheduleToEdit);
    } else {
      setEditingSchedule(null);
      setSchedule({
        name: '',
        scriptId: '',
        agentIds: [],
        frequency: 'daily',
        startDate: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        timezone: 'America/New_York',
        isActive: true,
        maxRetries: 3,
        retryDelay: 5,
        runOnFailure: false,
        notifyOnSuccess: false,
        notifyOnFailure: true,
        weekdays: [1, 2, 3, 4, 5],
        monthlyDay: 1,
        conditions: {
          onlyIfOnline: true,
          skipIfRecentRun: false,
          recentRunHours: 1,
          maxConcurrentRuns: 1
        }
      });
    }
    setOpen(true);
  };

  const handleSave = () => {
    if (!schedule.name?.trim() || !schedule.scriptId || !schedule.agentIds?.length) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const selectedScript = availableScripts.find(s => s.id === schedule.scriptId);
    const selectedAgents = availableAgents.filter(a => schedule.agentIds?.includes(a.id));

    const scheduleRule: ScheduleRule = {
      id: editingSchedule?.id || crypto.randomUUID(),
      name: schedule.name!,
      scriptId: schedule.scriptId!,
      scriptName: selectedScript?.name || '',
      agentIds: schedule.agentIds!,
      agentNames: selectedAgents.map(a => a.hostname),
      frequency: schedule.frequency!,
      customCron: schedule.customCron,
      startDate: schedule.startDate!,
      startTime: schedule.startTime!,
      endDate: schedule.endDate,
      timezone: schedule.timezone!,
      isActive: schedule.isActive!,
      nextRun: calculateNextRun(),
      maxRetries: schedule.maxRetries!,
      retryDelay: schedule.retryDelay!,
      runOnFailure: schedule.runOnFailure!,
      notifyOnSuccess: schedule.notifyOnSuccess!,
      notifyOnFailure: schedule.notifyOnFailure!,
      parameters: schedule.parameters,
      weekdays: schedule.weekdays,
      monthlyDay: schedule.monthlyDay,
      conditions: schedule.conditions
    };

    onSaveSchedule(scheduleRule);
    toast({
      title: "Schedule Saved",
      description: `${schedule.name} has been scheduled successfully`
    });
    setOpen(false);
  };

  const calculateNextRun = () => {
    // Simplified next run calculation - in reality this would be more complex
    const now = new Date();
    const startDateTime = new Date(`${schedule.startDate}T${schedule.startTime}`);
    
    if (startDateTime > now) {
      return startDateTime.toLocaleString();
    }
    
    // Calculate next occurrence based on frequency
    switch (schedule.frequency) {
      case 'daily':
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(parseInt(schedule.startTime!.split(':')[0]), parseInt(schedule.startTime!.split(':')[1]));
        return tomorrow.toLocaleString();
      case 'weekly':
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        nextWeek.setHours(parseInt(schedule.startTime!.split(':')[0]), parseInt(schedule.startTime!.split(':')[1]));
        return nextWeek.toLocaleString();
      default:
        return 'Next scheduled run will be calculated';
    }
  };

  const getFrequencyDisplay = (sched: ScheduleRule) => {
    switch (sched.frequency) {
      case 'once': return 'One-time';
      case 'daily': return 'Daily';
      case 'weekly': 
        if (sched.weekdays?.length) {
          const days = sched.weekdays.map(d => weekdayNames[d].slice(0, 3)).join(', ');
          return `Weekly (${days})`;
        }
        return 'Weekly';
      case 'monthly': return `Monthly (${sched.monthlyDay}${getOrdinalSuffix(sched.monthlyDay!)})`;
      case 'custom': return `Custom (${sched.customCron})`;
      default: return sched.frequency;
    }
  };

  const getOrdinalSuffix = (day: number) => {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const ScheduleCard = ({ sched }: { sched: ScheduleRule }) => (
    <div className="p-4 border rounded-lg bg-gradient-to-r from-background to-muted/20 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${sched.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <div>
            <h4 className="font-medium">{sched.name}</h4>
            <p className="text-sm text-muted-foreground">
              {sched.scriptName} • {sched.agentNames.length} agent{sched.agentNames.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={sched.isActive ? 'default' : 'secondary'}>
            {sched.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onToggleSchedule(sched.id, !sched.isActive)}
          >
            {sched.isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
        <div>
          <span className="font-medium">Frequency:</span> {getFrequencyDisplay(sched)}
        </div>
        <div>
          <span className="font-medium">Next Run:</span> {sched.nextRun}
        </div>
        <div>
          <span className="font-medium">Time:</span> {sched.startTime} ({sched.timezone})
        </div>
        <div>
          <span className="font-medium">Last Run:</span> {sched.lastRun || 'Never'}
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex flex-wrap gap-1">
          {sched.agentNames.slice(0, 3).map(name => (
            <Badge key={name} variant="outline" className="text-xs">
              {name}
            </Badge>
          ))}
          {sched.agentNames.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{sched.agentNames.length - 3} more
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-7" onClick={() => onRunNow(sched.id)}>
            <Play className="h-3 w-3 mr-1" />
            Run Now
          </Button>
          <Button size="sm" variant="outline" className="h-7" onClick={() => openDialog(sched)}>
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button size="sm" variant="outline" className="h-7" onClick={() => onDeleteSchedule(sched.id)}>
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Schedule Manager
              </CardTitle>
              <CardDescription>
                Automated script execution scheduling and management
              </CardDescription>
            </div>
            <Button onClick={() => openDialog()} className="bg-gradient-to-r from-primary to-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Create Schedule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {schedules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No schedules configured</p>
                <p className="text-sm">Create your first automated script schedule</p>
              </div>
            ) : (
              schedules.map((sched) => (
                <ScheduleCard key={sched.id} sched={sched} />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {editingSchedule ? 'Edit Schedule' : 'Create Schedule'}
            </DialogTitle>
            <DialogDescription>
              Configure automated script execution schedule
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Configuration */}
            <div className="lg:col-span-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Schedule Name *</Label>
                <Input
                  id="name"
                  value={schedule.name || ''}
                  onChange={(e) => setSchedule(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter schedule name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="script">Script *</Label>
                <Select
                  value={schedule.scriptId || ''}
                  onValueChange={(value) => setSchedule(prev => ({ ...prev, scriptId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select script" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableScripts.map(script => (
                      <SelectItem key={script.id} value={script.id}>
                        {script.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target Agents * ({schedule.agentIds?.length || 0} selected)</Label>
                <ScrollArea className="h-32 border rounded p-2">
                  {availableAgents.map(agent => (
                    <div key={agent.id} className="flex items-center space-x-2 py-1">
                      <Checkbox
                        checked={schedule.agentIds?.includes(agent.id) || false}
                        onCheckedChange={(checked) => {
                          const currentIds = schedule.agentIds || [];
                          const newIds = checked
                            ? [...currentIds, agent.id]
                            : currentIds.filter(id => id !== agent.id);
                          setSchedule(prev => ({ ...prev, agentIds: newIds }));
                        }}
                      />
                      <Label className="text-sm">{agent.hostname}</Label>
                    </div>
                  ))}
                </ScrollArea>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={schedule.isActive || false}
                  onCheckedChange={(checked) => setSchedule(prev => ({ ...prev, isActive: checked }))}
                />
                <Label>Active Schedule</Label>
              </div>
            </div>

            {/* Schedule Configuration */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={schedule.frequency || 'daily'}
                    onValueChange={(value: any) => setSchedule(prev => ({ ...prev, frequency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">One-time</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="custom">Custom (Cron)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={schedule.timezone || 'America/New_York'}
                    onValueChange={(value) => setSchedule(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map(tz => (
                        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={schedule.startDate || ''}
                    onChange={(e) => setSchedule(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={schedule.startTime || ''}
                    onChange={(e) => setSchedule(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={schedule.endDate || ''}
                    onChange={(e) => setSchedule(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              {schedule.frequency === 'weekly' && (
                <div className="space-y-2">
                  <Label>Days of Week</Label>
                  <div className="flex gap-2">
                    {weekdayNames.map((day, index) => (
                      <div key={day} className="flex items-center space-x-1">
                        <Checkbox
                          checked={schedule.weekdays?.includes(index) || false}
                          onCheckedChange={(checked) => {
                            const currentDays = schedule.weekdays || [];
                            const newDays = checked
                              ? [...currentDays, index]
                              : currentDays.filter(d => d !== index);
                            setSchedule(prev => ({ ...prev, weekdays: newDays }));
                          }}
                        />
                        <Label className="text-sm">{day.slice(0, 3)}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {schedule.frequency === 'monthly' && (
                <div className="space-y-2">
                  <Label htmlFor="monthlyDay">Day of Month</Label>
                  <Input
                    id="monthlyDay"
                    type="number"
                    min="1"
                    max="31"
                    value={schedule.monthlyDay || 1}
                    onChange={(e) => setSchedule(prev => ({ ...prev, monthlyDay: parseInt(e.target.value) }))}
                  />
                </div>
              )}

              {schedule.frequency === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="customCron">Cron Expression</Label>
                  <Input
                    id="customCron"
                    value={schedule.customCron || ''}
                    onChange={(e) => setSchedule(prev => ({ ...prev, customCron: e.target.value }))}
                    placeholder="0 9 * * 1-5"
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: minute hour day month weekday (e.g., "0 9 * * 1-5" for 9 AM weekdays)
                  </p>
                </div>
              )}

              <Separator />

              {/* Advanced Options */}
              <div className="space-y-4">
                <h4 className="font-medium">Advanced Options</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxRetries">Max Retries</Label>
                    <Input
                      id="maxRetries"
                      type="number"
                      min="0"
                      max="10"
                      value={schedule.maxRetries || 3}
                      onChange={(e) => setSchedule(prev => ({ ...prev, maxRetries: parseInt(e.target.value) }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="retryDelay">Retry Delay (minutes)</Label>
                    <Input
                      id="retryDelay"
                      type="number"
                      min="1"
                      max="60"
                      value={schedule.retryDelay || 5}
                      onChange={(e) => setSchedule(prev => ({ ...prev, retryDelay: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={schedule.conditions?.onlyIfOnline || false}
                      onCheckedChange={(checked) => setSchedule(prev => ({ 
                        ...prev, 
                        conditions: { ...prev.conditions, onlyIfOnline: checked } 
                      }))}
                    />
                    <Label>Only execute on online agents</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={schedule.notifyOnSuccess || false}
                      onCheckedChange={(checked) => setSchedule(prev => ({ ...prev, notifyOnSuccess: checked }))}
                    />
                    <Label>Notify on successful execution</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={schedule.notifyOnFailure || false}
                      onCheckedChange={(checked) => setSchedule(prev => ({ ...prev, notifyOnFailure: checked }))}
                    />
                    <Label>Notify on execution failure</Label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Calendar className="h-4 w-4 mr-2" />
              {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};