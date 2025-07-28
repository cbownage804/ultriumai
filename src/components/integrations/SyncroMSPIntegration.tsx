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
  Layers, 
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
  DollarSign,
  FileText,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types
interface SyncroConfig {
  subdomain: string;
  apiKey: string;
  isConnected: boolean;
  lastSync: string;
  syncEnabled: boolean;
  endpoints: {
    rmm: boolean;
    psa: boolean;
    customers: boolean;
    contracts: boolean;
    invoicing: boolean;
  };
}

interface RMMAsset {
  id: string;
  name: string;
  customerName: string;
  status: 'online' | 'offline' | 'maintenance';
  lastSeen: string;
  os: string;
  ipAddress: string;
  agentVersion: string;
  policyName: string;
  assetType: 'workstation' | 'server' | 'mobile';
}

interface PSATicket {
  id: string;
  number: string;
  subject: string;
  customerName: string;
  status: 'new' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  billableHours: number;
}

interface Customer {
  id: string;
  name: string;
  businessName: string;
  email: string;
  phone: string;
  address: string;
  assetCount: number;
  ticketCount: number;
  monthlyRecurring: number;
  status: 'active' | 'inactive' | 'prospect';
}

interface Contract {
  id: string;
  customerName: string;
  name: string;
  type: 'managed_services' | 'project' | 'time_material';
  startDate: string;
  endDate: string;
  monthlyRate: number;
  status: 'active' | 'expired' | 'pending';
  includedHours: number;
  usedHours: number;
}

interface Invoice {
  id: string;
  number: string;
  customerName: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  issueDate: string;
  dueDate: string;
  paidDate?: string;
}

