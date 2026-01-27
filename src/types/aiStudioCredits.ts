// AI Studio Credit System - Separate from SafeSuite
// 1 AI Credit = 1,000 tokens (internal only, never shown to users)

// GPT Credit Multipliers
export const GPT_MULTIPLIERS = {
  STANDARD: 1.0,      // Standard GPT
  TOOL_ENABLED: 1.5,  // GPT with tools/actions
  WEB_ENABLED: 2.0,   // GPT with web search
} as const;

// AI Studio Plans - MSP / IT Firms
export const MSP_PLANS = {
  msp_starter: {
    name: 'MSP Starter',
    price: 9900, // $99/mo
    credits: 50000,
    description: 'Build AI assistants for your clients under your brand',
  },
  msp_pro: {
    name: 'MSP Pro',
    price: 24900, // $249/mo
    credits: 200000,
    description: 'Scale with more capacity and advanced features',
  },
  msp_elite: {
    name: 'MSP Elite',
    price: 49900, // $499/mo
    credits: 500000,
    description: 'Enterprise-grade capacity for large client bases',
  },
} as const;

// AI Studio Plans - Internal Business Teams
export const TEAM_PLANS = {
  team_basic: {
    name: 'Team Basic',
    price: 4900, // $49/mo
    credits: 20000,
    description: 'Predictable AI usage for small teams',
    hardStop: true,
  },
  team_plus: {
    name: 'Team Plus',
    price: 14900, // $149/mo
    credits: 100000,
    description: 'Extended capacity for growing teams',
    hardStop: false,
  },
} as const;

// AI Studio Plans - Website / Embedded GPTs
export const WEBSITE_PLANS = {
  website_basic: {
    name: 'Website Basic',
    price: 2900, // $29/mo
    credits: 5000,
    conversations: 300,
    description: 'Turn your website into a smart assistant',
  },
  website_pro: {
    name: 'Website Pro',
    price: 7900, // $79/mo
    credits: 20000,
    conversations: 1500,
    description: 'Lead-generating AI without runaway costs',
  },
} as const;

// Overage pricing
export const OVERAGE_PRICING = {
  CREDITS_PER_PACK: 10000,
  PRICE_PER_PACK: 1000, // $10 per 10,000 credits
} as const;

// Usage types for ledger
export type UsageType = 
  | 'chat' 
  | 'file_analysis' 
  | 'retrieval' 
  | 'tool_call' 
  | 'web_search'
  | 'image_generation';

// Plan types
export type PlanType = 
  | 'free'
  | keyof typeof MSP_PLANS 
  | keyof typeof TEAM_PLANS 
  | keyof typeof WEBSITE_PLANS
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
  // 1 credit = 1,000 tokens
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
