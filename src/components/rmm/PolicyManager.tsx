import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, CheckCircle, Clock, Plus, Trash2, Edit, Loader2 } from "lucide-react";
import { useSafeOps, type RMMPolicy } from "@/hooks/useSafeOps";

const POLICY_TYPES = [
  { value: 'compliance', label: 'Compliance' },
  { value: 'security', label: 'Security' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'backup', label: 'Backup' },
  { value: 'monitoring', label: 'Monitoring' }
];

const DEVICE_TYPES = ['workstation', 'server', 'network', 'mobile'];

export const PolicyManager = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<RMMPolicy | null>(null);
  const [newPolicy, setNewPolicy] = useState<Partial<RMMPolicy>>({
    name: '',
    description: '',
    policy_type: 'compliance',
    category: '',
    is_active: true,
    target_device_types: ['workstation']
  });

  const { 
    policies, 
    isLoading, 
    createPolicy, 
    updatePolicy, 
    togglePolicyActive,
    deletePolicy,
    getActivePolicies 
  } = useSafeOps();

  const getStatusIcon = (isActive: boolean) => {
    return isActive 
      ? <CheckCircle className="h-4 w-4 text-green-500" />
      : <Clock className="h-4 w-4 text-orange-500" />;
  };

  const handleCreate = async () => {
    await createPolicy(newPolicy);
    setIsCreateDialogOpen(false);
    setNewPolicy({
      name: '',
      description: '',
      policy_type: 'compliance',
      category: '',
      is_active: true,
      target_device_types: ['workstation']
    });
  };

  const handleUpdate = async () => {
    if (!editingPolicy) return;
    await updatePolicy(editingPolicy.id, newPolicy);
    setEditingPolicy(null);
  };

  const handleEdit = (policy: RMMPolicy) => {
    setEditingPolicy(policy);
    setNewPolicy({
      name: policy.name,
      description: policy.description || '',
      policy_type: policy.policy_type,
      category: policy.category || '',
      is_active: policy.is_active,
      target_device_types: policy.target_device_types
    });
  };

  const handleToggleDeviceType = (type: string) => {
    const current = newPolicy.target_device_types || [];
    if (current.includes(type)) {
      setNewPolicy({ ...newPolicy, target_device_types: current.filter(t => t !== type) });
    } else {
      setNewPolicy({ ...newPolicy, target_device_types: [...current, type] });
    }
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const activePolicies = getActivePolicies();

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Security Policies
            </CardTitle>
            <CardDescription>
              {activePolicies.length} active / {policies.length} total policies
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen || !!editingPolicy} onOpenChange={(open) => {
            if (!open) {
              setIsCreateDialogOpen(false);
              setEditingPolicy(null);
              setNewPolicy({
                name: '',
                description: '',
                policy_type: 'compliance',
                category: '',
                is_active: true,
                target_device_types: ['workstation']
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Policy
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingPolicy ? 'Edit Policy' : 'Create New Policy'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Policy Name</Label>
                  <Input 
                    value={newPolicy.name}
                    onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                    placeholder="Windows Security Baseline"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    value={newPolicy.description || ''}
                    onChange={(e) => setNewPolicy({ ...newPolicy, description: e.target.value })}
                    placeholder="Describe the policy purpose and requirements..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Policy Type</Label>
                    <Select 
                      value={newPolicy.policy_type}
                      onValueChange={(value) => setNewPolicy({ ...newPolicy, policy_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {POLICY_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input 
                      value={newPolicy.category || ''}
                      onChange={(e) => setNewPolicy({ ...newPolicy, category: e.target.value })}
                      placeholder="e.g., CIS Benchmark"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Target Device Types</Label>
                  <div className="flex flex-wrap gap-2">
                    {DEVICE_TYPES.map(type => (
                      <Badge 
                        key={type}
                        variant={(newPolicy.target_device_types || []).includes(type) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handleToggleDeviceType(type)}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={newPolicy.is_active}
                    onCheckedChange={(checked) => setNewPolicy({ ...newPolicy, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
                <Button 
                  onClick={editingPolicy ? handleUpdate : handleCreate} 
                  className="w-full"
                >
                  {editingPolicy ? 'Update Policy' : 'Create Policy'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {policies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No policies configured yet. Create your first policy above.
          </div>
        ) : (
          <div className="space-y-4">
            {policies.map((policy) => (
              <div key={policy.id} className="p-4 border rounded-lg bg-gradient-to-r from-background to-muted/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(policy.is_active)}
                    <div>
                      <h4 className="font-medium">{policy.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {policy.policy_type} · Updated {new Date(policy.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-medium">{policy.compliance_score}%</div>
                      <div className="text-xs text-muted-foreground">Compliance</div>
                    </div>
                    <Badge variant={policy.is_active ? 'default' : 'secondary'}>
                      {policy.is_active ? 'active' : 'inactive'}
                    </Badge>
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(policy)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="text-destructive"
                      onClick={() => deletePolicy(policy.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Progress value={policy.compliance_score} className="h-2" />
                {policy.target_device_types?.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {policy.target_device_types.map(type => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
