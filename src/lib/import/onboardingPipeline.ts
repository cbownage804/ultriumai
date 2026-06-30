/**
 * Onboarding pipeline — orchestrates real import, analysis, scoring, and
 * persistence in a single flow. Returns live progress callbacks so the
 * onboarding UI can show actual counts.
 */
import { supabase } from '@/integrations/supabase/client';
import { encryptData, type AADContext } from '@/utils/crypto';
import {
  parseImport,
  dedupe,
  type ImportSource,
  type ParsedCredential,
} from './passwordParsers';
import {
  analyzePasswords,
  type PasswordIntelligenceResult,
  type RawCredential,
} from '@/lib/ray/passwordIntelligence';
import { checkBreaches } from '@/lib/ray/breachIntelligence';
import { calculateScore, type ScoreResult } from '@/lib/ray/scoring';
import { generateRecommendations, type RayProfileInput } from '@/lib/ray/recommendations';
import { rememberFact, recordTimelineEvent } from '@/lib/ray/brain';

/**
 * Persist the onboarding summary as Ray memory + a timeline event so the
 * very first Morning Brief can reference what happened during setup
 * ("Yesterday during setup, I found 12 reused passwords — let's start
 * there.") instead of greeting the user cold.
 */
async function recordOnboardingHandoff(
  userId: string,
  source: ImportSource | 'baseline',
  profile: RayProfileInput,
  intel: PasswordIntelligenceResult,
  score: ScoreResult,
  breachDegraded: boolean,
) {
  const summary = {
    source,
    total: intel.total,
    breached: intel.findings.filter((f) => f.kind === 'breached').length,
    reused: intel.reusedCount,
    weak: intel.weak,
    empty: intel.empty,
    old: intel.oldCount,
    score: score.score,
    breach_degraded: breachDegraded,
    at: new Date().toISOString(),
  };

  await Promise.all([
    rememberFact(userId, 'onboarding.summary', summary, 'system', 1),
    profile.audience ? rememberFact(userId, 'profile.audience', profile.audience, 'user_stated', 1) : Promise.resolve(),
    profile.existing_manager
      ? rememberFact(userId, 'profile.existing_manager', profile.existing_manager, 'user_stated', 1)
      : Promise.resolve(),
    profile.providers && Object.keys(profile.providers).length
      ? rememberFact(userId, 'profile.providers', profile.providers, 'user_stated', 1)
      : Promise.resolve(),
    rememberFact(userId, 'baseline.score', score.score, 'system', 1),
    recordTimelineEvent(userId, {
      event_type: 'onboarding_completed',
      summary:
        intel.total > 0
          ? `Baselined ${intel.total} credentials. Score ${score.score}/100.`
          : `Onboarded. No credentials imported yet.`,
      payload: summary,
      severity: summary.breached > 0 || intel.weak > 5 ? 'medium' : 'info',
    }),
  ]);
}

/**
 * Pre-warm the first Morning Brief so it's ready the moment the user
 * lands on the dashboard. Best-effort — if it fails the dashboard will
 * generate one on demand.
 */
async function prewarmFirstBriefing() {
  try {
    await supabase.functions.invoke('ray-briefing', { body: { first_run: true } });
  } catch (e) {
    console.warn('[onboarding] pre-warm briefing failed', e);
  }
}

export type Phase =
  | 'parsing'
  | 'deduping'
  | 'encrypting'
  | 'saving'
  | 'analyzing'
  | 'breach'
  | 'scoring'
  | 'done';

export interface PipelineProgress {
  phase: Phase;
  done: number;
  total: number;
  message: string;
}

export interface PipelineInput {
  userId: string;
  vaultId: string;
  masterPassword: string;
  source: ImportSource;
  text: string;
  profile: RayProfileInput;
}

export interface PipelineResult {
  parsed: number;
  imported: number;
  skipped: number;
  intel: PasswordIntelligenceResult;
  score: ScoreResult;
  breachDegraded: boolean;
}

