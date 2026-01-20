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
      safetrack: { enabled: false, limit: 0 }
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Advanced protection for power users',
    price: 999,  // $9.99/mo
    yearlyPrice: 9588, // $7.99/mo billed annually
    stripePriceId: 'price_safesuite_pro_monthly',
    stripeYearlyPriceId: 'price_safesuite_pro_yearly',
    badge: 'Most Popular',
    popular: true,
    features: {
      safepass: { enabled: true, limit: -1 },      // Unlimited
      safescan: { enabled: true, limit: 100 },     // 100 scans/month
      safeweb: { enabled: true, limit: 5 },        // 5 monitored assets
      safetrack: { enabled: false, limit: 0 }
    }
  },
  business: {
    id: 'business',
    name: 'Business',
    description: 'Complete security suite for teams',
    price: 2999,  // $29.99/mo
    yearlyPrice: 28788, // $23.99/mo billed annually
    stripePriceId: 'price_safesuite_business_monthly',
    stripeYearlyPriceId: 'price_safesuite_business_yearly',
    badge: 'Best Value',
    features: {
      safepass: { enabled: true, limit: -1, team: true },  // Unlimited + Team sharing
      safescan: { enabled: true, limit: -1 },              // Unlimited scans
      safeweb: { enabled: true, limit: -1 },               // Unlimited monitoring
      safetrack: { enabled: true, limit: 100 }             // 100 tracked assets
    }
  }
};

// Feature descriptions for UI
export const FEATURE_DESCRIPTIONS: Record<keyof TierFeatures, {
  name: string;
  description: string;
  icon: string;
}> = {
  safepass: {
    name: 'SafePass',
    description: 'Secure password manager with encryption',
    icon: 'KeyRound'
  },
  safescan: {
    name: 'SafeScan',
    description: 'Email, URL, and document security scanner',
    icon: 'ScanSearch'
  },
  safeweb: {
    name: 'SafeWeb',
    description: 'Dark web monitoring and breach alerts',
    icon: 'Globe'
  },
  safetrack: {
    name: 'SafeTrack',
    description: 'Asset management and inventory tracking',
    icon: 'Package'
  }
};

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
  if (yearly) {
    return `$${(tier.yearlyPrice / 12 / 100).toFixed(2)}/mo`;
  }
  return `$${(tier.price / 100).toFixed(2)}/mo`;
}
