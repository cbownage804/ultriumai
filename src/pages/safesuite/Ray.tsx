/**
 * Ray — the canonical Ray command center.
 *
 * Composes the full-page conversation surface with Ray's current
 * recommendations (with lifecycle controls), recently completed work,
 * what Ray remembers about the user, and suggested questions.
 */
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRayBrain } from '@/lib/ray/brain';
import { supabase } from '@/integrations/supabase/client';
import { RayPageHeader } from '@/components/ray/RayPageHeader';
import { AskRay } from '@/components/ray/AskRay';
import { RayNoticesPanel } from '@/components/ray/RayNoticesPanel';
import { FixWithRayButton } from '@/components/ray/FixWithRayButton';
import {
  listRuns,
  resumeRun,
  archiveRun,
  playbookForRecommendation,
  findTemplate,
  startPlaybook,
  type PlaybookRun,
} from '@/lib/ray/playbooks';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  Brain,
  Check,
  CheckCircle2,
  Clock,
  MessageSquare,
  Pause,
  Play,
  Shield,
  Sparkles,
  X,
} from 'lucide-react';

const WraythAssist = lazy(() => import('@/pages/safesuite/SafeSuiteAssist'));

type RecentAction = { event_type: string; summary: string; created_at: string };

const SUGGESTED_QUESTIONS = [
  'What should I fix first?',
  'Is my Gmail account secure?',
  'Why did my security score change?',
  'Show me every account without MFA.',
  'What happened overnight?',
];

function pageHrefFor(area?: string | null): string {
  switch (area) {
    case 'passwords': return '/app/passwords';
    case 'threats': return '/app/threats';
    case 'exposure': return '/app/exposure';
    case 'identity': return '/app/identity';
    case 'devices': return '/app/devices';
    case 'reports': return '/app/timeline';
    default: return '/app/missions';
  }
}

function priorityTone(p: number) {
  if (p >= 70) return 'border-red-500/30 bg-red-500/[0.04]';
  if (p >= 40) return 'border-amber-500/25 bg-amber-500/[0.03]';
  return 'border-emerald-500/20 bg-emerald-500/[0.03]';
}

