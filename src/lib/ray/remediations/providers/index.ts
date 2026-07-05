/**
 * Executor registry — routes a Remediation to the right provider executor
 * by `provider` field. Adding a new provider only requires implementing
 * one more executor and registering it here.
 */
import type { Remediation } from '../types';
import type { ExecuteContext, ExecuteResult } from './types';
import { executeAgentRemediation } from './agent';
import { executeMs365Remediation } from './ms365';

export type { ExecuteContext, ExecuteResult } from './types';

const EXECUTORS = {
  agent: executeAgentRemediation,
  ms365: executeMs365Remediation,
  defender: executeMs365Remediation, // Defender for O365 rides the Graph executor for now
} as const;

export async function executeRemediation(
  r: Remediation,
  ctx: ExecuteContext,
): Promise<ExecuteResult> {
  const fn = EXECUTORS[r.provider];
  if (!fn) throw new Error(`no_executor:${r.provider}`);
  return fn(r, ctx);
}
