/**
 * SafePass Team Management Page
 * For Business tier subscribers to manage team members and shared vaults
 */

import { useState } from 'react';
import { useWraythTeam, useSharedVault } from '@/hooks/useSafeSuiteTeam';
import { useWraythSubscription } from '@/hooks/useSafeSuite';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users,
  UserPlus,
  Shield,
  Crown,
  MoreVertical,
  Trash2,
  UserCog,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  FolderKey,
  Plus,
  Lock,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { TeaserLock } from '@/components/safesuite/TeaserLock';

// Teaser content showing what team features look like
function TeamTeaserContent() {
  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                My Team
              </CardTitle>
              <CardDescription>Manage your team members and permissions</CardDescription>
            </div>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Invite Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'John Smith', email: 'john@company.com', role: 'Owner' },
              { name: 'Sarah Wilson', email: 'sarah@company.com', role: 'Admin' },
              { name: 'Mike Chen', email: 'mike@company.com', role: 'Member' },
            ].map((member, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium">{member.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <Badge variant={member.role === 'Owner' ? 'default' : 'secondary'}>{member.role}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderKey className="h-5 w-5" />
            Shared Vaults
          </CardTitle>
          <CardDescription>Password collections shared with your team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {['Development Credentials', 'Client Accounts', 'Infrastructure'].map((vault, i) => (
              <div key={i} className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <FolderKey className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium">{vault}</p>
                    <p className="text-xs text-muted-foreground">{(i + 2) * 8} passwords</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SafePassTeam() {
  const { tier } = useWraythSubscription();
  const {
    team,
    members,
    vaults,
    loading,
    userRole,
    isOwner,
    isAdmin,
    hasTeam,
    createTeam,
    inviteMember,
    removeMember,
    updateMemberRole,
    createVault
  } = useWraythTeam();

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [createTeamDialogOpen, setCreateTeamDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newVaultName, setNewVaultName] = useState('');
  const [createVaultDialogOpen, setCreateVaultDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Business tier required - show teaser content
  if (tier !== 'business') {
    return (
      <TeaserLock 
        feature="team" 
        message="Create teams, invite members, and share passwords securely"
        teaserContent={<TeamTeaserContent />}
      >
        {/* This won't render for non-business users */}
        <div />
      </TeaserLock>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No team yet - show creation UI
  if (!hasTeam) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Create Your Team</CardTitle>
            <CardDescription>
              Set up your team to start sharing passwords securely with your colleagues.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-sm mx-auto space-y-4">
              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  placeholder="My Company"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
              </div>
              <Button 
                className="w-full" 
                onClick={async () => {
                  if (!newTeamName.trim()) return;
                  setIsSubmitting(true);
                  await createTeam(newTeamName);
                  setIsSubmitting(false);
                }}
                disabled={!newTeamName.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Create Team'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeMembers = members.filter(m => m.status === 'active');
  const pendingMembers = members.filter(m => m.status === 'pending');

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setIsSubmitting(true);
    const success = await inviteMember(inviteEmail, inviteRole);
    if (success) {
      setInviteEmail('');
      setInviteDialogOpen(false);
    }
    setIsSubmitting(false);
  };

  const handleCreateVault = async () => {
    if (!newVaultName.trim()) return;
    setIsSubmitting(true);
    await createVault(newVaultName);
    setNewVaultName('');
    setCreateVaultDialogOpen(false);
    setIsSubmitting(false);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <Badge className="gap-1"><Crown className="h-3 w-3" /> Owner</Badge>;
      case 'admin':
        return <Badge variant="secondary" className="gap-1"><Shield className="h-3 w-3" /> Admin</Badge>;
      default:
        return <Badge variant="outline">Member</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="text-success border-success gap-1"><CheckCircle2 className="h-3 w-3" /> Active</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-warning border-warning gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'suspended':
        return <Badge variant="outline" className="text-destructive border-destructive gap-1"><XCircle className="h-3 w-3" /> Suspended</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{team?.name}</h1>
          <p className="text-muted-foreground">
            {activeMembers.length} of {team?.max_seats} seats used
          </p>
        </div>
        {isAdmin && (
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your team. They'll get access to shared vaults.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as 'admin' | 'member')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member - Can view and use shared passwords</SelectItem>
                      <SelectItem value="admin">Admin - Can manage members and vaults</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInvite} disabled={!inviteEmail.trim() || isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Invitation'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="members" className="space-y-6">
        <TabsList>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Members ({members.length})
          </TabsTrigger>
          <TabsTrigger value="vaults" className="gap-2">
            <FolderKey className="h-4 w-4" />
            Shared Vaults ({vaults.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          {/* Active Members */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {activeMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {member.email[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{member.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Joined {member.joined_at ? format(new Date(member.joined_at), 'MMM d, yyyy') : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getRoleBadge(member.role)}
                      {isAdmin && member.role !== 'owner' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => updateMemberRole(member.id, member.role === 'admin' ? 'member' : 'admin')}>
                              <UserCog className="h-4 w-4 mr-2" />
                              {member.role === 'admin' ? 'Demote to Member' : 'Promote to Admin'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => removeMember(member.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove from Team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Invites */}
          {pendingMembers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pending Invitations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {pendingMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{member.email}</p>
                          <p className="text-sm text-muted-foreground">
                            Invited {format(new Date(member.invited_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(member.status)}
                        {isAdmin && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeMember(member.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seat Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Team Seats</p>
                  <p className="text-sm text-muted-foreground">
                    {activeMembers.length} active / {team?.max_seats} max
                  </p>
                </div>
                {isOwner && (
                  <Link to="/billing">
                    <Button variant="outline">Manage Seats</Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vaults" className="space-y-4">
          <div className="flex justify-end">
            {isAdmin && (
              <Dialog open={createVaultDialogOpen} onOpenChange={setCreateVaultDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Vault
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Shared Vault</DialogTitle>
                    <DialogDescription>
                      Create a new vault to organize shared passwords.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="vaultName">Vault Name</Label>
                      <Input
                        id="vaultName"
                        placeholder="Engineering Credentials"
                        value={newVaultName}
                        onChange={(e) => setNewVaultName(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateVaultDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateVault} disabled={!newVaultName.trim() || isSubmitting}>
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Vault'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {vaults.map((vault) => (
              <Card key={vault.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FolderKey className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{vault.name}</CardTitle>
                        <CardDescription>
                          {vault.description || 'Shared password vault'}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Link to={`/pass/team/vault/${vault.id}`}>
                    <Button variant="outline" className="w-full">
                      Open Vault
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {vaults.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <FolderKey className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No shared vaults yet</p>
                {isAdmin && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setCreateVaultDialogOpen(true)}
                  >
                    Create Your First Vault
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
