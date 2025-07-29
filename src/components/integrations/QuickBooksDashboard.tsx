import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  RotateCcw, 
  CheckCircle, 
  AlertTriangle,
  Users,
  FileText,
  Calendar,
  BarChart3,
  Settings,
  RefreshCw,
  TrendingUp,
  CreditCard,
  Receipt,
  PieChart
} from 'lucide-react';

interface QuickBooksConfig {
  id?: string;
  company_id?: string;
  company_name?: string;
  is_connected: boolean;
  sync_enabled: boolean;
  last_sync_at?: string;
  sync_frequency: string;
  sync_settings: {
    customers: boolean;
    invoices: boolean;
    payments: boolean;
    items: boolean;
    estimates: boolean;
    expenses: boolean;
  };
}

interface FinancialStats {
  totalRevenue: number;
  monthlyRevenue: number;
  outstandingInvoices: number;
  paidInvoices: number;
  totalCustomers: number;
  activeCustomers: number;
  revenueGrowth: number;
  averageInvoiceValue: number;
}

interface RecentTransaction {
  id: string;
  type: 'invoice' | 'payment' | 'estimate';
  customer: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'overdue' | 'draft';
  reference: string;
}

const QuickBooksDashboard: React.FC = () => {
  const [config, setConfig] = useState<QuickBooksConfig>({
    is_connected: false,
    sync_enabled: false,
    sync_frequency: 'daily',
    sync_settings: {
      customers: true,
      invoices: true,
      payments: true,
      items: true,
      estimates: false,
      expenses: false
    }
  });
  
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    outstandingInvoices: 0,
    paidInvoices: 0,
    totalCustomers: 0,
    activeCustomers: 0,
    revenueGrowth: 0,
    averageInvoiceValue: 0
  });

  const [transactions, setTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const entityTypes = [
    { key: 'customers', label: 'Customers', icon: Users, description: 'Sync customer data and contacts' },
    { key: 'invoices', label: 'Invoices', icon: FileText, description: 'Sync invoice records and billing' },
    { key: 'payments', label: 'Payments', icon: DollarSign, description: 'Sync payment transactions' },
    { key: 'items', label: 'Service Items', icon: BarChart3, description: 'Sync products and services' },
    { key: 'estimates', label: 'Estimates', icon: Receipt, description: 'Sync estimate and quote data' },
    { key: 'expenses', label: 'Expenses', icon: CreditCard, description: 'Sync expense tracking' },
  ];

  useEffect(() => {
    loadQuickBooksConfig();
    loadFinancialStats();
    loadRecentTransactions();
  }, []);

  const loadQuickBooksConfig = async () => {
    try {
      // Mock data for demonstration
      const mockConfig: QuickBooksConfig = {
        id: '1',
        company_id: 'demo_company_123',
        company_name: 'Demo MSP Company',
        is_connected: true,
        sync_enabled: true,
        sync_frequency: 'daily',
        last_sync_at: new Date().toISOString(),
        sync_settings: {
          customers: true,
          invoices: true,
          payments: true,
          items: true,
          estimates: true,
          expenses: false
        }
      };
      setConfig(mockConfig);
    } catch (error) {
      console.error('Failed to load QuickBooks config:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFinancialStats = async () => {
    try {
      // Mock financial data
      const mockStats: FinancialStats = {
        totalRevenue: 485750,
        monthlyRevenue: 42800,
        outstandingInvoices: 28500,
        paidInvoices: 156,
        totalCustomers: 89,
        activeCustomers: 67,
        revenueGrowth: 12.5,
        averageInvoiceValue: 3125
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to load financial stats:', error);
    }
  };

  const loadRecentTransactions = async () => {
    try {
      // Mock transaction data
      const mockTransactions: RecentTransaction[] = [
        {
          id: '1',
          type: 'payment',
          customer: 'Acme Corp',
          amount: 5250,
          date: new Date().toISOString(),
          status: 'paid',
          reference: 'INV-2024-001'
        },
        {
          id: '2',
          type: 'invoice',
          customer: 'TechStart LLC',
          amount: 3800,
          date: new Date(Date.now() - 86400000).toISOString(),
          status: 'pending',
          reference: 'INV-2024-002'
        },
        {
          id: '3',
          type: 'payment',
          customer: 'Global Systems',
          amount: 7200,
          date: new Date(Date.now() - 172800000).toISOString(),
          status: 'paid',
          reference: 'INV-2024-003'
        },
        {
          id: '4',
          type: 'invoice',
          customer: 'SmallBiz Inc',
          amount: 1950,
          date: new Date(Date.now() - 259200000).toISOString(),
          status: 'overdue',
          reference: 'INV-2024-004'
        }
      ];
      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const connectQuickBooks = async () => {
    setConnecting(true);
    try {
      // Simulate OAuth flow
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setConfig(prev => ({
        ...prev,
        is_connected: true,
        company_id: 'demo_company_123',
        company_name: 'Demo Company'
      }));
      
      toast({
        title: "Success",
        description: "Successfully connected to QuickBooks Online",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to QuickBooks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  const disconnectQuickBooks = async () => {
    try {
      setConfig(prev => ({
        ...prev,
        is_connected: false,
        company_id: undefined,
        company_name: undefined
      }));
      
      toast({
        title: "Success",
        description: "QuickBooks disconnected successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect QuickBooks",
        variant: "destructive",
      });
    }
  };

  const updateSyncSettings = async (entityType: string, enabled: boolean) => {
    try {
      setConfig(prev => ({
        ...prev,
        sync_settings: {
          ...prev.sync_settings,
          [entityType]: enabled
        }
      }));
      
      toast({
        title: "Success",
        description: `${entityType} sync ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update sync settings",
        variant: "destructive",
      });
    }
  };

  const triggerSync = async () => {
    setSyncing(true);
    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setConfig(prev => ({
        ...prev,
        last_sync_at: new Date().toISOString()
      }));
      
      // Refresh data
      await loadFinancialStats();
      await loadRecentTransactions();
      
      toast({
        title: "Success",
        description: "Data sync completed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sync data",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const getTransactionStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'overdue': return 'destructive';
      case 'draft': return 'outline';
      default: return 'secondary';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'invoice': return <FileText className="h-4 w-4" />;
      case 'payment': return <DollarSign className="h-4 w-4" />;
      case 'estimate': return <Receipt className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
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
          <h2 className="text-2xl font-bold tracking-tight">QuickBooks Integration</h2>
          <p className="text-muted-foreground">
            Sync financial data and manage billing with QuickBooks Online
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
              <DollarSign className="h-5 w-5" />
              Connect to QuickBooks Online
            </CardTitle>
            <CardDescription>
              Connect your QuickBooks account to sync financial data automatically
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Benefits of QuickBooks Integration:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Automatic invoice and payment synchronization</li>
                <li>• Real-time financial reporting and analytics</li>
                <li>• Streamlined customer billing management</li>
                <li>• Automated expense tracking and categorization</li>
                <li>• Seamless tax preparation and compliance</li>
              </ul>
            </div>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You'll be redirected to QuickBooks to authorize the connection. Make sure you have admin access to your QuickBooks company.
              </AlertDescription>
            </Alert>
            
            <Button onClick={connectQuickBooks} disabled={connecting} className="w-full">
              {connecting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Connect QuickBooks
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="sync">Sync Settings</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Financial Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    +{stats.revenueGrowth}% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Current month to date
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-500">${stats.outstandingInvoices.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Pending payment
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeCustomers}</div>
                  <p className="text-xs text-muted-foreground">
                    of {stats.totalCustomers} total customers
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Connected Company
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{config.company_name}</h3>
                    <p className="text-sm text-muted-foreground">Company ID: {config.company_id}</p>
                    <p className="text-sm text-muted-foreground">
                      Last sync: {config.last_sync_at ? new Date(config.last_sync_at).toLocaleString() : 'Never'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={triggerSync} disabled={syncing} variant="outline">
                      <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                      {syncing ? 'Syncing...' : 'Sync Now'}
                    </Button>
                    <Button onClick={disconnectQuickBooks} variant="outline">
                      Disconnect
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Recent Transactions</h3>
              <Button onClick={triggerSync} disabled={syncing} variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <div className="grid gap-4">
              {transactions.map((transaction) => (
                <Card key={transaction.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-primary/10">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <h4 className="font-medium">{transaction.customer}</h4>
                          <p className="text-sm text-muted-foreground">
                            {transaction.reference} • {transaction.type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          ${transaction.amount.toLocaleString()}
                        </div>
                        <Badge variant={getTransactionStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sync" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Sync Configuration
                </CardTitle>
                <CardDescription>
                  Configure what data to sync between your MSP system and QuickBooks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {entityTypes.map((entity) => {
                  const IconComponent = entity.icon;
                  const isEnabled = config.sync_settings[entity.key as keyof typeof config.sync_settings];
                  
                  return (
                    <div key={entity.key} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <IconComponent className="h-4 w-4 text-primary" />
                        <div>
                          <h4 className="font-medium">{entity.label}</h4>
                          <p className="text-sm text-muted-foreground">{entity.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => updateSyncSettings(entity.key, checked)}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {syncing && (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Sync in Progress</span>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    </div>
                    <Progress value={65} className="w-full" />
                    <p className="text-sm text-muted-foreground">
                      Syncing invoice data... This may take a few minutes.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
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
                    <Label>Automatic Sync</Label>
                    <p className="text-sm text-muted-foreground">Enable automatic data synchronization</p>
                  </div>
                  <Switch checked={config.sync_enabled} />
                </div>
                
                <div className="space-y-2">
                  <Label>Sync Frequency</Label>
                  <select 
                    value={config.sync_frequency}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    <option value="hourly">Every Hour</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label>Webhook Endpoint</Label>
                  <Input 
                    value={`${window.location.origin}/api/webhooks/quickbooks`}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use this endpoint in your QuickBooks app settings for real-time updates
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

export default QuickBooksDashboard;