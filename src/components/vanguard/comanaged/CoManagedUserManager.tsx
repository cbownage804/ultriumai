import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Plus, Upload, MoreVertical, Star, Mail, Shield, UserX, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CoManagedUserManagerProps {
  organizationId: string;
}

interface EndUser {
  id: string;
  full_name: string;
  email: string;
  job_title: string;
  department: string;
  is_vip: boolean;
  portal_access_enabled: boolean;
  last_login_at: string | null;
  ticket_count: number;
}

export function CoManagedUserManager({ organizationId }: CoManagedUserManagerProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<EndUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (organizationId) loadUsers();
  }, [organizationId]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('comanaged_end_users')
        .select('*')
        .eq('organization_id', organizationId)
        .order('full_name');

      if (error) throw error;

      setUsers((data || []).map((u: any) => ({
        id: u.id,
        full_name: u.full_name || '',
        email: u.email || '',
        job_title: u.job_title || '',
        department: u.department || '',
        is_vip: u.is_vip ?? false,
        portal_access_enabled: u.portal_access_enabled ?? true,
        last_login_at: u.last_login_at,
        ticket_count: u.ticket_count || 0,
      })));
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleVip = async (userId: string, currentVip: boolean) => {
    try {
      await (supabase as any).from('comanaged_end_users').update({ is_vip: !currentVip }).eq('id', userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_vip: !currentVip } : u));
      toast.success(currentVip ? 'VIP status removed' : 'Marked as VIP');
    } catch { toast.error('Failed to update'); }
  };

  const toggleAccess = async (userId: string, currentAccess: boolean) => {
    try {
      await (supabase as any).from('comanaged_end_users').update({ portal_access_enabled: !currentAccess }).eq('id', userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, portal_access_enabled: !currentAccess } : u));
      toast.success(currentAccess ? 'Access disabled' : 'Access enabled');
    } catch { toast.error('Failed to update'); }
  };

  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatLastLogin = (date: string | null) => {
    if (!date) return "Never";
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-cyan-400" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-black/40 border-cyan-500/30 text-white" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-cyan-500/30 hover:bg-cyan-500/10"><Upload className="h-4 w-4 mr-2" />Import CSV</Button>
          <Button className="bg-cyan-600 hover:bg-cyan-700"><Plus className="h-4 w-4 mr-2" />Add User</Button>
        </div>
      </div>

      <div className="rounded-lg border border-cyan-500/20 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-cyan-500/20 hover:bg-transparent">
              <TableHead className="text-white/60">User</TableHead>
              <TableHead className="text-white/60">Department</TableHead>
              <TableHead className="text-white/60">Status</TableHead>
              <TableHead className="text-white/60">Last Login</TableHead>
              <TableHead className="text-white/60">Tickets</TableHead>
              <TableHead className="text-white/60 w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((u) => (
              <TableRow key={u.id} className="border-cyan-500/20 hover:bg-cyan-500/5">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-sm font-medium">
                      {u.full_name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-white font-medium flex items-center gap-2">
                        {u.full_name}
                        {u.is_vip && <Star className="h-3 w-3 text-amber-400 fill-amber-400" />}
                      </p>
                      <p className="text-xs text-white/40">{u.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div><p className="text-white text-sm">{u.department}</p><p className="text-xs text-white/40">{u.job_title}</p></div>
                </TableCell>
                <TableCell>
                  <Badge className={u.portal_access_enabled ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                    {u.portal_access_enabled ? 'Active' : 'Disabled'}
                  </Badge>
                </TableCell>
                <TableCell><span className="text-white/60 text-sm">{formatLastLogin(u.last_login_at)}</span></TableCell>
                <TableCell><span className="text-white text-sm">{u.ticket_count}</span></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-black/90 border-cyan-500/30">
                      <DropdownMenuItem className="text-white hover:bg-cyan-500/10"><Mail className="h-4 w-4 mr-2" />Send Portal Invite</DropdownMenuItem>
                      <DropdownMenuItem className="text-white hover:bg-cyan-500/10" onClick={() => toggleVip(u.id, u.is_vip)}>
                        <Star className="h-4 w-4 mr-2" />{u.is_vip ? 'Remove VIP' : 'Mark as VIP'}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-white hover:bg-cyan-500/10"><Shield className="h-4 w-4 mr-2" />Reset Password</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-400 hover:bg-red-500/10" onClick={() => toggleAccess(u.id, u.portal_access_enabled)}>
                        <UserX className="h-4 w-4 mr-2" />{u.portal_access_enabled ? 'Disable Access' : 'Enable Access'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-white/40 text-center">Showing {filteredUsers.length} of {users.length} users</p>
    </div>
  );
}
