/**
 * Ray Intent Engine — Wrayth 2.6.
 *
 * Parses a natural-language question, picks one or more internal "skills"
 * (Password, Threat, Exposure, Identity, Device, Timeline, Score,
 * Recommendation), and composes a single grounded answer from real data.
 *
 * Skills are intentionally NOT exposed in the UI. The user just asks Ray;
 * Ray decides what to look at.
 */
import { supabase } from '@/integrations/supabase/client';
import { analyzePasswords } from './passwordIntelligence';
import { calculateScore } from './scoring';

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
  target: string | null;        // e.g. "gmail", "microsoft", "laptop"
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

  if (has('secure', 'safe', 'protected', 'ok?')) topics.add('secure');
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
  if (has('identity', 'name', 'address', 'ssn', 'identities')) topics.add('identity');

  let target: string | null = null;
  for (const t of KNOWN_TARGETS) {
    if (lower.includes(t)) { target = t; break; }
  }
  // Fallback: pick a capitalized noun as the target (e.g. "Is my Acme account secure?")
  if (!target) {
    const m = raw.match(/\b(?:my|the)\s+([A-Za-z][\w.-]{2,})\b/);
    if (m && !['account', 'password', 'security', 'score', 'gmail'].includes(m[1].toLowerCase())) {
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
  return starters.test(t) || /\s/.test(t.trim()); // any multi-word phrase counts
}

/* ---------------------------- skills ---------------------------- */

interface SkillCtx { userId: string; }

async function passwordSkill(ctx: SkillCtx, intent: Intent): Promise<AnswerBullet[]> {
  const { data } = await supabase
    .from('password_entries')
    .select('id,name,username,website,password_value,updated_at')
    .eq('user_id', ctx.userId)
    .limit(500);
  const entries = (data ?? []) as Array<{ id: string; name: string | null; username: string | null; website: string | null; password_value: string | null; updated_at: string | null }>;
  if (entries.length === 0) {
    return [{ tone: 'info', text: 'No passwords saved yet, so there\'s nothing for me to grade.' }];
  }
  const intel = analyzePasswords(entries.map((e) => ({ id: e.id, name: e.name, password: e.password_value, updated_at: e.updated_at })));

  // Targeted query: "is my <target> secure?"
  if (intent.target) {
    const t = intent.target.toLowerCase();
    const matches = entries.filter((e) =>
      [e.name, e.username, e.website].some((f) => (f ?? '').toLowerCase().includes(t)),
    );
    if (matches.length === 0) {
      return [{ tone: 'info', text: `I don't have a saved login matching "${intent.target}" yet.` }];
    }
    const e = matches[0];
    const pwd = e.password_value ?? '';
    const strong = pwd.length >= 12 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /\d/.test(pwd) && /[^A-Za-z0-9]/.test(pwd);
    const breached = intel.findings.some((f) => f.kind === 'breached' && f.entryId === e.id);
    const reused = intel.findings.some((f) => f.kind === 'reused' && f.entryId === e.id);
    const out: AnswerBullet[] = [];
    out.push({ tone: 'info', text: `I found your ${e.name ?? intent.target} account.` });
    out.push({ tone: strong ? 'ok' : 'warn', text: strong ? 'Strong password.' : 'Password could be stronger.' });
    out.push({ tone: breached ? 'bad' : 'ok', text: breached ? 'Appears in a known breach — rotate it.' : 'No known breaches.' });
    if (reused) out.push({ tone: 'warn', text: 'You\'ve reused this password elsewhere.' });
    if (e.updated_at) {
      const days = Math.round((Date.now() - new Date(e.updated_at).getTime()) / 86_400_000);
      out.push({ tone: 'info', text: `Last reviewed ${days <= 1 ? 'yesterday' : `${days} days ago`}.` });
    }
    return out;
  }

  // "Which accounts should I change first?" — rank by severity
  if (intent.topics.has('priority') || intent.topics.has('list_no_mfa') || intent.topics.has('reuse') || intent.topics.has('weak') || intent.topics.has('breach')) {
    const ranked = entries
      .map((e) => {
        const breached = intel.findings.some((f) => f.kind === 'breached' && f.entryId === e.id) ? 100 : 0;
        const reused = intel.findings.some((f) => f.kind === 'reused' && f.entryId === e.id) ? 30 : 0;
        const pwd = e.password_value ?? '';
        const weak = pwd.length > 0 && pwd.length < 10 ? 20 : 0;
        return { e, score: breached + reused + weak };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    if (ranked.length === 0) {
      return [{ tone: 'ok', text: 'No passwords need urgent attention right now.' }];
    }
    return [
      { tone: 'warn', text: 'Change these first, in order:' },
      ...ranked.map(({ e, score }) => ({
        tone: (score >= 100 ? 'bad' : 'warn') as AnswerTone,
        text: `${e.name ?? e.username ?? 'Untitled'} — ${score >= 100 ? 'breached' : score >= 30 ? 'reused' : 'weak'}.`,
      })),
    ];
  }

  // Generic summary
  const out: AnswerBullet[] = [];
  out.push({ tone: 'info', text: `${entries.length} passwords saved.` });
  if (intel.findings.some((f) => f.kind === 'breached')) {
    const n = intel.findings.filter((f) => f.kind === 'breached').length;
    out.push({ tone: 'bad', text: `${n} appear in known breaches.` });
  }
  if (intel.weak > 0) out.push({ tone: 'warn', text: `${intel.weak} weak.` });
  if (intel.reusedCount > 0) out.push({ tone: 'warn', text: `${intel.reusedCount} reused.` });
  if (out.length === 1) out.push({ tone: 'ok', text: 'Nothing alarming.' });
  return out;
}

async function mfaSkill(ctx: SkillCtx, intent: Intent): Promise<AnswerBullet[]> {
  const { data } = await supabase
    .from('vault_totp_secrets')
    .select('id,label')
    .eq('user_id', ctx.userId);
  const totps = (data ?? []) as Array<{ id: string; label: string | null }>;

  if (intent.target) {
    const t = intent.target.toLowerCase();
    const hit = totps.find((x) => (x.label ?? '').toLowerCase().includes(t));
    return hit
      ? [{ tone: 'ok', text: `2FA is enabled on your ${hit.label}.` }]
      : [{ tone: 'warn', text: `Your ${intent.target} account doesn't have 2FA in Wrayth yet. Estimated fix time: 3 minutes.` }];
  }

  if (intent.topics.has('list_no_mfa')) {
    // Cross-reference: passwords without a matching TOTP label
    const { data: pwds } = await supabase
      .from('password_entries')
      .select('name')
      .eq('user_id', ctx.userId)
      .limit(200);
    const labels = new Set(totps.map((t) => (t.label ?? '').toLowerCase()));
    const missing = (pwds ?? [])
      .map((p) => p.name)
      .filter((n): n is string => !!n && !labels.has(n.toLowerCase()))
      .slice(0, 6);
    if (missing.length === 0) return [{ tone: 'ok', text: 'Every saved account has 2FA in Wrayth.' }];
    return [
      { tone: 'warn', text: `${missing.length} accounts without 2FA:` },
      ...missing.map((n) => ({ tone: 'warn' as AnswerTone, text: n })),
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
  // We don't have a per-user devices table; surface recent device-related timeline events.
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
  const { data } = await supabase
    .from('password_entries')
    .select('id,name,password_value,updated_at')
    .eq('user_id', ctx.userId)
    .limit(500);
  const entries = (data ?? []) as Array<{ id: string; name: string | null; password_value: string | null; updated_at: string | null }>;
  const intel = analyzePasswords(entries.map((e) => ({ id: e.id, name: e.name, password: e.password_value, updated_at: e.updated_at })));
  const { score, factors } = calculateScore(intel);
  const top = factors.filter((f) => f.delta < 0).slice(0, 3);
  return [
    { tone: score >= 90 ? 'ok' : score >= 70 ? 'warn' : 'bad', text: `Your score is ${score}.` },
    ...(top.length === 0
      ? [{ tone: 'ok' as AnswerTone, text: 'No deductions — everything I checked is healthy.' }]
      : top.map((f) => ({ tone: 'warn' as AnswerTone, text: `${f.label} (${f.delta}).` }))),
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
  const recs = (data ?? []) as Array<{ title: string; priority: number }>;
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

  // Default fallback: if it's a question about a specific target, run passwords + mfa.
  if (s.size === 0 && intent.target) { s.add('passwords'); s.add('mfa'); }
  // Otherwise show the briefing trio.
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
  if (intent.target && skills.includes('passwords') && skills.includes('mfa')) {
    return `Here's what I know about your ${intent.target} account.`;
  }
  if (intent.topics.has('priority') || intent.topics.has('first')) return 'Here\'s where I\'d start.';
  if (intent.topics.has('score')) return 'Here\'s how I calculated that score.';
  if (intent.topics.has('today') || intent.topics.has('overnight') || intent.topics.has('change')) return 'Here\'s what changed.';
  if (intent.topics.has('list_no_mfa')) return 'Accounts that still need 2FA:';
  return 'Here\'s what I found.';
}

export async function askRay(userId: string, question: string): Promise<RayAnswer | null> {
  if (!userId || !isQuestion(question)) return null;
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

// Exposed for ergonomics in callers that want to know "is this a question?"
export const __testing = { parseIntent, plan, isQuestion };
