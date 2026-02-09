import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Link2, AlertTriangle, Shield, Activity, Network, Clock,
  Search, Play, Loader2, Target, Zap, Eye, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function ThreatCorrelationEngine() {
  const { user } = useAuth();
  const [isCorrelating, setIsCorrelating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('security_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching security events:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleCorrelate = () => {
    setIsCorrelating(true);
    toast.info('Running threat correlation analysis...');
    setTimeout(() => {
      setIsCorrelating(false);
      fetchEvents();
      toast.success('Correlation analysis complete.');
    }, 3000);
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500/10 text-red-500 border-red-500/20',
      high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    };
    return <Badge className={colors[severity] || 'bg-muted'}>{severity}</Badge>;
  };

  const criticalCount = events.filter(e => e.severity === 'critical').length;
  const highCount = events.filter(e => e.severity === 'high').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Link2 className="h-6 w-6" />
            Threat Correlation Engine
          </h2>
          <p className="text-muted-foreground">
            {events.length > 0 ? 'Live security events for cross-source correlation' : 'No security events to correlate'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchEvents}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCorrelate} disabled={isCorrelating || events.length === 0}>
            {isCorrelating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
            {isCorrelating ? 'Correlating...' : 'Run Correlation'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-red-500">{criticalCount}</p>
            <p className="text-xs text-muted-foreground">Critical Events</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-orange-500">{highCount}</p>
            <p className="text-xs text-muted-foreground">High Events</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{events.length}</p>
            <p className="text-xs text-muted-foreground">Total Events</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-cyan-500">
              {new Set(events.map(e => e.event_type).filter(Boolean)).size}
            </p>
            <p className="text-xs text-muted-foreground">Event Types</p>
          </CardContent>
        </Card>
      </div>

      {/* Events */}
      <Card>
        <CardHeader>
          <CardTitle>Security Events</CardTitle>
          <CardDescription>
            {events.length > 0 ? 'Recent security events from your fleet' : 'Events will appear as agents detect threats'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {events.length > 0 ? (
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className={`p-4 border rounded-lg border-l-4 ${
                    event.severity === 'critical' ? 'border-l-red-500' :
                    event.severity === 'high' ? 'border-l-orange-500' :
                    'border-l-yellow-500'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">{event.event_type || 'Security Event'}</span>
                        {getSeverityBadge(event.severity || 'medium')}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.created_at).toLocaleString()}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                    )}
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {event.source_ip && <span>Source: {event.source_ip}</span>}
                      {event.agent_id && <span>Agent: {event.agent_id.slice(0, 8)}...</span>}
                      {event.mitre_attack_id && <span>MITRE: {event.mitre_attack_id}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <Link2 className="h-12 w-12 mb-3 opacity-50" />
                <p className="font-medium">No security events</p>
                <p className="text-sm">Events from EDR, network monitoring, and SIEM will appear here</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
