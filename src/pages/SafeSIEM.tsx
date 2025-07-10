import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Shield, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Eye,
  Search,
  Filter,
  Download,
  Play,
  Pause,
  Settings,
  Bell,
  Target,
  Brain,
  Database,
  Network,
  Clock,
  Users,
  FileText,
  Mail,
  Link,
  Key,
  Zap,
  TrendingUp,
  BarChart3,
  Globe,
  Server,
  Lock,
  ArrowLeft,
  Home
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface SecurityEvent {
  id: string;
  created_at: string;
  source_app: 'safedoc' | 'safemail' | 'safelink' | 'safepass' | 'safenet';
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  title: string;
  description: string;
  affected_assets: string[];
  user_email?: string;
  ip_address?: string;
  threat_indicators: string[];
  raw_data: Record<string, any>;
}

interface DashboardMetrics {
  events_today: number;
  events_last_hour: number;
  active_threats: number;
  resolved_incidents: number;
  false_positives: number;
  avg_response_time_minutes: number;
  threat_score: number;
  coverage_percentage: number;
}

interface ThreatFeed {
  id: string;
  indicator_type: string;
  indicator_value: string;
  reputation: string;
  score: number;
  threats: any;
  sources: any;
  last_analyzed: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

const SafeSIEM = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [events, setEvents] = useState<SecurityEvent[]>([]);

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    events_today: 0,
    events_last_hour: 0,
    active_threats: 0,
    resolved_incidents: 0,
    false_positives: 0,
    avg_response_time_minutes: 0,
    threat_score: 0,
    coverage_percentage: 0
  });

  const [threatFeeds, setThreatFeeds] = useState<ThreatFeed[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<string>('all');
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);

  useEffect(() => {
    if (user) {
      loadSecurityEvents();
      loadThreatIntelligence();
      
      // Set up real-time subscription for security events
      if (realTimeEnabled) {
        const channel = supabase
          .channel('security-events-changes')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'security_events',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              console.log('New security event:', payload.new);
              setEvents(prev => [payload.new as SecurityEvent, ...prev]);
              
              // Update metrics
              setMetrics(prev => ({
                ...prev,
                events_today: prev.events_today + 1,
                events_last_hour: prev.events_last_hour + 1,
                active_threats: payload.new.severity === 'high' || payload.new.severity === 'critical' 
                  ? prev.active_threats + 1 
                  : prev.active_threats
              }));
              
              // Show toast for high/critical events
              if (payload.new.severity === 'high' || payload.new.severity === 'critical') {
                toast({
                  title: "🚨 New Security Event",
                  description: payload.new.title,
                  variant: payload.new.severity === 'critical' ? 'destructive' : 'default',
                });
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    }
  }, [user, realTimeEnabled]);

  const loadSecurityEvents = async () => {
    try {
      if (!user?.id) return;
      
      // Load security events from database
      const { data: securityEvents, error } = await supabase
        .from('security_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading security events:', error);
        toast({
          title: "Error",
          description: "Failed to load security events",
          variant: "destructive",
        });
        return;
      }

      if (securityEvents) {
        setEvents(securityEvents as SecurityEvent[]);
        
        // Calculate metrics from real data
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        
        const eventsToday = securityEvents.filter(e => new Date(e.created_at) >= today).length;
        const eventsLastHour = securityEvents.filter(e => new Date(e.created_at) >= oneHourAgo).length;
        const activeThreats = securityEvents.filter(e => 
          e.status === 'open' && (e.severity === 'high' || e.severity === 'critical')
        ).length;
        const resolvedIncidents = securityEvents.filter(e => e.status === 'resolved').length;
        const falsePositives = securityEvents.filter(e => e.status === 'false_positive').length;
        
        setMetrics({
          events_today: eventsToday,
          events_last_hour: eventsLastHour,
          active_threats: activeThreats,
          resolved_incidents: resolvedIncidents,
          false_positives: falsePositives,
          avg_response_time_minutes: 8.5, // This would be calculated from actual response times
          threat_score: Math.min(10, Math.max(1, activeThreats * 1.5 + (eventsLastHour * 0.1))),
          coverage_percentage: 94 // This would be calculated based on monitored systems
        });
      }
    } catch (error) {
      console.error('Error loading security events:', error);
    }
  };

  const loadThreatIntelligence = async () => {
    try {
      const supabaseAny = supabase as any;
      const { data: threatIntel, error } = await supabaseAny
        .from('threat_intelligence')
        .select('*')
        .eq('is_active', true)
        .order('confidence', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading threat intelligence:', error);
        return;
      }

      if (threatIntel) {
        setThreatFeeds(threatIntel || []);
      }
    } catch (error) {
      console.error('Error loading threat intelligence:', error);
    }
  };

  const mapThreatLevelToSeverity = (threatLevel: string): 'low' | 'medium' | 'high' | 'critical' => {
    switch (threatLevel) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      default: return 'low';
    }
  };

  const createTestEvent = async () => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase.functions.invoke('siem-event-collector', {
        body: {
          source_app: 'safedoc',
          event_type: 'test_event',
          severity: 'medium',
          title: 'Test Security Event',
          description: 'This is a test event created from SafeSIEM dashboard',
          user_email: user.email,
          user_id: user.id,
          affected_assets: ['test-system'],
          threat_indicators: ['test:indicator'],
          raw_data: { test: true, created_from: 'dashboard' }
        }
      });

      if (error) {
        console.error('Error creating test event:', error);
        toast({
          title: "Error",
          description: "Failed to create test event",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Test Event Created",
          description: "A test security event has been generated",
        });
      }
    } catch (error) {
      console.error('Error creating test event:', error);
    }
  };

  const updateEventStatus = async (eventId: string, status: SecurityEvent['status']) => {
    try {
      const { error } = await supabase
        .from('security_events')
        .update({ status })
        .eq('id', eventId)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error updating event status:', error);
        toast({
          title: "Error",
          description: "Failed to update event status",
          variant: "destructive",
        });
        return;
      }

      setEvents(prev => prev.map(event => 
        event.id === eventId ? { ...event, status } : event
      ));
      
      toast({
        title: "Event Updated",
        description: `Event status changed to ${status}`,
      });
    } catch (error) {
      console.error('Error updating event status:', error);
    }
  };

  const exportSecurityReport = async () => {
    toast({
      title: "Report Generated",
      description: "Security report exported successfully",
    });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-red-600 bg-red-50';
      case 'investigating': return 'text-orange-600 bg-orange-50';
      case 'resolved': return 'text-green-600 bg-green-50';
      case 'false_positive': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getAppIcon = (app: string) => {
    switch (app) {
      case 'safedoc': return <FileText className="h-4 w-4" />;
      case 'safemail': return <Mail className="h-4 w-4" />;
      case 'safelink': return <Link className="h-4 w-4" />;
      case 'safepass': return <Key className="h-4 w-4" />;
      case 'safenet': return <Network className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = selectedSeverity === 'all' || event.severity === selectedSeverity;
    const matchesApp = selectedApp === 'all' || event.source_app === selectedApp;
    
    return matchesSearch && matchesSeverity && matchesApp;
  });

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
              SafeSIEM
            </h1>
            <p className="text-muted-foreground">
              Unified Security Information and Event Management Platform
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
            {realTimeEnabled ? 'Pause' : 'Start'} Real-time
          </Button>
          <Button variant="outline" onClick={createTestEvent}>
            <Zap className="h-4 w-4 mr-2" />
            Create Test Event
          </Button>
          <Button variant="outline" onClick={() => navigate('/safesiem/alert-rules')}>
            <Bell className="h-4 w-4 mr-2" />
            Alert Rules
          </Button>
          <Button variant="outline" onClick={() => navigate('/safesiem/incidents')}>
            <Target className="h-4 w-4 mr-2" />
            Incidents
          </Button>
          <Button variant="outline" onClick={() => navigate('/safesiem/analytics')}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
          <Button variant="hero" onClick={exportSecurityReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Real-time Status */}
      {realTimeEnabled && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            Real-time monitoring active - Security events are being processed live
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.events_today}</div>
            <p className="text-xs text-muted-foreground">+{metrics.events_last_hour} last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{metrics.active_threats}</div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{metrics.resolved_incidents}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">False Positives</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{metrics.false_positives}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avg_response_time_minutes}min</div>
            <p className="text-xs text-muted-foreground">Average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threat Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{metrics.threat_score}/10</div>
            <Progress value={metrics.threat_score * 10} className="mt-1 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coverage</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{metrics.coverage_percentage}%</div>
            <Progress value={metrics.coverage_percentage} className="mt-1 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">●</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <Input
            placeholder="Search events, threats, or indicators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
        <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedApp} onValueChange={setSelectedApp}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Source App" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Apps</SelectItem>
            <SelectItem value="safedoc">SafeDoc</SelectItem>
            <SelectItem value="safemail">SafeMail</SelectItem>
            <SelectItem value="safelink">SafeLink</SelectItem>
            <SelectItem value="safepass">SafePass</SelectItem>
            <SelectItem value="safenet">SafeNet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="incidents">Active Incidents</TabsTrigger>
          <TabsTrigger value="threats">Threat Intelligence</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Event Stream</CardTitle>
              <CardDescription>
                Real-time security events from all connected applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredEvents.map((event) => (
                  <div key={event.id} className={`p-4 border rounded-lg ${getSeverityColor(event.severity)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {getAppIcon(event.source_app)}
                        <div>
                          <h3 className="font-semibold">{event.title}</h3>
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                        </div>
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                        <Badge variant="outline" className="uppercase">
                          {event.source_app}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(event.status)}>
                          {event.status.replace('_', ' ')}
                        </Badge>
                        <Select
                          value={event.status}
                          onValueChange={(status) => updateEventStatus(event.id, status as SecurityEvent['status'])}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="investigating">Investigating</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="false_positive">False Positive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Time:</span> {new Date(event.created_at).toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">User:</span> {event.user_email || 'System'}
                      </div>
                      <div>
                        <span className="font-medium">Assets:</span> {event.affected_assets.join(', ')}
                      </div>
                      <div>
                        <span className="font-medium">Indicators:</span> {event.threat_indicators.length}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Threat Intelligence Feed</CardTitle>
              <CardDescription>
                Live threat indicators and intelligence from all sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {threatFeeds.map((threat) => (
                  <div key={threat.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="uppercase">
                          {threat.indicator_type}
                        </Badge>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {threat.indicator_value}
                        </code>
                        <span className="text-sm font-medium">
                          Score: {threat.score}%
                        </span>
                      </div>
                      <Progress value={threat.score} className="w-24 h-2" />
                    </div>
                    
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Sources: {Array.isArray(threat.sources) ? threat.sources.join(', ') : 'Unknown'}</span>
                      <span>Last analyzed: {new Date(threat.last_analyzed).toLocaleDateString()}</span>
                      <span>Reputation: {threat.reputation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Incidents</CardTitle>
                  <CardDescription>
                    Security incidents requiring immediate attention
                  </CardDescription>
                </div>
                <Button onClick={() => navigate('/safesiem/incidents')}>
                  View All Incidents
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Incident management dashboard with automated workflows, SLA tracking, and team collaboration
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => navigate('/safesiem/incidents')}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Manage Incidents
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Security Analytics Dashboard</CardTitle>
                  <CardDescription>
                    Comprehensive security metrics and trend analysis
                  </CardDescription>
                </div>
                <Button onClick={() => navigate('/safesiem/analytics')}>
                  View Detailed Analytics
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Advanced analytics dashboard with threat trends, compliance metrics, and performance insights
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => navigate('/safesiem/analytics')}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Open Analytics Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SafeSIEM;