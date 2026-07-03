/**
 * FloatingRayChat — global "Ask Ray" affordance.
 *
 * A living, contextual orb. Reads RayContext to decide the label + tone
 * (healthy / attention / scanning / threat), pulses gently, and casts a
 * soft glow. Opens the full Ray conversation on click.
 */
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { getRayContext, type RayContext } from '@/lib/ray';
import { getRouteContext } from '@/lib/ray/routeContext';
import RaySkillsPanel from './RaySkillsPanel';
import { dedupeRecs } from './recDedupe';

export type RayPanelOpenDetail = {
  message?: string;
  context?: {
    kind: 'recommendation' | 'finding' | 'device' | 'identity' | 'other';
    id?: string;
    title?: string;
    body?: string;
    evidence?: Record<string, unknown>;
  };
};

type Tone = 'healthy' | 'attention' | 'threat' | 'scanning' | 'idle';

const TONE_STYLES: Record<Tone, { ring: string; glow: string; dot: string; core: string }> = {
  healthy:   { ring: 'ring-emerald-400/30', glow: 'shadow-[0_0_40px_-8px_rgba(52,211,153,0.55)]', dot: 'bg-emerald-400', core: 'from-emerald-400/40 to-emerald-600/30' },
  attention: { ring: 'ring-amber-400/40',   glow: 'shadow-[0_0_44px_-8px_rgba(251,191,36,0.55)]', dot: 'bg-amber-400',   core: 'from-amber-400/40 to-amber-600/30' },
  threat:    { ring: 'ring-red-400/40',     glow: 'shadow-[0_0_50px_-8px_rgba(248,113,113,0.65)]', dot: 'bg-red-400',    core: 'from-red-400/40 to-red-600/30' },
  scanning:  { ring: 'ring-primary/40',     glow: 'shadow-[0_0_44px_-8px_hsl(262_70%_60%/0.6)]',   dot: 'bg-primary',     core: 'from-primary/40 to-primary/20' },
  idle:      { ring: 'ring-primary/30',     glow: 'shadow-[0_0_36px_-10px_hsl(262_70%_60%/0.55)]', dot: 'bg-primary',     core: 'from-primary/40 to-primary/20' },
};

function toneFrom(ctx: RayContext | null): { tone: Tone; priorityTag: string | null } {
  if (!ctx) return { tone: 'scanning', priorityTag: null };
  const recs = dedupeRecs(ctx.recommendations ?? []);
  const critical = recs.some((r) => ['critical', 'high'].includes((r.severity ?? '').toLowerCase()));
  if (critical) return { tone: 'threat', priorityTag: `${recs.length} priority` };
  if (recs.length > 0) {
    return { tone: 'attention', priorityTag: `${recs.length} priority` };
  }
  if (!ctx.hasOnboarded) return { tone: 'idle', priorityTag: 'Setup' };
  return { tone: 'healthy', priorityTag: 'All clear' };
}

/** Ray's identity mark — a stylized watching core. */
function RayMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="rayCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="0.95" />
          <stop offset="55%" stopColor="white" stopOpacity="0.35" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.1" />
      <circle cx="12" cy="12" r="6" stroke="currentColor" strokeOpacity="0.8" strokeWidth="1.1" />
      <circle cx="12" cy="12" r="3" fill="url(#rayCore)" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function FloatingRayChat() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const [ctx, setCtx] = useState<RayContext | null>(null);

  useEffect(() => {
    let active = true;
    if (!user) return;
    void getRayContext(user.id).then((c) => { if (active) setCtx(c); });
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    function onOpen(e: Event) {
      const detail = (e as CustomEvent<RayPanelOpenDetail>).detail ?? {};
      setOpen(true);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('ray:panel-send', { detail }));
      }, 60);
    }
    window.addEventListener('ray:panel-open', onOpen);
    return () => window.removeEventListener('ray:panel-open', onOpen);
  }, []);

  const { tone, priorityTag } = useMemo(() => toneFrom(ctx), [ctx]);
  const styles = TONE_STYLES[tone];
  const location = useLocation();
  const route = useMemo(() => getRouteContext(location.pathname), [location.pathname]);

  // Rotating status verb, driven by the current route.
  const [statusIdx, setStatusIdx] = useState(0);
  useEffect(() => {
    setStatusIdx(0);
    if (route.statusPool.length <= 1) return;
    const iv = setInterval(() => {
      setStatusIdx((i) => (i + 1) % route.statusPool.length);
    }, 3400);
    return () => clearInterval(iv);
  }, [route]);

  const statusVerb = route.statusPool[statusIdx] ?? 'Watching';
  const badgeSuffix = priorityTag ? ` · ${priorityTag}` : '';
  const ariaLabel = `Ask Ray — ${statusVerb}${badgeSuffix}`;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label={ariaLabel}
          className={`group fixed bottom-8 right-8 z-40 safe-area-inset-bottom outline-none`}
        >
          {/* Ambient breathing glow */}
          <motion.span
            aria-hidden
            className={`pointer-events-none absolute -inset-4 rounded-full blur-2xl ${styles.glow}`}
            animate={{ opacity: [0.55, 0.9, 0.55], scale: [1, 1.08, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Orbiting sparkle */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
          >
            <span className="absolute -top-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white/80 shadow-[0_0_6px_2px_rgba(255,255,255,0.6)]" />
          </motion.span>

          <div
            className={[
              'relative flex items-center gap-3 rounded-full pl-2 pr-4 py-2',
              'bg-gradient-to-br from-[hsl(262_45%_18%)] via-[hsl(262_50%_22%)] to-[hsl(262_60%_28%)]',
              'ring-1 backdrop-blur-md transition-all duration-300',
              'group-hover:scale-[1.03] group-hover:pr-5',
              styles.ring,
              styles.glow,
            ].join(' ')}
          >
            {/* Ray core */}
            <span className={`relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${styles.core}`}>
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-full bg-white/10"
                animate={{ opacity: [0.15, 0.35, 0.15], scale: [1, 1.15, 1] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <RayMark className="relative h-5 w-5 text-white" />
            </span>

            {/* Label + contextual status */}
            <div className="flex flex-col items-start leading-tight pr-1">
              <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                Ray
                <motion.span
                  aria-hidden
                  className={`inline-block h-1.5 w-1.5 rounded-full ${styles.dot}`}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
              <span className="text-[10px] uppercase tracking-[0.18em] text-white/60">{label}</span>
            </div>

            {/* Subtle light sweep on hover */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
            >
              <span className="absolute -left-1/2 top-0 h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-700 group-hover:left-full group-hover:opacity-100" />
            </span>
          </div>
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 border-l bg-background overflow-hidden"
      >
        <div className="h-full p-4">
          <RaySkillsPanel />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default FloatingRayChat;
