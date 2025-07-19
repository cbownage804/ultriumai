import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Server, 
  Network, 
  Activity,
  Download,
  Upload,
  Globe,
  Lock,
  Users,
  Building2
} from 'lucide-react';
import { useSafeWebData } from '@/hooks/useSafeWebData';
import { MSPClientManager } from '@/components/MSPClientManager';
import { ConnectorDownloads } from '@/components/ConnectorDownloads';
import { useAccountType } from '@/hooks/useAccountType';

export const SafeNetDashboard = () => {
  const { assets, threats, loading } = useSafeWebData();
  const { isMSPOrMSSP, loading: accountLoading } = useAccountType();
  
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    if (!loading && !accountLoading) {
      setIsDataLoaded(true);
    }
  }, [loading, accountLoading]);

  if (loading || accountLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const criticalThreats = threats.filter(t => t.severity === 'critical').length;
  const highThreats = threats.filter(t => t.severity === 'high').length;
  const mediumThreats = threats.filter(t => t.severity === 'medium').length;
  const lowThreats = threats.filter(t => t.severity === 'low').length;

  const onlineDevices = assets.filter(d => d.status === 'active').length;
  const offlineDevices = assets.filter(d => d.status === 'paused').length;
  const pendingDevices = assets.filter(d => d.status === 'archived').length;

  const totalDataTransfer = 0; // Placeholder for now since assets don't have network usage data

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (uptimeHours: number) => {
    const days = Math.floor(uptimeHours / 24);
    const hours = Math.floor(uptimeHours % 24);
    return `${days}d ${hours}h`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">SafeNet Dashboard</h2>
          <p className="text-muted-foreground">Monitor and manage your secure network infrastructure</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Shield className="h-3 w-3 mr-1" />
            Protected
          </Badge>
          <Badge variant="outline">
            {assets.length} Asset{assets.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className={`${isMSPOrMSSP ? 'grid-cols-7' : 'grid-cols-6'} grid w-full`}>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="network-map">Network Map</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          {isMSPOrMSSP && <TabsTrigger value="msp-clients">MSP Clients</TabsTrigger>}
          <TabsTrigger value="connector">Connector</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overview Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assets.length}</div>
                <p className="text-xs text-muted-foreground">
                  +2 from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{threats.length}</div>
                <p className="text-xs text-muted-foreground">
                  {criticalThreats} critical
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Network Health</CardTitle>
                <Network className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">98.2%</div>
                <p className="text-xs text-muted-foreground">
                  Uptime this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Transfer</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatBytes(totalDataTransfer)}</div>
                <p className="text-xs text-muted-foreground">
                  Total this month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Device Status Overview */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Device Status</CardTitle>
                <CardDescription>Current status of all monitored devices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Online</span>
                  </div>
                  <span className="font-medium">{onlineDevices}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span>Offline</span>
                  </div>
                  <span className="font-medium">{offlineDevices}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-yellow-500" />
                    <span>Pending</span>
                  </div>
                  <span className="font-medium">{pendingDevices}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Threat Distribution</CardTitle>
                <CardDescription>Security threats by severity level</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Critical</span>
                  </div>
                  <span className="font-medium">{criticalThreats}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span>High</span>
                  </div>
                  <span className="font-medium">{highThreats}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>Medium</span>
                  </div>
                  <span className="font-medium">{mediumThreats}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Low</span>
                  </div>
                  <span className="font-medium">{lowThreats}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Network Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Bandwidth Usage</span>
                    <span>74%</span>
                  </div>
                  <Progress value={74} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Latency (avg)</span>
                    <span>12ms</span>
                  </div>
                  <Progress value={88} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Packet Loss</span>
                    <span>0.1%</span>
                  </div>
                  <Progress value={5} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Firewall Status</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>VPN Connections</span>
                    <span>23/50</span>
                  </div>
                  <Progress value={46} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Threat Detection</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">Enabled</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>CPU Usage (avg)</span>
                    <span>32%</span>
                  </div>
                  <Progress value={32} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Memory Usage (avg)</span>
                    <span>58%</span>
                  </div>
                  <Progress value={58} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Storage Usage (avg)</span>
                    <span>41%</span>
                  </div>
                  <Progress value={41} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="network-map" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Network Topology</CardTitle>
              <CardDescription>Visual representation of your network infrastructure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-muted/10 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Network className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">Network map visualization coming soon</p>
                  <p className="text-sm text-muted-foreground">Interactive topology view will be available in the next update</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connected Devices</CardTitle>
              <CardDescription>Manage and monitor all devices on your SafeNet</CardDescription>
            </CardHeader>
            <CardContent>
              {assets.length > 0 ? (
                <div className="space-y-4">
                  {assets.map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          asset.status === 'active' ? 'bg-green-500' : 
                          asset.status === 'paused' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <h4 className="font-medium">{asset.asset_type}</h4>
                          <p className="text-sm text-muted-foreground">
                            {asset.asset_value}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={asset.status === 'active' ? 'secondary' : 'destructive'}>
                          {asset.status}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {asset.last_scan_at ? `Last scan: ${new Date(asset.last_scan_at).toLocaleString()}` : 'Never scanned'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No assets registered</h3>
                  <p className="text-muted-foreground">
                    Add assets to start monitoring your SafeNet infrastructure
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Threats</CardTitle>
              <CardDescription>Active security threats and vulnerabilities</CardDescription>
            </CardHeader>
            <CardContent>
              {threats.length > 0 ? (
                <div className="space-y-4">
                  {threats.map((threat) => (
                    <div key={threat.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className={`h-5 w-5 ${
                          threat.severity === 'critical' ? 'text-red-500' :
                          threat.severity === 'high' ? 'text-orange-500' :
                          threat.severity === 'medium' ? 'text-yellow-500' : 'text-green-500'
                        }`} />
                        <div>
                          <h4 className="font-medium">{threat.title}</h4>
                          <p className="text-sm text-muted-foreground">{threat.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          threat.severity === 'critical' ? 'destructive' :
                          threat.severity === 'high' ? 'destructive' :
                          threat.severity === 'medium' ? 'secondary' : 'outline'
                        }>
                          {threat.severity}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(threat.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No active threats</h3>
                  <p className="text-muted-foreground">
                    Your network is secure with no detected threats
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* MSP Clients Tab - Only shown for MSP/MSSP users */}
        {isMSPOrMSSP && (
          <TabsContent value="msp-clients" className="space-y-6">
            <MSPClientManager />
          </TabsContent>
        )}

        <TabsContent value="connector" className="space-y-6">
          <ConnectorDownloads />
        </TabsContent>
      </Tabs>
    </div>
  );
};
