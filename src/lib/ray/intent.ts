/**
 * Ray Intent Engine — Wrayth 2.6.
 *
 * Parses a natural-language question, picks one or more internal "skills"
 * (Password, MFA, Exposure, Device, Timeline, Score, Recommendation), and
 * composes a single grounded answer from real data.
 *
 * Skills are intentionally NOT exposed in the UI. The user just asks Ray;
 * Ray decides what to look at.
 */
import { supabase } from '@/integrations/supabase/client';

export type AnswerTone = 'ok' | 'warn' | 'bad' | 'info';

export interface AnswerBullet {
  tone: AnswerTone;
  text: string;
}

export interface AnswerAction {
  label: string;
  href: string;
}

export interface RayAnswer {
  headline: string;
  bullets: AnswerBullet[];
  actions: AnswerAction[];
  skillsUsed: string[];
}

interface Intent {
  raw: string;
  target: string | null;
  topics: Set<Topic>;
}

type Topic =
  | 'secure' | 'mfa' | 'breach' | 'reuse' | 'weak' | 'passkey'
  | 'score' | 'change' | 'today' | 'overnight'
  | 'priority' | 'first' | 'device' | 'exposure' | 'identity'
  | 'list_no_mfa';

const KNOWN_TARGETS = [
  'gmail', 'google', 'microsoft', 'outlook', 'office', 'apple', 'icloud',
  'github', 'gitlab', 'facebook', 'instagram', 'twitter', 'x.com',
  'linkedin', 'dropbox', 'aws', 'amazon', 'paypal', 'stripe', 'slack',
  'notion', 'figma', 'discord', 'zoom', 'netflix', 'spotify', 'reddit',
  'bank', 'chase', 'wells', 'capital one', 'laptop', 'desktop', 'phone',
];

function parseIntent(raw: string): Intent {
  const lower = raw.toLowerCase();
  const topics = new Set<Topic>();
  const has = (...needles: string[]) => needles.some((n) => lower.includes(n));

  if (has('secure', 'safe', 'protected')) topics.add('secure');
  if (has('mfa', '2fa', 'two-factor', 'two factor', 'multi-factor', 'authenticator')) topics.add('mfa');
  if (has('breach', 'leaked', 'pwned', 'compromised')) topics.add('breach');
  if (has('reuse', 'reused', 'duplicate', 'same password')) topics.add('reuse');
  if (has('weak', 'strong')) topics.add('weak');
  if (has('passkey', 'passkeys', 'webauthn')) topics.add('passkey');
  if (has('score', 'rating', 'health')) topics.add('score');
  if (has('change', 'changed', 'different', 'why')) topics.add('change');
  if (has('today', 'now')) topics.add('today');
  if (has('overnight', 'last night', 'while i was')) topics.add('overnight');
  if (has('first', 'priority', 'next', 'most important', 'urgent')) topics.add('priority');
  if (has('which accounts', 'show me every', 'list', 'all accounts')) topics.add('list_no_mfa');
  if (has('device', 'laptop', 'desktop', 'phone', 'computer', 'mac', 'pc', 'checked in', 'check-in')) topics.add('device');
  if (has('exposure', 'exposed', 'dark web', 'leaked email')) topics.add('exposure');
  if (has('identity', 'identities', 'ssn', 'address')) topics.add('identity');

  let target: string | null = null;
  for (const t of KNOWN_TARGETS) {
    if (lower.includes(t)) { target = t; break; }
  }
  if (!target) {
    const m = raw.match(/\b(?:my|the)\s+([A-Za-z][\w.-]{2,})\b/);
    if (m && !['account', 'password', 'security', 'score'].includes(m[1].toLowerCase())) {
      target = m[1].toLowerCase();
    }
  }

  return { raw, target, topics };
}

function isQuestion(raw: string): boolean {
  const t = raw.trim();
  if (t.length < 3) return false;
  if (t.endsWith('?')) return true;
  const starters = /^(is|are|was|were|do|does|did|can|should|which|what|why|how|when|where|show|tell|list|find)\b/i;
  return starters.test(t) || t.split(/\s+/).length >= 3;
}

/* ---------------------------- skills ---------------------------- */

interface SkillCtx { userId: string; }

type PwdRow = {
  id: string;
  name: string;
  username: string | null;
  website: string | null;
  strength_score: number | null;
  updated_at: string;
};

