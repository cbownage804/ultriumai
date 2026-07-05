/**
 * Ray Remediation Catalog — Windows-agent one-click fixes. Keep in sync with
 * the RISK table in `supabase/functions/agent-action-request/index.ts`.
 *
 * All entries conform to the provider-agnostic `Remediation` shape from
 * `./types`, so this catalog composes with the Microsoft 365 catalog in
 * `./ms365` behind a single Fix Now UI.
 */
import type { Remediation, RemediationCategory } from './types';

export { CATEGORY_LABELS, PROVIDER_LABELS } from './types';
export type { Remediation, RemediationCategory, RemediationRisk, ProviderId } from './types';

const AGENT_REMEDIATIONS: Remediation[] = [
  // — Encryption —
  {
    slug: 'enable-bitlocker',
    provider: 'agent',
    action_type: 'enable_bitlocker',
    title: 'Turn on BitLocker disk encryption',
    summary: 'Encrypt the system drive so a stolen laptop stays private.',
    why: 'Without disk encryption, anyone with physical access can read every file on the drive by removing it or booting from a USB stick.',
    category: 'encryption', risk: 'medium', reversible: false,
    requiresConfirmation: 'confirm',
    estimatedSeconds: 120, target: 'device', platforms: ['windows'],
    previewLines: ['Enable BitLocker on the system drive', 'Encrypt drive C:', 'Upload the recovery key', 'Verify completion'],
  },

  // — Defender —
  {
    slug: 'enable-defender',
    provider: 'agent',
    action_type: 'enable_defender',
    title: 'Enable Microsoft Defender antivirus',
    summary: 'Turn on real-time protection.',
    why: 'Real-time scanning catches malicious files the moment they land on disk, before they can execute.',
    category: 'defender', risk: 'low', reversible: false,
    requiresConfirmation: 'none',
    estimatedSeconds: 15, target: 'device', platforms: ['windows'],
    previewLines: ['Enable Defender real-time protection', 'Confirm the service is running'],
  },
  {
    slug: 'update-defender-signatures',
    provider: 'agent',
    action_type: 'update_defender_signatures',
    title: 'Update Defender threat definitions',
    summary: 'Pull the latest signatures so Defender recognises new malware.',
    why: 'Signature files older than a few days miss the newest ransomware and info-stealer families.',
    category: 'defender', risk: 'low', reversible: false,
    requiresConfirmation: 'none',
    estimatedSeconds: 45, target: 'device', platforms: ['windows'],
    previewLines: ['Trigger a signature update', 'Confirm new definitions installed'],
  },
  {
    slug: 'enable-defender-pua',
    provider: 'agent',
    action_type: 'enable_defender_pua',
    title: 'Block potentially unwanted apps',
    summary: 'Turn on Defender PUA protection.',
    why: 'PUA protection blocks bundleware, aggressive adware, and coin-miners that ship inside "free" installers.',
    category: 'defender', risk: 'low', reversible: true, reverseSlug: 'disable-defender-pua',
    requiresConfirmation: 'none',
    estimatedSeconds: 10, target: 'device', platforms: ['windows'],
    previewLines: ['Set PUAProtection to Enabled'],
  },
  {
    slug: 'enable-defender-cloud',
    provider: 'agent',
    action_type: 'enable_defender_cloud',
    title: 'Turn on Defender cloud-delivered protection',
    summary: 'Let Defender check unknown files against Microsoft cloud intelligence.',
    why: 'Cloud protection catches brand-new threats in seconds — before a local signature exists.',
    category: 'defender', risk: 'low', reversible: true, reverseSlug: 'disable-defender-cloud',
    requiresConfirmation: 'none',
    estimatedSeconds: 10, target: 'device', platforms: ['windows'],
    previewLines: ['Enable MAPSReporting', 'Enable SubmitSamplesConsent'],
  },
  {
    slug: 'run-defender-quick-scan',
    provider: 'agent',
    action_type: 'run_defender_quick_scan',
    title: 'Run a Defender quick scan',
    summary: 'Scan the hot paths (memory, startup, common malware locations).',
    why: 'Finishes in a few minutes and catches most active infections without disrupting the user.',
    category: 'defender', risk: 'low', reversible: false,
    requiresConfirmation: 'none',
    estimatedSeconds: 300, target: 'device', platforms: ['windows'],
    previewLines: ['Run Start-MpScan -ScanType QuickScan', 'Report findings'],
  },
  {
    slug: 'run-defender-full-scan',
    provider: 'agent',
    action_type: 'run_defender_full_scan',
    title: 'Run a Defender full scan',
    summary: 'Deep scan of every file on the system drive.',
    why: 'The most thorough check available. Recommended after an incident or when something suspicious was found.',
    category: 'defender', risk: 'low', reversible: false,
    requiresConfirmation: 'confirm',
    estimatedSeconds: 3600, target: 'device', platforms: ['windows'],
    previewLines: ['Run Start-MpScan -ScanType FullScan', 'Report findings'],
  },

  // — Firewall —
  {
    slug: 'enable-firewall',
    provider: 'agent',
    action_type: 'enable_firewall',
    title: 'Enable the Windows firewall',
    summary: 'Turn on the built-in firewall for all profiles.',
    why: 'The firewall blocks unsolicited inbound connections — essential on any network you don\u2019t fully trust.',
    category: 'firewall', risk: 'low', reversible: true, reverseSlug: 'disable-firewall',
    requiresConfirmation: 'none',
    estimatedSeconds: 5, target: 'device', platforms: ['windows'],
    previewLines: ['Enable Domain, Private and Public firewall profiles'],
  },

  // — Remote access —
  {
    slug: 'disable-rdp',
    provider: 'agent',
    action_type: 'disable_rdp',
    title: 'Disable Remote Desktop (RDP)',
    summary: 'Close the RDP listener.',
    why: 'RDP is the most-attacked remote service on Windows. Disable it unless you actively use it \u2014 most home and business users do not.',
    category: 'remote_access', risk: 'high', reversible: true, reverseSlug: 'enable-rdp',
    requiresConfirmation: 'confirm',
    estimatedSeconds: 5, target: 'device', platforms: ['windows'],
    previewLines: ['Disable fDenyTSConnections', 'Stop the TermService listener'],
  },
  {
    slug: 'enable-rdp-nla',
    provider: 'agent',
    action_type: 'enable_rdp_nla',
    title: 'Require Network Level Authentication for RDP',
    summary: 'Force RDP clients to authenticate before a session is created.',
    why: 'NLA blocks pre-auth exploits and denies bandwidth to bots probing your RDP port.',
    category: 'remote_access', risk: 'medium', reversible: true, reverseSlug: 'disable-rdp-nla',
    requiresConfirmation: 'confirm',
    estimatedSeconds: 5, target: 'device', platforms: ['windows'],
    previewLines: ['Enable UserAuthentication (NLA) on the RDP listener'],
  },
  {
    slug: 'disable-remote-assistance',
    provider: 'agent',
    action_type: 'disable_remote_assistance',
    title: 'Disable Windows Remote Assistance',
    summary: 'Turn off the legacy invite-based helper channel.',
    why: 'Remote Assistance is rarely used today but remains a supported inbound path an attacker can invite themselves through.',
    category: 'remote_access', risk: 'medium', reversible: true, reverseSlug: 'enable-remote-assistance',
    requiresConfirmation: 'confirm',
    estimatedSeconds: 5, target: 'device', platforms: ['windows'],
    previewLines: ['Set fAllowToGetHelp = 0'],
  },

  // — Accounts —
  {
    slug: 'disable-builtin-administrator',
    provider: 'agent',
    action_type: 'disable_builtin_administrator',
    title: 'Disable the built-in Administrator account',
    summary: 'Turn off the default local Administrator.',
    why: 'The built-in Administrator is a known target for password-spray attacks. Disable it and use a named admin account instead.',
    category: 'accounts', risk: 'high', reversible: true, reverseSlug: 'enable-builtin-administrator',
    requiresConfirmation: 'typed_name',
    estimatedSeconds: 5, target: 'device', platforms: ['windows'],
    previewLines: ['Disable the local Administrator account', 'Refuse if it is the only enabled admin'],
  },
  {
    slug: 'remove-local-admin',
    provider: 'agent',
    action_type: 'remove_local_admin',
    title: 'Remove a user from local Administrators',
    summary: 'Demote an account to standard user.',
    why: 'Every extra local admin multiplies the blast radius of a compromise. Ray will refuse to remove your last active admin.',
    category: 'accounts', risk: 'high', reversible: false,
    requiresConfirmation: 'typed_name',
    estimatedSeconds: 5, target: 'device', platforms: ['windows'],
    defaultParams: { name: '' },
    previewLines: ['Remove the named user from the local Administrators group', 'Preflight refuses if no other admin remains'],
  },

  // — Updates —
  {
    slug: 'install-windows-updates',
    provider: 'agent',
    action_type: 'install_windows_updates',
    title: 'Install pending Windows updates',
    summary: 'Apply every approved OS security update.',
    why: 'Unpatched Windows systems are compromised within days of a public exploit. Patching is the single highest-ROI action you can take.',
    category: 'updates', risk: 'high', reversible: false, requiresReboot: true,
    requiresConfirmation: 'confirm',
    estimatedSeconds: 1800, target: 'device', platforms: ['windows'],
    previewLines: ['Enumerate pending updates', 'Install every approved update', 'Reboot if required'],
  },

  // — Session —
  {
    slug: 'lock-screen',
    provider: 'agent',
    action_type: 'lock_screen',
    title: 'Lock the screen now',
    summary: 'Immediately lock the workstation.',
    why: 'If a device was left unlocked in a shared space, lock it before anyone can walk up and use it.',
    category: 'session', risk: 'low', reversible: false,
    requiresConfirmation: 'none',
    estimatedSeconds: 2, target: 'device', platforms: ['windows'],
    previewLines: ['Invoke LockWorkStation() on the active session'],
  },
  {
    slug: 'sign-out-user',
    provider: 'agent',
    action_type: 'sign_out_user',
    title: 'Sign the user out',
    summary: 'End the interactive session cleanly.',
    why: 'Signing out invalidates in-memory credentials that stay resident while a user is logged in.',
    category: 'session', risk: 'medium', reversible: false,
    requiresConfirmation: 'confirm',
    estimatedSeconds: 10, target: 'device', platforms: ['windows'],
    previewLines: ['Log the interactive user off', 'Any unsaved work will be lost'],
  },

  // — Browser —
  {
    slug: 'disable-browser-password-manager',
    provider: 'agent',
    action_type: 'disable_browser_password_manager',
    title: 'Disable browser-saved passwords',
    summary: 'Stop Chrome/Edge from offering to save credentials.',
    why: 'Browser-stored passwords are recoverable in cleartext by any process running as the user. Wrayth Vault is the safer store.',
    category: 'browser', risk: 'medium', reversible: true, reverseSlug: 'enable-browser-password-manager',
    requiresConfirmation: 'confirm',
    estimatedSeconds: 5, target: 'device', platforms: ['windows'],
    previewLines: ['Set PasswordManagerEnabled = 0 for Chrome and Edge'],
  },
];

import { MS365_REMEDIATIONS } from './ms365';
import { CATEGORY_LABELS } from './types';

/** The full, provider-mixed catalog. Anything with a Fix Now button reads from here. */
export const REMEDIATION_CATALOG: Remediation[] = [
  ...AGENT_REMEDIATIONS,
  ...MS365_REMEDIATIONS,
];

export function getRemediationBySlug(slug: string): Remediation | undefined {
  return REMEDIATION_CATALOG.find((r) => r.slug === slug);
}

export function getRemediationByAction(actionType: string): Remediation | undefined {
  return REMEDIATION_CATALOG.find((r) => r.action_type === actionType);
}

export function groupRemediationsByCategory(): Array<{ category: RemediationCategory; label: string; items: Remediation[] }> {
  const groups = new Map<RemediationCategory, Remediation[]>();
  for (const r of REMEDIATION_CATALOG) {
    const arr = groups.get(r.category) ?? [];
    arr.push(r);
    groups.set(r.category, arr);
  }
  return Array.from(groups.entries()).map(([category, items]) => ({
    category,
    label: CATEGORY_LABELS[category],
    items,
  }));
}
