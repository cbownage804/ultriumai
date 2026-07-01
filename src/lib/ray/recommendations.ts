/**
 * Recommendations generator — deterministic, ranked, and tied back to the
 * findings that produced them. Nothing here is invented.
 */
import type { PasswordIntelligenceResult, PasswordFinding } from './passwordIntelligence';

export interface Recommendation {
  title: string;
  body: string;
  priority: number; // 1 (highest) .. 100
  source_finding_ids: string[]; // populated after findings are persisted
  source_kinds: PasswordFinding['kind'][];
  /**
   * Stable key identifying the goal this recommendation exists to achieve.
   * Ray never shows two active recommendations with the same objective for
   * the same user — enforced by a partial unique index on
   * `ray_recommendations(user_id, objective)` where the row is still open.
   */
  objective: string;
}

export interface RayProfileInput {
  audience?: 'personal' | 'family' | 'business' | null;
  providers?: Record<string, boolean>;
  existing_manager?: string | null;
}

/**
 * The "start here" recommendation for a user whose vault is empty.
 * Kept as its own helper so onboarding, the morning brief, and the
 * dashboard can all emit the same one without duplicating copy.
 */
export function importPasswordsRecommendation(): Recommendation {
  return {
    title: 'Protect your passwords with Wrayth',
    body: 'Import from your browser or password manager, or save your first password. Once your vault is set up, Ray takes over — monitoring, breach detection, and guidance follow automatically.',
    priority: 1,
    source_finding_ids: [],
    source_kinds: [],
    objective: 'import_passwords',
  };
}

export function generateRecommendations(
  intel: PasswordIntelligenceResult,
  profile: RayProfileInput,
  breachDegraded: boolean,
): Recommendation[] {
  const recs: Recommendation[] = [];
  const breached = intel.findings.filter((f) => f.kind === 'breached').length;

  // Lifecycle: an empty vault has exactly one objective — get passwords in.
  if (intel.total === 0) {
    return [importPasswordsRecommendation()];
  }

  if (breached > 0) {
    recs.push({
      title: `Rotate ${breached} breached password${breached === 1 ? '' : 's'} first`,
      body: `${breached} of your credentials appear in known data breaches. These are the highest-risk items in your vault — replace them today.`,
      priority: 1,
      source_finding_ids: [],
      source_kinds: ['breached'],
      objective: 'rotate_breached',
    });
  }

  if (intel.reusedCount > 0) {
    recs.push({
      title: `Stop reusing ${intel.reusedCount} password${intel.reusedCount === 1 ? '' : 's'}`,
      body: `Reusing passwords means one breach unlocks every account that shares it. I can generate unique replacements when you're ready.`,
      priority: 10,
      source_finding_ids: [],
      source_kinds: ['reused'],
      objective: 'stop_password_reuse',
    });
  }

  if (intel.weak > 0) {
    recs.push({
      title: `Strengthen ${intel.weak} weak password${intel.weak === 1 ? '' : 's'}`,
      body: `These passwords are short or use common patterns. A 16+ character mix of letters, numbers, and symbols is the baseline I'd recommend.`,
      priority: 20,
      source_finding_ids: [],
      source_kinds: ['weak'],
      objective: 'strengthen_weak_passwords',
    });
  }

  if (intel.empty > 0) {
    recs.push({
      title: `${intel.empty} entr${intel.empty === 1 ? 'y is' : 'ies are'} missing a password`,
      body: `These vault entries don't have a password stored. Either fill them in or remove them so the vault stays clean.`,
      priority: 30,
      source_finding_ids: [],
      source_kinds: ['empty'],
      objective: 'fill_empty_entries',
    });
  }

  if (intel.oldCount > 0) {
    recs.push({
      title: `Refresh ${intel.oldCount} password${intel.oldCount === 1 ? '' : 's'} older than a year`,
      body: `These haven't been changed in over a year. Rotating them periodically limits the blast radius if one quietly leaks.`,
      priority: 40,
      source_finding_ids: [],
      source_kinds: ['old'],
      objective: 'refresh_old_passwords',
    });
  }

  if (profile.providers?.microsoft) {
    recs.push({
      title: 'Confirm MFA is enabled on your Microsoft account',
      body: 'You told me Microsoft 365 is part of your environment. Verify MFA is active — it blocks more than 99% of automated takeover attempts.',
      priority: 50,
      source_finding_ids: [],
      source_kinds: ['no_mfa'],
      objective: 'mfa_microsoft',
    });
  }
  if (profile.providers?.google) {
    recs.push({
      title: 'Confirm 2-Step Verification on your Google account',
      body: 'Since you live in Google Workspace, 2SV on the root account is non-negotiable. I\'ll watch for sign-in anomalies from there.',
      priority: 51,
      source_finding_ids: [],
      source_kinds: ['no_mfa'],
      objective: 'mfa_google',
    });
  }
  if (profile.providers?.apple) {
    recs.push({
      title: 'Confirm two-factor on your Apple ID',
      body: 'Your Apple ID gates iCloud Keychain, Find My, and backups. Two-factor must be on.',
      priority: 52,
      source_finding_ids: [],
      source_kinds: ['no_mfa'],
      objective: 'mfa_apple',
    });
  }

  if (intel.missingUrl + intel.missingUsername > 0) {
    recs.push({
      title: 'Fill in missing usernames and site URLs',
      body: 'Autofill only works when each entry has the right URL and username. I\'ll handle the heavy lifting once they\'re in.',
      priority: 70,
      source_finding_ids: [],
      source_kinds: ['missing_url', 'missing_username'],
      objective: 'fill_metadata',
    });
  }

  if (breachDegraded) {
    recs.push({
      title: 'Breach check needs another pass',
      body: 'I couldn\'t reach the breach intelligence service during onboarding. I\'ll retry automatically and let you know what I find.',
      priority: 90,
      source_finding_ids: [],
      source_kinds: ['breached'],
      objective: 'retry_breach_check',
    });
  }

  return recs.sort((a, b) => a.priority - b.priority);
}
