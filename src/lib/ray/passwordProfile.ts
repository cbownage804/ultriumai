/**
 * passwordProfile — Ray's deep read on a single credential.
 *
 * Combines multiple signals (entropy, length, dictionary/leet/keyboard/
 * personal-info detection, reuse, breach hits, age, MFA) into one
 * verdict + human-readable recommendation. This is what makes Wrayth
 * feel like an analyst rather than a form validator.
 */

export type ProfileRisk = 'excellent' | 'strong' | 'okay' | 'weak' | 'critical';

export interface ProfileSignal {
  label: string;
  value: string;
  tone: 'good' | 'warn' | 'bad' | 'neutral';
}

export interface ProfileInput {
  password: string;
  title?: string;
  username?: string;
  website?: string;
  createdAt?: string;
  passwordChangedAt?: string;
  hasMfa?: boolean;
  supportsMfa?: boolean;
  reusedOn?: string[];         // other entry titles sharing this password
  breachSources?: string[];    // e.g. ["Collection #1", "COMB"]
  personalHints?: string[];    // words Ray knows about the user (names, years)
}

export interface PasswordProfile {
  risk: ProfileRisk;
  score: number;               // 0..100
  entropyBits: number;
  crackEstimate: string;
  reasons: string[];
  signals: ProfileSignal[];
  rayVerdict: string;
  rayAction?: string;
}

const COMMON = new Set([
  'password', 'password1', '123456', '12345678', 'qwerty', 'letmein',
  'welcome', 'admin', 'iloveyou', 'monkey', 'dragon', 'abc123',
  'sunshine', 'princess', '111111', 'football', 'baseball', 'ninja',
  'master', 'shadow', 'superman', 'trustno1', 'hello', 'summer',
]);

const KEYBOARD_ROWS = [
  'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
  '1234567890', '0987654321', 'qazwsx',
];

const LEET: Record<string, string> = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's', '!': 'i',
};

function delet(pw: string): string {
  return pw
    .toLowerCase()
    .split('')
    .map((c) => LEET[c] ?? c)
    .join('');
}

function containsKeyboardRun(pw: string): boolean {
  const low = pw.toLowerCase();
  for (const row of KEYBOARD_ROWS) {
    for (let i = 0; i <= row.length - 4; i++) {
      if (low.includes(row.slice(i, i + 4))) return true;
    }
  }
  return false;
}

function containsPersonalInfo(pw: string, hints: string[] = []): string[] {
  const hits: string[] = [];
  const low = delet(pw);
  for (const raw of hints) {
    if (!raw) continue;
    const h = raw.toLowerCase().trim();
    if (h.length < 3) continue;
    if (low.includes(h)) hits.push(raw);
  }
  // birth-year style: 19xx / 20xx
  const year = pw.match(/(19|20)\d{2}/);
  if (year) hits.push(`year "${year[0]}"`);
  return hits;
}

function poolSize(pw: string): number {
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/[0-9]/.test(pw)) pool += 10;
  if (/[^A-Za-z0-9]/.test(pw)) pool += 32;
  return pool || 26;
}

function entropyBits(pw: string): number {
  const pool = poolSize(pw);
  return Math.round(pw.length * Math.log2(pool));
}

function crackTime(bits: number): string {
  // Assume 1e11 guesses/sec (offline fast hash). Very rough.
  const seconds = Math.pow(2, bits) / 1e11;
  if (seconds < 1) return 'Instant';
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 86400 * 365) return `${Math.round(seconds / 86400)} days`;
  const years = seconds / (86400 * 365);
  if (years < 1000) return `${Math.round(years)} years`;
  if (years < 1e6) return `${Math.round(years / 1000)}k years`;
  if (years < 1e9) return `${Math.round(years / 1e6)}M years`;
  return 'Centuries';
}

function daysSince(iso?: string): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.round((Date.now() - t) / 86_400_000);
}

