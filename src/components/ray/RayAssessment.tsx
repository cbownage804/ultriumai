/**
 * RayAssessment — Ray's conversational health block. Replaces every
 * "Security Health" / "Vault Health" card across the app. Always reads from
 * `getRayContext` so the same numbers show everywhere.
 */
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getRayContext, type RayContext } from '@/lib/ray';
import { cn } from '@/lib/utils';
import { Eye } from 'lucide-react';

type Scope = 'overall' | 'passwords' | 'threats' | 'exposure';

interface Props {
  scope?: Scope;
  className?: string;
  /** Optional override — if passed, Ray will lead with this line instead of synthesizing one. */
  lead?: string;
}

function pickLine(ctx: RayContext, scope: Scope): string[] {
  if (!ctx.hasOnboarded) {
    return [
      "I haven't met you yet.",
      "Run through onboarding and I'll have a real read on your security in about a minute.",
    ];
  }
  const f = ctx.findings;
  const score = ctx.latestScore?.score ?? null;

  const weak = f.filter((x) => x.kind === 'weak').length;
  const reused = f.filter((x) => x.kind === 'reused').length;
  const breached = f.filter((x) => x.kind === 'breached').length;
  const stale = f.filter((x) => x.kind === 'stale' || x.kind === 'old').length;

  if (scope === 'passwords') {
    if (breached) return [`I found ${breached} ${breached === 1 ? 'credential' : 'credentials'} in known breach datasets.`, `I'd recommend rotating ${breached === 1 ? 'that one' : 'those'} first.`];
    if (reused) return [`${reused} of your passwords are reused across accounts.`, `Unique passwords are the single biggest win.`];
    if (weak) return [`I found ${weak} weak ${weak === 1 ? 'password' : 'passwords'}.`, `Let's strengthen them when you have a minute.`];
    if (stale) return [`A few passwords haven't been rotated in a long time.`, `Not urgent, but worth refreshing.`];
    return [`Everything looks healthy.`, `No weak, reused, or breached passwords right now.`];
  }
  if (scope === 'threats') {
    return [`I'm watching for anything suspicious you send over.`, `Drop in a file or paste a link and I'll analyze it.`];
  }
  if (scope === 'exposure') {
    return [`I'm watching the dark web for your identities.`, breached ? `${breached} ${breached === 1 ? 'credential is' : 'credentials are'} already exposed — handle those first.` : `Nothing new has surfaced.`];
  }
  // overall
  if (score === null) return [`I'm still calibrating.`, `Once I have a baseline you'll see a real score here.`];
  if (score >= 90) return [`Everything looks healthy.`, `Security score ${score}. Keep doing what you're doing.`];
  if (score >= 70) return [`You're in good shape.`, `Security score ${score}. A few small fixes will push this higher.`];
  if (score >= 50) return [`There's room to tighten things up.`, `Security score ${score}. I have ${ctx.recommendations.length} recommendations ready.`];
  return [`We have work to do.`, `Security score ${score}. I'll walk you through the highest-impact fixes first.`];
}

export function RayAssessment({ scope = 'overall', className, lead }: Props) {
  const { user } = useAuth();
  const [ctx, setCtx] = useState<RayContext | null>(null);
  useEffect(() => {
    let active = true;
    if (!user) return;
    void getRayContext(user.id).then((c) => { if (active) setCtx(c); });
    return () => { active = false; };
  }, [user]);

  const lines = ctx ? pickLine(ctx, scope) : ['One moment.'];
  const score = ctx?.latestScore?.score ?? null;

  return (
    <section className={cn('rounded-sm border border-border bg-card/40 p-5 sm:p-6', className)}>
      <div className="flex items-start gap-4">
        <div className="relative shrink-0 mt-0.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background">
            <Eye className="h-4 w-4 text-foreground/80" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Ray's Assessment</div>
          <p className="mt-1 text-base sm:text-lg text-foreground">{lead ?? lines[0]}</p>
          {lines[1] && <p className="mt-1 text-sm text-muted-foreground">{lines[1]}</p>}
        </div>
        {scope === 'overall' && score !== null && (
          <div className="text-right shrink-0">
            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Score</div>
            <div className="text-3xl font-light tabular-nums text-foreground">{score}</div>
          </div>
        )}
      </div>
    </section>
  );
}
