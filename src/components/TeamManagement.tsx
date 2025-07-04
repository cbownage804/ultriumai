import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, UserPlus, Settings, Trash2, Mail, Crown, Shield, Eye } from "lucide-react";

interface Team {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_at: string;
  max_members: number;
  member_count: number;
  user_role: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  email: string;
  full_name: string;
}

interface TeamInvitation {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
}

const TeamManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showInviteUser, setShowInviteUser] = useState(false);

  const [newTeam, setNewTeam] = useState({
    name: "",
    description: "",
    max_members: 10
  });

  const [newInvitation, setNewInvitation] = useState({
    email: "",
    role: "member"
  });

  useEffect(() => {
    if (user) {
      loadTeams();
    }
  }, [user]);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          team_memberships!inner(role),
          team_memberships(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const teamsWithCounts = data.map(team => ({
        ...team,
        member_count: team.team_memberships.length,
        user_role: team.team_memberships[0]?.role || 'member'
      }));

      setTeams(teamsWithCounts);
      if (teamsWithCounts.length > 0 && !selectedTeam) {
        setSelectedTeam(teamsWithCounts[0]);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
      toast({
        title: "Error",
        description: "Failed to load teams.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async (teamId: string) => {
    try {
      const { data: memberships, error } = await supabase
        .from('team_memberships')
        .select('*')
        .eq('team_id', teamId)
        .eq('is_active', true)
        .order('role', { ascending: true });

      if (error) throw error;

      // Get profiles for all user IDs
      const userIds = memberships?.map(m => m.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .in('user_id', userIds);

      const membersWithProfiles = memberships?.map(member => {
        const profile = profiles?.find(p => p.user_id === member.user_id);
        return {
          id: member.id,
          user_id: member.user_id,
          role: member.role,
          joined_at: member.joined_at,
          email: profile?.email || 'Unknown',
          full_name: profile?.full_name || 'Unknown User'
        };
      }) || [];

      setMembers(membersWithProfiles);
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const loadTeamInvitations = async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('team_id', teamId)
        .eq('is_active', true)
        .is('accepted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  };

  useEffect(() => {
    if (selectedTeam) {
      loadTeamMembers(selectedTeam.id);
      loadTeamInvitations(selectedTeam.id);
    }
  }, [selectedTeam]);

  const createTeam = async () => {
    if (!user || !newTeam.name.trim()) return;

    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: newTeam.name,
          description: newTeam.description,
          owner_id: user.id,
          max_members: newTeam.max_members
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Team created",
        description: `${newTeam.name} has been created successfully.`,
      });

      setNewTeam({ name: "", description: "", max_members: 10 });
      setShowCreateTeam(false);
      loadTeams();
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: "Error",
        description: "Failed to create team.",
        variant: "destructive",
      });
    }
  };

  const inviteUser = async () => {
    if (!selectedTeam || !newInvitation.email.trim()) return;

    try {
      const token = crypto.randomUUID();
      
      const { error } = await supabase
        .from('team_invitations')
        .insert({
          team_id: selectedTeam.id,
          email: newInvitation.email,
          role: newInvitation.role,
          invited_by: user?.id,
          token
        });

      if (error) throw error;

      toast({
        title: "Invitation sent",
        description: `Invitation sent to ${newInvitation.email}.`,
      });

      setNewInvitation({ email: "", role: "member" });
      setShowInviteUser(false);
      loadTeamInvitations(selectedTeam.id);
    } catch (error) {
      console.error('Error inviting user:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation.",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'viewer': return <Eye className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      case 'viewer': return 'outline';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Team Management</h2>
          <p className="text-muted-foreground">Manage your teams and collaborate on GPTs.</p>
        </div>
        <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
          <DialogTrigger asChild>
            <Button>
              <Users className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>
                Create a team to collaborate on custom GPTs with your colleagues.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter team name"
                />
              </div>
              <div>
                <Label htmlFor="team-description">Description</Label>
                <Textarea
                  id="team-description"
                  value={newTeam.description}
                  onChange={(e) => setNewTeam(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your team's purpose"
                />
              </div>
              <div>
                <Label htmlFor="max-members">Maximum Members</Label>
                <Input
                  id="max-members"
                  type="number"
                  min="2"
                  max="100"
                  value={newTeam.max_members}
                  onChange={(e) => setNewTeam(prev => ({ ...prev, max_members: parseInt(e.target.value) }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateTeam(false)}>
                Cancel
              </Button>
              <Button onClick={createTeam} disabled={!newTeam.name.trim()}>
                Create Team
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your Teams</h3>
          <div className="space-y-2">
            {teams.map((team) => (
              <Card 
                key={team.id} 
                className={`cursor-pointer transition-colors ${
                  selectedTeam?.id === team.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedTeam(team)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{team.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {team.member_count} members
                      </p>
                    </div>
                    <Badge variant={getRoleBadgeVariant(team.user_role)}>
                      {getRoleIcon(team.user_role)}
                      <span className="ml-1 capitalize">{team.user_role}</span>
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedTeam ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {selectedTeam.name}
                      <Badge variant={getRoleBadgeVariant(selectedTeam.user_role)}>
                        {getRoleIcon(selectedTeam.user_role)}
                        <span className="ml-1 capitalize">{selectedTeam.user_role}</span>
                      </Badge>
                    </CardTitle>
                    <CardDescription>{selectedTeam.description}</CardDescription>
                  </div>
                  {['owner', 'admin'].includes(selectedTeam.user_role) && (
                    <Dialog open={showInviteUser} onOpenChange={setShowInviteUser}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Invite User
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Invite Team Member</DialogTitle>
                          <DialogDescription>
                            Send an invitation to join {selectedTeam.name}.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="invite-email">Email Address</Label>
                            <Input
                              id="invite-email"
                              type="email"
                              value={newInvitation.email}
                              onChange={(e) => setNewInvitation(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="user@example.com"
                            />
                          </div>
                          <div>
                            <Label htmlFor="invite-role">Role</Label>
                            <Select
                              value={newInvitation.role}
                              onValueChange={(value) => setNewInvitation(prev => ({ ...prev, role: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="viewer">Viewer</SelectItem>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowInviteUser(false)}>
                            Cancel
                          </Button>
                          <Button onClick={inviteUser} disabled={!newInvitation.email.trim()}>
                            Send Invitation
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="members" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
                    <TabsTrigger value="invitations">Pending ({invitations.length})</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="members" className="space-y-4">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{member.full_name}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        <Badge variant={getRoleBadgeVariant(member.role)}>
                          {getRoleIcon(member.role)}
                          <span className="ml-1 capitalize">{member.role}</span>
                        </Badge>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="invitations" className="space-y-4">
                    {invitations.map((invitation) => (
                      <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                            <Mail className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium">{invitation.email}</p>
                            <p className="text-sm text-muted-foreground">
                              Expires {new Date(invitation.expires_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">
                          Pending {invitation.role}
                        </Badge>
                      </div>
                    ))}
                    {invitations.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        No pending invitations
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center p-8">
                <div className="text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No team selected</h3>
                  <p className="text-muted-foreground">Select a team to view its details and manage members.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;