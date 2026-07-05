/**
 * RemediationRunner — shows the six-phase execution progress for a
 * Fix Now action. Agent actions subscribe to the underlying
 * `wrayth_device_actions` row via Supabase Realtime so the UI updates
 * as the agent claims → runs → reports the job. Cloud actions completed
 * inline and just render the final status.
 */
import { useEffect, useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import type { Remediation } from '@/lib/ray/remediations/types';
import type { ExecuteResult } from '@/lib/ray/remediations/providers';

type Phase =
  | 'connecting'
  | 'sending'
  | 'acknowledged'
  | 'applying'
  | 'verifying'
  | 'completed'
  | 'failed';

const PHASE_ORDER: Phase[] = ['connecting', 'sending', 'acknowledged', 'applying', 'verifying', 'completed'];

const PHASE_LABELS: Record<Phase, string> = {
  connecting: 'Connecting to executor',
  sending: 'Sending instruction',
  acknowledged: 'Agent acknowledged',
  applying: 'Applying fix',
  verifying: 'Verifying result',
  completed: 'Completed',
  failed: 'Failed',
};

function statusToPhase(status: string | null): Phase {
  switch (status) {
    case 'approved': return 'sending';
    case 'dispatched': return 'acknowledged';
    case 'running': return 'applying';
    case 'succeeded': return 'completed';
    case 'failed':
    case 'cancelled': return 'failed';
    default: return 'connecting';
  }
}

interface Props {
  remediation: Remediation;
  result: ExecuteResult;
  onDone?: (result: ExecuteResult) => void;
}

export function RemediationRunner({ remediation, result, onDone }: Props) {
  const [phase, setPhase] = useState<Phase>(
    result.kind === 'inline' ? 'completed' : 'sending',
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (result.kind === 'inline') {
      onDone?.(result);
      return;
    }
    if (!result.agentActionId) return;

    let cancelled = false;
    const channel = supabase
      .channel(`remediation-${result.agentActionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wrayth_device_actions',
          filter: `id=eq.${result.agentActionId}`,
        },
        (payload) => {
          if (cancelled) return;
          const row = payload.new as { status?: string; error?: string | null };
          const next = statusToPhase(row.status ?? null);
          setPhase(next);
          if (next === 'failed') setErrorMsg(row.error ?? 'The agent reported a failure.');
          if (next === 'completed' || next === 'failed') onDone?.(result);
        },
      )
      .subscribe();

    // Poll once immediately in case the agent already picked it up.
    (async () => {
      const { data } = await supabase
        .from('wrayth_device_actions')
        .select('status, error')
        .eq('id', result.agentActionId!)
        .maybeSingle();
      if (!cancelled && data) {
        const p = statusToPhase((data as { status?: string }).status ?? null);
        setPhase(p);
        if (p === 'failed') setErrorMsg((data as { error?: string | null }).error ?? 'The agent reported a failure.');
      }
    })();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [result, onDone]);

  const currentIdx = phase === 'failed' ? -1 : PHASE_ORDER.indexOf(phase);

  return (
    <div className="space-y-2 py-2">
      {PHASE_ORDER.map((p, i) => {
        const done = phase === 'failed' ? false : i < currentIdx;
        const active = phase !== 'failed' && i === currentIdx;
        return (
          <div key={p} className="flex items-center gap-3 text-sm">
            <span
              className={cn(
                'inline-flex h-5 w-5 items-center justify-center rounded-full border',
                done
                  ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
                  : active
                    ? 'border-violet-400/60 bg-violet-500/10 text-violet-200'
                    : 'border-border text-muted-foreground',
              )}
            >
              {done ? <Check className="h-3 w-3" /> : active ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            </span>
            <span className={cn(
              'transition-colors',
              done ? 'text-emerald-200/80' : active ? 'text-foreground' : 'text-muted-foreground',
            )}>
              {PHASE_LABELS[p]}
            </span>
          </div>
        );
      })}

      {phase === 'failed' && (
        <div className="rounded border border-red-500/40 bg-red-500/5 p-3 text-sm text-red-200 mt-2 flex items-start gap-2">
          <X className="h-4 w-4 mt-0.5" />
          <div>
            <div className="font-medium">{PHASE_LABELS.failed}</div>
            {errorMsg && <div className="text-[12px] mt-0.5 text-red-200/80">{errorMsg}</div>}
          </div>
        </div>
      )}

      {result.kind === 'queued' && phase !== 'completed' && phase !== 'failed' && (
        <div className="text-[11px] text-muted-foreground pt-1">
          The agent picks up jobs every ~30 seconds. Leave this open or check the timeline later — Ray writes the result either way.
          {remediation.requiresReboot && ' The device may reboot to finish.'}
        </div>
      )}
    </div>
  );
}
