/**
 * IntelligenceDrafts — turn findings into draft policies and runbooks.
 *
 * User picks any combination of recent investigations, log analyses, and
 * code/malware analyses, chooses whether to draft a Policy or a Runbook,
 * picks the type, and Ray drafts it — grounded in the actual findings.
 *
 * The draft persists to ray_policies (same table as the generic Policy
 * Generator) so users can edit and DOCX-export it from /intelligence/policies.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  Brain, Sparkles, ScanSearch, FileWarning, Bug, ClipboardCheck, BookOpen,
  ShieldCheck, ArrowUpRight, Coins, Loader2, ListChecks, FileText,
} from 'lucide-react';

type SourceKind = 'investigation' | 'log_analysis' | 'code_analysis';

type SourceItem = {
  kind: SourceKind;
  id: string;
  title: string;
  subtitle: string;
  createdAt: string;
};

const POLICY_OPTIONS = [
  { value: 'incident_response',   label: 'Incident Response Policy' },
  { value: 'access_control',      label: 'Access Control Policy' },
  { value: 'password',            label: 'Password Policy' },
  { value: 'mfa',                 label: 'MFA Policy' },
  { value: 'email_security',      label: 'Email Security Policy' },
  { value: 'byod',                label: 'BYOD Policy' },
  { value: 'remote_work',         label: 'Remote Work Policy' },
  { value: 'data_classification', label: 'Data Classification Policy' },
  { value: 'vendor_risk',         label: 'Vendor Risk Policy' },
  { value: 'backup',              label: 'Backup Policy' },
  { value: 'disaster_recovery',   label: 'Disaster Recovery Policy' },
  { value: 'acceptable_use',      label: 'Acceptable Use Policy' },
];

const RUNBOOK_OPTIONS = [
  { value: 'incident_runbook',   label: 'Incident Response Runbook' },
  { value: 'detection_runbook',  label: 'Detection & Triage Runbook' },
  { value: 'response_playbook',  label: 'Containment Playbook' },
];

const FRAMEWORKS = ['CIS v8', 'NIST CSF 2.0', 'NIST 800-53', 'ISO 27001', 'SOC 2', 'HIPAA', 'PCI DSS', 'GDPR'];

type DraftRow = {
  id: string;
  title: string;
  policy_type: string;
  status: string;
  created_at: string;
  metadata: {
    kind?: string;
    source_refs?: Array<{ kind: string; id: string; title: string }>;
    executive_summary?: string | null;
  } | null;
};

export default function IntelligenceDrafts() {
  const { user } = useAuth();
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [selected, setSelected] = useState<Record<string, SourceItem>>({});

  const [mode, setMode] = useState<'policy' | 'runbook'>('runbook');
  const [type, setType] = useState<string>('incident_runbook');
  const [orgName, setOrgName] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [frameworks, setFrameworks] = useState<string[]>(['CIS v8', 'NIST CSF 2.0']);
  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);

  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(true);

  const loadSources = useCallback(async () => {
    if (!user) return;
    setLoadingSources(true);
    const [invs, logs, code] = await Promise.all([
      supabase.from('ray_investigations')
        .select('id, input_label, input_type, verdict, status, created_at')
        .eq('user_id', user.id).eq('status', 'complete')
        .order('created_at', { ascending: false }).limit(30),
      supabase.from('ray_log_analyses')
        .select('id, input_label, source_kind, status, created_at')
        .eq('user_id', user.id).eq('status', 'complete')
        .order('created_at', { ascending: false }).limit(30),
      supabase.from('ray_code_analyses')
        .select('id, input_label, mode, language, verdict, status, created_at')
        .eq('user_id', user.id).eq('status', 'complete')
        .order('created_at', { ascending: false }).limit(30),
    ]);
    const merged: SourceItem[] = [];
    for (const r of (invs.data ?? []) as Array<Record<string, unknown>>) {
      merged.push({
        kind: 'investigation', id: String(r.id),
        title: (r.input_label as string) || (r.input_type as string) || 'Investigation',
        subtitle: `Verdict · ${(r.verdict as string) ?? 'unknown'}`,
        createdAt: String(r.created_at),
      });
    }
    for (const r of (logs.data ?? []) as Array<Record<string, unknown>>) {
      merged.push({
        kind: 'log_analysis', id: String(r.id),
        title: (r.input_label as string) || `${r.source_kind} log`,
        subtitle: `Log source · ${r.source_kind}`,
        createdAt: String(r.created_at),
      });
    }
    for (const r of (code.data ?? []) as Array<Record<string, unknown>>) {
      merged.push({
        kind: 'code_analysis', id: String(r.id),
        title: (r.input_label as string) || `${r.mode} · ${r.language}`,
        subtitle: `${r.mode} · verdict ${(r.verdict as string) ?? '—'}`,
        createdAt: String(r.created_at),
      });
    }
    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setSources(merged);
    setLoadingSources(false);
  }, [user]);

  const loadDrafts = useCallback(async () => {
    if (!user) return;
    setDraftsLoading(true);
    const { data } = await supabase.from('ray_policies')
      .select('id, title, policy_type, status, created_at, metadata')
      .eq('user_id', user.id)
      .not('metadata->>source_refs', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20);
    setDrafts((data ?? []) as unknown as DraftRow[]);
    setDraftsLoading(false);
  }, [user]);

  useEffect(() => { void loadSources(); void loadDrafts(); }, [loadSources, loadDrafts]);

  const toggle = (item: SourceItem) => {
    const key = `${item.kind}:${item.id}`;
    setSelected(prev => {
      const next = { ...prev };
      if (next[key]) delete next[key]; else next[key] = item;
      return next;
    });
  };

  const selectedList = useMemo(() => Object.values(selected), [selected]);

  const canGenerate = selectedList.length > 0 && !!type && !generating;

  const generate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ray-policy-generate', {
        body: {
          policy_type: type,
          organization_name: orgName || null,
          jurisdiction: jurisdiction || null,
          frameworks,
          notes,
          source_refs: selectedList.map(s => ({ kind: s.kind, id: s.id })),
        },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error?: string }).error);
      toast.success(`Draft ${mode === 'runbook' ? 'runbook' : 'policy'} generated`);
      setSelected({});
      setNotes('');
      await loadDrafts();
    } catch (e) {
      const msg = (e as Error).message ?? 'Generation failed';
      if (msg.includes('credits_exhausted')) toast.error('Out of Ray Compute credits');
      else toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
          <Brain className="h-3.5 w-3.5" /> Ray Intelligence · Drafts from Findings
        </div>
        <h1 className="text-2xl font-semibold mt-1 flex items-center gap-2">
          Policies &amp; Runbooks from Findings
          <Sparkles className="h-5 w-5 text-[hsl(262_60%_70%)]" />
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
          Turn what Ray has already learned — investigation verdicts, log critical findings, malware
          behaviors — into an editable draft policy or step-by-step response runbook.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-4">
        {/* Left: source picker */}
        <Card className="border-border bg-card">
          <div className="p-4 border-b border-border">
            <div className="text-sm font-medium flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-[hsl(262_60%_70%)]" />
              Pick source findings
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {selectedList.length} selected · Ray will ground the draft in these records.
            </div>
          </div>

          <Tabs defaultValue="all" className="p-4">
            <TabsList>
              <TabsTrigger value="all">All ({sources.length})</TabsTrigger>
              <TabsTrigger value="investigation" className="gap-1">
                <ScanSearch className="h-3.5 w-3.5" /> Investigations
              </TabsTrigger>
              <TabsTrigger value="log_analysis" className="gap-1">
                <FileWarning className="h-3.5 w-3.5" /> Logs
              </TabsTrigger>
              <TabsTrigger value="code_analysis" className="gap-1">
                <Bug className="h-3.5 w-3.5" /> Malware / Scripts
              </TabsTrigger>
            </TabsList>
            {(['all', 'investigation', 'log_analysis', 'code_analysis'] as const).map(tab => {
              const rows = tab === 'all' ? sources : sources.filter(s => s.kind === tab);
              return (
                <TabsContent key={tab} value={tab} className="mt-3">
                  {loadingSources ? (
                    <div className="space-y-2">
                      {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                  ) : rows.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-4 text-center">
                      No completed records yet. Run an investigation or log analysis first.
                    </div>
                  ) : (
                    <div className="max-h-[520px] overflow-y-auto space-y-1">
                      {rows.map(item => {
                        const key = `${item.kind}:${item.id}`;
                        const isSel = !!selected[key];
                        return (
                          <button
                            key={key}
                            onClick={() => toggle(item)}
                            className={cn(
                              'w-full text-left flex items-center gap-3 rounded-sm border p-2.5 transition-colors',
                              isSel
                                ? 'border-[hsl(262_60%_64%/0.5)] bg-[hsl(262_60%_64%/0.06)]'
                                : 'border-border hover:bg-accent/40',
                            )}
                          >
                            <Checkbox checked={isSel} onCheckedChange={() => toggle(item)} />
                            <SourceIcon kind={item.kind} />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm truncate">{item.title}</div>
                              <div className="text-[11px] text-muted-foreground">
                                {item.subtitle} · {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </Card>

        {/* Right: draft config */}
        <Card className="border-border bg-card h-fit">
          <div className="p-4 border-b border-border">
            <div className="text-sm font-medium">Draft configuration</div>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Output</Label>
              <RadioGroup
                value={mode}
                onValueChange={v => {
                  const m = v as 'policy' | 'runbook';
                  setMode(m);
                  setType(m === 'runbook' ? 'incident_runbook' : 'incident_response');
                }}
                className="mt-2 grid grid-cols-2 gap-2"
              >
                <ModeCard value="runbook" active={mode === 'runbook'} Icon={BookOpen} label="Runbook" desc="Step-by-step response" />
                <ModeCard value="policy"  active={mode === 'policy'}  Icon={ClipboardCheck} label="Policy" desc="Enforceable clauses" />
              </RadioGroup>
            </div>

            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {mode === 'runbook' ? 'Runbook type' : 'Policy type'}
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(mode === 'runbook' ? RUNBOOK_OPTIONS : POLICY_OPTIONS).map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Organization</Label>
                <Input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Acme Corp" className="mt-1" />
              </div>
              <div>
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Jurisdiction</Label>
                <Input value={jurisdiction} onChange={e => setJurisdiction(e.target.value)} placeholder="US · EU" className="mt-1" />
              </div>
            </div>

            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Frameworks</Label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {FRAMEWORKS.map(f => {
                  const on = frameworks.includes(f);
                  return (
                    <button
                      key={f}
                      onClick={() => setFrameworks(prev => on ? prev.filter(x => x !== f) : [...prev, f])}
                      className={cn(
                        'text-[11px] px-2 py-1 rounded-sm border transition-colors',
                        on
                          ? 'border-[hsl(262_60%_64%/0.5)] bg-[hsl(262_60%_64%/0.12)] text-[hsl(262_60%_82%)]'
                          : 'border-border text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Additional notes</Label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value.slice(0, 4000))}
                placeholder="Anything Ray should keep in mind (org size, tooling, prior incidents)…"
                className="mt-1 min-h-[80px] text-xs"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
              <span className="inline-flex items-center gap-1">
                <Coins className="h-3 w-3" /> 10 credits
              </span>
              <span>{selectedList.length} source{selectedList.length === 1 ? '' : 's'}</span>
            </div>

            <Button onClick={generate} disabled={!canGenerate} className="w-full gap-1.5">
              {generating
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Drafting…</>
                : <><Sparkles className="h-4 w-4" /> Draft {mode === 'runbook' ? 'runbook' : 'policy'} from findings</>}
            </Button>

            {selectedList.length === 0 && (
              <div className="text-[11px] text-muted-foreground text-center">
                Pick at least one source finding to enable drafting.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent drafts from findings */}
      <Card className="border-border bg-card">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-[hsl(262_60%_70%)]" />
            Recent drafts from findings
          </div>
          <Link
            to="/app/intelligence/policies"
            className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            Edit &amp; export in Policies <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="p-4">
          {draftsLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : drafts.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6">
              No drafts yet — pick findings above and Ray will draft your first one.
            </div>
          ) : (
            <div className="space-y-2">
              {drafts.map(d => {
                const isRun = d.metadata?.kind === 'runbook';
                const refs = d.metadata?.source_refs ?? [];
                return (
                  <div key={d.id} className="rounded-sm border border-border p-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isRun
                        ? <Badge variant="outline" className="text-[10px] bg-[hsl(262_60%_64%/0.10)] text-[hsl(262_60%_82%)] border-[hsl(262_60%_64%/0.35)]"><BookOpen className="h-3 w-3 mr-1" />Runbook</Badge>
                        : <Badge variant="outline" className="text-[10px] bg-[hsl(38_90%_45%/0.10)] text-[hsl(38_90%_70%)] border-[hsl(38_90%_45%/0.35)]"><ClipboardCheck className="h-3 w-3 mr-1" />Policy</Badge>}
                      <Badge variant="outline" className="text-[10px]">{d.status}</Badge>
                      <div className="text-[10px] text-muted-foreground ml-auto">
                        {formatDistanceToNow(new Date(d.created_at), { addSuffix: true })}
                      </div>
                    </div>
                    <div className="mt-1.5 text-sm">{d.title}</div>
                    {d.metadata?.executive_summary && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {d.metadata.executive_summary}
                      </div>
                    )}
                    {refs.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground pr-1">
                          Drawn from
                        </span>
                        {refs.slice(0, 5).map((r, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">
                            {r.kind.replace('_', ' ')} · {r.title.slice(0, 32)}
                          </Badge>
                        ))}
                        {refs.length > 5 && (
                          <span className="text-[10px] text-muted-foreground">+{refs.length - 5}</span>
                        )}
                      </div>
                    )}
                    <div className="mt-2">
                      <Link
                        to="/app/intelligence/policies"
                        className="text-[11px] text-[hsl(262_60%_78%)] hover:underline inline-flex items-center gap-1"
                      >
                        Open in editor <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function SourceIcon({ kind }: { kind: SourceKind }) {
  const map = {
    investigation:  { Icon: ScanSearch,   color: 'text-[hsl(262_60%_75%)]' },
    log_analysis:   { Icon: FileWarning,  color: 'text-[hsl(140_60%_65%)]' },
    code_analysis:  { Icon: Bug,          color: 'text-[hsl(200_70%_70%)]' },
  } as const;
  const { Icon, color } = map[kind];
  return (
    <div className="h-7 w-7 rounded-sm border border-border bg-muted/40 flex items-center justify-center">
      <Icon className={cn('h-3.5 w-3.5', color)} />
    </div>
  );
}

function ModeCard({ value, active, Icon, label, desc }: {
  value: string; active: boolean; Icon: typeof BookOpen; label: string; desc: string;
}) {
  return (
    <Label
      htmlFor={`mode-${value}`}
      className={cn(
        'flex items-start gap-2 rounded-sm border p-2.5 cursor-pointer transition-colors',
        active
          ? 'border-[hsl(262_60%_64%/0.5)] bg-[hsl(262_60%_64%/0.08)]'
          : 'border-border hover:bg-accent/40',
      )}
    >
      <RadioGroupItem id={`mode-${value}`} value={value} className="mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <Icon className="h-3.5 w-3.5" /> {label}
        </div>
        <div className="text-[11px] text-muted-foreground">{desc}</div>
      </div>
    </Label>
  );
}
