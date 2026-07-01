import { devLog } from '@/lib/logger';
/**
 * Ray Notices — Wrayth 2.7 predictive layer.
 *
 * Ray quietly watches signals (score movement, unresolved recommendations,
 * repeated questions, recent timeline events) and prepares short, useful
 * notices before the user has to ask. Notices are upserted by a stable
 * `dedupe_key` so the same signal never piles up.
 *
 * We deliberately cap displayed notices to the highest-value 1–3 so the
 * experience stays calm. Everything else is computed but kept invisible
 * until it becomes the top signal.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type RayNoticeStatus = 'open' | 'snoozed' | 'dismissed' | 'resolved';
export type RayNoticeKind =
  | 'score_drop'
  | 'score_rise'
  | 'stale_recommendation'
  | 'repeated_question'
  | 'new_exposure'
  | 'critical_threat'
  | 'mfa_gap'
  | 'streak';

export type RayNoticeActionTone = 'primary' | 'neutral' | 'warn';
export type RayNoticeAction = { label: string; href: string; tone?: RayNoticeActionTone };

export type RayNoticePreparedAnswer = {
  headline: string;
  bullets: string[];
  actions?: RayNoticeAction[];
};

export type RayNotice = {
  id: string;
  user_id: string;
  kind: RayNoticeKind | string;
  title: string;
  body: string | null;
  prepared_answer: RayNoticePreparedAnswer | null;
  entity_kind: string | null;
  entity_id: string | null;
  priority: number;
  confidence: number;
  status: RayNoticeStatus;
  snoozed_until: string | null;
  source_signal: string | null;
  dedupe_key: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

type NoticeSeed = {
  kind: RayNoticeKind;
  title: string;
  body?: string;
  prepared_answer?: RayNoticePreparedAnswer;
  entity_kind?: string;
  entity_id?: string;
  priority: number;
  confidence: number;
  source_signal: string;
  dedupe_key: string;
  metadata?: Record<string, unknown>;
};

/* ---------------------------------------------------------------- writers */

async function upsertNotice(userId: string, seed: NoticeSeed): Promise<void> {
  // Don't resurrect notices the user already dismissed/resolved.
  const { data: existing } = await supabase
    .from('ray_notices')
    .select('id,status,snoozed_until')
    .eq('user_id', userId)
    .eq('dedupe_key', seed.dedupe_key)
    .maybeSingle();

  if (existing) {
    if (existing.status === 'dismissed' || existing.status === 'resolved') return;
    await supabase
      .from('ray_notices')
      .update({
        title: seed.title,
        body: seed.body ?? null,
        prepared_answer: (seed.prepared_answer ?? null) as never,
        priority: seed.priority,
        confidence: seed.confidence,
        metadata: (seed.metadata ?? {}) as never,
      })
      .eq('id', existing.id);
    return;
  }

  await supabase.from('ray_notices').insert([
    {
      user_id: userId,
      kind: seed.kind,
      title: seed.title,
      body: seed.body ?? null,
      prepared_answer: (seed.prepared_answer ?? null) as never,
      entity_kind: seed.entity_kind ?? null,
      entity_id: seed.entity_id ?? null,
      priority: seed.priority,
      confidence: seed.confidence,
      source_signal: seed.source_signal,
      dedupe_key: seed.dedupe_key,
      metadata: (seed.metadata ?? {}) as never,
    },
  ]);
}

export async function snoozeNotice(id: string, hours = 24): Promise<void> {
  const until = new Date(Date.now() + Math.max(1, hours) * 3600_000).toISOString();
  await supabase
    .from('ray_notices')
    .update({ status: 'snoozed', snoozed_until: until })
    .eq('id', id);
}

export async function dismissNotice(id: string): Promise<void> {
  await supabase
    .from('ray_notices')
    .update({ status: 'dismissed', snoozed_until: null })
    .eq('id', id);
}

export async function resolveNotice(id: string): Promise<void> {
  await supabase
    .from('ray_notices')
    .update({ status: 'resolved', resolved_at: new Date().toISOString(), snoozed_until: null })
    .eq('id', id);
}

/** Lightweight signal — used by AskRay to detect repeated questions. */
export async function recordAskedQuestion(userId: string, question: string): Promise<void> {
  const trimmed = question.trim();
  if (trimmed.length < 3) return;
  await supabase.from('ray_timeline').insert([
    {
      user_id: userId,
      event_type: 'ray_question',
      summary: trimmed.slice(0, 280),
      payload: { normalized: normalizeQuestion(trimmed) } as never,
      severity: 'info',
    },
  ]);
}

