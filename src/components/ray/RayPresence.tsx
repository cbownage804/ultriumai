/**
 * RayPresence — the top-right "Ray is here" indicator.
 *
 * A small monochrome eye with a soft violet pulse. Click opens a
 * popover showing Ray's live state: score, open recommendations,
 * last sync time, and quick actions.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Eye, MessageSquare, Activity, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { isWraythDomain } from '@/utils/subdomain';
import { useAuth } from '@/hooks/useAuth';
import { getRayContext, type RayContext } from '@/lib/ray';

function path(p: string) {
  return isWraythDomain() ? p : `/app${p}`;
}

function summary(ctx: RayContext | null): string {
  if (!ctx) return 'Getting oriented…';
  if (!ctx.hasOnboarded) return "Let's finish setting you up.";
  const openRecs = ctx.recommendations.length;
  const score = ctx.latestScore?.score ?? null;
  if (score === null) return "Building today's assessment…";
  if (openRecs === 0) return 'Nothing needs your attention right now.';
  if (openRecs === 1) return 'One thing worth a look when you have a moment.';
  return `${openRecs} things I'd like you to see.`;
}

export function RayPresence() {
  const { user } = useAuth();
  const [ctx, setCtx] = useState<RayContext | null>(null);
  const [, force] = useState(0);

  useEffect(() => {
    let active = true;
    if (!user) return;
    void getRayContext(user.id).then((c) => { if (active) setCtx(c); });
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const openAskRay = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
  };

  const score = ctx?.latestScore?.score ?? null;
  const scoreTone =
    score == null ? 'text-foreground' : score >= 80 ? 'text-green-300' : score >= 60 ? 'text-yellow-300' : 'text-red-300';
  const openRecs = ctx?.recommendations.length ?? 0;
  const lastSync = ctx?.latestScore?.created_at ? new Date(ctx.latestScore.created_at) : null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative min-h-[44px] min-w-[44px] rounded-full"
          aria-label="Ray presence"
        >
          <span className="relative inline-flex items-center justify-center">
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full bg-violet-500/20"
              animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <Eye className="h-4 w-4 text-violet-300 relative" />
          </span>
          {openRecs > 0 && (
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-violet-400" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 overflow-hidden">
        <div className="p-4 border-b border-border/60">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-violet-300/80">
            <motion.span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full bg-green-400"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            />
            Ray is here
          </div>
          <p className="mt-2 text-sm text-foreground/90 leading-snug">{summary(ctx)}</p>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-sm bg-muted/40 py-2">
              <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Score</div>
              <div className={`text-lg font-light tabular-nums ${scoreTone}`}>{score ?? '—'}</div>
            </div>
            <div className="rounded-sm bg-muted/40 py-2">
              <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Open</div>
              <div className="text-lg font-light tabular-nums text-foreground">{openRecs}</div>
            </div>
            <div className="rounded-sm bg-muted/40 py-2">
              <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Synced</div>
              <div className="text-[11px] font-light text-foreground/80 pt-1">
                {lastSync ? formatDistanceToNow(lastSync, { addSuffix: false }) : '—'}
              </div>
            </div>
          </div>
        </div>
        <div className="p-1.5">
          <button
            onClick={openAskRay}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-sm text-sm text-foreground/90 hover:bg-accent transition-colors"
          >
            <MessageSquare className="h-4 w-4 text-violet-300" />
            <span className="flex-1 text-left">Ask Ray anything</span>
            <span className="text-[10px] text-muted-foreground tracking-wider">⌘K</span>
          </button>
          <Link
            to={path('/timeline')}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-sm text-sm text-foreground/90 hover:bg-accent transition-colors"
          >
            <Activity className="h-4 w-4 text-violet-300" />
            <span>Ray's timeline</span>
          </Link>
          <Link
            to={path('/trust')}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-sm text-sm text-foreground/90 hover:bg-accent transition-colors"
          >
            <ShieldCheck className="h-4 w-4 text-violet-300" />
            <span>Trust Center</span>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default RayPresence;
