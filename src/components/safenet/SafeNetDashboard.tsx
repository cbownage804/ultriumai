import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NetworkTopologyViewer } from "./NetworkTopologyViewer";
import { DeviceManagementPanel } from "./DeviceManagementPanel";
import { VulnerabilityDashboard } from "./VulnerabilityDashboard";
import { DiscoveryCredentialsManager } from "./DiscoveryCredentialsManager";
import { useSafeNetData } from "@/hooks/useSafeNetData";
import { useAuth } from "@/hooks/useAuth";
import { Shield, Network, AlertTriangle, Activity } from "lucide-react";

export const SafeNetDashboard = () => {
  const { devices, vulnerabilities, topology, isLoading } = useSafeNetData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [organizationKey, setOrganizationKey] = useState<string>('');

  useEffect(() => {
    // Generate or retrieve organization key for this user
    let storedKey = localStorage.getItem('safenet_organization_key');
    if (!storedKey) {
      storedKey = `sk-safenet-${user?.id?.slice(0, 8) || 'demo'}-${Math.random().toString(36).substring(2, 8)}`;
      localStorage.setItem('safenet_organization_key', storedKey);
    }
    setOrganizationKey(storedKey);
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const criticalVulns = vulnerabilities.filter(v => v.severity === 'critical').length;
  const highVulns = vulnerabilities.filter(v => v.severity === 'high').length;
  const onlineDevices = devices.filter(d => d.status === 'online').length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SafeNet Dashboard</h1>
          <p className="text-muted-foreground">Network topology and security monitoring</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
          >
            <Activity className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
          <Badge variant="outline" className="text-sm">
            <Activity className="h-4 w-4 mr-1" />
            Live Monitoring
          </Badge>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.length}</div>
            <p className="text-xs text-muted-foreground">
              {onlineDevices} online, {devices.length - onlineDevices} offline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Threats</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalVulns}</div>
            <p className="text-xs text-muted-foreground">
              {highVulns} high priority
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Connections</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topology.length}</div>
            <p className="text-xs text-muted-foreground">
              Active topology mappings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {Math.max(0, 100 - (criticalVulns * 10 + highVulns * 5))}%
            </div>
            <p className="text-xs text-muted-foreground">
              Network security health
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="topology">Network Map</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="vulnerabilities">Security</TabsTrigger>
          <TabsTrigger value="discovery">Discovery</TabsTrigger>
          <TabsTrigger value="connector">Connector</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Network Topology Overview</CardTitle>
                <CardDescription>Real-time network visualization</CardDescription>
              </CardHeader>
              <CardContent>
                <NetworkTopologyViewer compact />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Security Events</CardTitle>
                <CardDescription>Latest vulnerability findings</CardDescription>
              </CardHeader>
              <CardContent>
                <VulnerabilityDashboard compact />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="topology">
          <Card>
            <CardHeader>
              <CardTitle>Network Topology Map</CardTitle>
              <CardDescription>Interactive network visualization and device relationships</CardDescription>
            </CardHeader>
            <CardContent>
              <NetworkTopologyViewer />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices">
          <Card>
            <CardHeader>
              <CardTitle>Device Management</CardTitle>
              <CardDescription>Monitor and manage all discovered network devices</CardDescription>
            </CardHeader>
            <CardContent>
              <DeviceManagementPanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vulnerabilities">
          <Card>
            <CardHeader>
              <CardTitle>Security Dashboard</CardTitle>
              <CardDescription>Vulnerability management and threat monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <VulnerabilityDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discovery">
          <Card>
            <CardHeader>
              <CardTitle>Enhanced Device Discovery</CardTitle>
              <CardDescription>Configure advanced discovery methods and credentials for comprehensive device information</CardDescription>
            </CardHeader>
            <CardContent>
              <DiscoveryCredentialsManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connector">
          <Card>
            <CardHeader>
              <CardTitle>SafeNet Connector Management</CardTitle>
              <CardDescription>Download and configure the SafeNet network scanner</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Download Connector</h3>
                  <p className="text-sm text-muted-foreground">
                    Download the SafeNet connector to start monitoring your network infrastructure.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <a 
                      href={`https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/safenet-connector-download/python?agentId=${organizationKey}`} 
                      download="safenet_connector.py"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                      Python Script
                    </a>
                    <a 
                      href={`https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/safenet-connector-download/powershell?agentId=${organizationKey}`} 
                      download="safenet-installer.ps1"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                    >
                      PowerShell Script
                    </a>
                    <a 
                      href={`https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/safenet-connector-download/linux?agentId=${organizationKey}`} 
                      download="safenet_connector"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                    >
                      Linux Binary
                    </a>
                    <a 
                      href={`https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/safenet-connector-download/macos?agentId=${organizationKey}`} 
                      download="safenet_connector.app"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                    >
                      macOS App
                    </a>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Connection Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Main Office</span>
                      </div>
                      <Badge variant="secondary">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm">Branch Office</span>
                      </div>
                      <Badge variant="outline">Connecting</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-sm">Remote Site</span>
                      </div>
                      <Badge variant="destructive">Offline</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Installation Instructions</h3>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium">1. Download the connector for your operating system</p>
                  <p className="text-sm font-medium">2. Run the installer with administrator privileges</p>
                  <p className="text-sm font-medium">3. Enter your organization key when prompted</p>
                  <p className="text-sm font-medium">4. Configure network scanning preferences</p>
                  <p className="text-sm font-medium">5. Start the service and verify connection</p>
                </div>
                
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Organization Key:</strong> {organizationKey}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Use this key during connector installation to link it to your account.
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const newKey = `sk-safenet-${user?.id?.slice(0, 8) || 'demo'}-${Math.random().toString(36).substring(2, 8)}`;
                        localStorage.setItem('safenet_organization_key', newKey);
                        setOrganizationKey(newKey);
                      }}
                      className="ml-4"
                    >
                      Generate New Key
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};