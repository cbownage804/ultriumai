import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Network, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Wifi,
  Server,
  Monitor,
  Smartphone,
  Router,
  HardDrive,
  Printer,
  Loader2,
  Search,
  Activity,
  Clock,
  Signal,
  Zap,
  Eye,
  Globe,
  MapPin,
  Settings,
  Plug,
  Star
} from "lucide-react";

interface NetworkDevice {
  id: string;
  name: string;
  type: 'router' | 'switch' | 'server' | 'workstation' | 'printer' | 'phone' | 'firewall' | 'ap';
  ip: string;
  mac: string;
  vendor: string;
  status: 'online' | 'offline' | 'warning';
  lastSeen: string;
  uptime: string;
  connections: string[];
  vulnerabilities: number;
  performance: {
    cpu: number;
    memory: number;
    bandwidth: number;
  };
}

interface NetworkScanResult {
  subnet: string;
  totalDevices: number;
  devicesOnline: number;
  vulnerabilities: number;
  scanTime: string;
  topology: NetworkDevice[];
  networkHealth: number;
  bandwidthUtilization: number;
  securityIssues: {
    level: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affected: string[];
  }[];
}

const mockNetworkData: Record<string, NetworkScanResult> = {
  '192.168.1.0/24': {
    subnet: '192.168.1.0/24',
    totalDevices: 24,
    devicesOnline: 22,
    vulnerabilities: 7,
    scanTime: new Date().toLocaleString(),
    networkHealth: 87,
    bandwidthUtilization: 65,
    topology: [
      {
        id: 'fw-001',
        name: 'Main Firewall',
        type: 'firewall',
        ip: '192.168.1.1',
        mac: '00:1A:2B:3C:4D:5E',
        vendor: 'Cisco',
        status: 'online',
        lastSeen: '2 minutes ago',
        uptime: '47 days',
        connections: ['sw-001', 'rtr-001'],
        vulnerabilities: 2,
        performance: { cpu: 45, memory: 67, bandwidth: 78 }
      },
      {
        id: 'sw-001',
        name: 'Core Switch',
        type: 'switch',
        ip: '192.168.1.2',
        mac: '00:2B:3C:4D:5E:6F',
        vendor: 'Cisco',
        status: 'online',
        lastSeen: '1 minute ago',
        uptime: '47 days',
        connections: ['fw-001', 'srv-001', 'srv-002', 'ap-001'],
        vulnerabilities: 0,
        performance: { cpu: 23, memory: 45, bandwidth: 56 }
      },
      {
        id: 'srv-001',
        name: 'Domain Controller',
        type: 'server',
        ip: '192.168.1.10',
        mac: '00:3C:4D:5E:6F:7A',
        vendor: 'Dell',
        status: 'online',
        lastSeen: '30 seconds ago',
        uptime: '45 days',
        connections: ['sw-001'],
        vulnerabilities: 3,
        performance: { cpu: 78, memory: 85, bandwidth: 34 }
      },
      {
        id: 'srv-002',
        name: 'File Server',
        type: 'server',
        ip: '192.168.1.11',
        mac: '00:4D:5E:6F:7A:8B',
        vendor: 'HP',
        status: 'warning',
        lastSeen: '5 minutes ago',
        uptime: '23 days',
        connections: ['sw-001'],
        vulnerabilities: 1,
        performance: { cpu: 92, memory: 78, bandwidth: 67 }
      },
      {
        id: 'ws-001',
        name: 'Admin Workstation',
        type: 'workstation',
        ip: '192.168.1.50',
        mac: '00:5E:6F:7A:8B:9C',
        vendor: 'Lenovo',
        status: 'online',
        lastSeen: '2 minutes ago',
        uptime: '8 hours',
        connections: ['ap-001'],
        vulnerabilities: 1,
        performance: { cpu: 34, memory: 56, bandwidth: 12 }
      },
      {
        id: 'prt-001',
        name: 'Network Printer',
        type: 'printer',
        ip: '192.168.1.100',
        mac: '00:6F:7A:8B:9C:AD',
        vendor: 'Canon',
        status: 'offline',
        lastSeen: '2 hours ago',
        uptime: '0 minutes',
        connections: ['ap-001'],
        vulnerabilities: 0,
        performance: { cpu: 0, memory: 0, bandwidth: 0 }
      }
    ],
    securityIssues: [
      {
        level: 'high',
        description: 'Outdated firmware detected on Domain Controller',
        affected: ['srv-001']
      },
      {
        level: 'medium',
        description: 'Weak default credentials found on network devices',
        affected: ['fw-001', 'ap-001']
      },
      {
        level: 'low',
        description: 'Unnecessary open ports detected',
        affected: ['srv-002', 'ws-001']
      }
    ]
  }
};

