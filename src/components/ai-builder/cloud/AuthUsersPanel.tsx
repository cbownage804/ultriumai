import { useState, useEffect, useCallback } from 'react';
import { Users, RefreshCw, Trash2, Loader2, Mail, Clock, Shield } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';

interface AuthUsersPanelProps {
  supabaseUrl: string;
  supabaseKey: string;
}

interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  app_metadata?: Record<string, any>;
  user_metadata?: Record<string, any>;
}

export function AuthUsersPanel({ supabaseUrl, supabaseKey }: AuthUsersPanelProps) {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Try via edge function (needs service role key)
      const resp = await fetch(`${supabaseUrl}/functions/v1/admin-list-users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
        },
        body: JSON.stringify({ action: 'list' }),
      });

      if (resp.ok) {
        const data = await resp.json();
        setUsers(data.users || []);
      } else {
        // Fallback: show helpful message
        setError('Auth user management requires a "admin-list-users" edge function with service_role access. Users can be viewed in the Supabase Dashboard.');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to fetch users');
    }
    setLoading(false);
  }, [supabaseUrl, supabaseKey]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDeleteUser = useCallback(async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    try {
      const resp = await fetch(`${supabaseUrl}/functions/v1/admin-list-users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
        },
        body: JSON.stringify({ action: 'delete', userId }),
      });
      if (resp.ok) {
        toast.success('User deleted');
        fetchUsers();
      } else {
        const err = await resp.json();
        toast.error(err.error || 'Failed to delete user');
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  }, [supabaseUrl, supabaseKey, fetchUsers]);

  const formatDate = (d?: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getProvider = (user: AuthUser) => {
    const provider = user.app_metadata?.provider || user.app_metadata?.providers?.[0];
    return provider || 'email';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-medium text-white/80">Auth Users</span>
          {!loading && <span className="text-[10px] text-white/30 bg-white/[0.04] px-1.5 py-0.5 rounded">{users.length}</span>}
        </div>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-white/40 hover:text-white/70" onClick={fetchUsers}>
          <RefreshCw className={cn("h-3 w-3 mr-1", loading && "animate-spin")} /> Refresh
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-white/20" />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-3 max-w-sm">
            <Shield className="h-8 w-8 text-white/10 mx-auto" />
            <p className="text-xs text-white/40">{error}</p>
            <a
              href={`https://supabase.com/dashboard/project/${supabaseUrl?.match(/https:\/\/([^.]+)/)?.[1]}/auth/users`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-violet-500/15 text-violet-300 border border-violet-500/25 hover:bg-violet-500/25 transition-colors"
            >
              <Users className="h-3 w-3" />
              Open Supabase Dashboard
            </a>
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="min-w-max">
            {/* Header row */}
            <div className="flex border-b border-white/[0.08] bg-white/[0.02] sticky top-0 z-10">
              <div className="px-3 py-2 w-[220px] shrink-0 text-[10px] font-medium text-white/40 uppercase tracking-wider">Email</div>
              <div className="px-3 py-2 w-[100px] shrink-0 text-[10px] font-medium text-white/40 uppercase tracking-wider">Provider</div>
              <div className="px-3 py-2 w-[180px] shrink-0 text-[10px] font-medium text-white/40 uppercase tracking-wider">Created</div>
              <div className="px-3 py-2 w-[180px] shrink-0 text-[10px] font-medium text-white/40 uppercase tracking-wider">Last Sign In</div>
              <div className="px-3 py-2 w-[80px] shrink-0 text-[10px] font-medium text-white/40 uppercase tracking-wider">Status</div>
              <div className="px-3 py-2 w-10 shrink-0" />
            </div>

            {users.map(user => (
              <div key={user.id} className="flex border-b border-white/[0.04] hover:bg-white/[0.02] group">
                <div className="px-3 py-2 w-[220px] shrink-0 flex items-center gap-2">
                  <Mail className="h-3 w-3 text-white/20 shrink-0" />
                  <span className="text-xs text-white/70 font-mono truncate">{user.email || user.phone || '—'}</span>
                </div>
                <div className="px-3 py-2 w-[100px] shrink-0">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/40 capitalize">{getProvider(user)}</span>
                </div>
                <div className="px-3 py-2 w-[180px] shrink-0">
                  <span className="text-[10px] text-white/40">{formatDate(user.created_at)}</span>
                </div>
                <div className="px-3 py-2 w-[180px] shrink-0">
                  <span className="text-[10px] text-white/40">{formatDate(user.last_sign_in_at)}</span>
                </div>
                <div className="px-3 py-2 w-[80px] shrink-0">
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded",
                    user.email_confirmed_at ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                  )}>
                    {user.email_confirmed_at ? 'Verified' : 'Pending'}
                  </span>
                </div>
                <div className="px-1 py-2 w-10 shrink-0 flex items-center justify-center">
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="h-5 w-5 rounded flex items-center justify-center text-white/10 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-white/20">No users found</div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

export default AuthUsersPanel;
