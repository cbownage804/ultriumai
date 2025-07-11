import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Workflow, 
  Plus, 
  Play, 
  Pause, 
  Settings, 
  Clock,
  Zap,
  Mail,
  MessageSquare,
  Database,
  Filter,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Users,
  Ticket
} from "lucide-react";

interface WorkflowAction {
  id: string;
  type: string;
  name: string;
  config: any;
}

interface WorkflowCondition {
  field: string;
  operator: string;
  value: string;
}

interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: string;
    conditions: WorkflowCondition[];
  };
  actions: WorkflowAction[];
  isActive: boolean;
  lastRun?: string;
  runCount: number;
  successRate: number;
}

export const WorkflowBuilder = () => {
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([
    {
      id: "auto-escalate",
      name: "Auto-escalate Critical Alerts",
      description: "Automatically escalate critical security alerts to senior technicians",
      trigger: {
        type: "alert_created",
        conditions: [
          { field: "severity", operator: "equals", value: "critical" }
        ]
      },
      actions: [
        {
          id: "assign-senior",
          type: "assign_ticket",
          name: "Assign to Senior Tech",
          config: { assignee: "senior-tech-group" }
        },
        {
          id: "send-sms",
          type: "send_notification",
          name: "Send SMS Alert",
          config: { method: "sms", recipients: ["on-call-team"] }
        }
      ],
      isActive: true,
      lastRun: "2 hours ago",
      runCount: 24,
      successRate: 96
    },
    {
      id: "client-onboarding",
      name: "New Client Onboarding",
      description: "Automate setup tasks when a new client is added",
      trigger: {
        type: "client_created",
        conditions: []
      },
      actions: [
        {
          id: "create-folders",
          type: "create_structure",
          name: "Create Client Folders",
          config: { template: "standard-client" }
        },
        {
          id: "deploy-agents",
          type: "deploy_agents",
          name: "Deploy RMM Agents",
          config: { agentType: "standard" }
        },
        {
          id: "welcome-email",
          type: "send_email",
          name: "Send Welcome Email",
          config: { template: "client-welcome" }
        }
      ],
      isActive: true,
      lastRun: "1 day ago",
      runCount: 8,
      successRate: 100
    },
    {
      id: "maintenance-window",
      name: "Maintenance Window Notifications",
      description: "Notify clients before scheduled maintenance",
      trigger: {
        type: "scheduled",
        conditions: [
          { field: "time_before", operator: "equals", value: "24_hours" }
        ]
      },
      actions: [
        {
          id: "client-notification",
          type: "send_notification",
          name: "Notify Clients",
          config: { method: "email", template: "maintenance-notification" }
        },
        {
          id: "disable-monitoring",
          type: "toggle_monitoring",
          name: "Disable Alerts",
          config: { action: "disable", duration: "maintenance_window" }
        }
      ],
      isActive: false,
      lastRun: "3 days ago",
      runCount: 12,
      successRate: 92
    }
  ]);

  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<AutomationWorkflow | null>(null);
  const [newWorkflow, setNewWorkflow] = useState({
    name: "",
    description: "",
    trigger: { type: "", conditions: [] as WorkflowCondition[] },
    actions: [] as WorkflowAction[]
  });

  const { toast } = useToast();

  const triggerTypes = [
    { value: "alert_created", label: "Alert Created" },
    { value: "ticket_created", label: "Ticket Created" },
    { value: "client_created", label: "Client Added" },
    { value: "endpoint_offline", label: "Endpoint Offline" },
    { value: "scheduled", label: "Scheduled" }
  ];

  const actionTypes = [
    { value: "assign_ticket", label: "Assign Ticket", icon: Users },
    { value: "send_email", label: "Send Email", icon: Mail },
    { value: "send_notification", label: "Send Notification", icon: MessageSquare },
    { value: "create_ticket", label: "Create Ticket", icon: Ticket },
    { value: "deploy_agents", label: "Deploy Agents", icon: Database },
    { value: "toggle_monitoring", label: "Toggle Monitoring", icon: Settings }
  ];

  const toggleWorkflow = (workflowId: string) => {
    setWorkflows(prev => prev.map(w => 
      w.id === workflowId 
        ? { ...w, isActive: !w.isActive }
        : w
    ));
    
    const workflow = workflows.find(w => w.id === workflowId);
    toast({
      title: `Workflow ${workflow?.isActive ? 'Disabled' : 'Enabled'}`,
      description: `${workflow?.name} has been ${workflow?.isActive ? 'disabled' : 'enabled'}.`
    });
  };

  const runWorkflow = (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId);
    toast({
      title: "Workflow Executed",
      description: `${workflow?.name} has been executed manually.`
    });
    
    setWorkflows(prev => prev.map(w => 
      w.id === workflowId 
        ? { ...w, lastRun: "Just now", runCount: w.runCount + 1 }
        : w
    ));
  };

  const addCondition = () => {
    setNewWorkflow(prev => ({
      ...prev,
      trigger: {
        ...prev.trigger,
        conditions: [...prev.trigger.conditions, { field: "", operator: "", value: "" }]
      }
    }));
  };

  const addAction = () => {
    const newAction: WorkflowAction = {
      id: Date.now().toString(),
      type: "",
      name: "",
      config: {}
    };
    setNewWorkflow(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }));
  };

  const createWorkflow = () => {
    if (!newWorkflow.name || !newWorkflow.trigger.type) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const workflow: AutomationWorkflow = {
      id: Date.now().toString(),
      ...newWorkflow,
      isActive: false,
      runCount: 0,
      successRate: 0
    };

    setWorkflows(prev => [...prev, workflow]);
    setNewWorkflow({
      name: "",
      description: "",
      trigger: { type: "", conditions: [] },
      actions: []
    });
    setShowWorkflowDialog(false);
    
    toast({
      title: "Workflow Created",
      description: "New automation workflow has been created successfully."
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Workflow Automation</h2>
          <p className="text-muted-foreground">
            Build and manage automated workflows for your MSP operations
          </p>
        </div>
        <Dialog open={showWorkflowDialog} onOpenChange={setShowWorkflowDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Workflow</DialogTitle>
              <DialogDescription>
                Build an automated workflow to streamline your operations
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 max-h-96 overflow-y-auto">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="workflow-name">Workflow Name</Label>
                  <Input
                    id="workflow-name"
                    value={newWorkflow.name}
                    onChange={(e) => setNewWorkflow(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Auto-escalate Critical Alerts"
                  />
                </div>
                <div>
                  <Label htmlFor="workflow-description">Description</Label>
                  <Textarea
                    id="workflow-description"
                    value={newWorkflow.description}
                    onChange={(e) => setNewWorkflow(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this workflow does..."
                  />
                </div>
              </div>

              {/* Trigger */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Trigger</h3>
                <div>
                  <Label htmlFor="trigger-type">When should this workflow run?</Label>
                  <Select value={newWorkflow.trigger.type} onValueChange={(value) => 
                    setNewWorkflow(prev => ({ ...prev, trigger: { ...prev.trigger, type: value } }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select trigger type" />
                    </SelectTrigger>
                    <SelectContent>
                      {triggerTypes.map((trigger) => (
                        <SelectItem key={trigger.value} value={trigger.value}>
                          {trigger.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" onClick={addCondition}>
                  <Filter className="h-4 w-4 mr-2" />
                  Add Condition
                </Button>
              </div>

              {/* Actions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Actions</h3>
                <p className="text-sm text-muted-foreground">
                  What should happen when this workflow is triggered?
                </p>
                <Button variant="outline" size="sm" onClick={addAction}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Action
                </Button>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowWorkflowDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createWorkflow}>Create Workflow</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Workflow className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{workflows.length}</p>
                <p className="text-sm text-muted-foreground">Total Workflows</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{workflows.filter(w => w.isActive).length}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{workflows.reduce((sum, w) => sum + w.runCount, 0)}</p>
                <p className="text-sm text-muted-foreground">Total Runs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Math.round(workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length || 0)}%
                </p>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-muted">
                    <Workflow className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{workflow.name}</CardTitle>
                    <CardDescription>{workflow.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={workflow.isActive ? "default" : "secondary"}>
                    {workflow.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Switch
                    checked={workflow.isActive}
                    onCheckedChange={() => toggleWorkflow(workflow.id)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Trigger</p>
                  <p className="font-medium capitalize">{workflow.trigger.type.replace('_', ' ')}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Actions</p>
                  <p className="font-medium">{workflow.actions.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Runs</p>
                  <p className="font-medium">{workflow.runCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="font-medium">{workflow.successRate}%</p>
                </div>
              </div>
              
              {/* Workflow Flow */}
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg mb-4">
                <Badge variant="outline">
                  {workflow.trigger.type.replace('_', ' ')}
                </Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="flex gap-1">
                  {workflow.actions.map((action, index) => (
                    <div key={action.id} className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {action.type.replace('_', ' ')}
                      </Badge>
                      {index < workflow.actions.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {workflow.lastRun && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last run: {workflow.lastRun}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => runWorkflow(workflow.id)}>
                    <Play className="h-4 w-4 mr-1" />
                    Run Now
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedWorkflow(workflow)}>
                    <Settings className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};