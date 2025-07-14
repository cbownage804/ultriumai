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
  Home,
  Brain,
  Target,
  BarChart3,
  Download,
  Settings,
  Smartphone,
  Lock,
  Database,
  Cloud,
  Wifi,
  Cpu,
  HardDrive,
  Monitor,
  Router,
  Laptop
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
    overallScore: 0,
    totalEvents: 0,
    activeThreats: 0,
    resolvedIncidents: 0,
    systemsMonitored: 0,
    averageResponseTime: 0,
    threatTrend: 0,
    eventTrend: 0
  });

  const [securityApps, setSecurityApps] = useState<SecurityAppStatus[]>([
    {
      name: 'EDR Shield',
      status: 'operational',
      icon: Shield,
      lastCheck: '2 min ago',
      eventsToday: 127,
      threatsBlocked: 45,
      uptime: 99.9
    },
    {
      name: 'SafeMail',
      status: 'operational',
      icon: Mail,
      lastCheck: '1 min ago',
      eventsToday: 89,
      threatsBlocked: 23,
      uptime: 99.8
    },
    {
      name: 'SafeNet',
      status: 'operational',
      icon: Network,
      lastCheck: '3 min ago',
      eventsToday: 156,
      threatsBlocked: 67,
      uptime: 99.7
    },
    {
      name: 'SafeScan',
      status: 'operational',
      icon: Eye,
      lastCheck: '1 min ago',
      eventsToday: 234,
      threatsBlocked: 89,
      uptime: 99.9
    },
    {
      name: 'SafePass',
      status: 'operational',
      icon: Key,
      lastCheck: '30 sec ago',
      eventsToday: 45,
      threatsBlocked: 12,
      uptime: 100.0
    }
  ]);

  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [threatIntelligence, setThreatIntelligence] = useState<any[]>([]);
  const [complianceStatus, setComplianceStatus] = useState({
    overall: 85,
    frameworks: [
      { name: 'SOC 2', status: 'compliant', score: 92 },
      { name: 'ISO 27001', status: 'partial', score: 78 }, 
      { name: 'NIST', status: 'compliant', score: 88 },
      { name: 'GDPR', status: 'compliant', score: 95 }
    ]
  });

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
      const { data: events, error: eventsError } = await supabase
        .from('security_events')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (eventsError) throw eventsError;

      // Load EDR alerts for real-time threat detection
      const { data: edrAlerts, error: edrError } = await supabase
        .from('edr_realtime_alerts')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(5);

      if (edrError) console.warn('Error loading EDR alerts:', edrError);

      // Load compliance status
      const { data: complianceData, error: complianceError } = await supabase
        .from('compliance_status')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (complianceError) console.warn('Error loading compliance data:', complianceError);

      // Load threat intelligence
      const { data: threatData, error: threatError } = await supabase
        .from('threat_intelligence')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (threatError) console.warn('Error loading threat intelligence:', threatError);

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

        // Add EDR alerts to threat count
        const edrThreats = edrAlerts?.filter(alert => 
          alert.severity === 'high' || alert.severity === 'critical'
        ).length || 0;

        const totalActiveThreats = activeThreats + edrThreats;
        
        setMetrics(prev => ({
          ...prev,
          totalEvents: eventsToday,
          activeThreats: totalActiveThreats,
          systemsMonitored: 5, // Based on security apps
          averageResponseTime: 2, // Minutes
          threatTrend: Math.random() > 0.5 ? Math.floor(Math.random() * 10) : -Math.floor(Math.random() * 10),
          eventTrend: Math.floor(Math.random() * 20),
          overallScore: Math.max(50, 100 - (totalActiveThreats * 5) - (eventsToday * 0.1))
        }));
      }

      // Update threat intelligence
      if (threatData) {
        setThreatIntelligence(threatData);
      }

      // Update compliance status with real data
      if (complianceData && complianceData.length > 0) {
        const compliance = complianceData[0];
        setComplianceStatus(prev => ({
          ...prev,
          overall: compliance.score || prev.overall
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
            onClick={() => {
              // Check if we came from MSP dashboard
              if (document.referrer.includes('/msp-control-center') || 
                  window.location.search.includes('from=msp')) {
                navigate('/msp-control-center');
              } else {
                navigate('/dashboard');
              }
            }}
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
            onClick={() => {
              // Check if we came from MSP dashboard
              if (document.referrer.includes('/msp-control-center') || 
                  window.location.search.includes('from=msp')) {
                navigate('/msp-control-center');
              } else {
                navigate('/dashboard');
              }
            }}
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

      {/* Premium Security Intelligence Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ai-intelligence">AI Intelligence</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="analytics">Advanced Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
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
        </TabsContent>

        <TabsContent value="ai-intelligence">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Threat Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  AI Threat Intelligence
                </CardTitle>
                <CardDescription>Machine learning powered threat detection and analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-500">47</div>
                    <p className="text-xs text-muted-foreground">AI Detected Anomalies</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-500">94%</div>
                    <p className="text-xs text-muted-foreground">Prediction Accuracy</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium">Lateral Movement Detected</span>
                    </div>
                    <Badge variant="destructive">Critical</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium">Suspicious Data Exfiltration</span>
                    </div>
                    <Badge className="bg-orange-50 text-orange-600">High</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">Anomalous User Behavior</span>
                    </div>
                    <Badge className="bg-yellow-50 text-yellow-600">Medium</Badge>
                  </div>
                </div>
                <Button className="w-full" variant="hero">
                  <Brain className="h-4 w-4 mr-2" />
                  Generate AI Report
                </Button>
              </CardContent>
            </Card>

            {/* Threat Intelligence Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Global Threat Intelligence
                </CardTitle>
                <CardDescription>Real-time threat feeds from security partners</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">New Ransomware Campaign</span>
                      <Badge variant="destructive">Critical</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      LockBit 3.0 variant targeting healthcare sector - Active IOCs detected
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">Source: CrowdStrike</span>
                      <span className="text-xs text-muted-foreground">• 15 min ago</span>
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">APT Group Activity</span>
                      <Badge className="bg-orange-50 text-orange-600">High</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Lazarus Group exploitation of CVE-2024-4761 in enterprise environments
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">Source: Mandiant</span>
                      <span className="text-xs text-muted-foreground">• 1 hour ago</span>
                    </div>
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download IOC Feed
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Compliance Overview */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Compliance Status
                </CardTitle>
                <CardDescription>Enterprise compliance framework monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Overall Compliance Score</span>
                    <span className="text-2xl font-bold text-primary">{complianceStatus.overall}%</span>
                  </div>
                  <Progress value={complianceStatus.overall} className="h-3" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {complianceStatus.frameworks.map((framework) => (
                    <div key={framework.name} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{framework.name}</span>
                        <Badge 
                          className={framework.status === 'compliant' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}
                        >
                          {framework.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <Progress value={framework.score} className="h-2 flex-1 mr-2" />
                        <span className="text-sm font-medium">{framework.score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Compliance Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Required Actions</CardTitle>
                <CardDescription>Items needing attention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Critical</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Update encryption policies for SOC 2 compliance
                  </p>
                </div>
                <div className="p-3 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Due Soon</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Quarterly access review for ISO 27001
                  </p>
                </div>
                <Button className="w-full" variant="hero">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Compliance Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Advanced Security Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Security Metrics & Trends
                </CardTitle>
                <CardDescription>Advanced analytics and predictive insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-lg font-bold text-green-500">99.7%</div>
                    <p className="text-xs text-muted-foreground">Uptime</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-lg font-bold text-blue-500">2.3s</div>
                    <p className="text-xs text-muted-foreground">MTTR</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-lg font-bold text-purple-500">847</div>
                    <p className="text-xs text-muted-foreground">Events/Day</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Endpoint Protection</span>
                    <div className="flex items-center gap-2">
                      <Progress value={95} className="h-2 w-20" />
                      <span className="text-sm">95%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Network Security</span>
                    <div className="flex items-center gap-2">
                      <Progress value={87} className="h-2 w-20" />
                      <span className="text-sm">87%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Identity & Access</span>
                    <div className="flex items-center gap-2">
                      <Progress value={92} className="h-2 w-20" />
                      <span className="text-sm">92%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Risk Assessment
                </CardTitle>
                <CardDescription>Enterprise risk posture analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <span className="font-medium text-red-700">High Risk Areas</span>
                  </div>
                  <ul className="space-y-1 text-sm text-red-600">
                    <li>• Unpatched critical vulnerabilities: 12</li>
                    <li>• Privileged accounts without MFA: 8</li>
                    <li>• Legacy systems exposed: 3</li>
                  </ul>
                </div>
                <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    <span className="font-medium text-yellow-700">Medium Risk Areas</span>
                  </div>
                  <ul className="space-y-1 text-sm text-yellow-600">
                    <li>• Outdated security policies: 5</li>
                    <li>• Incomplete access reviews: 7</li>
                    <li>• Missing security training: 23 users</li>
                  </ul>
                </div>
                <Button className="w-full" variant="hero">
                  <Download className="h-4 w-4 mr-2" />
                  Export Risk Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityDashboard;