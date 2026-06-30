/**
 * Trends — Ray's longitudinal view of the user's security posture.
 * Reads from ray_security_scores and ray_timeline so users can see
 * their score climb over time and the work that produced it.
 */
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { RayPageHeader } from '@/components/ray/RayPageHeader';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type ScoreRow = { score: number; created_at: string };
type EventRow = { event_type: string; created_at: string };

function Sparkline({ values, className }: { values: number[]; className?: string }) {
  if (values.length < 2) return <div className={cn('h-16 rounded bg-muted/40', className)} />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = 100 - ((v - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={cn('h-16 w-full', className)}>
      <polyline points={points} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function StatCard({
  label, current, delta, history,
}: { label: string; current: number | string; delta: number | null; history: number[] }) {
  const arrow = delta == null ? <Minus className="h-3 w-3" /> : delta > 0 ? <TrendingUp className="h-3 w-3" /> : delta < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />;
  const tone = delta == null ? 'text-muted-foreground' : delta > 0 ? 'text-emerald-500' : delta < 0 ? 'text-red-500' : 'text-muted-foreground';
  return (
    <div className="rounded-md border border-border bg-card/40 p-4">
      <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="text-3xl font-light tracking-tight tabular-nums">{current}</div>
        <div className={cn('inline-flex items-center gap-1 text-xs', tone)}>
          {arrow}{delta != null && <span>{delta > 0 ? '+' : ''}{delta}</span>}
        </div>
      </div>
      <Sparkline values={history} className="mt-3" />
    </div>
  );
}

export default function Trends() {
  const { user } = useAuth();
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    Promise.all([
      supabase.from('ray_security_scores').select('score,created_at').eq('user_id', user.id).order('created_at', { ascending: true }).limit(180),
      supabase.from('ray_timeline').select('event_type,created_at').eq('user_id', user.id).order('created_at', { ascending: true }).limit(500),
    ]).then(([sRes, eRes]) => {
      if (!alive) return;
      setScores((sRes.data ?? []) as ScoreRow[]);
      setEvents((eRes.data ?? []) as EventRow[]);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [user]);

  const stats = useMemo(() => {
    const scoreVals = scores.map((s) => s.score);
    const first = scoreVals[0];
    const last = scoreVals[scoreVals.length - 1];
    const scoreDelta = first != null && last != null ? last - first : null;

    // Count cumulative events of certain types over time → simple bucketed counts
    const bucket = (predicate: (e: EventRow) => boolean) =>
      events.filter(predicate).map((_, i) => i + 1);

    const resolved = bucket((e) => /resolv|completed|fixed|enabled/i.test(e.event_type));
    const missions = bucket((e) => e.event_type === 'mission_completed');
    const threats  = bucket((e) => /threat|alert|risk/i.test(e.event_type));
    const imports  = bucket((e) => /import|added|scan/i.test(e.event_type));

    return {
      score: {
        current: last ?? '—',
        delta: scoreDelta,
        history: scoreVals.length ? scoreVals : [0, 0],
      },
      missions: { current: missions.length, history: missions.length ? missions : [0, 0] },
      resolved: { current: resolved.length, history: resolved.length ? resolved : [0, 0] },
      threats:  { current: threats.length,  history: threats.length ? threats : [0, 0] },
      imports:  { current: imports.length,  history: imports.length ? imports : [0, 0] },
    };
  }, [scores, events]);

  return (
    <div className="flex flex-col gap-6">
      <RayPageHeader
        title="Trends"
        subtitle="Your security, charted"
        description="Ray tracks every meaningful change. Look back to see how far you've come."
      />

      {loading ? (
        <div className="text-sm text-muted-foreground">Pulling your history…</div>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Security score" current={stats.score.current} delta={stats.score.delta} history={stats.score.history} />
            <StatCard label="Missions completed" current={stats.missions.current} delta={null} history={stats.missions.history} />
            <StatCard label="Issues resolved" current={stats.resolved.current} delta={null} history={stats.resolved.history} />
            <StatCard label="Threats handled" current={stats.threats.current} delta={null} history={stats.threats.history} />
            <StatCard label="Items Ray scanned" current={stats.imports.current} delta={null} history={stats.imports.history} />
          </section>

          {scores.length < 2 && (
            <div className="rounded-md border border-border bg-card/40 p-4 text-sm text-muted-foreground">
              Ray needs a few days of activity before trends get interesting. Check back after your next Morning Brief.
            </div>
          )}
        </>
      )}
    </div>
  );
}