async function loadPasswords(userId: string): Promise<PwdRow[]> {
  const { data } = await supabase
    .from('password_entries')
    .select('id,name,username,website,strength_score,updated_at')
    .eq('user_id', userId)
    .limit(500);
  return (data ?? []) as PwdRow[];
}

function matchTarget(row: { name?: string | null; username?: string | null; website?: string | null }, t: string): boolean {
  const n = t.toLowerCase();
  return [row.name, row.username, row.website].some((f) => (f ?? '').toLowerCase().includes(n));
}

async function passwordSkill(ctx: SkillCtx, intent: Intent): Promise<AnswerBullet[]> {
  const entries = await loadPasswords(ctx.userId);
  if (entries.length === 0) {
    return [{ tone: 'info', text: "No passwords saved yet, so there's nothing for me to grade." }];
  }

  // Targeted: "is my <target> secure?"
  if (intent.target) {
    const matches = entries.filter((e) => matchTarget(e, intent.target!));
    if (matches.length === 0) {
      return [{ tone: 'info', text: `I don't have a saved login matching "${intent.target}" yet.` }];
    }
    const e = matches[0];
    const score = e.strength_score ?? 0;
    const out: AnswerBullet[] = [];
    out.push({ tone: 'info', text: `I found your ${e.name} account.` });
    out.push({
      tone: score >= 80 ? 'ok' : score >= 60 ? 'warn' : 'bad',
      text: score >= 80 ? 'Strong password.' : score >= 60 ? 'Password could be stronger.' : 'Weak password — rotate it.',
    });
    if (e.updated_at) {
      const days = Math.round((Date.now() - new Date(e.updated_at).getTime()) / 86_400_000);
      out.push({ tone: 'info', text: `Last reviewed ${days <= 1 ? 'yesterday' : `${days} days ago`}.` });
    }
    return out;
  }

  // "Which accounts should I change first?"
  if (intent.topics.has('priority') || intent.topics.has('weak') || intent.topics.has('breach') || intent.topics.has('reuse')) {
    const ranked = entries
      .filter((e) => (e.strength_score ?? 100) < 70)
      .sort((a, b) => (a.strength_score ?? 0) - (b.strength_score ?? 0))
      .slice(0, 5);
    if (ranked.length === 0) return [{ tone: 'ok', text: 'No passwords need urgent attention right now.' }];
    return [
      { tone: 'warn', text: 'Change these first, in order:' },
      ...ranked.map((e) => ({
        tone: ((e.strength_score ?? 0) < 40 ? 'bad' : 'warn') as AnswerTone,
        text: `${e.name} — strength ${e.strength_score ?? 0}/100.`,
      })),
    ];
  }

  // Generic summary
  const weak = entries.filter((e) => (e.strength_score ?? 100) < 60).length;
  const out: AnswerBullet[] = [{ tone: 'info', text: `${entries.length} passwords saved.` }];
  if (weak > 0) out.push({ tone: 'warn', text: `${weak} are weak.` });
  if (weak === 0) out.push({ tone: 'ok', text: 'Nothing alarming.' });
  return out;
}

async function mfaSkill(ctx: SkillCtx, intent: Intent): Promise<AnswerBullet[]> {
  const { data } = await supabase
    .from('vault_totp_secrets')
    .select('id,service_name,service_domain,issuer')
    .eq('user_id', ctx.userId);
  type Totp = { id: string; service_name: string; service_domain: string | null; issuer: string | null };
  const totps = (data ?? []) as Totp[];

  if (intent.target) {
    const t = intent.target.toLowerCase();
    const hit = totps.find((x) =>
      [x.service_name, x.service_domain, x.issuer].some((f) => (f ?? '').toLowerCase().includes(t)),
    );
    return hit
      ? [{ tone: 'ok', text: `2FA is enabled on your ${hit.service_name}.` }]
      : [{ tone: 'warn', text: `Your ${intent.target} account doesn't have 2FA in Wrayth yet. Estimated fix time: 3 minutes.` }];
  }

  if (intent.topics.has('list_no_mfa')) {
    const pwds = await loadPasswords(ctx.userId);
    const labels = new Set(totps.flatMap((t) => [t.service_name, t.service_domain, t.issuer].filter(Boolean).map((s) => (s as string).toLowerCase())));
    const missing = pwds
      .filter((p) => ![...labels].some((l) => p.name.toLowerCase().includes(l) || l.includes(p.name.toLowerCase())))
      .slice(0, 6);
    if (missing.length === 0) return [{ tone: 'ok', text: 'Every saved account has 2FA in Wrayth.' }];
    return [
      { tone: 'warn', text: `${missing.length} accounts without 2FA:` },
      ...missing.map((p) => ({ tone: 'warn' as AnswerTone, text: p.name })),
    ];
  }

  return totps.length === 0
    ? [{ tone: 'warn', text: 'No 2FA secrets stored yet. I can help you set the first one up.' }]
    : [{ tone: 'ok', text: `${totps.length} 2FA secret${totps.length === 1 ? '' : 's'} in your vault.` }];
}

