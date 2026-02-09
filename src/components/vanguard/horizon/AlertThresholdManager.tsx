import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle, Bell, BellOff, Cpu, HardDrive, MemoryStick, Network, Plus, Settings, Trash2, Shield, Zap, Clock, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ThresholdRule {
  id: string;
  name: string;
  metric: string;
  operator: string;
  value: number;
  duration: number;
  severity: string;
  enabled: boolean;
  notifyEmail: boolean;
  notifyWebhook: boolean;
  autoRemediate: boolean;
  remediationScript?: string;
}

interface ThresholdProfile {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  rules: ThresholdRule[];
  appliedDevices: number;
  createdAt: string;
}

const METRIC_ICONS: Record<string, React.ReactNode> = {
  cpu: <Cpu className="h-4 w-4" />,
  memory: <MemoryStick className="h-4 w-4" />,
  disk: <HardDrive className="h-4 w-4" />,
  network_in: <Network className="h-4 w-4" />,
  network_out: <Network className="h-4 w-4" />,
  process_count: <Zap className="h-4 w-4" />,
  uptime: <Clock className="h-4 w-4" />,
};

const SEVERITY_COLORS: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  warning: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  critical: "bg-red-500/10 text-red-600 border-red-500/30",
};

export function AlertThresholdManager() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<ThresholdProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<ThresholdProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editRuleOpen, setEditRuleOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ThresholdRule | null>(null);
  const [createProfileOpen, setCreateProfileOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");

  useEffect(() => { if (user) loadData(); }, [user]);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data: profilesData } = await (supabase as any)
        .from('vanguard_alert_threshold_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at');

      const { data: rulesData } = await (supabase as any)
        .from('vanguard_alert_threshold_rules')
        .select('*')
        .eq('user_id', user.id);

      if (profilesData) {
        const mapped = profilesData.map((p: any) => ({
          id: p.id, name: p.name, description: p.description || '',
          isDefault: p.is_default, appliedDevices: p.applied_devices || 0,
          createdAt: p.created_at,
          rules: (rulesData || []).filter((r: any) => r.profile_id === p.id).map((r: any) => ({
            id: r.id, name: r.name, metric: r.metric, operator: r.operator,
            value: Number(r.value), duration: r.duration, severity: r.severity,
            enabled: r.enabled, notifyEmail: r.notify_email, notifyWebhook: r.notify_webhook,
            autoRemediate: r.auto_remediate, remediationScript: r.remediation_script,
          })),
        }));
        setProfiles(mapped);
        if (mapped.length > 0 && !selectedProfile) setSelectedProfile(mapped[0]);
        else if (selectedProfile) {
          const updated = mapped.find((p: ThresholdProfile) => p.id === selectedProfile.id);
          if (updated) setSelectedProfile(updated);
        }
      }
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  const updateRule = async (profileId: string, ruleId: string, updates: Partial<ThresholdRule>) => {
    const dbUpdates: any = {};
    if ('enabled' in updates) dbUpdates.enabled = updates.enabled;
    if ('value' in updates) dbUpdates.value = updates.value;
    if ('name' in updates) dbUpdates.name = updates.name;
    if ('metric' in updates) dbUpdates.metric = updates.metric;
    if ('operator' in updates) dbUpdates.operator = updates.operator;
    if ('duration' in updates) dbUpdates.duration = updates.duration;
    if ('severity' in updates) dbUpdates.severity = updates.severity;
    if ('notifyEmail' in updates) dbUpdates.notify_email = updates.notifyEmail;
    if ('notifyWebhook' in updates) dbUpdates.notify_webhook = updates.notifyWebhook;
    if ('autoRemediate' in updates) dbUpdates.auto_remediate = updates.autoRemediate;
    if ('remediationScript' in updates) dbUpdates.remediation_script = updates.remediationScript;

    await (supabase as any).from('vanguard_alert_threshold_rules').update(dbUpdates).eq('id', ruleId);
    
    // Optimistic update
    setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, rules: p.rules.map(r => r.id === ruleId ? { ...r, ...updates } : r) } : p));
    if (selectedProfile?.id === profileId) {
      setSelectedProfile(prev => prev ? { ...prev, rules: prev.rules.map(r => r.id === ruleId ? { ...r, ...updates } : r) } : null);
    }
  };

  const addRule = async (profileId: string) => {
    if (!user) return;
    const { data, error } = await (supabase as any).from('vanguard_alert_threshold_rules').insert({
      user_id: user.id, profile_id: profileId, name: "New Rule",
      metric: "cpu", operator: ">", value: 80, duration: 300,
      severity: "warning", enabled: true, notify_email: true,
    }).select().single();
    if (error) { toast.error('Failed to add rule'); return; }
    toast.success("Rule added");
    loadData();
  };

  const deleteRule = async (profileId: string, ruleId: string) => {
    await (supabase as any).from('vanguard_alert_threshold_rules').delete().eq('id', ruleId);
    toast.success("Rule deleted");
    loadData();
  };

  const createProfile = async () => {
    if (!newProfileName.trim() || !user) return;
    const { error } = await (supabase as any).from('vanguard_alert_threshold_profiles').insert({
      user_id: user.id, name: newProfileName, description: "Custom threshold profile", is_default: false,
    });
    if (error) { toast.error('Failed to create profile'); return; }
    setNewProfileName("");
    setCreateProfileOpen(false);
    toast.success("Profile created");
    loadData();
  };

  const deleteProfile = async (profileId: string) => {
    if (profiles.find(p => p.id === profileId)?.isDefault) { toast.error("Cannot delete default profile"); return; }
    await (supabase as any).from('vanguard_alert_threshold_profiles').delete().eq('id', profileId);
    toast.success("Profile deleted");
    if (selectedProfile?.id === profileId) setSelectedProfile(null);
    loadData();
  };

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return "Immediate";
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  if (isLoading) {
    return <Card><CardContent className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-cyan-500" />Alert Thresholds</CardTitle>
            <CardDescription>Configure metric thresholds and alerting rules</CardDescription>
          </div>
          <Dialog open={createProfileOpen} onOpenChange={setCreateProfileOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />New Profile</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Threshold Profile</DialogTitle><DialogDescription>Create a new set of alerting thresholds</DialogDescription></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Profile Name</Label><Input value={newProfileName} onChange={(e) => setNewProfileName(e.target.value)} placeholder="e.g., High-Performance Server" /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateProfileOpen(false)}>Cancel</Button>
                <Button onClick={createProfile} disabled={!newProfileName.trim()}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Profiles</Label>
            <ScrollArea className="h-[500px]">
              <div className="space-y-2 pr-2">
                {profiles.map(profile => (
                  <div key={profile.id} onClick={() => setSelectedProfile(profile)}
                    className={cn("p-3 rounded-lg border cursor-pointer transition-colors", selectedProfile?.id === profile.id ? "border-primary bg-primary/5" : "hover:border-muted-foreground/30")}>
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{profile.name}</h4>
                      {profile.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{profile.rules.length} rules</p>
                    <p className="text-xs text-muted-foreground">{profile.appliedDevices} devices</p>
                  </div>
                ))}
                {profiles.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No profiles yet</p>}
              </div>
            </ScrollArea>
          </div>

          <div className="col-span-3 space-y-4">
            {selectedProfile ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{selectedProfile.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedProfile.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => addRule(selectedProfile.id)}><Plus className="h-4 w-4 mr-2" />Add Rule</Button>
                    {!selectedProfile.isDefault && <Button size="sm" variant="destructive" onClick={() => deleteProfile(selectedProfile.id)}><Trash2 className="h-4 w-4" /></Button>}
                  </div>
                </div>

                <ScrollArea className="h-[450px]">
                  <div className="space-y-3 pr-4">
                    {selectedProfile.rules.map(rule => (
                      <div key={rule.id} className={cn("p-4 rounded-lg border transition-colors", rule.enabled ? SEVERITY_COLORS[rule.severity] || '' : "bg-muted/30 opacity-50")}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-background/50">{METRIC_ICONS[rule.metric]}</div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{rule.name}</h4>
                                <Badge variant="outline" className="text-xs capitalize">{rule.severity}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {rule.metric.replace("_", " ")} {rule.operator} {rule.value}%
                                {rule.duration > 0 && ` for ${formatDuration(rule.duration)}`}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                {rule.notifyEmail && <Badge variant="outline" className="text-xs">📧 Email</Badge>}
                                {rule.notifyWebhook && <Badge variant="outline" className="text-xs">🔗 Webhook</Badge>}
                                {rule.autoRemediate && <Badge variant="outline" className="text-xs">⚡ Auto-fix</Badge>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch checked={rule.enabled} onCheckedChange={(checked) => updateRule(selectedProfile.id, rule.id, { enabled: checked })} />
                            <Button size="sm" variant="ghost" onClick={() => { setEditingRule(rule); setEditRuleOpen(true); }}><Settings className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteRule(selectedProfile.id, rule.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-border/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-muted-foreground">Threshold Value</span>
                            <span className="text-sm font-medium">{rule.value}%</span>
                          </div>
                          <Slider value={[rule.value]} min={0} max={100} step={5} onValueChange={([value]) => updateRule(selectedProfile.id, rule.id, { value })} className="w-full" />
                        </div>
                      </div>
                    ))}
                    {selectedProfile.rules.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <BellOff className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No rules configured</p>
                        <p className="text-sm">Click "Add Rule" to create your first threshold</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Select a profile to edit thresholds</p>
              </div>
            )}
          </div>
        </div>

        {/* Edit Rule Dialog */}
        <Dialog open={editRuleOpen} onOpenChange={setEditRuleOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Edit Rule</DialogTitle></DialogHeader>
            {editingRule && selectedProfile && (
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Rule Name</Label><Input value={editingRule.name} onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Metric</Label>
                    <Select value={editingRule.metric} onValueChange={(v) => setEditingRule({ ...editingRule, metric: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cpu">CPU Usage</SelectItem>
                        <SelectItem value="memory">Memory Usage</SelectItem>
                        <SelectItem value="disk">Disk Usage</SelectItem>
                        <SelectItem value="network_in">Network In</SelectItem>
                        <SelectItem value="network_out">Network Out</SelectItem>
                        <SelectItem value="process_count">Process Count</SelectItem>
                        <SelectItem value="uptime">Uptime (hours)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Severity</Label>
                    <Select value={editingRule.severity} onValueChange={(v) => setEditingRule({ ...editingRule, severity: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Operator</Label>
                    <Select value={editingRule.operator} onValueChange={(v) => setEditingRule({ ...editingRule, operator: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value=">">Greater than</SelectItem>
                        <SelectItem value=">=">Greater or equal</SelectItem>
                        <SelectItem value="<">Less than</SelectItem>
                        <SelectItem value="<=">Less or equal</SelectItem>
                        <SelectItem value="=">Equals</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Value</Label><Input type="number" value={editingRule.value} onChange={(e) => setEditingRule({ ...editingRule, value: parseInt(e.target.value) || 0 })} /></div>
                </div>
                <div className="space-y-2">
                  <Label>Duration (seconds)</Label>
                  <Input type="number" value={editingRule.duration} onChange={(e) => setEditingRule({ ...editingRule, duration: parseInt(e.target.value) || 0 })} />
                  <p className="text-xs text-muted-foreground">How long the condition must be true before alerting (0 = immediate)</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between"><Label>Email Notification</Label><Switch checked={editingRule.notifyEmail} onCheckedChange={(checked) => setEditingRule({ ...editingRule, notifyEmail: checked })} /></div>
                  <div className="flex items-center justify-between"><Label>Webhook Notification</Label><Switch checked={editingRule.notifyWebhook} onCheckedChange={(checked) => setEditingRule({ ...editingRule, notifyWebhook: checked })} /></div>
                  <div className="flex items-center justify-between"><Label>Auto-Remediate</Label><Switch checked={editingRule.autoRemediate} onCheckedChange={(checked) => setEditingRule({ ...editingRule, autoRemediate: checked })} /></div>
                  {editingRule.autoRemediate && (
                    <div className="space-y-2"><Label>Remediation Script</Label><Input value={editingRule.remediationScript || ''} onChange={(e) => setEditingRule({ ...editingRule, remediationScript: e.target.value })} placeholder="Script name" /></div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditRuleOpen(false)}>Cancel</Button>
              <Button onClick={() => {
                if (editingRule && selectedProfile) {
                  updateRule(selectedProfile.id, editingRule.id, editingRule);
                  setEditRuleOpen(false);
                  toast.success("Rule updated");
                }
              }}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
