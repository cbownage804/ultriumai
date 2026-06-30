/**
 * Weighted security score derived from real findings. Documented formula:
 *
 *   base 100
 *   - 8  per breached credential   (cap -40)
 *   - 4  per weak password         (cap -30)
 *   - 3  per reused-password group (cap -20)
 *   - 2  per empty password        (cap -10)
 *   - 1  per missing url/username  (cap -10 combined)
 *   - 2  per stale password (>1yr) (cap -10)
 *   + small bonus if a meaningful share of passwords are strong
 *   clamp 0..100
 */
import type { PasswordIntelligenceResult } from './passwordIntelligence';

export interface ScoreFactor {
  label: string;
  delta: number;
}

export interface ScoreResult {
  score: number;
  factors: ScoreFactor[];
}

const cap = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function calculateScore(intel: PasswordIntelligenceResult): ScoreResult {
  const factors: ScoreFactor[] = [];
  let score = 100;

  const breached = intel.findings.filter((f) => f.kind === 'breached').length;
  if (breached > 0) {
    const d = cap(breached * 8, 0, 40);
    score -= d;
    factors.push({ label: `${breached} breached credential${breached === 1 ? '' : 's'}`, delta: -d });
  }

  if (intel.weak > 0) {
    const d = cap(intel.weak * 4, 0, 30);
    score -= d;
    factors.push({ label: `${intel.weak} weak password${intel.weak === 1 ? '' : 's'}`, delta: -d });
  }

  // Reused groups: count unique pairs of duplicates as "groups"
  const reusedGroups = new Set(
    intel.findings.filter((f) => f.kind === 'reused').map((f) => String(f.details?.group_size ?? '')),
  ).size;
  if (intel.reusedCount > 0) {
    const d = cap(reusedGroups * 3, 0, 20);
    score -= d;
    factors.push({ label: `${intel.reusedCount} reused password${intel.reusedCount === 1 ? '' : 's'}`, delta: -d });
  }

  if (intel.empty > 0) {
    const d = cap(intel.empty * 2, 0, 10);
    score -= d;
    factors.push({ label: `${intel.empty} empty password${intel.empty === 1 ? '' : 's'}`, delta: -d });
  }

  const missing = intel.missingUrl + intel.missingUsername;
  if (missing > 0) {
    const d = cap(missing, 0, 10);
    score -= d;
    factors.push({ label: `${missing} missing field${missing === 1 ? '' : 's'}`, delta: -d });
  }

  if (intel.oldCount > 0) {
    const d = cap(intel.oldCount * 2, 0, 10);
    score -= d;
    factors.push({ label: `${intel.oldCount} stale password${intel.oldCount === 1 ? '' : 's'}`, delta: -d });
  }

  if (intel.total >= 5) {
    const strongShare = intel.strong / intel.total;
    if (strongShare >= 0.6) {
      const bonus = 5;
      score += bonus;
      factors.push({ label: `${Math.round(strongShare * 100)}% of passwords are strong`, delta: bonus });
    }
  }

  return { score: cap(Math.round(score), 0, 100), factors };
}
