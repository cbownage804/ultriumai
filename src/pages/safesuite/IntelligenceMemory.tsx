/**
 * Wrayth Intelligence · Memory — /app/intelligence/memory
 *
 * "Have I seen this before?" Paste any indicator (IP, domain, URL, hash,
 * email) and get every sighting Ray has across the organization's history:
 * prior investigations, verdict progression, co-occurring indicators, and
 * related graph entities.
 *
 * This is Ray's long-term recall surface — the difference between "this
 * domain is suspicious" and "I've seen this domain twice before, it appeared
 * in a phishing investigation last month, we blocked it successfully".
 *
 * Read-only. All data comes from ray_ioc_index (per-user IOC memory) and
 * ray_entities (graph). RLS restricts both to the current user.
 */
import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  Brain, Search, Sparkles, Clock, Fingerprint, AlertTriangle, ShieldAlert,
  CheckCircle2, HelpCircle, ScanSearch, Network, Link as LinkIcon,
  ArrowUpRight, History,
} from 'lucide-react';

/* ---------------- Types ---------------- */

type IocRow = {
  id: string;
  ioc_type: string;
  ioc_value: string;
  ioc_value_norm: string;
  first_seen_at: string;
  last_seen_at: string;
  occurrence_count: number;
  investigation_ids: string[] | null;
  last_verdict: string | null;
  last_note: string | null;
};

type InvMeta = {
  id: string;
  created_at: string;
  verdict: string | null;
  input_label: string | null;
  input_type: string;
  summary: string | null;
};

type EntityMatch = {
  id: string;
  type: string;
  name: string;
  last_seen_at: string;
};

type Recall = {
  query: string;
  primary: IocRow[];                 // exact + fuzzy IOC matches for the query
  investigations: InvMeta[];         // all investigations any primary IOC appeared in
  cooccurring: Array<{ ioc: IocRow; sharedInvs: number }>; // other IOCs seen in the same investigations
  entities: EntityMatch[];           // ray_entities.name ILIKE query
};

/* ---------------- Verdict styling (shared vocabulary with investigations) ---------------- */

