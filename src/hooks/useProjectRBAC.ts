/**
 * Phase 115: Role-Based Project Access Control
 * Owner, Editor, Viewer roles with granular permissions.
 */
import { useCallback, useState } from 'react';

export type ProjectRole = 'owner' | 'editor' | 'viewer';

export interface ProjectMember {
  id: string;
  email: string;
  displayName: string;
  role: ProjectRole;
  avatarColor: string;
  joinedAt: Date;
  lastActiveAt: Date;
  invitedBy: string;
}

export interface RolePermissions {
  canEditCode: boolean;
  canPrompt: boolean;
  canViewPreview: boolean;
  canDeploy: boolean;
  canManageMembers: boolean;
  canDeleteProject: boolean;
  canEditSettings: boolean;
  canManageBranches: boolean;
  canResolveComments: boolean;
  canExport: boolean;
}

const ROLE_PERMISSIONS: Record<ProjectRole, RolePermissions> = {
  owner: {
    canEditCode: true, canPrompt: true, canViewPreview: true,
    canDeploy: true, canManageMembers: true, canDeleteProject: true,
    canEditSettings: true, canManageBranches: true, canResolveComments: true, canExport: true,
  },
  editor: {
    canEditCode: true, canPrompt: true, canViewPreview: true,
    canDeploy: false, canManageMembers: false, canDeleteProject: false,
    canEditSettings: false, canManageBranches: true, canResolveComments: true, canExport: true,
  },
  viewer: {
    canEditCode: false, canPrompt: false, canViewPreview: true,
    canDeploy: false, canManageMembers: false, canDeleteProject: false,
    canEditSettings: false, canManageBranches: false, canResolveComments: false, canExport: false,
  },
};

export function useProjectRBAC() {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<ProjectRole>('owner');
  const [pendingInvites, setPendingInvites] = useState<{ email: string; role: ProjectRole; sentAt: Date }[]>([]);

  const getPermissions = useCallback((role?: ProjectRole): RolePermissions => {
    return ROLE_PERMISSIONS[role || currentUserRole];
  }, [currentUserRole]);

  const can = useCallback((permission: keyof RolePermissions): boolean => {
    return ROLE_PERMISSIONS[currentUserRole][permission];
  }, [currentUserRole]);

  const inviteMember = useCallback((email: string, role: ProjectRole) => {
    if (!ROLE_PERMISSIONS[currentUserRole].canManageMembers) return false;
    setPendingInvites(prev => [...prev, { email, role, sentAt: new Date() }]);
    return true;
  }, [currentUserRole]);

  const acceptInvite = useCallback((email: string, displayName: string) => {
    const invite = pendingInvites.find(i => i.email === email);
    if (!invite) return;

    const member: ProjectMember = {
      id: crypto.randomUUID(),
      email,
      displayName,
      role: invite.role,
      avatarColor: ['#06b6d4', '#8b5cf6', '#f43f5e', '#22c55e', '#f59e0b'][members.length % 5],
      joinedAt: new Date(),
      lastActiveAt: new Date(),
      invitedBy: 'owner',
    };
    setMembers(prev => [...prev, member]);
    setPendingInvites(prev => prev.filter(i => i.email !== email));
  }, [pendingInvites, members.length]);

  const changeRole = useCallback((memberId: string, newRole: ProjectRole) => {
    if (!ROLE_PERMISSIONS[currentUserRole].canManageMembers) return false;
    setMembers(prev => prev.map(m =>
      m.id === memberId ? { ...m, role: newRole } : m
    ));
    return true;
  }, [currentUserRole]);

  const removeMember = useCallback((memberId: string) => {
    if (!ROLE_PERMISSIONS[currentUserRole].canManageMembers) return false;
    setMembers(prev => prev.filter(m => m.id !== memberId));
    return true;
  }, [currentUserRole]);

  const transferOwnership = useCallback((memberId: string) => {
    if (currentUserRole !== 'owner') return false;
    setMembers(prev => prev.map(m => ({
      ...m,
      role: m.id === memberId ? 'owner' as const : m.role === 'owner' ? 'editor' as const : m.role,
    })));
    setCurrentUserRole('editor');
    return true;
  }, [currentUserRole]);

  return {
    members,
    currentUserRole,
    pendingInvites,
    getPermissions,
    can,
    inviteMember,
    acceptInvite,
    changeRole,
    removeMember,
    transferOwnership,
    setCurrentUserRole,
    roleLabels: { owner: 'Owner', editor: 'Editor', viewer: 'Viewer' } as Record<ProjectRole, string>,
  };
}
