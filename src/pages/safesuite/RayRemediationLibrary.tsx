/**
 * RayRemediationLibrary — browsable catalog of every one-click fix Ray can
 * dispatch to a Wrayth-enrolled device. Grouped by category with per-item
 * Fix It buttons that queue the action via the device picker.
 */
import { useMemo, useState } from 'react';
import { RotateCw, Search, Sparkles, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RayPageHeader } from '@/components/ray/RayPageHeader';
import { RayPageTemplate } from '@/components/ray/RayPageTemplate';
import { RayBrief } from '@/components/ray/RayBrief';
import { RemediationDispatchButton } from '@/components/ray/RemediationDispatchButton';
import {
  CATEGORY_LABELS,
  REMEDIATION_CATALOG,
  groupRemediationsByCategory,
  type RemediationCategory,
} from '@/lib/ray/remediations/catalog';

const RISK_CLS: Record<'low' | 'medium' | 'high', string> = {
  low: 'border-emerald-500/40 text-emerald-200',
  medium: 'border-amber-500/40 text-amber-200',
  high: 'border-red-500/40 text-red-300',
};

export default function RayRemediationLibrary() {
  const [q, setQ] = useState('');
  const [activeCat, setActiveCat] = useState<RemediationCategory | 'all'>('all');

  const groups = useMemo(() => {
    const all = groupRemediationsByCategory();
    const filtered = all.map((g) => ({
      ...g,
      items: g.items.filter((r) => {
        if (activeCat !== 'all' && r.category !== activeCat) return false;
        if (!q.trim()) return true;
        const needle = q.trim().toLowerCase();
        return (
          r.title.toLowerCase().includes(needle) ||
          r.summary.toLowerCase().includes(needle) ||
          r.why.toLowerCase().includes(needle)
        );
      }),
    })).filter((g) => g.items.length > 0);
    return filtered;
  }, [q, activeCat]);

  const totalCount = REMEDIATION_CATALOG.length;
  const visibleCount = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="max-w-6xl mx-auto">
      <RayPageTemplate
        header={
          <RayPageHeader
            title="Remediation Library"
            question="Every one-click fix I can run on your Wrayth-enrolled devices."
            description="Pick a fix, pick a device, and I queue it on the agent. High-risk actions always ask you to confirm impact first."
          />
        }
        brief={
          <RayBrief
            lines={[
              `I have ${totalCount} one-click fixes ready across ${Object.keys(CATEGORY_LABELS).length} categories.`,
              'Low-risk items apply instantly; high-risk items show impact copy before I queue them.',
              "If a fix doesn't apply cleanly, I'll surface the reason on the device timeline.",
            ]}
            tone="ok"
          />
        }
        sinceLines={[
          { label: `${totalCount} fixes catalogued` },
          { label: 'Windows agent required' },
          { label: 'Every action is audited' },
        ]}
        protectLines={[
          "I only run actions you queue. Nothing here is automatic.",
          "Every dispatch is logged with risk, preflight, and result.",
          "Reversible actions can be undone from the same catalog.",
        ]}
      >
        {/* Filters */}
        <section className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search fixes…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9 bg-card/40 border-border"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <CatChip active={activeCat === 'all'} onClick={() => setActiveCat('all')}>All</CatChip>
            {(Object.keys(CATEGORY_LABELS) as RemediationCategory[]).map((c) => (
              <CatChip key={c} active={activeCat === c} onClick={() => setActiveCat(c)}>
                {CATEGORY_LABELS[c]}
              </CatChip>
            ))}
          </div>
        </section>

        {visibleCount === 0 ? (
          <section className="wrayth-chamfer border border-border bg-card/40 p-6 text-sm text-muted-foreground italic">
            No fixes match that search. Try a broader term.
          </section>
        ) : (
          groups.map((g) => (
            <section key={g.category} className="wrayth-chamfer border border-border bg-card/40 overflow-hidden">
              <div className="px-5 py-3 border-b border-border/60 flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-violet-300" />
                <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  {g.label}
                </span>
                <span className="text-[11px] text-muted-foreground/70">{g.items.length}</span>
              </div>
              <ul className="divide-y divide-border/40">
                {g.items.map((r) => (
                  <li key={r.slug} className="px-5 py-3 flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-sm text-foreground/90 font-medium">{r.title}</div>
                        <Badge variant="outline" className={cn('text-[10px] uppercase', RISK_CLS[r.risk])}>
                          {r.risk}
                        </Badge>
                        {r.reversible && (
                          <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-200">
                            <RotateCw className="h-2.5 w-2.5 mr-0.5" /> reversible
                          </Badge>
                        )}
                        {r.requiresReboot && (
                          <Badge variant="outline" className="text-[10px] border-yellow-500/40 text-yellow-200">
                            may reboot
                          </Badge>
                        )}
                      </div>
                      <div className="text-[12px] text-muted-foreground mt-0.5">{r.summary}</div>
                    </div>
                    <div className="shrink-0">
                      <RemediationDispatchButton remediation={r} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}

        <section className="wrayth-chamfer border border-border bg-card/40 p-5 text-[12px] text-muted-foreground">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] text-violet-300/80 mb-2">
            <Sparkles className="h-3 w-3" /> How this works
          </div>
          When you Fix It, Ray sends the action to the device's agent through a signed
          dispatch. The agent runs it on the next check-in (usually within 30 seconds)
          and writes the result back to your device timeline. High-risk items always
          require your explicit confirmation.
        </section>
      </RayPageTemplate>
    </div>
  );
}

function CatChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-2.5 py-1 rounded-full text-[11px] border transition-colors',
        active
          ? 'border-violet-400/60 bg-violet-500/10 text-violet-100'
          : 'border-border bg-background/40 text-muted-foreground hover:border-violet-400/40 hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}
