import { useState, useEffect } from 'react';
import { 
  Bot, Shield, Monitor, Headphones, FileText, Lock, AlertTriangle,
  Zap, Users, Settings, ArrowRight, Clock
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface ActivityItem {
  id: string;
  type: 'ticket' | 'security' | 'ai' | 'device' | 'user' | 'vault' | 'scan' | 'compliance';
  title: string;
  description: string;
  timestamp: Date;
  product: string;
  productColor: string;
}

const ICON_MAP: Record<ActivityItem['type'], React.ComponentType<{ className?: string }>> = {
  ticket: Headphones,
  security: Shield,
  ai: Bot,
  device: Monitor,
  user: Users,
  vault: Lock,
  scan: AlertTriangle,
  compliance: FileText,
};

type FilterType = 'all' | 'ticket' | 'security' | 'ai' | 'device' | 'vault';

const FILTERS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'ticket', label: 'Tickets' },
  { value: 'security', label: 'Security' },
  { value: 'ai', label: 'AI' },
  { value: 'device', label: 'Devices' },
  { value: 'vault', label: 'Vault' },
];

function mapToActivity(source: string, row: any): ActivityItem | null {
  switch (source) {
    case 'ticket':
      return {
        id: `ticket-${row.id}`,
        type: 'ticket',
        title: `Ticket: ${row.subject || 'Untitled'}`,
        description: `Status: ${row.status} · Priority: ${row.priority || 'normal'}`,
        timestamp: new Date(row.updated_at || row.created_at),
        product: 'Vanguard',
        productColor: 'text-cyan-500',
      };
    case 'security':
      return {
        id: `sec-${row.id}`,
        type: 'security',
        title: row.event_type || 'Security Event',
        description: row.description?.slice(0, 80) || 'No details',
        timestamp: new Date(row.created_at),
        product: 'Vanguard',
        productColor: 'text-cyan-500',
      };
    case 'ai':
      return {
        id: `ai-${row.id}`,
        type: 'ai',
        title: `AI credit usage`,
        description: row.description || `${row.credits_used} credits · ${row.usage_type}`,
        timestamp: new Date(row.created_at),
        product: 'AI Studio',
        productColor: 'text-primary',
      };
    case 'device':
      return {
        id: `dev-${row.id}`,
        type: 'device',
        title: `Agent: ${row.hostname || 'Unknown'}`,
        description: `Status: ${row.status} · OS: ${row.os_type || 'unknown'}`,
        timestamp: new Date(row.last_seen || row.created_at),
        product: 'Vanguard',
        productColor: 'text-cyan-500',
      };
    default:
      return null;
  }
}

export function ActivityFeedWidget() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true);
      const results: ActivityItem[] = [];

      const [ticketsRes, securityRes, aiRes, devicesRes] = await Promise.all([
        supabase.from('tickets').select('id, subject, status, priority, created_at, updated_at').order('updated_at', { ascending: false }).limit(10),
        supabase.from('security_events').select('id, event_type, description, severity, created_at').order('created_at', { ascending: false }).limit(10),
        supabase.from('ai_credit_ledger').select('id, credits_used, usage_type, description, created_at').order('created_at', { ascending: false }).limit(10),
        supabase.from('vanguard_agents').select('id, hostname, status, os_type, last_seen, created_at').order('last_seen', { ascending: false }).limit(10),
      ]);

      (ticketsRes.data ?? []).forEach(r => { const a = mapToActivity('ticket', r); if (a) results.push(a); });
      (securityRes.data ?? []).forEach(r => { const a = mapToActivity('security', r); if (a) results.push(a); });
      (aiRes.data ?? []).forEach(r => { const a = mapToActivity('ai', r); if (a) results.push(a); });
      (devicesRes.data ?? []).forEach(r => { const a = mapToActivity('device', r); if (a) results.push(a); });

      results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setActivities(results);
      setLoading(false);
    };

    fetchActivity();
  }, []);

  const filtered = filter === 'all' 
    ? activities 
    : activities.filter(a => a.type === filter);

  return (
    <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${activities.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
          <h3 className="text-sm font-semibold text-foreground">Activity Feed</h3>
          <InfoTooltip content="Real-time log of actions across all products — tickets, security events, AI usage, and device changes. Use filters to focus on a specific category." />
        </div>
        <div className="flex items-center gap-1">
          {FILTERS.map(f => (
            <Button
              key={f.value}
              variant="ghost"
              size="sm"
              onClick={() => setFilter(f.value)}
              className={`h-6 px-2 text-[10px] font-medium ${
                filter === f.value ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
              }`}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      <ScrollArea className="h-[380px]">
        <div className="p-2 space-y-0.5">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              Loading activity…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-sm text-muted-foreground">
              <Zap className="h-6 w-6 mb-2 opacity-40" />
              No recent activity
            </div>
          ) : (
            filtered.map(activity => {
              const Icon = ICON_MAP[activity.type] || Zap;
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors group cursor-pointer"
                >
                  <div className="mt-0.5 h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                    <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                      <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${activity.productColor} border-current/20 flex-shrink-0`}>
                        {activity.product}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(activity.timestamp, { addSuffix: false })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}