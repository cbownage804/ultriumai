import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Network, Search, Play, Pause, Server, Monitor, Printer,
  Wifi, Router, HelpCircle, Plus, RefreshCw, MapPin, AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DiscoveredDevice {
  id: string;
  ipAddress: string;
  macAddress: string;
  hostname: string;
  deviceType: 'server' | 'workstation' | 'printer' | 'network' | 'iot' | 'unknown';
  vendor: string;
  firstSeen: string;
  lastSeen: string;
  status: 'online' | 'offline';
  managed: boolean;
  openPorts: number[];
}

interface ScanJob {
  id: string;
  subnet: string;
  status: 'running' | 'completed' | 'scheduled';
  startedAt: string;
  devicesFound: number;
  progress: number;
}

const mockDevices: DiscoveredDevice[] = [
  { id: '1', ipAddress: '192.168.1.1', macAddress: '00:11:22:33:44:55', hostname: 'gateway.local', deviceType: 'network', vendor: 'Cisco', firstSeen: '2024-01-01', lastSeen: '2024-01-15', status: 'online', managed: false, openPorts: [22, 80, 443] },
  { id: '2', ipAddress: '192.168.1.10', macAddress: 'AA:BB:CC:DD:EE:01', hostname: 'SRV-DC01', deviceType: 'server', vendor: 'Dell', firstSeen: '2024-01-01', lastSeen: '2024-01-15', status: 'online', managed: true, openPorts: [135, 389, 445, 3389] },
  { id: '3', ipAddress: '192.168.1.50', macAddress: 'AA:BB:CC:DD:EE:02', hostname: 'WKS-001', deviceType: 'workstation', vendor: 'HP', firstSeen: '2024-01-05', lastSeen: '2024-01-15', status: 'online', managed: true, openPorts: [135, 445] },
  { id: '4', ipAddress: '192.168.1.100', macAddress: 'AA:BB:CC:DD:EE:03', hostname: 'PRINTER-01', deviceType: 'printer', vendor: 'HP', firstSeen: '2024-01-02', lastSeen: '2024-01-15', status: 'online', managed: false, openPorts: [80, 443, 9100] },
  { id: '5', ipAddress: '192.168.1.150', macAddress: 'AA:BB:CC:DD:EE:04', hostname: 'unknown-device', deviceType: 'unknown', vendor: 'Unknown', firstSeen: '2024-01-14', lastSeen: '2024-01-15', status: 'online', managed: false, openPorts: [80] },
  { id: '6', ipAddress: '192.168.1.200', macAddress: 'AA:BB:CC:DD:EE:05', hostname: 'AP-FLOOR2', deviceType: 'network', vendor: 'Ubiquiti', firstSeen: '2024-01-01', lastSeen: '2024-01-14', status: 'offline', managed: false, openPorts: [22, 80] },
];

const mockScans: ScanJob[] = [
  { id: '1', subnet: '192.168.1.0/24', status: 'completed', startedAt: '2024-01-15 10:00', devicesFound: 45, progress: 100 },
  { id: '2', subnet: '10.0.0.0/24', status: 'running', startedAt: '2024-01-15 10:30', devicesFound: 12, progress: 48 },
];

