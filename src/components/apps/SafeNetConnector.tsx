import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Download, 
  Server, 
  CheckCircle, 
  AlertTriangle,
  Activity,
  Settings,
  Shield,
  Network,
  Key,
  Monitor,
  Wifi,
  Globe,
  RefreshCw,
  Terminal,
  Lock,
  Cpu,
  HardDrive,
  MemoryStick,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface ConnectorInstance {
  id: string;
  name: string;
  version: string;
  status: 'online' | 'offline' | 'updating' | 'error';
  lastSeen: Date;
  clientName: string;
  ipAddress: string;
  systemInfo: {
    os: string;
    cpu: string;
    memory: string;
    diskSpace: string;
  };
  networkInfo: {
    interfaces: number;
    subnets: string[];
    gateway: string;
  };
  scanStats: {
    totalScans: number;
    lastScanTime: Date;
    devicesFound: number;
    threatsDetected: number;
  };
}

export const SafeNetConnector = () => {
  const { toast } = useToast();
  const [connectors, setConnectors] = useState<ConnectorInstance[]>([
    {
      id: 'conn-001',
      name: 'ABC Manufacturing - Main Office',
      version: '2.1.4',
      status: 'online',
      lastSeen: new Date(),
      clientName: 'ABC Manufacturing',
      ipAddress: '192.168.1.100',
      systemInfo: {
        os: 'Windows Server 2022',
        cpu: 'Intel Xeon E5-2680 v4',
        memory: '32 GB',
        diskSpace: '500 GB SSD'
      },
      networkInfo: {
        interfaces: 3,
        subnets: ['192.168.1.0/24', '10.0.1.0/24'],
        gateway: '192.168.1.1'
      },
      scanStats: {
        totalScans: 247,
        lastScanTime: new Date(),
        devicesFound: 47,
        threatsDetected: 3
      }
    },
    {
      id: 'conn-002',
      name: 'XYZ Legal - Branch Office',
      version: '2.1.4',
      status: 'offline',
      lastSeen: new Date(Date.now() - 300000), // 5 minutes ago
      clientName: 'XYZ Legal',
      ipAddress: '10.0.50.100',
      systemInfo: {
        os: 'Ubuntu Server 22.04',
        cpu: 'AMD Ryzen 7 5800X',
        memory: '16 GB',
        diskSpace: '1 TB NVMe'
      },
      networkInfo: {
        interfaces: 2,
        subnets: ['10.0.50.0/24'],
        gateway: '10.0.50.1'
      },
      scanStats: {
        totalScans: 89,
        lastScanTime: new Date(Date.now() - 3600000), // 1 hour ago
        devicesFound: 23,
        threatsDetected: 1
      }
    }
  ]);

  const [newConnectorKey, setNewConnectorKey] = useState('');

  const generateConnectorKey = () => {
    const key = `snc_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    setNewConnectorKey(key);
    toast({
      title: "Connector Key Generated",
      description: "Use this key during connector installation",
    });
  };

  const downloadConnector = async (platform: 'windows' | 'linux' | 'docker') => {
    const downloadData = {
      windows: { 
        file: 'safenet-connector-windows-x64.exe', 
        size: '45 MB',
        storagePath: 'safenet-connector-windows-x64.exe'
      },
      linux: { 
        file: 'safenet-connector-linux.deb', 
        size: '32 MB',
        storagePath: 'safenet-connector-linux.deb'
      },
      docker: { 
        file: 'safenet-connector-docker.tar.gz', 
        size: '28 MB',
        storagePath: 'safenet-connector-docker.tar.gz'
      }
    };

    const data = downloadData[platform];
    
    try {
      // Get download URL from Supabase storage
      const downloadUrl = `https://nsyobmjpdpvesjwdphlh.supabase.co/storage/v1/object/public/safenet-downloads/${data.storagePath}`;
      
      // Create temporary download link
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = data.file;
      link.target = '_blank';
      link.style.display = 'none';
      
      // Add to DOM, click, and clean up
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: `${data.file} is downloading (${data.size})`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Please try again or contact support if the issue persists.",
        variant: "destructive"
      });
    }
  };

  const restartConnector = (connectorId: string) => {
    setConnectors(prev => prev.map(conn => 
      conn.id === connectorId 
        ? { ...conn, status: 'updating' as const }
        : conn
    ));
    
    setTimeout(() => {
      setConnectors(prev => prev.map(conn => 
        conn.id === connectorId 
          ? { ...conn, status: 'online' as const, lastSeen: new Date() }
          : conn
      ));
      toast({
        title: "Connector Restarted",
        description: "Connector is back online and ready for scanning",
      });
    }, 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-red-500';
      case 'updating': return 'text-orange-500';
      case 'error': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return CheckCircle;
      case 'offline': return AlertTriangle;
      case 'updating': return RefreshCw;
      case 'error': return AlertTriangle;
      default: return Activity;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Back Button and Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/products/safenet">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to SafeNet
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Server className="h-8 w-8 text-primary" />
              Network Connector Management
            </h1>
            <p className="text-muted-foreground">
              Deploy and manage SafeNet connectors across client networks
            </p>
          </div>
        </div>
      </div>

      {/* Connector Installation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Install New Connector
            </CardTitle>
            <CardDescription>
              Download and deploy SafeNet connector on client networks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="connector-key">Connector Authentication Key</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="connector-key"
                  value={newConnectorKey}
                  placeholder="Click generate to create new key"
                  readOnly
                />
                <Button onClick={generateConnectorKey} variant="outline">
                  <Key className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                This key will be used during connector installation
              </p>
            </div>

            <div className="space-y-3">
              <Label>Download Connector Installer</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  onClick={() => downloadConnector('windows')} 
                  variant="outline" 
                  className="flex flex-col items-center p-4 h-auto"
                >
                  <Monitor className="h-6 w-6 mb-2" />
                  <span className="text-sm">Windows</span>
                  <span className="text-xs text-muted-foreground">MSI Installer</span>
                </Button>
                <Button 
                  onClick={() => downloadConnector('linux')} 
                  variant="outline"
                  className="flex flex-col items-center p-4 h-auto"
                >
                  <Terminal className="h-6 w-6 mb-2" />
                  <span className="text-sm">Linux</span>
                  <span className="text-xs text-muted-foreground">DEB Package</span>
                </Button>
                <Button 
                  onClick={() => downloadConnector('docker')} 
                  variant="outline"
                  className="flex flex-col items-center p-4 h-auto"
                >
                  <Server className="h-6 w-6 mb-2" />
                  <span className="text-sm">Docker</span>
                  <span className="text-xs text-muted-foreground">Container</span>
                </Button>
              </div>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                The connector runs with minimal privileges and only communicates outbound to SafeNet cloud services. 
                No inbound firewall rules required.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Installation Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-2">Windows Installation:</h4>
                <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                  <li>Download the MSI installer</li>
                  <li>Run as Administrator</li>
                  <li>Enter the connector key when prompted</li>
                  <li>Select network interfaces to monitor</li>
                  <li>Complete installation and verify connection</li>
                </ol>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Linux Installation:</h4>
                <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                  <li>Download the DEB package</li>
                  <li>Install: <code className="bg-muted px-1 rounded">sudo dpkg -i safenet-connector.deb</code></li>
                  <li>Configure: <code className="bg-muted px-1 rounded">sudo safenet-config --key YOUR_KEY</code></li>
                  <li>Start service: <code className="bg-muted px-1 rounded">sudo systemctl start safenet</code></li>
                </ol>
              </div>

              <div>
                <h4 className="font-medium mb-2">Docker Deployment:</h4>
                <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                  <li>Load image: <code className="bg-muted px-1 rounded">docker load -i safenet-connector.tar.gz</code></li>
                  <li>Run: <code className="bg-muted px-1 rounded">docker run -d --network=host safenet:latest</code></li>
                  <li>Set environment: <code className="bg-muted px-1 rounded">-e SAFENET_KEY=YOUR_KEY</code></li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Connectors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Active Connectors ({connectors.length})
          </CardTitle>
          <CardDescription>
            Monitor and manage deployed network connectors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {connectors.map((connector) => {
              const StatusIcon = getStatusIcon(connector.status);
              return (
                <Card key={connector.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                      {/* Connector Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`h-4 w-4 ${getStatusColor(connector.status)}`} />
                          <span className="font-medium">{connector.name}</span>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div>Version: {connector.version}</div>
                          <div>IP: {connector.ipAddress}</div>
                          <div>Last seen: {connector.lastSeen.toLocaleString()}</div>
                        </div>
                        <Badge variant={connector.status === 'online' ? 'default' : 'destructive'}>
                          {connector.status}
                        </Badge>
                      </div>

                      {/* System Info */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">System Resources</h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1">
                            <Cpu className="h-3 w-3" />
                            {connector.systemInfo.cpu}
                          </div>
                          <div className="flex items-center gap-1">
                            <MemoryStick className="h-3 w-3" />
                            {connector.systemInfo.memory}
                          </div>
                          <div className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            {connector.systemInfo.diskSpace}
                          </div>
                        </div>
                      </div>

                      {/* Network Info */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Network Coverage</h4>
                        <div className="space-y-1 text-xs">
                          <div>{connector.networkInfo.interfaces} interfaces</div>
                          <div>Subnets: {connector.networkInfo.subnets.length}</div>
                          <div className="text-muted-foreground">
                            {connector.networkInfo.subnets.join(', ')}
                          </div>
                        </div>
                      </div>

                      {/* Scan Stats & Actions */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Scan Statistics</h4>
                        <div className="space-y-1 text-xs">
                          <div>Total scans: {connector.scanStats.totalScans}</div>
                          <div>Devices found: {connector.scanStats.devicesFound}</div>
                          <div>Threats detected: {connector.scanStats.threatsDetected}</div>
                        </div>
                        <div className="flex gap-1 mt-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => restartConnector(connector.id)}
                            disabled={connector.status === 'updating'}
                          >
                            <RefreshCw className={`h-3 w-3 ${connector.status === 'updating' ? 'animate-spin' : ''}`} />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Settings className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Global Connector Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Connectors</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectors.length}</div>
            <p className="text-xs text-muted-foreground">
              {connectors.filter(c => c.status === 'online').length} online
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Networks Monitored</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {connectors.reduce((sum, c) => sum + c.networkInfo.subnets.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {connectors.length} locations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {connectors.reduce((sum, c) => sum + c.scanStats.totalScans, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threats Detected</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {connectors.reduce((sum, c) => sum + c.scanStats.threatsDetected, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};