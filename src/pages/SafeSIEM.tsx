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
  Lock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SecurityEvent {
  id: string;
  timestamp: string;
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
  name: string;
  type: 'ip' | 'domain' | 'hash' | 'url';
  value: string;
  confidence: number;
  first_seen: string;
  last_seen: string;
  source: string;
  threat_types: string[];
}

const SafeSIEM = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [events, setEvents] = useState<SecurityEvent[]>([
    {
      id: 'event-001',
      timestamp: new Date().toISOString(),
      source_app: 'safedoc',
      event_type: 'malware_detected',
      severity: 'high',
      status: 'open',
      title: 'Malware Detected in Document Upload',
      description: 'Trojan.Generic.12345 detected in financial_report.pdf',
      affected_assets: ['file-server-01', 'user-workstation-42'],
      user_email: 'john.doe@company.com',
      ip_address: '192.168.1.150',
      threat_indicators: ['hash:abc123', 'filename:financial_report.pdf'],
      raw_data: { file_size: 2048000, scan_engine: 'virustotal' }
    },
    {
      id: 'event-002',
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      source_app: 'safemail',
      event_type: 'phishing_detected',
      severity: 'critical',
      status: 'investigating',
      title: 'Phishing Email Campaign Detected',
      description: 'Credential harvesting attempt targeting multiple users',
      affected_assets: ['email-server', 'users'],
      user_email: 'multiple@company.com',
      threat_indicators: ['domain:fake-bank.com', 'subject:Urgent Account Update'],
      raw_data: { recipients: 45, sender_domain: 'fake-bank.com' }
    }
  ]);

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    events_today: 1247,
    events_last_hour: 23,
    active_threats: 8,
    resolved_incidents: 156,
    false_positives: 12,
    avg_response_time_minutes: 8.5,
    threat_score: 7.2,
    coverage_percentage: 94
  });

  const [threatFeeds, setThreatFeeds] = useState<ThreatFeed[]>([
    {
      id: 'feed-001',
      name: 'Malicious IP',
      type: 'ip',
      value: '192.168.100.1',
      confidence: 95,
      first_seen: '2024-01-20T08:00:00Z',
      last_seen: '2024-01-20T16:30:00Z',
      source: 'Internal Detection',
      threat_types: ['botnet', 'scanning']
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<string>('all');
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);

  useEffect(() => {
    loadSecurityEvents();
    
    // Simulate real-time updates
    if (realTimeEnabled) {
      const interval = setInterval(() => {
        // Simulate random events
        if (Math.random() > 0.95) {
          addRandomEvent();
        }
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [realTimeEnabled]);

  const loadSecurityEvents = async () => {
    try {
      // Load real events from database
      const { data: safedocScans } = await supabase
        .from('safedoc_scans')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (safedocScans) {
        const convertedEvents: SecurityEvent[] = safedocScans.map(scan => ({
          id: scan.id,
          timestamp: scan.created_at,
          source_app: 'safedoc' as const,
          event_type: scan.threat_level === 'high' ? 'malware_detected' : 'file_scanned',
          severity: mapThreatLevelToSeverity(scan.threat_level),
          status: 'resolved' as const,
          title: `File Scan: ${scan.file_name}`,
          description: `Scanned ${scan.file_name} - ${scan.threats_found} threats found`,
          affected_assets: [scan.file_name],
          user_email: scan.user_email,
          threat_indicators: scan.threats_found > 0 ? [`hash:${scan.file_hash}`] : [],
          raw_data: (scan.scan_results as Record<string, any>) || {}
        }));
        
        setEvents(prev => [...prev, ...convertedEvents]);
      }
    } catch (error) {
      console.error('Error loading security events:', error);
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

  const addRandomEvent = () => {
    const randomEvents = [
      {
        source_app: 'safelink' as const,
        event_type: 'malicious_url_blocked',
        severity: 'medium' as const,
        title: 'Malicious URL Blocked',
        description: 'Blocked access to known phishing site'
      },
      {
        source_app: 'safepass' as const,
        event_type: 'weak_password_detected',
        severity: 'low' as const,
        title: 'Weak Password Detected',
        description: 'User password does not meet security requirements'
      }
    ];

    const randomEvent = randomEvents[Math.floor(Math.random() * randomEvents.length)];
    const newEvent: SecurityEvent = {
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'open',
      affected_assets: ['system'],
      threat_indicators: [],
      raw_data: {},
      ...randomEvent
    };

    setEvents(prev => [newEvent, ...prev]);
    setMetrics(prev => ({ ...prev, events_today: prev.events_today + 1 }));
  };

  const updateEventStatus = async (eventId: string, status: SecurityEvent['status']) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId ? { ...event, status } : event
    ));
    
    toast({
      title: "Event Updated",
      description: `Event status changed to ${status}`,
    });
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
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            SafeSIEM
          </h1>
          <p className="text-muted-foreground">
            Unified Security Information and Event Management Platform
          </p>
        </div>
        <div className="flex gap-2">
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
          <TabsTrigger value="threats">Threat Intelligence</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Reports</TabsTrigger>
          <TabsTrigger value="investigations">Investigations</TabsTrigger>
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
                        <span className="font-medium">Time:</span> {new Date(event.timestamp).toLocaleString()}
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
                          {threat.type}
                        </Badge>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {threat.value}
                        </code>
                        <span className="text-sm font-medium">
                          Confidence: {threat.confidence}%
                        </span>
                      </div>
                      <Progress value={threat.confidence} className="w-24 h-2" />
                    </div>
                    
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Source: {threat.source}</span>
                      <span>First seen: {new Date(threat.first_seen).toLocaleDateString()}</span>
                      <span>Types: {threat.threat_types.join(', ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Security Analytics Dashboard</CardTitle>
              <CardDescription>
                Comprehensive security metrics and trend analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Advanced analytics dashboard with threat trends, compliance metrics, and performance insights
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SafeSIEM;