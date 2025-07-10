import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Plus, Edit, Trash2, Play, Pause, BarChart } from "lucide-react";

interface WorkflowRule {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  trigger_event: string;
  conditions: any; // JSON from database
  actions: any; // JSON from database
  is_active: boolean;
  execution_count: number;
  last_executed_at: string | null;
  created_at: string;
  updated_at: string;
}

const triggerEvents = [
  { value: 'ticket_created', label: 'Ticket Created' },
  { value: 'ticket_updated', label: 'Ticket Updated' },
  { value: 'status_changed', label: 'Status Changed' },
  { value: 'priority_changed', label: 'Priority Changed' },
  { value: 'assigned', label: 'Ticket Assigned' },
  { value: 'comment_added', label: 'Comment Added' },
  { value: 'sla_breach_warning', label: 'SLA Breach Warning' },
  { value: 'resolution_overdue', label: 'Resolution Overdue' },
];

const conditionFields = [
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Priority' },
  { value: 'category', label: 'Category' },
  { value: 'assigned_to', label: 'Assigned To' },
  { value: 'customer_id', label: 'Customer' },
  { value: 'created_at', label: 'Created Date' },
  { value: 'tags', label: 'Tags' },
];

const conditionOperators = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
];

const actionTypes = [
  { value: 'set_status', label: 'Set Status' },
  { value: 'set_priority', label: 'Set Priority' },
  { value: 'assign_to', label: 'Assign To' },
  { value: 'add_tag', label: 'Add Tag' },
  { value: 'remove_tag', label: 'Remove Tag' },
  { value: 'send_email', label: 'Send Email' },
  { value: 'send_notification', label: 'Send Notification' },
  { value: 'add_comment', label: 'Add Comment' },
  { value: 'escalate', label: 'Escalate Ticket' },
];

