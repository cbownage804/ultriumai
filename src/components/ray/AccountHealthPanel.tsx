/**
 * AccountHealthPanel — Wrayth 4.0
 *
 * "Secure Your Accounts" — shows providers Ray knows how to harden,
 * with a per-provider health bar and a Secure-with-Ray launcher.
 *
 * Inputs:
 * - vault entries (matched via `findProviderForValue`) tell Ray which
 *   accounts the user actually has,
 * - `ray_account_health` rows persist per-provider score,
 * - finishing a `secure-*` playbook bumps that provider's score
 *   (handled in `engine.ts > handleCompletion`).
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  SECURE_PROVIDERS,
  findProviderForValue,
  type SecureProvider,
} from '@/lib/ray/providers/catalog';

type HealthRow = { provider: string; score: number; last_completed_at: string | null };

function scoreTone(score: number) {
  if (score >= 85) return 'bg-emerald-400';
  if (score >= 60) return 'bg-amber-400';
  return 'bg-rose-400';
}

function ProviderRow({ provider, score, lastDone }: { provider: SecureProvider; score: number; lastDone: string | null }) {
  const isLow = score < 60;
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-100">{provider.name}</span>
          {isLow && (
            <span className="text-[10px] uppercase tracking-[0.18em] text-amber-300/80">
              Needs attention
            </span>
          )}
          {lastDone && score >= 85 && (
            <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-300/80">
              Hardened
            </span>
          )}
        </div>
        <div className="mt-1.5 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className={cn('h-full transition-all duration-700', scoreTone(score))}
            style={{ width: `${Math.max(4, score)}%` }}
          />
        </div>
      </div>
      <div className="w-10 text-right text-xs tabular-nums text-slate-300">{score}%</div>
      <Button
        asChild
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-xs text-violet-200 hover:text-white hover:bg-violet-500/10"
      >
        <Link to={`/app/ray/secure/${provider.id}`}>
          <Sparkles className="h-3 w-3 mr-1" /> Secure
          <ArrowRight className="h-3 w-3 ml-1" />
        </Link>
      </Button>
    </div>
  );
}

export function AccountHealthPanel() {
  const { user } = useAuth();
  const [health, setHealth] = useState<Record<string, HealthRow>>({});
  const [detected, setDetected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    void (async () => {
      const [healthRes, vaultRes] = await Promise.all([
        supabase
          .from('ray_account_health')
          .select('provider,score,last_completed_at')
          .eq('user_id', user.id),
        supabase
          .from('safepass_entries')
          .select('title,website,url')
          .eq('user_id', user.id)
          .limit(500),
      ]);
      if (!alive) return;

      const hmap: Record<string, HealthRow> = {};
      ((healthRes.data ?? []) as HealthRow[]).forEach((r) => { hmap[r.provider] = r; });
      setHealth(hmap);

      const det = new Set<string>();
      const rows = (vaultRes.data ?? []) as Array<{ title?: string | null; website?: string | null; url?: string | null }>;
      for (const row of rows) {
        const candidate = row.website || row.url || row.title;
        const match = findProviderForValue(candidate ?? null);
        if (match) det.add(match.id);
      }
      setDetected(det);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [user]);

  const ordered = useMemo(() => {
    // Only show providers Ray has real signal for: either the user has a
    // matching vault entry, or Ray has already recorded a health score.
    // No detected accounts + no scores → render nothing (no placeholder bars).
    const inVault = SECURE_PROVIDERS.filter((p) => detected.has(p.id));
    const known = SECURE_PROVIDERS.filter((p) => !detected.has(p.id) && health[p.id]);
    return [...inVault, ...known];
  }, [detected, health]);

  if (loading) return null;
  if (ordered.length === 0) return null;

  return (
    <section className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-950/60 p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-violet-300/80">
            <ShieldCheck className="h-3 w-3" /> Secure your accounts
          </div>
          <h2 className="mt-1 text-lg font-light tracking-tight text-slate-50">
            Ray will walk you through it.
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Pick an account and I'll guide you through every step — passkeys, 2FA, recovery, the works.
          </p>
        </div>
      </header>

      <div className="mt-4 divide-y divide-white/5">
        {ordered.map((p) => (
          <ProviderRow
            key={p.id}
            provider={p}
            score={health[p.id]?.score ?? 50}
            lastDone={health[p.id]?.last_completed_at ?? null}
          />
        ))}
      </div>
    </section>
  );
}

export default AccountHealthPanel;
