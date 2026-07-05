/**
 * RemediationQueuePage — grouped view of every remediation by lifecycle
 * state. Operator can approve, cancel, or view details.
 */
import { useEffect, useState, useCallback, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, ShieldCheck, Sparkles, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  approveRemediation,
  cancelRemediation,
  LIFECYCLE_COLOR,
  LIFECYCLE_LABEL,
} from '@/lib/ray/remediations/lifecycle';
import { getRemediationBySlug } from '@/lib/ray/remediations/catalog';
import { executeRemediation } from '@/lib/ray/remediations/providers';
import type { LifecycleState } from '@/lib/ray/remediations/types';

interface Row {
  id: string;
  slug: string;
  provider: 'agent' | 'ms365' | 'defender';
  action_type: string;
  target_id: string;
  target_label: string | null;
  target_type: string;
  risk: 'low' | 'medium' | 'high';
  lifecycle_state: LifecycleState | null;
  status: string | null;
  scheduled_for: string | null;
  created_at: string;
  chain_id: string | null;
  chain_step_index: number | null;
}

const GROUPS: Array<{ state: LifecycleState; title: string; hint: string }> = [
  { state: 'pending_approval', title: 'Pending your approval', hint: 'Ray wants to run these but your policy requires a click.' },
  { state: 'queued', title: 'Queued', hint: 'Waiting for a maintenance window or an operator to approve.' },
  { state: 'approved', title: 'Approved — waiting to run', hint: 'Approved. Will dispatch on the next queue tick.' },
  { state: 'running', title: 'Running', hint: 'In flight right now.' },
  { state: 'verifying', title: 'Verifying', hint: 'Ray is confirming the change took effect.' },
];

export default function RemediationQueuePage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('wrayth_remediation_actions')
      .select('id, slug, provider, action_type, target_id, target_label, target_type, risk, lifecycle_state, status, scheduled_for, created_at, chain_id, chain_step_index')
      .eq('user_id', user.id)
      .in('lifecycle_state', ['queued', 'pending_approval', 'approved', 'running', 'verifying'])
      .order('created_at', { ascending: true })
      .limit(200);
    setRows((data as unknown as Row[]) ?? []);
  }, [user?.id]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!user?.id) return;
    const ch = supabase
      .channel(`remediation-queue-${user.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'wrayth_remediation_actions', filter: `user_id=eq.${user.id}` },
        () => void load(),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, load]);

  const grouped = useMemo(() => {
    const map = new Map<LifecycleState, Row[]>();
    for (const r of rows ?? []) {
      const key = (r.lifecycle_state ?? 'queued') as LifecycleState;
      const arr = map.get(key) ?? [];
      arr.push(r);
      map.set(key, arr);
    }
    return map;
  }, [rows]);

  async function approveAndRun(r: Row) {
    if (!user) return;
    setBusy(r.id);
    try {
      await approveRemediation(r.id, user.id);
      const rem = getRemediationBySlug(r.slug);
      if (!rem) throw new Error('remediation_not_in_catalog');
      if (r.target_id === 'unassigned') {
        toast.info('Pick a target for this action from the catalog.');
      } else {
        await executeRemediation(rem, {
          userId: user.id,
          targetId: r.target_id,
          targetLabel: r.target_label ?? undefined,
          confirmed: true,
        });
        toast.success(`Ray dispatched: ${rem.title}`);
      }
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to run');
    } finally {
      setBusy(null);
    }
  }

  async function cancel(r: Row) {
    setBusy(r.id);
    try {
      await cancelRemediation(r.id);
      toast.success('Cancelled.');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <header className="flex items-start gap-3">
        <Sparkles className="h-7 w-7 text-violet-300 mt-1" />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Remediation queue</h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Everything Ray is about to do, is doing, or is waiting to do.
            Approve, cancel, or let your autonomy policy handle it.
          </p>
        </div>
      </header>

      {rows === null ? (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading queue…
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-emerald-400" /> Queue is empty
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Nothing is queued or in flight. When Ray finds something to fix — or you click Fix Now — it shows up here first.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {GROUPS.map((g) => {
            const list = grouped.get(g.state) ?? [];
            if (list.length === 0) return null;
            return (
              <Card key={g.state}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    {g.title}
                    <Badge variant="outline" className={cn('text-[10px]', LIFECYCLE_COLOR[g.state])}>
                      {LIFECYCLE_LABEL[g.state]} · {list.length}
                    </Badge>
                  </CardTitle>
                  <p className="text-[12px] text-muted-foreground">{g.hint}</p>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y divide-border/40">
                    {list.map((r) => {
                      const rem = getRemediationBySlug(r.slug);
                      return (
                        <li key={r.id} className="py-3 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {rem?.title ?? r.slug}
                              {r.chain_id && (
                                <Badge variant="outline" className="ml-2 text-[10px]">
                                  Chain step {(r.chain_step_index ?? 0) + 1}
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              Target: {r.target_label ?? r.target_id} · queued {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                              {r.scheduled_for && ` · scheduled ${formatDistanceToNow(new Date(r.scheduled_for), { addSuffix: true })}`}
                            </div>
                          </div>
                          <Badge variant="outline" className={cn('text-[10px] uppercase',
                            r.risk === 'high' ? 'border-red-500/40 text-red-300'
                              : r.risk === 'medium' ? 'border-amber-500/40 text-amber-200'
                                : 'border-emerald-500/40 text-emerald-200',
                          )}>
                            {r.risk}
                          </Badge>
                          {(g.state === 'queued' || g.state === 'pending_approval') && (
                            <>
                              <Button
                                size="sm" variant="outline"
                                disabled={busy === r.id}
                                onClick={() => void approveAndRun(r)}
                              >
                                {busy === r.id
                                  ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                  : <Check className="h-3.5 w-3.5 mr-1" />}
                                Approve & run
                              </Button>
                              <Button
                                size="sm" variant="ghost"
                                disabled={busy === r.id}
                                onClick={() => void cancel(r)}
                              >
                                <X className="h-3.5 w-3.5 mr-1" /> Cancel
                              </Button>
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
