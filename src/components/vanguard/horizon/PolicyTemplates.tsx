import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileSliders, Plus, Search, MoreVertical, Copy, Edit, Trash2, Monitor, Shield, Clock, Zap, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  category: 'security' | 'performance' | 'maintenance' | 'compliance';
  isActive: boolean;
  assignedDevices: number;
  settings: Record<string, any>;
  createdAt: string;
}

interface PolicyTemplatesProps {
  onApplyPolicy?: (policyId: string, deviceIds: string[]) => void;
}

export function PolicyTemplates({ onApplyPolicy }: PolicyTemplatesProps) {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<PolicyTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PolicyTemplate | null>(null);
  const [newPolicy, setNewPolicy] = useState<{ name: string; description: string; category: 'security' | 'performance' | 'maintenance' | 'compliance' }>({
    name: '', description: '', category: 'security',
  });

  useEffect(() => { if (user) loadPolicies(); }, [user]);

  const loadPolicies = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data } = await (supabase as any)
        .from('vanguard_policy_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setPolicies(data.map((p: any) => ({
          id: p.id, name: p.name, description: p.description || '',
          category: p.category || 'security', isActive: p.is_active,
          assignedDevices: p.assigned_devices || 0, settings: p.settings || {},
          createdAt: new Date(p.created_at).toISOString().split('T')[0],
        })));
      }
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return <Shield className="h-4 w-4 text-red-500" />;
      case 'performance': return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'maintenance': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'compliance': return <FileSliders className="h-4 w-4 text-purple-500" />;
      default: return null;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'security': return 'bg-red-500/10 text-red-600';
      case 'performance': return 'bg-yellow-500/10 text-yellow-600';
      case 'maintenance': return 'bg-blue-500/10 text-blue-600';
      case 'compliance': return 'bg-purple-500/10 text-purple-600';
      default: return '';
    }
  };

  const handleTogglePolicy = async (policyId: string, active: boolean) => {
    await (supabase as any).from('vanguard_policy_templates').update({ is_active: active }).eq('id', policyId);
    toast.success(`Policy ${active ? 'activated' : 'deactivated'}`);
    loadPolicies();
  };

  const handleCreatePolicy = async () => {
    if (!user) return;
    const { error } = await (supabase as any).from('vanguard_policy_templates').insert({
      user_id: user.id, name: newPolicy.name, description: newPolicy.description,
      category: newPolicy.category, is_active: false, settings: {},
    });
    if (error) { toast.error('Failed to create policy'); return; }
    setShowCreateDialog(false);
    setNewPolicy({ name: '', description: '', category: 'security' });
    toast.success('Policy template created');
    loadPolicies();
  };

  const handleDeletePolicy = async (policyId: string) => {
    await (supabase as any).from('vanguard_policy_templates').delete().eq('id', policyId);
    toast.success('Policy deleted');
    loadPolicies();
  };

  const handleDuplicatePolicy = async (policy: PolicyTemplate) => {
    if (!user) return;
    await (supabase as any).from('vanguard_policy_templates').insert({
      user_id: user.id, name: `${policy.name} (Copy)`, description: policy.description,
      category: policy.category, is_active: false, settings: policy.settings,
    });
    toast.success('Policy duplicated');
    loadPolicies();
  };

  const filteredPolicies = policies.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileSliders className="h-5 w-5" />
              Policy Templates
            </CardTitle>
            <Button size="sm" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Policy
            </Button>
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search policies..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {filteredPolicies.map((policy) => (
                <Card key={policy.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">{getCategoryIcon(policy.category)}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{policy.name}</h4>
                          <Badge className={getCategoryColor(policy.category)}>{policy.category}</Badge>
                          {policy.isActive && <Badge variant="outline" className="bg-green-500/10 text-green-600">Active</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{policy.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1"><Monitor className="h-4 w-4" />{policy.assignedDevices} devices</div>
                          <div className="flex items-center gap-1"><Clock className="h-4 w-4" />Created {policy.createdAt}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={policy.isActive} onCheckedChange={(checked) => handleTogglePolicy(policy.id, checked)} />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingPolicy(policy)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicatePolicy(policy)}><Copy className="h-4 w-4 mr-2" />Duplicate</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeletePolicy(policy.id)}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Card>
              ))}
              {filteredPolicies.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <FileSliders className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No policy templates found</p>
                </div>
              )}
            </div>
          </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Policy Template</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Policy Name</Label>
              <Input value={newPolicy.name} onChange={(e) => setNewPolicy(prev => ({ ...prev, name: e.target.value }))} placeholder="Security Baseline v2" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={newPolicy.description} onChange={(e) => setNewPolicy(prev => ({ ...prev, description: e.target.value }))} placeholder="What this policy enforces..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <div className="flex gap-2">
                {(['security', 'performance', 'maintenance', 'compliance'] as const).map((cat) => (
                  <Button key={cat} variant={newPolicy.category === cat ? 'default' : 'outline'} size="sm" onClick={() => setNewPolicy(prev => ({ ...prev, category: cat }))} className="capitalize">
                    {getCategoryIcon(cat)}<span className="ml-2">{cat}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreatePolicy} disabled={!newPolicy.name}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
