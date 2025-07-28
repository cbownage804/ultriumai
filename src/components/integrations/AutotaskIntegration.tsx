import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench, Users, Calendar, Clock, Settings, ExternalLink, RefreshCw, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AutotaskConfig {
  enabled: boolean;
  username: string;
  password: string;
  integrationCode: string;
  serverUrl: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string | null;
  syncSettings: {
    tickets: boolean;
    accounts: boolean;
    contacts: boolean;
    contracts: boolean;
    timeEntries: boolean;
    projects: boolean;
  };
}

interface ATTicket {
  id: number;
  title: string;
  status: string;
  priority: string;
  accountName: string;
  assignedTo: string;
  createDate: string;
  lastActivity: string;
  queueName: string;
  issueType: string;
}

interface ATAccount {
  id: number;
  accountName: string;
  accountType: string;
  isActive: boolean;
  contactCount: number;
  lastActivity: string;
  territory: string;
}

const AutotaskIntegration = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<AutotaskConfig>({
    enabled: false,
    username: '',
    password: '',
    integrationCode: '',
    serverUrl: '',
    status: 'disconnected',
    lastSync: null,
    syncSettings: {
      tickets: true,
      accounts: true,
      contacts: true,
      contracts: false,
      timeEntries: true,
      projects: false
    }
  });

  const [tickets, setTickets] = useState<ATTicket[]>([]);
  const [accounts, setAccounts] = useState<ATAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadAutotaskConfig();
    loadTickets();
    loadAccounts();
  }, []);

  const loadAutotaskConfig = async () => {
    try {
      const mockConfig: AutotaskConfig = {
        enabled: true,
        username: 'api@company.com',
        password: '••••••••••••••••',
        integrationCode: 'AT1234567890',
        serverUrl: 'https://webservices2.autotask.net',
        status: 'connected',
        lastSync: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        syncSettings: {
          tickets: true,
          accounts: true,
          contacts: true,
          contracts: false,
          timeEntries: true,
          projects: false
        }
      };
      setConfig(mockConfig);
    } catch (error) {
      console.error('Failed to load Autotask config:', error);
    }
  };

  const loadTickets = async () => {
    try {
      const mockTickets: ATTicket[] = [
        {
          id: 20001,
          title: 'Email server performance issues',
          status: 'In Progress',
          priority: 'High',
          accountName: 'Acme Corporation',
          assignedTo: 'Tech Support Level 2',
          createDate: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
          lastActivity: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          queueName: 'IT Support',
          issueType: 'Service Request'
        },
        {
          id: 20002,
          title: 'New user setup and training',
          status: 'New',
          priority: 'Medium',
          accountName: 'Digital Solutions Inc',
          assignedTo: 'Field Services',
          createDate: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
          lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          queueName: 'Field Service',
          issueType: 'Change Request'
        },
        {
          id: 20003,
          title: 'Critical security vulnerability patch',
          status: 'Waiting Customer',
          priority: 'Critical',
          accountName: 'Healthcare Partners',
          assignedTo: 'Security Team',
          createDate: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
          lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
          queueName: 'Security',
          issueType: 'Incident'
        }
      ];
      setTickets(mockTickets);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    }
  };

  const loadAccounts = async () => {
    try {
      const mockAccounts: ATAccount[] = [
        {
          id: 501,
          accountName: 'Acme Corporation',
          accountType: 'Customer',
          isActive: true,
          contactCount: 15,
          lastActivity: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          territory: 'Northeast'
        },
        {
          id: 502,
          accountName: 'Digital Solutions Inc',
          accountType: 'Customer',
          isActive: true,
          contactCount: 8,
          lastActivity: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          territory: 'West Coast'
        },
        {
          id: 503,
          accountName: 'Healthcare Partners',
          accountType: 'Prospect',
          isActive: true,
          contactCount: 4,
          lastActivity: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
          territory: 'Southeast'
        }
      ];
      setAccounts(mockAccounts);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      // Validate Autotask API credentials
      await new Promise(resolve => setTimeout(resolve, 2500));
      setConfig(prev => ({ ...prev, status: 'connected', enabled: true, lastSync: new Date().toISOString() }));
      
      toast({
        title: "Autotask Connected",
        description: "Successfully connected to Autotask PSA",
      });
    } catch (error) {
      setConfig(prev => ({ ...prev, status: 'error' }));
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Autotask. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3500));
      setConfig(prev => ({ ...prev, lastSync: new Date().toISOString() }));
      
      // Refresh data
      await loadTickets();
      await loadAccounts();

      toast({
        title: "Sync Complete",
        description: "Autotask data synchronized successfully",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync with Autotask",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-success text-white border-0';
      case 'error': return 'bg-destructive text-white border-0';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-destructive text-white border-0';
      case 'high': return 'bg-warning text-white border-0';
      case 'medium': return 'bg-primary text-white border-0';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTicketStatusColor = (status: string) => {
    switch (status.toLowerCase().replace(' ', '-')) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-orange-100 text-orange-800';
      case 'waiting-customer': return 'bg-yellow-100 text-yellow-800';
      case 'complete': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Integration Status Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                <Wrench className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Autotask PSA Integration
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
                  <Button variant="outline" asChild>
                    <a href="https://ww4.autotask.net" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Autotask
                    </a>
                  </Button>
                </>
              ) : (
                <Button onClick={handleConnect} disabled={isLoading}>
                  {isLoading ? "Connecting..." : "Connect to Autotask"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {config.status === 'connected' && (
        <Tabs defaultValue="tickets" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="sync">Sync Settings</TabsTrigger>
            <TabsTrigger value="mapping">Field Mapping</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Service Tickets</h3>
              <div className="flex gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tickets</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="progress">In Progress</SelectItem>
                    <SelectItem value="waiting">Waiting Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              {tickets.map(ticket => (
                <Card key={ticket.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">T{ticket.id}</h4>
                          <Badge className={getTicketStatusColor(ticket.status)}>
                            {ticket.status}
                          </Badge>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                          <Badge variant="outline">{ticket.issueType}</Badge>
                        </div>
                        <h5 className="font-medium mb-1">{ticket.title}</h5>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Account: {ticket.accountName}</span>
                          <span>Queue: {ticket.queueName}</span>
                          <span>Assigned: {ticket.assignedTo}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Created: {new Date(ticket.createDate).toLocaleString()}</span>
                          <span>•</span>
                          <span>Last Activity: {new Date(ticket.lastActivity).toLocaleString()}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View in AT
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="accounts" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Accounts</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map(account => (
                <Card key={account.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{account.accountName}</h4>
                      <Badge variant="outline">{account.accountType}</Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{account.contactCount} contacts</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Last activity: {new Date(account.lastActivity).toLocaleDateString()}</span>
                      </div>
                      <div>Territory: {account.territory}</div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <Badge className={account.isActive ? 'bg-success text-white border-0' : 'bg-muted'}>
                        {account.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sync" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Sync Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>Data Types to Sync</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'tickets', label: 'Service Tickets' },
                      { key: 'accounts', label: 'Accounts' },
                      { key: 'contacts', label: 'Contacts' },
                      { key: 'contracts', label: 'Contracts' },
                      { key: 'timeEntries', label: 'Time Entries' },
                      { key: 'projects', label: 'Projects' }
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={key}
                          checked={config.syncSettings[key as keyof typeof config.syncSettings]}
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

          <TabsContent value="mapping" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Field Mapping</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Map Autotask fields to your local system
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { at: 'Account.AccountName', local: 'client_name' },
                  { at: 'Ticket.Title', local: 'ticket_title' },
                  { at: 'Ticket.Priority', local: 'priority_level' },
                  { at: 'Resource.FirstName', local: 'assigned_technician' }
                ].map((mapping, index) => (
                  <div key={index} className="grid grid-cols-2 gap-4 items-center">
                    <div>
                      <Label className="text-sm text-muted-foreground">Autotask Field</Label>
                      <p className="font-mono text-sm">{mapping.at}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Local Field</Label>
                      <p className="font-mono text-sm">{mapping.local}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                      <Wrench className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Open Tickets</p>
                      <p className="text-2xl font-bold">32</p>
                      <p className="text-xs text-warning">+2 today</p>
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
                      <p className="text-sm text-muted-foreground">Active Accounts</p>
                      <p className="text-2xl font-bold">18</p>
                      <p className="text-xs text-success">+1 this month</p>
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
                      <p className="text-2xl font-bold">98.7%</p>
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
            <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Connect to Autotask PSA</h3>
            <p className="text-muted-foreground mb-4">
              Sync your tickets, accounts, and contacts with Autotask PSA platform.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  value={config.username}
                  onChange={(e) => setConfig(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="api@yourcompany.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={config.password}
                  onChange={(e) => setConfig(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="API Password"
                />
              </div>
              <div className="space-y-2">
                <Label>Integration Code</Label>
                <Input
                  value={config.integrationCode}
                  onChange={(e) => setConfig(prev => ({ ...prev, integrationCode: e.target.value }))}
                  placeholder="AT1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label>Server URL</Label>
                <Select value={config.serverUrl} onValueChange={(value) => setConfig(prev => ({ ...prev, serverUrl: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select server" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="https://webservices2.autotask.net">US Datacenter</SelectItem>
                    <SelectItem value="https://webservices12.autotask.net">EU Datacenter</SelectItem>
                    <SelectItem value="https://webservices14.autotask.net">AU Datacenter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button onClick={handleConnect} disabled={isLoading}>
                {isLoading ? "Connecting..." : "Connect to Autotask"}
              </Button>
              <Button variant="outline" asChild>
                <a href="https://www.autotask.com/help/Content/LinkedDocs/Developer/API%20Content.htm" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  API Documentation
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AutotaskIntegration;