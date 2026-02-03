import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Settings, 
  Plus, 
  Zap, 
  Eye, 
  Bell,
  Shield,
  Network,
  HardDrive,
  Skull,
  Ban
} from "lucide-react";
import { useXDRAutomationPolicies, useCreateAutomationPolicy, useUpdateAutomationPolicy } from "@/hooks/usePursuitXDR";

const automationModeDescriptions = {
  full_auto: {
    label: "Full Auto-Remediation",
    description: "AI decides and acts immediately on threats. Maximum protection with minimal manual intervention.",
    icon: <Zap className="h-5 w-5 text-green-500" />,
    color: "bg-green-500/10 border-green-500/30",
  },
  guided: {
    label: "Guided Response",
    description: "AI recommends actions, technician approves with one-click. Balanced control and speed.",
    icon: <Eye className="h-5 w-5 text-blue-500" />,
    color: "bg-blue-500/10 border-blue-500/30",
  },
  alert_only: {
    label: "Alert-Only Mode",
    description: "Detect and alert only. All remediation is manual. Maximum control, slower response.",
    icon: <Bell className="h-5 w-5 text-yellow-500" />,
    color: "bg-yellow-500/10 border-yellow-500/30",
  },
};

export function AutomationPoliciesPanel() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPolicy, setNewPolicy] = useState({
    policy_name: "",
    policy_scope: "organization",
    automation_mode: "guided" as "full_auto" | "guided" | "alert_only",
    auto_isolate_on_critical: false,
    auto_kill_malicious_processes: true,
    auto_quarantine_files: true,
    auto_block_c2: true,
    auto_protect_shadow_copies: true,
  });

  const { data: policies, isLoading } = useXDRAutomationPolicies();
  const createPolicy = useCreateAutomationPolicy();
  const updatePolicy = useUpdateAutomationPolicy();

  const handleCreatePolicy = () => {
    createPolicy.mutate(newPolicy as any, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        setNewPolicy({
          policy_name: "",
          policy_scope: "organization",
          automation_mode: "guided",
          auto_isolate_on_critical: false,
          auto_kill_malicious_processes: true,
          auto_quarantine_files: true,
          auto_block_c2: true,
          auto_protect_shadow_copies: true,
        });
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Automation Mode Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(automationModeDescriptions).map(([mode, info]) => (
          <Card key={mode} className={info.color}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                {info.icon}
                {info.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{info.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Policy Button */}
      <Card>
        <CardContent className="pt-4">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Automation Policy
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Automation Policy</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Policy Name</Label>
                    <Input
                      placeholder="e.g., Default Organization Policy"
                      value={newPolicy.policy_name}
                      onChange={(e) => setNewPolicy({ ...newPolicy, policy_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Scope</Label>
                    <Select 
                      value={newPolicy.policy_scope} 
                      onValueChange={(v) => setNewPolicy({ ...newPolicy, policy_scope: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="organization">Organization</SelectItem>
                        <SelectItem value="device_group">Device Group</SelectItem>
                        <SelectItem value="device">Single Device</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Automation Mode</Label>
                  <RadioGroup 
                    value={newPolicy.automation_mode} 
                    onValueChange={(v) => setNewPolicy({ ...newPolicy, automation_mode: v as any })}
                  >
                    {Object.entries(automationModeDescriptions).map(([mode, info]) => (
                      <div key={mode} className="flex items-center space-x-3 p-3 rounded-lg border">
                        <RadioGroupItem value={mode} id={mode} />
                        <div className="flex-1">
                          <Label htmlFor={mode} className="flex items-center gap-2 cursor-pointer">
                            {info.icon}
                            {info.label}
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">{info.description}</p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label>Auto-Response Actions</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="isolate"
                        checked={newPolicy.auto_isolate_on_critical}
                        onCheckedChange={(v) => setNewPolicy({ ...newPolicy, auto_isolate_on_critical: !!v })}
                      />
                      <Label htmlFor="isolate" className="flex items-center gap-2 cursor-pointer">
                        <Network className="h-4 w-4" />
                        Isolate on Critical
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="kill"
                        checked={newPolicy.auto_kill_malicious_processes}
                        onCheckedChange={(v) => setNewPolicy({ ...newPolicy, auto_kill_malicious_processes: !!v })}
                      />
                      <Label htmlFor="kill" className="flex items-center gap-2 cursor-pointer">
                        <Ban className="h-4 w-4" />
                        Kill Malicious Processes
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="quarantine"
                        checked={newPolicy.auto_quarantine_files}
                        onCheckedChange={(v) => setNewPolicy({ ...newPolicy, auto_quarantine_files: !!v })}
                      />
                      <Label htmlFor="quarantine" className="flex items-center gap-2 cursor-pointer">
                        <Shield className="h-4 w-4" />
                        Quarantine Files
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="c2"
                        checked={newPolicy.auto_block_c2}
                        onCheckedChange={(v) => setNewPolicy({ ...newPolicy, auto_block_c2: !!v })}
                      />
                      <Label htmlFor="c2" className="flex items-center gap-2 cursor-pointer">
                        <Network className="h-4 w-4" />
                        Block C2 Traffic
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="shadow"
                        checked={newPolicy.auto_protect_shadow_copies}
                        onCheckedChange={(v) => setNewPolicy({ ...newPolicy, auto_protect_shadow_copies: !!v })}
                      />
                      <Label htmlFor="shadow" className="flex items-center gap-2 cursor-pointer">
                        <HardDrive className="h-4 w-4" />
                        Protect Shadow Copies
                      </Label>
                    </div>
                  </div>
                </div>

                <Button onClick={handleCreatePolicy} className="w-full">
                  Create Policy
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Policies List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Automation Policies
            {policies && <Badge variant="secondary">{policies.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Loading policies...
              </div>
            ) : !policies?.length ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Settings className="h-8 w-8 mb-2" />
                <p>No automation policies</p>
                <p className="text-xs">Create a policy to configure automated responses</p>
              </div>
            ) : (
              <div className="space-y-3">
                {policies.map((policy) => (
                  <div
                    key={policy.id}
                    className={`p-4 rounded-lg border ${automationModeDescriptions[policy.automation_mode]?.color || ""}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {automationModeDescriptions[policy.automation_mode]?.icon}
                          <span className="font-medium">{policy.policy_name}</span>
                          <Badge variant="outline">{policy.policy_scope}</Badge>
                          <Badge variant="secondary">
                            {automationModeDescriptions[policy.automation_mode]?.label}
                          </Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {policy.auto_isolate_on_critical && (
                            <Badge variant="outline" className="text-xs">Isolate Critical</Badge>
                          )}
                          {policy.auto_kill_malicious_processes && (
                            <Badge variant="outline" className="text-xs">Kill Processes</Badge>
                          )}
                          {policy.auto_quarantine_files && (
                            <Badge variant="outline" className="text-xs">Quarantine</Badge>
                          )}
                          {policy.auto_block_c2 && (
                            <Badge variant="outline" className="text-xs">Block C2</Badge>
                          )}
                          {policy.auto_protect_shadow_copies && (
                            <Badge variant="outline" className="text-xs">Shadow Copies</Badge>
                          )}
                        </div>
                      </div>
                      <Switch 
                        checked={policy.is_active}
                        onCheckedChange={(v) => updatePolicy.mutate({ id: policy.id, updates: { is_active: v } })}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
