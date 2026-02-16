import { Database, Shield, FolderOpen, Zap, Table2, Lock, Users, Globe, CreditCard, Bell, RefreshCw, Search } from 'lucide-react';

export interface SupabaseIntent {
  type: 'database' | 'auth' | 'storage' | 'edge-function' | 'rls' | 'realtime' | 'payments';
  action: string;
  description: string;
  icon: typeof Database;
  color: string;
  confidence: number; // 0-1, how sure we are
}

// Multi-signal intent detection with confidence scoring
const INTENT_SIGNALS: { signals: RegExp[]; intent: Omit<SupabaseIntent, 'confidence'>; weight: number }[] = [
  // Database — CREATE
  { signals: [/\b(create|add|make|set up|define)\s+(a\s+)?(table|database|schema|column|field|model)\b/i, /\bCREATE\s+TABLE\b/i], intent: { type: 'database', action: 'create_table', description: 'Create database table', icon: Table2, color: 'text-emerald-400' }, weight: 1 },
  { signals: [/\b(store|save|persist|keep|remember)\s+.*(data|info|record|user|order|product|post|comment|message)/i, /\b(need|want)\s+(a\s+)?database\b/i], intent: { type: 'database', action: 'create_table', description: 'Data persistence', icon: Database, color: 'text-emerald-400' }, weight: 0.8 },
  // Database — QUERY
  { signals: [/\b(query|fetch|get|read|list|show|display|load|retrieve)\s+.*(from|data|records|entries|items|users|posts)/i, /\bSELECT\b.*\bFROM\b/i], intent: { type: 'database', action: 'query', description: 'Query data', icon: Search, color: 'text-cyan-400' }, weight: 0.9 },
  // Database — UPDATE
  { signals: [/\b(update|edit|modify|change|patch)\s+.*(record|entry|row|data|profile|setting)/i, /\bUPDATE\b.*\bSET\b/i], intent: { type: 'database', action: 'update', description: 'Update data', icon: Database, color: 'text-amber-400' }, weight: 0.9 },
  // Database — DELETE
  { signals: [/\b(delete|remove|drop|destroy)\s+.*(record|entry|row|table|data|item)/i, /\bDELETE\s+FROM\b/i], intent: { type: 'database', action: 'delete', description: 'Delete data', icon: Database, color: 'text-red-400' }, weight: 0.9 },
  // Auth — general
  { signals: [/\b(auth|login|log\s*in|sign\s*up|sign\s*in|register|password|account|session|logout|log\s*out)\b/i, /\b(user\s+account|my\s+profile|protected\s+route)\b/i], intent: { type: 'auth', action: 'setup_auth', description: 'Authentication', icon: Shield, color: 'text-violet-400' }, weight: 1 },
  // Auth — OAuth
  { signals: [/\b(google|github|oauth|social|apple|facebook|discord|twitter)\s*(auth|login|sign|provider)/i, /\bsocial\s+login\b/i], intent: { type: 'auth', action: 'oauth', description: 'OAuth provider', icon: Users, color: 'text-violet-400' }, weight: 1 },
  // Auth — Magic link
  { signals: [/\b(magic\s*link|passwordless|email\s*link|one.time\s*(code|password|link))\b/i], intent: { type: 'auth', action: 'magic_link', description: 'Magic link auth', icon: Shield, color: 'text-violet-400' }, weight: 1 },
  // RLS
  { signals: [/\b(protect|private|restrict|authorize|permission|access\s*control|who\s+can)\b/i, /\b(rls|row\s*level|security\s*policy|user\s*can\s*only|own\s*data)\b/i], intent: { type: 'rls', action: 'rls_policy', description: 'Access control', icon: Lock, color: 'text-amber-400' }, weight: 1 },
  // Storage
  { signals: [/\b(upload|file|image|photo|avatar|attachment|bucket|document|pdf|media)\b/i, /\b(drag\s*(and|&)?\s*drop|file\s*picker)\b/i], intent: { type: 'storage', action: 'storage', description: 'File storage', icon: FolderOpen, color: 'text-cyan-400' }, weight: 0.85 },
  // Edge Functions
  { signals: [/\b(api|endpoint|serverless|edge\s*function|webhook|cron|scheduled|backend\s*logic)\b/i, /\b(server.side|background\s*job)\b/i], intent: { type: 'edge-function', action: 'edge_fn', description: 'Edge function', icon: Zap, color: 'text-amber-400' }, weight: 0.9 },
  // Payments
  { signals: [/\b(stripe|payment|billing|subscription|checkout|pricing|plan|invoice|charge)\b/i, /\b(pay\s*wall|monetize|premium)\b/i], intent: { type: 'payments', action: 'payment', description: 'Payment integration', icon: CreditCard, color: 'text-emerald-400' }, weight: 1 },
  // Notifications
  { signals: [/\b(send\s*email|notification|sms|push\s*notification|alert|notify)\b/i, /\b(email\s*template|transactional\s*email)\b/i], intent: { type: 'edge-function', action: 'notification', description: 'Notifications', icon: Bell, color: 'text-cyan-400' }, weight: 0.9 },
  // Realtime
  { signals: [/\b(real.?time|live\s*update|live\s*data|subscription|broadcast|presence|collaborative|multiplayer)\b/i, /\b(live\s*chat|instant\s*update|sync)\b/i], intent: { type: 'realtime', action: 'realtime', description: 'Real-time sync', icon: RefreshCw, color: 'text-violet-400' }, weight: 1 },
];

