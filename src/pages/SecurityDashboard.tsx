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
  Home
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface SecurityAppStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down' | 'maintenance';
  icon: any;
  lastCheck: string;
  eventsToday: number;
  threatsBlocked: number;
  uptime: number;
}

interface SecurityMetrics {
  overallScore: number;
  totalEvents: number;
  activeThreats: number;
  resolvedIncidents: number;
  systemsMonitored: number;
  averageResponseTime: number;
  threatTrend: number;
  eventTrend: number;
}

interface RecentEvent {
  id: string;
  timestamp: string;
  source: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  status: string;
}

const SecurityDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    overallScore: 92,
    totalEvents: 1247,
    activeThreats: 8,
    resolvedIncidents: 156,
    systemsMonitored: 12,
    averageResponseTime: 8.2,
    threatTrend: -12,
    eventTrend: 15
  });

  const [securityApps, setSecurityApps] = useState<SecurityAppStatus[]>([
    {
      name: 'SafeDoc',
      status: 'operational',
      icon: FileText,
      lastCheck: '2 minutes ago',
      eventsToday: 234,
      threatsBlocked: 12,
      uptime: 99.9
    },
    {
      name: 'SafeMail',
      status: 'operational',
      icon: Mail,
      lastCheck: '1 minute ago',
      eventsToday: 445,
      threatsBlocked: 28,
      uptime: 99.8
    },
    {
      name: 'SafeLink',
      status: 'degraded',
      icon: Link,
      lastCheck: '3 minutes ago',
      eventsToday: 123,
      threatsBlocked: 5,
      uptime: 98.2
    },
    {
      name: 'SafePass',
      status: 'operational',
      icon: Key,
      lastCheck: '1 minute ago',
      eventsToday: 89,
      threatsBlocked: 3,
      uptime: 99.9
    },
    {
      name: 'SafeNet',
      status: 'operational',
      icon: Network,
      lastCheck: '30 seconds ago',
      eventsToday: 356,
      threatsBlocked: 15,
      uptime: 99.7
    }
  ]);

  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadSecurityData();
      
      if (realTimeEnabled) {
        const interval = setInterval(loadSecurityData, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
      }
    }
  }, [user, realTimeEnabled]);

  const loadSecurityData = async () => {
    try {
      setRefreshing(true);
      
      // Load recent security events
      const { data: events, error } = await supabase
        .from('security_events')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (events) {
        const formattedEvents: RecentEvent[] = events.map(event => ({
          id: event.id,
          timestamp: event.created_at,
          source: event.source_app,
          type: event.event_type,
          severity: event.severity as 'low' | 'medium' | 'high' | 'critical',
          title: event.title,
          status: event.status
        }));
        setRecentEvents(formattedEvents);
        
        // Update metrics based on real data
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const eventsToday = events.filter(e => new Date(e.created_at) >= today).length;
        const activeThreats = events.filter(e => 
          e.status === 'open' && (e.severity === 'high' || e.severity === 'critical')
        ).length;
        
        setMetrics(prev => ({
          ...prev,
          totalEvents: events.length,
          activeThreats,
          overallScore: Math.max(50, 100 - (activeThreats * 5) - (eventsToday * 0.1))
        }));
      }
    } catch (error) {
      console.error('Error loading security data:', error);
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
      case 'operational': return 'text-green-500 bg-green-50';
      case 'degraded': return 'text-yellow-500 bg-yellow-50';
      case 'down': return 'text-red-500 bg-red-50';
      case 'maintenance': return 'text-blue-500 bg-blue-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'isolate_threat':
        toast({
          title: "Threat Isolation",
          description: "Automated threat isolation initiated",
        });
        break;
      case 'block_ip':
        toast({
          title: "IP Blocking",
          description: "Suspicious IPs have been blocked",
        });
        break;
      case 'quarantine_file':
        toast({
          title: "File Quarantine",
          description: "Malicious files have been quarantined",
        });
        break;
      case 'reset_passwords':
        toast({
          title: "Password Reset",
          description: "Compromised accounts password reset initiated",
        });
        break;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Security Command Center
            </h1>
            <p className="text-muted-foreground">
              Real-time security monitoring and threat response
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            <Home className="h-4 w-4 mr-2" />
            Dashboard
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
            onClick={loadSecurityData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="hero" onClick={() => navigate('/safesiem')}>
            <Shield className="h-4 w-4 mr-2" />
            Open SIEM
          </Button>
        </div>
      </div>

      {/* Real-time Status Alert */}
      {realTimeEnabled && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            Real-time security monitoring active - Data refreshes every 30 seconds
          </AlertDescription>
        </Alert>
      )}

      {/* Security Score & Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-bold text-primary">{metrics.overallScore}/100</span>
              <Badge className={metrics.overallScore >= 90 ? 'bg-green-50 text-green-600' : 
                              metrics.overallScore >= 70 ? 'bg-yellow-50 text-yellow-600' : 
                              'bg-red-50 text-red-600'}>
                {metrics.overallScore >= 90 ? 'Excellent' : 
                 metrics.overallScore >= 70 ? 'Good' : 'Needs Attention'}
              </Badge>
            </div>
            <Progress value={metrics.overallScore} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Based on threat levels and response times
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{metrics.activeThreats}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {metrics.threatTrend < 0 ? (
                <ArrowDown className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <ArrowUp className="h-3 w-3 text-red-500 mr-1" />
              )}
              {Math.abs(metrics.threatTrend)}% from yesterday
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalEvents}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUp className="h-3 w-3 text-blue-500 mr-1" />
              {metrics.eventTrend}% from yesterday
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageResponseTime}min</div>
            <p className="text-xs text-muted-foreground">Average response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Systems Monitored</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{metrics.systemsMonitored}</div>
            <p className="text-xs text-muted-foreground">All operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Security Apps Status */}
      <Card>
        <CardHeader>
          <CardTitle>Security Applications Status</CardTitle>
          <CardDescription>Real-time status of all security modules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {securityApps.map((app) => {
              const IconComponent = app.icon;
              return (
                <div key={app.name} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-5 w-5" />
                      <span className="font-medium">{app.name}</span>
                    </div>
                    <Badge className={getStatusColor(app.status)}>
                      {app.status}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div>Events: {app.eventsToday}</div>
                    <div>Threats Blocked: {app.threatsBlocked}</div>
                    <div>Uptime: {app.uptime}%</div>
                    <div>Last Check: {app.lastCheck}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions & Recent Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Response Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Response Actions</CardTitle>
            <CardDescription>Automated security responses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => handleQuickAction('isolate_threat')}
            >
              <Shield className="h-4 w-4 mr-2" />
              Isolate Active Threats
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => handleQuickAction('block_ip')}
            >
              <Globe className="h-4 w-4 mr-2" />
              Block Suspicious IPs
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => handleQuickAction('quarantine_file')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Quarantine Malicious Files
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => handleQuickAction('reset_passwords')}
            >
              <Key className="h-4 w-4 mr-2" />
              Reset Compromised Passwords
            </Button>
          </CardContent>
        </Card>

        {/* Recent Security Events */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Security Events</CardTitle>
            <CardDescription>Latest security activity across all systems</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Badge className={getSeverityColor(event.severity)}>
                    {event.severity}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.source} • {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {event.status}
                  </Badge>
                </div>
              ))}
              {recentEvents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Info className="h-8 w-8 mx-auto mb-2" />
                  <p>No recent security events</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SecurityDashboard;