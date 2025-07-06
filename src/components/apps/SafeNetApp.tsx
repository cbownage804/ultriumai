import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Network, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Globe,
  BarChart3,
  TrendingUp,
  Users,
  Loader2,
  Download,
  Router,
  Clock,
  Server,
  Wifi,
  Monitor,
  Smartphone,
  HardDrive,
  Eye,
  Search,
  MapPin,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface NetworkDevice {
  id: string;
  ip_address: string;
  hostname: string;
  device_type: 'router' | 'switch' | 'server' | 'workstation' | 'printer' | 'mobile' | 'iot' | 'unknown';
  mac_address: string;
  manufacturer: string;
  os_info: string;
  open_ports: number[];
  last_seen: string;
  status: 'online' | 'offline' | 'unknown';
  vulnerabilities: string[];
  risk_level: 'safe' | 'low' | 'medium' | 'high' | 'critical';
}

interface NetworkScanResult {
  network_range: string;
  scan_type: 'discovery' | 'vulnerability' | 'full';
  devices_found: number;
  vulnerabilities_detected: number;
  scan_duration: number;
  timestamp: string;
  devices: NetworkDevice[];
  network_topology: {
    subnets: string[];
    gateways: string[];
    dns_servers: string[];
  };
}

interface ConnectorStatus {
  installed: boolean;
  version: string;
  last_checkin: string;
  status: 'connected' | 'disconnected' | 'error';
  network_access: boolean;
}

interface SafeNetAppProps {
  isWhiteLabeled?: boolean;
  brandColor?: string;
  brandName?: string;
}

export const SafeNetApp = ({ isWhiteLabeled = false, brandColor = '#3b82f6', brandName = 'Ultrium AI' }: SafeNetAppProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [networkRange, setNetworkRange] = useState('192.168.1.0/24');
  const [scanType, setScanType] = useState<'discovery' | 'vulnerability' | 'full'>('discovery');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<NetworkScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<NetworkScanResult[]>([]);
  const [connectorStatus, setConnectorStatus] = useState<ConnectorStatus>({
    installed: false,
    version: '',
    last_checkin: '',
    status: 'disconnected',
    network_access: false
  });
  const [stats, setStats] = useState({
    totalDevices: 0,
    vulnerableDevices: 0,
    activeConnectors: 0,
    networkUptime: 99.2
  });

  // Load scan history and stats
  useEffect(() => {
    if (user) {
      loadScanHistory();
      loadStats();
      checkConnectorStatus();
    }
  }, [user]);

  const loadScanHistory = async () => {
    try {
      const { data } = await supabase
        .from('gpt_analytics')
        .select('*')
        .eq('user_id', user?.id)
        .eq('interaction_type', 'security_scan')
        .eq('metadata->>scan_type', 'network')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data) {
        const results = data.map(item => {
          const metadata = item.metadata as any;
          return {
            network_range: metadata?.network_range || '192.168.1.0/24',
            scan_type: metadata?.scan_type || 'discovery',
            devices_found: metadata?.devices_found || 0,
            vulnerabilities_detected: metadata?.vulnerabilities_count || 0,
            scan_duration: metadata?.scan_duration || 0,
            timestamp: item.created_at,
            devices: [],
            network_topology: {
              subnets: ['192.168.1.0/24'],
              gateways: ['192.168.1.1'],
              dns_servers: ['8.8.8.8', '8.8.4.4']
            }
          };
        }) as NetworkScanResult[];
        
        setScanHistory(results);
      }
    } catch (error) {
      console.error('Error loading scan history:', error);
    }
  };

  const loadStats = async () => {
    try {
      const { data } = await supabase
        .from('gpt_analytics')
        .select('*')
        .eq('user_id', user?.id)
        .eq('interaction_type', 'security_scan')
        .eq('metadata->>scan_type', 'network');
      
      if (data) {
        const totalScans = data.length;
        const totalDevices = data.reduce((sum, item) => {
          const metadata = item.metadata as any;
          return sum + (metadata?.devices_found || 0);
        }, 0);
        const vulnerableDevices = data.reduce((sum, item) => {
          const metadata = item.metadata as any;
          return sum + (metadata?.vulnerabilities_count || 0);
        }, 0);
        
        setStats({
          totalDevices: Math.max(totalDevices, 12), // Show some demo data
          vulnerableDevices: Math.max(vulnerableDevices, 3),
          activeConnectors: 1,
          networkUptime: 99.2
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const checkConnectorStatus = () => {
    // Simulate connector status - in real app this would check actual connector
    setConnectorStatus({
      installed: Math.random() > 0.3, // 70% chance of being installed
      version: '2.1.4',
      last_checkin: new Date(Date.now() - Math.random() * 300000).toISOString(), // Within 5 minutes
      status: Math.random() > 0.2 ? 'connected' : 'disconnected',
      network_access: true
    });
  };

  const startNetworkScan = async () => {
    if (!networkRange.trim()) {
      toast({
        title: "Error",
        description: "Please provide a network range to scan",
        variant: "destructive"
      });
      return;
    }

    if (!connectorStatus.installed) {
      toast({
        title: "Connector Required",
        description: "Please install the SafeNet connector to perform network scans",
        variant: "destructive"
      });
      return;
    }

    setIsScanning(true);
    try {
      // Simulate network scan
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockResult: NetworkScanResult = {
        network_range: networkRange,
        scan_type: scanType,
        devices_found: Math.floor(Math.random() * 20) + 5,
        vulnerabilities_detected: Math.floor(Math.random() * 5),
        scan_duration: Math.floor(Math.random() * 30) + 10,
        timestamp: new Date().toISOString(),
        devices: generateMockDevices(),
        network_topology: {
          subnets: [networkRange],
          gateways: ['192.168.1.1'],
          dns_servers: ['8.8.8.8', '1.1.1.1']
        }
      };
      
      setScanResult(mockResult);
      
      // Log to analytics
      await supabase.from('gpt_analytics').insert({
        user_id: user?.id,
        gpt_id: 'safenet-app',
        interaction_type: 'security_scan',
        metadata: {
          scan_type: 'network',
          network_range: networkRange,
          devices_found: mockResult.devices_found,
          vulnerabilities_count: mockResult.vulnerabilities_detected,
          scan_duration: mockResult.scan_duration
        }
      });
      
      await loadScanHistory();
      await loadStats();
      
      toast({
        title: "Network Scan Complete",
        description: `Found ${mockResult.devices_found} devices with ${mockResult.vulnerabilities_detected} vulnerabilities`,
        variant: mockResult.vulnerabilities_detected > 0 ? "destructive" : "default"
      });
    } catch (error: any) {
      toast({
        title: "Scan Failed",
        description: error.message || "Failed to perform network scan",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  const generateMockDevices = (): NetworkDevice[] => {
    const deviceTypes: NetworkDevice['device_type'][] = ['router', 'switch', 'server', 'workstation', 'printer', 'mobile', 'iot'];
    const devices: NetworkDevice[] = [];
    
    for (let i = 0; i < Math.floor(Math.random() * 15) + 5; i++) {
      const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
      const riskLevel = Math.random() > 0.7 ? 'high' : Math.random() > 0.5 ? 'medium' : 'safe';
      
      devices.push({
        id: `device-${i}`,
        ip_address: `192.168.1.${100 + i}`,
        hostname: `${deviceType}-${i}`,
        device_type: deviceType,
        mac_address: `00:1B:44:11:3A:${(i + 10).toString(16).padStart(2, '0')}`,
        manufacturer: ['Cisco', 'HP', 'Dell', 'Apple', 'Samsung'][Math.floor(Math.random() * 5)],
        os_info: `${deviceType === 'workstation' ? 'Windows 11' : 'Linux'} v${Math.floor(Math.random() * 3) + 1}.0`,
        open_ports: Array.from({length: Math.floor(Math.random() * 5)}, () => Math.floor(Math.random() * 9000) + 1000),
        last_seen: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        status: Math.random() > 0.1 ? 'online' : 'offline',
        vulnerabilities: riskLevel === 'high' ? ['CVE-2023-1234', 'CVE-2023-5678'] : [],
        risk_level: riskLevel as any
      });
    }
    
    return devices;
  };

  const downloadConnector = () => {
    toast({
      title: "Download Started",
      description: "SafeNet connector installer is downloading...",
    });
    // In real app, this would download the actual connector
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-blue-500';
      case 'safe': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'critical':
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low':
      case 'safe': return 'default';
      default: return 'outline';
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'router': return Router;
      case 'server': return Server;
      case 'workstation': return Monitor;
      case 'mobile': return Smartphone;
      case 'printer': return HardDrive;
      default: return Network;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Network className="h-8 w-8" style={{ color: brandColor }} />
            {isWhiteLabeled ? brandName : 'Ultrium'} SafeNet
          </h1>
          <p className="text-muted-foreground">
            Network discovery, mapping, and security vulnerability assessment
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary"
            onClick={() => window.open('/safenet-embed-demo', '_blank')}
          >
            <Globe className="h-4 w-4 mr-2" />
            Embeddable Widget Demo
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Devices</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDevices}</div>
            <p className="text-xs text-muted-foreground">
              Discovered devices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vulnerable Devices</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.vulnerableDevices}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Connectors</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.activeConnectors}</div>
            <p className="text-xs text-muted-foreground">
              Network monitoring
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Uptime</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.networkUptime}%</div>
            <Progress value={stats.networkUptime} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Connector Status Alert */}
      {!connectorStatus.installed && (
        <Alert>
          <Download className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>SafeNet connector not installed. Download and install to enable network scanning.</span>
            <Button size="sm" onClick={downloadConnector}>
              <Download className="h-4 w-4 mr-2" />
              Download Connector
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="scanner" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scanner">Network Scanner</TabsTrigger>
          <TabsTrigger value="topology">Network Map</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="history">Scan History</TabsTrigger>
          <TabsTrigger value="connector">Connector</TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scanner Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Network Scanner
                </CardTitle>
                <CardDescription>
                  Discover devices and assess network security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="network-range">Network Range</Label>
                  <Input
                    id="network-range"
                    value={networkRange}
                    onChange={(e) => setNetworkRange(e.target.value)}
                    placeholder="192.168.1.0/24"
                  />
                </div>
                
                <div>
                  <Label htmlFor="scan-type">Scan Type</Label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={scanType}
                    onChange={(e) => setScanType(e.target.value as any)}
                  >
                    <option value="discovery">Device Discovery</option>
                    <option value="vulnerability">Vulnerability Scan</option>
                    <option value="full">Full Network Assessment</option>
                  </select>
                </div>
                
                <Button 
                  onClick={startNetworkScan}
                  disabled={!networkRange.trim() || isScanning || !connectorStatus.installed}
                  className="w-full"
                  variant="hero"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scanning Network...
                    </>
                  ) : (
                    <>
                      <Network className="mr-2 h-4 w-4" />
                      Start Network Scan
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Scan Results */}
            <Card>
              <CardHeader>
                <CardTitle>Scan Results</CardTitle>
              </CardHeader>
              <CardContent>
                {!scanResult ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Start a network scan to see discovered devices and vulnerabilities
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Devices Found:</span> {scanResult.devices_found}
                      </div>
                      <div>
                        <span className="font-medium">Scan Duration:</span> {scanResult.scan_duration}s
                      </div>
                      <div>
                        <span className="font-medium">Vulnerabilities:</span> 
                        <span className={scanResult.vulnerabilities_detected > 0 ? 'text-red-500 ml-1' : 'text-green-500 ml-1'}>
                          {scanResult.vulnerabilities_detected}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Network Range:</span> {scanResult.network_range}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Network Topology</h4>
                      <div className="space-y-2 text-sm">
                        <div>Subnets: {scanResult.network_topology.subnets.join(', ')}</div>
                        <div>Gateways: {scanResult.network_topology.gateways.join(', ')}</div>
                        <div>DNS Servers: {scanResult.network_topology.dns_servers.join(', ')}</div>
                      </div>
                    </div>

                    {scanResult.vulnerabilities_detected > 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Network vulnerabilities detected. Review devices tab for detailed security recommendations.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Discovered Devices
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!scanResult || scanResult.devices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No devices discovered yet. Run a network scan to see devices.
                </div>
              ) : (
                <div className="space-y-3">
                  {scanResult.devices.map((device) => {
                    const DeviceIcon = getDeviceIcon(device.device_type);
                    return (
                      <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <DeviceIcon className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {device.hostname}
                              <div className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {device.ip_address} • {device.manufacturer}
                            </div>
                            {device.vulnerabilities.length > 0 && (
                              <div className="text-xs text-red-500">
                                {device.vulnerabilities.length} vulnerabilities found
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getRiskBadgeVariant(device.risk_level)}>
                            {device.risk_level}
                          </Badge>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topology" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Network Topology Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Network className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-2">Network Visualization</h3>
                <p>Interactive network topology map will be displayed here after scanning.</p>
                {!scanResult && (
                  <Button className="mt-4" variant="outline" onClick={() => setNetworkRange('192.168.1.0/24')}>
                    Run Network Scan
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Scan History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scanHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No scan history yet. Start your first network scan!
                </div>
              ) : (
                <div className="space-y-3">
                  {scanHistory.map((scan, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Network className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{scan.network_range}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(scan.timestamp).toLocaleDateString()} • {scan.devices_found} devices • {scan.scan_type}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {scan.vulnerabilities_detected > 0 ? (
                          <Badge variant="destructive">{scan.vulnerabilities_detected} issues</Badge>
                        ) : (
                          <Badge variant="default">Clean</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connector" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                SafeNet Connector
              </CardTitle>
              <CardDescription>
                Network discovery agent for comprehensive network mapping
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${connectorStatus.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <div className="font-medium">
                      Connector Status: {connectorStatus.installed ? 'Installed' : 'Not Installed'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {connectorStatus.installed 
                        ? `Version ${connectorStatus.version} • Last seen ${new Date(connectorStatus.last_checkin).toLocaleTimeString()}`
                        : 'Download and install to enable network scanning'
                      }
                    </div>
                  </div>
                </div>
                {!connectorStatus.installed ? (
                  <Button onClick={downloadConnector}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                ) : (
                  <Badge variant={connectorStatus.status === 'connected' ? 'default' : 'destructive'}>
                    {connectorStatus.status}
                  </Badge>
                )}
              </div>

              {connectorStatus.installed && (
                <div className="space-y-3">
                  <h4 className="font-medium">Connector Features</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      {connectorStatus.network_access ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      Network Access
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Device Discovery
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Port Scanning
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Vulnerability Detection
                    </div>
                  </div>
                </div>
              )}

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  The SafeNet connector runs securely on your network to discover devices and assess security. 
                  All data is encrypted and transmitted securely to the SafeNet cloud platform.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};