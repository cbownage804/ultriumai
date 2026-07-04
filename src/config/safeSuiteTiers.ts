/**
 * Wrayth Subscription Tiers Configuration
 *
 * Capability-first pricing. Every plan gets unlimited monitoring, unlimited
 * Ray conversations, password vault, browser extension, and daily/weekly
 * briefings. Tiers differ by which advanced capabilities are unlocked and by
 * the monthly Ray Compute (RC) allowance included for advanced AI workflows.
 *
 * There are no per-message, per-scan, per-password, or per-minute quotas.
 */

export type WraythTier = 'free' | 'pro' | 'business' | 'enterprise';

export type Capability =
  // Included with every plan
  | 'ray_conversations'
  | 'password_manager'
  | 'browser_extension'
  | 'device_monitoring'
  | 'identity_monitoring'
  | 'threat_center'
  | 'daily_brief'
  | 'weekly_brief'
  | 'security_score'
  | 'recommendations'
  // Pro+
  | 'threat_investigation'
  | 'malware_analysis'
  | 'log_analysis'
  | 'script_analysis'
  | 'graph'
  | 'reports'
  | 'microsoft_365_monitoring'
  // Business+
  | 'team_management'
  | 'organization_memory'
  | 'executive_dashboard'
  | 'executive_reports'
  | 'policy_generator'
  | 'compliance'
  | 'shared_investigations'
  | 'shared_timeline'
  | 'knowledge_graph'
  | 'scheduled_reports'
  // Enterprise
  | 'sso'
  | 'scim'
  | 'api_access'
  | 'custom_ai'
  | 'private_models'
  | 'compliance_automation'
  | 'dedicated_support'
  | 'custom_onboarding'
  | 'multi_org';

export interface TierConfig {
  id: WraythTier;
  name: string;
  tagline: string;
  description: string;
  /** Monthly price in cents. */
  price: number;
  /** Annual billing, total per year in cents. */
  yearlyPrice: number;
  /** Ray Compute included per month (per user for team plans). null = custom. */
  rayCompute: number | null;
  capabilities: Set<Capability>;
  stripePriceId?: string;
  stripeYearlyPriceId?: string;
  badge?: string;
  popular?: boolean;
  perUser?: boolean;
  priceLabel?: string;
  /** Legacy shim — see FeatureLimit / LegacyFeatureKey below. */
  features: TierFeatures;
}

const ALWAYS_INCLUDED: Capability[] = [
  'ray_conversations',
  'password_manager',
  'browser_extension',
  'device_monitoring',
  'identity_monitoring',
  'threat_center',
  'daily_brief',
  'weekly_brief',
  'security_score',
  'recommendations',
];

const PRO_UNLOCKS: Capability[] = [
  'threat_investigation',
  'malware_analysis',
  'log_analysis',
  'script_analysis',
  'graph',
  'reports',
  'microsoft_365_monitoring',
];

const BUSINESS_UNLOCKS: Capability[] = [
  'team_management',
  'organization_memory',
  'executive_dashboard',
  'executive_reports',
  'policy_generator',
  'compliance',
  'shared_investigations',
  'shared_timeline',
  'knowledge_graph',
  'scheduled_reports',
];

const ENTERPRISE_UNLOCKS: Capability[] = [
  'sso',
  'scim',
  'api_access',
  'custom_ai',
  'private_models',
  'compliance_automation',
  'dedicated_support',
  'custom_onboarding',
  'multi_org',
];

type TierSpec = Omit<TierConfig, 'features'>;

