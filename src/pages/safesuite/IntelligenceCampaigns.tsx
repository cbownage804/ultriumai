/**
 * Wrayth Intelligence · Campaigns — /app/intelligence/campaigns
 *
 * Cross-investigation view. Groups related investigations into "campaigns"
 * by clustering on shared IOCs from ray_ioc_index. Turns a wall of
 * individual investigations into named threat narratives:
 *
 *   "Campaign · AsyncRAT resurfacing"
 *   4 investigations · 7 shared IOCs · first seen 3 weeks ago
 *
 * Purely client-side aggregation — no new tables. Uses ray_ioc_index
 * (investigation_ids array) as the join graph.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import {
  Layers, Fingerprint, ScanSearch, ShieldAlert, AlertTriangle,
  CheckCircle2, HelpCircle, ArrowUpRight, Network, Brain,
} from 'lucide-react';

type Ioc = {
  id: string;
  ioc_type: string;
  ioc_value: string;
  investigation_ids: string[] | null;
  first_seen_at: string;
  last_seen_at: string;
  last_verdict: string | null;
  occurrence_count: number;
};

type Inv = {
  id: string;
  input_label: string | null;
  input_type: string;
  verdict: string | null;
  created_at: string;
  status: string;
};

type Campaign = {
  key: string;
  investigationIds: string[];
  iocs: Ioc[];
  investigations: Inv[];
  firstSeen: string;
  lastSeen: string;
  dominantVerdict: string;
  title: string;
};

function verdictIcon(v: string) {
  switch ((v || '').toLowerCase()) {
    case 'malicious': return ShieldAlert;
    case 'suspicious': return AlertTriangle;
    case 'benign': return CheckCircle2;
    default: return HelpCircle;
  }
}

function verdictTone(v: string) {
  switch ((v || '').toLowerCase()) {
    case 'malicious': return 'text-[hsl(0_75%_65%)] border-[hsl(0_75%_45%/0.35)] bg-[hsl(0_75%_45%/0.08)]';
    case 'suspicious': return 'text-[hsl(38_90%_65%)] border-[hsl(38_90%_50%/0.35)] bg-[hsl(38_90%_50%/0.08)]';
    case 'benign': return 'text-[hsl(140_55%_65%)] border-[hsl(140_55%_45%/0.35)] bg-[hsl(140_55%_45%/0.08)]';
    default: return 'text-muted-foreground border-border bg-muted';
  }
}

/* Union-Find over investigation IDs to cluster on shared IOCs. */
function cluster(iocs: Ioc[]): Map<string, string[]> {
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    let p = parent.get(x) ?? x;
    if (p === x) return x;
    p = find(p);
    parent.set(x, p);
    return p;
  };
  const union = (a: string, b: string) => {
    const ra = find(a), rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };

  for (const ioc of iocs) {
    const ids = (ioc.investigation_ids ?? []).filter(Boolean);
    if (ids.length < 2) continue;
    for (const id of ids) if (!parent.has(id)) parent.set(id, id);
    for (let i = 1; i < ids.length; i++) union(ids[0], ids[i]);
  }

  const groups = new Map<string, string[]>();
  for (const id of parent.keys()) {
    const root = find(id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(id);
  }
  return groups;
}

function titleFor(iocs: Ioc[], invs: Inv[]): string {
  // Prefer a distinctive IOC (hash > domain > url > ip > email)
  const rank: Record<string, number> = { sha256: 0, sha1: 1, md5: 2, domain: 3, url: 4, ip: 5, email: 6 };
  const top = [...iocs].sort((a, b) =>
    (rank[a.ioc_type] ?? 9) - (rank[b.ioc_type] ?? 9) || b.occurrence_count - a.occurrence_count,
  )[0];
  if (top) {
    const val = top.ioc_value.length > 42 ? top.ioc_value.slice(0, 42) + '…' : top.ioc_value;
    return `${top.ioc_type.toUpperCase()} · ${val}`;
  }
  return invs[0]?.input_label || 'Untitled campaign';
}

