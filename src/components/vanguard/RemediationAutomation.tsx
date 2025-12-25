import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { 
  Wrench, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Shield,
  Terminal,
  Zap,
  Settings,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useVanguardAgents } from '@/hooks/useVanguardAgents';

interface RemediationRule {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  command: string;
  isEnabled: boolean;
  lastRun?: string;
  successCount: number;
  failureCount: number;
}

interface PendingRemediation {
  id: string;
  findingId: string;
  findingTitle: string;
  severity: string;
  deviceName: string;
  deviceId: string;
  ruleId: string;
  ruleName: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  error?: string;
}

const DEFAULT_RULES: RemediationRule[] = [
  {
    id: 'disable-smb1',
    name: 'Disable SMBv1',
    description: 'Disable vulnerable SMBv1 protocol to prevent WannaCry-style attacks',
    category: 'Network Security',
    severity: 'critical',
    command: 'disable_smb1',
    isEnabled: true,
    successCount: 0,
    failureCount: 0
  },
  {
    id: 'enable-firewall',
    name: 'Enable Firewall',
    description: 'Ensure host firewall is enabled and configured correctly',
    category: 'Host Security',
    severity: 'high',
    command: 'enable_firewall',
    isEnabled: true,
    successCount: 0,
    failureCount: 0
  },
  {
    id: 'update-security-patches',
    name: 'Install Security Updates',
    description: 'Check and install critical security patches',
    category: 'Patch Management',
    severity: 'critical',
    command: 'check_security_updates',
    isEnabled: true,
    successCount: 0,
    failureCount: 0
  },
  {
    id: 'disable-guest-account',
    name: 'Disable Guest Account',
    description: 'Disable guest account to prevent unauthorized access',
    category: 'Access Control',
    severity: 'medium',
    command: 'disable_guest_account',
    isEnabled: false,
    successCount: 0,
    failureCount: 0
  },
  {
    id: 'enforce-password-policy',
    name: 'Enforce Password Policy',
    description: 'Apply strong password requirements',
    category: 'Access Control',
    severity: 'high',
    command: 'enforce_password_policy',
    isEnabled: true,
    successCount: 0,
    failureCount: 0
  },
  {
    id: 'disable-unused-services',
    name: 'Disable Unused Services',
    description: 'Stop and disable unnecessary system services',
    category: 'Attack Surface',
    severity: 'medium',
    command: 'disable_unused_services',
    isEnabled: false,
    successCount: 0,
    failureCount: 0
  }
];

