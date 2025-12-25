import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Edit2, 
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Server,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useVanguardAgents } from '@/hooks/useVanguardAgents';
import { format, formatDistanceToNow } from 'date-fns';

interface ScanSchedule {
  id: string;
  schedule_name: string;
  framework_types: string[];
  schedule_cron: string | null;
  is_active: boolean;
  scan_all_agents: boolean;
  agent_ids: string[] | null;
  notification_emails: string[] | null;
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
}

const FRAMEWORK_OPTIONS = [
  { value: 'cis_windows', label: 'CIS Windows' },
  { value: 'cis_linux', label: 'CIS Linux' },
  { value: 'nist_800_53', label: 'NIST 800-53' },
  { value: 'pci_dss', label: 'PCI DSS' },
  { value: 'hipaa', label: 'HIPAA' },
  { value: 'iso_27001', label: 'ISO 27001' },
];

const SCHEDULE_OPTIONS = [
  { value: '0 0 * * *', label: 'Daily at midnight' },
  { value: '0 6 * * *', label: 'Daily at 6 AM' },
  { value: '0 0 * * 0', label: 'Weekly (Sunday midnight)' },
  { value: '0 0 * * 1', label: 'Weekly (Monday midnight)' },
  { value: '0 0 1 * *', label: 'Monthly (1st of month)' },
  { value: '0 0 15 * *', label: 'Monthly (15th of month)' },
];