const TIER_SPECS: Record<WraythTier, TierSpec> = {
  free: {
    id: 'free',
    name: 'Free',
    tagline: 'For individuals getting started',
    description: 'Personal AI security with unlimited Ray conversations.',
    price: 0,
    yearlyPrice: 0,
    rayCompute: 0,
    badge: 'Free Forever',
    capabilities: new Set<Capability>(ALWAYS_INCLUDED),
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'For power users and consultants',
    description: 'Everything in Free plus advanced investigations and analysis.',
    price: 1500,
    yearlyPrice: 15000,
    rayCompute: 25,
    stripePriceId: 'price_1TpZiYH1u6E0bsJTt1q6wSMT',
    stripeYearlyPriceId: 'price_1SrTeiH1u6E0bsJTarTH7ajs',
    badge: 'Most Popular',
    popular: true,
    capabilities: new Set<Capability>([...ALWAYS_INCLUDED, ...PRO_UNLOCKS]),
  },
  business: {
    id: 'business',
    name: 'Business',
    tagline: 'AI security platform for teams',
    description: 'Everything in Pro plus team collaboration, executive reporting, and compliance.',
    price: 3900,
    yearlyPrice: 39000,
    rayCompute: 100,
    stripePriceId: 'price_1SrTejH1u6E0bsJTwd4K8st5',
    stripeYearlyPriceId: 'price_1SrTelH1u6E0bsJTmep4lSIP',
    badge: 'For Teams',
    perUser: true,
    priceLabel: '/user/mo',
    capabilities: new Set<Capability>([...ALWAYS_INCLUDED, ...PRO_UNLOCKS, ...BUSINESS_UNLOCKS]),
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Governance and scale for regulated organizations',
    description: 'Everything in Business plus SSO, SCIM, API, private models, and dedicated support.',
    price: 4500,
    yearlyPrice: 43200,
    rayCompute: null,
    stripePriceId: 'price_1SuesEH1u6E0bsJT6o2Hxp0T',
    stripeYearlyPriceId: 'price_enterprise_yearly',
    badge: 'Enterprise',
    perUser: true,
    priceLabel: '/user/mo',
    capabilities: new Set<Capability>([
      ...ALWAYS_INCLUDED,
      ...PRO_UNLOCKS,
      ...BUSINESS_UNLOCKS,
      ...ENTERPRISE_UNLOCKS,
    ]),
  },
};

function buildLegacyFeatures(caps: Set<Capability>): TierFeatures {
  const legacy = {} as TierFeatures;
  (Object.keys(LEGACY_CAPABILITY_MAP) as LegacyFeatureKey[]).forEach((k) => {
    const enabled = caps.has(LEGACY_CAPABILITY_MAP[k]);
    legacy[k] = { enabled, limit: enabled ? -1 : 0 };
  });
  return legacy;
}

export const SAFESUITE_TIERS: Record<WraythTier, TierConfig> = Object.fromEntries(
  (Object.entries(TIER_SPECS) as [WraythTier, TierSpec][]).map(([tier, spec]) => [
    tier,
    { ...spec, features: buildLegacyFeatures(spec.capabilities) },
  ]),
) as Record<WraythTier, TierConfig>;

// Human labels for capabilities (used in pricing UI + gating messages)
export const CAPABILITY_LABELS: Record<Capability, string> = {
  ray_conversations: 'Unlimited Ray conversations',
  password_manager: 'Password manager',
  browser_extension: 'Browser extension',
  device_monitoring: 'Unlimited device monitoring',
  identity_monitoring: 'Unlimited identity monitoring',
  threat_center: 'Threat Center',
  daily_brief: 'Daily security brief',
  weekly_brief: 'Weekly security brief',
  security_score: 'Daily security score',
  recommendations: 'AI recommendations',

  threat_investigation: 'Threat Investigations',
  malware_analysis: 'Malware Analysis',
  log_analysis: 'Log Analysis',
  script_analysis: 'Script Analysis',
  graph: 'Security Graph',
  reports: 'Reports',
  microsoft_365_monitoring: 'Microsoft 365 monitoring',

  team_management: 'Team management',
  organization_memory: 'Organization memory',
  executive_dashboard: 'Executive Dashboard',
  executive_reports: 'Executive Reports',
  policy_generator: 'Policy Generator',
  compliance: 'Compliance',
  shared_investigations: 'Shared investigations',
  shared_timeline: 'Shared timeline',
  knowledge_graph: 'Organization knowledge graph',
  scheduled_reports: 'Scheduled reports',

  sso: 'SSO (SAML / OIDC)',
  scim: 'SCIM provisioning',
  api_access: 'API access',
  custom_ai: 'Custom AI',
  private_models: 'Private AI models',
  compliance_automation: 'Compliance automation',
  dedicated_support: 'Dedicated support',
  custom_onboarding: 'Custom onboarding',
  multi_org: 'Unlimited organizations',
};

// Helpers -------------------------------------------------------------------

export function getTierByPriceId(priceId: string): WraythTier | null {
  for (const [tier, config] of Object.entries(SAFESUITE_TIERS)) {
    if (config.stripePriceId === priceId || config.stripeYearlyPriceId === priceId) {
      return tier as WraythTier;
    }
  }
  return null;
}

export function tierHasCapability(tier: WraythTier, capability: Capability): boolean {
  return SAFESUITE_TIERS[tier].capabilities.has(capability);
}

