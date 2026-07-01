/**
 * Voice Credit Packages for Ray
 * Purchasable voice minute bundles
 */

export interface VoiceCreditPackage {
  id: string;
  name: string;
  minutes: number;
  priceCents: number;
  stripePriceId: string;
  stripeProductId: string;
  popular?: boolean;
  savings?: string;
}

export const VOICE_CREDIT_PACKAGES: VoiceCreditPackage[] = [
  {
    id: 'voice_5',
    name: '5 Minutes',
    minutes: 5,
    priceCents: 299,
    stripePriceId: 'price_1Stc6hH1u6E0bsJTs0oG0svb',
    stripeProductId: 'prod_TrKmjuIR2SxkSX',
  },
  {
    id: 'voice_15',
    name: '15 Minutes',
    minutes: 15,
    priceCents: 699,
    stripePriceId: 'price_1Stc6iH1u6E0bsJTFCtgRqFH',
    stripeProductId: 'prod_TrKmmM5snhsWfq',
    popular: true,
    savings: 'Save 22%',
  },
  {
    id: 'voice_30',
    name: '30 Minutes',
    minutes: 30,
    priceCents: 1199,
    stripePriceId: 'price_1Stc6jH1u6E0bsJTVBX7ylHI',
    stripeProductId: 'prod_TrKmzBZipv7b0w',
    savings: 'Save 33%',
  },
];

// Map product IDs to minutes for webhook processing
export const PRODUCT_TO_MINUTES: Record<string, number> = {
  'prod_TrKmjuIR2SxkSX': 5,
  'prod_TrKmmM5snhsWfq': 15,
  'prod_TrKmzBZipv7b0w': 30,
};

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function getPricePerMinute(pkg: VoiceCreditPackage): number {
  return pkg.priceCents / pkg.minutes;
}
