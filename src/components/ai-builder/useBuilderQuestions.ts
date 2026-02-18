import { useState, useCallback } from 'react';
import type { Question, QuestionAnswers } from './QuestionsCard';

export interface PendingQuestions {
  id: string;
  questions: Question[];
  context: string;
}

export function useBuilderQuestions() {
  const [pending, setPending] = useState<PendingQuestions | null>(null);

  const analyzeForQuestions = useCallback((prompt: string): PendingQuestions | null => {
    const questions = generateQuestions(prompt);
    if (questions.length === 0) return null;

    const pq: PendingQuestions = {
      id: crypto.randomUUID(),
      questions,
      context: prompt,
    };
    setPending(pq);
    return pq;
  }, []);

  const dismiss = useCallback(() => setPending(null), []);

  const buildEnrichedPrompt = useCallback((original: string, answers: QuestionAnswers): string => {
    const parts: string[] = [original, '\n\n--- User Preferences ---'];
    for (const [qid, qa] of Object.entries(answers)) {
      if (qa.selected.length > 0) {
        parts.push(`• ${qid}: ${qa.selected.join(', ')}`);
      }
      if (qa.otherText?.trim()) {
        parts.push(`  (additional: ${qa.otherText.trim()})`);
      }
    }
    setPending(null);
    return parts.join('\n');
  }, []);

  return { pending, analyzeForQuestions, dismiss, buildEnrichedPrompt };
}

// ═══════════════════════════════════════════════════════════
// INTELLIGENT QUESTION GENERATION
// Lovable-style: only ask when there's genuine ambiguity,
// missing decisions, or competing valid approaches.
// ═══════════════════════════════════════════════════════════

interface Signal {
  id: string;
  confidence: number; // 0–1: how certain we are this question is needed
  question: Question;
}

