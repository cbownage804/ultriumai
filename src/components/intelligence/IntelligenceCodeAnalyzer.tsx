/**
 * IntelligenceCodeAnalyzer — shared workspace for Script + Malware modules.
 *
 * Both /app/intelligence/scripts and /app/intelligence/malware render this
 * component with a mode prop.  Handles input (paste or file drop), invokes
 * the ray-analyze edge function, streams the analysis into a case list, and
 * renders the result in the same tabbed layout as investigations.
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Sparkles, CheckCircle2, AlertTriangle, HelpCircle, ShieldAlert,
  Coins, Clock, Brain, Target, Fingerprint, ListChecks, Layers, ChevronRight,
  Bug, Terminal, Upload,
} from 'lucide-react';

export type AnalyzerMode = 'script' | 'malware';

type Analysis = {
  id: string;
  user_id: string;
  mode: AnalyzerMode;
  language: string | null;
  input_label: string | null;
  input_payload: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
  cost_ray_compute: number;
  verdict: string | null;
  confidence: string | null;
  confidence_score: number | null;
  intent: string | null;
  risk_summary: string | null;
  summary: string | null;
  executive_summary: string | null;
  technical_findings: Array<{ title?: string; detail?: string; severity?: string }>;
  behaviors: Array<{ category?: string; detail?: string; evidence?: string }>;
  mitre: Array<{ id?: string; name?: string; why?: string }>;
  iocs: Array<{ type?: string; value?: string; note?: string }>;
  recommended_response: Array<{ priority?: number; action?: string; owner?: string }>;
  timeline: Array<{ step?: string; detail?: string }>;
  reasoning: { points?: Array<{ point?: string; weight?: string }>; caveats?: string } | null;
  evidence: Record<string, unknown>;
  error: string | null;
  created_at: string;
  completed_at: string | null;
};

const SCRIPT_LANGS = [
  { value: 'powershell', label: 'PowerShell' },
  { value: 'bash', label: 'Bash / Shell' },
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'batch', label: 'Windows Batch' },
  { value: 'vbscript', label: 'VBScript' },
  { value: 'unknown', label: 'Auto-detect' },
];

const MALWARE_KINDS = [
  { value: 'strings', label: 'Extracted strings dump' },
  { value: 'hash', label: 'File hash (MD5/SHA1/SHA256)' },
  { value: 'unknown', label: 'Other artifact' },
];

function verdictTone(v: string | null): { color: string; Icon: typeof CheckCircle2; label: string } {
  const val = (v ?? 'inconclusive').toLowerCase();
  if (val === 'malicious')  return { color: 'text-[hsl(0_70%_65%)]',  Icon: ShieldAlert,   label: 'Malicious' };
  if (val === 'suspicious') return { color: 'text-[hsl(38_90%_65%)]', Icon: AlertTriangle, label: 'Suspicious' };
  if (val === 'benign')     return { color: 'text-[hsl(140_60%_60%)]',Icon: CheckCircle2,  label: 'Benign' };
  return { color: 'text-muted-foreground', Icon: HelpCircle, label: 'Inconclusive' };
}

const SEVERITY: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/30',
  high:     'bg-orange-500/10 text-orange-400 border-orange-500/30',
  medium:   'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  low:      'bg-blue-500/10 text-blue-400 border-blue-500/30',
  info:     'bg-muted text-muted-foreground border-border',
};

export function IntelligenceCodeAnalyzer({ mode }: { mode: AnalyzerMode }) {
  const { user } = useAuth();
  const cost = mode === 'script' ? 2 : 4;
  const Icon = mode === 'script' ? Terminal : Bug;
  const title = mode === 'script' ? 'Script Analysis' : 'Malware Analysis';
  const kickerCopy = mode === 'script'
    ? 'Paste a script Ray should statically analyze — PowerShell, Bash, Python, JavaScript, or Batch.'
    : 'Paste a hash, extracted strings dump, or suspicious payload. Ray reasons behaviorally — no sandbox detonation.';

  const langOptions = mode === 'script' ? SCRIPT_LANGS : MALWARE_KINDS;
  const defaultLang = mode === 'script' ? 'powershell' : 'strings';

  const [cases, setCases] = useState<Analysis[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const [language, setLanguage] = useState<string>(defaultLang);
  const [label, setLabel] = useState('');
  const [payload, setPayload] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setListLoading(true);
    const { data, error } = await supabase
      .from('ray_code_analyses')
      .select('*')
      .eq('user_id', user.id)
      .eq('mode', mode)
      .order('created_at', { ascending: false })
      .limit(25);
    if (!error && data) {
      setCases(data as unknown as Analysis[]);
      if (!selectedId && data.length) setSelectedId((data[0] as { id: string }).id);
    }
    setListLoading(false);
  }, [user, mode, selectedId]);

  useEffect(() => { void load(); }, [load]);

  const selected = useMemo(() => cases.find(c => c.id === selectedId) ?? null, [cases, selectedId]);

  const onFile = async (f: File) => {
    if (f.size > 500_000) { toast.error('File too large (max 500 KB)'); return; }
    const text = await f.text();
    setPayload(text.slice(0, 60_000));
    if (!label) setLabel(f.name);
  };

  const run = async () => {
    if (!payload.trim()) { toast.error('Paste an artifact first'); return; }
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('ray-analyze', {
        body: { mode, language, input_label: label || null, input_payload: payload },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error?: string }).error);
      const a = (data as { analysis: Analysis }).analysis;
      setCases(prev => [a, ...prev.filter(c => c.id !== a.id)]);
      setSelectedId(a.id);
      setPayload('');
      setLabel('');
      toast.success(`Analysis complete · ${cost} credits`);
    } catch (e) {
      const msg = (e as Error).message ?? 'Analysis failed';
      if (msg.includes('credits_exhausted')) toast.error('Out of Ray Compute credits');
      else if (msg.includes('rate_limited')) toast.error('Rate limited — try again in a moment');
      else toast.error(msg);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
          <Brain className="h-3.5 w-3.5" /> Ray Intelligence · {title}
        </div>
        <h1 className="text-2xl font-semibold mt-1 flex items-center gap-2">
          {title}
          <Icon className="h-5 w-5 text-[hsl(262_60%_70%)]" />
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-3xl">{kickerCopy}</p>
      </div>

      <div className="grid lg:grid-cols-[380px_1fr] gap-4">
        {/* Left: input + case list */}
        <div className="space-y-4">
          <Card className="p-4 space-y-3 border-border bg-card">
            <div className="text-sm font-medium">New analysis</div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {mode === 'script' ? 'Language' : 'Artifact kind'}
                </label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {langOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Label (optional)</label>
                <Input
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  placeholder="e.g. Invoice.ps1"
                  className="mt-1 h-9"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Artifact</span>
                <span className="text-muted-foreground/70">{payload.length.toLocaleString()} / 60,000</span>
              </label>
              <Textarea
                value={payload}
                onChange={e => setPayload(e.target.value.slice(0, 60_000))}
                placeholder={mode === 'script'
                  ? 'Paste script source here…'
                  : 'Paste hash, strings output, or suspicious payload here…'}
                className="mt-1 min-h-[220px] font-mono text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                <Upload className="h-3.5 w-3.5" />
                Upload file
                <input
                  type="file"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) void onFile(f); }}
                  accept=".ps1,.sh,.py,.js,.bat,.cmd,.vbs,.txt,.log,.dat,.strings"
                />
              </label>
              <div className="ml-auto flex items-center gap-2 text-[11px] text-muted-foreground">
                <Coins className="h-3 w-3" /> {cost} credits
              </div>
              <Button onClick={run} disabled={running || !payload.trim()} size="sm" className="gap-1">
                <Sparkles className="h-3.5 w-3.5" /> {running ? 'Analyzing…' : 'Analyze'}
              </Button>
            </div>
          </Card>

          <Card className="border-border bg-card">
            <div className="p-3 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              Recent cases
            </div>
            <div className="max-h-[520px] overflow-y-auto divide-y divide-border/60">
              {listLoading ? (
                <div className="p-3 space-y-2">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : cases.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">No analyses yet.</div>
              ) : cases.map(c => {
                const t = verdictTone(c.verdict);
                const V = t.Icon;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      'w-full text-left px-3 py-2.5 flex items-center gap-2 hover:bg-accent transition-colors',
                      selectedId === c.id && 'bg-accent',
                    )}
                  >
                    <V className={cn('h-4 w-4 shrink-0', t.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{c.input_label || `${c.language ?? c.mode}`}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(c.created_at).toLocaleString()}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right: detail */}
        <div>
          {selected ? <Detail a={selected} /> : (
            <Card className="p-8 border-border bg-card text-center text-sm text-muted-foreground">
              Select or run an analysis to see Ray's reasoning.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({ a }: { a: Analysis }) {
  const t = verdictTone(a.verdict);
  const V = t.Icon;

  if (a.status === 'failed') {
    return (
      <Card className="p-6 border-border bg-card">
        <div className="flex items-center gap-2 text-red-400 mb-2">
          <ShieldAlert className="h-4 w-4" /> Analysis failed
        </div>
        <div className="text-sm text-muted-foreground">{a.error ?? 'Unknown error'}</div>
      </Card>
    );
  }
  if (a.status !== 'complete') {
    return (
      <Card className="p-6 border-border bg-card">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Sparkles className="h-4 w-4 animate-pulse text-[hsl(262_60%_70%)]" />
          Ray is analyzing…
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <div className="p-5 border-b border-border">
        <div className={cn('inline-flex items-center gap-2 text-sm', t.color)}>
          <V className="h-4 w-4" />
          <span className="font-medium">{t.label}</span>
          {a.confidence && (
            <span className="text-muted-foreground">· {a.confidence} confidence
              {typeof a.confidence_score === 'number' ? ` (${a.confidence_score})` : ''}
            </span>
          )}
        </div>
        {a.intent && (
          <div className="mt-3 text-sm">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Intent · </span>
            {a.intent}
          </div>
        )}
        {a.risk_summary && (
          <div className="mt-1 text-sm text-muted-foreground">{a.risk_summary}</div>
        )}
      </div>

      <Tabs defaultValue="summary" className="p-5">
        <TabsList className="mb-4">
          <TabsTrigger value="summary" className="gap-1"><ListChecks className="h-3.5 w-3.5" /> Summary</TabsTrigger>
          <TabsTrigger value="behaviors" className="gap-1"><Layers className="h-3.5 w-3.5" /> Behaviors</TabsTrigger>
          <TabsTrigger value="mitre" className="gap-1"><Target className="h-3.5 w-3.5" /> MITRE</TabsTrigger>
          <TabsTrigger value="iocs" className="gap-1"><Fingerprint className="h-3.5 w-3.5" /> IOCs</TabsTrigger>
          <TabsTrigger value="response" className="gap-1"><Sparkles className="h-3.5 w-3.5" /> Response</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          {a.summary && <p className="text-sm leading-relaxed">{a.summary}</p>}
          {a.executive_summary && (
            <div className="rounded-sm border border-border p-3 bg-muted/30">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Executive summary</div>
              <div className="text-sm">{a.executive_summary}</div>
            </div>
          )}
          {a.reasoning?.points && a.reasoning.points.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Reasoning</div>
              <ul className="space-y-2">
                {a.reasoning.points.map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-muted-foreground shrink-0">•</span>
                    <div className="flex-1">
                      <span>{p.point}</span>
                      {p.weight && <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">[{p.weight}]</span>}
                    </div>
                  </li>
                ))}
              </ul>
              {a.reasoning.caveats && (
                <div className="mt-2 text-xs text-muted-foreground italic">Caveats: {a.reasoning.caveats}</div>
              )}
            </div>
          )}
          {a.technical_findings.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Technical findings</div>
              <div className="space-y-2">
                {a.technical_findings.map((f, i) => (
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
            </div>
          )}
        </TabsContent>

        <TabsContent value="behaviors">
          {a.behaviors.length === 0
            ? <p className="text-sm text-muted-foreground">No distinct behaviors identified.</p>
            : (
              <div className="space-y-2">
                {a.behaviors.map((b, i) => (
                  <div key={i} className="rounded-sm border border-border p-3">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{b.category ?? 'other'}</Badge>
                    </div>
                    <div className="text-sm">{b.detail}</div>
                    {b.evidence && (
                      <pre className="mt-2 text-[11px] bg-muted/40 rounded-sm p-2 overflow-x-auto font-mono">{b.evidence}</pre>
                    )}
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
            ? <p className="text-sm text-muted-foreground">No indicators of compromise extracted.</p>
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
          {a.recommended_response.length === 0
            ? <p className="text-sm text-muted-foreground">No recommendations.</p>
            : (
              <ol className="space-y-2">
                {[...a.recommended_response].sort((x, y) => (x.priority ?? 99) - (y.priority ?? 99)).map((r, i) => (
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
      </Tabs>
    </Card>
  );
}
