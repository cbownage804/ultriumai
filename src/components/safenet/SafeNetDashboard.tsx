import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { NetworkTopologyViewer } from "./NetworkTopologyViewer";
import { DeviceManagementPanel } from "./DeviceManagementPanel";
import { VulnerabilityDashboard } from "./VulnerabilityDashboard";
import { useSafeNetData } from "@/hooks/useSafeNetData";
import { Shield, Network, AlertTriangle, Activity } from "lucide-react";

export const SafeNetDashboard = () => {
  const { devices, vulnerabilities, topology, isLoading } = useSafeNetData();
  const [activeTab, setActiveTab] = useState("overview");

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
        <Badge variant="outline" className="text-sm">
          <Activity className="h-4 w-4 mr-1" />
          Live Monitoring
        </Badge>
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="topology">Network Map</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="vulnerabilities">Security</TabsTrigger>
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
      </Tabs>
    </div>
  );
};