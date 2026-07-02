/**
 * RayFixPanel — split fix plan into Safe fixes (batchable via one-click
 * "Fix Everything") and Review-first fixes (per-item confirmation with impact
 * copy). High-risk actions never run through the batch path.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, ShieldCheck, Sparkles, Wand2, AlertTriangle, RotateCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FixStep {
  action_type: string;
  label: string;
  params?: Record<string, unknown>;
  severity: 'critical' | 'warn';
  risk?: 'low' | 'medium' | 'high';
  bucket?: 'safe' | 'review';
  requires_reboot?: boolean;
  rollback_possible?: boolean;
  impact?: string;
}

async function queueAction(deviceId: string, step: FixStep, confirmed: boolean) {
  const { data, error } = await supabase.functions.invoke('agent-action-request', {
    body: {
      device_id: deviceId,
      action_type: step.action_type,
      params: step.params ?? {},
      confirmed,
    },
  });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  return data;
}

export function RayFixPanel({
  deviceId, score, plan, disabled,
}: {
  deviceId: string;
  score: number | undefined;
  plan: FixStep[];
  disabled?: boolean;
}) {
  const [running, setRunning] = useState(false);

  const scoreValue = typeof score === 'number' ? score : null;
  const tone = scoreValue === null ? 'text-muted-foreground'
    : scoreValue >= 85 ? 'text-emerald-300'
    : scoreValue >= 65 ? 'text-yellow-200' : 'text-red-300';
  const bar = scoreValue === null ? 'bg-muted-foreground/30'
    : scoreValue >= 85 ? 'bg-emerald-500'
    : scoreValue >= 65 ? 'bg-yellow-500' : 'bg-red-500';

  // Back-compat: if server didn't send bucket/risk, treat as safe.
  const decorated = plan.map((s) => ({
    ...s,
    risk: s.risk ?? 'low',
    bucket: s.bucket ?? 'safe',
  })) as Required<Pick<FixStep,'risk'|'bucket'>> & FixStep[] extends unknown ? FixStep[] : never;

  const safe = plan.filter((s) => (s.bucket ?? 'safe') === 'safe');
  const review = plan.filter((s) => (s.bucket ?? 'safe') === 'review');

  const fixSafe = async () => {
    if (!safe.length) return;
    setRunning(true);
    let ok = 0, fail = 0;
    for (const step of safe) {
      try { await queueAction(deviceId, step, false); ok++; }
      catch (e) { fail++; console.error('safe fix failed', step.action_type, e); }
    }
    setRunning(false);
    if (ok) toast.success(`Ray queued ${ok} safe fix${ok === 1 ? '' : 'es'}`, {
      description: fail ? `${fail} couldn't be queued — try individually.` : 'Actions run on the next agent check-in (~30 seconds).',
    });
    else toast.error("I couldn't queue any fixes right now.");
  };

  const runReview = async (step: FixStep) => {
    try {
      await queueAction(deviceId, step, true);
      toast.success(`Queued: ${step.label}`);
    } catch (e: any) {
      toast.error(`Couldn't queue ${step.label}`, { description: e?.message });
    }
  };

  return (
    <div className="rounded-md border border-violet-500/30 bg-violet-500/5 p-3 space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Security score</span>
          <span className={`text-2xl font-semibold leading-none ${tone}`}>
            {scoreValue ?? '—'}<span className="text-xs text-muted-foreground">/100</span>
          </span>
        </div>
        <div className="flex-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-background/60">
            <div className={`h-full ${bar} transition-all`} style={{ width: `${scoreValue ?? 0}%` }} />
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {plan.length === 0
              ? 'Ray has nothing pending — this machine looks clean.'
              : `${safe.length} safe · ${review.length} need review`}
          </div>
        </div>
        {safe.length > 0 && (
          <Button
            size="sm" disabled={disabled || running} onClick={fixSafe}
            className="bg-violet-500 text-white hover:bg-violet-400"
          >
            {running ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Wand2 className="mr-1.5 h-3.5 w-3.5" />}
            Fix Safe ({safe.length})
          </Button>
        )}
      </div>

      {plan.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-emerald-200">
          <ShieldCheck className="h-3.5 w-3.5" /> Nothing to remediate right now.
        </div>
      )}

      {safe.length > 0 && (
        <details className="rounded border border-border/60 bg-background/30 p-2">
          <summary className="text-[11px] cursor-pointer text-violet-200/80">Safe fixes ({safe.length}) — batched by Fix Safe</summary>
          <ul className="mt-1.5 space-y-1">
            {safe.map((s, i) => (
              <li key={i} className="flex items-center gap-2 text-[11px]">
                <Sparkles className="h-3 w-3 text-violet-300" />
                <span className="flex-1 truncate">{s.label}</span>
                {s.rollback_possible && <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-200"><RotateCw className="h-2.5 w-2.5 mr-0.5" />reversible</Badge>}
              </li>
            ))}
          </ul>
        </details>
      )}

      {review.length > 0 && (
        <div className="rounded border border-amber-500/40 bg-amber-500/5 p-2 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-200">
            <AlertTriangle className="h-3.5 w-3.5" /> Review first ({review.length}) — each requires confirmation
          </div>
          {review.map((s, i) => (
            <div key={i} className="flex items-start gap-2 rounded border border-amber-500/20 bg-background/30 p-2">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{s.label}</div>
                {s.impact && <div className="text-[10px] text-amber-200/80 mt-0.5">{s.impact}</div>}
                <div className="mt-1 flex gap-1">
                  <Badge variant="outline" className="text-[9px] border-red-500/40 text-red-200">high risk</Badge>
                  {s.requires_reboot && <Badge variant="outline" className="text-[9px] border-yellow-500/40 text-yellow-200">may reboot</Badge>}
                  {s.rollback_possible && <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-200">reversible</Badge>}
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" disabled={disabled} className="shrink-0">Review</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Run: {s.label}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {s.impact ?? 'This action is marked high-risk. Confirm to queue it on this device.'}
                      {s.requires_reboot && <><br /><br /><strong>This may require a reboot to finish.</strong></>}
                      {!s.rollback_possible && <><br /><br />This action <strong>cannot be automatically rolled back</strong>.</>}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => runReview(s)}>Confirm and queue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RayFixPanel;
