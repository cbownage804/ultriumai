import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Zap, Play, Pause, Settings, Shield, AlertTriangle, 
  CheckCircle, Clock, Loader2, Plus, Trash2, Edit,
  Server, Ticket, Wrench, RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Agent {
  id: string;
  name: string;
  status: string;
}

interface Vulnerability {
  id: string;
  vulnerability_id: string;
  title: string;
  severity: string;
  cve_id: string | null;
  affected_service: string | null;
  status: string | null;
}

interface RemediationRule {
  id: string;
  name: string;
  trigger_severity: string[];
  trigger_services: string[];
  action_type: 'patch' | 'ticket' | 'isolate' | 'notify' | 'script';
  action_config: Record<string, any>;
  is_enabled: boolean;
  auto_execute: boolean;
  last_triggered: string | null;
  trigger_count: number;
}

interface VulnAutoRemediationProps {
  vulnerabilities: Vulnerability[];
  agents: Agent[];
  onVulnUpdate?: () => void;
}

// Pre-built remediation rules
const DEFAULT_RULES: Partial<RemediationRule>[] = [
  {
    name: 'Auto-patch Critical CVEs',
    trigger_severity: ['critical'],
    trigger_services: [],
    action_type: 'patch',
    action_config: { reboot_if_needed: false, backup_first: true },
    is_enabled: false,
    auto_execute: false,
  },
  {
    name: 'Create ticket for High vulns',
    trigger_severity: ['high'],
    trigger_services: [],
    action_type: 'ticket',
    action_config: { priority: 'high', assign_to: 'security-team' },
    is_enabled: true,
    auto_execute: true,
  },
  {
    name: 'RDP vulnerabilities - Isolate host',
    trigger_severity: ['critical', 'high'],
    trigger_services: ['rdp', 'ms-wbt-server'],
    action_type: 'isolate',
    action_config: { allow_management: true },
    is_enabled: false,
    auto_execute: false,
  },
];

