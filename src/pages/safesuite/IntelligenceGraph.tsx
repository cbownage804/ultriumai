/**
 * Investigation Graph — Sprint 4
 *
 * Renders investigations and their shared IOCs as a bipartite graph, groups
 * investigations that share IOCs into "threat clusters," and surfaces
 * organization-wide intelligence at the top of the page.
 *
 * Data is loaded entirely from existing tables (`ray_investigations` +
 * `ray_ioc_index`) — no new backend calls required.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Brain, GitFork, Network, ScanSearch, Sparkles, TriangleAlert, ExternalLink, Clock, Fingerprint } from 'lucide-react';

type Investigation = {
  id: string;
  input_label: string | null;
  input_type: string;
  verdict: string | null;
  created_at: string;
  iocs: unknown;
};

type IocRow = {
  ioc_type: string;
  ioc_value: string;
  ioc_value_norm: string;
  occurrence_count: number;
  last_verdict: string | null;
  investigation_ids: string[];
  first_seen_at: string;
  last_seen_at: string;
};

type Cluster = {
  id: string;
  investigations: Investigation[];
  sharedIocs: IocRow[];
  dominantVerdict: string;
};

function verdictColor(v: string | null | undefined): string {
  switch ((v || '').toLowerCase()) {
    case 'malicious':   return 'hsl(0 70% 60%)';
    case 'suspicious':  return 'hsl(38 90% 58%)';
    case 'benign':      return 'hsl(142 60% 50%)';
    default:            return 'hsl(220 12% 55%)';
  }
}

function verdictBadgeClass(v: string | null | undefined): string {
  switch ((v || '').toLowerCase()) {
    case 'malicious':  return 'bg-[hsl(0_70%_60%/0.12)] text-[hsl(0_80%_75%)] border-[hsl(0_70%_60%/0.35)]';
    case 'suspicious': return 'bg-[hsl(38_90%_58%/0.12)] text-[hsl(38_95%_72%)] border-[hsl(38_90%_58%/0.35)]';
    case 'benign':     return 'bg-[hsl(142_60%_50%/0.12)] text-[hsl(142_70%_70%)] border-[hsl(142_60%_50%/0.35)]';
    default:           return 'bg-muted text-muted-foreground border-border';
  }
}

/** Extract IOC norms from an investigation's `iocs` json. */
function extractIocNorms(iocs: unknown): string[] {
  if (!Array.isArray(iocs)) return [];
  const out = new Set<string>();
  for (const raw of iocs) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Record<string, unknown>;
    const norm = typeof item.value_norm === 'string' ? item.value_norm
               : typeof item.value === 'string' ? String(item.value).trim().toLowerCase()
               : null;
    if (norm) out.add(norm);
  }
  return [...out];
}

/** Union-find clustering: investigations connected via any shared IOC. */
function computeClusters(invs: Investigation[], iocs: IocRow[]): Cluster[] {
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    const p = parent.get(x);
    if (!p || p === x) { parent.set(x, x); return x; }
    const r = find(p); parent.set(x, r); return r;
  };
  const union = (a: string, b: string) => {
    const ra = find(a), rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };

  invs.forEach(i => parent.set(i.id, i.id));

  // Link investigations that share the same IOC.
  const iocByNorm = new Map<string, IocRow>();
  for (const ioc of iocs) {
    iocByNorm.set(ioc.ioc_value_norm, ioc);
    const ids = (ioc.investigation_ids || []).filter(id => parent.has(id));
    for (let i = 1; i < ids.length; i++) union(ids[0], ids[i]);
  }

  const groups = new Map<string, Investigation[]>();
  for (const inv of invs) {
    const root = find(inv.id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(inv);
  }

  const clusters: Cluster[] = [];
  for (const [root, list] of groups) {
    if (list.length < 2) continue; // only surface multi-investigation clusters
    const invIds = new Set(list.map(i => i.id));
    const shared = iocs.filter(ioc =>
      (ioc.investigation_ids || []).filter(id => invIds.has(id)).length >= 2
    );
    const counts: Record<string, number> = {};
    list.forEach(i => {
      const v = (i.verdict || 'unknown').toLowerCase();
      counts[v] = (counts[v] || 0) + 1;
    });
    const dominant = Object.entries(counts).sort((a,b) => b[1]-a[1])[0]?.[0] || 'unknown';
    clusters.push({ id: root, investigations: list, sharedIocs: shared, dominantVerdict: dominant });
  }
  return clusters.sort((a,b) => b.investigations.length - a.investigations.length);
}

