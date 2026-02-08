import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Bug, RefreshCw, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ErrorLog {
  id: string;
  error_type: string;
  error_message: string;
  page_url?: string;
  user_id?: string;
  resolved: boolean;
  created_at: string;
}

const ErrorTrackingTab = () => {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);
  const [stats, setStats] = useState({ total: 0, unresolved: 0, today: 0 });

  const load = async () => {
    setLoading(true);
    let query = supabase.from('platform_error_logs').select('*').order('created_at', { ascending: false }).limit(100);
    if (!showResolved) query = query.eq('resolved', false);
    const { data } = await query;
    setErrors((data as any) || []);

    const { count: total } = await supabase.from('platform_error_logs').select('id', { count: 'exact', head: true });
    const { count: unresolved } = await supabase.from('platform_error_logs').select('id', { count: 'exact', head: true }).eq('resolved', false);
    const today = new Date().toISOString().split('T')[0];
    const { count: todayCount } = await supabase.from('platform_error_logs').select('id', { count: 'exact', head: true }).gte('created_at', today);
    setStats({ total: total || 0, unresolved: unresolved || 0, today: todayCount || 0 });
    setLoading(false);
  };

  const resolve = async (id: string) => {
    await supabase.from('platform_error_logs').update({ resolved: true, resolved_at: new Date().toISOString() }).eq('id', id);
    toast.success('Marked resolved');
    load();
  };

  useEffect(() => { load(); }, [showResolved]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Bug className="h-6 w-6" /> Error Tracking</h2>
          <p className="text-muted-foreground">Monitor platform errors and crashes across all users</p>
        </div>
        <div className="flex gap-2">
          <Button variant={showResolved ? 'default' : 'outline'} size="sm" onClick={() => setShowResolved(!showResolved)}>
            {showResolved ? 'Showing All' : 'Show Resolved'}
          </Button>
          <Button variant="outline" size="sm" onClick={load} className="gap-2"><RefreshCw className="h-4 w-4" /> Refresh</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><p className="text-3xl font-bold">{stats.total}</p><p className="text-sm text-muted-foreground">Total Errors</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-3xl font-bold text-destructive">{stats.unresolved}</p><p className="text-sm text-muted-foreground">Unresolved</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-3xl font-bold text-yellow-500">{stats.today}</p><p className="text-sm text-muted-foreground">Today</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Type</th>
              <th className="text-left p-3 font-medium">Message</th>
              <th className="text-left p-3 font-medium">Page</th>
              <th className="text-left p-3 font-medium">Time</th>
              <th className="text-left p-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : errors.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No errors found 🎉</td></tr>
              ) : errors.map(e => (
                <tr key={e.id} className="border-b hover:bg-muted/30">
                  <td className="p-3"><Badge variant="outline">{e.error_type}</Badge></td>
                  <td className="p-3 max-w-[300px] truncate text-muted-foreground">{e.error_message}</td>
                  <td className="p-3 text-muted-foreground text-xs max-w-[150px] truncate">{e.page_url || '—'}</td>
                  <td className="p-3 text-muted-foreground text-xs">{format(new Date(e.created_at), 'MMM d, HH:mm')}</td>
                  <td className="p-3">
                    {!e.resolved && <Button variant="ghost" size="sm" onClick={() => resolve(e.id)}><CheckCircle className="h-4 w-4 text-green-500" /></Button>}
                    {e.resolved && <Badge className="bg-green-500/10 text-green-500">Resolved</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorTrackingTab;
