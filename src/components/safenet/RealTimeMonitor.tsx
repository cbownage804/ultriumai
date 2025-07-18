import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Pause,
  Play,
  Trash2
} from "lucide-react";

interface NetworkEvent {
  id: string;
  timestamp: Date;
  type: 'device_online' | 'device_offline' | 'vulnerability_detected' | 'scan_completed' | 'error';
  device?: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

interface RealTimeMonitorProps {
  isActive?: boolean;
  onToggle?: (active: boolean) => void;
}

export const RealTimeMonitor = ({ isActive = true, onToggle }: RealTimeMonitorProps) => {
  const [events, setEvents] = useState<NetworkEvent[]>([]);
  const [monitoring, setMonitoring] = useState(isActive);

  // Simulate real-time events
  useEffect(() => {
    if (!monitoring) return;

    const interval = setInterval(() => {
      // Generate random events for demonstration
      const eventTypes: NetworkEvent['type'][] = [
        'device_online', 
        'device_offline', 
        'vulnerability_detected', 
        'scan_completed'
      ];
      
      const deviceNames = ['LenovoT15', 'Server-01', 'Printer-HP', 'Router-Main', 'Laptop-01'];
      const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const randomDevice = deviceNames[Math.floor(Math.random() * deviceNames.length)];
      
      let message = '';
      let severity: NetworkEvent['severity'] = 'info';
      
      switch (randomType) {
        case 'device_online':
          message = `${randomDevice} came online`;
          severity = 'success';
          break;
        case 'device_offline':
          message = `${randomDevice} went offline`;
          severity = 'warning';
          break;
        case 'vulnerability_detected':
          message = `Security vulnerability detected on ${randomDevice}`;
          severity = 'error';
          break;
        case 'scan_completed':
          message = `Network scan completed - found ${Math.floor(Math.random() * 5) + 1} devices`;
          severity = 'info';
          break;
      }

      const newEvent: NetworkEvent = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        type: randomType,
        device: randomDevice,
        message,
        severity
      };

      setEvents(prev => [newEvent, ...prev.slice(0, 49)]); // Keep last 50 events
    }, Math.random() * 10000 + 5000); // Random interval between 5-15 seconds

    return () => clearInterval(interval);
  }, [monitoring]);

  const getEventIcon = (type: NetworkEvent['type']) => {
    switch (type) {
      case 'device_online': return Wifi;
      case 'device_offline': return WifiOff;
      case 'vulnerability_detected': return AlertCircle;
      case 'scan_completed': return CheckCircle;
      default: return Activity;
    }
  };

  const getEventColor = (severity: NetworkEvent['severity']) => {
    switch (severity) {
      case 'success': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-blue-500';
    }
  };

  const getSeverityBadge = (severity: NetworkEvent['severity']) => {
    switch (severity) {
      case 'success': return 'default';
      case 'warning': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const toggleMonitoring = () => {
    setMonitoring(!monitoring);
    onToggle?.(!monitoring);
  };

  const clearEvents = () => {
    setEvents([]);
  };

  return (
    <Card className="h-[500px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Activity className={`h-5 w-5 ${monitoring ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
            <span>Real-Time Monitor</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant={monitoring ? 'default' : 'secondary'} className="text-xs">
              {monitoring ? 'Live' : 'Paused'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMonitoring}
              className="h-8 px-2"
            >
              {monitoring ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearEvents}
              className="h-8 px-2"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-6">
          {events.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <div className="text-center">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No events yet</p>
                <p className="text-xs">Real-time monitoring will show network activity here</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {events.map((event) => {
                const EventIcon = getEventIcon(event.type);
                return (
                  <div key={event.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-shrink-0 mt-0.5">
                      <EventIcon className={`h-4 w-4 ${getEventColor(event.severity)}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">{event.message}</p>
                        <Badge variant={getSeverityBadge(event.severity)} className="text-xs ml-2">
                          {event.severity}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(event.timestamp)}</span>
                        </div>
                        {event.device && (
                          <span className="font-mono">{event.device}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};