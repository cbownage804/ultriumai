import { useState, useCallback } from 'react';
import { Database, Shield, FolderOpen, Zap, Server, ChevronRight, Check, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { detectSupabaseIntents, type SupabaseIntent } from './SupabaseConversational';

export interface BackendPlan {
  tables: { name: string; columns: string[]; hasRLS: boolean }[];
  authRequired: boolean;
  authMethods: string[];
  storageBuckets: string[];
  edgeFunctions: string[];
  rlsPolicies: string[];
}

interface BackendAutoDetectorProps {
  prompt: string;
  hasSupabase: boolean;
  onApplyPlan: (plan: BackendPlan) => void;
  onDismiss: () => void;
}

/** Infer table schemas from natural language prompt */
function inferTables(prompt: string): BackendPlan['tables'] {
  const tables: BackendPlan['tables'] = [];
  const lower = prompt.toLowerCase();

  const tablePatterns: [RegExp, string, string[]][] = [
    [/\b(task|todo|to-do)\b/i, 'tasks', ['id uuid PK', 'user_id uuid FK', 'title text', 'description text', 'status text DEFAULT \'pending\'', 'due_date timestamptz', 'created_at timestamptz DEFAULT now()']],
    [/\b(blog|post|article)\b/i, 'posts', ['id uuid PK', 'user_id uuid FK', 'title text', 'content text', 'slug text UNIQUE', 'published boolean DEFAULT false', 'created_at timestamptz DEFAULT now()']],
    [/\b(product|item|inventory)\b/i, 'products', ['id uuid PK', 'name text', 'description text', 'price numeric', 'image_url text', 'stock integer DEFAULT 0', 'created_at timestamptz DEFAULT now()']],
    [/\b(order|purchase|checkout)\b/i, 'orders', ['id uuid PK', 'user_id uuid FK', 'total numeric', 'status text DEFAULT \'pending\'', 'created_at timestamptz DEFAULT now()']],
    [/\b(team|workspace|organization)\b/i, 'teams', ['id uuid PK', 'name text', 'owner_id uuid FK', 'created_at timestamptz DEFAULT now()']],
    [/\b(member|assignment)\b/i, 'team_members', ['id uuid PK', 'team_id uuid FK', 'user_id uuid FK', 'role text DEFAULT \'member\'', 'joined_at timestamptz DEFAULT now()']],
    [/\b(comment|review|feedback)\b/i, 'comments', ['id uuid PK', 'user_id uuid FK', 'content text', 'parent_id uuid', 'created_at timestamptz DEFAULT now()']],
    [/\b(message|chat|conversation)\b/i, 'messages', ['id uuid PK', 'sender_id uuid FK', 'channel_id uuid', 'content text', 'created_at timestamptz DEFAULT now()']],
    [/\b(bookmark|favorite|like)\b/i, 'favorites', ['id uuid PK', 'user_id uuid FK', 'target_id uuid', 'target_type text', 'created_at timestamptz DEFAULT now()']],
    [/\b(notification|alert)\b/i, 'notifications', ['id uuid PK', 'user_id uuid FK', 'title text', 'body text', 'read boolean DEFAULT false', 'created_at timestamptz DEFAULT now()']],
    [/\b(event|calendar|schedule)\b/i, 'events', ['id uuid PK', 'user_id uuid FK', 'title text', 'starts_at timestamptz', 'ends_at timestamptz', 'location text', 'created_at timestamptz DEFAULT now()']],
    [/\b(project)\b/i, 'projects', ['id uuid PK', 'user_id uuid FK', 'name text', 'description text', 'status text DEFAULT \'active\'', 'created_at timestamptz DEFAULT now()']],
  ];

  for (const [pattern, name, columns] of tablePatterns) {
    if (pattern.test(lower)) {
      tables.push({ name, columns, hasRLS: true });
    }
  }

  // Always add profiles if auth is detected
  if (/\b(user|account|profile|auth|login|sign\s*up)\b/i.test(lower)) {
    if (!tables.find(t => t.name === 'profiles')) {
      tables.push({ name: 'profiles', columns: ['id uuid PK', 'user_id uuid FK UNIQUE', 'display_name text', 'avatar_url text', 'created_at timestamptz DEFAULT now()'], hasRLS: true });
    }
  }

  return tables;
}

/** Detect what backend capabilities the prompt requires */
export function analyzeBackendNeeds(prompt: string): BackendPlan {
  const intents = detectSupabaseIntents(prompt);
  const lower = prompt.toLowerCase();

  const tables = inferTables(prompt);
  const authRequired = intents.some(i => i.type === 'auth') || /\b(user|account|login|sign\s*up|auth)\b/i.test(lower);
  const authMethods: string[] = [];
  if (/\b(google|github|oauth|social)\b/i.test(lower)) authMethods.push('oauth');
  if (/\b(magic\s*link|passwordless)\b/i.test(lower)) authMethods.push('magic_link');
  if (authRequired && authMethods.length === 0) authMethods.push('email_password');

  const storageBuckets: string[] = [];
  if (/\b(avatar|profile\s*pic|photo)\b/i.test(lower)) storageBuckets.push('avatars');
  if (/\b(upload|attachment|file|document|media)\b/i.test(lower)) storageBuckets.push('uploads');
  if (/\b(image|photo|gallery|banner)\b/i.test(lower)) storageBuckets.push('images');

  const edgeFunctions: string[] = [];
  if (/\b(email|notification|notify)\b/i.test(lower)) edgeFunctions.push('send-notification');
  if (/\b(stripe|payment|checkout)\b/i.test(lower)) edgeFunctions.push('create-checkout');
  if (/\b(webhook)\b/i.test(lower)) edgeFunctions.push('webhook-handler');
  if (/\b(ai|gpt|llm|chat\s*bot)\b/i.test(lower)) edgeFunctions.push('ai-chat');

  const rlsPolicies = tables.filter(t => t.hasRLS).map(t => `Users can CRUD their own ${t.name}`);

  return { tables, authRequired, authMethods, storageBuckets, edgeFunctions, rlsPolicies };
}

const CATEGORY_ICONS = {
  database: Database,
  auth: Shield,
  storage: FolderOpen,
  edge: Zap,
};

export function BackendAutoDetector({ prompt, hasSupabase, onApplyPlan, onDismiss }: BackendAutoDetectorProps) {
  const [plan] = useState(() => analyzeBackendNeeds(prompt));
  const [applied, setApplied] = useState(false);

  const handleApply = useCallback(() => {
    onApplyPlan(plan);
    setApplied(true);
  }, [plan, onApplyPlan]);

  const isEmpty = plan.tables.length === 0 && !plan.authRequired && plan.storageBuckets.length === 0 && plan.edgeFunctions.length === 0;

  if (isEmpty) return null;

  return (
    <div className="mx-3 my-2 rounded-xl border border-violet-500/20 bg-violet-500/[0.04] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-violet-500/10">
        <div className="flex items-center gap-2">
          <Server className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-xs font-semibold text-violet-300">Full-Stack Plan Detected</span>
        </div>
        {!hasSupabase && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium flex items-center gap-1">
            <AlertTriangle className="h-2.5 w-2.5" />
            Connect Supabase first
          </span>
        )}
      </div>

      <div className="p-3 space-y-2">
        {/* Tables */}
        {plan.tables.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-medium uppercase tracking-wider">
              <Database className="h-3 w-3 text-emerald-400" />
              Tables ({plan.tables.length})
            </div>
            {plan.tables.map(t => (
              <div key={t.name} className="flex items-center gap-1.5 text-xs text-white/60 pl-4">
                <ChevronRight className="h-2.5 w-2.5 text-white/20" />
                <span className="font-mono text-emerald-400/70">{t.name}</span>
                <span className="text-[9px] text-white/25">({t.columns.length} cols)</span>
                {t.hasRLS && <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-400/60">RLS</span>}
              </div>
            ))}
          </div>
        )}

        {/* Auth */}
        {plan.authRequired && (
          <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-medium">
            <Shield className="h-3 w-3 text-violet-400" />
            <span className="uppercase tracking-wider">Auth</span>
            <span className="text-white/30 normal-case">— {plan.authMethods.join(', ')}</span>
          </div>
        )}

        {/* Storage */}
        {plan.storageBuckets.length > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-medium">
            <FolderOpen className="h-3 w-3 text-cyan-400" />
            <span className="uppercase tracking-wider">Storage</span>
            <span className="text-white/30 normal-case">— {plan.storageBuckets.join(', ')}</span>
          </div>
        )}

        {/* Edge Functions */}
        {plan.edgeFunctions.length > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-medium">
            <Zap className="h-3 w-3 text-amber-400" />
            <span className="uppercase tracking-wider">Edge Functions</span>
            <span className="text-white/30 normal-case">— {plan.edgeFunctions.join(', ')}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 px-3 py-2 border-t border-white/[0.04]">
        <button
          onClick={handleApply}
          disabled={applied || !hasSupabase}
          className={cn(
            "flex-1 h-7 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1.5",
            applied
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : hasSupabase
              ? "bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 border border-violet-500/20"
              : "bg-white/5 text-white/20 cursor-not-allowed border border-white/[0.06]"
          )}
        >
          {applied ? <><Check className="h-3 w-3" /> Plan Applied</> : 'Generate Full Stack'}
        </button>
        <button
          onClick={onDismiss}
          className="h-7 px-3 rounded-lg text-[11px] text-white/30 hover:text-white/50 hover:bg-white/5 transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
