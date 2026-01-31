import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, Trash2, Zap, Mail, UserPlus, Tag, Clock, 
  AlertTriangle, CheckCircle2, ArrowRight, Edit,
  GitBranch, Bell
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

type TriggerType = 'ticket_created' | 'ticket_updated' | 'sla_breach' | 'time_elapsed';
type ActionType = 'assign' | 'set_priority' | 'set_status' | 'send_email' | 'add_tag' | 'notify' | 'escalate';

interface WorkflowAction {
  type: ActionType;
  config: Record<string, unknown>;
}

interface WorkflowRule {
  id: string;
  name: string;
  description: string | null;
  trigger_event: string;
  conditions: Json;
  actions: Json;
  is_active: boolean | null;
  priority_order: number | null;
  execution_count: number | null;
  last_executed_at: string | null;
}

const TRIGGER_TYPES = [
  { value: 'ticket_created', label: 'Ticket Created', icon: Plus, color: 'text-green-400' },
  { value: 'ticket_updated', label: 'Ticket Updated', icon: Edit, color: 'text-blue-400' },
  { value: 'sla_breach', label: 'SLA Breach', icon: AlertTriangle, color: 'text-red-400' },
  { value: 'time_elapsed', label: 'Time Elapsed', icon: Clock, color: 'text-yellow-400' },
];

const ACTION_TYPES = [
  { value: 'assign', label: 'Assign To', icon: UserPlus, color: 'bg-blue-500/20 text-blue-400' },
  { value: 'set_priority', label: 'Set Priority', icon: AlertTriangle, color: 'bg-orange-500/20 text-orange-400' },
  { value: 'set_status', label: 'Set Status', icon: CheckCircle2, color: 'bg-green-500/20 text-green-400' },
  { value: 'send_email', label: 'Send Email', icon: Mail, color: 'bg-purple-500/20 text-purple-400' },
  { value: 'add_tag', label: 'Add Tag', icon: Tag, color: 'bg-cyan-500/20 text-cyan-400' },
  { value: 'notify', label: 'Send Notification', icon: Bell, color: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'escalate', label: 'Escalate', icon: GitBranch, color: 'bg-red-500/20 text-red-400' },
];

