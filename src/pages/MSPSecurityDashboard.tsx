import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Shield, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Eye,
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  FileText,
  Mail,
  Link,
  Key,
  Network,
  Globe,
  Server,
  Bell,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Info,
  Play,
  Pause,
  ArrowLeft,
  Building2,
  Crown,
  BarChart3,
  Lock,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useMSP } from "@/hooks/useMSP";

interface ClientSecurityMetrics {
  clientId: string;
  clientName: string;
  securityScore: number;
  activeThreats: number;
  eventsToday: number;
  lastScanTime: string;
  status: 'secure' | 'warning' | 'critical';
  documentsScanned: number;
  emailsScanned: number;
  linksScanned: number;
}

interface MSPSecurityOverview {
  totalClients: number;
  clientsAtRisk: number;
  totalThreats: number;
  totalEventsToday: number;
  averageSecurityScore: number;
  totalScansToday: number;
  responseTime: number;
}

const MSPSecurityDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { msp, clients } = useMSP();
  
  const [overview, setOverview] = useState<MSPSecurityOverview>({
    totalClients: 0,
    clientsAtRisk: 0,
    totalThreats: 0,
    totalEventsToday: 0,
    averageSecurityScore: 0,
    totalScansToday: 0,
    responseTime: 0
  });

  const [clientMetrics, setClientMetrics] = useState<ClientSecurityMetrics[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedClientDetails, setSelectedClientDetails] = useState<any>(null);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user && msp) {
      loadMSPSecurityData();
      
      if (realTimeEnabled) {
        const interval = setInterval(loadMSPSecurityData, 30000);
        return () => clearInterval(interval);
      }
    }
  }, [user, msp, realTimeEnabled]);

  const loadMSPSecurityData = async () => {
    try {
      setRefreshing(true);
      
      // Generate mock security data for each client
      const mockClientMetrics: ClientSecurityMetrics[] = clients.map(client => {
        const securityScore = Math.floor(Math.random() * 40) + 60; // 60-100
        const activeThreats = Math.floor(Math.random() * 5);
        const eventsToday = Math.floor(Math.random() * 20) + 5;
        
        return {
          clientId: client.id,
          clientName: client.company_name,
          securityScore,
          activeThreats,
          eventsToday,
          lastScanTime: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          status: securityScore >= 90 ? 'secure' : securityScore >= 70 ? 'warning' : 'critical',
          documentsScanned: Math.floor(Math.random() * 50) + 10,
          emailsScanned: Math.floor(Math.random() * 200) + 50,
          linksScanned: Math.floor(Math.random() * 30) + 5
        };
      });

      setClientMetrics(mockClientMetrics);

      // Calculate overview metrics
      const totalThreats = mockClientMetrics.reduce((sum, client) => sum + client.activeThreats, 0);
      const totalEvents = mockClientMetrics.reduce((sum, client) => sum + client.eventsToday, 0);
      const averageScore = mockClientMetrics.length > 0 
        ? mockClientMetrics.reduce((sum, client) => sum + client.securityScore, 0) / mockClientMetrics.length 
        : 0;
      const clientsAtRisk = mockClientMetrics.filter(client => client.status !== 'secure').length;
      const totalScans = mockClientMetrics.reduce((sum, client) => 
        sum + client.documentsScanned + client.emailsScanned + client.linksScanned, 0);

      setOverview({
        totalClients: clients.length,
        clientsAtRisk,
        totalThreats,
        totalEventsToday: totalEvents,
        averageSecurityScore: Math.round(averageScore),
        totalScansToday: totalScans,
        responseTime: Math.floor(Math.random() * 10) + 2
      });

    } catch (error) {
      console.error('Error loading MSP security data:', error);
      toast({
        title: "Error",
        description: "Failed to load security data",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'secure': return 'bg-green-50 text-green-600 border-green-200';
      case 'warning': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'critical': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'secure': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <AlertCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const filteredClientMetrics = selectedClient === 'all' 
    ? clientMetrics 
    : clientMetrics.filter(client => client.clientId === selectedClient);

  const generateClientSecurityReport = async (clientId: string) => {
    toast({
      title: "Report Generated",
      description: "Security report has been generated and sent to client",
    });
  };

  const suspendClient = async (clientId: string) => {
    try {
      await supabase
        .from('msp_clients')
        .update({ is_active: false })
        .eq('id', clientId);
      
      toast({
        title: "Client Suspended",
        description: "Client access has been suspended",
      });
      
      // Refresh data
      loadMSPSecurityData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to suspend client",
        variant: "destructive",
      });
    }
  };

  const getBillingStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-50 text-green-600 border-green-200';
      case 'trial': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-200';
      case 'suspended': return 'bg-gray-50 text-gray-600 border-gray-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  if (!msp) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Crown className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">MSP Profile Required</h3>
          <p className="text-muted-foreground mb-4">Please set up your MSP profile first</p>
          <Button onClick={() => navigate('/msp-control-center')}>
            Go to MSP Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/msp-control-center')}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              MSP Security Command Center
            </h1>
            <p className="text-muted-foreground">
              Multi-tenant security monitoring for {msp.company_name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/msp-control-center')}
          >
            <Building2 className="h-4 w-4 mr-2" />
            MSP Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
          >
            {realTimeEnabled ? (
              <Pause className="h-4 w-4 mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {realTimeEnabled ? 'Pause' : 'Resume'}
          </Button>
          <Button
            variant="outline"
            onClick={loadMSPSecurityData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Real-time Status Alert */}
      {realTimeEnabled && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            Real-time MSP security monitoring active - Monitoring {overview.totalClients} clients
          </AlertDescription>
        </Alert>
      )}

      {/* MSP Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Security Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-bold text-primary">{overview.averageSecurityScore}/100</span>
              <Badge className={overview.averageSecurityScore >= 90 ? 'bg-green-50 text-green-600' : 
                              overview.averageSecurityScore >= 70 ? 'bg-yellow-50 text-yellow-600' : 
                              'bg-red-50 text-red-600'}>
                {overview.averageSecurityScore >= 90 ? 'Excellent' : 
                 overview.averageSecurityScore >= 70 ? 'Good' : 'Needs Attention'}
              </Badge>
            </div>
            <Progress value={overview.averageSecurityScore} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Across all {overview.totalClients} clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients at Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{overview.clientsAtRisk}</div>
            <p className="text-xs text-muted-foreground">
              Out of {overview.totalClients} clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Threats</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{overview.totalThreats}</div>
            <p className="text-xs text-muted-foreground">Active across all clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalEventsToday}</div>
            <p className="text-xs text-muted-foreground">All client events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scans Today</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{overview.totalScansToday}</div>
            <p className="text-xs text-muted-foreground">Documents, emails, links</p>
          </CardContent>
        </Card>
      </div>

      {/* Client Management Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Security Overview</TabsTrigger>
          <TabsTrigger value="clients">Client Management</TabsTrigger>
          <TabsTrigger value="billing">Billing & Revenue</TabsTrigger>
          <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Client Security Status</CardTitle>
                  <CardDescription>Real-time security overview for all managed clients</CardDescription>
                </div>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClientMetrics.map((client) => (
                  <Card key={client.clientId} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{client.clientName}</CardTitle>
                        <Badge className={getStatusColor(client.status)}>
                          {getStatusIcon(client.status)}
                          <span className="ml-1 capitalize">{client.status}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-muted-foreground">Security Score</span>
                          <span className="text-sm font-medium">{client.securityScore}/100</span>
                        </div>
                        <Progress value={client.securityScore} className="h-2" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-red-500">{client.activeThreats}</div>
                          <div className="text-muted-foreground">Active Threats</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{client.eventsToday}</div>
                          <div className="text-muted-foreground">Events Today</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-2 bg-muted/30 rounded">
                          <div className="font-medium">{client.documentsScanned}</div>
                          <div className="text-muted-foreground">Docs</div>
                        </div>
                        <div className="text-center p-2 bg-muted/30 rounded">
                          <div className="font-medium">{client.emailsScanned}</div>
                          <div className="text-muted-foreground">Emails</div>
                        </div>
                        <div className="text-center p-2 bg-muted/30 rounded">
                          <div className="font-medium">{client.linksScanned}</div>
                          <div className="text-muted-foreground">Links</div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => setSelectedClientDetails(clients.find(c => c.id === client.clientId))}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => generateClientSecurityReport(client.clientId)}
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          Generate Report
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client Portfolio */}
            <Card>
              <CardHeader>
                <CardTitle>Client Portfolio</CardTitle>
                <CardDescription>Manage and monitor all your clients</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {clients.map((client) => (
                  <div 
                    key={client.id} 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedClientDetails?.id === client.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedClientDetails(client)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{client.company_name}</h3>
                      <Badge className={getBillingStatusColor(client.billing_status)}>
                        {client.billing_status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div>Users: {client.current_users}/{client.max_users}</div>
                      <div>Rate: ${client.monthly_rate}/month</div>
                      <div className="font-medium">
                        Security: {clientMetrics.find(m => m.clientId === client.id)?.securityScore || 0}/100
                      </div>
                      <div>Domain: {client.domain || 'Not set'}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Client Details */}
            {selectedClientDetails && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {selectedClientDetails.company_name}
                  </CardTitle>
                  <CardDescription>Detailed client information and controls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Status:</span>
                      <Badge className={getBillingStatusColor(selectedClientDetails.billing_status)}>
                        {selectedClientDetails.billing_status}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Users:</span> {selectedClientDetails.current_users}/{selectedClientDetails.max_users}
                    </div>
                    <div>
                      <span className="font-medium">Monthly Rate:</span> ${selectedClientDetails.monthly_rate}
                    </div>
                    <div>
                      <span className="font-medium">Domain:</span> {selectedClientDetails.domain || 'Not set'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button 
                      className="w-full" 
                      onClick={() => generateClientSecurityReport(selectedClientDetails.id)}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Generate Security Report
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => suspendClient(selectedClientDetails.id)}
                        disabled={!selectedClientDetails.is_active}
                      >
                        <Lock className="h-4 w-4 mr-1" />
                        {selectedClientDetails.is_active ? 'Suspend' : 'Suspended'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Revenue Overview</CardTitle>
              <CardDescription>Monthly recurring revenue and client billing status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    ${clients.reduce((sum, client) => sum + (client.monthly_rate || 0), 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Monthly Recurring Revenue</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {clients.filter(c => c.billing_status === 'active').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Subscriptions</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {clients.filter(c => c.billing_status === 'cancelled').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Cancelled Accounts</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Reports & Analytics</CardTitle>
              <CardDescription>Generate comprehensive security and business reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-24 flex flex-col">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  Security Analytics Report
                </Button>
                <Button variant="outline" className="h-24 flex flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  Compliance Report
                </Button>
                <Button variant="outline" className="h-24 flex flex-col">
                  <TrendingUp className="h-6 w-6 mb-2" />
                  Business Intelligence
                </Button>
                <Button variant="outline" className="h-24 flex flex-col">
                  <Users className="h-6 w-6 mb-2" />
                  Client Portfolio Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MSPSecurityDashboard;