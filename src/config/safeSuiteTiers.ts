/**
 * SafeSuite Subscription Tiers Configuration
 * Defines feature access and limits for each tier
 */

export type SafeSuiteTier = 'free' | 'pro' | 'business';

export interface FeatureLimit {
  enabled: boolean;
  limit: number; // -1 = unlimited
  team?: boolean;
}

export interface TierFeatures {
  safepass: FeatureLimit;
  safescan: FeatureLimit;
  safeweb: FeatureLimit;
  safetrack: FeatureLimit;
  whitelabeling: FeatureLimit;
  team: FeatureLimit;  // Team/User Management feature
}

export interface TierConfig {
  id: SafeSuiteTier;
  name: string;
  description: string;
  price: number; // in cents
  yearlyPrice: number; // in cents (annual billing)
  features: TierFeatures;
  stripePriceId?: string;
  stripeYearlyPriceId?: string;
  badge?: string;
  popular?: boolean;
  perUser?: boolean; // true if price is per-user
  priceLabel?: string; // custom price label like "/user/mo"
}

export const SAFESUITE_TIERS: Record<SafeSuiteTier, TierConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Essential security tools for personal use',
    price: 0,
    yearlyPrice: 0,
    badge: 'Free Forever',
    features: {
      safepass: { enabled: true, limit: 25 },      // 25 passwords
      safescan: { enabled: true, limit: 5 },       // 5 scans/month
      safeweb: { enabled: false, limit: 0 },
      safetrack: { enabled: false, limit: 0 },
      whitelabeling: { enabled: false, limit: 0 }, // Not available on free
      team: { enabled: false, limit: 0 }           // Team management not available
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Advanced protection for power users',
    price: 999,  // $9.99/mo
    yearlyPrice: 9590, // $95.90/year (~$7.99/mo)
    stripePriceId: 'price_1SrTegH1u6E0bsJTKpGm5qxr',
    stripeYearlyPriceId: 'price_1SrTeiH1u6E0bsJTarTH7ajs',
    badge: 'Most Popular',
    popular: true,
    features: {
      safepass: { enabled: true, limit: -1 },      // Unlimited
      safescan: { enabled: true, limit: 100 },     // 100 scans/month
      safeweb: { enabled: true, limit: 5 },        // 5 monitored assets
      safetrack: { enabled: false, limit: 0 },
      whitelabeling: { enabled: false, limit: 0 }, // Not available on pro
      team: { enabled: false, limit: 0 }           // Team management not available
    }
  },
  business: {
    id: 'business',
    name: 'Business',
    description: 'Complete security suite for teams',
    price: 1500,  // $15/user/mo
    yearlyPrice: 14400, // $144/year per user (~$12/user/mo)
    stripePriceId: 'price_1SrTejH1u6E0bsJTwd4K8st5',
    stripeYearlyPriceId: 'price_1SrTelH1u6E0bsJTmep4lSIP',
    badge: 'For Teams',
    perUser: true,
    priceLabel: '/user/mo',
    features: {
      safepass: { enabled: true, limit: -1, team: true },  // Unlimited + Team sharing
      safescan: { enabled: true, limit: -1 },              // Unlimited scans
      safeweb: { enabled: true, limit: -1 },               // Unlimited monitoring
      safetrack: { enabled: true, limit: -1 },             // Unlimited tracked assets
      whitelabeling: { enabled: true, limit: -1 },         // Full whitelabeling (Business only)
      team: { enabled: true, limit: -1 }                   // Team/User management (Business only)
    }
  }
};

// Feature descriptions for UI
export const FEATURE_DESCRIPTIONS: Record<keyof TierFeatures, {
  name: string;
  description: string;
  icon: string;
  limitUnit: string; // What the limit number represents
  limitUnitPlural: string;
}> = {
  safepass: {
    name: 'SafePass',
    description: 'Zero-knowledge password vault with enterprise-grade encryption',
    icon: 'KeyRound',
    limitUnit: 'password',
    limitUnitPlural: 'passwords'
  },
  safescan: {
    name: 'SafeScan',
    description: 'Unified email, URL, and document security scanner',
    icon: 'ScanSearch',
    limitUnit: 'scan/mo',
    limitUnitPlural: 'scans/mo'
  },
  safeweb: {
    name: 'SafeWeb',
    description: 'Dark web monitoring with AI threat analysis',
    icon: 'Globe',
    limitUnit: 'monitored asset',
    limitUnitPlural: 'monitored assets'
  },
  safetrack: {
    name: 'SafeTrack',
    description: 'IT asset lifecycle and inventory management',
    icon: 'Package',
    limitUnit: 'tracked asset',
    limitUnitPlural: 'tracked assets'
  },
  whitelabeling: {
    name: 'Whitelabeling',
    description: 'Custom branding with your logo, colors, and domain',
    icon: 'Palette',
    limitUnit: 'brand',
    limitUnitPlural: 'brands'
  },
  team: {
    name: 'Team Management',
    description: 'Invite and manage team members with their own vaults',
    icon: 'Users',
    limitUnit: 'user',
    limitUnitPlural: 'users'
  }
};

// Format limit with unit for display
export function formatLimitWithUnit(feature: keyof TierFeatures, limit: number): string {
  if (limit === -1) return 'Unlimited';
  if (limit === 0) return '';
  
  const featureInfo = FEATURE_DESCRIPTIONS[feature];
  const unit = limit === 1 ? featureInfo.limitUnit : featureInfo.limitUnitPlural;
  return `${limit} ${unit}`;
}

// Helper functions
export function getTierByPriceId(priceId: string): SafeSuiteTier | null {
  for (const [tier, config] of Object.entries(SAFESUITE_TIERS)) {
    if (config.stripePriceId === priceId || config.stripeYearlyPriceId === priceId) {
      return tier as SafeSuiteTier;
    }
  }
  return null;
}

export function getFeatureLimit(tier: SafeSuiteTier, feature: keyof TierFeatures): FeatureLimit {
  return SAFESUITE_TIERS[tier].features[feature];
}

export function isFeatureEnabled(tier: SafeSuiteTier, feature: keyof TierFeatures): boolean {
  return SAFESUITE_TIERS[tier].features[feature].enabled;
}

export function getFeatureLimitValue(tier: SafeSuiteTier, feature: keyof TierFeatures): number {
  return SAFESUITE_TIERS[tier].features[feature].limit;
}

export function formatPrice(cents: number): string {
  if (cents === 0) return 'Free';
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatMonthlyPrice(tier: TierConfig, yearly: boolean = false): string {
  if (tier.price === 0) return 'Free';
  
  const priceLabel = tier.priceLabel || '/mo';
  
  if (yearly) {
    const monthlyFromYearly = tier.yearlyPrice / 12 / 100;
    return `$${monthlyFromYearly.toFixed(0)}${priceLabel}`;
  }
  return `$${(tier.price / 100).toFixed(0)}${priceLabel}`;
}
