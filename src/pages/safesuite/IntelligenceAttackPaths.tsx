/**
 * Intelligence → Attack Paths.
 *
 * Given an investigation or a free-form scenario, Ray reconstructs the
 * plausible attack path (initial access → impact), estimates blast radius,
 * and produces a prioritised remediation plan. Persisted for future review.
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Sparkles, Coins, GitBranch, Brain, Clock, Trash2, Layers, Radar,
  Wrench, Target, ShieldAlert, AlertTriangle, CheckCircle2, HelpCircle,
  User, Laptop, KeyRound, AppWindow, Network, Database, Users,
} from 'lucide-react';

type EntityKind = 'user' | 'device' | 'account' | 'service' | 'app' | 'network' | 'data';
type StepEntity = {
  kind?: EntityKind | string;
  name?: string;
  role?: 'actor' | 'target' | 'pivot' | 'credential' | 'witness' | string;
  why?: string;
};
type AttackStep = {
  phase?: string;
  title?: string;
  detail?: string;
  mitre_id?: string;
  likelihood?: string;
  if_successful?: string;
  entities?: StepEntity[];
};
type BlastRadius = {
  users_affected?: string;
  devices_affected?: string;
  data_at_risk?: string;
  business_impact?: string;
};
type Remediation = {
  priority?: number;
  action?: string;
  phase_addressed?: string;
  owner?: string;
  difficulty?: string;
};
type AttackPath = {
  id: string;
  investigation_id: string | null;
  title: string;
  scenario: string | null;
  status: 'running' | 'complete' | 'failed';
  severity: string | null;
  summary: string | null;
  steps: AttackStep[];
  blast_radius: BlastRadius;
  remediation: Remediation[];
  assumptions: string | null;
  cost_ray_compute: number;
  error: string | null;
  created_at: string;
};

type InvOption = { id: string; label: string; verdict: string | null; created_at: string };

const PHASE_LABEL: Record<string, string> = {
  initial_access: 'Initial access',
  execution: 'Execution',
  persistence: 'Persistence',
  privilege_escalation: 'Privilege escalation',
  defense_evasion: 'Defense evasion',
  credential_access: 'Credential access',
  discovery: 'Discovery',
  lateral_movement: 'Lateral movement',
  collection: 'Collection',
  exfiltration: 'Exfiltration',
  impact: 'Impact',
};

const SEVERITY_STYLE: Record<string, { icon: React.ComponentType<{ className?: string }>; className: string; label: string }> = {
  critical: { icon: ShieldAlert, className: 'bg-red-500/10 text-red-400 border-red-500/30', label: 'Critical' },
  high: { icon: ShieldAlert, className: 'bg-red-500/10 text-red-400 border-red-500/30', label: 'High' },
  medium: { icon: AlertTriangle, className: 'bg-amber-500/10 text-amber-400 border-amber-500/30', label: 'Medium' },
  low: { icon: CheckCircle2, className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', label: 'Low' },
};

function severityBadge(s: string | null) {
  const key = (s ?? '').toLowerCase();
  const style = SEVERITY_STYLE[key] ?? { icon: HelpCircle, className: 'bg-muted text-muted-foreground border-border', label: s ?? 'Unknown' };
  const Icon = style.icon;
  return (
    <Badge variant="outline" className={cn('gap-1.5 rounded-sm', style.className)}>
      <Icon className="h-3.5 w-3.5" />
      {style.label}
    </Badge>
  );
}

export default function IntelligenceAttackPaths() {
  const { user } = useAuth();
  const [invs, setInvs] = useState<InvOption[]>([]);
  const [investigationId, setInvestigationId] = useState<string>('');
  const [scenario, setScenario] = useState('');
  const [loading, setLoading] = useState(false);
  const [paths, setPaths] = useState<AttackPath[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [pathsRes, invsRes] = await Promise.all([
      supabase.from('ray_attack_paths').select('*').order('created_at', { ascending: false }).limit(25),
      supabase.from('ray_investigations')
        .select('id, input_label, input_type, verdict, created_at')
        .eq('status', 'complete')
        .order('created_at', { ascending: false })
        .limit(25),
    ]);
    setPaths((pathsRes.data as AttackPath[] | null) ?? []);
    const opts: InvOption[] = ((invsRes.data as Array<{ id: string; input_label: string | null; input_type: string; verdict: string | null; created_at: string }> | null) ?? []).map(i => ({
      id: i.id,
      label: i.input_label || i.input_type,
      verdict: i.verdict,
      created_at: i.created_at,
    }));
    setInvs(opts);
  }, []);
  useEffect(() => { if (user) load(); }, [user, load]);

  const selected = paths.find(p => p.id === selectedId) ?? paths[0] ?? null;

  async function generate() {
    if (!investigationId && !scenario.trim()) {
      toast.error('Pick an investigation or describe the scenario.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ray-attack-path', {
        body: {
          investigation_id: investigationId || null,
          scenario: scenario.trim() || null,
        },
      });
      if (error) throw error;
      const p = (data as { attack_path?: AttackPath })?.attack_path;
      if (p) {
        setPaths(prev => [p, ...prev.filter(x => x.id !== p.id)]);
        setSelectedId(p.id);
        setScenario('');
        toast.success(`Attack path reconstructed. ${p.cost_ray_compute} Ray Compute used.`);
      } else {
        toast.error('Ray could not reconstruct an attack path.');
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Reconstruction failed.');
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    const { error } = await supabase.from('ray_attack_paths').delete().eq('id', id);
    if (error) { toast.error('Could not delete.'); return; }
    setPaths(prev => prev.filter(p => p.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-[hsl(262_60%_70%)]" /> Wrayth Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold mt-1">Attack Paths</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Ray reasons about how a threat could unfold — initial access to impact — estimates blast radius, and
            hands you a prioritised remediation plan.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 rounded-sm">
          <Coins className="h-3.5 w-3.5" /> 4 Ray Compute / path
        </Badge>
      </div>

      <Card className="p-5 space-y-4">
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Source investigation (optional)</label>
          <select
            value={investigationId}
            onChange={(e) => setInvestigationId(e.target.value)}
            className="mt-2 w-full bg-background border border-border rounded-sm px-3 py-2 text-sm"
          >
            <option value="">— None (use scenario only) —</option>
            {invs.map(i => (
              <option key={i.id} value={i.id}>
                [{i.verdict ?? 'unknown'}] {i.label} · {new Date(i.created_at).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">
            {investigationId ? 'Additional context (optional)' : 'Scenario'}
          </label>
          <Textarea
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            placeholder={investigationId
              ? 'e.g. "The affected user is a domain admin on our M365 tenant."'
              : 'e.g. "A finance user clicked a phishing link and entered M365 credentials. MFA is enforced by policy but with SMS fallback."'}
            className="min-h-[120px] mt-2"
          />
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-muted-foreground">
            Ray only reasons from what you tell him — no invented device names, IPs, or users.
          </p>
          <Button onClick={generate} disabled={loading} className="gap-2 min-h-[40px]">
            {loading ? <><Brain className="h-4 w-4 animate-pulse" /> Ray is reasoning…</>
              : <><GitBranch className="h-4 w-4" /> Reconstruct path (4 RC)</>}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6">
        <div className="min-w-0">
          {selected ? <AttackPathView path={selected} onDelete={() => remove(selected.id)} />
            : <EmptyState />}
        </div>
        <aside className="space-y-3">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Past attack paths</h2>
          {paths.length === 0 && (
            <p className="text-xs text-muted-foreground">Ray hasn't reconstructed any attack paths yet.</p>
          )}
          <div className="space-y-2">
            {paths.map(p => {
              const isSel = (selected?.id ?? null) === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={cn(
                    'w-full text-left rounded-sm border p-3 transition-colors',
                    isSel
                      ? 'border-[hsl(262_60%_64%/0.4)] bg-[hsl(262_60%_64%/0.06)]'
                      : 'border-border hover:border-border/80 bg-card',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {p.steps.length} step{p.steps.length === 1 ? '' : 's'}
                    </span>
                    {severityBadge(p.severity)}
                  </div>
                  <p className="text-sm mt-1 truncate">{p.title}</p>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    {new Date(p.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="p-10 text-center border-dashed">
      <div className="mx-auto h-12 w-12 rounded-full bg-[hsl(262_60%_64%/0.1)] flex items-center justify-center mb-3">
        <GitBranch className="h-6 w-6 text-[hsl(262_60%_70%)]" />
      </div>
      <h3 className="text-base font-medium">Reason about an attack path</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
        Pick a completed investigation, describe a scenario, or both — Ray will walk through how the attack could
        unfold and what would stop it.
      </p>
    </Card>
  );
}

function AttackPathView({ path, onDelete }: { path: AttackPath; onDelete: () => void }) {
  if (path.status === 'failed') {
    return (
      <Card className="p-5 border-red-500/30 bg-red-500/5">
        <p className="text-sm text-red-400">Ray could not reason about this path. {path.error}</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-5 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Attack path</div>
          <div className="text-lg font-semibold mt-0.5 truncate">{path.title}</div>
          {path.summary && <p className="text-sm text-muted-foreground mt-1">{path.summary}</p>}
        </div>
        <div className="flex items-center gap-3">
          {severityBadge(path.severity)}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDelete} aria-label="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="chain" className="w-full">
        <div className="px-5 pt-4 overflow-x-auto">
          <TabsList className="bg-transparent p-0 h-auto gap-1 flex-wrap">
            <PathTab value="chain" label="Attack chain" icon={Layers} count={path.steps.length} />
            <PathTab value="entities" label="Entities" icon={Users} count={countEntities(path.steps)} />
            <PathTab value="blast" label="Blast radius" icon={Radar} />
            <PathTab value="remediation" label="Remediation" icon={Wrench} count={path.remediation.length} />
            <PathTab value="assumptions" label="Assumptions" icon={Target} />
          </TabsList>
        </div>

        <div className="p-5">
          <TabsContent value="chain" className="mt-0">
            {path.steps.length === 0 ? <Empty text="No steps were produced." /> : (
              <ol className="relative border-l border-border pl-6 space-y-4">
                {path.steps.map((s, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[29px] top-1 h-5 w-5 rounded-full bg-[hsl(262_60%_64%/0.15)] border border-[hsl(262_60%_64%/0.4)] flex items-center justify-center text-[10px] text-[hsl(262_60%_75%)]">
                      {i + 1}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{s.title ?? 'Step'}</span>
                      {s.phase && (
                        <Badge variant="outline" className="rounded-sm text-[10px] uppercase tracking-wider">
                          {PHASE_LABEL[s.phase] ?? s.phase}
                        </Badge>
                      )}
                      {s.mitre_id && (
                        <Badge variant="outline" className="rounded-sm font-mono text-[10px]">
                          {s.mitre_id}
                        </Badge>
                      )}
                      {s.likelihood && (
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {s.likelihood} likelihood
                        </span>
                      )}
                    </div>
                    {s.detail && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.detail}</p>}
                    {s.if_successful && (
                      <p className="text-xs text-foreground/80 mt-1 italic">
                        <span className="text-muted-foreground uppercase tracking-wider text-[10px] mr-1">If successful:</span>
                        {s.if_successful}
                      </p>
                    )}
                    {s.entities && s.entities.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {s.entities.map((e, ei) => (
                          <EntityChip key={ei} entity={e} />
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </TabsContent>

          <TabsContent value="entities" className="mt-0">
            <EntitiesView steps={path.steps} />
          </TabsContent>

          <TabsContent value="blast" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <BlastCell label="Users at risk" text={path.blast_radius.users_affected} />
              <BlastCell label="Devices & systems" text={path.blast_radius.devices_affected} />
              <BlastCell label="Data at risk" text={path.blast_radius.data_at_risk} />
              <BlastCell label="Business impact" text={path.blast_radius.business_impact} />
            </div>
          </TabsContent>

          <TabsContent value="remediation" className="mt-0">
            {path.remediation.length === 0 ? <Empty text="No remediation steps produced." /> : (
              <ol className="space-y-2">
                {path.remediation
                  .slice()
                  .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))
                  .map((r, i) => (
                    <li key={i} className="flex items-start gap-3 rounded-sm border border-border p-3">
                      <span className="h-6 w-6 shrink-0 rounded-full bg-[hsl(262_60%_64%/0.12)] text-[hsl(262_60%_75%)] text-xs flex items-center justify-center">
                        {r.priority ?? i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">{r.action}</p>
                        <div className="flex items-center gap-3 mt-1 text-[10px] uppercase tracking-wider text-muted-foreground flex-wrap">
                          {r.phase_addressed && <span>Closes: {PHASE_LABEL[r.phase_addressed] ?? r.phase_addressed}</span>}
                          {r.owner && <span>Owner: {r.owner}</span>}
                          {r.difficulty && <span>Difficulty: {r.difficulty}</span>}
                        </div>
                      </div>
                    </li>
                  ))}
              </ol>
            )}
          </TabsContent>

          <TabsContent value="assumptions" className="mt-0">
            {path.assumptions
              ? <p className="text-sm text-muted-foreground leading-relaxed">{path.assumptions}</p>
              : <Empty text="Ray did not need to assume anything beyond the input." />}
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
}

function PathTab({ value, label, icon: Icon, count }: { value: string; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }) {
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

function BlastCell({ label, text }: { label: string; text?: string }) {
  return (
    <div className="rounded-sm border border-border p-3">
      <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1">{label}</div>
      <p className="text-sm leading-relaxed">{text || <span className="text-muted-foreground italic">Not specified.</span>}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground py-6 text-center">{text}</p>;
}
