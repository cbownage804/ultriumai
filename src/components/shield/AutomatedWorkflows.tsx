import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Zap, 
  Plus,
  Play,
  Pause,
  Settings,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Target,
  ArrowRight,
  Filter,
  TrendingUp
} from "lucide-react";

interface ResponseWorkflow {
  id: string;
  name: string;
  description: string;
  trigger_conditions: any;
  actions: any;
  is_active: boolean;
  priority: number;
  execution_count: number;
  success_rate: number;
  last_executed_at: string;
  created_at: string;
}

interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: string;
  executed_at: string;
  execution_time_ms: number;
  result: any;
}

const predefinedWorkflows = [
  {
    name: "Critical Threat Auto-Isolation",
    description: "Automatically isolate endpoints when critical threats are detected",
    trigger_conditions: {
      threat_severity: ["critical"],
      threat_types: ["ransomware", "advanced_persistent_threat"],
      confidence_threshold: 0.9
    },
    actions: [
      { type: "isolate_endpoint", immediate: true },
      { type: "send_notification", recipients: ["admin", "security_team"] },
      { type: "create_ticket", priority: "critical" },
      { type: "execute_script", script: "incident_response.ps1" }
    ]
  },
  {
    name: "Suspicious Activity Monitoring",
    description: "Monitor and log suspicious activities for investigation",
    trigger_conditions: {
      threat_severity: ["medium", "high"],
      behavioral_indicators: ["unusual_process", "network_anomaly"],
      time_window: "15m"
    },
    actions: [
      { type: "enhanced_monitoring", duration: "1h" },
      { type: "collect_forensics", artifacts: ["memory", "network", "files"] },
      { type: "send_notification", recipients: ["analyst"] }
    ]
  },
  {
    name: "Compliance Alert Automation",
    description: "Automatically handle compliance violations and generate reports",
    trigger_conditions: {
      event_type: "compliance_violation",
      frameworks: ["SOC2", "ISO27001", "GDPR"],
      severity: ["high", "critical"]
    },
    actions: [
      { type: "document_evidence", retention: "7_years" },
      { type: "notify_compliance_team", urgency: "high" },
      { type: "generate_report", format: "pdf" },
      { type: "schedule_audit", within: "48h" }
    ]
  }
];

