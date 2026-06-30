/**
 * Password Intelligence — analyzes a set of decrypted credentials and
 * produces concrete findings. No fabricated data: every finding maps to
 * an actual entry the user owns.
 */

export type FindingKind =
  | 'weak'
  | 'reused'
  | 'breached'
  | 'missing_url'
  | 'missing_username'
  | 'empty'
  | 'old'
  | 'no_mfa';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface RawCredential {
  /** Stable identifier (usually the safepass_entries row id once persisted). */
  id: string;
  title: string;
  username?: string;
  password: string;
  url?: string;
  /** Optional last-rotation timestamp if the source exposed it. */
  password_changed_at?: string;
}

export interface PasswordFinding {
  kind: FindingKind;
  severity: Severity;
  entry_id?: string;
  details: Record<string, unknown>;
}

export interface PasswordIntelligenceResult {
  total: number;
  strong: number;
  weak: number;
  empty: number;
  reusedCount: number;
  duplicateCount: number;
  missingUrl: number;
  missingUsername: number;
  oldCount: number;
  findings: PasswordFinding[];
}

const STRONG_MIN_LEN = 14;
const WEAK_MAX_LEN = 9;
const OLD_DAYS = 365;

const COMMON = new Set([
  'password', 'password1', '123456', '12345678', 'qwerty', 'letmein',
  'welcome', 'admin', 'iloveyou', 'monkey', 'dragon', 'abc123',
  'sunshine', 'princess', '111111', 'football', 'baseball',
]);

export function classifyStrength(pw: string): 'empty' | 'weak' | 'medium' | 'strong' {
  if (!pw) return 'empty';
  if (COMMON.has(pw.toLowerCase())) return 'weak';
  if (pw.length <= WEAK_MAX_LEN) return 'weak';
  const classes =
    Number(/[a-z]/.test(pw)) +
    Number(/[A-Z]/.test(pw)) +
    Number(/[0-9]/.test(pw)) +
    Number(/[^A-Za-z0-9]/.test(pw));
  if (pw.length >= STRONG_MIN_LEN && classes >= 3) return 'strong';
  if (pw.length >= 10 && classes >= 2) return 'medium';
  return 'weak';
}

export function analyzePasswords(
  creds: RawCredential[],
  breachedIds: Set<string> = new Set(),
): PasswordIntelligenceResult {
  const findings: PasswordFinding[] = [];
  let strong = 0;
  let weak = 0;
  let empty = 0;
  let missingUrl = 0;
  let missingUsername = 0;
  let oldCount = 0;

  // Reuse map
  const byPw = new Map<string, string[]>();
  for (const c of creds) {
    if (!c.password) continue;
    const arr = byPw.get(c.password) ?? [];
    arr.push(c.id);
    byPw.set(c.password, arr);
  }
  let reusedCount = 0;
  let duplicateCount = 0;
  for (const ids of byPw.values()) {
    if (ids.length > 1) {
      reusedCount += ids.length;
      duplicateCount += ids.length - 1;
      for (const id of ids) {
        findings.push({
          kind: 'reused',
          severity: ids.length >= 4 ? 'high' : 'medium',
          entry_id: id,
          details: { group_size: ids.length },
        });
      }
    }
  }

  const cutoff = Date.now() - OLD_DAYS * 86_400_000;

  for (const c of creds) {
    const klass = classifyStrength(c.password);
    if (klass === 'strong') strong++;
    if (klass === 'weak') {
      weak++;
      findings.push({
        kind: 'weak',
        severity: 'high',
        entry_id: c.id,
        details: { length: c.password.length },
      });
    }
    if (klass === 'empty') {
      empty++;
      findings.push({
        kind: 'empty',
        severity: 'high',
        entry_id: c.id,
        details: {},
      });
    }
    if (!c.url) {
      missingUrl++;
      findings.push({ kind: 'missing_url', severity: 'low', entry_id: c.id, details: {} });
    }
    if (!c.username) {
      missingUsername++;
      findings.push({ kind: 'missing_username', severity: 'low', entry_id: c.id, details: {} });
    }
    if (c.password_changed_at) {
      const t = Date.parse(c.password_changed_at);
      if (!Number.isNaN(t) && t < cutoff) {
        oldCount++;
        findings.push({
          kind: 'old',
          severity: 'medium',
          entry_id: c.id,
          details: { changed_at: c.password_changed_at },
        });
      }
    }
    if (breachedIds.has(c.id)) {
      findings.push({
        kind: 'breached',
        severity: 'critical',
        entry_id: c.id,
        details: { title: c.title },
      });
    }
  }

  return {
    total: creds.length,
    strong,
    weak,
    empty,
    reusedCount,
    duplicateCount,
    missingUrl,
    missingUsername,
    oldCount,
    findings,
  };
}
