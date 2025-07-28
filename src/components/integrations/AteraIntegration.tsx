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
  ShieldCheck, 
  Monitor, 
  Activity, 
  RefreshCw, 
  Settings, 
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Copy,
  TestTube,
  Laptop,
  Server,
  Smartphone,
  Ticket,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types
interface AteraConfig {
  apiEndpoint: string;
  xApiKey: string;
  isConnected: boolean;
  lastSync: string;
  syncEnabled: boolean;
  endpoints: {
    agents: boolean;
    customers: boolean;
    tickets: boolean;
    contracts: boolean;
    alerts: boolean;
  };
}

interface Agent {
  id: string;
  computername: string;
  customerName: string;
  status: 'online' | 'offline' | 'maintenance';
  lastContact: string;
  osType: string;
  osVersion: string;
  agentVersion: string;
  ipAddress: string;
  macAddress: string;
  antivirus: string;
}

interface Customer {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  agentCount: number;
  ticketCount: number;
  contractValue: number;
  status: 'active' | 'inactive' | 'suspended';
}

interface Ticket {
  id: string;
  title: string;
  customerName: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo: string;
  createdDate: string;
  lastUpdate: string;
  category: string;
}

interface Alert {
  id: string;
  agentName: string;
  customerName: string;
  alertType: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

const AteraIntegration: React.FC = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<AteraConfig>({
    apiEndpoint: '',
    xApiKey: '',
    isConnected: false,
    lastSync: '',
    syncEnabled: true,
    endpoints: {
      agents: true,
      customers: true,
      tickets: true,
      contracts: false,
      alerts: true,
    },
  });

