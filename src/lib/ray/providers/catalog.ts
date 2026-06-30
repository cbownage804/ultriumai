/**
 * Provider catalog — the accounts Ray knows how to secure end-to-end.
 *
 * Each provider maps a set of domain patterns to a playbook slug,
 * a display name, and the security console URL Ray opens for the user.
 *
 * Used by:
 * - the browser extension to recognize the page you're on,
 * - the dashboard's Account Health panel,
 * - `/app/ray/secure/:provider` to launch the right playbook.
 */

export type SecureProviderId =
  | 'google'
  | 'microsoft'
  | 'github'
  | 'apple'
  | 'amazon'
  | 'facebook'
  | 'dropbox';

export type SecureProvider = {
  id: SecureProviderId;
  name: string;
  /** Hostname patterns that identify this provider (case-insensitive, suffix match). */
  domains: string[];
  /** Playbook slug Ray runs when the user picks "Secure this account". */
  playbookSlug: string;
  /** Where Ray sends the user first. */
  consoleUrl: string;
  /** Brand accent (Wrayth palette — kept monochrome by default). */
  accent: 'slate' | 'violet' | 'emerald' | 'amber' | 'sky';
  /** Short tagline shown on the dashboard health card. */
  tagline: string;
};

export const SECURE_PROVIDERS: SecureProvider[] = [
  {
    id: 'google',
    name: 'Google',
    domains: ['google.com', 'accounts.google.com', 'myaccount.google.com', 'gmail.com'],
    playbookSlug: 'secure-google',
    consoleUrl: 'https://myaccount.google.com/security',
    accent: 'sky',
    tagline: 'Email, drive, calendar — the keys to everything.',
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    domains: ['microsoft.com', 'live.com', 'outlook.com', 'office.com', 'login.microsoftonline.com'],
    playbookSlug: 'secure-microsoft',
    consoleUrl: 'https://account.microsoft.com/security',
    accent: 'sky',
    tagline: 'Email, files, and devices — all under one account.',
  },
  {
    id: 'github',
    name: 'GitHub',
    domains: ['github.com'],
    playbookSlug: 'secure-github',
    consoleUrl: 'https://github.com/settings/security',
    accent: 'violet',
    tagline: 'Your code is your IP — lock it down.',
  },
  {
    id: 'apple',
    name: 'Apple',
    domains: ['apple.com', 'icloud.com', 'appleid.apple.com'],
    playbookSlug: 'secure-apple',
    consoleUrl: 'https://appleid.apple.com',
    accent: 'slate',
    tagline: 'One account spans every Apple device you own.',
  },
  {
    id: 'amazon',
    name: 'Amazon',
    domains: ['amazon.com', 'aws.amazon.com'],
    playbookSlug: 'secure-amazon',
    consoleUrl: 'https://www.amazon.com/gp/css/homepage.html',
    accent: 'amber',
    tagline: 'Payment methods, addresses, and AWS — worth protecting.',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    domains: ['facebook.com', 'fb.com', 'instagram.com'],
    playbookSlug: 'secure-facebook',
    consoleUrl: 'https://www.facebook.com/security',
    accent: 'sky',
    tagline: 'Your identity online — and a frequent attacker target.',
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    domains: ['dropbox.com'],
    playbookSlug: 'secure-dropbox',
    consoleUrl: 'https://www.dropbox.com/account/security',
    accent: 'sky',
    tagline: 'Files you can\'t afford to lose.',
  },
];

export function findProviderById(id: string): SecureProvider | undefined {
  return SECURE_PROVIDERS.find((p) => p.id === id);
}

/** Match a hostname like `accounts.google.com` to a known provider. */
export function findProviderForHost(host: string | null | undefined): SecureProvider | undefined {
  if (!host) return undefined;
  const h = host.toLowerCase();
  return SECURE_PROVIDERS.find((p) =>
    p.domains.some((d) => h === d || h.endsWith('.' + d)),
  );
}

/** Match a raw URL or label (e.g. a vault entry's website field). */
export function findProviderForValue(value: string | null | undefined): SecureProvider | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase();
  try {
    if (v.includes('://')) {
      const u = new URL(v);
      return findProviderForHost(u.hostname);
    }
  } catch {
    // fall through to fuzzy match
  }
  return SECURE_PROVIDERS.find((p) =>
    p.domains.some((d) => v.includes(d.split('.')[0])) || v.includes(p.name.toLowerCase()),
  );
}
