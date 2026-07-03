/**
 * RayProactiveGreeting — the "she was thinking about you while you were
 * gone" opener that replaces the empty Ask Ray box on the device page.
 *
 * Renders:
 *   1. A varied greeting  (Good evening, Brandon.)
 *   2. A page/posture-specific opener  (I reviewed R15 while you were away.)
 *   3. 3-5 posture bullets, colored by tone.
 *   4. A continuity line if the last action succeeded recently
 *      ("Earlier today we installed KB5097149. You're now at 90/100.")
 *   5. A closing question that varies too.
 *
 * All conversational chips live on the sibling AskRayCommandBox.
 */
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, AlertTriangle, Info, ShieldAlert, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { buildGreeting, deviceNarrative, type NarrativeBullet } from '@/lib/ray/greeting';
import type { DevicePosture } from './DeviceSecurityTabs';

interface Props {
  hostname?: string;
  posture: DevicePosture | null;
  deviceId: string;
  /** Optional live security score used in continuity phrasing. */
  score?: number | null;
}

interface LastAction {
  action_type: string;
  completed_at: string;
  new_value: any;
  result: any;
}

const TONE_STYLES: Record<NarrativeBullet['tone'], { icon: typeof Check; className: string }> = {
  good: { icon: Check,        className: 'text-emerald-300' },
  warn: { icon: AlertTriangle, className: 'text-amber-300' },
  bad:  { icon: ShieldAlert,  className: 'text-red-300' },
  info: { icon: Info,          className: 'text-violet-200' },
};

function firstNameOf(user: any): string | null {
  if (!user) return null;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const full = (meta.full_name as string | undefined) ?? (meta.name as string | undefined);
  if (full) return String(full).split(' ')[0];
  if (user.email) {
    const local = String(user.email).split('@')[0];
    // strip separators, capitalize the first token — better than the raw local part.
    const token = local.split(/[._-]/)[0];
    if (token && /^[a-zA-Z]/.test(token)) return token.charAt(0).toUpperCase() + token.slice(1);
  }
  return null;
}

function relativeShort(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3600_000)}h ago`;
  return `${Math.round(diff / 86_400_000)}d ago`;
}

function continuityLine(
  last: LastAction | null,
  score: number | null | undefined,
  posture: DevicePosture | null,
): string | null {
  if (!last) return null;
  const when = relativeShort(last.completed_at);
  const withinDay = Date.now() - new Date(last.completed_at).getTime() < 36 * 3600_000;
  if (!withinDay) return null;

  const label = String(last.action_type).replace(/_/g, ' ');
  const kbBits: string[] = [];
  const results = Array.isArray(last.result) ? last.result : last.result ? [last.result] : [];
  for (const r of results) {
    if (r && typeof r === 'object') {
      for (const k of ['kb', 'kb_id', 'title', 'name']) {
        const v = (r as any)[k];
        if (typeof v === 'string' && v.trim()) { kbBits.push(v.trim()); break; }
      }
    }
  }
  const detail = kbBits.length ? ` (${kbBits.slice(0, 2).join(', ')})` : '';
  const scorePart = typeof score === 'number' ? ` You\u2019re now at ${score}/100.` : '';

  // Reconcile with current posture so we don't sound contradictory when Windows
  // has surfaced additional pending updates since our last successful run.
  const isUpdateAction = /update/i.test(last.action_type);
  const pending = posture?.pending_updates ?? 0;
  if (isUpdateAction && pending > 0) {
    const n = pending === 1 ? '1 new update' : `${pending} new updates`;
    return `Earlier (${when}) we ran ${label}${detail} successfully. Windows has since surfaced ${n} — that's what's showing as pending now.${scorePart}`;
  }

  return `Earlier (${when}) we ran ${label}${detail} successfully.${scorePart}`;
}

export function RayProactiveGreeting({ hostname, posture, deviceId, score }: Props) {
  const { user } = useAuth();
  const [lastAction, setLastAction] = useState<LastAction | null>(null);
  // Fresh seed once per mount so the greeting varies each page load without
  // reshuffling on every state update (which would feel jittery).
  const seed = useMemo(() => Math.floor(Math.random() * 1_000_000), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('wrayth_device_actions')
        .select('action_type, completed_at, new_value, result')
        .eq('device_id', deviceId)
        .eq('status', 'succeeded')
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(1);
      if (cancelled) return;
      const row = (data ?? [])[0] as LastAction | undefined;
      setLastAction(row ?? null);
    })();
    return () => { cancelled = true; };
  }, [deviceId]);

  const firstName = firstNameOf(user);
  const greeting = useMemo(
    () => buildGreeting({ firstName, page: 'device', hostname, posture, seed }),
    [firstName, hostname, posture, seed],
  );
  const bullets = useMemo(() => deviceNarrative(posture), [posture]);
  const cont = useMemo(() => continuityLine(lastAction, score), [lastAction, score]);

  if (!posture && !firstName) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="rounded-xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent p-4"
    >
      <div className="text-[10px] uppercase tracking-[0.24em] text-violet-200/70 mb-2">Ray</div>

      <p className="text-[15px] leading-snug text-foreground">
        <span className="font-medium">{greeting.hello}</span>{' '}
        <span className="text-muted-foreground">{greeting.opener}</span>
      </p>

      {bullets.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-[13px]">
          {bullets.map((b, i) => {
            const { icon: Icon, className } = TONE_STYLES[b.tone];
            return (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.06, duration: 0.25 }}
                className="flex items-start gap-2"
              >
                <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${className}`} />
                <span className="text-foreground/90">{b.text}</span>
              </motion.li>
            );
          })}
        </ul>
      )}

      {cont && (
        <div className="mt-3 flex items-start gap-2 text-[12px] text-emerald-200/90 border-t border-border/40 pt-2">
          <Clock className="h-3 w-3 mt-0.5 shrink-0" />
          <span>{cont}</span>
        </div>
      )}

      <p className="mt-3 text-[12px] text-muted-foreground italic">{greeting.closer}</p>
    </motion.div>
  );
}

export default RayProactiveGreeting;
