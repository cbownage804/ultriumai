/**
 * OrgDashboard — Ray's briefing for an entire organization.
 *
 * Wrayth 4.2 — the CEO/admin's morning view. One scroll, 60 seconds,
 * and they know: current risk, what changed, what matters, what's next.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, ArrowUp, ArrowDown, Minus, Shield, Users, Monitor, Eye,
  AlertTriangle, ClipboardCheck, GraduationCap, Package, Globe,
  Sparkles, ChevronRight, RefreshCw,
} from 'lucide-react';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  fetchLatestHealth, fetchProfiles, fetchMissions, fetchTimeline,
  fetchTodayBriefing, fetchDepartmentScores,
  triggerOrgSync, triggerOrgBrief, describeTopPriority,
  type RayOrgHealth, type RayOrgProfile, type RayOrgMission,
  type RayOrgTimelineEvent, type RayOrgBriefing, type RayOrgDepartmentScore,
} from '@/lib/ray/org';

const HEALTH_AREAS: Array<{ key: keyof RayOrgHealth; label: string; icon: any }> = [
  { key: 'identity_score',   label: 'Identities',  icon: Users },
  { key: 'device_score',     label: 'Devices',     icon: Monitor },
  { key: 'threat_score',     label: 'Threats',     icon: AlertTriangle },
  { key: 'exposure_score',   label: 'Exposure',    icon: Eye },
  { key: 'compliance_score', label: 'Compliance',  icon: ClipboardCheck },
  { key: 'training_score',   label: 'Training',    icon: GraduationCap },
  { key: 'software_score',   label: 'Software',    icon: Package },
  { key: 'domain_score',     label: 'Domains',     icon: Globe },
];

function scoreTone(s: number) {
  if (s >= 90) return 'text-green-400';
  if (s >= 75) return 'text-violet-300';
  if (s >= 60) return 'text-yellow-400';
  return 'text-red-400';
}

function DeltaPill({ delta }: { delta: number }) {
  if (delta === 0) return <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Minus className="h-3 w-3" /> no change</span>;
  if (delta > 0) return <span className="inline-flex items-center gap-1 text-xs text-green-400"><ArrowUp className="h-3 w-3" /> +{delta}</span>;
  return <span className="inline-flex items-center gap-1 text-xs text-red-400"><ArrowDown className="h-3 w-3" /> {delta}</span>;
}

export default function OrgDashboard() {
  const { activeOrg, loading: orgLoading } = useActiveOrg();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [briefing, setBriefing] = useState<RayOrgBriefing | null>(null);
  const [health, setHealth] = useState<RayOrgHealth | null>(null);
  const [profiles, setProfiles] = useState<RayOrgProfile[]>([]);
  const [missions, setMissions] = useState<RayOrgMission[]>([]);
  const [timeline, setTimeline] = useState<RayOrgTimelineEvent[]>([]);
  const [departments, setDepartments] = useState<RayOrgDepartmentScore[]>([]);

  async function loadAll(orgId: string) {
    setLoading(true);
    const [b, h, p, m, t, d] = await Promise.all([
      fetchTodayBriefing(orgId),
      fetchLatestHealth(orgId),
      fetchProfiles(orgId),
      fetchMissions(orgId),
      fetchTimeline(orgId, 20),
      fetchDepartmentScores(orgId),
    ]);
    setBriefing(b);
    setHealth(h);
    setProfiles(p);
    setMissions(m);
    setTimeline(t);
    setDepartments(d);
    setLoading(false);
  }

  useEffect(() => {
    if (!activeOrg) return;
    loadAll(activeOrg.id);
  }, [activeOrg?.id]);

  async function handleRefresh() {
    if (!activeOrg) return;
    setRefreshing(true);
    try {
      await triggerOrgSync(activeOrg.id);
      await triggerOrgBrief(activeOrg.id, true);
      await loadAll(activeOrg.id);
      toast({ title: 'Ray re-checked your organization.' });
    } catch (e) {
      toast({ title: 'Ray could not refresh', description: String((e as Error).message), variant: 'destructive' });
    } finally {
      setRefreshing(false);
    }
  }

  if (orgLoading) {
    return <div className="p-6"><Skeleton className="h-40 w-full" /></div>;
  }

  if (!activeOrg) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center">
        <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <h2 className="text-xl font-light tracking-wide text-foreground">No organization yet</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Ray's organization view appears once you create or join an organization. You can keep using your personal dashboard in the meantime.
        </p>
        <Link to="/app/settings"><Button className="mt-4" variant="outline">Create organization</Button></Link>
      </div>
    );
  }

  const overall = health?.overall_score ?? 0;
  const delta = health?.score_delta ?? 0;
  const stats = (health?.stats ?? {}) as Record<string, number>;
  const topPriority = describeTopPriority(profiles);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Hero — Ray's executive brief */}
      <Card className="p-6 md:p-8 bg-card border-border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-violet-300/80 mb-3">
              <Sparkles className="h-3 w-3" /> Ray's organization brief · {activeOrg.name}
            </div>
            {briefing ? (
              <>
                <p className="text-lg md:text-xl text-foreground leading-relaxed">
                  {briefing.greeting && <span className="block text-foreground/90 mb-2">{briefing.greeting}</span>}
                  <span className="text-foreground/80">{briefing.summary}</span>
                </p>
                {briefing.recommendation && (
                  <p className="text-sm text-muted-foreground mt-4 italic">{briefing.recommendation}</p>
                )}
              </>
            ) : loading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <p className="text-foreground/80">
                I haven't put together a brief for {activeOrg.name} yet. Ask me to check the organization and I'll have one in a moment.
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Org Score</div>
            <div className={cn('text-5xl font-extralight leading-none', scoreTone(overall))}>{overall}</div>
            <div className="mt-2"><DeltaPill delta={delta} /></div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline" className="gap-2 rounded-sm">
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            Ask Ray to check again
          </Button>
          <Link to="/app/timeline"><Button variant="ghost" className="rounded-sm">View company timeline</Button></Link>
        </div>
      </Card>

      {/* Top priority callout */}
      {topPriority && (
        <Card className="p-4 border-violet-500/30 bg-[hsl(262_60%_64%/0.04)]">
          <div className="text-xs uppercase tracking-widest text-violet-300/80 mb-1">Today, I'd start here</div>
          <p className="text-sm text-foreground/90">{topPriority}</p>
        </Card>
      )}

      {/* Organization Health grid */}
      <section>
        <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">Organization Health</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {HEALTH_AREAS.map(({ key, label, icon: Icon }) => {
            const v = (health?.[key] as number) ?? 0;
            const note = (health?.ray_notes as Record<string, string> | undefined)?.[label.toLowerCase().replace(/s$/, '')];
            return (
              <Card key={key as string} className="p-4 bg-card border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Icon className="h-3.5 w-3.5" /> {label}
                </div>
                <div className={cn('text-2xl font-light', scoreTone(v))}>{v}</div>
                {note && <div className="text-xs text-muted-foreground mt-2 line-clamp-2">{note}</div>}
              </Card>
            );
          })}
        </div>
      </section>

      {/* Employee intelligence */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Employee intelligence</h2>
          <span className="text-xs text-muted-foreground">{profiles.length} employees · ordered by Ray's priority</span>
        </div>
        <div className="space-y-2">
          {profiles.slice(0, 10).map((p) => (
            <Card key={p.id} className="p-4 bg-card border-border hover:border-border/80 transition-colors">
              <div className="flex items-start gap-4">
                <div className={cn('text-2xl font-light tabular-nums w-12 text-right', scoreTone(p.score))}>{p.score}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-foreground font-medium">{p.display_name}</span>
                    {p.mfa_enabled
                      ? <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-400">MFA on</Badge>
                      : <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400">No MFA</Badge>}
                    {p.breach_count > 0 && <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400">{p.breach_count} breached</Badge>}
                    {p.department && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.department}</span>}
                  </div>
                  {p.ray_note && <div className="text-xs text-muted-foreground mt-1.5">Ray says: {p.ray_note}</div>}
                </div>
              </div>
            </Card>
          ))}
          {!loading && profiles.length === 0 && (
            <Card className="p-6 text-sm text-muted-foreground text-center bg-card border-border">
              No employee signals yet. Ask Ray to check the organization.
            </Card>
          )}
        </div>
      </section>

      {/* Missions + Timeline two-col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">Company missions</h2>
          <div className="space-y-2">
            {missions.length === 0 && (
              <Card className="p-4 bg-card border-border text-sm text-muted-foreground">
                No active missions. Ray creates these as patterns emerge.
              </Card>
            )}
            {missions.map((m) => (
              <Card key={m.id} className="p-4 bg-card border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-foreground">{m.title}</div>
                  <div className="text-xs text-muted-foreground">{m.progress} / {m.target || '?'}</div>
                </div>
                <Progress value={m.target > 0 ? (m.progress / m.target) * 100 : 0} className="h-1.5" />
                {m.est_minutes_remaining != null && (
                  <div className="text-[11px] text-muted-foreground mt-2">
                    Ray estimates ~{m.est_minutes_remaining} minutes remaining.
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">Company timeline</h2>
          <Card className="p-4 bg-card border-border">
            {timeline.length === 0 ? (
              <div className="text-sm text-muted-foreground">No events yet today.</div>
            ) : (
              <ul className="space-y-2">
                {timeline.map((ev) => (
                  <li key={ev.id} className="flex items-start gap-3 text-sm">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-16 shrink-0 pt-0.5">
                      {new Date(ev.occurred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-foreground/80">{ev.summary}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      </div>

      {/* Risk heat map */}
      <section>
        <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">Risk heat map</h2>
        <Card className="p-5 bg-card border-border">
          {departments.length === 0 ? (
            <div className="text-sm text-muted-foreground">Add departments to employees to unlock the heat map.</div>
          ) : (
            <div className="space-y-3">
              {departments.map((d) => (
                <div key={d.id} title={d.ray_reason ?? ''}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground/80">{d.department}</span>
                    <span className={cn('tabular-nums', scoreTone(d.score))}>{d.score}</span>
                  </div>
                  <Progress value={d.score} className="h-2" />
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      {/* Stats footer */}
      {Object.keys(stats).length > 0 && (
        <Card className="p-4 bg-card border-border">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            {[
              ['Employees', stats.employees ?? 0],
              ['MFA enabled', stats.mfa_enabled ?? 0],
              ['MFA missing', stats.mfa_missing ?? 0],
              ['Breached', stats.breached_employees ?? 0],
              ['Idle', stats.idle_employees ?? 0],
            ].map(([label, val]) => (
              <div key={label as string}>
                <div className="text-2xl font-light text-foreground tabular-nums">{val as number}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label as string}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
