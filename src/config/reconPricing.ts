// Vanguard Recon Unit Pricing Configuration

export const RECON_HARDWARE_TIERS = {
  lite: {
    id: 'lite',
    name: 'Recon Lite',
    description: 'Perfect for small offices and home networks',
    priceCents: 29900, // $299
    stripePriceId: 'price_1Sv04PH1u6E0bsJTexlWShH7',
    stripeProductId: 'prod_TslbN3v4y0pyws',
    specs: {
      model: 'Raspberry Pi 4 (4GB)',
      maxDevices: 50,
      storage: '32GB SD Card',
      features: ['Network Discovery', 'Basic Vulnerability Scanning', 'Traffic Monitoring'],
    },
  },
  pro: {
    id: 'pro',
    name: 'Recon Pro',
    description: 'Enterprise-grade security for growing businesses',
    priceCents: 49900, // $499
    stripePriceId: 'price_1Sv04QH1u6E0bsJTnsRt9rzA',
    stripeProductId: 'prod_TslbyY4IYThHJu',
    specs: {
      model: 'Raspberry Pi 5 (8GB) + AI Accelerator',
      maxDevices: 200,
      storage: '128GB NVMe',
      features: [
        'Advanced Network Discovery',
        'Deep Vulnerability Scanning',
        'Live Traffic Analysis',
        'AI-Powered Threat Detection',
        'Compliance Reporting',
      ],
    },
  },
} as const;

export const RECON_SUBSCRIPTION_TIERS = {
  essential: {
    id: 'essential',
    name: 'Essential',
    description: 'Core security monitoring for basic protection',
    monthlyPriceCents: 2900, // $29/mo
    yearlyPriceCents: 29000, // $290/yr (save ~17%)
    stripePriceId: 'price_1Sv04SH1u6E0bsJTtYePwpO7',
    stripeProductId: 'prod_TslbebGUa9LHTI',
    features: [
      'Daily network scans',
      'Monthly security reports',
      'Email alerts for critical issues',
      'Basic dashboard access',
      '5-day data retention',
    ],
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'Full security suite with real-time protection',
    monthlyPriceCents: 4900, // $49/mo
    yearlyPriceCents: 49000, // $490/yr
    stripePriceId: 'price_1Sv04UH1u6E0bsJTeiWRFrsf',
    stripeProductId: 'prod_TslbEnIrNFoUzJ',
    features: [
      'Real-time continuous scanning',
      'Weekly security reports',
      'SMS + Email alerts',
      'Full dashboard + API access',
      '30-day data retention',
      'Vulnerability remediation guidance',
      'Custom scan schedules',
    ],
    popular: true,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Multi-site management with white-label options',
    monthlyPriceCents: 9900, // $99/mo
    yearlyPriceCents: 99000, // $990/yr
    stripePriceId: 'price_1Sv04VH1u6E0bsJTwblFcd66',
    stripeProductId: 'prod_Tslb2tcBdVNDHn',
    features: [
      'Everything in Professional',
      'Multi-site management',
      'Custom compliance frameworks',
      'White-label reports',
      '90-day data retention',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantees',
    ],
  },
} as const;

export type HardwareTier = keyof typeof RECON_HARDWARE_TIERS;
export type SubscriptionTier = keyof typeof RECON_SUBSCRIPTION_TIERS;

export const formatPrice = (cents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
};

export const ORDER_STATUSES = {
  pending: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400' },
  paid: { label: 'Paid', color: 'bg-green-500/20 text-green-400' },
  provisioning: { label: 'Provisioning', color: 'bg-blue-500/20 text-blue-400' },
  shipped: { label: 'Shipped', color: 'bg-purple-500/20 text-purple-400' },
  delivered: { label: 'Delivered', color: 'bg-cyan-500/20 text-cyan-400' },
  active: { label: 'Active', color: 'bg-emerald-500/20 text-emerald-400' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/20 text-red-400' },
} as const;

export const INVENTORY_STATUSES = {
  available: { label: 'Available', color: 'bg-green-500/20 text-green-400' },
  reserved: { label: 'Reserved', color: 'bg-yellow-500/20 text-yellow-400' },
  assigned: { label: 'Assigned', color: 'bg-blue-500/20 text-blue-400' },
  shipped: { label: 'Shipped', color: 'bg-purple-500/20 text-purple-400' },
  active: { label: 'Active', color: 'bg-emerald-500/20 text-emerald-400' },
  retired: { label: 'Retired', color: 'bg-gray-500/20 text-gray-400' },
  rma: { label: 'RMA', color: 'bg-red-500/20 text-red-400' },
} as const;
