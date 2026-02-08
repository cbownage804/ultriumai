import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Radio, RefreshCw, Search, User, LogIn, FileText, Zap } from 'lucide-react';
import { format } from 'date-fns';

const actionIcons: Record<string, any> = {
  login: LogIn,
  signup: User,
  create: FileText,
  update: Zap,
};

const ActivityFeedTab = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    let query = supabase.from('user_activity_feed').select('*').order('created_at', { ascending: false }).limit(200);
    if (search) query = query.or(`user_email.ilike.%${search}%,action.ilike.%${search}%`);
    const { data } = await query;
    setActivities(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Radio className="h-6 w-6" /> Activity Feed</h2>
          <p className="text-muted-foreground">Live feed of user activity across the platform</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2"><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Filter by email or action..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0 max-h-[600px] overflow-y-auto">
          {loading ? (
            <p className="p-8 text-center text-muted-foreground">Loading...</p>
          ) : activities.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">No activity recorded yet</p>
          ) : (
            <div className="divide-y">
              {activities.map(a => {
                const Icon = actionIcons[a.action] || Zap;
                return (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm"><span className="font-medium">{a.user_email || 'Unknown'}</span> <span className="text-muted-foreground">{a.action}</span> {a.resource_type && <Badge variant="outline" className="text-xs ml-1">{a.resource_type}</Badge>}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(a.created_at), 'MMM d, HH:mm:ss')}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityFeedTab;
