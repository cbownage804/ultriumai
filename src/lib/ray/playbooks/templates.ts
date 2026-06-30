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
  {
    slug: 'breach-response-full',
    title: 'Full breach response',
    description: "A serious exposure needs more than a new password. Let's run the full response.",
    category: 'credential',
    estimated_minutes: 10,
    reward_score: 14,
    steps: [
      { task: 'review_breach' },
      { task: 'rotate_password_immediately' },
      { task: 'generate_password' },
      { task: 'update_password' },
      { task: 'change_security_questions' },
      { task: 'revoke_unknown_sessions' },
      { task: 'enable_mfa' },
      { task: 'enable_breach_alerts' },
      { task: 'notify_affected_contacts' },
      { task: 'confirm_breach_resolved' },
    ],
    completion:
      "Containment, rotation, and monitoring are all in place. The exposure is closed.",
  },
  {
    slug: 'mfa-enroll-everywhere',
    title: 'Enroll strong MFA everywhere',
    description: 'Move every important account onto authenticator apps or security keys.',
    category: 'mfa',
    estimated_minutes: 8,
    reward_score: 12,
    steps: [
      { task: 'enroll_authenticator_app' },
      { task: 'enroll_security_key' },
      { task: 'store_recovery_codes' },
      { task: 'remove_sms_2fa' },
      { task: 'confirm_done' },
    ],
    completion:
      "Strong MFA is live. SMS is out of the picture — that's a big jump in resilience.",
  },
  {
    slug: 'exposure-cleanup',
    title: 'Clean up your exposure',
    description: "Reduce what's findable about you online, then keep watch.",
    category: 'exposure',
    estimated_minutes: 12,
    reward_score: 10,
    steps: [
      { task: 'scan_identity' },
      { task: 'review_exposure' },
      { task: 'request_data_removal' },
      { task: 'add_watched_email' },
      { task: 'enable_breach_alerts' },
      { task: 'confirm_done' },
    ],
    completion:
      "Your footprint is smaller and I'm watching what's left. Expect a quieter inbox.",
  },
  {
    slug: 'oauth-app-audit',
    title: 'Audit connected apps',
    description: 'Remove apps with access to your account that you no longer trust or use.',
    category: 'account',
    estimated_minutes: 4,
    reward_score: 6,
    steps: [
      { task: 'audit_oauth_apps', externalUrl: 'https://myaccount.google.com/permissions', externalLabel: 'Open Google connected apps' },
      { task: 'disconnect_unused_apps' },
      { task: 'confirm_done' },
    ],
    completion:
      "Connected-app sprawl trimmed. Fewer ways in if any of those apps gets breached.",
  },
  {
    slug: 'freeze-credit',
    title: 'Freeze your credit',
    description: 'Block new accounts from being opened in your name at all three bureaus.',
    category: 'identity',
    estimated_minutes: 10,
    reward_score: 10,
    steps: [
      { task: 'freeze_credit_bureau', externalUrl: 'https://www.equifax.com/personal/credit-report-services/credit-freeze/', externalLabel: 'Equifax freeze' },
      { task: 'freeze_credit_bureau', externalUrl: 'https://www.experian.com/freeze/center.html', externalLabel: 'Experian freeze' },
      { task: 'freeze_credit_bureau', externalUrl: 'https://www.transunion.com/credit-freeze', externalLabel: 'TransUnion freeze' },
      { task: 'set_fraud_alert' },
      { task: 'confirm_done' },
    ],
    completion:
      "All three bureaus frozen. New credit can't be opened without you unfreezing first.",
  },
  // ── Wrayth 3.2 — Mission playbooks ─────────────────────────────────────
  {
    slug: 'identity-protection',
    title: 'Protect your identity end-to-end',
    description: "Add an email, verify it's yours, scan for breaches, and keep watch.",
    category: 'identity',
    estimated_minutes: 5,
    reward_score: 9,
    steps: [
      { task: 'add_watched_email' },
      { task: 'verify_email_ownership' },
      { task: 'scan_identity' },
      { task: 'review_exposure' },
      { task: 'monitor_identity_continuously' },
    ],
    completion: "Your identity is verified, scanned, and under continuous watch. I've got this.",
  },
  {
    slug: 'password-cleanup',
    title: 'Clean up every weak, reused, or exposed password',
    description: "Sweep the Vault: weak, reused, old, and compromised — handled one by one.",
    category: 'credential',
    estimated_minutes: 12,
    reward_score: 15,
    steps: [
      { task: 'review_weak_passwords' },
      { task: 'review_reused_passwords' },
      { task: 'review_old_passwords' },
      { task: 'review_compromised_passwords' },
      { task: 'confirm_done' },
    ],
    completion: "Your Vault is clean. Every credential is strong, unique, and current.",
  },
  {
    slug: 'secure-microsoft-365',
    title: 'Secure Microsoft 365',
    description: "MFA, Conditional Access, no legacy auth, recovery in place, admins reviewed.",
    category: 'account',
    estimated_minutes: 12,
    reward_score: 18,
    steps: [
      { task: 'enable_mfa', externalUrl: 'https://admin.microsoft.com', externalLabel: 'Open Microsoft 365 admin' },
      { task: 'configure_conditional_access', externalUrl: 'https://entra.microsoft.com/#view/Microsoft_AAD_ConditionalAccess', externalLabel: 'Open Conditional Access' },
      { task: 'disable_legacy_auth' },
      { task: 'verify_recovery_email' },
      { task: 'admin_security_review' },
    ],
    completion: "Microsoft 365 is hardened. MFA enforced, legacy auth off, admins clean.",
  },
  {
    slug: 'secure-google-workspace',
    title: 'Secure Google Workspace',
    description: "Passkeys, recovery email, recovery phone, 2FA, and backup codes.",
    category: 'account',
    estimated_minutes: 8,
    reward_score: 14,
    steps: [
      { task: 'add_passkey', externalUrl: 'https://myaccount.google.com/signinoptions/passkeys', externalLabel: 'Open Google Passkeys' },
      { task: 'verify_recovery_email' },
      { task: 'add_recovery_phone', externalUrl: 'https://myaccount.google.com/phone', externalLabel: 'Open Google phone settings' },
      { task: 'enable_mfa', externalUrl: 'https://myaccount.google.com/security', externalLabel: 'Open Google 2-Step' },
      { task: 'save_backup_codes' },
    ],
    completion: "Google is locked down with passkeys, 2FA, and recovery you control.",
  },
  {
    slug: 'device-hardening',
    title: 'Harden this device',
    description: "Install the agent, verify encryption, enable firewall, patch the OS.",
    category: 'device',
    estimated_minutes: 10,
    reward_score: 12,
    steps: [
      { task: 'install_endpoint_agent' },
      { task: 'verify_disk_encryption' },
      { task: 'enable_firewall' },
      { task: 'patch_operating_system' },
      { task: 'confirm_done' },
    ],
    completion: "Device is hardened. Encrypted, firewalled, patched, and reporting to me.",
  },
];

export function findTemplate(slug: string): PlaybookTemplate | undefined {
  return PLAYBOOK_TEMPLATES.find((t) => t.slug === slug);
}
