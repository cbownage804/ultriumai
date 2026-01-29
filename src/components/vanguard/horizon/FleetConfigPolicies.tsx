import { useState } from "react";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
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
  Save,
  RefreshCw,
  Check,
  X,
  Laptop,
  Building,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

const mockPolicies: ConfigPolicy[] = [
  {
    id: "pol-1",
    name: "Corporate Security Standard",
    description: "Enterprise security baseline for all devices",
    category: "security",
    priority: 1,
    is_active: true,
    assigned_devices: 156,
    assigned_groups: ["All Workstations", "Servers"],
    settings: { firewall_enabled: true, windows_defender_enabled: true, bitlocker_required: true },
  },
  {
    id: "pol-2",
    name: "Remote Worker Power Settings",
    description: "Optimized power management for remote workers",
    category: "power",
    priority: 2,
    is_active: true,
    assigned_devices: 89,
    assigned_groups: ["Remote Workers"],
    settings: { power_plan: "balanced", display_off_battery: 5, sleep_battery: 15 },
  },
  {
    id: "pol-3",
    name: "Server Monitoring",
    description: "Enhanced monitoring for production servers",
    category: "monitoring",
    priority: 1,
    is_active: true,
    assigned_devices: 24,
    assigned_groups: ["Production Servers"],
    settings: { heartbeat_interval: 30, cpu_alert_threshold: 80 },
  },
];

const categoryConfig = {
  security: { icon: Shield, color: "text-red-500", bg: "bg-red-500/10" },
  power: { icon: Power, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  network: { icon: Network, color: "text-blue-500", bg: "bg-blue-500/10" },
  display: { icon: Monitor, color: "text-purple-500", bg: "bg-purple-500/10" },
  updates: { icon: RefreshCw, color: "text-green-500", bg: "bg-green-500/10" },
  monitoring: { icon: Eye, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  general: { icon: Settings, color: "text-gray-500", bg: "bg-gray-500/10" },
};

export function FleetConfigPolicies() {
  const [policies, setPolicies] = useState<ConfigPolicy[]>(mockPolicies);
  const [activeTab, setActiveTab] = useState("policies");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<ConfigPolicy | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const [newPolicy, setNewPolicy] = useState({
    name: "",
    description: "",
    category: "security" as ConfigPolicy["category"],
  });

  const filteredPolicies = policies.filter(
    (p) => filterCategory === "all" || p.category === filterCategory
  );

  const handleCreateFromTemplate = (template: PolicyTemplate) => {
    const policy: ConfigPolicy = {
      id: `pol-${Date.now()}`,
      name: `${template.name} (Copy)`,
      description: template.description,
      category: template.category,
      priority: policies.length + 1,
      is_active: false,
      assigned_devices: 0,
      assigned_groups: [],
      settings: { ...template.settings },
    };
    setPolicies([...policies, policy]);
  };

  const togglePolicyActive = (policyId: string) => {
    setPolicies(policies.map((p) => (p.id === policyId ? { ...p, is_active: !p.is_active } : p)));
  };

  const deletePolicy = (policyId: string) => {
    setPolicies(policies.filter((p) => p.id !== policyId));
  };

  const getCategoryIcon = (category: ConfigPolicy["category"]) => {
    const config = categoryConfig[category];
    const Icon = config.icon;
    return <Icon className={cn("h-5 w-5", config.color)} />;
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="policies">Active Policies</TabsTrigger>
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

          <div className="space-y-4">
            {filteredPolicies.map((policy) => (
              <Card key={policy.id} className={cn("transition-all", !policy.is_active && "opacity-60")}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", categoryConfig[policy.category].bg)}>
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
                      <Switch checked={policy.is_active} onCheckedChange={() => togglePolicyActive(policy.id)} />
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedPolicy(policy); setShowEditDialog(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
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
                </CardContent>
              </Card>
            ))}
          </div>
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

            <Card className="border-dashed hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center h-full py-8">
                <div className="p-3 rounded-full bg-muted/50 mb-3">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-medium">Create Custom Template</p>
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
        <DialogContent className="max-w-2xl">
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

            <Accordion type="single" collapsible className="w-full">
              {newPolicy.category === "security" && (
                <AccordionItem value="security">
                  <AccordionTrigger>Security Settings</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 py-2">
                      <div className="flex items-center justify-between">
                        <Label>Windows Firewall</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Windows Defender</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>BitLocker Required</Label>
                        <Switch />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
              {newPolicy.category === "monitoring" && (
                <AccordionItem value="monitoring">
                  <AccordionTrigger>Monitoring Settings</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label>Heartbeat Interval (seconds)</Label>
                        <Input type="number" defaultValue={60} />
                      </div>
                      <div className="space-y-2">
                        <Label>CPU Alert Threshold (%)</Label>
                        <Slider defaultValue={[90]} max={100} step={5} />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button disabled={!newPolicy.name}>
              <Save className="h-4 w-4 mr-2" />
              Create Policy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Policy Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Policy</DialogTitle>
            <DialogDescription>Modify {selectedPolicy?.name} settings</DialogDescription>
          </DialogHeader>
          {selectedPolicy && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6 pr-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Policy Name</Label>
                    <Input defaultValue={selectedPolicy.name} />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Input type="number" defaultValue={selectedPolicy.priority} min={1} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input defaultValue={selectedPolicy.description} />
                </div>
                <div className="space-y-4">
                  <Label>Settings</Label>
                  <div className="space-y-3">
                    {Object.entries(selectedPolicy.settings).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <Label className="capitalize">{key.replace(/_/g, " ")}</Label>
                        {typeof value === "boolean" ? (
                          <Switch defaultChecked={value} />
                        ) : (
                          <Input type={typeof value === "number" ? "number" : "text"} defaultValue={String(value)} className="w-32" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button><Save className="h-4 w-4 mr-2" />Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
