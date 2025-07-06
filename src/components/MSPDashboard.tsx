import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Shield, 
  Server, 
  AlertTriangle, 
  Activity, 
  Users, 
  Ticket,
  Monitor,
  Cpu,
  HardDrive,
  Wrench,
  Network,
  Bug,
  Download,
  Settings,
  Eye,
  Terminal,
  Palette,
  Plus,
  RefreshCw
} from "lucide-react";

interface MSPClient {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  domain: string;
  max_users: number;
  current_users: number;
  billing_status: string;
  endpoints?: RMMEndpoint[];
  alerts?: RMMAlert[];
}

interface RMMEndpoint {
  id: string;
  hostname: string;
  os_info: string;
  status: string;
  last_seen: string;
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
  antivirus_status?: any;
}

interface RMMAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  status: string;
  created_at: string;
}

interface MSPMetrics {
  totalClients: number;
  totalEndpoints: number;
  onlineEndpoints: number;
  criticalAlerts: number;
  totalTickets: number;
  monthlyRevenue: number;
}

export const MSPDashboard = () => {
  const [clients, setClients] = useState<MSPClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<MSPClient | null>(null);
  const [metrics, setMetrics] = useState<MSPMetrics>({
    totalClients: 0,
    totalEndpoints: 0,
    onlineEndpoints: 0,
    criticalAlerts: 0,
    totalTickets: 0,
    monthlyRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClient, setNewClient] = useState({
    company_name: '',
    contact_name: '',
    contact_email: '',
    domain: '',
    max_users: 5
  });
  const { toast } = useToast();

  useEffect(() => {
    loadMSPDashboard();
  }, []);

  const loadMSPDashboard = async () => {
    try {
      setLoading(true);

      // Load MSP clients
      const { data: clientsData } = await supabase
        .from('msp_clients')
        .select('*')
        .eq('is_active', true)
        .order('company_name');

      // Load RMM endpoints for each client
      const { data: endpointsData } = await supabase
        .from('rmm_endpoints')
        .select('*');

      // Load RMM alerts
      const { data: alertsData } = await supabase
        .from('rmm_alerts')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      // Load support tickets
      const { data: ticketsData } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('status', 'open');

      // Combine data
      const clientsWithData = clientsData?.map(client => ({
        ...client,
        endpoints: endpointsData?.filter(e => e.client_id === client.id) || [],
        alerts: alertsData?.filter(a => a.client_id === client.id) || []
      })) || [];

      setClients(clientsWithData);

      // Calculate metrics
      const totalEndpoints = endpointsData?.length || 0;
      const onlineEndpoints = endpointsData?.filter(e => e.status === 'online').length || 0;
      const criticalAlerts = alertsData?.filter(a => a.severity === 'critical').length || 0;

      setMetrics({
        totalClients: clientsData?.length || 0,
        totalEndpoints,
        onlineEndpoints,
        criticalAlerts,
        totalTickets: ticketsData?.length || 0,
        monthlyRevenue: clientsData?.reduce((sum, c) => sum + (c.monthly_rate || 0), 0) || 0
      });

    } catch (error) {
      console.error('Failed to load MSP dashboard:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addClient = async () => {
    try {
      const { error } = await supabase
        .from('msp_clients')
        .insert({
          ...newClient,
          msp_id: 'default-msp-id', // This should be the current MSP's ID
          monthly_rate: newClient.max_users * 15, // $15 per user
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (error) throw error;

      toast({
        title: "Client Added",
        description: `${newClient.company_name} has been added successfully`
      });

      setShowAddClient(false);
      setNewClient({
        company_name: '',
        contact_name: '',
        contact_email: '',
        domain: '',
        max_users: 5
      });
      loadMSPDashboard();
    } catch (error) {
      console.error('Failed to add client:', error);
      toast({
        title: "Error",
        description: "Failed to add client",
        variant: "destructive"
      });
    }
  };

  const deployRMMAgent = async (clientId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('rmm-agent', {
        body: {
          action: 'register_agent',
          clientId
        }
      });

      if (error) throw error;

      toast({
        title: "RMM Agent Deployed",
        description: "Agent configuration generated. Download and install on client systems."
      });

      // In a real implementation, this would provide download links for the agent installer
    } catch (error) {
      console.error('Failed to deploy agent:', error);
      toast({
        title: "Deployment Failed",
        description: "Failed to deploy RMM agent",
        variant: "destructive"
      });
    }
  };

  const runAntivirusScan = async (clientId: string, hostname: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('rmm-agent', {
        body: {
          action: 'antivirus_scan',
          clientId,
          hostname,
          scanParams: {
            scanType: 'full',
            priority: 'normal'
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Antivirus Scan Started",
        description: `Full system scan initiated on ${hostname}`
      });

      loadMSPDashboard();
    } catch (error) {
      console.error('Failed to start scan:', error);
      toast({
        title: "Scan Failed",
        description: "Failed to start antivirus scan",
        variant: "destructive"
      });
    }
  };

  const executeRemoteCommand = async (clientId: string, hostname: string, command: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('rmm-agent', {
        body: {
          action: 'remote_command',
          clientId,
          hostname,
          command,
          parameters: {}
        }
      });

      if (error) throw error;

      toast({
        title: "Command Executed",
        description: `${command} executed successfully on ${hostname}`
      });
    } catch (error) {
      console.error('Failed to execute command:', error);
      toast({
        title: "Command Failed",
        description: "Failed to execute remote command",
        variant: "destructive"
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800 border-green-200';
      case 'offline': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">MSP Dashboard</h1>
          <p className="text-muted-foreground">Manage all your clients from one unified platform</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showAddClient} onOpenChange={setShowAddClient}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
                <DialogDescription>
                  Add a new client to your MSP platform
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={newClient.company_name}
                    onChange={(e) => setNewClient({ ...newClient, company_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="contact_name">Contact Name</Label>
                  <Input
                    id="contact_name"
                    value={newClient.contact_name}
                    onChange={(e) => setNewClient({ ...newClient, contact_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={newClient.contact_email}
                    onChange={(e) => setNewClient({ ...newClient, contact_email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    value={newClient.domain}
                    onChange={(e) => setNewClient({ ...newClient, domain: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="max_users">Max Users</Label>
                  <Select 
                    value={newClient.max_users.toString()} 
                    onValueChange={(value) => setNewClient({ ...newClient, max_users: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 Users - $75/month</SelectItem>
                      <SelectItem value="10">10 Users - $150/month</SelectItem>
                      <SelectItem value="25">25 Users - $375/month</SelectItem>
                      <SelectItem value="50">50 Users - $750/month</SelectItem>
                      <SelectItem value="100">100 Users - $1,500/month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowAddClient(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addClient}>
                    Add Client
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={loadMSPDashboard}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {metrics.criticalAlerts > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Alerts Detected</AlertTitle>
          <AlertDescription>
            You have {metrics.criticalAlerts} critical alerts across your client base that require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* MSP Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              Active subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Endpoints</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalEndpoints}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.onlineEndpoints} online
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{metrics.criticalAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTickets}</div>
            <p className="text-xs text-muted-foreground">
              Support requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Recurring revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.8%</div>
            <p className="text-xs text-muted-foreground">
              Platform uptime
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Clients
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex items-center gap-2">
            <Ticket className="w-4 h-4" />
            Tickets
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Branding
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {clients.map(client => (
              <Card key={client.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{client.company_name}</CardTitle>
                      <CardDescription>{client.contact_name} • {client.contact_email}</CardDescription>
                    </div>
                    <Badge className={client.billing_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {client.billing_status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Endpoints:</span>
                      <span className="font-medium">{client.endpoints?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Online:</span>
                      <span className="font-medium text-green-600">
                        {client.endpoints?.filter(e => e.status === 'online').length || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Open Alerts:</span>
                      <span className="font-medium text-red-600">
                        {client.alerts?.length || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Users:</span>
                      <span className="font-medium">{client.current_users}/{client.max_users}</span>
                    </div>
                    
                    <div className="flex space-x-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => deployRMMAgent(client.id)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Deploy Agent
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedClient(client)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Manage
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="monitoring">
          <div className="space-y-6">
            {selectedClient ? (
              <div>
                <h3 className="text-xl font-semibold mb-4">{selectedClient.company_name} - System Monitoring</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {selectedClient.endpoints?.map(endpoint => (
                    <Card key={endpoint.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{endpoint.hostname}</CardTitle>
                          <Badge className={getStatusColor(endpoint.status)}>
                            {endpoint.status}
                          </Badge>
                        </div>
                        <CardDescription>{endpoint.os_info}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {endpoint.cpu_usage && (
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="flex items-center">
                                  <Cpu className="w-3 h-3 mr-1" />
                                  CPU Usage
                                </span>
                                <span>{endpoint.cpu_usage.toFixed(1)}%</span>
                              </div>
                              <Progress value={endpoint.cpu_usage} />
                            </div>
                          )}
                          
                          {endpoint.memory_usage && (
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                 <span className="flex items-center">
                                   <Wrench className="w-3 h-3 mr-1" />
                                   Memory Usage
                                 </span>
                                <span>{endpoint.memory_usage.toFixed(1)}%</span>
                              </div>
                              <Progress value={endpoint.memory_usage} />
                            </div>
                          )}
                          
                          {endpoint.disk_usage && (
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="flex items-center">
                                  <HardDrive className="w-3 h-3 mr-1" />
                                  Disk Usage
                                </span>
                                <span>{endpoint.disk_usage.toFixed(1)}%</span>
                              </div>
                              <Progress value={endpoint.disk_usage} />
                            </div>
                          )}
                          
                          <div className="flex space-x-2 pt-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => runAntivirusScan(selectedClient.id, endpoint.hostname)}
                            >
                              <Bug className="w-3 h-3 mr-1" />
                              Scan
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => executeRemoteCommand(selectedClient.id, endpoint.hostname, 'system_info')}
                            >
                              <Terminal className="w-3 h-3 mr-1" />
                              Remote
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Monitor className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Select a client to view system monitoring</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Security Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Antivirus Protection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {clients.reduce((sum, c) => sum + (c.endpoints?.length || 0), 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Protected endpoints</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bug className="w-5 h-5 mr-2" />
                    Threats Detected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">0</div>
                  <p className="text-sm text-muted-foreground">Last 24 hours</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Scan Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">100%</div>
                  <p className="text-sm text-muted-foreground">Up to date</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tickets">
          <div className="text-center py-8">
            <Ticket className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Integrated ticketing system</p>
            <p className="text-sm text-muted-foreground">Manage support requests across all clients</p>
          </div>
        </TabsContent>

        <TabsContent value="branding">
          <div className="text-center py-8">
            <Palette className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">White-label customization</p>
            <p className="text-sm text-muted-foreground">Customize the platform with your branding</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};