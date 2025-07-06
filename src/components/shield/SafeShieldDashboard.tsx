import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Monitor, 
  Activity, 
  AlertTriangle,
  Zap,
  Eye,
  Lock,
  RefreshCw,
  Bot,
  Play,
  Palette,
  Search
} from "lucide-react";
import { ThreatMonitor } from "./ThreatMonitor";
import { EndpointManager } from "./EndpointManager";
import { SafeAVDashboard } from "./SafeAVDashboard";
import { SafeMDRDashboard } from "./SafeMDRDashboard";
import { EndpointAgentDownloads } from "./EndpointAgentDownloads";
import { MSPWhiteLabelConfig } from "./MSPWhiteLabelConfig";
import { AIResponseGuide } from "./AIResponseGuide";
import { ThreatReportsAnalytics } from "./ThreatReportsAnalytics";

interface DashboardStats {
  total_threats: number;
  threats_24h: number;
  critical_threats: number;
  isolated_endpoints: number;
  active_endpoints: number;
}

interface Endpoint {
  id: string;
  hostname: string;
  ip_address: string;
  os_version: string;
  agent_version: string;
  status: 'online' | 'offline' | 'threat_detected' | 'isolated';
  last_seen: string;
}

interface Threat {
  id: string;
  event_id: string;
  hostname: string;
  threat_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ai_confidence_score: number;
  detected_at: string;
  status: string;
  ai_analysis: any;
}

