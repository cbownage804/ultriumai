/**
 * Ray Org SDK — Wrayth 4.2.
 *
 * Thin, typed wrappers around the ray_org_* tables plus the scoring
 * helpers shared by the dashboard and the natural-language skills.
 */
import { supabase } from '@/integrations/supabase/client';

export interface RayOrgProfile {
  id: string;
  org_id: string;
  user_id: string | null;
  display_name: string;
  email: string | null;
  department: string | null;
  score: number;
  mfa_enabled: boolean;
  breach_count: number;
  weak_password_count: number;
  reused_password_count: number;
  last_active_at: string | null;
  top_risks: string[];
  ray_note: string | null;
  priority_rank: number;
}

export interface RayOrgHealth {
  id: string;
  org_id: string;
  snapshot_date: string;
  overall_score: number;
  score_delta: number;
  identity_score: number;
  device_score: number;
  threat_score: number;
  exposure_score: number;
  compliance_score: number;
  training_score: number;
  software_score: number;
  domain_score: number;
  ray_notes: Record<string, string>;
  stats: Record<string, number | string>;
}

export interface RayOrgMission {
  id: string;
  org_id: string;
  title: string;
  description: string | null;
  category: string;
  target: number;
  progress: number;
  est_minutes_remaining: number | null;
  status: 'active' | 'complete' | 'paused';
  owner_user_id: string | null;
}

export interface RayOrgTimelineEvent {
  id: string;
  org_id: string;
  occurred_at: string;
  actor: string | null;
  category: string;
  summary: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
}

export interface RayOrgBriefing {
  id: string;
  scope: 'org' | 'msp';
  org_id: string | null;
  msp_owner_user_id: string | null;
  brief_date: string;
  greeting: string | null;
  summary: string;
  recommendation: string | null;
  stats: Record<string, number | string>;
  spoken_script: string | null;
}

export interface RayOrgDepartmentScore {
  id: string;
  org_id: string;
  department: string;
  score: number;
  employee_count: number;
  ray_reason: string | null;
}

/* ------------------------------------------------------------------ */
/* Scoring                                                            */
/* ------------------------------------------------------------------ */

// Weights sum to 100.
export const ORG_SCORE_WEIGHTS = {
  identity: 25,
  device: 20,
  threat: 20,
  exposure: 15,
  compliance: 10,
  training: 5,
  software: 3,
  domain: 2,
} as const;

export function computeOrgScore(h: Pick<
  RayOrgHealth,
  | 'identity_score'
  | 'device_score'
  | 'threat_score'
  | 'exposure_score'
  | 'compliance_score'
  | 'training_score'
  | 'software_score'
  | 'domain_score'
>): number {
  const w = ORG_SCORE_WEIGHTS;
  const raw =
    h.identity_score * w.identity +
    h.device_score * w.device +
    h.threat_score * w.threat +
    h.exposure_score * w.exposure +
    h.compliance_score * w.compliance +
    h.training_score * w.training +
    h.software_score * w.software +
    h.domain_score * w.domain;
  return Math.max(0, Math.min(100, Math.round(raw / 100)));
}

/* ------------------------------------------------------------------ */
/* Queries                                                            */
/* ------------------------------------------------------------------ */

export async function fetchLatestHealth(orgId: string): Promise<RayOrgHealth | null> {
  const { data } = await supabase
    .from('ray_org_health' as any)
    .select('*')
    .eq('org_id', orgId)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as unknown as RayOrgHealth | null) ?? null;
}

export async function fetchProfiles(orgId: string): Promise<RayOrgProfile[]> {
  const { data } = await supabase
    .from('ray_org_profiles' as any)
    .select('*')
    .eq('org_id', orgId)
    .order('priority_rank', { ascending: true });
  return ((data as unknown as RayOrgProfile[] | null) ?? []).map((p) => ({
    ...p,
    top_risks: Array.isArray(p.top_risks) ? p.top_risks : [],
  }));
}

export async function fetchMissions(orgId: string): Promise<RayOrgMission[]> {
  const { data } = await supabase
    .from('ray_org_missions' as any)
    .select('*')
    .eq('org_id', orgId)
    .order('status', { ascending: true })
    .order('created_at', { ascending: false });
  return (data as unknown as RayOrgMission[] | null) ?? [];
}

export async function fetchTimeline(orgId: string, limit = 25): Promise<RayOrgTimelineEvent[]> {
  const { data } = await supabase
    .from('ray_org_timeline' as any)
    .select('*')
    .eq('org_id', orgId)
    .order('occurred_at', { ascending: false })
    .limit(limit);
  return (data as unknown as RayOrgTimelineEvent[] | null) ?? [];
}

export async function fetchTodayBriefing(orgId: string): Promise<RayOrgBriefing | null> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from('ray_org_briefings' as any)
    .select('*')
    .eq('scope', 'org')
    .eq('org_id', orgId)
    .eq('brief_date', today)
    .maybeSingle();
  return (data as unknown as RayOrgBriefing | null) ?? null;
}

export async function fetchMspBriefing(userId: string): Promise<RayOrgBriefing | null> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from('ray_org_briefings' as any)
    .select('*')
    .eq('scope', 'msp')
    .eq('msp_owner_user_id', userId)
    .eq('brief_date', today)
    .maybeSingle();
  return (data as unknown as RayOrgBriefing | null) ?? null;
}

export async function fetchDepartmentScores(orgId: string): Promise<RayOrgDepartmentScore[]> {
  // newest snapshot per department
  const { data } = await supabase
    .from('ray_org_department_scores' as any)
    .select('*')
    .eq('org_id', orgId)
    .order('snapshot_date', { ascending: false });
  const seen = new Set<string>();
  const out: RayOrgDepartmentScore[] = [];
  for (const row of ((data as unknown as RayOrgDepartmentScore[] | null) ?? [])) {
    if (seen.has(row.department)) continue;
    seen.add(row.department);
    out.push(row);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Mutations / RPCs                                                   */
/* ------------------------------------------------------------------ */

export async function triggerOrgSync(orgId: string) {
  return supabase.functions.invoke('ray-org-sync', { body: { org_id: orgId } });
}

export async function triggerOrgBrief(orgId: string, force = false) {
  return supabase.functions.invoke('ray-org-brief', { body: { org_id: orgId, force } });
}

export async function triggerMspBrief(force = false) {
  return supabase.functions.invoke('ray-org-brief', { body: { scope: 'msp', force } });
}

/* ------------------------------------------------------------------ */
/* Ray priority ranking                                               */
/* ------------------------------------------------------------------ */

export function describeTopPriority(profiles: RayOrgProfile[]): string | null {
  const ranked = [...profiles].sort((a, b) => a.score - b.score);
  const worst = ranked[0];
  if (!worst) return null;
  const issues: string[] = [];
  if (!worst.mfa_enabled) issues.push('enabling MFA');
  if (worst.breach_count > 0) issues.push('rotating breached passwords');
  if (worst.weak_password_count > 0) issues.push('strengthening weak passwords');
  if (!issues.length) return null;
  const lift = Math.max(1, Math.round((85 - worst.score) / Math.max(1, profiles.length) / 2));
  return `${worst.display_name} is your highest security priority. Starting with ${issues[0]} would raise your company score by about ${lift} points.`;
}

export function bucketByDepartment(profiles: RayOrgProfile[]): Map<string, RayOrgProfile[]> {
  const out = new Map<string, RayOrgProfile[]>();
  for (const p of profiles) {
    const key = p.department || 'Unassigned';
    if (!out.has(key)) out.set(key, []);
    out.get(key)!.push(p);
  }
  return out;
}