function normalizeQuestion(q: string): string {
  return q.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/* ---------------------------------------------------------------- engine */

type Brief = {
  id: string;
  brief_date: string;
  score: number | null;
  score_delta: number | null;
  stats: Record<string, unknown> | null;
};

type RecRow = {
  id: string;
  title: string;
  body: string | null;
  priority: number | null;
  status: string | null;
  created_at: string;
  page_context: string | null;
};

type TimelineRow = {
  event_type: string;
  summary: string;
  payload: Record<string, unknown> | null;
  severity: string | null;
  occurred_at: string;
};

const PAGE_HREF: Record<string, string> = {
  passwords: '/app/passwords',
  threats: '/app/threats',
  exposure: '/app/exposure',
  identity: '/app/identity',
  devices: '/app/devices',
  reports: '/app/timeline',
};

function hrefFor(area?: string | null): string {
  return (area && PAGE_HREF[area]) || '/app/ray';
}

/**
 * Read recent signals and prepare notices. Idempotent via dedupe_key.
 * Runs client-side so it's cheap and reactive; the database is the
 * source of truth for status.
 */
export async function synthesizeNotices(userId: string): Promise<void> {
  const since = new Date(Date.now() - 14 * 24 * 3600_000).toISOString();
  const [briefsRes, recsRes, timelineRes] = await Promise.all([
    supabase
      .from('ray_briefs')
      .select('id,brief_date,score,score_delta,stats')
      .eq('user_id', userId)
      .order('brief_date', { ascending: false })
      .limit(7),
    supabase
      .from('ray_recommendations')
      .select('id,title,body,priority,status,created_at,page_context')
      .eq('user_id', userId)
      .is('dismissed_at', null)
      .is('completed_at', null)
      .or(`snoozed_until.is.null,snoozed_until.lt.${new Date().toISOString()}`)
      .order('priority', { ascending: false })
      .limit(25),
    supabase
      .from('ray_timeline')
      .select('event_type,summary,payload,severity,occurred_at')
      .eq('user_id', userId)
      .gte('occurred_at', since)
      .order('occurred_at', { ascending: false })
      .limit(120),
  ]);

  const briefs = (briefsRes.data ?? []) as Brief[];
  const recs = (recsRes.data ?? []) as RecRow[];
  const timeline = (timelineRes.data ?? []) as TimelineRow[];

  /* 1) Score movement */
  const latest = briefs[0];
  if (latest && typeof latest.score === 'number' && typeof latest.score_delta === 'number') {
    if (latest.score_delta <= -5) {
      await upsertNotice(userId, {
        kind: 'score_drop',
        title: `Your score dropped ${Math.abs(latest.score_delta)} points`,
        body: "I noticed your security score moved down. I've prepared what changed and where to look first.",
        prepared_answer: {
          headline: `Score is now ${latest.score}. Here's what changed.`,
          bullets: buildScoreDeltaBullets(briefs),
          actions: [{ label: 'Open today\'s brief', href: '/app/brief', tone: 'primary' }],
        },
        priority: 80,
        confidence: 0.9,
        source_signal: 'morning_brief.delta',
        dedupe_key: `score_drop:${latest.brief_date}`,
      });
    } else if (latest.score_delta >= 5) {
      await upsertNotice(userId, {
        kind: 'score_rise',
        title: `Your score climbed +${latest.score_delta}`,
        body: 'Nice work. I prepared a short summary of what moved.',
        prepared_answer: {
          headline: `Score is ${latest.score}, up ${latest.score_delta}.`,
          bullets: buildScoreDeltaBullets(briefs),
          actions: [{ label: 'See today\'s brief', href: '/app/brief' }],
        },
        priority: 35,
        confidence: 0.85,
        source_signal: 'morning_brief.delta',
        dedupe_key: `score_rise:${latest.brief_date}`,
      });
    }
  }

  /* 2) Stale unresolved high-priority recommendation */
  const sevenDaysAgo = Date.now() - 7 * 24 * 3600_000;
  const stale = recs
    .filter((r) => (r.priority ?? 0) >= 60 && new Date(r.created_at).getTime() < sevenDaysAgo)
    .slice(0, 1)[0];
  if (stale) {
    await upsertNotice(userId, {
      kind: 'stale_recommendation',
      title: `Still open: ${stale.title}`,
      body: "This has been waiting a week. Want me to walk you through it now?",
      prepared_answer: {
        headline: stale.title,
        bullets: [
          stale.body ?? "I can break this into a small first step.",
          'Most users finish this in under two minutes.',
        ],
        actions: [
          { label: 'Fix with Ray', href: hrefFor(stale.page_context), tone: 'primary' },
          { label: 'Open in Ray', href: '/app/ray' },
        ],
      },
      entity_kind: 'recommendation',
      entity_id: stale.id,
      priority: Math.min(95, (stale.priority ?? 60) + 10),
      confidence: 0.8,
      source_signal: 'recommendation.stale',
      dedupe_key: `stale_rec:${stale.id}`,
    });
  }

  /* 3) Repeated question */
  const questions = timeline.filter((e) => e.event_type === 'ray_question');
  const counts = new Map<string, { count: number; sample: string }>();
  for (const q of questions) {
    const norm =
      (q.payload && typeof (q.payload as { normalized?: string }).normalized === 'string'
        ? (q.payload as { normalized: string }).normalized
        : normalizeQuestion(q.summary)) ?? '';
    if (!norm) continue;
    const prev = counts.get(norm);
    if (prev) prev.count += 1;
    else counts.set(norm, { count: 1, sample: q.summary });
  }
  const repeated = [...counts.entries()]
    .filter(([, v]) => v.count >= 3)
    .sort((a, b) => b[1].count - a[1].count)[0];
  if (repeated) {
    const [norm, info] = repeated;
    await upsertNotice(userId, {
      kind: 'repeated_question',
      title: `You've asked me this ${info.count} times`,
      body: `"${info.sample}" — I'll keep the answer ready so you don't have to ask again.`,
      prepared_answer: {
        headline: info.sample,
        bullets: [
          "I'll pin this answer to your Ray surface and refresh it when the data changes.",
          'Open Ray to ask follow-ups in the same thread.',
        ],
        actions: [{ label: 'Open Ray', href: '/app/ray', tone: 'primary' }],
      },
      priority: 55,
      confidence: 0.7,
      source_signal: 'question.repeated',
      dedupe_key: `repeat:${norm}`.slice(0, 180),
      metadata: { count: info.count },
    });
  }

  /* 4) Critical timeline events */
  const critical = timeline.find(
    (e) => e.severity === 'critical' || e.severity === 'high' || e.event_type === 'breach_detected',
  );
  if (critical) {
    await upsertNotice(userId, {
      kind: critical.event_type === 'breach_detected' ? 'new_exposure' : 'critical_threat',
      title: critical.summary,
      body: 'I flagged this and prepared the recommended next step.',
      prepared_answer: {
        headline: critical.summary,
        bullets: [
          "Open the related page to see the affected account or device.",
          "I can guide you through the fix step by step.",
        ],
        actions: [{ label: 'Investigate', href: '/app/threats', tone: 'primary' }],
      },
      priority: 90,
      confidence: 0.85,
      source_signal: `timeline.${critical.event_type}`,
      dedupe_key: `timeline:${critical.event_type}:${critical.occurred_at}`,
    });
  }

  /* 5) Auto-resolve score-drop notices once the score recovers */
  if (latest && typeof latest.score_delta === 'number' && latest.score_delta >= 0) {
    await supabase
      .from('ray_notices')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('kind', 'score_drop')
      .eq('status', 'open');
  }
}

function buildScoreDeltaBullets(briefs: Brief[]): string[] {
  const out: string[] = [];
  const [latest, prev] = briefs;
  if (latest && prev && latest.score != null && prev.score != null) {
    out.push(`Yesterday you were at ${prev.score}, today you're at ${latest.score}.`);
  }
  const stats = (latest?.stats ?? {}) as {
    passwords?: { weak?: number; breached?: number };
    threats?: { open?: number; critical?: number };
    exposure?: { new_breaches?: number };
  };
  if ((stats.passwords?.breached ?? 0) > 0) {
    out.push(`${stats.passwords?.breached} breached password${stats.passwords?.breached === 1 ? '' : 's'} are still pulling your score down.`);
  } else if ((stats.passwords?.weak ?? 0) > 0) {
    out.push(`${stats.passwords?.weak} weak password${stats.passwords?.weak === 1 ? '' : 's'} — strengthening these is the fastest win.`);
  }
  if ((stats.threats?.critical ?? 0) > 0) {
    out.push(`${stats.threats?.critical} critical threat${stats.threats?.critical === 1 ? '' : 's'} need attention.`);
  }
  if ((stats.exposure?.new_breaches ?? 0) > 0) {
    out.push(`${stats.exposure?.new_breaches} new exposure${stats.exposure?.new_breaches === 1 ? '' : 's'} detected.`);
  }
  if (out.length === 0) out.push("I'll keep watching and tell you the moment I see why.");
  return out;
}

/* ---------------------------------------------------------------- hook */

export function useRayNotices(limit = 3) {
  const { user } = useAuth();
  const [notices, setNotices] = useState<RayNotice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const nowIso = new Date().toISOString();
    const { data } = await supabase
      .from('ray_notices')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['open', 'snoozed'])
      .or(`snoozed_until.is.null,snoozed_until.lt.${nowIso}`)
      .order('priority', { ascending: false })
      .order('confidence', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20);
    setNotices((data as RayNotice[]) ?? []);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      try {
        await synthesizeNotices(user.id);
      } catch (e) {
        devLog.warn('[ray.notices] synthesize failed', e);
      }
      if (!cancelled) await refresh();
    })();
    return () => { cancelled = true; };
  }, [user, refresh]);

  const top = useMemo(() => {
    // Promote open over snoozed-but-elapsed; cap to 1–3.
    const open = notices.filter((n) => n.status === 'open');
    const elapsed = notices.filter((n) => n.status === 'snoozed');
    return [...open, ...elapsed].slice(0, Math.max(1, Math.min(3, limit)));
  }, [notices, limit]);

  return {
    notices: top,
    allActive: notices,
    isLoading,
    refresh,
    snooze: async (id: string, hours = 24) => { await snoozeNotice(id, hours); await refresh(); },
    dismiss: async (id: string) => { await dismissNotice(id); await refresh(); },
    resolve: async (id: string) => { await resolveNotice(id); await refresh(); },
  };
}
