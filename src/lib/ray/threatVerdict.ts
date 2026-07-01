/**
 * Ray's threat verdict engine.
 *
 * Produces a first-pass verdict for a URL, email body, or file name that
 * Ray can render immediately — before any vault context is unlocked.
 *
 * The verdict deliberately splits into two layers so the UI can be honest:
 *   - `verdict`: what Ray can determine on its own (safe / suspicious / malicious).
 *   - `personalized`: what Ray can only determine with vault context
 *     (which of *your* accounts this actually touches).
 *
 * This is intentionally lightweight — signature/reputation feeds live in
 * edge functions. This module is the client-side "first read" so Ray can
 * respond in one turn and then upgrade the verdict when context arrives.
 */
export type ThreatSeverity = 'safe' | 'suspicious' | 'malicious';
export type ThreatKind = 'url' | 'email' | 'file' | 'text';

export interface ThreatVerdict {
  kind: ThreatKind;
  input: string;
  severity: ThreatSeverity;
  baseConfidence: number; // 0-100 before context adjustment
  headline: string;       // Ray's plain-English read
  reasons: string[];      // bullets Ray used to score it
  /** Brands or services Ray recognizes in the sample — used to explain
   *  which vault accounts would matter. */
  brands: string[];
}

const KNOWN_BRANDS: Array<{ brand: string; patterns: RegExp[] }> = [
  { brand: 'Microsoft 365', patterns: [/microsoft/i, /office365/i, /outlook/i, /microsoftonline/i] },
  { brand: 'Google', patterns: [/google/i, /gmail/i, /accounts\.google/i] },
  { brand: 'Apple', patterns: [/apple/i, /icloud/i, /appleid/i] },
  { brand: 'Dropbox', patterns: [/dropbox/i] },
  { brand: 'Adobe', patterns: [/adobe/i] },
  { brand: 'GitHub', patterns: [/github/i] },
  { brand: 'PayPal', patterns: [/paypal/i] },
  { brand: 'Amazon', patterns: [/amazon/i, /aws\.amazon/i] },
  { brand: 'DocuSign', patterns: [/docusign/i] },
  { brand: 'LinkedIn', patterns: [/linkedin/i] },
  { brand: 'Slack', patterns: [/slack/i] },
  { brand: 'Netflix', patterns: [/netflix/i] },
];

const PHISH_PHRASES = [
  /verify your (?:account|identity|email)/i,
  /confirm your password/i,
  /unusual sign[- ]?in/i,
  /account (?:has been )?(?:suspended|locked|disabled)/i,
  /update your payment/i,
  /click (?:here|the link) (?:below|to)/i,
  /re[- ]?activate your account/i,
  /you have (?:won|received)/i,
];

const SUSPICIOUS_TLDS = /\.(zip|mov|xyz|top|click|country|link|monster|work|kim|gq|cf|ml|tk)$/i;
const IP_URL = /https?:\/\/(?:\d{1,3}\.){3}\d{1,3}/i;
const PUNYCODE = /xn--/i;
const CREDENTIAL_HARVEST_PATH = /\/(?:login|signin|verify|account|update|secure)[\/?]/i;

function detectBrands(input: string): string[] {
  const found = new Set<string>();
  for (const { brand, patterns } of KNOWN_BRANDS) {
    if (patterns.some((p) => p.test(input))) found.add(brand);
  }
  return Array.from(found);
}

function guessKind(input: string): ThreatKind {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed) || /^[a-z0-9-]+\.[a-z]{2,}(\/|$)/i.test(trimmed)) return 'url';
  if (/from:\s|subject:\s|@[\w.-]+\.[a-z]{2,}/i.test(trimmed) && trimmed.length > 40) return 'email';
  if (/\.(exe|dll|scr|bat|cmd|js|vbs|ps1|apk|dmg|pkg|zip|rar|7z|iso|xlsm|docm)$/i.test(trimmed)) return 'file';
  return 'text';
}

export function analyzeThreat(rawInput: string): ThreatVerdict {
  const input = rawInput.trim();
  const kind = guessKind(input);
  const brands = detectBrands(input);
  const reasons: string[] = [];
  let score = 0;

  if (kind === 'url' || kind === 'text') {
    if (IP_URL.test(input)) { score += 45; reasons.push('The link points at a raw IP address instead of a real domain.'); }
    if (PUNYCODE.test(input)) { score += 35; reasons.push('The domain uses punycode, a common way to fake a familiar brand.'); }
    if (SUSPICIOUS_TLDS.test(input.split('/')[2] ?? input)) { score += 25; reasons.push('The domain uses a top-level suffix frequently abused for phishing.'); }
    if (CREDENTIAL_HARVEST_PATH.test(input)) { score += 15; reasons.push('The path looks like a credential entry page.'); }
    if (brands.length > 0 && !brands.some((b) => new RegExp(b.split(' ')[0], 'i').test(input.split('/')[2] ?? ''))) {
      // Brand name appears in the URL text but not the actual host — classic lure.
      score += 25;
      reasons.push(`The link mentions ${brands.join(', ')} but the actual host doesn't belong to them.`);
    }
  }

  if (kind === 'email' || kind === 'text') {
    for (const phrase of PHISH_PHRASES) {
      if (phrase.test(input)) { score += 15; reasons.push('The wording uses urgency phrases common in credential-harvesting emails.'); break; }
    }
  }

  if (kind === 'file') {
    if (/\.(exe|scr|bat|cmd|ps1|vbs|js|dll)$/i.test(input)) {
      score += 40; reasons.push('The file extension can execute code the moment it opens.');
    } else if (/\.(docm|xlsm)$/i.test(input)) {
      score += 30; reasons.push('The file is a macro-enabled Office document — a common malware delivery method.');
    } else if (/\.(zip|rar|7z|iso)$/i.test(input)) {
      score += 15; reasons.push('The file is an archive, often used to hide the real payload from mail scanners.');
    }
  }

  let severity: ThreatSeverity;
  if (score >= 55) severity = 'malicious';
  else if (score >= 25) severity = 'suspicious';
  else severity = 'safe';

  const headline =
    severity === 'malicious'
      ? "I wouldn't touch this. It has the fingerprints of a real attack."
      : severity === 'suspicious'
      ? "Something is off about this. I'd treat it as suspicious until I know more."
      : "Nothing here trips my alarms. I'll keep watching in case that changes.";

  // Base confidence: how sure Ray is *of the verdict itself*, before
  // personalization. Strong signals raise it; a clean read still leaves
  // room for the vault check to raise it further.
  const baseConfidence = Math.min(95, 55 + score);

  return { kind, input, severity, baseConfidence, headline, reasons, brands };
}
