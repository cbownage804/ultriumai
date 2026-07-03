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
  Quote, Lightbulb, ChevronDown, ChevronRight,
  Zap, Loader2, Rocket, Timer, ShieldCheck,
} from 'lucide-react';

type EntityKind = 'user' | 'device' | 'account' | 'service' | 'app' | 'network' | 'data';
type StepEntity = {
  kind?: EntityKind | string;
  name?: string;
  role?: 'actor' | 'target' | 'pivot' | 'credential' | 'witness' | string;
  why?: string;
};
type EvidenceItem = {
  source?: 'investigation' | 'scenario' | 'mitre' | 'general_knowledge' | string;
  quote?: string;
  supports?: string;
};
type StepReasoning = {
  why?: string;
  evidence?: EvidenceItem[];
  assumptions?: string[];
  confidence?: 'low' | 'medium' | 'high' | string;
};
type AttackStep = {
  phase?: string;
  title?: string;
  detail?: string;
  mitre_id?: string;
  likelihood?: string;
  if_successful?: string;
  entities?: StepEntity[];
  reasoning?: StepReasoning;
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
                    <ReasoningPanel reasoning={s.reasoning} />
                    <StepRemediation pathId={path.id} stepIndex={i} step={s} />
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

/* ------------------------- entity / relationship view ------------------------ */

const ENTITY_META: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; className: string }> = {
  user:    { icon: User,      label: 'User',    className: 'bg-sky-500/10 text-sky-300 border-sky-500/30' },
  device:  { icon: Laptop,    label: 'Device',  className: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
  account: { icon: KeyRound,  label: 'Account', className: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
  service: { icon: AppWindow, label: 'Service', className: 'bg-violet-500/10 text-violet-300 border-violet-500/30' },
  app:     { icon: AppWindow, label: 'App',     className: 'bg-violet-500/10 text-violet-300 border-violet-500/30' },
  network: { icon: Network,   label: 'Network', className: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' },
  data:    { icon: Database,  label: 'Data',    className: 'bg-rose-500/10 text-rose-300 border-rose-500/30' },
};

const ROLE_LABEL: Record<string, string> = {
  actor: 'Actor',
  target: 'Target',
  pivot: 'Pivot',
  credential: 'Credential',
  witness: 'Witness',
};

function entityMeta(kind?: string) {
  return ENTITY_META[(kind ?? '').toLowerCase()] ?? {
    icon: HelpCircle, label: kind || 'Entity',
    className: 'bg-muted text-muted-foreground border-border',
  };
}

function countEntities(steps: AttackStep[]): number {
  const set = new Set<string>();
  for (const s of steps) for (const e of s.entities ?? []) {
    if (e?.name) set.add(`${(e.kind ?? '').toLowerCase()}::${e.name.toLowerCase()}`);
  }
  return set.size;
}

function EntityChip({ entity }: { entity: StepEntity }) {
  const meta = entityMeta(entity.kind);
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 text-[11px]',
        meta.className,
      )}
      title={entity.why}
    >
      <Icon className="h-3 w-3" />
      <span className="font-medium truncate max-w-[16rem]">{entity.name || meta.label}</span>
      {entity.role && (
        <span className="text-[9px] uppercase tracking-wider opacity-70">
          · {ROLE_LABEL[entity.role] ?? entity.role}
        </span>
      )}
    </span>
  );
}

type EntityAgg = {
  key: string;
  kind: string;
  name: string;
  steps: { index: number; role?: string; why?: string; stepTitle?: string; phase?: string }[];
};

function aggregateEntities(steps: AttackStep[]): EntityAgg[] {
  const map = new Map<string, EntityAgg>();
  steps.forEach((s, i) => {
    for (const e of s.entities ?? []) {
      if (!e?.name) continue;
      const kind = (e.kind ?? 'unknown').toLowerCase();
      const key = `${kind}::${e.name.toLowerCase()}`;
      let agg = map.get(key);
      if (!agg) {
        agg = { key, kind, name: e.name, steps: [] };
        map.set(key, agg);
      }
      agg.steps.push({
        index: i + 1,
        role: e.role,
        why: e.why,
        stepTitle: s.title,
        phase: s.phase,
      });
    }
  });
  return Array.from(map.values()).sort((a, b) => b.steps.length - a.steps.length);
}

