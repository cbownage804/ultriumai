/**
 * MorningBrief — the standalone /app/brief surface.
 *
 * Reuses Ray's brain for the AI-generated briefing, then layers an "overnight
 * delta" (what Ray did since your last visit) and a list of currently open
 * recommendations grouped by area. This is the page that makes Ray feel alive
 * when the user comes back tomorrow.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Loader2, Sparkles, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRayBrain } from '@/lib/ray/brain';
import {
  overnightDelta,
  pageHrefForArea,
  type OvernightDelta,
  type RayInsightArea,
} from '@/lib/ray/insights';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { RayPageHeader } from '@/components/ray/RayPageHeader';
import { cn } from '@/lib/utils';

function firstNameOf(user: { email?: string | null; user_metadata?: Record<string, unknown> | null } | null): string {
  if (!user) return 'there';
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const full = (meta.full_name as string | undefined) ?? (meta.name as string | undefined);
  if (full) return String(full).split(' ')[0];
  if (user.email) return user.email.split('@')[0];
  return 'there';
}

function areaLabel(a: RayInsightArea): string {
  return ({ passwords: 'passwords', threats: 'threats', exposure: 'exposures', identity: 'identities', devices: 'devices', home: 'signals' } as const)[a];
}

function priorityBadge(p: number) {
  if (p >= 70) return { label: 'High', cls: 'bg-red-500/15 text-red-300 border-red-500/30' };
  if (p >= 40) return { label: 'Medium', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
  return { label: 'Low', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
}

export default function MorningBrief() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    briefing,
    recommendations,
    isLoading,
    isGenerating,
    refresh,
    completeRecommendation,
    dismissRecommendation,
  } = useRayBrain({ pageContext: 'home' });

  const [delta, setDelta] = useState<OvernightDelta | null>(null);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user) return;
      // Pull last_seen_at from ray_profiles, then update it to "now".
      const { data: profile } = await supabase
        .from('ray_profiles')
        .select('last_seen_at')
        .eq('user_id', user.id)
        .maybeSingle();
      const since = profile?.last_seen_at
        ? new Date(profile.last_seen_at)
        : new Date(Date.now() - 24 * 3600_000);
      if (!active) return;
      setLastSeen(since);
      const d = await overnightDelta(user.id, since);
      if (!active) return;
      setDelta(d);
      // Touch last_seen_at so the next visit's delta is "since now".
      await supabase
        .from('ray_profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('user_id', user.id);
    })();
    return () => { active = false; };
  }, [user]);

  const firstName = useMemo(() => firstNameOf(user ?? null), [user]);

  const greeting = briefing?.greeting ?? `Good morning, ${firstName}.`;
  const bullets = briefing?.bullets?.length
    ? briefing.bullets
    : ['I checked your monitored accounts overnight.', 'Nothing urgent — I will keep watching.'];

  const overnightLine = useMemo(() => {
    if (!delta) return null;
    const parts: string[] = [];
    const order: RayInsightArea[] = ['identity', 'devices', 'passwords', 'threats', 'exposure'];
    for (const area of order) {
      const n = delta.insightsByArea[area];
      if (n > 0) parts.push(`${n} ${areaLabel(area)}`);
    }
    if (parts.length === 0) return "I didn't see anything new since we last spoke.";
    return `Since we last spoke I checked ${parts.join(', ')}.`;
  }, [delta]);

  const grouped = useMemo(() => {
    const m = new Map<string, typeof recommendations>();
    for (const r of recommendations) {
      const key = r.page_context ?? 'home';
      const arr = m.get(key) ?? [];
      arr.push(r);
      m.set(key, arr);
    }
    return Array.from(m.entries());
  }, [recommendations]);

  return (
    <div className="space-y-6 max-w-4xl">
      <RayPageHeader
        eyebrow="MORNING BRIEF"
        title="Ray's morning brief"
        subtitle={lastSeen ? `Catching you up since ${lastSeen.toLocaleString()}.` : 'Catching you up.'}
      />

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-6 sm:p-8"
      >
        <motion.div
          aria-hidden
          className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl"
          animate={{ opacity: isGenerating ? [0.3, 0.6, 0.3] : 0.25 }}
          transition={{ duration: 2.4, repeat: isGenerating ? Infinity : 0 }}
        />

        <div className="relative flex items-center gap-2 text-violet-300/90 text-xs uppercase tracking-[0.18em] mb-3">
          <Sparkles className="h-3.5 w-3.5" />
          {isGenerating ? 'Ray is thinking…' : "Ray's briefing"}
          {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
        </div>

        <h1 className="relative text-2xl sm:text-3xl font-semibold text-white tracking-tight">
          {greeting}
        </h1>

        {overnightLine && (
          <p className="relative mt-3 text-[15px] text-violet-200/85">
            {overnightLine}
            {delta && delta.newCritical + delta.newHigh > 0 && (
              <>
                {' '}
                <span className="text-amber-200/90">
                  {delta.newCritical > 0 ? `${delta.newCritical} critical` : ''}
                  {delta.newCritical > 0 && delta.newHigh > 0 ? ' and ' : ''}
                  {delta.newHigh > 0 ? `${delta.newHigh} high-priority` : ''}
                  {' '}items need your attention.
                </span>
              </>
            )}
          </p>
        )}

        <ul className="relative mt-4 space-y-1.5">
          {bullets.map((b, i) => (
            <li key={i} className="text-[15px] text-slate-200/90 leading-relaxed">• {b}</li>
          ))}
        </ul>

        <div className="relative mt-6 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-white/5 border-white/10 text-slate-100 hover:bg-white/10"
            onClick={() => refresh()}
            disabled={isGenerating}
          >
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-2" />}
            Ask Ray to re-check
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-300 hover:text-white"
            onClick={() => navigate('/app/timeline')}
          >
            Open timeline <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </motion.section>

      {grouped.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground/80">What Ray recommends</h2>
          <div className="space-y-3">
            {grouped.map(([area, items]) => (
              <div key={area} className="rounded-2xl border border-border bg-card/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{area}</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => navigate(pageHrefForArea((area as RayInsightArea) ?? 'home'))}
                  >
                    Open <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
                <ul className="space-y-2">
                  {items.map((rec) => {
                    const pri = priorityBadge(rec.priority);
                    return (
                      <li key={rec.id} className="flex items-start gap-3 p-3 rounded-lg bg-background/60 border border-border/60">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn('text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm border', pri.cls)}>
                              {pri.label}
                            </span>
                            <span className="text-sm font-medium text-foreground truncate">{rec.title}</span>
                          </div>
                          {rec.body && <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{rec.body}</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-400 hover:text-emerald-300" onClick={() => completeRecommendation(rec.id)} aria-label="Mark done">
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => dismissRecommendation(rec.id)} aria-label="Dismiss">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {grouped.length === 0 && !isLoading && (
        <p className="text-sm text-muted-foreground">
          Ray has no outstanding recommendations for you right now. I&apos;ll surface things here the moment they appear.
        </p>
      )}
    </div>
  );
}
