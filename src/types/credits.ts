// Credit costs for different actions
export const CREDIT_COSTS = {
  // Chat interactions
  CHAT_MESSAGE_BASIC: 1,           // GPT-4o-mini
  CHAT_MESSAGE_ADVANCED: 3,        // GPT-4o
  CUSTOM_GPT_BASIC: 2,            // Basic custom GPT interaction
  CUSTOM_GPT_ADVANCED: 4,         // Advanced custom GPT interaction
  
  // Content processing
  DOCUMENT_PROCESSING_SMALL: 5,    // < 10 pages
  DOCUMENT_PROCESSING_MEDIUM: 15,  // 10-50 pages  
  DOCUMENT_PROCESSING_LARGE: 25,   // > 50 pages
  
  // Search and knowledge
  KNOWLEDGE_SEARCH: 2,             // Knowledge base search
  WEB_SEARCH: 3,                   // Web search query
  
  // Media generation
  IMAGE_GENERATION: 13,            // AI image generation
  
  // API usage
  API_CALL_BASIC: 1,              // Simple API calls
  API_CALL_COMPLEX: 5,            // Complex API operations
} as const;

// Credit packages for purchase
export const CREDIT_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 1000,
    price: 999, // $9.99 in cents
    popular: false,
    description: 'Perfect for getting started'
  },
  {
    id: 'popular',
    name: 'Popular Pack', 
    credits: 5000,
    price: 3999, // $39.99 in cents
    popular: true,
    description: 'Most popular choice'
  },
  {
    id: 'power',
    name: 'Power Pack',
    credits: 15000,
    price: 9999, // $99.99 in cents
    popular: false,
    description: 'For power users'
  },
  {
    id: 'business',
    name: 'Business Pack',
    credits: 50000,
    price: 29999, // $299.99 in cents
    popular: false,
    description: 'For businesses and teams'
  }
] as const;

export type CreditPackage = typeof CREDIT_PACKAGES[number];