async function exposureSkill(ctx: SkillCtx, intent: Intent): Promise<AnswerBullet[]> {
  const { data } = await supabase
    .from('safeweb_threats')
    .select('title,severity,created_at')
    .eq('user_id', ctx.userId)
    .order('created_at', { ascending: false })
    .limit(5);
  const threats = (data ?? []) as Array<{ title: string; severity: string | null; created_at: string }>;
  if (threats.length === 0) return [{ tone: 'ok', text: 'No exposure findings on the dark web right now.' }];
  if (intent.target) {
    const hit = threats.find((t) => t.title.toLowerCase().includes(intent.target!.toLowerCase()));
    if (hit) return [{ tone: 'bad', text: `Exposure found: ${hit.title}.` }];
  }
  return [
    { tone: 'warn', text: `${threats.length} recent exposure finding${threats.length === 1 ? '' : 's'}.` },
    ...threats.slice(0, 3).map((t) => ({ tone: 'warn' as AnswerTone, text: t.title })),
  ];
}

async function deviceSkill(ctx: SkillCtx, _intent: Intent): Promise<AnswerBullet[]> {
  const { data } = await supabase
    .from('ray_timeline')
    .select('summary,occurred_at,event_type')
    .eq('user_id', ctx.userId)
    .ilike('event_type', '%device%')
    .order('occurred_at', { ascending: false })
    .limit(4);
  const events = (data ?? []) as Array<{ summary: string; occurred_at: string }>;
  if (events.length === 0) return [{ tone: 'info', text: 'No device activity reported recently.' }];
  return events.map((e) => {
    const mins = Math.round((Date.now() - new Date(e.occurred_at).getTime()) / 60_000);
    const when = mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.round(mins / 60)}h ago` : `${Math.round(mins / 1440)}d ago`;
    return { tone: 'info' as AnswerTone, text: `${e.summary} — ${when}.` };
  });
}

async function timelineSkill(ctx: SkillCtx, _intent: Intent): Promise<AnswerBullet[]> {
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { data } = await supabase
    .from('ray_timeline')
    .select('summary,occurred_at,severity')
    .eq('user_id', ctx.userId)
    .gte('occurred_at', since)
    .order('occurred_at', { ascending: false })
    .limit(6);
  const events = (data ?? []) as Array<{ summary: string; severity: string }>;
  if (events.length === 0) return [{ tone: 'ok', text: 'Quiet overnight — nothing changed worth flagging.' }];
  return events.map((e) => ({
    tone: (e.severity === 'high' || e.severity === 'critical' ? 'bad' : e.severity === 'medium' ? 'warn' : 'info') as AnswerTone,
    text: e.summary,
  }));
}

async function scoreSkill(ctx: SkillCtx, _intent: Intent): Promise<AnswerBullet[]> {
  const entries = await loadPasswords(ctx.userId);
  if (entries.length === 0) {
    return [{ tone: 'info', text: 'I need a few saved passwords before I can score you.' }];
  }
  const avg = Math.round(entries.reduce((a, e) => a + (e.strength_score ?? 0), 0) / entries.length);
  const weak = entries.filter((e) => (e.strength_score ?? 100) < 60).length;
  return [
    { tone: avg >= 80 ? 'ok' : avg >= 60 ? 'warn' : 'bad', text: `Average password strength is ${avg}/100.` },
    weak === 0
      ? { tone: 'ok', text: 'No deductions from weak passwords.' }
      : { tone: 'warn', text: `${weak} weak password${weak === 1 ? '' : 's'} are pulling your score down.` },
  ];
}

async function recommendationSkill(ctx: SkillCtx, _intent: Intent): Promise<AnswerBullet[]> {
  const { data } = await supabase
    .from('ray_recommendations')
    .select('title,priority,status')
    .eq('user_id', ctx.userId)
    .in('status', ['new', 'in_progress'])
    .order('priority', { ascending: false })
    .limit(4);
  const recs = (data ?? []) as Array<{ title: string }>;
  if (recs.length === 0) return [{ tone: 'ok', text: 'Nothing recommended right now.' }];
  return recs.map((r) => ({ tone: 'warn' as AnswerTone, text: r.title }));
}

/* ------------------------- orchestrator ------------------------- */

interface Plan { skills: string[]; }

function plan(intent: Intent): Plan {
  const s = new Set<string>();
  const has = (t: Topic) => intent.topics.has(t);

  if (has('secure') && intent.target) { s.add('passwords'); s.add('mfa'); s.add('exposure'); }
  if (has('mfa') || has('passkey')) s.add('mfa');
  if (has('list_no_mfa')) { s.add('mfa'); s.add('passwords'); }
  if (has('breach') || has('reuse') || has('weak') || has('priority') || has('first')) s.add('passwords');
  if (has('exposure')) s.add('exposure');
  if (has('device')) s.add('devices');
  if (has('today') || has('overnight') || has('change')) s.add('timeline');
  if (has('score')) { s.add('score'); s.add('recommendations'); s.add('timeline'); }

  if (s.size === 0 && intent.target) { s.add('passwords'); s.add('mfa'); }
  if (s.size === 0) { s.add('recommendations'); s.add('timeline'); }
  return { skills: Array.from(s) };
}

function pageFor(skill: string): string {
  switch (skill) {
    case 'passwords': return '/app/passwords';
    case 'mfa': return '/app/mfa';
    case 'exposure': return '/app/exposure';
    case 'devices': return '/app/devices';
    case 'timeline': return '/app/timeline';
    case 'score': return '/app/trends';
    case 'recommendations': return '/app/missions';
    default: return '/app/ray';
  }
}

function headlineFor(intent: Intent, skills: string[]): string {
  if (intent.target && skills.includes('passwords')) {
    return `Here's what I know about your ${intent.target} account.`;
  }
  if (intent.topics.has('priority') || intent.topics.has('first')) return "Here's where I'd start.";
  if (intent.topics.has('score')) return "Here's how I see your score.";
  if (intent.topics.has('today') || intent.topics.has('overnight') || intent.topics.has('change')) return "Here's what changed.";
  if (intent.topics.has('list_no_mfa')) return 'Accounts that still need 2FA:';
  return "Here's what I found.";
}

