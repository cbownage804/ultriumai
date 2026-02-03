/**
 * Maintenance Calendar Component
 * Shows scheduled maintenance windows for the portal
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertTriangle, Wrench, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, isWithinInterval, isFuture, isPast } from 'date-fns';

interface MaintenanceEvent {
  id: string;
  title: string;
  description: string | null;
  maintenance_type: string;
  start_time: string;
  end_time: string;
  affected_services: string[] | null;
  status: string;
}

interface MaintenanceCalendarProps {
  clientId?: string;
}

export function MaintenanceCalendar({ clientId }: MaintenanceCalendarProps) {
  const [events, setEvents] = useState<MaintenanceEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMaintenance();
  }, [clientId]);

  const fetchMaintenance = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('scheduled_maintenance')
        .select('*')
        .or(`client_id.is.null${clientId ? `,client_id.eq.${clientId}` : ''}`)
        .gte('end_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(10);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Failed to fetch maintenance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'emergency':
        return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', icon: AlertTriangle };
      case 'update':
        return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', icon: Wrench };
      default:
        return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', icon: Wrench };
    }
  };

  const getStatusBadge = (event: MaintenanceEvent) => {
    const now = new Date();
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);

    if (isWithinInterval(now, { start, end })) {
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">In Progress</Badge>;
    }
    if (isFuture(start)) {
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Scheduled</Badge>;
    }
    if (isPast(end)) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>;
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="bg-black/40 border-white/10">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Calendar className="h-6 w-6 text-cyan-400" />
          Scheduled Maintenance
        </h2>
        <p className="text-white/60 mt-1">Upcoming planned maintenance windows</p>
      </div>

      {events.length === 0 ? (
        <Card className="bg-black/40 border-white/10">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-white/20 mb-4" />
            <h3 className="text-lg font-medium text-white mb-1">No Scheduled Maintenance</h3>
            <p className="text-white/60 text-center">There are no upcoming maintenance windows at this time.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const styles = getTypeStyles(event.maintenance_type);
            const IconComponent = styles.icon;

            return (
              <Card key={event.id} className={`bg-black/40 border-white/10 hover:${styles.border} transition-colors`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg ${styles.bg} flex items-center justify-center shrink-0`}>
                        <IconComponent className={`h-5 w-5 ${styles.text}`} />
                      </div>
                      <div>
                        <CardTitle className="text-white text-lg">{event.title}</CardTitle>
                        {event.description && (
                          <p className="text-white/60 text-sm mt-1">{event.description}</p>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(event)}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-white/60">
                      <Clock className="h-4 w-4" />
                      <span>
                        {format(new Date(event.start_time), 'MMM d, yyyy h:mm a')} - {format(new Date(event.end_time), 'h:mm a')}
                      </span>
                    </div>
                    <Badge variant="outline" className={`${styles.border} ${styles.text}`}>
                      {event.maintenance_type}
                    </Badge>
                  </div>

                  {event.affected_services && event.affected_services.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-white/40 text-xs mb-2">Affected Services</p>
                      <div className="flex flex-wrap gap-2">
                        {event.affected_services.map((service, i) => (
                          <Badge key={i} variant="outline" className="border-white/20 text-white/60 text-xs">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
