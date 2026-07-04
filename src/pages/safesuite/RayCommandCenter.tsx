/**
 * RayCommandCenter — the new /app home.
 *
 * Uses the Ray Page Pattern shell and turns Home into an executive-ready
 * summary of the entire platform: overall risk, today's priority, threat
 * counts, protected devices, monitored identities, open investigations,
 * compliance posture, recent Ray activity, and an executive summary.
 *
 * All numbers come from real tables (ray_recommendations, ray_investigations,
 * ray_compliance_scans, ray_timeline, wrayth_devices, safepass_identities).
 * Nothing is mocked.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Fingerprint,
  MessageSquare,
  Monitor,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Wifi,
  WifiOff,
  Wrench,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useRayBrain, type RayRecommendation } from '@/lib/ray/brain';
import { RayPageHeader } from '@/components/ray/RayPageHeader';
import { RayPageTemplate } from '@/components/ray/RayPageTemplate';
import { RayBrief } from '@/components/ray/RayBrief';
import { TodayPriorityCard, type TodayPriority } from '@/components/ray/TodayPriorityCard';
import { RayConversationCard } from '@/components/ray/RayConversationCard';
import { FixWithRayButton } from '@/components/ray/FixWithRayButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


type OverallRisk = 'calm' | 'attention' | 'urgent';

interface CommandStats {
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  protectedDevices: number;
  monitoredIdentities: number;
  openInvestigations: number;
  completedInvestigations: number;
  compliancePosture: number | null; // 0-100
  complianceFramework: string | null;
  recentEvents: Array<{
    id: string;
    summary: string;
    occurred_at: string;
    severity: string;
  }>;
  // Fleet pulse
  devicesOnline: number;
  devicesStale: number;
  devicesDormant: number;
  devicesRevoked: number;
  // Proof of work (last 7d)
  fixesQueued7d: number;
  fixesCompleted7d: number;
  investigationsCompleted7d: number;
  timelineEvents7d: number;
}


function greetingFor(firstName?: string): string {
  const hour = new Date().getHours();
  const period = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  return firstName ? `Good ${period}, ${firstName}.` : `Good ${period}.`;
}

function riskFor(stats: CommandStats): OverallRisk {
  if (stats.criticalCount > 0) return 'urgent';
  if (stats.highCount > 0 || (stats.compliancePosture !== null && stats.compliancePosture < 60)) return 'attention';
  return 'calm';
}

function riskLabel(risk: OverallRisk) {
  if (risk === 'urgent') return { text: 'Needs attention now', tone: 'text-red-300', dot: 'bg-red-400' };
  if (risk === 'attention') return { text: 'A few things to review', tone: 'text-amber-300', dot: 'bg-amber-400' };
  return { text: 'Calm', tone: 'text-green-300', dot: 'bg-green-400' };
}

function toPriority(rec: RayRecommendation | undefined): TodayPriority | null {
  if (!rec) return null;
  const mins = rec.estimated_fix_seconds ? Math.max(1, Math.round(rec.estimated_fix_seconds / 60)) : undefined;
  const risk: TodayPriority['riskReduction'] =
    rec.priority >= 90 ? 'Critical' : rec.priority >= 70 ? 'High' : rec.priority >= 40 ? 'Medium' : 'Low';
  return {
    action: rec.title,
    detail: rec.body ?? undefined,
    estimatedTime: mins ? `${mins} min` : undefined,
    riskReduction: risk,
    href: rec.page_context ? `/app/${rec.page_context}` : '/app/ray/recommendations',
  };
}

export default function RayCommandCenter() {
  const { user } = useAuth();
  const brain = useRayBrain({ pageContext: 'home' });
  const [stats, setStats] = useState<CommandStats | null>(null);
  const [loading, setLoading] = useState(true);

  const firstName =
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    '';

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const [devices, identities, invsOpen, invsDone, compliance, events] = await Promise.all([
        supabase
          .from('wrayth_devices')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('safepass_identities')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
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
          .from('ray_compliance_scans')
          .select('overall_score, framework, created_at')
          .eq('user_id', user.id)
          .eq('status', 'complete')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('ray_timeline')
          .select('id, summary, occurred_at, severity')
          .eq('user_id', user.id)
          .order('occurred_at', { ascending: false })
          .limit(6),
      ]);

      if (cancelled) return;

      setStats({
        criticalCount: 0, // filled from recommendations below
        highCount: 0,
        mediumCount: 0,
        protectedDevices: devices.count ?? 0,
        monitoredIdentities: identities.count ?? 0,
        openInvestigations: invsOpen.count ?? 0,
        completedInvestigations: invsDone.count ?? 0,
        compliancePosture: (compliance.data as any)?.overall_score ?? null,
        complianceFramework: (compliance.data as any)?.framework ?? null,
        recentEvents: ((events.data as any[]) ?? []).map((r) => ({
          id: r.id,
          summary: r.summary ?? 'Ray recorded an event',
          occurred_at: r.occurred_at,
          severity: r.severity ?? 'info',
        })),
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const enriched = useMemo<CommandStats | null>(() => {
    if (!stats) return null;
    const recs = brain.recommendations;
    return {
      ...stats,
      criticalCount: recs.filter((r) => r.priority >= 90).length,
      highCount: recs.filter((r) => r.priority >= 70 && r.priority < 90).length,
      mediumCount: recs.filter((r) => r.priority >= 40 && r.priority < 70).length,
    };
  }, [stats, brain.recommendations]);

  const priority = toPriority(brain.recommendations[0]);
  const risk = enriched ? riskFor(enriched) : 'calm';
  const label = riskLabel(risk);

  // Brief lines
  const briefLines = useMemo(() => {
    if (!enriched) return [] as string[];
    const lines: string[] = [];
    lines.push(
      enriched.protectedDevices === 0
        ? "I haven't seen any protected devices sign in yet."
        : enriched.protectedDevices === 1
        ? 'I reviewed your 1 protected device.'
        : `I reviewed all ${enriched.protectedDevices} of your protected devices.`,
    );
    if (enriched.criticalCount + enriched.highCount === 0) {
      lines.push('No critical issues require your attention right now.');
    } else if (enriched.criticalCount > 0) {
      lines.push(
        enriched.criticalCount === 1
          ? 'I found 1 critical item worth your attention.'
          : `I found ${enriched.criticalCount} critical items worth your attention.`,
      );
    } else {
      lines.push(
        enriched.highCount === 1
          ? 'I found 1 high-priority recommendation.'
          : `I found ${enriched.highCount} high-priority recommendations.`,
      );
    }
    if (enriched.openInvestigations > 0) {
      lines.push(
        enriched.openInvestigations === 1
          ? '1 investigation is still in progress.'
          : `${enriched.openInvestigations} investigations are still in progress.`,
      );
    }
    return lines;
  }, [enriched]);

  const briefTone = risk === 'urgent' ? 'critical' : risk === 'attention' ? 'warn' : 'ok';

  const sinceLines = useMemo(() => {
    if (!enriched) return [];
    const out: Array<{ label: string; ok?: boolean }> = [];
    out.push({ label: `${enriched.protectedDevices} ${enriched.protectedDevices === 1 ? 'device' : 'devices'} checked in` });
    out.push({ label: `${enriched.monitoredIdentities} ${enriched.monitoredIdentities === 1 ? 'identity' : 'identities'} being monitored` });
    if (enriched.criticalCount > 0) {
      out.push({ label: `${enriched.criticalCount} critical recommendation${enriched.criticalCount === 1 ? '' : 's'} added`, ok: false });
    } else {
      out.push({ label: 'No critical items added' });
    }
    if (enriched.openInvestigations > 0) {
      out.push({ label: `${enriched.openInvestigations} investigation${enriched.openInvestigations === 1 ? '' : 's'} still open`, ok: false });
    } else {
      out.push({ label: 'All investigations closed' });
    }
    return out;
  }, [enriched]);

  // Executive summary paragraph
  const executive = useMemo(() => {
    if (!enriched) return '';
    const parts: string[] = [];
    parts.push(
      `Across ${enriched.protectedDevices} protected ${enriched.protectedDevices === 1 ? 'device' : 'devices'} and ${enriched.monitoredIdentities} monitored ${enriched.monitoredIdentities === 1 ? 'identity' : 'identities'}, the environment is currently ${label.text.toLowerCase()}.`,
    );
    if (enriched.criticalCount + enriched.highCount > 0) {
      parts.push(
        `${enriched.criticalCount} critical and ${enriched.highCount} high-priority items are open.`,
      );
    } else {
      parts.push('No critical or high-priority items are open.');
    }
    if (enriched.compliancePosture !== null) {
      parts.push(
        `Compliance posture against ${enriched.complianceFramework ?? 'the current framework'} sits at ${enriched.compliancePosture}%.`,
      );
    }
    if (enriched.openInvestigations > 0) {
      parts.push(
        `${enriched.openInvestigations} investigation${enriched.openInvestigations === 1 ? ' remains' : 's remain'} in progress; ${enriched.completedInvestigations} completed to date.`,
      );
    } else if (enriched.completedInvestigations > 0) {
      parts.push(`All ${enriched.completedInvestigations} investigations are closed.`);
    }
    return parts.join(' ');
  }, [enriched, label.text]);

  return (
    <div className="max-w-6xl mx-auto">
      <RayPageTemplate
        header={
          <RayPageHeader
            title="Ray Command Center"
            question={`${greetingFor(firstName)} Here's what I'm watching for you.`}
            description="One place for everything I'm doing across your devices, identities, threats, investigations, and compliance."
          />
        }
        brief={
          loading || !enriched ? (
            <RayBrief lines={[]} loading />
          ) : (
            <RayBrief greeting={greetingFor(firstName)} lines={briefLines} tone={briefTone} />
          )
        }
        sinceLines={sinceLines}
        priority={priority}
        protectLines={[
          "I'm continuously reviewing your devices, identities, and investigations.",
          "I'm cross-referencing every new threat against everything I already know about you.",
          "If anything crosses a critical threshold, I'll interrupt you here first.",
        ]}
      >
        {/* Overall risk + counts */}
        <section className="grid gap-3 md:grid-cols-4">
          <MetricCard
            label="Overall risk"
            value={label.text}
            valueClassName={label.tone}
            icon={<span className={cn('h-2.5 w-2.5 rounded-full', label.dot)} />}
            href="/app/ray/recommendations"
          />
          <MetricCard
            label="Critical / High / Medium"
            value={
              enriched
                ? `${enriched.criticalCount} · ${enriched.highCount} · ${enriched.mediumCount}`
                : '—'
            }
            icon={<AlertTriangle className="h-3.5 w-3.5 text-amber-300" />}
            href="/app/ray/recommendations"
          />
          <MetricCard
            label="Protected devices"
            value={enriched ? String(enriched.protectedDevices) : '—'}
            icon={<Monitor className="h-3.5 w-3.5 text-violet-200" />}
            href="/app/devices"
          />
          <MetricCard
            label="Monitored identities"
            value={enriched ? String(enriched.monitoredIdentities) : '—'}
            icon={<Fingerprint className="h-3.5 w-3.5 text-violet-200" />}
            href="/app/exposure"
          />
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          <MetricCard
            label="Open investigations"
            value={enriched ? String(enriched.openInvestigations) : '—'}
            sub={
              enriched && enriched.completedInvestigations > 0
                ? `${enriched.completedInvestigations} closed`
                : undefined
            }
            icon={<ScanSearch className="h-3.5 w-3.5 text-violet-200" />}
            href="/app/intelligence/investigations"
          />
          <MetricCard
            label="Compliance posture"
            value={
              enriched && enriched.compliancePosture !== null
                ? `${enriched.compliancePosture}%`
                : 'Not scored'
            }
            sub={enriched?.complianceFramework ?? 'Run a scan to establish posture'}
            icon={<ShieldCheck className="h-3.5 w-3.5 text-green-300" />}
            href="/app/intelligence/compliance"
          />
          <MetricCard
            label="Ray recommendations"
            value={enriched ? String(brain.recommendations.length) : '—'}
            sub="Open, ordered by priority"
            icon={<Target className="h-3.5 w-3.5 text-violet-200" />}
            href="/app/ray/recommendations"
          />
        </section>

        {/* Executive summary */}
        <section className="wrayth-chamfer border border-border bg-card/40 p-5 sm:p-6">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] text-violet-300/80">
            <Sparkles className="h-3 w-3" /> Executive summary
          </div>
          <p className="mt-3 text-sm text-foreground/90 leading-relaxed">
            {loading || !enriched ? 'Composing your summary…' : executive}
          </p>
          <div className="mt-4 flex items-center gap-3 text-[11px] text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            Ready to hand to a stakeholder — no editing required.
          </div>
        </section>

        {/* Recent Ray activity */}
        <section className="wrayth-chamfer border border-border bg-card/40 overflow-hidden">
          <div className="px-5 py-3 border-b border-border/60 flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Recent Ray activity
            </span>
            <Link
              to="/app/ray/timeline"
              className="ml-auto text-[11px] text-violet-300 hover:text-violet-200"
            >
              Full timeline →
            </Link>
          </div>
          {loading || !enriched ? (
            <div className="p-6 text-sm text-muted-foreground">Loading…</div>
          ) : enriched.recentEvents.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground italic">
              I haven't recorded anything yet. As soon as I do, it'll show up here.
            </div>
          ) : (
            <ul className="divide-y divide-border/40">
              {enriched.recentEvents.map((e) => (
                <li key={e.id} className="px-5 py-3 flex items-start gap-3">
                  <span
                    className={cn(
                      'mt-1.5 h-1.5 w-1.5 rounded-full shrink-0',
                      e.severity === 'critical' || e.severity === 'high'
                        ? 'bg-red-400'
                        : e.severity === 'medium'
                        ? 'bg-amber-400'
                        : 'bg-violet-300/80',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-foreground/90 leading-snug">{e.summary}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(e.occurred_at), { addSuffix: true })}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Ask Ray */}
        <RayConversationCard context="home" />
      </RayPageTemplate>
    </div>
  );
}

/* ─────────────────────────── helpers ─────────────────────────── */

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  href?: string;
  valueClassName?: string;
}

function MetricCard({ label, value, sub, icon, href, valueClassName }: MetricCardProps) {
  const body = (
    <div
      className={cn(
        'wrayth-chamfer border border-border bg-card/40 p-4 h-full',
        'transition-colors',
        href && 'hover:border-violet-400/40 hover:bg-card/60',
      )}
    >
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={cn('mt-2 text-xl font-light text-foreground', valueClassName)}>{value}</div>
      {sub && <div className="mt-1 text-[11px] text-muted-foreground truncate">{sub}</div>}
    </div>
  );
  return href ? (
    <Link to={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}
