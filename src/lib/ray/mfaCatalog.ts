/**
 * Ray's catalog of services that support TOTP-based 2FA.
 * Used to (a) recognize vault entries that should turn MFA on and
 * (b) deep-link the user to each service's setup page.
 */

export type MFAPriority = 'critical' | 'high' | 'medium' | 'low';

export interface MFACatalogEntry {
  domain: string;            // canonical domain (no www.)
  name: string;              // display name
  priority: MFAPriority;     // how important Ray considers this
  category: 'email' | 'finance' | 'work' | 'cloud' | 'social' | 'dev' | 'crypto' | 'shopping' | 'other';
  methods: Array<'totp' | 'webauthn' | 'push' | 'sms' | 'email'>;
  setupUrl: string;          // direct link to the 2FA settings page
  recovery: Array<'backup_codes' | 'security_keys' | 'email' | 'phone'>;
  reason: string;            // Ray's "why this matters" line
}

export const MFA_CATALOG: MFACatalogEntry[] = [
  { domain: 'google.com', name: 'Google', priority: 'critical', category: 'email',
    methods: ['totp', 'webauthn', 'push'], setupUrl: 'https://myaccount.google.com/security',
    recovery: ['backup_codes', 'security_keys', 'phone'],
    reason: 'Your Google account holds password resets for almost everything else. If it falls, the rest falls with it.' },
  { domain: 'microsoft.com', name: 'Microsoft', priority: 'critical', category: 'email',
    methods: ['totp', 'webauthn', 'push'], setupUrl: 'https://account.microsoft.com/security',
    recovery: ['backup_codes', 'email', 'phone'],
    reason: 'Your Microsoft account is the front door to Outlook, OneDrive, and Office.' },
  { domain: 'apple.com', name: 'Apple', priority: 'critical', category: 'cloud',
    methods: ['totp', 'push'], setupUrl: 'https://appleid.apple.com/account/manage',
    recovery: ['phone', 'email'],
    reason: 'Your Apple ID controls iCloud, photos, and every device on your account.' },
  { domain: 'github.com', name: 'GitHub', priority: 'high', category: 'dev',
    methods: ['totp', 'webauthn'], setupUrl: 'https://github.com/settings/security',
    recovery: ['backup_codes', 'security_keys'],
    reason: 'Your code, your secrets, your deploy keys. A stolen GitHub login is a stolen company.' },
  { domain: 'gitlab.com', name: 'GitLab', priority: 'high', category: 'dev',
    methods: ['totp', 'webauthn'], setupUrl: 'https://gitlab.com/-/profile/two_factor_auth',
    recovery: ['backup_codes'], reason: 'Lock down source control before someone else does.' },
  { domain: 'amazon.com', name: 'Amazon', priority: 'high', category: 'shopping',
    methods: ['totp', 'sms'], setupUrl: 'https://www.amazon.com/a/settings/approval',
    recovery: ['backup_codes', 'phone'],
    reason: 'Your saved cards and addresses live here. 2FA blocks the easiest fraud path.' },
  { domain: 'paypal.com', name: 'PayPal', priority: 'critical', category: 'finance',
    methods: ['totp', 'sms'], setupUrl: 'https://www.paypal.com/myaccount/security/',
    recovery: ['phone'], reason: 'PayPal is a direct line to your bank. Always two-factor.' },
  { domain: 'coinbase.com', name: 'Coinbase', priority: 'critical', category: 'crypto',
    methods: ['totp', 'webauthn'], setupUrl: 'https://www.coinbase.com/settings/security',
    recovery: ['backup_codes', 'security_keys'],
    reason: 'Crypto accounts are irreversible. 2FA is the line between safe and gone.' },
  { domain: 'binance.com', name: 'Binance', priority: 'critical', category: 'crypto',
    methods: ['totp', 'webauthn'], setupUrl: 'https://accounts.binance.com/en/security',
    recovery: ['backup_codes'], reason: 'Crypto exchanges are top targets. Lock it down.' },
  { domain: 'stripe.com', name: 'Stripe', priority: 'critical', category: 'finance',
    methods: ['totp', 'webauthn'], setupUrl: 'https://dashboard.stripe.com/settings/user',
    recovery: ['backup_codes', 'security_keys'], reason: 'Your customer payments flow through here.' },
  { domain: 'dropbox.com', name: 'Dropbox', priority: 'high', category: 'cloud',
    methods: ['totp', 'webauthn'], setupUrl: 'https://www.dropbox.com/account/security',
    recovery: ['backup_codes', 'phone'], reason: 'Files, contracts, IDs — protect the whole drive.' },
  { domain: 'slack.com', name: 'Slack', priority: 'high', category: 'work',
    methods: ['totp', 'sms'], setupUrl: 'https://slack.com/account/settings',
    recovery: ['phone'], reason: 'Your work conversations and shared files live in Slack.' },
  { domain: 'notion.so', name: 'Notion', priority: 'medium', category: 'work',
    methods: ['totp'], setupUrl: 'https://www.notion.so/my-account',
    recovery: ['backup_codes'], reason: 'Notes, docs, and roadmaps — worth protecting.' },
  { domain: 'linkedin.com', name: 'LinkedIn', priority: 'medium', category: 'social',
    methods: ['totp', 'sms'], setupUrl: 'https://www.linkedin.com/psettings/two-step-verification',
    recovery: ['phone'], reason: 'Hijacked LinkedIn = phishing your network in your name.' },
  { domain: 'facebook.com', name: 'Facebook', priority: 'medium', category: 'social',
    methods: ['totp', 'sms'], setupUrl: 'https://www.facebook.com/security/2fac/settings',
    recovery: ['backup_codes', 'phone'], reason: 'Meta accounts unlock Instagram, ads, and pages.' },
  { domain: 'instagram.com', name: 'Instagram', priority: 'medium', category: 'social',
    methods: ['totp', 'sms'], setupUrl: 'https://www.instagram.com/accounts/two_factor_authentication/',
    recovery: ['backup_codes'], reason: 'Account theft is the #1 Instagram support request.' },
  { domain: 'twitter.com', name: 'X (Twitter)', priority: 'medium', category: 'social',
    methods: ['totp', 'webauthn'], setupUrl: 'https://twitter.com/settings/account/login_verification',
    recovery: ['backup_codes', 'security_keys'], reason: 'Public voice — keep it yours.' },
  { domain: 'x.com', name: 'X (Twitter)', priority: 'medium', category: 'social',
    methods: ['totp', 'webauthn'], setupUrl: 'https://x.com/settings/account/login_verification',
    recovery: ['backup_codes', 'security_keys'], reason: 'Public voice — keep it yours.' },
  { domain: 'discord.com', name: 'Discord', priority: 'medium', category: 'social',
    methods: ['totp'], setupUrl: 'https://discord.com/channels/@me',
    recovery: ['backup_codes'], reason: 'Communities and DMs — a top phishing surface.' },
  { domain: 'reddit.com', name: 'Reddit', priority: 'low', category: 'social',
    methods: ['totp'], setupUrl: 'https://www.reddit.com/settings/safety-privacy',
    recovery: ['backup_codes'], reason: 'Reddit hijacks fuel scam campaigns.' },
  { domain: 'cloudflare.com', name: 'Cloudflare', priority: 'critical', category: 'dev',
    methods: ['totp', 'webauthn'], setupUrl: 'https://dash.cloudflare.com/profile/authentication',
    recovery: ['backup_codes', 'security_keys'], reason: 'Your DNS and edge — the keys to the internet for your domains.' },
  { domain: 'aws.amazon.com', name: 'AWS', priority: 'critical', category: 'cloud',
    methods: ['totp', 'webauthn'], setupUrl: 'https://console.aws.amazon.com/iam/home#/security_credentials',
    recovery: ['security_keys'], reason: 'A compromised AWS account can drain a budget in hours.' },
  { domain: 'digitalocean.com', name: 'DigitalOcean', priority: 'high', category: 'cloud',
    methods: ['totp'], setupUrl: 'https://cloud.digitalocean.com/account/security',
    recovery: ['backup_codes'], reason: 'Servers, databases, droplets — protect your infrastructure.' },
  { domain: 'vercel.com', name: 'Vercel', priority: 'high', category: 'dev',
    methods: ['totp', 'webauthn'], setupUrl: 'https://vercel.com/account',
    recovery: ['backup_codes'], reason: 'Production deploys with one click — that needs 2FA.' },
  { domain: 'netlify.com', name: 'Netlify', priority: 'high', category: 'dev',
    methods: ['totp'], setupUrl: 'https://app.netlify.com/user/settings',
    recovery: ['backup_codes'], reason: 'Live deploys belong behind 2FA.' },
  { domain: 'supabase.com', name: 'Supabase', priority: 'high', category: 'dev',
    methods: ['totp'], setupUrl: 'https://supabase.com/dashboard/account/security',
    recovery: ['backup_codes'], reason: 'Your database lives here.' },
  { domain: 'shopify.com', name: 'Shopify', priority: 'high', category: 'finance',
    methods: ['totp', 'webauthn'], setupUrl: 'https://accounts.shopify.com/lookup',
    recovery: ['backup_codes'], reason: 'Storefronts and payouts deserve 2FA.' },
  { domain: 'okta.com', name: 'Okta', priority: 'critical', category: 'work',
    methods: ['totp', 'webauthn', 'push'], setupUrl: 'https://login.okta.com',
    recovery: ['security_keys'], reason: 'SSO is the key to every other app — protect it first.' },
  { domain: '1password.com', name: '1Password', priority: 'critical', category: 'cloud',
    methods: ['totp', 'webauthn'], setupUrl: 'https://my.1password.com/profile',
    recovery: ['security_keys'], reason: 'A password manager without 2FA is a single point of failure.' },
  { domain: 'lastpass.com', name: 'LastPass', priority: 'critical', category: 'cloud',
    methods: ['totp'], setupUrl: 'https://lastpass.com/?ac=1',
    recovery: ['backup_codes'], reason: 'Especially after past breaches — 2FA is non-negotiable.' },
  { domain: 'twitch.tv', name: 'Twitch', priority: 'medium', category: 'social',
    methods: ['totp', 'sms'], setupUrl: 'https://www.twitch.tv/settings/security',
    recovery: ['phone'], reason: 'Streamers are prime account-theft targets.' },
  { domain: 'steampowered.com', name: 'Steam', priority: 'medium', category: 'shopping',
    methods: ['totp'], setupUrl: 'https://store.steampowered.com/twofactor/manage',
    recovery: ['email'], reason: 'Game libraries and saved cards — protect both.' },
];

const CATALOG_BY_DOMAIN = new Map<string, MFACatalogEntry>(
  MFA_CATALOG.map((entry) => [entry.domain, entry]),
);

/** Best-effort canonicalisation of a URL or hostname into a catalog key. */
export function canonicalDomain(input?: string | null): string | null {
  if (!input) return null;
  let host = input.trim().toLowerCase();
  if (!host) return null;
  try {
    if (!host.includes('://')) host = `https://${host}`;
    host = new URL(host).hostname;
  } catch {
    // not a URL, keep raw
  }
  host = host.replace(/^www\./, '');
  if (CATALOG_BY_DOMAIN.has(host)) return host;
  const parts = host.split('.');
  while (parts.length > 1) {
    const candidate = parts.join('.');
    if (CATALOG_BY_DOMAIN.has(candidate)) return candidate;
    parts.shift();
  }
  return null;
}

export function lookupCatalog(input?: string | null): MFACatalogEntry | null {
  const domain = canonicalDomain(input);
  return domain ? CATALOG_BY_DOMAIN.get(domain) ?? null : null;
}

export function priorityWeight(priority: MFAPriority): number {
  switch (priority) {
    case 'critical': return 4;
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
  }
}
