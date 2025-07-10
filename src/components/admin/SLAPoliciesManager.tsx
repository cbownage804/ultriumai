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
import { Clock, Plus, Edit, Trash2, AlertTriangle, Timer } from "lucide-react";

interface SLAPolicy {
  id: string;
  name: string;
  description: string | null;
  priority_level: string;
  first_response_hours: number;
  resolution_hours: number;
  business_hours_only: boolean | null;
  escalation_hours: number | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

const priorityLevels = [
  { value: 'low', label: 'Low Priority', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Medium Priority', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High Priority', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Critical Priority', color: 'bg-red-100 text-red-800' },
];

export const SLAPoliciesManager = () => {
  const [policies, setPolicies] = useState<SLAPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPolicy, setEditingPolicy] = useState<SLAPolicy | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      const { data, error } = await supabase
        .from('sla_policies')
        .select('*')
        .order('priority_level', { ascending: true });

      if (error) throw error;
      setPolicies(data || []);
    } catch (error) {
      console.error('Error loading SLA policies:', error);
      toast({
        title: "Error",
        description: "Failed to load SLA policies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePolicy = async (policyData: Partial<SLAPolicy>) => {
    try {
      if (editingPolicy) {
        const { error } = await supabase
          .from('sla_policies')
          .update({
            name: policyData.name,
            description: policyData.description,
            priority_level: policyData.priority_level,
            first_response_hours: policyData.first_response_hours,
            resolution_hours: policyData.resolution_hours,
            business_hours_only: policyData.business_hours_only,
            escalation_hours: policyData.escalation_hours,
            is_active: policyData.is_active,
          })
          .eq('id', editingPolicy.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sla_policies')
          .insert({
            name: policyData.name,
            description: policyData.description,
            priority_level: policyData.priority_level,
            first_response_hours: policyData.first_response_hours,
            resolution_hours: policyData.resolution_hours,
            business_hours_only: policyData.business_hours_only,
            escalation_hours: policyData.escalation_hours,
            is_active: policyData.is_active,
          });

        if (error) throw error;
      }

      toast({
        title: "✅ SLA Policy Saved",
        description: `SLA policy "${policyData.name}" has been saved successfully`,
      });

      setShowDialog(false);
      setEditingPolicy(null);
      loadPolicies();
    } catch (error) {
      console.error('Error saving SLA policy:', error);
      toast({
        title: "Error",
        description: "Failed to save SLA policy",
        variant: "destructive",
      });
    }
  };

  const deletePolicy = async (policyId: string) => {
    try {
      const { error } = await supabase
        .from('sla_policies')
        .delete()
        .eq('id', policyId);

      if (error) throw error;

      toast({
        title: "✅ SLA Policy Deleted",
        description: "SLA policy has been deleted successfully",
      });

      loadPolicies();
    } catch (error) {
      console.error('Error deleting SLA policy:', error);
      toast({
        title: "Error",
        description: "Failed to delete SLA policy",
        variant: "destructive",
      });
    }
  };

  const togglePolicyStatus = async (policyId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('sla_policies')
        .update({ is_active: !isActive })
        .eq('id', policyId);

      if (error) throw error;

      toast({
        title: isActive ? "Policy Disabled" : "Policy Enabled",
        description: `SLA policy has been ${isActive ? 'disabled' : 'enabled'}`,
      });

      loadPolicies();
    } catch (error) {
      console.error('Error toggling policy status:', error);
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
            <Clock className="h-6 w-6 text-primary" />
            SLA Policies
          </h2>
          <p className="text-muted-foreground">
            Define service level agreements for different ticket priorities
          </p>
        </div>
        
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingPolicy(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Policy
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingPolicy ? 'Edit SLA Policy' : 'Create SLA Policy'}
              </DialogTitle>
            </DialogHeader>
            <SLAPolicyForm
              policy={editingPolicy}
              onSave={savePolicy}
              onCancel={() => setShowDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {policies.map((policy) => {
          const priorityConfig = priorityLevels.find(p => p.value === policy.priority_level);
          
          return (
            <Card key={policy.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{policy.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={priorityConfig?.color}>
                        {priorityConfig?.label}
                      </Badge>
                      <Badge variant={policy.is_active ? "default" : "secondary"}>
                        {policy.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {policy.description && (
                    <p className="text-sm text-muted-foreground">{policy.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="font-medium">Response Time</p>
                        <p className="text-muted-foreground">{policy.first_response_hours}h</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="font-medium">Resolution Time</p>
                        <p className="text-muted-foreground">{policy.resolution_hours}h</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    {policy.business_hours_only && (
                      <Badge variant="outline">Business Hours Only</Badge>
                    )}
                    {policy.escalation_hours && (
                      <Badge variant="outline">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Escalation in {policy.escalation_hours}h
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => togglePolicyStatus(policy.id, policy.is_active)}
                    >
                      {policy.is_active ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingPolicy(policy);
                        setShowDialog(true);
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deletePolicy(policy.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {policies.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No SLA Policies</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create SLA policies to define response and resolution times for different priorities
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface SLAPolicyFormProps {
  policy: SLAPolicy | null;
  onSave: (data: Partial<SLAPolicy>) => void;
  onCancel: () => void;
}

const SLAPolicyForm = ({ policy, onSave, onCancel }: SLAPolicyFormProps) => {
  const [formData, setFormData] = useState({
    name: policy?.name || '',
    description: policy?.description || '',
    priority_level: policy?.priority_level || 'medium',
    first_response_hours: policy?.first_response_hours || 4,
    resolution_hours: policy?.resolution_hours || 24,
    business_hours_only: policy?.business_hours_only ?? true,
    escalation_hours: policy?.escalation_hours || null,
    is_active: policy?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Policy Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="priority_level">Priority Level</Label>
          <Select
            value={formData.priority_level}
            onValueChange={(value) => setFormData({ ...formData, priority_level: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priorityLevels.map(priority => (
                <SelectItem key={priority.value} value={priority.value}>
                  {priority.label}
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
          placeholder="Describe this SLA policy"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_response_hours">First Response Time (Hours)</Label>
          <Input
            id="first_response_hours"
            type="number"
            min="1"
            value={formData.first_response_hours}
            onChange={(e) => setFormData({ ...formData, first_response_hours: parseInt(e.target.value) || 1 })}
            required
          />
        </div>
        <div>
          <Label htmlFor="resolution_hours">Resolution Time (Hours)</Label>
          <Input
            id="resolution_hours"
            type="number"
            min="1"
            value={formData.resolution_hours}
            onChange={(e) => setFormData({ ...formData, resolution_hours: parseInt(e.target.value) || 1 })}
            required
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="business_hours_only"
          checked={!!formData.business_hours_only}
          onCheckedChange={(checked) => setFormData({ ...formData, business_hours_only: checked })}
        />
        <Label htmlFor="business_hours_only">Business Hours Only</Label>
      </div>

      <div>
        <Label htmlFor="escalation_hours">Escalation Time (Hours, optional)</Label>
        <Input
          id="escalation_hours"
          type="number"
          min="1"
          value={formData.escalation_hours || ''}
          onChange={(e) => setFormData({ ...formData, escalation_hours: e.target.value ? parseInt(e.target.value) : null })}
          placeholder="Enter hours for escalation"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label htmlFor="is_active">Active Policy</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {policy ? 'Update Policy' : 'Create Policy'}
        </Button>
      </div>
    </form>
  );
};