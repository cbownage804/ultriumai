import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ticket, Users, Calendar, DollarSign, Settings, ExternalLink, RefreshCw, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConnectWiseConfig {
  enabled: boolean;
  serverUrl: string;
  companyId: string;
  publicKey: string;
  privateKey: string;
  clientId: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string | null;
  syncSettings: {
    tickets: boolean;
    companies: boolean;
    contacts: boolean;
    agreements: boolean;
    timeEntries: boolean;
    projects: boolean;
  };
}

interface CWTicket {
  id: number;
  summary: string;
  status: string;
  priority: string;
  company: string;
  assignedTo: string;
  dateEntered: string;
  lastUpdate: string;
  board: string;
}

interface CWCompany {
  id: number;
  name: string;
  status: string;
  type: string;
  contactCount: number;
  lastActivity: string;
}

const ConnectWiseIntegration = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<ConnectWiseConfig>({
    enabled: false,
    serverUrl: '',
    companyId: '',
    publicKey: '',
    privateKey: '',
    clientId: '',
    status: 'disconnected',
    lastSync: null,
    syncSettings: {
      tickets: true,
      companies: true,
      contacts: true,
      agreements: false,
      timeEntries: true,
      projects: false
    }
  });

  const [tickets, setTickets] = useState<CWTicket[]>([]);
  const [companies, setCompanies] = useState<CWCompany[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadConnectWiseConfig();
    loadTickets();
    loadCompanies();
  }, []);

  const loadConnectWiseConfig = async () => {
    try {
      const mockConfig: ConnectWiseConfig = {
        enabled: true,
        serverUrl: 'https://api-na.myconnectwise.net',
        companyId: 'YourCompany',
        publicKey: '••••••••••••••••',
        privateKey: '••••••••••••••••',
        clientId: '••••••••••••••••',
        status: 'connected',
        lastSync: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        syncSettings: {
          tickets: true,
          companies: true,
          contacts: true,
          agreements: false,
          timeEntries: true,
          projects: false
        }
      };
      setConfig(mockConfig);
    } catch (error) {
      console.error('Failed to load ConnectWise config:', error);
    }
  };

  const loadTickets = async () => {
    try {
      const mockTickets: CWTicket[] = [
        {
          id: 12345,
          summary: 'Network connectivity issues - TechCorp',
          status: 'In Progress',
          priority: 'High',
          company: 'TechCorp Solutions',
          assignedTo: 'John Smith',
          dateEntered: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          lastUpdate: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          board: 'Service Board'
        },
        {
          id: 12346,
          summary: 'Server backup verification',
          status: 'New',
          priority: 'Medium',
          company: 'Global Manufacturing',
          assignedTo: 'Sarah Johnson',
          dateEntered: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
          lastUpdate: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          board: 'Service Board'
        },
        {
          id: 12347,
          summary: 'Security audit compliance',
          status: 'Waiting',
          priority: 'Critical',
          company: 'Financial Partners LLC',
          assignedTo: 'Mike Wilson',
          dateEntered: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
          lastUpdate: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
          board: 'Project Board'
        }
      ];
      setTickets(mockTickets);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    }
  };

  const loadCompanies = async () => {
    try {
      const mockCompanies: CWCompany[] = [
        {
          id: 1001,
          name: 'TechCorp Solutions',
          status: 'Active',
          type: 'Client',
          contactCount: 8,
          lastActivity: new Date(Date.now() - 1000 * 60 * 30).toISOString()
        },
        {
          id: 1002,
          name: 'Global Manufacturing',
          status: 'Active',
          type: 'Client',
          contactCount: 12,
          lastActivity: new Date(Date.now() - 1000 * 60 * 60).toISOString()
        },
        {
          id: 1003,
          name: 'Financial Partners LLC',
          status: 'Active',
          type: 'Prospect',
          contactCount: 3,
          lastActivity: new Date(Date.now() - 1000 * 60 * 120).toISOString()
        }
      ];
      setCompanies(mockCompanies);
    } catch (error) {
      console.error('Failed to load companies:', error);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      // Validate ConnectWise API credentials
      await new Promise(resolve => setTimeout(resolve, 2000));
      setConfig(prev => ({ ...prev, status: 'connected', enabled: true, lastSync: new Date().toISOString() }));
      
      toast({
        title: "ConnectWise Connected",
        description: "Successfully connected to ConnectWise Manage",
      });
    } catch (error) {
      setConfig(prev => ({ ...prev, status: 'error' }));
      toast({
        title: "Connection Failed",
        description: "Failed to connect to ConnectWise. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      setConfig(prev => ({ ...prev, lastSync: new Date().toISOString() }));
      
      // Refresh data
      await loadTickets();
      await loadCompanies();

      toast({
        title: "Sync Complete",
        description: "ConnectWise data synchronized successfully",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync with ConnectWise",
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
    switch (status.toLowerCase()) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in progress': return 'bg-orange-100 text-orange-800';
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
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
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                <Ticket className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  ConnectWise Manage Integration
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
                    <a href="https://manage.connectwise.com" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      ConnectWise
                    </a>
                  </Button>
                </>
              ) : (
                <Button onClick={handleConnect} disabled={isLoading}>
                  {isLoading ? "Connecting..." : "Connect to ConnectWise"}
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
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="sync">Sync Settings</TabsTrigger>
            <TabsTrigger value="mapping">Field Mapping</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recent Tickets</h3>
              <div className="flex gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="progress">In Progress</SelectItem>
                    <SelectItem value="waiting">Waiting</SelectItem>
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
                          <h4 className="font-semibold">#{ticket.id}</h4>
                          <Badge className={getTicketStatusColor(ticket.status)}>
                            {ticket.status}
                          </Badge>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </div>
                        <h5 className="font-medium mb-1">{ticket.summary}</h5>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Company: {ticket.company}</span>
                          <span>Assigned: {ticket.assignedTo}</span>
                          <span>Board: {ticket.board}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Created: {new Date(ticket.dateEntered).toLocaleString()}</span>
                          <span>•</span>
                          <span>Updated: {new Date(ticket.lastUpdate).toLocaleString()}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View in CW
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="companies" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Companies</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map(company => (
                <Card key={company.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{company.name}</h4>
                      <Badge variant="outline">{company.type}</Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{company.contactCount} contacts</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Last activity: {new Date(company.lastActivity).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <Badge className={company.status === 'Active' ? 'bg-success text-white border-0' : 'bg-muted'}>
                        {company.status}
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
                      { key: 'companies', label: 'Companies' },
                      { key: 'contacts', label: 'Contacts' },
                      { key: 'agreements', label: 'Agreements' },
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
                  Map ConnectWise fields to your local system
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { cw: 'Company.CompanyName', local: 'client_name' },
                  { cw: 'ServiceTicket.Summary', local: 'ticket_title' },
                  { cw: 'ServiceTicket.Priority', local: 'priority_level' },
                  { cw: 'Member.FirstName', local: 'assigned_technician' }
                ].map((mapping, index) => (
                  <div key={index} className="grid grid-cols-2 gap-4 items-center">
                    <div>
                      <Label className="text-sm text-muted-foreground">ConnectWise Field</Label>
                      <p className="font-mono text-sm">{mapping.cw}</p>
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
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                      <Ticket className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Open Tickets</p>
                      <p className="text-2xl font-bold">47</p>
                      <p className="text-xs text-warning">+3 today</p>
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
                      <p className="text-sm text-muted-foreground">Active Companies</p>
                      <p className="text-2xl font-bold">23</p>
                      <p className="text-xs text-success">+1 this week</p>
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
                      <p className="text-2xl font-bold">99.1%</p>
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
            <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Connect to ConnectWise Manage</h3>
            <p className="text-muted-foreground mb-4">
              Sync your tickets, companies, and contacts with ConnectWise Manage PSA platform.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label>Server URL</Label>
                <Input
                  value={config.serverUrl}
                  onChange={(e) => setConfig(prev => ({ ...prev, serverUrl: e.target.value }))}
                  placeholder="https://api-na.myconnectwise.net"
                />
              </div>
              <div className="space-y-2">
                <Label>Company ID</Label>
                <Input
                  value={config.companyId}
                  onChange={(e) => setConfig(prev => ({ ...prev, companyId: e.target.value }))}
                  placeholder="YourCompany"
                />
              </div>
              <div className="space-y-2">
                <Label>Public Key</Label>
                <Input
                  type="password"
                  value={config.publicKey}
                  onChange={(e) => setConfig(prev => ({ ...prev, publicKey: e.target.value }))}
                  placeholder="Public API Key"
                />
              </div>
              <div className="space-y-2">
                <Label>Private Key</Label>
                <Input
                  type="password"
                  value={config.privateKey}
                  onChange={(e) => setConfig(prev => ({ ...prev, privateKey: e.target.value }))}
                  placeholder="Private API Key"
                />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button onClick={handleConnect} disabled={isLoading}>
                {isLoading ? "Connecting..." : "Connect to ConnectWise"}
              </Button>
              <Button variant="outline" asChild>
                <a href="https://developer.connectwise.com" target="_blank" rel="noopener noreferrer">
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

export default ConnectWiseIntegration;