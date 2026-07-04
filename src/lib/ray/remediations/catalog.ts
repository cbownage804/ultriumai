/**
 * Ray Remediation Catalog — the canonical list of one-click fixes Ray can
 * dispatch to a Wrayth-enrolled device via `agent-action-request`. Every
 * entry is a real action the Windows agent knows how to perform.
 *
 * The catalog is the single source of truth for the browse UI, the Fix It
 * buttons on Command Center, RayFixPanel, and every rec card that maps to
 * a concrete agent action. Keep action_type in sync with the RISK table in
 * `supabase/functions/agent-action-request/index.ts`.
 */
export type RemediationCategory =
  | 'encryption'
  | 'defender'
  | 'firewall'
  | 'remote_access'
  | 'accounts'
  | 'updates'
  | 'session'
  | 'browser';

export type RemediationRisk = 'low' | 'medium' | 'high';

export interface Remediation {
  /** Stable slug used in URLs and telemetry. */
  slug: string;
  /** Agent action_type the dispatch edge function accepts. */
  action_type: string;
  title: string;
  /** One-line plain-English description shown on the card. */
  summary: string;
  /** Longer "why this matters" copy — Ray's rationale. */
  why: string;
  category: RemediationCategory;
  risk: RemediationRisk;
  /** True if the effect can be undone by a paired action. */
  reversible: boolean;
  /** Paired action slug that undoes this, if any. */
  reverseAction?: string;
  /** May require a reboot to fully apply. */
  requiresReboot?: boolean;
  /** Approx time on the device (post-dispatch). */
  estimatedSeconds: number;
  /** Windows-only for now; kept explicit for future macOS/Linux agents. */
  platforms: Array<'windows' | 'macos' | 'linux'>;
  /** Optional params passed to the agent action. */
  defaultParams?: Record<string, unknown>;
}

