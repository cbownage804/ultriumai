/**
 * SidebarBriefing — the compact Ray status block that lives at the top
 * of the Wrayth sidebar. Shows greeting, live "Ray is watching" status,
 * current security score, and last sync time.
 */
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getRayContext, type RayContext } from '@/lib/ray';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ExplainThis } from './ExplainThis';

function greet(now = new Date()) {
  const h = now.getHours();
  if (h < 5) return 'Good evening';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function headline(ctx: RayContext | null): string {
  if (!ctx) return 'Ray is checking…';
  if (!ctx.hasOnboarded) return "Let's get you set up.";
  const score = ctx.latestScore?.score ?? null;
  if (score === null) return "Building today's assessment…";
  if (score >= 90) return 'Everything looks healthy.';
  if (score >= 70) return "You're in good shape.";
  if (score >= 50) return 'A few things to tighten up.';
  return 'We have work to do.';
}

const STATUS_WORDS = ['Watching', 'Scanning', 'Reviewing', 'Listening', 'Monitoring'];

export function SidebarBriefing() {
  const { user } = useAuth();
  const [ctx, setCtx] = useState<RayContext | null>(null);
  const [lastSync] = useState(() => new Date());
  const [, force] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    let active = true;
    if (!user) return;
    void getRayContext(user.id).then((c) => { if (active) setCtx(c); });
    return () => { active = false; };
  }, [user]);

  // Refresh "last sync" label every minute without changing the timestamp.
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // Rotate the "alive" word every 20s so Ray feels present.
  useEffect(() => {
    const id = setInterval(() => setStatusIdx((i) => (i + 1) % STATUS_WORDS.length), 20_000);
    return () => clearInterval(id);
  }, []);


  const firstName = useMemo(() => {
    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const full = (meta.full_name as string | undefined) ?? (meta.name as string | undefined);
    if (full && typeof full === 'string') return full.split(' ')[0];
    if (user?.email) return user.email.split('@')[0];
    return 'there';
  }, [user]);

  const score = ctx?.latestScore?.score ?? null;
  const scoreTone =
    score == null ? 'text-foreground' : score >= 80 ? 'text-green-300' : score >= 60 ? 'text-yellow-300' : 'text-red-300';

  const isPerfect = score === 100;

  return (
    <div className="px-4 py-4 border-b border-border space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{greet()}, {firstName}</span>
        <div className="group relative">
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-green-300/80 cursor-default">
            <motion.span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full bg-green-400"
              animate={{ opacity: [0.35, 1, 0.35], scale: [1, 1.15, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.span
              key={statusIdx}
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              {STATUS_WORDS[statusIdx]}
            </motion.span>

          </span>
          <div className="pointer-events-none absolute right-0 top-full mt-2 z-50 w-56 rounded-md border border-border bg-popover px-3 py-2.5 text-[11px] text-foreground/90 shadow-lg opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
            <div className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground mb-1.5">Ray is monitoring</div>
            <ul className="space-y-1">
              <li className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-green-400" /> Microsoft advisories</li>
              <li className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-green-400" /> Breach databases</li>
              <li className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-green-400" /> Saved passwords</li>
              <li className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-green-400" /> Identity changes</li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground flex items-center gap-1.5">
          <span>Security Score</span>
          <ExplainThis
            title="How Ray scores your security"
            body="A single 0–100 view of how protected you are right now. Ray weighs vault health, active threats, exposed identities, and account hardening."
            bullets={[
              '80+ means you\'re in good shape.',
              '60–79 means there\'s something worth tightening.',
              'Below 60 means Ray wants your attention today.',
            ]}
          />
          {isPerfect && (
            <motion.span
              aria-hidden
              className="inline-block h-1 w-1 rounded-full bg-green-400"
              animate={{ opacity: [0, 0, 0.9, 0, 0] }}
              transition={{ duration: 20, repeat: Infinity, times: [0, 0.35, 0.5, 0.65, 1], ease: 'easeInOut' }}
            />
          )}
        </div>
        <motion.div
          animate={{ opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className={`mt-0.5 text-2xl font-light tabular-nums ${scoreTone}`}
        >
          {score ?? '—'}
        </motion.div>
      </div>

      <p className="text-xs text-muted-foreground leading-snug">{headline(ctx)}</p>

      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="uppercase tracking-[0.18em]">Last sync</span>
        <span>{formatDistanceToNow(lastSync, { addSuffix: true })}</span>
      </div>
    </div>
  );
}
