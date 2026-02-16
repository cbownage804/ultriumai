import { useCallback } from 'react';
import { Database, Shield, FolderOpen, Zap, Table2, Lock, Users } from 'lucide-react';

export interface SupabaseIntent {
  type: 'database' | 'auth' | 'storage' | 'edge-function' | 'rls';
  action: string;
  description: string;
  icon: typeof Database;
  color: string;
}

// Pattern matchers for detecting Supabase-related intents in user messages
const INTENT_PATTERNS: { pattern: RegExp; intent: SupabaseIntent }[] = [
  // Database
  { pattern: /\b(create|add|make)\s+(a\s+)?(table|database|schema|column|field)\b/i, intent: { type: 'database', action: 'create_table', description: 'Create database table', icon: Table2, color: 'text-emerald-400' } },
  { pattern: /\b(store|save|persist|keep)\s+.*(data|info|record|user)/i, intent: { type: 'database', action: 'create_table', description: 'Data persistence', icon: Database, color: 'text-emerald-400' } },
  { pattern: /\b(query|fetch|get|read|list|show)\s+.*(from|data|records|entries)/i, intent: { type: 'database', action: 'query', description: 'Query data', icon: Database, color: 'text-cyan-400' } },
  { pattern: /\b(update|edit|modify|change)\s+.*(record|entry|row|data)/i, intent: { type: 'database', action: 'update', description: 'Update data', icon: Database, color: 'text-amber-400' } },
  { pattern: /\b(delete|remove|drop)\s+.*(record|entry|row|table|data)/i, intent: { type: 'database', action: 'delete', description: 'Delete data', icon: Database, color: 'text-red-400' } },
  // Auth
  { pattern: /\b(auth|login|sign\s*up|sign\s*in|register|password|account|session)\b/i, intent: { type: 'auth', action: 'setup_auth', description: 'Authentication', icon: Shield, color: 'text-violet-400' } },
  { pattern: /\b(google|github|oauth|social)\s*(auth|login|sign)/i, intent: { type: 'auth', action: 'oauth', description: 'OAuth provider', icon: Users, color: 'text-violet-400' } },
  { pattern: /\b(magic\s*link|passwordless|email\s*link)\b/i, intent: { type: 'auth', action: 'magic_link', description: 'Magic link auth', icon: Shield, color: 'text-violet-400' } },
  { pattern: /\b(protect|private|restrict|authorize|permission)\b/i, intent: { type: 'rls', action: 'rls_policy', description: 'Access control', icon: Lock, color: 'text-amber-400' } },
  // Storage
  { pattern: /\b(upload|file|image|photo|avatar|attachment|bucket)\b/i, intent: { type: 'storage', action: 'storage', description: 'File storage', icon: FolderOpen, color: 'text-cyan-400' } },
  // Edge Functions
  { pattern: /\b(api|endpoint|serverless|edge\s*function|webhook|cron|scheduled)\b/i, intent: { type: 'edge-function', action: 'edge_fn', description: 'Edge function', icon: Zap, color: 'text-amber-400' } },
  { pattern: /\b(stripe|payment|billing|subscription|checkout)\b/i, intent: { type: 'edge-function', action: 'payment', description: 'Payment integration', icon: Zap, color: 'text-emerald-400' } },
  { pattern: /\b(send\s*email|notification|sms|push)\b/i, intent: { type: 'edge-function', action: 'notification', description: 'Notifications', icon: Zap, color: 'text-cyan-400' } },
  // RLS
  { pattern: /\b(rls|row\s*level|security\s*policy|user\s*can\s*only)\b/i, intent: { type: 'rls', action: 'rls_policy', description: 'RLS policy', icon: Lock, color: 'text-amber-400' } },
];

/**
 * Detect Supabase-related intents from a user message.
 * Returns matched intents (deduplicated by type).
 */