/**
 * Detect Supabase-related intents with confidence scoring.
 * Returns matched intents sorted by confidence, deduplicated by type.
 */
export function detectSupabaseIntents(message: string): SupabaseIntent[] {
  const matched = new Map<string, SupabaseIntent>();
  
  for (const { signals, intent, weight } of INTENT_SIGNALS) {
    const matchCount = signals.filter(s => s.test(message)).length;
    if (matchCount === 0) continue;
    
    const confidence = Math.min(1, (matchCount / signals.length) * weight + 0.2);
    const existing = matched.get(intent.type);
    
    if (!existing || confidence > existing.confidence) {
      matched.set(intent.type, { ...intent, confidence });
    }
  }
  
  return Array.from(matched.values()).sort((a, b) => b.confidence - a.confidence);
}

/**
 * Build rich system context for the AI to handle backend operations conversationally.
 * Injects into the system prompt so the AI generates correct SQL, auth, storage, etc.
 */
export function buildSupabaseContext(intents: SupabaseIntent[], hasSupabase: boolean): string {
  if (intents.length === 0) return '';

  const sections: string[] = [];

  if (!hasSupabase) {
    sections.push('[BACKEND NOTE] No Supabase is connected yet. If this request needs a database, auth, or storage — include a note telling the user to connect Supabase in Settings first, then generate the UI code that will work once connected.');
    return sections.join('\n');
  }

  sections.push('[BACKEND CONTEXT] The user\'s request involves backend functionality. Apply these rules:');

  const typeHandlers: Record<string, string> = {
    database: `- DATABASE: Generate SQL CREATE TABLE with proper types (uuid, text, timestamptz, jsonb, etc.), defaults (gen_random_uuid(), now()), NOT NULL constraints, foreign keys, and indexes. ALWAYS include RLS policies. Then generate the UI code using supabase.from("table").select()/insert()/update()/delete(). Show SQL in a \`\`\`sql code block.`,
    auth: `- AUTH: Generate complete auth flow — login, signup, password reset pages using supabase.auth.signInWithPassword(), signUp(), signInWithOAuth(), resetPasswordForEmail(). Include onAuthStateChange listener, protected route wrapper, and session state management.`,
    storage: `- STORAGE: Generate SQL for storage bucket creation + RLS policies. Build drag-and-drop upload UI using supabase.storage.from("bucket").upload(). Include file type validation, size limits, progress indicators, and preview.`,
    'edge-function': `- EDGE FUNCTION: Generate a Deno edge function with CORS headers, error handling, typed responses, and rate limit awareness (429/402). Show the function code AND the client invocation using supabase.functions.invoke().`,
    rls: `- RLS: Generate Row Level Security policies using auth.uid() for user-scoped access. Cover all operations (SELECT, INSERT, UPDATE, DELETE). Explain each policy in plain English.`,
    realtime: `- REALTIME: Set up Supabase Realtime subscriptions using supabase.channel("name").on("postgres_changes", ...).subscribe(). Include proper cleanup in useEffect, optimistic UI updates, and presence tracking if applicable.`,
    payments: `- PAYMENTS: Guide Stripe integration — create products/prices in Stripe dashboard, build pricing UI with plan comparison, generate checkout edge function using Stripe SDK, handle webhooks for subscription events.`,
  };

  for (const intent of intents) {
    const handler = typeHandlers[intent.type];
    if (handler) sections.push(handler);
  }

  sections.push('\nCRITICAL: Generate everything in one response — SQL migrations, UI components, edge functions. Be conversational: explain what each piece does, why you chose the approach, and suggest logical next steps.');

  return sections.join('\n');
}

