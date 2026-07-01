/**
 * Identity — Ray's view of the user's digital surface.
 * Aggregates the user's primary auth identity + every asset Ray watches on the
 * open and dark web (emails / domains / brands) and reports breach exposure
 * per item. Conversational, no module artwork.
 */
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AtSign, Globe, Hash, ShieldCheck, ShieldAlert, Plus, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { RayPageHeader } from '@/components/ray/RayPageHeader';
import { RayConversationCard } from '@/components/ray/RayConversationCard';
import { IdentityGraphPanel } from '@/components/ray/IdentityGraphPanel';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface IdentityAsset {
  id: string;
  asset_type: string;
  asset_value: string;
  threats_found: number;
  last_scan_at: string | null;
}

const TYPE_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  email: { label: 'Email', icon: AtSign },
  domain: { label: 'Domain', icon: Globe },
  brand: { label: 'Brand', icon: Hash },
};

export default function Identity() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<IdentityAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('safeweb_assets')
        .select('id, asset_type, asset_value, threats_found, last_scan_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!cancelled) {
        setAssets((data as IdentityAsset[]) ?? []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const totals = useMemo(() => {
    const watched = assets.length;
    const exposed = assets.filter((a) => (a.threats_found ?? 0) > 0).length;
    const clean = assets.filter((a) => a.last_scan_at && (a.threats_found ?? 0) === 0).length;
    return { watched, exposed, clean };
  }, [assets]);

  const grouped = useMemo(() => {
    const groups: Record<string, IdentityAsset[]> = {};
    for (const a of assets) {
      (groups[a.asset_type] ??= []).push(a);
    }
    return groups;
  }, [assets]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <RayPageHeader
        title="Identity"
        description="The accounts, addresses, and personas I'm watching on your behalf."
        right={
          <Link to="/app/exposure">
            <Button variant="outline" size="sm" className="rounded-sm border-border">
              <Plus className="h-4 w-4 mr-2" /> Add identity
            </Button>
          </Link>
        }
      />

      <RayConversationCard context="identity" />

      <IdentityGraphPanel assets={assets} primaryEmail={user?.email ?? null} />

      {/* Primary identity */}
      <section className="rounded-2xl border border-border bg-card/40 p-5 sm:p-6">
        <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Primary identity</div>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl border border-border bg-background flex items-center justify-center">
            <AtSign className="h-4 w-4 text-foreground/80" />
          </div>
          <div className="min-w-0">
            <div className="text-base text-foreground truncate">{user?.email ?? 'Not signed in'}</div>
            <div className="text-xs text-muted-foreground">The account Ray reports back to.</div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="rounded-2xl border border-border bg-card/40 p-5 sm:p-6">
        <div className="grid grid-cols-3 gap-6">
          <Stat label="Identities watched" value={totals.watched} tone="neutral" />
          <Stat label="Currently exposed" value={totals.exposed} tone={totals.exposed > 0 ? 'warning' : 'success'} />
          <Stat label="Clean" value={totals.clean} tone="success" />
        </div>
      </section>

      {/* Grouped surface */}
      <section className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : assets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/30 p-8 text-center">
            <p className="text-sm text-foreground">I'm not watching any identities yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add an email, domain, or brand and I'll start monitoring breach data and dark-web mentions.
            </p>
            <Link to="/app/exposure" className="inline-block mt-4">
              <Button size="sm" className="rounded-sm bg-violet-500 hover:bg-violet-400 text-white">
                <Plus className="h-4 w-4 mr-2" /> Add the first one
              </Button>
            </Link>
          </div>
        ) : (
          Object.entries(grouped).map(([type, items]) => {
            const meta = TYPE_META[type] ?? { label: type, icon: Hash };
            const Icon = meta.icon;
            return (
              <div key={type} className="rounded-2xl border border-border bg-card/40 overflow-hidden">
                <div className="px-5 py-3 border-b border-border/60 flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    {meta.label}s
                  </span>
                  <span className="text-[11px] text-muted-foreground/60 ml-auto">{items.length}</span>
                </div>
                <ul className="divide-y divide-border/40">
                  {items.map((item, idx) => (
                    <motion.li
                      key={item.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.02 }}
                      className="px-5 py-3 flex items-center gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-foreground truncate">{item.asset_value}</div>
                        <div className="text-xs text-muted-foreground italic">
                          {(item.threats_found ?? 0) > 0
                            ? `Ray found ${item.threats_found} exposure${item.threats_found > 1 ? 's' : ''} tied to this.`
                            : item.last_scan_at
                            ? 'Ray hasn\u2019t seen this anywhere it shouldn\u2019t be.'
                            : 'Ray will scan this on the next sweep.'}
                        </div>
                      </div>
                      {(item.threats_found ?? 0) > 0 ? (
                        <ShieldAlert className="h-4 w-4 text-yellow-400" />
                      ) : (
                        <ShieldCheck className="h-4 w-4 text-green-400/80" />
                      )}
                    </motion.li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'neutral' | 'success' | 'warning' }) {
  const toneClass =
    tone === 'warning'
      ? 'text-yellow-300'
      : tone === 'success'
      ? 'text-green-300'
      : 'text-foreground';
  return (
    <div>
      <div className={cn('text-3xl sm:text-4xl font-extralight tabular-nums leading-none', toneClass)}>{value}</div>
      <div className="mt-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
    </div>
  );
}
