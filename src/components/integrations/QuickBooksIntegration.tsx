import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, DollarSign, Users, Settings, Plus, ExternalLink, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuickBooksConfig {
  enabled: boolean;
  companyId: string;
  accessToken: string;
  refreshToken: string;
  status: 'connected' | 'disconnected' | 'error' | 'expired';
  lastSync: string | null;
  syncSettings: {
    autoSync: boolean;
    syncInterval: 'hourly' | 'daily' | 'weekly';
    syncInvoices: boolean;
    syncPayments: boolean;
    syncCustomers: boolean;
    syncExpenses: boolean;
  };
}

interface SyncRecord {
  id: string;
  type: 'invoice' | 'payment' | 'customer' | 'expense';
  qbId: string;
  localId: string;
  status: 'synced' | 'failed' | 'pending';
  lastSync: string;
  errorMessage?: string;
}

const QuickBooksIntegration = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<QuickBooksConfig>({
    enabled: false,
    companyId: '',
    accessToken: '',
    refreshToken: '',
    status: 'disconnected',
    lastSync: null,
    syncSettings: {
      autoSync: true,
      syncInterval: 'daily',
      syncInvoices: true,
      syncPayments: true,
      syncCustomers: true,
      syncExpenses: false
    }
  });

  const [syncRecords, setSyncRecords] = useState<SyncRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadQuickBooksConfig();
    loadSyncRecords();
  }, []);

  const loadQuickBooksConfig = async () => {
    try {
      // Mock data - in real implementation, load from integrations table
      const mockConfig: QuickBooksConfig = {
        enabled: true,
        companyId: '123146096291789',
        accessToken: '••••••••••••••••',
        refreshToken: '••••••••••••••••',
        status: 'connected',
        lastSync: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        syncSettings: {
          autoSync: true,
          syncInterval: 'daily',
          syncInvoices: true,
          syncPayments: true,
          syncCustomers: true,
          syncExpenses: false
        }
      };
      setConfig(mockConfig);
    } catch (error) {
      console.error('Failed to load QuickBooks config:', error);
    }
  };

  const loadSyncRecords = async () => {
    try {
      const mockRecords: SyncRecord[] = [
        {
          id: '1',
          type: 'invoice',
          qbId: 'INV-001',
          localId: 'invoice_123',
          status: 'synced',
          lastSync: new Date(Date.now() - 1000 * 60 * 15).toISOString()
        },
        {
          id: '2',
          type: 'customer',
          qbId: 'CUST-456',
          localId: 'client_789',
          status: 'synced',
          lastSync: new Date(Date.now() - 1000 * 60 * 60).toISOString()
        },
        {
          id: '3',
          type: 'payment',
          qbId: 'PAY-789',
          localId: 'payment_456',
          status: 'failed',
          lastSync: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          errorMessage: 'Payment method not found in QuickBooks'
        }
      ];
      setSyncRecords(mockRecords);
    } catch (error) {
      console.error('Failed to load sync records:', error);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      // In real implementation, redirect to QuickBooks OAuth
      const qbAuthUrl = `https://appcenter.intuit.com/connect/oauth2?client_id=YOUR_CLIENT_ID&scope=com.intuit.quickbooks.accounting&redirect_uri=${encodeURIComponent(window.location.origin + '/integrations/quickbooks/callback')}&response_type=code&access_type=offline`;
      
      // For demo, simulate connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      setConfig(prev => ({ ...prev, status: 'connected', enabled: true, lastSync: new Date().toISOString() }));
      
      toast({
        title: "QuickBooks Connected",
        description: "Successfully connected to QuickBooks Online",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to QuickBooks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 3000));
      setConfig(prev => ({ ...prev, lastSync: new Date().toISOString() }));
      
      // Update some sync records
      setSyncRecords(prev => prev.map(record => ({
        ...record,
        lastSync: new Date().toISOString(),
        status: record.status === 'failed' ? 'synced' : record.status
      })));

      toast({
        title: "Sync Complete",
        description: "Data synchronized with QuickBooks successfully",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync with QuickBooks. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      setConfig(prev => ({ 
        ...prev, 
        status: 'disconnected', 
        enabled: false,
        accessToken: '',
        refreshToken: '',
        companyId: ''
      }));
      
      toast({
        title: "QuickBooks Disconnected",
        description: "Successfully disconnected from QuickBooks Online",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect from QuickBooks",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-success text-white border-0';
      case 'error': case 'expired': return 'bg-destructive text-white border-0';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return 'text-success';
      case 'failed': return 'text-destructive';
      default: return 'text-warning';
    }
  };

  return (
    <div className="space-y-6">
      {/* Integration Status Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  QuickBooks Online Integration
                  <Badge variant="secondary" className={getStatusColor(config.status)}>
                    {config.status}
                  </Badge>
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  {config.lastSync ? `Last synced: ${new Date(config.lastSync).toLocaleString()}` : 'Never synced'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {config.status === 'connected' ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleSync} 
                    disabled={isSyncing}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? "Syncing..." : "Sync Now"}
                  </Button>
                  <Button variant="outline" onClick={handleDisconnect} disabled={isLoading}>
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button onClick={handleConnect} disabled={isLoading}>
                  {isLoading ? "Connecting..." : "Connect to QuickBooks"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {config.status === 'connected' && (
        <Tabs defaultValue="sync" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sync">Sync Settings</TabsTrigger>
            <TabsTrigger value="records">Sync Records</TabsTrigger>
            <TabsTrigger value="mapping">Field Mapping</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="sync" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Sync Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Auto Sync</Label>
                    <Select 
                      value={config.syncSettings.autoSync ? 'enabled' : 'disabled'}
                      onValueChange={(value) => setConfig(prev => ({
                        ...prev,
                        syncSettings: { ...prev.syncSettings, autoSync: value === 'enabled' }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enabled">Enabled</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Sync Interval</Label>
                    <Select 
                      value={config.syncSettings.syncInterval}
                      onValueChange={(value: 'hourly' | 'daily' | 'weekly') => setConfig(prev => ({
                        ...prev,
                        syncSettings: { ...prev.syncSettings, syncInterval: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Data Types to Sync</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'syncInvoices', label: 'Invoices' },
                      { key: 'syncPayments', label: 'Payments' },
                      { key: 'syncCustomers', label: 'Customers' },
                      { key: 'syncExpenses', label: 'Expenses' }
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={key}
                          checked={config.syncSettings[key as keyof typeof config.syncSettings] as boolean}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            syncSettings: { 
                              ...prev.syncSettings, 
                              [key]: e.target.checked 
                            }
                          }))}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={key}>{label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button>Save Sync Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="records" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Recent Sync Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {syncRecords.map(record => (
                    <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${
                          record.status === 'synced' ? 'bg-success' :
                          record.status === 'failed' ? 'bg-destructive' : 'bg-warning'
                        }`} />
                        <div>
                          <p className="font-medium capitalize">{record.type}</p>
                          <p className="text-sm text-muted-foreground">
                            QB ID: {record.qbId} • Local ID: {record.localId}
                          </p>
                          {record.errorMessage && (
                            <p className="text-xs text-destructive">{record.errorMessage}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={getSyncStatusColor(record.status)}>
                          {record.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(record.lastSync).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mapping" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Field Mapping</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Map your local fields to QuickBooks fields
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { local: 'client_name', qb: 'Customer Name' },
                  { local: 'invoice_number', qb: 'Invoice Number' },
                  { local: 'amount', qb: 'Amount' },
                  { local: 'due_date', qb: 'Due Date' }
                ].map((mapping, index) => (
                  <div key={index} className="grid grid-cols-2 gap-4 items-center">
                    <div>
                      <Label className="text-sm text-muted-foreground">Local Field</Label>
                      <p className="font-mono text-sm">{mapping.local}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">QuickBooks Field</Label>
                      <p className="font-mono text-sm">{mapping.qb}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Synced Invoices</p>
                      <p className="text-2xl font-bold">342</p>
                      <p className="text-xs text-success">+12 this week</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Synced Customers</p>
                      <p className="text-2xl font-bold">89</p>
                      <p className="text-xs text-success">+3 this week</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                      <RefreshCw className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sync Success Rate</p>
                      <p className="text-2xl font-bold">97.3%</p>
                      <p className="text-xs text-muted-foreground">Last 30 days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {config.status === 'disconnected' && (
        <Card>
          <CardContent className="p-6 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Connect to QuickBooks Online</h3>
            <p className="text-muted-foreground mb-4">
              Sync your invoices, payments, and customer data with QuickBooks Online for seamless accounting.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button onClick={handleConnect} disabled={isLoading}>
                {isLoading ? "Connecting..." : "Connect Now"}
              </Button>
              <Button variant="outline" asChild>
                <a href="https://quickbooks.intuit.com" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Learn More
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuickBooksIntegration;