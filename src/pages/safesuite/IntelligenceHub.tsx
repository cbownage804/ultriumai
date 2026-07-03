/**
 * Intelligence Hub — v0.6 landing page.
 *
 * One entry-point for every Ray intelligence module.  Renders a grid of
 * module tiles (shipped modules are live-linked; unshipped ones are marked
 * "Coming soon" but still visible so users see the roadmap) plus a unified
 * "Recent activity" feed that unions the module tables Ray already writes
 * to.  No new backend needed — this page is a client-side aggregator.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import {
  ScanSearch, Bug, FileText, ClipboardCheck, ShieldCheck, Terminal, FileWarning,
  GitBranch, Network, Sparkles, Coins, Brain, ArrowUpRight, History, BookOpen,
} from 'lucide-react';

type Tile = {
  id: string;
  label: string;
  desc: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  cost: number;
  status: 'live' | 'soon';
};

const TILES: Tile[] = [
  { id: 'investigations', label: 'Investigations', desc: 'Deep threat analysis of URLs, IPs, hashes, emails, and alerts.', href: '/app/intelligence/investigations', icon: ScanSearch, cost: 3, status: 'live' },
  { id: 'attack-paths',    label: 'Attack Paths',   desc: 'Reason about how a threat could progress and what it blasts.', href: '/app/intelligence/attack-paths',   icon: GitBranch,  cost: 20, status: 'live' },
  { id: 'graph',           label: 'Graph',          desc: 'See how every investigation and IOC connects across your org.', href: '/app/intelligence/graph',         icon: Network,    cost: 0,  status: 'live' },
  { id: 'reports',         label: 'Board Reports',  desc: 'Executive digest across 7, 30, or 90 days of security activity.', href: '/app/intelligence/reports',   icon: FileText,   cost: 8,  status: 'live' },
  { id: 'malware',         label: 'Malware Analysis', desc: 'Explain what a binary, hash, or strings dump actually does.',       href: '/app/intelligence/malware', icon: Bug,        cost: 4,  status: 'live' },
  { id: 'scripts',         label: 'Script Analysis',  desc: 'Paste PowerShell, Bash, Python — get intent, risk, and MITRE.',    href: '/app/intelligence/scripts', icon: Terminal,   cost: 2,  status: 'live' },
  { id: 'logs',            label: 'Log Analysis',     desc: 'Summarize huge log files: EVTX, Sentinel, Defender, syslog, IIS, firewall.', href: '/app/intelligence/logs', icon: FileWarning,cost: 5,  status: 'live' },
  { id: 'compliance',      label: 'Compliance',       desc: 'Gap-analyze against CIS, NIST, HIPAA, SOC 2, ISO 27001 with a 30/60/90 roadmap.', href: '/app/intelligence/compliance', icon: ShieldCheck,cost: 15, status: 'live' },
  { id: 'policies',        label: 'Policy Generator', desc: 'Generate password, IR, DR, AUP, BYOD policies — editable, DOCX export.', href: '/app/intelligence/policies', icon: ClipboardCheck, cost: 10, status: 'live' },
  { id: 'drafts',          label: 'Drafts from Findings', desc: 'Turn investigation, log, and malware findings into policies + runbooks.', href: '/app/intelligence/drafts', icon: BookOpen, cost: 10, status: 'live' },
  { id: 'history',         label: 'History & Evidence', desc: 'Unified timeline across every module — see how they share graph + memory.', href: '/app/intelligence/history', icon: History, cost: 0, status: 'live' },
];

type ActivityRow = {
  id: string;
  kind: 'investigation' | 'attack_path' | 'board_report';
  title: string;
  subtitle: string;
  createdAt: string;
  href: string;
  accent: string;
};

function accentFor(kind: ActivityRow['kind']): string {
  switch (kind) {
    case 'investigation': return 'text-[hsl(262_60%_70%)]';
    case 'attack_path':   return 'text-[hsl(0_70%_65%)]';
    case 'board_report':  return 'text-[hsl(38_90%_65%)]';
  }
}

function iconFor(kind: ActivityRow['kind']) {
  switch (kind) {
    case 'investigation': return ScanSearch;
    case 'attack_path':   return GitBranch;
    case 'board_report':  return FileText;
  }
}

export default function IntelligenceHub() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<ActivityRow[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [invs, paths, reports] = await Promise.all([
        supabase
          .from('ray_investigations')
          .select('id, input_label, input_type, verdict, created_at, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('ray_attack_paths')
          .select('id, title, severity, created_at, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('ray_board_reports')
          .select('id, period_days, created_at, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(6),
      ]);
      if (cancelled) return;

      const merged: ActivityRow[] = [];

      for (const r of (invs.data ?? []) as Array<{ id: string; input_label: string | null; input_type: string; verdict: string | null; created_at: string; status: string }>) {
        merged.push({
          id: `inv-${r.id}`,
          kind: 'investigation',
          title: r.input_label || r.input_type,
          subtitle: r.status === 'complete' ? `Verdict: ${r.verdict ?? 'unknown'}` : `Status: ${r.status}`,
          createdAt: r.created_at,
          href: `/app/intelligence/investigations?id=${r.id}`,
          accent: accentFor('investigation'),
        });
      }
      for (const r of (paths.data ?? []) as Array<{ id: string; title: string | null; severity: string | null; created_at: string; status: string }>) {
        merged.push({
          id: `ap-${r.id}`,
          kind: 'attack_path',
          title: r.title || 'Attack path',
          subtitle: r.status === 'complete' ? `Severity: ${r.severity ?? 'unknown'}` : `Status: ${r.status}`,
          createdAt: r.created_at,
          href: `/app/intelligence/attack-paths?id=${r.id}`,
          accent: accentFor('attack_path'),
        });
      }
      for (const r of (reports.data ?? []) as Array<{ id: string; period_days: number; created_at: string; status: string }>) {
        merged.push({
          id: `br-${r.id}`,
          kind: 'board_report',
          title: `${r.period_days}-day board report`,
          subtitle: r.status === 'complete' ? 'Ready to export' : `Status: ${r.status}`,
          createdAt: r.created_at,
          href: `/app/intelligence/reports?id=${r.id}`,
          accent: accentFor('board_report'),
        });
      }

      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setActivity(merged.slice(0, 8));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const stats = useMemo(() => {
    const shipped = TILES.filter(t => t.status === 'live').length;
    const total = TILES.length;
    return { shipped, total };
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
          <Brain className="h-3.5 w-3.5" />
          Ray Intelligence Engine · v0.6
        </div>
        <h1 className="text-2xl font-semibold mt-1 flex items-center gap-2">
          AI Intelligence
          <Sparkles className="h-5 w-5 text-[hsl(262_60%_70%)]" />
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
          One platform. One pipeline. Every module below shares the same evidence, memory, and MITRE
          knowledge — so an investigation feeds attack-path reasoning, feeds board reports, feeds your
          organization's growing intelligence graph.
        </p>
        <div className="text-[11px] text-muted-foreground mt-2">
          {stats.shipped} of {stats.total} modules live · new modules ship every sprint
        </div>
      </div>

      {/* Module tiles */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {TILES.map(tile => {
          const Icon = tile.icon;
          const isLive = tile.status === 'live';
          const Wrapper = ({ children }: { children: React.ReactNode }) =>
            isLive && tile.href
              ? <Link to={tile.href} className="block group">{children}</Link>
              : <div className="block opacity-70 cursor-not-allowed">{children}</div>;
          return (
            <Wrapper key={tile.id}>
              <Card className={`border-border bg-card transition-all h-full ${isLive ? 'hover:border-[hsl(262_60%_64%/0.5)] hover:bg-[hsl(262_60%_64%/0.04)]' : ''}`}>
                <CardContent className="p-4 flex flex-col h-full min-h-[140px]">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className={`h-9 w-9 rounded-sm flex items-center justify-center bg-[hsl(262_60%_64%/0.08)] border border-[hsl(262_60%_64%/0.25)]`}>
                      <Icon className="h-4 w-4 text-[hsl(262_60%_78%)]" />
                    </div>
                    {isLive ? (
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    ) : (
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-border bg-muted text-muted-foreground">
                        Coming soon
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm font-medium text-foreground">{tile.label}</div>
                  <div className="text-xs text-muted-foreground mt-1 flex-1">{tile.desc}</div>
                  <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="uppercase tracking-wider">Ray Compute</span>
                    <span className="inline-flex items-center gap-1">
                      <Coins className="h-3 w-3" />
                      {tile.cost === 0 ? 'Free' : `${tile.cost} credits`}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Wrapper>
          );
        })}
      </div>

      {/* Recent activity */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[hsl(262_60%_70%)]" />
            Recent intelligence activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing here yet — run your first investigation to seed Ray's memory.
            </p>
          ) : (
            <div className="space-y-1">
              {activity.map(row => {
                const Icon = iconFor(row.kind);
                return (
                  <Link
                    key={row.id}
                    to={row.href}
                    className="flex items-center gap-3 px-3 py-2 rounded-sm hover:bg-accent transition-colors"
                  >
                    <div className={`h-7 w-7 rounded-sm flex items-center justify-center bg-muted ${row.accent}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{row.title}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{row.subtitle}</div>
                    </div>
                    <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
