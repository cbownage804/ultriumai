import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Zap,
  RefreshCw,
  Eye,
  Bell,
  Clock,
  Server,
  Network,
  FileX,
  Users,
  Globe,
  Lock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SecurityEvent {
  id: string;
  timestamp: string;
  type: 'malware' | 'intrusion' | 'data_breach' | 'phishing' | 'vulnerability' | 'policy_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  description: string;
  client_id?: string;
  client_name?: string;
  affected_assets: string[];
  status: 'new' | 'investigating' | 'contained' | 'resolved';
  automated_response?: string[];
}

const eventIcons = {
  malware: FileX,
  intrusion: Shield,
  data_breach: AlertTriangle,
  phishing: Globe,
  vulnerability: Lock,
  policy_violation: Users
};

const severityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

export const MSPRealTimeEvents = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState({
    total_events: 156,
    critical_events: 3,
    active_incidents: 8,
    clients_affected: 12,
    avg_response_time: '2.3 min'
  });

  // Mock real-time events for demonstration
  useEffect(() => {
    const mockEvents: SecurityEvent[] = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        type: 'malware',
        severity: 'critical',
        source: 'EDR-ENDPOINT-001',
        description: 'Ransomware attempt detected on workstation CLIENT-WS-0045',
        client_id: 'client-1',
        client_name: 'Acme Corp',
        affected_assets: ['CLIENT-WS-0045', 'FILE-SERVER-01'],
        status: 'investigating',
        automated_response: ['Isolated endpoint', 'Blocked file hash', 'Notified admin']
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        type: 'intrusion',
        severity: 'high',
        source: 'FIREWALL-001',
        description: 'Multiple failed login attempts from suspicious IP 192.168.1.100',
        client_id: 'client-2',
        client_name: 'TechStart LLC',
        affected_assets: ['DC-001', 'FIREWALL-001'],
        status: 'contained',
        automated_response: ['Blocked IP address', 'Increased monitoring']
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        type: 'phishing',
        severity: 'medium',
        source: 'EMAIL-GATEWAY',
        description: 'Phishing email detected and quarantined',
        client_id: 'client-1',
        client_name: 'Acme Corp',
        affected_assets: ['MAIL-SERVER-01'],
        status: 'resolved',
        automated_response: ['Quarantined email', 'Updated email filters']
      }
    ];

    setEvents(mockEvents);
    setIsConnected(true);

    // Simulate real-time updates
    const interval = setInterval(() => {
      const newEvent: SecurityEvent = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: ['malware', 'intrusion', 'phishing', 'vulnerability'][Math.floor(Math.random() * 4)] as any,
        severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
        source: `SENSOR-${Math.floor(Math.random() * 100).toString().padStart(3, '0')}`,
        description: 'New security event detected - automated analysis in progress',
        client_name: ['Acme Corp', 'TechStart LLC', 'Global Industries', 'Smart Solutions'][Math.floor(Math.random() * 4)],
        affected_assets: [`ASSET-${Math.floor(Math.random() * 100)}`],
        status: 'new'
      };

      setEvents(prev => [newEvent, ...prev.slice(0, 9)]);
      setStats(prev => ({
        ...prev,
        total_events: prev.total_events + 1
      }));
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = (eventId: string) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, status: 'investigating' as const }
        : event
    ));
    toast({
      title: "Event Acknowledged",
      description: "Event has been marked as under investigation",
    });
  };

  const handleResolve = (eventId: string) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, status: 'resolved' as const }
        : event
    ));
    toast({
      title: "Event Resolved",
      description: "Event has been marked as resolved",
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            Real-Time Security Events
          </h1>
          <p className="text-muted-foreground">
            Live security event monitoring and threat response
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "destructive"} className="gap-1">
            <Zap className="h-3 w-3" />
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_events}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.critical_events}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <Shield className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.active_incidents}</div>
            <p className="text-xs text-muted-foreground">Under investigation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients Affected</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clients_affected}</div>
            <p className="text-xs text-muted-foreground">Across all events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.avg_response_time}</div>
            <p className="text-xs text-muted-foreground">Response time</p>
          </CardContent>
        </Card>
      </div>

      {/* Event Stream */}
      <Tabs defaultValue="live-feed" className="space-y-4">
        <TabsList>
          <TabsTrigger value="live-feed">Live Feed</TabsTrigger>
          <TabsTrigger value="critical">Critical Only</TabsTrigger>
          <TabsTrigger value="incidents">Active Incidents</TabsTrigger>
        </TabsList>

        <TabsContent value="live-feed" className="space-y-4">
          {events.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No events in the stream</p>
              </CardContent>
            </Card>
          ) : (
            events.map((event) => {
              const EventIcon = eventIcons[event.type];
              return (
                <Card key={event.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <EventIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{event.description}</CardTitle>
                            <Badge className={severityColors[event.severity]}>
                              {event.severity.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Server className="h-3 w-3" />
                              {event.source}
                            </span>
                            <span className="flex items-center gap-1">
                              <Network className="h-3 w-3" />
                              {event.client_name || 'Unknown Client'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          event.status === 'resolved' ? 'default' : 
                          event.status === 'investigating' ? 'secondary' : 
                          'destructive'
                        }>
                          {event.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Affected Assets */}
                      <div>
                        <p className="text-sm font-medium mb-2">Affected Assets:</p>
                        <div className="flex flex-wrap gap-1">
                          {event.affected_assets.map((asset, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {asset}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Automated Response */}
                      {event.automated_response && (
                        <div>
                          <p className="text-sm font-medium mb-2">Automated Response:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {event.automated_response.map((action, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        {event.status === 'new' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleAcknowledge(event.id)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Acknowledge
                          </Button>
                        )}
                        {event.status === 'investigating' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleResolve(event.id)}
                          >
                            <Shield className="h-3 w-3 mr-1" />
                            Mark Resolved
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <Bell className="h-3 w-3 mr-1" />
                          Create Incident
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="critical">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Showing only critical severity events that require immediate attention.
            </AlertDescription>
          </Alert>
          {/* Filter and show only critical events */}
          <div className="space-y-4">
            {events.filter(event => event.severity === 'critical').map((event) => {
              const EventIcon = eventIcons[event.type];
              return (
                <Card key={event.id} className="border-red-200">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <EventIcon className="h-5 w-5 text-red-500 mt-1" />
                      <div className="space-y-1">
                        <CardTitle className="text-base text-red-900">{event.description}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {event.client_name} • {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="incidents">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Showing events that have been escalated to active incidents.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
};