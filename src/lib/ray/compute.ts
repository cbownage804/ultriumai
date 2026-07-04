/**
 * Ray Compute (RC) — the single usage meter for Wrayth.
 *
 * Ray conversations, monitoring, recommendations, briefings, threat analysis,
 * and the password manager are ALL included with every paid plan (and most
 * with Free). Ray Compute is spent only on genuinely expensive AI workloads.
 *
 * This module is the single source of truth for what those actions are and
 * how much they cost. UI badges (`Uses N Ray Compute`) and backend charging
 * both read from here so a Pro user seeing "3 RC" on Deep Investigation
 * gets billed exactly 3 RC when they run it.
 */

export type RayComputeAction =
  | 'deep_threat_investigation'
  | 'malware_analysis'
  | 'large_log_analysis'
  | 'compliance_gap_report'
  | 'executive_report'
  | 'attack_path_analysis'
  | 'policy_generation'
  | 'incident_timeline'
  | 'script_rewrite'
  | 'powershell_explanation';

export interface RayComputeActionDef {
  id: RayComputeAction;
  label: string;
  cost: number;
  description: string;
  /** Which capability tier this action lives under. */
  category: 'investigation' | 'reporting' | 'automation' | 'analysis';
}

export const RAY_COMPUTE_ACTIONS: Record<RayComputeAction, RayComputeActionDef> = {
  deep_threat_investigation: {
    id: 'deep_threat_investigation',
    label: 'Deep Threat Investigation',
    cost: 3,
    description: 'Multi-source threat correlation, IOC pivot, and containment plan.',
    category: 'investigation',
  },
  malware_analysis: {
    id: 'malware_analysis',
    label: 'Malware Analysis',
    cost: 3,
    description: 'Static + behavioral analysis of a suspicious file or hash.',
    category: 'analysis',
  },
  large_log_analysis: {
    id: 'large_log_analysis',
    label: 'Large Log Analysis',
    cost: 5,
    description: 'Timeline reconstruction across large log corpora.',
    category: 'analysis',
  },
  compliance_gap_report: {
    id: 'compliance_gap_report',
    label: 'Compliance Gap Report',
    cost: 5,
    description: 'Framework-scoped audit with prioritized remediation.',
    category: 'reporting',
  },
  executive_report: {
    id: 'executive_report',
    label: 'Executive Report',
    cost: 5,
    description: 'Board-ready security posture and risk narrative.',
    category: 'reporting',
  },
  attack_path_analysis: {
    id: 'attack_path_analysis',
    label: 'Attack Path Analysis',
    cost: 4,
    description: 'Graph-based reasoning across identity, endpoint, and cloud.',
    category: 'analysis',
  },
  policy_generation: {
    id: 'policy_generation',
    label: 'Policy Generation',
    cost: 2,
    description: 'Draft a policy tailored to your organization and framework.',
    category: 'automation',
  },
  incident_timeline: {
    id: 'incident_timeline',
    label: 'Incident Timeline',
    cost: 2,
    description: 'Consolidated who/what/when across all telemetry.',
    category: 'investigation',
  },
  script_rewrite: {
    id: 'script_rewrite',
    label: 'Script Rewrite',
    cost: 1,
    description: 'Refactor or harden a script (PowerShell, bash, Python).',
    category: 'automation',
  },
  powershell_explanation: {
    id: 'powershell_explanation',
    label: 'PowerShell Explanation',
    cost: 1,
    description: 'Line-by-line explanation of a script or command.',
    category: 'analysis',
  },
};

export const RAY_COMPUTE_ACTION_LIST: RayComputeActionDef[] = Object.values(RAY_COMPUTE_ACTIONS);

export function rayComputeCost(action: RayComputeAction): number {
  return RAY_COMPUTE_ACTIONS[action].cost;
}

export function formatRayCompute(n: number): string {
  return `${n} RC`;
}
