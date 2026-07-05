/**
 * Remediation chains — reusable multi-step response workflows Ray can run
 * end-to-end. Each step is one Remediation slug. Chains are seeded in the
 * `wrayth_remediation_chains` table and executed one step at a time by
 * dispatching each as its own `wrayth_remediation_actions` row.
 */
import { supabase } from '@/integrations/supabase/client';
import type { Remediation } from './types';
import { getRemediationBySlug } from './catalog';
import { enqueueRemediation } from './lifecycle';

export interface ChainStep {
  slug: string;
  /** If true, halt the chain when this step fails; else continue. */
  halt_on_fail?: boolean;
  /** Seconds to wait after dispatch before advancing (verify windows). */
  wait_seconds?: number;
  /** Optional per-step param overrides. */
  params?: Record<string, unknown>;
}

export interface RemediationChain {
  id: string;
  name: string;
  description: string | null;
  trigger_slug: string | null;
  steps: ChainStep[];
  active: boolean;
}

/** Built-in chain templates — seeded on first use, editable by the user later. */
export const CHAIN_TEMPLATES: Array<Omit<RemediationChain, 'id' | 'active'>> = [
  {
    name: 'Compromised M365 account',
    description: 'Full containment for a suspected account takeover: reset password, revoke every session, wipe MFA registrations.',
    trigger_slug: 'account_compromise_suspected',
    steps: [
      { slug: 'ms365-force-password-reset', halt_on_fail: true },
      { slug: 'ms365-revoke-sessions', halt_on_fail: true },
      { slug: 'ms365-reset-mfa-methods' },
    ],
  },
  {
    name: 'Weak password response',
    description: 'A weak or breached password was detected — force a reset and kick every session.',
    trigger_slug: 'weak_password_detected',
    steps: [
      { slug: 'ms365-force-password-reset', halt_on_fail: true },
      { slug: 'ms365-revoke-sessions' },
    ],
  },
  {
    name: 'Endpoint hardening baseline',
    description: 'Enable Defender, cloud protection, PUA, firewall, and Windows updates on a device in one pass.',
    trigger_slug: 'endpoint_baseline_missing',
    steps: [
      { slug: 'enable-defender' },
      { slug: 'enable-defender-cloud' },
      { slug: 'enable-defender-pua' },
      { slug: 'enable-firewall' },
      { slug: 'update-defender-signatures' },
    ],
  },
];

export async function listChains(userId: string): Promise<RemediationChain[]> {
  const { data } = await supabase
    .from('wrayth_remediation_chains')
    .select('id, name, description, trigger_slug, steps, active')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  return (data ?? []).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    description: (r.description as string | null) ?? null,
    trigger_slug: (r.trigger_slug as string | null) ?? null,
    steps: (r.steps as unknown as ChainStep[]) ?? [],
    active: !!r.active,
  }));
}

/**
 * Dispatch a chain by seeding a queued row for each step. The queue
 * processor (or the UI runner) advances them in order.
 */
export async function dispatchChain(params: {
  userId: string;
  chain: RemediationChain;
  targetId: string;
  targetLabel?: string | null;
  autoApproved?: boolean;
}): Promise<{ chainRunId: string; rows: Array<{ id: string; remediation: Remediation }> }> {
  const chainRunId = crypto.randomUUID();
  const rows: Array<{ id: string; remediation: Remediation }> = [];
  for (let i = 0; i < params.chain.steps.length; i++) {
    const step = params.chain.steps[i];
    const remediation = getRemediationBySlug(step.slug);
    if (!remediation) continue;
    const { id } = await enqueueRemediation({
      userId: params.userId,
      remediation,
      targetId: params.targetId,
      targetLabel: params.targetLabel ?? null,
      params: step.params ?? {},
      chainId: chainRunId,
      chainStepIndex: i,
      autoApproved: !!params.autoApproved,
    });
    rows.push({ id, remediation });
  }
  return { chainRunId, rows };
}
