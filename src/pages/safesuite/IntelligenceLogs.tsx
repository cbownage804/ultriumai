/**
 * IntelligenceLogs — Log Analysis workspace (v0.6, Sprint C).
 *
 * Client-side flow:
 *   1. User uploads or pastes a log; UI chunks it into ~500-line pieces.
 *   2. Client creates a ray_log_analyses row (RLS lets the user insert).
 *   3. For each chunk, invoke ray-log-analyze { step: "map" } with concurrency 2.
 *   4. Once all chunks complete, invoke ray-log-analyze { step: "reduce" }.
 *   5. Render final analysis.
 *
 * Costs 5 Ray Compute per analysis (billed conceptually — accounted for in
 * cost_ray_compute on the analysis row).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ModuleRayBrief } from '@/components/ray/ModuleRayBrief';
import { HowIProtectYouCard } from '@/components/ray/HowIProtectYouCard';
import {
  FileWarning, Sparkles, Upload, Coins, Clock, Brain,
  Target, Fingerprint, ListChecks, Layers, ChevronRight, AlertTriangle,
  CheckCircle2, ShieldAlert,
} from 'lucide-react';

const COST = 5;
const CHUNK_LINES = 500;
const CHUNK_CONCURRENCY = 2;

const SOURCE_KINDS = [
  { value: 'unknown',   label: 'Auto-detect' },
  { value: 'sentinel',  label: 'Microsoft Sentinel' },
  { value: 'defender',  label: 'Microsoft Defender' },
  { value: 'evtx_json', label: 'Windows Event Log (JSON)' },
  { value: 'syslog',    label: 'Syslog' },
  { value: 'iis',       label: 'IIS access log' },
  { value: 'apache',    label: 'Apache / Nginx access log' },
  { value: 'vpn',       label: 'VPN log' },
  { value: 'firewall',  label: 'Firewall log' },
  { value: 'csv',       label: 'Generic CSV' },
];

type Analysis = {
  id: string;
  user_id: string;
  source_kind: string;
  input_label: string | null;
  total_lines: number;
  chunk_count: number;
  chunks_complete: number;
  status: 'pending' | 'mapping' | 'reducing' | 'complete' | 'failed';
  summary: string | null;
  executive_summary: string | null;
  critical_findings: Array<{ title?: string; detail?: string; severity?: string }>;
  mitre: Array<{ id?: string; name?: string; why?: string }>;
  iocs: Array<{ type?: string; value?: string; note?: string }>;
  recommendations: Array<{ priority?: number; action?: string; owner?: string }>;
  timeline: Array<{ step?: string; detail?: string }>;
  evidence: Record<string, unknown>;
  error: string | null;
  cost_ray_compute: number;
  created_at: string;
  completed_at: string | null;
};

const SEVERITY: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/30',
  high:     'bg-orange-500/10 text-orange-400 border-orange-500/30',
  medium:   'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  low:      'bg-blue-500/10 text-blue-400 border-blue-500/30',
  info:     'bg-muted text-muted-foreground border-border',
};

function chunkLines(text: string, size: number): string[] {
  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  for (let i = 0; i < lines.length; i += size) {
    out.push(lines.slice(i, i + size).join('\n'));
  }
  return out;
}

export default function IntelligenceLogs() {
  const { user } = useAuth();
  const [cases, setCases] = useState<Analysis[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);

  const [sourceKind, setSourceKind] = useState('unknown');
  const [label, setLabel] = useState('');
  const [payload, setPayload] = useState('');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; stage: string } | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setListLoading(true);
    const { data } = await supabase
      .from('ray_log_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(25);
    if (data) {
      setCases(data as unknown as Analysis[]);
      if (!selectedId && data.length) setSelectedId((data[0] as { id: string }).id);
    }
    setListLoading(false);
  }, [user, selectedId]);

  useEffect(() => { void load(); }, [load]);

  const selected = useMemo(() => cases.find(c => c.id === selectedId) ?? null, [cases, selectedId]);

  const onFile = async (f: File) => {
    if (f.size > 10 * 1024 * 1024) { toast.error('File too large (max 10 MB)'); return; }
    const text = await f.text();
    setPayload(text);
    if (!label) setLabel(f.name);
  };

  const run = async () => {
    if (!user) return;
    if (!payload.trim()) { toast.error('Paste or upload a log first'); return; }

    const chunks = chunkLines(payload, CHUNK_LINES);
    // Guard against absurdly large jobs — keep max ~200 chunks (~100k lines) per run.
    if (chunks.length > 200) {
      toast.error(`Too many chunks (${chunks.length}). Split into < 100k-line files.`);
      return;
    }

    setRunning(true);
    try {
      // 1. Insert parent row
      const totalLines = payload.split(/\r?\n/).length;
      const { data: created, error: insErr } = await supabase
        .from('ray_log_analyses')
        .insert({
          user_id: user.id,
          source_kind: sourceKind,
          input_label: label || null,
          total_lines: totalLines,
          total_bytes: payload.length,
          chunk_count: chunks.length,
          chunks_complete: 0,
          status: 'mapping',
          cost_ray_compute: COST,
        })
        .select('*').single();
      if (insErr || !created) throw new Error(insErr?.message ?? 'insert_failed');
      const analysisId = (created as Analysis).id;
      setCases(prev => [created as Analysis, ...prev]);
      setSelectedId(analysisId);

      // 2. Map chunks with limited concurrency
      setProgress({ done: 0, total: chunks.length, stage: 'Mapping chunks…' });
      let done = 0;
      const queue = chunks.map((text, i) => ({
        text, index: i,
        lineStart: i * CHUNK_LINES + 1,
        lineEnd: Math.min((i + 1) * CHUNK_LINES, totalLines),
      }));

      const workers = Array.from({ length: CHUNK_CONCURRENCY }).map(async () => {
        while (queue.length > 0) {
          const job = queue.shift()!;
          const { error } = await supabase.functions.invoke('ray-log-analyze', {
            body: {
              step: 'map',
              analysis_id: analysisId,
              chunk_index: job.index,
              line_start: job.lineStart,
              line_end: job.lineEnd,
              chunk_text: job.text,
            },
          });
          if (error) {
            console.error('map_chunk_failed', job.index, error);
            // continue — reduce step will note the missing chunk
          }
          done += 1;
          setProgress({ done, total: chunks.length, stage: 'Mapping chunks…' });
        }
      });
      await Promise.all(workers);

      // 3. Reduce
      setProgress({ done: chunks.length, total: chunks.length, stage: 'Reducing to unified analysis…' });
      const { data: reduceData, error: reduceErr } = await supabase.functions.invoke('ray-log-analyze', {
        body: { step: 'reduce', analysis_id: analysisId },
      });
      if (reduceErr) throw reduceErr;
      if ((reduceData as { error?: string })?.error) throw new Error((reduceData as { error: string }).error);
      const final = (reduceData as { analysis: Analysis }).analysis;
      setCases(prev => [final, ...prev.filter(c => c.id !== final.id)]);
      setSelectedId(final.id);
      setPayload(''); setLabel('');
      toast.success(`Log analysis complete · ${COST} credits`);
    } catch (e) {
      const msg = (e as Error).message ?? 'Analysis failed';
      if (msg.includes('credits_exhausted')) toast.error('Out of Ray Compute credits');
      else if (msg.includes('rate_limited')) toast.error('Rate limited — try again in a moment');
      else toast.error(msg);
    } finally {
      setRunning(false);
      setProgress(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
          <Brain className="h-3.5 w-3.5" /> Ray Intelligence · Log Analysis
        </div>
        <h1 className="text-2xl font-semibold mt-1 flex items-center gap-2">
          Log Analysis
          <FileWarning className="h-5 w-5 text-[hsl(262_60%_70%)]" />
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
          Upload EVTX exports, Sentinel/Defender exports, syslog, IIS, Apache, VPN, or firewall logs.
          Ray chunks them, summarizes each chunk, and produces one unified security report.
        </p>
      </div>


      <ModuleRayBrief
        eventPatterns={['event_type.ilike.log%', 'event_type.ilike.analysis%', 'event_type.ilike.auth%']}
        idleLines={[
          'No logs have come across my desk in the last couple of days.',
          "Upload an export and I'll produce a single unified report.",
        ]}
        composer={({ events }) => {
          const anomalies = events.filter((e) => /anomal|suspicious|failed|malicious/i.test(e.event_type + ' ' + (e.summary ?? ''))).length;
          const analyses = events.filter((e) => /log|analysis/i.test(e.event_type)).length;
          const lines: string[] = [];
          lines.push(analyses === 1 ? 'I reviewed 1 log set you uploaded recently.' : `I reviewed ${analyses} log sets you uploaded recently.`);
          if (anomalies > 0) {
            lines.push(anomalies === 1 ? 'I found 1 anomaly worth explaining.' : `I found ${anomalies} anomalies worth explaining.`);
            lines.push("They don't currently indicate compromise, but I flagged them.");
          } else {
            lines.push('Nothing in there currently indicates compromise.');
          }
          return { lines, tone: anomalies > 3 ? 'warn' : 'ok' };
        }}
      />

      <div className="grid lg:grid-cols-[380px_1fr] gap-4">
        <div className="space-y-4">
          <Card className="p-4 space-y-3 border-border bg-card">
            <div className="text-sm font-medium">New log analysis</div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Source</label>
                <Select value={sourceKind} onValueChange={setSourceKind}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SOURCE_KINDS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Label</label>
                <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. dc01-security.log" className="mt-1 h-9" />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Log content</span>
                <span className="text-muted-foreground/70">
                  {payload.split(/\r?\n/).length.toLocaleString()} lines
                </span>
              </label>
              <Textarea
                value={payload}
                onChange={e => setPayload(e.target.value)}
                placeholder="Paste log content here, or upload a file (up to 10 MB)…"
                className="mt-1 min-h-[220px] font-mono text-[11px]"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                <Upload className="h-3.5 w-3.5" /> Upload
                <input
                  type="file"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) void onFile(f); }}
                  accept=".log,.txt,.csv,.json,.evtx,.tsv"
                />
              </label>
              <div className="ml-auto flex items-center gap-2 text-[11px] text-muted-foreground">
                <Coins className="h-3 w-3" /> {COST} credits
              </div>
              <Button onClick={run} disabled={running || !payload.trim()} size="sm" className="gap-1">
                <Sparkles className="h-3.5 w-3.5" /> {running ? 'Analyzing…' : 'Analyze'}
              </Button>
            </div>

            {progress && (
              <div className="pt-2 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{progress.stage}</span>
                  <span>{progress.done}/{progress.total}</span>
                </div>
                <Progress value={progress.total ? (progress.done / progress.total) * 100 : 0} />
              </div>
            )}
          </Card>

          <Card className="border-border bg-card">
            <div className="p-3 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              Recent analyses
            </div>
            <div className="max-h-[520px] overflow-y-auto divide-y divide-border/60">
              {listLoading ? (
                <div className="p-3 space-y-2">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : cases.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">No log analyses yet.</div>
              ) : cases.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 flex items-center gap-2 hover:bg-accent transition-colors',
                    selectedId === c.id && 'bg-accent',
                  )}
                >
                  <StatusDot status={c.status} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{c.input_label || c.source_kind}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(c.created_at).toLocaleString()} · {c.total_lines.toLocaleString()} lines
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div>
          {selected ? <Detail a={selected} /> : (
            <Card className="p-8 border-border bg-card text-center text-sm text-muted-foreground">
              Select or run an analysis to see Ray's report.
            </Card>
          )}
        </div>
      </div>

      <HowIProtectYouCard
        title="While you work…"
        lines={[
          "I'm chunking and summarizing every log you upload.",
          "I'm mapping authentication events against known attacker patterns.",
          "I'll surface anomalies here — and interrupt you if any suggest active compromise.",
        ]}
      />
    </div>
  );
}


function StatusDot({ status }: { status: Analysis['status'] }) {
  if (status === 'complete') return <CheckCircle2 className="h-4 w-4 text-[hsl(140_60%_60%)] shrink-0" />;
  if (status === 'failed')   return <ShieldAlert className="h-4 w-4 text-[hsl(0_70%_65%)] shrink-0" />;
  return <Sparkles className="h-4 w-4 text-[hsl(262_60%_70%)] animate-pulse shrink-0" />;
}

function Detail({ a }: { a: Analysis }) {
  if (a.status === 'failed') {
    return (
      <Card className="p-6 border-border bg-card">
        <div className="flex items-center gap-2 text-red-400 mb-2">
          <ShieldAlert className="h-4 w-4" /> Log analysis failed
        </div>
        <div className="text-sm text-muted-foreground">{a.error ?? 'Unknown error'}</div>
      </Card>
    );
  }
  if (a.status !== 'complete') {
    const pct = a.chunk_count ? Math.round((a.chunks_complete / a.chunk_count) * 100) : 0;
    return (
      <Card className="p-6 border-border bg-card space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Sparkles className="h-4 w-4 animate-pulse text-[hsl(262_60%_70%)]" />
          {a.status === 'reducing' ? 'Reducing chunks to unified report…' : 'Mapping log chunks…'}
        </div>
        <Progress value={pct} />
        <div className="text-xs text-muted-foreground">
          {a.chunks_complete}/{a.chunk_count} chunks · {a.total_lines.toLocaleString()} lines
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <div className="p-5 border-b border-border">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Executive summary</div>
        <div className="text-sm mt-1">{a.executive_summary ?? '—'}</div>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
          <Badge variant="outline" className="text-[10px]">{a.source_kind}</Badge>
          <span>· {a.total_lines.toLocaleString()} lines</span>
          <span>· {a.chunk_count} chunks</span>
          <span>· <Coins className="inline h-3 w-3" /> {a.cost_ray_compute} credits</span>
        </div>
      </div>

      <Tabs defaultValue="summary" className="p-5">
        <TabsList className="mb-4">
          <TabsTrigger value="summary" className="gap-1"><ListChecks className="h-3.5 w-3.5" /> Summary</TabsTrigger>
          <TabsTrigger value="findings" className="gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Critical</TabsTrigger>
          <TabsTrigger value="mitre" className="gap-1"><Target className="h-3.5 w-3.5" /> MITRE</TabsTrigger>
          <TabsTrigger value="iocs" className="gap-1"><Fingerprint className="h-3.5 w-3.5" /> IOCs</TabsTrigger>
          <TabsTrigger value="response" className="gap-1"><Sparkles className="h-3.5 w-3.5" /> Response</TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1"><Layers className="h-3.5 w-3.5" /> Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{a.summary ?? '—'}</p>
        </TabsContent>

        <TabsContent value="findings">
          {a.critical_findings.length === 0
            ? <p className="text-sm text-muted-foreground">No critical findings.</p>
            : (
              <div className="space-y-2">
                {a.critical_findings.map((f, i) => (
                  <div key={i} className="rounded-sm border border-border p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="text-sm font-medium">{f.title}</div>
                      {f.severity && (
                        <Badge variant="outline" className={cn('text-[10px]', SEVERITY[f.severity] ?? SEVERITY.info)}>
                          {f.severity}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{f.detail}</div>
                  </div>
                ))}
              </div>
            )}
        </TabsContent>

        <TabsContent value="mitre">
          {a.mitre.length === 0
            ? <p className="text-sm text-muted-foreground">No MITRE techniques mapped.</p>
            : (
              <div className="space-y-2">
                {a.mitre.map((m, i) => (
                  <div key={i} className="rounded-sm border border-border p-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[11px]">{m.id}</Badge>
                      <span className="text-sm font-medium">{m.name}</span>
                    </div>
                    {m.why && <div className="text-xs text-muted-foreground mt-1">{m.why}</div>}
                  </div>
                ))}
              </div>
            )}
        </TabsContent>

        <TabsContent value="iocs">
          {a.iocs.length === 0
            ? <p className="text-sm text-muted-foreground">No IOCs extracted.</p>
            : (
              <div className="space-y-1">
                {a.iocs.map((i, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm rounded-sm px-2 py-1.5 hover:bg-accent">
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{i.type ?? '—'}</Badge>
                    <code className="text-xs break-all">{i.value}</code>
                    {i.note && <span className="text-[11px] text-muted-foreground ml-auto">{i.note}</span>}
                  </div>
                ))}
              </div>
            )}
        </TabsContent>

        <TabsContent value="response">
          {a.recommendations.length === 0
            ? <p className="text-sm text-muted-foreground">No recommendations.</p>
            : (
              <ol className="space-y-2">
                {[...a.recommendations].sort((x, y) => (x.priority ?? 99) - (y.priority ?? 99)).map((r, i) => (
                  <li key={i} className="rounded-sm border border-border p-3 flex gap-3">
                    <div className="h-6 w-6 rounded-sm bg-[hsl(262_60%_64%/0.15)] text-[hsl(262_60%_78%)] flex items-center justify-center text-xs font-medium shrink-0">
                      {r.priority ?? i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm">{r.action}</div>
                      {r.owner && <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">Owner · {r.owner}</div>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
        </TabsContent>

        <TabsContent value="timeline">
          {a.timeline.length === 0
            ? <p className="text-sm text-muted-foreground">No timeline extracted.</p>
            : (
              <ol className="border-l border-border/60 pl-4 space-y-3">
                {a.timeline.map((t, i) => (
                  <li key={i} className="relative">
                    <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-[hsl(262_60%_70%)]" />
                    <div className="text-sm font-medium">{t.step}</div>
                    {t.detail && <div className="text-xs text-muted-foreground">{t.detail}</div>}
                  </li>
                ))}
              </ol>
            )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