const VERDICT_STYLE: Record<string, { icon: React.ComponentType<{ className?: string }>; className: string; label: string }> = {
  malicious:    { icon: ShieldAlert,   className: 'bg-red-500/10 text-red-400 border-red-500/30',        label: 'Malicious' },
  suspicious:   { icon: AlertTriangle, className: 'bg-amber-500/10 text-amber-400 border-amber-500/30',  label: 'Suspicious' },
  benign:       { icon: CheckCircle2,  className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', label: 'Benign' },
  inconclusive: { icon: HelpCircle,    className: 'bg-muted text-muted-foreground border-border',        label: 'Inconclusive' },
};

function verdictBadge(v: string | null) {
  const key = (v ?? '').toLowerCase();
  const style = VERDICT_STYLE[key] ?? VERDICT_STYLE.inconclusive;
  const Icon = style.icon;
  return (
    <Badge variant="outline" className={cn('gap-1.5 rounded-sm', style.className)}>
      <Icon className="h-3.5 w-3.5" />
      {style.label}
    </Badge>
  );
}

/* ---------------- Normalization ---------------- */

/** Normalize an indicator the same way ray-investigate does so exact matches hit. */
function normalize(raw: string): string {
  let s = raw.trim().toLowerCase();
  // Strip scheme + trailing slash for URLs
  s = s.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  // Strip mailto:
  s = s.replace(/^mailto:/, '');
  // Strip surrounding [ ] brackets often used to defang
  s = s.replace(/^\[|\]$/g, '');
  // Undo common defanging: [.] → . and (.) → .
  s = s.replace(/\[\.\]|\(\.\)/g, '.');
  s = s.replace(/\[@\]|\(@\)/g, '@');
  return s;
}

/* ---------------- Recall query ---------------- */

async function runRecall(userId: string, raw: string): Promise<Recall> {
  const query = raw.trim();
  const norm = normalize(query);
  // Escape PostgREST ilike metacharacters to keep this a literal-text match.
  const safeNorm = norm.replace(/[%,().\\*]/g, '').slice(0, 200);
  if (!safeNorm) {
    return { query, primary: [], investigations: [], cooccurring: [], entities: [] };
  }

  // 1. Exact + fuzzy IOC match on the normalized value.
  const { data: iocData } = await supabase
    .from('ray_ioc_index')
    .select('id, ioc_type, ioc_value, ioc_value_norm, first_seen_at, last_seen_at, occurrence_count, investigation_ids, last_verdict, last_note')
    .eq('user_id', userId)
    .ilike('ioc_value_norm', `%${safeNorm}%`)
    .order('last_seen_at', { ascending: false })
    .limit(20);
  const primary = (iocData as IocRow[] | null) ?? [];

  // 2. Load every investigation those IOCs appear in.
  const invIds = Array.from(new Set(primary.flatMap(r => r.investigation_ids ?? []).filter(Boolean)));
  let investigations: InvMeta[] = [];
  if (invIds.length > 0) {
    const { data: invData } = await supabase
      .from('ray_investigations')
      .select('id, created_at, verdict, input_label, input_type, summary')
      .in('id', invIds)
      .order('created_at', { ascending: false });
    investigations = (invData as InvMeta[] | null) ?? [];
  }

  // 3. Co-occurring IOCs: any other row whose investigation_ids overlap ours.
  let cooccurring: Recall['cooccurring'] = [];
  if (invIds.length > 0) {
    const { data: coData } = await supabase
      .from('ray_ioc_index')
      .select('id, ioc_type, ioc_value, ioc_value_norm, first_seen_at, last_seen_at, occurrence_count, investigation_ids, last_verdict, last_note')
      .eq('user_id', userId)
      .overlaps('investigation_ids', invIds)
      .order('last_seen_at', { ascending: false })
      .limit(40);
    const primaryIds = new Set(primary.map(p => p.id));
    cooccurring = ((coData as IocRow[] | null) ?? [])
      .filter(r => !primaryIds.has(r.id))
      .map(r => ({
        ioc: r,
        sharedInvs: (r.investigation_ids ?? []).filter(id => invIds.includes(id)).length,
      }))
      .sort((a, b) => b.sharedInvs - a.sharedInvs)
      .slice(0, 15);
  }

  // 4. Matching graph entities (users, devices, policies, etc.) by name.
  const { data: entData } = await supabase
    .from('ray_entities')
    .select('id, type, name, last_seen_at')
    .ilike('name', `%${safeNorm}%`)
    .order('last_seen_at', { ascending: false })
    .limit(15);
  const entities = (entData as EntityMatch[] | null) ?? [];

  return { query, primary, investigations, cooccurring, entities };
}

/* ---------------- UI ---------------- */

const SUGGESTIONS = [
  { label: 'A domain', hint: 'malicious-domain.com' },
  { label: 'An IP',     hint: '203.0.113.45' },
  { label: 'A hash',    hint: 'SHA-256 / SHA-1 / MD5' },
  { label: 'An email',  hint: 'attacker@example.com' },
  { label: 'A URL',     hint: 'https://example.com/login' },
];

export default function IntelligenceMemory() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Recall | null>(null);

  const runQuery = useCallback(async (raw: string) => {
    if (!user || !raw.trim()) return;
    setLoading(true);
    try {
      const r = await runRecall(user.id, raw);
      setResult(r);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const summary = useMemo(() => {
    if (!result) return null;
    const totalSightings = result.primary.reduce((sum, r) => sum + (r.occurrence_count ?? 0), 0);
    const firstSeen = result.primary
      .map(r => r.first_seen_at)
      .filter(Boolean)
      .sort()[0];
    const lastSeen = result.primary
      .map(r => r.last_seen_at)
      .filter(Boolean)
      .sort()
      .reverse()[0];
    return { totalSightings, firstSeen, lastSeen };
  }, [result]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
          <Brain className="h-3.5 w-3.5 text-[hsl(262_60%_70%)]" />
          Wrayth Intelligence · Memory
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold mt-1 flex items-center gap-2">
          Ray Remembers
          <Sparkles className="h-5 w-5 text-[hsl(262_60%_70%)]" />
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
          Paste any indicator — a domain, an IP, a hash, an email, a URL — and Ray recalls every
          investigation, sighting, and related indicator he's seen across your organization's history.
        </p>
      </div>

      {/* Query box */}
      <Card className="p-5 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') runQuery(query); }}
              placeholder="Paste an indicator — Ray will tell you everything he remembers"
              className="pl-9 font-mono text-sm"
              autoFocus
            />
          </div>
          <Button
            onClick={() => runQuery(query)}
            disabled={loading || !query.trim()}
            className="gap-2 min-h-[40px]"
          >
            {loading ? <><Brain className="h-4 w-4 animate-pulse" /> Recalling…</> : <><Brain className="h-4 w-4" /> Recall</>}
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground pr-1 self-center">Try:</span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => setQuery(s.hint)}
              className="px-2.5 py-1 rounded-sm text-[11px] border border-border text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Loading */}
      {loading && <RecallSkeleton />}

      {/* Empty state — no query yet */}
      {!loading && !result && <EmptyState />}

      {/* No matches */}
      {!loading && result && result.primary.length === 0 && result.entities.length === 0 && (
        <Card className="p-8 text-center border-dashed">
          <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <HelpCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-medium">Ray hasn't seen this before</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
            No prior sightings of <span className="font-mono text-foreground">{result.query}</span>.
            Run an investigation to add it to Ray's memory.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link to={`/app/intelligence/investigations?prefill=${encodeURIComponent(result.query)}`}>
              <ScanSearch className="h-3.5 w-3.5 mr-1.5" /> Investigate now
            </Link>
          </Button>
        </Card>
      )}

      {/* Results */}
      {!loading && result && (result.primary.length > 0 || result.entities.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
          <div className="space-y-6 min-w-0">
            {/* Recall summary card */}
            {summary && result.primary.length > 0 && (
              <Card className="p-5 bg-[hsl(262_60%_64%/0.04)] border-[hsl(262_60%_64%/0.25)]">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-sm bg-[hsl(262_60%_64%/0.15)] flex items-center justify-center flex-shrink-0">
                    <History className="h-5 w-5 text-[hsl(262_60%_78%)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Ray's recall</div>
                    <p className="text-base mt-0.5">
                      I've seen <span className="font-mono text-foreground">{result.query}</span>{' '}
                      <span className="text-foreground font-medium">
                        {summary.totalSightings} {summary.totalSightings === 1 ? 'time' : 'times'}
                      </span>
                      {result.investigations.length > 0 && (
                        <> across <span className="text-foreground font-medium">
                          {result.investigations.length} investigation{result.investigations.length === 1 ? '' : 's'}
                        </span></>
                      )}.
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                      {summary.firstSeen && (
                        <span>First seen {formatDistanceToNow(new Date(summary.firstSeen), { addSuffix: true })}</span>
                      )}
                      {summary.lastSeen && (
                        <span>Last seen {formatDistanceToNow(new Date(summary.lastSeen), { addSuffix: true })}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* IOC records matched */}
            {result.primary.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Fingerprint className="h-4 w-4 text-[hsl(262_60%_70%)]" />
                    Indicators matched ({result.primary.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.primary.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-start justify-between gap-3 p-3 rounded-sm border border-border hover:border-border/80 bg-card/40"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                            {r.ioc_type}
                          </Badge>
                          {verdictBadge(r.last_verdict)}
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <Clock className="h-3 w-3" />
                            {r.occurrence_count}× seen
                          </Badge>
                        </div>
                        <div className="font-mono text-sm truncate" title={r.ioc_value}>
                          {r.ioc_value}
                        </div>
                        {r.last_note && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.last_note}</div>
                        )}
                        <div className="text-[10px] text-muted-foreground mt-1.5">
                          First seen {new Date(r.first_seen_at).toLocaleDateString()} · Last seen{' '}
                          {formatDistanceToNow(new Date(r.last_seen_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Investigations timeline */}
            {result.investigations.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ScanSearch className="h-4 w-4 text-[hsl(262_60%_70%)]" />
                    Appeared in these investigations ({result.investigations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.investigations.map((inv) => (
                    <Link
                      key={inv.id}
                      to={`/app/intelligence/investigations?id=${inv.id}`}
                      className="flex items-start gap-3 p-3 rounded-sm border border-border hover:border-[hsl(262_60%_64%/0.4)] hover:bg-[hsl(262_60%_64%/0.04)] transition-colors group"
                    >
                      <div className="h-8 w-8 rounded-sm bg-muted flex items-center justify-center flex-shrink-0">
                        <ScanSearch className="h-4 w-4 text-[hsl(262_60%_70%)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium truncate">
                            {inv.input_label || inv.input_type}
                          </span>
                          {verdictBadge(inv.verdict)}
                        </div>
                        {inv.summary && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{inv.summary}</p>
                        )}
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(inv.created_at), { addSuffix: true })}
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground flex-shrink-0" />
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Co-occurring indicators */}
            {result.cooccurring.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-[hsl(262_60%_70%)]" />
                    Seen alongside ({result.cooccurring.length})
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Other indicators that appeared in the same investigations.
                  </p>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {result.cooccurring.map(({ ioc, sharedInvs }) => (
                    <button
                      key={ioc.id}
                      onClick={() => { setQuery(ioc.ioc_value); runQuery(ioc.ioc_value); }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-sm border border-border hover:border-[hsl(262_60%_64%/0.4)] bg-card/40 text-left transition-colors"
                    >
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider flex-shrink-0">
                        {ioc.ioc_type}
                      </Badge>
                      <span className="font-mono text-xs truncate flex-1">{ioc.ioc_value}</span>
                      {verdictBadge(ioc.last_verdict)}
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {sharedInvs} shared case{sharedInvs === 1 ? '' : 's'}
                      </span>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right rail — related graph entities */}
          <aside className="space-y-3">
            <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground flex items-center gap-2">
              <Network className="h-3.5 w-3.5" />
              Related in graph
            </h2>
            {result.entities.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No matching entities in the security graph.
              </p>
            ) : (
              <div className="space-y-2">
                {result.entities.map((e) => (
                  <Link
                    key={e.id}
                    to={`/app/graph/${e.id}`}
                    className="block p-2.5 rounded-sm border border-border hover:border-[hsl(262_60%_64%/0.4)] bg-card/40 transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {e.type}
                      </span>
                      <ArrowUpRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
                    </div>
                    <div className="text-sm truncate mt-0.5">{e.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Last seen {formatDistanceToNow(new Date(e.last_seen_at), { addSuffix: true })}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

/* ---------------- Skeletons + empty ---------------- */

function RecallSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="p-5"><Skeleton className="h-16 w-full" /></Card>
      <Card className="p-5 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </Card>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="p-10 text-center border-dashed">
      <div className="mx-auto h-12 w-12 rounded-full bg-[hsl(262_60%_64%/0.1)] flex items-center justify-center mb-3">
        <Brain className="h-6 w-6 text-[hsl(262_60%_70%)]" />
      </div>
      <h3 className="text-base font-medium">Ask Ray what he remembers</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
        Every investigation you run adds indicators to Ray's memory. Paste anything above and he'll
        tell you if he's seen it before, where it appeared, and what showed up alongside it.
      </p>
    </Card>
  );
}
