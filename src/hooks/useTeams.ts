import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Team {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  max_members: number;
  is_active: boolean;
  user_role?: string;
  member_count?: number;
}

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  is_active: boolean;
}

export const useTeams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadTeams = async () => {
    if (!user) return;

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

      const teamsWithRole = data.map(team => ({
        ...team,
        user_role: team.team_memberships[0]?.role || 'member',
        member_count: team.team_memberships.length
      }));

      setTeams(teamsWithRole);
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

  const createTeam = async (teamData: {
    name: string;
    description?: string;
    max_members?: number;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: teamData.name,
          description: teamData.description,
          owner_id: user.id,
          max_members: teamData.max_members || 10
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Team created",
        description: `${teamData.name} has been created successfully.`,
      });

      loadTeams();
      return data;
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: "Error",
        description: "Failed to create team.",
        variant: "destructive",
      });
      return null;
    }
  };

  const inviteToTeam = async (teamId: string, email: string, role: string = 'member') => {
    if (!user) return null;

    try {
      const token = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from('team_invitations')
        .insert({
          team_id: teamId,
          email,
          role,
          invited_by: user.id,
          token
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Invitation sent",
        description: `Invitation sent to ${email}.`,
      });

      return data;
    } catch (error) {
      console.error('Error inviting user:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation.",
        variant: "destructive",
      });
      return null;
    }
  };

  const getUserRole = (teamId: string): string | null => {
    const team = teams.find(t => t.id === teamId);
    return team?.user_role || null;
  };

  const canManageTeam = (teamId: string): boolean => {
    const role = getUserRole(teamId);
    return role === 'owner' || role === 'admin';
  };

  useEffect(() => {
    if (user) {
      loadTeams();
    }
  }, [user]);

  return {
    teams,
    currentTeam,
    teamMembers,
    loading,
    setCurrentTeam,
    loadTeams,
    createTeam,
    inviteToTeam,
    getUserRole,
    canManageTeam
  };
};