export const SafeShieldDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    total_threats: 0,
    threats_24h: 0,
    critical_threats: 0,
    isolated_endpoints: 0,
    active_endpoints: 0
  });
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [threats, setThreats] = useState<Threat[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'threats' | 'endpoints' | 'ai-guide' | 'downloads' | 'white-label' | 'safe-av' | 'safe-mdr' | 'reports'>('overview');
  const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time subscriptions
    const endpointsChannel = supabase
      .channel('safe-shield-endpoints')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'safe_shield_endpoints'
      }, () => {
        loadDashboardData();
      })
      .subscribe();

    const threatsChannel = supabase
      .channel('safe-shield-threats')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'safe_shield_threats'
      }, () => {
        loadDashboardData();
        // Show toast for new threats
        toast({
          title: "🚨 New Threat Detected!",
          description: "SafeShield has detected a new security threat",
          variant: "destructive",
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(endpointsChannel);
      supabase.removeChannel(threatsChannel);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const response = await supabase.functions.invoke('safe-shield-agent', {
        body: { 
          action: 'get_dashboard_data',
          user_id: user.user.id
        }
      });

      if (response.error) throw response.error;

      const { endpoints: endpointsData, threats: threatsData, threat_stats } = response.data;
      
      setEndpoints(endpointsData || []);
      setThreats(threatsData || []);
      setStats(threat_stats || stats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load SafeShield data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const simulateThreat = async (hostname?: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const targetHost = hostname || endpoints[Math.floor(Math.random() * endpoints.length)]?.hostname || 'DEMO-PC';

      const response = await supabase.functions.invoke('safe-shield-agent', {
        body: { 
          action: 'simulate_threat',
          hostname: targetHost,
          user_id: user.user.id
        }
      });

      if (response.error) throw response.error;

      const { threat_event, ai_analysis } = response.data;
      
      toast({
        title: "🚨 Threat Detected!",
        description: `${threat_event.threat_type} detected on ${targetHost}`,
        variant: threat_event.severity === 'critical' ? "destructive" : "default",
      });

      // Refresh data to show new threat
      await loadDashboardData();
      
      // If critical, show AI guide
      if (threat_event.severity === 'critical') {
        setSelectedThreat({ ...threat_event, ai_analysis });
        setActiveView('ai-guide');
      }
    } catch (error) {
      console.error('Error simulating threat:', error);
      toast({
        title: "Error",
        description: "Failed to simulate threat",
        variant: "destructive",
      });
    }
  };

  const registerEndpoint = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const response = await supabase.functions.invoke('safe-shield-agent', {
        body: { 
          action: 'register_endpoint',
          user_id: user.user.id
        }
      });

      if (response.error) throw response.error;

      toast({
        title: "Endpoint Registered",
        description: `${response.data.endpoint.hostname} added to SafeShield`,
      });

      await loadDashboardData();
    } catch (error) {
      console.error('Error registering endpoint:', error);
      toast({
        title: "Error",
        description: "Failed to register endpoint",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'isolated': return 'text-red-600';
      case 'threat_detected': return 'text-yellow-600';
      case 'offline': return 'text-gray-500';
      default: return 'text-gray-500';
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
            <Shield className="h-8 w-8 text-primary" />
            SafeShield EDR
          </h1>
          <p className="text-muted-foreground">
            AI-Powered Endpoint Detection & Response Platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={registerEndpoint} variant="outline">
            <Monitor className="h-4 w-4 mr-2" />
            Add Endpoint
          </Button>
          <Button onClick={() => simulateThreat()} variant="secondary">
            <Play className="h-4 w-4 mr-2" />
            Simulate Threat
          </Button>
          <Button onClick={loadDashboardData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
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
          variant={activeView === 'threats' ? 'default' : 'outline'}
          onClick={() => setActiveView('threats')}
        >
          <ShieldAlert className="h-4 w-4 mr-2" />
          Threats ({stats.threats_24h})
        </Button>
        <Button 
          variant={activeView === 'endpoints' ? 'default' : 'outline'}
          onClick={() => setActiveView('endpoints')}
        >
          <Monitor className="h-4 w-4 mr-2" />
          Endpoints ({stats.active_endpoints})
        </Button>
        <Button 
          variant={activeView === 'ai-guide' ? 'default' : 'outline'}
          onClick={() => setActiveView('ai-guide')}
        >
          <Bot className="h-4 w-4 mr-2" />
          AI Response Guide
        </Button>
        <Button 
          variant={activeView === 'downloads' ? 'default' : 'outline'}
          onClick={() => setActiveView('downloads')}
        >
          <Zap className="h-4 w-4 mr-2" />
          Agent Downloads
        </Button>
        <Button 
          variant={activeView === 'safe-av' ? 'default' : 'outline'}
          onClick={() => setActiveView('safe-av')}
        >
          <ShieldCheck className="h-4 w-4 mr-2" />
          SafeAV
        </Button>
        <Button 
          variant={activeView === 'safe-mdr' ? 'default' : 'outline'}
          onClick={() => setActiveView('safe-mdr')}
        >
          <Search className="h-4 w-4 mr-2" />
          SafeMDR
        </Button>
        <Button 
          variant={activeView === 'reports' ? 'default' : 'outline'}
          onClick={() => setActiveView('reports')}
        >
          <Activity className="h-4 w-4 mr-2" />
          Reports & Analytics
        </Button>
      </div>

      {/* Critical Alerts */}
      {stats.critical_threats > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            🚨 <strong>{stats.critical_threats} critical threats</strong> require immediate attention. 
            Click <Button variant="link" className="p-0 h-auto" onClick={() => setActiveView('ai-guide')}>AI Response Guide</Button> for assistance.
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Dashboard */}
      {activeView === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Endpoints</CardTitle>
                <Monitor className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.active_endpoints}</div>
                <p className="text-xs text-muted-foreground">Protected devices</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Threats (24h)</CardTitle>
                <ShieldAlert className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.threats_24h}</div>
                <p className="text-xs text-muted-foreground">Recent detections</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Threats</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.critical_threats}</div>
                <p className="text-xs text-muted-foreground">Need immediate action</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Isolated Endpoints</CardTitle>
                <Lock className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.isolated_endpoints}</div>
                <p className="text-xs text-muted-foreground">Quarantined devices</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Confidence</CardTitle>
                <Zap className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">97%</div>
                <p className="text-xs text-muted-foreground">Detection accuracy</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Endpoints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {endpoints.slice(0, 5).map((endpoint) => (
                    <div key={endpoint.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{endpoint.hostname}</p>
                        <p className="text-sm text-muted-foreground">{endpoint.ip_address}</p>
                      </div>
                      <Badge variant={endpoint.status === 'online' ? 'default' : 'secondary'}>
                        {endpoint.status}
                      </Badge>
                    </div>
                  ))}
                  {endpoints.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No endpoints registered. Click "Add Endpoint" to get started.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5" />
                  Recent Threats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {threats.slice(0, 5).map((threat) => (
                    <div key={threat.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{threat.threat_type}</p>
                        <p className="text-sm text-muted-foreground">{threat.hostname}</p>
                      </div>
                      <Badge variant={getSeverityColor(threat.severity)}>
                        {threat.severity}
                      </Badge>
                    </div>
                  ))}
                  {threats.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No threats detected. Your environment is secure.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Threat Monitor */}
      {activeView === 'threats' && (
        <ThreatMonitor 
          threats={threats} 
          onThreatSelect={(threat) => {
            setSelectedThreat(threat);
            setActiveView('ai-guide');
          }}
        />
      )}

      {/* Endpoint Manager */}
      {activeView === 'endpoints' && (
        <EndpointManager 
          endpoints={endpoints} 
          onEndpointAction={loadDashboardData}
        />
      )}

      {/* AI Response Guide */}
      {activeView === 'ai-guide' && (
        <AIResponseGuide 
          threat={selectedThreat}
          onAction={loadDashboardData}
        />
      )}

      {/* Agent Downloads */}
      {activeView === 'downloads' && (
        <EndpointAgentDownloads />
      )}

      {/* SafeAV Dashboard */}
      {activeView === 'safe-av' && (
        <SafeAVDashboard />
      )}

      {/* SafeMDR Dashboard */}
      {activeView === 'safe-mdr' && (
        <SafeMDRDashboard />
      )}

      {/* Reports & Analytics */}
      {activeView === 'reports' && (
        <ThreatReportsAnalytics />
      )}

      {/* White Label Configuration */}
      {activeView === 'white-label' && (
        <MSPWhiteLabelConfig />
      )}
    </div>
  );
};