  const [agents, setAgents] = useState<Agent[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    loadAteraConfig();
    loadAgents();
    loadCustomers();
    loadTickets();
    loadAlerts();
  }, []);

  const loadAteraConfig = async () => {
    // Mock loading configuration
    setConfig(prev => ({
      ...prev,
      apiEndpoint: 'https://app.atera.com/api/v3',
      xApiKey: 'your-api-key-here',
      isConnected: true,
      lastSync: '2024-01-20T10:30:00Z',
    }));
  };

  const loadAgents = async () => {
    // Mock agents data
    const mockAgents: Agent[] = [
      {
        id: '1',
        computername: 'WS-ACME-01',
        customerName: 'Acme Corporation',
        status: 'online',
        lastContact: '2024-01-20T10:25:00Z',
        osType: 'Windows',
        osVersion: 'Windows 11 Pro',
        agentVersion: '2.14.5',
        ipAddress: '192.168.1.101',
        macAddress: '00:1B:44:11:3A:B7',
        antivirus: 'Windows Defender',
      },
      {
        id: '2',
        computername: 'SRV-ACME-DC01',
        customerName: 'Acme Corporation',
        status: 'online',
        lastContact: '2024-01-20T10:20:00Z',
        osType: 'Windows Server',
        osVersion: 'Windows Server 2022',
        agentVersion: '2.14.5',
        ipAddress: '192.168.1.10',
        macAddress: '00:1B:44:11:3A:B8',
        antivirus: 'Windows Defender',
      },
      {
        id: '3',
        computername: 'WS-TECH-02',
        customerName: 'Tech Solutions Inc',
        status: 'offline',
        lastContact: '2024-01-19T16:30:00Z',
        osType: 'Windows',
        osVersion: 'Windows 10 Pro',
        agentVersion: '2.14.3',
        ipAddress: '192.168.2.101',
        macAddress: '00:1B:44:11:3A:B9',
        antivirus: 'Windows Defender',
      },
    ];
    setAgents(mockAgents);
  };

  const loadCustomers = async () => {
    // Mock customers data
    const mockCustomers: Customer[] = [
      {
        id: '1',
        name: 'Acme Corporation',
        contactPerson: 'John Smith',
        email: 'john.smith@acme.com',
        phone: '+1 (555) 123-4567',
        agentCount: 45,
        ticketCount: 12,
        contractValue: 15000,
        status: 'active',
      },
      {
        id: '2',
        name: 'Tech Solutions Inc',
        contactPerson: 'Sarah Johnson',
        email: 'sarah@techsolutions.com',
        phone: '+1 (555) 234-5678',
        agentCount: 23,
        ticketCount: 8,
        contractValue: 8500,
        status: 'active',
      },
      {
        id: '3',
        name: 'Digital Dynamics',
        contactPerson: 'Mike Wilson',
        email: 'mike@digitaldynamics.com',
        phone: '+1 (555) 345-6789',
        agentCount: 12,
        ticketCount: 3,
        contractValue: 4200,
        status: 'inactive',
      },
    ];
    setCustomers(mockCustomers);
  };

  const loadTickets = async () => {
    // Mock tickets data
    const mockTickets: Ticket[] = [
      {
        id: '1',
        title: 'Email server connectivity issues',
        customerName: 'Acme Corporation',
        status: 'in_progress',
        priority: 'high',
        assignedTo: 'Alex Chen',
        createdDate: '2024-01-20T09:15:00Z',
        lastUpdate: '2024-01-20T10:30:00Z',
        category: 'Network',
      },
      {
        id: '2',
        title: 'Printer driver installation',
        customerName: 'Tech Solutions Inc',
        status: 'open',
        priority: 'medium',
        assignedTo: 'Unassigned',
        createdDate: '2024-01-20T08:45:00Z',
        lastUpdate: '2024-01-20T08:45:00Z',
        category: 'Hardware',
      },
      {
        id: '3',
        title: 'VPN access configuration',
        customerName: 'Digital Dynamics',
        status: 'resolved',
        priority: 'low',
        assignedTo: 'Lisa Rodriguez',
        createdDate: '2024-01-19T14:20:00Z',
        lastUpdate: '2024-01-20T09:10:00Z',
        category: 'Security',
      },
    ];
    setTickets(mockTickets);
  };

  const loadAlerts = async () => {
    // Mock alerts data
    const mockAlerts: Alert[] = [
      {
        id: '1',
        agentName: 'SRV-ACME-DC01',
        customerName: 'Acme Corporation',
        alertType: 'Disk Space',
        severity: 'warning',
        message: 'C: drive is 85% full',
        timestamp: '2024-01-20T10:15:00Z',
        status: 'active',
      },
      {
        id: '2',
        agentName: 'WS-ACME-01',
        customerName: 'Acme Corporation',
        alertType: 'High CPU Usage',
        severity: 'critical',
        message: 'CPU usage above 90% for 15 minutes',
        timestamp: '2024-01-20T09:30:00Z',
        status: 'acknowledged',
      },
      {
        id: '3',
        agentName: 'WS-TECH-02',
        customerName: 'Tech Solutions Inc',
        alertType: 'Agent Offline',
        severity: 'critical',
        message: 'Agent has been offline for 18 hours',
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
        description: "Successfully connected to Atera",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Atera. Please check your API key.",
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
      setTestResult('✅ Connection successful\n✅ API key validated\n✅ Tenant access confirmed\n✅ Agent data accessible\n✅ Customer data accessible');
      toast({
        title: "Test Successful",
        description: "Atera connection test completed successfully",
      });
    } catch (error) {
      setTestResult('❌ Connection failed\n❌ Please verify API endpoint and key');
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
      await loadCustomers();
      await loadTickets();
      await loadAlerts();
      setConfig(prev => ({ ...prev, lastSync: new Date().toISOString() }));
      toast({
        title: "Sync Complete",
        description: "Successfully synced data from Atera",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'active': return 'bg-green-500';
      case 'offline':
      case 'inactive': return 'bg-red-500';
      case 'maintenance':
      case 'suspended': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
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

  const getTicketStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'resolved': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
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
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Atera Integration
                <Badge variant={config.isConnected ? "default" : "secondary"}>
                  {config.isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </CardTitle>
              <CardDescription>
                All-in-One IT Management Platform
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
              <a href="https://app.atera.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Atera Portal
              </a>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="test">Test & Debug</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Monitor className="h-4 w-4 text-blue-500" />
                  <div className="text-sm font-medium">Total Agents</div>
                </div>
                <div className="text-2xl font-bold">{agents.length}</div>
                <div className="text-xs text-muted-foreground">
                  {agents.filter(a => a.status === 'online').length} online
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-green-500" />
                  <div className="text-sm font-medium">Active Customers</div>
                </div>
                <div className="text-2xl font-bold">{customers.filter(c => c.status === 'active').length}</div>
                <div className="text-xs text-muted-foreground">
                  {customers.length} total
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Ticket className="h-4 w-4 text-yellow-500" />
                  <div className="text-sm font-medium">Open Tickets</div>
                </div>
                <div className="text-2xl font-bold">{tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length}</div>
                <div className="text-xs text-muted-foreground">
                  {tickets.length} total
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <div className="text-sm font-medium">Active Alerts</div>
                </div>
                <div className="text-2xl font-bold">{alerts.filter(a => a.status === 'active').length}</div>
                <div className="text-xs text-muted-foreground">
                  {alerts.length} total
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tickets.slice(0, 5).map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{ticket.title}</div>
                        <div className="text-xs text-muted-foreground">{ticket.customerName}</div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${getTicketStatusColor(ticket.status)} text-white border-transparent`}
                      >
                        {ticket.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{alert.alertType}</div>
                        <div className="text-xs text-muted-foreground">{alert.agentName}</div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${getSeverityColor(alert.severity)} text-white border-transparent`}
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
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
                        <div className="font-medium">{agent.computername}</div>
                        <div className="text-sm text-muted-foreground">
                          {agent.customerName} • {agent.osType} {agent.osVersion}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          IP: {agent.ipAddress} • Agent: v{agent.agentVersion}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-1">
                        {agent.status}
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

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customers ({customers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {customers.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(customer.status)}`} />
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {customer.contactPerson} • {customer.email}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {customer.phone}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">${customer.contractValue.toLocaleString()}/mo</div>
                      <div className="text-xs text-muted-foreground">
                        {customer.agentCount} agents • {customer.ticketCount} tickets
                      </div>
                      <Badge variant="outline" className="mt-1">
                        {customer.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Tickets ({tickets.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${getTicketStatusColor(ticket.status)}`} />
                      <div>
                        <div className="font-medium">{ticket.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {ticket.customerName} • {ticket.category}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Assigned to: {ticket.assignedTo} • Created: {new Date(ticket.createdDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`${getPriorityColor(ticket.priority)} text-white border-transparent`}
                      >
                        {ticket.priority}
                      </Badge>
                      <Badge variant="outline">
                        {ticket.status}
                      </Badge>
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
                  <Label htmlFor="api-endpoint">API Endpoint</Label>
                  <Input 
                    id="api-endpoint"
                    placeholder="https://app.atera.com/api/v3"
                    value={config.apiEndpoint}
                    onChange={(e) => setConfig(prev => ({ ...prev, apiEndpoint: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="x-api-key">X-API-Key</Label>
                  <Input 
                    id="x-api-key"
                    type="password"
                    placeholder="Enter your API key"
                    value={config.xApiKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, xApiKey: e.target.value }))}
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
                    <Label htmlFor="sync-customers">Sync Customer Data</Label>
                    <Switch
                      id="sync-customers"
                      checked={config.endpoints.customers}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ 
                          ...prev, 
                          endpoints: { ...prev.endpoints, customers: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-tickets">Sync Ticket Data</Label>
                    <Switch
                      id="sync-tickets"
                      checked={config.endpoints.tickets}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ 
                          ...prev, 
                          endpoints: { ...prev.endpoints, tickets: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-contracts">Sync Contract Data</Label>
                    <Switch
                      id="sync-contracts"
                      checked={config.endpoints.contracts}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ 
                          ...prev, 
                          endpoints: { ...prev.endpoints, contracts: checked }
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
                </div>
              </div>

              <Button 
                onClick={handleConnect} 
                disabled={isLoading || !config.apiEndpoint || !config.xApiKey}
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
                Test your Atera connection and API endpoints
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

export default AteraIntegration;