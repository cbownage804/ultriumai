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
          {/* Demo Cards for Now */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Main Office Network</CardTitle>
                  </div>
                  <Badge className="bg-green-500 text-white">ONLINE</Badge>
                </div>
                <CardDescription>Corporate headquarters - Dallas, TX</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Last seen: {new Date().toLocaleString()}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm">
                    <strong>Network Ranges:</strong>
                    <div className="text-muted-foreground">192.168.1.0/24, 10.0.0.0/16</div>
                  </div>
                  
                  <div className="text-sm">
                    <strong>Capabilities:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">vulnerability</Badge>
                      <Badge variant="outline" className="text-xs">discovery</Badge>
                      <Badge variant="outline" className="text-xs">compliance</Badge>
                    </div>
                  </div>
                  
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>CPU:</span>
                      <span>15%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Memory:</span>
                      <span>32%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Branch Office</CardTitle>
                  </div>
                  <Badge className="bg-green-500 text-white">ONLINE</Badge>
                </div>
                <CardDescription>Remote office - Austin, TX</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Last seen: {new Date(Date.now() - 300000).toLocaleString()}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm">
                    <strong>Network Ranges:</strong>
                    <div className="text-muted-foreground">172.16.0.0/24</div>
                  </div>
                  
                  <div className="text-sm">
                    <strong>Capabilities:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">discovery</Badge>
                      <Badge variant="outline" className="text-xs">basic_scan</Badge>
                    </div>
                  </div>
                  
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>CPU:</span>
                      <span>8%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Memory:</span>
                      <span>24%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative opacity-60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">AWS VPC Scanner</CardTitle>
                  </div>
                  <Badge className="bg-red-500 text-white">OFFLINE</Badge>
                </div>
                <CardDescription>Cloud infrastructure - us-east-1</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span>Last seen: 2 hours ago</span>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm">
                    <strong>Network Ranges:</strong>
                    <div className="text-muted-foreground">10.1.0.0/16, 10.2.0.0/16</div>
                  </div>
                  
                  <div className="text-sm">
                    <strong>Capabilities:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">cloud_scan</Badge>
                      <Badge variant="outline" className="text-xs">vulnerability</Badge>
                      <Badge variant="outline" className="text-xs">compliance</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
                  <option value="main-office">Main Office Network - Dallas, TX</option>
                  <option value="branch-office">Branch Office - Austin, TX</option>
                </select>
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
              <div className="space-y-4">
                {/* Demo scan jobs */}
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Full Network Scan</span>
                    </div>
                    <Badge className="bg-green-500 text-white">COMPLETED</Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <div>Targets: 192.168.1.0/24, 10.0.0.0/16</div>
                    <div>Started: {new Date(Date.now() - 3600000).toLocaleString()}</div>
                    <div>Completed: {new Date(Date.now() - 1800000).toLocaleString()}</div>
                    <div>Findings: 23 vulnerabilities (3 critical, 8 high)</div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-500 animate-pulse" />
                      <span className="font-medium">Compliance Audit</span>
                    </div>
                    <Badge className="bg-blue-500 text-white">RUNNING</Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <div>Targets: 172.16.0.0/24</div>
                    <div>Started: {new Date(Date.now() - 900000).toLocaleString()}</div>
                    <div>Progress: 67% complete</div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Discovery Scan</span>
                    </div>
                    <Badge className="bg-green-500 text-white">COMPLETED</Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <div>Targets: 10.1.0.0/16</div>
                    <div>Started: {new Date(Date.now() - 7200000).toLocaleString()}</div>
                    <div>Completed: {new Date(Date.now() - 6300000).toLocaleString()}</div>
                    <div>Findings: 156 active hosts, 12 services</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="setup" className="space-y-6">
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
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download .exe
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
                  <h4 className="font-medium">1. Download Agent</h4>
                  <p className="text-sm text-muted-foreground">
                    Choose the appropriate agent for your target network environment
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">2. Configure Network Access</h4>
                  <p className="text-sm text-muted-foreground">
                    Ensure the agent can reach: api.vanguard-ai.com:443 (outbound HTTPS)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">3. Deploy & Register</h4>
                  <p className="text-sm text-muted-foreground">
                    Run the agent with your organization key to auto-register with the platform
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">4. Verify Connection</h4>
                  <p className="text-sm text-muted-foreground">
                    Check the "Active Connectors" tab to confirm your agent is online and ready
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};