export function formatPrice(cents: number): string {
  if (cents === 0) return 'Free';
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatMonthlyPrice(tier: TierConfig, yearly = false): string {
  if (tier.price === 0) return 'Free';
  const priceLabel = tier.priceLabel || '/mo';
  if (yearly) {
    const monthlyFromYearly = tier.yearlyPrice / 12 / 100;
    return `$${monthlyFromYearly.toFixed(0)}${priceLabel}`;
  }
  return `$${(tier.price / 100).toFixed(0)}${priceLabel}`;
}

// ------------------------------------------------------------------
// Back-compat shims
//
// A number of legacy call sites still ask "is X feature enabled" or "what is
// the limit for Y" — where X/Y were the old quota-based feature names
// (vault, scan, watch, ray, ray_voice, whitelabeling, team). We now treat all
// of those as unlimited on any paid tier that has the corresponding
// capability, and we no longer expose numeric caps. These shims let the
// pre-existing UI code compile without lying to users about counts.
// ------------------------------------------------------------------

export type LegacyFeatureKey =
  | 'vault'
  | 'scan'
  | 'watch'
  | 'ray'
  | 'ray_voice'
  | 'whitelabeling'
  | 'team';

const LEGACY_CAPABILITY_MAP: Record<LegacyFeatureKey, Capability> = {
  vault: 'password_manager',
  scan: 'threat_center',
  watch: 'identity_monitoring',
  ray: 'ray_conversations',
  ray_voice: 'ray_conversations',
  whitelabeling: 'team_management',
  team: 'team_management',
};

export interface FeatureLimit {
  enabled: boolean;
  /** -1 = unlimited. Kept for legacy call sites; we no longer meter these. */
  limit: number;
  team?: boolean;
}

export function isFeatureEnabled(tier: WraythTier, feature: LegacyFeatureKey): boolean {
  return tierHasCapability(tier, LEGACY_CAPABILITY_MAP[feature]);
}

export function getFeatureLimit(tier: WraythTier, feature: LegacyFeatureKey): FeatureLimit {
  const enabled = isFeatureEnabled(tier, feature);
  return { enabled, limit: enabled ? -1 : 0 };
}

export function getFeatureLimitValue(tier: WraythTier, feature: LegacyFeatureKey): number {
  return isFeatureEnabled(tier, feature) ? -1 : 0;
}

export function formatLimitWithUnit(_feature: LegacyFeatureKey, limit: number): string {
  if (limit === -1) return 'Unlimited';
  return '';
}

// Legacy descriptor (kept for any UI that iterates it)
export const FEATURE_DESCRIPTIONS: Record<LegacyFeatureKey, {
  name: string;
  description: string;
  icon: string;
  limitUnit: string;
  limitUnitPlural: string;
}> = {
  vault: {
    name: 'Password Manager',
    description: 'Zero-knowledge password vault, unlimited entries.',
    icon: 'KeyRound',
    limitUnit: '',
    limitUnitPlural: '',
  },
  scan: {
    name: 'Threat Center',
    description: 'Unified email, URL, and document security scanner.',
    icon: 'ScanSearch',
    limitUnit: '',
    limitUnitPlural: '',
  },
  watch: {
    name: 'Identity Monitoring',
    description: 'Unlimited identity and dark web monitoring.',
    icon: 'Globe',
    limitUnit: '',
    limitUnitPlural: '',
  },
  ray: {
    name: 'Ray',
    description: 'Your AI security analyst — unlimited conversations.',
    icon: 'Bot',
    limitUnit: '',
    limitUnitPlural: '',
  },
  ray_voice: {
    name: 'Ray Voice',
    description: 'Voice conversations with Ray.',
    icon: 'Mic',
    limitUnit: '',
    limitUnitPlural: '',
  },
  whitelabeling: {
    name: 'Whitelabeling',
    description: 'Custom branding with your logo, colors, and domain.',
    icon: 'Palette',
    limitUnit: '',
    limitUnitPlural: '',
  },
  team: {
    name: 'Team Management',
    description: 'Invite and manage team members with shared vaults.',
    icon: 'Users',
    limitUnit: '',
    limitUnitPlural: '',
  },
};

export interface TierFeatures {
  vault: FeatureLimit;
  scan: FeatureLimit;
  watch: FeatureLimit;
  ray: FeatureLimit;
  ray_voice: FeatureLimit;
  whitelabeling: FeatureLimit;
  team: FeatureLimit;
}
