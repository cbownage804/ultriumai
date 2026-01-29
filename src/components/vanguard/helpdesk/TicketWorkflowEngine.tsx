import { useState } from 'react';
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
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  responseTimeout: number; // minutes
  resolutionTimeout: number; // minutes
  escalationPath: string[];
  isActive: boolean;
}

const mockWorkflows: WorkflowRule[] = [
  {
    id: '1',
    name: 'Auto-assign Critical Tickets',
    description: 'Automatically assign critical tickets to senior technicians',
    trigger: 'ticket_created',
    conditions: [{ field: 'priority', operator: 'equals', value: 'critical' }],
    actions: [
      { type: 'assign', parameters: { team: 'senior_support' } },
      { type: 'notify', parameters: { channel: 'slack', message: 'Critical ticket created' } }
    ],
    isActive: true,
    executionCount: 45,
    lastExecuted: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    name: 'VIP Client Fast Track',
    description: 'Elevate priority for VIP clients',
    trigger: 'ticket_created',
    conditions: [{ field: 'client_tier', operator: 'equals', value: 'vip' }],
    actions: [
      { type: 'change_priority', parameters: { priority: 'high' } },
      { type: 'add_tag', parameters: { tag: 'vip' } }
    ],
    isActive: true,
    executionCount: 23,
    lastExecuted: '2024-01-15T09:15:00Z',
  },
  {
    id: '3',
    name: 'SLA Warning Escalation',
    description: 'Escalate tickets approaching SLA breach',
    trigger: 'sla_warning',
    conditions: [{ field: 'sla_percentage', operator: 'greater_than', value: '80' }],
    actions: [
      { type: 'escalate', parameters: { level: '1' } },
      { type: 'notify', parameters: { channel: 'email', recipient: 'manager' } }
    ],
    isActive: true,
    executionCount: 12,
    lastExecuted: '2024-01-14T16:45:00Z',
  },
  {
    id: '4',
    name: 'Auto-close Resolved Tickets',
    description: 'Close tickets 48 hours after resolution if no response',
    trigger: 'time_elapsed',
    conditions: [
      { field: 'status', operator: 'equals', value: 'resolved' },
      { field: 'hours_since_update', operator: 'greater_than', value: '48' }
    ],
    actions: [
      { type: 'change_status', parameters: { status: 'closed' } }
    ],
    isActive: false,
    executionCount: 156,
  },
];

const mockEscalations: EscalationRule[] = [
  { id: '1', name: 'Critical Path', priority: 'critical', responseTimeout: 15, resolutionTimeout: 240, escalationPath: ['Senior Tech', 'Team Lead', 'Manager', 'Director'], isActive: true },
  { id: '2', name: 'High Priority Path', priority: 'high', responseTimeout: 30, resolutionTimeout: 480, escalationPath: ['Tech Team', 'Senior Tech', 'Team Lead'], isActive: true },
  { id: '3', name: 'Standard Path', priority: 'medium', responseTimeout: 120, resolutionTimeout: 1440, escalationPath: ['Tech Team', 'Senior Tech'], isActive: true },
];

const statusFlow = [
  { from: 'New', to: 'Open', auto: true },
  { from: 'Open', to: 'In Progress', auto: false },
  { from: 'In Progress', to: 'Pending', auto: false },
  { from: 'Pending', to: 'In Progress', auto: false },
  { from: 'In Progress', to: 'Resolved', auto: false },
  { from: 'Resolved', to: 'Closed', auto: true },
];

