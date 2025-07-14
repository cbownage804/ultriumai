import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Network, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Users,
  Building,
  Router,
  Server,
  Monitor,
  Smartphone,
  Activity,
  Download,
  Eye,
  Wifi,
  Globe,
  HardDrive,
  Printer,
  Laptop,
  Zap,
  X
} from "lucide-react";

const mockNetworkDevices = [
  {
    id: "1",
    client: "ABC Manufacturing",
    ip: "192.168.1.1",
    hostname: "gateway-router",
    type: "router",
    status: "online",
    riskLevel: "safe",
    vulnerabilities: 0,
    x: 400,
    y: 100,
    mac: "00:1A:2B:3C:4D:5E",
    os: "Cisco IOS 15.1",
    lastSeen: "2 minutes ago",
    openPorts: ["22", "23", "80", "443"]
  },
  {
    id: "2",
    client: "ABC Manufacturing", 
    ip: "192.168.1.10",
    hostname: "core-switch-01",
    type: "switch",
    status: "online",
    riskLevel: "safe",
    vulnerabilities: 0,
    x: 400,
    y: 200,
    mac: "00:1B:2C:3D:4E:5F",
    os: "Cisco IOS XE 16.12",
    lastSeen: "1 minute ago",
    openPorts: ["22", "23", "80", "443", "161"]
  },
  {
    id: "3",
    client: "ABC Manufacturing",
    ip: "192.168.1.50",
    hostname: "file-server-01",
    type: "server",
    status: "online",
    riskLevel: "high",
    vulnerabilities: 3,
    x: 200,
    y: 300,
    mac: "00:1C:2D:3E:4F:60",
    os: "Windows Server 2019",
    lastSeen: "30 seconds ago",
    openPorts: ["21", "22", "80", "139", "445", "3389"]
  },
  {
    id: "4",
    client: "ABC Manufacturing",
    ip: "192.168.1.51",
    hostname: "mail-server",
    type: "server", 
    status: "online",
    riskLevel: "medium",
    vulnerabilities: 1,
    x: 400,
    y: 300,
    mac: "00:1D:2E:3F:40:61",
    os: "Ubuntu Server 20.04",
    lastSeen: "45 seconds ago",
    openPorts: ["22", "25", "80", "110", "143", "993", "995"]
  },
  {
    id: "5",
    client: "ABC Manufacturing",
    ip: "192.168.1.52",
    hostname: "backup-server",
    type: "server",
    status: "offline",
    riskLevel: "safe",
    vulnerabilities: 0,
    x: 600,
    y: 300,
    mac: "00:1E:2F:30:41:62",
    os: "Ubuntu Server 18.04",
    lastSeen: "2 hours ago",
    openPorts: ["22", "80", "443"]
  },
  {
    id: "6",
    client: "ABC Manufacturing",
    ip: "192.168.1.100",
    hostname: "workstation-01",
    type: "workstation",
    status: "online",
    riskLevel: "safe",
    vulnerabilities: 0,
    x: 150,
    y: 400,
    mac: "00:1F:20:31:42:63",
    os: "Windows 11 Pro",
    lastSeen: "15 seconds ago",
    openPorts: ["80", "135", "139", "445"]
  },
  {
    id: "7",
    client: "ABC Manufacturing",
    ip: "192.168.1.101",
    hostname: "workstation-02",
    type: "workstation",
    status: "online",
    riskLevel: "medium",
    vulnerabilities: 2,
    x: 300,
    y: 400,
    mac: "00:20:21:32:43:64",
    os: "Windows 10 Pro",
    lastSeen: "5 minutes ago",
    openPorts: ["80", "135", "139", "445", "3389"]
  },
  {
    id: "8",
    client: "ABC Manufacturing",
    ip: "192.168.1.102",
    hostname: "workstation-03",
    type: "workstation",
    status: "online",
    riskLevel: "safe",
    vulnerabilities: 0,
    x: 450,
    y: 400,
    mac: "00:21:22:33:44:65",
    os: "macOS Monterey",
    lastSeen: "1 minute ago",
    openPorts: ["22", "80", "5900"]
  },
  {
    id: "9",
    client: "ABC Manufacturing",
    ip: "192.168.1.200",
    hostname: "network-printer",
    type: "printer",
    status: "online",
    riskLevel: "safe",
    vulnerabilities: 0,
    x: 650,
    y: 400,
    mac: "00:22:23:34:45:66",
    os: "HP Printer Firmware",
    lastSeen: "3 minutes ago",
    openPorts: ["9100", "80", "443", "631"]
  },
  {
    id: "10",
    client: "ABC Manufacturing",
    ip: "192.168.1.15",
    hostname: "wifi-ap-01",
    type: "wireless",
    status: "online",
    riskLevel: "safe",
    vulnerabilities: 0,
    x: 550,
    y: 200,
    mac: "00:23:24:35:46:67",
    os: "Cisco WLC 8.10",
    lastSeen: "30 seconds ago",
    openPorts: ["22", "80", "443"]
  }
];

