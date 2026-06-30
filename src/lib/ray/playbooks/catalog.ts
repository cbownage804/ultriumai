/**
 * Ray task catalog — the reusable steps Ray can string together into a playbook.
 *
 * Playbook templates compose these by id. Each task ships with Ray's default
 * conversational prompt; templates may override per-step.
 */
export type RayTaskId =
  | 'review_account'
  | 'review_password_strength'
  | 'generate_password'
  | 'update_password'
  | 'enable_mfa'
  | 'enroll_authenticator_app'
  | 'enroll_security_key'
  | 'remove_sms_2fa'
  | 'store_recovery_codes'
  | 'verify_recovery_email'
  | 'review_admin_permissions'
  | 'add_passkey'
  | 'review_breach'
  | 'rotate_password_immediately'
  | 'change_security_questions'
  | 'notify_affected_contacts'
  | 'enable_breach_alerts'
  | 'confirm_breach_resolved'
  | 'verify_device'
  | 'revoke_unknown_sessions'
  | 'audit_oauth_apps'
  | 'disconnect_unused_apps'
  | 'import_passwords'
  | 'scan_identity'
  | 'review_exposure'
  | 'add_watched_email'
  | 'request_data_removal'
  | 'freeze_credit_bureau'
  | 'set_fraud_alert'
  | 'confirm_done';

export type RayTask = {
  id: RayTaskId;
  label: string;
  /** Ray's opening line for this step. Calm, first person, short. */
  rayPrompt: string;
  /** Optional external link Ray asks the user to open. */
  externalUrl?: string;
  externalLabel?: string;
};

export const RAY_TASKS: Record<RayTaskId, RayTask> = {
  review_account: {
    id: 'review_account',
    label: 'Review the account together',
    rayPrompt:
      "Let's start by looking at the account. Open it in another tab and tell me when you're in.",
  },
  review_password_strength: {
    id: 'review_password_strength',
    label: 'Check password strength',
    rayPrompt:
      "I'll check this password against everything I know about breaches and reuse. Continue when you're ready.",
  },
  generate_password: {
    id: 'generate_password',
    label: 'Generate a new strong password',
    rayPrompt:
      "I'll generate a long, unique password for you. We'll store it in your Vault automatically.",
  },
  update_password: {
    id: 'update_password',
    label: 'Update the password at the provider',
    rayPrompt:
      "Open the provider's change-password page and paste the new password I generated. Continue once it's saved.",
  },
  enable_mfa: {
    id: 'enable_mfa',
    label: 'Enable two-factor authentication',
    rayPrompt:
      "Two-factor is the single biggest jump in protection. Open the account's security settings and turn it on. I'll wait.",
  },
  store_recovery_codes: {
    id: 'store_recovery_codes',
    label: 'Save the recovery codes in your Vault',
    rayPrompt:
      "Copy the recovery codes the provider shows and save them in your Vault. If you lose your phone, this is what gets you back in.",
  },
  verify_recovery_email: {
    id: 'verify_recovery_email',
    label: 'Verify your recovery email',
    rayPrompt:
      "Make sure your recovery email is one you still control. I'll trust this one going forward.",
  },
  review_admin_permissions: {
    id: 'review_admin_permissions',
    label: 'Review administrator permissions',
    rayPrompt:
      "Let's make sure no one has admin rights they shouldn't. Remove anyone who doesn't need it.",
  },
  add_passkey: {
    id: 'add_passkey',
    label: 'Add a passkey',
    rayPrompt:
      "Passkeys are the upgrade — no password to phish, no code to type. Add one now and sign-in gets faster too.",
  },
  review_breach: {
    id: 'review_breach',
    label: 'Review the breach details',
    rayPrompt:
      "Here's what was exposed and where. Read it through so we know exactly what we're rotating.",
  },
  confirm_breach_resolved: {
    id: 'confirm_breach_resolved',
    label: 'Confirm the exposure is closed',
    rayPrompt:
      "Password rotated, account secured. I'll mark this exposure resolved and keep monitoring.",
  },
  verify_device: {
    id: 'verify_device',
    label: 'Verify the device',
    rayPrompt:
      "Tell me if you recognise this device. If you don't, we sign it out together.",
  },
  revoke_unknown_sessions: {
    id: 'revoke_unknown_sessions',
    label: 'Sign out unknown sessions',
    rayPrompt:
      "Open the account's active sessions list and sign out anything you don't recognise.",
  },
  import_passwords: {
    id: 'import_passwords',
    label: 'Import your passwords',
    rayPrompt:
      "Bring everything into your Vault so I can see what we're protecting. I'll handle the rest.",
  },
  scan_identity: {
    id: 'scan_identity',
    label: 'Scan your identity',
    rayPrompt:
      "I'll check the dark web for any leaked emails, phone numbers, or passwords tied to you.",
  },
  review_exposure: {
    id: 'review_exposure',
    label: "Review what's exposed",
    rayPrompt:
      "Here's what I found. Let's go through it together and decide what to act on first.",
  },
  add_watched_email: {
    id: 'add_watched_email',
    label: 'Add an email to watch',
    rayPrompt:
      "Tell me which emails you care about. I'll watch them for breaches from now on.",
  },
  confirm_done: {
    id: 'confirm_done',
    label: "Confirm we're done",
    rayPrompt:
      "We've covered everything. Click Continue and I'll lock in your progress.",
  },
};
