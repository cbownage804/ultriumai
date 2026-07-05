/**
 * Provider-agnostic remediation contract.
 *
 * Every one-click Fix Now action in Wrayth — whether it runs on a Windows
 * agent, calls Microsoft Graph, or hits a future third-party integration —
 * conforms to this shape. New providers (Meraki, Huntress, Datto, etc.)
 * plug into the executor registry without touching the UI.
 */

export type ProviderId = 'agent' | 'ms365' | 'defender';

export type RemediationCategory =
  // Endpoint
  | 'encryption'
  | 'defender'
  | 'firewall'
  | 'remote_access'
  | 'accounts'
  | 'updates'
  | 'session'
  | 'browser'
  // Cloud identity / mail
  | 'identity'
  | 'mail'
  | 'session_cloud';

export type RemediationRisk = 'low' | 'medium' | 'high';

export type ConfirmMode = 'none' | 'confirm' | 'typed_name' | 'two_person';

export type TargetKind = 'device' | 'user' | 'tenant' | 'message';

export interface Remediation {
  /** Stable slug used in URLs, telemetry, and cross-referencing recs. */
  slug: string;
  title: string;
  /** One-line plain-English description shown on the card. */
  summary: string;
  /** Longer "why this matters" copy — Ray's rationale. */
  why: string;
  category: RemediationCategory;
  risk: RemediationRisk;
  provider: ProviderId;
  /** Provider-native action id (agent action_type, Graph verb, etc.). */
  action_type: string;
  /** Permission scopes required by the executor (soft check + UX copy). */
  requiredPermissions?: string[];
  requiresConfirmation: ConfirmMode;
  requiresReboot?: boolean;
  reversible: boolean;
  reverseSlug?: string;
  /** Approx duration in seconds (post-dispatch). */
  estimatedSeconds: number;
  /** Rough historical success rate for UX copy, 0–100. */
  successRate?: number;
  target: TargetKind;
  /** Windows-only for now; empty means non-endpoint (cloud) target. */
  platforms?: Array<'windows' | 'macos' | 'linux'>;
  /** Default params bag sent to the executor. */
  defaultParams?: Record<string, unknown>;
  /** Human-readable preview bullets rendered as "Ray will: …". */
  previewLines: string[];
}

export const CATEGORY_LABELS: Record<RemediationCategory, string> = {
  encryption: 'Disk encryption',
  defender: 'Defender & antivirus',
  firewall: 'Firewall',
  remote_access: 'Remote access',
  accounts: 'Accounts & admins',
  updates: 'Updates & patching',
  session: 'Session control',
  browser: 'Browser hygiene',
  identity: 'Identity (Entra ID)',
  mail: 'Mail (Exchange Online)',
  session_cloud: 'Cloud sessions',
};

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  agent: 'Wrayth Agent',
  ms365: 'Microsoft 365',
  defender: 'Defender for O365',
};
