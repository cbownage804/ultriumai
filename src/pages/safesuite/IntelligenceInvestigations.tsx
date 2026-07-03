/**
 * Deep Threat Investigation — Wrayth Intelligence flagship.
 *
 * The investigation detail is a tabbed workspace (Overview, Findings, MITRE,
 * Indicators, Timeline, Actions, Reports). Every investigation supports
 * one-click follow-ups — Ray reuses the case record to generate an executive
 * report, a management explanation, a compliance-style incident report, or
 * answer a free-form question. Follow-ups are persisted so the workspace
 * accumulates value over time.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  ScanSearch, Sparkles, ShieldAlert, CheckCircle2, AlertTriangle,
  HelpCircle, Coins, Clock, Trash2, Brain, ListChecks,
  Target, Fingerprint, FileText, Layers, ChevronRight, Presentation,
  MessageCircleQuestion, FileWarning, Send, Copy, Download, Lightbulb, FileDown,
  Search, ArrowUpDown, Filter,
} from 'lucide-react';
import { exportFollowupPdf } from '@/lib/wraythPdf';
import { ModuleRayBrief } from '@/components/ray/ModuleRayBrief';
import { HowIProtectYouCard } from '@/components/ray/HowIProtectYouCard';

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
  reasoning: {
    points?: Array<{ point?: string; weight?: string }>;
    caveats?: string;
  } | null;
  mitre: Array<{ id?: string; name?: string; why?: string }>;
  iocs: Array<{ type?: string; value?: string; note?: string }>;
  recommended_response: Array<{ priority?: number; action?: string; owner?: string }>;
  timeline: Array<{ step?: string; detail?: string }>;
  evidence: Record<string, unknown>;
  error: string | null;
  created_at: string;
  completed_at: string | null;
};

type FollowupType = 'executive_report' | 'management_explanation' | 'incident_report' | 'question';

type Followup = {
  id: string;
  investigation_id: string;
  user_id: string;
  followup_type: FollowupType;
  question: string | null;
  title: string;
  content: string | null;
  cost_ray_compute: number;
  status: string;
  error: string | null;
  created_at: string;
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

const FOLLOWUP_META: Record<FollowupType, { icon: React.ComponentType<{ className?: string }>; label: string; description: string; cost: number }> = {
  executive_report: {
    icon: Presentation,
    label: 'Executive report',
    description: 'One-page report for leadership',
    cost: 2,
  },
  management_explanation: {
    icon: MessageCircleQuestion,
    label: 'Explain to management',
    description: 'Plain-English summary, no jargon',
    cost: 1,
  },
  incident_report: {
    icon: FileWarning,
    label: 'Incident report',
    description: 'Compliance-style write-up',
    cost: 2,
  },
  question: {
    icon: Brain,
    label: 'Ask Ray a question',
    description: 'Free-form Q&A grounded in this case',
    cost: 1,
  },
};

// -----------------------------------------------------------------------------
// One-click investigation templates.
// Each template preselects an input type, seeds a helpful label, and (optionally)
// auto-chains a follow-up report when the case comes back malicious/suspicious.
// -----------------------------------------------------------------------------
type Template = {
  id: string;
  label: string;
  desc: string;
  inputType: InputType;
  labelSeed: string;
  placeholder: string;
  chainReport: FollowupType | null;
  icon: React.ComponentType<{ className?: string }>;
};

const TEMPLATES: Template[] = [
  {
    id: 'phishing_url',
    label: 'Phishing URL',
    desc: 'Investigate a link + auto-generate an incident report if malicious.',
    inputType: 'url',
    labelSeed: 'Phishing URL triage',
    placeholder: 'https://login-microsft365.support/verify',
    chainReport: 'incident_report',
    icon: ScanSearch,
  },
  {
    id: 'suspicious_login',
    label: 'Suspicious M365 login',
    desc: 'Reason over an M365 sign-in alert and chain a management explainer.',
    inputType: 'm365_alert',
    labelSeed: 'M365 suspicious login',
    placeholder: 'Paste the sign-in alert JSON or narrative…',
    chainReport: 'management_explanation',
    icon: AlertTriangle,
  },
  {
    id: 'ransomware_hash',
    label: 'Ransomware indicator',
    desc: 'Analyse a hash and auto-generate an executive report on impact.',
    inputType: 'file_hash',
    labelSeed: 'Ransomware hash triage',
    placeholder: 'SHA-256 of the suspicious binary',
    chainReport: 'executive_report',
    icon: ShieldAlert,
  },
  {
    id: 'powershell',
    label: 'Suspicious PowerShell',
    desc: 'Break down intent + MITRE, then explain it in plain English.',
    inputType: 'powershell',
    labelSeed: 'PowerShell triage',
    placeholder: 'powershell -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQA…',
    chainReport: 'management_explanation',
    icon: FileWarning,
  },
  {
    id: 'malicious_email',
    label: 'Malicious email',
    desc: 'Investigate the body + auto-chain an incident report if bad.',
    inputType: 'email',
    labelSeed: 'Reported phishing email',
    placeholder: 'Paste the full email body users flagged…',
    chainReport: 'incident_report',
    icon: MessageCircleQuestion,
  },
  {
    id: 'defender_alert',
    label: 'Defender alert triage',
    desc: 'Turn a Defender alert into a case + executive report.',
    inputType: 'defender_alert',
    labelSeed: 'Defender alert',
    placeholder: 'Paste the Defender alert JSON or summary…',
    chainReport: 'executive_report',
    icon: Target,
  },
];

/** Best-effort classification of a raw query string into an investigation input type. */
function detectInputType(q: string): InputType {
  const s = q.trim();
  if (!s) return 'url';
  if (/^[a-f0-9]{32}$|^[a-f0-9]{40}$|^[a-f0-9]{64}$/i.test(s)) return 'file_hash';
  if (/^(https?:\/\/|www\.)/i.test(s)) return 'url';
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(s)) return 'ip';
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return 'email';
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(s) && !s.includes(' ')) return 'domain';
  if (/get-\w+|invoke-\w+|-enc\s|powershell/i.test(s)) return 'powershell';
  return 'url';
}



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
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputType, setInputType] = useState<InputType>('url');
  const [payload, setPayload] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Investigation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // When set, we auto-chain a follow-up on the next successful investigation.
  const [pendingChain, setPendingChain] = useState<FollowupType | null>(null);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

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

  // Prefill from ?q= (Ask Ray) or ?template= (deep link from Command Center).
  useEffect(() => {
    const q = searchParams.get('q');
    const templateId = searchParams.get('template');
    if (q) {
      setPayload(q);
      setInputType(detectInputType(q));
    }
    if (templateId) {
      const tpl = TEMPLATES.find(t => t.id === templateId);
      if (tpl) applyTemplate(tpl);
    }
    if (q || templateId) {
      // Clear params so re-navigation doesn't loop.
      const next = new URLSearchParams(searchParams);
      next.delete('q'); next.delete('template');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyTemplate(tpl: Template) {
    setInputType(tpl.inputType);
    setLabel(tpl.labelSeed);
    setPendingChain(tpl.chainReport);
    setActiveTemplateId(tpl.id);
  }

  function clearTemplate() {
    setActiveTemplateId(null);
    setPendingChain(null);
    setLabel('');
  }

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

        // ---- Template chaining -------------------------------------------------
        // If a template asked us to chain a follow-up AND the verdict warrants it,
        // fire the follow-up automatically. Only chain on malicious/suspicious so
        // Ray doesn't burn compute writing reports for benign cases.
        const chain = pendingChain;
        if (chain && inv.status === 'complete' && (inv.verdict === 'malicious' || inv.verdict === 'suspicious')) {
          toast.info(`Chaining ${FOLLOWUP_META[chain].label.toLowerCase()}…`);
          try {
            const { error: fErr } = await supabase.functions.invoke('ray-investigate-followup', {
              body: { investigation_id: inv.id, followup_type: chain, question: null },
            });
            if (fErr) throw fErr;
            toast.success(`${FOLLOWUP_META[chain].label} chained automatically.`);
          } catch (e) {
            const msg = e instanceof Error ? e.message : 'Chained follow-up failed.';
            toast.error(msg);
          }
        }
        setPendingChain(null);
        setActiveTemplateId(null);
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

  const activeTemplate = activeTemplateId ? TEMPLATES.find(t => t.id === activeTemplateId) ?? null : null;


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
            Give Ray an artifact and he opens a case file — findings, MITRE mapping, IOCs, and one-click reports for
            every audience.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 rounded-sm">
          <Coins className="h-3.5 w-3.5" /> 3 Ray Compute / investigation
        </Badge>
      </div>

      <ModuleRayBrief
        eventPatterns={['event_type.ilike.investigation%', 'event_type.ilike.followup%', 'event_type.ilike.case%']}
        windowHours={168}
        idleLines={[
          "I haven't opened any investigations for you this week.",
          'Give me an artifact — a URL, hash, IP, or PowerShell command — and I\u2019ll open a case.',
        ]}
        composer={({ events }) => {
          const opened = events.filter((e) => /investigation/i.test(e.event_type)).length;
          const followups = events.filter((e) => /followup|report/i.test(e.event_type)).length;
          const lines: string[] = [];
          lines.push(opened === 1 ? "I've completed 1 investigation this week." : `I've completed ${opened} investigations this week.`);
          if (followups > 0) lines.push(followups === 1 ? "I've drafted 1 follow-up report." : `I've drafted ${followups} follow-up reports.`);
          lines.push("I'll correlate anything new against your existing cases automatically.");
          return { lines, tone: 'ok' };
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <div className="space-y-6 min-w-0">
          {/* Templates strip — one-click investigation launchers with optional chaining */}
          <Card className="p-4 space-y-3 border-[hsl(262_60%_64%/0.25)] bg-[hsl(262_60%_64%/0.03)]">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-[hsl(262_60%_70%)]" /> Investigation templates
              </div>
              {activeTemplate && (
                <button
                  type="button"
                  onClick={clearTemplate}
                  className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {TEMPLATES.map((tpl) => {
                const Icon = tpl.icon;
                const isActive = activeTemplateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className={cn(
                      'text-left rounded-sm border px-3 py-2.5 transition-colors flex items-start gap-2.5',
                      isActive
                        ? 'border-[hsl(262_60%_64%/0.55)] bg-[hsl(262_60%_64%/0.10)]'
                        : 'border-border bg-card hover:border-[hsl(262_60%_64%/0.35)] hover:bg-[hsl(262_60%_64%/0.05)]',
                    )}
                  >
                    <div className="h-7 w-7 rounded-sm bg-[hsl(262_60%_64%/0.10)] border border-[hsl(262_60%_64%/0.25)] flex items-center justify-center shrink-0">
                      <Icon className="h-3.5 w-3.5 text-[hsl(262_60%_78%)]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate">{tpl.label}</div>
                      <div className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{tpl.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            {activeTemplate && (
              <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 pt-1 border-t border-border/60">
                <ListChecks className="h-3 w-3 text-[hsl(262_60%_70%)]" />
                Chain: {activeTemplate.chainReport
                  ? `on malicious/suspicious verdict → ${FOLLOWUP_META[activeTemplate.chainReport].label}`
                  : 'no auto-chain'}
              </div>
            )}
          </Card>

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
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Artifact</label>
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

          {loading && !selected && <ResultSkeleton />}
          {selected && <InvestigationWorkspace inv={selected} onOpenInvestigation={setSelectedId} />}
          {!loading && !selected && history.length === 0 && <EmptyState />}
        </div>

        <aside className="space-y-3">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Recent investigations</h2>
          <div className="space-y-2">
            {history.length === 0 && (
              <p className="text-xs text-muted-foreground">Ray has not run any investigations yet.</p>
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

/* ---------------- Workspace ---------------- */

function InvestigationWorkspace({ inv, onOpenInvestigation }: { inv: Investigation; onOpenInvestigation: (id: string) => void }) {
  const [tab, setTab] = useState('overview');
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [busy, setBusy] = useState<FollowupType | null>(null);
  const [questionOpen, setQuestionOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [iocHistory, setIocHistory] = useState<Record<string, IocHistoryEntry>>({});

  const loadFollowups = useCallback(async () => {
    const { data } = await supabase
      .from('ray_investigation_followups')
      .select('*')
      .eq('investigation_id', inv.id)
      .order('created_at', { ascending: false });
    setFollowups((data as Followup[] | null) ?? []);
  }, [inv.id]);

  const loadIocHistory = useCallback(async () => {
    if (!inv.iocs || inv.iocs.length === 0) { setIocHistory({}); return; }
    // Defense-in-depth: even though RLS on ray_ioc_index scopes rows to
    // auth.uid() = user_id, always filter explicitly by the investigation's
    // owner so a misconfigured policy or a future service_role client cannot
    // leak another tenant's indicators through this query.
    if (!inv.user_id) { setIocHistory({}); return; }
    const norms = Array.from(new Set(
      inv.iocs
        .map(i => (typeof i.value === 'string' ? i.value.trim().toLowerCase() : ''))
        .filter(Boolean),
    ));
    if (norms.length === 0) return;
    const { data } = await supabase
      .from('ray_ioc_index')
      .select('ioc_type, ioc_value_norm, occurrence_count, first_seen_at, last_seen_at, last_verdict, investigation_ids')
      .eq('user_id', inv.user_id)
      .in('ioc_value_norm', norms);


    const rows = (data as Array<{
      ioc_type: string; ioc_value_norm: string; occurrence_count: number;
      first_seen_at: string; last_seen_at: string; last_verdict: string | null;
      investigation_ids: string[] | null;
    }> | null) ?? [];

    // Batch-fetch investigation metadata (date, verdict, label) for every
    // linked investigation so we can render verdict history and jump-to links.
    const allInvIds = Array.from(new Set(rows.flatMap(r => r.investigation_ids ?? []).filter(Boolean)));
    let invMeta = new Map<string, { created_at: string; verdict: string | null; input_label: string | null; input_type: string }>();
    if (allInvIds.length > 0) {
      const { data: invRows } = await supabase
        .from('ray_investigations')
        .select('id, created_at, verdict, input_label, input_type')
        .in('id', allInvIds);
      invMeta = new Map(((invRows as Array<{ id: string; created_at: string; verdict: string | null; input_label: string | null; input_type: string }> | null) ?? [])
        .map(r => [r.id, { created_at: r.created_at, verdict: r.verdict, input_label: r.input_label, input_type: r.input_type }]));
    }

    const map: Record<string, IocHistoryEntry> = {};
    for (const r of rows) {
      const sightings: IocSighting[] = (r.investigation_ids ?? [])
        .map(id => {
          const m = invMeta.get(id);
          if (!m) return null;
          return { id, created_at: m.created_at, verdict: m.verdict, label: m.input_label || m.input_type };
        })
        .filter((s): s is IocSighting => s !== null)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      map[`${r.ioc_type}::${r.ioc_value_norm}`] = {
        count: r.occurrence_count,
        first_seen_at: r.first_seen_at,
        last_seen_at: r.last_seen_at,
        last_verdict: r.last_verdict,
        timestamps: sightings.map(s => s.created_at),
        sightings,
      };
    }
    setIocHistory(map);
  }, [inv.id, inv.iocs]);



  useEffect(() => {
    setTab('overview');
    setFollowups([]);
    loadFollowups();
    loadIocHistory();
  }, [inv.id, loadFollowups, loadIocHistory]);

  async function runFollowup(type: FollowupType, q?: string) {
    setBusy(type);
    try {
      const { data, error } = await supabase.functions.invoke('ray-investigate-followup', {
        body: { investigation_id: inv.id, followup_type: type, question: q ?? null },
      });
      if (error) throw error;
      const f = (data as { followup?: Followup })?.followup;
      if (f) {
        setFollowups((prev) => [f, ...prev]);
        setTab('reports');
        toast.success(`${FOLLOWUP_META[type].label} ready. ${FOLLOWUP_META[type].cost} RC used.`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Follow-up failed.';
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  }

  async function deleteFollowup(id: string) {
    const { error } = await supabase.from('ray_investigation_followups').delete().eq('id', id);
    if (error) { toast.error('Could not delete.'); return; }
    setFollowups((prev) => prev.filter((f) => f.id !== id));
  }

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

  const findingCount = inv.technical_findings.length;
  const mitreCount = inv.mitre.length;
  const iocCount = inv.iocs.length;
  const actionCount = inv.recommended_response.length;
  const timelineCount = inv.timeline.length;
  const reportCount = followups.length;
  const reasoningPoints = inv.reasoning?.points ?? [];
  const reasoningCount = reasoningPoints.length;

  return (
    <Card className="overflow-hidden">
      {/* Verdict strip */}
      <div className="p-5 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {verdictBadge(inv.verdict)}
          {inv.confidence && (
            <span className="text-xs text-muted-foreground">
              Confidence: <span className="text-foreground capitalize">{inv.confidence}</span>
              {typeof inv.confidence_score === 'number' && ` (${inv.confidence_score})`}
            </span>
          )}
          {inv.input_label && (
            <span className="text-xs text-muted-foreground hidden sm:inline">— {inv.input_label}</span>
          )}
        </div>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Coins className="h-3 w-3" /> {inv.cost_ray_compute} RC · {new Date(inv.created_at).toLocaleString()}
        </span>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <div className="px-5 pt-4 overflow-x-auto">
          <TabsList className="bg-transparent p-0 h-auto gap-1 flex-wrap">
            <WorkspaceTab value="overview" label="Overview" icon={Brain} />
            <WorkspaceTab value="reasoning" label="Ray's Thinking" icon={Lightbulb} count={reasoningCount} />
            <WorkspaceTab value="findings" label="Findings" icon={ListChecks} count={findingCount} />
            <WorkspaceTab value="mitre" label="MITRE" icon={Target} count={mitreCount} />
            <WorkspaceTab value="iocs" label="Indicators" icon={Fingerprint} count={iocCount} />
            <WorkspaceTab value="timeline" label="Timeline" icon={Layers} count={timelineCount} />
            <WorkspaceTab value="actions" label="Actions" icon={ChevronRight} count={actionCount} />
            <WorkspaceTab value="reports" label="Reports" icon={FileText} count={reportCount} />
          </TabsList>
        </div>

        <div className="p-5 space-y-6">
          <TabsContent value="overview" className="mt-0 space-y-4">
            {inv.summary && <p className="text-sm leading-relaxed">{inv.summary}</p>}
            {inv.executive_summary && (
              <div className="rounded-sm border border-border p-3 bg-muted/30">
                <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1">
                  Executive summary
                </div>
                <p className="text-sm italic text-muted-foreground">{inv.executive_summary}</p>
              </div>
            )}
            {reasoningCount > 0 && (
              <ReasoningPanel
                points={reasoningPoints}
                caveats={inv.reasoning?.caveats}
                confidence={inv.confidence}
                confidenceScore={inv.confidence_score}
                compact
              />
            )}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
              <StatCell label="Findings" value={findingCount} />
              <StatCell label="MITRE" value={mitreCount} />
              <StatCell label="IOCs" value={iocCount} />
              <StatCell label="Actions" value={actionCount} />
              <StatCell label="Reports" value={reportCount} />
            </div>
          </TabsContent>

          <TabsContent value="reasoning" className="mt-0">
            {reasoningCount === 0 ? (
              <Empty text="Ray did not record explicit reasoning for this investigation." />
            ) : (
              <ReasoningPanel
                points={reasoningPoints}
                caveats={inv.reasoning?.caveats}
                confidence={inv.confidence}
                confidenceScore={inv.confidence_score}
              />
            )}
          </TabsContent>

          <TabsContent value="findings" className="mt-0">
            {findingCount === 0 ? <Empty text="Ray did not surface distinct technical findings." /> : (
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
            )}
          </TabsContent>

          <TabsContent value="mitre" className="mt-0">
            {mitreCount === 0 ? <Empty text="No ATT&CK techniques mapped." /> : (
              <div className="space-y-2">
                {inv.mitre.map((m, i) => (
                  <div key={i} className="rounded-sm border border-border p-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {m.id && <Badge variant="outline" className="rounded-sm font-mono text-xs">{m.id}</Badge>}
                      <span className="text-sm">{m.name}</span>
                    </div>
                    {m.why && <p className="text-xs text-muted-foreground mt-1">{m.why}</p>}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="iocs" className="mt-0">
            {iocCount === 0
              ? <Empty text="Ray did not extract distinct indicators." />
              : <IocsPanel iocs={inv.iocs} iocHistory={iocHistory} invVerdict={inv.verdict} currentInvId={inv.id} onOpenInvestigation={onOpenInvestigation} />
            }
          </TabsContent>


          <TabsContent value="timeline" className="mt-0">
            {timelineCount === 0 ? <Empty text="No timeline reconstructed." /> : (
              <ol className="border-l border-border pl-4 space-y-3">
                {inv.timeline.map((t, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[19px] top-1 h-2 w-2 rounded-full bg-[hsl(262_60%_64%)]" />
                    <p className="text-sm">{t.step}</p>
                    {t.detail && <p className="text-xs text-muted-foreground mt-0.5">{t.detail}</p>}
                  </li>
                ))}
              </ol>
            )}
          </TabsContent>

          <TabsContent value="actions" className="mt-0">
            {actionCount === 0 ? <Empty text="No recommended actions." /> : (
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
            )}
          </TabsContent>

          <TabsContent value="reports" className="mt-0">
            {reportCount === 0 ? (
              <Empty text="Generate an executive report, a management explanation, or ask Ray a question — the outputs land here." />
            ) : (
              <div className="space-y-3">
                {followups.map((f) => (
                  <FollowupCard key={f.id} followup={f} onDelete={() => deleteFollowup(f.id)} />
                ))}
              </div>
            )}
          </TabsContent>
        </div>

        {/* Follow-up action strip */}
        <div className="px-5 py-4 border-t border-border bg-muted/20">
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
            One-click follow-ups
          </div>
          <div className="flex flex-wrap gap-2">
            {(['executive_report', 'management_explanation', 'incident_report'] as FollowupType[]).map((t) => {
              const meta = FOLLOWUP_META[t];
              const Icon = meta.icon;
              const isBusy = busy === t;
              return (
                <Button
                  key={t}
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-sm"
                  disabled={busy !== null}
                  onClick={() => runFollowup(t)}
                >
                  <Icon className={cn('h-3.5 w-3.5', isBusy && 'animate-pulse')} />
                  {meta.label}
                  <span className="text-[10px] text-muted-foreground">{meta.cost} RC</span>
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-sm"
              disabled={busy !== null}
              onClick={() => setQuestionOpen(true)}
            >
              <Brain className="h-3.5 w-3.5" />
              Ask Ray a question
              <span className="text-[10px] text-muted-foreground">1 RC</span>
            </Button>
          </div>
        </div>
      </Tabs>

      <AskRayDialog
        open={questionOpen}
        onOpenChange={setQuestionOpen}
        value={question}
        onChange={setQuestion}
        onSubmit={async () => {
          const q = question.trim();
          if (!q) return;
          setQuestionOpen(false);
          setQuestion('');
          await runFollowup('question', q);
        }}
        busy={busy === 'question'}
      />
    </Card>
  );
}

function WorkspaceTab({
  value, label, icon: Icon, count,
}: { value: string; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }) {
  return (
    <TabsTrigger
      value={value}
      className={cn(
        'gap-1.5 rounded-sm border border-transparent',
        'data-[state=active]:bg-[hsl(262_60%_64%/0.12)] data-[state=active]:border-[hsl(262_60%_64%/0.4)]',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
      {typeof count === 'number' && count > 0 && (
        <span className="text-[10px] text-muted-foreground">{count}</span>
      )}
    </TabsTrigger>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-sm border border-border px-3 py-2">
      <div className="text-lg font-medium leading-none">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

const WEIGHT_STYLE: Record<string, string> = {
  decisive: 'bg-red-500/10 text-red-400 border-red-500/30',
  strong: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  supporting: 'bg-muted text-muted-foreground border-border',
  mitigating: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
};

function ReasoningPanel({
  points, caveats, confidence, confidenceScore, compact,
}: {
  points: Array<{ point?: string; weight?: string }>;
  caveats?: string;
  confidence: string | null;
  confidenceScore: number | null;
  compact?: boolean;
}) {
  return (
    <div className={cn(
      'rounded-sm border p-4 space-y-3',
      compact
        ? 'border-[hsl(262_60%_64%/0.3)] bg-[hsl(262_60%_64%/0.05)]'
        : 'border-border',
    )}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-[hsl(262_60%_70%)]" />
          <span className="text-sm font-medium">Why Ray reached this verdict</span>
        </div>
        {confidence && (
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Confidence: <span className="text-foreground">{confidence}</span>
            {typeof confidenceScore === 'number' && ` · ${confidenceScore}%`}
          </span>
        )}
      </div>
      <ul className="space-y-2">
        {points.map((p, i) => {
          const weight = (p.weight ?? '').toLowerCase();
          const style = WEIGHT_STYLE[weight];
          return (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[hsl(262_60%_64%)] shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="leading-relaxed">{p.point}</span>
                {style && (
                  <Badge variant="outline" className={cn('ml-2 rounded-sm text-[9px] uppercase tracking-wider align-middle', style)}>
                    {weight}
                  </Badge>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {caveats && (
        <div className="text-xs text-muted-foreground border-t border-border/60 pt-2 italic">
          {caveats}
        </div>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground py-6 text-center">{text}</p>;
}

function FollowupCard({ followup, onDelete }: { followup: Followup; onDelete: () => void }) {
  const meta = FOLLOWUP_META[followup.followup_type];
  const Icon = meta.icon;

  function copy() {
    if (!followup.content) return;
    navigator.clipboard.writeText(followup.content);
    toast.success('Copied to clipboard.');
  }

  function download() {
    if (!followup.content) return;
    const slug = followup.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
    const blob = new Blob([followup.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug || 'wrayth-report'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadPdf() {
    if (!followup.content) return;
    try {
      exportFollowupPdf(followup.content, {
        title: followup.title,
        subtitle: meta.label,
        kicker: new Date(followup.created_at).toLocaleString(),
      });
      toast.success('PDF exported.');
    } catch (e) {
      toast.error('Could not export PDF.');
      console.error(e);
    }
  }

  return (
    <div className="rounded-sm border border-border overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border bg-muted/20 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="h-4 w-4 text-[hsl(262_60%_70%)] shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{followup.title}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {meta.label} · {followup.cost_ray_compute} RC · {new Date(followup.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copy} aria-label="Copy">
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={download} aria-label="Download Markdown">
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={downloadPdf} aria-label="Download PDF">
            <FileDown className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={onDelete} aria-label="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="p-4">
        {followup.status === 'failed' ? (
          <p className="text-sm text-red-400">Ray could not generate this output. {followup.error}</p>
        ) : (
          <MarkdownLite text={followup.content ?? ''} />
        )}
      </div>
    </div>
  );
}

/**
 * Very small Markdown renderer — headings, bullets, bold, paragraphs.
 * The follow-up prompts already produce clean Markdown; a full renderer is
 * overkill and would drag in a dependency.
 */
function MarkdownLite({ text }: { text: string }) {
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let paraBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length === 0) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="list-disc pl-5 space-y-1 text-sm">
        {listBuffer.map((li, i) => <li key={i}>{renderInline(li)}</li>)}
      </ul>,
    );
    listBuffer = [];
  };
  const flushPara = () => {
    if (paraBuffer.length === 0) return;
    blocks.push(
      <p key={`p-${blocks.length}`} className="text-sm leading-relaxed">
        {renderInline(paraBuffer.join(' '))}
      </p>,
    );
    paraBuffer = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^###\s+/.test(line)) {
      flushList(); flushPara();
      blocks.push(<h4 key={blocks.length} className="text-sm font-semibold mt-3">{line.replace(/^###\s+/, '')}</h4>);
    } else if (/^##\s+/.test(line)) {
      flushList(); flushPara();
      blocks.push(<h3 key={blocks.length} className="text-base font-semibold mt-4">{line.replace(/^##\s+/, '')}</h3>);
    } else if (/^#\s+/.test(line)) {
      flushList(); flushPara();
      blocks.push(<h2 key={blocks.length} className="text-lg font-semibold mt-4">{line.replace(/^#\s+/, '')}</h2>);
    } else if (/^\s*[-*]\s+/.test(line)) {
      flushPara();
      listBuffer.push(line.replace(/^\s*[-*]\s+/, ''));
    } else if (line.trim() === '') {
      flushList(); flushPara();
    } else {
      flushList();
      paraBuffer.push(line);
    }
  }
  flushList(); flushPara();

  return <div className="space-y-2">{blocks}</div>;
}

function renderInline(text: string): React.ReactNode {
  // Split on **bold** — nothing else fancy.
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (/^\*\*[^*]+\*\*$/.test(p)) {
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    }
    return <span key={i}>{p}</span>;
  });
}

function AskRayDialog({
  open, onOpenChange, value, onChange, onSubmit, busy,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void | Promise<void>;
  busy: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-[hsl(262_60%_70%)]" />
            Ask Ray about this investigation
          </DialogTitle>
        </DialogHeader>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. What would happen if the user clicked this link? How confident are you? What should I tell the affected user?"
          className="min-h-[120px]"
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          Ray only uses this investigation's record — he won't invent details.
        </p>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSubmit} disabled={busy || !value.trim()} className="gap-2">
            {busy ? <Brain className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}
            Ask (1 RC)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Indicators panel with sort + filter ---------------- */

type IocSighting = { id: string; created_at: string; verdict: string | null; label: string };
type IocHistoryEntry = { count: number; last_seen_at: string; first_seen_at: string; last_verdict: string | null; timestamps: string[]; sightings: IocSighting[] };
type IocItem = { type?: string; value?: string; note?: string };
type IocSort = 'default' | 'prior_desc' | 'last_seen_desc' | 'first_seen_desc' | 'type_asc';

function IocsPanel({
  iocs,
  iocHistory,
  invVerdict,
  currentInvId,
  onOpenInvestigation,
}: {
  iocs: IocItem[];
  iocHistory: Record<string, IocHistoryEntry>;
  invVerdict: string | null;
  currentInvId: string;
  onOpenInvestigation: (id: string) => void;
}) {
  const [sort, setSort] = useState<IocSort>('prior_desc');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [repeatOnly, setRepeatOnly] = useState(false);

  const types = useMemo(() => {
    const set = new Set<string>();
    iocs.forEach(i => { if (i.type) set.add(i.type); });
    return Array.from(set).sort();
  }, [iocs]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const enriched = iocs.map((ioc, i) => {
      const type = (ioc.type ?? '').toLowerCase();
      const norm = (ioc.value ?? '').trim().toLowerCase();
      const history = iocHistory[`${type}::${norm}`];
      const priorCount = history ? Math.max(0, history.count - 1) : 0;
      return {
        idx: i,
        ioc,
        history,
        priorCount,
        lastSeen: history?.last_seen_at ? new Date(history.last_seen_at).getTime() : 0,
        firstSeen: history?.first_seen_at ? new Date(history.first_seen_at).getTime() : 0,
      };
    });

    const filtered = enriched.filter(r => {
      if (typeFilter !== 'all' && (r.ioc.type ?? '') !== typeFilter) return false;
      if (repeatOnly && r.priorCount === 0) return false;
      if (q) {
        const hay = `${r.ioc.type ?? ''} ${r.ioc.value ?? ''} ${r.ioc.note ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const sorted = [...filtered];
    switch (sort) {
      case 'prior_desc':
        sorted.sort((a, b) => b.priorCount - a.priorCount || b.lastSeen - a.lastSeen);
        break;
      case 'last_seen_desc':
        sorted.sort((a, b) => b.lastSeen - a.lastSeen || b.priorCount - a.priorCount);
        break;
      case 'first_seen_desc':
        sorted.sort((a, b) => b.firstSeen - a.firstSeen);
        break;
      case 'type_asc':
        sorted.sort((a, b) => (a.ioc.type ?? '').localeCompare(b.ioc.type ?? '') || b.priorCount - a.priorCount);
        break;
      case 'default':
      default:
        sorted.sort((a, b) => a.idx - b.idx);
    }
    return sorted;
  }, [iocs, iocHistory, sort, typeFilter, query, repeatOnly]);

  const shownCount = rows.length;
  const totalCount = iocs.length;

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 rounded-sm border border-border bg-muted/20 p-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search indicators…"
            className="h-8 pl-7 text-xs"
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 w-[140px] text-xs gap-1">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {types.map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => setSort(v as IocSort)}>
          <SelectTrigger className="h-8 w-[200px] text-xs gap-1">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="prior_desc">Most prior sightings</SelectItem>
            <SelectItem value="last_seen_desc">Most recent sighting</SelectItem>
            <SelectItem value="first_seen_desc">Newest first seen</SelectItem>
            <SelectItem value="type_asc">Type (A–Z)</SelectItem>
            <SelectItem value="default">Original order</SelectItem>
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant={repeatOnly ? 'default' : 'outline'}
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() => setRepeatOnly(v => !v)}
        >
          <Brain className="h-3.5 w-3.5" />
          Repeat offenders
        </Button>

        <span className="text-[10px] text-muted-foreground ml-auto">
          {shownCount} / {totalCount}
        </span>
      </div>

      {/* Rows */}
      {rows.length === 0 ? (
        <Empty text="No indicators match your filters." />
      ) : (
        <div className="space-y-1.5">
          {rows.map(({ ioc, history, priorCount, idx }) => (
            <div key={idx} className="flex items-start gap-2 text-xs rounded-sm border border-border p-2">
              {ioc.type && <Badge variant="outline" className="rounded-sm text-[10px] uppercase shrink-0">{ioc.type}</Badge>}
              <div className="min-w-0 flex-1">
                <div className="font-mono text-foreground break-all">{ioc.value}</div>
                {ioc.note && <div className="text-muted-foreground mt-0.5">{ioc.note}</div>}
                {priorCount > 0 && history && (
                  <SeenBeforeCallout
                    history={history}
                    priorCount={priorCount}
                    invVerdict={invVerdict}
                    currentInvId={currentInvId}
                    onOpenInvestigation={onOpenInvestigation}
                  />
                )}
              </div>
              {history && history.timestamps && history.timestamps.length > 0 && (
                <IocSparkline timestamps={history.timestamps} />
              )}
            </div>

          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Inline sparkline: sightings over time ---------------- */

/**
 * Renders a compact bar sparkline showing how often the IOC has appeared
 * across the user's investigations, bucketed into weeks. Window auto-adapts:
 * uses 12 weeks by default, or the full first-seen → now range if longer.
 */
function IocSparkline({ timestamps }: { timestamps: string[] }) {
  const { buckets, max, rangeLabel, total } = useMemo(() => {
    const dates = timestamps
      .map(t => new Date(t).getTime())
      .filter(t => Number.isFinite(t))
      .sort((a, b) => a - b);
    if (dates.length === 0) {
      return { buckets: [] as number[], max: 0, rangeLabel: '', total: 0 };
    }
    const now = Date.now();
    const first = dates[0];
    const WEEK = 7 * 24 * 60 * 60 * 1000;
    const spanWeeks = Math.max(1, Math.ceil((now - first) / WEEK) + 1);
    const nBuckets = Math.min(24, Math.max(12, spanWeeks));
    const start = now - nBuckets * WEEK;
    const buckets = new Array<number>(nBuckets).fill(0);
    for (const d of dates) {
      const idx = Math.floor((d - start) / WEEK);
      if (idx >= 0 && idx < nBuckets) buckets[idx] += 1;
      else if (idx < 0) buckets[0] += 1;
    }
    const max = buckets.reduce((m, v) => Math.max(m, v), 0);
    const startLabel = new Date(start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return { buckets, max, rangeLabel: `${startLabel} → now · weekly`, total: dates.length };
  }, [timestamps]);

  if (buckets.length === 0 || max === 0) return null;

  const W = 96;
  const H = 24;
  const gap = 1;
  const barW = (W - gap * (buckets.length - 1)) / buckets.length;

  return (
    <div
      className="shrink-0 flex flex-col items-end gap-0.5"
      title={`${total} sighting${total === 1 ? '' : 's'} · ${rangeLabel}`}
      aria-label={`Sightings sparkline: ${total} sightings, ${rangeLabel}`}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img">
        {buckets.map((v, i) => {
          const h = v === 0 ? 1 : (v / max) * (H - 2);
          const x = i * (barW + gap);
          const y = H - h;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={0.5}
              fill={v === 0 ? 'hsl(220 12% 28%)' : 'hsl(262 60% 68%)'}
              opacity={v === 0 ? 0.5 : 0.85}
            />
          );
        })}
      </svg>
      <span className="text-[9px] text-muted-foreground leading-none">
        peak {max}/wk
      </span>
    </div>
  );
}

/* ---------------- "Seen before" verdict-history callout ---------------- */

/**
 * Rich version of the prior-sightings badge:
 *  - tallies every verdict Ray has assigned to this indicator across all
 *    investigations the user has run,
 *  - highlights whether the current verdict is consistent or has flipped,
 *  - and lists every past investigation where the verdict differed from the
 *    current one, each as a clickable link that jumps into that case.
 */
function verdictDotClass(v: string | null | undefined): string {
  switch ((v || '').toLowerCase()) {
    case 'malicious':  return 'bg-[hsl(0_70%_60%)]';
    case 'suspicious': return 'bg-[hsl(38_90%_58%)]';
    case 'benign':     return 'bg-[hsl(142_60%_50%)]';
    default:           return 'bg-[hsl(220_12%_55%)]';
  }
}

function verdictPillClass(v: string | null | undefined): string {
  switch ((v || '').toLowerCase()) {
    case 'malicious':  return 'bg-[hsl(0_70%_60%/0.12)] text-[hsl(0_80%_78%)] border-[hsl(0_70%_60%/0.35)]';
    case 'suspicious': return 'bg-[hsl(38_90%_58%/0.12)] text-[hsl(38_95%_75%)] border-[hsl(38_90%_58%/0.35)]';
    case 'benign':     return 'bg-[hsl(142_60%_50%/0.12)] text-[hsl(142_70%_72%)] border-[hsl(142_60%_50%/0.35)]';
    default:           return 'bg-muted text-muted-foreground border-border';
  }
}

function SeenBeforeCallout({
  history,
  priorCount,
  invVerdict,
  currentInvId,
  onOpenInvestigation,
}: {
  history: IocHistoryEntry;
  priorCount: number;
  invVerdict: string | null;
  currentInvId: string;
  onOpenInvestigation: (id: string) => void;
}) {
  const current = (invVerdict || 'unknown').toLowerCase();

  // Only "prior" sightings — exclude the current investigation.
  const priorSightings = useMemo(
    () => history.sightings.filter(s => s.id !== currentInvId),
    [history.sightings, currentInvId],
  );

  const verdictTally = useMemo(() => {
    const t: Record<string, number> = {};
    for (const s of priorSightings) {
      const v = (s.verdict || 'unknown').toLowerCase();
      t[v] = (t[v] || 0) + 1;
    }
    return Object.entries(t).sort((a, b) => b[1] - a[1]);
  }, [priorSightings]);

  const differing = useMemo(
    () => priorSightings.filter(s => (s.verdict || 'unknown').toLowerCase() !== current),
    [priorSightings, current],
  );

  const flipped = differing.length > 0;

  return (
    <details className="group mt-1.5 rounded-sm border border-[hsl(262_60%_64%/0.35)] bg-[hsl(262_60%_64%/0.06)] open:bg-[hsl(262_60%_64%/0.09)]">
      <summary className="cursor-pointer list-none px-2 py-1 flex flex-wrap items-center gap-1.5 text-[10px] text-[hsl(262_60%_82%)]">
        <Brain className="h-3 w-3" />
        <span className="font-medium">
          Seen {priorCount} time{priorCount === 1 ? '' : 's'} before
        </span>
        {history.first_seen_at && (
          <span className="text-muted-foreground">
            · since {new Date(history.first_seen_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        )}
        {verdictTally.length > 0 && (
          <span className="flex items-center gap-1 ml-1">
            {verdictTally.map(([v, n]) => (
              <span
                key={v}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm border text-[9px] uppercase tracking-wider ${verdictPillClass(v)}`}
                title={`${n} prior investigation${n === 1 ? '' : 's'} marked ${v}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${verdictDotClass(v)}`} />
                {v} · {n}
              </span>
            ))}
          </span>
        )}
        {flipped && (
          <span className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-sm border border-[hsl(38_90%_58%/0.45)] bg-[hsl(38_90%_58%/0.12)] text-[hsl(38_95%_78%)] text-[9px] uppercase tracking-wider">
            <AlertTriangle className="h-2.5 w-2.5" />
            verdict changed
          </span>
        )}
        <ChevronRight className="h-3 w-3 ml-auto text-muted-foreground transition-transform group-open:rotate-90" />
      </summary>

      <div className="border-t border-[hsl(262_60%_64%/0.2)] px-2 py-2 space-y-2 text-[10px]">
        {differing.length > 0 && (
          <div>
            <div className="text-muted-foreground uppercase tracking-wider text-[9px] mb-1">
              Prior investigations where the verdict differed from now ({current})
            </div>
            <ul className="space-y-1">
              {differing.map(s => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => onOpenInvestigation(s.id)}
                    className="w-full text-left flex items-center gap-2 px-2 py-1 rounded-sm border border-border bg-background/50 hover:bg-accent transition-colors"
                  >
                    <span className={`h-2 w-2 rounded-full shrink-0 ${verdictDotClass(s.verdict)}`} />
                    <span className={`px-1.5 py-0.5 rounded-sm border text-[9px] uppercase tracking-wider shrink-0 ${verdictPillClass(s.verdict)}`}>
                      {s.verdict || 'unknown'}
                    </span>
                    <span className="text-foreground/90 truncate flex-1">{s.label}</span>
                    <span className="text-muted-foreground shrink-0">
                      {new Date(s.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {priorSightings.length > differing.length && (
          <div>
            <div className="text-muted-foreground uppercase tracking-wider text-[9px] mb-1">
              Prior investigations that agreed with now ({current})
            </div>
            <ul className="space-y-1">
              {priorSightings.filter(s => (s.verdict || 'unknown').toLowerCase() === current).slice(0, 5).map(s => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => onOpenInvestigation(s.id)}
                    className="w-full text-left flex items-center gap-2 px-2 py-1 rounded-sm border border-border/60 bg-background/30 hover:bg-accent transition-colors"
                  >
                    <span className={`h-2 w-2 rounded-full shrink-0 ${verdictDotClass(s.verdict)}`} />
                    <span className="text-foreground/80 truncate flex-1">{s.label}</span>
                    <span className="text-muted-foreground shrink-0">
                      {new Date(s.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </details>
  );
}
