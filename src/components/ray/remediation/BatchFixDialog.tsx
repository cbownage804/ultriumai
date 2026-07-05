/**
 * BatchFixDialog — queues every resolved pending remediation for the user.
 * Each fix goes into `wrayth_remediation_actions` as `queued` (or
 * `approved` if the policy allows), and is then picked up per-target.
 *
 * MVP: for actions targeting a single device (and the user has exactly
 * one enrolled device), Ray dispatches immediately. Otherwise the item is
 * queued for the queue page where the operator picks targets.
 */
import { useEffect, useMemo, useState } from 'react';
import { Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { enqueueRemediation } from '@/lib/ray/remediations/lifecycle';
import { evaluatePolicy, fetchPolicy, type RemediationPolicy, DEFAULT_POLICY } from '@/lib/ray/remediations/policy';
import type { ResolvedRemediation, RayRecommendationLite } from '@/lib/ray/remediations/resolver';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pairs: Array<{ rec: RayRecommendationLite; resolved: ResolvedRemediation }>;
  onDone?: () => void;
}

interface DeviceOpt { id: string; label: string }

export function BatchFixDialog({ open, onOpenChange, pairs, onDone }: Props) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [devices, setDevices] = useState<DeviceOpt[] | null>(null);
  const [policy, setPolicy] = useState<RemediationPolicy>(DEFAULT_POLICY);
  const [results, setResults] = useState<Array<{ slug: string; ok: boolean; msg?: string }>>([]);

  useEffect(() => {
    if (!open || !user?.id) return;
    (async () => {
      const { data } = await supabase
        .from('wrayth_devices')
        .select('id, hostname, revoked_at')
        .eq('user_id', user.id)
        .is('revoked_at', null)
        .order('last_seen_at', { ascending: false });
      setDevices(
        (data ?? []).map((d) => ({
          id: (d as { id: string }).id,
          label: ((d as { hostname: string | null }).hostname) ?? 'Unnamed device',
        })),
      );
      setPolicy(await fetchPolicy(user.id));
    })();
  }, [open, user?.id]);

  const singleDevice = devices && devices.length === 1 ? devices[0] : null;

  const totalSeconds = useMemo(
    () => pairs.reduce((n, p) => n + p.resolved.remediation.estimatedSeconds, 0),
    [pairs],
  );

  async function run() {
    if (!user) return;
    setBusy(true);
    setResults([]);
    const out: Array<{ slug: string; ok: boolean; msg?: string }> = [];
    for (const { resolved, rec } of pairs) {
      const r = resolved.remediation;
      const decision = evaluatePolicy(policy, r);
      try {
        let targetId: string | null = null;
        let targetLabel: string | null = null;

        if (r.target === 'device') {
          if (!singleDevice) {
            out.push({ slug: r.slug, ok: false, msg: 'Pick a device in the queue page.' });
            continue;
          }
          targetId = singleDevice.id;
          targetLabel = singleDevice.label;
        } else if (r.target === 'user') {
          // For user-scoped fixes we always queue (operator picks the user in the queue page).
          out.push({ slug: r.slug, ok: false, msg: 'Queued — choose a user in the queue.' });
          await enqueueRemediation({
            userId: user.id,
            remediation: r,
            targetId: 'unassigned',
            targetLabel: rec.title,
            autoApproved: decision.kind === 'auto',
            confidence: resolved.confidence,
          });
          continue;
        }

        if (!targetId) continue;

        await enqueueRemediation({
          userId: user.id,
          remediation: r,
          targetId,
          targetLabel,
          autoApproved: decision.kind === 'auto',
          confidence: resolved.confidence,
        });
        out.push({ slug: r.slug, ok: true });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'unknown';
        out.push({ slug: r.slug, ok: false, msg });
      }
    }
    setResults(out);
    setBusy(false);
    const okCount = out.filter((x) => x.ok).length;
    toast.success(`Ray queued ${okCount} fix${okCount === 1 ? '' : 'es'}.`, {
      description: 'Check the Remediation Queue to review or approve.',
    });
    onDone?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-300" />
            Fix everything
          </DialogTitle>
          <DialogDescription>
            Ray will queue {pairs.length} action{pairs.length === 1 ? '' : 's'}.
            Estimated total time ~{totalSeconds >= 60 ? `${Math.round(totalSeconds / 60)}m` : `${totalSeconds}s`}.
            Actions matching your auto-fix policy run immediately; everything else waits in the queue for your approval.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-1.5 max-h-64 overflow-y-auto">
          {pairs.map(({ resolved }) => {
            const r = resolved.remediation;
            const res = results.find((x) => x.slug === r.slug);
            return (
              <li key={r.slug} className="flex items-center gap-3 rounded border border-border/60 bg-background/40 px-3 py-2 text-sm">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{r.title}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{r.summary}</div>
                </div>
                {res ? (
                  res.ok
                    ? <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" /> queued</Badge>
                    : <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-200" title={res.msg}><AlertCircle className="h-3 w-3 mr-1" /> {res.msg ? 'note' : 'failed'}</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">pending</Badge>
                )}
              </li>
            );
          })}
        </ul>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={run} disabled={busy || pairs.length === 0}>
            {busy ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
            Queue {pairs.length} fix{pairs.length === 1 ? '' : 'es'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
