// AI Studio Credit System - Business AI Control Plane
// Credits represent "AI capacity" in all user-facing contexts
// Aligned with enterprise-grade AI agent pricing

// Credit costs per action type
export const CREDIT_RATES = {
  APP_CHAT: 1,           // Discuss mode - lightweight Q&A
  APP_BUILD: 3,          // Build mode - code generation
  APP_REBUILD: 2,        // Iterate on existing code
  GPT_CHAT: 2,           // Custom GPT conversation
  GPT_TEST: 1,           // GPT test/preview chat
  IMAGE_GENERATION: 10,  // AI image generation
  BROWSER_TEST: 5,       // Automated browser testing
  FILE_ANALYSIS: 3,      // Document/file processing
  WEB_SEARCH: 2,         // Web search augmentation
} as const;

// GPT Credit Multipliers
export const GPT_MULTIPLIERS = {
  STANDARD: 1.0,      // Standard GPT
  TOOL_ENABLED: 1.5,  // GPT with tools/actions
  WEB_ENABLED: 2.0,   // GPT with web search
} as const;

// AI Studio Plans - MSP / IT Firms (Resale-Focused)
export const MSP_PLANS = {
  msp_starter: {
    name: 'MSP Starter',
    price: 14900, // $149/mo
    credits: 3000,
    description: 'Monthly AI capacity you can allocate across clients',
    tagline: 'Turn AI into a managed service with full cost control.',
  },
  msp_pro: {
    name: 'MSP Pro',
    price: 47900, // $479/mo
    credits: 10000,
    description: 'Scale with more capacity and advanced features',
    tagline: 'Turn AI into a managed service with full cost control.',
  },
  msp_elite: {
    name: 'MSP Elite',
    price: 89900, // $899/mo
    credits: 18000,
    description: 'Enterprise-grade capacity for large client bases',
    tagline: 'Turn AI into a managed service with full cost control.',
  },
  platform_pro: {
    name: 'Platform Pro',
    price: 179900, // $1,799/mo
    credits: 35000,
    description: 'Maximum capacity for platform operators',
    tagline: 'Turn AI into a managed service with full cost control.',
  },
} as const;

// AI Studio Plans - Internal Business Teams
export const TEAM_PLANS = {
  team_basic: {
    name: 'Team Basic',
    price: 5900, // $59/mo
    credits: 1200,
    description: 'Predictable monthly AI usage with no surprise costs',
    hardStop: true,
    tagline: "Your company's AI, trained on your data, with predictable usage.",
  },
  team_plus: {
    name: 'Team Plus',
    price: 23900, // $239/mo
    credits: 5000,
    description: 'Extended capacity for growing teams',
    hardStop: true,
    tagline: "Your company's AI, trained on your data, with predictable usage.",
  },
} as const;

// AI Studio Plans - Website / Embedded GPTs
export const WEBSITE_PLANS = {
  website_basic: {
    name: 'Website Basic',
    price: 3900, // $39/mo
    credits: 800,
    conversations: 250,
    messagesPerVisitor: 5,
    description: 'Designed for lead generation, not unlimited chat',
    tagline: 'A smart website assistant without spam or runaway costs.',
  },
  website_pro: {
    name: 'Website Pro',
    price: 5900, // $59/mo
    credits: 1200,
    conversations: 1000,
    messagesPerVisitor: 5,
    description: 'High-volume lead generation with controls',
    tagline: 'A smart website assistant without spam or runaway costs.',
  },
} as const;

// Overage pricing (MSP plans only)
export const OVERAGE_PRICING = {
  CREDITS_PER_PACK: 500,
  PRICE_PER_PACK: 2900, // $29 per 500 credits (~$0.058/credit)
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
