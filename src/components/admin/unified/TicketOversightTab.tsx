import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Search, RefreshCw, ExternalLink, User, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  client_id?: string;
  contact_name?: string;
  contact_email?: string;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-500',
  open: 'bg-yellow-500/10 text-yellow-500',
  in_progress: 'bg-orange-500/10 text-orange-500',
  resolved: 'bg-green-500/10 text-green-500',
  closed: 'bg-muted text-muted-foreground',
};

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-yellow-500/10 text-yellow-500',
  high: 'bg-orange-500/10 text-orange-500',
  urgent: 'bg-destructive/10 text-destructive',
};

const TicketOversightTab = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, open: 0, urgent: 0, avgAge: 0 });

  const loadTickets = async () => {
    setLoading(true);
    try {
      let query = supabase.from('tickets').select('*').order('created_at', { ascending: false }).limit(100);
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      if (search) query = query.or(`title.ilike.%${search}%,contact_email.ilike.%${search}%`);
      
      const { data, error } = await query;
      if (error) throw error;
      setTickets(data || []);

      // Stats
      const { count: total } = await supabase.from('tickets').select('id', { count: 'exact', head: true });
      const { count: open } = await supabase.from('tickets').select('id', { count: 'exact', head: true }).in('status', ['new', 'open', 'in_progress']);
      const { count: urgent } = await supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('priority', 'urgent').in('status', ['new', 'open', 'in_progress']);
      
      setStats({ total: total || 0, open: open || 0, urgent: urgent || 0, avgAge: 0 });
    } catch (e) {
      console.error(e);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleReassign = async (ticketId: string, newAssignee: string) => {
    const { error } = await supabase.from('tickets').update({ assigned_to: newAssignee }).eq('id', ticketId);
    if (error) { toast.error('Failed to reassign'); return; }
    toast.success('Ticket reassigned');
    loadTickets();
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    const { error } = await supabase.from('tickets').update({ status: newStatus }).eq('id', ticketId);
    if (error) { toast.error('Failed to update status'); return; }
    toast.success('Status updated');
    loadTickets();
  };

  useEffect(() => { loadTickets(); }, [statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ticket Oversight</h2>
          <p className="text-muted-foreground">Cross-client ticket management and triage</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadTickets} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><p className="text-3xl font-bold">{stats.total}</p><p className="text-sm text-muted-foreground">Total Tickets</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-3xl font-bold text-yellow-500">{stats.open}</p><p className="text-sm text-muted-foreground">Open</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-3xl font-bold text-destructive">{stats.urgent}</p><p className="text-sm text-muted-foreground">Urgent</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-3xl font-bold text-primary">{tickets.length}</p><p className="text-sm text-muted-foreground">Showing</p></CardContent></Card>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tickets by title or email..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadTickets()} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Title</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Priority</th>
                <th className="text-left p-3 font-medium">Contact</th>
                <th className="text-left p-3 font-medium">Created</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : tickets.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No tickets found</td></tr>
                ) : tickets.map(t => (
                  <tr key={t.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium max-w-[250px] truncate">{t.title}</td>
                    <td className="p-3">
                      <Select value={t.status} onValueChange={v => handleStatusChange(t.id, v)}>
                        <SelectTrigger className="h-7 w-28 text-xs"><Badge className={statusColors[t.status] || ''}>{t.status}</Badge></SelectTrigger>
                        <SelectContent>
                          {['new','open','in_progress','resolved','closed'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3"><Badge className={priorityColors[t.priority] || ''}>{t.priority}</Badge></td>
                    <td className="p-3 text-muted-foreground">{t.contact_email || t.contact_name || '—'}</td>
                    <td className="p-3 text-muted-foreground">{format(new Date(t.created_at), 'MMM d, HH:mm')}</td>
                    <td className="p-3"><Button variant="ghost" size="sm"><ExternalLink className="h-3.5 w-3.5" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketOversightTab;
