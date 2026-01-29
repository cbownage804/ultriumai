import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Settings,
  Shield,
  Monitor,
  Network,
  Power,
  Users,
  Eye,
  Plus,
  Copy,
  Edit,
  Trash2,
  Check,
  X,
  Laptop,
  Building,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ConfigPolicy {
  id: string;
  name: string;
  description: string;
  category: "security" | "power" | "network" | "display" | "updates" | "monitoring" | "general";
  priority: number;
  is_active: boolean;
  assigned_devices: number;
  assigned_groups: string[];
  settings: Record<string, any>;
}

interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  category: ConfigPolicy["category"];
  settings: Record<string, any>;
}

const policyTemplates: PolicyTemplate[] = [
  {
    id: "tpl-1",
    name: "Enterprise Security Baseline",
    description: "Recommended security settings for enterprise environments",
    category: "security",
    settings: {
      firewall_enabled: true,
      windows_defender_enabled: true,
      real_time_protection: true,
      bitlocker_required: true,
    },
  },
  {
    id: "tpl-2",
    name: "Power Saving Profile",
    description: "Optimize power settings for laptops",
    category: "power",
    settings: {
      power_plan: "balanced",
      display_off_battery: 5,
      sleep_battery: 15,
    },
  },
  {
    id: "tpl-3",
    name: "Workstation Monitoring",
    description: "Standard monitoring for workstations",
    category: "monitoring",
    settings: {
      heartbeat_interval: 60,
      metrics_collection_interval: 300,
      cpu_alert_threshold: 90,
      memory_alert_threshold: 85,
    },
  },
];

