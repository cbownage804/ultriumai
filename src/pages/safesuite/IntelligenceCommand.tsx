/**
 * Intelligence Command Center — Ray's flagship "morning briefing" screen.
 *
 * Everything on this page is pulled from tables Ray already writes to:
 * ray_investigations, ray_attack_paths, ray_board_reports, ray_recommendations,
 * ray_compliance_scans, ray_notices. No new backend required.
 *
 * The design goal is one glance = full situational awareness:
 *   1. Risk score (with delta vs previous scan)
 *   2. "Today Ray recommends" (top open recommendations)
 *   3. Critical counters (investigations, high risks, approvals)
 *   4. Recent intelligence feed
 *   5. Ask Ray composer (jumps into an investigation)
 */

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import {
  Brain, Sparkles, ScanSearch, GitBranch, FileText, ShieldCheck, ShieldAlert,
  AlertTriangle, Clock, ArrowUpRight, ArrowUp, ArrowDown, CheckCircle2, Zap,
  Layers, Send, ChevronRight, Activity,
} from 'lucide-react';

type ActivityRow = {
  id: string;
  kind: 'investigation' | 'attack_path' | 'board_report';
  title: string;
  subtitle: string;
  createdAt: string;
  href: string;
};

type Recommendation = {
  id: string;
  title: string;
  body: string | null;
  priority: number | null;
  severity: string | null;
  estimated_fix_seconds: number | null;
};

const ACCENT = 'hsl(262 60% 70%)';
const AMBER = 'hsl(38 90% 65%)';
const RED = 'hsl(0 70% 65%)';
const GREEN = 'hsl(150 60% 55%)';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Working late';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function iconFor(kind: ActivityRow['kind']) {
  return kind === 'investigation' ? ScanSearch : kind === 'attack_path' ? GitBranch : FileText;
}
function accentFor(kind: ActivityRow['kind']) {
  return kind === 'investigation' ? ACCENT : kind === 'attack_path' ? RED : AMBER;
}

