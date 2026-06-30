/**
 * Ray — the canonical Ray command center.
 *
 * Composes the full-page conversation surface with Ray's current
 * recommendations, recently completed work, and suggested questions
 * the user can click to start a conversation.
 */
import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getRayContext, type RayContext } from '@/lib/ray';
import { supabase } from '@/integrations/supabase/client';
import { RayPageHeader } from '@/components/ray/RayPageHeader';
import { cn } from '@/lib/utils';
import { ArrowRight, Check, Eye, MessageSquare } from 'lucide-react';

const WraythAssist = lazy(() => import('@/pages/safesuite/SafeSuiteAssist'));

type RecentAction = { event_type: string; summary: string; created_at: string };

const SUGGESTED_QUESTIONS = [
  'What should I fix first?',
  'Is my Gmail account secure?',
  'Why did my security score change?',
  'Show me every account without MFA.',
  'What happened overnight?',
];

function priorityTone(p: number) {
  if (p <= 1) return 'border-red-500/40 bg-red-500/[0.04]';
  if (p <= 3) return 'border-amber-500/40 bg-amber-500/[0.04]';
  return 'border-border bg-card/40';
}

export default function Ray() {
  const { user } = useAuth();
  const [ctx, setCtx] = useState<RayContext | null>(null);
  const [recent, setRecent] = useState<RecentAction[]>([]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void getRayContext(user.id).then((c) => { if (active) setCtx(c); });
    void supabase
      .from('ray_timeline')
      .select('event_type,summary,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => { if (active) setRecent((data ?? []) as RecentAction[]); });
    return () => { active = false; };
  }, [user]);

  const recs = ctx?.recommendations?.slice(0, 3) ?? [];

  function askRay(q: string) {
    // Surface to the embedded WraythAssist via a custom event the
    // assist component listens for. Falls back to clipboard copy.
    window.dispatchEvent(new CustomEvent('ray:ask', { detail: q }));
    try { void navigator.clipboard?.writeText(q); } catch { /* ignore */ }
  }

  return (
    <div className="flex flex-col gap-6">
      <RayPageHeader
        title="Ray"
        subtitle="Your AI cybersecurity teammate"
        description="Ask me anything about your security. I remember our conversations and surface what needs attention."
      />

      <div className="grid gap-3 lg:grid-cols-3">
        {recs.length > 0 && (
          <section className="lg:col-span-2">
            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
              Ray's current recommendations
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {recs.map((r) => (
                <Link
                  key={r.id}
                  to="/app/missions"
                  className={cn(
                    'group rounded-sm border px-4 py-3 transition-colors hover:border-foreground/40',
                    priorityTone(r.priority ?? 5),
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Eye className="h-4 w-4 mt-0.5 text-foreground/70 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm text-foreground line-clamp-2">{r.title}</div>
                      <div className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                        Fix with Ray <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className={recs.length > 0 ? '' : 'lg:col-span-3'}>
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