export function ScheduledScansManager() {
  const { user } = useAuth();
  const { agents } = useVanguardAgents();
  const [schedules, setSchedules] = useState<ScanSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScanSchedule | null>(null);
  
  // Form state
  const [scheduleName, setScheduleName] = useState('');
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([]);
  const [selectedCron, setSelectedCron] = useState('0 0 * * *');
  const [scanAllAgents, setScanAllAgents] = useState(true);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [notificationEmail, setNotificationEmail] = useState('');

  useEffect(() => {
    if (user) {
      loadSchedules();
    }
  }, [user]);

  const loadSchedules = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('compliance_scan_schedules')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error loading schedules:', error);
      toast.error('Failed to load scan schedules');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setScheduleName('');
    setSelectedFrameworks([]);
    setSelectedCron('0 0 * * *');
    setScanAllAgents(true);
    setSelectedAgentIds([]);
    setNotificationEmail('');
    setEditingSchedule(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (schedule: ScanSchedule) => {
    setEditingSchedule(schedule);
    setScheduleName(schedule.schedule_name);
    setSelectedFrameworks(schedule.framework_types);
    setSelectedCron(schedule.schedule_cron || '0 0 * * *');
    setScanAllAgents(schedule.scan_all_agents);
    setSelectedAgentIds(schedule.agent_ids || []);
    setNotificationEmail(schedule.notification_emails?.join(', ') || '');
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !scheduleName || selectedFrameworks.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const emails = notificationEmail
        .split(',')
        .map(e => e.trim())
        .filter(e => e.length > 0);

      const scheduleData = {
        user_id: user.id,
        schedule_name: scheduleName,
        framework_types: selectedFrameworks,
        schedule_cron: selectedCron,
        scan_all_agents: scanAllAgents,
        agent_ids: scanAllAgents ? null : selectedAgentIds,
        notification_emails: emails.length > 0 ? emails : null,
        is_active: true,
      };

      if (editingSchedule) {
        const { error } = await supabase
          .from('compliance_scan_schedules')
          .update(scheduleData)
          .eq('id', editingSchedule.id);

        if (error) throw error;
        toast.success('Schedule updated');
      } else {
        const { error } = await supabase
          .from('compliance_scan_schedules')
          .insert(scheduleData);

        if (error) throw error;
        toast.success('Schedule created');
      }

      setIsDialogOpen(false);
      resetForm();
      loadSchedules();
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Failed to save schedule');
    }
  };

  const toggleSchedule = async (schedule: ScanSchedule) => {
    try {
      const { error } = await supabase
        .from('compliance_scan_schedules')
        .update({ is_active: !schedule.is_active })
        .eq('id', schedule.id);

      if (error) throw error;
      toast.success(schedule.is_active ? 'Schedule paused' : 'Schedule activated');
      loadSchedules();
    } catch (error) {
      console.error('Error toggling schedule:', error);
      toast.error('Failed to update schedule');
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      const { error } = await supabase
        .from('compliance_scan_schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;
      toast.success('Schedule deleted');
      loadSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
    }
  };

  const runNow = async (schedule: ScanSchedule) => {
    toast.info('Starting scan...');
    
    try {
      // Create a scan job for each agent
      const targetAgents = schedule.scan_all_agents 
        ? agents 
        : agents?.filter(a => schedule.agent_ids?.includes(a.id));

      for (const agent of targetAgents || []) {
        const { error } = await supabase.from('compliance_scan_jobs').insert({
          user_id: user?.id,
          agent_id: agent.id,
          framework_type: schedule.framework_types[0],
          scan_status: 'pending',
          scan_config: { frameworks: schedule.framework_types },
        });

        if (error) throw error;
      }

      // Update last run time
      await supabase
        .from('compliance_scan_schedules')
        .update({ last_run_at: new Date().toISOString() })
        .eq('id', schedule.id);

      toast.success(`Scan queued for ${targetAgents?.length || 0} agent(s)`);
      loadSchedules();
    } catch (error) {
      console.error('Error running scan:', error);
      toast.error('Failed to start scan');
    }
  };

  const getCronLabel = (cron: string | null) => {
    const found = SCHEDULE_OPTIONS.find(o => o.value === cron);
    return found?.label || cron || 'Not set';
  };

  const toggleFramework = (framework: string) => {
    setSelectedFrameworks(prev =>
      prev.includes(framework)
        ? prev.filter(f => f !== framework)
        : [...prev, framework]
    );
  };

  const toggleAgent = (agentId: string) => {
    setSelectedAgentIds(prev =>
      prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Scheduled Compliance Scans
            </CardTitle>
            <CardDescription>Automate recurring security and compliance scans</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                New Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingSchedule ? 'Edit Schedule' : 'Create Scan Schedule'}
                </DialogTitle>
                <DialogDescription>
                  Configure automated compliance scans for your infrastructure
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Schedule Name</Label>
                  <Input
                    id="name"
                    value={scheduleName}
                    onChange={(e) => setScheduleName(e.target.value)}
                    placeholder="e.g., Weekly CIS Scan"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Compliance Frameworks</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {FRAMEWORK_OPTIONS.map(fw => (
                      <div
                        key={fw.value}
                        className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                          selectedFrameworks.includes(fw.value)
                            ? 'bg-primary/10 border-primary'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => toggleFramework(fw.value)}
                      >
                        <Checkbox checked={selectedFrameworks.includes(fw.value)} />
                        <span className="text-sm">{fw.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={selectedCron} onValueChange={setSelectedCron}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCHEDULE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Scan All Agents</Label>
                    <Switch
                      checked={scanAllAgents}
                      onCheckedChange={setScanAllAgents}
                    />
                  </div>
                  
                  {!scanAllAgents && (
                    <div className="space-y-2 mt-2">
                      <Label className="text-xs text-muted-foreground">Select Agents</Label>
                      <div className="max-h-32 overflow-y-auto space-y-1 border rounded-md p-2">
                        {agents?.map(agent => (
                          <div
                            key={agent.id}
                            className={`flex items-center gap-2 p-1 rounded cursor-pointer ${
                              selectedAgentIds.includes(agent.id) ? 'bg-primary/10' : 'hover:bg-muted'
                            }`}
                            onClick={() => toggleAgent(agent.id)}
                          >
                            <Checkbox checked={selectedAgentIds.includes(agent.id)} />
                            <Server className="h-3 w-3" />
                            <span className="text-sm">{agent.name || agent.device_id}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emails">Notification Emails (comma-separated)</Label>
                  <Input
                    id="emails"
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                    placeholder="admin@example.com, security@example.com"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {editingSchedule ? 'Update' : 'Create'} Schedule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No scheduled scans yet</p>
            <p className="text-sm">Create a schedule to automate compliance scanning</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map(schedule => (
              <div
                key={schedule.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  schedule.is_active ? 'bg-card' : 'bg-muted/50 opacity-75'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${schedule.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Shield className={`h-5 w-5 ${schedule.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{schedule.schedule_name}</span>
                      {schedule.is_active ? (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Paused</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getCronLabel(schedule.schedule_cron)}
                      </span>
                      <span>
                        {schedule.scan_all_agents
                          ? 'All agents'
                          : `${schedule.agent_ids?.length || 0} agents`}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {schedule.framework_types.map(fw => (
                        <Badge key={fw} variant="outline" className="text-xs">
                          {FRAMEWORK_OPTIONS.find(f => f.value === fw)?.label || fw}
                        </Badge>
                      ))}
                    </div>
                    {schedule.last_run_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last run: {formatDistanceToNow(new Date(schedule.last_run_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => runNow(schedule)}
                    title="Run now"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleSchedule(schedule)}
                    title={schedule.is_active ? 'Pause' : 'Activate'}
                  >
                    {schedule.is_active ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(schedule)}
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteSchedule(schedule.id)}
                    title="Delete"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