export const WorkflowAutomationManager = () => {
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<WorkflowRule | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('workflow_automation_rules')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error loading workflow rules:', error);
      toast({
        title: "Error",
        description: "Failed to load workflow rules",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveRule = async (ruleData: Partial<WorkflowRule>) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      if (editingRule) {
        const { error } = await supabase
          .from('workflow_automation_rules')
          .update({
            name: ruleData.name,
            description: ruleData.description,
            trigger_event: ruleData.trigger_event,
            conditions: ruleData.conditions,
            actions: ruleData.actions,
            is_active: ruleData.is_active,
          })
          .eq('id', editingRule.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('workflow_automation_rules')
          .insert({
            user_id: user.user.id,
            name: ruleData.name,
            description: ruleData.description,
            trigger_event: ruleData.trigger_event,
            conditions: ruleData.conditions,
            actions: ruleData.actions,
            is_active: ruleData.is_active,
            execution_count: 0,
          });

        if (error) throw error;
      }

      toast({
        title: "✅ Rule Saved",
        description: `Workflow rule "${ruleData.name}" has been saved successfully`,
      });

      setShowDialog(false);
      setEditingRule(null);
      loadRules();
    } catch (error) {
      console.error('Error saving workflow rule:', error);
      toast({
        title: "Error",
        description: "Failed to save workflow rule",
        variant: "destructive",
      });
    }
  };

  const deleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('workflow_automation_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: "✅ Rule Deleted",
        description: "Workflow rule has been deleted successfully",
      });

      loadRules();
    } catch (error) {
      console.error('Error deleting workflow rule:', error);
      toast({
        title: "Error",
        description: "Failed to delete workflow rule",
        variant: "destructive",
      });
    }
  };

  const toggleRuleStatus = async (ruleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('workflow_automation_rules')
        .update({ is_active: !isActive })
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: isActive ? "Rule Disabled" : "Rule Enabled",
        description: `Workflow rule has been ${isActive ? 'disabled' : 'enabled'}`,
      });

      loadRules();
    } catch (error) {
      console.error('Error toggling rule status:', error);
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Workflow Automation
          </h2>
          <p className="text-muted-foreground">
            Create automated rules to streamline your ticket management
          </p>
        </div>
        
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingRule(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRule ? 'Edit Workflow Rule' : 'Create Workflow Rule'}
              </DialogTitle>
            </DialogHeader>
            <WorkflowRuleForm
              rule={editingRule}
              onSave={saveRule}
              onCancel={() => setShowDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Rules List */}
      <div className="grid grid-cols-1 gap-4">
        {rules.map((rule) => (
          <Card key={rule.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{rule.name}</h3>
                    <Badge variant={rule.is_active ? "default" : "secondary"}>
                      {rule.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">
                      {triggerEvents.find(t => t.value === rule.trigger_event)?.label}
                    </Badge>
                  </div>
                  
                  {rule.description && (
                    <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>📋 {Array.isArray(rule.conditions) ? rule.conditions.length : 0} conditions</span>
                    <span>⚡ {Array.isArray(rule.actions) ? rule.actions.length : 0} actions</span>
                    <span>🔢 Executed {rule.execution_count} times</span>
                    {rule.last_executed_at && (
                      <span>🕒 Last run: {new Date(rule.last_executed_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleRuleStatus(rule.id, rule.is_active)}
                  >
                    {rule.is_active ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingRule(rule);
                      setShowDialog(true);
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteRule(rule.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {rules.length === 0 && (
          <div className="text-center py-12">
            <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No Workflow Rules</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first automation rule to streamline ticket management
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface WorkflowRuleFormProps {
  rule: WorkflowRule | null;
  onSave: (data: Partial<WorkflowRule>) => void;
  onCancel: () => void;
}

const WorkflowRuleForm = ({ rule, onSave, onCancel }: WorkflowRuleFormProps) => {
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    description: rule?.description || '',
    trigger_event: rule?.trigger_event || 'ticket_created',
    conditions: (Array.isArray(rule?.conditions) ? rule.conditions : []) as any[],
    actions: (Array.isArray(rule?.actions) ? rule.actions : []) as any[],
    is_active: rule?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, { field: 'status', operator: 'equals', value: '' }]
    }));
  };

  const updateCondition = (index: number, updates: any) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) => 
        i === index ? { ...condition, ...updates } : condition
      )
    }));
  };

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const addAction = () => {
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, { type: 'set_status', value: '' }]
    }));
  };

  const updateAction = (index: number, updates: any) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) => 
        i === index ? { ...action, ...updates } : action
      )
    }));
  };

  const removeAction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Rule Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="trigger_event">Trigger Event</Label>
          <Select
            value={formData.trigger_event}
            onValueChange={(value) => setFormData({ ...formData, trigger_event: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {triggerEvents.map(event => (
                <SelectItem key={event.value} value={event.value}>
                  {event.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
          placeholder="Describe what this rule does"
        />
      </div>

      {/* Conditions */}
      <div>
        <div className="flex justify-between items-center">
          <Label>Conditions</Label>
          <Button type="button" variant="outline" size="sm" onClick={addCondition}>
            Add Condition
          </Button>
        </div>
        
        <div className="space-y-2 mt-2">
          {formData.conditions.map((condition, index) => (
            <div key={index} className="grid grid-cols-4 gap-2 p-3 border rounded">
              <Select
                value={condition.field}
                onValueChange={(value) => updateCondition(index, { field: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {conditionFields.map(field => (
                    <SelectItem key={field.value} value={field.value}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={condition.operator}
                onValueChange={(value) => updateCondition(index, { operator: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {conditionOperators.map(op => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                value={condition.value}
                onChange={(e) => updateCondition(index, { value: e.target.value })}
                placeholder="Value"
              />

              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeCondition(index)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div>
        <div className="flex justify-between items-center">
          <Label>Actions</Label>
          <Button type="button" variant="outline" size="sm" onClick={addAction}>
            Add Action
          </Button>
        </div>
        
        <div className="space-y-2 mt-2">
          {formData.actions.map((action, index) => (
            <div key={index} className="grid grid-cols-3 gap-2 p-3 border rounded">
              <Select
                value={action.type}
                onValueChange={(value) => updateAction(index, { type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                value={action.value}
                onChange={(e) => updateAction(index, { value: e.target.value })}
                placeholder="Value"
              />

              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeAction(index)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label htmlFor="is_active">Active Rule</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {rule ? 'Update Rule' : 'Create Rule'}
        </Button>
      </div>
    </form>
  );
};