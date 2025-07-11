import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MSPClientEmailConfig } from "@/components/safedesk/MSPClientEmailConfig";
import { SecurityDashboard } from "@/components/dashboards/SecurityDashboard";
import { ClientPortal } from "@/components/client/ClientPortal";
import { BusinessIntelligence } from "@/components/dashboards/BusinessIntelligence";
import { IntegrationHub } from "@/components/integrations/IntegrationHub";
import { WorkflowBuilder } from "@/components/automation/WorkflowBuilder";
import { MobileApp } from "@/components/mobile/MobileApp";
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
  RefreshCw,
  Bot,
  Zap,
  Brain,
  TrendingUp,
  Star,
  Clock,
  MessageSquare,
  Database,
  BarChart3,
  Mail,
  Save,
  Workflow,
  Smartphone,
  Link
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
  const { user, loading: authLoading, signOut } = useAuth();
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
  const [activeTab, setActiveTab] = useState("clients");
  const [newClient, setNewClient] = useState({
    company_name: '',
    contact_name: '',
    contact_email: '',
    domain: '',
    max_users: 5
  });
  const { toast } = useToast();
  const emailSettingsRef = useRef<HTMLDivElement>(null);

  const quickActions = [
    {
      title: "UltriumGPT Assistant",
      description: "AI-powered MSP operations",
      icon: Bot,
      action: () => window.open("/dashboard/ultrium-gpt", "_blank"),
      color: "bg-gradient-to-r from-primary to-primary/80",
      featured: true,
    },
    {
      title: "Add New Client",
      description: "Onboard a new MSP client",
      icon: Plus,
      action: () => setShowAddClient(true),
      color: "bg-blue-500",
    },
    {
      title: "Deploy RMM Agent",
      description: "Install monitoring agent",
      icon: Download,
      action: () => toast({ title: "Select a client first" }),
      color: "bg-green-500",
    },
    {
      title: "SafeScan Security",
      description: "Run security scans for clients",
      icon: Shield,
      action: () => window.open("/dashboard/safescan", "_blank"),
      color: "bg-red-500",
    },
    {
      title: "SafeDesk",
      description: "Manage support tickets",
      icon: MessageSquare,
      action: () => window.open("/dashboard/helpdesk", "_blank"),
      color: "bg-purple-500",
    },
    {
      title: "Email Settings",
      description: "Configure client email settings",
      icon: Mail,
      action: () => {
        console.log('Email Settings button clicked!');
        console.log('Current activeTab before:', activeTab);
        setActiveTab("email-settings");
        console.log('Setting activeTab to: email-settings');
        setTimeout(() => {
          emailSettingsRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }, 100);
      },
      color: "bg-indigo-500",
    },
  ];

  const recentActivity: any[] = [];

  useEffect(() => {
    loadMSPDashboard();
  }, []);

  const loadMSPDashboard = async () => {
    try {
      setLoading(true);

      // First get or create MSP organization for current user
      const { data: mspOrg } = await supabase
        .from('msp_organizations')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!mspOrg) {
        // No MSP organization exists yet, show empty state
        setClients([]);
        setMetrics({
          totalClients: 0,
          totalEndpoints: 0,
          onlineEndpoints: 0,
          criticalAlerts: 0,
          totalTickets: 0,
          monthlyRevenue: 0
        });
        return;
      }

      // Load MSP clients
      const { data: clientsData } = await supabase
        .from('msp_clients')
        .select('*')
        .eq('msp_id', mspOrg.id)
        .eq('is_active', true)
        .order('company_name');

      // Load RMM endpoints for each client
      const clientIds = clientsData?.map(c => c.id) || [];
      const { data: endpointsData } = clientIds.length > 0 ? await supabase
        .from('rmm_endpoints')
        .select('*')
        .in('client_id', clientIds) : { data: [] };

      // Load RMM alerts
      const { data: alertsData } = clientIds.length > 0 ? await supabase
        .from('rmm_alerts')
        .select('*')
        .in('client_id', clientIds)
        .eq('status', 'open')
        .order('created_at', { ascending: false }) : { data: [] };

      // Load support tickets
      const { data: ticketsData } = clientIds.length > 0 ? await supabase
        .from('support_tickets')
        .select('*')
        .in('client_id', clientIds)
        .eq('status', 'open') : { data: [] };

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
      // First, get or create MSP organization for current user
      const { data: mspOrg, error: mspError } = await supabase
        .from('msp_organizations')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      let mspId = mspOrg?.id;

      if (!mspOrg) {
        // Create MSP organization for new user
        const { data: newMsp, error: createMspError } = await supabase
          .from('msp_organizations')
          .insert({
            user_id: user?.id,
            name: user?.user_metadata?.company_name || 'My MSP',
            contact_email: user?.email || '',
          })
          .select('id')
          .single();

        if (createMspError) throw createMspError;
        mspId = newMsp.id;
      }

      const { error } = await supabase
        .from('msp_clients')
        .insert({
          ...newClient,
          msp_id: mspId,
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

  // Show loading state for auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user) {
    window.location.href = '/auth';
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

      return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-background via-background to-muted/20">
      {/* Welcome Section */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Welcome back, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}!
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage all your MSP clients with AI-powered tools and automation
          </p>
          <div className="text-sm text-muted-foreground">
            {metrics.totalClients > 0 ? (
              <span className="text-success">Managing {metrics.totalClients} active clients • ${metrics.monthlyRevenue.toLocaleString()} MRR</span>
            ) : (
              <span className="text-muted-foreground">Ready to onboard your first client</span>
            )}
          </div>
        </div>
        <Button variant="outline" onClick={signOut}>
          Sign Out
        </Button>
      </div>

      {/* UltriumGPT Feature Highlight */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-primary/80">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">UltriumGPT AI Assistant</CardTitle>
              <CardDescription>
                Your intelligent MSP operations co-pilot - automate support, generate reports, and streamline workflows
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border">
              <MessageSquare className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium text-sm">Smart Chat Assistant</div>
                <div className="text-xs text-muted-foreground">Get instant answers about your MSP operations</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium text-sm">Automated Reports</div>
                <div className="text-xs text-muted-foreground">Generate client reports and security summaries</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border">
              <Zap className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium text-sm">Workflow Automation</div>
                <div className="text-xs text-muted-foreground">Automate routine MSP tasks and processes</div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button 
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
              onClick={() => window.open("/dashboard/ultrium-gpt", "_blank")}
            >
              <Bot className="h-4 w-4 mr-2" />
              Open UltriumGPT
            </Button>
            <Button variant="outline" onClick={() => window.open("/ultrium-gpt", "_blank")}>
              Learn More
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common MSP management tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className={`h-auto p-4 flex-col space-y-2 ${action.featured ? 'border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5' : ''}`}
                onClick={action.action}
              >
                <div className={`p-2 rounded-full ${action.color}`}>
                  <action.icon className="h-4 w-4 text-white" />
                </div>
                <div className="text-center">
                  <div className={`font-medium ${action.featured ? 'text-primary' : ''}`}>{action.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {action.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Header Actions */}
      <div className="flex items-center justify-between">
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Clients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Clients
            </CardTitle>
            <CardDescription>
              Your latest MSP clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {clients.slice(0, 4).map((client) => (
                <div key={client.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-medium bg-primary"
                    >
                      {client.company_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{client.company_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {client.endpoints?.length || 0} endpoints
                      </p>
                    </div>
                  </div>
                  <Badge variant={client.billing_status === 'active' ? "default" : "secondary"}>
                    {client.billing_status}
                  </Badge>
                </div>
              ))}
              {clients.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Clients Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add your first MSP client to get started.
                  </p>
                  <Button onClick={() => setShowAddClient(true)}>
                    Add Your First Client
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest actions on your MSP platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className="p-1.5 rounded-full bg-muted">
                      {activity.type === 'client' && <Users className="h-3 w-3" />}
                      {activity.type === 'alert' && <AlertTriangle className="h-3 w-3" />}
                      {activity.type === 'deploy' && <Download className="h-3 w-3" />}
                      {activity.type === 'billing' && <Activity className="h-3 w-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No recent activity</p>
                  <p className="text-sm text-muted-foreground">Activity will appear here as you start managing clients</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => {
        console.log('Tab changed to:', value);
        setActiveTab(value);
      }} className="space-y-4">
        <TabsList className="grid w-full grid-cols-12 text-xs">
          <TabsTrigger value="clients" className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            Clients
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Security
          </TabsTrigger>
          <TabsTrigger value="business" className="flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="client-portal" className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            Portal
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-1">
            <Link className="w-3 h-3" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-1">
            <Workflow className="w-3 h-3" />
            Automation
          </TabsTrigger>
          <TabsTrigger value="mobile" className="flex items-center gap-1">
            <Smartphone className="w-3 h-3" />
            Mobile
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-1">
            <Monitor className="w-3 h-3" />
            RMM
          </TabsTrigger>
          <TabsTrigger value="ai-helpdesk" className="flex items-center gap-1">
            <Bot className="w-3 h-3" />
            AI Desk
          </TabsTrigger>
          <TabsTrigger value="ai-patching" className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            AI Patch
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-1">
            <Palette className="w-3 h-3" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="email-settings" className="flex items-center gap-1">
            <Mail className="w-3 h-3" />
            Email
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

        <TabsContent value="ai-helpdesk">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold">SafeDesk - AI-Powered Ticketing</h3>
                <p className="text-muted-foreground">Co-managed support with AI chat assistants</p>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Bot className="w-3 h-3 mr-1" />
                AI Enhanced
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI Resolved</CardTitle>
                  <Bot className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">24</div>
                  <p className="text-xs text-muted-foreground">Tickets auto-resolved</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
                  <Zap className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12m</div>
                  <p className="text-xs text-muted-foreground">AI-assisted response</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI Confidence</CardTitle>
                  <Brain className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">87%</div>
                  <p className="text-xs text-muted-foreground">Solution accuracy</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Co-Managed</CardTitle>
                  <Users className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">45</div>
                  <p className="text-xs text-muted-foreground">Human + AI support</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent AI Resolutions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { title: "Password Reset Request", client: "Acme Corp", time: "2m ago", confidence: 95 },
                    { title: "VPN Connection Issue", client: "TechStart", time: "15m ago", confidence: 88 },
                    { title: "Email Configuration", client: "LocalBiz", time: "1h ago", confidence: 92 }
                  ].map((ticket, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{ticket.title}</p>
                        <p className="text-xs text-muted-foreground">{ticket.client} • {ticket.time}</p>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {ticket.confidence}% AI
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI Chat Assistant</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm">
                        <strong>AI:</strong> I've analyzed the network connectivity issue for TechStart. 
                        The problem appears to be DNS-related. I've automatically applied the standard DNS fix 
                        and notified the client. Resolution confidence: 88%
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input placeholder="Ask the AI assistant..." />
                      <Button size="sm">Send</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ai-patching">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold">AI Patch Management</h3>
                <p className="text-muted-foreground">Automated Windows & third-party patching with AI risk assessment</p>
              </div>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                <Zap className="w-3 h-3 mr-1" />
                AI Powered
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Patches Deployed</CardTitle>
                  <Download className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">156</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI Risk Score</CardTitle>
                  <Brain className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">Low</div>
                  <p className="text-xs text-muted-foreground">Current deployment risk</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Auto-Approved</CardTitle>
                  <Zap className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">89%</div>
                  <p className="text-xs text-muted-foreground">AI confidence rate</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <Shield className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">98.7%</div>
                  <p className="text-xs text-muted-foreground">Deployment success</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Patches</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { update: "Windows Security Update KB5034441", risk: "Low", priority: "High", clients: 12 },
                    { update: "Chrome Browser Update 120.0", risk: "Very Low", priority: "Medium", clients: 8 },
                    { update: "Office 365 Security Patch", risk: "Low", priority: "High", clients: 15 }
                  ].map((patch, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{patch.update}</p>
                        <p className="text-xs text-muted-foreground">{patch.clients} clients affected</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Risk: {patch.risk}
                        </Badge>
                        <Badge className={
                          patch.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }>
                          {patch.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI Patch Policies</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto-patch Windows Updates</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Third-party Auto-patching</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">AI Risk Assessment</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Critical Patch Immediate Deploy</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">Yes</Badge>
                    </div>
                  </div>
                  <Button className="w-full mt-4">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure Policies
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ai-alerts">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold">AI Alert Management</h3>
                <p className="text-muted-foreground">Intelligent alert correlation and auto-resolution</p>
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                <Brain className="w-3 h-3 mr-1" />
                AI Learning
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Auto-Resolved</CardTitle>
                  <Zap className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">67</div>
                  <p className="text-xs text-muted-foreground">Alerts resolved by AI</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pattern Match</CardTitle>
                  <Brain className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">94%</div>
                  <p className="text-xs text-muted-foreground">Pattern recognition rate</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">False Positives</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">3%</div>
                  <p className="text-xs text-muted-foreground">AI accuracy improving</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resolution Time</CardTitle>
                  <Activity className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">45s</div>
                  <p className="text-xs text-muted-foreground">Average AI response</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent AI Alert Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { 
                      alert: "High CPU Usage - Server01", 
                      client: "TechCorp", 
                      action: "Process restarted", 
                      confidence: 92,
                      time: "3m ago"
                    },
                    { 
                      alert: "Disk Space Low - DB-Server", 
                      client: "DataFlow", 
                      action: "Cleanup scheduled", 
                      confidence: 88,
                      time: "12m ago"
                    },
                    { 
                      alert: "Service Down - Email Server", 
                      client: "Communications Inc", 
                      action: "Service restarted", 
                      confidence: 95,
                      time: "25m ago"
                    }
                  ].map((alert, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm">{alert.alert}</p>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Auto-Resolved
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {alert.client} • {alert.time}
                      </p>
                      <p className="text-xs">
                        <strong>Action:</strong> {alert.action} (Confidence: {alert.confidence}%)
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Alert Patterns Learned</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { pattern: "High CPU + Memory Leak", matches: 23, success: 96 },
                    { pattern: "Disk Space Cleanup", matches: 18, success: 94 },
                    { pattern: "Service Recovery", matches: 31, success: 98 },
                    { pattern: "Network Connectivity", matches: 15, success: 89 }
                  ].map((pattern, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{pattern.pattern}</p>
                        <p className="text-xs text-muted-foreground">{pattern.matches} matches</p>
                      </div>
                      <Badge variant="outline" className="text-green-700">
                        {pattern.success}% success
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ai-mdr">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold">AI-Powered SafeMDR & SafeAV</h3>
                <p className="text-muted-foreground">Complete managed detection, response, and endpoint protection</p>
              </div>
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                <Shield className="w-3 h-3 mr-1" />
                24/7 Protection
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Threats Blocked</CardTitle>
                  <Shield className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">142</div>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI Detection Rate</CardTitle>
                  <Brain className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">99.8%</div>
                  <p className="text-xs text-muted-foreground">Zero-day protection</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                  <Zap className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1.2s</div>
                  <p className="text-xs text-muted-foreground">Average AI response</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Quarantined</CardTitle>
                  <Bug className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">34</div>
                  <p className="text-xs text-muted-foreground">Files isolated</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Threat Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { 
                      threat: "Trojan.Win32.Malware", 
                      client: "SecureCorp", 
                      action: "Quarantined & Removed", 
                      severity: "High",
                      time: "5m ago"
                    },
                    { 
                      threat: "Phishing Email Detected", 
                      client: "BusinessFlow", 
                      action: "Blocked & User Alerted", 
                      severity: "Medium",
                      time: "18m ago"
                    },
                    { 
                      threat: "Suspicious Network Activity", 
                      client: "DataSystems", 
                      action: "Connection Blocked", 
                      severity: "High",
                      time: "1h ago"
                    }
                  ].map((threat, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm">{threat.threat}</p>
                        <Badge className={
                          threat.severity === 'High' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }>
                          {threat.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {threat.client} • {threat.time}
                      </p>
                      <p className="text-xs">
                        <strong>Action:</strong> {threat.action}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Protection Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Real-time Protection</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">AI Behavioral Analysis</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">Learning</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Threat Intelligence Feed</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">Updated</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Endpoint Coverage</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">100%</Badge>
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Protection Score</span>
                      <span className="font-medium">98/100</span>
                    </div>
                    <Progress value={98} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
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
                    SafeAV Protection
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

        <TabsContent value="branding">
          <div className="text-center py-8">
            <Palette className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">White-label customization</p>
            <p className="text-sm text-muted-foreground">Customize the platform with your branding</p>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <SecurityDashboard />
        </TabsContent>

        <TabsContent value="business">
          <BusinessIntelligence />
        </TabsContent>

        <TabsContent value="client-portal">
          <ClientPortal />
        </TabsContent>

        <TabsContent value="integrations">
          <IntegrationHub />
        </TabsContent>

        <TabsContent value="automation">
          <WorkflowBuilder />
        </TabsContent>

        <TabsContent value="mobile">
          <MobileApp />
        </TabsContent>

        <TabsContent value="email-settings" className="mt-6" ref={emailSettingsRef}>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Email Settings</h3>
            <p className="text-muted-foreground mb-4">
              Configure email addresses for automatic ticket creation from client emails.
            </p>
            
            <div className="space-y-6">
              {/* Basic email configuration form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client-select">Select Client</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a client..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="demo1">ACME Corporation</SelectItem>
                      <SelectItem value="demo2">TechCorp Solutions</SelectItem>
                      <SelectItem value="demo3">Global Industries</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="incoming_email">Incoming Email Address</Label>
                  <Input
                    id="incoming_email"
                    placeholder="client-tickets@safedesk.io"
                    type="email"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email address where clients send emails to create tickets
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="outgoing_email">Outgoing Reply Email</Label>
                  <Input
                    id="outgoing_email"
                    placeholder="support@clientdomain.com"
                    type="email"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email address that ticket replies come FROM
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="from_name">From Name</Label>
                  <Input
                    id="from_name"
                    placeholder="ACME Corp Support Team"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signature">Email Signature</Label>
                <Textarea
                  id="signature"
                  placeholder="Best regards,&#10;ACME Corp Support Team&#10;Phone: (555) 123-4567&#10;https://support.acmecorp.com"
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="auto_response">Auto-Response Template</Label>
                <Textarea
                  id="auto_response"
                  placeholder="Thank you for contacting us. Your ticket has been created and we will respond shortly."
                  rows={3}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch id="auto_response_enabled" />
                  <Label htmlFor="auto_response_enabled">Enable Auto-Response</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="is_active" />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};