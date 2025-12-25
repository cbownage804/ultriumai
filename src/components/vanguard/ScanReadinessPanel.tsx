import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CheckCircle, XCircle, AlertTriangle, RefreshCw, 
  Monitor, Terminal, Network, HelpCircle, Play, Server
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface CredentialStatus {
  id: string;
  name: string;
  type: string;
  protocol: string;
  targets: string[];
  lastTestResult: 'success' | 'failed' | 'pending' | 'unknown';
  lastTestAt: string | null;
  targetResults?: {
    target: string;
    status: 'ready' | 'needs_config' | 'unreachable' | 'unknown';
    message?: string;
  }[];
}

interface AgentStatus {
  id: string;
  name: string;
  status: string;
  lastHeartbeat: string | null;
}

const PROTOCOL_MAP: Record<string, { icon: typeof Monitor; protocol: string; color: string }> = {
  'winrm': { icon: Monitor, protocol: 'WinRM', color: 'blue' },
  'ssh_password': { icon: Terminal, protocol: 'SSH', color: 'green' },
  'ssh_key': { icon: Terminal, protocol: 'SSH', color: 'green' },
  'snmp_v2': { icon: Network, protocol: 'SNMP', color: 'orange' },
  'snmp_v3': { icon: Network, protocol: 'SNMP', color: 'orange' },
};

export function ScanReadinessPanel() {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<CredentialStatus[]>([]);
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load credentials
      const { data: creds, error: credError } = await supabase
        .from('vanguard_agent_credentials')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true);

      if (credError) throw credError;

      setCredentials((creds || []).map(c => ({
        id: c.id,
        name: c.credential_name,
        type: c.credential_type,
        protocol: PROTOCOL_MAP[c.credential_type]?.protocol || 'Unknown',
        targets: Array.isArray(c.target_scope) ? c.target_scope as string[] : [],
        lastTestResult: c.last_test_result as 'success' | 'failed' | 'pending' | 'unknown' || 'unknown',
        lastTestAt: c.last_used_at,
      })));

      // Load agents
      const { data: agentsData, error: agentError } = await supabase
        .from('vanguard_agents')
        .select('id, name, status, last_heartbeat')
        .eq('user_id', user?.id)
        .order('last_heartbeat', { ascending: false });

      if (agentError) throw agentError;

      setAgents((agentsData || []).map(a => ({
        id: a.id,
        name: a.name,
        status: a.status,
        lastHeartbeat: a.last_heartbeat,
      })));

      // Auto-select first online agent
      const onlineAgent = agentsData?.find(a => a.status === 'online');
      if (onlineAgent && !selectedAgent) {
        setSelectedAgent(onlineAgent.id);
      }

    } catch (err) {
      console.error('Failed to load scan readiness data:', err);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const testAllCredentials = async () => {
    if (!selectedAgent) {
      toast.error('Please select an agent first');
      return;
    }

    setIsTesting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      const response = await fetch(
        'https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/vanguard-connectivity-test',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.session?.access_token}`,
          },
          body: JSON.stringify({
            action: 'test_all',
            agent_id: selectedAgent,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Test failed');
      }

      toast.success(`Queued ${result.tests?.length || 0} connectivity tests`);
      
      // Reload data after a delay to get updated results
      setTimeout(() => loadData(), 5000);

    } catch (err: any) {
      toast.error('Failed to start tests', { description: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  // Calculate statistics
  const totalTargets = credentials.reduce((acc, c) => acc + c.targets.length, 0);
  const readyCredentials = credentials.filter(c => c.lastTestResult === 'success').length;
  const failedCredentials = credentials.filter(c => c.lastTestResult === 'failed').length;
  const untestedCredentials = credentials.filter(c => !c.lastTestResult || c.lastTestResult === 'unknown').length;
  const readinessPercent = credentials.length > 0 
    ? Math.round((readyCredentials / credentials.length) * 100) 
    : 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <RefreshCw className="h-4 w-4 text-amber-500 animate-spin" />;
      default:
        return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/30">Ready</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/30">Needs Config</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30">Testing...</Badge>;
      default:
        return <Badge variant="outline">Not Tested</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Credentials</p>
                <p className="text-2xl font-bold">{credentials.length}</p>
              </div>
              <Server className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ready</p>
                <p className="text-2xl font-bold text-green-500">{readyCredentials}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Needs Config</p>
                <p className="text-2xl font-bold text-red-500">{failedCredentials}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Not Tested</p>
                <p className="text-2xl font-bold text-muted-foreground">{untestedCredentials}</p>
              </div>
              <HelpCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Readiness Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Scan Readiness</CardTitle>
              <CardDescription>
                {readyCredentials} of {credentials.length} credentials verified and ready for agentless scanning
              </CardDescription>
            </div>
            <Button 
              onClick={testAllCredentials} 
              disabled={isTesting || credentials.length === 0 || !selectedAgent}
            >
              {isTesting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Test All
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Progress value={readinessPercent} className="flex-1" />
              <span className="text-lg font-bold">{readinessPercent}%</span>
            </div>
            
            {!selectedAgent && agents.length > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Select an agent from the Credential Vault to run connectivity tests
                </p>
              </div>
            )}
            
            {agents.length === 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  No Vanguard agents available. Deploy a Pi agent to run connectivity tests.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Credentials by Protocol */}
      <div className="grid gap-4 md:grid-cols-3">
        {['windows', 'linux', 'network'].map(category => {
          const categoryCredentials = credentials.filter(c => {
            if (category === 'windows') return c.type === 'winrm';
            if (category === 'linux') return c.type.startsWith('ssh');
            if (category === 'network') return c.type.startsWith('snmp');
            return false;
          });
          
          const categoryReady = categoryCredentials.filter(c => c.lastTestResult === 'success').length;
          const categoryConfig = {
            windows: { icon: Monitor, name: 'Windows (WinRM)', color: 'blue' },
            linux: { icon: Terminal, name: 'Linux (SSH)', color: 'green' },
            network: { icon: Network, name: 'Network (SNMP)', color: 'orange' },
          }[category]!;
          
          const Icon = categoryConfig.icon;
          
          return (
            <Card key={category}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{categoryConfig.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Ready</span>
                    <span className="font-medium text-green-500">{categoryReady} / {categoryCredentials.length}</span>
                  </div>
                  
                  {categoryCredentials.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No credentials configured</p>
                  ) : (
                    <ScrollArea className="h-[100px]">
                      <div className="space-y-2">
                        {categoryCredentials.map(cred => (
                          <div key={cred.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                            <span className="truncate flex-1">{cred.name}</span>
                            {getStatusIcon(cred.lastTestResult)}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Credentials List */}
      <Card>
        <CardHeader>
          <CardTitle>Credential Status</CardTitle>
          <CardDescription>Detailed status of each configured credential</CardDescription>
        </CardHeader>
        <CardContent>
          {credentials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No credentials configured</p>
              <p className="text-sm mt-1">Add credentials in the Credential Vault to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {credentials.map(cred => {
                const protocolInfo = PROTOCOL_MAP[cred.type];
                const Icon = protocolInfo?.icon || Server;
                
                return (
                  <div 
                    key={cred.id} 
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{cred.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="secondary">{cred.protocol}</Badge>
                          <span>{cred.targets.length} target{cred.targets.length !== 1 ? 's' : ''}</span>
                          {cred.lastTestAt && (
                            <span>• Tested {new Date(cred.lastTestAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {getStatusBadge(cred.lastTestResult)}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
