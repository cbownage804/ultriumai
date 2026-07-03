/**
 * Shared deduplication for Ray recommendations. Collapses related items into
 * "families" (passwords, MFA, updates, encryption, etc.) so the launcher pill,
 * briefing header, and priority list all report the same grouped count.
 */

const STOPWORDS = new Set([
  'the','a','an','your','my','with','for','and','to','of','in','on','is','be','are',
  'about','from','this','that','it','into','via','using','use','how','why','what',
  'wrayth','ray','please','can','you','me','i',
]);

function topicKey(text: string): string {
  const words = (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  return words.slice(0, 2).sort().join('|');
}

const FAMILY_PATTERNS: Array<[string, RegExp]> = [
  ['passwords',  /(password|passphrase|credential|vault|safepass|breach|leaked|pwned|reused|weak\s*pass|1password|lastpass|bitwarden)/i],
  ['mfa',        /(mfa|2fa|multi[-\s]?factor|two[-\s]?factor|authenticator|totp|passkey)/i],
  ['updates',    /(update|patch|upgrade|out[-\s]?of[-\s]?date|outdated|version)/i],
  ['encryption', /(bitlocker|filevault|encrypt|luks)/i],
  ['firewall',   /(firewall|defender|antivirus|edr|xdr|malware)/i],
  ['backup',     /(backup|snapshot|restore\s*point)/i],
  ['network',    /(wifi|wi-fi|network|vpn|dns|router)/i],
  ['browser',    /(browser|chrome|edge|firefox|safari|extension)/i],
  ['email',      /(email|inbox|phishing|spam|microsoft\s*365|m365|google\s*workspace)/i],
];

export function familyKey(r: { title: string; category?: string | null; rule_slug?: string | null }): string {
  const hay = `${r.title ?? ''} ${r.category ?? ''} ${r.rule_slug ?? ''}`;
  for (const [name, rx] of FAMILY_PATTERNS) if (rx.test(hay)) return `fam:${name}`;
  return `topic:${topicKey(r.title)}`;
}

export function dedupeRecs<T extends { id: string; title: string; category?: string | null; rule_slug?: string | null; severity?: string | null }>(recs: T[]): T[] {
  const rank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  const bestByFamily = new Map<string, T>();
  for (const r of recs) {
    const key = familyKey(r);
    const cur = bestByFamily.get(key);
    if (!cur || (rank[(r.severity ?? '').toLowerCase()] ?? 0) > (rank[(cur.severity ?? '').toLowerCase()] ?? 0)) {
      bestByFamily.set(key, r);
    }
  }
  const firstSeen = new Map<string, number>();
  recs.forEach((r, i) => { const k = familyKey(r); if (!firstSeen.has(k)) firstSeen.set(k, i); });
  return Array.from(bestByFamily.values()).sort((a, b) => (firstSeen.get(familyKey(a))! - firstSeen.get(familyKey(b))!));
}
