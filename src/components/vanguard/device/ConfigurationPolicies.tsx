import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Lock,
  Wifi,
  Monitor,
  HardDrive,
  Plus,
  Check,
  X,
  Settings,
  Copy,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface Policy {
  id: string;
  name: string;
  description: string;
  category: "security" | "network" | "display" | "storage" | "updates";
  settings: PolicySetting[];
  isEnabled: boolean;
  appliedDevices: number;
}

interface PolicySetting {
  id: string;
  name: string;
  type: "boolean" | "number" | "string" | "select";
  value: any;
  options?: string[];
  min?: number;
  max?: number;
}

const DEFAULT_POLICIES: Policy[] = [
  {
    id: "security-baseline",
    name: "Security Baseline",
    description: "Windows security hardening settings",
    category: "security",
    isEnabled: true,
    appliedDevices: 5,
    settings: [
      { id: "firewall", name: "Enable Windows Firewall", type: "boolean", value: true },
      { id: "defender", name: "Enable Windows Defender", type: "boolean", value: true },
      { id: "uac", name: "UAC Level", type: "select", value: "high", options: ["off", "low", "medium", "high"] },
      { id: "rdp", name: "Allow Remote Desktop", type: "boolean", value: false },
      { id: "password-length", name: "Minimum Password Length", type: "number", value: 12, min: 8, max: 24 },
    ],
  },
  {
    id: "network-config",
    name: "Network Configuration",
    description: "Network and connectivity settings",
    category: "network",
    isEnabled: true,
    appliedDevices: 3,
    settings: [
      { id: "dns-primary", name: "Primary DNS", type: "string", value: "8.8.8.8" },
      { id: "dns-secondary", name: "Secondary DNS", type: "string", value: "8.8.4.4" },
      { id: "proxy-enabled", name: "Use Proxy", type: "boolean", value: false },
      { id: "wifi-security", name: "Minimum WiFi Security", type: "select", value: "wpa2", options: ["open", "wep", "wpa", "wpa2", "wpa3"] },
    ],
  },
  {
    id: "power-management",
    name: "Power Management",
    description: "Power and sleep settings",
    category: "display",
    isEnabled: false,
    appliedDevices: 0,
    settings: [
      { id: "screen-timeout", name: "Screen Timeout (minutes)", type: "number", value: 15, min: 1, max: 60 },
      { id: "sleep-timeout", name: "Sleep Timeout (minutes)", type: "number", value: 30, min: 1, max: 120 },
      { id: "hibernate", name: "Enable Hibernate", type: "boolean", value: true },
      { id: "lid-close", name: "Lid Close Action", type: "select", value: "sleep", options: ["nothing", "sleep", "hibernate", "shutdown"] },
    ],
  },
  {
    id: "storage-policy",
    name: "Storage Policy",
    description: "Disk and storage management",
    category: "storage",
    isEnabled: true,
    appliedDevices: 8,
    settings: [
      { id: "storage-sense", name: "Enable Storage Sense", type: "boolean", value: true },
      { id: "cleanup-temp", name: "Auto-cleanup Temp Files", type: "boolean", value: true },
      { id: "cleanup-days", name: "Delete files older than (days)", type: "number", value: 30, min: 7, max: 90 },
      { id: "recycle-bin-days", name: "Empty Recycle Bin after (days)", type: "number", value: 30, min: 1, max: 60 },
    ],
  },
  {
    id: "update-policy",
    name: "Windows Update Policy",
    description: "Automatic update settings",
    category: "updates",
    isEnabled: true,
    appliedDevices: 12,
    settings: [
      { id: "auto-update", name: "Enable Automatic Updates", type: "boolean", value: true },
      { id: "update-time", name: "Scheduled Update Time", type: "select", value: "03:00", options: ["00:00", "01:00", "02:00", "03:00", "04:00", "05:00"] },
      { id: "defer-feature", name: "Defer Feature Updates (days)", type: "number", value: 30, min: 0, max: 365 },
      { id: "defer-quality", name: "Defer Quality Updates (days)", type: "number", value: 7, min: 0, max: 30 },
      { id: "auto-reboot", name: "Allow Auto-Reboot", type: "boolean", value: false },
    ],
  },
];

interface ConfigurationPoliciesProps {
  agentId?: string;
  sendCommand?: (cmd: string, payload?: any) => Promise<any>;
}

