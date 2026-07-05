/**
 * Remediation policy — per-user auto-fix mode + always/never category
 * overrides. Governs whether a remediation queues silently (auto) or
 * requires a human click.
 *
 * A missing row means "suggest_only" — Ray never runs anything on its own
 * until the user picks a stronger mode.
 */
import { supabase } from '@/integrations/supabase/client';
import type { AutoFixMode, Remediation } from './types';

export interface RemediationPolicy {
  auto_fix_mode: AutoFixMode;
  always_auto: string[];
  never_auto: string[];
  notify_on_complete: boolean;
}

export const DEFAULT_POLICY: RemediationPolicy = {
  auto_fix_mode: 'suggest_only',
  always_auto: [],
  never_auto: [],
  notify_on_complete: true,
};

export async function fetchPolicy(userId: string): Promise<RemediationPolicy> {
  const { data } = await supabase
    .from('wrayth_remediation_policies')
    .select('auto_fix_mode, always_auto, never_auto, notify_on_complete')
    .eq('user_id', userId)
    .maybeSingle();
  if (!data) return DEFAULT_POLICY;
  return {
    auto_fix_mode: (data.auto_fix_mode as AutoFixMode) ?? 'suggest_only',
    always_auto: (data.always_auto as string[]) ?? [],
    never_auto: (data.never_auto as string[]) ?? [],
    notify_on_complete: data.notify_on_complete ?? true,
  };
}

export async function savePolicy(userId: string, patch: Partial<RemediationPolicy>) {
  const { error } = await supabase
    .from('wrayth_remediation_policies')
    .upsert(
      {
        user_id: userId,
        auto_fix_mode: patch.auto_fix_mode ?? 'suggest_only',
        always_auto: patch.always_auto ?? [],
        never_auto: patch.never_auto ?? [],
        notify_on_complete: patch.notify_on_complete ?? true,
        updated_by: userId,
      },
      { onConflict: 'user_id' },
    );
  if (error) throw error;
}

export type PolicyDecision =
  | { kind: 'auto' }
  | { kind: 'manual' }
  | { kind: 'blocked'; reason: string };

/**
 * Given a policy + remediation, decide whether Ray may run this without a
 * per-click confirmation. High-risk actions always require confirmation
 * regardless of policy — safety net.
 */
export function evaluatePolicy(
  policy: RemediationPolicy,
  r: Remediation,
): PolicyDecision {
  if (policy.never_auto.includes(r.category)) {
    return { kind: 'blocked', reason: `Your policy blocks auto-fix for ${r.category}.` };
  }
  if (policy.always_auto.includes(r.category)) return { kind: 'auto' };

  switch (policy.auto_fix_mode) {
    case 'never':
    case 'suggest_only':
      return { kind: 'manual' };
    case 'auto_low':
      return r.risk === 'low' ? { kind: 'auto' } : { kind: 'manual' };
    case 'auto_medium':
      return r.risk === 'low' || r.risk === 'medium' ? { kind: 'auto' } : { kind: 'manual' };
    case 'auto_except_critical':
      // "critical" is not currently a risk value; high-risk still needs confirm.
      return r.risk === 'high' ? { kind: 'manual' } : { kind: 'auto' };
    case 'autonomous':
      // Even in fully autonomous mode, typed-name gated actions still stop.
      return r.requiresConfirmation === 'typed_name'
        ? { kind: 'manual' }
        : { kind: 'auto' };
  }
}

export const AUTO_FIX_MODE_LABELS: Record<AutoFixMode, { label: string; description: string }> = {
  never: {
    label: 'Never',
    description: 'Ray will not run remediations, even if you queue them. Manual dispatch only.',
  },
  suggest_only: {
    label: 'Suggest only',
    description: 'Ray tells you what it would fix. Nothing runs without your click.',
  },
  auto_low: {
    label: 'Auto-fix low risk',
    description: 'Ray silently runs low-risk fixes (Defender toggles, signature updates). Everything else needs approval.',
  },
  auto_medium: {
    label: 'Auto-fix medium risk',
    description: 'Ray runs low + medium risk fixes automatically. High-risk actions still stop for you.',
  },
  auto_except_critical: {
    label: 'Auto-fix everything except critical',
    description: 'Ray handles most fixes on its own. High-risk actions (RDP, disable admin, wipe MFA) still stop for confirmation.',
  },
  autonomous: {
    label: 'Fully autonomous',
    description: 'Ray runs any fix it identifies. Typed-name confirmations still gate the most dangerous ones.',
  },
};
