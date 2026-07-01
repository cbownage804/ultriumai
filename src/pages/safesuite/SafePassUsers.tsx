import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWraythSubscription } from "@/hooks/useSafeSuite";
import { useNavigate } from "react-router-dom";
import { isWraythDomain } from "@/utils/subdomain";
import { 
  Users, 
  Plus, 
  Search, 
  Shield, 
  ShieldOff,
  UserPlus,
  MoreHorizontal,
  KeyRound,
  Smartphone,
  UserX,
  UserCheck,
  Mail,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  Crown
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TeaserLock } from "@/components/safesuite/TeaserLock";

// Teaser content showing user management UI
function UsersTeaserContent() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team Members</h2>
          <p className="text-muted-foreground">Manage users and their access permissions</p>
        </div>
        <Button type="button" disabled aria-disabled className="gap-2 pointer-events-none opacity-70">
          <UserPlus className="h-4 w-4" />
          Invite User
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>MFA</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { name: 'Alice Johnson', email: 'alice@company.com', role: 'Admin', mfa: true, active: true },
                { name: 'Bob Williams', email: 'bob@company.com', role: 'Member', mfa: true, active: true },
                { name: 'Carol Davis', email: 'carol@company.com', role: 'Member', mfa: false, active: true },
                { name: 'David Brown', email: 'david@company.com', role: 'Member', mfa: true, active: false },
              ].map((user, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {user.mfa ? (
                      <Shield className="h-4 w-4 text-green-500" />
                    ) : (
                      <ShieldOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.active ? 'outline' : 'secondary'} className={user.active ? 'text-green-500 border-green-500/30' : ''}>
                      {user.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button type="button" disabled aria-disabled variant="ghost" size="sm" className="pointer-events-none opacity-70">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

interface ManagedUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  mfa_enabled: boolean;
  created_at: string;
  last_login?: string;
}

interface ActionDialogState {
  open: boolean;
  type: 'password_reset' | 'mfa_reset' | 'toggle_status' | 'invite' | null;
  user: ManagedUser | null;
  loading: boolean;
}

const VaultUsers = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { isBusiness, loading: subLoading, tier } = useWraythSubscription();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionDialog, setActionDialog] = useState<ActionDialogState>({
    open: false,
    type: null,
    user: null,
    loading: false
  });

  // Form for adding new user
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState("user");
  const [addingUser, setAddingUser] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Get users from profiles table (only users we have access to manage)
      // For now, load all users - in production, this would be filtered by organization
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform to ManagedUser format
      const managedUsers: ManagedUser[] = (profiles || []).map(profile => ({
        id: profile.id,
        user_id: profile.id,
        email: profile.email || '',
        full_name: profile.full_name || 'Unknown User',
        role: 'user', // Default role
        is_active: true, // Would come from user status
        mfa_enabled: false, // Would come from auth metadata
        created_at: profile.created_at,
        last_login: profile.updated_at
      }));

      setUsers(managedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isBusiness) {
      loadUsers();
    }
  }, [isBusiness]);

  // Business tier gate - show teaser content
  if (!subLoading && !isBusiness) {
    return (
      <TeaserLock 
        feature="team" 
        message="Invite and manage team members with their own secure vaults"
        teaserContent={<UsersTeaserContent />}
      >
        <div />
      </TeaserLock>
    );
  }

  const handlePasswordReset = async () => {
    if (!actionDialog.user) return;
    
    setActionDialog(prev => ({ ...prev, loading: true }));
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        actionDialog.user.email,
        { redirectTo: `${window.location.origin}/reset-password` }
      );

      if (error) throw error;

      toast.success(`Password reset email sent to ${actionDialog.user.email}`);
      setActionDialog({ open: false, type: null, user: null, loading: false });
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || "Failed to send password reset email");
    } finally {
      setActionDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleMFAReset = async () => {
    if (!actionDialog.user) return;
    
    setActionDialog(prev => ({ ...prev, loading: true }));
    
    try {
      // Call edge function to reset MFA
      const { data, error } = await supabase.functions.invoke('safesuite-user-management', {
        body: {
          action: 'reset_mfa',
          userId: actionDialog.user.user_id
        }
      });

      if (error) throw error;

      toast.success(`MFA has been reset for ${actionDialog.user.full_name}`);
      setActionDialog({ open: false, type: null, user: null, loading: false });
      loadUsers();
    } catch (error: any) {
      console.error('MFA reset error:', error);
      toast.error(error.message || "Failed to reset MFA");
    } finally {
      setActionDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleToggleStatus = async () => {
    if (!actionDialog.user) return;
    
    setActionDialog(prev => ({ ...prev, loading: true }));
    
    try {
      // Call edge function to toggle user status
      const { data, error } = await supabase.functions.invoke('safesuite-user-management', {
        body: {
          action: 'toggle_status',
          userId: actionDialog.user.user_id,
          enabled: !actionDialog.user.is_active
        }
      });

      if (error) throw error;

      const newStatus = !actionDialog.user.is_active;
      toast.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
      setActionDialog({ open: false, type: null, user: null, loading: false });
      loadUsers();
    } catch (error: any) {
      console.error('Status toggle error:', error);
      toast.error(error.message || "Failed to update user status");
    } finally {
      setActionDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSendInvite = async () => {
    if (!actionDialog.user) return;
    
    setActionDialog(prev => ({ ...prev, loading: true }));
    
    try {
      // Call edge function to resend invite
      const { data, error } = await supabase.functions.invoke('safesuite-user-management', {
        body: {
          action: 'resend_invite',
          email: actionDialog.user.email
        }
      });

      if (error) throw error;

      toast.success(`Invitation resent to ${actionDialog.user.email}`);
      setActionDialog({ open: false, type: null, user: null, loading: false });
    } catch (error: any) {
      console.error('Invite error:', error);
      toast.error(error.message || "Failed to send invitation");
    } finally {
      setActionDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleAddUser = async () => {
    if (!newUserEmail || !newUserName) {
      toast.error("Please fill in all required fields");
      return;
    }

    setAddingUser(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('safesuite-user-management', {
        body: {
          action: 'invite_user',
          email: newUserEmail,
          fullName: newUserName,
          role: newUserRole
        }
      });

      if (error) throw error;

      toast.success(`Invitation sent to ${newUserEmail}`);
      setIsAddDialogOpen(false);
      setNewUserEmail("");
      setNewUserName("");
      setNewUserRole("user");
      loadUsers();
    } catch (error: any) {
      console.error('Add user error:', error);
      toast.error(error.message || "Failed to invite user");
    } finally {
      setAddingUser(false);
    }
  };

  const openActionDialog = (type: ActionDialogState['type'], user: ManagedUser) => {
    setActionDialog({ open: true, type, user, loading: false });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "active" && user.is_active) ||
      (statusFilter === "inactive" && !user.is_active);
    
    return matchesSearch && matchesStatus;
  });

  const getActionDialogContent = () => {
    if (!actionDialog.type || !actionDialog.user) return null;

    switch (actionDialog.type) {
      case 'password_reset':
        return {
          title: "Reset Password",
          description: `Send a password reset email to ${actionDialog.user.email}? The user will receive a link to create a new password.`,
          icon: <KeyRound className="h-6 w-6 text-primary" />,
          confirmText: "Send Reset Email",
          onConfirm: handlePasswordReset
        };
      case 'mfa_reset':
        return {
          title: "Reset Multi-Factor Authentication",
          description: `Reset MFA for ${actionDialog.user.full_name}? They will need to set up MFA again on their next login.`,
          icon: <Smartphone className="h-6 w-6 text-yellow-500" />,
          confirmText: "Reset MFA",
          onConfirm: handleMFAReset
        };
      case 'toggle_status':
        const isDeactivating = actionDialog.user.is_active;
        return {
          title: isDeactivating ? "Deactivate User" : "Activate User",
          description: isDeactivating 
            ? `Deactivate ${actionDialog.user.full_name}? They will lose access to all Wrayth features.`
            : `Activate ${actionDialog.user.full_name}? They will regain access to Wrayth features.`,
          icon: isDeactivating 
            ? <UserX className="h-6 w-6 text-destructive" />
            : <UserCheck className="h-6 w-6 text-green-500" />,
          confirmText: isDeactivating ? "Deactivate" : "Activate",
          onConfirm: handleToggleStatus
        };
      case 'invite':
        return {
          title: "Resend Invitation",
          description: `Resend the invitation email to ${actionDialog.user.email}?`,
          icon: <Mail className="h-6 w-6 text-primary" />,
          confirmText: "Send Invitation",
          onConfirm: handleSendInvite
        };
      default:
        return null;
    }
  };

  const dialogContent = getActionDialogContent();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts, reset passwords and MFA without accessing credentials
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </div>

      {/* Info Alert */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Note:</strong> You can manage user accounts without seeing their passwords. 
          Password resets send an email directly to the user.
        </AlertDescription>
      </Alert>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({filteredUsers.length})
          </CardTitle>
          <CardDescription>
            Manage account access and security settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>MFA</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.full_name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.mfa_enabled ? (
                      <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                        <Shield className="h-3 w-3 mr-1" />
                        Enabled
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <ShieldOff className="h-3 w-3 mr-1" />
                        Disabled
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.last_login 
                      ? new Date(user.last_login).toLocaleDateString()
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Account Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openActionDialog('password_reset', user)}>
                          <KeyRound className="h-4 w-4 mr-2" />
                          Reset Password
                        </DropdownMenuItem>
                        {user.mfa_enabled && (
                          <DropdownMenuItem onClick={() => openActionDialog('mfa_reset', user)}>
                            <Smartphone className="h-4 w-4 mr-2" />
                            Reset MFA
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => openActionDialog('invite', user)}>
                          <Mail className="h-4 w-4 mr-2" />
                          Resend Invite
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => openActionDialog('toggle_status', user)}
                          className={user.is_active ? "text-destructive" : "text-green-600"}
                        >
                          {user.is_active ? (
                            <>
                              <UserX className="h-4 w-4 mr-2" />
                              Deactivate User
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Activate User
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      {searchTerm || statusFilter !== "all" 
                        ? "No users found matching your filters" 
                        : "No users found"
                      }
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Total Users</span>
            </div>
            <div className="text-2xl font-bold mt-2">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Active</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {users.filter(u => u.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-violet-500" />
              <span className="text-sm font-medium">MFA Enabled</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {users.filter(u => u.mfa_enabled).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Inactive</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {users.filter(u => !u.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Confirmation Dialog */}
      <Dialog 
        open={actionDialog.open} 
        onOpenChange={(open) => !actionDialog.loading && setActionDialog(prev => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              {dialogContent?.icon}
              <DialogTitle>{dialogContent?.title}</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              {dialogContent?.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setActionDialog({ open: false, type: null, user: null, loading: false })}
              disabled={actionDialog.loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={dialogContent?.onConfirm}
              disabled={actionDialog.loading}
            >
              {actionDialog.loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {dialogContent?.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
            <DialogDescription>
              Send an invitation email to add a new user to your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={newUserRole} onValueChange={setNewUserRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={addingUser}>
              {addingUser && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VaultUsers;
