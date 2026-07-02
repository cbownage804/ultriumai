/**
 * RayFixPanel — shows the Wrayth security score for a device and a
 * one-click "Fix Everything" that queues every safe remediation action
 * the server computed. Actions run through agent-action-request, exactly
 * like the manual approvals in DeviceActionsMenu.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldCheck, Sparkles, Wand2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FixStep {
  action_type: string;
  label: string;
  params?: Record<string, unknown>;
  severity: 'critical' | 'warn';
}

export function RayFixPanel({
  deviceId,
  score,
  plan,
  disabled,
}: {
  deviceId: string;
  score: number | undefined;
  plan: FixStep[];
  disabled?: boolean;
}) {
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const scoreValue = typeof score === 'number' ? score : null;
  const tone =
    scoreValue === null
      ? 'text-muted-foreground'
      : scoreValue >= 85
      ? 'text-emerald-300'
      : scoreValue >= 65
      ? 'text-yellow-200'
      : 'text-red-300';
  const bar =
    scoreValue === null
      ? 'bg-muted-foreground/30'
      : scoreValue >= 85
      ? 'bg-emerald-500'
      : scoreValue >= 65
      ? 'bg-yellow-500'
      : 'bg-red-500';

  const fixAll = async () => {
    if (!plan.length) return;
    setRunning(true);
    let ok = 0;
    let fail = 0;
    for (const step of plan) {
      try {
        const { error } = await supabase.functions.invoke('agent-action-request', {
          body: { device_id: deviceId, action_type: step.action_type, params: step.params ?? {} },
        });
        if (error) throw error;
        ok++;
      } catch (e) {
        fail++;
        console.error('fix step failed', step.action_type, e);
      }
    }
    setRunning(false);
    if (ok > 0) {
      toast.success(`Ray queued ${ok} fix${ok === 1 ? '' : 'es'}`, {
        description: fail
          ? `${fail} couldn't be queued — try them individually.`
          : 'Actions run on the next agent check-in (~30 seconds).',
      });
    } else {
      toast.error("I couldn't queue any fixes right now.");
    }
  };

  return (
    <div className="rounded-md border border-violet-500/30 bg-violet-500/5 p-3">
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Security score
          </span>
          <span className={`text-2xl font-semibold leading-none ${tone}`}>
            {scoreValue ?? '—'}
            <span className="text-xs text-muted-foreground">/100</span>
          </span>
        </div>
        <div className="flex-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-background/60">
            <div
              className={`h-full ${bar} transition-all`}
              style={{ width: `${scoreValue ?? 0}%` }}
            />
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {plan.length === 0
              ? 'Ray has nothing pending — this machine looks clean.'
              : `Ray can fix ${plan.length} issue${plan.length === 1 ? '' : 's'} in one click.`}
          </div>
        </div>
        {plan.length > 0 && (
          <Button
            size="sm"
            disabled={disabled || running}
            onClick={fixAll}
            className="bg-violet-500 text-white hover:bg-violet-400"
          >
            {running ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Wand2 className="mr-1.5 h-3.5 w-3.5" />
            )}
            Fix Everything
          </Button>
        )}
      </div>

      {plan.length === 0 && (
        <div className="mt-2 flex items-center gap-2 text-xs text-emerald-200">
          <ShieldCheck className="h-3.5 w-3.5" /> Nothing to remediate right now.
        </div>
      )}

      {plan.length > 0 && (
        <div className="mt-2">
          <button
            className="text-[11px] text-violet-200/80 hover:text-violet-100"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? 'Hide plan' : `Show plan (${plan.length})`}
          </button>
          {expanded && (
            <ul className="mt-1.5 space-y-1">
              {plan.map((step, i) => (
                <li key={i} className="flex items-center gap-2 text-[11px] text-foreground/85">
                  <Sparkles className="h-3 w-3 text-violet-300" />
                  <span className="flex-1 truncate">{step.label}</span>
                  <Badge
                    variant="outline"
                    className={
                      step.severity === 'critical'
                        ? 'border-red-500/40 text-red-200 text-[10px]'
                        : 'border-yellow-500/40 text-yellow-200 text-[10px]'
                    }
                  >
                    {step.severity}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default RayFixPanel;
