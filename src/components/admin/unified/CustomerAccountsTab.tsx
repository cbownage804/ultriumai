import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Search, RefreshCw, Ban, CheckCircle, KeyRound, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useAuditLogger } from '@/hooks/useAuditLogger';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface UserAccount {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  banned_until?: string;
  email_confirmed_at?: string;
}

const CustomerAccountsTab = () => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [actionDialog, setActionDialog] = useState<{ type: string; user: UserAccount } | null>(null);
  const [reason, setReason] = useState('');
  const { logAdminAction } = useAuditLogger();

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Fetch profiles as a proxy for user accounts
      let query = supabase.from('profiles').select('id, email, created_at, updated_at').order('created_at', { ascending: false }).limit(100);
      if (search) query = query.ilike('email', `%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      setUsers((data || []).map(p => ({ id: p.id, email: p.email || 'No email', created_at: p.created_at, last_sign_in_at: p.updated_at })));
    } catch (e) {
      console.error(e);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (user: UserAccount) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email);
      if (error) throw error;
      await logAdminAction({ action: 'password_reset', resource_type: 'user', resource_id: user.id, resource_name: user.email });
      toast.success(`Password reset email sent to ${user.email}`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to send reset email');
    }
    setActionDialog(null);
  };

  const handleDisableAccount = async (user: UserAccount) => {
    try {
      // Mark in profiles
      await supabase.from('profiles').update({ is_active: false } as any).eq('id', user.id);
      await logAdminAction({ action: 'account_disabled', resource_type: 'user', resource_id: user.id, resource_name: user.email, metadata: { reason } });
      toast.success(`Account ${user.email} disabled`);
      loadUsers();
    } catch (e: any) {
      toast.error(e.message || 'Failed to disable');
    }
    setActionDialog(null);
    setReason('');
  };

  const handleEnableAccount = async (user: UserAccount) => {
    try {
      await supabase.from('profiles').update({ is_active: true } as any).eq('id', user.id);
      await logAdminAction({ action: 'account_enabled', resource_type: 'user', resource_id: user.id, resource_name: user.email });
      toast.success(`Account ${user.email} enabled`);
      loadUsers();
    } catch (e: any) {
      toast.error(e.message || 'Failed to enable');
    }
  };

  useEffect(() => { loadUsers(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customer Accounts</h2>
          <p className="text-muted-foreground">Manage user accounts, reset passwords, disable/enable access</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadUsers} className="gap-2"><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by email..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadUsers()} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Email</th>
              <th className="text-left p-3 font-medium">Joined</th>
              <th className="text-left p-3 font-medium">Last Active</th>
              <th className="text-left p-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No users found</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-medium">{u.email}</td>
                  <td className="p-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="p-3 text-muted-foreground">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : '—'}</td>
                  <td className="p-3 flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setActionDialog({ type: 'reset', user: u })} title="Reset password"><KeyRound className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setActionDialog({ type: 'disable', user: u })} title="Disable account"><Ban className="h-3.5 w-3.5 text-destructive" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEnableAccount(u)} title="Enable account"><CheckCircle className="h-3.5 w-3.5 text-green-500" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={!!actionDialog} onOpenChange={() => { setActionDialog(null); setReason(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionDialog?.type === 'reset' ? 'Reset Password' : 'Disable Account'}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {actionDialog?.type === 'reset' 
              ? `Send password reset email to ${actionDialog?.user.email}?`
              : `Disable account for ${actionDialog?.user.email}?`}
          </p>
          {actionDialog?.type === 'disable' && (
            <Textarea placeholder="Reason for disabling..." value={reason} onChange={e => setReason(e.target.value)} />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button variant={actionDialog?.type === 'disable' ? 'destructive' : 'default'} onClick={() => {
              if (actionDialog?.type === 'reset') handleResetPassword(actionDialog.user);
              else if (actionDialog) handleDisableAccount(actionDialog.user);
            }}>
              {actionDialog?.type === 'reset' ? 'Send Reset Email' : 'Disable Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerAccountsTab;