export const REMEDIATION_CATALOG: Remediation[] = [
  // — Encryption —
  {
    slug: 'enable-bitlocker',
    action_type: 'enable_bitlocker',
    title: 'Turn on BitLocker disk encryption',
    summary: 'Encrypt the system drive so a stolen laptop stays private.',
    why: 'Without disk encryption, anyone with physical access can read every file on the drive by removing it or booting from a USB stick.',
    category: 'encryption', risk: 'medium', reversible: false,
    estimatedSeconds: 120, platforms: ['windows'],
  },

  // — Defender —
  {
    slug: 'enable-defender',
    action_type: 'enable_defender',
    title: 'Enable Microsoft Defender antivirus',
    summary: 'Turn on real-time protection.',
    why: 'Real-time scanning catches malicious files the moment they land on disk, before they can execute.',
    category: 'defender', risk: 'low', reversible: false,
    estimatedSeconds: 15, platforms: ['windows'],
  },
  {
    slug: 'update-defender-signatures',
    action_type: 'update_defender_signatures',
    title: 'Update Defender threat definitions',
    summary: 'Pull the latest signatures so Defender recognises new malware.',
    why: 'Signature files older than a few days miss the newest ransomware and info-stealer families.',
    category: 'defender', risk: 'low', reversible: false,
    estimatedSeconds: 45, platforms: ['windows'],
  },
  {
    slug: 'enable-defender-pua',
    action_type: 'enable_defender_pua',
    title: 'Block potentially unwanted apps',
    summary: 'Turn on Defender PUA protection.',
    why: 'PUA protection blocks bundleware, aggressive adware, and coin-miners that ship inside "free" installers.',
    category: 'defender', risk: 'low', reversible: true, reverseAction: 'disable_defender_pua',
    estimatedSeconds: 10, platforms: ['windows'],
  },
  {
    slug: 'enable-defender-cloud',
    action_type: 'enable_defender_cloud',
    title: 'Turn on Defender cloud-delivered protection',
    summary: 'Let Defender check unknown files against Microsoft cloud intelligence.',
    why: 'Cloud protection catches brand-new threats in seconds — before a local signature exists.',
    category: 'defender', risk: 'low', reversible: true, reverseAction: 'disable_defender_cloud',
    estimatedSeconds: 10, platforms: ['windows'],
  },
  {
    slug: 'run-defender-quick-scan',
    action_type: 'run_defender_quick_scan',
    title: 'Run a Defender quick scan',
    summary: 'Scan the hot paths (memory, startup, common malware locations).',
    why: 'Finishes in a few minutes and catches most active infections without disrupting the user.',
    category: 'defender', risk: 'low', reversible: false,
    estimatedSeconds: 300, platforms: ['windows'],
  },
  {
    slug: 'run-defender-full-scan',
    action_type: 'run_defender_full_scan',
    title: 'Run a Defender full scan',
    summary: 'Deep scan of every file on the system drive.',
    why: 'The most thorough check available. Recommended after an incident or when something suspicious was found.',
    category: 'defender', risk: 'low', reversible: false,
    estimatedSeconds: 3600, platforms: ['windows'],
  },

  // — Firewall —
  {
    slug: 'enable-firewall',
    action_type: 'enable_firewall',
    title: 'Enable the Windows firewall',
    summary: 'Turn on the built-in firewall for all profiles.',
    why: 'The firewall blocks unsolicited inbound connections — essential on any network you don\'t fully trust.',
    category: 'firewall', risk: 'low', reversible: true, reverseAction: 'disable_firewall',
    estimatedSeconds: 5, platforms: ['windows'],
  },

  // — Remote access —
  {
    slug: 'disable-rdp',
    action_type: 'disable_rdp',
    title: 'Disable Remote Desktop (RDP)',
    summary: 'Close the RDP listener.',
    why: 'RDP is the most-attacked remote service on Windows. Disable it unless you actively use it — most home and business users do not.',
    category: 'remote_access', risk: 'high', reversible: true, reverseAction: 'enable_rdp',
    estimatedSeconds: 5, platforms: ['windows'],
  },
  {
    slug: 'enable-rdp-nla',
    action_type: 'enable_rdp_nla',
    title: 'Require Network Level Authentication for RDP',
    summary: 'Force RDP clients to authenticate before a session is created.',
    why: 'NLA blocks pre-auth exploits and denies bandwidth to bots probing your RDP port.',
    category: 'remote_access', risk: 'medium', reversible: true, reverseAction: 'disable_rdp_nla',
    estimatedSeconds: 5, platforms: ['windows'],
  },
  {
    slug: 'disable-remote-assistance',
    action_type: 'disable_remote_assistance',
    title: 'Disable Windows Remote Assistance',
    summary: 'Turn off the legacy invite-based helper channel.',
    why: 'Remote Assistance is rarely used today but remains a supported inbound path an attacker can invite themselves through.',
    category: 'remote_access', risk: 'medium', reversible: true, reverseAction: 'enable_remote_assistance',
    estimatedSeconds: 5, platforms: ['windows'],
  },

  // — Accounts —
  {
    slug: 'disable-builtin-administrator',
    action_type: 'disable_builtin_administrator',
    title: 'Disable the built-in Administrator account',
    summary: 'Turn off the default local Administrator.',
    why: 'The built-in Administrator is a known target for password-spray attacks. Disable it and use a named admin account instead.',
    category: 'accounts', risk: 'high', reversible: true, reverseAction: 'enable_builtin_administrator',
    estimatedSeconds: 5, platforms: ['windows'],
  },
  {
    slug: 'remove-local-admin',
    action_type: 'remove_local_admin',
    title: 'Remove a user from local Administrators',
    summary: 'Demote an account to standard user.',
    why: 'Every extra local admin multiplies the blast radius of a compromise. Ray will refuse to remove your last active admin.',
    category: 'accounts', risk: 'high', reversible: false,
    estimatedSeconds: 5, platforms: ['windows'],
    defaultParams: { name: '' },
  },

  // — Updates —
  {
    slug: 'install-windows-updates',
    action_type: 'install_windows_updates',
    title: 'Install pending Windows updates',
    summary: 'Apply every approved OS security update.',
    why: 'Unpatched Windows systems are compromised within days of a public exploit. Patching is the single highest-ROI action you can take.',
    category: 'updates', risk: 'high', reversible: false, requiresReboot: true,
    estimatedSeconds: 1800, platforms: ['windows'],
  },

  // — Session —
  {
    slug: 'lock-screen',
    action_type: 'lock_screen',
    title: 'Lock the screen now',
    summary: 'Immediately lock the workstation.',
    why: 'If a device was left unlocked in a shared space, lock it before anyone can walk up and use it.',
    category: 'session', risk: 'low', reversible: false,
    estimatedSeconds: 2, platforms: ['windows'],
  },
  {
    slug: 'sign-out-user',
    action_type: 'sign_out_user',
    title: 'Sign the user out',
    summary: 'End the interactive session cleanly.',
    why: 'Signing out invalidates in-memory credentials that stay resident while a user is logged in.',
    category: 'session', risk: 'medium', reversible: false,
    estimatedSeconds: 10, platforms: ['windows'],
  },

  // — Browser —
  {
    slug: 'disable-browser-password-manager',
    action_type: 'disable_browser_password_manager',
    title: 'Disable browser-saved passwords',
    summary: 'Stop Chrome/Edge from offering to save credentials.',
    why: 'Browser-stored passwords are recoverable in cleartext by any process running as the user. Wrayth Vault is the safer store.',
    category: 'browser', risk: 'medium', reversible: true, reverseAction: 'enable_browser_password_manager',
    estimatedSeconds: 5, platforms: ['windows'],
  },
];

export const CATEGORY_LABELS: Record<RemediationCategory, string> = {
  encryption: 'Disk encryption',
  defender: 'Defender & antivirus',
  firewall: 'Firewall',
  remote_access: 'Remote access',
  accounts: 'Accounts & admins',
  updates: 'Updates & patching',
  session: 'Session control',
  browser: 'Browser hygiene',
};

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
