/**
 * TierGate — route-level gate that redirects users below the required
 * subscription tier to the /app/upgrade page with contextual info about
 * why the destination is locked.
 */

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useWraythSubscription } from '@/hooks/useSafeSuite';
import type { WraythTier } from '@/config/safeSuiteTiers';

const TIER_RANK: Record<WraythTier, number> = {
  free: 0,
  pro: 1,
  business: 2,
  enterprise: 3,
};

interface TierGateProps {
  /** Minimum tier required to access this route. */
  requiredTier: WraythTier;
  /** Optional area slug for the upgrade page (e.g. "intelligence", "devices"). */
  area?: string;
  children: ReactNode;
}

export function TierGate({ requiredTier, area, children }: TierGateProps) {
  const { tier, loading, isAdmin } = useWraythSubscription();
  const location = useLocation();

  // While loading the subscription, don't flash the paywall.
  if (loading) return null;

  // Admins always pass.
  if (isAdmin) return <>{children}</>;

  if (TIER_RANK[tier] >= TIER_RANK[requiredTier]) {
    return <>{children}</>;
  }

  const params = new URLSearchParams();
  params.set('tier', requiredTier);
  if (area) params.set('area', area);
  params.set('from', location.pathname + location.search);

  return <Navigate to={`/app/upgrade?${params.toString()}`} replace />;
}
