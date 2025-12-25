import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
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
  RefreshCw,
  Zap,
  TrendingUp,
  TrendingDown,
  Radio,
  Target,
  Cpu,
  HardDrive,
  Wifi,
  WifiOff,
  ChevronRight,
  Brain
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useVanguardAgents } from "@/hooks/useVanguardAgents";
import { useToast } from "@/hooks/use-toast";

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
  agentId?: string;
}

interface IncidentMetrics {
  totalAlerts: number;
  activeIncidents: number;
  resolvedToday: number;
  agentsOnline: number;
  totalAgents: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

interface LiveThreatFeed {
  id: string;
  type: string;
  message: string;
  severity: string;
  timestamp: Date;
}

export const VanguardSOC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState("24h");
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [liveFeed, setLiveFeed] = useState<LiveThreatFeed[]>([]);
  const [metrics, setMetrics] = useState<IncidentMetrics>({
    totalAlerts: 0,
    activeIncidents: 0,
    resolvedToday: 0,
    agentsOnline: 0,
    totalAgents: 0,
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isInvestigating, setIsInvestigating] = useState<string | null>(null);
  const { agents } = useVanguardAgents();
  const { toast } = useToast();

  // Real-time subscription for security incidents
  useEffect(() => {
    const channel = supabase
      .channel('soc-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'security_incidents' },
        (payload) => {
          console.log('Real-time security incident update:', payload);
          // Add to live feed
          const incident = payload.new as any;
          if (incident) {
            setLiveFeed(prev => [{
              id: incident.id || crypto.randomUUID(),
              type: payload.eventType === 'INSERT' ? 'NEW_THREAT' : 'UPDATE',
              message: incident.title || 'Security event detected',
              severity: incident.severity || 'medium',
              timestamp: new Date()
            }, ...prev].slice(0, 20));
          }
          // Reload data
          loadSecurityData();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'security_scans' },
        (payload) => {
          console.log('Real-time security scan update:', payload);
          const scan = payload.new as any;
          if (scan) {
            setLiveFeed(prev => [{
              id: scan.id || crypto.randomUUID(),
              type: 'SCAN_COMPLETE',
              message: `Scan completed on ${scan.target}`,
              severity: scan.critical_count > 0 ? 'critical' : scan.high_count > 0 ? 'high' : 'low',
              timestamp: new Date()
            }, ...prev].slice(0, 20));
          }
          loadSecurityData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  const loadSecurityData = useCallback(async () => {
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
          deviceIp: agent?.ip_address || affectedAssets?.[0]?.device_ip || undefined,
          agentId: agent?.id
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

      // Calculate detailed metrics
      const criticalCount = allAlerts.filter(a => a.severity === 'critical').length;
      const highCount = allAlerts.filter(a => a.severity === 'high').length;
      const mediumCount = allAlerts.filter(a => a.severity === 'medium').length;
      const lowCount = allAlerts.filter(a => a.severity === 'low').length;
      const openIncidents = (incidents || []).filter(i => i.status === 'open' || i.status === 'investigating').length;

      setMetrics(prev => ({
        ...prev,
        totalAlerts: allAlerts.length,
        activeIncidents: openIncidents,
        resolvedToday: (incidents || []).filter(i => i.status === 'resolved').length,
        criticalCount,
        highCount,
        mediumCount,
        lowCount
      }));

    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAIInvestigate = async (alert: SecurityAlert) => {
    setIsInvestigating(alert.id);
    try {
      const { data, error } = await supabase.functions.invoke('ai-threat-investigator', {
        body: {
          threat_id: alert.id,
          threat_title: alert.title,
          threat_description: alert.description,
          severity: alert.severity,
          source: alert.source,
          device_name: alert.deviceName,
          device_ip: alert.deviceIp
        }
      });

      if (error) throw error;

      toast({
        title: "AI Investigation Complete",
        description: data?.summary || "Analysis ready for review",
      });

      loadSecurityData();
    } catch (error) {
      console.error('AI investigation error:', error);
      toast({
        title: "Investigation Error",
        description: "Failed to complete AI analysis",
        variant: "destructive"
      });
    } finally {
      setIsInvestigating(null);
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
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'investigating': return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'false_positive': return <XCircle className="h-4 w-4 text-muted-foreground" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getThreatLevel = () => {
    if (metrics.criticalCount > 0) return { level: 'CRITICAL', color: 'text-red-500', bg: 'bg-red-500/10' };
    if (metrics.highCount > 0) return { level: 'ELEVATED', color: 'text-orange-500', bg: 'bg-orange-500/10' };
    if (metrics.mediumCount > 0) return { level: 'GUARDED', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
    return { level: 'LOW', color: 'text-green-500', bg: 'bg-green-500/10' };
  };

  const threatLevel = getThreatLevel();

  return (
    <div className="space-y-6">
      {/* Header with Live Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Eye className="h-6 w-6 text-primary" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Security Operations Center</h2>
            <div className="flex items-center gap-2 text-sm">
              <Radio className="h-3 w-3 text-green-500 animate-pulse" />
              <span className="text-muted-foreground">Real-time monitoring active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-lg ${threatLevel.bg} border`}>
            <div className="flex items-center gap-2">
              <Shield className={`h-4 w-4 ${threatLevel.color}`} />
              <span className={`font-bold ${threatLevel.color}`}>THREAT LEVEL: {threatLevel.level}</span>
            </div>
          </div>
          <Button variant="outline" onClick={loadSecurityData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {metrics.criticalCount > 0 && (
        <Alert className="border-red-500 bg-red-500/10 animate-pulse">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-600 font-medium">
            {metrics.criticalCount} CRITICAL security issue{metrics.criticalCount > 1 ? 's' : ''} require immediate attention
          </AlertDescription>
        </Alert>
      )}

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Critical</p>
                <p className="text-2xl font-bold text-red-500">{metrics.criticalCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">High</p>
                <p className="text-2xl font-bold text-orange-500">{metrics.highCount}</p>
              </div>
              <Zap className="h-8 w-8 text-orange-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Medium</p>
                <p className="text-2xl font-bold text-yellow-500">{metrics.mediumCount}</p>
              </div>
              <Activity className="h-8 w-8 text-yellow-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Low</p>
                <p className="text-2xl font-bold text-blue-500">{metrics.lowCount}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Resolved</p>
                <p className="text-2xl font-bold text-green-500">{metrics.resolvedToday}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Agents</p>
                <p className="text-2xl font-bold">{metrics.agentsOnline}/{metrics.totalAgents}</p>
              </div>
              <Server className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Alerts Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Active Threats
                  </CardTitle>
                  <CardDescription>Security incidents requiring attention</CardDescription>
                </div>
                <select 
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="px-3 py-1 border rounded text-sm bg-background"
                >
                  <option value="1h">Last Hour</option>
                  <option value="24h">Last 24h</option>
                  <option value="7d">Last Week</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="h-16 w-16 mx-auto mb-4 text-green-500/50" />
                  <p className="font-medium text-lg">All Clear</p>
                  <p className="text-sm text-muted-foreground">No active security threats detected</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {alerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                        alert.severity === 'critical' ? 'border-red-500/50 bg-red-500/5' :
                        alert.severity === 'high' ? 'border-orange-500/50 bg-orange-500/5' :
                        'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getStatusIcon(alert.status)}
                            <h3 className="font-semibold truncate">{alert.title}</h3>
                            <Badge className={getSeverityColor(alert.severity)} variant="secondary">
                              {alert.severity.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{alert.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                            {alert.deviceName && (
                              <span className="flex items-center gap-1">
                                <Server className="h-3 w-3" />
                                {alert.deviceName}
                                {alert.deviceIp && <span className="opacity-70">({alert.deviceIp})</span>}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {alert.timestamp}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleAIInvestigate(alert)}
                            disabled={isInvestigating === alert.id}
                          >
                            {isInvestigating === alert.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Brain className="h-4 w-4" />
                            )}
                            <span className="ml-1 hidden sm:inline">AI Investigate</span>
                          </Button>
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Live Threat Feed */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Radio className="h-4 w-4 text-green-500 animate-pulse" />
                Live Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {liveFeed.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Waiting for events...
                  </p>
                ) : (
                  liveFeed.map((item) => (
                    <div key={item.id} className="flex items-start gap-2 text-xs p-2 rounded bg-muted/50">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                        item.severity === 'critical' ? 'bg-red-500' :
                        item.severity === 'high' ? 'bg-orange-500' :
                        item.severity === 'medium' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`} />
                      <div className="min-w-0">
                        <p className="truncate">{item.message}</p>
                        <p className="text-muted-foreground">
                          {item.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Agent Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                Agent Fleet
              </CardTitle>
            </CardHeader>
            <CardContent>
              {agents.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No agents deployed</p>
              ) : (
                <div className="space-y-2">
                  {agents.slice(0, 6).map(agent => {
                    const isOnline = agent.last_heartbeat && 
                      new Date(agent.last_heartbeat).getTime() > Date.now() - 5 * 60 * 1000;
                    return (
                      <div key={agent.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <div className="flex items-center gap-2">
                          {isOnline ? (
                            <Wifi className="h-3 w-3 text-green-500" />
                          ) : (
                            <WifiOff className="h-3 w-3 text-red-500" />
                          )}
                          <span className="text-sm font-medium truncate max-w-[120px]">{agent.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {agent.location || 'Unknown'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Cpu className="h-4 w-4" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Platform</span>
                <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Operational</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Agents</span>
                <Badge className={metrics.agentsOnline > 0 ? "bg-green-500/20 text-green-600 border-green-500/30" : "bg-yellow-500/20 text-yellow-600 border-yellow-500/30"}>
                  {metrics.agentsOnline > 0 ? 'Connected' : 'None Online'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Scanning</span>
                <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Ready</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Connected</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};