export default function IntelligenceCommand() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [complianceScore, setComplianceScore] = useState<number | null>(null);
  const [openInvestigations, setOpenInvestigations] = useState(0);
  const [highRiskCount, setHighRiskCount] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [maliciousToday, setMaliciousToday] = useState(0);
  const [askQuery, setAskQuery] = useState('');

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);

      const [invs, paths, reports, recs, scans, running, malPast, approvals] = await Promise.all([
        supabase.from('ray_investigations')
          .select('id, input_label, input_type, verdict, created_at, status')
          .eq('user_id', user.id).order('created_at', { ascending: false }).limit(6),
        supabase.from('ray_attack_paths')
          .select('id, title, severity, created_at, status')
          .eq('user_id', user.id).order('created_at', { ascending: false }).limit(6),
        supabase.from('ray_board_reports')
          .select('id, period_days, title, created_at, status')
          .eq('user_id', user.id).order('created_at', { ascending: false }).limit(6),
        supabase.from('ray_recommendations')
          .select('id, title, body, priority, severity, estimated_fix_seconds')
          .eq('user_id', user.id).eq('status', 'open')
          .order('priority', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false }).limit(5),
        supabase.from('ray_compliance_scans')
          .select('overall_score, created_at, framework, status')
          .eq('user_id', user.id).eq('status', 'complete')
          .order('created_at', { ascending: false }).limit(2),
        supabase.from('ray_investigations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).in('status', ['pending', 'running']),
        supabase.from('ray_investigations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).eq('verdict', 'malicious')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('ray_attack_paths')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).eq('severity', 'high'),
      ]);

      if (cancelled) return;

      // Risk score: derive from latest compliance overall_score, else from
      // ratio of clean investigations. Provides a stable "morning number".
      const scanRows = (scans.data ?? []) as Array<{ overall_score: number | null; created_at: string }>;
      let latest: number | null = null;
      let prev: number | null = null;
      if (scanRows.length > 0 && typeof scanRows[0].overall_score === 'number') {
        latest = Math.round(scanRows[0].overall_score);
        if (scanRows.length > 1 && typeof scanRows[1].overall_score === 'number') {
          prev = Math.round(scanRows[1].overall_score);
        }
      } else {
        // Fallback: score = 100 - (malicious / total) * 40, min 40, based on last 30 investigations
        const { data: recent } = await supabase.from('ray_investigations')
          .select('verdict')
          .eq('user_id', user.id).eq('status', 'complete')
          .order('created_at', { ascending: false }).limit(30);
        const arr = (recent ?? []) as Array<{ verdict: string | null }>;
        if (arr.length > 0) {
          const bad = arr.filter(r => r.verdict === 'malicious').length;
          latest = Math.max(40, Math.round(100 - (bad / arr.length) * 40));
        }
      }
      setRiskScore(latest);
      setPreviousScore(prev);
      setComplianceScore(scanRows[0]?.overall_score ? Math.round(scanRows[0].overall_score) : null);

      setOpenInvestigations(running.count ?? 0);
      setMaliciousToday(malPast.count ?? 0);
      setHighRiskCount(approvals.count ?? 0);
      setPendingApprovals((reports.data ?? []).filter((r: { status: string }) => r.status !== 'complete').length);

      setRecommendations((recs.data ?? []) as Recommendation[]);

      // Build unified activity feed.
      const merged: ActivityRow[] = [];
      for (const r of (invs.data ?? []) as Array<{ id: string; input_label: string | null; input_type: string; verdict: string | null; created_at: string; status: string }>) {
        merged.push({
          id: `inv-${r.id}`, kind: 'investigation',
          title: r.input_label || r.input_type,
          subtitle: r.status === 'complete' ? `Verdict: ${r.verdict ?? 'unknown'}` : `Status: ${r.status}`,
          createdAt: r.created_at,
          href: `/app/intelligence/investigations?id=${r.id}`,
        });
      }
      for (const r of (paths.data ?? []) as Array<{ id: string; title: string | null; severity: string | null; created_at: string; status: string }>) {
        merged.push({
          id: `ap-${r.id}`, kind: 'attack_path',
          title: r.title || 'Attack path',
          subtitle: r.status === 'complete' ? `Severity: ${r.severity ?? 'unknown'}` : `Status: ${r.status}`,
          createdAt: r.created_at,
          href: `/app/intelligence/attack-paths?id=${r.id}`,
        });
      }
      for (const r of (reports.data ?? []) as Array<{ id: string; period_days: number; title: string | null; created_at: string; status: string }>) {
        merged.push({
          id: `br-${r.id}`, kind: 'board_report',
          title: r.title || `${r.period_days}-day board report`,
          subtitle: r.status === 'complete' ? 'Ready to export' : `Status: ${r.status}`,
          createdAt: r.created_at,
          href: `/app/intelligence/reports?id=${r.id}`,
        });
      }
      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setActivity(merged.slice(0, 8));

      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const delta = useMemo(() => {
    if (riskScore == null || previousScore == null) return null;
    return riskScore - previousScore;
  }, [riskScore, previousScore]);

  const scoreColor = riskScore == null
    ? 'hsl(220 10% 60%)'
    : riskScore >= 85 ? GREEN : riskScore >= 65 ? AMBER : RED;

  const scoreLabel = riskScore == null
    ? 'Not scanned'
    : riskScore >= 85 ? 'Strong' : riskScore >= 65 ? 'Moderate' : 'At risk';

  const displayName = (user?.user_metadata?.full_name as string | undefined)
    ?? (user?.email?.split('@')[0]) ?? 'analyst';

  function handleAsk(e: FormEvent) {
    e.preventDefault();
    const q = askQuery.trim();
    if (!q) return;
    navigate(`/app/intelligence/investigations?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
          <Brain className="h-3.5 w-3.5" />
          Ray Command Center · v0.7
        </div>
        <h1 className="text-3xl font-semibold mt-2 flex flex-wrap items-baseline gap-3">
          <span>{greeting()}, <span className="capitalize">{displayName}</span>.</span>
          <span className="text-sm font-normal text-muted-foreground">
            Ray has been watching overnight.
          </span>
        </h1>
      </div>

      {/* Top row: Risk score + Ask Ray */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Risk score card */}
        <Card className="lg:col-span-1 border-border bg-card overflow-hidden relative">
          <div
            className="absolute inset-0 opacity-[0.08] pointer-events-none"
            style={{ background: `radial-gradient(circle at 30% 20%, ${scoreColor}, transparent 60%)` }}
          />
          <CardContent className="p-6 relative">
            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Overall Risk Score
            </div>
            {loading ? (
              <Skeleton className="h-20 w-32 mt-3" />
            ) : (
              <>
                <div className="flex items-baseline gap-3 mt-2">
                  <div className="text-6xl font-semibold tabular-nums" style={{ color: scoreColor }}>
                    {riskScore ?? '—'}
                  </div>
                  {delta != null && delta !== 0 && (
                    <div
                      className="text-sm inline-flex items-center gap-1"
                      style={{ color: delta > 0 ? GREEN : RED }}
                    >
                      {delta > 0 ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
                      {Math.abs(delta)}
                    </div>
                  )}
                </div>
                <div className="text-xs mt-1" style={{ color: scoreColor }}>{scoreLabel}</div>
                <div className="mt-4 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{ width: `${riskScore ?? 0}%`, background: scoreColor }}
                  />
                </div>
                <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Compliance {complianceScore != null ? `${complianceScore}%` : 'n/a'}</span>
                  <Link
                    to="/app/intelligence/compliance/report"
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Gap report <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Ask Ray */}
        <Card className="lg:col-span-2 border-border bg-card">
          <CardContent className="p-6">
            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-3 w-3" /> Ask Ray
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Paste anything suspicious — a URL, IP, hash, email address, or a question.
              Ray will investigate, correlate against memory, and open a case.
            </p>
            <form onSubmit={handleAsk} className="mt-4 flex gap-2">
              <Input
                value={askQuery}
                onChange={e => setAskQuery(e.target.value)}
                placeholder="e.g. login-microsft365.support or 185.220.101.7"
                className="flex-1"
              />
              <Button type="submit" disabled={!askQuery.trim()}>
                <Send className="h-4 w-4 mr-1.5" />
                Investigate
              </Button>
            </form>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <Link to="/app/intelligence/memory" className="px-3 py-2 rounded-sm border border-border bg-muted/30 hover:bg-muted transition-colors inline-flex items-center gap-1.5">
                <Brain className="h-3 w-3" /> Memory recall
              </Link>
              <Link to="/app/intelligence/graph" className="px-3 py-2 rounded-sm border border-border bg-muted/30 hover:bg-muted transition-colors inline-flex items-center gap-1.5">
                <Layers className="h-3 w-3" /> Explore graph
              </Link>
              <Link to="/app/intelligence/reports" className="px-3 py-2 rounded-sm border border-border bg-muted/30 hover:bg-muted transition-colors inline-flex items-center gap-1.5">
                <FileText className="h-3 w-3" /> Generate report
              </Link>
              <Link to="/app/intelligence/modules" className="px-3 py-2 rounded-sm border border-border bg-muted/30 hover:bg-muted transition-colors inline-flex items-center gap-1.5">
                <Zap className="h-3 w-3" /> All modules
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle row: Today Ray recommends + Critical */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Recommendations */}
        <Card className="lg:col-span-2 border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-3 w-3" style={{ color: ACCENT }} />
                Today Ray recommends
              </div>
              <div className="text-[11px] text-muted-foreground">
                {recommendations.length} open
              </div>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : recommendations.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2" style={{ color: GREEN }} />
                <p className="text-sm text-muted-foreground">
                  You're clear. Ray has no open recommendations right now.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recommendations.map((rec, i) => {
                  const sev = (rec.severity ?? '').toLowerCase();
                  const sevColor = sev === 'high' || sev === 'critical' ? RED
                    : sev === 'medium' ? AMBER : ACCENT;
                  const mins = rec.estimated_fix_seconds ? Math.max(1, Math.round(rec.estimated_fix_seconds / 60)) : null;
                  return (
                    <div key={rec.id} className="flex items-start gap-3 px-3 py-3 rounded-sm border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                      <div className="text-[11px] tabular-nums font-mono text-muted-foreground w-4 pt-0.5">
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <div
                        className="h-6 w-1 rounded-full mt-0.5 shrink-0"
                        style={{ background: sevColor }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{rec.title}</div>
                        {rec.body && (
                          <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                            {rec.body}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                          {rec.severity && <span style={{ color: sevColor }}>{rec.severity}</span>}
                          {mins != null && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" /> ~{mins}m
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Critical counters */}
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="h-3 w-3" style={{ color: AMBER }} />
              Critical right now
            </div>
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <div className="space-y-1">
                <CriticalRow
                  icon={ScanSearch}
                  label="Investigations running"
                  value={openInvestigations}
                  color={openInvestigations > 0 ? ACCENT : 'hsl(220 10% 55%)'}
                  href="/app/intelligence/investigations"
                />
                <CriticalRow
                  icon={ShieldAlert}
                  label="Malicious verdicts (24h)"
                  value={maliciousToday}
                  color={maliciousToday > 0 ? RED : 'hsl(220 10% 55%)'}
                  href="/app/intelligence/investigations"
                />
                <CriticalRow
                  icon={GitBranch}
                  label="High-severity attack paths"
                  value={highRiskCount}
                  color={highRiskCount > 0 ? RED : 'hsl(220 10% 55%)'}
                  href="/app/intelligence/attack-paths"
                />
                <CriticalRow
                  icon={FileText}
                  label="Reports awaiting review"
                  value={pendingApprovals}
                  color={pendingApprovals > 0 ? AMBER : 'hsl(220 10% 55%)'}
                  href="/app/intelligence/reports"
                />
              </div>
            )}
            <div className="mt-4 pt-3 border-t border-border/60">
              <Link
                to="/app/intelligence/history"
                className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <Activity className="h-3 w-3" /> Full evidence timeline
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent intelligence feed */}
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-3 w-3" style={{ color: ACCENT }} />
              Recent intelligence
            </div>
            <Link
              to="/app/intelligence/history"
              className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : activity.length === 0 ? (
            <div className="py-10 text-center">
              <ScanSearch className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Nothing here yet — run your first investigation to seed Ray's memory.
              </p>
              <Button asChild size="sm" className="mt-3">
                <Link to="/app/intelligence/investigations">Start an investigation</Link>
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-1">
              {activity.map(row => {
                const Icon = iconFor(row.kind);
                return (
                  <Link
                    key={row.id}
                    to={row.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-sm hover:bg-accent transition-colors group"
                  >
                    <div
                      className="h-8 w-8 rounded-sm flex items-center justify-center border shrink-0"
                      style={{
                        background: `${accentFor(row.kind)}14`,
                        borderColor: `${accentFor(row.kind)}40`,
                        color: accentFor(row.kind),
                      }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{row.title}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{row.subtitle}</div>
                    </div>
                    <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footnote */}
      <div className="text-[11px] text-muted-foreground text-center pt-2">
        Every number on this page is drawn live from Ray's knowledge graph.
        <Link to="/app/intelligence/graph" className="ml-1 underline underline-offset-2 hover:text-foreground">
          See the graph →
        </Link>
      </div>
    </div>
  );
}

function CriticalRow({
  icon: Icon, label, value, color, href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
  href: string;
}) {
  return (
    <Link
      to={href}
      className="flex items-center gap-3 px-2 py-2 rounded-sm hover:bg-accent transition-colors"
    >
      <div
        className="h-8 w-8 rounded-sm flex items-center justify-center border shrink-0"
        style={{ background: `${color}14`, borderColor: `${color}40`, color }}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 text-sm">{label}</div>
      <Badge
        variant="outline"
        className="tabular-nums border-transparent text-sm"
        style={{ background: `${color}18`, color, borderColor: `${color}40` }}
      >
        {value}
      </Badge>
    </Link>
  );
}
