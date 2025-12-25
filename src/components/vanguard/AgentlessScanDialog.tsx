import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shield, Server, Terminal, Network, Play, RefreshCw, Key, Wifi
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useVanguardAgents } from "@/hooks/useVanguardAgents";

interface Credential {
  id: string;
  credential_name: string;
  credential_type: string;
  username: string | null;
  target_scope: string[];
}

interface AgentlessScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanStarted: () => void;
}

const SCAN_TYPES = [
  { id: 'windows', name: 'Windows Compliance', icon: Server, description: 'CIS Windows benchmarks via WinRM', credType: 'winrm' },
  { id: 'linux', name: 'Linux Compliance', icon: Terminal, description: 'CIS Linux benchmarks via SSH', credType: 'ssh' },
  { id: 'network', name: 'Network Audit', icon: Network, description: 'Port scanning and SNMP monitoring', credType: 'snmp' },
  { id: 'full', name: 'Full Discovery', icon: Wifi, description: 'Complete network discovery and compliance scan', credType: 'all' },
];

const FRAMEWORKS = [
  { id: 'cis_windows', name: 'CIS Windows', osType: 'windows' },
  { id: 'cis_linux', name: 'CIS Linux', osType: 'linux' },
  { id: 'nist_800_53', name: 'NIST 800-53', osType: 'all' },
  { id: 'pci_dss', name: 'PCI DSS', osType: 'all' },
];

export function AgentlessScanDialog({ open, onOpenChange, onScanStarted }: AgentlessScanDialogProps) {
  const { user } = useAuth();
  const { agents } = useVanguardAgents();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  
  // Form state
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [scanType, setScanType] = useState('windows');
  const [targetHosts, setTargetHosts] = useState('');
  const [selectedCredentialIds, setSelectedCredentialIds] = useState<string[]>([]);
  const [selectedFramework, setSelectedFramework] = useState('cis_windows');

  useEffect(() => {
    if (open && user) loadCredentials();
  }, [open, user]);

  const loadCredentials = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('vanguard_agent_credentials')
        .select('id, credential_name, credential_type, username, target_scope')
        .eq('user_id', user?.id)
        .eq('is_active', true);

      if (error) throw error;
      setCredentials((data || []).map(c => ({
        ...c,
        target_scope: Array.isArray(c.target_scope) ? (c.target_scope as string[]) : []
      })));
    } catch (err) {
      console.error('Failed to load credentials:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCredential = (id: string) => {
    setSelectedCredentialIds(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const startScan = async () => {
    if (!selectedAgentId) {
      toast.error('Select a Vanguard Pi agent');
      return;
    }
    if (!targetHosts.trim()) {
      toast.error('Enter target hosts');
      return;
    }
    if (selectedCredentialIds.length === 0 && scanType !== 'network') {
      toast.error('Select at least one credential');
      return;
    }

    setIsStarting(true);
    try {
      const hosts = targetHosts.split(/[,\n]/).map(h => h.trim()).filter(Boolean);
      
      const { data: job, error } = await supabase
        .from('agentless_scan_jobs')
        .insert({
          user_id: user?.id,
          agent_id: selectedAgentId,
          scan_type: scanType,
          target_hosts: hosts,
          credential_ids: selectedCredentialIds,
          framework_type: selectedFramework,
          scan_status: 'pending',
          total_hosts: hosts.length,
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger the scan via edge function
      const { error: invokeError } = await supabase.functions.invoke('vanguard-agentless-scan', {
        body: { action: 'start_scan', job_id: job.id }
      });

      if (invokeError) {
        console.warn('Edge function not available, scan will be picked up by agent');
      }

      toast.success('Agentless scan started');
      onScanStarted();
      onOpenChange(false);
    } catch (err: any) {
      toast.error('Failed to start scan', { description: err.message });
    } finally {
      setIsStarting(false);
    }
  };

  // Filter frameworks by scan type
  const filteredFrameworks = FRAMEWORKS.filter(f => 
    f.osType === 'all' || f.osType === scanType
  );

  // Filter credentials by scan type
  const filteredCredentials = credentials.filter(c => {
    if (scanType === 'windows') return c.credential_type === 'winrm';
    if (scanType === 'linux') return c.credential_type.startsWith('ssh');
    if (scanType === 'network') return c.credential_type.startsWith('snmp');
    return true; // full scan shows all
  });

  // Online Pi agents only
  const onlineAgents = agents.filter(a => {
    if (!a.last_heartbeat) return false;
    const lastHeartbeat = new Date(a.last_heartbeat).getTime();
    return Date.now() - lastHeartbeat < 5 * 60 * 1000;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Agentless Compliance Scan
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Select Pi Agent */}
          <div>
            <Label>Vanguard Pi Agent</Label>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a Pi agent to run the scan" />
              </SelectTrigger>
              <SelectContent>
                {onlineAgents.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No online agents. Deploy a Vanguard Pi first.
                  </div>
                ) : (
                  onlineAgents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        {agent.name}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              The Pi will perform remote scans - no agents needed on endpoints
            </p>
          </div>

          {/* Scan Type */}
          <div>
            <Label>Scan Type</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {SCAN_TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <div
                    key={type.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      scanType === type.id ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50'
                    }`}
                    onClick={() => {
                      setScanType(type.id);
                      setSelectedCredentialIds([]);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{type.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Framework */}
          <div>
            <Label>Compliance Framework</Label>
            <Select value={selectedFramework} onValueChange={setSelectedFramework}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filteredFrameworks.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Hosts */}
          <div>
            <Label>Target Hosts</Label>
            <Input 
              placeholder="192.168.1.0/24, 10.0.0.1, server.local"
              value={targetHosts}
              onChange={e => setTargetHosts(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter IPs, hostnames, or CIDR ranges (comma or newline separated)
            </p>
          </div>

          {/* Credentials */}
          {scanType !== 'network' && (
            <div>
              <Label className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Credentials
              </Label>
              <ScrollArea className="h-32 border rounded-lg mt-2 p-2">
                {filteredCredentials.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No matching credentials. Add credentials in the Credential Vault.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredCredentials.map(cred => (
                      <div
                        key={cred.id}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                          selectedCredentialIds.includes(cred.id) ? 'bg-primary/10' : 'hover:bg-muted'
                        }`}
                        onClick={() => toggleCredential(cred.id)}
                      >
                        <Checkbox checked={selectedCredentialIds.includes(cred.id)} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{cred.credential_name}</p>
                          {cred.username && (
                            <p className="text-xs text-muted-foreground">{cred.username}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {cred.credential_type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={startScan} disabled={isStarting}>
            {isStarting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Agentless Scan
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
