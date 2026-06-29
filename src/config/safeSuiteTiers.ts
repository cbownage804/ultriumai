/**
 * Wrayth Subscription Tiers Configuration
 * Defines feature access and limits for each tier
 */

export type WraythTier = 'free' | 'pro' | 'business' | 'enterprise';

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
  safeassist: FeatureLimit;
  safeassist_voice: FeatureLimit;  // Voice minutes per month
  whitelabeling: FeatureLimit;
  team: FeatureLimit;  // Team/User Management feature
}

export interface TierConfig {
  id: WraythTier;
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

export const SAFESUITE_TIERS: Record<WraythTier, TierConfig> = {
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
      safeassist: { enabled: true, limit: 25 },    // 25 AI messages/month
      safeassist_voice: { enabled: false, limit: 0 }, // No voice for free tier
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
      safepass: { enabled: true, limit: 100 },     // 100 passwords
      safescan: { enabled: true, limit: 100 },     // 100 scans/month
      safeweb: { enabled: true, limit: 5 },        // 5 monitored assets
      safetrack: { enabled: false, limit: 0 },
      safeassist: { enabled: true, limit: 100 },   // 100 AI messages/month
      safeassist_voice: { enabled: true, limit: 2 }, // 2 voice minutes/month
      whitelabeling: { enabled: false, limit: 0 }, // Not available on pro
      team: { enabled: false, limit: 0 }           // Team management not available
    }
  },
  business: {
    id: 'business',
    name: 'Business',
    description: 'Complete security suite for teams',
    price: 2999,  // $29.99/user/mo (matches live Stripe price_1SrTejH1u6E0bsJTwd4K8st5)
    yearlyPrice: 28790, // $287.90/year per user (~$23.99/user/mo) (matches Stripe price_1SrTelH1u6E0bsJTmep4lSIP)
    stripePriceId: 'price_1SrTejH1u6E0bsJTwd4K8st5',
    stripeYearlyPriceId: 'price_1SrTelH1u6E0bsJTmep4lSIP',
    badge: 'For Teams',
    perUser: true,
    priceLabel: '/user/mo',
    features: {
      safepass: { enabled: true, limit: 500, team: true },  // 500 passwords + Team sharing
      safescan: { enabled: true, limit: 500 },              // 500 scans/month
      safeweb: { enabled: true, limit: 50 },                // 50 monitored assets
      safetrack: { enabled: true, limit: 500 },             // 500 tracked assets
      safeassist: { enabled: true, limit: 250 },            // 250 AI messages/month
      safeassist_voice: { enabled: true, limit: 5 },        // 5 voice minutes/month
      whitelabeling: { enabled: true, limit: 1 },           // 1 brand (Business)
      team: { enabled: true, limit: 20 }                    // Up to 20 team members
    }
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Maximum security for large organizations',
    price: 4500,  // $45/user/mo
    yearlyPrice: 43200, // $432/year per user (~$36/user/mo)
    stripePriceId: 'price_1SuesEH1u6E0bsJT6o2Hxp0T', // $45/mo live Stripe price
    stripeYearlyPriceId: 'price_enterprise_yearly', // Contact sales — no live yearly price yet
    badge: 'Enterprise',
    perUser: true,
    priceLabel: '/user/mo',
    features: {
      safepass: { enabled: true, limit: 1500, team: true }, // 1500 passwords + Team sharing
      safescan: { enabled: true, limit: 1500 },             // 1500 scans/month
      safeweb: { enabled: true, limit: 150 },               // 150 monitored assets
      safetrack: { enabled: true, limit: 1500 },            // 1500 tracked assets
      safeassist: { enabled: true, limit: 750 },            // 750 AI messages/month
      safeassist_voice: { enabled: true, limit: 15 },       // 15 voice minutes/month
      whitelabeling: { enabled: true, limit: -1 },          // Unlimited brands
      team: { enabled: true, limit: 60 }                    // Up to 60 team members
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
    name: 'Vault',
    description: 'Zero-knowledge password vault with enterprise-grade encryption',
    icon: 'KeyRound',
    limitUnit: 'password',
    limitUnitPlural: 'passwords'
  },
  safescan: {
    name: 'Scan',
    description: 'Unified email, URL, and document security scanner',
    icon: 'ScanSearch',
    limitUnit: 'scan/mo',
    limitUnitPlural: 'scans/mo'
  },
  safeweb: {
    name: 'Watch',
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
  safeassist: {
    name: 'SafeAssist',
    description: 'AI-powered security assistant for plain-language guidance',
    icon: 'Bot',
    limitUnit: 'message/mo',
    limitUnitPlural: 'messages/mo'
  },
  safeassist_voice: {
    name: 'SafeAssist Voice',
    description: 'Voice conversations with SafeAssist AI',
    icon: 'Mic',
    limitUnit: 'minute/mo',
    limitUnitPlural: 'minutes/mo'
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
export function getTierByPriceId(priceId: string): WraythTier | null {
  for (const [tier, config] of Object.entries(SAFESUITE_TIERS)) {
    if (config.stripePriceId === priceId || config.stripeYearlyPriceId === priceId) {
      return tier as WraythTier;
    }
  }
  return null;
}

export function getFeatureLimit(tier: WraythTier, feature: keyof TierFeatures): FeatureLimit {
  return SAFESUITE_TIERS[tier].features[feature];
}

export function isFeatureEnabled(tier: WraythTier, feature: keyof TierFeatures): boolean {
  return SAFESUITE_TIERS[tier].features[feature].enabled;
}

export function getFeatureLimitValue(tier: WraythTier, feature: keyof TierFeatures): number {
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