export function VisualWorkflowBuilder() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    trigger_event: 'ticket_created' as TriggerType,
    conditions: {} as Record<string, unknown>,
    actions: [] as WorkflowAction[],
  });

  // Fetch workflow rules
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['workflow-rules', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('workflow_automation_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('priority_order', { ascending: true });
      if (error) throw error;
      return (data || []) as WorkflowRule[];
    },
    enabled: !!user?.id
  });

  // Create rule mutation
  const createMutation = useMutation({
    mutationFn: async (rule: typeof newRule) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase.from('workflow_automation_rules').insert({
        user_id: user.id,
        name: rule.name,
        description: rule.description,
        trigger_event: rule.trigger_event,
        conditions: rule.conditions as Json,
        actions: rule.actions as unknown as Json,
        is_active: true,
        priority_order: rules.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-rules'] });
      toast.success('Workflow rule created!');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => toast.error('Failed to create rule')
  });

  // Toggle active mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('workflow_automation_rules')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-rules'] });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workflow_automation_rules')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-rules'] });
      toast.success('Rule deleted');
    }
  });

  const resetForm = () => {
    setNewRule({
      name: '',
      description: '',
      trigger_event: 'ticket_created',
      conditions: {},
      actions: [],
    });
  };

  const addAction = (type: ActionType) => {
    setNewRule({
      ...newRule,
      actions: [...newRule.actions, { type, config: {} }]
    });
  };

  const removeAction = (index: number) => {
    setNewRule({
      ...newRule,
      actions: newRule.actions.filter((_, i) => i !== index)
    });
  };

  const updateActionConfig = (index: number, config: Record<string, unknown>) => {
    const updatedActions = [...newRule.actions];
    updatedActions[index] = { ...updatedActions[index], config };
    setNewRule({ ...newRule, actions: updatedActions });
  };

  const getTriggerIcon = (type: string) => {
    const trigger = TRIGGER_TYPES.find(t => t.value === type);
    return trigger ? trigger.icon : Zap;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-400" />
            Workflow Automation
          </h2>
          <p className="text-muted-foreground">Create intelligent automation rules for ticket processing</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle>Create Automation Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Rule Name & Description */}
              <div className="space-y-4">
                <Input
                  placeholder="Rule Name *"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  className="bg-slate-800 border-slate-600"
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  rows={2}
                  className="bg-slate-800 border-slate-600"
                />
              </div>

              {/* Trigger Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">When this happens...</label>
                <div className="grid grid-cols-2 gap-3">
                  {TRIGGER_TYPES.map((trigger) => {
                    const Icon = trigger.icon;
                    const isSelected = newRule.trigger_event === trigger.value;
                    return (
                      <button
                        key={trigger.value}
                        onClick={() => setNewRule({ ...newRule, trigger_event: trigger.value as TriggerType })}
                        className={`p-4 rounded-lg border text-left transition-all ${
                          isSelected 
                            ? 'border-indigo-500 bg-indigo-500/10' 
                            : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`h-5 w-5 ${trigger.color}`} />
                          <span className="font-medium">{trigger.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Conditions */}
              <div>
                <label className="text-sm font-medium mb-2 block">With these conditions (optional)</label>
                <div className="grid grid-cols-2 gap-3">
                  <Select 
                    value={(newRule.conditions as Record<string, string>).priority || ''} 
                    onValueChange={(v) => setNewRule({ 
                      ...newRule, 
                      conditions: { ...newRule.conditions, priority: v } 
                    })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-600">
                      <SelectValue placeholder="Any Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Priority</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select 
                    value={(newRule.conditions as Record<string, string>).category || ''} 
                    onValueChange={(v) => setNewRule({ 
                      ...newRule, 
                      conditions: { ...newRule.conditions, category: v } 
                    })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-600">
                      <SelectValue placeholder="Any Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Category</SelectItem>
                      <SelectItem value="hardware">Hardware</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
                      <SelectItem value="network">Network</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Actions */}
              <div>
                <label className="text-sm font-medium mb-2 block">Then do this...</label>
                <div className="space-y-3">
                  {newRule.actions.map((action, index) => {
                    const actionType = ACTION_TYPES.find(a => a.value === action.type);
                    const Icon = actionType?.icon || Zap;
                    return (
                      <div key={index} className={`p-3 rounded-lg ${actionType?.color} flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          <span className="font-medium">{actionType?.label}</span>
                          {action.type === 'assign' && (
                            <Input
                              placeholder="Assignee email"
                              value={(action.config.assignee as string) || ''}
                              onChange={(e) => updateActionConfig(index, { assignee: e.target.value })}
                              className="w-48 h-8 bg-slate-800 border-slate-600 ml-2"
                            />
                          )}
                          {action.type === 'set_priority' && (
                            <Select 
                              value={(action.config.priority as string) || 'high'} 
                              onValueChange={(v) => updateActionConfig(index, { priority: v })}
                            >
                              <SelectTrigger className="w-32 h-8 bg-slate-800 border-slate-600">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="critical">Critical</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          {action.type === 'add_tag' && (
                            <Input
                              placeholder="Tag name"
                              value={(action.config.tag as string) || ''}
                              onChange={(e) => updateActionConfig(index, { tag: e.target.value })}
                              className="w-32 h-8 bg-slate-800 border-slate-600 ml-2"
                            />
                          )}
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => removeAction(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {ACTION_TYPES.map((action) => (
                    <Button
                      key={action.value}
                      size="sm"
                      variant="outline"
                      onClick={() => addAction(action.value as ActionType)}
                      className="border-slate-600"
                    >
                      <action.icon className="h-3 w-3 mr-1" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button 
                  onClick={() => createMutation.mutate(newRule)}
                  disabled={!newRule.name || newRule.actions.length === 0}
                >
                  Create Rule
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading rules...</div>
        ) : rules.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-12 text-center">
              <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium">No automation rules yet</p>
              <p className="text-muted-foreground mb-4">Create your first rule to automate ticket processing</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Rule
              </Button>
            </CardContent>
          </Card>
        ) : (
          rules.map((rule) => {
            const TriggerIcon = getTriggerIcon(rule.trigger_event);
            const actionsArray = Array.isArray(rule.actions) ? rule.actions : [];
            return (
              <Card key={rule.id} className={`bg-slate-800/50 border-slate-700 ${!rule.is_active ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-indigo-500/20">
                        <TriggerIcon className="h-6 w-6 text-indigo-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{rule.name}</h3>
                          <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                            {rule.is_active ? 'Active' : 'Paused'}
                          </Badge>
                        </div>
                        {rule.description && (
                          <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-3">
                          <Badge variant="outline" className="text-xs">
                            {TRIGGER_TYPES.find(t => t.value === rule.trigger_event)?.label || rule.trigger_event}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <ArrowRight className="h-3 w-3" />
                            {actionsArray.length} actions
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Executed {rule.execution_count || 0} times
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.is_active || false}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: rule.id, is_active: checked })}
                      />
                      <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(rule.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
