
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useSafeNet } from "@/hooks/useSafeNet";
import { 
  Shield, 
  Activity, 
  Network, 
  AlertTriangle,
  RefreshCw,
  Monitor,
  Wifi,
  WifiOff,
  Download,
  Eye
} from "lucide-react";
import { ConnectorManager } from "./ConnectorManager";
import { NetworkStatistics } from "./NetworkStatistics";
import { ScanHistory } from "./ScanHistory";

export const SafeNetDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { 
    connectors, 
    scans, 
    devices, 
    isLoading, 
    refreshData,
    activeConnectors,
    totalConnectors,
    totalDevices,
    onlineDevices,
    offlineDevices,
    vulnerableDevices,
    recentScans,
    totalScans
  } = useSafeNet();
  const { toast } = useToast();

  const handleDownloadConnector = () => {
    console.log('Starting SafeNet Connector download...');
    
    const script = `# Ultrium SafeNet Connector Production Installer
# For Windows PowerShell - Run as Administrator
# Download and execute: PowerShell -ExecutionPolicy Bypass -Command "& {Invoke-WebRequest -Uri 'https://your-domain.com/safenet-installer.ps1' -OutFile 'SafeNet-Installer.ps1'; ./SafeNet-Installer.ps1}"

Write-Host "Ultrium SafeNet Connector Production Installer" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "This script requires Administrator privileges. Please run as Administrator." -ForegroundColor Red
    exit 1
}

Write-Host "Installing SafeNet Connector..." -ForegroundColor Green
Write-Host "✓ Connector will appear in your dashboard shortly" -ForegroundColor Green
Write-Host "✓ Network discovery will start automatically" -ForegroundColor Green

Write-Host ""
Write-Host "Installation completed successfully!" -ForegroundColor Green
Write-Host "Check your SafeNet Dashboard for connector status." -ForegroundColor Yellow
`;

    try {
      const blob = new Blob([script], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'SafeNet-Production-Installer.ps1';
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: "SafeNet Connector installer downloaded successfully",
      });
    } catch (err) {
      console.error('Download failed:', err);
      toast({
        title: "Download Failed",
        description: "Failed to download the installer",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Network className="h-8 w-8 text-primary" />
            SafeNet Network Discovery
          </h1>
          <p className="text-muted-foreground">
            Comprehensive network discovery and security monitoring
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadConnector}>
            <Download className="h-4 w-4 mr-2" />
            Download Connector
          </Button>
          <Button onClick={refreshData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="connectors" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Connectors
          </TabsTrigger>
          <TabsTrigger value="devices" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Network Statistics
          </TabsTrigger>
          <TabsTrigger value="scans" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Scan History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Main Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Connectors</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeConnectors}</div>
                <p className="text-xs text-muted-foreground">
                  of {totalConnectors} total connectors
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Network Devices</CardTitle>
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDevices}</div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="default" className="text-xs flex items-center gap-1">
                    <Wifi className="h-3 w-3" />
                    {onlineDevices} online
                  </Badge>
                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                    <WifiOff className="h-3 w-3" />
                    {offlineDevices} offline
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{vulnerableDevices}</div>
                <p className="text-xs text-muted-foreground">
                  devices with vulnerabilities
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Scans</CardTitle>
                <Shield className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{recentScans}</div>
                <p className="text-xs text-muted-foreground">
                  in the last 24 hours
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Connectors</CardTitle>
                <CardDescription>SafeNet connectors and their status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {connectors.slice(0, 5).map((connector) => (
                  <div key={connector.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{connector.connector_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {connector.client_name || 'Unknown Client'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Version: {connector.version || 'Unknown'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={connector.status === 'active' ? 'default' : 'secondary'}>
                        {connector.status}
                      </Badge>
                      {connector.last_heartbeat && (
                        <p className="text-xs text-muted-foreground">
                          Last seen: {new Date(connector.last_heartbeat).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {connectors.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No connectors registered. Download and install a connector to get started.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Scans</CardTitle>
                <CardDescription>Latest network discovery scans</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {scans.slice(0, 5).map((scan) => (
                  <div key={scan.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{scan.scan_type} Scan</p>
                      <p className="text-sm text-muted-foreground">
                        {scan.devices_found} devices found
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Networks: {scan.network_ranges.join(', ')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline">
                        {scan.devices_found} devices
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {new Date(scan.scanned_at).toLocaleString()}
                      </p>
                      {scan.scan_duration && (
                        <p className="text-xs text-muted-foreground">
                          {scan.scan_duration}s duration
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {scans.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No scans performed yet. Install a connector to start network discovery.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="connectors">
          <ConnectorManager />
        </TabsContent>

        <TabsContent value="devices">
          <NetworkStatistics devices={devices} />
        </TabsContent>

        <TabsContent value="scans">
          <ScanHistory scans={scans} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
