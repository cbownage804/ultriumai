import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Shield, 
  Network, 
  Ticket, 
  AlertTriangle, 
  Activity, 
  Server, 
  Eye, 
  RefreshCw,
  CheckCircle,
  Clock,
  Bug
} from "lucide-react";

interface NetworkAsset {
  id: string;
  ip_address: string;
  hostname: string;
  device_type: string;
  status: string;
  risk_level: string;
  vulnerabilities: string[];
  last_seen: string;
}

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  category: string;
  created_at: string;
}

interface SecurityMetrics {
  totalAssets: number;
  highRiskAssets: number;
  openTickets: number;
  criticalAlerts: number;
  complianceScore: number;
}

export const UnifiedSecurityDashboard = () => {
  const [networkAssets, setNetworkAssets] = useState<NetworkAsset[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalAssets: 0,
    highRiskAssets: 0,
    openTickets: 0,
    criticalAlerts: 0,
    complianceScore: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeScans, setActiveScans] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load network assets
      const { data: assets } = await supabase
        .from('network_assets')
        .select('*')
        .order('last_seen', { ascending: false });

      // Load support tickets
      const { data: tickets } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Load compliance alerts
      const { data: alerts } = await supabase
        .from('compliance_alerts')
        .select('*')
        .eq('status', 'open');

      setNetworkAssets(assets || []);
      setSupportTickets(tickets || []);

      // Calculate metrics
      const totalAssets = assets?.length || 0;
      const highRiskAssets = assets?.filter(a => a.risk_level === 'high' || a.risk_level === 'critical').length || 0;
      const openTickets = tickets?.filter(t => t.status === 'open').length || 0;
      const criticalAlerts = alerts?.filter(a => a.severity === 'critical').length || 0;
      const complianceScore = Math.max(0, 100 - (criticalAlerts * 10) - (highRiskAssets * 5));

      setMetrics({
        totalAssets,
        highRiskAssets,
        openTickets,
        criticalAlerts,
        complianceScore
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const initiateNetworkScan = async () => {
    try {
      setActiveScans(prev => prev + 1);
      
      const { data, error } = await supabase.functions.invoke('compliance-domain-controller', {
        body: {
          action: 'network_scan',
          connectorId: 'unified-agent',
          network_range: '192.168.1.0/24'
        }
      });

      if (error) throw error;

      toast({
        title: "Network Scan Initiated",
        description: `Found ${data.devicesFound} devices, ${data.highRiskDevices} high risk`
      });

      loadDashboardData();
    } catch (error) {
      console.error('Network scan failed:', error);
      toast({
        title: "Scan Failed",
        description: "Failed to initiate network scan",
        variant: "destructive"
      });
    } finally {
      setActiveScans(prev => Math.max(0, prev - 1));
    }
  };

  const runMDRAnalysis = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('compliance-domain-controller', {
        body: {
          action: 'mdr_analysis',
          connectorId: 'unified-agent'
        }
      });

      if (error) throw error;

      toast({
        title: "MDR Analysis Complete",
        description: `Detected ${data.threatsDetected} threats requiring attention`
      });

      loadDashboardData();
    } catch (error) {
      console.error('MDR analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to run MDR analysis",
        variant: "destructive"
      });
    }
  };

  const createTicket = async (title: string, description: string, priority: string = 'medium') => {
    try {
      const { error } = await supabase.functions.invoke('compliance-domain-controller', {
        body: {
          action: 'create_ticket',
          connectorId: 'unified-agent',
          title,
          description,
          priority
        }
      });

      if (error) throw error;

      toast({
        title: "Ticket Created",
        description: "Support ticket has been created successfully"
      });

      loadDashboardData();
    } catch (error) {
      console.error('Ticket creation failed:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create support ticket",
        variant: "destructive"
      });
    }
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
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
          <h1 className="text-3xl font-bold text-foreground">Unified Security Dashboard</h1>
          <p className="text-muted-foreground">Complete cybersecurity monitoring and management</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={initiateNetworkScan} disabled={activeScans > 0}>
            {activeScans > 0 ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Network className="w-4 h-4 mr-2" />}
            Network Scan
          </Button>
          <Button onClick={runMDRAnalysis} variant="outline">
            <Shield className="w-4 h-4 mr-2" />
            MDR Analysis
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {metrics.criticalAlerts > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Security Issues Detected</AlertTitle>
          <AlertDescription>
            You have {metrics.criticalAlerts} critical security issues that require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Security Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Assets</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalAssets}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.highRiskAssets} high risk
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.openTickets}</div>
            <p className="text-xs text-muted-foreground">
              Support requests
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
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.complianceScore}%</div>
            <Progress value={metrics.complianceScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agent Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Active</span>
            </div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="assets" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            Network Assets
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex items-center gap-2">
            <Ticket className="w-4 h-4" />
            Support Tickets
          </TabsTrigger>
          <TabsTrigger value="threats" className="flex items-center gap-2">
            <Bug className="w-4 h-4" />
            Threat Detection
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Real-time Monitor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assets">
          <Card>
            <CardHeader>
              <CardTitle>Network Assets</CardTitle>
              <CardDescription>Discovered devices and their security status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {networkAssets.length > 0 ? (
                  networkAssets.map(asset => (
                    <div key={asset.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Server className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium">{asset.hostname || asset.ip_address}</h4>
                          <p className="text-sm text-muted-foreground">
                            {asset.ip_address} • {asset.device_type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Last seen: {new Date(asset.last_seen).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getRiskBadgeColor(asset.risk_level)}>
                          {asset.risk_level.toUpperCase()}
                        </Badge>
                        {asset.vulnerabilities.length > 0 && (
                          <Badge variant="outline">
                            {asset.vulnerabilities.length} CVEs
                          </Badge>
                        )}
                        <Badge variant={asset.status === 'online' ? 'default' : 'destructive'}>
                          {asset.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Server className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No network assets discovered yet</p>
                    <p className="text-sm">Run a network scan to discover devices</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Support Tickets</CardTitle>
                  <CardDescription>Incident and support request management</CardDescription>
                </div>
                <Button 
                  onClick={() => createTicket(
                    "Security Incident",
                    "Automated security incident detected by unified agent"
                  )}
                  size="sm"
                >
                  Create Ticket
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {supportTickets.length > 0 ? (
                  supportTickets.map(ticket => (
                    <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Ticket className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium">{ticket.title}</h4>
                          <p className="text-sm text-muted-foreground">{ticket.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Created: {new Date(ticket.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getPriorityBadgeColor(ticket.priority)}>
                          {ticket.priority.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {ticket.category}
                        </Badge>
                        <Badge variant={ticket.status === 'open' ? 'destructive' : 'default'}>
                          {ticket.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Ticket className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No support tickets found</p>
                    <p className="text-sm">Create tickets for incidents and support requests</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="threats">
          <Card>
            <CardHeader>
              <CardTitle>Threat Detection & Response</CardTitle>
              <CardDescription>MDR analysis and automated threat detection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Bug className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">Run MDR analysis to detect threats</p>
                <Button onClick={runMDRAnalysis}>
                  <Shield className="w-4 h-4 mr-2" />
                  Start Threat Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Security Monitoring</CardTitle>
              <CardDescription>Live security events and system status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">Unified Agent</span>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">Network Monitoring</span>
                  </div>
                  <Badge variant="default">Scanning</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">Compliance Monitoring</span>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">Threat Detection</span>
                  </div>
                  <Badge variant="outline">Standby</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};