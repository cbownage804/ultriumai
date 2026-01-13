// Standalone Product Pricing Configuration
// Products available individually - some also bundled in Vanguard Suite

export interface ProductPricing {
  id: string;
  name: string;
  description: string;
  price: number; // cents per unit per month
  unit: string; // 'user' | 'endpoint' | 'device' | 'agent' | 'org'
  stripePriceId: string;
  stripeProductId: string;
  competitorComparison: string;
  savings: string;
  inVanguard: boolean;
  demoUrl: string;
  category: 'security' | 'operations' | 'ai';
  highlights?: string[];
}

export const STANDALONE_PRODUCTS: Record<string, ProductPricing> = {
  safescan: {
    id: 'safescan',
    name: 'SafeScan™',
    description: 'AI-powered vulnerability scanning and security assessment',
    price: 9900, // $99/mo flat
    unit: 'org',
    stripePriceId: 'price_1SpENWH1u6E0bsJT76DbLmN1',
    stripeProductId: 'prod_TmnzFwfqeuOhzQ',
    competitorComparison: 'vs Nessus at $4,200/yr',
    savings: '70% cheaper',
    inVanguard: true,
    demoUrl: '/demos/safescan',
    category: 'security',
  },
  safepass: {
    id: 'safepass',
    name: 'SafePass™',
    description: 'Enterprise password management with secure sharing and SSO',
    price: 400, // $4/user/mo
    unit: 'user',
    stripePriceId: 'price_1SpENYH1u6E0bsJTQ6kMhSWd',
    stripeProductId: 'prod_TmnzPPC9vUX2PT',
    competitorComparison: 'vs 1Password at $7.99/user',
    savings: '50% cheaper',
    inVanguard: true,
    demoUrl: '/demos/safepass',
    category: 'security',
  },
  rmm: {
    id: 'rmm',
    name: 'RMM™',
    description: 'Endpoint monitoring, patch management, and remote access',
    price: 300, // $3/endpoint/mo
    unit: 'endpoint',
    stripePriceId: 'price_1SpENbH1u6E0bsJT6p9Bvwgx',
    stripeProductId: 'prod_Tmnz0mhhjuWzIi',
    competitorComparison: 'vs NinjaOne at $3-4/endpoint',
    savings: 'Best value',
    inVanguard: true,
    demoUrl: '/demos/rmm',
    category: 'operations',
  },
  helpdesk: {
    id: 'helpdesk',
    name: 'Ultrium AI Helpdesk™',
    description: 'AI-powered service desk with autonomous ticket resolution and smart escalation',
    price: 2900, // $29/agent/mo
    unit: 'agent',
    stripePriceId: 'price_1SpENcH1u6E0bsJT5xuOIwvt',
    stripeProductId: 'prod_TmnzltXwxOrJSq',
    competitorComparison: 'vs Zendesk at $55/agent',
    savings: '47% cheaper',
    inVanguard: true,
    demoUrl: '/demos/ticketing',
    category: 'operations',
    highlights: [
      'Tier 1 AI Auto-Resolution',
      'Smart Escalation Engine',
      'Multi-Channel Support',
      'Self-Service Portal',
    ],
  },
  safeweb: {
    id: 'safeweb',
    name: 'SafeWeb™',
    description: 'Continuous dark web surveillance for compromised credentials',
    price: 300, // $3/user/mo
    unit: 'user',
    stripePriceId: 'price_1SpENfH1u6E0bsJTfR422qT4',
    stripeProductId: 'prod_TmnzCxPOnvUTDR',
    competitorComparison: 'vs ID Agent at $3-5/user',
    savings: 'Best value',
    inVanguard: true,
    demoUrl: '/demos/safeintel',
    category: 'security',
  },
  ultriumgpt: {
    id: 'ultriumgpt',
    name: 'UltriumGPT',
    description: 'Custom AI assistant builder with trained business knowledge and integrations',
    price: 4900, // $49/mo flat
    unit: 'org',
    stripePriceId: 'price_1SpEWFH1u6E0bsJTVUBvBqlX',
    stripeProductId: 'prod_Tmo8w3qmvYfp0f',
    competitorComparison: 'vs ChatGPT Team at $25/user',
    savings: 'Unlimited users',
    inVanguard: false, // NOT in Vanguard - separate product
    demoUrl: '/ai-studio',
    category: 'ai',
  },
};

export const formatPrice = (cents: number): string => {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
};

export const getMonthlyPrice = (product: ProductPricing, quantity: number): number => {
  return product.price * quantity;
};

export const getYearlyPrice = (product: ProductPricing, quantity: number): number => {
  // 20% annual discount
  return Math.round(product.price * quantity * 12 * 0.8);
};