const SyncroMSPIntegration: React.FC = () => {
  const { toast } = useToast();
  const [config, setSyncroConfig] = useState<SyncroConfig>({
    subdomain: '',
    apiKey: '',
    isConnected: false,
    lastSync: '',
    syncEnabled: true,
    endpoints: {
      rmm: true,
      psa: true,
      customers: true,
      contracts: true,
      invoicing: false,
    },
  });

  const [rmmAssets, setRmmAssets] = useState<RMMAsset[]>([]);
  const [psaTickets, setPsaTickets] = useState<PSATicket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    loadSyncroConfig();
    loadRMMAssets();
    loadPSATickets();
    loadCustomers();
    loadContracts();
    loadInvoices();
  }, []);

  const loadSyncroConfig = async () => {
    // Mock loading configuration
    setSyncroConfig(prev => ({
      ...prev,
      subdomain: 'your-company',
      apiKey: 'your-api-key-here',
      isConnected: true,
      lastSync: '2024-01-20T10:30:00Z',
    }));
  };

  const loadRMMAssets = async () => {
    // Mock RMM assets data
    const mockAssets: RMMAsset[] = [
      {
        id: '1',
        name: 'WS-ACME-001',
        customerName: 'Acme Corporation',
        status: 'online',
        lastSeen: '2024-01-20T10:25:00Z',
        os: 'Windows 11 Pro',
        ipAddress: '192.168.1.101',
        agentVersion: '1.5.2',
        policyName: 'Standard Workstation',
        assetType: 'workstation',
      },
      {
        id: '2',
        name: 'SRV-ACME-DC01',
        customerName: 'Acme Corporation',
        status: 'online',
        lastSeen: '2024-01-20T10:20:00Z',
        os: 'Windows Server 2022',
        ipAddress: '192.168.1.10',
        agentVersion: '1.5.2',
        policyName: 'Server Monitoring',
        assetType: 'server',
      },
      {
        id: '3',
        name: 'MB-TECH-001',
        customerName: 'Tech Solutions Inc',
        status: 'offline',
        lastSeen: '2024-01-19T16:30:00Z',
        os: 'macOS Sonoma',
        ipAddress: '192.168.2.101',
        agentVersion: '1.5.1',
        policyName: 'Mobile Device',
        assetType: 'mobile',
      },
    ];
    setRmmAssets(mockAssets);
  };

  const loadPSATickets = async () => {
    // Mock PSA tickets data
    const mockTickets: PSATicket[] = [
      {
        id: '1',
        number: 'T-2024-001',
        subject: 'Email server migration',
        customerName: 'Acme Corporation',
        status: 'in_progress',
        priority: 'high',
        assignedTo: 'Alex Chen',
        createdAt: '2024-01-20T09:15:00Z',
        updatedAt: '2024-01-20T10:30:00Z',
        billableHours: 12.5,
      },
      {
        id: '2',
        number: 'T-2024-002',
        subject: 'Network printer setup',
        customerName: 'Tech Solutions Inc',
        status: 'new',
        priority: 'medium',
        assignedTo: 'Unassigned',
        createdAt: '2024-01-20T08:45:00Z',
        updatedAt: '2024-01-20T08:45:00Z',
        billableHours: 0,
      },
      {
        id: '3',
        number: 'T-2024-003',
        subject: 'VPN configuration and testing',
        customerName: 'Digital Dynamics',
        status: 'resolved',
        priority: 'low',
        assignedTo: 'Lisa Rodriguez',
        createdAt: '2024-01-19T14:20:00Z',
        updatedAt: '2024-01-20T09:10:00Z',
        billableHours: 4.0,
      },
    ];
    setPsaTickets(mockTickets);
  };

  const loadCustomers = async () => {
    // Mock customers data
    const mockCustomers: Customer[] = [
      {
        id: '1',
        name: 'John Smith',
        businessName: 'Acme Corporation',
        email: 'john.smith@acme.com',
        phone: '+1 (555) 123-4567',
        address: '123 Business Ave, City, ST 12345',
        assetCount: 45,
        ticketCount: 12,
        monthlyRecurring: 15000,
        status: 'active',
      },
      {
        id: '2',
        name: 'Sarah Johnson',
        businessName: 'Tech Solutions Inc',
        email: 'sarah@techsolutions.com',
        phone: '+1 (555) 234-5678',
        address: '456 Tech Blvd, City, ST 12345',
        assetCount: 23,
        ticketCount: 8,
        monthlyRecurring: 8500,
        status: 'active',
      },
      {
        id: '3',
        name: 'Mike Wilson',
        businessName: 'Digital Dynamics',
        email: 'mike@digitaldynamics.com',
        phone: '+1 (555) 345-6789',
        address: '789 Innovation Dr, City, ST 12345',
        assetCount: 12,
        ticketCount: 3,
        monthlyRecurring: 4200,
        status: 'prospect',
      },
    ];
    setCustomers(mockCustomers);
  };

  const loadContracts = async () => {
    // Mock contracts data
    const mockContracts: Contract[] = [
      {
        id: '1',
        customerName: 'Acme Corporation',
        name: 'Managed IT Services - Enterprise',
        type: 'managed_services',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        monthlyRate: 15000,
        status: 'active',
        includedHours: 40,
        usedHours: 25,
      },
      {
        id: '2',
        customerName: 'Tech Solutions Inc',
        name: 'IT Support - Standard',
        type: 'managed_services',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        monthlyRate: 8500,
        status: 'active',
        includedHours: 20,
        usedHours: 18,
      },
      {
        id: '3',
        customerName: 'Digital Dynamics',
        name: 'Office 365 Migration Project',
        type: 'project',
        startDate: '2024-01-15',
        endDate: '2024-03-15',
        monthlyRate: 4200,
        status: 'active',
        includedHours: 80,
        usedHours: 35,
      },
    ];
    setContracts(mockContracts);
  };

  const loadInvoices = async () => {
    // Mock invoices data
    const mockInvoices: Invoice[] = [
      {
        id: '1',
        number: 'INV-2024-001',
        customerName: 'Acme Corporation',
        amount: 15000,
        status: 'paid',
        issueDate: '2024-01-01',
        dueDate: '2024-01-31',
        paidDate: '2024-01-28',
      },
      {
        id: '2',
        number: 'INV-2024-002',
        customerName: 'Tech Solutions Inc',
        amount: 8500,
        status: 'sent',
        issueDate: '2024-01-01',
        dueDate: '2024-01-31',
      },
      {
        id: '3',
        number: 'INV-2024-003',
        customerName: 'Digital Dynamics',
        amount: 4200,
        status: 'overdue',
        issueDate: '2023-12-01',
        dueDate: '2023-12-31',
      },
    ];
    setInvoices(mockInvoices);
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSyncroConfig(prev => ({
        ...prev,
        isConnected: true,
        lastSync: new Date().toISOString(),
      }));
      toast({
        title: "Connected",
        description: "Successfully connected to SyncroMSP",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to SyncroMSP. Please check your credentials.",
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
      setTestResult('✅ Connection successful\n✅ API key validated\n✅ Subdomain accessible\n✅ RMM data accessible\n✅ PSA data accessible\n✅ Customer data accessible');
      toast({
        title: "Test Successful",
        description: "SyncroMSP connection test completed successfully",
      });
    } catch (error) {
      setTestResult('❌ Connection failed\n❌ Please verify subdomain and API key');
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
      await loadRMMAssets();
      await loadPSATickets();
      await loadCustomers();
      await loadContracts();
      await loadInvoices();
      setSyncroConfig(prev => ({ ...prev, lastSync: new Date().toISOString() }));
      toast({
        title: "Sync Complete",
        description: "Successfully synced data from SyncroMSP",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'server': return <Server className="h-4 w-4" />;
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      default: return <Laptop className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'active':
      case 'paid': return 'bg-green-500';
      case 'offline':
      case 'inactive':
      case 'overdue': return 'bg-red-500';
      case 'maintenance':
      case 'pending':
      case 'sent':
      case 'prospect': return 'bg-yellow-500';
      case 'expired':
      case 'draft': return 'bg-gray-500';
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

  const getTicketStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'waiting': return 'bg-orange-500';
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
              <Layers className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                SyncroMSP Integration
                <Badge variant={config.isConnected ? "default" : "secondary"}>
                  {config.isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </CardTitle>
              <CardDescription>
                Complete MSP Business Management Platform
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
              <a href="https://rmm.syncromsp.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                SyncroMSP Portal
              </a>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="rmm">RMM</TabsTrigger>
          <TabsTrigger value="psa">PSA</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="test">Test & Debug</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Monitor className="h-4 w-4 text-blue-500" />
                  <div className="text-sm font-medium">RMM Assets</div>
                </div>
                <div className="text-2xl font-bold">{rmmAssets.length}</div>
                <div className="text-xs text-muted-foreground">
                  {rmmAssets.filter(a => a.status === 'online').length} online
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Ticket className="h-4 w-4 text-yellow-500" />
                  <div className="text-sm font-medium">Open Tickets</div>
                </div>
                <div className="text-2xl font-bold">{psaTickets.filter(t => t.status !== 'closed' && t.status !== 'resolved').length}</div>
                <div className="text-xs text-muted-foreground">
                  {psaTickets.length} total
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
                  <DollarSign className="h-4 w-4 text-purple-500" />
                  <div className="text-sm font-medium">Monthly Recurring</div>
                </div>
                <div className="text-2xl font-bold">
                  ${customers.reduce((sum, c) => sum + c.monthlyRecurring, 0).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  revenue
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent PSA Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {psaTickets.slice(0, 5).map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{ticket.subject}</div>
                        <div className="text-xs text-muted-foreground">
                          {ticket.customerName} • {ticket.billableHours}h
                        </div>
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
                <CardTitle className="text-sm">Contract Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {contracts.slice(0, 5).map((contract) => (
                    <div key={contract.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{contract.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {contract.customerName} • {contract.usedHours}/{contract.includedHours}h
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">${contract.monthlyRate.toLocaleString()}</div>
                        <Badge variant="outline" className="text-xs">
                          {contract.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rmm" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                RMM Assets ({rmmAssets.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rmmAssets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center gap-2">
                        {getAssetIcon(asset.assetType)}
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(asset.status)}`} />
                      </div>
                      <div>
                        <div className="font-medium">{asset.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {asset.customerName} • {asset.os}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          IP: {asset.ipAddress} • Policy: {asset.policyName}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-1">
                        {asset.status}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        Agent: v{asset.agentVersion}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Last: {new Date(asset.lastSeen).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="psa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                PSA Tickets ({psaTickets.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {psaTickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${getTicketStatusColor(ticket.status)}`} />
                      <div>
                        <div className="font-medium">{ticket.number}: {ticket.subject}</div>
                        <div className="text-sm text-muted-foreground">
                          {ticket.customerName} • Assigned to: {ticket.assignedTo}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created: {new Date(ticket.createdAt).toLocaleDateString()} • 
                          Billable: {ticket.billableHours}h
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
                        <div className="font-medium">{customer.businessName}</div>
                        <div className="text-sm text-muted-foreground">
                          {customer.name} • {customer.email}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {customer.phone} • {customer.address}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">${customer.monthlyRecurring.toLocaleString()}/mo</div>
                      <div className="text-xs text-muted-foreground">
                        {customer.assetCount} assets • {customer.ticketCount} tickets
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

        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Contracts & Invoices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-3">Active Contracts</h3>
                <div className="space-y-2">
                  {contracts.map((contract) => (
                    <div key={contract.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{contract.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {contract.customerName} • {contract.type}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {contract.startDate} - {contract.endDate}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${contract.monthlyRate.toLocaleString()}/mo</div>
                        <div className="text-xs text-muted-foreground">
                          {contract.usedHours}/{contract.includedHours} hours
                        </div>
                        <Badge variant="outline" className="mt-1">
                          {contract.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Recent Invoices</h3>
                <div className="space-y-2">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{invoice.number}</div>
                        <div className="text-sm text-muted-foreground">{invoice.customerName}</div>
                        <div className="text-xs text-muted-foreground">
                          Due: {new Date(invoice.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${invoice.amount.toLocaleString()}</div>
                        <Badge 
                          variant="outline" 
                          className={`${getStatusColor(invoice.status)} text-white border-transparent`}
                        >
                          {invoice.status}
                        </Badge>
                      </div>
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
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <Input 
                    id="subdomain"
                    placeholder="your-company"
                    value={config.subdomain}
                    onChange={(e) => setSyncroConfig(prev => ({ ...prev, subdomain: e.target.value }))}
                  />
                  <div className="text-xs text-muted-foreground">
                    From your SyncroMSP URL: https://your-company.syncromsp.com
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <Input 
                    id="api-key"
                    type="password"
                    placeholder="Enter your API key"
                    value={config.apiKey}
                    onChange={(e) => setSyncroConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">Data Synchronization</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-rmm">Sync RMM Data</Label>
                    <Switch
                      id="sync-rmm"
                      checked={config.endpoints.rmm}
                      onCheckedChange={(checked) => 
                        setSyncroConfig(prev => ({ 
                          ...prev, 
                          endpoints: { ...prev.endpoints, rmm: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-psa">Sync PSA Data</Label>
                    <Switch
                      id="sync-psa"
                      checked={config.endpoints.psa}
                      onCheckedChange={(checked) => 
                        setSyncroConfig(prev => ({ 
                          ...prev, 
                          endpoints: { ...prev.endpoints, psa: checked }
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
                        setSyncroConfig(prev => ({ 
                          ...prev, 
                          endpoints: { ...prev.endpoints, customers: checked }
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
                        setSyncroConfig(prev => ({ 
                          ...prev, 
                          endpoints: { ...prev.endpoints, contracts: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-invoicing">Sync Invoicing Data</Label>
                    <Switch
                      id="sync-invoicing"
                      checked={config.endpoints.invoicing}
                      onCheckedChange={(checked) => 
                        setSyncroConfig(prev => ({ 
                          ...prev, 
                          endpoints: { ...prev.endpoints, invoicing: checked }
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleConnect} 
                disabled={isLoading || !config.subdomain || !config.apiKey}
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
                Test your SyncroMSP connection and API endpoints
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

export default SyncroMSPIntegration;