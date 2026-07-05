/**
 * Agent executor — dispatches a remediation to a Wrayth-enrolled Windows
 * device via `agent-action-request`, then records the audit row in the
 * unified `wrayth_remediation_actions` table.
 */
import { supabase } from '@/integrations/supabase/client';
import type { Remediation } from '../types';
import type { ExecuteContext, ExecuteResult } from './types';

export async function executeAgentRemediation(
  r: Remediation,
  ctx: ExecuteContext,
): Promise<ExecuteResult> {
  const started = Date.now();
  const params = { ...(r.defaultParams ?? {}), ...(ctx.params ?? {}) };

  const { data, error } = await supabase.functions.invoke('agent-action-request', {
    body: {
      device_id: ctx.targetId,
      action_type: r.action_type,
      params,
      confirmed: ctx.confirmed,
    },
  });
  if (error) throw new Error(error.message ?? 'dispatch_failed');
  const payload = data as { ok?: boolean; action?: { id?: string }; error?: string };
  if (payload?.error) throw new Error(payload.error);

  const agentActionId = payload?.action?.id ?? null;

  // Mirror to the unified audit table so Timeline sees it immediately.
  const { data: audit } = await supabase
    .from('wrayth_remediation_actions')
    .insert({
      user_id: ctx.userId,
      provider: 'agent',
      slug: r.slug,
      action_type: r.action_type,
      category: r.category,
      risk: r.risk,
      target_type: 'device',
      target_id: ctx.targetId,
      target_label: ctx.targetLabel ?? null,
      status: 'pending',
      params,
      requires_reboot: !!r.requiresReboot,
      reversible: !!r.reversible,
      reverse_slug: r.reverseSlug ?? null,
      confirmed_by_user: ctx.confirmed || r.risk !== 'high',
      agent_action_id: agentActionId,
    })
    .select('id')
    .single();

  return {
    auditId: (audit?.id as string) ?? null,
    agentActionId,
    startedAt: started,
    kind: 'queued', // agent runs asynchronously on next check-in
  };
}