export const RemediationAutomation = () => {
  const [rules, setRules] = useState<RemediationRule[]>(DEFAULT_RULES);
  const [pendingRemediations, setPendingRemediations] = useState<PendingRemediation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const { toast } = useToast();
  const { agents } = useVanguardAgents();

  useEffect(() => {
    loadPendingRemediations();
  }, []);

  const loadPendingRemediations = async () => {
    try {
      // Load recent security findings that match our rules
      const { data: findings } = await supabase
        .from('security_incidents')
        .select(`
          id,
          title,
          severity,
          status,
          agent_id,
          vanguard_agents:agent_id (
            id,
            name
          )
        `)
        .eq('status', 'open')
        .in('severity', ['critical', 'high'])
        .limit(20);

      const pending: PendingRemediation[] = (findings || []).map(finding => {
        const agent = finding.vanguard_agents as any;
        const matchedRule = rules.find(r => 
          finding.title.toLowerCase().includes(r.name.toLowerCase().split(' ')[0])
        );
        
        return {
          id: crypto.randomUUID(),
          findingId: finding.id,
          findingTitle: finding.title,
          severity: finding.severity,
          deviceName: agent?.name || 'Unknown',
          deviceId: finding.agent_id || '',
          ruleId: matchedRule?.id || 'custom',
          ruleName: matchedRule?.name || 'Manual Review',
          status: 'pending' as const
        };
      });

      setPendingRemediations(pending);
    } catch (error) {
      console.error('Error loading pending remediations:', error);
    }
  };

  const toggleRule = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, isEnabled: !rule.isEnabled } : rule
    ));
  };

  const runRemediation = async (remediation: PendingRemediation) => {
    if (!remediation.deviceId) {
      toast({
        title: "Cannot Remediate",
        description: "No agent associated with this finding",
        variant: "destructive"
      });
      return;
    }

    setPendingRemediations(prev => prev.map(p => 
      p.id === remediation.id ? { ...p, status: 'running' } : p
    ));

    try {
      const rule = rules.find(r => r.id === remediation.ruleId);
      
      // Send remediation command to agent via edge function
      const { error } = await supabase.functions.invoke('vanguard-agent-api', {
        body: {
          action: 'send_command',
          agent_id: remediation.deviceId,
          command_type: rule?.command || 'custom_remediation',
          parameters: {
            finding_id: remediation.findingId,
            remediation_rule: remediation.ruleId
          }
        }
      });

      if (error) throw error;

      // Update finding status
      await supabase
        .from('security_incidents')
        .update({ status: 'investigating' })
        .eq('id', remediation.findingId);

      setPendingRemediations(prev => prev.map(p => 
        p.id === remediation.id ? { ...p, status: 'success' } : p
      ));

      // Update rule stats
      if (rule) {
        setRules(prev => prev.map(r => 
          r.id === rule.id ? { ...r, successCount: r.successCount + 1, lastRun: new Date().toISOString() } : r
        ));
      }

      toast({
        title: "Remediation Queued",
        description: `Command sent to ${remediation.deviceName}`
      });

    } catch (error) {
      console.error('Remediation error:', error);
      setPendingRemediations(prev => prev.map(p => 
        p.id === remediation.id ? { ...p, status: 'failed', error: 'Failed to send command' } : p
      ));
      toast({
        title: "Remediation Failed",
        description: "Could not send remediation command",
        variant: "destructive"
      });
    }
  };

  const runAllRemediations = async () => {
    setIsRunningAll(true);
    const enabledRules = rules.filter(r => r.isEnabled);
    const toRun = pendingRemediations.filter(p => 
      p.status === 'pending' && enabledRules.some(r => r.id === p.ruleId)
    );

    for (const remediation of toRun) {
      await runRemediation(remediation);
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between commands
    }

    setIsRunningAll(false);
    toast({
      title: "Batch Remediation Complete",
      description: `Processed ${toRun.length} remediations`
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const onlineAgents = agents.filter(a => {
    if (!a.last_heartbeat) return false;
    return new Date(a.last_heartbeat).getTime() > Date.now() - 5 * 60 * 1000;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wrench className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Remediation Automation</h2>
            <p className="text-muted-foreground">Automated fixes for common security findings</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadPendingRemediations}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={runAllRemediations}
            disabled={isRunningAll || pendingRemediations.filter(p => p.status === 'pending').length === 0}
          >
            <Zap className="h-4 w-4 mr-2" />
            Run All Enabled
          </Button>
        </div>
      </div>

      {onlineAgents.length === 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No agents online. Remediation commands require at least one connected agent.
          </AlertDescription>
        </Alert>
      )}

      {/* Remediation Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Remediation Rules
          </CardTitle>
          <CardDescription>Configure automatic remediation actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rules.map(rule => (
              <div 
                key={rule.id} 
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Switch 
                    checked={rule.isEnabled}
                    onCheckedChange={() => toggleRule(rule.id)}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rule.name}</span>
                      <Badge className={getSeverityColor(rule.severity)} variant="secondary">
                        {rule.severity}
                      </Badge>
                      <Badge variant="outline">{rule.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-green-600">{rule.successCount}</span>
                      <span className="text-muted-foreground"> / </span>
                      <span className="text-red-600">{rule.failureCount}</span>
                    </div>
                    {rule.lastRun && (
                      <span className="text-muted-foreground text-xs">
                        Last: {new Date(rule.lastRun).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Remediations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Pending Remediations
          </CardTitle>
          <CardDescription>Findings that can be auto-remediated</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRemediations.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto mb-4 text-green-500/50" />
              <p className="font-medium">No Pending Remediations</p>
              <p className="text-sm text-muted-foreground">All critical findings have been addressed</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRemediations.map(remediation => (
                <div 
                  key={remediation.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(remediation.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{remediation.findingTitle}</span>
                        <Badge className={getSeverityColor(remediation.severity)} variant="secondary">
                          {remediation.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {remediation.deviceName} • {remediation.ruleName}
                      </p>
                      {remediation.error && (
                        <p className="text-sm text-red-500">{remediation.error}</p>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => runRemediation(remediation)}
                    disabled={remediation.status === 'running' || remediation.status === 'success' || !remediation.deviceId}
                  >
                    {remediation.status === 'running' ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : remediation.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Fix
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