function generateQuestions(prompt: string): Question[] {
  const lower = prompt.toLowerCase();
  const len = prompt.length;
  const lines = prompt.split('\n').filter(l => l.trim());
  const wordCount = prompt.split(/\s+/).length;

  // ── Gate: Don't ask questions for simple/short prompts ──
  // Short prompts are clear enough. Only ask for substantial, ambiguous ones.
  if (len < 800 || wordCount < 100) return [];

  // If the user already gave very specific instructions (detailed spec),
  // don't bombard them with questions they already answered.
  const signals: Signal[] = [];

  // ── 1. AUTH AMBIGUITY ──
  // Only ask if auth is mentioned but the METHOD isn't specified
  const mentionsAuth = /\b(auth|login|sign.?up|register|user.?account|permission|role.?based|rbac|access.?control)\b/i.test(prompt);
  const authMethodSpecified = /\b(oauth|social.?login|magic.?link|email.?password|passwordless|sso|saml|api.?key|jwt|supabase.?auth|google.?sign|github.?sign)\b/i.test(prompt);

  if (mentionsAuth && !authMethodSpecified) {
    signals.push({
      id: 'auth_method',
      confidence: 0.85,
      question: {
        id: 'auth_method',
        header: 'Authentication',
        question: 'How should users sign in?',
        multiSelect: true,
        allowOther: true,
        options: [
          { label: 'Email & Password', description: 'Classic login form with Supabase Auth' },
          { label: 'Google / Social OAuth', description: 'One-click sign in with Google, GitHub, etc.' },
          { label: 'Magic Link (email)', description: 'Passwordless — users click a link to sign in' },
          { label: 'No auth needed', description: 'Public app, no user accounts required' },
        ],
      },
    });
  }

  // ── 2. DATA LAYER AMBIGUITY ──
  // Ask if the prompt implies data but doesn't specify HOW to store it
  const mentionsData = /\b(data|store|save|database|table|record|crud|list|manage|track|inventory|catalog)\b/i.test(prompt);
  const dataLayerSpecified = /\b(supabase|postgres|firebase|mongo|local.?storage|indexeddb|mock|demo.?data|json|sqlite)\b/i.test(prompt);
  const mentionsMultipleEntities = (prompt.match(/\b(users?|products?|orders?|items?|messages?|posts?|tasks?|projects?|teams?|organizations?|clients?|invoices?|tickets?)\b/gi) || []).length >= 3;

  if (mentionsData && !dataLayerSpecified && mentionsMultipleEntities) {
    signals.push({
      id: 'data_approach',
      confidence: 0.8,
      question: {
        id: 'data_approach',
        header: 'Data layer',
        question: 'How should data be stored and managed?',
        multiSelect: false,
        allowOther: true,
        options: [
          { label: 'Full backend (Supabase)', description: 'Postgres DB with auth, RLS, and real-time sync' },
          { label: 'Prototype mode', description: 'localStorage + mock data — fast to build, no backend' },
          { label: 'API integration', description: 'Connect to an existing backend or third-party API' },
        ],
      },
    });
  }

  // ── 3. DESIGN DIRECTION ──
  // Only ask if the prompt describes a complex UI but doesn't specify aesthetics
  const mentionsUI = /\b(dashboard|admin|portal|console|panel|landing|page|interface|layout|screen)\b/i.test(prompt);
  const designSpecified = /\b(dark.?mode|light.?mode|minimalist|modern|brutalist|glassmorphism|neumorphism|material|tailwind|shadcn|corporate|colorful|neon|gradient)\b/i.test(prompt);
  const hasColorSpec = /\b(blue|red|green|purple|orange|#[0-9a-f]{3,6}|hsl|rgb|black.?and|white.?and)\b/i.test(prompt);

  if (mentionsUI && !designSpecified && !hasColorSpec && wordCount > 80) {
    signals.push({
      id: 'design_style',
      confidence: 0.65,
      question: {
        id: 'design_style',
        header: 'Design',
        question: 'What visual style fits this project?',
        multiSelect: false,
        allowOther: true,
        options: [
          { label: 'Dark & sleek', description: 'Dark backgrounds, subtle borders, modern SaaS look' },
          { label: 'Light & clean', description: 'White backgrounds, lots of whitespace, minimal' },
          { label: 'Bold & branded', description: 'Strong colors, distinctive typography, personality' },
          { label: 'Match a reference', description: "I'll provide a screenshot or URL to match" },
        ],
      },
    });
  }

  // ── 4. SCOPE / PRIORITY ──
  // Only for very large, multi-feature prompts where ordering matters
  const featureIndicators = (prompt.match(/\b(feature|module|section|component|page|functionality|capability|system|engine|service)\b/gi) || []).length;
  const hasMVPMention = /\b(mvp|v1|phase.?1|first.?version|prototype|minimum.?viable)\b/i.test(prompt);

  if (len > 1200 && featureIndicators >= 5 && !hasMVPMention) {
    signals.push({
      id: 'scope_priority',
      confidence: 0.75,
      question: {
        id: 'scope_priority',
        header: 'Priority',
        question: 'What should be built first?',
        multiSelect: true,
        allowOther: true,
        options: [
          { label: 'Core logic & data', description: 'Database, business rules, and APIs first' },
          { label: 'User-facing UI', description: 'Pages, layouts, and interactive components first' },
          { label: 'Auth & permissions', description: 'User management and access controls first' },
          { label: 'Equal priority', description: 'Build everything together, phase by phase' },
        ],
      },
    });
  }

  // ── 5. MULTI-TENANT / ORG AMBIGUITY ──
  const mentionsMultiTenant = /\b(multi.?tenant|saas|org|organization|workspace|team|company|tenant|white.?label|msp)\b/i.test(prompt);
  const tenantModelSpecified = /\b(row.?level|rls|schema.?per|database.?per|shared.?database|isolated)\b/i.test(prompt);

  if (mentionsMultiTenant && !tenantModelSpecified) {
    signals.push({
      id: 'tenant_model',
      confidence: 0.9,
      question: {
        id: 'tenant_model',
        header: 'Multi-tenancy',
        question: 'How should tenant isolation work?',
        multiSelect: false,
        allowOther: true,
        options: [
          { label: 'Shared DB with RLS', description: 'One database, row-level security per org (recommended)' },
          { label: 'Org-based access', description: 'Simple org_id column filtering without strict RLS' },
          { label: 'Separate schemas', description: 'Each tenant gets their own database schema' },
        ],
      },
    });
  }

  // ── 6. THIRD-PARTY INTEGRATION AMBIGUITY ──
  const mentionsIntegration = /\b(integrat|connect|api|webhook|microsoft|google|slack|stripe|twilio|sendgrid|zapier|graph.?api)\b/i.test(prompt);
  const integrationSpecified = /\b(api.?key|oauth.?token|webhook.?url|client.?id|client.?secret|bearer|endpoint)\b/i.test(prompt);

  if (mentionsIntegration && !integrationSpecified && len > 800) {
    signals.push({
      id: 'integration_approach',
      confidence: 0.7,
      question: {
        id: 'integration_approach',
        header: 'Integrations',
        question: 'How should external integrations be handled?',
        multiSelect: false,
        allowOther: true,
        options: [
          { label: 'Real API connections', description: 'Build actual API calls — I have credentials ready' },
          { label: 'Mock / simulated', description: 'Simulate API responses for now, connect later' },
          { label: 'Edge functions', description: 'Server-side proxy via Supabase Edge Functions' },
        ],
      },
    });
  }

  // ── 7. REALTIME NEEDS ──
  const mentionsRealtime = /\b(real.?time|live|chat|notification|push|socket|stream|collab|presence)\b/i.test(prompt);
  const realtimeSpecified = /\b(supabase.?realtime|websocket|sse|server.?sent|polling|firebase.?realtime)\b/i.test(prompt);

  if (mentionsRealtime && !realtimeSpecified) {
    signals.push({
      id: 'realtime_approach',
      confidence: 0.6,
      question: {
        id: 'realtime_approach',
        header: 'Real-time',
        question: 'How should real-time features work?',
        multiSelect: false,
        allowOther: true,
        options: [
          { label: 'Supabase Realtime', description: 'Built-in real-time subscriptions (recommended)' },
          { label: 'Polling', description: 'Periodic refresh — simpler but less instant' },
          { label: 'Not needed yet', description: 'Skip real-time for now, add it later' },
        ],
      },
    });
  }

  // ── RANKING: Only return high-confidence, non-redundant questions ──
  // Sort by confidence, take top 3 max
  const ranked = signals
    .filter(s => s.confidence >= 0.6)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);

  // Final gate: if only 1 low-confidence question, skip entirely
  if (ranked.length === 1 && ranked[0].confidence < 0.75) return [];

  return ranked.map(s => s.question);
}
