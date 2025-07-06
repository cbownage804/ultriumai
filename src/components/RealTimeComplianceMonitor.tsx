import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle, Activity, Wifi, WifiOff } from "lucide-react";

interface RealTimeEvent {
  id: string;
  type: 'alert' | 'sync' | 'evidence' | 'connector_status';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  metadata: any;
}

export const RealTimeComplianceMonitor = () => {
  const [events, setEvents] = useState<RealTimeEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to real-time compliance events
    const channel = supabase
      .channel('compliance-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'compliance_alerts'
        },
        (payload) => {
          const newEvent: RealTimeEvent = {
            id: payload.new.id,
            type: 'alert',
            title: payload.new.title,
            description: payload.new.description,
            severity: payload.new.severity,
            timestamp: payload.new.created_at,
            metadata: payload.new.metadata
          };
          
          setEvents(prev => [newEvent, ...prev.slice(0, 19)]); // Keep last 20 events
          
          // Show toast for critical alerts
          if (payload.new.severity === 'critical') {
            toast({
              title: "Critical Compliance Alert",
              description: payload.new.title,
              variant: "destructive"
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'compliance_connectors'
        },
        (payload) => {
          const newEvent: RealTimeEvent = {
            id: `connector-${payload.new.id}`,
            type: 'connector_status',
            title: `Connector Status Changed`,
            description: `${payload.new.connector_name} is now ${payload.new.status}`,
            severity: payload.new.status === 'error' ? 'high' : 'low',
            timestamp: payload.new.updated_at,
            metadata: { connector: payload.new }
          };
          
          setEvents(prev => [newEvent, ...prev.slice(0, 19)]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'compliance_evidence'
        },
        (payload) => {
          const newEvent: RealTimeEvent = {
            id: `evidence-${payload.new.id}`,
            type: 'evidence',
            title: 'New Evidence Collected',
            description: `${payload.new.title} for ${payload.new.framework.toUpperCase()}`,
            severity: 'low',
            timestamp: payload.new.created_at,
            metadata: { evidence: payload.new }
          };
          
          setEvents(prev => [newEvent, ...prev.slice(0, 19)]);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
          setIsConnected(true);
        } else if (status === 'CLOSED') {
          setConnectionStatus('disconnected');
          setIsConnected(false);
        } else {
          setConnectionStatus('connecting');
          setIsConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const getEventIcon = (type: string, severity: string) => {
    switch (type) {
      case 'alert':
        return severity === 'critical' || severity === 'high' ? 
          <AlertTriangle className="w-4 h-4 text-red-500" /> : 
          <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'evidence':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'connector_status':
        return <Activity className="w-4 h-4 text-blue-500" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    
    return (
      <Badge className={colors[severity as keyof typeof colors] || colors.low}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Real-Time Monitor
          </CardTitle>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <div className="flex items-center gap-1 text-green-600">
                <Wifi className="w-4 h-4" />
                <span className="text-xs">Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600">
                <WifiOff className="w-4 h-4" />
                <span className="text-xs">Disconnected</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        {!isConnected && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Real-time monitoring is currently {connectionStatus}. Some events may not appear immediately.
            </AlertDescription>
          </Alert>
        )}
        
        {events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No recent events</p>
            <p className="text-xs">Compliance events will appear here in real-time</p>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              {getEventIcon(event.type, event.severity)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium truncate">{event.title}</h4>
                  {getSeverityBadge(event.severity)}
                </div>
                <p className="text-xs text-muted-foreground mb-1">{event.description}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(event.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};