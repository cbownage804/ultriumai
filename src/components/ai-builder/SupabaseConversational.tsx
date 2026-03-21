import { Database, Shield, FolderOpen, Zap, Table2, Lock, Users, Globe, CreditCard, Bell, RefreshCw, Search, Eye, Scan } from 'lucide-react';

export interface SupabaseIntent {
  type: 'database' | 'auth' | 'storage' | 'edge-function' | 'rls' | 'realtime' | 'payments' | 'web-search' | 'vision';
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
  // Web Search
  { signals: [/\b(search|look\s*up|find|research|browse|google|latest|current|trending|news)\b/i, /\b(web\s*search|search\s*the\s*web|online)\b/i], intent: { type: 'web-search' as any, action: 'web_search', description: 'Web search', icon: Search, color: 'text-blue-400' }, weight: 0.7 },
  // Visual Intelligence
  { signals: [/\b(screenshot|image|photo|picture|look\s*at|analyze|replicate|clone\s*this|copy\s*this\s*design|ui\s*from|match\s*this)\b/i, /\b(pixel.?perfect|look\s*like|visual|design\s*from)\b/i], intent: { type: 'vision' as any, action: 'vision', description: 'Visual analysis', icon: Eye, color: 'text-pink-400' }, weight: 0.85 },
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
    'web-search': `- WEB SEARCH: The user wants information from the web integrated into the build. Use the knowledge to generate accurate, up-to-date code. Reference documentation links where relevant. If the user asks to "search" or "look up", provide factual answers with sources and then generate code incorporating that knowledge.`,
    vision: `- VISUAL INTELLIGENCE: The user has provided a screenshot or image reference. Analyze the visual design carefully — extract the exact layout structure, color palette, typography, spacing, component hierarchy, and interaction patterns. Then generate pixel-accurate code that faithfully reproduces the design. Note specific details: border radii, shadows, gradients, icon styles, and responsive behavior visible in the image.`,
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
  { cmd: '/search', desc: 'Search the web for docs & examples', icon: '🔍', prompt: 'Search the web for the latest documentation, code examples, and best practices relevant to what I\'m building. Then apply what you find to improve my app.' },
  { cmd: '/vision', desc: 'Analyze a screenshot or design', icon: '👁️', prompt: 'Analyze the attached screenshot or image and recreate the UI design pixel-for-pixel. Extract colors, typography, layout, spacing, and component patterns from the image.' },
  { cmd: '/clone', desc: 'Clone a website design', icon: '🧬', prompt: 'I want to clone the design of a website. I\'ll provide a screenshot or URL — analyze the layout, colors, typography, and component patterns, then generate a faithful reproduction.' },
  { cmd: '/improve', desc: 'AI-powered UX review', icon: '🧠', prompt: 'Perform an AI-powered UX and design review of my current app. Identify issues with accessibility, visual hierarchy, spacing, color contrast, and interaction patterns. Then fix them.' },
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
export function buildErrorDiagnosisContext(
  error: { message: string; source?: string; line?: number },
  projectFiles?: { path: string; content: string }[],
  consoleErrors?: string[],
  lastAIResponse?: string,
): string {
  const findProjectFile = (filePath: string) => {
    if (!projectFiles) return undefined;
    const normalized = filePath.replace(/^\.?\//, '');
    const baseName = normalized.split('/').pop();

    return projectFiles.find(f => f.path === normalized)
      ?? projectFiles.find(f => f.path.endsWith(`/${normalized}`))
      ?? projectFiles.find(f => baseName ? f.path.split('/').pop() === baseName : false);
  };

  const extractMountIdsFromHtml = (content: string) => {
    const ids = new Set<string>();
    const matches = content.matchAll(/<([a-z][^>]*?)\sid=["']([^"']+)["'][^>]*>/gi);
    for (const match of matches) {
      if (match[2]) ids.add(match[2]);
    }
    return Array.from(ids);
  };

  const extractCreateRootTargets = (content: string) => {
    const targets = new Set<string>();
    const matches = content.matchAll(/document\.getElementById\((['"`])([^'"`]+)\1\)/g);
    for (const match of matches) {
      if (match[2]) targets.add(match[2]);
    }
    return Array.from(targets);
  };

  const sections: string[] = ['[ERROR DIAGNOSIS CONTEXT]'];
  sections.push(`Error: ${error.message}`);
  if (error.source) sections.push(`File: ${error.source}${error.line ? `:${error.line}` : ''}`);

  const msg = error.message.toLowerCase();
  const isReact299 = msg.includes('minified react error #299') || msg.includes('invariant=299');
  const mountFiles = ['index.html', 'main.tsx', 'main.ts', 'src/main.tsx', 'src/main.ts', 'App.tsx', 'App.ts', 'src/App.tsx', 'src/App.ts'];

  // Classify error type for targeted fix
  if (isReact299) {
    sections.push('Type: React mount/root error — React #299 means createRoot could not find the target DOM element. Check index.html for the root container and ensure main.tsx mounts to that exact id.');
    sections.push('Decoded error: createRoot(...): Target container is not a DOM element.');
  } else if (msg.includes('undefined') || msg.includes('null')) {
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

  if (projectFiles && projectFiles.length > 0) {
    const errorFile = isReact299
      ? null
      : error.source
        ? projectFiles.find(f => error.source?.includes(f.path))
        : null;

    if (errorFile) {
      sections.push(`\n[PRIMARY ERROR FILE: ${errorFile.path}]`);
      sections.push('```');
      sections.push(errorFile.content);
      sections.push('```');
    }

    if (isReact299) {
      const htmlFile = findProjectFile('index.html');
      const mountTargets = mountFiles
        .filter(path => path !== 'index.html')
        .map(path => findProjectFile(path))
        .filter((file, index, arr): file is { path: string; content: string } => Boolean(file) && arr.findIndex(candidate => candidate?.path === file?.path) === index);
      const htmlIds = htmlFile ? extractMountIdsFromHtml(htmlFile.content) : [];
      const createRootTargets = Array.from(new Set(mountTargets.flatMap(file => extractCreateRootTargets(file.content))));

      sections.push('\n[ROOT MOUNT FILES TO CHECK FIRST]');
      sections.push(`Mount ids found in index.html: ${htmlIds.length > 0 ? htmlIds.join(', ') : '(none found)'}`);
      sections.push(`createRoot targets found in entry files: ${createRootTargets.length > 0 ? createRootTargets.join(', ') : '(none found)'}`);
      const mismatchedTargets = createRootTargets.filter(target => !htmlIds.includes(target));
      if (mismatchedTargets.length > 0) {
        sections.push(`Detected mismatch: ${mismatchedTargets.join(', ')} ${mismatchedTargets.length === 1 ? 'is' : 'are'} mounted by React but missing from index.html.`);
      }

      for (const path of mountFiles) {
        const file = findProjectFile(path);
        if (!file) continue;
        sections.push(`--- ${file.path} ---`);
        sections.push('```');
        sections.push(file.content.length > 3000 ? file.content.slice(0, 3000) + '\n// ... (truncated)' : file.content);
        sections.push('```');
      }
    }

    const errorFileName = errorFile?.path || error.source || '';
    const baseName = errorFileName.replace(/\.[^.]+$/, '').split('/').pop() || '';
    if (!isReact299 && baseName) {
      const relatedFiles = projectFiles.filter(f => {
        if (f.path === errorFile?.path) return false;
        return f.content.includes(baseName) || 
               (errorFile && errorFile.content.includes(f.path.replace(/\.[^.]+$/, '').split('/').pop() || '___'));
      }).slice(0, 3);

      if (relatedFiles.length > 0) {
        sections.push('\n[RELATED FILES]');
        for (const rf of relatedFiles) {
          sections.push(`--- ${rf.path} ---`);
          sections.push('```');
          sections.push(rf.content.length > 3000 ? rf.content.slice(0, 3000) + '\n// ... (truncated)' : rf.content);
          sections.push('```');
        }
      }
    }

    if (!errorFile && !isReact299 && projectFiles.length <= 15) {
      sections.push('\n[ALL PROJECT FILES]');
      for (const f of projectFiles) {
        sections.push(`--- ${f.path} ---`);
        sections.push('```');
        sections.push(f.content.length > 2000 ? f.content.slice(0, 2000) + '\n// ... (truncated)' : f.content);
        sections.push('```');
      }
    }
  }

  if (consoleErrors && consoleErrors.length > 0) {
    sections.push('\n[RECENT CONSOLE ERRORS]');
    sections.push(consoleErrors.slice(-10).join('\n'));
  }

  if (lastAIResponse) {
    const trimmed = lastAIResponse.slice(0, 1500);
    sections.push('\n[LAST AI GENERATION (what you just produced)]');
    sections.push(trimmed);
    if (lastAIResponse.length > 1500) sections.push('// ... (truncated)');
  }

  if (isReact299) {
    sections.push('\nROOT-CHECK RULE: Do not change styling first. Verify the preview still contains the root/app mount element and that ReactDOM.createRoot(document.getElementById(...)) uses the exact same id. If ids mismatch, fix only index.html and the real entry file.');
  }

  sections.push('\nFIX RULES: You MUST output a 🔍 Diagnosis block (Symptom, Root cause, Fix approach) BEFORE any code. Diagnose the root cause, not just the symptom. Output only the changed files.');
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
    if (!intentsUsed.includes('web-search')) {
      suggestions.push('🔍 Search web for best practices');
    }
  }

  // Design enhancements
  if (currentFiles.length > 0 && !intentsUsed.includes('animation')) {
    suggestions.push('✨ Add animations & micro-interactions');
  }

  // Visual intelligence
  if (currentFiles.length > 0) {
    suggestions.push('👁️ Paste a screenshot to match');
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

// ═══════════════════════════════════════════
// CONVERSATION COMPRESSION — Smart summarization for long conversations
// ═══════════════════════════════════════════

/**
 * Compress old conversation messages to save tokens while preserving key context.
 * Keeps recent messages intact, summarizes older ones into a compact digest.
 */
export function compressConversationHistory(
  messages: { role: string; content: string }[],
  keepRecent = 6,
  maxOlderMessages = 15,
): { role: string; content: string }[] {
  // Step D: Rolling summarization — compress early (threshold lowered from keepRecent+2 to 10)
  if (messages.length <= Math.min(keepRecent + 2, 10)) return messages;

  const older = messages.slice(0, -keepRecent).slice(-maxOlderMessages);
  const recent = messages.slice(-keepRecent);

  // Extract key facts from older messages
  const facts: string[] = [];
  const decisionsSet = new Set<string>();
  const errorsFixed: string[] = [];
  const filesDiscussed = new Set<string>();
  const technologiesUsed = new Set<string>();
  const userCorrections: string[] = [];

  for (const msg of older) {
    const c = msg.content;
    // Track file mentions
    const fileMatches = c.match(/===FILE:\s*(.+?)===/g);
    if (fileMatches) fileMatches.forEach(m => filesDiscussed.add(m.replace(/===FILE:\s*|===/g, '').trim()));

    // Track technologies / libraries mentioned
    const techPatterns = /\b(react|vue|tailwind|supabase|stripe|firebase|prisma|nextjs|express|mongodb|postgres|redis|graphql|rest api|websocket|oauth|jwt|framer.motion)\b/gi;
    const techMatches = c.match(techPatterns);
    if (techMatches) techMatches.forEach(t => technologiesUsed.add(t.toLowerCase()));

    // Track decisions
    if (msg.role === 'assistant') {
      const recs = c.match(/(?:I (?:recommend|suggest|chose|went with|used|built|created|added)|Choosing|Using|Going with)\s+(.{10,80}?)(?:\.|,|\n)/gi);
      if (recs) recs.slice(0, 3).forEach(r => decisionsSet.add(r.trim()));
    }

    // Track errors fixed
    const errorMatch = c.match(/(?:fix|fixed|resolved|error|bug)\s*:?\s*["']?(.{10,60})["']?/i);
    if (errorMatch) errorsFixed.push(errorMatch[1].trim());

    // Track user preferences / corrections
    if (msg.role === 'user') {
      const correction = c.match(/(?:no|not|don't|actually|instead|I (?:want|meant|prefer|need))\s+(.{10,80}?)(?:\.|$)/i);
      if (correction) {
        userCorrections.push(correction[1].trim());
        facts.push(`User preference: ${correction[1].trim()}`);
      }
      // Track explicit design preferences
      const designPref = c.match(/(?:make it|I (?:want|like|prefer)|use|keep)\s+(dark|light|minimal|modern|colorful|professional|clean|bold|round|flat|gradient)/i);
      if (designPref) facts.push(`Design preference: ${designPref[1]}`);
    }
  }

  const summary: string[] = ['[CONVERSATION SUMMARY — older messages compressed]'];
  summary.push(`Conversation depth: ${older.length} messages summarized, ${recent.length} recent kept`);
  if (filesDiscussed.size > 0) summary.push(`Files created/modified: ${[...filesDiscussed].join(', ')}`);
  if (technologiesUsed.size > 0) summary.push(`Technologies used: ${[...technologiesUsed].join(', ')}`);
  if (decisionsSet.size > 0) summary.push(`Key decisions: ${[...decisionsSet].slice(0, 5).join('; ')}`);
  if (errorsFixed.length > 0) summary.push(`Errors fixed: ${errorsFixed.slice(0, 3).join('; ')}`);
  if (facts.length > 0) summary.push(`User preferences: ${facts.slice(0, 6).join('; ')}`);
  if (userCorrections.length > 0) summary.push(`User corrections (IMPORTANT — do not repeat these mistakes): ${userCorrections.slice(0, 3).join('; ')}`);
  summary.push(`\nMaintain continuity with the above context. Do NOT re-explain things already discussed.`);

  return [
    { role: 'system', content: summary.join('\n') },
    ...recent,
  ];
}

/**
 * Build a compact file manifest for context-efficient file representation.
 * Returns a structured summary of each file without full content — used when
 * a file is unlikely to be modified but the AI needs to know it exists.
 */
export function buildFileManifest(
  files: { path: string; content: string }[],
  modifiedPaths: Set<string>,
): string {
  if (files.length === 0) return '';

  const lines: string[] = ['FILE_MANIFEST:'];
  for (const f of files) {
    const sizeKB = (f.content.length / 1024).toFixed(1);
    const isModified = modifiedPaths.has(f.path);
    const ext = f.path.split('.').pop()?.toLowerCase() || '';

    // Generate a compact structural summary based on file type
    let summary = '';
    if (ext === 'html' || ext === 'htm') {
      const sections = f.content.match(/<(?:header|nav|main|section|footer|aside|form|div\s+(?:id|class)=["'][^"']+["'])[^>]*>/gi);
      summary = sections ? `[${sections.length} sections]` : '[HTML]';
    } else if (ext === 'css' || ext === 'scss') {
      const rules = (f.content.match(/\{/g) || []).length;
      const hasMedia = f.content.includes('@media');
      summary = `[${rules} rules${hasMedia ? ', responsive' : ''}]`;
    } else if (['js', 'ts', 'jsx', 'tsx'].includes(ext)) {
      const fns = f.content.match(/(?:function|const|class)\s+(\w+)/g);
      const exports = f.content.match(/export\s+/g);
      summary = `[${fns?.length || 0} definitions, ${exports?.length || 0} exports]`;
    } else if (ext === 'json') {
      summary = '[config]';
    } else if (ext === 'svg') {
      summary = '[vector graphic]';
    }

    lines.push(`  - ${f.path} (${sizeKB}KB)${isModified ? ' [MODIFIED]' : ''} ${summary}`);
  }

  return lines.join('\n');
}

/**
 * Calculate the current context budget usage.
 * Returns percentage used and detailed breakdown for the UI indicator.
 */
export interface ContextBudgetInfo {
  totalChars: number;
  maxChars: number;
  percentUsed: number;
  systemContextChars: number;
  historyChars: number;
  fileContextChars: number;
  filesIncluded: number;
  filesOmitted: number;
  isWarning: boolean;
  isCritical: boolean;
  /** Wave 10: Per-file context breakdown for expandable indicator */
  fileBreakdown?: { path: string; chars: number; percent: number }[];
}

export function calculateContextBudget(
  systemMessages: { content: string }[],
  historyMessages: { content: string }[],
  fileContext: string,
  totalFiles: number,
  includedFiles: number,
): ContextBudgetInfo {
  const MAX_CHARS = 2_500_000;
  const systemContextChars = systemMessages.reduce((s, m) => s + m.content.length, 0);
  const historyChars = historyMessages.reduce((s, m) => s + m.content.length, 0);
  const fileContextChars = fileContext.length;
  const totalChars = systemContextChars + historyChars + fileContextChars;
  const percentUsed = Math.min(100, (totalChars / MAX_CHARS) * 100);

  return {
    totalChars,
    maxChars: MAX_CHARS,
    percentUsed,
    systemContextChars,
    historyChars,
    fileContextChars,
    filesIncluded: includedFiles,
    filesOmitted: totalFiles - includedFiles,
    isWarning: percentUsed > 60,
    isCritical: percentUsed > 85,
  };
}

// ═══════════════════════════════════════════
// ADAPTIVE TONE — Match user's communication style
// ═══════════════════════════════════════════

export type CommunicationStyle = 'technical' | 'casual' | 'concise' | 'detailed';

/**
 * Detect the user's communication style from their messages.
 * Returns a style hint to inject into the system prompt.
 */
export function detectCommunicationStyle(userMessages: string[]): { style: CommunicationStyle; prompt: string } {
  if (userMessages.length < 2) return { style: 'casual', prompt: '' };

  const avgLength = userMessages.reduce((sum, m) => sum + m.length, 0) / userMessages.length;
  const allText = userMessages.join(' ').toLowerCase();

  // Technical indicators
  const techSignals = (allText.match(/\b(api|sql|rls|crud|endpoint|schema|hook|component|state|props|typescript|function|async|middleware)\b/gi) || []).length;
  // Casual indicators
  const casualSignals = (allText.match(/\b(lol|haha|cool|nice|awesome|btw|idk|tbh|thx|pls|gonna|wanna|yeah)\b/gi) || []).length;

  let style: CommunicationStyle;
  if (techSignals > userMessages.length * 1.5) {
    style = 'technical';
  } else if (casualSignals > userMessages.length * 0.5) {
    style = 'casual';
  } else if (avgLength < 30) {
    style = 'concise';
  } else if (avgLength > 150) {
    style = 'detailed';
  } else {
    style = 'casual';
  }

  const prompts: Record<CommunicationStyle, string> = {
    technical: '[TONE] The user communicates technically. Use precise terminology, show code snippets inline, reference specific APIs/patterns. Skip high-level explanations they already understand.',
    casual: '[TONE] The user is casual. Be friendly, use clear language, explain technical choices simply. Emojis are fine. Keep things approachable.',
    concise: '[TONE] The user is concise. Mirror their brevity. Short explanations, bullet points, less prose. Get to the point fast.',
    detailed: '[TONE] The user likes detail. Provide thorough explanations, walk through your reasoning, explain trade-offs, and offer alternatives.',
  };

  return { style, prompt: prompts[style] };
}

// ═══════════════════════════════════════════
// CORRECTION LEARNING — Remember user preferences
// ═══════════════════════════════════════════

export interface UserPreference {
  category: string;
  preference: string;
  timestamp: number;
}

/**
 * Extract user corrections and preferences from conversation.
 * When a user says "no, I meant X" or "I prefer Y", capture it.
 */
export function extractUserPreferences(messages: { role: string; content: string }[]): UserPreference[] {
  const prefs: UserPreference[] = [];
  const now = Date.now();

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role !== 'user') continue;
    const c = msg.content.toLowerCase();

    // Correction patterns
    const corrections = [
      { pattern: /(?:no|not|don't|never)\s+(?:use|do|add|make|include)\s+(.+?)(?:\.|,|$)/i, cat: 'avoid' },
      { pattern: /(?:always|prefer|I like|I want|use|keep)\s+(.+?)(?:\.|,|$)/i, cat: 'prefer' },
      { pattern: /(?:instead|rather|switch to|change to|make it)\s+(.+?)(?:\.|,|$)/i, cat: 'style' },
      { pattern: /(?:too\s+(?:much|many|big|small|dark|light|bright|complex|simple))\s*(.*)$/i, cat: 'feedback' },
    ];

    for (const { pattern, cat } of corrections) {
      const match = c.match(pattern);
      if (match) {
        prefs.push({ category: cat, preference: match[1].trim().slice(0, 100), timestamp: now });
      }
    }
  }

  return prefs;
}

/**
 * Build a preferences context string for the system prompt.
 */
export function buildPreferencesContext(prefs: UserPreference[]): string {
  if (prefs.length === 0) return '';
  const lines = ['[USER PREFERENCES — learned from conversation]'];
  const avoids = prefs.filter(p => p.category === 'avoid');
  const likes = prefs.filter(p => p.category === 'prefer');
  const style = prefs.filter(p => p.category === 'style');
  const feedback = prefs.filter(p => p.category === 'feedback');

  if (avoids.length > 0) lines.push(`AVOID: ${avoids.map(p => p.preference).join(', ')}`);
  if (likes.length > 0) lines.push(`PREFER: ${likes.map(p => p.preference).join(', ')}`);
  if (style.length > 0) lines.push(`STYLE: ${style.map(p => p.preference).join(', ')}`);
  if (feedback.length > 0) lines.push(`FEEDBACK: ${feedback.map(p => p.preference).join(', ')}`);
  lines.push('Apply these preferences to all output without mentioning them explicitly.');
  return lines.join('\n');
}

// ═══════════════════════════════════════════
// ENHANCED ERROR DIAGNOSIS — More patterns
// ═══════════════════════════════════════════

/**
 * Enhanced error classification with specific fix strategies.
 * Goes beyond basic pattern matching to identify error families.
 */
export function classifyErrorFamily(errorMessage: string): {
  family: string;
  severity: 'low' | 'medium' | 'high';
  strategy: string;
  relatedPatterns: string[];
} {
  const msg = errorMessage.toLowerCase();

  const families: { test: RegExp; family: string; severity: 'low' | 'medium' | 'high'; strategy: string; related: string[] }[] = [
    { test: /cannot read propert|is not a function|undefined is not|null is not/i, family: 'null-reference', severity: 'high', strategy: 'Add null checks, optional chaining (?.), and verify data loading states. Check if the variable is initialized before access.', related: ['loading state', 'optional chaining', 'data fetching'] },
    { test: /module not found|cannot find module|failed to resolve|import.*not found/i, family: 'import-error', severity: 'high', strategy: 'Check import paths, file existence, and case sensitivity. Verify the module is installed or the file exists at the specified path.', related: ['file paths', 'package installation', 'case sensitivity'] },
    { test: /hydration|text content does not match|server.*client/i, family: 'hydration', severity: 'medium', strategy: 'Ensure server and client render identical HTML. Move dynamic content to useEffect or use suppressHydrationWarning for timestamps/random values.', related: ['SSR', 'useEffect', 'dynamic content'] },
    { test: /maximum.*exceeded|call stack|too much recursion|infinite loop/i, family: 'infinite-loop', severity: 'high', strategy: 'Check for circular dependencies in useEffect, recursive function calls without base cases, or state updates that trigger re-renders in a loop.', related: ['useEffect deps', 'recursion', 'state loops'] },
    { test: /cors|cross-origin|blocked by cors|access-control/i, family: 'cors', severity: 'medium', strategy: 'Add proper CORS headers to the API/edge function. Ensure Access-Control-Allow-Origin includes the requesting domain.', related: ['CORS headers', 'edge function', 'API proxy'] },
    { test: /403|forbidden|permission denied|not authorized|rls|policy/i, family: 'auth-permission', severity: 'high', strategy: 'Check RLS policies, verify auth.uid() matches, ensure the user is authenticated, and review policy conditions for the operation type (SELECT/INSERT/UPDATE/DELETE).', related: ['RLS policies', 'auth state', 'permissions'] },
    { test: /timeout|network error|failed to fetch|connection refused|econnrefused/i, family: 'network', severity: 'medium', strategy: 'Check API endpoint URLs, network connectivity, and server status. Add retry logic with exponential backoff. Verify the edge function is deployed.', related: ['retry logic', 'endpoint URL', 'deployment'] },
    { test: /syntax error|unexpected token|unterminated|missing.*after/i, family: 'syntax', severity: 'high', strategy: 'Fix the syntax error at the indicated line. Check for missing brackets, unclosed strings, extra commas, or malformed template literals.', related: ['brackets', 'template literals', 'JSON parsing'] },
    { test: /type.*is not assignable|argument.*not assignable|expected.*got/i, family: 'type-error', severity: 'low', strategy: 'Fix type mismatches. Check function signatures, prop types, and ensure data shapes match their TypeScript interfaces.', related: ['TypeScript', 'interfaces', 'type casting'] },
    { test: /422|validation|invalid.*input|constraint|violates|duplicate key/i, family: 'validation', severity: 'medium', strategy: 'Check input validation, required fields, unique constraints, and data format requirements. Verify the request body matches the expected schema.', related: ['validation', 'constraints', 'input format'] },
  ];

  for (const f of families) {
    if (f.test.test(msg)) {
      return { family: f.family, severity: f.severity, strategy: f.strategy, relatedPatterns: f.related };
    }
  }

  return { family: 'unknown', severity: 'medium', strategy: 'Analyze the error message, check the source file and line number, and fix the root cause.', relatedPatterns: [] };
}

/**
 * Build an enhanced error diagnosis context using the error family classifier.
 */
export function buildEnhancedErrorContext(error: { message: string; source?: string; line?: number }): string {
  const classification = classifyErrorFamily(error.message);
  const sections: string[] = ['[ENHANCED ERROR DIAGNOSIS]'];
  sections.push(`Error: ${error.message}`);
  if (error.source) sections.push(`File: ${error.source}${error.line ? `:${error.line}` : ''}`);
  sections.push(`Family: ${classification.family} (${classification.severity} severity)`);
  sections.push(`Strategy: ${classification.strategy}`);
  if (classification.relatedPatterns.length > 0) {
    sections.push(`Check: ${classification.relatedPatterns.join(', ')}`);
  }
  sections.push('FIX: Diagnose root cause, not symptom. Explain what broke. Output only changed files.');
  return sections.join('\n');
}

// ═══════════════════════════════════════════
// VISUAL INTELLIGENCE — Screenshot analysis context
// ═══════════════════════════════════════════

/**
 * Build rich context for visual intelligence when user provides a screenshot.
 * Instructs the AI to perform deep visual analysis before generating code.
 */
export function buildVisualIntelligenceContext(hasImage: boolean, userMessage: string): string {
  if (!hasImage) return '';

  const isClone = /\b(clone|replicate|copy|reproduce|match|pixel.?perfect|look\s*like|same\s*as)\b/i.test(userMessage);
  const isAnalyze = /\b(analyze|review|critique|feedback|improve|what.s wrong|ux\s*review)\b/i.test(userMessage);
  const isUseAsAsset = /\b(use\s*(this|it|that)\s*(as|for)\s*(the\s*)?(logo|icon|favicon|image|background|banner|hero|avatar|brand))\b/i.test(userMessage)
    || /\b((?:this|here)\s*(?:is|as)\s*(?:the|my|our)\s*(logo|icon|image|brand))\b/i.test(userMessage)
    || /\b(logo|icon|favicon|brand\s*image|header\s*image)\b/i.test(userMessage);

  const sections: string[] = ['[VISUAL INTELLIGENCE MODE]'];

  if (isUseAsAsset) {
    sections.push(`TASK: The user has uploaded an image to USE DIRECTLY as an asset (logo, icon, background, etc.) in the project.`);
    sections.push(`CRITICAL INSTRUCTIONS:`);
    sections.push(`1. The uploaded image is provided as a data URL in the message content.`);
    sections.push(`2. You MUST use the EXACT data URL from the image_url content block as the src attribute for the <img> tag or as a CSS background-image.`);
    sections.push(`3. Do NOT ignore the image. Do NOT use a placeholder or text instead.`);
    sections.push(`4. Identify from the user's message WHERE to place the image (e.g., navbar logo, hero section, favicon).`);
    sections.push(`5. Set appropriate sizing (e.g., h-10 w-auto for a navbar logo, h-16 for a hero logo).`);
    sections.push(`6. The data URL starts with "data:image/" — copy it exactly into the src="" attribute.`);
    sections.push(`7. If the image is an SVG data URL, you can also inline the SVG markup if it's short enough.`);
    sections.push(`EXAMPLE: <img src="data:image/png;base64,..." alt="Logo" class="h-10 w-auto">`);
  } else if (isClone) {
    sections.push(`TASK: Faithfully reproduce this design in code.`);
    sections.push(`EXTRACTION CHECKLIST:`);
    sections.push(`1. LAYOUT: Grid structure, flex directions, container widths, breakpoints`);
    sections.push(`2. COLORS: Extract exact hex/hsl values for backgrounds, text, borders, accents`);
    sections.push(`3. TYPOGRAPHY: Font families, sizes, weights, line heights, letter spacing`);
    sections.push(`4. SPACING: Padding, margins, gaps — use consistent spacing scale`);
    sections.push(`5. COMPONENTS: Identify UI patterns (cards, buttons, inputs, navs, modals)`);
    sections.push(`6. DEPTH: Shadows, borders, border-radii, gradients, overlays`);
    sections.push(`7. ICONS: Identify icon style (outlined, filled, brand) and suggest Lucide equivalents`);
    sections.push(`8. INTERACTIONS: Hover states, focus rings, transitions visible in the design`);
    sections.push(`OUTPUT: Generate production-ready code using Tailwind CSS classes. Match the design exactly.`);
  } else if (isAnalyze) {
    sections.push(`TASK: Perform a thorough UX & design analysis of this screenshot.`);
    sections.push(`REVIEW:`);
    sections.push(`- Visual hierarchy: Is the most important content prominent?`);
    sections.push(`- Color contrast: Does text meet WCAG AA (4.5:1 for body, 3:1 for large)?`);
    sections.push(`- Spacing consistency: Are padding/margins following a system?`);
    sections.push(`- Typography: Is font sizing hierarchical? Too many font sizes?`);
    sections.push(`- Alignment: Are elements properly aligned on a grid?`);
    sections.push(`- Touch targets: Are interactive elements ≥44px?`);
    sections.push(`- Accessibility: Missing labels, alt text, focus indicators?`);
    sections.push(`After the analysis, FIX the identified issues in the code.`);
  } else {
    sections.push(`TASK: Analyze this image and incorporate the design elements into the build.`);
    sections.push(`If the user seems to want this image USED in the project (as a logo, background, etc.), embed the data URL directly as an <img> src or CSS background.`);
    sections.push(`Extract the overall aesthetic (dark/light, minimal/detailed, rounded/sharp), key colors, layout patterns, and generate code that matches the visual style.`);
  }

  return sections.join('\n');
}

/**
 * Detect if a user message contains a web search intent and build search context.
 * Returns search queries to prepend as knowledge context.
 */
export function detectWebSearchIntent(message: string): { shouldSearch: boolean; queries: string[] } {
  const searchPatterns = [
    /\b(?:search|look\s*up|find|google|research)\s+(?:for\s+)?["']?(.{5,80})["']?/i,
    /\b(?:latest|newest|current|recent|2024|2025|2026)\s+(.{5,60})/i,
    /\bhow\s+(?:to|do\s+(?:I|you))\s+(.{5,80})\??/i,
    /\b(?:best\s+(?:practice|way|approach|library|framework))\s+(?:for\s+)?(.{5,60})/i,
    /\b(?:docs|documentation|api\s*ref)\s+(?:for\s+)?(.{5,60})/i,
  ];

  const queries: string[] = [];
  for (const pattern of searchPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      queries.push(match[1].trim());
    }
  }

  // Also check for explicit /search command
  if (/^\/search\b/i.test(message.trim())) {
    const query = message.replace(/^\/search\s*/i, '').trim();
    if (query) queries.push(query);
  }

  return { shouldSearch: queries.length > 0, queries: [...new Set(queries)].slice(0, 3) };
}

/**
 * Build context from web search results to inject into the AI prompt.
 */
export function buildWebSearchContext(searchResults: { query: string; snippets: string[] }[]): string {
  if (searchResults.length === 0) return '';

  const sections: string[] = ['[WEB SEARCH RESULTS — Use this knowledge to inform your response]'];
  for (const result of searchResults) {
    sections.push(`\nQuery: "${result.query}"`);
    for (const snippet of result.snippets.slice(0, 3)) {
      sections.push(`  • ${snippet.slice(0, 300)}`);
    }
  }
  sections.push('\nUse these search results to generate accurate, up-to-date code. Cite sources where relevant.');
  return sections.join('\n');
}

/**
 * Detect if the user wants to analyze/clone from a URL (not just an image).
 * Handles full URLs (https://...), bare domains (site.com), and "browse to X" patterns.
 */
export function detectURLCloneIntent(message: string): { hasURL: boolean; url: string | null } {
  // 1. Match full URLs first
  const fullUrlMatch = message.match(/https?:\/\/[^\s,]+/);
  if (fullUrlMatch) {
    // Any full URL with clone/copy/browse signals → match
    const signals = /\b(clone|replicate|copy|reproduce|like|same\s*as|inspired\s*by|based\s*on|browse|go\s*to|check\s*out|visit|scrape|data|content|look\s*at|make\s*it\s*better)\b/i;
    if (signals.test(message)) {
      return { hasURL: true, url: fullUrlMatch[0] };
    }
  }

  // 2. Match bare domains: "browse to glennsbodyshop.net", "go to example.com"
  const bareDomainPatterns = [
    /\b(?:browse\s+(?:to\s+)?|go\s+to\s+|check\s+out\s+|visit\s+|scrape\s+|look\s+at\s+)([a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?(?:\/[^\s,]*)?)/i,
    // Bare domain mentioned alongside action words
    /\b([a-zA-Z0-9][-a-zA-Z0-9]*\.(?:com|net|org|io|dev|co|app|site|web|biz|info|me|us|uk|ca|au)(?:\.[a-zA-Z]{2,})?(?:\/[^\s,]*)?)\b/i,
  ];

  for (const pattern of bareDomainPatterns) {
    const match = message.match(pattern);
    if (match?.[1]) {
      const domain = match[1].replace(/[.,;!?)]+$/, ''); // strip trailing punctuation
      const signals = /\b(clone|replicate|copy|reproduce|like|same\s*as|inspired\s*by|based\s*on|browse|go\s*to|check\s*out|visit|scrape|data|content|look\s*at|make\s*it\s*better|use\s*(?:the|this)|build|create|make)\b/i;
      if (signals.test(message)) {
        return { hasURL: true, url: `https://${domain}` };
      }
    }
  }

  return { hasURL: false, url: null };
}
