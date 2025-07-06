import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Monitor, 
  Server, 
  Laptop, 
  AlertTriangle, 
  CheckCircle, 
  Activity,
  Wrench,
  Download,
  Play,
  Settings,
  Users,
  Calendar,
  TrendingUp,
  Shield
} from "lucide-react";

interface Device {
  id: string;
  name: string;
  type: 'workstation' | 'server' | 'laptop';
  os: string;
  status: 'online' | 'offline' | 'alert';
  lastSeen: string;
  uptime: string;
  updates: number;
  alerts: number;
  client?: string;
}

interface Script {
  id: string;
  name: string;
  description: string;
  category: string;
  runtime: string;
  lastRun: string;
  status: 'success' | 'failed' | 'running';
}

const mockDevices: Device[] = [
  {
    id: 'WS001',
    name: 'CEO-DESKTOP',
    type: 'workstation',
    os: 'Windows 11 Pro',
    status: 'online',
    lastSeen: '2 minutes ago',
    uptime: '5 days, 14 hours',
    updates: 3,
    alerts: 0,
    client: 'AcmeTech Corp'
  },
  {
    id: 'SRV001',
    name: 'DC01-MAIN',
    type: 'server',
    os: 'Windows Server 2022',
    status: 'alert',
    lastSeen: '1 minute ago',
    uptime: '45 days, 8 hours',
    updates: 12,
    alerts: 2,
    client: 'AcmeTech Corp'
  },
  {
    id: 'LAP001',
    name: 'SALES-LAPTOP-01',
    type: 'laptop',
    os: 'Windows 11 Pro',
    status: 'offline',
    lastSeen: '2 hours ago',
    uptime: '2 days, 3 hours',
    updates: 1,
    alerts: 1,
    client: 'TechCorp Ltd'
  }
];

const mockScripts: Script[] = [
  {
    id: 'SCR001',
    name: 'Windows Update Check',
    description: 'Checks for and installs Windows updates',
    category: 'Maintenance',
    runtime: '5-10 minutes',
    lastRun: '6 hours ago',
    status: 'success'
  },
  {
    id: 'SCR002',
    name: 'Antivirus Definition Update',
    description: 'Updates antivirus definitions and runs quick scan',
    category: 'Security',
    runtime: '2-5 minutes',
    lastRun: '1 hour ago',
    status: 'success'
  },
  {
    id: 'SCR003',
    name: 'Disk Cleanup & Optimization',
    description: 'Cleans temporary files and optimizes disk performance',
    category: 'Performance',
    runtime: '10-15 minutes',
    lastRun: '12 hours ago',
    status: 'running'
  }
];

export const RMMDemo = () => {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'server': return Server;
      case 'laptop': return Laptop;
      default: return Monitor;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-red-500';
      case 'alert': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online': return <Badge className="bg-green-100 text-green-800">Online</Badge>;
      case 'offline': return <Badge variant="destructive">Offline</Badge>;
      case 'alert': return <Badge className="bg-yellow-100 text-yellow-800">Alert</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 mb-6">
        <div className="flex items-center justify-center gap-2">
          <Wrench className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Ultrium RMM Demo</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Experience comprehensive remote monitoring and management capabilities for MSPs and IT teams
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="scripts">Scripts</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Monitor className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">247</div>
                <div className="text-sm text-muted-foreground">Total Devices</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold text-green-500">231</div>
                <div className="text-sm text-muted-foreground">Online</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <div className="text-2xl font-bold text-yellow-500">12</div>
                <div className="text-sm text-muted-foreground">Alerts</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Activity className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold text-blue-500">94%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-medium">Script execution completed</div>
                      <div className="text-sm text-muted-foreground">Windows Update Check on CEO-DESKTOP</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">2 min ago</div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <div>
                      <div className="font-medium">High disk usage detected</div>
                      <div className="text-sm text-muted-foreground">DC01-MAIN - 89% disk usage</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">15 min ago</div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-medium">Security patch installed</div>
                      <div className="text-sm text-muted-foreground">12 devices updated successfully</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">1 hour ago</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Managed Devices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockDevices.map((device) => {
                    const DeviceIcon = getDeviceIcon(device.type);
                    return (
                      <div 
                        key={device.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedDevice?.id === device.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedDevice(device)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <DeviceIcon className={`h-5 w-5 ${getStatusColor(device.status)}`} />
                            <div>
                              <div className="font-medium">{device.name}</div>
                              <div className="text-sm text-muted-foreground">{device.os}</div>
                            </div>
                          </div>
                          {getStatusBadge(device.status)}
                        </div>
                        {device.client && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Client: {device.client}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Device Details */}
            <Card>
              <CardHeader>
                <CardTitle>Device Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDevice ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Device Name</div>
                        <div className="font-medium">{selectedDevice.name}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Status</div>
                        {getStatusBadge(selectedDevice.status)}
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Operating System</div>
                        <div className="font-medium">{selectedDevice.os}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Last Seen</div>
                        <div className="font-medium">{selectedDevice.lastSeen}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Uptime</div>
                        <div className="font-medium">{selectedDevice.uptime}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Pending Updates</div>
                        <div className="font-medium">{selectedDevice.updates}</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" className="flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        Run Script
                      </Button>
                      <Button size="sm" variant="outline" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Configure
                      </Button>
                      <Button size="sm" variant="outline" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Remote Connect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Select a device to view details
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scripts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Automation Scripts
              </CardTitle>
              <CardDescription>
                Manage and execute automated maintenance scripts across your devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockScripts.map((script) => (
                  <div key={script.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium">{script.name}</div>
                          <div className="text-sm text-muted-foreground">{script.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{script.category}</Badge>
                        <Badge className={
                          script.status === 'success' ? 'bg-green-100 text-green-800' :
                          script.status === 'running' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {script.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div>Runtime: {script.runtime}</div>
                      <div>Last run: {script.lastRun}</div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" disabled={script.status === 'running'}>
                        <Play className="h-4 w-4 mr-2" />
                        Run Now
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">High Disk Usage - DC01-MAIN</div>
                        <div className="text-sm">Disk usage at 89% capacity. Cleanup recommended.</div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
                    </div>
                  </AlertDescription>
                </Alert>
                
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Device Offline - SALES-LAPTOP-01</div>
                        <div className="text-sm">Device has been offline for 2 hours.</div>
                      </div>
                      <Badge variant="destructive">High</Badge>
                    </div>
                  </AlertDescription>
                </Alert>
                
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Pending Updates - 12 Devices</div>
                        <div className="text-sm">Critical security updates available for installation.</div>
                      </div>
                      <Badge className="bg-orange-100 text-orange-800">Low</Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Demo Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          This is a demonstration of Ultrium RMM capabilities. In production, you would see real-time data from your managed devices and clients.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default RMMDemo;