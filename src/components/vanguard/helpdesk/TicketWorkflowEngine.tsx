import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Workflow, 
  GitBranch, 
  ArrowRight,
  Play,
  Pause,
  Settings,
  Plus,
  Trash2,
  Clock,
  Users,
  Bell,
  CheckCircle,
  AlertTriangle,
  Zap,
  Filter,
  Target,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  trigger: 'ticket_created' | 'status_changed' | 'priority_changed' | 'sla_warning' | 'time_elapsed';
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  isActive: boolean;
  executionCount: number;
  lastExecuted?: string;
}

interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string;
}

interface WorkflowAction {
  type: 'assign' | 'change_status' | 'change_priority' | 'notify' | 'add_tag' | 'escalate';
  parameters: Record<string, string>;
}

interface EscalationRule {
  id: string;
  name: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  responseTimeout: number;
  resolutionTimeout: number;
  escalationPath: string[];
  isActive: boolean;
}

const statusFlow = [
  { from: 'New', to: 'Open', auto: true },
  { from: 'Open', to: 'In Progress', auto: false },
  { from: 'In Progress', to: 'Pending', auto: false },
  { from: 'Pending', to: 'In Progress', auto: false },
  { from: 'In Progress', to: 'Resolved', auto: false },
  { from: 'Resolved', to: 'Closed', auto: true },
];

