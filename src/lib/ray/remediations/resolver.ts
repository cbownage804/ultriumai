/**
 * resolver — maps an open ray_recommendation row to a concrete Remediation
 * from the catalog. Best-effort keyword matching against title/body/category
 * so Ray can offer inline "Fix Now" without a hardcoded lookup table on the
 * recommendation side.
 */
import { REMEDIATION_CATALOG } from './catalog';
import type { Remediation } from './types';

export interface RayRecommendationLite {
  id: string;
  title: string;
  body?: string | null;
  category?: string | null;
  severity?: string | null;
  rule_slug?: string | null;
}

export interface ResolvedRemediation {
  remediation: Remediation;
  confidence: number; // 0–100
  reason: string;
}

/** Explicit rule_slug → remediation slug map (highest confidence). */
const RULE_SLUG_MAP: Record<string, string> = {
  defender_disabled: 'enable-defender',
  defender_signatures_stale: 'update-defender-signatures',
  defender_pua_off: 'enable-defender-pua',
  defender_cloud_off: 'enable-defender-cloud',
  firewall_off: 'enable-firewall',
  rdp_enabled: 'disable-rdp',
  rdp_nla_off: 'enable-rdp-nla',
  builtin_admin_enabled: 'disable-builtin-administrator',
  updates_pending: 'install-windows-updates',
  browser_password_manager_on: 'disable-browser-password-manager',
  weak_password_detected: 'ms365-force-password-reset',
  risky_signin: 'ms365-revoke-sessions',
  mfa_missing: 'ms365-force-password-reset',
  account_compromise_suspected: 'ms365-disable-user',
  suspicious_sessions: 'ms365-revoke-sessions',
  risky_user_flagged: 'ms365-dismiss-risky-user',
};

/**
 * Given a recommendation, return the best matching remediation.
 * null when no confident match exists — the UI hides Fix Now for those.
 */
export function resolveRemediationForRec(
  rec: RayRecommendationLite,
): ResolvedRemediation | null {
  // 1. Exact rule_slug lookup — highest confidence
  if (rec.rule_slug && RULE_SLUG_MAP[rec.rule_slug]) {
    const r = REMEDIATION_CATALOG.find((x) => x.slug === RULE_SLUG_MAP[rec.rule_slug!]);
    if (r) return { remediation: r, confidence: r.confidenceHint ?? 95, reason: 'rule_slug match' };
  }

  const haystack = `${rec.title} ${rec.body ?? ''} ${rec.category ?? ''}`.toLowerCase();

  // 2. Keyword scan against catalog metadata
  let best: { r: Remediation; score: number } | null = null;
  for (const r of REMEDIATION_CATALOG) {
    let score = 0;
    const words: string[] = [
      ...(r.keywords ?? []),
      ...r.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3),
      r.category,
    ];
    for (const w of words) {
      if (!w) continue;
      if (haystack.includes(w.toLowerCase())) score += 1;
    }
    if (score > 0 && (!best || score > best.score)) best = { r, score };
  }
  if (!best) return null;

  const confidence = Math.min(95, 55 + best.score * 8 + (best.r.confidenceHint ? 5 : 0));
  return {
    remediation: best.r,
    confidence,
    reason: `matched ${best.score} keyword${best.score === 1 ? '' : 's'}`,
  };
}

/** Convenience for the pending-remediations card — filter a rec list to actionable pairs. */
export function resolveAll(recs: RayRecommendationLite[]): Array<{ rec: RayRecommendationLite; resolved: ResolvedRemediation }> {
  const out: Array<{ rec: RayRecommendationLite; resolved: ResolvedRemediation }> = [];
  for (const rec of recs) {
    const resolved = resolveRemediationForRec(rec);
    if (resolved) out.push({ rec, resolved });
  }
  return out;
}
