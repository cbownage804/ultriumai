import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  status: 'active' | 'pending' | 'inactive';
  lastLogin: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  memberCount: number;
}

export const AVAILABLE_PERMISSIONS = [
  'view_dashboard',
  'manage_clients',
  'manage_tickets',
  'manage_billing',
  'manage_security',
  'manage_team',
  'view_reports',
  'manage_settings',
  'admin_access'
];

export const useMSPRoleManagement = () => {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Get MSP ID
      const { data: msps } = await supabase
        .from('msps')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (!msps || msps.length === 0) {
        // No MSP found - set defaults
        setTeamMembers([]);
        setRoles(getDefaultRoles());
        setLoading(false);
        return;
      }

      // Fetch team members from profiles
      const { data: members, error: membersError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at, updated_at, user_id')
        .limit(10);

      if (!membersError && members && members.length > 0) {
        const mappedMembers: TeamMember[] = members.map((m, index) => ({
          id: m.id,
          name: m.full_name || m.email?.split('@')[0] || 'Unknown',
          email: m.email || '',
          role: m.user_id === user.id ? 'Admin' : 'Technician',
          permissions: m.user_id === user.id ? AVAILABLE_PERMISSIONS : ['view_dashboard', 'manage_tickets', 'view_reports'],
          status: 'active' as const,
          lastLogin: m.updated_at || m.created_at
        }));
        setTeamMembers(mappedMembers);
      } else {
        // Create a default member based on current user
        setTeamMembers([{
          id: user.id,
          name: user.email?.split('@')[0] || 'Owner',
          email: user.email || '',
          role: 'Admin',
          permissions: AVAILABLE_PERMISSIONS,
          status: 'active',
          lastLogin: new Date().toISOString()
        }]);
      }

      // Set default roles
      setRoles(getDefaultRoles());

    } catch (error) {
      console.error('Error loading role management data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.email]);

  const getDefaultRoles = (): Role[] => [
    {
      id: 'admin',
      name: 'Admin',
      description: 'Full access to all features and settings',
      permissions: AVAILABLE_PERMISSIONS,
      memberCount: 1
    },
    {
      id: 'manager',
      name: 'Manager',
      description: 'Manage clients, tickets, and view reports',
      permissions: ['view_dashboard', 'manage_clients', 'manage_tickets', 'view_reports', 'manage_settings'],
      memberCount: 0
    },
    {
      id: 'technician',
      name: 'Technician',
      description: 'Handle tickets and security tasks',
      permissions: ['view_dashboard', 'manage_tickets', 'manage_security', 'view_reports'],
      memberCount: 0
    },
    {
      id: 'viewer',
      name: 'Viewer',
      description: 'Read-only access to dashboard and reports',
      permissions: ['view_dashboard', 'view_reports'],
      memberCount: 0
    }
  ];

  const addMember = async (email: string, roleName: string) => {
    // In a full implementation, this would send an invite email
    // For now, we'll create a pending member
    const newMember: TeamMember = {
      id: crypto.randomUUID(),
      name: email.split('@')[0],
      email,
      role: roleName,
      permissions: roles.find(r => r.name === roleName)?.permissions || ['view_dashboard'],
      status: 'pending',
      lastLogin: new Date().toISOString()
    };

    setTeamMembers(prev => [...prev, newMember]);
    return newMember;
  };

  const updateMemberRole = (memberId: string, newRole: string) => {
    setTeamMembers(prev => prev.map(m => 
      m.id === memberId 
        ? { ...m, role: newRole, permissions: roles.find(r => r.name === newRole)?.permissions || m.permissions }
        : m
    ));
  };

  const removeMember = (memberId: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== memberId));
  };

  const addRole = (role: Omit<Role, 'id' | 'memberCount'>) => {
    const newRole: Role = {
      ...role,
      id: crypto.randomUUID(),
      memberCount: 0
    };
    setRoles(prev => [...prev, newRole]);
    return newRole;
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    teamMembers,
    roles,
    loading,
    refresh: loadData,
    addMember,
    updateMemberRole,
    removeMember,
    addRole,
    availablePermissions: AVAILABLE_PERMISSIONS
  };
};
