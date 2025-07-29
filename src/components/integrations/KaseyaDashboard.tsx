import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Monitor, 
  Activity, 
  Users,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Settings,
  BarChart3,
  Clock,
  Server,
  Network,
  HardDrive,
  Cpu,
  Zap,
  Globe
} from 'lucide-react';

interface KaseyaConfig {
  id?: string;
  server_url: string;
  username: string;
  password_encrypted?: string;
  api_key_encrypted?: string;
  is_connected: boolean;
  sync_enabled: boolean;
  last_sync_at?: string;
  sync_frequency: string;
  monitored_endpoints: number;
  active_alerts: number;
}

interface KaseyaStats {
  totalEndpoints: number;
  onlineEndpoints: number;
  offlineEndpoints: number;
  criticalAlerts: number;
  warningAlerts: number;
  patchesRequired: number;
  antivirusStatus: number;
  backupStatus: number;
}

interface KaseyaDevice {
  id: string;
  hostname: string;
  ip_address: string;
  status: 'online' | 'offline' | 'warning';
  last_seen: string;
  os_version: string;
  agent_version: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  alerts_count: number;
}

const KaseyaDashboard: React.FC = () => {
  const [config, setConfig] = useState<KaseyaConfig>({
    server_url: '',
    username: '',
    is_connected: false,
    sync_enabled: false,
    sync_frequency: 'hourly',
    monitored_endpoints: 0,
    active_alerts: 0
  });
  
  const [stats, setStats] = useState<KaseyaStats>({
    totalEndpoints: 0,
    onlineEndpoints: 0,
    offlineEndpoints: 0,
    criticalAlerts: 0,
    warningAlerts: 0,
    patchesRequired: 0,
    antivirusStatus: 0,
    backupStatus: 0
  });

  const [devices, setDevices] = useState<KaseyaDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadKaseyaConfig();
    loadKaseyaStats();
    loadDevices();
  }, []);

  const loadKaseyaConfig = async () => {
    try {
      // Mock data for demonstration
      const mockConfig: KaseyaConfig = {
        id: '1',
        server_url: 'https://demo.kaseya.com',
        username: 'demo_user',
        is_connected: true,
        sync_enabled: true,
        sync_frequency: 'hourly',
        monitored_endpoints: 125,
        active_alerts: 7,
        last_sync_at: new Date().toISOString()
      };
      setConfig(mockConfig);
    } catch (error) {
      console.error('Failed to load Kaseya config:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadKaseyaStats = async () => {
    try {
      // Mock stats data
      const mockStats: KaseyaStats = {
        totalEndpoints: 125,
        onlineEndpoints: 118,
        offlineEndpoints: 7,
        criticalAlerts: 3,
        warningAlerts: 4,
        patchesRequired: 23,
        antivirusStatus: 98,
        backupStatus: 95
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to load Kaseya stats:', error);
    }
  };

  const loadDevices = async () => {
    try {
      // Mock device data
      const mockDevices: KaseyaDevice[] = [
        {
          id: '1',
          hostname: 'DESKTOP-ABC123',
          ip_address: '192.168.1.100',
          status: 'online',
          last_seen: new Date().toISOString(),
          os_version: 'Windows 11 Pro',
          agent_version: '9.5.0.42',
          cpu_usage: 35,
          memory_usage: 67,
          disk_usage: 82,
          alerts_count: 0
        },
        {
          id: '2',
          hostname: 'SERVER-SQL01',
          ip_address: '192.168.1.50',
          status: 'warning',
          last_seen: new Date().toISOString(),
          os_version: 'Windows Server 2019',
          agent_version: '9.5.0.42',
          cpu_usage: 78,
          memory_usage: 89,
          disk_usage: 95,
          alerts_count: 2
        },
        {
          id: '3',
          hostname: 'LAPTOP-XYZ789',
          ip_address: '192.168.1.150',
          status: 'offline',
          last_seen: new Date(Date.now() - 3600000).toISOString(),
          os_version: 'Windows 10 Pro',
          agent_version: '9.4.5.38',
          cpu_usage: 0,
          memory_usage: 0,
          disk_usage: 0,
          alerts_count: 1
        }
      ];
      setDevices(mockDevices);
    } catch (error) {
      console.error('Failed to load devices:', error);
    }
  };

  const connectKaseya = async () => {
    setConnecting(true);
    try {
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setConfig(prev => ({
        ...prev,
        is_connected: true,
        monitored_endpoints: 125,
        active_alerts: 7
      }));
      
      toast({
        title: "Success",
        description: "Successfully connected to Kaseya VSA",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to Kaseya VSA. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  const testConnection = async () => {
    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Connection Test",
        description: "Kaseya VSA connection test completed successfully",
      });
    } catch (error) {
      toast({
        title: "Connection Test Failed",
        description: "Unable to connect to Kaseya VSA server",
        variant: "destructive",
      });
    }
  };

  const syncData = async () => {
    setSyncing(true);
    try {
      // Simulate data sync
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Refresh data
      await loadKaseyaStats();
      await loadDevices();
      
      setConfig(prev => ({
        ...prev,
        last_sync_at: new Date().toISOString()
      }));
      
      toast({
        title: "Success",
        description: "Successfully synced data from Kaseya VSA",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync data from Kaseya VSA",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-destructive';
      case 'warning': return 'text-yellow-500';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'offline': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Monitor className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Kaseya VSA Integration</h2>
          <p className="text-muted-foreground">
            Remote monitoring and management dashboard
          </p>
        </div>
        <Badge variant={config.is_connected ? 'default' : 'secondary'}>
          {config.is_connected ? 'Connected' : 'Disconnected'}
        </Badge>
      </div>

      {!config.is_connected ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Connect to Kaseya VSA
            </CardTitle>
            <CardDescription>
              Configure your Kaseya VSA connection to start monitoring endpoints
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="server-url">Kaseya Server URL</Label>
                <Input
                  id="server-url"
                  placeholder="https://your-kaseya-server.com"
                  value={config.server_url}
                  onChange={(e) => setConfig(prev => ({ ...prev, server_url: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="VSA Username"
                  value={config.username}
                  onChange={(e) => setConfig(prev => ({ ...prev, username: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="VSA Password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key (Optional)</Label>
                <Input
                  id="api-key"
                  placeholder="API Key for enhanced access"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={connectKaseya} disabled={connecting} className="flex-1">
                {connecting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Connect
                  </>
                )}
              </Button>
              
              <Button variant="outline" onClick={testConnection}>
                Test Connection
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="devices">Devices</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Endpoints</CardTitle>
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalEndpoints}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.onlineEndpoints} online, {stats.offlineEndpoints} offline
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{stats.criticalAlerts + stats.warningAlerts}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.criticalAlerts} critical, {stats.warningAlerts} warning
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Patches Required</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-500">{stats.patchesRequired}</div>
                  <p className="text-xs text-muted-foreground">
                    Security updates pending
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Health</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">98%</div>
                  <p className="text-xs text-muted-foreground">
                    Overall system health score
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <div className="flex-1">
                      <p className="font-medium">High CPU usage detected on SERVER-SQL01</p>
                      <p className="text-sm text-muted-foreground">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div className="flex-1">
                      <p className="font-medium">Patch deployment completed on 15 endpoints</p>
                      <p className="text-sm text-muted-foreground">1 hour ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <div className="flex-1">
                      <p className="font-medium">LAPTOP-XYZ789 went offline</p>
                      <p className="text-sm text-muted-foreground">3 hours ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="devices" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Managed Devices</h3>
              <Button onClick={syncData} disabled={syncing} variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Refresh'}
              </Button>
            </div>

            <div className="grid gap-4">
              {devices.map((device) => (
                <Card key={device.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(device.status)}
                        <div>
                          <h4 className="font-medium">{device.hostname}</h4>
                          <p className="text-sm text-muted-foreground">{device.ip_address}</p>
                          <p className="text-xs text-muted-foreground">{device.os_version}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="flex items-center gap-1">
                            <Cpu className="h-3 w-3" />
                            <span className="text-sm">{device.cpu_usage}%</span>
                          </div>
                          <Progress value={device.cpu_usage} className="w-16 h-2" />
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            <span className="text-sm">{device.memory_usage}%</span>
                          </div>
                          <Progress value={device.memory_usage} className="w-16 h-2" />
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            <span className="text-sm">{device.disk_usage}%</span>
                          </div>
                          <Progress value={device.disk_usage} className="w-16 h-2" />
                        </div>
                        
                        <Badge variant={device.status === 'online' ? 'default' : 
                                      device.status === 'warning' ? 'secondary' : 'destructive'}>
                          {device.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                  <Alert className="border-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Critical:</strong> SERVER-SQL01 disk usage at 95%
                    </AlertDescription>
                  </Alert>
                  
                  <Alert className="border-yellow-500">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Warning:</strong> High CPU usage on DESKTOP-ABC123
                    </AlertDescription>
                  </Alert>
                  
                  <Alert className="border-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Critical:</strong> LAPTOP-XYZ789 offline for 3+ hours
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Integration Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto Sync</Label>
                    <p className="text-sm text-muted-foreground">Automatically sync data from Kaseya VSA</p>
                  </div>
                  <Switch checked={config.sync_enabled} />
                </div>
                
                <div className="space-y-2">
                  <Label>Sync Frequency</Label>
                  <select className="w-full p-2 border rounded-md bg-background">
                    <option value="5min">Every 5 minutes</option>
                    <option value="15min">Every 15 minutes</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>
                
                <div className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    Last sync: {config.last_sync_at ? new Date(config.last_sync_at).toLocaleString() : 'Never'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default KaseyaDashboard;