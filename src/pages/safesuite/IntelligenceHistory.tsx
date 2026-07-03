/**
 * IntelligenceHistory — unified timeline + evidence viewer.
 *
 * Aggregates every Ray module the user has run (investigations, attack paths,
 * board reports, code/malware analyses, log analyses, compliance scans,
 * generated policies, org-timeline entries) into one chronological feed.
 *
 * Selecting an event opens the Evidence side panel, which surfaces the
 * record's own findings AND — crucially — how the module reused the shared
 * graph and org memory: which IOCs it touched, which OTHER analyses share
 * those IOCs (via ray_ioc_index.investigation_ids), and how many
 * organization memory / entity records were available at the time.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Brain, Sparkles, ScanSearch, GitBranch, FileText, Bug, Terminal, FileWarning,
  ShieldCheck, ClipboardCheck, Activity, Network, Layers, Database,
  Fingerprint, ArrowUpRight, Search, Filter,
} from 'lucide-react';

type Kind =
  | 'investigation' | 'attack_path' | 'board_report'
  | 'code_analysis' | 'log_analysis' | 'compliance_scan'
  | 'policy' | 'org_event';

type Event = {
  id: string;
  key: string;
  kind: Kind;
  title: string;
  subtitle: string;
  status: string | null;
  severity: string | null;
  createdAt: string;
  href: string | null;
  raw: Record<string, unknown>;
};

const KIND_META: Record<Kind, { label: string; Icon: typeof ScanSearch; color: string; tone: string }> = {
  investigation:   { label: 'Investigation',    Icon: ScanSearch,     color: 'text-[hsl(262_60%_75%)]', tone: 'bg-[hsl(262_60%_64%/0.12)] border-[hsl(262_60%_64%/0.35)]' },
  attack_path:     { label: 'Attack Path',      Icon: GitBranch,      color: 'text-[hsl(0_70%_70%)]',   tone: 'bg-[hsl(0_70%_45%/0.10)] border-[hsl(0_70%_45%/0.35)]' },
  board_report:    { label: 'Board Report',     Icon: FileText,       color: 'text-[hsl(38_90%_70%)]',  tone: 'bg-[hsl(38_90%_45%/0.10)] border-[hsl(38_90%_45%/0.35)]' },
  code_analysis:   { label: 'Code / Malware',   Icon: Bug,            color: 'text-[hsl(200_70%_70%)]', tone: 'bg-[hsl(200_70%_45%/0.10)] border-[hsl(200_70%_45%/0.35)]' },
  log_analysis:    { label: 'Log Analysis',     Icon: FileWarning,    color: 'text-[hsl(140_60%_65%)]', tone: 'bg-[hsl(140_60%_40%/0.10)] border-[hsl(140_60%_40%/0.35)]' },
  compliance_scan: { label: 'Compliance',       Icon: ShieldCheck,    color: 'text-[hsl(180_60%_65%)]', tone: 'bg-[hsl(180_60%_40%/0.10)] border-[hsl(180_60%_40%/0.35)]' },
  policy:          { label: 'Policy',           Icon: ClipboardCheck, color: 'text-[hsl(280_60%_75%)]', tone: 'bg-[hsl(280_60%_45%/0.10)] border-[hsl(280_60%_45%/0.35)]' },
  org_event:       { label: 'Org Event',        Icon: Activity,       color: 'text-muted-foreground',   tone: 'bg-muted border-border' },
};

const SEVERITY_TONE: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/30',
  high:     'bg-orange-500/10 text-orange-400 border-orange-500/30',
  medium:   'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  low:      'bg-blue-500/10 text-blue-400 border-blue-500/30',
  info:     'bg-muted text-muted-foreground border-border',
};

const VERDICT_TONE: Record<string, string> = {
  malicious:    'bg-red-500/10 text-red-400 border-red-500/30',
  suspicious:   'bg-orange-500/10 text-orange-400 border-orange-500/30',
  benign:       'bg-green-500/10 text-green-400 border-green-500/30',
  inconclusive: 'bg-muted text-muted-foreground border-border',
};

export default function IntelligenceHistory() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [orgStats, setOrgStats] = useState<{ iocs: number; memory: number; entities: number; relationships: number }>({ iocs: 0, memory: 0, entities: 0, relationships: 0 });
  const [selected, setSelected] = useState<Event | null>(null);

  const [kindFilter, setKindFilter] = useState<'all' | Kind>('all');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Resolve org membership for org-scoped reads.
    const { data: mem } = await supabase
      .from('org_team_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();
    const orgId = (mem as { organization_id?: string } | null)?.organization_id ?? null;

    const [invs, paths, reports, code, logs, compliance, policies, orgTimeline, iocCount, memCount, entCount, relCount] = await Promise.all([
      supabase.from('ray_investigations').select('id, input_label, input_type, verdict, status, created_at, iocs, mitre').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('ray_attack_paths').select('id, title, severity, status, created_at, scenario, investigation_id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('ray_board_reports').select('id, period_days, title, status, created_at, investigation_ids, totals').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('ray_code_analyses').select('id, mode, language, input_label, verdict, status, confidence, created_at, iocs, mitre').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('ray_log_analyses').select('id, source_kind, input_label, status, created_at, iocs, mitre, chunks_complete, chunk_count').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('ray_compliance_scans').select('id, framework, overall_score, posture, status, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('ray_policies').select('id, title, policy_type, status, created_at, organization_name').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      orgId
        ? supabase.from('ray_org_timeline').select('id, occurred_at, actor, category, summary, severity, metadata').eq('org_id', orgId).order('occurred_at', { ascending: false }).limit(50)
        : Promise.resolve({ data: [] as unknown[], error: null } as unknown as { data: unknown[]; error: null }),
      supabase.from('ray_ioc_index').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      orgId
        ? supabase.from('ray_org_memory').select('id', { count: 'exact', head: true }).eq('org_id', orgId)
        : Promise.resolve({ count: 0, data: null, error: null } as unknown as { count: number; data: null; error: null }),
      orgId
        ? supabase.from('ray_entities').select('id', { count: 'exact', head: true }).eq('org_id', orgId)
        : Promise.resolve({ count: 0, data: null, error: null } as unknown as { count: number; data: null; error: null }),
      orgId
        ? supabase.from('ray_relationships').select('id', { count: 'exact', head: true }).eq('org_id', orgId)
        : Promise.resolve({ count: 0, data: null, error: null } as unknown as { count: number; data: null; error: null }),
    ]);

    const merged: Event[] = [];

    for (const r of (invs.data ?? []) as Array<Record<string, unknown>>) {
      merged.push({
        id: String(r.id), key: `inv-${r.id}`, kind: 'investigation',
        title: (r.input_label as string) || (r.input_type as string) || 'Investigation',
        subtitle: r.status === 'complete' ? `Verdict · ${(r.verdict as string) ?? 'unknown'}` : `Status · ${r.status}`,
        status: (r.status as string) ?? null,
        severity: (r.verdict as string) ?? null,
        createdAt: String(r.created_at),
        href: `/app/intelligence/investigations?id=${r.id}`,
        raw: r,
      });
    }
    for (const r of (paths.data ?? []) as Array<Record<string, unknown>>) {
      merged.push({
        id: String(r.id), key: `ap-${r.id}`, kind: 'attack_path',
        title: (r.title as string) || 'Attack path',
        subtitle: r.status === 'complete' ? `Severity · ${(r.severity as string) ?? 'unknown'}` : `Status · ${r.status}`,
        status: (r.status as string) ?? null,
        severity: (r.severity as string) ?? null,
        createdAt: String(r.created_at),
        href: `/app/intelligence/attack-paths?id=${r.id}`,
        raw: r,
      });
    }
    for (const r of (reports.data ?? []) as Array<Record<string, unknown>>) {
      const ids = Array.isArray(r.investigation_ids) ? (r.investigation_ids as unknown[]).length : 0;
      merged.push({
        id: String(r.id), key: `br-${r.id}`, kind: 'board_report',
        title: (r.title as string) || `${r.period_days}-day board report`,
        subtitle: `Draws from ${ids} investigation${ids === 1 ? '' : 's'}`,
        status: (r.status as string) ?? null, severity: null,
        createdAt: String(r.created_at),
        href: `/app/intelligence/reports?id=${r.id}`,
        raw: r,
      });
    }
    for (const r of (code.data ?? []) as Array<Record<string, unknown>>) {
      merged.push({
        id: String(r.id), key: `code-${r.id}`, kind: 'code_analysis',
        title: (r.input_label as string) || `${r.mode} · ${r.language}`,
        subtitle: `${r.mode === 'malware' ? 'Malware' : 'Script'} · verdict ${(r.verdict as string) ?? '—'}`,
        status: (r.status as string) ?? null,
        severity: (r.verdict as string) ?? null,
        createdAt: String(r.created_at),
        href: r.mode === 'malware' ? '/app/intelligence/malware' : '/app/intelligence/scripts',
        raw: r,
      });
    }
    for (const r of (logs.data ?? []) as Array<Record<string, unknown>>) {
      merged.push({
        id: String(r.id), key: `log-${r.id}`, kind: 'log_analysis',
        title: (r.input_label as string) || `${r.source_kind} log`,
        subtitle: `${r.chunks_complete ?? 0}/${r.chunk_count ?? 0} chunks · ${r.status}`,
        status: (r.status as string) ?? null, severity: null,
        createdAt: String(r.created_at),
        href: '/app/intelligence/logs',
        raw: r,
      });
    }
    for (const r of (compliance.data ?? []) as Array<Record<string, unknown>>) {
      merged.push({
        id: String(r.id), key: `comp-${r.id}`, kind: 'compliance_scan',
        title: `${r.framework} · ${(r.posture as string) ?? '—'}`,
        subtitle: r.overall_score != null ? `Score ${r.overall_score}/100` : `Status · ${r.status}`,
        status: (r.status as string) ?? null, severity: null,
        createdAt: String(r.created_at),
        href: '/app/intelligence/compliance',
        raw: r,
      });
    }
    for (const r of (policies.data ?? []) as Array<Record<string, unknown>>) {
      merged.push({
        id: String(r.id), key: `pol-${r.id}`, kind: 'policy',
        title: (r.title as string) || `${r.policy_type} policy`,
        subtitle: (r.organization_name as string) || `Status · ${r.status}`,
        status: (r.status as string) ?? null, severity: null,
        createdAt: String(r.created_at),
        href: '/app/intelligence/policies',
        raw: r,
      });
    }
    for (const r of (orgTimeline.data ?? []) as Array<Record<string, unknown>>) {
      merged.push({
        id: String(r.id), key: `org-${r.id}`, kind: 'org_event',
        title: (r.summary as string) || (r.category as string) || 'Org event',
        subtitle: (r.actor as string) || (r.category as string) || 'system',
        status: null,
        severity: (r.severity as string) ?? null,
        createdAt: String(r.occurred_at ?? r.created_at),
        href: null,
        raw: r,
      });
    }

    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setEvents(merged);
    setOrgStats({
      iocs: (iocCount as { count?: number }).count ?? 0,
      memory: (memCount as { count?: number }).count ?? 0,
      entities: (entCount as { count?: number }).count ?? 0,
      relationships: (relCount as { count?: number }).count ?? 0,
    });
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter(e => {
      if (kindFilter !== 'all' && e.kind !== kindFilter) return false;
      if (!q) return true;
      return e.title.toLowerCase().includes(q) || e.subtitle.toLowerCase().includes(q);
    });
  }, [events, kindFilter, query]);

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);

  const kindCounts = useMemo(() => {
    const c: Record<string, number> = { all: events.length };
    for (const e of events) c[e.kind] = (c[e.kind] ?? 0) + 1;
    return c;
  }, [events]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
          <Brain className="h-3.5 w-3.5" /> Ray Intelligence · History
        </div>
        <h1 className="text-2xl font-semibold mt-1 flex items-center gap-2">
          Intelligence History
          <Sparkles className="h-5 w-5 text-[hsl(262_60%_70%)]" />
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
          Every investigation, attack path, analysis, and report Ray has produced — in one timeline.
          Open any entry to see its evidence and how the module drew from the same shared graph and
          organization memory as every other module.
        </p>
      </div>

      {/* Shared context header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile Icon={Fingerprint} label="Indicators in graph" value={orgStats.iocs}
          hint="ray_ioc_index — every IOC every module has seen." />
        <StatTile Icon={Database} label="Org memory facts" value={orgStats.memory}
          hint="ray_org_memory — the facts every module reads before it reasons." />
        <StatTile Icon={Layers} label="Entities" value={orgStats.entities}
          hint="ray_entities — hosts, users, apps, IPs known across modules." />
        <StatTile Icon={Network} label="Relationships" value={orgStats.relationships}
          hint="ray_relationships — how those entities connect." />
      </div>

      {/* Filters */}
      <Card className="p-3 border-border bg-card flex flex-wrap items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-muted-foreground ml-1" />
        <Select value={kindFilter} onValueChange={v => setKindFilter(v as 'all' | Kind)}>
          <SelectTrigger className="h-9 w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All modules · {kindCounts.all ?? 0}</SelectItem>
            {(Object.keys(KIND_META) as Kind[]).map(k => (
              <SelectItem key={k} value={k}>{KIND_META[k].label} · {kindCounts[k] ?? 0}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[220px]">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search title, verdict, artifact…"
            className="h-9 pl-8"
          />
        </div>
        <div className="text-[11px] text-muted-foreground ml-auto pr-2">
          {filtered.length} of {events.length} events
        </div>
      </Card>

      {/* Timeline */}
      <Card className="border-border bg-card">
        <div className="p-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : grouped.length === 0 ? (
            <div className="text-sm text-muted-foreground p-6 text-center">
              Nothing here yet. Run an investigation, analysis, or report to start the timeline.
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map(([day, items]) => (
                <div key={day}>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 sticky top-0 bg-card/95 backdrop-blur py-1 z-10">
                    {day}
                  </div>
                  <ol className="relative border-l border-border/70 pl-4 space-y-2">
                    {items.map(e => {
                      const meta = KIND_META[e.kind];
                      const Icon = meta.Icon;
                      return (
                        <li key={e.key} className="relative">
                          <span className={cn(
                            'absolute -left-[22px] top-2 h-3 w-3 rounded-full border',
                            meta.tone,
                          )} />
                          <button
                            onClick={() => setSelected(e)}
                            className="w-full text-left rounded-sm border border-border p-3 hover:border-[hsl(262_60%_64%/0.5)] hover:bg-accent/40 transition-colors"
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className={cn('h-6 w-6 rounded-sm flex items-center justify-center border', meta.tone)}>
                                <Icon className={cn('h-3.5 w-3.5', meta.color)} />
                              </div>
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                {meta.label}
                              </span>
                              {e.severity && (VERDICT_TONE[e.severity.toLowerCase()] || SEVERITY_TONE[e.severity.toLowerCase()]) && (
                                <Badge variant="outline" className={cn('text-[10px]', VERDICT_TONE[e.severity.toLowerCase()] ?? SEVERITY_TONE[e.severity.toLowerCase()])}>
                                  {e.severity}
                                </Badge>
                              )}
                              <div className="text-[10px] text-muted-foreground ml-auto tabular-nums">
                                {format(new Date(e.createdAt), 'HH:mm')} · {formatDistanceToNow(new Date(e.createdAt), { addSuffix: true })}
                              </div>
                            </div>
                            <div className="mt-1.5 text-sm truncate">{e.title}</div>
                            <div className="text-xs text-muted-foreground truncate">{e.subtitle}</div>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <EvidenceSheet event={selected} onClose={() => setSelected(null)} orgStats={orgStats} />
    </div>
  );
}

function groupByDay(events: Event[]): Array<[string, Event[]]> {
  const map = new Map<string, Event[]>();
  for (const e of events) {
    const day = format(new Date(e.createdAt), 'EEEE, MMM d, yyyy');
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(e);
  }
  return Array.from(map.entries());
}

function StatTile({ Icon, label, value, hint }: {
  Icon: typeof Fingerprint; label: string; value: number; hint: string;
}) {
  return (
    <Card className="p-3 border-border bg-card">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-[hsl(262_60%_70%)]" /> {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value.toLocaleString()}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{hint}</div>
    </Card>
  );
}

// ---------- Evidence side sheet ----------

type Sighting = {
  ioc_type: string;
  ioc_value: string;
  occurrence_count: number;
  investigation_ids: string[];
  last_verdict: string | null;
  last_seen_at: string;
};

function EvidenceSheet({ event, onClose, orgStats }: {
  event: Event | null;
  onClose: () => void;
  orgStats: { iocs: number; memory: number; entities: number; relationships: number };
}) {
  const { user } = useAuth();
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [relatedCount, setRelatedCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!event || !user) { setSightings([]); setRelatedCount(0); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const iocs = (event.raw.iocs as Array<{ type?: string; value?: string }> | null) ?? [];
      const norms = iocs
        .map(x => (typeof x.value === 'string' ? x.value.trim().toLowerCase() : ''))
        .filter(Boolean);
      if (norms.length === 0) {
        if (!cancelled) { setSightings([]); setRelatedCount(0); setLoading(false); }
        return;
      }
      const { data } = await supabase
        .from('ray_ioc_index')
        .select('ioc_type, ioc_value, occurrence_count, investigation_ids, last_verdict, last_seen_at')
        .eq('user_id', user.id)
        .in('ioc_value_norm', norms)
        .order('occurrence_count', { ascending: false })
        .limit(50);
      const rows = (data ?? []) as Sighting[];
      const otherIds = new Set<string>();
      for (const r of rows) {
        for (const id of (r.investigation_ids ?? [])) {
          if (id !== event.id) otherIds.add(id);
        }
      }
      if (!cancelled) {
        setSightings(rows);
        setRelatedCount(otherIds.size);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [event, user]);

  if (!event) return null;
  const meta = KIND_META[event.kind];
  const Icon = meta.Icon;
  const raw = event.raw;

  const summary = pickStr(raw, ['summary', 'executive_summary', 'scenario', 'intent', 'risk_summary']);
  const findings = pickArr(raw, ['technical_findings', 'critical_findings', 'gaps']);
  const mitre = pickArr<{ id?: string; name?: string; why?: string }>(raw, ['mitre']);
  const iocs = pickArr<{ type?: string; value?: string; note?: string }>(raw, ['iocs']);
  const recs = pickArr<{ priority?: number; action?: string; owner?: string }>(raw, ['recommended_response', 'recommendations', 'roadmap']);
  const timeline = pickArr<{ step?: string; detail?: string }>(raw, ['timeline']);

  return (
    <Sheet open={!!event} onOpenChange={o => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <div className={cn('h-8 w-8 rounded-sm flex items-center justify-center border', meta.tone)}>
              <Icon className={cn('h-4 w-4', meta.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{meta.label}</div>
              <SheetTitle className="text-base truncate">{event.title}</SheetTitle>
            </div>
            {event.href && (
              <Link
                to={event.href}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                Open <ArrowUpRight className="h-3 w-3" />
              </Link>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {format(new Date(event.createdAt), 'PPpp')} · {event.subtitle}
          </div>
        </SheetHeader>

        <div className="mt-5 space-y-5">
          {/* Shared context reuse — the point of the page */}
          <Card className="border-[hsl(262_60%_64%/0.35)] bg-[hsl(262_60%_64%/0.05)] p-3">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[hsl(262_60%_78%)]">
              <Network className="h-3.5 w-3.5" /> Shared context reused
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <Row k="Indicators in this event" v={iocs.length} />
              <Row k="Prior sightings in graph" v={sightings.reduce((n, s) => n + (s.occurrence_count ?? 0), 0)} />
              <Row k="Other analyses touching same IOCs" v={loading ? '…' : relatedCount} />
              <Row k="Org memory facts available" v={orgStats.memory} />
              <Row k="Entities in shared graph" v={orgStats.entities} />
              <Row k="MITRE techniques cited" v={mitre.length} />
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground leading-snug">
              This entry was reasoned against the same <code>ray_ioc_index</code>, <code>ray_org_memory</code>,
              and <code>ray_entities</code> that every other module reads and writes to.
            </div>
          </Card>

          {summary && (
            <Section title="Summary">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{summary}</p>
            </Section>
          )}

          {findings.length > 0 && (
            <Section title={`Findings (${findings.length})`}>
              <div className="space-y-2">
                {findings.slice(0, 12).map((f, i) => {
                  const o = f as { title?: string; detail?: string; severity?: string; description?: string };
                  const sev = (o.severity ?? 'info').toLowerCase();
                  return (
                    <div key={i} className="rounded-sm border border-border p-2.5">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="text-sm font-medium">{o.title ?? '—'}</div>
                        {o.severity && (
                          <Badge variant="outline" className={cn('text-[10px]', SEVERITY_TONE[sev] ?? SEVERITY_TONE.info)}>{o.severity}</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{o.detail ?? o.description}</div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {mitre.length > 0 && (
            <Section title={`MITRE (${mitre.length})`}>
              <div className="flex flex-wrap gap-1.5">
                {mitre.map((m, i) => (
                  <Badge key={i} variant="outline" className="text-[11px] font-mono">
                    {m.id} {m.name && <span className="ml-1 font-sans text-muted-foreground">· {m.name}</span>}
                  </Badge>
                ))}
              </div>
            </Section>
          )}

          {iocs.length > 0 && (
            <Section title={`Indicators (${iocs.length})`}>
              <div className="space-y-1">
                {iocs.slice(0, 25).map((i, idx) => {
                  const s = sightings.find(s => s.ioc_value.toLowerCase() === (i.value ?? '').toLowerCase());
                  return (
                    <div key={idx} className="flex items-center gap-2 text-sm rounded-sm px-2 py-1.5 border border-border/60">
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{i.type ?? '—'}</Badge>
                      <code className="text-xs break-all">{i.value}</code>
                      {s && s.occurrence_count > 1 && (
                        <Badge variant="outline" className="text-[10px] ml-auto bg-[hsl(262_60%_64%/0.1)] text-[hsl(262_60%_78%)] border-[hsl(262_60%_64%/0.35)]">
                          seen {s.occurrence_count}×
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {recs.length > 0 && (
            <Section title={`Recommendations (${recs.length})`}>
              <ol className="space-y-1.5">
                {[...recs].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99)).slice(0, 12).map((r, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-muted-foreground shrink-0 tabular-nums">{r.priority ?? i + 1}.</span>
                    <span>{r.action ?? JSON.stringify(r)}</span>
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {timeline.length > 0 && (
            <Section title={`Timeline (${timeline.length})`}>
              <ol className="relative border-l border-border/60 pl-3 space-y-2">
                {timeline.slice(0, 20).map((t, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[7px] top-1.5 h-2 w-2 rounded-full bg-[hsl(262_60%_70%)]" />
                    <div className="text-sm">{t.step}</div>
                    {t.detail && <div className="text-xs text-muted-foreground">{t.detail}</div>}
                  </li>
                ))}
              </ol>
            </Section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">{title}</div>
      {children}
    </div>
  );
}

function Row({ k, v }: { k: string; v: number | string }) {
  return (
    <div className="flex items-center justify-between rounded-sm border border-border/60 px-2 py-1.5 bg-background/40">
      <span className="text-[11px] text-muted-foreground">{k}</span>
      <span className="font-medium tabular-nums">{v}</span>
    </div>
  );
}

function pickStr(o: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return null;
}

function pickArr<T = unknown>(o: Record<string, unknown>, keys: string[]): T[] {
  for (const k of keys) {
    const v = o[k];
    if (Array.isArray(v)) return v as T[];
  }
  return [];
}
