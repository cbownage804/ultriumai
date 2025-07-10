import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Shield, 
  ShieldAlert, 
  Search, 
  Eye, 
  Activity, 
  AlertTriangle,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Target,
  Users,
  FileText,
  Play,
  Download
} from "lucide-react";
import { SafeMDRAgentDownloads } from "./SafeMDRAgentDownloads";

interface EDRAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description?: string;
  status: string;
  endpoint_id?: string;
  behavioral_analysis_id?: string;
  analyst_assigned?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  indicators_of_compromise?: any;
  response_actions_taken?: any;
  auto_response_enabled?: boolean;
  user_id: string;
}

interface EDRInvestigation {
  id: string;
  alert_type: string;
  title: string;
  description?: string;
  severity: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface DashboardStats {
  total_alerts: number;
  new_alerts: number;
  critical_alerts: number;
  investigations_open: number;
  mean_response_time: number;
  threats_mitigated: number;
  escalation_rate: number;
}

export const SafeMDRDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    total_alerts: 0,
    new_alerts: 0,
    critical_alerts: 0,
    investigations_open: 0,
    mean_response_time: 0,
    threats_mitigated: 0,
    escalation_rate: 0
  });
  const [alerts, setAlerts] = useState<EDRAlert[]>([]);
  const [investigations, setInvestigations] = useState<EDRInvestigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'alerts' | 'investigations' | 'analytics' | 'agents'>('overview');
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Load alerts from EDR system
      const { data: alertsData } = await supabase
        .from('edr_realtime_alerts')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      // Load investigations (using compliance_alerts as investigation proxy)
      const { data: investigationsData } = await supabase
        .from('compliance_alerts')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('alert_type', 'investigation')
        .order('created_at', { ascending: false })
        .limit(10);

      setAlerts(alertsData || []);
      setInvestigations(investigationsData || []);
      
      // Calculate stats
      const newAlertCount = alertsData?.filter(alert => alert.status === 'new').length || 0;
      const criticalAlertCount = alertsData?.filter(alert => alert.severity === 'critical').length || 0;
      const openInvestigations = investigationsData?.filter(inv => inv.status === 'open').length || 0;
      const resolvedAlerts = alertsData?.filter(alert => alert.status === 'resolved').length || 0;
      
      // Calculate mean response time (mock calculation)
      const responseTimes = alertsData?.filter(alert => alert.resolved_at).map(alert => {
        const created = new Date(alert.created_at).getTime();
        const resolved = new Date(alert.resolved_at!).getTime();
        return (resolved - created) / (1000 * 60); // in minutes
      }) || [];
      
      const meanResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0;

      setStats({
        total_alerts: alertsData?.length || 0,
        new_alerts: newAlertCount,
        critical_alerts: criticalAlertCount,
        investigations_open: openInvestigations,
        mean_response_time: Math.round(meanResponseTime),
        threats_mitigated: resolvedAlerts,
        escalation_rate: alertsData?.length ? ((alertsData.filter(a => a.severity === 'critical').length / alertsData.length) * 100) : 0
      });
    } catch (error) {
      console.error('Error loading SafeMDR data:', error);
      toast({
        title: "Error",
        description: "Failed to load SafeMDR data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const simulateNewAlert = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const alertTypes = ['Suspicious Process Execution', 'Unauthorized Access Attempt', 'Data Exfiltration', 'Malware Detection', 'Network Anomaly'];
      const severities = ['low', 'medium', 'high', 'critical'];
      const randomType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      const randomSeverity = severities[Math.floor(Math.random() * severities.length)];

      const { data, error } = await supabase
        .from('edr_realtime_alerts')
        .insert({
          user_id: user.user.id,
          alert_type: randomType,
          severity: randomSeverity,
          title: `${randomType} Detected`,
          description: `AI-powered detection of ${randomType.toLowerCase()} requiring immediate attention`,
          status: 'new',
          endpoint_id: null, // Would be actual endpoint ID in production
          behavioral_analysis_id: null, // Would link to behavioral analysis
          indicators_of_compromise: [
            {
              type: 'file_hash',
              value: `sha256:${Math.random().toString(36).substring(2, 15)}`,
              confidence: 85
            }
          ],
          response_actions_taken: [],
          auto_response_enabled: true
        })
        .select()
        .single();

      if (error) throw error;

      // Create investigation record if critical
      if (randomSeverity === 'critical') {
        await supabase
          .from('compliance_alerts')
          .insert({
            user_id: user.user.id,
            alert_type: 'investigation',
            severity: 'high',
            title: `Investigation: ${randomType}`,
            description: `Critical alert investigation for ${randomType}`,
            status: 'open'
          });
      }

      toast({
        title: `${randomSeverity === 'critical' ? '🚨' : '⚠️'} New Alert Generated`,
        description: `${randomType} - ${randomSeverity.toUpperCase()} severity`,
        variant: randomSeverity === 'critical' ? "destructive" : "default",
      });

      await loadDashboardData();
    } catch (error) {
      console.error('Error simulating alert:', error);
      toast({
        title: "Error",
        description: "Failed to generate alert",
        variant: "destructive",
      });
    }
  };

  const assignAlert = async (alertId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      await supabase
        .from('edr_realtime_alerts')
        .update({
          status: 'investigating',
          analyst_assigned: user.user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', alertId);

      toast({
        title: "Alert Assigned",
        description: "Alert has been assigned to you for investigation",
      });

      await loadDashboardData();
    } catch (error) {
      console.error('Error assigning alert:', error);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await supabase
        .from('edr_realtime_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', alertId);

      toast({
        title: "Alert Resolved",
        description: "Alert has been marked as resolved",
      });

      await loadDashboardData();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'text-red-600';
      case 'investigating': return 'text-blue-600';
      case 'confirmed': return 'text-orange-600';
      case 'resolved': return 'text-green-600';
      case 'false_positive': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <AlertCircle className="h-4 w-4" />;
      case 'investigating': return <Search className="h-4 w-4" />;
      case 'confirmed': return <AlertTriangle className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'false_positive': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Eye className="h-8 w-8 text-primary" />
            SafeMDR - AI-Powered Managed Detection & Response
          </h1>
          <p className="text-muted-foreground">
            Real-time behavioral analysis • Automated threat response
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={simulateNewAlert} variant="secondary">
            <Play className="h-4 w-4 mr-2" />
            Simulate Alert
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-2">
        <Button 
          variant={activeView === 'overview' ? 'default' : 'outline'}
          onClick={() => setActiveView('overview')}
        >
          <Activity className="h-4 w-4 mr-2" />
          Overview
        </Button>
        <Button 
          variant={activeView === 'alerts' ? 'default' : 'outline'}
          onClick={() => setActiveView('alerts')}
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Alerts ({stats.total_alerts})
        </Button>
        <Button 
          variant={activeView === 'investigations' ? 'default' : 'outline'}
          onClick={() => setActiveView('investigations')}
        >
          <Search className="h-4 w-4 mr-2" />
          Investigations ({stats.investigations_open})
        </Button>
        <Button 
          variant={activeView === 'analytics' ? 'default' : 'outline'}
          onClick={() => setActiveView('analytics')}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Analytics
        </Button>
        <Button 
          variant={activeView === 'agents' ? 'default' : 'outline'}
          onClick={() => setActiveView('agents')}
        >
          <Download className="h-4 w-4 mr-2" />
          Agent Downloads
        </Button>
      </div>

      {/* Critical Alerts */}
      {stats.critical_alerts > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            🚨 <strong>{stats.critical_alerts} critical alerts</strong> require immediate investigation.
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Dashboard */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.new_alerts}</div>
                <p className="text-xs text-muted-foreground">Awaiting review</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.critical_alerts}</div>
                <p className="text-xs text-muted-foreground">High priority</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Investigations</CardTitle>
                <Search className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.investigations_open}</div>
                <p className="text-xs text-muted-foreground">In progress</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mean Response Time</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.mean_response_time}m</div>
                <p className="text-xs text-muted-foreground">Average response</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Recent Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(alert.status)}
                        <div>
                          <p className="font-medium">{alert.title}</p>
                          <p className="text-sm text-muted-foreground">{alert.alert_type}</p>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge variant={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <div className={`text-sm ${getStatusColor(alert.status)}`}>
                          {alert.status}
                        </div>
                      </div>
                    </div>
                  ))}
                  {alerts.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No alerts detected. Your environment is secure.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Active Investigations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {investigations.slice(0, 5).map((investigation) => (
                    <div key={investigation.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{investigation.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Type: {investigation.alert_type}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          {investigation.status}
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          {investigation.severity}
                        </div>
                      </div>
                    </div>
                  ))}
                  {investigations.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No active investigations.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Alerts View */}
      {activeView === 'alerts' && (
        <Card>
          <CardHeader>
            <CardTitle>Security Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(alert.status)}
                    <div>
                      <p className="font-medium">{alert.title}</p>
                      <p className="text-sm text-muted-foreground">{alert.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(alert.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {alert.status === 'new' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => assignAlert(alert.id)}
                      >
                        Assign
                      </Button>
                    )}
                    {alert.status === 'investigating' && (
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        Resolve
                      </Button>
                    )}
                    <div className={`text-sm font-medium ${getStatusColor(alert.status)}`}>
                      {alert.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Investigations View */}
      {activeView === 'investigations' && (
        <Card>
          <CardHeader>
            <CardTitle>Active Investigations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {investigations.map((investigation) => (
                <div key={investigation.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{investigation.title}</p>
                    <Badge variant="outline">
                      {investigation.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span> {investigation.alert_type}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Severity:</span> {investigation.severity}
                    </div>
                  </div>
                  {investigation.description && (
                    <div className="mt-2 p-2 bg-muted rounded text-sm">
                      <strong>Description:</strong> {investigation.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics View */}
      {activeView === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Response Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Mean Response Time:</span>
                  <span className="font-bold">{stats.mean_response_time} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Threats Mitigated:</span>
                  <span className="font-bold text-green-600">{stats.threats_mitigated}</span>
                </div>
                <div className="flex justify-between">
                  <span>Escalation Rate:</span>
                  <span className="font-bold">{stats.escalation_rate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Investigations:</span>
                  <span className="font-bold text-blue-600">{stats.investigations_open}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alert Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Critical:</span>
                  <span className="font-bold text-red-600">{stats.critical_alerts}</span>
                </div>
                <div className="flex justify-between">
                  <span>High:</span>
                  <span className="font-bold text-orange-600">
                    {alerts.filter(a => a.severity === 'high').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Medium:</span>
                  <span className="font-bold text-yellow-600">
                    {alerts.filter(a => a.severity === 'medium').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Low:</span>
                  <span className="font-bold text-green-600">
                    {alerts.filter(a => a.severity === 'low').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Agent Downloads View */}
      {activeView === 'agents' && (
        <SafeMDRAgentDownloads />
      )}
    </div>
  );
};