export function TicketWorkflowEngine() {
  const [workflows] = useState<WorkflowRule[]>(mockWorkflows);
  const [escalations] = useState<EscalationRule[]>(mockEscalations);
  const [activeTab, setActiveTab] = useState('workflows');
  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false);

  const activeWorkflows = workflows.filter(w => w.isActive).length;
  const totalExecutions = workflows.reduce((sum, w) => sum + w.executionCount, 0);

  const triggerLabels = {
    ticket_created: 'Ticket Created',
    status_changed: 'Status Changed',
    priority_changed: 'Priority Changed',
    sla_warning: 'SLA Warning',
    time_elapsed: 'Time Elapsed',
  };

  const actionLabels = {
    assign: 'Assign',
    change_status: 'Change Status',
    change_priority: 'Change Priority',
    notify: 'Send Notification',
    add_tag: 'Add Tag',
    escalate: 'Escalate',
  };

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
                      <Input placeholder="Auto-assign VIP tickets" />
                    </div>
                    <div className="space-y-2">
                      <Label>Trigger</Label>
                      <Select>
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
                    <Label>Conditions (When)</Label>
                    <Card className="p-3">
                      <div className="flex gap-2">
                        <Select>
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Field" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="priority">Priority</SelectItem>
                            <SelectItem value="client">Client</SelectItem>
                            <SelectItem value="category">Category</SelectItem>
                            <SelectItem value="status">Status</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select>
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Operator" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="not_equals">Not Equals</SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input placeholder="Value" className="flex-1" />
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Condition
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Actions (Then)</Label>
                    <Card className="p-3">
                      <div className="flex gap-2">
                        <Select>
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Action" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="assign">Assign To</SelectItem>
                            <SelectItem value="change_priority">Change Priority</SelectItem>
                            <SelectItem value="change_status">Change Status</SelectItem>
                            <SelectItem value="notify">Send Notification</SelectItem>
                            <SelectItem value="add_tag">Add Tag</SelectItem>
                            <SelectItem value="escalate">Escalate</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input placeholder="Parameter" className="flex-1" />
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Action
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch defaultChecked />
                    <Label>Active</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowWorkflowDialog(false)}>Cancel</Button>
                  <Button onClick={() => setShowWorkflowDialog(false)}>Create Workflow</Button>
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
              <TabsTrigger value="assignments">Auto-Assignment</TabsTrigger>
            </TabsList>

            {/* Workflows Tab */}
            <TabsContent value="workflows" className="mt-4">
              <div className="space-y-3">
                {workflows.map(workflow => (
                  <Card key={workflow.id} className={cn(
                    workflow.isActive ? "border-green-500/30" : "border-muted"
                  )}>
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

                          <div className="flex flex-wrap gap-1 mt-2">
                            {workflow.actions.map((action, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {actionLabels[action.type]}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Switch checked={workflow.isActive} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Escalations Tab */}
            <TabsContent value="escalations" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Response Timeout</TableHead>
                    <TableHead>Resolution Timeout</TableHead>
                    <TableHead>Escalation Path</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {escalations.map(rule => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>
                        <Badge variant={
                          rule.priority === 'critical' ? 'destructive' :
                          rule.priority === 'high' ? 'default' : 'secondary'
                        }>
                          {rule.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{rule.responseTimeout} min</TableCell>
                      <TableCell>{rule.resolutionTimeout} min</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs">
                          {rule.escalationPath.map((level, i) => (
                            <span key={i} className="flex items-center">
                              {i > 0 && <ArrowRight className="h-3 w-3 mx-1 text-muted-foreground" />}
                              <Badge variant="outline">{level}</Badge>
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch checked={rule.isActive} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            {/* Status Flow Tab */}
            <TabsContent value="status" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Ticket Status Transitions</CardTitle>
                  <CardDescription>Define allowed status changes and automatic transitions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap justify-center gap-4 p-6">
                    {['New', 'Open', 'In Progress', 'Pending', 'Resolved', 'Closed'].map((status, i) => (
                      <div 
                        key={status}
                        className={cn(
                          "px-4 py-2 rounded-lg border-2 font-medium",
                          status === 'New' && "border-blue-500 bg-blue-500/10 text-blue-500",
                          status === 'Open' && "border-cyan-500 bg-cyan-500/10 text-cyan-500",
                          status === 'In Progress' && "border-yellow-500 bg-yellow-500/10 text-yellow-500",
                          status === 'Pending' && "border-orange-500 bg-orange-500/10 text-orange-500",
                          status === 'Resolved' && "border-green-500 bg-green-500/10 text-green-500",
                          status === 'Closed' && "border-muted bg-muted/20 text-muted-foreground"
                        )}
                      >
                        {status}
                      </div>
                    ))}
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>From Status</TableHead>
                        <TableHead></TableHead>
                        <TableHead>To Status</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statusFlow.map((flow, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Badge variant="outline">{flow.from}</Badge>
                          </TableCell>
                          <TableCell>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{flow.to}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={flow.auto ? 'default' : 'secondary'}>
                              {flow.auto ? 'Automatic' : 'Manual'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">Edit</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Auto-Assignment Tab */}
            <TabsContent value="assignments" className="mt-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Round-Robin Assignment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm">Distribute new tickets evenly across available technicians</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Respects working hours, skill matching, and current workload
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Skill-Based Routing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm">Match tickets to technicians based on required skills</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Uses ticket category and technician skill profiles
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Workload Balancing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm">Consider current ticket load when assigning</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Prevents technician overload during peak times
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