function EntitiesView({ steps }: { steps: AttackStep[] }) {
  const entities = aggregateEntities(steps);
  if (entities.length === 0) {
    return (
      <Empty text="Ray did not identify specific users, devices, or accounts in this path. Feed him an investigation with real identifiers to see relationships." />
    );
  }

  // Group by kind for the left-side summary.
  const byKind = entities.reduce<Record<string, EntityAgg[]>>((acc, e) => {
    (acc[e.kind] ??= []).push(e);
    return acc;
  }, {});
  const kindOrder = ['user', 'device', 'account', 'service', 'app', 'network', 'data'];
  const orderedKinds = [
    ...kindOrder.filter(k => byKind[k]),
    ...Object.keys(byKind).filter(k => !kindOrder.includes(k)),
  ];

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">
        Every user, device, account, and system Ray tied to at least one step in this attack path — with the
        role they played and which step numbers they appear in.
      </p>

      {/* Kind summary strip */}
      <div className="flex flex-wrap gap-2">
        {orderedKinds.map((k) => {
          const meta = entityMeta(k);
          const Icon = meta.icon;
          return (
            <span
              key={k}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[11px]',
                meta.className,
              )}
            >
              <Icon className="h-3 w-3" />
              {meta.label}
              <span className="opacity-70">· {byKind[k].length}</span>
            </span>
          );
        })}
      </div>

      {/* Per-entity relationship rows */}
      <ul className="space-y-2">
        {entities.map((e) => {
          const meta = entityMeta(e.kind);
          const Icon = meta.icon;
          return (
            <li key={e.key} className="rounded-sm border border-border p-3">
              <div className="flex items-start gap-3">
                <div className={cn(
                  'h-8 w-8 shrink-0 rounded-sm border flex items-center justify-center',
                  meta.className,
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">{e.name}</span>
                    <Badge variant="outline" className="rounded-sm text-[10px] uppercase tracking-wider">
                      {meta.label}
                    </Badge>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {e.steps.length} step{e.steps.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1.5">
                    {e.steps.map((s, si) => (
                      <div key={si} className="flex items-start gap-2 text-xs">
                        <span className="h-4 w-4 shrink-0 rounded-full bg-[hsl(262_60%_64%/0.15)] border border-[hsl(262_60%_64%/0.4)] flex items-center justify-center text-[9px] text-[hsl(262_60%_75%)]">
                          {s.index}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {s.stepTitle && (
                              <span className="text-foreground/90">{s.stepTitle}</span>
                            )}
                            {s.phase && (
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                {PHASE_LABEL[s.phase] ?? s.phase}
                              </span>
                            )}
                            {s.role && (
                              <Badge variant="outline" className="rounded-sm text-[9px] uppercase tracking-wider">
                                {ROLE_LABEL[s.role] ?? s.role}
                              </Badge>
                            )}
                          </div>
                          {s.why && (
                            <p className="text-muted-foreground mt-0.5">{s.why}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------------------- "Why Ray thinks this" panel ---------------------- */

const SOURCE_META: Record<string, { label: string; className: string }> = {
  investigation:     { label: 'Investigation', className: 'bg-sky-500/10 text-sky-300 border-sky-500/30' },
  scenario:          { label: 'Scenario',      className: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
  mitre:             { label: 'MITRE ATT&CK',  className: 'bg-violet-500/10 text-violet-300 border-violet-500/30' },
  general_knowledge: { label: 'Known pattern', className: 'bg-muted text-muted-foreground border-border' },
};

const CONFIDENCE_STYLE: Record<string, string> = {
  low:    'bg-amber-500/10 text-amber-300 border-amber-500/30',
  medium: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  high:   'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
};

function ReasoningPanel({ reasoning }: { reasoning?: StepReasoning }) {
  if (!reasoning) return null;
  const { why, evidence = [], assumptions = [], confidence } = reasoning;
  const hasContent = Boolean(why) || evidence.length > 0 || assumptions.length > 0;
  if (!hasContent) return null;

  return (
    <details className="group mt-3 rounded-sm border border-[hsl(262_60%_64%/0.25)] bg-[hsl(262_60%_64%/0.04)] open:bg-[hsl(262_60%_64%/0.06)]">
      <summary className="list-none cursor-pointer select-none px-3 py-2 flex items-center gap-2 text-[11px] uppercase tracking-wider text-[hsl(262_60%_75%)]">
        <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:hidden" />
        <ChevronDown className="h-3.5 w-3.5 transition-transform hidden group-open:block" />
        <Brain className="h-3.5 w-3.5" />
        <span>Why Ray thinks this</span>
        {confidence && (
          <span className={cn(
            'ml-auto rounded-sm border px-1.5 py-0.5 text-[9px] normal-case tracking-normal',
            CONFIDENCE_STYLE[confidence.toLowerCase()] ?? 'bg-muted text-muted-foreground border-border',
          )}>
            {confidence} confidence
          </span>
        )}
      </summary>

      <div className="px-3 pb-3 space-y-3">
        {why && (
          <p className="text-xs text-foreground/90 leading-relaxed">{why}</p>
        )}

        {evidence.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <Quote className="h-3 w-3" /> Evidence
            </div>
            <ul className="space-y-1.5">
              {evidence.map((ev, i) => {
                const meta = SOURCE_META[(ev.source ?? '').toLowerCase()] ?? {
                  label: ev.source ?? 'Source',
                  className: 'bg-muted text-muted-foreground border-border',
                };
                return (
                  <li key={i} className="rounded-sm border border-border/60 bg-background/40 p-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        'inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[9px] uppercase tracking-wider',
                        meta.className,
                      )}>
                        {meta.label}
                      </span>
                      {ev.supports && (
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Supports: {ev.supports}
                        </span>
                      )}
                    </div>
                    {ev.quote && (
                      <p className="text-xs text-foreground/85 mt-1 italic leading-relaxed border-l-2 border-border pl-2">
                        "{ev.quote}"
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {assumptions.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <Lightbulb className="h-3 w-3" /> Assumptions
            </div>
            <ul className="space-y-1">
              {assumptions.map((a, i) => (
                <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                  <span className="text-muted-foreground mt-0.5">•</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </details>
  );
}

/* --------------------- one-click per-step remediation --------------------- */

type StepAction = {
  priority?: number;
  title?: string;
  detail?: string;
  owner?: 'user' | 'it' | 'soc' | 'leadership' | string;
  difficulty?: 'low' | 'medium' | 'high' | string;
  effort?: 'minutes' | 'hours' | 'days' | string;
  kind?: 'preventative' | 'detective' | 'corrective' | 'compensating' | string;
  closes?: string;
  targets?: string[];
  verification?: string;
};

type StepPlan = {
  summary?: string | null;
  actions?: StepAction[];
  quick_wins?: string[];
  long_term?: string[];
  cost_credits?: number;
};

const KIND_STYLE: Record<string, string> = {
  preventative: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  detective:    'bg-sky-500/10 text-sky-300 border-sky-500/30',
  corrective:   'bg-amber-500/10 text-amber-300 border-amber-500/30',
  compensating: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
};

const DIFFICULTY_STYLE: Record<string, string> = {
  low:    'text-emerald-300',
  medium: 'text-amber-300',
  high:   'text-red-300',
};

function StepRemediation({ pathId, stepIndex, step }: { pathId: string; stepIndex: number; step: AttackStep }) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<StepPlan | null>(null);

  async function planIt() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ray-step-remediation', {
        body: { attack_path_id: pathId, step_index: stepIndex },
      });
      if (error) throw error;
      const p = (data as { plan?: StepPlan })?.plan ?? null;
      if (!p) throw new Error('No plan returned.');
      setPlan(p);
      toast.success(`Remediation plan ready. ${p.cost_credits ?? 2} Credits used.`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Ray could not plan this step.');
    } finally {
      setLoading(false);
    }
  }

  if (!plan) {
    return (
      <div className="mt-3">
        <Button
          onClick={planIt}
          disabled={loading}
          size="sm"
          variant="outline"
          className="h-8 gap-2 text-xs border-[hsl(262_60%_64%/0.4)] text-[hsl(262_60%_80%)] hover:bg-[hsl(262_60%_64%/0.08)]"
        >
          {loading
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Ray is planning…</>
            : <><Zap className="h-3.5 w-3.5" /> Plan remediation for this step
                <span className="text-[10px] text-muted-foreground ml-1">2 Credits</span></>}
        </Button>
      </div>
    );
  }

  const actions = (plan.actions ?? []).slice().sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));

  return (
    <div className="mt-3 rounded-sm border border-[hsl(262_60%_64%/0.4)] bg-[hsl(262_60%_64%/0.05)] p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[hsl(262_60%_75%)]">
          <Rocket className="h-3.5 w-3.5" /> Remediation plan for step {stepIndex + 1}
        </div>
        <Button
          onClick={planIt}
          disabled={loading}
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Re-plan'}
        </Button>
      </div>

      {plan.summary && (
        <p className="text-xs text-foreground/90 leading-relaxed">{plan.summary}</p>
      )}

      {(plan.quick_wins?.length ?? 0) > 0 && (
        <div className="flex items-start gap-2 text-xs">
          <Timer className="h-3.5 w-3.5 text-emerald-300 mt-0.5 shrink-0" />
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-2">Do today</span>
            <span className="text-foreground/85">{plan.quick_wins!.join(' · ')}</span>
          </div>
        </div>
      )}

      {actions.length === 0 ? (
        <Empty text="No actions produced." />
      ) : (
        <ol className="space-y-2">
          {actions.map((a, i) => (
            <li key={i} className="flex items-start gap-2 rounded-sm border border-border/60 bg-background/40 p-2.5">
              <span className="h-6 w-6 shrink-0 rounded-full bg-[hsl(262_60%_64%/0.15)] text-[hsl(262_60%_75%)] text-xs flex items-center justify-center">
                {a.priority ?? i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{a.title ?? 'Action'}</span>
                  {a.kind && (
                    <Badge variant="outline" className={cn(
                      'rounded-sm text-[9px] uppercase tracking-wider',
                      KIND_STYLE[a.kind.toLowerCase()] ?? '',
                    )}>
                      {a.kind}
                    </Badge>
                  )}
                  {a.owner && (
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Owner: {a.owner}
                    </span>
                  )}
                  {a.difficulty && (
                    <span className={cn(
                      'text-[10px] uppercase tracking-wider',
                      DIFFICULTY_STYLE[a.difficulty.toLowerCase()] ?? 'text-muted-foreground',
                    )}>
                      {a.difficulty} effort
                    </span>
                  )}
                  {a.effort && (
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      ~{a.effort}
                    </span>
                  )}
                </div>
                {a.detail && (
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{a.detail}</p>
                )}
                {a.targets && a.targets.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {a.targets.map((t, ti) => (
                      <span
                        key={ti}
                        className="inline-flex items-center gap-1 rounded-sm border border-border bg-muted/30 px-1.5 py-0.5 text-[10px] text-foreground/80"
                      >
                        <Target className="h-2.5 w-2.5" /> {t}
                      </span>
                    ))}
                  </div>
                )}
                {a.closes && (
                  <p className="text-[11px] text-foreground/75 mt-1">
                    <span className="text-muted-foreground uppercase tracking-wider text-[9px] mr-1">Closes:</span>
                    {a.closes}
                  </p>
                )}
                {a.verification && (
                  <p className="text-[11px] text-foreground/75 mt-0.5 flex items-start gap-1">
                    <ShieldCheck className="h-3 w-3 text-emerald-300 mt-0.5 shrink-0" />
                    <span>
                      <span className="text-muted-foreground uppercase tracking-wider text-[9px] mr-1">Verify:</span>
                      {a.verification}
                    </span>
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      {(plan.long_term?.length ?? 0) > 0 && (
        <div className="flex items-start gap-2 text-xs pt-1 border-t border-border/60">
          <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-2">Long-term</span>
            <span className="text-foreground/80">{plan.long_term!.join(' · ')}</span>
          </div>
        </div>
      )}

      {/* Reference — silences unused import warning on step in future refactors */}
      <span className="hidden">{step?.phase}</span>
    </div>
  );
}
