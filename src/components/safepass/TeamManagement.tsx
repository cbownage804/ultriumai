import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Plus, UserPlus, Share, Settings, Shield, Trash2 } from 'lucide-react';
import { useVaultTeams } from '@/hooks/useSafePassTeams';
import { useVault } from '@/hooks/useSafePass';

const TeamManagement = () => {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [newTeamData, setNewTeamData] = useState({ name: '', description: '', max_members: 10 });
  const [inviteData, setInviteData] = useState({ email: '', role: 'viewer' as 'admin' | 'editor' | 'viewer' });
  const [shareData, setShareData] = useState({ vaultId: '', teamId: '', permissions: { can_view: true, can_edit: false, can_share: false } });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const { 
    teams, 
    memberships, 
    sharedVaults, 
    isLoading, 
    createTeam, 
    inviteToTeam, 
    shareVaultWithTeam, 
    removeMember,
    loadMemberships 
  } = useVaultTeams();
  
  const { vaults } = useVault();

  const handleCreateTeam = async () => {
    if (!newTeamData.name.trim()) return;
    
    const success = await createTeam(newTeamData);
    if (success) {
      setNewTeamData({ name: '', description: '', max_members: 10 });
      setShowCreateDialog(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteData.email.trim() || !selectedTeam) return;
    
    const success = await inviteToTeam(selectedTeam, inviteData.email, inviteData.role);
    if (success) {
      setInviteData({ email: '', role: 'viewer' });
      setShowInviteDialog(false);
    }
  };

  const handleShareVault = async () => {
    if (!shareData.vaultId || !shareData.teamId) return;
    
    const success = await shareVaultWithTeam(shareData.vaultId, shareData.teamId, shareData.permissions);
    if (success) {
      setShareData({ vaultId: '', teamId: '', permissions: { can_view: true, can_edit: false, can_share: false } });
      setShowShareDialog(false);
    }
  };

  const handleTeamSelect = (teamId: string) => {
    setSelectedTeam(teamId);
    loadMemberships(teamId);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-gradient-primary';
      case 'admin': return 'bg-destructive';
      case 'editor': return 'bg-warning';
      case 'viewer': return 'bg-muted';
      default: return 'bg-muted';
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-destructive';
      case 'high': return 'text-warning';
      case 'medium': return 'text-muted-foreground';
      case 'low': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading teams...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Team Management</h2>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-amber-500 hover:bg-amber-600 text-black">
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  value={newTeamData.name}
                  onChange={(e) => setNewTeamData({ ...newTeamData, name: e.target.value })}
                  placeholder="Enter team name"
                />
              </div>
              <div>
                <Label htmlFor="team-description">Description</Label>
                <Textarea
                  id="team-description"
                  value={newTeamData.description}
                  onChange={(e) => setNewTeamData({ ...newTeamData, description: e.target.value })}
                  placeholder="Optional team description"
                />
              </div>
              <div>
                <Label htmlFor="max-members">Maximum Members</Label>
                <Input
                  id="max-members"
                  type="number"
                  min="2"
                  max="100"
                  value={newTeamData.max_members}
                  onChange={(e) => setNewTeamData({ ...newTeamData, max_members: parseInt(e.target.value) || 10 })}
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={() => setShowCreateDialog(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleCreateTeam} className="flex-1 bg-amber-500 hover:bg-amber-600 text-black">
                  Create Team
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="teams" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="shared">Shared Vaults</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="teams">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Teams List */}
            <Card>
              <CardHeader>
                <CardTitle>Your Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teams.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No teams yet. Create your first team to start collaborating!</p>
                    </div>
                  ) : (
                    teams.map((team) => (
                      <div
                        key={team.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedTeam === team.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => handleTeamSelect(team.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{team.name}</h3>
                            {team.description && (
                              <p className="text-sm text-muted-foreground mt-1">{team.description}</p>
                            )}
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge className={getRoleBadgeColor(team.user_role || 'viewer')}>
                                {team.user_role}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {team.member_count} members
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {(team.user_role === 'owner' || team.user_role === 'admin') && (
                              <>
                                <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedTeam(team.id);
                                      }}
                                    >
                                      <UserPlus className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Invite Team Member</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="invite-email">Email Address</Label>
                                        <Input
                                          id="invite-email"
                                          type="email"
                                          value={inviteData.email}
                                          onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                                          placeholder="Enter email address"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="invite-role">Role</Label>
                                        <Select value={inviteData.role} onValueChange={(value: any) => setInviteData({ ...inviteData, role: value })}>
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="viewer">Viewer</SelectItem>
                                            <SelectItem value="editor">Editor</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="flex space-x-2">
                                        <Button onClick={() => setShowInviteDialog(false)} variant="outline" className="flex-1">
                                          Cancel
                                        </Button>
                                        <Button onClick={handleInviteMember} className="flex-1 bg-amber-500 hover:bg-amber-600 text-black">
                                          Send Invite
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>

                                <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShareData({ ...shareData, teamId: team.id });
                                      }}
                                    >
                                      <Share className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Share Vault with Team</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="vault-select">Select Vault</Label>
                                        <Select value={shareData.vaultId} onValueChange={(value) => setShareData({ ...shareData, vaultId: value })}>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Choose a vault" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {vaults.map((vault) => (
                                              <SelectItem key={vault.id} value={vault.id}>
                                                {vault.vault_name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-3">
                                        <Label>Permissions</Label>
                                        <div className="space-y-2">
                                          <label className="flex items-center space-x-2">
                                            <input
                                              type="checkbox"
                                              checked={shareData.permissions.can_view}
                                              onChange={(e) => setShareData({
                                                ...shareData,
                                                permissions: { ...shareData.permissions, can_view: e.target.checked }
                                              })}
                                            />
                                            <span className="text-sm">Can view</span>
                                          </label>
                                          <label className="flex items-center space-x-2">
                                            <input
                                              type="checkbox"
                                              checked={shareData.permissions.can_edit}
                                              onChange={(e) => setShareData({
                                                ...shareData,
                                                permissions: { ...shareData.permissions, can_edit: e.target.checked }
                                              })}
                                            />
                                            <span className="text-sm">Can edit</span>
                                          </label>
                                          <label className="flex items-center space-x-2">
                                            <input
                                              type="checkbox"
                                              checked={shareData.permissions.can_share}
                                              onChange={(e) => setShareData({
                                                ...shareData,
                                                permissions: { ...shareData.permissions, can_share: e.target.checked }
                                              })}
                                            />
                                            <span className="text-sm">Can share</span>
                                          </label>
                                        </div>
                                      </div>
                                      <div className="flex space-x-2">
                                        <Button onClick={() => setShowShareDialog(false)} variant="outline" className="flex-1">
                                          Cancel
                                        </Button>
                                        <Button onClick={handleShareVault} className="flex-1 bg-amber-500 hover:bg-amber-600 text-black">
                                          Share Vault
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Team Members */}
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTeam ? (
                  <div className="space-y-3">
                    {memberships.filter(m => m.team_id === selectedTeam).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No members loaded. Select a team to view members.</p>
                      </div>
                    ) : (
                      memberships
                        .filter(m => m.team_id === selectedTeam)
                        .map((membership) => (
                          <div key={membership.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{membership.user_id}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge className={getRoleBadgeColor(membership.role)}>
                                  {membership.role}
                                </Badge>
                                {membership.joined_at ? (
                                  <span className="text-sm text-muted-foreground">
                                    Joined {new Date(membership.joined_at).toLocaleDateString()}
                                  </span>
                                ) : (
                                  <span className="text-sm text-warning">Pending invite</span>
                                )}
                              </div>
                            </div>
                            {membership.role !== 'owner' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeMember(membership.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a team to view its members</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="shared">
          <Card>
            <CardHeader>
              <CardTitle>Shared Vaults</CardTitle>
            </CardHeader>
            <CardContent>
              {sharedVaults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Share className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No shared vaults yet. Share a vault with a team to get started!</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vault Name</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Shared By</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Shared Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sharedVaults.map((sharedVault) => (
                      <TableRow key={sharedVault.id}>
                        <TableCell className="font-medium">{sharedVault.vault_name}</TableCell>
                        <TableCell>{sharedVault.team_name}</TableCell>
                        <TableCell>{sharedVault.shared_by_email}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            {sharedVault.permissions.can_view && <Badge variant="outline">View</Badge>}
                            {sharedVault.permissions.can_edit && <Badge variant="outline">Edit</Badge>}
                            {sharedVault.permissions.can_share && <Badge variant="outline">Share</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(sharedVault.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Team Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Team settings and policies coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamManagement;