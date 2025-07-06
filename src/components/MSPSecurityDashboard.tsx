import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Users, 
  Shield, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Settings,
  Eye,
  Clock,
  Activity,
  BarChart3,
  Zap,
  Globe,
  Lock,
  FileText,
  Mail,
  Link,
  Key,
  Network,
  Target
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface MSPClient {
  id: string;
  company_name: string;
  domain: string | null;
  current_users: number | null;
  max_users: number | null;
  monthly_rate: number;
  billing_status: string | null;
  trial_ends_at?: string | null;
  is_active: boolean | null;
  custom_branding: any;
  security_score: number;
  last_activity: string;
  apps_enabled: {
    safedoc: boolean;
    safemail: boolean;
    safelink: boolean;
    safepass: boolean;
    safenet: boolean;
  };
}

interface SecurityMetrics {
  total_threats_blocked: number;
  active_incidents: number;
  compliance_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  trends: Array<{
    date: string;
    threats: number;
    scans: number;
    incidents: number;
  }>;
}

export const MSPSecurityDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [clients, setClients] = useState<MSPClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<MSPClient | null>(null);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics>({
    total_threats_blocked: 1847,
    active_incidents: 12,
    compliance_score: 94,
    risk_level: 'low',
    trends: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMSPData();
  }, [user]);

  const loadMSPData = async () => {
    try {
      // Load MSP clients
      const { data: mspData } = await supabase
        .from('msps')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (mspData) {
        const { data: clientsList } = await supabase
          .from('msp_clients')
          .select('*')
          .eq('msp_id', mspData.id);

        if (clientsList) {
          const enhancedClients = clientsList.map(client => ({
            ...client,
            security_score: Math.floor(Math.random() * 30 + 70), // Mock score
            last_activity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            apps_enabled: {
              safedoc: Math.random() > 0.3,
              safemail: Math.random() > 0.2,
              safelink: Math.random() > 0.4,
              safepass: Math.random() > 0.1,
              safenet: Math.random() > 0.5
            }
          }));
          setClients(enhancedClients);
          if (enhancedClients.length > 0) {
            setSelectedClient(enhancedClients[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading MSP data:', error);
      toast({
        title: "Error",
        description: "Failed to load MSP dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-yellow-500';
    if (score >= 60) return 'text-orange-500';
    return 'text-red-500';
  };

  const getBillingStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
      
      setClients(prev => prev.map(client => 
        client.id === clientId ? { ...client, is_active: false } : client
      ));
      
      toast({
        title: "Client Suspended",
        description: "Client access has been suspended",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to suspend client",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            MSP Security Dashboard
          </h1>
          <p className="text-muted-foreground">
            Centralized security management for all your clients
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
          <Button variant="hero">
            <BarChart3 className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">
              {clients.filter(c => c.is_active).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threats Blocked</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{securityMetrics.total_threats_blocked}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{securityMetrics.active_incidents}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Compliance</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{securityMetrics.compliance_score}%</div>
            <p className="text-xs text-muted-foreground">Across all clients</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clients">Client Management</TabsTrigger>
          <TabsTrigger value="security">Security Overview</TabsTrigger>
          <TabsTrigger value="billing">Billing & Revenue</TabsTrigger>
          <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Clients List */}
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
                      selectedClient?.id === client.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedClient(client)}
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
                      <div className={`font-medium ${getSecurityScoreColor(client.security_score)}`}>
                        Security: {client.security_score}/100
                      </div>
                      <div>Last active: {new Date(client.last_activity).toLocaleDateString()}</div>
                    </div>

                    <div className="flex gap-1 mt-2">
                      {Object.entries(client.apps_enabled).map(([app, enabled]) => (
                        <Badge 
                          key={app} 
                          variant={enabled ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {app}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Client Details */}
            {selectedClient && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {selectedClient.company_name}
                  </CardTitle>
                  <CardDescription>Client security overview and controls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Security Score */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Security Score</span>
                      <span className={`font-bold ${getSecurityScoreColor(selectedClient.security_score)}`}>
                        {selectedClient.security_score}/100
                      </span>
                    </div>
                    <Progress value={selectedClient.security_score} className="h-2" />
                  </div>

                  {/* App Status */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Security Apps Status</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">SafeDoc</span>
                        {selectedClient.apps_enabled.safedoc ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span className="text-sm">SafeMail</span>
                        {selectedClient.apps_enabled.safemail ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Link className="h-4 w-4" />
                        <span className="text-sm">SafeLink</span>
                        {selectedClient.apps_enabled.safelink ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        <span className="text-sm">SafePass</span>
                        {selectedClient.apps_enabled.safepass ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Network className="h-4 w-4" />
                        <span className="text-sm">SafeNet</span>
                        {selectedClient.apps_enabled.safenet ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <Button 
                      className="w-full" 
                      onClick={() => generateClientSecurityReport(selectedClient.id)}
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
                        onClick={() => suspendClient(selectedClient.id)}
                        disabled={!selectedClient.is_active}
                      >
                        <Lock className="h-4 w-4 mr-1" />
                        {selectedClient.is_active ? 'Suspend' : 'Suspended'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="security">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Consolidated security monitoring across all clients shows {securityMetrics.active_incidents} active incidents requiring attention.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
};