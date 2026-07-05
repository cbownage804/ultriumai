/**
 * RayRemediationTimeline — reverse-chronological feed of every Fix Now
 * action Ray has run across all providers (agent, Microsoft 365, Defender).
 * Backed by the unified `wrayth_remediation_actions` table.
 */
import { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Check, Clock, Loader2, X, Filter, MonitorSmartphone, User as UserIcon, Cloud } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RayPageHeader } from '@/components/ray/RayPageHeader';
import { RayPageTemplate } from '@/components/ray/RayPageTemplate';
import { RayBrief } from '@/components/ray/RayBrief';
import { RayZeroState } from '@/components/ray/zero-state';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PROVIDER_LABELS } from '@/lib/ray/remediations/types';
import { UndoButton } from '@/components/ray/remediation/UndoButton';

interface Row {
  id: string;
  provider: 'agent' | 'ms365' | 'defender';
  slug: string;
  action_type: string;
  target_type: string;
  target_id: string;
  target_label: string | null;
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  risk: 'low' | 'medium' | 'high';
  category: string | null;
  duration_ms: number | null;
  error: string | null;
  created_at: string;
}

const STATUS_ICON: Record<Row['status'], JSX.Element> = {
  pending: <Clock className="h-3.5 w-3.5 text-muted-foreground" />,
  running: <Loader2 className="h-3.5 w-3.5 text-violet-300 animate-spin" />,
  succeeded: <Check className="h-3.5 w-3.5 text-emerald-300" />,
  failed: <X className="h-3.5 w-3.5 text-red-300" />,
  cancelled: <X className="h-3.5 w-3.5 text-muted-foreground" />,
};

const STATUS_CLS: Record<Row['status'], string> = {
  pending: 'border-border text-muted-foreground',
  running: 'border-violet-400/40 text-violet-200',
  succeeded: 'border-emerald-500/40 text-emerald-200',
  failed: 'border-red-500/40 text-red-300',
  cancelled: 'border-border text-muted-foreground',
};

const PROVIDER_ICON: Record<Row['provider'], JSX.Element> = {
  agent: <MonitorSmartphone className="h-3 w-3" />,
  ms365: <Cloud className="h-3 w-3" />,
  defender: <Cloud className="h-3 w-3" />,
};

function readableTitle(slug: string): string {
  return slug.split('-').map((s) => s[0]?.toUpperCase() + s.slice(1)).join(' ');
}

function formatDuration(ms: number | null): string | null {
  if (ms == null) return null;
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${Math.round(s % 60)}s`;
}

export default function RayRemediationTimeline() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [providerFilter, setProviderFilter] = useState<'all' | Row['provider']>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | Row['status']>('all');

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('wrayth_remediation_actions')
        .select('id, provider, slug, action_type, target_type, target_id, target_label, status, risk, category, duration_ms, error, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200);
      if (!cancelled) setRows((data as unknown as Row[]) ?? []);
    })();

    const channel = supabase
      .channel(`remediation-timeline-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wrayth_remediation_actions', filter: `user_id=eq.${user.id}` },
        () => {
          supabase
            .from('wrayth_remediation_actions')
            .select('id, provider, slug, action_type, target_type, target_id, target_label, status, risk, category, duration_ms, error, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(200)
            .then(({ data }) => {
              if (!cancelled) setRows((data as unknown as Row[]) ?? []);
            });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const filtered = useMemo(() => {
    return (rows ?? []).filter((r) => {
      if (providerFilter !== 'all' && r.provider !== providerFilter) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      return true;
    });
  }, [rows, providerFilter, statusFilter]);

  const counts = useMemo(() => {
    const c = { total: 0, ok: 0, failed: 0, running: 0 };
    for (const r of rows ?? []) {
      c.total++;
      if (r.status === 'succeeded') c.ok++;
      else if (r.status === 'failed') c.failed++;
      else if (r.status === 'running' || r.status === 'pending') c.running++;
    }
    return c;
  }, [rows]);

  return (
    <div className="max-w-6xl mx-auto">
      <RayPageTemplate
        header={
          <RayPageHeader
            title="Remediation Timeline"
            question="Everything I've fixed — or tried to fix — across your fleet."
            description="Every Fix Now action Ray dispatched, across Windows agents and Microsoft 365. Full audit trail with duration, target, and outcome."
          />
        }
        brief={
          rows === null
            ? undefined
            : (
              <RayBrief
                lines={
                  counts.total === 0
                    ? ['I haven\u2019t run any one-click fixes yet.', 'When you click Fix Now, it lands here.']
                    : [
                        `${counts.total} action${counts.total === 1 ? '' : 's'} on record.`,
                        `${counts.ok} succeeded${counts.failed ? `, ${counts.failed} failed` : ''}${counts.running ? `, ${counts.running} in progress` : ''}.`,
                      ]
                }
                tone={counts.failed > 0 ? 'warn' : 'ok'}
              />
            )
        }
        sinceLines={[
          { label: `${counts.total} actions logged` },
          { label: `${counts.ok} succeeded` },
          { label: `${counts.failed} failed` },
        ]}
        protectLines={[
          "Every action here was queued by you.",
          "Ray never runs anything on its own.",
          "This log cannot be edited \u2014 it's your audit trail.",
        ]}
      >
        {rows === null ? (
          <section className="wrayth-chamfer border border-border bg-card/40 p-6 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading timeline…
          </section>
        ) : rows.length === 0 ? (
          <RayZeroState
            title="No remediations yet."
            body="When you click Fix Now on a recommendation, device posture issue, or catalog item, I record the outcome here."
            expectations={[
              'Windows agent actions (Defender, Firewall, BitLocker, updates)',
              'Microsoft 365 actions (revoke sessions, block sign-in, reset MFA)',
              'Success, failure, duration, and target for every action',
            ]}
          />
        ) : (
          <>
            <section className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground pr-2">
                <Filter className="h-3 w-3" /> Filter
              </div>
              <FilterChip active={providerFilter === 'all'} onClick={() => setProviderFilter('all')}>All providers</FilterChip>
              <FilterChip active={providerFilter === 'agent'} onClick={() => setProviderFilter('agent')}>Wrayth Agent</FilterChip>
              <FilterChip active={providerFilter === 'ms365'} onClick={() => setProviderFilter('ms365')}>Microsoft 365</FilterChip>
              <span className="w-px h-4 bg-border mx-1" />
              <FilterChip active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>Any status</FilterChip>
              <FilterChip active={statusFilter === 'succeeded'} onClick={() => setStatusFilter('succeeded')}>Succeeded</FilterChip>
              <FilterChip active={statusFilter === 'failed'} onClick={() => setStatusFilter('failed')}>Failed</FilterChip>
              <FilterChip active={statusFilter === 'running'} onClick={() => setStatusFilter('running')}>In progress</FilterChip>
            </section>

            <section className="wrayth-chamfer border border-border bg-card/40 overflow-hidden">
              <ul className="divide-y divide-border/40">
                {filtered.map((r) => {
                  const dur = formatDuration(r.duration_ms);
                  return (
                    <li key={r.id} className="px-5 py-3 flex items-start gap-3">
                      <div className="pt-1">{STATUS_ICON[r.status]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm text-foreground/90 font-medium">
                            Ray {r.status === 'succeeded' ? 'ran' : r.status === 'failed' ? 'tried' : 'queued'}: {readableTitle(r.slug)}
                          </div>
                          <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                            {PROVIDER_ICON[r.provider]} {PROVIDER_LABELS[r.provider]}
                          </Badge>
                          <Badge variant="outline" className={cn('text-[10px] uppercase', STATUS_CLS[r.status])}>
                            {r.status}
                          </Badge>
                        </div>
                        <div className="text-[12px] text-muted-foreground mt-0.5 flex items-center gap-1 flex-wrap">
                          {r.target_type === 'user' ? <UserIcon className="h-3 w-3" /> : <MonitorSmartphone className="h-3 w-3" />}
                          <span className="text-foreground/80">{r.target_label ?? r.target_id}</span>
                          <span>· {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                          {dur && <span>· {dur}</span>}
                        </div>
                        {r.error && (
                          <div className="text-[12px] text-red-300 mt-1 truncate">
                            {r.error}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
                {filtered.length === 0 && (
                  <li className="px-5 py-8 text-sm text-muted-foreground italic text-center">
                    No actions match those filters.
                  </li>
                )}
              </ul>
            </section>
          </>
        )}
      </RayPageTemplate>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-2.5 py-1 rounded-full text-[11px] border transition-colors',
        active
          ? 'border-violet-400/60 bg-violet-500/10 text-violet-100'
          : 'border-border bg-background/40 text-muted-foreground hover:border-violet-400/40 hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}
