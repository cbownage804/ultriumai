/**
 * Map a Ray recommendation to the playbook slug that resolves it.
 *
 * Recommendations don't carry a structured `kind`, so we infer from
 * `page_context` + title/body keywords. The mapping is conservative —
 * unknown shapes fall back to a generic, useful playbook.
 */
import type { RayRecommendation } from '@/lib/ray/brain';

export function playbookForRecommendation(rec: Pick<RayRecommendation, 'title' | 'body' | 'page_context'>): string {
  const hay = `${rec.title ?? ''} ${rec.body ?? ''}`.toLowerCase();
  const ctx = (rec.page_context ?? '').toLowerCase();

  if (hay.includes('breach') || hay.includes('exposed') || hay.includes('leak')) {
    return 'resolve-credential-exposure';
  }
  if (hay.includes('passkey')) return 'passkey-upgrade';
  if (hay.includes('mfa') || hay.includes('2fa') || hay.includes('two-factor') || hay.includes('two factor')) {
    return 'mfa-setup';
  }
  if (hay.includes('google')) return 'secure-google';
  if (hay.includes('microsoft') || hay.includes('outlook') || hay.includes('office 365') || hay.includes('m365')) {
    return 'secure-microsoft';
  }
  if (hay.includes('device') || ctx === 'devices') return 'verify-devices';
  if (hay.includes('identity') || ctx === 'identity' || ctx === 'exposure' || hay.includes('dark web')) {
    return 'protect-identity';
  }
  if (hay.includes('weak') || hay.includes('reuse') || hay.includes('password') || ctx === 'passwords') {
    return 'password-replacement';
  }
  return 'password-replacement';
}
