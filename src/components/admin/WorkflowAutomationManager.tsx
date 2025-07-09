import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Workflow, 
  Plus, 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Clock, 
  Zap,
  Mail,
  UserMinus,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface WorkflowAutomation {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  trigger_conditions: any;
  actions: any;
  is_active: boolean;
  execution_count: number;
  last_executed_at: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const WorkflowAutomationManager = () => {
  const [workflows, setWorkflows] = useState<WorkflowAutomation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowAutomation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_type: '',
    trigger_conditions: {},
    actions: []
  });
  const { toast } = useToast();

  const triggerTypes = [
    { value: 'payment_failed', label: 'Payment Failed', icon: DollarSign },
    { value: 'user_inactive', label: 'User Inactive', icon: UserMinus },
    { value: 'subscription_expired', label: 'Subscription Expired', icon: Clock },
    { value: 'new_user_signup', label: 'New User Signup', icon: Plus },
    { value: 'api_error_rate', label: 'High API Error Rate', icon: Zap }
  ];

  const actionTypes = [
    { value: 'send_email', label: 'Send Email', icon: Mail },
    { value: 'suspend_user', label: 'Suspend User', icon: UserMinus },
    { value: 'send_notification', label: 'Send Notification', icon: Zap },
    { value: 'create_support_ticket', label: 'Create Support Ticket', icon: Plus },
    { value: 'webhook_call', label: 'Call Webhook', icon: Zap }
  ];

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('workflow_automations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);

    } catch (error: any) {
      toast({
        title: "Error fetching workflows",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSampleWorkflows = async () => {
    try {
      const sampleWorkflows = [
        {
          name: 'Failed Payment Recovery',
          description: 'Automatically send recovery emails when payments fail and suspend account after 3 attempts',
          trigger_type: 'payment_failed',
          trigger_conditions: {
            payment_attempts: 3,
            time_window: '24h'
          },
          actions: [
            {
              type: 'send_email',
              template: 'payment_failed',
              delay: '0m'
            },
            {
              type: 'suspend_user',
              reason: 'Payment failure',
              delay: '72h'
            }
          ]
        },
        {
          name: 'Welcome New Users',
          description: 'Send welcome email and create onboarding tasks for new user signups',
          trigger_type: 'new_user_signup',
          trigger_conditions: {
            account_type: 'any'
          },
          actions: [
            {
              type: 'send_email',
              template: 'welcome',
              delay: '0m'
            },
            {
              type: 'send_notification',
              message: 'Complete your profile setup',
              delay: '24h'
            }
          ]
        },
        {
          name: 'Inactive User Re-engagement',
          description: 'Send re-engagement emails to users who have been inactive for 30 days',
          trigger_type: 'user_inactive',
          trigger_conditions: {
            inactive_days: 30,
            exclude_churned: true
          },
          actions: [
            {
              type: 'send_email',
              template: 'reengagement',
              delay: '0m'
            }
          ]
        }
      ];

      const { error } = await supabase
        .from('workflow_automations')
        .insert(sampleWorkflows);

      if (error) throw error;

      toast({
        title: "Sample workflows created",
        description: "Sample automation workflows have been added",
      });

      fetchWorkflows();
    } catch (error: any) {
      toast({
        title: "Error creating sample workflows",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const saveWorkflow = async () => {
    try {
      const workflowData = {
        ...formData,
        trigger_conditions: JSON.stringify(formData.trigger_conditions),
        actions: JSON.stringify(formData.actions)
      };

      if (selectedWorkflow) {
        const { error } = await supabase
          .from('workflow_automations')
          .update(workflowData)
          .eq('id', selectedWorkflow.id);
        
        if (error) throw error;
        
        toast({
          title: "Workflow updated",
          description: "Workflow automation has been updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('workflow_automations')
          .insert([workflowData]);
        
        if (error) throw error;
        
        toast({
          title: "Workflow created",
          description: "New workflow automation has been created",
        });
      }

      setIsDialogOpen(false);
      setSelectedWorkflow(null);
      setFormData({
        name: '',
        description: '',
        trigger_type: '',
        trigger_conditions: {},
        actions: []
      });
      fetchWorkflows();

    } catch (error: any) {
      toast({
        title: "Error saving workflow",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleWorkflow = async (workflow: WorkflowAutomation) => {
    try {
      const { error } = await supabase
        .from('workflow_automations')
        .update({ is_active: !workflow.is_active })
        .eq('id', workflow.id);

      if (error) throw error;

      toast({
        title: `Workflow ${!workflow.is_active ? 'activated' : 'deactivated'}`,
        description: `${workflow.name} has been ${!workflow.is_active ? 'activated' : 'deactivated'}`,
      });

      fetchWorkflows();
    } catch (error: any) {
      toast({
        title: "Error updating workflow",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteWorkflow = async (id: string) => {
    try {
      const { error } = await supabase
        .from('workflow_automations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Workflow deleted",
        description: "Workflow automation has been deleted",
      });

      fetchWorkflows();
    } catch (error: any) {
      toast({
        title: "Error deleting workflow",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (workflow: WorkflowAutomation) => {
    setSelectedWorkflow(workflow);
    setFormData({
      name: workflow.name,
      description: workflow.description,
      trigger_type: workflow.trigger_type,
      trigger_conditions: typeof workflow.trigger_conditions === 'string' 
        ? JSON.parse(workflow.trigger_conditions) 
        : workflow.trigger_conditions,
      actions: typeof workflow.actions === 'string' 
        ? JSON.parse(workflow.actions) 
        : workflow.actions
    });
    setIsDialogOpen(true);
  };

  const getTriggerIcon = (type: string) => {
    const trigger = triggerTypes.find(t => t.value === type);
    const Icon = trigger?.icon || Workflow;
    return <Icon className="h-4 w-4" />;
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workflow Automation</h2>
          <p className="text-muted-foreground">Automate business processes and user interactions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchWorkflows}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {workflows.length === 0 && (
            <Button
              onClick={createSampleWorkflows}
              variant="outline"
              size="sm"
            >
              Create Sample Workflows
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Workflow
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedWorkflow ? 'Edit Workflow' : 'Create New Workflow'}
                </DialogTitle>
                <DialogDescription>
                  Configure automation triggers and actions
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Workflow Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter workflow name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="trigger_type">Trigger Type</Label>
                    <Select 
                      value={formData.trigger_type} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, trigger_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select trigger" />
                      </SelectTrigger>
                      <SelectContent>
                        {triggerTypes.map((trigger) => (
                          <SelectItem key={trigger.value} value={trigger.value}>
                            <div className="flex items-center gap-2">
                              <trigger.icon className="h-4 w-4" />
                              {trigger.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveWorkflow}>
                    {selectedWorkflow ? 'Update' : 'Create'} Workflow
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Workflow List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className={`${!workflow.is_active ? 'opacity-60' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getTriggerIcon(workflow.trigger_type)}
                  <CardTitle className="text-lg">{workflow.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                    {workflow.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Switch
                    checked={workflow.is_active}
                    onCheckedChange={() => toggleWorkflow(workflow)}
                  />
                </div>
              </div>
              <CardDescription>{workflow.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Trigger</p>
                    <p className="text-sm">
                      {triggerTypes.find(t => t.value === workflow.trigger_type)?.label || workflow.trigger_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Executions</p>
                    <p className="text-sm">{workflow.execution_count}</p>
                  </div>
                </div>
                
                {workflow.last_executed_at && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Executed</p>
                    <p className="text-sm">{format(new Date(workflow.last_executed_at), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Created {format(new Date(workflow.created_at), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(workflow)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteWorkflow(workflow.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {!loading && workflows.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Workflow className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No automation workflows</h3>
            <p className="text-muted-foreground mb-4">
              Create your first workflow to automate business processes
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={createSampleWorkflows} variant="outline">
                Create Sample Workflows
              </Button>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Workflow
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};