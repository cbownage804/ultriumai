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

  // Serious / multi-account breach signals -> full response
  if (
    (hay.includes('breach') || hay.includes('exposed') || hay.includes('leak')) &&
    (hay.includes('critical') || hay.includes('serious') || hay.includes('multiple') || hay.includes('reused'))
  ) {
    return 'breach-response-full';
  }
  if (hay.includes('breach') || hay.includes('exposed') || hay.includes('leak')) {
    return 'resolve-credential-exposure';
  }
  if (hay.includes('passkey')) return 'passkey-upgrade';
  if (hay.includes('sms') && (hay.includes('2fa') || hay.includes('mfa'))) return 'mfa-enroll-everywhere';
  if (hay.includes('authenticator') || hay.includes('security key') || hay.includes('yubikey')) return 'mfa-enroll-everywhere';
  if (hay.includes('every account') || hay.includes('all accounts')) {
    if (hay.includes('mfa') || hay.includes('2fa')) return 'mfa-enroll-everywhere';
  }
  if (hay.includes('mfa') || hay.includes('2fa') || hay.includes('two-factor') || hay.includes('two factor')) {
    return 'mfa-setup';
  }
  if (hay.includes('connected app') || hay.includes('oauth') || hay.includes('third-party app')) return 'oauth-app-audit';
  if (hay.includes('credit') && (hay.includes('freeze') || hay.includes('fraud'))) return 'freeze-credit';
  if (hay.includes('data broker') || hay.includes('remove my data') || hay.includes('opt out')) return 'exposure-cleanup';
  if (hay.includes('google')) return 'secure-google';
  if (hay.includes('microsoft') || hay.includes('outlook') || hay.includes('office 365') || hay.includes('m365')) {
    return 'secure-microsoft';
  }
  if (hay.includes('device') || ctx === 'devices') return 'verify-devices';
  if (hay.includes('identity') || ctx === 'identity' || ctx === 'exposure' || hay.includes('dark web')) {
    return 'exposure-cleanup';
  }
  if (hay.includes('weak') || hay.includes('reuse') || hay.includes('password') || ctx === 'passwords') {
    return 'password-replacement';
  }
  return 'password-replacement';
}
