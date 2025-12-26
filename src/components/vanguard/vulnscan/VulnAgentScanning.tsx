import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Server, Play, Loader2, CheckCircle, XCircle, Clock, 
  Wifi, Shield, Bug, Target, RefreshCw, AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Agent {
  id: string;
  name: string;
  ip_address: string | null;
  status: string;
  last_heartbeat: string | null;
}

interface ScanCommand {
  id: string;
  command_type: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  response: any;
}

interface VulnAgentScanningProps {
  agents: Agent[];
  onScanComplete?: () => void;
}

// Internal scan types that run on Pi agents
const INTERNAL_SCAN_TYPES = [
  { 
    value: 'scan_network_vulns', 
    label: 'Internal Network Scan',
    description: 'Scan entire local subnet for vulnerabilities',
    icon: Wifi
  },
  { 
    value: 'scan_host_vulns', 
    label: 'Host Vulnerability Scan',
    description: 'Deep scan of a specific internal host',
    icon: Server
  },
  { 
    value: 'scan_service_vulns', 
    label: 'Service Enumeration',
    description: 'Enumerate services and check for known CVEs',
    icon: Bug
  },
  { 
    value: 'scan_config_audit', 
    label: 'Configuration Audit',
    description: 'Check for security misconfigurations',
    icon: Shield
  },
  { 
    value: 'scan_credential_test', 
    label: 'Credential Testing',
    description: 'Test for default/weak credentials on services',
    icon: AlertTriangle
  },
];

export function VulnAgentScanning({ agents, onScanComplete }: VulnAgentScanningProps) {
  const [selectedAgent, setSelectedAgent] = useState("");
  const [scanType, setScanType] = useState("scan_network_vulns");
  const [targetHost, setTargetHost] = useState("");
  const [targetSubnet, setTargetSubnet] = useState("");
  const [deepScan, setDeepScan] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [recentScans, setRecentScans] = useState<ScanCommand[]>([]);
  const [activeScanId, setActiveScanId] = useState<string | null>(null);

  useEffect(() => {
    loadRecentScans();
  }, []);

  useEffect(() => {
    if (activeScanId) {
      const subscription = supabase
        .channel(`scan-${activeScanId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'vanguard_agent_commands',
          filter: `id=eq.${activeScanId}`
        }, (payload) => {
          if (payload.new.status === 'completed' || payload.new.status === 'failed') {
            setIsScanning(false);
            setScanProgress(100);
            setActiveScanId(null);
            loadRecentScans();
            onScanComplete?.();
            toast.success(payload.new.status === 'completed' ? 'Scan completed!' : 'Scan failed');
          }
        })
        .subscribe();

      return () => { supabase.removeChannel(subscription); };
    }
  }, [activeScanId, onScanComplete]);

  const loadRecentScans = async () => {
    const { data } = await supabase
      .from('vanguard_agent_commands')
      .select('*')
      .in('command_type', INTERNAL_SCAN_TYPES.map(t => t.value))
      .order('created_at', { ascending: false })
      .limit(10);
    
    setRecentScans(data || []);
  };

  const startAgentScan = async () => {
    if (!selectedAgent) {
      toast.error('Please select a Pi agent');
      return;
    }

    setIsScanning(true);
    setScanProgress(10);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Not authenticated');
      setIsScanning(false);
      return;
    }

    try {
      const payload: any = {
        scan_type: scanType,
        deep_scan: deepScan
      };

      if (targetHost) payload.target_host = targetHost;
      if (targetSubnet) payload.target_subnet = targetSubnet;

      // Start progress simulation
      const progressInterval = setInterval(() => {
        setScanProgress(prev => Math.min(prev + 5, 85));
      }, 2000);

      const { data, error } = await supabase.functions.invoke('vanguard-agent-api?action=send_command', {
        body: {
          agent_id: selectedAgent,
          command_type: scanType,
          payload
        },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;

      // Set active scan for real-time tracking
      if (data?.command_id) {
        setActiveScanId(data.command_id);
      }

      clearInterval(progressInterval);
      setScanProgress(50);
      toast.success('Internal scan initiated on Pi agent');
      loadRecentScans();

    } catch (error) {
      console.error('Error starting agent scan:', error);
      toast.error('Failed to start scan');
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'sent':
      case 'pending': return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getAgentName = (agentId: string) => {
    return agents.find(a => a.id === agentId)?.name || 'Unknown';
  };

  const onlineAgents = agents.filter(a => a.status === 'online');

  return (
    <div className="space-y-6">
      {/* Agent Selection & Scan Config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Agent-Based Internal Scanning
          </CardTitle>
          <CardDescription>
            Run vulnerability scans from your Pi agents to assess internal network security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Agent Selection */}
          <div className="space-y-2">
            <Label>Select Pi Agent</Label>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an online agent..." />
              </SelectTrigger>
              <SelectContent>
                {onlineAgents.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No online agents available
                  </div>
                ) : (
                  onlineAgents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <Server className="h-4 w-4" />
                        <span>{agent.name}</span>
                        <span className="text-muted-foreground">({agent.ip_address})</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Scan Type Grid */}
          <div className="space-y-2">
            <Label>Scan Type</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {INTERNAL_SCAN_TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <Card 
                    key={type.value}
                    className={`cursor-pointer transition-all ${
                      scanType === type.value 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setScanType(type.value)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{type.label}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">{type.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Target Configuration */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Target Host (optional)</Label>
              <Input
                value={targetHost}
                onChange={(e) => setTargetHost(e.target.value)}
                placeholder="192.168.1.100"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to scan agent's local network
              </p>
            </div>
            <div className="space-y-2">
              <Label>Target Subnet (optional)</Label>
              <Input
                value={targetSubnet}
                onChange={(e) => setTargetSubnet(e.target.value)}
                placeholder="192.168.1.0/24"
              />
              <p className="text-xs text-muted-foreground">
                Override default subnet discovery
              </p>
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch 
                id="deep-scan"
                checked={deepScan}
                onCheckedChange={setDeepScan}
              />
              <Label htmlFor="deep-scan" className="cursor-pointer">
                Deep Scan (slower, more thorough)
              </Label>
            </div>
          </div>

          {/* Progress */}
          {isScanning && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Scanning from {getAgentName(selectedAgent)}...
                </span>
                <span>{scanProgress}%</span>
              </div>
              <Progress value={scanProgress} />
            </div>
          )}

          {/* Start Button */}
          <Button 
            onClick={startAgentScan}
            disabled={isScanning || !selectedAgent}
            className="w-full"
            size="lg"
          >
            {isScanning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Internal Scan
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Agent Scans */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Agent Scans</CardTitle>
            <Button variant="ghost" size="sm" onClick={loadRecentScans}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentScans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No agent scans yet</p>
              <p className="text-sm">Start a scan to see results here</p>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {recentScans.map(scan => (
                  <div 
                    key={scan.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(scan.status)}
                      <div>
                        <p className="font-medium text-sm">
                          {INTERNAL_SCAN_TYPES.find(t => t.value === scan.command_type)?.label || scan.command_type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(scan.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        scan.status === 'completed' ? 'default' :
                        scan.status === 'failed' ? 'destructive' : 'secondary'
                      }>
                        {scan.status}
                      </Badge>
                      {scan.response?.vulnerabilities_found !== undefined && (
                        <Badge variant="outline">
                          {scan.response.vulnerabilities_found} found
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
