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
  Zap, 
  Monitor, 
  Activity, 
  RefreshCw, 
  Settings, 
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Copy,
  TestTube,
  Laptop,
  Server,
  Smartphone
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types
interface NinjaConfig {
  instanceUrl: string;
  accessKey: string;
  secretKey: string;
  isConnected: boolean;
  lastSync: string;
  syncEnabled: boolean;
  endpoints: {
    devices: boolean;
    policies: boolean;
    software: boolean;
    alerts: boolean;
    scripts: boolean;
  };
}

interface Device {
  id: string;
  name: string;
  type: 'workstation' | 'server' | 'mobile';
  status: 'online' | 'offline' | 'pending';
  lastContact: string;
  osName: string;
  osVersion: string;
  antivirus: string;
  policyName: string;
  publicIp: string;
  organization: string;
}

interface Alert {
  id: string;
  deviceName: string;
  alertType: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  status: 'active' | 'resolved';
}

interface AutomationScript {
  id: string;
  name: string;
  category: string;
  description: string;
  lastRun: string;
  executions: number;
  status: 'active' | 'draft' | 'archived';
}

const NinjaRMMIntegration: React.FC = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<NinjaConfig>({
    instanceUrl: '',
    accessKey: '',
    secretKey: '',
    isConnected: false,
    lastSync: '',
    syncEnabled: true,
    endpoints: {
      devices: true,
      policies: true,
      software: true,
      alerts: true,
      scripts: false,
    },
  });

  const [devices, setDevices] = useState<Device[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [scripts, setScripts] = useState<AutomationScript[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    loadNinjaConfig();
    loadDevices();
    loadAlerts();
    loadScripts();
  }, []);

  const loadNinjaConfig = async () => {
    // Mock loading configuration
    setConfig(prev => ({
      ...prev,
      instanceUrl: 'https://app.ninjarmm.com',
      accessKey: 'NNJA_xxxxxxxxxxxxxxxxx',
      isConnected: true,
      lastSync: '2024-01-20T10:30:00Z',
    }));
  };

  const loadDevices = async () => {
    // Mock devices data
    const mockDevices: Device[] = [
      {
        id: '1',
        name: 'DESKTOP-ABC123',
        type: 'workstation',
        status: 'online',
        lastContact: '2024-01-20T10:25:00Z',
        osName: 'Windows',
        osVersion: '11 Pro 22H2',
        antivirus: 'Windows Defender',
        policyName: 'Standard Workstation Policy',
        publicIp: '203.0.113.1',
        organization: 'Acme Corp',
      },
      {
        id: '2',
        name: 'SERVER-DEF456',
        type: 'server',
        status: 'online',
        lastContact: '2024-01-20T10:20:00Z',
        osName: 'Windows Server',
        osVersion: '2022 Standard',
        antivirus: 'Windows Defender',
        policyName: 'Server Monitoring Policy',
        publicIp: '203.0.113.2',
        organization: 'Acme Corp',
      },
      {
        id: '3',
        name: 'LAPTOP-GHI789',
        type: 'workstation',
        status: 'offline',
        lastContact: '2024-01-19T16:30:00Z',
        osName: 'Windows',
        osVersion: '10 Pro 22H2',
        antivirus: 'Windows Defender',
        policyName: 'Mobile Device Policy',
        publicIp: '203.0.113.3',
        organization: 'Acme Corp',
      },
      {
        id: '4',
        name: 'iPhone-JKL012',
        type: 'mobile',
        status: 'pending',
        lastContact: '2024-01-20T09:15:00Z',
        osName: 'iOS',
        osVersion: '17.2.1',
        antivirus: 'Built-in',
        policyName: 'iOS Mobile Policy',
        publicIp: '203.0.113.4',
        organization: 'Acme Corp',
      },
    ];
    setDevices(mockDevices);
  };

  const loadAlerts = async () => {
    // Mock alerts data
    const mockAlerts: Alert[] = [
      {
        id: '1',
        deviceName: 'SERVER-DEF456',
        alertType: 'Disk Space',
        severity: 'warning',
        message: 'C: drive is 88% full (177 GB free of 1.5 TB)',
        timestamp: '2024-01-20T10:15:00Z',
        status: 'active',
      },
      {
        id: '2',
        deviceName: 'DESKTOP-ABC123',
        alertType: 'Memory Usage',
        severity: 'critical',
        message: 'Memory usage is 95% (15.2 GB of 16 GB used)',
        timestamp: '2024-01-20T09:30:00Z',
        status: 'active',
      },
      {
        id: '3',
        deviceName: 'LAPTOP-GHI789',
        alertType: 'Agent Offline',
        severity: 'critical',
        message: 'Device has been offline for 18 hours',
        timestamp: '2024-01-19T16:30:00Z',
        status: 'active',
      },
    ];
    setAlerts(mockAlerts);
  };

  const loadScripts = async () => {
    // Mock scripts data
    const mockScripts: AutomationScript[] = [
      {
        id: '1',
        name: 'Windows Update Check',
        category: 'Maintenance',
        description: 'Checks for and installs Windows updates',
        lastRun: '2024-01-20T02:00:00Z',
        executions: 1247,
        status: 'active',
      },
      {
        id: '2',
        name: 'Disk Cleanup',
        category: 'Maintenance',
        description: 'Clears temporary files and system cache',
        lastRun: '2024-01-19T22:30:00Z',
        executions: 3421,
        status: 'active',
      },
      {
        id: '3',
        name: 'Security Scan',
        category: 'Security',
        description: 'Performs comprehensive security assessment',
        lastRun: '2024-01-20T06:00:00Z',
        executions: 892,
        status: 'active',
      },
    ];
    setScripts(mockScripts);
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
        description: "Successfully connected to NinjaRMM",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to NinjaRMM. Please check your credentials.",
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
      setTestResult('✅ Connection successful\n✅ API authentication verified\n✅ Organization access confirmed\n✅ Device data accessible\n✅ Automation scripts available');
      toast({
        title: "Test Successful",
        description: "NinjaRMM connection test completed successfully",
      });
    } catch (error) {
      setTestResult('❌ Connection failed\n❌ Please verify instance URL and API keys');
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
      await loadDevices();
      await loadAlerts();
      await loadScripts();
      setConfig(prev => ({ ...prev, lastSync: new Date().toISOString() }));
      toast({
        title: "Sync Complete",
        description: "Successfully synced data from NinjaRMM",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'server': return <Server className="h-4 w-4" />;
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      default: return <Laptop className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
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

  const getScriptStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'draft': return 'bg-yellow-500';
      case 'archived': return 'bg-gray-500';
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
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                NinjaRMM Integration
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
              <a href="https://app.ninjarmm.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                NinjaRMM Portal
              </a>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="test">Test & Debug</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Managed Devices ({devices.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {devices.map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(device.type)}
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(device.status)}`} />
                      </div>
                      <div>
                        <div className="font-medium">{device.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {device.osName} {device.osVersion} • {device.organization}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Policy: {device.policyName} • AV: {device.antivirus}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-1">
                        {device.status}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        Last: {new Date(device.lastContact).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        IP: {device.publicIp}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
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
                          {alert.deviceName} • {alert.message}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`${getSeverityColor(alert.severity)} text-white border-transparent`}
                      >
                        {alert.severity}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Resolve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Automation Scripts ({scripts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scripts.map((script) => (
                  <div key={script.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${getScriptStatusColor(script.status)}`} />
                      <div>
                        <div className="font-medium">{script.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {script.description}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Last run: {new Date(script.lastRun).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-1">
                        {script.category}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {script.executions} executions
                      </div>
                      <div className="flex gap-1 mt-1">
                        <Button variant="outline" size="sm">
                          Run
                        </Button>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
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
                  <Label htmlFor="instance-url">Instance URL</Label>
                  <Input 
                    id="instance-url"
                    placeholder="https://app.ninjarmm.com"
                    value={config.instanceUrl}
                    onChange={(e) => setConfig(prev => ({ ...prev, instanceUrl: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="access-key">Access Key</Label>
                  <Input 
                    id="access-key"
                    placeholder="NNJA_xxxxxxxxxxxxxxxxx"
                    value={config.accessKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, accessKey: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="secret-key">Secret Key</Label>
                  <Input 
                    id="secret-key"
                    type="password"
                    placeholder="Enter secret key"
                    value={config.secretKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, secretKey: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">Data Synchronization</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-devices">Sync Device Information</Label>
                    <Switch
                      id="sync-devices"
                      checked={config.endpoints.devices}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ 
                          ...prev, 
                          endpoints: { ...prev.endpoints, devices: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-policies">Sync Policy Data</Label>
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-software">Sync Software Inventory</Label>
                    <Switch
                      id="sync-software"
                      checked={config.endpoints.software}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ 
                          ...prev, 
                          endpoints: { ...prev.endpoints, software: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-alerts">Sync Alert Data</Label>
                    <Switch
                      id="sync-alerts"
                      checked={config.endpoints.alerts}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ 
                          ...prev, 
                          endpoints: { ...prev.endpoints, alerts: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-scripts">Sync Automation Scripts</Label>
                    <Switch
                      id="sync-scripts"
                      checked={config.endpoints.scripts}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ 
                          ...prev, 
                          endpoints: { ...prev.endpoints, scripts: checked }
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleConnect} 
                disabled={isLoading || !config.instanceUrl || !config.accessKey || !config.secretKey}
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
                Test your NinjaRMM connection and API endpoints
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

export default NinjaRMMIntegration;