export const AutomatedWorkflows = () => {
  const [workflows, setWorkflows] = useState<ResponseWorkflow[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWorkflowDialog, setNewWorkflowDialog] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<ResponseWorkflow | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data: workflowData, error } = await supabase
        .from('response_workflows')
        .select('*')
        .eq('user_id', user.user.id)
        .order('priority', { ascending: false });

      if (error) throw error;

      setWorkflows(workflowData || []);
    } catch (error) {
      console.error('Error loading workflows:', error);
      toast({
        title: "Error",
        description: "Failed to load automated workflows",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createWorkflow = async (workflowData: any) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error } = await supabase
        .from('response_workflows')
        .insert({
          user_id: user.user.id,
          name: workflowData.name,
          description: workflowData.description,
          trigger_conditions: workflowData.trigger_conditions,
          actions: workflowData.actions,
          priority: workflowData.priority || 0,
          created_by: user.user.id
        });

      if (error) throw error;

      toast({
        title: "✅ Workflow Created",
        description: `${workflowData.name} has been added to your automation suite`,
      });

      setNewWorkflowDialog(false);
      loadWorkflows();
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast({
        title: "Error",
        description: "Failed to create workflow",
        variant: "destructive",
      });
    }
  };

  const toggleWorkflow = async (workflowId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('response_workflows')
        .update({ is_active: isActive })
        .eq('id', workflowId);

      if (error) throw error;

      toast({
        title: isActive ? "Workflow Activated" : "Workflow Deactivated",
        description: `Workflow has been ${isActive ? 'enabled' : 'disabled'}`,
      });

      loadWorkflows();
    } catch (error) {
      console.error('Error toggling workflow:', error);
      toast({
        title: "Error",
        description: "Failed to update workflow status",
        variant: "destructive",
      });
    }
  };

  const testWorkflow = async (workflowId: string) => {
    try {
      const response = await supabase.functions.invoke('workflow-executor', {
        body: {
          workflow_id: workflowId,
          test_mode: true,
          test_data: {
            threat_type: 'test_threat',
            severity: 'high',
            hostname: 'TEST-ENDPOINT'
          }
        }
      });

      if (response.error) throw response.error;

      toast({
        title: "🧪 Workflow Test Complete",
        description: "Test execution completed successfully",
      });
    } catch (error) {
      console.error('Error testing workflow:', error);
      toast({
        title: "Test Failed",
        description: "Workflow test execution failed",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Automated Response Workflows
          </h2>
          <p className="text-muted-foreground">
            Configure intelligent automated responses to security events
          </p>
        </div>
        
        <Dialog open={newWorkflowDialog} onOpenChange={setNewWorkflowDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create Automated Workflow</DialogTitle>
            </DialogHeader>
            <WorkflowBuilder onSubmit={createWorkflow} predefinedWorkflows={predefinedWorkflows} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Zap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {workflows.filter(w => w.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for execution
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {workflows.reduce((sum, w) => sum + w.execution_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Successful automations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(workflows.reduce((sum, w) => sum + w.success_rate, 0) / (workflows.length || 1))}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average reliability
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              &lt; 30s
            </div>
            <p className="text-xs text-muted-foreground">
              Average execution time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {workflow.name}
                    {workflow.is_active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    {workflow.priority > 0 && (
                      <Badge variant="outline">Priority {workflow.priority}</Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {workflow.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={workflow.is_active}
                    onCheckedChange={(checked) => toggleWorkflow(workflow.id, checked)}
                  />
                  <Button variant="outline" size="sm" onClick={() => testWorkflow(workflow.id)}>
                    <Play className="h-3 w-3 mr-1" />
                    Test
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{workflow.execution_count}</div>
                  <div className="text-xs text-muted-foreground">Executions</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{workflow.success_rate}%</div>
                  <div className="text-xs text-muted-foreground">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {Object.keys(workflow.trigger_conditions).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Conditions</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">
                    {Array.isArray(workflow.actions) ? workflow.actions.length : 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Actions</div>
                </div>
              </div>

              {/* Trigger Preview */}
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <h4 className="font-medium text-sm mb-2">Trigger Conditions:</h4>
                <div className="text-xs space-y-1">
                  {workflow.trigger_conditions.threat_severity && (
                    <div>Severity: {workflow.trigger_conditions.threat_severity.join(', ')}</div>
                  )}
                  {workflow.trigger_conditions.threat_types && (
                    <div>Types: {workflow.trigger_conditions.threat_types.join(', ')}</div>
                  )}
                  {workflow.trigger_conditions.confidence_threshold && (
                    <div>Confidence: ≥{(workflow.trigger_conditions.confidence_threshold * 100)}%</div>
                  )}
                </div>
              </div>

              {workflow.last_executed_at && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Last executed: {new Date(workflow.last_executed_at).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {workflows.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Workflows Configured</h3>
              <p className="text-muted-foreground mb-4">
                Create automated workflows to respond to security events intelligently
              </p>
              <Button onClick={() => setNewWorkflowDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Workflow
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// Workflow Builder Component
const WorkflowBuilder = ({ onSubmit, predefinedWorkflows }: { 
  onSubmit: (data: any) => void;
  predefinedWorkflows: any[];
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [workflowData, setWorkflowData] = useState({
    name: '',
    description: '',
    trigger_conditions: {},
    actions: [],
    priority: 0
  });

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    setWorkflowData({
      name: template.name,
      description: template.description,
      trigger_conditions: template.trigger_conditions,
      actions: template.actions,
      priority: 0
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(workflowData);
  };

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <div>
        <h3 className="text-lg font-medium mb-4">Choose a Template (Optional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {predefinedWorkflows.map((template, index) => (
            <Card 
              key={index}
              className={`cursor-pointer transition-colors ${
                selectedTemplate === template ? 'border-primary' : ''
              }`}
              onClick={() => handleTemplateSelect(template)}
            >
              <CardContent className="p-4">
                <h4 className="font-medium">{template.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {template.description}
                </p>
                <div className="mt-2 text-xs">
                  <Badge variant="outline">
                    {template.actions.length} Actions
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom Configuration */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Workflow Name</label>
            <Input
              value={workflowData.name}
              onChange={(e) => setWorkflowData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Priority</label>
            <Select 
              value={workflowData.priority.toString()} 
              onValueChange={(value) => setWorkflowData(prev => ({ ...prev, priority: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Normal</SelectItem>
                <SelectItem value="1">High</SelectItem>
                <SelectItem value="2">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <Input
            value={workflowData.description}
            onChange={(e) => setWorkflowData(prev => ({ ...prev, description: e.target.value }))}
            required
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="submit">Create Workflow</Button>
        </div>
      </form>
    </div>
  );
};