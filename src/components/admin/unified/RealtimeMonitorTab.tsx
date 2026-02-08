import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Radio, Play, Pause, Trash2, Wifi } from 'lucide-react';
import { toast } from 'sonner';

interface RealtimeEvent {
  id: string;
  channel: string;
  event: string;
  table?: string;
  payload: string;
  timestamp: string;
}

const RealtimeMonitorTab = () => {
  const [listening, setListening] = useState(true);
  const [events, setEvents] = useState<RealtimeEvent[]>([
    { id: '1', channel: 'public:tickets', event: 'INSERT', table: 'tickets', payload: '{"id":"t-1042","title":"VPN not connecting"}', timestamp: '10:45:12' },
    { id: '2', channel: 'public:profiles', event: 'UPDATE', table: 'profiles', payload: '{"id":"u-5","full_name":"John Updated"}', timestamp: '10:44:58' },
    { id: '3', channel: 'public:vanguard_agents', event: 'UPDATE', table: 'vanguard_agents', payload: '{"id":"a-3","status":"online"}', timestamp: '10:44:30' },
    { id: '4', channel: 'presence:admin', event: 'JOIN', payload: '{"user":"admin@ultriumai.com"}', timestamp: '10:43:15' },
    { id: '5', channel: 'public:security_events', event: 'INSERT', table: 'security_events', payload: '{"severity":"high","type":"brute_force"}', timestamp: '10:42:50' },
  ]);

  // Simulate incoming events
  useEffect(() => {
    if (!listening) return;
    const interval = setInterval(() => {
      const tables = ['tickets', 'profiles', 'vanguard_agents', 'security_events'];
      const ops = ['INSERT', 'UPDATE', 'DELETE'];
      const table = tables[Math.floor(Math.random() * tables.length)];
      const event = ops[Math.floor(Math.random() * ops.length)];
      const now = new Date();
      setEvents(prev => [{
        id: Date.now().toString(),
        channel: `public:${table}`,
        event,
        table,
        payload: `{"simulated":true,"table":"${table}"}`,
        timestamp: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`,
      }, ...prev].slice(0, 50));
    }, 3000);
    return () => clearInterval(interval);
  }, [listening]);

  const eventColor = (e: string) => {
    if (e === 'INSERT') return 'bg-green-500/20 text-green-500';
    if (e === 'UPDATE') return 'bg-blue-500/20 text-blue-500';
    if (e === 'DELETE') return 'bg-destructive/20 text-destructive';
    return 'bg-purple-500/20 text-purple-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Radio className="h-6 w-6" /> Realtime Monitor</h2>
          <p className="text-muted-foreground">Live stream of Supabase realtime events and channel activity</p>
        </div>
        <div className="flex gap-2">
          <Button variant={listening ? 'destructive' : 'default'} size="sm" onClick={() => setListening(!listening)} className="gap-1.5">
            {listening ? <><Pause className="h-3.5 w-3.5" /> Pause</> : <><Play className="h-3.5 w-3.5" /> Resume</>}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEvents([])} className="gap-1.5"><Trash2 className="h-3.5 w-3.5" /> Clear</Button>
        </div>
      </div>

      <Card className={listening ? 'border-green-500/30' : ''}>
        <CardContent className="flex items-center gap-3 py-3">
          <Wifi className={`h-4 w-4 ${listening ? 'text-green-500 animate-pulse' : 'text-muted-foreground'}`} />
          <span className="text-sm">{listening ? 'Listening for events...' : 'Paused'}</span>
          <Badge variant="secondary" className="ml-auto text-xs">{events.length} events</Badge>
        </CardContent>
      </Card>

      <div className="space-y-1 max-h-[500px] overflow-y-auto">
        {events.map(evt => (
          <div key={evt.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 font-mono text-xs">
            <span className="text-muted-foreground w-16 shrink-0">{evt.timestamp}</span>
            <Badge className={`text-xs shrink-0 ${eventColor(evt.event)}`}>{evt.event}</Badge>
            <span className="text-muted-foreground shrink-0">{evt.channel}</span>
            <span className="text-foreground/70 truncate">{evt.payload}</span>
          </div>
        ))}
        {events.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">No events captured</p>}
      </div>
    </div>
  );
};

export default RealtimeMonitorTab;