export async function askRay(userId: string, question: string): Promise<RayAnswer | null> {
  if (!userId || !isQuestion(question)) return null;

  // Organization intents take precedence when the user mentions company-level scope.
  try {
    const { isOrgQuestion, answerOrgQuestion } = await import('@/lib/ray/org/skills');
    if (isOrgQuestion(question)) {
      const orgAnswer = await answerOrgQuestion(userId, question);
      if (orgAnswer && orgAnswer.bullets.length) return orgAnswer;
    }
  } catch { /* fall through to personal skills */ }

  const intent = parseIntent(question);
  const { skills } = plan(intent);

  const ctx: SkillCtx = { userId };
  const runners: Record<string, () => Promise<AnswerBullet[]>> = {
    passwords: () => passwordSkill(ctx, intent),
    mfa: () => mfaSkill(ctx, intent),
    exposure: () => exposureSkill(ctx, intent),
    devices: () => deviceSkill(ctx, intent),
    timeline: () => timelineSkill(ctx, intent),
    score: () => scoreSkill(ctx, intent),
    recommendations: () => recommendationSkill(ctx, intent),
  };

  const results = await Promise.all(skills.map(async (s) => ({ s, bullets: await runners[s]().catch(() => []) })));
  const bullets = results.flatMap((r) => r.bullets);
  const actions: AnswerAction[] = skills.map((s) => ({ label: `Open ${s}`, href: pageFor(s) }));

  return {
    headline: headlineFor(intent, skills),
    bullets: bullets.slice(0, 8),
    actions,
    skillsUsed: skills,
  };
}

export const __testing = { parseIntent, plan, isQuestion };