export function ConfigurationPolicies({ agentId, sendCommand }: ConfigurationPoliciesProps) {
  const [policies, setPolicies] = useState<Policy[]>(DEFAULT_POLICIES);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const categoryIcons: Record<string, any> = {
    security: Shield,
    network: Wifi,
    display: Monitor,
    storage: HardDrive,
    updates: Settings,
  };

  const categoryColors: Record<string, string> = {
    security: "bg-red-500/10 text-red-600",
    network: "bg-blue-500/10 text-blue-600",
    display: "bg-purple-500/10 text-purple-600",
    storage: "bg-green-500/10 text-green-600",
    updates: "bg-orange-500/10 text-orange-600",
  };

  const togglePolicy = (policyId: string) => {
    setPolicies((prev) =>
      prev.map((p) =>
        p.id === policyId ? { ...p, isEnabled: !p.isEnabled } : p
      )
    );
    toast.success("Policy updated");
  };

  const applyPolicy = async (policy: Policy) => {
    if (!sendCommand) return;
    
    try {
      await sendCommand("apply_policy", {
        policy_id: policy.id,
        settings: policy.settings.reduce((acc, s) => ({ ...acc, [s.id]: s.value }), {}),
      });
      toast.success(`Policy "${policy.name}" applied to device`);
    } catch (err) {
      toast.error("Failed to apply policy");
    }
  };

  const updateSetting = (policyId: string, settingId: string, value: any) => {
    setPolicies((prev) =>
      prev.map((p) =>
        p.id === policyId
          ? {
              ...p,
              settings: p.settings.map((s) =>
                s.id === settingId ? { ...s, value } : s
              ),
            }
          : p
      )
    );
  };

  const deletePolicy = (policyId: string) => {
    setPolicies((prev) => prev.filter((p) => p.id !== policyId));
    toast.success("Policy deleted");
  };

  const duplicatePolicy = (policy: Policy) => {
    const newPolicy: Policy = {
      ...policy,
      id: `${policy.id}-copy-${Date.now()}`,
      name: `${policy.name} (Copy)`,
      appliedDevices: 0,
      isEnabled: false,
    };
    setPolicies((prev) => [...prev, newPolicy]);
    toast.success("Policy duplicated");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Configuration Policies
            </CardTitle>
            <CardDescription>
              Manage device configuration and security policies
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Policy
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {policies.map((policy) => {
              const Icon = categoryIcons[policy.category];
              return (
                <div
                  key={policy.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    policy.isEnabled ? "border-primary/50 bg-primary/5" : "bg-muted/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${categoryColors[policy.category]}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{policy.name}</h4>
                          <Badge variant={policy.isEnabled ? "default" : "secondary"}>
                            {policy.isEnabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {policy.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{policy.settings.length} settings</span>
                          <span>•</span>
                          <span>{policy.appliedDevices} devices</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={policy.isEnabled}
                        onCheckedChange={() => togglePolicy(policy.id)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPolicy(policy);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      {agentId && (
                        <Button
                          size="sm"
                          onClick={() => applyPolicy(policy)}
                          disabled={!policy.isEnabled}
                        >
                          Apply
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Quick preview of settings */}
                  <div className="mt-3 pt-3 border-t flex flex-wrap gap-2">
                    {policy.settings.slice(0, 4).map((setting) => (
                      <Badge key={setting.id} variant="outline" className="text-xs">
                        {setting.name}:{" "}
                        {typeof setting.value === "boolean"
                          ? setting.value
                            ? "On"
                            : "Off"
                          : setting.value}
                      </Badge>
                    ))}
                    {policy.settings.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{policy.settings.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Edit Policy Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Policy: {selectedPolicy?.name}</DialogTitle>
              <DialogDescription>
                Configure policy settings
              </DialogDescription>
            </DialogHeader>
            {selectedPolicy && (
              <ScrollArea className="max-h-[400px] pr-4">
                <div className="space-y-4 py-4">
                  {selectedPolicy.settings.map((setting) => (
                    <div key={setting.id} className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <Label>{setting.name}</Label>
                      </div>
                      <div className="w-48">
                        {setting.type === "boolean" && (
                          <Switch
                            checked={setting.value}
                            onCheckedChange={(checked) =>
                              updateSetting(selectedPolicy.id, setting.id, checked)
                            }
                          />
                        )}
                        {setting.type === "number" && (
                          <Input
                            type="number"
                            value={setting.value}
                            min={setting.min}
                            max={setting.max}
                            onChange={(e) =>
                              updateSetting(
                                selectedPolicy.id,
                                setting.id,
                                parseInt(e.target.value)
                              )
                            }
                          />
                        )}
                        {setting.type === "string" && (
                          <Input
                            value={setting.value}
                            onChange={(e) =>
                              updateSetting(selectedPolicy.id, setting.id, e.target.value)
                            }
                          />
                        )}
                        {setting.type === "select" && (
                          <Select
                            value={setting.value}
                            onValueChange={(v) =>
                              updateSetting(selectedPolicy.id, setting.id, v)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {setting.options?.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            <DialogFooter>
              <div className="flex-1 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedPolicy && duplicatePolicy(selectedPolicy)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (selectedPolicy) {
                      deletePolicy(selectedPolicy.id);
                      setEditDialogOpen(false);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setEditDialogOpen(false)}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
