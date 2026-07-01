import { devLog } from '@/lib/logger';
/**
 * Ray Insights SDK — the unified data model every Ray surface reads from.
 *
 * Findings, observations, and recommendations from across the platform are
 * normalized into `ray_insights` rows so Ray can talk about them in one voice.
 */
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type RayInsightArea =
  | 'passwords'
  | 'threats'
  | 'exposure'
  | 'identity'
  | 'devices'
  | 'home';

export type RayInsightSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type RayInsightStatus = 'open' | 'acknowledged' | 'resolved' | 'dismissed';

export type RayInsight = Database['public']['Tables']['ray_insights']['Row'];
export type RayInsightInsert = Database['public']['Tables']['ray_insights']['Insert'];

export async function listInsights(
  userId: string,
  opts: { area?: RayInsightArea; status?: RayInsightStatus; limit?: number } = {},
): Promise<RayInsight[]> {
  let q = supabase
    .from('ray_insights')
    .select('*')
    .eq('user_id', userId)
    .order('observed_at', { ascending: false })
    .limit(opts.limit ?? 50);
  if (opts.area) q = q.eq('area', opts.area);
  if (opts.status) q = q.eq('status', opts.status);
  const { data, error } = await q;
  if (error) {
    devLog.log('[ray.insights] list failed', error);
    return [];
  }
  return (data as RayInsight[]) ?? [];
}

export async function recordInsight(
  insight: Omit<RayInsightInsert, 'id' | 'created_at' | 'updated_at'>,
): Promise<RayInsight | null> {
  const { data, error } = await supabase
    .from('ray_insights')
    .insert(insight as RayInsightInsert)
    .select()
    .single();
  if (error) {
    devLog.log('[ray.insights] record failed', error);
    return null;
  }
  return data as RayInsight;
}

export async function acknowledgeInsight(id: string) {
  await supabase
    .from('ray_insights')
    .update({ status: 'acknowledged' })
    .eq('id', id);
}

export async function resolveInsight(id: string) {
  await supabase
    .from('ray_insights')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', id);
}

export async function dismissInsight(id: string) {
  await supabase.from('ray_insights').update({ status: 'dismissed' }).eq('id', id);
}

/**
 * Summarize new activity since a given timestamp — used by the Morning Brief
 * to say "since we last spoke, I checked X identities, Y devices, Z passwords."
 */
export interface OvernightDelta {
  since: string;
  insightsByArea: Record<RayInsightArea, number>;
  newCritical: number;
  newHigh: number;
  totalNew: number;
}

export async function overnightDelta(userId: string, since: Date): Promise<OvernightDelta> {
  const sinceIso = since.toISOString();
  const { data } = await supabase
    .from('ray_insights')
    .select('area,severity,observed_at')
    .eq('user_id', userId)
    .gte('observed_at', sinceIso)
    .limit(500);
  const rows = (data ?? []) as Array<{ area: string; severity: string }>;
  const byArea: Record<RayInsightArea, number> = {
    passwords: 0, threats: 0, exposure: 0, identity: 0, devices: 0, home: 0,
  };
  let newCritical = 0;
  let newHigh = 0;
  for (const r of rows) {
    const area = (r.area as RayInsightArea);
    if (area in byArea) byArea[area] += 1;
    if (r.severity === 'critical') newCritical += 1;
    if (r.severity === 'high') newHigh += 1;
  }
  return {
    since: sinceIso,
    insightsByArea: byArea,
    newCritical,
    newHigh,
    totalNew: rows.length,
  };
}

export function pageHrefForArea(area: RayInsightArea): string {
  switch (area) {
    case 'passwords': return '/app/passwords';
    case 'threats': return '/app/threats';
    case 'exposure': return '/app/exposure';
    case 'identity': return '/app/identity';
    case 'devices': return '/app/devices';
    case 'home':
    default: return '/app/dashboard';
  }
}