export const SafeNetDemo = () => {
  const [networkRange, setNetworkRange] = useState('');
  const [results, setResults] = useState<NetworkScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedDevice, setSelectedDevice] = useState<NetworkDevice | null>(null);

  const runNetworkScan = async () => {
    if (!networkRange.trim()) return;
    
    setIsScanning(true);
    
    // Simulate network scan delay
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    // Use mock data or generate random data
    const mockResult = mockNetworkData[networkRange] || {
      subnet: networkRange,
      totalDevices: Math.floor(Math.random() * 30) + 10,
      devicesOnline: Math.floor(Math.random() * 25) + 8,
      vulnerabilities: Math.floor(Math.random() * 10),
      scanTime: new Date().toLocaleString(),
      networkHealth: Math.floor(Math.random() * 30) + 70,
      bandwidthUtilization: Math.floor(Math.random() * 40) + 40,
      topology: [],
      securityIssues: [
        {
          level: 'medium' as const,
          description: 'Network scan completed - review devices for security issues',
          affected: ['Multiple devices']
        }
      ]
    };
    
    setResults(mockResult);
    setIsScanning(false);
  };

  const loadSampleNetwork = (range: string) => {
    setNetworkRange(range);
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'router': return Router;
      case 'switch': return Network;
      case 'server': return Server;
      case 'workstation': return Monitor;
      case 'printer': return Printer;
      case 'phone': return Smartphone;
      case 'firewall': return Shield;
      case 'ap': return Wifi;
      default: return HardDrive;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'offline': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online': return 'default';
      case 'offline': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'outline';
    }
  };

  const getVulnerabilityColor = (count: number) => {
    if (count === 0) return 'text-green-600';
    if (count <= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceColor = (value: number) => {
    if (value < 50) return 'text-green-600';
    if (value < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Network className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Ultrium SafeNet Demo</h1>
          </div>
          <p className="text-muted-foreground mb-6">
            Advanced network discovery and topology mapping platform
          </p>
          
          {/* Meraki Integration Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Plug className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">
                    Cisco Meraki Integration
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Seamlessly connect to your Meraki dashboard
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Production Ready
                </Badge>
                <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                  <Star className="h-3 w-3 mr-1" />
                  Enterprise Grade
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-blue-600" />
                <span className="text-blue-800 dark:text-blue-200">
                  Live network topology from your Meraki dashboard
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <span className="text-blue-800 dark:text-blue-200">
                  Real-time device performance and health metrics
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="text-blue-800 dark:text-blue-200">
                  Security events and threat intelligence
                </span>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                Contact us to enable Meraki integration for your organization
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Network Scanner */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Network Scanner
              </CardTitle>
              <CardDescription>
                Discover and map your network topology
                <br />
                <span className="text-xs text-blue-600 font-medium">🔌 Meraki integration available for live data</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sample Networks:</label>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => loadSampleNetwork('192.168.1.0/24')}
                    className="w-full justify-start text-xs"
                  >
                    🏢 Corporate LAN (192.168.1.0/24)
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => loadSampleNetwork('10.0.0.0/16')}
                    className="w-full justify-start text-xs"
                  >
                    🏭 Enterprise Network (10.0.0.0/16)
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Input
                  placeholder="Network range (e.g., 192.168.1.0/24)"
                  value={networkRange}
                  onChange={(e) => setNetworkRange(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={runNetworkScan}
                disabled={!networkRange.trim() || isScanning}
                className="w-full"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scanning Network...
                  </>
                ) : (
                  <>
                    <Network className="mr-2 h-4 w-4" />
                    Scan Network
                  </>
                )}
              </Button>

              {isScanning && (
                <div className="text-center space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Discovering devices and mapping topology...
                  </div>
                  <div className="text-xs text-muted-foreground">
                    This may take several minutes for large networks
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Network Results */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Network Topology
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!results ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Enter a network range to begin topology discovery</p>
                  <p className="text-sm mt-2">We map devices, connections, and security status</p>
                </div>
              ) : (
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="devices">Devices ({results.totalDevices})</TabsTrigger>
                    <TabsTrigger value="topology">Topology</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-center text-blue-600">
                            {results.totalDevices}
                          </div>
                          <div className="text-sm text-muted-foreground text-center">
                            Total Devices
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-center text-green-600">
                            {results.devicesOnline}
                          </div>
                          <div className="text-sm text-muted-foreground text-center">
                            Online
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className={`text-2xl font-bold text-center ${getVulnerabilityColor(results.vulnerabilities)}`}>
                            {results.vulnerabilities}
                          </div>
                          <div className="text-sm text-muted-foreground text-center">
                            Vulnerabilities
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className={`text-2xl font-bold text-center ${getPerformanceColor(results.networkHealth)}`}>
                            {results.networkHealth}%
                          </div>
                          <div className="text-sm text-muted-foreground text-center">
                            Health Score
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Scan Summary</h4>
                      <div className="text-sm space-y-1">
                        <div><strong>Network:</strong> {results.subnet}</div>
                        <div><strong>Scan Time:</strong> {results.scanTime}</div>
                        <div><strong>Bandwidth Utilization:</strong> {results.bandwidthUtilization}%</div>
                      </div>
                      <Progress value={results.bandwidthUtilization} className="mt-2" />
                    </div>

                    {results.vulnerabilities > 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Found {results.vulnerabilities} security vulnerabilities that require attention.
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>

                  <TabsContent value="devices" className="space-y-4">
                    <div className="space-y-4">
                      {results.topology.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Server className="h-8 w-8 mx-auto mb-2" />
                          <p>No detailed device information available</p>
                          <p className="text-sm mt-1">Try scanning 192.168.1.0/24 for detailed topology</p>
                        </div>
                      ) : (
                        results.topology.map((device) => {
                          const DeviceIcon = getDeviceIcon(device.type);
                          return (
                            <Card 
                              key={device.id} 
                              className="hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => setSelectedDevice(device)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                      <DeviceIcon className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                      <div className="font-medium">{device.name}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {device.ip} • {device.vendor}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={getStatusBadge(device.status)}>
                                      {device.status}
                                    </Badge>
                                    {device.vulnerabilities > 0 && (
                                      <Badge variant="destructive">
                                        {device.vulnerabilities} vuln
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">CPU:</span>
                                    <span className={`ml-1 font-medium ${getPerformanceColor(device.performance.cpu)}`}>
                                      {device.performance.cpu}%
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Memory:</span>
                                    <span className={`ml-1 font-medium ${getPerformanceColor(device.performance.memory)}`}>
                                      {device.performance.memory}%
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Uptime:</span>
                                    <span className="ml-1 font-medium">{device.uptime}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="topology" className="space-y-4">
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-8">
                      <div className="text-center mb-6">
                        <h4 className="text-lg font-bold mb-2">Network Topology Map</h4>
                        <p className="text-sm text-muted-foreground">Interactive visualization of network connections</p>
                      </div>
                      
                      {results.topology.length > 0 ? (
                        <div className="flex flex-wrap justify-center gap-4">
                          {results.topology.map((device) => {
                            const DeviceIcon = getDeviceIcon(device.type);
                            return (
                              <div key={device.id} className="text-center">
                                <div className="relative">
                                  <div className={`p-4 rounded-lg border-2 ${device.status === 'online' ? 'border-green-300 bg-green-50' : device.status === 'warning' ? 'border-yellow-300 bg-yellow-50' : 'border-red-300 bg-red-50'}`}>
                                    <DeviceIcon className={`h-6 w-6 ${getStatusColor(device.status)}`} />
                                  </div>
                                  {device.vulnerabilities > 0 && (
                                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                      {device.vulnerabilities}
                                    </div>
                                  )}
                                </div>
                                <div className="text-xs mt-2 max-w-20">
                                  <div className="font-medium truncate">{device.name}</div>
                                  <div className="text-muted-foreground">{device.ip}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <MapPin className="h-8 w-8 mx-auto mb-2" />
                          <p>Network topology visualization will appear here</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="security" className="space-y-4">
                    <div className="space-y-4">
                      {results.securityIssues.map((issue, index) => (
                        <Alert key={index} className={issue.level === 'high' ? 'border-red-200' : issue.level === 'medium' ? 'border-yellow-200' : 'border-blue-200'}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge variant={issue.level === 'high' ? 'destructive' : issue.level === 'medium' ? 'secondary' : 'outline'}>
                                  {issue.level.toUpperCase()}
                                </Badge>
                                <strong>{issue.description}</strong>
                              </div>
                              <div className="text-sm">
                                <strong>Affected devices:</strong> {issue.affected.join(', ')}
                              </div>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Security Recommendations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <p>• Update firmware on all network devices</p>
                          <p>• Change default passwords and implement strong authentication</p>
                          <p>• Close unnecessary open ports and services</p>
                          <p>• Implement network segmentation for critical assets</p>
                          <p>• Schedule regular vulnerability scans</p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Device Detail Modal */}
        {selectedDevice && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {(() => {
                      const DeviceIcon = getDeviceIcon(selectedDevice.type);
                      return <DeviceIcon className="h-5 w-5" />;
                    })()}
                    {selectedDevice.name}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedDevice(null)}>
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>IP Address:</strong> {selectedDevice.ip}</div>
                  <div><strong>MAC Address:</strong> {selectedDevice.mac}</div>
                  <div><strong>Vendor:</strong> {selectedDevice.vendor}</div>
                  <div><strong>Status:</strong> 
                    <Badge variant={getStatusBadge(selectedDevice.status)} className="ml-2">
                      {selectedDevice.status}
                    </Badge>
                  </div>
                  <div><strong>Last Seen:</strong> {selectedDevice.lastSeen}</div>
                  <div><strong>Uptime:</strong> {selectedDevice.uptime}</div>
                </div>
                
                <div>
                  <strong className="text-sm">Performance Metrics:</strong>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div>
                      <div className="text-sm text-muted-foreground">CPU Usage</div>
                      <Progress value={selectedDevice.performance.cpu} className="mt-1" />
                      <div className={`text-sm font-medium ${getPerformanceColor(selectedDevice.performance.cpu)}`}>
                        {selectedDevice.performance.cpu}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Memory Usage</div>
                      <Progress value={selectedDevice.performance.memory} className="mt-1" />
                      <div className={`text-sm font-medium ${getPerformanceColor(selectedDevice.performance.memory)}`}>
                        {selectedDevice.performance.memory}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Bandwidth</div>
                      <Progress value={selectedDevice.performance.bandwidth} className="mt-1" />
                      <div className={`text-sm font-medium ${getPerformanceColor(selectedDevice.performance.bandwidth)}`}>
                        {selectedDevice.performance.bandwidth}%
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <strong className="text-sm">Network Connections:</strong>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedDevice.connections.map((conn, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {conn}
                      </Badge>
                    ))}
                  </div>
                </div>

                {selectedDevice.vulnerabilities > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{selectedDevice.vulnerabilities} vulnerabilities found</strong>
                      <p className="text-sm mt-1">This device requires security attention. Review open ports, update firmware, and check for weak credentials.</p>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};