export function detectSupabaseIntents(message: string): SupabaseIntent[] {
  const matched = new Map<string, SupabaseIntent>();
  for (const { pattern, intent } of INTENT_PATTERNS) {
    if (pattern.test(message) && !matched.has(intent.type)) {
      matched.set(intent.type, intent);
    }
  }
  return Array.from(matched.values());
}

/**
 * Build system context for the AI to handle Supabase operations conversationally.
 * This enriches the user prompt with backend-awareness so the AI generates
 * correct SQL, auth config, storage setup, and edge functions.
 */
export function buildSupabaseContext(intents: SupabaseIntent[], hasSupabase: boolean): string {
  if (intents.length === 0) return '';

  const sections: string[] = [];

  if (!hasSupabase) {
    sections.push('[BACKEND NOTE] No Supabase is connected yet. If this request needs a database, auth, or storage — include a note telling the user to connect Supabase in Settings first, then generate the UI code that will work once connected.');
    return sections.join('\n');
  }

  sections.push('[BACKEND CONTEXT] The user\'s request involves backend functionality. You should:');

  for (const intent of intents) {
    switch (intent.type) {
      case 'database':
        sections.push('- DATABASE: Generate the necessary SQL CREATE TABLE statements with proper columns, defaults, and types. Include RLS policies. Show the SQL in a code block labeled "sql" so the user can run it. Then generate the corresponding UI code that queries this table using the Supabase JS client.');
        break;
      case 'auth':
        sections.push('- AUTH: Generate authentication pages (login, signup, reset) using Supabase Auth. Use `supabase.auth.signInWithPassword()`, `signUp()`, `signInWithOAuth()` etc. Include proper session management with `onAuthStateChange`.');
        break;
      case 'storage':
        sections.push('- STORAGE: Generate SQL to create the storage bucket, set it public/private, and add RLS policies. Then generate UI code for file upload/download using `supabase.storage.from("bucket").upload()`.');
        break;
      case 'edge-function':
        sections.push('- EDGE FUNCTION: Generate a Deno edge function with proper CORS headers, error handling, and typed responses. Show the function code and the client-side invocation using `supabase.functions.invoke()`.');
        break;
      case 'rls':
        sections.push('- RLS: Generate Row Level Security policies that restrict data access appropriately. Use `auth.uid()` for user-scoped access. Show the SQL in a code block.');
        break;
    }
  }

  sections.push('\nIMPORTANT: Generate everything the user needs in one response — SQL migrations, UI components, and any edge functions. Be conversational and explain what each piece does.');

  return sections.join('\n');
}

/** Slash commands for Supabase operations */
export const SUPABASE_SLASH_COMMANDS = [
  { cmd: '/auth', desc: 'Set up authentication', icon: '🔐', prompt: 'Set up user authentication with login, signup, and password reset pages' },
  { cmd: '/database', desc: 'Create a database table', icon: '🗄️', prompt: 'I need a database table. What data should we store?' },
  { cmd: '/storage', desc: 'Set up file uploads', icon: '📁', prompt: 'Set up file upload functionality with a storage bucket' },
  { cmd: '/api', desc: 'Create an API endpoint', icon: '⚡', prompt: 'Create a serverless API endpoint (edge function)' },
  { cmd: '/rls', desc: 'Add security policies', icon: '🔒', prompt: 'Add row-level security policies to protect my data' },
  { cmd: '/users', desc: 'User profiles system', icon: '👥', prompt: 'Create a user profiles system with avatars, display names, and user settings' },
];

/**
 * Detect if the AI response contains SQL that should be highlighted.
 * Returns true if the response has SQL code blocks.
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
    // Try to extract a label from the comment or CREATE statement
    const labelMatch = sql.match(/--\s*(.+)/);
    const createMatch = sql.match(/CREATE\s+TABLE\s+(?:public\.)?(\w+)/i);
    const label = labelMatch?.[1] || (createMatch ? `Create ${createMatch[1]}` : 'SQL Migration');
    blocks.push({ sql, label });
  }
  return blocks;
}
