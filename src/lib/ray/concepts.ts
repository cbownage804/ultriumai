// Wrayth — Plain-English Security Concept Dictionary
// Ray's translation layer. One or two sentences. No jargon.
// Used by the browser extension (hover tooltips) and the app.

export type ConceptEntry = {
  term: string;
  aliases?: string[];
  short: string; // 1-2 sentences, plain English
  whyItMatters?: string; // optional, used by "Teach me why" mode
};

export const RAY_CONCEPTS: ConceptEntry[] = [
  {
    term: "Passkeys",
    aliases: ["passkey", "pass key"],
    short: "A passkey lets you sign in with your face, fingerprint, or device PIN instead of a password. It can't be phished or stolen in a breach.",
    whyItMatters: "Passkeys remove the #1 cause of account takeover — reused or stolen passwords.",
  },
  {
    term: "Backup Codes",
    aliases: ["recovery codes", "one-time codes"],
    short: "One-time emergency codes that let you sign in if you lose your phone. Store them somewhere safe and offline.",
    whyItMatters: "Without backup codes, losing your phone can lock you out of your account permanently.",
  },
  {
    term: "Security Keys",
    aliases: ["hardware key", "yubikey", "fido2"],
    short: "A small USB or NFC device that proves it's really you. Phishing-resistant and works even if your password leaks.",
    whyItMatters: "Security keys block every phishing kit currently used by attackers.",
  },
  {
    term: "Authenticator App",
    aliases: ["totp", "authenticator", "google authenticator", "authy"],
    short: "An app on your phone that generates a 6-digit code every 30 seconds to confirm it's you signing in.",
    whyItMatters: "Codes generated on your device are far safer than codes sent over SMS.",
  },
  {
    term: "Two-Factor Authentication",
    aliases: ["2fa", "two factor", "two-step verification", "mfa", "multi-factor"],
    short: "A second check after your password — usually a code or tap on your phone — so a stolen password isn't enough to break in.",
    whyItMatters: "MFA blocks more than 99% of automated account-takeover attacks.",
  },
  {
    term: "Recovery Email",
    short: "A backup email address used to help you regain access if you ever get locked out. Make sure it's an account you fully control.",
    whyItMatters: "If your recovery email is old or compromised, an attacker can use it to reset your password.",
  },
  {
    term: "Recovery Phone",
    short: "A backup phone number used if you can't sign in. Keep it current — an outdated number can lock you out.",
    whyItMatters: "Recovery phone numbers are a common path attackers use via SIM-swap fraud — keep yours current and consider an authenticator app instead.",
  },
  {
    term: "OAuth",
    aliases: ["sign in with google", "sign in with apple", "sso"],
    short: "A way to sign into one site using another account you already have — like 'Sign in with Google'. The other site never sees your password.",
    whyItMatters: "Using OAuth means fewer passwords to manage and no new password for attackers to steal.",
  },
  {
    term: "Conditional Access",
    short: "Rules that decide who can sign in, from where, and on which devices. Helps block sign-ins that look risky.",
    whyItMatters: "Conditional access is how organizations stop logins from countries or devices you'd never use.",
  },
  {
    term: "Device Encryption",
    aliases: ["bitlocker", "filevault", "disk encryption"],
    short: "Scrambles everything on your device so it can't be read if someone steals it. You unlock it with your password or face.",
    whyItMatters: "Without encryption, anyone with your laptop can read your files just by removing the drive.",
  },
  {
    term: "Least Privilege",
    short: "Giving each person (or app) only the access they actually need — nothing more.",
    whyItMatters: "Least privilege limits the damage if any single account ever gets compromised.",
  },
  {
    term: "Administrator Role",
    aliases: ["admin role", "global admin"],
    short: "An account with the power to change settings for everyone. Treat it carefully — only use it when needed.",
    whyItMatters: "Admin accounts are the #1 target for attackers because one compromise affects the entire organization.",
  },
  {
    term: "Legacy Authentication",
    short: "Older sign-in methods that don't support modern protections like MFA. Best to turn off if your accounts allow it.",
    whyItMatters: "Legacy protocols are how attackers bypass MFA — disabling them closes a major back door.",
  },
  {
    term: "SSH Keys",
    aliases: ["ssh key"],
    short: "A pair of cryptographic files that let you sign into servers or GitHub without typing a password. Safer and faster than passwords.",
    whyItMatters: "SSH keys can't be phished or guessed like passwords can.",
  },
  {
    term: "Trusted Devices",
    short: "Devices you've told an account to remember, so it doesn't ask for full verification every time. Review the list and remove anything you don't recognize.",
    whyItMatters: "An old trusted device is a quiet way for an attacker to keep access after a breach.",
  },
  {
    term: "App Passwords",
    short: "Special one-off passwords for older apps that don't support modern sign-in. Use only when you have to, then revoke when done.",
    whyItMatters: "App passwords skip MFA — leaving old ones active is a common security gap.",
  },
  {
    term: "Connected Apps",
    aliases: ["third-party apps", "app permissions"],
    short: "Apps you've allowed to read or change parts of your account. Review them regularly and remove anything you don't use.",
    whyItMatters: "Forgotten connected apps are a frequent source of silent data leaks.",
  },
];

// Quick lookup helpers
const _termIndex = (() => {
  const map = new Map<string, ConceptEntry>();
  for (const c of RAY_CONCEPTS) {
    map.set(c.term.toLowerCase(), c);
    for (const a of c.aliases || []) map.set(a.toLowerCase(), c);
  }
  return map;
})();

export function findConcept(text: string): ConceptEntry | null {
  if (!text) return null;
  return _termIndex.get(text.toLowerCase().trim()) || null;
}

export const RAY_CONCEPT_TERMS: string[] = Array.from(
  new Set(RAY_CONCEPTS.flatMap((c) => [c.term, ...(c.aliases || [])])),
);
