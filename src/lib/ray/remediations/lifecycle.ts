/**
 * Lifecycle helpers for queued/approved/running/completed remediations.
 *
 * The unified `wrayth_remediation_actions` table stores every step; this
 * module exposes typed status transitions the UI and edge functions can
 * both call.
 */
import { supabase } from '@/integrations/supabase/client';
import type { LifecycleState, Remediation } from './types';

export const LIFECYCLE_LABEL: Record<LifecycleState, string> = {
  queued: 'Queued',
  pending_approval: 'Pending approval',
  approved: 'Approved',
  running: 'Running',
  verifying: 'Verifying',
  completed: 'Completed',
  failed: 'Failed',
  rolled_back: 'Rolled back',
  cancelled: 'Cancelled',
};

export const LIFECYCLE_COLOR: Record<LifecycleState, string> = {
  queued: 'border-border text-muted-foreground',
  pending_approval: 'border-amber-500/40 text-amber-200',
  approved: 'border-blue-500/40 text-blue-200',
  running: 'border-violet-400/40 text-violet-200',
  verifying: 'border-violet-400/40 text-violet-200',
  completed: 'border-emerald-500/40 text-emerald-200',
  failed: 'border-red-500/40 text-red-300',
  rolled_back: 'border-emerald-500/40 text-emerald-200',
  cancelled: 'border-border text-muted-foreground',
};

/** Insert a new queued row without executing it. Used by batch flow + chains. */
export async function enqueueRemediation(params: {
  userId: string;
  remediation: Remediation;
  targetId: string;
  targetLabel?: string | null;
  params?: Record<string, unknown>;
  scheduledFor?: Date | null;
  chainId?: string | null;
  chainStepIndex?: number | null;
  autoApproved?: boolean;
  approvedBy?: string | null;
  confidence?: number | null;
}): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('wrayth_remediation_actions')
    // deno-lint-ignore no-explicit-any
    .insert({
      user_id: params.userId,
      provider: params.remediation.provider,
      slug: params.remediation.slug,
      action_type: params.remediation.action_type,
      category: params.remediation.category,
      risk: params.remediation.risk,
      target_type: params.remediation.target,
      target_id: params.targetId,
      target_label: params.targetLabel ?? null,
      status: 'pending',
      lifecycle_state: params.autoApproved ? 'approved' : 'queued',
      params: (params.params ?? {}) as never,
      requires_reboot: !!params.remediation.requiresReboot,
      reversible: !!params.remediation.reversible,
      reverse_slug: params.remediation.reverseSlug ?? null,
      confirmed_by_user: !!params.autoApproved,
      scheduled_for: params.scheduledFor ? params.scheduledFor.toISOString() : null,
      chain_id: params.chainId ?? null,
      chain_step_index: params.chainStepIndex ?? null,
      approved_by: params.autoApproved ? params.approvedBy ?? params.userId : null,
      approved_at: params.autoApproved ? new Date().toISOString() : null,
      source_label: params.remediation.sourceLabel ?? null,
      confidence: params.confidence ?? params.remediation.confidenceHint ?? null,
      permission_scopes: params.remediation.requiredPermissions ?? [],
       
    } as any)
    .select('id')
    .single();
  if (error) throw error;
  return { id: data!.id as string };
}

export async function approveRemediation(id: string, userId: string) {
  const { error } = await supabase
    .from('wrayth_remediation_actions')
    .update({
      lifecycle_state: 'approved',
      approved_by: userId,
      approved_at: new Date().toISOString(),
      confirmed_by_user: true,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function cancelRemediation(id: string) {
  const { error } = await supabase
    .from('wrayth_remediation_actions')
    .update({ lifecycle_state: 'cancelled', status: 'cancelled' })
    .eq('id', id);
  if (error) throw error;
}
