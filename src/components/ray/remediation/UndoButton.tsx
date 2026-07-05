/**
 * UndoButton — reverses a completed remediation by dispatching its inverse.
 *
 * For agent actions the catalog carries `reverseSlug` and the reverse
 * remediation runs like any other. For M365 actions with a captured
 * `previous_state`, the ms-graph-remediate function accepts an
 * `undo_of_audit_id` payload and replays the snapshot.
 */
import { useState } from 'react';
import { Loader2, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getRemediationBySlug } from '@/lib/ray/remediations/catalog';
import { executeRemediation } from '@/lib/ray/remediations/providers';

export interface UndoTargetRow {
  id: string;
  slug: string;
  provider: 'agent' | 'ms365' | 'defender';
  target_id: string;
  target_label: string | null;
  reversible: boolean;
  reverse_slug: string | null;
  lifecycle_state: string | null;
}

interface Props {
  row: UndoTargetRow;
  size?: 'sm' | 'default';
  onDone?: () => void;
}

export function UndoButton({ row, size = 'sm', onDone }: Props) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const disabled = !user || !row.reversible || row.lifecycle_state === 'rolled_back';

  const tooltip = !row.reversible
    ? 'This action cannot be automatically undone.'
    : row.lifecycle_state === 'rolled_back'
      ? 'Already rolled back.'
      : 'Reverse this action.';

  async function undo() {
    if (!user || disabled) return;
    setBusy(true);
    try {
      const reverseSlug = row.reverse_slug ?? undefined;
      if (row.provider === 'agent' && reverseSlug) {
        const reverse = getRemediationBySlug(reverseSlug);
        if (!reverse) throw new Error('reverse_not_in_catalog');
        await executeRemediation(reverse, {
          userId: user.id,
          targetId: row.target_id,
          targetLabel: row.target_label ?? undefined,
          confirmed: true,
          params: { rollback_of: row.id },
        });
      } else if (row.provider === 'ms365' || row.provider === 'defender') {
        const { error } = await supabase.functions.invoke('ms-graph-remediate', {
          body: { undo_of_audit_id: row.id },
        });
        if (error) throw new Error(error.message ?? 'undo_failed');
      } else {
        throw new Error('no_undo_path');
      }
      await supabase
        .from('wrayth_remediation_actions')
        .update({ lifecycle_state: 'rolled_back' })
        .eq('id', row.id);
      toast.success('Ray reversed the change.');
      onDone?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      toast.error(`Undo failed: ${msg}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      size={size}
      variant="outline"
      onClick={undo}
      disabled={disabled || busy}
      title={tooltip}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Undo2 className="h-3.5 w-3.5 mr-1" />}
      Undo
    </Button>
  );
}
