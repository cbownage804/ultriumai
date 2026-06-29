import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface VaultTeam {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  max_members: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  member_count?: number;
  user_role?: string;
}

export interface TeamMembership {
  id: string;
  team_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  invited_by?: string;
  invited_at?: string;
  joined_at?: string;
  is_active: boolean;
  permissions: {
    can_view: boolean;
    can_edit: boolean;
    can_share: boolean;
    can_admin: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface SharedVault {
  id: string;
  vault_id: string;
  team_id: string;
  shared_by: string;
  permissions: {
    can_view: boolean;
    can_edit: boolean;
    can_share: boolean;
  };
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  vault_name?: string;
  team_name?: string;
  shared_by_email?: string;
}

export const useVaultTeams = () => {
  const [teams, setTeams] = useState<VaultTeam[]>([]);
  const [memberships, setMemberships] = useState<TeamMembership[]>([]);
  const [sharedVaults, setSharedVaults] = useState<SharedVault[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Load teams
  const loadTeams = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('safepass_teams')
        .select(`
          *,
          safepass_team_memberships!inner(
            role,
            is_active
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const teamsWithRoles = data?.map(team => ({
        ...team,
        user_role: team.safepass_team_memberships?.[0]?.role || 'viewer',
        member_count: team.safepass_team_memberships?.filter((m: any) => m.is_active).length || 0
      })) || [];

      setTeams(teamsWithRoles);
    } catch (error) {
      console.error('Error loading teams:', error);
      toast({
        title: "Error",
        description: "Failed to load teams",
        variant: "destructive",
      });
    }
  };

  // Load team memberships
  const loadMemberships = async (teamId?: string) => {
    if (!user) return;

    try {
      let query = supabase
        .from('safepass_team_memberships')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (teamId) {
        query = query.eq('team_id', teamId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMemberships((data || []).map(m => ({
        ...m,
        role: m.role as any,
        permissions: m.permissions as any
      })) as TeamMembership[]);
    } catch (error) {
      console.error('Error loading memberships:', error);
      toast({
        title: "Error",
        description: "Failed to load team memberships",
        variant: "destructive",
      });
    }
  };

  // Load shared vaults
  const loadSharedVaults = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('safepass_shared_vaults')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const vaultsWithDetails = data?.map(vault => ({
        ...vault,
        vault_name: 'Vault Name',
        team_name: 'Team Name', 
        shared_by_email: 'user@example.com',
        permissions: vault.permissions as any
      })) || [];

      setSharedVaults(vaultsWithDetails as SharedVault[]);
    } catch (error) {
      console.error('Error loading shared vaults:', error);
      toast({
        title: "Error",
        description: "Failed to load shared vaults",
        variant: "destructive",
      });
    }
  };

  // Create team
  const createTeam = async (teamData: {
    name: string;
    description?: string;
    max_members?: number;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('safepass_teams')
        .insert({
          owner_id: user.id,
          name: teamData.name,
          description: teamData.description,
          max_members: teamData.max_members || 10,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      // Create owner membership
      await supabase
        .from('safepass_team_memberships')
        .insert({
          team_id: data.id,
          user_id: user.id,
          role: 'owner',
          invited_by: user.id,
          joined_at: new Date().toISOString(),
          is_active: true,
          permissions: {
            can_view: true,
            can_edit: true,
            can_share: true,
            can_admin: true
          }
        });

      await loadTeams();
      toast({
        title: "Success",
        description: "Team created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: "Error",
        description: "Failed to create team",
        variant: "destructive",
      });
      return null;
    }
  };

  // Invite member to team
  const inviteToTeam = async (teamId: string, email: string, role: 'admin' | 'editor' | 'viewer') => {
    if (!user) return false;

    try {
      // Check if user exists and get their ID
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        toast({
          title: "Error",
          description: "User not found. They need to create an account first.",
          variant: "destructive",
        });
        return false;
      }

      const permissions = {
        can_view: true,
        can_edit: role === 'admin' || role === 'editor',
        can_share: role === 'admin',
        can_admin: role === 'admin'
      };

      const { error } = await supabase
        .from('safepass_team_memberships')
        .insert({
          team_id: teamId,
          user_id: userData.id,
          role,
          invited_by: user.id,
          is_active: true,
          permissions
        });

      if (error) throw error;

      await loadMemberships(teamId);
      toast({
        title: "Success",
        description: `${email} has been invited to the team`,
      });

      return true;
    } catch (error) {
      console.error('Error inviting to team:', error);
      toast({
        title: "Error",
        description: "Failed to invite user to team",
        variant: "destructive",
      });
      return false;
    }
  };

  // Share vault with team
  const shareVaultWithTeam = async (vaultId: string, teamId: string, permissions: {
    can_view: boolean;
    can_edit: boolean;
    can_share: boolean;
  }) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('safepass_shared_vaults')
        .insert({
          vault_id: vaultId,
          team_id: teamId,
          shared_by: user.id,
          permissions,
          is_active: true
        });

      if (error) throw error;

      await loadSharedVaults();
      toast({
        title: "Success",
        description: "Vault shared with team successfully",
      });

      return true;
    } catch (error) {
      console.error('Error sharing vault:', error);
      toast({
        title: "Error",
        description: "Failed to share vault with team",
        variant: "destructive",
      });
      return false;
    }
  };

  // Remove team member
  const removeMember = async (membershipId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('safepass_team_memberships')
        .update({ is_active: false })
        .eq('id', membershipId);

      if (error) throw error;

      setMemberships(prev => prev.filter(m => m.id !== membershipId));
      toast({
        title: "Success",
        description: "Member removed from team",
      });

      return true;
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove team member",
        variant: "destructive",
      });
      return false;
    }
  };

  // Initialize
  useEffect(() => {
    if (user) {
      loadTeams();
      loadSharedVaults();
    }
    setIsLoading(false);
  }, [user]);

  return {
    teams,
    memberships,
    sharedVaults,
    isLoading,
    createTeam,
    inviteToTeam,
    shareVaultWithTeam,
    removeMember,
    loadTeams,
    loadMemberships,
    loadSharedVaults
  };
};