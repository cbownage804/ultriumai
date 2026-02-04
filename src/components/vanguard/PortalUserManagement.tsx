import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users,
  UserPlus,
  Mail,
  MoreHorizontal,
  Shield,
  ShieldOff,
  KeyRound,
  Trash2,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface PortalUserManagementProps {
  clientId: string;
  clientName: string;
}

type PortalRole = 'admin' | 'manager' | 'user' | 'readonly';

interface PortalUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  mfa_enabled: boolean;
  created_at: string;
  permissions?: {
    can_view_tickets: boolean;
    can_create_tickets: boolean;
    can_view_all_tickets: boolean;
    can_view_devices: boolean;
    can_view_billing: boolean;
    can_access_safepass: boolean;
    can_access_safescan: boolean;
    can_access_safeweb: boolean;
    can_access_safetrack: boolean;
    can_manage_users: boolean;
    can_view_reports: boolean;
  };
}

interface Invitation {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  invited_at: string;
  expires_at: string;
}

const roleColors: Record<string, string> = {
  admin: 'bg-red-500/20 text-red-400 border-red-500/30',
  manager: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  user: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  readonly: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const roleDescriptions: Record<PortalRole, string> = {
  admin: 'Full access to all features including user management and billing',
  manager: 'Can view all tickets and devices, access SafeSuite tools',
  user: 'Can create/view own tickets and view devices',
  readonly: 'View-only access to tickets and devices',
};

export function PortalUserManagement({ clientId, clientName }: PortalUserManagementProps) {
  const queryClient = useQueryClient();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PortalUser | null>(null);
  
  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteRole, setInviteRole] = useState<PortalRole>('user');

  // Fetch users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['portal-users', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_portal_users')
        .select(`
          id, email, full_name, role, is_active, last_login_at, mfa_enabled, created_at,
          permissions:portal_user_permissions(*)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(u => ({
        ...u,
        permissions: u.permissions?.[0] || null,
      })) as PortalUser[];
    },
  });

  // Fetch invitations
  const { data: invitations, isLoading: invitationsLoading } = useQuery({
    queryKey: ['portal-invitations', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portal_user_invitations')
        .select('*')
        .eq('client_id', clientId)
        .order('invited_at', { ascending: false });

      if (error) throw error;
      return data as Invitation[];
    },
  });

  // Invite user mutation
  const inviteMutation = useMutation({
    mutationFn: async (data: { email: string; full_name: string; role: PortalRole }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/portal-user-invite?action=invite`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.session.access_token}`,
          },
          body: JSON.stringify({
            client_id: clientId,
            email: data.email,
            full_name: data.full_name,
            role: data.role,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send invitation');
      }

      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['portal-invitations', clientId] });
      setInviteDialogOpen(false);
      setInviteEmail('');
      setInviteFullName('');
      setInviteRole('user');
      
      if (result.email_sent) {
        toast.success('Invitation sent!', {
          description: `An email has been sent to ${inviteEmail}`,
        });
      } else {
        toast.success('Invitation created', {
          description: 'Email sending is not configured. Share the invite link manually.',
        });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Resend invitation mutation
  const resendMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/portal-user-invite?action=resend`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.session.access_token}`,
          },
          body: JSON.stringify({ invitation_id: invitationId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to resend invitation');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-invitations', clientId] });
      toast.success('Invitation resent');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Reset MFA mutation
  const resetMfaMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/portal-user-invite?action=reset-mfa`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.session.access_token}`,
          },
          body: JSON.stringify({ portal_user_id: userId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reset MFA');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-users', clientId] });
      toast.success('MFA reset successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Toggle user active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('client_portal_users')
        .update({ is_active: isActive })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-users', clientId] });
      toast.success('User status updated');
    },
    onError: () => {
      toast.error('Failed to update user status');
    },
  });

  // Update permissions
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string; permissions: Record<string, boolean> }) => {
      const { error } = await supabase
        .from('portal_user_permissions')
        .update(permissions)
        .eq('portal_user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-users', clientId] });
      setPermissionsDialogOpen(false);
      toast.success('Permissions updated');
    },
    onError: () => {
      toast.error('Failed to update permissions');
    },
  });

  // Revoke invitation
  const revokeInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('portal_user_invitations')
        .update({ status: 'revoked' })
        .eq('id', invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-invitations', clientId] });
      toast.success('Invitation revoked');
    },
    onError: () => {
      toast.error('Failed to revoke invitation');
    },
  });

  const pendingInvitations = invitations?.filter(i => i.status === 'pending') || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Portal Users
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Manage user access for {clientName}
          </p>
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>
                Send an invitation email to add a new user to {clientName}'s portal.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="John Smith"
                  value={inviteFullName}
                  onChange={(e) => setInviteFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as PortalRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex flex-col">
                        <span>Admin</span>
                        <span className="text-xs text-muted-foreground">Full access including user management</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="manager">
                      <div className="flex flex-col">
                        <span>Manager</span>
                        <span className="text-xs text-muted-foreground">View all tickets, access SafeSuite</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="user">
                      <div className="flex flex-col">
                        <span>User</span>
                        <span className="text-xs text-muted-foreground">Create tickets, view own data</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="readonly">
                      <div className="flex flex-col">
                        <span>Read Only</span>
                        <span className="text-xs text-muted-foreground">View-only access</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => inviteMutation.mutate({
                  email: inviteEmail,
                  full_name: inviteFullName,
                  role: inviteRole,
                })}
                disabled={!inviteEmail || !inviteFullName || inviteMutation.isPending}
              >
                {inviteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send Invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Active Users ({users?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="invitations" className="gap-2">
              <Mail className="h-4 w-4" />
              Pending Invitations ({pendingInvitations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4">
            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : users?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No users yet</p>
                <p className="text-sm">Invite users to give them access to the portal</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>MFA</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={roleColors[user.role]}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={user.is_active}
                          onCheckedChange={(checked) =>
                            toggleActiveMutation.mutate({ userId: user.id, isActive: checked })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {user.mfa_enabled ? (
                          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                            <Shield className="h-3 w-3 mr-1" />
                            Enabled
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-500/20 text-slate-400">
                            <ShieldOff className="h-3 w-3 mr-1" />
                            Disabled
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.last_login_at
                          ? format(new Date(user.last_login_at), 'MMM d, yyyy')
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setPermissionsDialogOpen(true);
                              }}
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Edit Permissions
                            </DropdownMenuItem>
                            {user.mfa_enabled && (
                              <DropdownMenuItem
                                onClick={() => resetMfaMutation.mutate(user.id)}
                              >
                                <KeyRound className="h-4 w-4 mr-2" />
                                Reset MFA
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() =>
                                toggleActiveMutation.mutate({ userId: user.id, isActive: false })
                              }
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Deactivate User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="invitations" className="mt-4">
            {invitationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : pendingInvitations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No pending invitations</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvitations.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{invite.full_name}</p>
                          <p className="text-sm text-muted-foreground">{invite.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={roleColors[invite.role]}>
                          {invite.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(invite.expires_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => resendMutation.mutate(invite.id)}
                            disabled={resendMutation.isPending}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => revokeInvitationMutation.mutate(invite.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>

        {/* Permissions Dialog */}
        <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Permissions</DialogTitle>
              <DialogDescription>
                Customize access for {selectedUser?.full_name}
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <PermissionsEditor
                user={selectedUser}
                onSave={(permissions) =>
                  updatePermissionsMutation.mutate({
                    userId: selectedUser.id,
                    permissions,
                  })
                }
                isSaving={updatePermissionsMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function PermissionsEditor({
  user,
  onSave,
  isSaving,
}: {
  user: PortalUser;
  onSave: (permissions: Record<string, boolean>) => void;
  isSaving: boolean;
}) {
  const [permissions, setPermissions] = useState({
    can_view_tickets: user.permissions?.can_view_tickets ?? true,
    can_create_tickets: user.permissions?.can_create_tickets ?? true,
    can_view_all_tickets: user.permissions?.can_view_all_tickets ?? false,
    can_view_devices: user.permissions?.can_view_devices ?? true,
    can_view_billing: user.permissions?.can_view_billing ?? false,
    can_access_safepass: user.permissions?.can_access_safepass ?? false,
    can_access_safescan: user.permissions?.can_access_safescan ?? false,
    can_access_safeweb: user.permissions?.can_access_safeweb ?? false,
    can_access_safetrack: user.permissions?.can_access_safetrack ?? false,
    can_manage_users: user.permissions?.can_manage_users ?? false,
    can_view_reports: user.permissions?.can_view_reports ?? false,
  });

  const toggle = (key: keyof typeof permissions) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const permissionGroups = [
    {
      title: 'Ticketing',
      items: [
        { key: 'can_view_tickets', label: 'View Tickets' },
        { key: 'can_create_tickets', label: 'Create Tickets' },
        { key: 'can_view_all_tickets', label: 'View All Company Tickets' },
      ],
    },
    {
      title: 'Devices & Reports',
      items: [
        { key: 'can_view_devices', label: 'View Devices' },
        { key: 'can_view_reports', label: 'View Reports' },
      ],
    },
    {
      title: 'SafeSuite Access',
      items: [
        { key: 'can_access_safepass', label: 'SafePass (Passwords)' },
        { key: 'can_access_safescan', label: 'SafeScan (Security)' },
        { key: 'can_access_safeweb', label: 'SafeWeb (Filtering)' },
        { key: 'can_access_safetrack', label: 'SafeTrack (Assets)' },
      ],
    },
    {
      title: 'Administration',
      items: [
        { key: 'can_view_billing', label: 'View Billing' },
        { key: 'can_manage_users', label: 'Manage Users' },
      ],
    },
  ];

  return (
    <div className="space-y-6 py-4">
      {permissionGroups.map((group) => (
        <div key={group.title}>
          <h4 className="text-sm font-medium mb-3">{group.title}</h4>
          <div className="space-y-3">
            {group.items.map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <Label htmlFor={item.key} className="text-sm text-muted-foreground">
                  {item.label}
                </Label>
                <Switch
                  id={item.key}
                  checked={permissions[item.key as keyof typeof permissions]}
                  onCheckedChange={() => toggle(item.key as keyof typeof permissions)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      <DialogFooter>
        <Button onClick={() => onSave(permissions)} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
          Save Permissions
        </Button>
      </DialogFooter>
    </div>
  );
}