export function computePasswordProfile(input: ProfileInput): PasswordProfile {
  const pw = input.password || '';
  const bits = entropyBits(pw);
  const crack = crackTime(bits);
  const reasons: string[] = [];
  const signals: ProfileSignal[] = [];
  let score = 100;

  // Length
  signals.push({
    label: 'Length',
    value: `${pw.length} characters`,
    tone: pw.length >= 14 ? 'good' : pw.length >= 10 ? 'warn' : 'bad',
  });
  if (pw.length < 10) { score -= 30; reasons.push('Too short.'); }
  else if (pw.length < 14) { score -= 10; reasons.push('Could be longer.'); }

  // Entropy
  signals.push({
    label: 'Entropy',
    value: `${bits} bits · ${bits >= 80 ? 'Excellent' : bits >= 60 ? 'Good' : bits >= 40 ? 'Fair' : 'Low'}`,
    tone: bits >= 80 ? 'good' : bits >= 60 ? 'neutral' : bits >= 40 ? 'warn' : 'bad',
  });
  if (bits < 40) { score -= 20; reasons.push('Very low entropy.'); }

  // Common / dictionary
  if (COMMON.has(pw.toLowerCase())) {
    score -= 60;
    reasons.push('Appears in common password lists.');
    signals.push({ label: 'Dictionary', value: 'Common password', tone: 'bad' });
  }

  // Keyboard runs
  if (containsKeyboardRun(pw)) {
    score -= 15;
    reasons.push('Contains a keyboard pattern.');
    signals.push({ label: 'Pattern', value: 'Keyboard run detected', tone: 'bad' });
  }

  // Leet / personal info
  const personal = containsPersonalInfo(pw, input.personalHints);
  if (personal.length) {
    score -= 20;
    reasons.push(`Contains personal info: ${personal.join(', ')}.`);
    signals.push({ label: 'Personal info', value: personal.join(', '), tone: 'bad' });
  }

  // Reuse
  const reused = input.reusedOn ?? [];
  signals.push({
    label: 'Reuse',
    value: reused.length ? `Also on ${reused.slice(0, 3).join(', ')}${reused.length > 3 ? '…' : ''}` : 'None',
    tone: reused.length ? 'bad' : 'good',
  });
  if (reused.length) { score -= 15 + Math.min(reused.length * 5, 25); reasons.push('Reused elsewhere.'); }

  // Breach
  const breaches = input.breachSources ?? [];
  signals.push({
    label: 'Found in breach',
    value: breaches.length ? `Yes · ${breaches.slice(0, 3).join(', ')}${breaches.length > 3 ? '…' : ''}` : 'No',
    tone: breaches.length ? 'bad' : 'good',
  });
  if (breaches.length) { score -= 50; reasons.push('Password appears in known breach data.'); }

  // MFA
  signals.push({
    label: 'MFA',
    value: input.hasMfa ? 'Enabled' : input.supportsMfa ? 'Supported, not enabled' : 'Unknown',
    tone: input.hasMfa ? 'good' : input.supportsMfa ? 'warn' : 'neutral',
  });
  if (!input.hasMfa && input.supportsMfa) { score -= 5; reasons.push('MFA is available but not enabled.'); }

  // Age
  const changed = daysSince(input.passwordChangedAt || input.createdAt);
  if (changed !== null) {
    signals.push({
      label: 'Last changed',
      value: changed < 30 ? 'This month' : changed < 365 ? `${Math.round(changed / 30)} months ago` : `${Math.round(changed / 365)} years ago`,
      tone: changed > 365 ? 'warn' : 'good',
    });
    if (changed > 730) { score -= 10; reasons.push('Not rotated in over two years.'); }
  }

  score = Math.max(0, Math.min(100, score));

  const risk: ProfileRisk =
    breaches.length ? 'critical'
    : score >= 90 ? 'excellent'
    : score >= 75 ? 'strong'
    : score >= 55 ? 'okay'
    : score >= 30 ? 'weak'
    : 'critical';

  signals.unshift({
    label: 'Risk',
    value: risk[0].toUpperCase() + risk.slice(1),
    tone: risk === 'excellent' || risk === 'strong' ? 'good' : risk === 'okay' ? 'warn' : 'bad',
  });

  const label = input.title || input.website || 'this account';
  let rayVerdict: string;
  let rayAction: string | undefined;

  if (risk === 'critical' && breaches.length) {
    rayVerdict = `${label} has appeared in ${breaches.length === 1 ? 'a known breach' : `${breaches.length} breach collections`}${reused.length ? ` and shares its password with ${reused.length} other ${reused.length === 1 ? 'account' : 'accounts'}` : ''}. I'd change this one first.`;
    rayAction = 'Rotate now';
  } else if (risk === 'critical') {
    rayVerdict = `${label} is weak enough to crack in ${crack.toLowerCase()}. I'd replace it today.`;
    rayAction = 'Generate a stronger one';
  } else if (risk === 'weak') {
    rayVerdict = `${label} would take about ${crack.toLowerCase()} to crack. Not great — let's harden it.`;
    rayAction = 'Generate a stronger one';
  } else if (risk === 'okay') {
    rayVerdict = `${label} is passable but ${reasons[0]?.toLowerCase() || 'could be stronger'} I'd upgrade it when you have a minute.`;
  } else if (risk === 'strong') {
    rayVerdict = `${label} is strong. ${input.hasMfa ? 'MFA is on. ' : input.supportsMfa ? "I'd add MFA to make it airtight. " : ''}Nothing urgent here.`;
    if (!input.hasMfa && input.supportsMfa) rayAction = 'Enable MFA';
  } else {
    rayVerdict = `${label} is excellent. I would leave it exactly as it is.`;
  }

  return { risk, score, entropyBits: bits, crackEstimate: crack, reasons, signals, rayVerdict, rayAction };
}
