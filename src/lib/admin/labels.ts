/**
 * Admin display-label helpers.
 *
 * Never expose internal tier slugs or empty organization records to admins.
 * These helpers own the mapping from database enum → human-readable label.
 */

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  business: 'Business',
  enterprise: 'Enterprise',
  msp: 'MSP',
  msp_starter: 'MSP Starter',
  msp_pro: 'MSP Professional',
  msp_professional: 'MSP Professional',
  msp_business: 'MSP Business',
  msp_enterprise: 'MSP Enterprise',
};

export function formatTier(raw?: string | null): string {
  if (!raw) return 'Free';
  const key = raw.toString().toLowerCase().trim();
  if (TIER_LABELS[key]) return TIER_LABELS[key];
  // Fallback: capitalize each token so unknown tiers don't leak as slugs.
  return key
    .split(/[_-]+/)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

export function tierBadgeVariant(raw?: string | null): 'default' | 'secondary' | 'outline' {
  const k = (raw ?? 'free').toLowerCase();
  if (k === 'free') return 'outline';
  if (k.startsWith('msp') || k === 'enterprise') return 'default';
  return 'secondary';
}

/**
 * Organization display name. If an org has no name yet, we treat the owner's
 * workspace as a "Personal Workspace" — never a dash.
 */
export function formatOrgName(
  raw?: string | null,
  fallback: 'personal' | 'unnamed' = 'personal',
): string {
  const trimmed = (raw ?? '').toString().trim();
  if (trimmed) return trimmed;
  return fallback === 'personal' ? 'Personal Workspace' : 'Unnamed Organization';
}

export function formatOwnerLabel(email?: string | null, displayName?: string | null): string {
  const name = (displayName ?? '').trim();
  if (name) return name;
  const e = (email ?? '').trim();
  return e || 'Unassigned owner';
}

export function relativeTime(iso?: string | null): string {
  if (!iso) return 'never';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 'never';
  const diff = Date.now() - t;
  if (diff < 60_000) return 'just now';
  const mins = Math.round(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}
