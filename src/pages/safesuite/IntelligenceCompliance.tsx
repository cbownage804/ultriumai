/**
 * Intelligence → Compliance Gap Analysis (v0.6, Sprint E).
 *
 * User picks a target framework (CIS, NIST, ISO 27001, SOC 2, HIPAA, etc.),
 * describes their organization, and Ray produces a scored gap analysis:
 * per-domain posture, prioritized gaps, and a 30/60/90 remediation roadmap.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  ShieldCheck, Sparkles, Coins, Loader2, Trash2, Target,
  TrendingUp, AlertTriangle, CheckCircle2, Calendar,
} from 'lucide-react';

type Domain = { id?: string; name?: string; score?: number; status?: string; why?: string };
type Gap = { control?: string; domain?: string; gap?: string; severity?: string; effort?: string; remediation?: string };
type Win = { control?: string; why?: string };
type RoadmapPhase = { phase?: string; actions?: string[] };

type ScanRow = {
  id: string;
  framework: string;
  scope: string | null;
  organization_context: string | null;
  status: 'running' | 'complete' | 'failed';
  overall_score: number | null;
  posture: string | null;
  totals: { controls_total?: number; controls_met?: number; controls_partial?: number; controls_missing?: number };
  domains: Domain[];
  gaps: Gap[];
  wins: Win[];
  roadmap: RoadmapPhase[];
  executive_summary: string | null;
  compute_credits: number;
  error: string | null;
  created_at: string;
};

const FRAMEWORKS = [
  'CIS v8', 'NIST CSF 2.0', 'NIST 800-53', 'ISO 27001',
  'SOC 2', 'HIPAA', 'PCI DSS', 'GDPR', 'Essential Eight',
];

const COST = 15;

const SEVERITY_COLOR: Record<string, string> = {
  critical: 'text-[hsl(0_80%_65%)] border-[hsl(0_80%_50%/0.4)] bg-[hsl(0_80%_50%/0.06)]',
  high:     'text-[hsl(20_80%_65%)] border-[hsl(20_80%_50%/0.4)] bg-[hsl(20_80%_50%/0.06)]',
  medium:   'text-[hsl(38_90%_65%)] border-[hsl(38_90%_50%/0.4)] bg-[hsl(38_90%_50%/0.06)]',
  low:      'text-[hsl(140_60%_65%)] border-[hsl(140_60%_50%/0.4)] bg-[hsl(140_60%_50%/0.06)]',
};

const POSTURE_COLOR: Record<string, string> = {
  critical:   'text-[hsl(0_80%_70%)]',
  weak:       'text-[hsl(20_80%_70%)]',
  developing: 'text-[hsl(38_90%_70%)]',
  strong:     'text-[hsl(140_60%_70%)]',
  mature:     'text-[hsl(160_70%_65%)]',
};

export default function IntelligenceCompliance() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [scans, setScans] = useState<ScanRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [framework, setFramework] = useState('CIS v8');
  const [scope, setScope] = useState('');
  const [context, setContext] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from('ray_compliance_scans')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(25);
    setScans((data as ScanRow[] | null) ?? []);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const selected = useMemo(
    () => scans.find(s => s.id === selectedId) ?? scans[0] ?? null,
    [scans, selectedId],
  );

  async function run() {
    if (context.trim().length < 40) {
      toast.error('Give Ray a bit more organization context (at least a sentence or two).');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ray-compliance-scan', {
        body: { framework, scope: scope || undefined, organization_context: context },
      });
      if (error) throw error;
      const s = (data as { scan?: ScanRow })?.scan;
      if (s) {
        setScans(prev => [s, ...prev.filter(x => x.id !== s.id)]);
        setSelectedId(s.id);
        toast.success(`Gap analysis complete. ${s.compute_credits} Ray Compute used.`);
      } else {
        toast.error('Ray could not complete that scan.');
      }
    } catch (e) {
      toast.error((e as Error).message || 'Compliance scan failed.');
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    await (supabase as any).from('ray_compliance_scans').delete().eq('id', id);
    setScans(prev => prev.filter(s => s.id !== id));
    if (selectedId === id) setSelectedId(null);
    toast.success('Scan deleted.');
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          Ray Intelligence · Compliance
        </div>
        <h1 className="text-2xl font-semibold mt-1 flex items-center gap-2">
          Compliance Gap Analysis
          <Sparkles className="h-5 w-5 text-[hsl(262_60%_70%)]" />
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
          Ray scores your posture against a real framework, identifies concrete gaps, and returns a
          30/60/90 remediation roadmap you can hand to your team.
        </p>
      </div>

      <div className="grid lg:grid-cols-[380px_1fr] gap-6">
        {/* Form + history */}
        <div className="space-y-4">
          <Card className="border-border bg-card">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label>Target framework</Label>
                <Select value={framework} onValueChange={setFramework}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FRAMEWORKS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scope">Scope (optional)</Label>
                <Input
                  id="scope" value={scope} onChange={e => setScope(e.target.value)}
                  placeholder="e.g. Production SaaS environment"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ctx">
                  Organization context
                  <span className="text-muted-foreground font-normal ml-1">(size, industry, systems, current controls)</span>
                </Label>
                <Textarea
                  id="ctx" value={context} onChange={e => setContext(e.target.value)}
                  placeholder="40-person healthcare SaaS on AWS. We use Google Workspace, MFA everywhere except one legacy admin, Microsoft Defender on endpoints, no formal IR plan, backups nightly to S3, no penetration testing yet…"
                  rows={8} className="text-sm"
                />
                <div className="text-[10px] text-muted-foreground text-right">
                  {context.length} / 6000
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                  <Coins className="h-3 w-3" /> {COST} Ray Compute
                </div>
                <Button onClick={run} disabled={loading} className="gap-2 rounded-sm">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Run gap analysis
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground px-1 pb-2">
                Recent scans
              </div>
              {scans.length === 0 ? (
                <p className="text-xs text-muted-foreground px-1 py-3">No scans yet.</p>
              ) : (
                <div className="space-y-1">
                  {scans.map(s => {
                    const active = (selected?.id ?? '') === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelectedId(s.id)}
                        className={cn(
                          'w-full text-left px-2 py-2 rounded-sm text-sm transition-colors',
                          active ? 'bg-[hsl(262_60%_64%/0.1)] text-foreground' : 'hover:bg-accent text-muted-foreground',
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate">{s.framework}</span>
                          {typeof s.overall_score === 'number' ? (
                            <Badge variant="outline" className="text-[10px] border-border shrink-0">
                              {s.overall_score}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] border-border shrink-0 uppercase tracking-wider">
                              {s.status}
                            </Badge>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Report */}
        <div>
          {!selected ? (
            <Card className="border-border bg-card">
              <CardContent className="p-10 text-center space-y-2">
                <Target className="h-8 w-8 text-muted-foreground mx-auto" />
                <div className="text-sm text-muted-foreground">
                  Pick a framework and describe your environment. Ray will score your posture and produce a prioritized remediation plan.
                </div>
              </CardContent>
            </Card>
          ) : selected.status === 'running' ? (
            <Card className="border-border bg-card">
              <CardContent className="p-10 text-center space-y-2">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-[hsl(262_60%_70%)]" />
                <div className="text-sm">Analyzing posture&hellip;</div>
              </CardContent>
            </Card>
          ) : selected.status === 'failed' ? (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardContent className="p-6">
                <div className="text-sm text-destructive">{selected.error || 'Scan failed.'}</div>
              </CardContent>
            </Card>
          ) : (
            <ComplianceReport scan={selected} onDelete={() => remove(selected.id)} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Report ─────────────────────────────────────────────────────────────────

function ComplianceReport({ scan, onDelete }: { scan: ScanRow; onDelete: () => void }) {
  const posture = scan.posture ?? 'developing';
  const postureCls = POSTURE_COLOR[posture] ?? POSTURE_COLOR.developing;

  const gapsBySeverity = useMemo(() => {
    const order = ['critical', 'high', 'medium', 'low'];
    return [...scan.gaps].sort((a, b) => {
      const ai = order.indexOf((a.severity ?? '').toLowerCase());
      const bi = order.indexOf((b.severity ?? '').toLowerCase());
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [scan.gaps]);

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-border/60">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              {scan.framework}{scan.scope ? ` · ${scan.scope}` : ''}
            </div>
            <h2 className="text-xl font-semibold mt-0.5">Gap analysis</h2>
            {scan.executive_summary && (
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                {scan.executive_summary}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <ScoreDial score={scan.overall_score ?? 0} />
            <div className="text-right">
              <div className={cn('text-sm font-medium uppercase tracking-[0.2em]', postureCls)}>
                {posture}
              </div>
              <div className="text-[11px] text-muted-foreground">Posture</div>
              <Button
                variant="ghost" size="icon" onClick={onDelete}
                className="rounded-sm text-muted-foreground hover:text-destructive mt-1"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Totals */}
        {scan.totals && (scan.totals.controls_total ?? 0) > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Stat label="Controls" value={scan.totals.controls_total ?? 0} />
            <Stat label="Met"      value={scan.totals.controls_met ?? 0}     tone="strong" />
            <Stat label="Partial"  value={scan.totals.controls_partial ?? 0} tone="warn" />
            <Stat label="Missing"  value={scan.totals.controls_missing ?? 0} tone="danger" />
          </div>
        )}

        {/* Domain scores */}
        {scan.domains.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs uppercase tracking-[0.22em] text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> Domain posture
            </h3>
            <div className="space-y-2">
              {scan.domains.map((d, i) => {
                const score = typeof d.score === 'number' ? Math.max(0, Math.min(100, d.score)) : 0;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{d.name}</span>
                      <span className="text-muted-foreground tabular-nums">{score}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[hsl(262_60%_60%)] to-[hsl(200_70%_60%)]"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    {d.why && (
                      <div className="text-[11px] text-muted-foreground">{d.why}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Wins */}
        {scan.wins.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-xs uppercase tracking-[0.22em] text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(140_60%_65%)]" /> What you already do well
            </h3>
            <div className="space-y-1">
              {scan.wins.map((w, i) => (
                <div key={i} className="text-sm">
                  <span className="font-medium">{w.control}: </span>
                  <span className="text-muted-foreground">{w.why}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Gaps */}
        {gapsBySeverity.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-xs uppercase tracking-[0.22em] text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-[hsl(20_80%_65%)]" /> Prioritized gaps
            </h3>
            <div className="space-y-2">
              {gapsBySeverity.map((g, i) => {
                const sev = (g.severity ?? 'medium').toLowerCase();
                const cls = SEVERITY_COLOR[sev] ?? SEVERITY_COLOR.medium;
                return (
                  <div key={i} className={cn('rounded-sm border p-3', cls)}>
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="text-sm font-medium">
                        {g.control}
                        {g.domain && <span className="text-muted-foreground font-normal"> · {g.domain}</span>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-current">
                          {sev}
                        </Badge>
                        {g.effort && (
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-border text-muted-foreground">
                            {g.effort} effort
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-foreground/90">{g.gap}</div>
                    {g.remediation && (
                      <div className="text-xs text-muted-foreground mt-1.5">
                        <span className="uppercase tracking-wider mr-1.5">Fix</span>
                        {g.remediation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Roadmap */}
        {scan.roadmap.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-xs uppercase tracking-[0.22em] text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Remediation roadmap
            </h3>
            <div className="grid sm:grid-cols-3 gap-2">
              {scan.roadmap.map((r, i) => (
                <div key={i} className="rounded-sm border border-border bg-muted/30 p-3">
                  <div className="text-xs uppercase tracking-wider text-[hsl(262_60%_70%)] mb-2">
                    {r.phase}
                  </div>
                  <ul className="space-y-1 text-sm">
                    {(r.actions ?? []).map((a, j) => (
                      <li key={j} className="flex gap-2">
                        <span className="text-muted-foreground mt-0.5">•</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'strong' | 'warn' | 'danger' }) {
  const toneCls = tone === 'strong' ? 'text-[hsl(140_60%_70%)]'
    : tone === 'warn' ? 'text-[hsl(38_90%_70%)]'
    : tone === 'danger' ? 'text-[hsl(0_80%_70%)]'
    : 'text-foreground';
  return (
    <div className="rounded-sm border border-border bg-muted/30 p-3">
      <div className={cn('text-lg font-semibold tabular-nums', toneCls)}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function ScoreDial({ score }: { score: number }) {
  const size = 72;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const dash = c * (pct / 100);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--muted))" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="hsl(262 60% 65%)" strokeWidth={stroke} fill="none"
          strokeDasharray={`${dash} ${c}`} strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-semibold tabular-nums">{pct}</span>
      </div>
    </div>
  );
}
