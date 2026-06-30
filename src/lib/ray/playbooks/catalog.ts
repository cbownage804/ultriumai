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
  | 'verify_email_ownership'
  | 'monitor_identity_continuously'
  | 'review_weak_passwords'
  | 'review_reused_passwords'
  | 'review_old_passwords'
  | 'review_compromised_passwords'
  | 'disable_legacy_auth'
  | 'configure_conditional_access'
  | 'admin_security_review'
  | 'add_recovery_phone'
  | 'save_backup_codes'
  | 'install_endpoint_agent'
  | 'verify_disk_encryption'
  | 'enable_firewall'
  | 'patch_operating_system'
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
  enroll_authenticator_app: {
    id: 'enroll_authenticator_app',
    label: 'Enroll an authenticator app',
    rayPrompt:
      "Use an authenticator app — far safer than SMS. Scan the QR with your app and enter the first code to confirm.",
  },
  enroll_security_key: {
    id: 'enroll_security_key',
    label: 'Register a hardware security key',
    rayPrompt:
      "If you have a YubiKey or similar, register it now. It's the strongest second factor available.",
  },
  remove_sms_2fa: {
    id: 'remove_sms_2fa',
    label: 'Remove SMS as a second factor',
    rayPrompt:
      "Once your authenticator or key is working, remove SMS. SIM-swap attacks make it the weakest option.",
  },
  rotate_password_immediately: {
    id: 'rotate_password_immediately',
    label: 'Rotate the exposed password right now',
    rayPrompt:
      "This password is in the wild. Open the provider and change it before anything else — I'll generate one in a moment.",
  },
  change_security_questions: {
    id: 'change_security_questions',
    label: 'Reset your security questions',
    rayPrompt:
      "Security questions often leak with breaches. Replace the answers with random strings I'll store in your Vault.",
  },
  notify_affected_contacts: {
    id: 'notify_affected_contacts',
    label: 'Warn anyone who could be impacted',
    rayPrompt:
      "If contacts could be targeted using your exposed data, send them a quick heads-up. I'll suggest the wording.",
  },
  enable_breach_alerts: {
    id: 'enable_breach_alerts',
    label: 'Enable ongoing breach alerts',
    rayPrompt:
      "I'll keep watching this email or username and ping you the moment anything new surfaces.",
  },
  audit_oauth_apps: {
    id: 'audit_oauth_apps',
    label: 'Audit connected apps',
    rayPrompt:
      "Open the account's connected apps page. We're looking for anything you don't recognise or no longer use.",
  },
  disconnect_unused_apps: {
    id: 'disconnect_unused_apps',
    label: 'Disconnect what you no longer need',
    rayPrompt:
      "Remove access for anything stale. Less surface area, fewer ways in.",
  },
  request_data_removal: {
    id: 'request_data_removal',
    label: 'Request removal from data brokers',
    rayPrompt:
      "I'll point you at the opt-out pages for the brokers exposing you. A few minutes here saves a lot of spam and risk.",
  },
  freeze_credit_bureau: {
    id: 'freeze_credit_bureau',
    label: 'Freeze your credit at the bureaus',
    rayPrompt:
      "A credit freeze blocks new accounts being opened in your name. Free, reversible, and the single biggest financial protection.",
  },
  set_fraud_alert: {
    id: 'set_fraud_alert',
    label: 'Place a fraud alert',
    rayPrompt:
      "A fraud alert tells creditors to verify your identity before opening anything new. Quick to set up at any bureau.",
  },
  verify_email_ownership: {
    id: 'verify_email_ownership',
    label: 'Verify you own this email',
    rayPrompt: "Quick check — open the inbox and click the verification link I sent. That confirms we're watching the right address.",
  },
  monitor_identity_continuously: {
    id: 'monitor_identity_continuously',
    label: 'Turn on continuous monitoring',
    rayPrompt: "I'll keep watching this identity 24/7. The moment anything new surfaces, you'll hear from me first.",
  },
  review_weak_passwords: {
    id: 'review_weak_passwords',
    label: 'Review weak passwords',
    rayPrompt: "Here are the weakest passwords in your Vault. Let's swap each one for something stronger.",
  },
  review_reused_passwords: {
    id: 'review_reused_passwords',
    label: 'Review reused passwords',
    rayPrompt: "These passwords are used in more than one place. One breach takes them all down — let's give each its own.",
  },
  review_old_passwords: {
    id: 'review_old_passwords',
    label: 'Review passwords you haven\'t changed in over a year',
    rayPrompt: "These passwords are over a year old. Even if they're strong, rotating them resets the clock on any silent exposure.",
  },
  review_compromised_passwords: {
    id: 'review_compromised_passwords',
    label: 'Review compromised passwords',
    rayPrompt: "These passwords have been seen in known breaches. We rotate every one of them — no exceptions.",
  },
  disable_legacy_auth: {
    id: 'disable_legacy_auth',
    label: 'Disable legacy authentication',
    rayPrompt: "Legacy auth bypasses MFA. Open the admin center and turn it off — modern auth handles everything safer.",
  },
  configure_conditional_access: {
    id: 'configure_conditional_access',
    label: 'Configure Conditional Access',
    rayPrompt: "Conditional Access lets you require MFA for risky sign-ins, block legacy auth, and trust only known locations. I'll suggest a baseline policy.",
  },
  admin_security_review: {
    id: 'admin_security_review',
    label: 'Review admin accounts',
    rayPrompt: "Admins are the highest-value targets. Let's confirm every admin has MFA, no shared accounts, and access they still need.",
  },
  add_recovery_phone: {
    id: 'add_recovery_phone',
    label: 'Add a recovery phone',
    rayPrompt: "Add a recovery phone you control. If you ever lose access, this is one of the lifelines back in.",
  },
  save_backup_codes: {
    id: 'save_backup_codes',
    label: 'Save your backup codes to the Vault',
    rayPrompt: "Generate backup codes and save them in your Vault. If your phone disappears, these are your safety net.",
  },
  install_endpoint_agent: {
    id: 'install_endpoint_agent',
    label: 'Install the Wrayth endpoint agent',
    rayPrompt: "Install the agent so I can see device health — encryption, firewall, patches — and act on issues directly.",
  },
  verify_disk_encryption: {
    id: 'verify_disk_encryption',
    label: 'Verify disk encryption',
    rayPrompt: "Confirm full-disk encryption (FileVault, BitLocker, or LUKS) is on. If the device is ever lost, the data stays sealed.",
  },
  enable_firewall: {
    id: 'enable_firewall',
    label: 'Enable the system firewall',
    rayPrompt: "Turn on the built-in firewall. It blocks the easy reconnaissance attackers do before anything else.",
  },
  patch_operating_system: {
    id: 'patch_operating_system',
    label: 'Patch your operating system',
    rayPrompt: "Install all pending OS updates. Most attacks use bugs that were already fixed weeks ago.",
  },
};