async function ensureDefaultVault(userId: string): Promise<string | null> {
  const { data: existing } = await supabase
    .from('safepass_vaults')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing?.id) return existing.id;
  const { data, error } = await supabase
    .from('safepass_vaults')
    .insert({
      user_id: userId,
      vault_name: 'My Vault',
      description: 'Imported during Ray onboarding',
      is_shared: false,
      is_active: true,
      encryption_key_hash: btoa(`vault_${Date.now()}_${userId}`),
      access_policies: {},
      shared_with: {},
    })
    .select('id')
    .single();
  if (error) return null;
  return data.id;
}

function calcStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 15;
  return Math.min(score, 100);
}

export async function runRayOnboardingPipeline(
  input: PipelineInput,
  onProgress: (p: PipelineProgress) => void,
): Promise<PipelineResult> {
  const { userId, masterPassword, source, text, profile } = input;
  let { vaultId } = input;
  if (!vaultId) {
    const ensured = await ensureDefaultVault(userId);
    if (!ensured) throw new Error('Could not provision your vault.');
    vaultId = ensured;
  }

  // 1. Parse
  onProgress({ phase: 'parsing', done: 0, total: 1, message: 'Reading your export…' });
  const parsed = parseImport(text, source);
  onProgress({
    phase: 'parsing',
    done: 1,
    total: 1,
    message: `Parsed ${parsed.credentials.length} entries.`,
  });

  // 2. Dedupe
  onProgress({ phase: 'deduping', done: 0, total: 1, message: 'Removing duplicates…' });
  const unique = dedupe(parsed.credentials);
  const dupes = parsed.credentials.length - unique.length;
  onProgress({
    phase: 'deduping',
    done: 1,
    total: 1,
    message: `${dupes} duplicate${dupes === 1 ? '' : 's'} removed.`,
  });

  // 3. Encrypt + persist
  const inserted: { id: string; cred: ParsedCredential }[] = [];
  const total = unique.length;
  for (let i = 0; i < unique.length; i++) {
    const c = unique[i];
    onProgress({
      phase: 'encrypting',
      done: i,
      total,
      message: `Encrypting ${i + 1} of ${total}…`,
    });
    const aad: AADContext = { userId, vaultId };
    const payload = JSON.stringify({
      username: c.username ?? '',
      password: c.password,
      website: c.url ?? '',
      notes: c.notes ?? '',
    });
    const encrypted = await encryptData(payload, masterPassword, undefined, aad);
    const { data, error } = await supabase
      .from('safepass_entries')
      .insert({
        user_id: userId,
        vault_id: vaultId,
        entry_type: 'login',
        title: c.title,
        encrypted_data: encrypted as any,
        url: c.url,
        category: 'Imported',
        notes: c.notes,
        password_strength_score: calcStrength(c.password),
        tags: ['imported', `source:${source}`],
        is_favorite: false,
        is_compromised: false,
      })
      .select('id')
      .single();
    if (!error && data) inserted.push({ id: data.id, cred: c });
  }
  onProgress({
    phase: 'saving',
    done: total,
    total,
    message: `${inserted.length} credentials saved to your vault.`,
  });

  // 4. Analyze
  onProgress({ phase: 'analyzing', done: 0, total: 1, message: 'Analyzing password health…' });
  const rawCreds: RawCredential[] = inserted.map(({ id, cred }) => ({
    id,
    title: cred.title,
    username: cred.username,
    password: cred.password,
    url: cred.url,
    password_changed_at: cred.password_changed_at,
  }));

  // 5. Breach check
  onProgress({ phase: 'breach', done: 0, total: 1, message: 'Checking for known breaches…' });
  const breach = await checkBreaches(rawCreds, (done, total) =>
    onProgress({
      phase: 'breach',
      done,
      total,
      message: `Checking known breaches (${done}/${total})…`,
    }),
  );
  const intel = analyzePasswords(rawCreds, breach.breachedIds);

  // 6. Persist findings
  if (intel.findings.length > 0) {
    const rows = intel.findings.map((f) => ({
      user_id: userId,
      entry_id: f.entry_id ?? null,
      kind: f.kind,
      severity: f.severity,
      details: f.details as any,
    }));
    // Chunk inserts to avoid request-size issues.
    const CHUNK = 200;
    for (let i = 0; i < rows.length; i += CHUNK) {
      await supabase.from('ray_findings').insert(rows.slice(i, i + CHUNK));
    }
  }

  // 7. Score
  onProgress({ phase: 'scoring', done: 0, total: 1, message: 'Calculating your security score…' });
  const score = calculateScore(intel);
  await supabase.from('ray_security_scores').insert({
    user_id: userId,
    score: score.score,
    factors: { factors: score.factors, total: intel.total } as any,
  });

  // 8. Recommendations
  const recs = generateRecommendations(intel, profile, breach.degraded);
  if (recs.length > 0) {
    await supabase.from('ray_recommendations').insert(
      recs.map((r) => ({
        user_id: userId,
        title: r.title,
        body: r.body,
        priority: r.priority,
        source_finding_ids: [] as any,
        status: 'open',
      })),
    );
  }

  // 9. Mark profile onboarded
  await supabase
    .from('ray_profiles')
    .update({
      import_source: source,
      onboarded_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  // 10. Handoff to Ray: persist memory + timeline, pre-warm first briefing.
  await recordOnboardingHandoff(userId, source, profile, intel, score, breach.degraded);
  void prewarmFirstBriefing();

  onProgress({ phase: 'done', done: 1, total: 1, message: 'Done.' });
  return {
    parsed: parsed.credentials.length,
    imported: inserted.length,
    skipped: parsed.skipped + dupes,
    intel,
    score,
    breachDegraded: breach.degraded,
  };
}

/** Run analysis + scoring against the user's existing vault without importing. */
export async function runRayBaseline(
  userId: string,
  masterPassword: string,
  profile: RayProfileInput,
  onProgress: (p: PipelineProgress) => void,
): Promise<PipelineResult> {
  const { decryptData } = await import('@/utils/crypto');
  onProgress({ phase: 'parsing', done: 0, total: 1, message: 'Reading your vault…' });
  const { data: entries } = await supabase
    .from('safepass_entries')
    .select('id, title, url, vault_id, encrypted_data')
    .eq('user_id', userId);
  const raw: RawCredential[] = [];
  if (entries) {
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      try {
        const decrypted = await decryptData(e.encrypted_data as any, masterPassword);
        const parsed = JSON.parse(decrypted);
        raw.push({
          id: e.id,
          title: e.title,
          username: parsed.username,
          password: parsed.password ?? '',
          url: parsed.website ?? e.url ?? undefined,
        });
      } catch {
        // skip undecryptable entries
      }
    }
  }
  onProgress({ phase: 'analyzing', done: 0, total: 1, message: `Analyzing ${raw.length} credentials…` });
  const breach = await checkBreaches(raw);
  const intel = analyzePasswords(raw, breach.breachedIds);
  if (intel.findings.length > 0) {
    const rows = intel.findings.map((f) => ({
      user_id: userId,
      entry_id: f.entry_id ?? null,
      kind: f.kind,
      severity: f.severity,
      details: f.details as any,
    }));
    const CHUNK = 200;
    for (let i = 0; i < rows.length; i += CHUNK) {
      await supabase.from('ray_findings').insert(rows.slice(i, i + CHUNK));
    }
  }
  const score = calculateScore(intel);
  await supabase.from('ray_security_scores').insert({
    user_id: userId,
    score: score.score,
    factors: { factors: score.factors, total: intel.total } as any,
  });
  const recs = generateRecommendations(intel, profile, breach.degraded);
  if (recs.length > 0) {
    await supabase.from('ray_recommendations').insert(
      recs.map((r) => ({
        user_id: userId,
        title: r.title,
        body: r.body,
        priority: r.priority,
        source_finding_ids: [] as any,
        status: 'open',
      })),
    );
  }
  await supabase
    .from('ray_profiles')
    .update({ onboarded_at: new Date().toISOString(), import_source: 'baseline' })
    .eq('user_id', userId);
  onProgress({ phase: 'done', done: 1, total: 1, message: 'Done.' });
  return { parsed: raw.length, imported: 0, skipped: 0, intel, score, breachDegraded: breach.degraded };
}
