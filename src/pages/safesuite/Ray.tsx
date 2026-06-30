/**
 * Ray — the canonical Ray page.
 *
 * Composes the existing full-page conversation surface (was SafeAssist) with
 * a recommendations rail above it, so Ray feels like a teammate with
 * memory/tasks, not just a chat window. Conversation, history, voice are all
 * inherited from the underlying component.
 */
import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getRayContext, type RayContext } from '@/lib/ray';
import { RayPageHeader } from '@/components/ray/RayPageHeader';
import { cn } from '@/lib/utils';
import { ArrowRight, Eye } from 'lucide-react';

const WraythAssist = lazy(() => import('@/pages/safesuite/SafeSuiteAssist'));

function priorityTone(p: number) {
  if (p <= 1) return 'border-red-500/40 bg-red-500/[0.04]';
  if (p <= 3) return 'border-amber-500/40 bg-amber-500/[0.04]';
  return 'border-border bg-card/40';
}

export default function Ray() {
  const { user } = useAuth();
  const [ctx, setCtx] = useState<RayContext | null>(null);

  useEffect(() => {
    let active = true;
    if (!user) return;
    void getRayContext(user.id).then((c) => { if (active) setCtx(c); });
    return () => { active = false; };
  }, [user]);

  const recs = ctx?.recommendations?.slice(0, 3) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <RayPageHeader
        title="Ray"
        subtitle="Your AI cybersecurity teammate"
        description="Ask me anything about your security. I remember our conversations, and I'll surface what needs attention."
      />

      {recs.length > 0 && (
        <section>
          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
            Ray's current recommendations
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {recs.map((r) => (
              <Link
                key={r.id}
                to="/app/passwords/health"
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
                      Open <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Suspense fallback={null}>
        <WraythAssist />
      </Suspense>
    </div>
  );
}