const categoryConfig = {
  security: { icon: Shield, color: "text-red-500", bg: "bg-red-500/10" },
  power: { icon: Power, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  network: { icon: Network, color: "text-blue-500", bg: "bg-blue-500/10" },
  display: { icon: Monitor, color: "text-purple-500", bg: "bg-purple-500/10" },
  updates: { icon: Settings, color: "text-green-500", bg: "bg-green-500/10" },
  monitoring: { icon: Eye, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  general: { icon: Settings, color: "text-gray-500", bg: "bg-gray-500/10" },
};

export function FleetConfigPolicies() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<ConfigPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("policies");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const [newPolicy, setNewPolicy] = useState({
    name: "",
    description: "",
    category: "security" as ConfigPolicy["category"],
    settings: {} as Record<string, any>,
  });

  useEffect(() => {
    if (user?.id) {
      fetchPolicies();
    }
  }, [user?.id]);

  const fetchPolicies = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vanguard_config_policies')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: true });

      if (error) throw error;
      
      const transformed: ConfigPolicy[] = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        category: p.category || 'general',
        priority: p.priority || 1,
        is_active: p.is_active ?? true,
        assigned_devices: p.assigned_devices || 0,
        assigned_groups: p.assigned_groups || [],
        settings: p.settings || {},
      }));
      
      setPolicies(transformed);
    } catch (error) {
      console.error('Error fetching policies:', error);
      toast.error('Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePolicy = async () => {
    if (!user?.id || !newPolicy.name) return;
    
    try {
      const { error } = await supabase
        .from('vanguard_config_policies')
        .insert({
          user_id: user.id,
          name: newPolicy.name,
          description: newPolicy.description,
          category: newPolicy.category,
          priority: policies.length + 1,
          is_active: true,
          settings: newPolicy.settings,
        });

      if (error) throw error;
      toast.success('Policy created');
      setShowCreateDialog(false);
      setNewPolicy({ name: "", description: "", category: "security", settings: {} });
      fetchPolicies();
    } catch (error) {
      console.error('Error creating policy:', error);
      toast.error('Failed to create policy');
    }
  };

  const handleCreateFromTemplate = async (template: PolicyTemplate) => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('vanguard_config_policies')
        .insert({
          user_id: user.id,
          name: `${template.name} (Copy)`,
          description: template.description,
          category: template.category,
          priority: policies.length + 1,
          is_active: false,
          settings: template.settings,
        });

      if (error) throw error;
      toast.success('Policy created from template');
      fetchPolicies();
    } catch (error) {
      console.error('Error creating from template:', error);
      toast.error('Failed to create policy');
    }
  };

  const togglePolicyActive = async (policyId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('vanguard_config_policies')
        .update({ is_active: !currentState })
        .eq('id', policyId);

      if (error) throw error;
      setPolicies(policies.map((p) => (p.id === policyId ? { ...p, is_active: !currentState } : p)));
      toast.success(`Policy ${!currentState ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error toggling policy:', error);
      toast.error('Failed to update policy');
    }
  };

  const deletePolicy = async (policyId: string) => {
    try {
      const { error } = await supabase
        .from('vanguard_config_policies')
        .delete()
        .eq('id', policyId);

      if (error) throw error;
      setPolicies(policies.filter((p) => p.id !== policyId));
      toast.success('Policy deleted');
    } catch (error) {
      console.error('Error deleting policy:', error);
      toast.error('Failed to delete policy');
    }
  };

  const filteredPolicies = policies.filter(
    (p) => filterCategory === "all" || p.category === filterCategory
  );

  const getCategoryIcon = (category: ConfigPolicy["category"]) => {
    const config = categoryConfig[category] || categoryConfig.general;
    const Icon = config.icon;
    return <Icon className={cn("h-5 w-5", config.color)} />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="policies">Active Policies ({policies.length})</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="assignments">Device Assignments</TabsTrigger>
          </TabsList>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Policy
          </Button>
        </div>

        <TabsContent value="policies" className="space-y-4 mt-4">
          <div className="flex items-center gap-4">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="power">Power Management</SelectItem>
                <SelectItem value="network">Network</SelectItem>
                <SelectItem value="monitoring">Monitoring</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredPolicies.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No policies found. Create one or use a template.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredPolicies.map((policy) => (
                <Card key={policy.id} className={cn("transition-all", !policy.is_active && "opacity-60")}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", categoryConfig[policy.category]?.bg || "bg-gray-500/10")}>
                          {getCategoryIcon(policy.category)}
                        </div>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {policy.name}
                            <Badge variant={policy.is_active ? "default" : "secondary"}>
                              {policy.is_active ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">Priority {policy.priority}</Badge>
                          </CardTitle>
                          <CardDescription>{policy.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={policy.is_active} onCheckedChange={() => togglePolicyActive(policy.id, policy.is_active)} />
                        <Button variant="ghost" size="icon" onClick={() => deletePolicy(policy.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Laptop className="h-4 w-4" />
                          <span>{policy.assigned_devices} devices</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          <span>{policy.assigned_groups.length} groups</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {policy.assigned_groups.slice(0, 3).map((group) => (
                          <Badge key={group} variant="outline" className="text-xs">{group}</Badge>
                        ))}
                      </div>
                    </div>

                    {Object.keys(policy.settings).length > 0 && (
                      <div className="mt-4 p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-2">Key Settings</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(policy.settings).slice(0, 6).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-1 px-2 py-1 rounded bg-background text-xs">
                              <span className="text-muted-foreground">{key.replace(/_/g, " ")}:</span>
                              <span className="font-medium">
                                {typeof value === "boolean" ? (
                                  value ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-red-500" />
                                ) : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {policyTemplates.map((template) => (
              <Card key={template.id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", categoryConfig[template.category].bg)}>
                      {getCategoryIcon(template.category)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription className="text-xs">{template.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-xs text-muted-foreground">
                      {Object.keys(template.settings).length} settings configured
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => handleCreateFromTemplate(template)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="border-dashed hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setShowCreateDialog(true)}>
              <CardContent className="flex flex-col items-center justify-center h-full py-8">
                <div className="p-3 rounded-full bg-muted/50 mb-3">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-medium">Create Custom Policy</p>
                <p className="text-sm text-muted-foreground text-center mt-1">Build your own policy from scratch</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-cyan-500" />
                Device Group Assignments
              </CardTitle>
              <CardDescription>Manage which policies apply to device groups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {["All Workstations", "Servers", "Remote Workers", "Production Servers"].map((group) => {
                  const assignedPolicies = policies.filter((p) => p.assigned_groups.includes(group));
                  return (
                    <div key={group} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{group}</p>
                          <p className="text-sm text-muted-foreground">{assignedPolicies.length} policies assigned</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-wrap gap-1">
                          {assignedPolicies.slice(0, 2).map((p) => (
                            <Badge key={p.id} variant="outline" className="text-xs">{p.name}</Badge>
                          ))}
                          {assignedPolicies.length > 2 && (
                            <Badge variant="outline" className="text-xs">+{assignedPolicies.length - 2}</Badge>
                          )}
                        </div>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Policy Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Policy</DialogTitle>
            <DialogDescription>Create a configuration policy to push settings to your devices</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Policy Name</Label>
                <Input
                  value={newPolicy.name}
                  onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                  placeholder="My Security Policy"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={newPolicy.category}
                  onValueChange={(v) => setNewPolicy({ ...newPolicy, category: v as ConfigPolicy["category"] })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="power">Power Management</SelectItem>
                    <SelectItem value="network">Network</SelectItem>
                    <SelectItem value="monitoring">Monitoring</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={newPolicy.description}
                onChange={(e) => setNewPolicy({ ...newPolicy, description: e.target.value })}
                placeholder="What does this policy configure?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreatePolicy}>Create Policy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
