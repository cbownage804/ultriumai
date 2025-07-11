import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Zap, 
  Plus, 
  Settings, 
  Play, 
  Pause,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Calendar,
  BarChart3,
  Mail,
  MessageSquare,
  FileText,
  Clock
} from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  trigger_conditions: any;
  actions: any;
  is_active: boolean;
  execution_count: number;
  last_executed_at?: string;
  created_at: string;
}

interface WorkflowExecution {
  id: string;
  workflow_id: string;
  execution_status: string;
  started_at: string;
  completed_at?: string;
  error_message?: string;
  actions_executed: any;
}

interface MSPWorkflowAutomationProps {
  mspId: string;
}

export const MSPWorkflowAutomation: React.FC<MSPWorkflowAutomationProps> = ({ mspId }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const triggerTypes = [
    { value: 'churn_risk_high', label: 'High Churn Risk Detected', icon: AlertTriangle },
    { value: 'upsell_identified', label: 'Upsell Opportunity Identified', icon: TrendingUp },
    { value: 'payment_overdue', label: 'Payment Overdue', icon: DollarSign },
    { value: 'contract_expiring', label: 'Contract Expiring Soon', icon: Calendar },
    { value: 'performance_decline', label: 'Performance Decline', icon: BarChart3 }
  ];

  const actionTypes = [
    { value: 'send_email', label: 'Send Email', icon: Mail },
    { value: 'send_sms', label: 'Send SMS', icon: MessageSquare },
    { value: 'create_task', label: 'Create Task', icon: FileText },
    { value: 'schedule_call', label: 'Schedule Call', icon: Calendar },
    { value: 'update_client_status', label: 'Update Client Status', icon: Settings }
  ];

  useEffect(() => {
    loadWorkflows();
    loadExecutions();
  }, [mspId]);

  const loadWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('msp_workflows')
        .select('*')
        .eq('msp_id', mspId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      console.error('Error loading workflows:', error);
      toast({
        title: "Error",
        description: "Failed to load workflows",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadExecutions = async () => {
    try {
      const { data, error } = await supabase
        .from('msp_workflow_executions')
        .select(`
          *,
          msp_workflows(name)
        `)
        .in('workflow_id', workflows.map(w => w.id))
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setExecutions(data || []);
    } catch (error) {
      console.error('Error loading executions:', error);
    }
  };

  const createWorkflow = async (workflowData: any) => {
    try {
      const { data, error } = await supabase
        .from('msp_workflows')
        .insert({
          msp_id: mspId,
          ...workflowData
        })
        .select()
        .single();

      if (error) throw error;

      setWorkflows(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Workflow created successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast({
        title: "Error",
        description: "Failed to create workflow",
        variant: "destructive",
      });
      return null;
    }
  };

  const toggleWorkflow = async (workflowId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('msp_workflows')
        .update({ is_active: isActive })
        .eq('id', workflowId);

      if (error) throw error;

      setWorkflows(prev => 
        prev.map(w => w.id === workflowId ? { ...w, is_active: isActive } : w)
      );

      toast({
        title: "Success",
        description: `Workflow ${isActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      console.error('Error toggling workflow:', error);
      toast({
        title: "Error",
        description: "Failed to update workflow",
        variant: "destructive",
      });
    }
  };

  const WorkflowForm = ({ onSubmit, onCancel }: { onSubmit: (data: any) => void, onCancel: () => void }) => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      trigger_type: '',
      trigger_conditions: {},
      actions: []
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
      onCancel();
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Workflow Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter workflow name"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe what this workflow does"
          />
        </div>

        <div>
          <Label htmlFor="trigger">Trigger Type</Label>
          <select
            id="trigger"
            value={formData.trigger_type}
            onChange={(e) => setFormData(prev => ({ ...prev, trigger_type: e.target.value }))}
            className="w-full px-3 py-2 border rounded-md bg-background"
            required
          >
            <option value="">Select a trigger</option>
            {triggerTypes.map(trigger => (
              <option key={trigger.value} value={trigger.value}>
                {trigger.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            Create Workflow
          </Button>
        </div>
      </form>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Workflow Automation</h2>
          <p className="text-muted-foreground">
            Automate actions based on client events and conditions
          </p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Workflow</DialogTitle>
            </DialogHeader>
            <WorkflowForm 
              onSubmit={createWorkflow}
              onCancel={() => setIsCreating(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Active Workflows
            </CardTitle>
            <CardDescription>
              Workflows currently monitoring your clients
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {workflows.filter(w => w.is_active).length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No active workflows
              </p>
            ) : (
              workflows.filter(w => w.is_active).map((workflow) => {
                const triggerType = triggerTypes.find(t => t.value === workflow.trigger_type);
                const TriggerIcon = triggerType?.icon || Zap;
                
                return (
                  <div key={workflow.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <TriggerIcon className="h-4 w-4 text-primary" />
                      <div>
                        <h4 className="font-medium">{workflow.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {triggerType?.label}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {workflow.execution_count} runs
                      </Badge>
                      <Switch
                        checked={workflow.is_active}
                        onCheckedChange={(checked) => toggleWorkflow(workflow.id, checked)}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Executions
            </CardTitle>
            <CardDescription>
              Latest workflow execution results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {executions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No executions yet
              </p>
            ) : (
              executions.slice(0, 5).map((execution) => (
                <div key={execution.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Workflow Execution</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(execution.started_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge 
                    variant={
                      execution.execution_status === 'completed' ? 'default' :
                      execution.execution_status === 'failed' ? 'destructive' :
                      execution.execution_status === 'running' ? 'secondary' :
                      'outline'
                    }
                  >
                    {execution.execution_status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {workflows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Workflows</CardTitle>
            <CardDescription>
              Manage your automation workflows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workflows.map((workflow) => {
                const triggerType = triggerTypes.find(t => t.value === workflow.trigger_type);
                const TriggerIcon = triggerType?.icon || Zap;
                
                return (
                  <div key={workflow.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${workflow.is_active ? 'bg-primary/20' : 'bg-muted'}`}>
                        <TriggerIcon className={`h-4 w-4 ${workflow.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{workflow.name}</h3>
                        <p className="text-sm text-muted-foreground">{workflow.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-muted-foreground">
                            Trigger: {triggerType?.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Executed {workflow.execution_count} times
                          </span>
                          {workflow.last_executed_at && (
                            <span className="text-xs text-muted-foreground">
                              Last run: {new Date(workflow.last_executed_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                        {workflow.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleWorkflow(workflow.id, !workflow.is_active)}
                      >
                        {workflow.is_active ? (
                          <>
                            <Pause className="h-3 w-3 mr-1" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};