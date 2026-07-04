/**
 * RayCommandCenter — the permanent /app landing page and the central
 * experience for every Wrayth user.
 *
 * This is Ray's executive briefing, not a widget dashboard. Every module
 * (Devices, Identity Monitoring, Threats, Intelligence, Compliance, Vault)
 * feeds a single narrative card that answers, in order:
 *
 *   1. What happened?
 *   2. What changed?
 *   3. What matters?
 *   4. What should I do next?
 *
 * Every action routes into the module that already owns the workflow via
 * <BriefingAction />. The Remediation Engine will later attach to the same
 * primitive without redesigning this page.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  Activity,
  CheckCircle2,
  Fingerprint,
  KeyRound,
  MessageSquare,
  Monitor,
  ScanSearch,
  ShieldCheck,
  Siren,
  Sparkles,
  Target,
  TrendingUp,
  Wrench,
  Zap,
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useRayBrain, type RayRecommendation } from '@/lib/ray/brain';
import { RayPageHeader } from '@/components/ray/RayPageHeader';
import { RayPageTemplate } from '@/components/ray/RayPageTemplate';
import { RayBrief } from '@/components/ray/RayBrief';
import { RayConversationCard } from '@/components/ray/RayConversationCard';
import { ModuleBriefingCard, type BriefingStatus } from '@/components/ray/ModuleBriefingCard';
import { BriefingAction } from '@/components/ray/BriefingAction';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/* ─────────────────────────── types & helpers ─────────────────────────── */

type OverallRisk = 'calm' | 'attention' | 'urgent';

interface DevicesBriefing {
  total: number;
  online: number;
  stale: number;
  dormant: number;
  revoked: number;
  lastSeenAt: string | null;
}

interface IdentityBriefing {
  monitored: number;
  breachedAccounts: number;
  scannedAt: string | null;
}

interface ThreatsBriefing {
  active: number;
  resolvedLast7d: number;
  lastDetectedAt: string | null;
  topSeverity: 'critical' | 'high' | 'medium' | 'low' | null;
}

interface IntelligenceBriefing {
  open: number;
  completed: number;
  completedLast7d: number;
  lastCompletedAt: string | null;
}

interface ComplianceBriefing {
  score: number | null;
  framework: string | null;
  scannedAt: string | null;
  gaps: number;
}

interface VaultBriefing {
  entries: number;
  weak: number;
  reused: number;
  compromised: number;
  scannedAt: string | null;
}

interface BriefingBundle {
  devices: DevicesBriefing;
  identity: IdentityBriefing;
  threats: ThreatsBriefing;
  intelligence: IntelligenceBriefing;
  compliance: ComplianceBriefing;
  vault: VaultBriefing;
  recentEvents: Array<{ id: string; summary: string; occurred_at: string; severity: string }>;
  fixesQueued7d: number;
  fixesCompleted7d: number;
  timelineEvents7d: number;
}

function greetingFor(firstName?: string): string {
  const hour = new Date().getHours();
  const period = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  return firstName ? `Good ${period}, ${firstName}.` : `Good ${period}.`;
}

function overallRiskFor(recs: RayRecommendation[], b: BriefingBundle | null): OverallRisk {
  const crit = recs.filter((r) => r.priority >= 90).length;
  const high = recs.filter((r) => r.priority >= 70 && r.priority < 90).length;
  if (crit > 0) return 'urgent';
  if (b && b.threats.active > 0 && (b.threats.topSeverity === 'critical' || b.threats.topSeverity === 'high')) return 'urgent';
  if (high > 0) return 'attention';
  if (b && (b.vault.compromised > 0 || b.identity.breachedAccounts > 0)) return 'attention';
  if (b && b.compliance.score !== null && b.compliance.score < 60) return 'attention';
  return 'calm';
}

function riskCopy(risk: OverallRisk) {
  if (risk === 'urgent') return { text: 'Needs attention now', tone: 'text-red-300', dot: 'bg-red-400' };
  if (risk === 'attention') return { text: 'A few things to review', tone: 'text-amber-300', dot: 'bg-amber-400' };
  return { text: 'Calm', tone: 'text-emerald-300', dot: 'bg-emerald-400' };
}

function relTime(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return null;
  }
}

/* ─────────────────────────── page ─────────────────────────── */

