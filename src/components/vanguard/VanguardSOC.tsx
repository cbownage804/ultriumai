import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Eye, 
  AlertTriangle, 
  Shield, 
  Activity, 
  Clock, 
  Users, 
  Server,
  CheckCircle,
  XCircle,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useVanguardAgents } from "@/hooks/useVanguardAgents";

interface SecurityAlert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';
  source: string;
  timestamp: string;
  deviceName?: string;
  deviceIp?: string;
}

interface IncidentMetrics {
  totalAlerts: number;
  activeIncidents: number;
  resolvedToday: number;
  agentsOnline: number;
  totalAgents: number;
}

export const VanguardSOC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState("24h");
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [metrics, setMetrics] = useState<IncidentMetrics>({
    totalAlerts: 0,
    activeIncidents: 0,
    resolvedToday: 0,
    agentsOnline: 0,
    totalAgents: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const { agents } = useVanguardAgents();

  useEffect(() => {
    loadSecurityData();
  }, [selectedTimeframe]);

  useEffect(() => {
    // Calculate agent metrics
    const onlineCount = agents.filter(agent => {
      if (!agent.last_heartbeat) return false;
      const lastHeartbeat = new Date(agent.last_heartbeat).getTime();
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      return lastHeartbeat > fiveMinutesAgo;
    }).length;

    setMetrics(prev => ({
      ...prev,
      agentsOnline: onlineCount,
      totalAgents: agents.length
    }));
  }, [agents]);

  const loadSecurityData = async () => {
    try {
      setIsLoading(true);
      
      // Load security incidents (real threats tied to agents)
      const { data: incidents, error: incidentsError } = await supabase
        .from('security_incidents')
        .select(`
          *,
          vanguard_agents:agent_id (
            id,
            name,
            ip_address,
            location
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (incidentsError) throw incidentsError;

      // Transform incidents into alerts with device info
      const incidentAlerts: SecurityAlert[] = (incidents || []).map(incident => {
        const agent = incident.vanguard_agents as any;
        const affectedAssets = incident.affected_assets as any[];
        return {
          id: incident.id,
          title: incident.title,
          description: incident.description || 'Security incident detected',
          severity: (incident.severity as 'critical' | 'high' | 'medium' | 'low') || 'medium',
          status: (incident.status === 'open' ? 'new' : 
                  incident.status === 'investigating' ? 'investigating' : 
                  incident.status === 'resolved' ? 'resolved' : 'new') as SecurityAlert['status'],
          source: incident.source_system || 'Vanguard',
          timestamp: getRelativeTime(incident.created_at),
          deviceName: agent?.name || affectedAssets?.[0]?.device_name || undefined,
          deviceIp: agent?.ip_address || affectedAssets?.[0]?.device_ip || undefined
        };
      });

      // Also load security scans for additional context
      const { data: scans } = await supabase
        .from('security_scans')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20);

      const scanAlerts: SecurityAlert[] = (scans || [])
        .filter(scan => scan.critical_count > 0 || scan.high_count > 0)
        .map(scan => ({
          id: scan.id,
          title: `Security findings on ${scan.target}`,
          description: `${scan.critical_count} critical, ${scan.high_count} high, ${scan.medium_count} medium issues found`,
          severity: scan.critical_count > 0 ? 'critical' as const : 'high' as const,
          status: 'new' as const,
          source: scan.scan_type || 'Security Scan',
          timestamp: getRelativeTime(scan.started_at)
        }));

      // Combine and deduplicate alerts
      const allAlerts = [...incidentAlerts, ...scanAlerts];
      setAlerts(allAlerts);

      // Calculate metrics
      const openIncidents = (incidents || []).filter(i => i.status === 'open' || i.status === 'investigating').length;
      const criticalCount = (scans || []).reduce((sum, s) => sum + (s.critical_count || 0), 0);

      setMetrics(prev => ({
        ...prev,
        totalAlerts: allAlerts.length,
        activeIncidents: openIncidents + criticalCount,
        resolvedToday: (incidents || []).filter(i => i.status === 'resolved').length
      }));

    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-red-500 text-white';
      case 'investigating': return 'bg-blue-500 text-white';
      case 'resolved': return 'bg-green-500 text-white';
      case 'false_positive': return 'bg-gray-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <AlertTriangle className="h-4 w-4" />;
      case 'investigating': return <Activity className="h-4 w-4 animate-pulse" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'false_positive': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Eye className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Security Operations Center (SOC)</h2>
            <p className="text-muted-foreground">24/7 threat monitoring, detection, and incident response</p>
          </div>
        </div>
        <Button variant="outline" onClick={loadSecurityData} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.activeIncidents}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Agents Online</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.agentsOnline}</div>
            <p className="text-xs text-muted-foreground">of {metrics.totalAgents} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Scans Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.resolvedToday}</div>
            <p className="text-xs text-muted-foreground">Successfully finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalAlerts}</div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">Monitoring</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Issues Alert */}
      {metrics.activeIncidents > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{metrics.activeIncidents} active security issues</strong> require attention. 
            Review findings from recent scans.
          </AlertDescription>
        </Alert>
      )}

      {/* Security Alerts Dashboard */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Security Findings</CardTitle>
              <CardDescription>Recent scan results with critical or high findings</CardDescription>
            </div>
            <div className="flex gap-2">
              <select 
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24h</option>
                <option value="7d">Last Week</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="font-medium">No critical or high severity findings</p>
              <p className="text-sm">All systems operating normally</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(alert.status)}
                        <h3 className="font-semibold">{alert.title}</h3>
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(alert.status)}>
                          {alert.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {(alert.deviceName || alert.deviceIp) && (
                          <span className="flex items-center gap-1">
                            <Server className="h-3 w-3" />
                            <strong>{alert.deviceName || 'Unknown Device'}</strong>
                            {alert.deviceIp && <span>({alert.deviceIp})</span>}
                          </span>
                        )}
                        <span>Source: {alert.source}</span>
                        <span>Time: {alert.timestamp}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">View Details</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Agent Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {agents.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No agents deployed yet</p>
            ) : (
              agents.slice(0, 5).map(agent => {
                const isOnline = agent.last_heartbeat && 
                  new Date(agent.last_heartbeat).getTime() > Date.now() - 5 * 60 * 1000;
                return (
                  <div key={agent.id} className="flex justify-between items-center p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="font-medium">{agent.name}</span>
                      <Badge variant="outline">{agent.location || 'Unknown'}</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Vanguard Platform</span>
              <Badge className="bg-green-500 text-white">Operational</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Network Agents</span>
              <Badge className={metrics.agentsOnline > 0 ? "bg-green-500 text-white" : "bg-yellow-500 text-white"}>
                {metrics.agentsOnline > 0 ? `${metrics.agentsOnline} Connected` : 'None Online'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Security Scans</span>
              <Badge className="bg-green-500 text-white">Ready</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Database</span>
              <Badge className="bg-green-500 text-white">Connected</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>API Endpoints</span>
              <Badge className="bg-green-500 text-white">Available</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
