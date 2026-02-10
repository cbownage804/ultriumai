import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Activity, ChevronDown, ChevronUp, Code2, Bot, GitFork, Globe, Pencil, Trash2, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ActivityEvent {
  id: string;
  type: 'created' | 'updated' | 'published' | 'deleted';
  itemType: 'app' | 'gpt';
  itemName: string;
  timestamp: string;
}

export function ActivityFeed({ userId }: { userId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    if (!userId) return;
    
    const loadActivity = async () => {
      const [projectsRes, gptsRes] = await Promise.all([
        supabase.from('builder_projects')
          .select('id, name, updated_at, created_at, is_published')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(20),
        supabase.from('custom_gpts')
          .select('id, name, updated_at, created_at')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(10),
      ]);

      const activityEvents: ActivityEvent[] = [];

      (projectsRes.data || []).forEach((p: any) => {
        if (p.is_published) {
          activityEvents.push({
            id: `${p.id}-pub`, type: 'published', itemType: 'app',
            itemName: p.name || 'Untitled', timestamp: p.updated_at,
          });
        }
        activityEvents.push({
          id: `${p.id}-upd`, type: 'updated', itemType: 'app',
          itemName: p.name || 'Untitled', timestamp: p.updated_at,
        });
        activityEvents.push({
          id: `${p.id}-crt`, type: 'created', itemType: 'app',
          itemName: p.name || 'Untitled', timestamp: p.created_at,
        });
      });

      (gptsRes.data || []).forEach((g: any) => {
        activityEvents.push({
          id: `${g.id}-upd`, type: 'updated', itemType: 'gpt',
          itemName: g.name || 'Untitled', timestamp: g.updated_at,
        });
        activityEvents.push({
          id: `${g.id}-crt`, type: 'created', itemType: 'gpt',
          itemName: g.name || 'Untitled', timestamp: g.created_at,
        });
      });

      // Deduplicate by keeping most recent per item
      const unique = new Map<string, ActivityEvent>();
      activityEvents
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .forEach(e => {
          if (!unique.has(e.id)) unique.set(e.id, e);
        });

      setEvents(Array.from(unique.values()).slice(0, 15));
    };

    loadActivity();
  }, [userId]);

  const formatTimeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(ts).toLocaleDateString();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'created': return <Plus className="h-3 w-3 text-emerald-400" />;
      case 'published': return <Globe className="h-3 w-3 text-cyan-400" />;
      case 'updated': return <Pencil className="h-3 w-3 text-amber-400" />;
      default: return <Activity className="h-3 w-3 text-muted-foreground" />;
    }
  };

  if (events.length === 0) return null;

  const visibleEvents = expanded ? events : events.slice(0, 5);

  return (
    <div className="mb-6 border border-border/50 rounded-xl bg-card/30 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Recent Activity</span>
          <Badge variant="outline" className="text-[10px] h-4">{events.length}</Badge>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      <div className="px-4 pb-3">
        <div className="space-y-1">
          {visibleEvents.map(event => (
            <div key={event.id} className="flex items-center gap-3 py-1.5 text-xs">
              <div className="w-5 h-5 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
                {getIcon(event.type)}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-muted-foreground capitalize">{event.type} </span>
                <span className="font-medium truncate">{event.itemName}</span>
                <span className="text-muted-foreground"> · </span>
                <span className={cn(
                  "inline-flex items-center gap-0.5",
                  event.itemType === 'app' ? "text-violet-400" : "text-primary"
                )}>
                  {event.itemType === 'app' ? <Code2 className="h-2.5 w-2.5" /> : <Bot className="h-2.5 w-2.5" />}
                  {event.itemType === 'app' ? 'App' : 'GPT'}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">{formatTimeAgo(event.timestamp)}</span>
            </div>
          ))}
        </div>
        {events.length > 5 && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="text-xs text-primary hover:underline mt-1"
          >
            Show {events.length - 5} more
          </button>
        )}
      </div>
    </div>
  );
}
