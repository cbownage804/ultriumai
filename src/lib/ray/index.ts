/**
 * Ray Intelligence Engine — the single source of truth Ray consults before
 * speaking. Pages should call `getRayContext(userId)` instead of computing
 * their own numbers.
 */
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Tables = Database['public']['Tables'];
type Profile = Tables['ray_profiles']['Row'];
type Score = Tables['ray_security_scores']['Row'];
type Finding = Tables['ray_findings']['Row'];
type Recommendation = Tables['ray_recommendations']['Row'];

export interface RayContext {
  profile: Profile | null;
  latestScore: Score | null;
  previousScore: Score | null;
  scoreDelta: number | null;
  findings: Finding[];
  openFindings: number;
  recommendations: Recommendation[];
  hasOnboarded: boolean;
  missing: string[]; // what Ray honestly cannot answer yet
}

export async function getRayContext(userId: string): Promise<RayContext> {
  const [profileRes, scoresRes, findingsRes, recsRes] = await Promise.all([
    supabase.from('ray_profiles').select('*').eq('user_id', userId).maybeSingle(),
    supabase
      .from('ray_security_scores')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('ray_findings')
      .select('*')
      .eq('user_id', userId)
      .is('resolved_at', null)
      .limit(500),
    supabase
      .from('ray_recommendations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'open')
      .order('priority', { ascending: true })
      .limit(20),
  ]);

  const profile = profileRes.data ?? null;
  const scores = scoresRes.data ?? [];
  const findings = findingsRes.data ?? [];
  const recommendations = recsRes.data ?? [];
  const latestScore = scores[0] ?? null;
  const previousScore = scores[1] ?? null;
  const scoreDelta = latestScore && previousScore ? latestScore.score - previousScore.score : null;

  const missing: string[] = [];
  if (!profile) missing.push('profile');
  if (!latestScore) missing.push('security_score');
  if (findings.length === 0 && profile?.onboarded_at) {
    // onboarded but no findings → vault was empty
    missing.push('imported_credentials');
  }

  return {
    profile,
    latestScore,
    previousScore,
    scoreDelta,
    findings,
    openFindings: findings.length,
    recommendations,
    hasOnboarded: !!profile?.onboarded_at,
    missing,
  };
}

export async function hasOnboarded(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('ray_profiles')
    .select('onboarded_at')
    .eq('user_id', userId)
    .maybeSingle();
  return !!data?.onboarded_at;
}
