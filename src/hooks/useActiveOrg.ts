/**
 * useActiveOrg — picks the organization Ray's org views should display.
 *
 * Resolution order:
 *   1. localStorage('ray.activeOrgId') if the user still has access.
 *   2. The first organization the user owns.
 *   3. The first organization the user is an active member of.
 *
 * Returns `null` when the user is solo (no org membership) — callers should
 * then render personal Ray surfaces instead.
 */
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const STORAGE_KEY = 'ray.activeOrgId';

export interface ActiveOrgSummary {
  id: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
}

export function useActiveOrg() {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<ActiveOrgSummary[]>([]);
  const [activeOrg, setActiveOrg] = useState<ActiveOrgSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setOrgs([]);
      setActiveOrg(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    // Owned orgs
    const owned = await supabase
      .from('org_teams')
      .select('id, name')
      .eq('owner_id', user.id);

    // Member orgs
    const membered = await supabase
      .from('org_team_members')
      .select('organization_id, role, org_teams!inner(id, name)')
      .eq('user_id', user.id)
      .eq('status', 'active');

    const all: ActiveOrgSummary[] = [];
    const seen = new Set<string>();

    for (const row of owned.data ?? []) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      all.push({ id: row.id, name: row.name, role: 'owner' });
    }
    for (const row of (membered.data ?? []) as any[]) {
      const id = row.organization_id;
      if (seen.has(id)) continue;
      seen.add(id);
      all.push({
        id,
        name: row.org_teams?.name ?? 'Organization',
        role: (row.role as ActiveOrgSummary['role']) ?? 'member',
      });
    }

    setOrgs(all);

    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    const chosen =
      (stored && all.find((o) => o.id === stored)) ||
      all[0] ||
      null;
    setActiveOrg(chosen);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const switchOrg = useCallback((id: string) => {
    const next = orgs.find((o) => o.id === id);
    if (!next) return;
    setActiveOrg(next);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* noop */
    }
  }, [orgs]);

  return {
    activeOrg,
    orgs,
    loading,
    switchOrg,
    refresh: load,
    hasOrg: !!activeOrg,
  };
}
