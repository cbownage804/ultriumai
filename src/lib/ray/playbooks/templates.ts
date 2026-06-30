/**
 * Ray playbook templates — composable, conversational security workflows.
 *
 * Each template references tasks from the catalog. Templates are pure data;
 * the engine snapshots them into a `ray_playbook_runs.tasks` jsonb so
 * future template edits never mutate past runs.
 */
import type { RayTaskId } from './catalog';

export type PlaybookCategory =
  | 'account'
  | 'credential'
  | 'identity'
  | 'device'
  | 'exposure'
  | 'mfa'
  | 'passkey';

export type PlaybookTemplate = {
  slug: string;
  title: string;
  description: string;
  category: PlaybookCategory;
  estimated_minutes: number;
  reward_score: number;
  /** Steps Ray walks through in order. */
  steps: Array<{
    task: RayTaskId;
    /** Override the catalog's default prompt for this playbook (optional). */
    rayPrompt?: string;
    /** Optional external URL Ray asks the user to open at this step. */
    externalUrl?: string;
    externalLabel?: string;
  }>;
  /** Final words from Ray when the playbook completes. */
  completion: string;
};

export const PLAYBOOK_TEMPLATES: PlaybookTemplate[] = [
  {
    slug: 'secure-google',
    title: 'Secure your Google account',
    description: "Lock down the account most attackers try first.",
    category: 'account',
    estimated_minutes: 4,
    reward_score: 8,
    steps: [
      { task: 'review_password_strength' },
      { task: 'enable_mfa', externalUrl: 'https://myaccount.google.com/security', externalLabel: 'Open Google Security' },
      { task: 'store_recovery_codes' },
      { task: 'add_passkey', externalUrl: 'https://myaccount.google.com/signinoptions/passkeys', externalLabel: 'Open Google Passkeys' },
      { task: 'verify_recovery_email' },
    ],
    completion:
      "Your Google account is now protected with MFA and a passkey. I'll keep monitoring it.",
  },
  {
    slug: 'secure-microsoft',
    title: 'Secure your Microsoft account',
    description: 'Tighten the account that backs your email, files, and devices.',
    category: 'account',
    estimated_minutes: 6,
    reward_score: 12,
    steps: [
      { task: 'review_account', externalUrl: 'https://account.microsoft.com/security', externalLabel: 'Open Microsoft Security' },
      { task: 'enable_mfa' },
      { task: 'review_admin_permissions' },
      { task: 'verify_recovery_email' },
      { task: 'add_passkey' },
    ],
    completion:
      "Microsoft is secured end-to-end. Email, files, and devices all benefit from this work.",
  },
  {
    slug: 'resolve-credential-exposure',
    title: 'Resolve a credential exposure',
    description: 'A password tied to one of your accounts showed up in a breach. Let\'s rotate it.',
    category: 'credential',
    estimated_minutes: 3,
    reward_score: 6,
    steps: [
      { task: 'review_breach' },
      { task: 'generate_password' },
      { task: 'update_password' },
      { task: 'confirm_breach_resolved' },
    ],
    completion:
      "Exposure closed. New password is unique, strong, and saved to your Vault.",
  },
  {
    slug: 'password-replacement',
    title: 'Replace a weak password',
    description: 'Swap a weak or reused password for a strong, unique one.',
    category: 'credential',
    estimated_minutes: 3,
    reward_score: 5,
    steps: [
      { task: 'review_password_strength' },
      { task: 'generate_password' },
      { task: 'update_password' },
      { task: 'confirm_done' },
    ],
    completion:
      "Stronger password, safely stored. One more weak spot off the list.",
  },
  {
    slug: 'mfa-setup',
    title: 'Turn on two-factor authentication',
    description: 'Add the single biggest protection an account can have.',
    category: 'mfa',
    estimated_minutes: 3,
    reward_score: 7,
    steps: [
      { task: 'enable_mfa' },
      { task: 'store_recovery_codes' },
      { task: 'confirm_done' },
    ],
    completion:
      "MFA is on. Even if someone steals the password, they're not getting in.",
  },
  {
    slug: 'passkey-upgrade',
    title: 'Upgrade to a passkey',
    description: 'Move past passwords on accounts that support passkeys.',
    category: 'passkey',
    estimated_minutes: 2,
    reward_score: 4,
    steps: [
      { task: 'add_passkey' },
      { task: 'confirm_done' },
    ],
    completion:
      "Passkey added. Faster sign-in, nothing to phish.",
  },
  {
    slug: 'protect-identity',
    title: 'Protect your identity',
    description: "Tell Ray which emails and details to watch on the dark web.",
    category: 'identity',
    estimated_minutes: 3,
    reward_score: 5,
    steps: [
      { task: 'add_watched_email' },
      { task: 'scan_identity' },
      { task: 'review_exposure' },
    ],
    completion:
      "I'm now watching your identity. You'll hear from me the moment something shows up.",
  },
  {
    slug: 'verify-devices',
    title: 'Verify your devices',
    description: 'Confirm the devices that should have access to your accounts.',
    category: 'device',
    estimated_minutes: 3,
    reward_score: 4,
    steps: [
      { task: 'verify_device' },
      { task: 'revoke_unknown_sessions' },
      { task: 'confirm_done' },
    ],
    completion:
      "Only the devices you trust can reach your accounts.",
  },
];

export function findTemplate(slug: string): PlaybookTemplate | undefined {
  return PLAYBOOK_TEMPLATES.find((t) => t.slug === slug);
}