export default function RayCommandCenter() {
  const { user } = useAuth();
  const brain = useRayBrain({ pageContext: 'home' });
  const [briefing, setBriefing] = useState<BriefingBundle | null>(null);
  const [loading, setLoading] = useState(true);

  const firstName =
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    '';

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const now = Date.now();
      const sevenDaysAgo = new Date(now - 7 * 86400_000).toISOString();
      const staleCutoff = new Date(now - 10 * 60_000).toISOString();
      const dormantCutoff = new Date(now - 24 * 3600_000).toISOString();

      const [
        deviceRows,
        identities,
        latestBreachScan,
        threatsActive,
        threatsResolved7d,
        threatsLatest,
        invsOpen,
        invsDone,
        invs7d,
        invsLatest,
        compliance,
        vaultEntries,
        events,
        actions7d,
        timeline7d,
      ] = await Promise.all([
        supabase.from('wrayth_devices').select('id, last_seen_at, revoked_at').eq('user_id', user.id),
        supabase.from('safepass_identities').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase
          .from('safepass_breach_scans')
          .select('compromised_count, completed_at')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('safe_shield_threats')
          .select('id, severity', { count: 'exact' })
          .eq('user_id', user.id)
          .neq('status', 'resolved')
          .order('detected_at', { ascending: false })
          .limit(50),
        supabase
          .from('safe_shield_threats')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'resolved')
          .gte('resolved_at', sevenDaysAgo),
        supabase
          .from('safe_shield_threats')
          .select('detected_at')
          .eq('user_id', user.id)
          .order('detected_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('ray_investigations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('status', ['pending', 'running']),
        supabase
          .from('ray_investigations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'complete'),
        supabase
          .from('ray_investigations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'complete')
          .gte('completed_at', sevenDaysAgo),
        supabase
          .from('ray_investigations')
          .select('completed_at')
          .eq('user_id', user.id)
          .eq('status', 'complete')
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('ray_compliance_scans')
          .select('overall_score, framework, gaps, updated_at')
          .eq('user_id', user.id)
          .eq('status', 'complete')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('safepass_entries')
          .select('id, password_strength_score, is_compromised')
          .eq('user_id', user.id)
          .eq('entry_type', 'password'),
        supabase
          .from('ray_timeline')
          .select('id, summary, occurred_at, severity')
          .eq('user_id', user.id)
          .order('occurred_at', { ascending: false })
          .limit(6),
        supabase
          .from('wrayth_device_actions')
          .select('id, status')
          .eq('user_id', user.id)
          .gte('created_at', sevenDaysAgo),
        supabase
          .from('ray_timeline')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('occurred_at', sevenDaysAgo),
      ]);

      if (cancelled) return;

      // Devices
      const devs = (deviceRows.data as Array<{ id: string; last_seen_at: string | null; revoked_at: string | null }>) ?? [];
      let online = 0, stale = 0, dormant = 0, revoked = 0;
      let lastSeen: string | null = null;
      for (const d of devs) {
        if (d.revoked_at) { revoked++; continue; }
        if (!d.last_seen_at) { dormant++; continue; }
        if (!lastSeen || d.last_seen_at > lastSeen) lastSeen = d.last_seen_at;
        if (d.last_seen_at >= staleCutoff) online++;
        else if (d.last_seen_at >= dormantCutoff) stale++;
        else dormant++;
      }

      // Threats
      const threatRows = (threatsActive.data as Array<{ severity: string }>) ?? [];
      const rank = (s: string): number =>
        s === 'critical' ? 4 : s === 'high' ? 3 : s === 'medium' ? 2 : s === 'low' ? 1 : 0;
      const topSev = threatRows.reduce<'critical' | 'high' | 'medium' | 'low' | null>((acc, t) => {
        const s = (t.severity ?? '').toLowerCase();
        if (!acc) return (['critical','high','medium','low'] as const).includes(s as never) ? (s as typeof acc) : null;
        return rank(s) > rank(acc) ? (s as typeof acc) : acc;
      }, null);

      // Vault
      const vRows = (vaultEntries.data as Array<{ password_strength_score: number | null; is_compromised: boolean | null }>) ?? [];
      const weak = vRows.filter((v) => (v.password_strength_score ?? 100) < 60).length;
      const compromised = vRows.filter((v) => v.is_compromised).length;
      // Reused approximation: not stored per-entry; leave 0 unless later derived from scan_results.
      const reused = 0;

      // Actions
      const acts = (actions7d.data as Array<{ status: string }>) ?? [];
      const fixesQueued = acts.length;
      const fixesCompleted = acts.filter((a) => a.status === 'completed' || a.status === 'success').length;

      const comp = compliance.data as { overall_score?: number; framework?: string; gaps?: unknown[]; updated_at?: string } | null;

      setBriefing({
        devices: {
          total: devs.filter((d) => !d.revoked_at).length,
          online, stale, dormant, revoked,
          lastSeenAt: lastSeen,
        },
        identity: {
          monitored: identities.count ?? 0,
          breachedAccounts: (latestBreachScan.data as { compromised_count?: number } | null)?.compromised_count ?? 0,
          scannedAt: (latestBreachScan.data as { completed_at?: string } | null)?.completed_at ?? null,
        },
        threats: {
          active: threatsActive.count ?? threatRows.length,
          resolvedLast7d: threatsResolved7d.count ?? 0,
          lastDetectedAt: (threatsLatest.data as { detected_at?: string } | null)?.detected_at ?? null,
          topSeverity: topSev,
        },
        intelligence: {
          open: invsOpen.count ?? 0,
          completed: invsDone.count ?? 0,
          completedLast7d: invs7d.count ?? 0,
          lastCompletedAt: (invsLatest.data as { completed_at?: string } | null)?.completed_at ?? null,
        },
        compliance: {
          score: comp?.overall_score ?? null,
          framework: comp?.framework ?? null,
          scannedAt: comp?.updated_at ?? null,
          gaps: Array.isArray(comp?.gaps) ? (comp?.gaps as unknown[]).length : 0,
        },
        vault: {
          entries: vRows.length,
          weak, reused, compromised,
          scannedAt: (latestBreachScan.data as { completed_at?: string } | null)?.completed_at ?? null,
        },
        recentEvents: ((events.data as Array<{ id: string; summary: string | null; occurred_at: string; severity: string | null }>) ?? []).map((r) => ({
          id: r.id,
          summary: r.summary ?? 'Ray recorded an event',
          occurred_at: r.occurred_at,
          severity: r.severity ?? 'info',
        })),
        fixesQueued7d: fixesQueued,
        fixesCompleted7d: fixesCompleted,
        timelineEvents7d: timeline7d.count ?? 0,
      });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const risk = overallRiskFor(brain.recommendations, briefing);
  const riskCopyResolved = riskCopy(risk);

  // Ray's top-of-page brief
  const briefLines = useMemo(() => {
    if (!briefing) return [] as string[];
    const lines: string[] = [];
    const crit = brain.recommendations.filter((r) => r.priority >= 90).length;
    const high = brain.recommendations.filter((r) => r.priority >= 70 && r.priority < 90).length;

    lines.push(
      briefing.devices.total === 0
        ? "I haven't seen any protected devices sign in yet."
        : `I reviewed ${briefing.devices.total} protected device${briefing.devices.total === 1 ? '' : 's'} and ${briefing.identity.monitored} monitored identit${briefing.identity.monitored === 1 ? 'y' : 'ies'}.`,
    );
    if (crit + high === 0 && briefing.threats.active === 0) {
      lines.push('Nothing critical is open right now.');
    } else if (crit > 0) {
      lines.push(`${crit} critical item${crit === 1 ? '' : 's'} need${crit === 1 ? 's' : ''} your attention.`);
    } else if (briefing.threats.active > 0) {
      lines.push(`${briefing.threats.active} threat${briefing.threats.active === 1 ? '' : 's'} still active.`);
    } else {
      lines.push(`${high} high-priority item${high === 1 ? '' : 's'} to review when you have a moment.`);
    }
    if (briefing.intelligence.open > 0) {
      lines.push(`${briefing.intelligence.open} investigation${briefing.intelligence.open === 1 ? ' is' : 's are'} still running.`);
    }
    return lines;
  }, [briefing, brain.recommendations]);

  const briefTone = risk === 'urgent' ? 'critical' : risk === 'attention' ? 'warn' : 'ok';

  const sinceLines = useMemo(() => {
    if (!briefing) return [];
    const out: Array<{ label: string; ok?: boolean }> = [];
    out.push({ label: `${briefing.devices.online} device${briefing.devices.online === 1 ? '' : 's'} online right now`, ok: briefing.devices.dormant === 0 });
    out.push({ label: `${briefing.threats.active} active threat${briefing.threats.active === 1 ? '' : 's'}`, ok: briefing.threats.active === 0 });
    out.push({ label: `${briefing.intelligence.completedLast7d} investigation${briefing.intelligence.completedLast7d === 1 ? '' : 's'} closed this week` });
    return out;
  }, [briefing]);

  return (
    <div className="max-w-6xl mx-auto">
      <RayPageTemplate
        header={
          <RayPageHeader
            title="Command Center"
            question={`${greetingFor(firstName)} Here's what I'm watching for you.`}
            description="Everything I know about your devices, identities, threats, investigations, compliance, and vault — in one place."
          />
        }
        brief={
          loading || !briefing ? (
            <RayBrief lines={[]} loading />
          ) : (
            <RayBrief greeting={greetingFor(firstName)} lines={briefLines} tone={briefTone} />
          )
        }
        sinceLines={sinceLines}
        protectLines={[
          "I'm continuously reviewing your devices, identities, and investigations.",
          "I'm cross-referencing every new threat against everything I already know about you.",
          "If anything crosses a critical threshold, I'll interrupt you here first.",
        ]}
      >
        {/* Overall posture — single elevated headline */}
        <PostureHeadline risk={risk} copy={riskCopyResolved} recs={brain.recommendations} briefing={briefing} loading={loading} />

        {/* Priority queue — the single "what should I do next" for the whole platform */}
        <PriorityQueue recs={brain.recommendations.slice(0, 5)} loading={loading} />

        {/* Module briefings — every module answers the four questions */}
        <section aria-label="Module briefings" className="grid gap-3 md:grid-cols-2">
          <DevicesBriefingCard b={briefing?.devices} loading={loading} />
          <IdentityBriefingCard b={briefing?.identity} loading={loading} />
          <ThreatsBriefingCard b={briefing?.threats} loading={loading} />
          <IntelligenceBriefingCard b={briefing?.intelligence} loading={loading} />
          <ComplianceBriefingCard b={briefing?.compliance} loading={loading} />
          <VaultBriefingCard b={briefing?.vault} loading={loading} />
        </section>

        {/* Executive summary — hand-to-stakeholder paragraph */}
        <ExecutiveSummary risk={risk} briefing={briefing} recs={brain.recommendations} loading={loading} />

        {/* Proof of work — the "what Ray has been doing" strip */}
        <ProofOfWork briefing={briefing} loading={loading} />

        {/* Recent Ray activity — platform-wide "what happened" feed */}
        <RecentActivity briefing={briefing} loading={loading} />

        {/* Ask Ray */}
        <RayConversationCard context="home" />
      </RayPageTemplate>
    </div>
  );
}

/* ─────────────────────────── posture headline ─────────────────────────── */

function PostureHeadline({
  risk, copy, recs, briefing, loading,
}: {
  risk: OverallRisk;
  copy: { text: string; tone: string; dot: string };
  recs: RayRecommendation[];
  briefing: BriefingBundle | null;
  loading: boolean;
}) {
  const crit = recs.filter((r) => r.priority >= 90).length;
  const high = recs.filter((r) => r.priority >= 70 && r.priority < 90).length;
  const medium = recs.filter((r) => r.priority >= 40 && r.priority < 70).length;

  return (
    <section className="wrayth-chamfer border border-border bg-card/40 p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className={cn('mt-1.5 h-2.5 w-2.5 rounded-full', copy.dot, 'shadow-[0_0_12px_currentColor]')} />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Overall posture</div>
          <h2 className={cn('mt-1 text-2xl sm:text-3xl font-light leading-tight', copy.tone)}>
            {loading ? 'Reading your environment…' : copy.text}
          </h2>
          {!loading && briefing && (
            <p className="mt-2 text-sm text-muted-foreground">
              {risk === 'calm'
                ? 'Nothing needs a decision from you right now.'
                : risk === 'attention'
                ? "A few things are worth reviewing when you have a moment — none are on fire."
                : "I need you to look at something now."}
            </p>
          )}
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[11px] text-muted-foreground shrink-0">
          <SeverityChip label="Critical" value={crit} tone="text-red-300" />
          <SeverityChip label="High" value={high} tone="text-amber-300" />
          <SeverityChip label="Medium" value={medium} tone="text-yellow-200" />
        </div>
      </div>
    </section>
  );
}

function SeverityChip({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex flex-col items-end">
      <span className={cn('text-xl font-light leading-none', tone)}>{value}</span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</span>
    </div>
  );
}

/* ─────────────────────────── priority queue ─────────────────────────── */

function priorityTone(p: number) {
  if (p >= 90) return { label: 'Critical', cls: 'border-red-500/40 text-red-300 bg-red-500/5' };
  if (p >= 70) return { label: 'High', cls: 'border-amber-500/40 text-amber-200 bg-amber-500/5' };
  if (p >= 40) return { label: 'Medium', cls: 'border-yellow-500/30 text-yellow-200 bg-yellow-500/5' };
  return { label: 'Low', cls: 'border-border text-muted-foreground bg-background/40' };
}

function PriorityQueue({ recs, loading }: { recs: RayRecommendation[]; loading: boolean }) {
  return (
    <section className="wrayth-chamfer border border-border bg-card/40 overflow-hidden">
      <div className="px-5 py-3 border-b border-border/60 flex items-center gap-2">
        <Target className="h-3.5 w-3.5 text-violet-300" />
        <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          What should I do next
        </span>
        <span className="text-[11px] text-muted-foreground/70">
          {recs.length > 0 ? `Top ${recs.length}` : ''}
        </span>
        <Link
          to="/app/ray/recommendations"
          className="ml-auto text-[11px] text-violet-300 hover:text-violet-200"
        >
          Review all →
        </Link>
      </div>
      {loading ? (
        <div className="p-6 text-sm text-muted-foreground">Loading…</div>
      ) : recs.length === 0 ? (
        <div className="p-6 text-sm text-muted-foreground italic flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          Nothing pending — I'll surface anything critical here the moment it appears.
        </div>
      ) : (
        <ul className="divide-y divide-border/40">
          {recs.map((r) => {
            const tone = priorityTone(r.priority);
            const href = r.page_context ? `/app/${r.page_context}` : '/app/ray/recommendations';
            return (
              <li key={r.id} className="px-5 py-3 flex items-start gap-3">
                <Badge variant="outline" className={cn('shrink-0 text-[10px] uppercase tracking-wide', tone.cls)}>
                  {tone.label}
                </Badge>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-foreground/90 font-medium truncate">{r.title}</div>
                  {r.body && (
                    <div className="text-[12px] text-muted-foreground line-clamp-2 mt-0.5">
                      {r.body}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <BriefingAction kind="fix" href={href} remediationSlug={r.objective ?? undefined} />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-[11px] text-violet-300 hover:text-violet-200"
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent('ray:panel-open', {
                          detail: {
                            message: `What should I do about "${r.title}"?`,
                            context: { kind: 'recommendation', id: r.id, title: r.title, body: r.body ?? undefined },
                          },
                        }),
                      )
                    }
                  >
                    <MessageSquare className="h-3.5 w-3.5 mr-1" /> Ask Ray
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ─────────────────────────── module briefings ─────────────────────────── */

function DevicesBriefingCard({ b, loading }: { b: DevicesBriefing | undefined; loading: boolean }) {
  if (loading || !b) {
    return <ModuleBriefingCard loading module="Devices" icon={Monitor} moduleHref="/app/devices"
      status="unknown" happened="" matters="" />;
  }

  if (b.total === 0) {
    return (
      <ModuleBriefingCard
        module="Devices" icon={Monitor} moduleHref="/app/devices" status="unknown"
        happened="No devices are enrolled yet."
        matters="Install the Wrayth agent on one machine and I'll start watching it immediately."
        action={{ kind: 'investigate', href: '/app/devices', label: 'Enroll a device' }}
      />
    );
  }

  const status: BriefingStatus =
    b.revoked > 0 ? 'attention' :
    b.dormant > b.online ? 'attention' :
    b.online === 0 ? 'attention' : 'calm';

  const happened =
    b.online === b.total
      ? `All ${b.total} of your devices are checking in.`
      : `${b.online} of ${b.total} device${b.total === 1 ? '' : 's'} ${b.online === 1 ? 'is' : 'are'} online right now.`;

  const changed = b.lastSeenAt
    ? `Last check-in ${relTime(b.lastSeenAt)}.`
    : 'No agent has checked in yet.';

  const parts: string[] = [];
  if (b.dormant > 0) parts.push(`${b.dormant} ${b.dormant === 1 ? 'is' : 'are'} dormant`);
  if (b.stale > 0) parts.push(`${b.stale} went quiet in the last hour`);
  if (b.revoked > 0) parts.push(`${b.revoked} ${b.revoked === 1 ? 'is' : 'are'} revoked`);
  const matters = parts.length
    ? `${parts.join(', ')} — worth a quick look.`
    : "Fleet is behaving normally. I'll flag anything that stops checking in.";

  return (
    <ModuleBriefingCard
      module="Devices" icon={Monitor} moduleHref="/app/devices" status={status}
      happened={happened} changed={changed} matters={matters}
      action={{ kind: status === 'calm' ? 'investigate' : 'fix', href: '/app/devices', label: status === 'calm' ? 'Open devices' : 'Review fleet' }}
    />
  );
}

function IdentityBriefingCard({ b, loading }: { b: IdentityBriefing | undefined; loading: boolean }) {
  if (loading || !b) {
    return <ModuleBriefingCard loading module="Identity Monitoring" icon={Fingerprint} moduleHref="/app/exposure"
      status="unknown" happened="" matters="" />;
  }

  if (b.monitored === 0) {
    return (
      <ModuleBriefingCard
        module="Identity Monitoring" icon={Fingerprint} moduleHref="/app/exposure" status="unknown"
        happened="I'm not watching any identities yet."
        matters="Add an email or username and I'll monitor it for breaches, dark-web leaks, and typo-squats."
        action={{ kind: 'investigate', href: '/app/exposure', label: 'Add identity' }}
      />
    );
  }

  const status: BriefingStatus = b.breachedAccounts > 0 ? 'urgent' : 'calm';
  const happened =
    b.breachedAccounts > 0
      ? `${b.breachedAccounts} account${b.breachedAccounts === 1 ? '' : 's'} appeared in a breach.`
      : `All ${b.monitored} monitored identit${b.monitored === 1 ? 'y is' : 'ies are'} clean.`;
  const changed = b.scannedAt ? `Last scan ${relTime(b.scannedAt)}.` : 'No scan on file yet.';
  const matters = b.breachedAccounts > 0
    ? "Rotate the affected passwords and I'll re-check the exposure."
    : "I'll re-scan on schedule and let you know the moment anything shows up.";

  return (
    <ModuleBriefingCard
      module="Identity Monitoring" icon={Fingerprint} moduleHref="/app/exposure" status={status}
      happened={happened} changed={changed} matters={matters}
      action={{
        kind: status === 'urgent' ? 'fix' : 'investigate',
        href: status === 'urgent' ? '/app/exposure' : '/app/exposure',
        label: status === 'urgent' ? 'Rotate exposed' : 'Open monitoring',
      }}
    />
  );
}

function ThreatsBriefingCard({ b, loading }: { b: ThreatsBriefing | undefined; loading: boolean }) {
  if (loading || !b) {
    return <ModuleBriefingCard loading module="Threat Center" icon={Siren} moduleHref="/app/threats"
      status="unknown" happened="" matters="" />;
  }

  const status: BriefingStatus =
    b.active === 0 ? 'calm' :
    b.topSeverity === 'critical' || b.topSeverity === 'high' ? 'urgent' : 'attention';

  const happened =
    b.active === 0
      ? 'No active threats on any device.'
      : `${b.active} active threat${b.active === 1 ? '' : 's'} — top severity ${b.topSeverity ?? 'unknown'}.`;

  const changed =
    b.lastDetectedAt
      ? `Last detection ${relTime(b.lastDetectedAt)}.`
      : 'No detections on record yet.';

  const matters =
    b.active === 0
      ? b.resolvedLast7d > 0
        ? `I resolved ${b.resolvedLast7d} threat${b.resolvedLast7d === 1 ? '' : 's'} in the last 7 days.`
        : "Everything's quiet. I'll interrupt you if that changes."
      : "Open the Threat Center — I've already staged the response steps.";

  return (
    <ModuleBriefingCard
      module="Threat Center" icon={Siren} moduleHref="/app/threats" status={status}
      happened={happened} changed={changed} matters={matters}
      action={{
        kind: b.active > 0 ? 'fix' : 'investigate',
        href: '/app/threats',
        label: b.active > 0 ? 'Contain threats' : 'Open Threat Center',
      }}
    />
  );
}

function IntelligenceBriefingCard({ b, loading }: { b: IntelligenceBriefing | undefined; loading: boolean }) {
  if (loading || !b) {
    return <ModuleBriefingCard loading module="Intelligence" icon={ScanSearch} moduleHref="/app/intelligence"
      status="unknown" happened="" matters="" />;
  }

  const status: BriefingStatus = b.open > 0 ? 'attention' : 'calm';
  const happened =
    b.open > 0
      ? `${b.open} investigation${b.open === 1 ? ' is' : 's are'} in progress.`
      : b.completed > 0
        ? `All ${b.completed} investigation${b.completed === 1 ? ' is' : 's are'} closed.`
        : "You haven't run an investigation yet.";
  const changed =
    b.lastCompletedAt
      ? `Last completed ${relTime(b.lastCompletedAt)}.`
      : b.open > 0 ? 'Nothing has finished yet in this batch.' : 'Feed me a URL, hash, or log to get started.';
  const matters =
    b.open > 0
      ? "I'll flag the moment any investigation returns a verdict."
      : b.completedLast7d > 0
        ? `${b.completedLast7d} finished this week — nothing needs a re-run.`
        : "Deep analysis on demand — hashes, URLs, logs, and scripts.";

  return (
    <ModuleBriefingCard
      module="Intelligence" icon={ScanSearch} moduleHref="/app/intelligence" status={status}
      happened={happened} changed={changed} matters={matters}
      action={{
        kind: b.open > 0 ? 'investigate' : 'investigate',
        href: b.open > 0 ? '/app/intelligence/investigations' : '/app/intelligence',
        label: b.open > 0 ? 'View investigations' : 'Start an investigation',
      }}
    />
  );
}

function ComplianceBriefingCard({ b, loading }: { b: ComplianceBriefing | undefined; loading: boolean }) {
  if (loading || !b) {
    return <ModuleBriefingCard loading module="Compliance" icon={ShieldCheck} moduleHref="/app/intelligence/compliance"
      status="unknown" happened="" matters="" />;
  }

  if (b.score === null) {
    return (
      <ModuleBriefingCard
        module="Compliance" icon={ShieldCheck} moduleHref="/app/intelligence/compliance" status="unknown"
        happened="No compliance posture on file."
        matters="Pick a framework and I'll score your environment in one pass."
        action={{ kind: 'investigate', href: '/app/intelligence/compliance', label: 'Run a scan' }}
      />
    );
  }

  const status: BriefingStatus = b.score >= 85 ? 'calm' : b.score >= 60 ? 'attention' : 'urgent';
  const happened = `${b.framework ?? 'Framework'} posture is ${b.score}%.`;
  const changed = b.scannedAt ? `Last scored ${relTime(b.scannedAt)}.` : 'Never scored.';
  const matters =
    status === 'calm'
      ? 'Solid posture. I recommend a fresh scan every 30 days.'
      : b.gaps > 0
        ? `${b.gaps} gap${b.gaps === 1 ? '' : 's'} to close — I can prioritise which move the score most.`
        : 'Room to improve — open the report for the ranked gap list.';

  return (
    <ModuleBriefingCard
      module="Compliance" icon={ShieldCheck} moduleHref="/app/intelligence/compliance" status={status}
      happened={happened} changed={changed} matters={matters}
      action={{
        kind: status === 'calm' ? 'investigate' : 'fix',
        href: '/app/intelligence/compliance',
        label: status === 'calm' ? 'View report' : 'Close gaps',
      }}
    />
  );
}

function VaultBriefingCard({ b, loading }: { b: VaultBriefing | undefined; loading: boolean }) {
  if (loading || !b) {
    return <ModuleBriefingCard loading module="Vault" icon={KeyRound} moduleHref="/app/passwords"
      status="unknown" happened="" matters="" />;
  }

  if (b.entries === 0) {
    return (
      <ModuleBriefingCard
        module="Vault" icon={KeyRound} moduleHref="/app/passwords" status="unknown"
        happened="Your vault is empty."
        matters="Import from a browser or another manager and I'll audit every entry for weak, reused, or breached passwords."
        action={{ kind: 'investigate', href: '/app/passwords', label: 'Open vault' }}
      />
    );
  }

  const issues = b.compromised + b.weak;
  const status: BriefingStatus = b.compromised > 0 ? 'urgent' : b.weak > 0 ? 'attention' : 'calm';
  const happened =
    issues === 0
      ? `All ${b.entries} vault entries look healthy.`
      : `${issues} of ${b.entries} vault entries need work.`;
  const changed = b.scannedAt ? `Last audit ${relTime(b.scannedAt)}.` : 'No audit on file — I can run one now.';
  const parts: string[] = [];
  if (b.compromised > 0) parts.push(`${b.compromised} compromised`);
  if (b.weak > 0) parts.push(`${b.weak} weak`);
  const matters =
    issues === 0
      ? "I'll keep watching for new breach data. Rotate anything I flag."
      : `${parts.join(' · ')} — rotate the compromised ones first.`;

  return (
    <ModuleBriefingCard
      module="Vault" icon={KeyRound} moduleHref="/app/passwords" status={status}
      happened={happened} changed={changed} matters={matters}
      action={{
        kind: status === 'calm' ? 'investigate' : 'fix',
        href: '/app/passwords',
        label: status === 'calm' ? 'Open vault' : 'Rotate now',
      }}
    />
  );
}

/* ─────────────────────────── executive summary ─────────────────────────── */

function ExecutiveSummary({
  risk, briefing, recs, loading,
}: {
  risk: OverallRisk;
  briefing: BriefingBundle | null;
  recs: RayRecommendation[];
  loading: boolean;
}) {
  const paragraph = useMemo(() => {
    if (!briefing) return '';
    const label = risk === 'urgent' ? 'needs attention now' : risk === 'attention' ? 'is worth a review' : 'is calm';
    const crit = recs.filter((r) => r.priority >= 90).length;
    const high = recs.filter((r) => r.priority >= 70 && r.priority < 90).length;

    const parts: string[] = [];
    parts.push(
      `Across ${briefing.devices.total} protected ${briefing.devices.total === 1 ? 'device' : 'devices'} and ${briefing.identity.monitored} monitored ${briefing.identity.monitored === 1 ? 'identity' : 'identities'}, the environment ${label}.`,
    );
    if (crit + high > 0) parts.push(`${crit} critical and ${high} high-priority items are open.`);
    else parts.push('No critical or high-priority items are open.');
    if (briefing.threats.active > 0) parts.push(`${briefing.threats.active} threat${briefing.threats.active === 1 ? '' : 's'} still active on device.`);
    if (briefing.compliance.score !== null) parts.push(`Compliance posture against ${briefing.compliance.framework ?? 'the current framework'} sits at ${briefing.compliance.score}%.`);
    if (briefing.intelligence.open > 0) parts.push(`${briefing.intelligence.open} investigation${briefing.intelligence.open === 1 ? ' remains' : 's remain'} in progress.`);
    if (briefing.vault.compromised > 0) parts.push(`${briefing.vault.compromised} vault password${briefing.vault.compromised === 1 ? ' is' : 's are'} known-compromised.`);
    return parts.join(' ');
  }, [briefing, recs, risk]);

  return (
    <section className="wrayth-chamfer border border-border bg-card/40 p-5 sm:p-6">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] text-violet-300/80">
        <Sparkles className="h-3 w-3" /> Executive summary
      </div>
      <p className="mt-3 text-sm text-foreground/90 leading-relaxed">
        {loading || !briefing ? 'Composing your summary…' : paragraph}
      </p>
      <div className="mt-4 flex items-center gap-3 text-[11px] text-muted-foreground">
        <TrendingUp className="h-3 w-3" />
        Ready to hand to a stakeholder — no editing required.
      </div>
    </section>
  );
}

/* ─────────────────────────── proof of work ─────────────────────────── */

function ProofOfWork({ briefing, loading }: { briefing: BriefingBundle | null; loading: boolean }) {
  return (
    <section className="wrayth-chamfer border border-border bg-card/40 p-5">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] text-violet-300/80">
        <Zap className="h-3 w-3" /> What Ray did this week
        <span className="ml-auto text-[10px] text-muted-foreground normal-case tracking-normal">Last 7 days</span>
      </div>
      {loading || !briefing ? (
        <div className="mt-3 text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-4 text-[12px]">
          <ProofStat icon={<Wrench className="h-3.5 w-3.5 text-violet-300" />} value={briefing.fixesQueued7d} label="Fixes queued" />
          <ProofStat icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />} value={briefing.fixesCompleted7d} label="Fixes completed" />
          <ProofStat icon={<ScanSearch className="h-3.5 w-3.5 text-violet-300" />} value={briefing.intelligence.completedLast7d} label="Investigations closed" />
          <ProofStat icon={<Activity className="h-3.5 w-3.5 text-violet-300" />} value={briefing.timelineEvents7d} label="Events recorded" />
        </div>
      )}
    </section>
  );
}

function ProofStat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="rounded border border-border/60 bg-background/30 px-2.5 py-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}{label}
      </div>
      <div className="text-lg font-light text-foreground leading-none mt-1">{value}</div>
    </div>
  );
}

/* ─────────────────────────── recent activity ─────────────────────────── */

function RecentActivity({ briefing, loading }: { briefing: BriefingBundle | null; loading: boolean }) {
  return (
    <section className="wrayth-chamfer border border-border bg-card/40 overflow-hidden">
      <div className="px-5 py-3 border-b border-border/60 flex items-center gap-2">
        <Activity className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Recent Ray activity
        </span>
        <Link to="/app/ray/timeline" className="ml-auto text-[11px] text-violet-300 hover:text-violet-200">
          Full timeline →
        </Link>
      </div>
      {loading || !briefing ? (
        <div className="p-6 text-sm text-muted-foreground">Loading…</div>
      ) : briefing.recentEvents.length === 0 ? (
        <div className="p-6 text-sm text-muted-foreground italic">
          I haven't recorded anything yet. As soon as I do, it'll show up here.
        </div>
      ) : (
        <ul className="divide-y divide-border/40">
          {briefing.recentEvents.map((e) => (
            <li key={e.id} className="px-5 py-3 flex items-start gap-3">
              <span
                className={cn(
                  'mt-1.5 h-1.5 w-1.5 rounded-full shrink-0',
                  e.severity === 'critical' || e.severity === 'high' ? 'bg-red-400'
                    : e.severity === 'medium' ? 'bg-amber-400'
                    : 'bg-violet-300/80',
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-foreground/90 leading-snug">{e.summary}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {relTime(e.occurred_at)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
