/**
 * SidebarBriefing — the compact "Good afternoon · Score · headline" block
 * that lives at the top of the Wrayth sidebar.
 */
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getRayContext, type RayContext } from '@/lib/ray';
import { Eye } from 'lucide-react';

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

export function SidebarBriefing() {
  const { user } = useAuth();
  const [ctx, setCtx] = useState<RayContext | null>(null);

  useEffect(() => {
    let active = true;
    if (!user) return;
    void getRayContext(user.id).then((c) => { if (active) setCtx(c); });
    return () => { active = false; };
  }, [user]);

  const firstName = useMemo(() => {
    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const full = (meta.full_name as string | undefined) ?? (meta.name as string | undefined);
    if (full && typeof full === 'string') return full.split(' ')[0];
    if (user?.email) return user.email.split('@')[0];
    return 'there';
  }, [user]);

  const score = ctx?.latestScore?.score ?? null;

  return (
    <div className="px-4 py-4 border-b border-border">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Eye className="h-3.5 w-3.5" />
        <span>{greet()}, {firstName}</span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Security Score</span>
        <span className="text-2xl font-light tabular-nums text-foreground">{score ?? '—'}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground leading-snug">{headline(ctx)}</p>
    </div>
  );
}
