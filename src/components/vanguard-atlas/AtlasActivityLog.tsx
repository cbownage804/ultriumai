import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Search, FileText, Key, Server, Shield, BookOpen, Users, Box, ListChecks, Link2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ActivityEntry {
  id: string;
  resource_type: string;
  resource_name?: string;
  action: string;
  changes?: Record<string, any>;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  created_at: string;
}

const RESOURCE_ICONS: Record<string, any> = {
  document: FileText, password: Key, configuration: Server, ssl_certificate: Shield,
  runbook: BookOpen, contact: Users, flexible_asset: Box, checklist: ListChecks, related_item: Link2,
};

const ACTION_COLORS: Record<string, string> = {
  created: 'bg-emerald-500/20 text-emerald-400',
  updated: 'bg-blue-500/20 text-blue-400',
  deleted: 'bg-red-500/20 text-red-400',
  resolved: 'bg-amber-500/20 text-amber-400',
};

export function AtlasActivityLog({ organizationId }: { organizationId?: string }) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    if (!user) return;
    let q = (supabase as any).from('atlas_activity_logs').select('*').eq('user_id', user.id);
    if (organizationId) q = q.eq('organization_id', organizationId);
    const { data, error } = await q.order('created_at', { ascending: false }).limit(200);
    if (!error) setLogs(data || []);
    setIsLoading(false);
  }, [user, organizationId]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const filtered = logs.filter(l => {
    if (filterType && l.resource_type !== filterType) return false;
    if (search) {
      const s = search.toLowerCase();
      return (l.resource_name?.toLowerCase().includes(s) || l.action.toLowerCase().includes(s) || l.resource_type.toLowerCase().includes(s));
    }
    return true;
  });

  const resourceTypes = [...new Set(logs.map(l => l.resource_type))];

  if (isLoading) return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Activity Log</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search activity..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-64" />
          </div>
        </div>
      </div>

      {/* Type filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant={!filterType ? 'default' : 'outline'} size="sm" onClick={() => setFilterType(null)}>All</Button>
        {resourceTypes.map(t => (
          <Button key={t} variant={filterType === t ? 'default' : 'outline'} size="sm" onClick={() => setFilterType(t)}>
            {t.replace('_', ' ')}
          </Button>
        ))}
      </div>

      <ScrollArea className="h-[600px]">
        <div className="space-y-1">
          {filtered.map((entry) => {
            const Icon = RESOURCE_ICONS[entry.resource_type] || History;
            const actionColor = ACTION_COLORS[entry.action] || 'bg-muted text-muted-foreground';
            const time = new Date(entry.created_at);
            return (
              <Card key={entry.id} className="bg-card/30 border-border/30">
                <CardContent className="p-3 flex items-start gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className={`text-[10px] ${actionColor}`}>{entry.action}</Badge>
                      <span className="text-sm font-medium">{entry.resource_name || entry.resource_type}</span>
                      <span className="text-xs text-muted-foreground capitalize">{entry.resource_type.replace('_', ' ')}</span>
                    </div>
                    {entry.changes && Object.keys(entry.changes).length > 0 && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Changed: {Object.keys(entry.changes).join(', ')}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {time.toLocaleDateString()} {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-muted-foreground text-center py-12">No activity recorded yet. Changes to documents, passwords, and other items will appear here.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
