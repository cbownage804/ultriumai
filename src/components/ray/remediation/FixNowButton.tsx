/**
 * FixNowButton — the single Fix Now entry point across the app.
 *
 * Given a Remediation, it:
 *  1. Opens a preview dialog that explains what Ray will do.
 *  2. Lets the operator pick a target (device / M365 user) if not preset.
 *  3. Handles confirmation (confirm / typed-name).
 *  4. Executes via the provider registry.
 *  5. Shows a live runner (agent) or an inline success/failure toast (cloud).
 *  6. Writes a unified audit row through the executor.
 */
import { useState } from 'react';
import { Loader2, Sparkles, AlertTriangle, ShieldCheck, Clock, RotateCw, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import type { Remediation } from '@/lib/ray/remediations/types';
import { executeRemediation, type ExecuteResult } from '@/lib/ray/remediations/providers';
import { TargetPicker, type ResolvedTarget } from './TargetPicker';
import { RemediationRunner } from './RemediationRunner';
import { TrustIndicators } from './TrustIndicators';

const RISK_CLS: Record<'low' | 'medium' | 'high', string> = {
  low: 'border-emerald-500/40 text-emerald-200',
  medium: 'border-amber-500/40 text-amber-200',
  high: 'border-red-500/40 text-red-300',
};

export interface FixNowButtonProps {
  remediation: Remediation;
  /** Pre-selected target; if omitted, TargetPicker collects one. */
  target?: ResolvedTarget;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  label?: string;
  className?: string;
  onCompleted?: (result: ExecuteResult) => void;
}

export function FixNowButton({
  remediation: r,
  target: presetTarget,
  size = 'sm',
  variant = 'outline',
  label,
  className,
  onCompleted,
}: FixNowButtonProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [pickedTarget, setPickedTarget] = useState<ResolvedTarget | null>(presetTarget ?? null);
  const [typedName, setTypedName] = useState('');
  const [busy, setBusy] = useState(false);
  const [running, setRunning] = useState<ExecuteResult | null>(null);

  const target = presetTarget ?? pickedTarget;
  const needsTyped = r.requiresConfirmation === 'typed_name';
  const typedOK = !needsTyped || (target?.label && typedName.trim().toLowerCase() === target.label.trim().toLowerCase());
  const canRun = !!user && !!target && typedOK;

  const reset = () => {
    setPickedTarget(presetTarget ?? null);
    setTypedName('');
    setBusy(false);
    setRunning(null);
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) reset();
  };

  async function run() {
    if (!canRun || !target || !user) return;
    setBusy(true);
    try {
      const res = await executeRemediation(r, {
        userId: user.id,
        targetId: target.id,
        targetLabel: target.label,
        params: target.params,
        confirmed: r.requiresConfirmation !== 'none',
      });
      setRunning(res);
      if (res.kind === 'inline') {
        toast.success(`Ray ran: ${r.title}`, { description: target.label });
        onCompleted?.(res);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      if (msg === 'microsoft_365_not_connected') {
        toast.error('Connect Microsoft 365 first', { description: 'Go to Integrations → Microsoft 365.' });
      } else if (msg === 'insufficient_permissions') {
        toast.error('Missing admin consent', { description: 'Reconnect Microsoft 365 with the required scopes.' });
      } else if (msg === 'confirmation_required') {
        toast.error('This action needs explicit confirmation.');
      } else if (msg.startsWith('preflight_blocked')) {
        toast.error("Ray refused to run this — a safety preflight failed.");
      } else {
        toast.error(`Couldn't run: ${msg}`);
      }
    } finally {
      setBusy(false);
    }
  }

  const mins = r.estimatedSeconds >= 60 ? `~${Math.round(r.estimatedSeconds / 60)}m` : `~${r.estimatedSeconds}s`;

  return (
    <>
      <Button
        size={size}
        variant={variant}
        className={className}
        onClick={() => setOpen(true)}
      >
        <Sparkles className="h-3.5 w-3.5 mr-1 text-violet-300" />
        {label ?? 'Fix Now'}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg">
          {!running ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {r.risk === 'high'
                    ? <AlertTriangle className="h-4 w-4 text-amber-400" />
                    : <ShieldCheck className="h-4 w-4 text-violet-300" />}
                  {r.title}
                </DialogTitle>
                <DialogDescription>{r.why}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className={cn('text-[10px] uppercase', RISK_CLS[r.risk])}>
                    {r.risk} risk
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-violet-400/40 text-violet-200">
                    <Clock className="h-2.5 w-2.5 mr-0.5" /> {mins}
                  </Badge>
                  {r.successRate != null && (
                    <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-200">
                      {r.successRate}% success
                    </Badge>
                  )}
                  {r.reversible && (
                    <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-200">
                      <RotateCw className="h-2.5 w-2.5 mr-0.5" /> reversible
                    </Badge>
                  )}
                  {r.requiresReboot && (
                    <Badge variant="outline" className="text-[10px] border-yellow-500/40 text-yellow-200">
                      may reboot
                    </Badge>
                  )}
                </div>

                <div className="rounded-md border border-border/60 bg-background/40 p-3">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
                    Ray will
                  </div>
                  <ul className="space-y-1 text-sm">
                    {r.previewLines.map((line, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-violet-300">✓</span>
                        <span className="text-foreground/90">{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {!presetTarget && (
                  <TargetPicker
                    remediation={r}
                    value={pickedTarget}
                    onChange={setPickedTarget}
                  />
                )}

                {presetTarget && (
                  <div className="text-[12px] text-muted-foreground">
                    Target: <span className="text-foreground">{presetTarget.label}</span>
                  </div>
                )}

                {needsTyped && target && (
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                      Type the target to confirm
                    </div>
                    <Input
                      placeholder={target.label}
                      value={typedName}
                      onChange={(e) => setTypedName(e.target.value)}
                      className="bg-background/40"
                    />
                    <div className="text-[11px] text-muted-foreground mt-1">
                      Type <span className="text-foreground">{target.label}</span> exactly to unlock this action.
                    </div>
                  </div>
                )}

                {r.risk === 'high' && (
                  <div className="rounded border border-amber-500/40 bg-amber-500/5 p-2.5 text-[12px] text-amber-100">
                    <div className="flex items-center gap-1.5 font-medium mb-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> High-risk action
                    </div>
                    This change can disrupt access.{' '}
                    {r.reversible ? "It's reversible from the catalog." : "It cannot be automatically undone."}
                    {r.requiresReboot && ' The device may reboot to complete.'}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={busy}>
                  Cancel
                </Button>
                <Button onClick={run} disabled={!canRun || busy}>
                  {busy
                    ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
                  {r.risk === 'high' ? 'Confirm and run' : 'Fix Now'}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <RefreshCcw className="h-4 w-4 text-violet-300 animate-spin" />
                  {r.title}
                </DialogTitle>
                <DialogDescription>{target?.label}</DialogDescription>
              </DialogHeader>
              <RemediationRunner
                remediation={r}
                result={running}
                onDone={(final) => {
                  onCompleted?.(final);
                }}
              />
              <DialogFooter>
                <Button variant="ghost" onClick={() => handleOpenChange(false)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default FixNowButton;