/**
 * Analyze conversation history to understand multi-turn context.
 * Returns enriched context string for the system prompt.
 */
export function buildConversationMemory(
  messages: { role: string; content: string }[],
  maxMessages = 20
): string {
  if (messages.length <= 2) return '';

  const recent = messages.slice(-maxMessages);
  const topics = new Set<string>();
  const decisions = new Set<string>();

  for (const msg of recent) {
    const content = msg.content.toLowerCase();
    // Track topics discussed
    if (/\b(auth|login|signup)\b/.test(content)) topics.add('authentication');
    if (/\b(table|database|schema|sql)\b/.test(content)) topics.add('database');
    if (/\b(upload|storage|file|image)\b/.test(content)) topics.add('storage');
    if (/\b(api|edge function|webhook)\b/.test(content)) topics.add('edge functions');
    if (/\b(stripe|payment|billing)\b/.test(content)) topics.add('payments');
    if (/\b(real.?time|live|sync)\b/.test(content)) topics.add('realtime');
    
    // Track decisions (AI recommendations accepted)
    if (msg.role === 'assistant') {
      const recMatches = content.match(/i(?:'d| would) recommend\s+(.{10,60})/gi);
      if (recMatches) recMatches.forEach(m => decisions.add(m.slice(0, 80)));
    }
  }

  if (topics.size === 0) return '';

  const parts: string[] = ['[CONVERSATION MEMORY]'];
  parts.push(`Topics discussed: ${[...topics].join(', ')}`);
  if (decisions.size > 0) {
    parts.push(`Previous recommendations: ${[...decisions].slice(0, 3).join('; ')}`);
  }
  parts.push(`Conversation depth: ${messages.length} messages (${topics.size} topics covered)`);
  parts.push('Use this context to maintain coherence and avoid repeating information already discussed.');

  return parts.join('\n');
}

/** Slash commands for Supabase operations */
export const SUPABASE_SLASH_COMMANDS = [
  { cmd: '/auth', desc: 'Set up authentication', icon: '🔐', prompt: 'Set up user authentication with login, signup, and password reset pages. Use Supabase Auth with email/password.' },
  { cmd: '/database', desc: 'Create a database table', icon: '🗄️', prompt: 'I need a database table. Ask me what data to store, then generate the SQL with RLS policies and the UI to interact with it.' },
  { cmd: '/storage', desc: 'Set up file uploads', icon: '📁', prompt: 'Set up file upload functionality with a Supabase storage bucket, drag-and-drop UI, and proper access policies.' },
  { cmd: '/api', desc: 'Create an API endpoint', icon: '⚡', prompt: 'Create a serverless API endpoint (Supabase Edge Function) with proper CORS, error handling, and client-side invocation.' },
  { cmd: '/rls', desc: 'Add security policies', icon: '🔒', prompt: 'Review my database tables and add Row Level Security policies to protect user data. Explain each policy.' },
  { cmd: '/users', desc: 'User profiles system', icon: '👥', prompt: 'Create a user profiles system with avatars, display names, and user settings. Include the profiles table, RLS, and auto-creation trigger.' },
  { cmd: '/realtime', desc: 'Add live updates', icon: '🔄', prompt: 'Add real-time data syncing so changes appear instantly for all users. Use Supabase Realtime subscriptions.' },
  { cmd: '/payments', desc: 'Set up payments', icon: '💳', prompt: 'Set up Stripe payment integration with pricing page, checkout flow, and subscription management.' },
];

/**
 * Detect if the AI response contains SQL that should be highlighted.
 */
export function containsSQLMigration(response: string): boolean {
  return /```sql\b/i.test(response);
}

/**
 * Extract SQL blocks from AI response for one-click execution display.
 */
export function extractSQLBlocks(response: string): { sql: string; label: string }[] {
  const blocks: { sql: string; label: string }[] = [];
  const regex = /```sql\n([\s\S]*?)```/gi;
  let match;
  while ((match = regex.exec(response)) !== null) {
    const sql = match[1].trim();
    const labelMatch = sql.match(/--\s*(.+)/);
    const createMatch = sql.match(/CREATE\s+TABLE\s+(?:public\.)?(\w+)/i);
    const label = labelMatch?.[1] || (createMatch ? `Create ${createMatch[1]}` : 'SQL Migration');
    blocks.push({ sql, label });
  }
  return blocks;
}

/**
 * Generate contextual follow-up suggestions based on detected intents.
 */
export function generateIntentSuggestions(intents: SupabaseIntent[]): string[] {
  const suggestions: string[] = [];
  const types = new Set(intents.map(i => i.type));

  if (types.has('database') && !types.has('rls')) {
    suggestions.push('🔒 Add security policies to this table');
  }
  if (types.has('database') && !types.has('auth')) {
    suggestions.push('🔐 Add user authentication');
  }
  if (types.has('auth') && !types.has('database')) {
    suggestions.push('🗄️ Create a user profiles table');
  }
  if (types.has('database') && !types.has('realtime')) {
    suggestions.push('🔄 Enable real-time updates');
  }
  if ((types.has('database') || types.has('auth')) && !types.has('storage')) {
    suggestions.push('📁 Add file upload support');
  }

  return suggestions.slice(0, 3);
}

/**
 * Analyze error messages and build diagnostic context for the AI.
 * Makes the AI much better at fixing runtime errors conversationally.
 */
export function buildErrorDiagnosisContext(error: { message: string; source?: string; line?: number }): string {
  const sections: string[] = ['[ERROR DIAGNOSIS CONTEXT]'];
  sections.push(`Error: ${error.message}`);
  if (error.source) sections.push(`File: ${error.source}${error.line ? `:${error.line}` : ''}`);

  // Classify error type for targeted fix
  const msg = error.message.toLowerCase();
  if (msg.includes('undefined') || msg.includes('null')) {
    sections.push('Type: Null/undefined reference — check variable initialization, optional chaining, and data loading states.');
  } else if (msg.includes('network') || msg.includes('fetch') || msg.includes('cors')) {
    sections.push('Type: Network/CORS error — check API URLs, CORS headers, and auth tokens.');
  } else if (msg.includes('syntax') || msg.includes('unexpected token')) {
    sections.push('Type: Syntax error — check for missing brackets, unclosed strings, or malformed JSON.');
  } else if (msg.includes('permission') || msg.includes('rls') || msg.includes('policy')) {
    sections.push('Type: RLS/Permission error — check Row Level Security policies and auth state.');
  } else if (msg.includes('type') || msg.includes('cannot read')) {
    sections.push('Type: Type error — check data shapes, API response formats, and type assertions.');
  }

  sections.push('FIX RULES: Diagnose the root cause, not just the symptom. Explain what went wrong and why. Output only the changed files.');
  return sections.join('\n');
}

/**
 * Analyze the conversation to determine complexity and suggest mode switches.
 */
export function analyzeConversationComplexity(messages: { role: string; content: string }[]): {
  depth: 'shallow' | 'medium' | 'deep';
  topicCount: number;
  shouldSuggestBuild: boolean;
  shouldSuggestDiscuss: boolean;
  summary: string;
} {
  const userMessages = messages.filter(m => m.role === 'user');
  const assistantMessages = messages.filter(m => m.role === 'assistant');
  
  // Count unique topics
  const topics = new Set<string>();
  const allContent = messages.map(m => m.content.toLowerCase()).join(' ');
  
  const topicPatterns: [RegExp, string][] = [
    [/\b(auth|login|signup|user)\b/, 'authentication'],
    [/\b(table|database|schema|sql)\b/, 'database'],
    [/\b(upload|storage|file|image|avatar)\b/, 'storage'],
    [/\b(api|edge function|webhook|endpoint)\b/, 'api'],
    [/\b(stripe|payment|billing|subscription)\b/, 'payments'],
    [/\b(style|design|color|layout|responsive|css)\b/, 'design'],
    [/\b(animation|transition|framer|motion)\b/, 'animation'],
    [/\b(form|input|validation|submit)\b/, 'forms'],
    [/\b(chart|graph|visualization|recharts)\b/, 'data-viz'],
    [/\b(deploy|publish|host|domain)\b/, 'deployment'],
    [/\b(test|debug|error|fix|bug)\b/, 'debugging'],
    [/\b(real.?time|live|sync|subscription)\b/, 'realtime'],
  ];
  
  for (const [pattern, topic] of topicPatterns) {
    if (pattern.test(allContent)) topics.add(topic);
  }

  const depth = userMessages.length <= 3 ? 'shallow' : userMessages.length <= 10 ? 'medium' : 'deep';
  
  // Check if discussion has converged on a plan
  const lastAssistant = assistantMessages[assistantMessages.length - 1]?.content.toLowerCase() || '';
  const planSignals = ['here\'s what i\'d', 'i\'d recommend', 'here\'s the plan', 'let me build', 'i\'ll create', 'ready to build'];
  const hasPlan = planSignals.some(s => lastAssistant.includes(s));
  
  // Check if user is asking conceptual questions
  const lastUser = userMessages[userMessages.length - 1]?.content.toLowerCase() || '';
  const discussSignals = /^(what|how|why|should|can|compare|explain|which)\b|\?$/;
  const isDiscussing = discussSignals.test(lastUser);

  return {
    depth,
    topicCount: topics.size,
    shouldSuggestBuild: hasPlan && !lastUser.includes('build'),
    shouldSuggestDiscuss: topics.size > 3 && depth === 'shallow',
    summary: `${topics.size} topics (${[...topics].join(', ')}), ${userMessages.length} exchanges, ${depth} depth`,
  };
}

/**
 * Generate proactive capability suggestions based on what's been built.
 * Shows users what they can do next without being asked.
 */
export function generateProactiveSuggestions(
  currentFiles: string[],
  intentsUsed: string[],
  hasAuth: boolean,
  hasDatabase: boolean
): string[] {
  const suggestions: string[] = [];

  // Based on what exists, suggest logical next steps
  if (currentFiles.some(f => f.includes('index.html'))) {
    if (!hasAuth && !intentsUsed.includes('auth')) {
      suggestions.push('🔐 Add user login & signup');
    }
    if (!hasDatabase && !intentsUsed.includes('database')) {
      suggestions.push('🗄️ Connect to a database');
    }
    if (!currentFiles.some(f => f.includes('manifest') || f.includes('sw.'))) {
      suggestions.push('📱 Make it a PWA');
    }
    if (!intentsUsed.includes('payments')) {
      suggestions.push('💳 Add payment processing');
    }
  }

  // Design enhancements
  if (currentFiles.length > 0 && !intentsUsed.includes('animation')) {
    suggestions.push('✨ Add animations & micro-interactions');
  }

  // Performance
  if (currentFiles.length > 5) {
    suggestions.push('⚡ Optimize performance & loading');
  }

  return suggestions.slice(0, 4);
}

/**
 * Detect if the user is trying to have a multi-step workflow conversation.
 * Returns structured workflow steps if detected.
 */
export function detectWorkflowIntent(message: string): { isWorkflow: boolean; steps: string[] } | null {
  const workflowPatterns = [
    /\b(first|then|after that|next|finally|step \d)\b/gi,
    /\b(and also|plus|additionally|on top of that)\b/gi,
    /\d+\.\s+/g,
  ];

  const matchCount = workflowPatterns.reduce((count, p) => {
    const matches = message.match(p);
    return count + (matches?.length || 0);
  }, 0);

  if (matchCount < 2) return null;

  // Extract numbered steps
  const numbered = [...message.matchAll(/(?:^|\n)\s*(\d+)[.)]\s*(.+)/gm)];
  if (numbered.length >= 2) {
    return {
      isWorkflow: true,
      steps: numbered.map(m => m[2].trim()),
    };
  }

  // Extract "first...then..." style
  const sequential = message.match(/(?:first|1st),?\s+(.+?)(?:\.|\n|then|,\s*(?:then|next|after))/i);
  if (sequential) {
    const parts = message.split(/(?:then|next|after that|finally|and then)/i).map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return { isWorkflow: true, steps: parts };
    }
  }

  return null;
}
