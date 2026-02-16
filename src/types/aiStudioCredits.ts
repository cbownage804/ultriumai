// AI Studio Credit System - Business AI Control Plane
// Credits represent "AI capacity" in all user-facing contexts

// Credit costs per action type (INTERNAL ONLY - never expose publicly)
export const CREDIT_RATES = {
  APP_CHAT: 1,
  APP_BUILD: 3,
  APP_REBUILD: 2,
  GPT_CHAT: 2,
  GPT_TEST: 1,
  IMAGE_GENERATION: 10,
  BROWSER_TEST: 5,
  FILE_ANALYSIS: 3,
  WEB_SEARCH: 2,
} as const;

// GPT Credit Multipliers
export const GPT_MULTIPLIERS = {
  STANDARD: 1.0,
  TOOL_ENABLED: 1.5,
  WEB_ENABLED: 2.0,
} as const;

// Simplified 4-tier pricing
export const AI_STUDIO_PLANS = {
  free: {
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    credits: 50,
    description: 'Try AI Studio risk-free',
    features: ['50 AI credits/mo', 'Unlimited GPTs', 'Basic features', 'Community support'],
  },
  basic: {
    name: 'Basic',
    monthlyPrice: 4900, // $49/mo
    annualPrice: 39900, // $399/yr (~$33/mo, save 32%)
    credits: 250,
    description: 'For individuals and small projects',
    features: ['250 AI credits/mo', 'Unlimited GPTs', 'Image generation', 'Web search', 'Email support'],
  },
  pro: {
    name: 'Pro',
    monthlyPrice: 14900, // $149/mo
    annualPrice: 119900, // $1,199/yr (~$100/mo, save 33%)
    credits: 1000,
    description: 'For teams and growing businesses',
    features: ['1,000 AI credits/mo', 'Unlimited GPTs', 'All AI capabilities', 'API access', 'Priority support', 'Custom branding'],
    popular: true,
  },
  enterprise: {
    name: 'Enterprise',
    monthlyPrice: 49900, // $499/mo
    annualPrice: 399900, // $3,999/yr (~$333/mo, save 33%)
    credits: 5000,
    description: 'For large organizations',
    features: ['5,000 AI credits/mo', 'Unlimited everything', 'SSO & advanced security', 'Dedicated account manager', 'SLA guarantee', 'Credit rollover'],
  },
} as const;

// Credit top-up packs (one-time purchase)
export const CREDIT_PACKS = {
  small: { credits: 100, price: 2900, name: '100 Credits' },   // $29
  medium: { credits: 300, price: 6900, name: '300 Credits' },   // $69
  large: { credits: 750, price: 14900, name: '750 Credits' },   // $149
  mega: { credits: 2000, price: 34900, name: '2,000 Credits' }, // $349
} as const;

// Overage pricing (for plans that allow it)
export const OVERAGE_PRICING = {
  CREDITS_PER_PACK: 50,
  PRICE_PER_PACK: 2900, // $29 per 50 credits
} as const;

// Usage types for ledger
export type UsageType = 
  | 'chat' 
  | 'file_analysis' 
  | 'retrieval' 
  | 'tool_call' 
  | 'web_search'
  | 'image_generation'
  | 'browser_test'
  | 'app_build'
  | 'app_rebuild';

// Plan types
export type PlanType = 
  | 'free'
  | 'basic'
  | 'pro'
  | 'enterprise';

// Credit response from deduction
export interface CreditDeductionResult {
  success: boolean;
  credits_used?: number;
  credits_remaining?: number;
  multiplier?: number;
  error?: string;
}

// Org credits record
export interface OrgCredits {
  id: string;
  user_id: string;
  plan_type: PlanType;
  monthly_credit_limit: number;
  credits_remaining: number;
  credits_used_this_period: number;
  credit_reset_date: string;
  overage_enabled: boolean;
  overage_credits_used: number;
  created_at: string;
  updated_at: string;
}

// Credit ledger entry
export interface CreditLedgerEntry {
  id: string;
  user_id: string;
  gpt_id: string | null;
  credits_used: number;
  tokens_used: number | null;
  usage_type: UsageType;
  conversation_id: string | null;
  description: string | null;
  created_at: string;
}

// Estimate credit burn based on usage type
export function estimateCreditBurn(
  tokensUsed: number,
  multiplier: number = 1.0
): number {
  return (tokensUsed / 1000) * multiplier;
}

// Get multiplier for GPT type
export function getGPTMultiplier(
  hasTools: boolean,
  hasWebSearch: boolean
): number {
  if (hasWebSearch) return GPT_MULTIPLIERS.WEB_ENABLED;
  if (hasTools) return GPT_MULTIPLIERS.TOOL_ENABLED;
  return GPT_MULTIPLIERS.STANDARD;
}
