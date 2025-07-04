import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Users, Plus, Mail, Trash2, Crown, Shield, UserCheck, Copy, Settings } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Team {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  max_members: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  role: string;
  is_active: boolean;
  joined_at: string;
  profiles?: {
    full_name?: string;
    email: string;
  };
}

interface TeamInvitation {
  id: string;
  email: string;
  role: string;
  token: string;
  expires_at: string;
  accepted_at?: string;
  is_active: boolean;
  created_at: string;
}

export const TeamCollaboration = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [showCreateTeamDialog, setShowCreateTeamDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  
  // Form state
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [maxMembers, setMaxMembers] = useState(10);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadTeams();
    }
  }, [user]);

  useEffect(() => {
    if (selectedTeam) {
      loadTeamMembers();
      loadTeamInvitations();
    }
  }, [selectedTeam]);

  const loadTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeams(data || []);
      
      if (data && data.length > 0 && !selectedTeam) {
        setSelectedTeam(data[0].id);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
      toast({
        title: "Error",
        description: "Failed to load teams",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    if (!selectedTeam) return;
    
    try {
      const { data, error } = await supabase
        .from('team_memberships')
        .select('*')
        .eq('team_id', selectedTeam)
        .eq('is_active', true)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const loadTeamInvitations = async () => {
    if (!selectedTeam) return;
    
    try {
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('team_id', selectedTeam)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error loading team invitations:', error);
    }
  };

  const createTeam = async () => {
    if (!teamName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a team name",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingTeam(true);
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: teamName,
          description: teamDescription,
          owner_id: user?.id,
          max_members: maxMembers
        })
        .select()
        .single();

      if (error) throw error;

      setShowCreateTeamDialog(false);
      resetTeamForm();
      await loadTeams();
      setSelectedTeam(data.id);
      
      toast({
        title: "Success",
        description: "Team created successfully",
      });
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: "Error",
        description: "Failed to create team",
        variant: "destructive",
      });
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const inviteMember = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTeam) return;

    setIsInviting(true);
    try {
      // Generate invitation token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      const { error } = await supabase
        .from('team_invitations')
        .insert({
          team_id: selectedTeam,
          email: inviteEmail,
          role: inviteRole,
          token: token,
          expires_at: expiresAt.toISOString(),
          invited_by: user?.id
        });

      if (error) throw error;

      setShowInviteDialog(false);
      resetInviteForm();
      await loadTeamInvitations();
      
      toast({
        title: "Success",
        description: "Invitation sent successfully",
      });
    } catch (error) {
      console.error('Error inviting member:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('team_memberships')
        .update({ is_active: false })
        .eq('id', memberId);

      if (error) throw error;

      await loadTeamMembers();
      toast({
        title: "Success",
        description: "Member removed successfully",
      });
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive",
      });
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('team_invitations')
        .update({ is_active: false })
        .eq('id', invitationId);

      if (error) throw error;

      await loadTeamInvitations();
      toast({
        title: "Success",
        description: "Invitation cancelled",
      });
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast({
        title: "Error",
        description: "Failed to cancel invitation",
        variant: "destructive",
      });
    }
  };

  const updateMemberRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('team_memberships')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      await loadTeamMembers();
      toast({
        title: "Success",
        description: "Member role updated",
      });
    } catch (error) {
      console.error('Error updating member role:', error);
      toast({
        title: "Error",
        description: "Failed to update member role",
        variant: "destructive",
      });
    }
  };

  const copyInviteLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: "Copied",
      description: "Invitation link copied to clipboard",
    });
  };

  const resetTeamForm = () => {
    setTeamName("");
    setTeamDescription("");
    setMaxMembers(10);
  };

  const resetInviteForm = () => {
    setInviteEmail("");
    setInviteRole("member");
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-amber-500" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <UserCheck className="w-4 h-4 text-green-500" />;
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const selectedTeamData = teams.find(t => t.id === selectedTeam);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Team Collaboration</h2>
          <p className="text-muted-foreground">
            Manage your teams and collaborate on GPT development.
          </p>
        </div>
        
        <Dialog open={showCreateTeamDialog} onOpenChange={setShowCreateTeamDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>
                Create a team to collaborate on GPT development.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  placeholder="Engineering Team"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="teamDescription">Description (Optional)</Label>
                <Textarea
                  id="teamDescription"
                  placeholder="Team description..."
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="maxMembers">Maximum Members</Label>
                <Input
                  id="maxMembers"
                  type="number"
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(parseInt(e.target.value))}
                  min="2"
                  max="100"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateTeamDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createTeam} disabled={isCreatingTeam}>
                {isCreatingTeam ? "Creating..." : "Create Team"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Teams Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first team to start collaborating on GPT development.
            </p>
            <Button onClick={() => setShowCreateTeamDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team Selection */}
          <div className="space-y-4">
            <h3 className="font-semibold">Your Teams</h3>
            {teams.map((team) => (
              <Card 
                key={team.id} 
                className={`cursor-pointer transition-colors ${
                  selectedTeam === team.id ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => setSelectedTeam(team.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <h4 className="font-medium">{team.name}</h4>
                  </div>
                  {team.description && (
                    <p className="text-sm text-muted-foreground mt-1">{team.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="outline">{members.length}/{team.max_members} members</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(team.created_at))} ago
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Team Details */}
          {selectedTeamData && (
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="w-5 h-5" />
                        <span>{selectedTeamData.name}</span>
                      </CardTitle>
                      {selectedTeamData.description && (
                        <CardDescription>{selectedTeamData.description}</CardDescription>
                      )}
                    </div>
                    
                    <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Mail className="w-4 h-4 mr-2" />
                          Invite Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Invite Team Member</DialogTitle>
                          <DialogDescription>
                            Send an invitation to join your team.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="inviteEmail">Email Address</Label>
                            <Input
                              id="inviteEmail"
                              type="email"
                              placeholder="colleague@company.com"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="inviteRole">Role</Label>
                            <Select value={inviteRole} onValueChange={setInviteRole}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={inviteMember} disabled={isInviting}>
                            {isInviting ? "Sending..." : "Send Invitation"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Team Members */}
                  <div>
                    <h4 className="font-medium mb-3">Team Members ({members.length})</h4>
                    <div className="space-y-2">
                      {members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            {getRoleIcon(member.role)}
                            <div>
                              <p className="font-medium">
                                Member ID: {member.user_id}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Joined {formatDistanceToNow(new Date(member.joined_at))} ago
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="capitalize">
                              {member.role}
                            </Badge>
                            
                            {member.user_id !== user?.id && (
                              <div className="flex space-x-1">
                                <Select
                                  value={member.role}
                                  onValueChange={(role) => updateMemberRole(member.id, role)}
                                >
                                  <SelectTrigger className="w-20 h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="member">Member</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Remove Member</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to remove this member from the team?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => removeMember(member.id)}>
                                        Remove
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pending Invitations */}
                  {invitations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Pending Invitations ({invitations.length})</h4>
                      <div className="space-y-2">
                        {invitations.map((invitation) => (
                          <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{invitation.email}</p>
                              <p className="text-sm text-muted-foreground capitalize">
                                {invitation.role} • Expires {formatDistanceToNow(new Date(invitation.expires_at))} from now
                              </p>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {isExpired(invitation.expires_at) ? (
                                <Badge variant="destructive">Expired</Badge>
                              ) : (
                                <Badge variant="secondary">Pending</Badge>
                              )}
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyInviteLink(invitation.token)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to cancel this invitation?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => cancelInvitation(invitation.id)}>
                                      Cancel Invitation
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};