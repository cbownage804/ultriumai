import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, UserPlus, Search, Trash2, RefreshCw } from 'lucide-react';

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  email?: string;
  full_name?: string;
}

export const RoleManagementTab = () => {
  const { toast } = useToast();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<string>('moderator');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadRoles(); }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const { data: rolesData, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich with profile data
      const userIds = rolesData?.map(r => r.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      setRoles((rolesData || []).map(r => ({
        ...r,
        email: profileMap.get(r.user_id)?.email || 'Unknown',
        full_name: profileMap.get(r.user_id)?.full_name || null,
      })));
    } catch (error) {
      console.error('Error loading roles:', error);
      toast({ title: "Error", description: "Failed to load roles", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async () => {
    if (!newEmail.trim()) return;
    setSaving(true);
    try {
      // Find user by email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', newEmail.trim())
        .maybeSingle();

      if (profileError || !profile) {
        toast({ title: "User not found", description: "No user with that email exists.", variant: "destructive" });
        return;
      }

      const { data: currentUser } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: profile.user_id,
          role: newRole as any,
          granted_by: currentUser.user?.id,
        });

      if (error) {
        if (error.code === '23505') {
          toast({ title: "Already assigned", description: "User already has this role.", variant: "destructive" });
        } else {
          throw error;
        }
        return;
      }

      toast({ title: "Role assigned", description: `${newRole} role granted to ${newEmail}` });
      setAddDialogOpen(false);
      setNewEmail('');
      setNewRole('moderator');
      loadRoles();
    } catch (error: any) {
      console.error('Error adding role:', error);
      toast({ title: "Error", description: error.message || "Failed to assign role", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveRole = async (roleEntry: UserRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleEntry.id);

      if (error) throw error;
      toast({ title: "Role removed", description: `Removed ${roleEntry.role} from ${roleEntry.email}` });
      loadRoles();
    } catch (error: any) {
      console.error('Error removing role:', error);
      toast({ title: "Error", description: error.message || "Failed to remove role", variant: "destructive" });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Badge className="bg-red-500/20 text-red-400 border-0">Admin</Badge>;
      case 'moderator': return <Badge className="bg-blue-500/20 text-blue-400 border-0">Moderator</Badge>;
      case 'msp_admin': return <Badge className="bg-purple-500/20 text-purple-400 border-0">MSP Admin</Badge>;
      case 'mssp_admin': return <Badge className="bg-amber-500/20 text-amber-400 border-0">MSSP Admin</Badge>;
      case 'ultrium_admin': return <Badge className="bg-cyan-500/20 text-cyan-400 border-0">Ultrium Admin</Badge>;
      default: return <Badge variant="outline">{role}</Badge>;
    }
  };

  const filtered = roles.filter(r =>
    !searchTerm ||
    r.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by user
  const userGroups = new Map<string, UserRole[]>();
  filtered.forEach(r => {
    const existing = userGroups.get(r.user_id) || [];
    existing.push(r);
    userGroups.set(r.user_id, existing);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Role Management
          </h2>
          <p className="text-muted-foreground">Assign and manage user roles across the platform</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadRoles}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" /> Assign Role
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {['admin', 'moderator', 'msp_admin', 'user'].map(role => (
          <Card key={role}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm capitalize">{role.replace('_', ' ')}s</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {roles.filter(r => r.role === role).length}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Role Assignments</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users or roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No role assignments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{r.email}</div>
                          {r.full_name && <div className="text-sm text-muted-foreground">{r.full_name}</div>}
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(r.role)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveRole(r)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Role Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
            <DialogDescription>Grant a role to an existing user by email address</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input placeholder="user@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="msp_admin">MSP Admin</SelectItem>
                  <SelectItem value="mssp_admin">MSSP Admin</SelectItem>
                  <SelectItem value="ultrium_admin">Ultrium Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddRole} disabled={saving || !newEmail.trim()}>
              {saving ? 'Assigning...' : 'Assign Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
