import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  DollarSign,
  Server,
  Wifi,
  Ticket,
  Plus
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface ServiceStatus {
  id: string;
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  lastChecked: string;
}

const ClientPortalDashboard = () => {
  const [clientData, setClientData] = useState<any>(null);
  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadClientData();
  }, []);

  const loadClientData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get client information
      const { data: clientUser } = await supabase
        .from('client_users')
        .select(`
          *,
          msp_clients!inner(*)
        `)
        .eq('user_id', user.id)
        .single();

      if (clientUser) {
        setClientData(clientUser);
        loadMockData();
      }
    } catch (error) {
      console.error('Error loading client data:', error);
      toast({
        title: "Error",
        description: "Failed to load client data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    // Mock service statuses
    setServiceStatuses([
      { id: '1', name: 'Email Service', status: 'operational', lastChecked: new Date().toISOString() },
      { id: '2', name: 'Network Security', status: 'operational', lastChecked: new Date().toISOString() },
      { id: '3', name: 'Backup System', status: 'operational', lastChecked: new Date().toISOString() },
      { id: '4', name: 'Monitoring', status: 'operational', lastChecked: new Date().toISOString() }
    ]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'outage':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-100 text-green-800';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'outage':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Unable to load client data. Please contact your administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Service Portal</h1>
          <p className="text-muted-foreground">
            Welcome back, {clientData.msp_clients?.client_name || 'Client'}
          </p>
        </div>
        <Button onClick={() => navigate('/client/tickets/new')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Ticket
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Health</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">98.5%</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">5 total tickets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">Action required</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceStatuses.length}</div>
            <p className="text-xs text-muted-foreground">Services monitored</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Service Status
            </CardTitle>
            <CardDescription>Current status of your services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {serviceStatuses.map((service) => (
              <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Last checked: {new Date(service.lastChecked).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <Badge className={getStatusColor(service.status)}>
                  {service.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest updates and events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <p className="font-medium">Email server maintenance</p>
                <p className="text-sm text-muted-foreground">
                  Scheduled for this weekend
                </p>
              </div>
              <Badge variant="outline">Scheduled</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <p className="font-medium">Security scan completed</p>
                <p className="text-sm text-muted-foreground">
                  No issues found
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800">Complete</Badge>
            </div>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/client/tickets')}
            >
              View All Activity
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/client/tickets/new')}
              className="h-20 flex flex-col gap-2"
            >
              <Ticket className="h-6 w-6" />
              <span>Create Ticket</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/client/billing')}
              className="h-20 flex flex-col gap-2"
            >
              <DollarSign className="h-6 w-6" />
              <span>View Billing</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/client/status')}
              className="h-20 flex flex-col gap-2"
            >
              <Shield className="h-6 w-6" />
              <span>Service Status</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientPortalDashboard;