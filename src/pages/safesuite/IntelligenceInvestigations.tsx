/**
 * Deep Threat Investigation — Wrayth Intelligence flagship.
 *
 * User picks an artifact type (URL, email, headers, IP, domain, file hash,
 * PowerShell, event log, Defender or M365 alert), pastes the artifact, and
 * Ray returns a structured investigation: verdict, plain-English summary,
 * technical findings, MITRE ATT&CK, IOCs, recommended response, executive
 * summary, timeline, and evidence. Each run costs 3 Ray Compute and is
 * persisted so the user can revisit prior investigations.
 */
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  ScanSearch, Sparkles, ShieldAlert, CheckCircle2, AlertTriangle,
  HelpCircle, Coins, Clock, Trash2, ChevronRight, Brain, ListChecks,
  Target, Fingerprint, FileText, Layers,
} from 'lucide-react';

type InputType =
  | 'url' | 'email' | 'email_headers' | 'ip' | 'domain' | 'file_hash'
  | 'powershell' | 'event_log' | 'defender_alert' | 'm365_alert';

type Investigation = {
  id: string;
  user_id: string;
  input_type: InputType;
  input_label: string | null;
  input_payload: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
  cost_ray_compute: number;
  summary: string | null;
  executive_summary: string | null;
  verdict: string | null;
  confidence: string | null;
  confidence_score: number | null;
  technical_findings: Array<{ title?: string; detail?: string; severity?: string }>;
  mitre: Array<{ id?: string; name?: string; why?: string }>;
  iocs: Array<{ type?: string; value?: string; note?: string }>;
  recommended_response: Array<{ priority?: number; action?: string; owner?: string }>;
  timeline: Array<{ step?: string; detail?: string }>;
  evidence: Record<string, unknown>;
  error: string | null;
  created_at: string;
  completed_at: string | null;
};

const INPUT_TYPES: Array<{ id: InputType; label: string; hint: string; multiline?: boolean }> = [
  { id: 'url', label: 'URL', hint: 'https://example.com/login' },
  { id: 'email', label: 'Email body', hint: 'Paste the suspicious message', multiline: true },
  { id: 'email_headers', label: 'Email headers', hint: 'Full internet headers', multiline: true },
  { id: 'ip', label: 'IP address', hint: '203.0.113.45' },
  { id: 'domain', label: 'Domain', hint: 'suspicious-domain.com' },
  { id: 'file_hash', label: 'File hash', hint: 'SHA-256 / SHA-1 / MD5' },
  { id: 'powershell', label: 'PowerShell', hint: 'Paste the script or command', multiline: true },
  { id: 'event_log', label: 'Windows event log', hint: 'Paste the raw event XML or text', multiline: true },
  { id: 'defender_alert', label: 'Defender alert', hint: 'Paste the alert JSON or summary', multiline: true },
  { id: 'm365_alert', label: 'Microsoft 365 alert', hint: 'Paste the alert body', multiline: true },
];

const VERDICT_STYLE: Record<string, { icon: React.ComponentType<{ className?: string }>; className: string; label: string }> = {
  malicious: { icon: ShieldAlert, className: 'bg-red-500/10 text-red-400 border-red-500/30', label: 'Malicious' },
  suspicious: { icon: AlertTriangle, className: 'bg-amber-500/10 text-amber-400 border-amber-500/30', label: 'Suspicious' },
  benign: { icon: CheckCircle2, className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', label: 'Benign' },
  inconclusive: { icon: HelpCircle, className: 'bg-muted text-muted-foreground border-border', label: 'Inconclusive' },
};

const SEVERITY_CLASS: Record<string, string> = {
  critical: 'text-red-400',
  high: 'text-red-400',
  medium: 'text-amber-400',
  low: 'text-yellow-400',
  info: 'text-muted-foreground',
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

export default function IntelligenceInvestigations() {
  const { user } = useAuth();
  const [inputType, setInputType] = useState<InputType>('url');
  const [payload, setPayload] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Investigation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedInputSpec = useMemo(
    () => INPUT_TYPES.find((t) => t.id === inputType)!,
    [inputType],
  );
  const selected = useMemo(
    () => history.find((h) => h.id === selectedId) ?? history[0] ?? null,
    [history, selectedId],
  );

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('ray_investigations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(25);
      setHistory((data as Investigation[] | null) ?? []);
    })();
  }, [user]);

  async function runInvestigation() {
    if (!payload.trim()) {
      toast.error('Paste the artifact Ray should investigate.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ray-investigate', {
        body: {
          input_type: inputType,
          input_payload: payload.trim(),
          input_label: label.trim() || null,
        },
      });
      if (error) throw error;
      const inv = (data as { investigation?: Investigation })?.investigation;
      if (inv) {
        setHistory((prev) => [inv, ...prev.filter((h) => h.id !== inv.id)]);
        setSelectedId(inv.id);
        setPayload('');
        setLabel('');
        toast.success(`Investigation complete. ${inv.cost_ray_compute} Ray Compute used.`);
      } else {
        toast.error('Ray could not complete this investigation.');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Investigation failed.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function deleteInvestigation(id: string) {
    const { error } = await supabase.from('ray_investigations').delete().eq('id', id);
    if (error) {
      toast.error('Could not delete investigation.');
      return;
    }
    setHistory((prev) => prev.filter((h) => h.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-[hsl(262_60%_70%)]" /> Wrayth Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold mt-1">Deep Threat Investigation</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Give Ray an artifact and he produces a full investigation — plain-English summary,
            technical findings, MITRE ATT&amp;CK mapping, IOCs, and the response he recommends.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 rounded-sm">
          <Coins className="h-3.5 w-3.5" /> 3 Ray Compute / investigation
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
        {/* Main column */}
        <div className="space-y-6 min-w-0">
          {/* Composer */}
          <Card className="p-5 space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                What should Ray investigate?
              </label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {INPUT_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setInputType(t.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-sm text-xs border transition-colors',
                      inputType === t.id
                        ? 'bg-[hsl(262_60%_64%/0.12)] border-[hsl(262_60%_64%/0.4)] text-foreground'
                        : 'border-border text-muted-foreground hover:text-foreground hover:border-border/80',
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                Artifact
              </label>
              {selectedInputSpec.multiline ? (
                <Textarea
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  placeholder={selectedInputSpec.hint}
                  className="min-h-[180px] font-mono text-xs"
                />
              ) : (
                <Input
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  placeholder={selectedInputSpec.hint}
                  className="font-mono text-sm"
                />
              )}
            </div>

            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Optional label — e.g. 'DHL delivery notice from Monday'"
              className="text-sm"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <p className="text-xs text-muted-foreground">
                Ray only sees this artifact — nothing is sent to third parties.
              </p>
              <Button
                onClick={runInvestigation}
                disabled={loading || !payload.trim()}
                className="gap-2 min-h-[40px]"
              >
                {loading ? (
                  <>
                    <Brain className="h-4 w-4 animate-pulse" /> Ray is investigating…
                  </>
                ) : (
                  <>
                    <ScanSearch className="h-4 w-4" /> Investigate (3 RC)
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Result */}
          {loading && !selected && <ResultSkeleton />}
          {selected && <InvestigationDetail inv={selected} />}
          {!loading && !selected && history.length === 0 && <EmptyState />}
        </div>

        {/* History */}
        <aside className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Recent investigations
            </h2>
          </div>
          <div className="space-y-2">
            {history.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Ray has not run any investigations yet.
              </p>
            )}
            {history.map((h) => {
              const isSelected = (selected?.id ?? null) === h.id;
              return (
                <button
                  key={h.id}
                  onClick={() => setSelectedId(h.id)}
                  className={cn(
                    'w-full text-left rounded-sm border p-3 transition-colors',
                    isSelected
                      ? 'border-[hsl(262_60%_64%/0.4)] bg-[hsl(262_60%_64%/0.06)]'
                      : 'border-border hover:border-border/80 bg-card',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {INPUT_TYPES.find((t) => t.id === h.input_type)?.label ?? h.input_type}
                    </span>
                    {verdictBadge(h.verdict)}
                  </div>
                  <p className="text-sm mt-1 truncate">
                    {h.input_label || h.input_payload.slice(0, 80)}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(h.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); deleteInvestigation(h.id); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); deleteInvestigation(h.id); } }}
                      className="text-muted-foreground hover:text-destructive p-1 -m-1 rounded cursor-pointer"
                      aria-label="Delete investigation"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}

function ResultSkeleton() {
  return (
    <Card className="p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-24 w-full" />
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="p-10 text-center border-dashed">
      <div className="mx-auto h-12 w-12 rounded-full bg-[hsl(262_60%_64%/0.1)] flex items-center justify-center mb-3">
        <ScanSearch className="h-6 w-6 text-[hsl(262_60%_70%)]" />
      </div>
      <h3 className="text-base font-medium">Give Ray something to look at</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
        Paste a suspicious URL, an email, a PowerShell script, a Defender alert — anything you
        want an AI security analyst to unpack.
      </p>
    </Card>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      <div>{children}</div>
    </div>
  );
}

function InvestigationDetail({ inv }: { inv: Investigation }) {
  if (inv.status === 'failed') {
    return (
      <Card className="p-5 border-red-500/30 bg-red-500/5">
        <div className="flex items-center gap-2 text-red-400">
          <ShieldAlert className="h-4 w-4" />
          <span className="font-medium">Ray could not finish this investigation.</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">{inv.error ?? 'Unknown error.'}</p>
      </Card>
    );
  }

  return (
    <Card className="p-5 space-y-6">
      {/* Verdict strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          {verdictBadge(inv.verdict)}
          {inv.confidence && (
            <span className="text-xs text-muted-foreground">
              Confidence: <span className="text-foreground capitalize">{inv.confidence}</span>
              {typeof inv.confidence_score === 'number' && ` (${inv.confidence_score})`}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Coins className="h-3 w-3" /> {inv.cost_ray_compute} RC · {new Date(inv.created_at).toLocaleString()}
        </span>
      </div>

      {inv.summary && (
        <Section icon={Brain} title="What Ray found">
          <p className="text-sm leading-relaxed">{inv.summary}</p>
        </Section>
      )}

      {inv.executive_summary && (
        <Section icon={FileText} title="Executive summary">
          <p className="text-sm leading-relaxed text-muted-foreground italic">{inv.executive_summary}</p>
        </Section>
      )}

      {inv.technical_findings.length > 0 && (
        <Section icon={ListChecks} title="Technical findings">
          <ul className="space-y-2">
            {inv.technical_findings.map((f, i) => (
              <li key={i} className="rounded-sm border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium">{f.title ?? 'Finding'}</span>
                  {f.severity && (
                    <span className={cn('text-[10px] uppercase tracking-wider', SEVERITY_CLASS[f.severity.toLowerCase()] ?? 'text-muted-foreground')}>
                      {f.severity}
                    </span>
                  )}
                </div>
                {f.detail && <p className="text-xs text-muted-foreground mt-1">{f.detail}</p>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {inv.mitre.length > 0 && (
        <Section icon={Target} title="MITRE ATT&CK">
          <div className="space-y-2">
            {inv.mitre.map((m, i) => (
              <div key={i} className="rounded-sm border border-border p-3">
                <div className="flex items-center gap-2">
                  {m.id && <Badge variant="outline" className="rounded-sm font-mono text-xs">{m.id}</Badge>}
                  <span className="text-sm">{m.name}</span>
                </div>
                {m.why && <p className="text-xs text-muted-foreground mt-1">{m.why}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {inv.iocs.length > 0 && (
        <Section icon={Fingerprint} title="Indicators of compromise">
          <div className="space-y-1.5">
            {inv.iocs.map((ioc, i) => (
              <div key={i} className="flex items-start gap-2 text-xs rounded-sm border border-border p-2">
                {ioc.type && <Badge variant="outline" className="rounded-sm text-[10px] uppercase">{ioc.type}</Badge>}
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-foreground break-all">{ioc.value}</div>
                  {ioc.note && <div className="text-muted-foreground mt-0.5">{ioc.note}</div>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {inv.recommended_response.length > 0 && (
        <Section icon={ChevronRight} title="What Ray recommends next">
          <ol className="space-y-2">
            {inv.recommended_response.map((r, i) => (
              <li key={i} className="flex items-start gap-3 rounded-sm border border-border p-3">
                <span className="h-6 w-6 shrink-0 rounded-full bg-[hsl(262_60%_64%/0.12)] text-[hsl(262_60%_75%)] text-xs flex items-center justify-center">
                  {r.priority ?? i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{r.action}</p>
                  {r.owner && <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Owner: {r.owner}</p>}
                </div>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {inv.timeline.length > 0 && (
        <Section icon={Layers} title="Timeline">
          <ol className="border-l border-border pl-4 space-y-3">
            {inv.timeline.map((t, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[19px] top-1 h-2 w-2 rounded-full bg-[hsl(262_60%_64%)]" />
                <p className="text-sm">{t.step}</p>
                {t.detail && <p className="text-xs text-muted-foreground mt-0.5">{t.detail}</p>}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {inv.evidence && Object.keys(inv.evidence).length > 0 && (
        <Section icon={FileText} title="Evidence">
          <pre className="text-xs bg-muted/40 rounded-sm p-3 overflow-x-auto whitespace-pre-wrap">
{JSON.stringify(inv.evidence, null, 2)}
          </pre>
        </Section>
      )}
    </Card>
  );
}