export default function IntelligenceCampaigns() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [iocs, setIocs] = useState<Ioc[]>([]);
  const [invMap, setInvMap] = useState<Map<string, Inv>>(new Map());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: iocData, error: iocErr } = await supabase
          .from('ray_ioc_index')
          .select('id, ioc_type, ioc_value, investigation_ids, first_seen_at, last_seen_at, last_verdict, occurrence_count')
          .eq('user_id', user.id)
          .order('last_seen_at', { ascending: false })
          .limit(1000);
        if (iocErr) throw iocErr;

        const rows = (iocData ?? []) as Ioc[];
        const investigationIds = Array.from(
          new Set(rows.flatMap(r => r.investigation_ids ?? []).filter(Boolean)),
        );

        let invs: Inv[] = [];
        if (investigationIds.length) {
          const { data: invData, error: invErr } = await supabase
            .from('ray_investigations')
            .select('id, input_label, input_type, verdict, created_at, status')
            .in('id', investigationIds);
          if (invErr) throw invErr;
          invs = (invData ?? []) as Inv[];
        }

        if (cancelled) return;
        setIocs(rows);
        setInvMap(new Map(invs.map(i => [i.id, i])));
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const campaigns = useMemo<Campaign[]>(() => {
    if (!iocs.length) return [];
    const groups = cluster(iocs);

    const out: Campaign[] = [];
    for (const [root, ids] of groups) {
      if (ids.length < 2) continue; // A campaign needs ≥2 investigations
      const idSet = new Set(ids);
      const groupIocs = iocs.filter(i => (i.investigation_ids ?? []).some(id => idSet.has(id)));
      const groupInvs = ids.map(id => invMap.get(id)).filter((i): i is Inv => !!i);
      if (!groupInvs.length) continue;

      const times = groupInvs.map(i => new Date(i.created_at).getTime());
      const verdicts = groupInvs.map(i => (i.verdict || '').toLowerCase()).filter(Boolean);
      const counts: Record<string, number> = {};
      verdicts.forEach(v => { counts[v] = (counts[v] ?? 0) + 1; });
      const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown';

      out.push({
        key: root,
        investigationIds: ids,
        iocs: groupIocs,
        investigations: groupInvs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        firstSeen: new Date(Math.min(...times)).toISOString(),
        lastSeen: new Date(Math.max(...times)).toISOString(),
        dominantVerdict: dominant,
        title: titleFor(groupIocs, groupInvs),
      });
    }

    return out.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
  }, [iocs, invMap]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
          <Layers className="h-3.5 w-3.5" />
          Ray Intelligence · Campaigns
        </div>
        <h1 className="text-2xl font-semibold mt-1">Cross-investigation campaigns</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
          Ray clusters your investigations that share IOCs into named campaigns. This is how one-off
          alerts become recognizable threat narratives — "the same actor targeting accounting", not
          "seven unrelated tickets".
        </p>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : error ? (
        <Card className="border-border bg-card">
          <CardContent className="p-6 text-sm text-[hsl(0_75%_65%)]">Failed to load: {error}</CardContent>
        </Card>
      ) : campaigns.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="p-8 text-center">
            <Brain className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">No campaigns yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              A campaign forms as soon as two investigations share an IOC. Run more investigations —
              Ray will surface the connections here automatically.
            </p>
            <Link
              to="/app/intelligence/investigations"
              className="inline-flex items-center gap-1 text-xs mt-4 text-[hsl(262_60%_70%)] hover:underline"
            >
              Start an investigation <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {campaigns.map(c => {
            const VIcon = verdictIcon(c.dominantVerdict);
            return (
              <Card key={c.key} className="border-border bg-card hover:border-[hsl(262_60%_64%/0.5)] transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1">
                        <Layers className="h-3 w-3" />
                        Campaign
                        <span className={`inline-flex items-center gap-1 border rounded-sm px-1.5 py-0.5 ${verdictTone(c.dominantVerdict)}`}>
                          <VIcon className="h-3 w-3" />
                          {c.dominantVerdict}
                        </span>
                      </div>
                      <CardTitle className="text-sm font-medium truncate">{c.title}</CardTitle>
                    </div>
                    <div className="text-right text-[11px] text-muted-foreground whitespace-nowrap">
                      <div>Last seen {formatDistanceToNow(new Date(c.lastSeen), { addSuffix: true })}</div>
                      <div className="text-[10px] opacity-70">First seen {formatDistanceToNow(new Date(c.firstSeen), { addSuffix: true })}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><ScanSearch className="h-3 w-3" /> {c.investigations.length} investigations</span>
                    <span className="inline-flex items-center gap-1"><Fingerprint className="h-3 w-3" /> {c.iocs.length} shared IOCs</span>
                    <span className="inline-flex items-center gap-1"><Network className="h-3 w-3" /> {new Set(c.iocs.map(i => i.ioc_type)).size} indicator types</span>
                  </div>

                  {/* Investigations strip */}
                  <div className="border-t border-border/60 pt-2">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Investigations</div>
                    <div className="space-y-1">
                      {c.investigations.slice(0, 5).map(inv => {
                        const IVI = verdictIcon(inv.verdict || '');
                        return (
                          <Link
                            key={inv.id}
                            to={`/app/intelligence/investigations?id=${inv.id}`}
                            className="flex items-center gap-2 text-xs px-2 py-1 rounded-sm hover:bg-accent transition-colors group"
                          >
                            <IVI className={`h-3 w-3 shrink-0 ${verdictTone(inv.verdict || '').split(' ')[0]}`} />
                            <span className="truncate flex-1">{inv.input_label || inv.input_type}</span>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {formatDistanceToNow(new Date(inv.created_at), { addSuffix: true })}
                            </span>
                            <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        );
                      })}
                      {c.investigations.length > 5 && (
                        <div className="text-[10px] text-muted-foreground px-2">
                          +{c.investigations.length - 5} more
                        </div>
                      )}
                    </div>
                  </div>

                  {/* IOC strip */}
                  <div className="border-t border-border/60 pt-2">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Shared indicators</div>
                    <div className="flex flex-wrap gap-1">
                      {c.iocs.slice(0, 10).map(ioc => (
                        <Link
                          key={ioc.id}
                          to={`/app/intelligence/memory?q=${encodeURIComponent(ioc.ioc_value)}`}
                          className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-sm border border-border bg-muted/50 hover:border-[hsl(262_60%_64%/0.5)] hover:text-foreground transition-colors"
                        >
                          <Badge variant="outline" className="h-4 px-1 text-[9px] uppercase border-border/60">
                            {ioc.ioc_type}
                          </Badge>
                          <span className="truncate max-w-[220px]">{ioc.ioc_value}</span>
                        </Link>
                      ))}
                      {c.iocs.length > 10 && (
                        <span className="text-[10px] text-muted-foreground self-center">+{c.iocs.length - 10}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
