import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type PlatformRole = 'super_admin' | 'support' | 'billing_ops' | 'platform_ops' | 'read_only';

export function usePlatformRole() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<PlatformRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!user) { setRoles([]); setLoading(false); return; }
      const { data } = await supabase.from('platform_admins').select('role').eq('user_id', user.id);
      if (!cancel) {
        setRoles(((data ?? []).map((r: any) => r.role)) as PlatformRole[]);
        setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [user]);

  return {
    roles,
    loading,
    isAdmin: roles.length > 0,
    isSuperAdmin: roles.includes('super_admin'),
    has: (r: PlatformRole) => roles.includes('super_admin') || roles.includes(r),
  };
}

export async function callAdmin<T = any>(action: string, body: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke('admin-api', {
    body: { action, ...body },
  });
  if (error) {
    // Log the raw infra error for telemetry; surface a customer-safe message.
    console.error(`[admin-api:${action}] transport error`, error);
    throw new Error("Ray couldn't reach the platform telemetry service. Try again in a moment.");
  }
  if ((data as any)?.error) {
    const raw = String((data as any).error);
    console.error(`[admin-api:${action}] server error`, raw);
    // Pass through domain errors (permissions, validation) but scrub infra jargon.
    const scrubbed = /edge function|fetch failed|network|timeout/i.test(raw)
      ? "Ray couldn't reach the platform telemetry service. Try again in a moment."
      : raw;
    throw new Error(scrubbed);
  }
  return data as T;
}
