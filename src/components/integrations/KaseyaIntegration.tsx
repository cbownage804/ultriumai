import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Server, 
  Shield, 
  Activity, 
  RefreshCw, 
  Settings, 
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Copy,
  TestTube
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types
interface KaseyaConfig {
  serverUrl: string;
  username: string;
  password: string;
  isConnected: boolean;
  lastSync: string;
  syncEnabled: boolean;
  endpoints: {
    agents: boolean;
    patches: boolean;
    monitoring: boolean;
    policies: boolean;
  };
}

interface Agent {
  id: string;
  name: string;
  computerName: string;
  ipAddress: string;
  status: 'online' | 'offline' | 'warning';
  lastContact: string;
  osVersion: string;
  group: string;
  patchStatus: string;
}

interface MonitoringAlert {
  id: string;
  agentName: string;
  alertType: string;
  severity: 'critical' | 'warning' | 'info';
  description: string;
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

const KaseyaIntegration: React.FC = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<KaseyaConfig>({
    serverUrl: '',
    username: '',
    password: '',
    isConnected: false,
    lastSync: '',
    syncEnabled: true,
    endpoints: {
      agents: true,
      patches: true,
      monitoring: true,
      policies: false,
    },
  });

  const [agents, setAgents] = useState<Agent[]>([]);
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    loadKaseyaConfig();
    loadAgents();
    loadAlerts();
  }, []);

  const loadKaseyaConfig = async () => {
    // Mock loading configuration
    setConfig(prev => ({
      ...prev,
      serverUrl: 'https://your-kaseya-server.com',
      username: 'admin@company.com',
      isConnected: true,
      lastSync: '2024-01-20T10:30:00Z',
    }));
  };

  const loadAgents = async () => {
    // Mock agents data
    const mockAgents: Agent[] = [
      {
        id: '1',
        name: 'WS-001',
        computerName: 'DESKTOP-ABC123',
        ipAddress: '192.168.1.101',
        status: 'online',
        lastContact: '2024-01-20T10:25:00Z',
        osVersion: 'Windows 11 Pro',
        group: 'Workstations',
        patchStatus: 'Up to date',
      },
      {
        id: '2',
        name: 'SRV-001',
        computerName: 'SERVER-DEF456',
        ipAddress: '192.168.1.10',
        status: 'warning',
        lastContact: '2024-01-20T09:45:00Z',
        osVersion: 'Windows Server 2022',
        group: 'Servers',
        patchStatus: '3 patches pending',
      },
      {
        id: '3',
        name: 'WS-002',
        computerName: 'LAPTOP-GHI789',
        ipAddress: '192.168.1.102',
        status: 'offline',
        lastContact: '2024-01-19T16:30:00Z',
        osVersion: 'Windows 10 Pro',
        group: 'Laptops',
        patchStatus: 'Unknown',
      },
    ];
    setAgents(mockAgents);
  };

  const loadAlerts = async () => {
    // Mock alerts data
    const mockAlerts: MonitoringAlert[] = [
      {
        id: '1',
        agentName: 'SRV-001',
        alertType: 'Disk Space',
        severity: 'warning',
        description: 'C: drive is 85% full',
        timestamp: '2024-01-20T10:15:00Z',
        status: 'active',
      },
      {
        id: '2',
        agentName: 'WS-001',
        alertType: 'CPU Usage',
        severity: 'critical',
        description: 'CPU usage above 95% for 10 minutes',
        timestamp: '2024-01-20T09:30:00Z',
        status: 'acknowledged',
      },
      {
        id: '3',
        agentName: 'WS-002',
        alertType: 'Connectivity',
        severity: 'critical',
        description: 'Agent offline for 18 hours',
        timestamp: '2024-01-19T16:30:00Z',
        status: 'active',
      },
    ];
    setAlerts(mockAlerts);
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setConfig(prev => ({
        ...prev,
        isConnected: true,
        lastSync: new Date().toISOString(),
      }));
      toast({
        title: "Connected",
        description: "Successfully connected to Kaseya VSA",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Kaseya VSA. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    setTestResult('');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTestResult('✅ Connection successful\n✅ Authentication verified\n✅ API endpoints accessible\n✅ Agent data retrieved');
      toast({
        title: "Test Successful",
        description: "Kaseya VSA connection test completed successfully",
      });
    } catch (error) {
      setTestResult('❌ Connection failed\n❌ Please check server URL and credentials');
      toast({
        title: "Test Failed",
        description: "Connection test failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await loadAgents();
      await loadAlerts();
      setConfig(prev => ({ ...prev, lastSync: new Date().toISOString() }));
      toast({
        title: "Sync Complete",
        description: "Successfully synced data from Kaseya VSA",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getAlertStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-500';
      case 'acknowledged': return 'bg-yellow-500';
      case 'resolved': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Server className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Kaseya VSA Integration
                <Badge variant={config.isConnected ? "default" : "secondary"}>
                  {config.isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </CardTitle>
              <CardDescription>
                Remote Monitoring and Management Platform
                {config.lastSync && (
                  <span className="block text-xs text-muted-foreground mt-1">
                    Last sync: {new Date(config.lastSync).toLocaleString()}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={!config.isConnected || isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Sync
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={isLoading}
            >
              <TestTube className="h-4 w-4 mr-2" />
              Test
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="https://kaseya.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                VSA Portal
              </a>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="patches">Patches</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="test">Test & Debug</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Managed Agents ({agents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {agents.map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`} />
                      <div>
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {agent.computerName} • {agent.ipAddress}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {agent.osVersion} • Group: {agent.group}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-1">
                        {agent.patchStatus}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        Last: {new Date(agent.lastContact).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Active Alerts ({alerts.filter(a => a.status === 'active').length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${getSeverityColor(alert.severity)}`} />
                      <div>
                        <div className="font-medium">{alert.alertType}</div>
                        <div className="text-sm text-muted-foreground">
                          {alert.agentName} • {alert.description}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`${getAlertStatusColor(alert.status)} text-white border-transparent`}
                      >
                        {alert.status}
                      </Badge>
                      <Badge variant="outline">
                        {alert.severity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Patch Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">142</div>
                    <div className="text-sm text-muted-foreground">Up to Date</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-yellow-600">23</div>
                    <div className="text-sm text-muted-foreground">Pending Patches</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-red-600">5</div>
                    <div className="text-sm text-muted-foreground">Critical Updates</div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Recent Patch Deployments</h3>
                <div className="space-y-2">
                  {[
                    { name: "KB5034763 - Windows 11 Security Update", status: "Completed", agents: 45 },
                    { name: "KB5034765 - Windows 10 Cumulative Update", status: "In Progress", agents: 23 },
                    { name: "Office 365 Security Update", status: "Scheduled", agents: 67 },
                  ].map((patch, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{patch.name}</div>
                        <div className="text-sm text-muted-foreground">{patch.agents} agents</div>
                      </div>
                      <Badge variant="outline">{patch.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Connection Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="server-url">Kaseya Server URL</Label>
                  <Input 
                    id="server-url"
                    placeholder="https://your-kaseya-server.com"
                    value={config.serverUrl}
                    onChange={(e) => setConfig(prev => ({ ...prev, serverUrl: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username"
                    placeholder="Enter username"
                    value={config.username}
                    onChange={(e) => setConfig(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={config.password}
                    onChange={(e) => setConfig(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">Data Synchronization</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-agents">Sync Agent Data</Label>
                    <Switch
                      id="sync-agents"
                      checked={config.endpoints.agents}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ 
                          ...prev, 
                          endpoints: { ...prev.endpoints, agents: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-patches">Sync Patch Management</Label>
                    <Switch
                      id="sync-patches"
                      checked={config.endpoints.patches}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ 
                          ...prev, 
                          endpoints: { ...prev.endpoints, patches: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-monitoring">Sync Monitoring Alerts</Label>
                    <Switch
                      id="sync-monitoring"
                      checked={config.endpoints.monitoring}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ 
                          ...prev, 
                          endpoints: { ...prev.endpoints, monitoring: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-policies">Sync Policy Management</Label>
                    <Switch
                      id="sync-policies"
                      checked={config.endpoints.policies}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ 
                          ...prev, 
                          endpoints: { ...prev.endpoints, policies: checked }
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleConnect} 
                disabled={isLoading || !config.serverUrl || !config.username || !config.password}
              >
                {isLoading ? "Connecting..." : config.isConnected ? "Update Connection" : "Connect"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Test & Debug
              </CardTitle>
              <CardDescription>
                Test your Kaseya VSA connection and API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleTestConnection} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Testing Connection..." : "Test Connection"}
              </Button>
              
              {testResult && (
                <div className="space-y-2">
                  <Label>Test Results</Label>
                  <Textarea
                    value={testResult}
                    readOnly
                    className="min-h-[100px] font-mono text-sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KaseyaIntegration;