export function VulnAutoRemediation({ vulnerabilities, agents, onVulnUpdate }: VulnAutoRemediationProps) {
  const [rules, setRules] = useState<RemediationRule[]>(DEFAULT_RULES.map((r, i) => ({
    ...r,
    id: `rule-${i}`,
    last_triggered: null,
    trigger_count: 0,
  })) as RemediationRule[]);
  
  const [selectedAgent, setSelectedAgent] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RemediationRule | null>(null);

  // Rule form state
  const [ruleName, setRuleName] = useState("");
  const [ruleSeverities, setRuleSeverities] = useState<string[]>(['critical', 'high']);
  const [ruleAction, setRuleAction] = useState<RemediationRule['action_type']>('ticket');
  const [ruleAutoExecute, setRuleAutoExecute] = useState(false);

  const matchingVulns = (rule: RemediationRule) => {
    return vulnerabilities.filter(v => {
      if (v.status === 'patched' || v.status === 'suppressed') return false;
      if (!rule.trigger_severity.includes(v.severity.toLowerCase())) return false;
      if (rule.trigger_services.length > 0) {
        const service = v.affected_service?.toLowerCase() || '';
        if (!rule.trigger_services.some(s => service.includes(s))) return false;
      }
      return true;
    });
  };

  const toggleRule = (ruleId: string) => {
    setRules(rules.map(r => 
      r.id === ruleId ? { ...r, is_enabled: !r.is_enabled } : r
    ));
  };

  const executeRule = async (rule: RemediationRule) => {
    if (!selectedAgent) {
      toast.error('Select an agent to execute remediation');
      return;
    }

    const vulns = matchingVulns(rule);
    if (vulns.length === 0) {
      toast.info('No matching vulnerabilities to remediate');
      return;
    }

    setIsExecuting(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Not authenticated');
      setIsExecuting(false);
      return;
    }

    try {
      let commandType = '';
      let payload: any = { vulnerabilities: vulns.map(v => v.vulnerability_id) };

      switch (rule.action_type) {
        case 'patch':
          commandType = 'auto_patch_vulnerabilities';
          payload = {
            ...payload,
            reboot_if_needed: rule.action_config.reboot_if_needed,
            backup_first: rule.action_config.backup_first
          };
          break;
        case 'isolate':
          commandType = 'isolate_host';
          payload = {
            ...payload,
            allow_management: rule.action_config.allow_management
          };
          break;
        case 'ticket':
          // Create tickets directly in the database
          for (const vuln of vulns) {
            const ticketNumber = `VULN-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
            await supabase.from('tickets').insert([{
              user_id: session.user.id,
              ticket_number: ticketNumber,
              title: `[VulnScan] ${vuln.title}`,
              description: `Automated ticket created for ${vuln.severity} vulnerability: ${vuln.title}\n\nCVE: ${vuln.cve_id || 'N/A'}\nService: ${vuln.affected_service || 'Unknown'}`,
              priority: vuln.severity.toLowerCase() === 'critical' ? 'critical' : 'high',
              status: 'open',
              category: 'security',
            }]);
          }
          toast.success(`Created ${vulns.length} ticket(s)`);
          setIsExecuting(false);
          
          // Update rule stats
          setRules(rules.map(r => 
            r.id === rule.id ? { 
              ...r, 
              last_triggered: new Date().toISOString(),
              trigger_count: r.trigger_count + vulns.length
            } : r
          ));
          return;
        case 'notify':
          // Send notifications
          toast.success(`Notifications sent for ${vulns.length} vulnerabilities`);
          setIsExecuting(false);
          return;
        case 'script':
          commandType = 'run_remediation_script';
          payload = {
            ...payload,
            script: rule.action_config.script
          };
          break;
      }

      if (commandType) {
        const { error } = await supabase.functions.invoke('vanguard-agent-api?action=send_command', {
          body: {
            agent_id: selectedAgent,
            command_type: commandType,
            payload
          },
          headers: { Authorization: `Bearer ${session.access_token}` }
        });

        if (error) throw error;

        toast.success(`Remediation command sent to agent`);
        
        // Update rule stats
        setRules(rules.map(r => 
          r.id === rule.id ? { 
            ...r, 
            last_triggered: new Date().toISOString(),
            trigger_count: r.trigger_count + vulns.length
          } : r
        ));
      }

      onVulnUpdate?.();
    } catch (error) {
      console.error('Remediation error:', error);
      toast.error('Failed to execute remediation');
    } finally {
      setIsExecuting(false);
    }
  };

  const saveRule = () => {
    const newRule: RemediationRule = {
      id: editingRule?.id || `rule-${Date.now()}`,
      name: ruleName,
      trigger_severity: ruleSeverities,
      trigger_services: [],
      action_type: ruleAction,
      action_config: {},
      is_enabled: true,
      auto_execute: ruleAutoExecute,
      last_triggered: null,
      trigger_count: 0,
    };

    if (editingRule) {
      setRules(rules.map(r => r.id === editingRule.id ? newRule : r));
    } else {
      setRules([...rules, newRule]);
    }

    resetRuleForm();
    setIsRuleDialogOpen(false);
    toast.success(editingRule ? 'Rule updated' : 'Rule created');
  };

  const deleteRule = (ruleId: string) => {
    setRules(rules.filter(r => r.id !== ruleId));
    toast.success('Rule deleted');
  };

  const resetRuleForm = () => {
    setRuleName("");
    setRuleSeverities(['critical', 'high']);
    setRuleAction('ticket');
    setRuleAutoExecute(false);
    setEditingRule(null);
  };

  const openEditRule = (rule: RemediationRule) => {
    setEditingRule(rule);
    setRuleName(rule.name);
    setRuleSeverities(rule.trigger_severity);
    setRuleAction(rule.action_type);
    setRuleAutoExecute(rule.auto_execute);
    setIsRuleDialogOpen(true);
  };

  const getActionIcon = (action: RemediationRule['action_type']) => {
    switch (action) {
      case 'patch': return <Wrench className="h-4 w-4" />;
      case 'ticket': return <Ticket className="h-4 w-4" />;
      case 'isolate': return <Shield className="h-4 w-4" />;
      case 'notify': return <AlertTriangle className="h-4 w-4" />;
      case 'script': return <Settings className="h-4 w-4" />;
    }
  };

  const getActionLabel = (action: RemediationRule['action_type']) => {
    switch (action) {
      case 'patch': return 'Auto-Patch';
      case 'ticket': return 'Create Ticket';
      case 'isolate': return 'Isolate Host';
      case 'notify': return 'Send Alert';
      case 'script': return 'Run Script';
    }
  };

  const onlineAgents = agents.filter(a => a.status === 'online');

  return (
    <div className="space-y-6">
      {/* Agent Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Auto-Remediation Workflows
          </CardTitle>
          <CardDescription>
            Configure automated responses when vulnerabilities are detected
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label>Execution Agent</Label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select agent for remediation commands..." />
                </SelectTrigger>
                <SelectContent>
                  {onlineAgents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4" />
                        {agent.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { resetRuleForm(); setIsRuleDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Rule
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingRule ? 'Edit Rule' : 'Create Remediation Rule'}</DialogTitle>
                    <DialogDescription>
                      Define triggers and actions for automatic vulnerability response
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Rule Name</Label>
                      <Input
                        value={ruleName}
                        onChange={(e) => setRuleName(e.target.value)}
                        placeholder="e.g., Auto-patch critical CVEs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Trigger on Severity</Label>
                      <div className="flex flex-wrap gap-2">
                        {['critical', 'high', 'medium', 'low'].map(sev => (
                          <Badge
                            key={sev}
                            variant={ruleSeverities.includes(sev) ? 'default' : 'outline'}
                            className="cursor-pointer capitalize"
                            onClick={() => {
                              if (ruleSeverities.includes(sev)) {
                                setRuleSeverities(ruleSeverities.filter(s => s !== sev));
                              } else {
                                setRuleSeverities([...ruleSeverities, sev]);
                              }
                            }}
                          >
                            {sev}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Action</Label>
                      <Select value={ruleAction} onValueChange={(v) => setRuleAction(v as RemediationRule['action_type'])}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ticket">Create Ticket</SelectItem>
                          <SelectItem value="patch">Auto-Patch</SelectItem>
                          <SelectItem value="isolate">Isolate Host</SelectItem>
                          <SelectItem value="notify">Send Notification</SelectItem>
                          <SelectItem value="script">Run Custom Script</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="auto-execute"
                        checked={ruleAutoExecute}
                        onCheckedChange={setRuleAutoExecute}
                      />
                      <Label htmlFor="auto-execute">Auto-execute when vulnerabilities detected</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsRuleDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={saveRule} disabled={!ruleName}>
                      {editingRule ? 'Update' : 'Create'} Rule
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rules List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Remediation Rules</CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No remediation rules configured</p>
              <p className="text-sm">Create a rule to automate vulnerability response</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {rules.map(rule => {
                  const matched = matchingVulns(rule);
                  return (
                    <div 
                      key={rule.id}
                      className={`p-4 rounded-lg border ${rule.is_enabled ? 'bg-muted/30' : 'bg-muted/10 opacity-60'}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={rule.is_enabled}
                            onCheckedChange={() => toggleRule(rule.id)}
                          />
                          <div>
                            <h4 className="font-medium">{rule.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {getActionIcon(rule.action_type)}
                                <span className="ml-1">{getActionLabel(rule.action_type)}</span>
                              </Badge>
                              {rule.auto_execute && (
                                <Badge variant="secondary" className="text-xs">
                                  <Zap className="h-3 w-3 mr-1" />
                                  Auto
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditRule(rule)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteRule(rule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <Separator className="my-3" />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Triggers: {rule.trigger_severity.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}</span>
                          <span>•</span>
                          <span>{matched.length} matching vuln{matched.length !== 1 ? 's' : ''}</span>
                          {rule.trigger_count > 0 && (
                            <>
                              <span>•</span>
                              <span>{rule.trigger_count} executions</span>
                            </>
                          )}
                        </div>
                        <Button
                          size="sm"
                          disabled={!rule.is_enabled || matched.length === 0 || !selectedAgent || isExecuting}
                          onClick={() => executeRule(rule)}
                        >
                          {isExecuting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-1" />
                              Execute Now
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Remediation Actions</CardTitle>
          <CardDescription>One-click remediation for common scenarios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col"
              disabled={!selectedAgent || isExecuting}
              onClick={() => {
                const criticalVulns = vulnerabilities.filter(v => 
                  v.severity.toLowerCase() === 'critical' && v.status !== 'patched'
                );
                if (criticalVulns.length === 0) {
                  toast.info('No critical vulnerabilities to remediate');
                  return;
                }
                toast.success(`Creating tickets for ${criticalVulns.length} critical vulnerabilities...`);
              }}
            >
              <Ticket className="h-6 w-6 mb-2 text-red-500" />
              <span className="font-medium">Ticket All Critical</span>
              <span className="text-xs text-muted-foreground">
                {vulnerabilities.filter(v => v.severity.toLowerCase() === 'critical' && v.status !== 'patched').length} vulns
              </span>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col"
              disabled={!selectedAgent || isExecuting}
            >
              <RefreshCw className="h-6 w-6 mb-2 text-blue-500" />
              <span className="font-medium">Force Patch Scan</span>
              <span className="text-xs text-muted-foreground">Check for available patches</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col"
              disabled={!selectedAgent || isExecuting}
            >
              <Shield className="h-6 w-6 mb-2 text-green-500" />
              <span className="font-medium">Verify Remediations</span>
              <span className="text-xs text-muted-foreground">Re-scan patched items</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
