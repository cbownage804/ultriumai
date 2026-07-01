/**
 * Wrayth Team Management Hook
 * Manages team operations for Business tier subscribers
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface WraythTeam {
  id: string;
  name: string;
  owner_id: string;
  subscription_id: string | null;
  seat_count: number;
  max_seats: number;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string | null;
  email: string;
  role: 'owner' | 'admin' | 'member';
  status: 'pending' | 'active' | 'suspended';
  invited_by: string | null;
  invited_at: string;
  joined_at: string | null;
  created_at: string;
}

export interface SharedVault {
  id: string;
  team_id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

export interface SharedEntry {
  id: string;
  vault_id: string;
  team_id: string;
  entry_type: 'password' | 'note' | 'card' | 'identity';
  title: string;
  encrypted_data: string;
  website_url: string | null;
  folder: string | null;
  tags: string[] | null;
  is_favorite: boolean;
  password_strength_score: number | null;
  created_by: string;
  last_modified_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useWraythTeam() {
  const { user } = useAuth();
  const [team, setTeam] = useState<WraythTeam | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [vaults, setVaults] = useState<SharedVault[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'member' | null>(null);

  // Load team data
  const loadTeam = useCallback(async () => {
    if (!user) {
      setTeam(null);
      setMembers([]);
      setVaults([]);
      setUserRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Check if user is a team member
      const { data: membership } = await supabase
        .from('safesuite_team_members')
        .select('team_id, role, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (!membership) {
        // Check for pending invites by email
        const { data: pendingInvite } = await supabase
          .from('safesuite_team_members')
          .select('*')
          .eq('email', user.email)
          .eq('status', 'pending')
          .single();

        if (pendingInvite) {
          // Auto-accept invite
          await acceptInvite(pendingInvite.id);
          return;
        }

        setTeam(null);
        setMembers([]);
        setVaults([]);
        setUserRole(null);
        setLoading(false);
        return;
      }

      setUserRole(membership.role as 'owner' | 'admin' | 'member');

      // Load team details
      const { data: teamData } = await supabase
        .from('safesuite_teams')
        .select('*')
        .eq('id', membership.team_id)
        .single();

      if (teamData) {
        setTeam(teamData as WraythTeam);

        // Load team members
        const { data: membersData } = await supabase
          .from('safesuite_team_members')
          .select('*')
          .eq('team_id', teamData.id)
          .order('role', { ascending: true });

        setMembers((membersData || []) as TeamMember[]);

        // Load shared vaults
        const { data: vaultsData } = await supabase
          .from('safesuite_shared_vaults')
          .select('*')
          .eq('team_id', teamData.id);

        setVaults((vaultsData || []) as SharedVault[]);
      }
    } catch (error) {
      console.error('Error loading team:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  // Create a new team
  const createTeam = async (name: string): Promise<WraythTeam | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('safesuite_teams')
        .insert({
          name,
          owner_id: user.id,
          seat_count: 1,
          max_seats: 5
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Team created successfully!');
      await loadTeam();
      return data as WraythTeam;
    } catch (error: unknown) {
      console.error('Error creating team:', error);
      toast.error((error instanceof Error ? error.message : null) || 'Failed to create team');
      return null;
    }
  };

  // Invite a member to the team
  const inviteMember = async (email: string, role: 'admin' | 'member' = 'member'): Promise<boolean> => {
    if (!user || !team) return false;

    // Check seat limit
    const activeMembers = members.filter(m => m.status === 'active').length;
    if (activeMembers >= team.max_seats) {
      toast.error(`Seat limit reached (${team.max_seats}). Upgrade to add more members.`);
      return false;
    }

    try {
      const { error } = await supabase
        .from('safesuite_team_members')
        .insert({
          team_id: team.id,
          email: email.toLowerCase(),
          role,
          status: 'pending',
          invited_by: user.id
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('This email has already been invited');
          return false;
        }
        throw error;
      }

      // Note: Email invitations will be sent when safesuite-invite edge function is implemented
      // For now, users can accept invites when they log in with matching email
      toast.success(`Invitation sent to ${email}`);
      await loadTeam();
      return true;
    } catch (error: unknown) {
      console.error('Error inviting member:', error);
      toast.error((error instanceof Error ? error.message : null) || 'Failed to send invitation');
      return false;
    }
  };

  // Accept an invitation
  const acceptInvite = async (membershipId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('safesuite_team_members')
        .update({
          user_id: user.id,
          status: 'active',
          joined_at: new Date().toISOString()
        })
        .eq('id', membershipId)
        .eq('email', user.email);

      if (error) throw error;

      toast.success('You have joined the team!');
      await loadTeam();
      return true;
    } catch (error: unknown) {
      console.error('Error accepting invite:', error);
      toast.error((error instanceof Error ? error.message : null) || 'Failed to accept invitation');
      return false;
    }
  };

  // Remove a member from the team
  const removeMember = async (memberId: string): Promise<boolean> => {
    if (!user || !team) return false;

    try {
      const { error } = await supabase
        .from('safesuite_team_members')
        .delete()
        .eq('id', memberId)
        .eq('team_id', team.id);

      if (error) throw error;

      toast.success('Member removed from team');
      await loadTeam();
      return true;
    } catch (error: unknown) {
      console.error('Error removing member:', error);
      toast.error((error instanceof Error ? error.message : null) || 'Failed to remove member');
      return false;
    }
  };

  // Update member role
  const updateMemberRole = async (memberId: string, role: 'admin' | 'member'): Promise<boolean> => {
    if (!user || !team) return false;

    try {
      const { error } = await supabase
        .from('safesuite_team_members')
        .update({ role })
        .eq('id', memberId)
        .eq('team_id', team.id);

      if (error) throw error;

      toast.success('Member role updated');
      await loadTeam();
      return true;
    } catch (error: unknown) {
      console.error('Error updating role:', error);
      toast.error((error instanceof Error ? error.message : null) || 'Failed to update role');
      return false;
    }
  };

  // Create a shared vault
  const createVault = async (name: string, description?: string): Promise<SharedVault | null> => {
    if (!user || !team) return null;

    try {
      const { data, error } = await supabase
        .from('safesuite_shared_vaults')
        .insert({
          team_id: team.id,
          name,
          description,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Vault created');
      await loadTeam();
      return data as SharedVault;
    } catch (error: unknown) {
      console.error('Error creating vault:', error);
      toast.error((error instanceof Error ? error.message : null) || 'Failed to create vault');
      return null;
    }
  };

  // Check permissions
  const isOwner = userRole === 'owner';
  const isAdmin = userRole === 'owner' || userRole === 'admin';
  const isMember = userRole !== null;
  const hasTeam = team !== null;

  return {
    team,
    members,
    vaults,
    loading,
    userRole,
    isOwner,
    isAdmin,
    isMember,
    hasTeam,
    createTeam,
    inviteMember,
    acceptInvite,
    removeMember,
    updateMemberRole,
    createVault,
    refresh: loadTeam
  };
}

// Hook for managing shared vault entries
export function useSharedVault(vaultId: string | null) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<SharedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    if (!vaultId || !user) {
      setEntries([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('safesuite_shared_entries')
        .select('*')
        .eq('vault_id', vaultId)
        .order('title', { ascending: true });

      if (error) throw error;
      setEntries((data || []) as SharedEntry[]);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  }, [vaultId, user]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const addEntry = async (entry: Omit<SharedEntry, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'last_modified_by'>): Promise<SharedEntry | null> => {
    if (!user || !vaultId) return null;

    try {
      const { data, error } = await supabase
        .from('safesuite_shared_entries')
        .insert({
          ...entry,
          vault_id: vaultId,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Entry added to shared vault');
      await loadEntries();
      return data as SharedEntry;
    } catch (error: unknown) {
      console.error('Error adding entry:', error);
      toast.error((error instanceof Error ? error.message : null) || 'Failed to add entry');
      return null;
    }
  };

  const updateEntry = async (entryId: string, updates: Partial<SharedEntry>): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('safesuite_shared_entries')
        .update({
          ...updates,
          last_modified_by: user.id
        })
        .eq('id', entryId);

      if (error) throw error;

      toast.success('Entry updated');
      await loadEntries();
      return true;
    } catch (error: unknown) {
      console.error('Error updating entry:', error);
      toast.error((error instanceof Error ? error.message : null) || 'Failed to update entry');
      return false;
    }
  };

  const deleteEntry = async (entryId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('safesuite_shared_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      toast.success('Entry deleted');
      await loadEntries();
      return true;
    } catch (error: unknown) {
      console.error('Error deleting entry:', error);
      toast.error((error instanceof Error ? error.message : null) || 'Failed to delete entry');
      return false;
    }
  };

  return {
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    refresh: loadEntries
  };
}