export default function IntelligenceGraph() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [iocs, setIocs] = useState<IocRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [detailIoc, setDetailIoc] = useState<IocRow | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [invRes, iocRes] = await Promise.all([
        supabase
          .from('ray_investigations')
          .select('id,input_label,input_type,verdict,created_at,iocs')
          .eq('user_id', user.id)
          .eq('status', 'complete')
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('ray_ioc_index')
          .select('ioc_type,ioc_value,ioc_value_norm,occurrence_count,last_verdict,investigation_ids,first_seen_at,last_seen_at')
          .eq('user_id', user.id)
          .order('occurrence_count', { ascending: false })
          .limit(500),
      ]);
      if (cancelled) return;
      setInvestigations((invRes.data as Investigation[]) ?? []);
      setIocs((iocRes.data as IocRow[]) ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const clusters = useMemo(() => computeClusters(investigations, iocs), [investigations, iocs]);

  const orgStats = useMemo(() => {
    const verdicts = { malicious: 0, suspicious: 0, benign: 0, unknown: 0 };
    investigations.forEach(i => {
      const v = (i.verdict || 'unknown').toLowerCase() as keyof typeof verdicts;
      if (v in verdicts) verdicts[v]++; else verdicts.unknown++;
    });
    const repeatOffenders = iocs.filter(i => i.occurrence_count >= 2).length;
    const topIocs = iocs.slice(0, 5);
    return {
      totalInvestigations: investigations.length,
      totalIocs: iocs.length,
      repeatOffenders,
      clusterCount: clusters.length,
      verdicts,
      topIocs,
    };
  }, [investigations, iocs, clusters]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            <Network className="h-3.5 w-3.5" />
            Intelligence · Investigation Graph
          </div>
          <h1 className="text-2xl font-semibold mt-1">Organization Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Ray connects every investigation you've run — grouping cases that share IOCs, highlighting
            repeat offenders, and mapping how your threat landscape overlaps.
          </p>
        </div>
        <Link to="/app/intelligence/investigations">
          <Button variant="outline" size="sm" className="gap-2">
            <ScanSearch className="h-4 w-4" /> New investigation
          </Button>
        </Link>
      </div>

      {/* Org intelligence stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Investigations" value={orgStats.totalInvestigations} icon={<ScanSearch className="h-4 w-4" />} />
        <StatCard label="IOCs tracked"   value={orgStats.totalIocs}           icon={<Brain className="h-4 w-4" />} />
        <StatCard label="Repeat offenders" value={orgStats.repeatOffenders}   icon={<TriangleAlert className="h-4 w-4" />} accent />
        <StatCard label="Threat clusters" value={orgStats.clusterCount}       icon={<GitFork className="h-4 w-4" />} accent />
      </div>

      {/* Graph + side panel */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[hsl(262_60%_70%)]" />
              Investigation ↔ IOC Graph
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[420px] w-full" />
            ) : investigations.length === 0 ? (
              <EmptyState />
            ) : (
              <GraphSvg
                investigations={investigations}
                iocs={iocs}
                selected={selected}
                onSelect={setSelected}
                onOpenIoc={setDetailIoc}
              />
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Top repeat IOCs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : orgStats.topIocs.length === 0 ? (
              <p className="text-xs text-muted-foreground">No indicators yet.</p>
            ) : (
              orgStats.topIocs.map(i => (
                <button
                  key={i.ioc_value_norm}
                  onClick={() => { setSelected(i.ioc_value_norm); setDetailIoc(i); }}
                  className={`w-full text-left px-3 py-2 rounded-sm border transition-colors ${
                    selected === i.ioc_value_norm
                      ? 'border-[hsl(262_60%_64%/0.5)] bg-[hsl(262_60%_64%/0.08)]'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono truncate">{i.ioc_value}</span>
                    <Badge variant="outline" className={`text-[10px] ${verdictBadgeClass(i.last_verdict)}`}>
                      {i.last_verdict || 'unknown'}
                    </Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2">
                    <span className="uppercase tracking-wider">{i.ioc_type}</span>
                    <span>·</span>
                    <span>{i.occurrence_count} sightings</span>
                    <span className="ml-auto inline-flex items-center gap-1 text-[hsl(262_60%_75%)]">
                      <ExternalLink className="h-3 w-3" /> Details
                    </span>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Threat clusters */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <GitFork className="h-4 w-4 text-[hsl(262_60%_70%)]" />
            Threat clusters
            <span className="text-xs font-normal text-muted-foreground">
              Investigations linked by shared indicators
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : clusters.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No clusters detected yet — clusters form when two or more investigations share an IOC.
            </p>
          ) : (
            <div className="space-y-3">
              {clusters.map((c, idx) => (
                <div key={c.id} className="rounded-sm border border-border p-3 bg-background/40">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                        Cluster #{idx + 1}
                      </span>
                      <Badge variant="outline" className={`text-[10px] ${verdictBadgeClass(c.dominantVerdict)}`}>
                        {c.dominantVerdict}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {c.investigations.length} investigations · {c.sharedIocs.length} shared IOCs
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {c.investigations.map(inv => (
                      <span
                        key={inv.id}
                        className="text-[11px] px-2 py-0.5 rounded-sm bg-muted text-foreground/80 border border-border"
                        title={new Date(inv.created_at).toLocaleString()}
                      >
                        {inv.input_label || inv.input_type}
                      </span>
                    ))}
                  </div>
                  {c.sharedIocs.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {c.sharedIocs.slice(0, 6).map(ioc => (
                        <button
                          key={ioc.ioc_value_norm}
                          type="button"
                          onClick={() => setDetailIoc(ioc)}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-sm border border-[hsl(262_60%_64%/0.35)] bg-[hsl(262_60%_64%/0.06)] text-[hsl(262_60%_82%)] hover:bg-[hsl(262_60%_64%/0.14)]"
                        >
                          {ioc.ioc_value}
                        </button>
                      ))}
                      {c.sharedIocs.length > 6 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{c.sharedIocs.length - 6} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent?: boolean }) {
  return (
    <Card className={`border-border ${accent ? 'bg-[hsl(262_60%_64%/0.05)]' : 'bg-card'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs uppercase tracking-wider">{label}</span>
          <span className={accent ? 'text-[hsl(262_60%_70%)]' : ''}>{icon}</span>
        </div>
        <div className="text-2xl font-semibold mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="h-[420px] flex flex-col items-center justify-center text-center gap-2 text-muted-foreground">
      <Network className="h-8 w-8 opacity-60" />
      <p className="text-sm">No investigations yet.</p>
      <p className="text-xs">Run an investigation to start building your organization's intelligence graph.</p>
    </div>
  );
}

/**
 * Deterministic bipartite layout: investigations on an inner ring, IOCs on an
 * outer ring, edges between an investigation and every IOC it references. No
 * physics — layout stays legible and reproducible.
 */
function GraphSvg({
  investigations,
  iocs,
  selected,
  onSelect,
}: {
  investigations: Investigation[];
  iocs: IocRow[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const width = 720;
  const height = 460;
  const cx = width / 2;
  const cy = height / 2;
  const innerR = 90;
  const outerR = 190;

  // Cap what we render to keep the graph readable.
  const invs = investigations.slice(0, 24);
  const iocsShown = iocs.slice(0, 40);

  const invPos = invs.map((inv, i) => {
    const angle = (i / Math.max(invs.length, 1)) * Math.PI * 2 - Math.PI / 2;
    return { id: inv.id, x: cx + Math.cos(angle) * innerR, y: cy + Math.sin(angle) * innerR, node: inv };
  });
  const iocPos = iocsShown.map((ioc, i) => {
    const angle = (i / Math.max(iocsShown.length, 1)) * Math.PI * 2 - Math.PI / 2;
    return { id: ioc.ioc_value_norm, x: cx + Math.cos(angle) * outerR, y: cy + Math.sin(angle) * outerR, node: ioc };
  });

  const invById = new Map(invPos.map(p => [p.id, p]));
  const iocByNorm = new Map(iocPos.map(p => [p.id, p]));

  const edges: Array<{ a: {x:number,y:number}; b: {x:number,y:number}; highlight: boolean; key: string }> = [];
  for (const ioc of iocsShown) {
    for (const invId of ioc.investigation_ids || []) {
      const a = iocByNorm.get(ioc.ioc_value_norm);
      const b = invById.get(invId);
      if (!a || !b) continue;
      const highlight = selected === ioc.ioc_value_norm || selected === invId;
      edges.push({ a, b, highlight, key: `${ioc.ioc_value_norm}-${invId}` });
    }
  }

  return (
    <div className="relative w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Investigation graph">
        {/* edges */}
        <g stroke="currentColor" fill="none">
          {edges.map(e => (
            <line
              key={e.key}
              x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y}
              stroke={e.highlight ? 'hsl(262 70% 70%)' : 'hsl(220 12% 30%)'}
              strokeWidth={e.highlight ? 1.4 : 0.6}
              opacity={selected && !e.highlight ? 0.15 : 0.6}
            />
          ))}
        </g>

        {/* IOC nodes */}
        {iocPos.map(p => {
          const active = selected === p.id;
          return (
            <g key={p.id} className="cursor-pointer" onClick={() => onSelect(active ? null : p.id)}>
              <circle
                cx={p.x} cy={p.y}
                r={active ? 5 : 3.2}
                fill="hsl(262 60% 70%)"
                opacity={selected && !active ? 0.35 : 1}
              />
              {active && (
                <text
                  x={p.x} y={p.y - 9}
                  textAnchor="middle"
                  className="fill-foreground"
                  fontSize={10}
                  fontFamily="ui-monospace, monospace"
                >
                  {p.node.ioc_value.length > 28 ? p.node.ioc_value.slice(0, 28) + '…' : p.node.ioc_value}
                </text>
              )}
            </g>
          );
        })}

        {/* Investigation nodes */}
        {invPos.map(p => {
          const active = selected === p.id;
          const color = verdictColor(p.node.verdict);
          return (
            <g key={p.id} className="cursor-pointer" onClick={() => onSelect(active ? null : p.id)}>
              <circle
                cx={p.x} cy={p.y}
                r={active ? 9 : 6}
                fill={color}
                stroke="hsl(220 12% 12%)"
                strokeWidth={1.5}
                opacity={selected && !active ? 0.4 : 1}
              />
              {active && (
                <text
                  x={p.x} y={p.y - 13}
                  textAnchor="middle"
                  className="fill-foreground"
                  fontSize={10}
                >
                  {(p.node.input_label || p.node.input_type).slice(0, 34)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-3 text-[11px] text-muted-foreground">
        <LegendDot color="hsl(0 70% 60%)" label="Malicious" />
        <LegendDot color="hsl(38 90% 58%)" label="Suspicious" />
        <LegendDot color="hsl(142 60% 50%)" label="Benign" />
        <LegendDot color="hsl(262 60% 70%)" label="IOC" />
        {selected && (
          <button
            onClick={() => onSelect(null)}
            className="ml-auto text-xs underline underline-offset-2 hover:text-foreground"
          >
            Clear selection
          </button>
        )}
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