function prettyMemoryKey(k: string): string {
  return k.replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function prettyMemoryValue(v: unknown): string {
  if (v == null) return '—';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try { return JSON.stringify(v); } catch { return '—'; }
}

export default function Ray() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    recommendations,
    memory,
    startRecommendation,
    snoozeRecommendation,
    completeRecommendation,
    dismissRecommendation,
  } = useRayBrain();
  const [recent, setRecent] = useState<RecentAction[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [runs, setRuns] = useState<PlaybookRun[]>([]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void supabase
      .from('ray_timeline')
      .select('event_type,summary,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => { if (active) setRecent((data ?? []) as RecentAction[]); });
    void listRuns(user.id, ['in_progress', 'paused', 'completed']).then((r) => {
      if (active) setRuns(r);
    });
    return () => { active = false; };
  }, [user]);

  const recs = useMemo(() => recommendations.slice(0, 4), [recommendations]);
  const topMemory = useMemo(
    () => memory.slice().sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0)).slice(0, 5),
    [memory],
  );
  const currentPlaybook = useMemo(() => runs.find((r) => r.status === 'in_progress') ?? null, [runs]);
  const pausedPlaybooks = useMemo(() => runs.filter((r) => r.status === 'paused'), [runs]);
  const completedPlaybooks = useMemo(
    () => runs.filter((r) => r.status === 'completed').slice(0, 5),
    [runs],
  );

  const suggestedNext = useMemo(() => {
    const topRec = recs[0];
    if (!topRec) return null;
    const slug = playbookForRecommendation(topRec);
    const template = findTemplate(slug);
    if (!template) return null;
    return { recommendation: topRec, template };
  }, [recs]);

  function askRay(q: string) {
    window.dispatchEvent(new CustomEvent('ray:ask', { detail: q }));
    try { void navigator.clipboard?.writeText(q); } catch { /* ignore */ }
  }

  async function withBusy(id: string, fn: () => Promise<unknown>) {
    setBusyId(id);
    try { await fn(); } finally { setBusyId(null); }
  }

  async function handleResume(run: PlaybookRun) {
    await resumeRun(run.id);
    navigate(`/app/ray/playbook/${run.id}`);
  }

  async function handleArchive(run: PlaybookRun) {
    await archiveRun(run.id);
    setRuns((prev) => prev.filter((r) => r.id !== run.id));
  }

  async function startSuggested() {
    if (!user || !suggestedNext) return;
    const run = await startPlaybook(user.id, suggestedNext.template.slug, {
      sourceRecommendationId: suggestedNext.recommendation.id,
    });
    if (run) navigate(`/app/ray/playbook/${run.id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <RayPageHeader
        title="Ray"
        subtitle="Your AI cybersecurity teammate"
        description="Ask me anything about your security. I remember our conversations and surface what needs attention."
      />

      <AskRay />

      <RayNoticesPanel />



      {/* Current recommendations with lifecycle controls */}
      <section>
        <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
          Ray's current recommendations
        </div>
        {recs.length === 0 ? (
          <div className="rounded-sm border border-emerald-500/30 bg-emerald-500/[0.04] px-4 py-3 text-sm text-emerald-200">
            Nothing needs your attention right now. I'll let you know the moment that changes.
          </div>
        ) : (
          <div className="grid gap-2">
            {recs.map((r) => {
              const inProgress = r.status === 'in_progress';
              const isBusy = busyId === r.id;
              return (
                <div key={r.id} className={cn('rounded-sm border px-4 py-3', priorityTone(r.priority ?? 5))}>
                  <div className="flex items-start gap-3">
                    <Shield className="h-4 w-4 mt-0.5 text-foreground/70 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-sm text-foreground">{r.title}</div>
                        {inProgress && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/40 bg-violet-500/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-violet-200">
                            <Play className="h-2.5 w-2.5" /> In progress
                          </span>
                        )}
                      </div>
                      {r.body && <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{r.body}</p>}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => navigate(pageHrefFor(r.page_context))}>
                          Fix with Ray <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                        {!inProgress && (
                          <Button size="sm" variant="ghost" disabled={isBusy} className="h-7 px-2 text-xs text-violet-300 hover:text-violet-200" onClick={() => withBusy(r.id, () => startRecommendation(r.id))}>
                            <Play className="h-3 w-3 mr-1" /> Start
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" disabled={isBusy} className="h-7 px-2 text-xs text-emerald-300 hover:text-emerald-200" onClick={() => withBusy(r.id, () => completeRecommendation(r.id))}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark handled
                        </Button>
                        <Button size="sm" variant="ghost" disabled={isBusy} className="h-7 px-2 text-xs text-amber-300 hover:text-amber-200" onClick={() => withBusy(r.id, () => snoozeRecommendation(r.id, 24))}>
                          <Clock className="h-3.5 w-3.5 mr-1" /> Snooze 24h
                        </Button>
                        <Button size="sm" variant="ghost" disabled={isBusy} className="h-7 px-2 text-xs text-muted-foreground" onClick={() => withBusy(r.id, () => dismissRecommendation(r.id))}>
                          <X className="h-3.5 w-3.5 mr-1" /> Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recently, Ray... */}
        <section>
          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
            Recently, Ray…
          </div>
          {recent.length === 0 ? (
            <div className="rounded-sm border border-border bg-card/40 px-4 py-3 text-sm text-muted-foreground">
              Nothing yet. Your first conversation will show up here.
            </div>
          ) : (
            <ul className="rounded-sm border border-border bg-card/40 divide-y divide-border">
              {recent.map((e, i) => (
                <li key={i} className="px-4 py-2.5 text-sm flex items-center gap-3">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span className="flex-1 truncate text-foreground/90">{e.summary}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {new Date(e.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2">
            <Link to="/app/timeline" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              Full timeline <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </section>

        {/* What Ray remembers */}
        <section>
          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-2 inline-flex items-center gap-2">
            <Brain className="h-3 w-3" /> What Ray remembers
          </div>
          {topMemory.length === 0 ? (
            <div className="rounded-sm border border-border bg-card/40 px-4 py-3 text-sm text-muted-foreground">
              Nothing yet. As we work together, I'll remember what matters to you.
            </div>
          ) : (
            <ul className="rounded-sm border border-border bg-card/40 divide-y divide-border">
              {topMemory.map((m) => (
                <li key={m.id} className="px-4 py-2.5 text-sm">
                  <div className="text-foreground/90">{prettyMemoryKey(m.key)}</div>
                  <div className="text-xs text-muted-foreground truncate">{prettyMemoryValue(m.value)}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section>
        <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
          Try asking Ray
        </div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => askRay(q)}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1.5 text-xs text-foreground/80 hover:border-primary/40 hover:text-foreground transition-colors"
            >
              <MessageSquare className="h-3 w-3" /> {q}
            </button>
          ))}
        </div>
      </section>

      <Suspense fallback={null}>
        <WraythAssist />
      </Suspense>
    </div>
  );
}
