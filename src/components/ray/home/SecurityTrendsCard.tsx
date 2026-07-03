/**
 * SecurityTrendsCard — replaces the Getting Started checklist on Home
 * once onboarding is complete. Shows real 7-day movement pulled from
 * ray_recommendations, ray_findings, and wrayth_device_actions.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus, ShieldCheck, Wrench, Sparkles, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

type Trend = { actionsRun: number; findingsResolved: number; openNow: number; openWeekAgo: number };

export function SecurityTrendsCard() {
  const { user } = useAuth();
  const [trend, setTrend] = useState<Trend | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    (async () => {
      const [actionsRes, resolvedRes, openNowRes, openThenRes] = await Promise.all([
        supabase
          .from('wrayth_device_actions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'succeeded')
          .gte('completed_at', weekAgo),
        supabase
          .from('ray_findings')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .not('resolved_at', 'is', null)
          .gte('resolved_at', weekAgo),
        supabase
          .from('ray_recommendations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('status', ['new', 'reviewed']),
        supabase
          .from('ray_recommendations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .lte('created_at', weekAgo)
          .or(`completed_at.is.null,completed_at.gte.${weekAgo}`),
      ]);
      if (!active) return;
      setTrend({
        actionsRun: actionsRes.count ?? 0,
        findingsResolved: resolvedRes.count ?? 0,
        openNow: openNowRes.count ?? 0,
        openWeekAgo: openThenRes.count ?? 0,
      });
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const delta = trend ? trend.openWeekAgo - trend.openNow : 0;
  const DirIcon = delta > 0 ? TrendingDown : delta < 0 ? TrendingUp : Minus;
  const dirColor = delta > 0 ? 'text-emerald-300' : delta < 0 ? 'text-amber-300' : 'text-muted-foreground';
  const dirText =
    trend == null
      ? 'Reading the last 7 days…'
      : delta > 0
      ? `${delta} fewer open item${delta === 1 ? '' : 's'} than last week`
      : delta < 0
      ? `${Math.abs(delta)} more open item${Math.abs(delta) === 1 ? '' : 's'} than last week`
      : 'Steady week — no change in open items';

  return (
    <div className="wrayth-chamfer border border-border bg-card/40 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-violet-300/80" />
          <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Trends this week</span>
        </div>
        <Link
          to="/app/timeline"
          className="text-[11px] text-violet-300 hover:text-violet-200 inline-flex items-center gap-1"
        >
          Timeline <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className={cn('h-9 w-9 rounded-full border border-border flex items-center justify-center', dirColor)}>
          <DirIcon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-base font-light text-foreground">{dirText}</h3>
          <p className="text-xs text-muted-foreground">Ray compares open work now vs seven days ago.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat icon={Wrench} label="Actions run" value={trend?.actionsRun ?? 0} accent="text-violet-300" />
        <Stat icon={ShieldCheck} label="Findings resolved" value={trend?.findingsResolved ?? 0} accent="text-emerald-300" />
        <Stat icon={TrendingUp} label="Open right now" value={trend?.openNow ?? 0} accent="text-foreground" />
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Wrench;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-md border border-border/60 bg-background/40 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className={cn('mt-1 text-2xl font-light', accent)}>{value}</div>
    </div>
  );
}

export default SecurityTrendsCard;