const networkConnections = [
  { from: "1", to: "2" }, // Router to Switch
  { from: "2", to: "3" }, // Switch to File Server
  { from: "2", to: "4" }, // Switch to Mail Server
  { from: "2", to: "5" }, // Switch to Backup Server
  { from: "2", to: "6" }, // Switch to Workstation 1
  { from: "2", to: "7" }, // Switch to Workstation 2
  { from: "2", to: "8" }, // Switch to Workstation 3
  { from: "2", to: "9" }, // Switch to Printer
  { from: "2", to: "10" }, // Switch to WiFi AP
];

const NetworkTopologyView = ({ devices }: { devices: typeof mockNetworkDevices }) => {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'router': return Router;
      case 'switch': return Network;
      case 'server': return Server;
      case 'workstation': return Monitor;
      case 'printer': return Printer;
      case 'wireless': return Wifi;
      default: return Network;
    }
  };

  const getDeviceColor = (status: string, riskLevel: string) => {
    if (status === 'offline') return 'text-gray-400 bg-gray-100';
    if (riskLevel === 'high') return 'text-red-600 bg-red-100';
    if (riskLevel === 'medium') return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getConnectionColor = (fromDevice: any, toDevice: any) => {
    if (fromDevice.status === 'offline' || toDevice.status === 'offline') return 'stroke-gray-300';
    if (fromDevice.riskLevel === 'high' || toDevice.riskLevel === 'high') return 'stroke-red-400';
    if (fromDevice.riskLevel === 'medium' || toDevice.riskLevel === 'medium') return 'stroke-yellow-400';
    return 'stroke-green-400';
  };

  return (
    <div className="bg-slate-50 border rounded-lg p-4 relative overflow-auto" style={{ height: '500px' }}>
      <div className="absolute top-4 left-4 text-sm font-medium text-slate-600">
        ABC Manufacturing Network Topology
      </div>
      
      {/* Internet connection indicator */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 text-xs text-muted-foreground z-10" style={{ left: '400px', transform: 'translateX(-50%)' }}>
        <Globe className="h-4 w-4" />
        <span>Internet</span>
      </div>
      
      <svg width="800" height="500" className="absolute inset-0">
        {/* Internet connection line */}
        <line x1={400} y1={50} x2={400} y2={100} stroke="#64748b" strokeWidth="2" strokeDasharray="5,5" />
        
        {/* Network connections */}
        {networkConnections.map((conn, index) => {
          const fromDevice = devices.find(d => d.id === conn.from);
          const toDevice = devices.find(d => d.id === conn.to);
          if (!fromDevice || !toDevice) return null;
          
          return (
            <line
              key={index}
              x1={fromDevice.x}
              y1={fromDevice.y}
              x2={toDevice.x}
              y2={toDevice.y}
              strokeWidth="2"
              className={getConnectionColor(fromDevice, toDevice)}
            />
          );
        })}
      </svg>

      {/* Network devices */}
      {devices.map((device) => {
        const DeviceIcon = getDeviceIcon(device.type);
        const isSelected = selectedDevice === device.id;
        
        return (
          <div
            key={device.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
              isSelected ? 'scale-110 z-10' : 'hover:scale-105'
            }`}
            style={{ left: device.x, top: device.y }}
            onClick={() => setSelectedDevice(isSelected ? null : device.id)}
          >
            <div className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center ${
              getDeviceColor(device.status, device.riskLevel)
            } ${isSelected ? 'border-blue-500' : 'border-gray-300'}`}>
              <DeviceIcon className="h-6 w-6" />
            </div>
            
            {/* Device label */}
            <div className="absolute top-14 left-1/2 transform -translate-x-1/2 text-xs font-medium text-center min-w-max">
              <div className="bg-white px-1 py-0.5 rounded border text-slate-700">
                {device.hostname}
              </div>
              <div className="text-slate-500 mt-1">{device.ip}</div>
              {device.vulnerabilities > 0 && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                  <span className="text-red-500 text-xs">{device.vulnerabilities}</span>
                </div>
              )}
            </div>

            {/* Status indicator */}
            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${
              device.status === 'online' ? 'bg-green-600' : 'bg-red-600'
            }`} />
          </div>
        );
      })}

      {/* Device Details Panel */}
      {selectedDevice && (() => {
        const device = devices.find(d => d.id === selectedDevice);
        if (!device) return null;
        
        return (
          <div className="absolute top-4 right-4 bg-background border rounded-lg p-4 shadow-lg max-w-sm z-20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg text-foreground">{device.hostname}</h3>
              <Button
                variant="ghost" 
                size="icon"
                onClick={() => setSelectedDevice(null)}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-medium text-foreground">Type:</span>
                  <div className="capitalize text-muted-foreground">{device.type}</div>
                </div>
                <div>
                  <span className="font-medium text-foreground">Status:</span>
                  <div className={`capitalize ${device.status === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                    {device.status}
                  </div>
                </div>
              </div>
              
              <div>
                <span className="font-medium text-foreground">IP Address:</span>
                <div className="font-mono text-muted-foreground">{device.ip}</div>
              </div>
              
              <div>
                <span className="font-medium text-foreground">MAC Address:</span>
                <div className="font-mono text-muted-foreground">{device.mac}</div>
              </div>
              
              <div>
                <span className="font-medium text-foreground">Operating System:</span>
                <div className="text-muted-foreground">{device.os}</div>
              </div>
              
              <div>
                <span className="font-medium text-foreground">Last Seen:</span>
                <div className="text-muted-foreground">{device.lastSeen}</div>
              </div>
              
              <div>
                <span className="font-medium text-foreground">Risk Level:</span>
                <div className={`capitalize font-medium ${
                  device.riskLevel === 'high' ? 'text-red-600' : 
                  device.riskLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {device.riskLevel}
                </div>
              </div>
              
              {device.vulnerabilities > 0 && (
                <div>
                  <span className="font-medium text-foreground">Vulnerabilities:</span>
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    {device.vulnerabilities} found
                  </div>
                </div>
              )}
              
              <div>
                <span className="font-medium text-foreground">Open Ports:</span>
                <div className="text-xs font-mono bg-muted text-muted-foreground p-2 rounded mt-1">
                  {device.openPorts.join(', ')}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background border rounded p-3 shadow-sm">
        <div className="text-xs font-semibold mb-2 text-foreground">Legend</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            <span className="text-foreground">Online / Safe</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
            <span className="text-foreground">Medium Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded-full"></div>
            <span className="text-foreground">High Risk / Offline</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SafeNetDemo = () => {
  const [selectedClient, setSelectedClient] = useState("ABC Manufacturing");
  const [scanningClient, setScanningClient] = useState<string | null>(null);

  const clients = ["ABC Manufacturing", "XYZ Legal", "Tech Startup Co"];

  const filteredDevices = mockNetworkDevices.filter(device => device.client === selectedClient);

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'router': return Router;
      case 'switch': return Network;
      case 'server': return Server;
      case 'workstation': return Monitor;
      case 'printer': return Printer;
      case 'wireless': return Wifi;
      default: return Network;
    }
  };

  const startClientScan = (clientName: string) => {
    setScanningClient(clientName);
    setTimeout(() => setScanningClient(null), 3000);
  };

  const totalVulnerabilities = filteredDevices.reduce((sum, device) => sum + device.vulnerabilities, 0);
  const onlineDevices = filteredDevices.filter(device => device.status === 'online').length;
  const highRiskDevices = filteredDevices.filter(device => device.riskLevel === 'high').length;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Network className="h-16 w-16 mx-auto text-primary" />
        <h2 className="text-3xl font-bold">SafeNet Network Discovery & Topology</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Complete network discovery with real-time topology mapping, device profiling, and vulnerability assessment.
        </p>
      </div>

      {/* Client Selector */}
      <div className="flex justify-center gap-2">
        {clients.map((client) => (
          <Button
            key={client}
            variant={selectedClient === client ? "default" : "outline"}
            onClick={() => setSelectedClient(client)}
            size="sm"
          >
            {client}
          </Button>
        ))}
      </div>

      {/* Network Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Devices</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredDevices.length}</div>
            <p className="text-xs text-muted-foreground">Discovered & mapped</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{onlineDevices}/{filteredDevices.length}</div>
            <p className="text-xs text-muted-foreground">Devices online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vulnerabilities</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />  
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{totalVulnerabilities}</div>
            <p className="text-xs text-muted-foreground">Security issues found</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{highRiskDevices}</div>
            <p className="text-xs text-muted-foreground">High risk devices</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="topology" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="topology">Network Topology</TabsTrigger>
          <TabsTrigger value="devices">Device List</TabsTrigger>
        </TabsList>
        
        <TabsContent value="topology" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Network Topology Map - {selectedClient}
                  </CardTitle>
                  <CardDescription>
                    Interactive network diagram showing device connections and status
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => startClientScan(selectedClient)}
                  disabled={scanningClient === selectedClient}
                  size="sm"
                >
                  {scanningClient === selectedClient ? (
                    <>
                      <Activity className="h-4 w-4 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Rescan Network
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <NetworkTopologyView devices={filteredDevices} />
              
              <Alert className="mt-4">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Topology Features:</strong> Real-time device discovery, automatic network mapping, 
                  vulnerability scanning, and performance monitoring. Click on any device for detailed information.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Discovered Devices - {selectedClient}</CardTitle>
              <CardDescription>Complete device inventory with security status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredDevices.map((device) => {
                  const DeviceIcon = getDeviceIcon(device.type);
                  return (
                    <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          device.status === 'offline' ? 'bg-gray-100' :
                          device.riskLevel === 'high' ? 'bg-red-100' :
                          device.riskLevel === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
                        }`}>
                          <DeviceIcon className={`h-5 w-5 ${
                            device.status === 'offline' ? 'text-gray-400' :
                            device.riskLevel === 'high' ? 'text-red-600' :
                            device.riskLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'
                          }`} />
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {device.hostname}
                            <div className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                            {device.vulnerabilities > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {device.vulnerabilities} vulnerabilities
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {device.type.charAt(0).toUpperCase() + device.type.slice(1)} • {device.ip}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          device.riskLevel === 'high' ? 'destructive' : 
                          device.riskLevel === 'medium' ? 'secondary' : 'default'
                        }>
                          {device.riskLevel} risk
                        </Badge>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};