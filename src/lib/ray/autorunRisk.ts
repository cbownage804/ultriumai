/**
 * autorunRisk — heuristic risk score + one-line reason for each autorun so
 * the operator can decide quickly which unsigned items to keep, trust, or
 * disable. Pure client-side, no network. Deliberately conservative: legit
 * unsigned software (Adobe, Razer, Datto…) scores low; anything running out
 * of a temp/user-writable path scores high.
 */

export interface AutorunLike {
  location: string;
  name: string;
  command: string;
  publisher?: string;
  signed?: boolean;
  signature?: string;
}

export type RiskLevel = 'low' | 'medium' | 'high';

export interface AutorunRisk {
  score: number;          // 0-100, higher = more suspicious
  level: RiskLevel;
  reasons: string[];      // human-readable bullet points
  summary: string;        // one-line reason to display next to the badge
}

// Publishers we've seen shipping unsigned autoruns that are still legitimate
// out of the box. Matches on the publisher string OR command path.
const TRUSTED_VENDOR_MARKERS = [
  'Adobe',
  'Razer',
  'Datto',
  'Dell',
  'Alienware',
  'Realtek',
  'Cisco',
  'Microsoft',
  'NVIDIA',
  'Intel',
  'Logitech',
  'Lenovo',
  'HP Inc',
  'Hewlett-Packard',
  'ASUS',
  'Synaptics',
  'ProSystem fx',
  'WK\\', // Wolters Kluwer CCH
];

// Locations / paths that make an unsigned autorun much more suspicious.
const HIGH_RISK_PATH_MARKERS = [
  '\\AppData\\Local\\Temp\\',
  '\\AppData\\Roaming\\Temp\\',
  '\\Users\\Public\\',
  '\\ProgramData\\Temp\\',
  '\\Windows\\Temp\\',
  '\\Downloads\\',
];

const SUSPICIOUS_EXTENSIONS = ['.js', '.vbs', '.bat', '.cmd', '.ps1', '.hta', '.wsf', '.scr'];

const LOLBIN_MARKERS = ['powershell', 'mshta', 'wscript', 'cscript', 'rundll32', 'regsvr32', 'certutil'];

function looksLikeTrustedVendor(a: AutorunLike): boolean {
  const hay = `${a.publisher ?? ''} ${a.command ?? ''}`.toLowerCase();
  return TRUSTED_VENDOR_MARKERS.some((v) => hay.includes(v.toLowerCase()));
}

function commandPath(a: AutorunLike): string {
  const cmd = (a.command ?? '').trim();
  if (!cmd) return '';
  // Strip quoted first token, or take up to first space.
  if (cmd.startsWith('"')) {
    const end = cmd.indexOf('"', 1);
    return end > 0 ? cmd.slice(1, end) : cmd;
  }
  const sp = cmd.indexOf(' ');
  return sp > 0 ? cmd.slice(0, sp) : cmd;
}

export function scoreAutorun(a: AutorunLike): AutorunRisk {
  const reasons: string[] = [];
  let score = 0;

  const path = commandPath(a).toLowerCase();
  const isUnsigned = a.signed === false;
  const unknownSigning = a.signed === undefined;
  const hasPublisher = !!(a.publisher && a.publisher.trim());

  if (isUnsigned) {
    score += 25;
    reasons.push('Binary is not code-signed');
  } else if (unknownSigning) {
    score += 10;
    reasons.push('Signature status unknown');
  }

  if (isUnsigned && !hasPublisher) {
    score += 15;
    reasons.push('No publisher declared');
  }

  // Publisher / path mismatch — publisher says one vendor, path lives elsewhere.
  if (hasPublisher && path) {
    const pub = a.publisher!.toLowerCase();
    const firstWord = pub.split(/[\s,]/)[0];
    if (firstWord && firstWord.length >= 4 && !path.includes(firstWord)) {
      // Suppress the noise for very common OEM/Microsoft cases.
      if (!path.includes('program files') || firstWord === 'microsoft') {
        // don't double-penalize obvious system paths
      }
      if (path.includes('\\appdata\\') || path.includes('\\temp\\') || path.includes('\\downloads\\')) {
        score += 20;
        reasons.push(`Publisher "${a.publisher}" but runs from a user-writable path`);
      }
    }
  }

  // Path lives somewhere writable by any user.
  const highRisk = HIGH_RISK_PATH_MARKERS.find((m) => path.includes(m.toLowerCase()));
  if (highRisk) {
    score += 30;
    reasons.push(`Runs from ${highRisk.trim()} — a user-writable location`);
  }

  // Script or interpreted extension.
  const ext = SUSPICIOUS_EXTENSIONS.find((e) => path.endsWith(e));
  if (ext) {
    score += 20;
    reasons.push(`Executes a ${ext} script at every boot`);
  }

  // Living-off-the-land binary in the command line.
  const lolbin = LOLBIN_MARKERS.find((b) => (a.command ?? '').toLowerCase().includes(b));
  if (lolbin) {
    score += 15;
    reasons.push(`Command invokes ${lolbin}`);
  }

  // Trust bonus — well-known OEM vendors even when unsigned.
  if (isUnsigned && looksLikeTrustedVendor(a)) {
    score = Math.max(0, score - 30);
    if (reasons.length === 0 || reasons.every((r) => r.startsWith('Binary is not code-signed'))) {
      reasons.push('Publisher matches a known OEM/vendor');
    }
  }

  // Clamp.
  score = Math.max(0, Math.min(100, score));

  let level: RiskLevel = 'low';
  if (score >= 60) level = 'high';
  else if (score >= 30) level = 'medium';

  const summary =
    reasons[0] ??
    (isUnsigned ? 'Unsigned, no other red flags' : 'Signed — routine');

  return { score, level, reasons, summary };
}
