import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Network, 
  Server, 
  Shield, 
  Activity, 
  Download, 
  Settings, 
  Play,
  Monitor,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TestConnector } from "./TestConnector";

interface NetworkConnector {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'error';
  last_heartbeat: string;
  network_ranges: string[];
  capabilities: string[];
  active_scans: number;
  system_metrics?: {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
  };
}

interface ScanJob {
  id: string;
  connector_id: string;
  targets: string[];
  scan_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  findings_count?: number;
}

export const NetworkConnectors = () => {
  const [connectors, setConnectors] = useState<NetworkConnector[]>([]);
  const [scanJobs, setScanJobs] = useState<ScanJob[]>([]);
  const [selectedConnector, setSelectedConnector] = useState<string>("");
  const [scanTargets, setScanTargets] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState("connectors");
  const { toast } = useToast();

  useEffect(() => {
    loadConnectors();
    loadScanJobs();
    
    // Set up real-time subscriptions
    const connectorsSubscription = (supabase as any)
      .channel('network_connectors')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'network_connectors' },
        () => loadConnectors()
      )
      .subscribe();

    const jobsSubscription = (supabase as any)
      .channel('network_scan_jobs')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'network_scan_jobs' },
        () => loadScanJobs()
      )
      .subscribe();

    return () => {
      connectorsSubscription.unsubscribe();
      jobsSubscription.unsubscribe();
    };
  }, []);

  const loadConnectors = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('network_connectors')
        .select('*')
        .order('last_heartbeat', { ascending: false });

      if (error) throw error;
      setConnectors((data || []) as NetworkConnector[]);
    } catch (error) {
      console.error('Error loading connectors:', error);
    }
  };

  const loadScanJobs = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('network_scan_jobs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setScanJobs((data || []) as ScanJob[]);
    } catch (error) {
      console.error('Error loading scan jobs:', error);
    }
  };

  const startNetworkScan = async () => {
    if (!selectedConnector || !scanTargets.trim()) {
      toast({
        title: "Error",
        description: "Please select a connector and enter target networks",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);

    try {
      const targets = scanTargets.split('\n')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const response = await supabase.functions.invoke('vanguard-network-connector', {
        body: {
          action: 'scan',
          connectorId: selectedConnector,
          data: {
            targets,
            scanType: 'full',
            options: {
              depth: 3,
              aggressive: false,
              credentials: false
            }
          }
        }
      });

      if (response.error) {
        throw response.error;
      }

      toast({
        title: "Scan Initiated",
        description: `Network scan started on ${targets.length} targets`,
      });

      setActiveTab("jobs");
      loadScanJobs();
    } catch (error) {
      console.error('Scan error:', error);
      toast({
        title: "Scan Failed",
        description: error instanceof Error ? error.message : "Failed to start network scan",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'offline': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'running': return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500 text-white';
      case 'offline': return 'bg-red-500 text-white';
      case 'running': return 'bg-blue-500 text-white';
      case 'completed': return 'bg-green-500 text-white';
      case 'failed': return 'bg-red-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Network className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Network Connectors</h2>
          <p className="text-muted-foreground">Internal network scanning agents and hybrid penetration testing</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="connectors">Active Connectors</TabsTrigger>
          <TabsTrigger value="scan">Network Scan</TabsTrigger>
          <TabsTrigger value="jobs">Scan Jobs</TabsTrigger>
          <TabsTrigger value="setup">Agent Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="connectors" className="space-y-6">
          {connectors.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Network Connectors</h3>
                <p className="text-muted-foreground mb-4">
                  Deploy Vanguard agents on your internal networks to enable penetration testing
                </p>
                <Button onClick={() => setActiveTab("setup")}>
                  Setup Network Agent
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connectors.map((connector) => (
                <Card key={connector.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Server className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{connector.name}</CardTitle>
                      </div>
                      <Badge className={getStatusColor(connector.status)}>
                        {connector.status.toUpperCase()}
                      </Badge>
                    </div>
                    <CardDescription>{connector.location}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      {getStatusIcon(connector.status)}
                      <span>Last seen: {new Date(connector.last_heartbeat).toLocaleString()}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm">
                        <strong>Network Ranges:</strong>
                        <div className="text-muted-foreground">
                          {connector.network_ranges.join(', ') || 'Not configured'}
                        </div>
                      </div>
                      
                      <div className="text-sm">
                        <strong>Capabilities:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {connector.capabilities.map((cap) => (
                            <Badge key={cap} variant="outline" className="text-xs">
                              {cap}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {connector.system_metrics && (
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span>CPU:</span>
                            <span>{connector.system_metrics.cpu_usage}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Memory:</span>
                            <span>{connector.system_metrics.memory_usage}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="scan" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Internal Network Scan</CardTitle>
              <CardDescription>Initiate penetration testing on internal network segments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="connector">Select Network Connector</Label>
                <select
                  id="connector"
                  value={selectedConnector}
                  onChange={(e) => setSelectedConnector(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  disabled={isScanning}
                >
                  <option value="">Choose a connector...</option>
                  {connectors.filter(c => c.status === 'online').map((connector) => (
                    <option key={connector.id} value={connector.id}>
                      {connector.name} - {connector.location}
                    </option>
                  ))}
                </select>
                {connectors.filter(c => c.status === 'online').length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No online connectors available. Please deploy a network agent first.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="targets">Target Networks/IPs</Label>
                <textarea
                  id="targets"
                  value={scanTargets}
                  onChange={(e) => setScanTargets(e.target.value)}
                  placeholder="192.168.1.0/24&#10;10.0.0.0/8&#10;172.16.0.1&#10;internal.company.com"
                  className="w-full p-2 border rounded-md h-32 resize-none"
                  disabled={isScanning}
                />
                <p className="text-sm text-muted-foreground">
                  Enter one target per line (IP addresses, CIDR ranges, or hostnames)
                </p>
              </div>

              <Button 
                onClick={startNetworkScan} 
                disabled={isScanning || !selectedConnector || !scanTargets.trim()}
                className="w-full"
              >
                {isScanning ? (
                  <>
                    <Activity className="mr-2 h-4 w-4 animate-spin" />
                    Initiating Network Scan...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Internal Network Scan
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scan Job History</CardTitle>
              <CardDescription>Internal network penetration testing results</CardDescription>
            </CardHeader>
            <CardContent>
              {scanJobs.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No scan jobs yet</p>
                  <p className="text-sm text-muted-foreground">Start your first internal network scan</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scanJobs.map((job) => (
                    <div key={job.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(job.status)}
                          <span className="font-medium">{job.scan_type} Scan</span>
                        </div>
                        <Badge className={getStatusColor(job.status)}>
                          {job.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <div>Targets: {job.targets.join(', ')}</div>
                        <div>Started: {new Date(job.started_at).toLocaleString()}</div>
                        {job.completed_at && (
                          <div>Completed: {new Date(job.completed_at).toLocaleString()}</div>
                        )}
                        {job.findings_count !== undefined && (
                          <div>Findings: {job.findings_count} vulnerabilities</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="setup" className="space-y-6">
          <TestConnector />
          
          <Card>
            <CardHeader>
              <CardTitle>Deploy Vanguard Network Agent</CardTitle>
              <CardDescription>Install agents on internal networks for hybrid penetration testing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Download className="h-4 w-4" />
                <AlertDescription>
                  Download and deploy Vanguard agents to enable internal network scanning capabilities.
                  Agents establish secure encrypted connections back to the cloud platform.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Settings className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-semibold mb-2">Windows Agent</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      PowerShell-based agent for Windows environments
                    </p>
                    <Button variant="outline" size="sm" onClick={() => window.open('/VanguardNetworkAgent.ps1', '_blank')}>
                      <Download className="mr-2 h-4 w-4" />
                      Download .ps1
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <Settings className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-semibold mb-2">Linux Agent</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Python-based agent for Linux/Unix systems
                    </p>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download .sh
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <Settings className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-semibold mb-2">Docker Agent</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Containerized agent for any Docker environment
                    </p>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Get Docker
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Installation Instructions</h3>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Windows PowerShell Installation</h4>
                  <div className="bg-muted p-3 rounded text-sm font-mono">
                    # Download and run as Administrator<br/>
                    PowerShell -ExecutionPolicy Bypass -File VanguardNetworkAgent.ps1 -Install -ApiKey "your-api-key" -ConnectorName "Office Network" -Location "Your Location"
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Network Requirements</h4>
                  <p className="text-sm text-muted-foreground">
                    Agent needs outbound HTTPS access to: nsyobmjpdpvesjwdphlh.supabase.co:443
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Enhanced Pentesting Features</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Network discovery and asset mapping</li>
                    <li>• Vulnerability scanning with CVE detection</li>
                    <li>• Default credential testing (printers, routers, cameras)</li>
                    <li>• SNMP enumeration and community string testing</li>
                    <li>• SMB/NetBIOS enumeration and share discovery</li>
                    <li>• SSL/TLS vulnerability assessment</li>
                    <li>• Web application fingerprinting</li>
                    <li>• Compliance checking (SSH, SSL ciphers)</li>
                    <li>• Service version detection and banner grabbing</li>
                    <li>• Auto-installs Nmap for advanced scanning</li>
                    <li>• PowerShell fallback for basic scanning</li>
                    <li>• Runs as Windows service with heartbeat</li>
                    <li>• Real-time communication with cloud platform</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};