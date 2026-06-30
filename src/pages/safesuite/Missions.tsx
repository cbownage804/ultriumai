/**
 * Missions — Ray's signature surface. One focused mission at a time,
 * with checkable steps and a clear reward. Completing steps animates
 * the mission into a finished state and writes a timeline event.
 */
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { RayPageHeader } from '@/components/ray/RayPageHeader';
import { listMissions, toggleStep, dismissMission, type RayMission } from '@/lib/ray/missions';
import { cn } from '@/lib/utils';
import { Check, Clock, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

function MissionCard({
  mission,
  active,
  onToggle,
  onSelect,
  onDismiss,
}: {
  mission: RayMission;
  active: boolean;
  onToggle: (stepId: string) => void;
  onSelect: () => void;
  onDismiss: () => void;
}) {
  const completed = mission.status === 'completed';
  return (
    <article
      className={cn(
        'rounded-md border bg-card/40 p-5 transition-all',
        active && 'border-primary/40 shadow-[0_0_0_1px_hsl(var(--primary)/0.25)]',
        completed && 'border-emerald-500/30 bg-emerald-500/[0.03]',
        !active && !completed && 'border-border hover:border-foreground/30 cursor-pointer',
      )}
      onClick={!active && !completed ? onSelect : undefined}
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            {completed ? <Check className="h-3 w-3 text-emerald-500" /> : <Sparkles className="h-3 w-3 text-primary" />}
            {completed ? 'Completed' : mission.status === 'in_progress' ? 'In progress' : 'Mission'}
          </div>
          <h2 className="mt-1 text-lg font-light tracking-tight">{mission.title}</h2>
          {mission.description && (
            <p className="mt-1 text-sm text-muted-foreground">{mission.description}</p>
          )}
        </div>
        {!completed && (
          <button
            onClick={(e) => { e.stopPropagation(); onDismiss(); }}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss mission"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </header>

      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><Clock className="h-3 w-3" /> {mission.estimated_minutes} min</span>
        <span>Reward: +{mission.reward_points} score</span>
        <span className="ml-auto tabular-nums">{mission.progress}%</span>
      </div>
      <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-700',
            completed ? 'bg-emerald-500' : 'bg-primary',
          )}
          style={{ width: `${mission.progress}%` }}
        />
      </div>

      {active && !completed && (
        <ul className="mt-5 space-y-2">
          {mission.steps.map((step) => (
            <li key={step.id}>
              <button
                onClick={(e) => { e.stopPropagation(); onToggle(step.id); }}
                className={cn(
                  'w-full flex items-center gap-3 rounded-sm border px-3 py-2 text-left text-sm transition-colors',
                  step.done
                    ? 'border-emerald-500/30 bg-emerald-500/[0.05] text-foreground'
                    : 'border-border hover:border-foreground/30 text-foreground',
                )}
              >
                <span
                  className={cn(
                    'inline-flex h-4 w-4 items-center justify-center rounded-sm border',
                    step.done ? 'border-emerald-500 bg-emerald-500 text-background' : 'border-muted-foreground/40',
                  )}
                >
                  {step.done && <Check className="h-3 w-3" />}
                </span>
                <span className={cn(step.done && 'line-through text-muted-foreground')}>{step.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {completed && (
        <div className="mt-4 text-sm text-emerald-500 animate-fade-in">
          Nicely done. Ray banked +{mission.reward_points} to your security score.
        </div>
      )}
    </article>
  );
}

export default function Missions() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<RayMission[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    void listMissions(user.id).then((rows) => {
      if (!alive) return;
      setMissions(rows);
      const next = rows.find((m) => m.status !== 'completed' && m.status !== 'dismissed');
      setActiveId(next?.id ?? null);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [user]);

  const active = useMemo(() => missions.find((m) => m.id === activeId), [missions, activeId]);
  const queue = missions.filter((m) => m.status !== 'completed' && m.status !== 'dismissed');
  const done = missions.filter((m) => m.status === 'completed');

  async function handleToggle(stepId: string) {
    if (!active) return;
    const updated = await toggleStep(active, stepId);
    setMissions((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    if (updated.status === 'completed') {
      const next = missions.find((m) => m.id !== updated.id && m.status !== 'completed' && m.status !== 'dismissed');
      if (next) setActiveId(next.id);
    }
  }

  async function handleDismiss(id: string) {
    await dismissMission(id);
    setMissions((prev) => prev.filter((m) => m.id !== id));
    if (activeId === id) {
      const next = missions.find((m) => m.id !== id && m.status !== 'completed' && m.status !== 'dismissed');
      setActiveId(next?.id ?? null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <RayPageHeader
        title="Missions"
        subtitle="One mission at a time, guided by Ray"
        description="Ray picks the most valuable next thing to secure and walks you through it. Finish a mission, earn score, move on."
      />

      {loading ? (
        <div className="text-sm text-muted-foreground">Ray is preparing your missions…</div>
      ) : queue.length === 0 ? (
        <div className="rounded-md border border-border bg-card/40 p-8 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-primary" />
          <h2 className="mt-3 text-lg font-light">You're caught up.</h2>
          <p className="mt-1 text-sm text-muted-foreground">Ray will surface a new mission the next time something changes.</p>
        </div>
      ) : (
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {active && (
              <MissionCard
                mission={active}
                active
                onToggle={handleToggle}
                onSelect={() => {}}
                onDismiss={() => handleDismiss(active.id)}
              />
            )}
          </div>
          <aside className="space-y-3">
            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Up next</div>
            {queue.filter((m) => m.id !== activeId).map((m) => (
              <MissionCard
                key={m.id}
                mission={m}
                active={false}
                onToggle={() => {}}
                onSelect={() => setActiveId(m.id)}
                onDismiss={() => handleDismiss(m.id)}
              />
            ))}
          </aside>
        </section>
      )}

      {done.length > 0 && (
        <section>
          <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Completed</div>
          <ul className="divide-y divide-border border border-border rounded-md bg-card/30">
            {done.map((m) => (
              <li key={m.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="inline-flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-500" /> {m.title}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  +{m.reward_points} {m.completed_at ? '· ' + new Date(m.completed_at).toLocaleDateString() : ''}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 text-xs text-muted-foreground">
            Ray keeps your full security history on the Timeline.
          </div>
          <div className="mt-2">
            <Button asChild variant="ghost" size="sm"><a href="/app/timeline">View timeline →</a></Button>
          </div>
        </section>
      )}
    </div>
  );
}
