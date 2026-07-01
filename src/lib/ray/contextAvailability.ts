/**
 * Ray's context availability model.
 *
 * Every intelligent surface in Wrayth answers the same question:
 * "What context do I have access to right now?" — and reasons accordingly.
 *
 * The pattern:
 *   1. Ray detects something (a threat, a breach, a CVE).
 *   2. Ray asks: do I have the context I need to tell the user how it affects them?
 *   3. If not, Ray asks for exactly that context — with a concrete reason.
 *
 * This module is the single source of truth for what "context" Ray has.
 * Every surface should read from `useRayContextAvailability()` instead of
 * duplicating checks against `useMasterPassword`, integrations tables, etc.
 */
import { useEffect, useState } from 'react';
import { useMasterPassword } from '@/hooks/useMasterPassword';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export type RayContextKey =
  | 'vault'
  | 'identity'
  | 'microsoft365'
  | 'browser'
  | 'devices'
  | 'azure'
  | 'entra'
  | 'defender'
  | 'firewall'
  | 'agent';

export interface RayContextAvailability {
  vault: boolean;
  identity: boolean;
  microsoft365: boolean;
  browser: boolean;
  devices: boolean;
  azure: boolean;
  entra: boolean;
  defender: boolean;
  firewall: boolean;
  agent: boolean;
}

const empty: RayContextAvailability = {
  vault: false,
  identity: false,
  microsoft365: false,
  browser: false,
  devices: false,
  azure: false,
  entra: false,
  defender: false,
  firewall: false,
  agent: false,
};

export function useRayContextAvailability(): RayContextAvailability {
  const { isUnlocked } = useMasterPassword();
  const { user } = useAuth();
  const [state, setState] = useState<RayContextAvailability>(empty);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setState(empty);
      return;
    }
    (async () => {
      // Identity coverage = any monitored asset.
      const identityRes: any = await (supabase as any)
        .from('safeweb_assets')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      const identityCount: number = identityRes?.count ?? 0;

      // Integrations Ray knows about today.
      const integrationsRes: any = await (supabase as any)
        .from('ray_integrations')
        .select('provider, status')
        .eq('user_id', user.id);
      const integrations: Array<{ provider: string; status: string }> =
        integrationsRes?.data ?? [];

      const hasProvider = (name: string) =>
        integrations.some(
          (i) => i.provider === name && (i.status === 'connected' || i.status === 'active'),
        );

      if (cancelled) return;
      setState({
        vault: isUnlocked,
        identity: identityCount > 0,
        microsoft365: hasProvider('microsoft_365') || hasProvider('microsoft365'),
        browser: hasProvider('browser_extension'),
        devices: hasProvider('meshcentral') || hasProvider('agent'),
        azure: hasProvider('azure'),
        entra: hasProvider('entra'),
        defender: hasProvider('defender'),
        firewall: hasProvider('firewall'),
        agent: hasProvider('agent'),
      });
    })().catch(() => {
      if (!cancelled) setState((s) => ({ ...s, vault: isUnlocked }));
    });
    return () => {
      cancelled = true;
    };
  }, [user, isUnlocked]);

  // Vault should update instantly on unlock — don't wait for the effect.
  return { ...state, vault: isUnlocked };
}

/**
 * Ray's confidence in a verdict, given available context.
 * Returns 0-100. Missing critical context caps confidence.
 */
export function confidenceWithContext(
  baseConfidence: number,
  needed: RayContextKey[],
  available: RayContextAvailability,
): number {
  const missing = needed.filter((k) => !available[k]).length;
  if (missing === 0) return Math.round(baseConfidence);
  // Each missing context knocks 20 points off, floored at 30.
  return Math.max(30, Math.round(baseConfidence - missing * 20));
}
