import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Activity,
  Users,
  Server,
  Network,
  Eye,
  Play,
  Pause,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface SecurityEvent {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  event_type: string;
  timestamp: string;
  source: string;
  affected_assets: string[];
  status: string;
}

interface SystemMetric {
  id: string;
  metric_name: string;
  current_value: number;
  previous_value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  last_updated: string;
}

const RealTimeDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLive, setIsLive] = useState(true);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Mock data for demonstration
  const generateMockEvent = (): SecurityEvent => {
    const eventTypes = ['malware_detected', 'phishing_attempt', 'unauthorized_access', 'ddos_attack', 'data_breach'];
    const severities: ('low' | 'medium' | 'high' | 'critical')[] = ['low', 'medium', 'high', 'critical'];
    const sources = ['Endpoint Security', 'Email Scanner', 'Network Monitor', 'Web Filter', 'Dark Web Monitor'];
    
    return {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: `Security Alert: ${eventTypes[Math.floor(Math.random() * eventTypes.length)].replace('_', ' ')}`,
      severity: severities[Math.floor(Math.random() * severities.length)],
      event_type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      timestamp: new Date().toISOString(),
      source: sources[Math.floor(Math.random() * sources.length)],
      affected_assets: [`Asset-${Math.floor(Math.random() * 100)}`],
      status: Math.random() > 0.7 ? 'resolved' : 'active'
    };
  };

  const generateMockMetrics = (): SystemMetric[] => {
    return [
      {
        id: 'active_threats',
        metric_name: 'Active Threats',
        current_value: Math.floor(Math.random() * 10),
        previous_value: Math.floor(Math.random() * 10),
        unit: 'count',
        status: Math.random() > 0.7 ? 'critical' : Math.random() > 0.4 ? 'warning' : 'normal',
        last_updated: new Date().toISOString()
      },
      {
        id: 'monitored_endpoints',
        metric_name: 'Monitored Endpoints',
        current_value: 247 + Math.floor(Math.random() * 10),
        previous_value: 247,
        unit: 'devices',
        status: 'normal',
        last_updated: new Date().toISOString()
      },
      {
        id: 'network_activity',
        metric_name: 'Network Activity',
        current_value: 85 + Math.floor(Math.random() * 30),
        previous_value: 85,
        unit: '%',
        status: Math.random() > 0.8 ? 'warning' : 'normal',
        last_updated: new Date().toISOString()
      },
      {
        id: 'response_time',
        metric_name: 'Avg Response Time',
        current_value: 150 + Math.floor(Math.random() * 100),
        previous_value: 150,
        unit: 'ms',
        status: 'normal',
        last_updated: new Date().toISOString()
      }
    ];
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!user || !isLive) return;

    setConnectionStatus('connected');
    
    // Subscribe to security events
    const eventsChannel = supabase
      .channel('security-events-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_events'
        },
        (payload) => {
          const newEvent = payload.new as SecurityEvent;
          setEvents(prev => [newEvent, ...prev.slice(0, 49)]); // Keep only latest 50
          setLastUpdate(new Date());
          
          if (newEvent.severity === 'critical' || newEvent.severity === 'high') {
            toast({
              title: "Critical Security Alert",
              description: newEvent.title,
              variant: "destructive"
            });
          }
        }
      )
      .subscribe();

    // Simulate real-time updates with mock data
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newEvent = generateMockEvent();
        setEvents(prev => [newEvent, ...prev.slice(0, 49)]);
        setLastUpdate(new Date());
        
        if (newEvent.severity === 'critical') {
          toast({
            title: "Critical Security Alert",
            description: newEvent.title,
            variant: "destructive"
          });
        }
      }
      
      // Update metrics periodically
      if (Math.random() > 0.8) {
        setMetrics(generateMockMetrics());
      }
    }, 3000);

    return () => {
      supabase.removeChannel(eventsChannel);
      clearInterval(interval);
    };
  }, [user, isLive, toast]);

  // Initialize with mock data
  useEffect(() => {
    setEvents(Array.from({ length: 10 }, generateMockEvent));
    setMetrics(generateMockMetrics());
  }, []);

  const toggleLiveMode = () => {
    setIsLive(!isLive);
    if (!isLive) {
      setConnectionStatus('connected');
      toast({
        title: "Live monitoring enabled",
        description: "Real-time updates resumed"
      });
    } else {
      setConnectionStatus('disconnected');
      toast({
        title: "Live monitoring paused",
        description: "Real-time updates stopped"
      });
    }
  };

  const refreshData = () => {
    setEvents(Array.from({ length: 10 }, generateMockEvent));
    setMetrics(generateMockMetrics());
    setLastUpdate(new Date());
    toast({
      title: "Data refreshed",
      description: "Dashboard updated with latest information"
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'critical': return <Shield className="h-4 w-4 text-destructive" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-success" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Real-Time Security Dashboard</h2>
          <p className="text-muted-foreground">
            Live monitoring and threat detection across your infrastructure
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-success animate-pulse' :
              connectionStatus === 'reconnecting' ? 'bg-warning animate-pulse' :
              'bg-destructive'
            }`} />
            <span className="text-sm text-muted-foreground capitalize">
              {connectionStatus}
            </span>
          </div>
          {lastUpdate && (
            <span className="text-sm text-muted-foreground">
              Last update: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={toggleLiveMode} variant={isLive ? "default" : "secondary"} size="sm">
            {isLive ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause Live
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Live
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.metric_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold">
                      {metric.current_value}
                      <span className="text-sm text-muted-foreground ml-1">
                        {metric.unit}
                      </span>
                    </span>
                    {getTrendIcon(metric.current_value, metric.previous_value)}
                  </div>
                </div>
                {getStatusIcon(metric.status)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Events Feed */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Live Security Events
                  </CardTitle>
                  <CardDescription>Real-time security alerts and notifications</CardDescription>
                </div>
                {isLive && (
                  <Badge variant="default" className="animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full mr-2" />
                    LIVE
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {events.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className="flex-shrink-0 mt-1">
                      {event.severity === 'critical' ? (
                        <Shield className="h-4 w-4 text-destructive" />
                      ) : event.severity === 'high' ? (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      ) : (
                        <Eye className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{event.title}</span>
                        <Badge variant={getSeverityColor(event.severity)} className="text-xs">
                          {event.severity.toUpperCase()}
                        </Badge>
                        {event.status === 'resolved' && (
                          <Badge variant="secondary" className="text-xs">
                            RESOLVED
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{event.source}</span>
                        <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                        {event.affected_assets.length > 0 && (
                          <span>{event.affected_assets.length} assets affected</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {events.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-success mx-auto mb-2" />
                    <p className="text-muted-foreground">All systems operational</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-success" />
                <div>
                  <p className="font-medium">Endpoint Protection</p>
                  <p className="text-sm text-success">Operational</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-success" />
                <div>
                  <p className="font-medium">Email Security</p>
                  <p className="text-sm text-success">Operational</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium">Network Monitor</p>
                  <p className="text-sm text-warning">Degraded Performance</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-success" />
                <div>
                  <p className="font-medium">Backup Services</p>
                  <p className="text-sm text-success">Operational</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Active Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Endpoints</span>
                <span className="font-medium">247 online</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Network Segments</span>
                <span className="font-medium">12 monitored</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Active Policies</span>
                <span className="font-medium">34 enforced</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Compliance Checks</span>
                <span className="font-medium">98% passed</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {!user && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Sign in to access live security monitoring and real-time threat detection.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default RealTimeDashboard;