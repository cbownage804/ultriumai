/**
 * PlaybookRunner — Ray's conversational playbook surface.
 *
 * No wizard chrome. Left rail = task checklist with progress. Main column =
 * Ray speaks one short message, the user takes the action, then confirms.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowRight, Check, ExternalLink, Pause, Sparkles, X } from 'lucide-react';
import { usePlaybookRun } from '@/hooks/usePlaybookRun';

function CompletionCelebration({
  title,
  message,
  scoreDelta,
  onClose,
}: {
  title: string;
  message: string;
  scoreDelta: number | null;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[480px] w-[480px] rounded-full bg-violet-500/20 blur-3xl animate-pulse" />
      </div>
      <div className="relative max-w-md w-[92%] rounded-lg border border-violet-400/30 bg-card/95 p-8 text-center shadow-[0_0_60px_-10px_hsl(var(--primary)/0.4)]">
        <div className="mx-auto h-10 w-10 rounded-full bg-violet-500/20 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-violet-300" />
        </div>
        <h2 className="mt-4 text-xl font-light tracking-tight">Excellent work.</h2>
        <p className="mt-2 text-sm text-foreground/80">{message}</p>
        {scoreDelta !== null && scoreDelta !== 0 && (
          <p className="mt-3 text-sm text-violet-300">
            Security Score {scoreDelta > 0 ? 'increased' : 'changed'} by {scoreDelta > 0 ? '+' : ''}
            {scoreDelta}.
          </p>
        )}
        <p className="mt-4 text-xs text-muted-foreground">{title}</p>
        <Button className="mt-6 w-full" onClick={onClose}>
          Back to Ray
        </Button>
      </div>
    </div>
  );
}

export function PlaybookRunner({ runId }: { runId: string }) {
  const navigate = useNavigate();
  const { run, loading, advance, pause, resume } = usePlaybookRun(runId);
  const [celebrated, setCelebrated] = useState(false);

  const currentTask = useMemo(() => run?.tasks.find((t) => !t.done) ?? null, [run]);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Ray is opening the playbook…</div>;
  }
  if (!run) {
    return (
      <div className="rounded-md border border-border bg-card/40 p-6 text-sm text-muted-foreground">
        Ray couldn't find that playbook. <Button variant="link" onClick={() => navigate('/app/ray')}>Back to Ray</Button>
      </div>
    );
  }

  const completed = run.status === 'completed';
  const paused = run.status === 'paused';
  const progress = run.progress;
  const minutesLeft = Math.max(
    1,
    Math.round((run.estimated_minutes * (100 - progress)) / 100),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      {/* Left rail — checklist */}
      <aside className="rounded-md border border-border bg-card/40 p-5 h-fit">
        <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Playbook</div>
        <h2 className="mt-1 text-base font-light tracking-tight">{run.title}</h2>
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="tabular-nums">{minutesLeft} min left</span>
          <span>·</span>
          <span>+{run.reward_score} score</span>
          <span className="ml-auto tabular-nums">{progress}%</span>
        </div>
        <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-700',
              completed ? 'bg-emerald-500' : 'bg-primary',
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <ol className="mt-5 space-y-2">
          {run.tasks.map((t, i) => {
            const isCurrent = !completed && currentTask?.id === t.id;
            return (
              <li
                key={t.id}
                className={cn(
                  'flex items-start gap-2 rounded-sm border px-3 py-2 text-sm transition-colors',
                  t.done
                    ? 'border-emerald-500/30 bg-emerald-500/[0.05] text-foreground'
                    : isCurrent
                      ? 'border-primary/40 bg-primary/[0.05] text-foreground'
                      : 'border-border text-muted-foreground',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-sm border shrink-0',
                    t.done
                      ? 'border-emerald-500 bg-emerald-500 text-background'
                      : isCurrent
                        ? 'border-primary'
                        : 'border-muted-foreground/40',
                  )}
                >
                  {t.done ? <Check className="h-3 w-3" /> : <span className="text-[10px] tabular-nums">{i + 1}</span>}
                </span>
                <span className={cn(t.done && 'line-through text-muted-foreground')}>{t.label}</span>
              </li>
            );
          })}
        </ol>
      </aside>

      {/* Main column — Ray speaks */}
      <main className="rounded-md border border-border bg-card/40 p-8 min-h-[360px] flex flex-col">
        {completed ? (
          <div className="m-auto text-center max-w-md">
            <div className="mx-auto h-10 w-10 rounded-full bg-violet-500/15 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-violet-300" />
            </div>
            <h2 className="mt-4 text-xl font-light">All done.</h2>
            <p className="mt-2 text-sm text-foreground/80">
              {run.completion_message ?? "Nicely done. I'll keep monitoring from here."}
            </p>
            <Button className="mt-6" onClick={() => navigate('/app/ray')}>
              Back to Ray <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        ) : currentTask ? (
          <div className="flex-1 flex flex-col">
            <div className="text-[11px] uppercase tracking-[0.22em] text-violet-300">Ray</div>
            <p className="mt-3 text-lg font-light leading-relaxed text-foreground/95">
              {currentTask.rayPrompt}
            </p>

            {currentTask.externalUrl && (
              <a
                href={currentTask.externalUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-5 inline-flex items-center gap-2 self-start rounded-sm border border-border bg-background/40 px-3 py-2 text-sm text-foreground hover:border-primary/40 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {currentTask.externalLabel ?? 'Open in new tab'}
              </a>
            )}

            <div className="mt-auto pt-8 flex flex-wrap items-center gap-2">
              <Button onClick={() => advance(currentTask.id)} className="bg-violet-500 hover:bg-violet-600 text-white">
                I did this <Check className="h-4 w-4 ml-1" />
              </Button>
              {!paused ? (
                <Button variant="ghost" onClick={() => pause()}>
                  <Pause className="h-4 w-4 mr-1" /> Pause
                </Button>
              ) : (
                <Button variant="ghost" onClick={() => resume()}>
                  Resume
                </Button>
              )}
              <Button variant="ghost" onClick={() => navigate('/app/ray')} className="text-muted-foreground">
                <X className="h-4 w-4 mr-1" /> Leave for now
              </Button>
            </div>
          </div>
        ) : (
          <div className="m-auto text-sm text-muted-foreground">Wrapping up…</div>
        )}
      </main>

      {completed && !celebrated && (
        <CompletionCelebration
          title={run.title}
          message={run.completion_message ?? 'Nicely done.'}
          scoreDelta={run.score_delta_actual ?? run.reward_score}
          onClose={() => setCelebrated(true)}
        />
      )}
    </div>
  );
}