export function TicketWorkflowEngine() {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<WorkflowRule[]>([]);
  const [escalations, setEscalations] = useState<EscalationRule[]>([]);
  const [activeTab, setActiveTab] = useState('workflows');
  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newWorkflow, setNewWorkflow] = useState({ name: '', description: '', trigger: 'ticket_created' as const });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [workflowRes, escalationRes] = await Promise.all([
        (supabase as any).from('vanguard_workflow_rules').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        (supabase as any).from('vanguard_escalation_rules').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);

      if (workflowRes.data) {
        setWorkflows(workflowRes.data.map((w: any) => ({
          id: w.id,
          name: w.name,
          description: w.description || '',
          trigger: w.trigger_event,
          conditions: w.conditions || [],
          actions: w.actions || [],
          isActive: w.is_active,
          executionCount: w.execution_count || 0,
          lastExecuted: w.last_executed_at
        })));
      }

      if (escalationRes.data) {
        setEscalations(escalationRes.data.map((e: any) => ({
          id: e.id,
          name: e.name,
          priority: e.priority,
          responseTimeout: e.response_timeout_minutes,
          resolutionTimeout: e.resolution_timeout_minutes,
          escalationPath: e.escalation_path || [],
          isActive: e.is_active
        })));
      }
    } catch (error) {
      console.error('Error loading workflow data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWorkflow = async () => {
    if (!user || !newWorkflow.name) return;
    try {
      const { error } = await (supabase as any).from('vanguard_workflow_rules').insert({
        user_id: user.id,
        name: newWorkflow.name,
        description: newWorkflow.description,
        trigger_event: newWorkflow.trigger,
        conditions: [],
        actions: [],
        is_active: true
      });
      if (error) throw error;
      toast.success('Workflow created');
      setShowWorkflowDialog(false);
      setNewWorkflow({ name: '', description: '', trigger: 'ticket_created' });
      loadData();
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast.error('Failed to create workflow');
    }
  };

  const toggleWorkflowActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await (supabase as any).from('vanguard_workflow_rules').update({ is_active: !isActive }).eq('id', id);
      if (error) throw error;
      setWorkflows(prev => prev.map(w => w.id === id ? { ...w, isActive: !isActive } : w));
    } catch (error) {
      console.error('Error toggling workflow:', error);
    }
  };

  const activeWorkflows = workflows.filter(w => w.isActive).length;
  const totalExecutions = workflows.reduce((sum, w) => sum + w.executionCount, 0);

  const triggerLabels = {
    ticket_created: 'Ticket Created',
    status_changed: 'Status Changed',
    priority_changed: 'Priority Changed',
    sla_warning: 'SLA Warning',
    time_elapsed: 'Time Elapsed',
  };

  const actionLabels: Record<string, string> = {
    assign: 'Assign',
    change_status: 'Change Status',
    change_priority: 'Change Priority',
    notify: 'Send Notification',
    add_tag: 'Add Tag',
    escalate: 'Escalate',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-cyan-500/30 bg-cyan-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Active Workflows</p>
                <p className="text-3xl font-bold">{activeWorkflows}</p>
                <p className="text-xs text-muted-foreground">of {workflows.length} total</p>
              </div>
              <Workflow className="h-8 w-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Total Executions</p>
                <p className="text-3xl font-bold text-green-500">{totalExecutions}</p>
                <p className="text-xs text-muted-foreground">All time</p>
              </div>
              <Zap className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/30 bg-purple-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Escalation Rules</p>
                <p className="text-3xl font-bold">{escalations.filter(e => e.isActive).length}</p>
                <p className="text-xs text-muted-foreground">Active paths</p>
              </div>
              <GitBranch className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Status Transitions</p>
                <p className="text-3xl font-bold">{statusFlow.length}</p>
                <p className="text-xs text-muted-foreground">Defined flows</p>
              </div>
              <ArrowRight className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5 text-cyan-500" />
                Ticket Workflow Engine
              </CardTitle>
              <CardDescription>Automate ticket routing, assignment, and escalation</CardDescription>
            </div>
            <Dialog open={showWorkflowDialog} onOpenChange={setShowWorkflowDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Workflow
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Workflow Rule</DialogTitle>
                  <DialogDescription>Define conditions and actions for automatic ticket handling</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Workflow Name</Label>
                      <Input 
                        placeholder="Auto-assign VIP tickets" 
                        value={newWorkflow.name}
                        onChange={(e) => setNewWorkflow(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Trigger</Label>
                      <Select 
                        value={newWorkflow.trigger}
                        onValueChange={(val) => setNewWorkflow(prev => ({ ...prev, trigger: val as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select trigger" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ticket_created">Ticket Created</SelectItem>
                          <SelectItem value="status_changed">Status Changed</SelectItem>
                          <SelectItem value="priority_changed">Priority Changed</SelectItem>
                          <SelectItem value="sla_warning">SLA Warning</SelectItem>
                          <SelectItem value="time_elapsed">Time Elapsed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input 
                      placeholder="Describe what this workflow does"
                      value={newWorkflow.description}
                      onChange={(e) => setNewWorkflow(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowWorkflowDialog(false)}>Cancel</Button>
                  <Button onClick={handleCreateWorkflow}>Create Workflow</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="workflows">Automation Rules</TabsTrigger>
              <TabsTrigger value="escalations">Escalation Paths</TabsTrigger>
              <TabsTrigger value="status">Status Flow</TabsTrigger>
            </TabsList>

            <TabsContent value="workflows" className="mt-4">
              <div className="space-y-3">
                {workflows.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Workflow className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No workflow rules configured yet</p>
                    <Button variant="outline" className="mt-4" onClick={() => setShowWorkflowDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />Create First Workflow
                    </Button>
                  </div>
                ) : (
                  workflows.map(workflow => (
                    <Card key={workflow.id} className={cn(workflow.isActive ? "border-green-500/30" : "border-muted")}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              {workflow.isActive ? (
                                <Play className="h-4 w-4 text-green-500" />
                              ) : (
                                <Pause className="h-4 w-4 text-muted-foreground" />
                              )}
                              <p className="font-medium">{workflow.name}</p>
                              <Badge variant="outline">{triggerLabels[workflow.trigger]}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{workflow.description}</p>
                            <div className="flex items-center gap-4 text-xs">
                              <div className="flex items-center gap-1">
                                <Filter className="h-3 w-3" />
                                <span>{workflow.conditions.length} conditions</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                <span>{workflow.actions.length} actions</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                <span>{workflow.executionCount} executions</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 items-center">
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Switch 
                              checked={workflow.isActive} 
                              onCheckedChange={() => toggleWorkflowActive(workflow.id, workflow.isActive)}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="escalations" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Resolution Time</TableHead>
                    <TableHead>Escalation Path</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {escalations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No escalation rules configured
                      </TableCell>
                    </TableRow>
                  ) : (
                    escalations.map(escalation => (
                      <TableRow key={escalation.id}>
                        <TableCell className="font-medium">{escalation.name}</TableCell>
                        <TableCell>
                          <Badge variant={escalation.priority === 'critical' ? 'destructive' : 'outline'}>
                            {escalation.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{escalation.responseTimeout} min</TableCell>
                        <TableCell>{Math.floor(escalation.resolutionTimeout / 60)} hrs</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs">
                            {escalation.escalationPath.map((step, i) => (
                              <span key={i} className="flex items-center gap-1">
                                {i > 0 && <ArrowRight className="h-3 w-3" />}
                                <Badge variant="secondary" className="text-xs">{step}</Badge>
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={escalation.isActive ? 'default' : 'outline'}>
                            {escalation.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="status" className="mt-4">
              <div className="flex flex-wrap justify-center gap-8 py-8">
                {statusFlow.map((flow, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Badge variant="outline" className="px-3 py-1">{flow.from}</Badge>
                    <ArrowRight className={cn("h-4 w-4", flow.auto ? "text-green-500" : "text-muted-foreground")} />
                    <Badge variant="outline" className="px-3 py-1">{flow.to}</Badge>
                    {flow.auto && <Badge className="bg-green-500/20 text-green-500 text-xs">Auto</Badge>}
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}