export function NetworkDiscoveryScanner() {
  const { toast } = useToast();
  const [devices] = useState(mockDevices);
  const [scans, setScans] = useState(mockScans);
  const [showNewScan, setShowNewScan] = useState(false);
  const [newSubnet, setNewSubnet] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'server': return <Server className="h-4 w-4" />;
      case 'workstation': return <Monitor className="h-4 w-4" />;
      case 'printer': return <Printer className="h-4 w-4" />;
      case 'network': return <Router className="h-4 w-4" />;
      case 'iot': return <Wifi className="h-4 w-4" />;
      default: return <HelpCircle className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'server': return 'bg-blue-500/20 text-blue-400';
      case 'workstation': return 'bg-green-500/20 text-green-400';
      case 'printer': return 'bg-purple-500/20 text-purple-400';
      case 'network': return 'bg-orange-500/20 text-orange-400';
      case 'iot': return 'bg-cyan-500/20 text-cyan-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const startScan = () => {
    if (!newSubnet) return;
    const newScan: ScanJob = {
      id: Date.now().toString(),
      subnet: newSubnet,
      status: 'running',
      startedAt: new Date().toISOString(),
      devicesFound: 0,
      progress: 0
    };
    setScans(prev => [newScan, ...prev]);
    setShowNewScan(false);
    setNewSubnet('');
    toast({ title: 'Scan started', description: `Scanning ${newSubnet}...` });
  };

  const filteredDevices = typeFilter === 'all' 
    ? devices 
    : devices.filter(d => d.deviceType === typeFilter);

  const onlineCount = devices.filter(d => d.status === 'online').length;
  const unmanagedCount = devices.filter(d => !d.managed).length;
  const unknownCount = devices.filter(d => d.deviceType === 'unknown').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Network Discovery</h2>
          <p className="text-muted-foreground">Discover devices on network segments automatically</p>
        </div>
        <Dialog open={showNewScan} onOpenChange={setShowNewScan}>
          <DialogTrigger asChild>
            <Button><Search className="h-4 w-4 mr-2" /> New Scan</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start Network Scan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Subnet / IP Range</Label>
                <Input 
                  placeholder="e.g., 192.168.1.0/24"
                  value={newSubnet}
                  onChange={(e) => setNewSubnet(e.target.value)}
                />
              </div>
              <div>
                <Label>Scan Type</Label>
                <Select defaultValue="full">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quick">Quick Scan (Ping only)</SelectItem>
                    <SelectItem value="full">Full Scan (Ports + Services)</SelectItem>
                    <SelectItem value="deep">Deep Scan (Vulnerability check)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Scanner Agent</Label>
                <Select defaultValue="auto">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-select nearest</SelectItem>
                    <SelectItem value="srv-dc01">SRV-DC01 (192.168.1.10)</SelectItem>
                    <SelectItem value="srv-file01">SRV-FILE01 (192.168.1.20)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={startScan}>
                <Play className="h-4 w-4 mr-2" /> Start Scan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{devices.length}</div>
            <p className="text-sm text-muted-foreground">Total Discovered</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-400">{onlineCount}</div>
            <p className="text-sm text-muted-foreground">Online</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{devices.filter(d => d.managed).length}</div>
            <p className="text-sm text-muted-foreground">Managed</p>
          </CardContent>
        </Card>
        <Card className={`${unmanagedCount > 0 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-card/50'}`}>
          <CardContent className="pt-4">
            <div className={`text-2xl font-bold ${unmanagedCount > 0 ? 'text-yellow-400' : ''}`}>{unmanagedCount}</div>
            <p className="text-sm text-muted-foreground">Unmanaged</p>
          </CardContent>
        </Card>
        <Card className={`${unknownCount > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-card/50'}`}>
          <CardContent className="pt-4">
            <div className={`text-2xl font-bold ${unknownCount > 0 ? 'text-red-400' : ''}`}>{unknownCount}</div>
            <p className="text-sm text-muted-foreground">Unknown</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Scans */}
      {scans.filter(s => s.status === 'running').length > 0 && (
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4">
            {scans.filter(s => s.status === 'running').map(scan => (
              <div key={scan.id} className="flex items-center gap-4">
                <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">Scanning {scan.subnet}</span>
                    <span className="text-sm text-muted-foreground">{scan.devicesFound} devices found</span>
                  </div>
                  <Progress value={scan.progress} className="h-2" />
                </div>
                <Button variant="ghost" size="sm">
                  <Pause className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Unknown Device Alert */}
      {unknownCount > 0 && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-6 w-6 text-red-400" />
              <div className="flex-1">
                <p className="font-medium text-red-400">{unknownCount} unknown device(s) detected</p>
                <p className="text-sm text-muted-foreground">Review and classify these devices</p>
              </div>
              <Button variant="outline" size="sm" className="text-red-400 border-red-400/30">
                Review Devices
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="devices">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="devices">Discovered Devices</TabsTrigger>
            <TabsTrigger value="topology">Network Map</TabsTrigger>
            <TabsTrigger value="scans">Scan History</TabsTrigger>
          </TabsList>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="server">Servers</SelectItem>
              <SelectItem value="workstation">Workstations</SelectItem>
              <SelectItem value="printer">Printers</SelectItem>
              <SelectItem value="network">Network Devices</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="devices">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>MAC Address</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Open Ports</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.map(device => (
                  <TableRow key={device.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(device.deviceType)}
                        <div>
                          <p className="font-medium">{device.hostname}</p>
                          {device.managed && <Badge variant="outline" className="text-xs">Managed</Badge>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{device.ipAddress}</TableCell>
                    <TableCell className="font-mono text-xs">{device.macAddress}</TableCell>
                    <TableCell>{device.vendor}</TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(device.deviceType)}>
                        {device.deviceType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {device.openPorts.slice(0, 3).map(port => (
                          <Badge key={port} variant="outline" className="text-xs">{port}</Badge>
                        ))}
                        {device.openPorts.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{device.openPorts.length - 3}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={device.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}>
                        {device.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {!device.managed && (
                          <Button size="sm" variant="ghost" onClick={() => toast({ title: 'Deploy agent to this device' })}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost">
                          <MapPin className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="topology">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Network Topology
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center text-muted-foreground border rounded-lg bg-muted/10">
                <div className="text-center">
                  <Network className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Interactive network topology map</p>
                  <p className="text-sm">Visualizing device connections and hierarchy</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scans">
          <Card>
            <CardHeader>
              <CardTitle>Scan History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subnet</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Devices Found</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scans.map(scan => (
                    <TableRow key={scan.id}>
                      <TableCell className="font-mono">{scan.subnet}</TableCell>
                      <TableCell>{scan.startedAt}</TableCell>
                      <TableCell>{scan.devicesFound}</TableCell>
                      <TableCell>
                        <Badge className={scan.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}>
                          {scan.status === 'running' && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
                          {scan.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
