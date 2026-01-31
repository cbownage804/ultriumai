import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Webhook, Zap, Plus, Play, Pause, Trash2, Settings, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ScheduledTask {
  id: string;
  task_name: string;
  task_type: string;
  schedule_cron: string;
  schedule_timezone: string;
  is_active: boolean;
  last_run_at: string;
  next_run_at: string;
  run_count: number;
  last_status: string;
  last_error: string;
  config: any;
}

interface Webhook {
  id: string;
  webhook_name: string;
  endpoint_url: string;
  events: string[];
  is_active: boolean;
  retry_count: number;
  timeout_seconds: number;
  last_triggered_at: string;
  success_count: number;
  failure_count: number;
}

interface WebhookLog {
  id: string;
  event_type: string;
  response_status: number;
  success: boolean;
  duration_ms: number;
  created_at: string;
}

interface WorkflowTrigger {
  id: string;
  trigger_name: string;
  trigger_type: string;
  trigger_config: any;
  action_type: string;
  action_config: any;
  is_active: boolean;
  execution_count: number;
  last_executed_at: string;
}

export function AdvancedAutomationsEngine() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [triggers, setTriggers] = useState<WorkflowTrigger[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);
  const [showTriggerDialog, setShowTriggerDialog] = useState(false);

  const [taskForm, setTaskForm] = useState({
    task_name: "",
    task_type: "report",
    schedule_cron: "0 9 * * *",
    schedule_timezone: "UTC",
    config: {}
  });

  const [webhookForm, setWebhookForm] = useState({
    webhook_name: "",
    endpoint_url: "",
    events: [] as string[],
    retry_count: 3,
    timeout_seconds: 30
  });

  const [triggerForm, setTriggerForm] = useState({
    trigger_name: "",
    trigger_type: "event_based",
    trigger_config: {},
    action_type: "email",
    action_config: {}
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [tasksRes, webhooksRes, triggersRes] = await Promise.all([
        (supabase as any).from('vanguard_scheduled_tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        (supabase as any).from('vanguard_webhooks').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        (supabase as any).from('vanguard_workflow_triggers').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);

      if (tasksRes.data) setTasks(tasksRes.data);
      if (webhooksRes.data) setWebhooks(webhooksRes.data);
      if (triggersRes.data) setTriggers(triggersRes.data);

    } catch (error) {
      console.error('Error loading automation data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWebhookLogs = async (webhookId: string) => {
    const { data } = await (supabase as any)
      .from('vanguard_webhook_logs')
      .select('*')
      .eq('webhook_id', webhookId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) setWebhookLogs(data);
  };

  const createTask = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate next run time based on cron
      const nextRun = new Date();
      nextRun.setHours(nextRun.getHours() + 1); // Simplified - would use a cron parser

      await (supabase as any)
        .from('vanguard_scheduled_tasks')
        .insert({
          user_id: user.id,
          ...taskForm,
          next_run_at: nextRun.toISOString(),
          is_active: true
        });

      toast({ title: "Task Created", description: "Scheduled task has been created successfully." });
      setShowTaskDialog(false);
      setTaskForm({ task_name: "", task_type: "report", schedule_cron: "0 9 * * *", schedule_timezone: "UTC", config: {} });
      loadData();

    } catch (error) {
      toast({ title: "Error", description: "Failed to create task", variant: "destructive" });
    }
  };

  const createWebhook = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Generate secret key
      const secretKey = `whk_${Math.random().toString(36).substr(2, 32)}`;

      await (supabase as any)
        .from('vanguard_webhooks')
        .insert({
          user_id: user.id,
          ...webhookForm,
          secret_key: secretKey,
          is_active: true
        });

      toast({ title: "Webhook Created", description: "Webhook endpoint has been configured." });
      setShowWebhookDialog(false);
      setWebhookForm({ webhook_name: "", endpoint_url: "", events: [], retry_count: 3, timeout_seconds: 30 });
      loadData();

    } catch (error) {
      toast({ title: "Error", description: "Failed to create webhook", variant: "destructive" });
    }
  };

  const createTrigger = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await (supabase as any)
        .from('vanguard_workflow_triggers')
        .insert({
          user_id: user.id,
          ...triggerForm,
          is_active: true
        });

      toast({ title: "Trigger Created", description: "Workflow trigger has been configured." });
      setShowTriggerDialog(false);
      setTriggerForm({ trigger_name: "", trigger_type: "event_based", trigger_config: {}, action_type: "email", action_config: {} });
      loadData();

    } catch (error) {
      toast({ title: "Error", description: "Failed to create trigger", variant: "destructive" });
    }
  };

  const toggleTask = async (taskId: string, isActive: boolean) => {
    await (supabase as any)
      .from('vanguard_scheduled_tasks')
      .update({ is_active: !isActive, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_active: !isActive } : t));
  };

  const toggleWebhook = async (webhookId: string, isActive: boolean) => {
    await (supabase as any)
      .from('vanguard_webhooks')
      .update({ is_active: !isActive, updated_at: new Date().toISOString() })
      .eq('id', webhookId);

    setWebhooks(prev => prev.map(w => w.id === webhookId ? { ...w, is_active: !isActive } : w));
  };

  const toggleTrigger = async (triggerId: string, isActive: boolean) => {
    await (supabase as any)
      .from('vanguard_workflow_triggers')
      .update({ is_active: !isActive, updated_at: new Date().toISOString() })
      .eq('id', triggerId);

    setTriggers(prev => prev.map(t => t.id === triggerId ? { ...t, is_active: !isActive } : t));
  };

  const deleteTask = async (taskId: string) => {
    await (supabase as any).from('vanguard_scheduled_tasks').delete().eq('id', taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
    toast({ title: "Task Deleted" });
  };

  const deleteWebhook = async (webhookId: string) => {
    await (supabase as any).from('vanguard_webhooks').delete().eq('id', webhookId);
    setWebhooks(prev => prev.filter(w => w.id !== webhookId));
    toast({ title: "Webhook Deleted" });
  };

  const deleteTrigger = async (triggerId: string) => {
    await (supabase as any).from('vanguard_workflow_triggers').delete().eq('id', triggerId);
    setTriggers(prev => prev.filter(t => t.id !== triggerId));
    toast({ title: "Trigger Deleted" });
  };

  const toggleEvent = (event: string) => {
    setWebhookForm(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">Never Run</Badge>;
    switch (status) {
      case 'success': return <Badge className="bg-green-500">Success</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      case 'running': return <Badge className="bg-blue-500">Running</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const cronPresets = [
    { label: "Every hour", value: "0 * * * *" },
    { label: "Daily at 9 AM", value: "0 9 * * *" },
    { label: "Daily at 6 PM", value: "0 18 * * *" },
    { label: "Weekly (Monday 9 AM)", value: "0 9 * * 1" },
    { label: "Monthly (1st at 9 AM)", value: "0 9 1 * *" }
  ];

  const eventTypes = [
    "ticket_created",
    "ticket_updated",
    "ticket_closed",
    "sla_breach",
    "escalation",
    "assignment_changed",
    "comment_added",
    "security_alert"
  ];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="scheduled">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scheduled">
            <Clock className="h-4 w-4 mr-2" />
            Scheduled Tasks
          </TabsTrigger>
          <TabsTrigger value="webhooks">
            <Webhook className="h-4 w-4 mr-2" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="triggers">
            <Zap className="h-4 w-4 mr-2" />
            Workflow Triggers
          </TabsTrigger>
        </TabsList>

        {/* Scheduled Tasks */}
        <TabsContent value="scheduled" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Scheduled Tasks
                  </CardTitle>
                  <CardDescription>
                    Automated tasks that run on a schedule
                  </CardDescription>
                </div>
                <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Scheduled Task</DialogTitle>
                      <DialogDescription>
                        Set up an automated task to run on a schedule
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Task Name</Label>
                        <Input
                          value={taskForm.task_name}
                          onChange={(e) => setTaskForm(prev => ({ ...prev, task_name: e.target.value }))}
                          placeholder="Daily Backup Report"
                        />
                      </div>
                      <div>
                        <Label>Task Type</Label>
                        <Select
                          value={taskForm.task_type}
                          onValueChange={(value) => setTaskForm(prev => ({ ...prev, task_type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="report">Report Generation</SelectItem>
                            <SelectItem value="backup">Data Backup</SelectItem>
                            <SelectItem value="sync">Data Sync</SelectItem>
                            <SelectItem value="cleanup">Cleanup</SelectItem>
                            <SelectItem value="notification">Send Notifications</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Schedule (Cron Expression)</Label>
                        <Input
                          value={taskForm.schedule_cron}
                          onChange={(e) => setTaskForm(prev => ({ ...prev, schedule_cron: e.target.value }))}
                          placeholder="0 9 * * *"
                        />
                        <div className="flex flex-wrap gap-2 mt-2">
                          {cronPresets.map((preset) => (
                            <Button
                              key={preset.value}
                              variant="outline"
                              size="sm"
                              onClick={() => setTaskForm(prev => ({ ...prev, schedule_cron: preset.value }))}
                            >
                              {preset.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label>Timezone</Label>
                        <Select
                          value={taskForm.schedule_timezone}
                          onValueChange={(value) => setTaskForm(prev => ({ ...prev, schedule_timezone: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="America/New_York">Eastern</SelectItem>
                            <SelectItem value="America/Chicago">Central</SelectItem>
                            <SelectItem value="America/Denver">Mountain</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={createTask} className="w-full">Create Task</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No scheduled tasks. Create one to automate recurring jobs.
                </p>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${task.is_active ? 'bg-green-500/10' : 'bg-muted'}`}>
                          <Clock className={`h-5 w-5 ${task.is_active ? 'text-green-500' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <p className="font-medium">{task.task_name}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Badge variant="outline">{task.task_type}</Badge>
                            <span>{task.schedule_cron}</span>
                            <span>Runs: {task.run_count}</span>
                          </div>
                          {task.next_run_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Next run: {new Date(task.next_run_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(task.last_status)}
                        <Switch
                          checked={task.is_active}
                          onCheckedChange={() => toggleTask(task.id, task.is_active)}
                        />
                        <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks */}
        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Webhook className="h-5 w-5" />
                    Webhook Integrations
                  </CardTitle>
                  <CardDescription>
                    Send real-time events to external systems
                  </CardDescription>
                </div>
                <Dialog open={showWebhookDialog} onOpenChange={setShowWebhookDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Webhook
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Webhook</DialogTitle>
                      <DialogDescription>
                        Configure an endpoint to receive event notifications
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Webhook Name</Label>
                        <Input
                          value={webhookForm.webhook_name}
                          onChange={(e) => setWebhookForm(prev => ({ ...prev, webhook_name: e.target.value }))}
                          placeholder="Slack Notifications"
                        />
                      </div>
                      <div>
                        <Label>Endpoint URL</Label>
                        <Input
                          value={webhookForm.endpoint_url}
                          onChange={(e) => setWebhookForm(prev => ({ ...prev, endpoint_url: e.target.value }))}
                          placeholder="https://hooks.slack.com/services/..."
                        />
                      </div>
                      <div>
                        <Label className="mb-2 block">Events to Send</Label>
                        <div className="flex flex-wrap gap-2">
                          {eventTypes.map((event) => (
                            <Button
                              key={event}
                              variant={webhookForm.events.includes(event) ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleEvent(event)}
                            >
                              {event.replace(/_/g, ' ')}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Retry Count</Label>
                          <Input
                            type="number"
                            value={webhookForm.retry_count}
                            onChange={(e) => setWebhookForm(prev => ({ ...prev, retry_count: parseInt(e.target.value) }))}
                          />
                        </div>
                        <div>
                          <Label>Timeout (seconds)</Label>
                          <Input
                            type="number"
                            value={webhookForm.timeout_seconds}
                            onChange={(e) => setWebhookForm(prev => ({ ...prev, timeout_seconds: parseInt(e.target.value) }))}
                          />
                        </div>
                      </div>
                      <Button onClick={createWebhook} className="w-full">Create Webhook</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {webhooks.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No webhooks configured. Add one to integrate with external systems.
                </p>
              ) : (
                <div className="space-y-4">
                  {webhooks.map((webhook) => (
                    <div key={webhook.id} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Webhook className={`h-5 w-5 ${webhook.is_active ? 'text-green-500' : 'text-muted-foreground'}`} />
                          <div>
                            <p className="font-medium">{webhook.webhook_name}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-md">
                              {webhook.endpoint_url}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={webhook.is_active}
                            onCheckedChange={() => toggleWebhook(webhook.id, webhook.is_active)}
                          />
                          <Button variant="ghost" size="icon" onClick={() => deleteWebhook(webhook.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          {webhook.success_count} success
                        </span>
                        <span className="flex items-center gap-1">
                          <XCircle className="h-3 w-3 text-red-500" />
                          {webhook.failure_count} failed
                        </span>
                        {webhook.last_triggered_at && (
                          <span>Last: {new Date(webhook.last_triggered_at).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow Triggers */}
        <TabsContent value="triggers" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Workflow Triggers
                  </CardTitle>
                  <CardDescription>
                    Automated actions based on events or conditions
                  </CardDescription>
                </div>
                <Dialog open={showTriggerDialog} onOpenChange={setShowTriggerDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Trigger
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Workflow Trigger</DialogTitle>
                      <DialogDescription>
                        Set up an automated action when conditions are met
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Trigger Name</Label>
                        <Input
                          value={triggerForm.trigger_name}
                          onChange={(e) => setTriggerForm(prev => ({ ...prev, trigger_name: e.target.value }))}
                          placeholder="Auto-assign critical tickets"
                        />
                      </div>
                      <div>
                        <Label>Trigger Type</Label>
                        <Select
                          value={triggerForm.trigger_type}
                          onValueChange={(value) => setTriggerForm(prev => ({ ...prev, trigger_type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="event_based">Event Based</SelectItem>
                            <SelectItem value="time_based">Time Based</SelectItem>
                            <SelectItem value="condition_based">Condition Based</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Action Type</Label>
                        <Select
                          value={triggerForm.action_type}
                          onValueChange={(value) => setTriggerForm(prev => ({ ...prev, action_type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Send Email</SelectItem>
                            <SelectItem value="webhook">Call Webhook</SelectItem>
                            <SelectItem value="assign">Assign Ticket</SelectItem>
                            <SelectItem value="escalate">Escalate</SelectItem>
                            <SelectItem value="update_field">Update Field</SelectItem>
                            <SelectItem value="add_tag">Add Tag</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={createTrigger} className="w-full">Create Trigger</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {triggers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No workflow triggers. Create one to automate actions.
                </p>
              ) : (
                <div className="space-y-4">
                  {triggers.map((trigger) => (
                    <div key={trigger.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${trigger.is_active ? 'bg-purple-500/10' : 'bg-muted'}`}>
                          <Zap className={`h-5 w-5 ${trigger.is_active ? 'text-purple-500' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <p className="font-medium">{trigger.trigger_name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline">{trigger.trigger_type}</Badge>
                            <span>→</span>
                            <Badge variant="outline">{trigger.action_type}</Badge>
                            <span>Executed: {trigger.execution_count}x</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={trigger.is_active}
                          onCheckedChange={() => toggleTrigger(trigger.id, trigger.is_active)}
                        />
                        <Button variant="ghost" size="icon" onClick={() => deleteTrigger(trigger.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
