import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Search, Shield, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface ImpersonationLog {
  id: string;
  admin_user_id: string;
  target_email: string;
  reason: string;
  started_at: string;
  ended_at?: string;
}

const UserImpersonationTab = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [reason, setReason] = useState('');
  const [targetUser, setTargetUser] = useState<{ id: string; email: string } | null>(null);
  const [logs, setLogs] = useState<ImpersonationLog[]>([]);
  const [searchResults, setSearchResults] = useState<{ id: string; email: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = async () => {
    if (!search.trim()) return;
    const { data } = await supabase.from('profiles').select('id, email').ilike('email', `%${search}%`).limit(10);
    setSearchResults((data || []).map(p => ({ id: p.id, email: p.email || 'No email' })));
  };

  const loadLogs = async () => {
    const { data } = await supabase.from('admin_impersonation_logs').select('*').order('started_at', { ascending: false }).limit(50);
    setLogs((data as any) || []);
  };

  const startImpersonation = async () => {
    if (!targetUser || !reason.trim()) {
      toast.error('Please select a user and provide a reason');
      return;
    }
    try {
      await supabase.from('admin_impersonation_logs').insert({
        admin_user_id: user?.id,
        target_user_id: targetUser.id,
        target_email: targetUser.email,
        reason,
      });
      toast.info(
        `Impersonation mode: Viewing as ${targetUser.email}. This is a read-only view of the user's perspective.`,
        { duration: 10000 }
      );
      // Open the dashboard in a new tab with a query param (read-only context)
      window.open(`/dashboard?view_as=${targetUser.id}`, '_blank');
      setTargetUser(null);
      setReason('');
      loadLogs();
    } catch (e: any) {
      toast.error(e.message || 'Failed to start impersonation');
    }
  };

  useEffect(() => { loadLogs(); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Eye className="h-6 w-6" /> User Impersonation</h2>
        <p className="text-muted-foreground">View the app as any user sees it for debugging. All sessions are logged.</p>
      </div>

      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-600">Security Notice</p>
              <p className="text-sm text-muted-foreground">All impersonation sessions are logged with admin identity, target user, reason, and timestamp. This audit trail is immutable.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Start Impersonation Session</CardTitle>
          <CardDescription>Search for a user to view their perspective</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search user email..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchUsers()} className="pl-9" />
            </div>
            <Button variant="outline" onClick={searchUsers}>Search</Button>
          </div>

          {searchResults.length > 0 && (
            <div className="border rounded-md divide-y">
              {searchResults.map(u => (
                <button key={u.id} onClick={() => { setTargetUser(u); setSearchResults([]); }} className="w-full text-left px-4 py-2 hover:bg-muted/50 flex justify-between items-center">
                  <span className="text-sm">{u.email}</span>
                  <Badge variant="outline" className="text-xs">Select</Badge>
                </button>
              ))}
            </div>
          )}

          {targetUser && (
            <div className="p-3 bg-primary/5 rounded-md border border-primary/20">
              <p className="text-sm font-medium">Selected: <span className="text-primary">{targetUser.email}</span></p>
            </div>
          )}

          <Textarea placeholder="Reason for impersonation (required)..." value={reason} onChange={e => setReason(e.target.value)} rows={2} />
          <Button onClick={startImpersonation} disabled={!targetUser || !reason.trim()} className="gap-2">
            <Eye className="h-4 w-4" /> Start Read-Only Session
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5" /> Impersonation Audit Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Target User</th>
              <th className="text-left p-3 font-medium">Reason</th>
              <th className="text-left p-3 font-medium">Started</th>
            </tr></thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">No impersonation sessions recorded</td></tr>
              ) : logs.map(l => (
                <tr key={l.id} className="border-b">
                  <td className="p-3">{l.target_email}</td>
                  <td className="p-3 text-muted-foreground max-w-[300px] truncate">{l.reason}</td>
                  <td className="p-3 text-muted-foreground">{format(new Date(l.started_at), 'MMM d, HH:mm')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserImpersonationTab;
