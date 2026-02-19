import { useState, useCallback } from 'react';

export interface Role {
  id: string;
  name: string;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
}

export interface RolePermission {
  roleId: string;
  permissionId: string;
  granted: boolean;
}

export function usePermissionMatrixBuilder() {
  const [roles, setRoles] = useState<Role[]>([
    { id: '1', name: 'admin' },
    { id: '2', name: 'editor' },
    { id: '3', name: 'viewer' },
  ]);
  const [permissions, setPermissions] = useState<Permission[]>([
    { id: '1', resource: 'posts', action: 'read' },
    { id: '2', resource: 'posts', action: 'write' },
    { id: '3', resource: 'posts', action: 'delete' },
    { id: '4', resource: 'users', action: 'read' },
    { id: '5', resource: 'users', action: 'manage' },
  ]);
  const [matrix, setMatrix] = useState<RolePermission[]>([
    { roleId: '1', permissionId: '1', granted: true },
    { roleId: '1', permissionId: '2', granted: true },
    { roleId: '1', permissionId: '3', granted: true },
    { roleId: '1', permissionId: '4', granted: true },
    { roleId: '1', permissionId: '5', granted: true },
    { roleId: '2', permissionId: '1', granted: true },
    { roleId: '2', permissionId: '2', granted: true },
    { roleId: '3', permissionId: '1', granted: true },
    { roleId: '3', permissionId: '4', granted: true },
  ]);

  const addRole = useCallback((name: string) => {
    setRoles(prev => [...prev, { id: crypto.randomUUID(), name }]);
  }, []);

  const removeRole = useCallback((id: string) => {
    setRoles(prev => prev.filter(r => r.id !== id));
    setMatrix(prev => prev.filter(m => m.roleId !== id));
  }, []);

  const addPermission = useCallback((resource: string, action: string) => {
    setPermissions(prev => [...prev, { id: crypto.randomUUID(), resource, action }]);
  }, []);

  const removePermission = useCallback((id: string) => {
    setPermissions(prev => prev.filter(p => p.id !== id));
    setMatrix(prev => prev.filter(m => m.permissionId !== id));
  }, []);

  const togglePermission = useCallback((roleId: string, permissionId: string) => {
    setMatrix(prev => {
      const existing = prev.find(m => m.roleId === roleId && m.permissionId === permissionId);
      if (existing) {
        return existing.granted
          ? prev.filter(m => !(m.roleId === roleId && m.permissionId === permissionId))
          : prev.map(m => m.roleId === roleId && m.permissionId === permissionId ? { ...m, granted: true } : m);
      }
      return [...prev, { roleId, permissionId, granted: true }];
    });
  }, []);

  const isGranted = useCallback((roleId: string, permissionId: string): boolean => {
    return matrix.some(m => m.roleId === roleId && m.permissionId === permissionId && m.granted);
  }, [matrix]);

  const generateRLSPolicies = useCallback((): string => {
    const policies: string[] = [];
    const resources = [...new Set(permissions.map(p => p.resource))];

    resources.forEach(resource => {
      const resourcePerms = permissions.filter(p => p.resource === resource);
      resourcePerms.forEach(perm => {
        const allowedRoles = roles.filter(r => isGranted(r.id, perm.id)).map(r => `'${r.name}'`);
        if (allowedRoles.length === 0) return;
        const policyAction = perm.action === 'read' ? 'SELECT' : perm.action === 'write' ? 'INSERT' : perm.action === 'delete' ? 'DELETE' : 'ALL';
        policies.push(`CREATE POLICY "${resource}_${perm.action}_policy" ON public.${resource}
  FOR ${policyAction}
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN (${allowedRoles.join(', ')})
    )
  );`);
      });
    });

    return `-- Permission Matrix RLS Policies\n${policies.join('\n\n')}`;
  }, [roles, permissions, isGranted]);

  const generateHookCode = useCallback((): string => {
    const permMap: Record<string, Record<string, string[]>> = {};
    roles.forEach(role => {
      permMap[role.name] = {};
      permissions.forEach(perm => {
        if (isGranted(role.id, perm.id)) {
          if (!permMap[role.name][perm.resource]) permMap[role.name][perm.resource] = [];
          permMap[role.name][perm.resource].push(perm.action);
        }
      });
    });

    return `import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';

const PERMISSION_MAP: Record<string, Record<string, string[]>> = ${JSON.stringify(permMap, null, 2)};

export function usePermission() {
  const { user } = useAuth();
  // Assumes user role is stored in user metadata or fetched from user_roles
  const role = (user as any)?.role || 'viewer';

  const can = useMemo(() => (resource: string, action: string): boolean => {
    return PERMISSION_MAP[role]?.[resource]?.includes(action) ?? false;
  }, [role]);

  return { can, role };
}`;
  }, [roles, permissions, isGranted]);

  return {
    roles, permissions, matrix,
    addRole, removeRole, addPermission, removePermission,
    togglePermission, isGranted,
    generateRLSPolicies, generateHookCode,
  };
}
