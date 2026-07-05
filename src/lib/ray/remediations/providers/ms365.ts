/**
 * Microsoft 365 executor — calls the `ms-graph-remediate` edge function
 * and records the audit row synchronously. Cloud actions complete inline;
 * no async agent polling.
 */
import { supabase } from '@/integrations/supabase/client';
import type { Remediation } from '../types';
import type { ExecuteContext, ExecuteResult } from './types';

export async function executeMs365Remediation(
  r: Remediation,
  ctx: ExecuteContext,
): Promise<ExecuteResult> {
  const started = Date.now();

  // Pre-write the audit row as "running" so Timeline / Runner see it.
  const { data: audit, error: auditErr } = await supabase
    .from('wrayth_remediation_actions')
    .insert({
      user_id: ctx.userId,
      provider: 'ms365',
      slug: r.slug,
      action_type: r.action_type,
      category: r.category,
      risk: r.risk,
      target_type: r.target,
      target_id: ctx.targetId,
      target_label: ctx.targetLabel ?? null,
      status: 'running',
      params: ctx.params ?? {},
      reversible: !!r.reversible,
      reverse_slug: r.reverseSlug ?? null,
      confirmed_by_user: ctx.confirmed,
      permission_scopes: r.requiredPermissions ?? [],
    })
    .select('id')
    .single();
  if (auditErr) throw new Error(auditErr.message);
  const auditId = (audit?.id as string) ?? null;

  const { data, error } = await supabase.functions.invoke('ms-graph-remediate', {
    body: {
      action_type: r.action_type,
      target_id: ctx.targetId,
      params: ctx.params ?? {},
      audit_id: auditId,
    },
  });

  const duration = Date.now() - started;
  const payload = data as { ok?: boolean; error?: string; result?: unknown; previous?: unknown; new?: unknown } | null;

  if (error || payload?.error) {
    const msg = error?.message ?? payload?.error ?? 'remediation_failed';
    if (auditId) {
      await supabase.from('wrayth_remediation_actions').update({
        status: 'failed',
        error: msg,
        duration_ms: duration,
      }).eq('id', auditId);
    }
    throw new Error(msg);
  }

  if (auditId) {
    await supabase.from('wrayth_remediation_actions').update({
      status: 'succeeded',
      result: payload?.result ?? null,
      previous_state: payload?.previous ?? null,
      new_state: payload?.new ?? null,
      duration_ms: duration,
    }).eq('id', auditId);
  }

  return {
    auditId,
    agentActionId: null,
    startedAt: started,
    kind: 'inline',
    result: payload?.result ?? null,
  };
}
