/**
 * ray-org-sync — Roll up individual signals into org-level intelligence.
 *
 * Inputs: { org_id } from the caller (admin user JWT) OR { all: true } from
 * the cron job (service-role).
 *
 * What it does, per organization:
 *   1. Resolves the org's active members from org_team_members.
 *   2. Pulls per-user signals (passwords, breach scans, MFA snapshots,
 *      open ray_findings, last_seen_at) using service-role.
 *   3. Builds a ray_org_profiles row per employee with score + top risks.
 *   4. Bucketizes employees by department → ray_org_department_scores.
 *   5. Computes ray_org_health sub-scores + overall + delta vs yesterday.
 *
 * No AI calls — all deterministic. ray-org-brief handles narration.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { corsHeaders } from '../_shared/cors.ts';

interface MemberRow {
  id: string;
  user_id: string | null;
  email: string;
  role: string;
  status: string;
}

interface EmployeeSignals {
  user_id: string | null;
  display_name: string;
  email: string;
  department: string | null;
  score: number;
  mfa_enabled: boolean;
  breach_count: number;
  weak_password_count: number;
  reused_password_count: number;
  last_active_at: string | null;
  top_risks: string[];
  ray_note: string | null;
}

const WEIGHTS = { identity: 25, device: 20, threat: 20, exposure: 15, compliance: 10, training: 5, software: 3, domain: 2 };

function clamp(n: number, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, Math.round(n))); }

async function fetchEmployeeSignals(sb: SupabaseClient, m: MemberRow): Promise<EmployeeSignals> {
  const displayName = m.email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  let mfaEnabled = false;
  let breachCount = 0;
  let weakPasswordCount = 0;
  let reusedPasswordCount = 0;
  let lastActiveAt: string | null = null;
  let department: string | null = null;
  let ranNote: string | null = null;

  if (m.user_id) {
    const [pw, mfa, profile, dept] = await Promise.all([
      sb.from('password_entries').select('password_strength,is_breached,is_reused').eq('user_id', m.user_id),
      sb.from('vault_mfa_health_snapshots').select('total_with_mfa,total_accounts').eq('user_id', m.user_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      sb.from('ray_profiles').select('last_seen_at').eq('user_id', m.user_id).maybeSingle(),
      sb.from('org_team_members').select('email').eq('user_id', m.user_id).maybeSingle(),
    ]);
    const pwRows = (pw.data ?? []) as Array<{ password_strength?: string; is_breached?: boolean; is_reused?: boolean }>;
    breachCount = pwRows.filter(p => p.is_breached).length;
    weakPasswordCount = pwRows.filter(p => p.password_strength === 'weak').length;
    reusedPasswordCount = pwRows.filter(p => p.is_reused).length;
    const mfaData = (mfa.data ?? null) as { total_with_mfa?: number; total_accounts?: number } | null;
    if (mfaData && (mfaData.total_accounts ?? 0) > 0) {
      mfaEnabled = (mfaData.total_with_mfa ?? 0) / mfaData.total_accounts! >= 0.5;
    }
    lastActiveAt = (profile.data as { last_seen_at?: string } | null)?.last_seen_at ?? null;
    void dept;
  }

  // Score
  let score = 100;
  if (!mfaEnabled) score -= 20;
  score -= Math.min(30, breachCount * 8);
  score -= Math.min(15, weakPasswordCount * 3);
  score -= Math.min(15, reusedPasswordCount * 2);
  // staleness
  if (lastActiveAt) {
    const daysIdle = (Date.now() - new Date(lastActiveAt).getTime()) / 86400000;
    if (daysIdle > 30) score -= 10;
  }
  score = clamp(score);

  const topRisks: string[] = [];
  if (!mfaEnabled) topRisks.push('No MFA');
  if (breachCount > 0) topRisks.push(`${breachCount} breached password${breachCount === 1 ? '' : 's'}`);
  if (weakPasswordCount > 0) topRisks.push(`${weakPasswordCount} weak password${weakPasswordCount === 1 ? '' : 's'}`);

  if (score >= 90) ranNote = `${displayName} is following every recommendation.`;
  else if (score >= 70) ranNote = `${displayName} is in good shape — a couple of small wins available.`;
  else ranNote = `${displayName} is a security priority right now.`;

  return {
    user_id: m.user_id,
    display_name: displayName,
    email: m.email,
    department,
    score,
    mfa_enabled: mfaEnabled,
    breach_count: breachCount,
    weak_password_count: weakPasswordCount,
    reused_password_count: reusedPasswordCount,
    last_active_at: lastActiveAt,
    top_risks: topRisks,
    ray_note: ranNote,
  };
}

async function syncOrg(sb: SupabaseClient, orgId: string) {
  const { data: members } = await sb
    .from('org_team_members')
    .select('id,user_id,email,role,status')
    .eq('organization_id', orgId)
    .eq('status', 'active');
  const memberRows: MemberRow[] = (members ?? []) as MemberRow[];

  if (memberRows.length === 0) return { org_id: orgId, employees: 0 };

  const signals = await Promise.all(memberRows.map(m => fetchEmployeeSignals(sb, m)));

  // Rank
  const ranked = [...signals].sort((a, b) => a.score - b.score);
  const profileRows = ranked.map((s, idx) => ({
    org_id: orgId,
    user_id: s.user_id,
    display_name: s.display_name,
    email: s.email,
    department: s.department,
    score: s.score,
    mfa_enabled: s.mfa_enabled,
    breach_count: s.breach_count,
    weak_password_count: s.weak_password_count,
    reused_password_count: s.reused_password_count,
    last_active_at: s.last_active_at,
    top_risks: s.top_risks,
    ray_note: s.ray_note,
    priority_rank: idx + 1,
  }));

  // Wipe & reinsert keeps this idempotent without juggling partial-unique upserts.
  await sb.from('ray_org_profiles').delete().eq('org_id', orgId);
  if (profileRows.length) {
    await sb.from('ray_org_profiles').insert(profileRows);
  }

  // Department roll-ups
  const today = new Date().toISOString().slice(0, 10);
  const deptMap = new Map<string, { total: number; count: number; worst: number }>();
  for (const s of signals) {
    const key = s.department || 'Unassigned';
    const e = deptMap.get(key) ?? { total: 0, count: 0, worst: 100 };
    e.total += s.score;
    e.count += 1;
    e.worst = Math.min(e.worst, s.score);
    deptMap.set(key, e);
  }
  const deptRows = [...deptMap.entries()].map(([department, v]) => ({
    org_id: orgId,
    department,
    snapshot_date: today,
    score: Math.round(v.total / v.count),
    employee_count: v.count,
    ray_reason:
      v.worst < 60
        ? `${department} has at least one high-risk account.`
        : v.worst < 80
        ? `${department} is mostly healthy; a few accounts could be tightened.`
        : `${department} is in strong shape.`,
  }));
  for (const row of deptRows) {
    await sb.from('ray_org_department_scores').upsert(row, { onConflict: 'org_id,department,snapshot_date' });
  }

  // Sub-scores
  const totalEmployees = signals.length || 1;
  const mfaPct = signals.filter(s => s.mfa_enabled).length / totalEmployees;
  const breachedEmployees = signals.filter(s => s.breach_count > 0).length;
  const exposurePct = breachedEmployees / totalEmployees;
  const weakEmployees = signals.filter(s => s.weak_password_count + s.reused_password_count > 0).length;
  const idleEmployees = signals.filter(s => {
    if (!s.last_active_at) return true;
    return (Date.now() - new Date(s.last_active_at).getTime()) > 30 * 86400000;
  }).length;

  const identityScore = clamp(100 * mfaPct);
  const deviceScore = clamp(100 - (idleEmployees / totalEmployees) * 60);
  const exposureScore = clamp(100 - exposurePct * 80);
  const threatScore = clamp(100 - breachedEmployees * 6);
  const complianceScore = clamp((identityScore + exposureScore) / 2);
  // Best-effort proxies until dedicated data sources are wired:
  // - Training: healthy accounts (no breaches AND no weak/reused passwords AND MFA on) as a readiness proxy.
  // - Software: freshness of the org's Microsoft Graph sync (stale sync => lower posture confidence).
  // - Domain: derived from active safeweb threat rows for this org.
  const readyEmployees = signals.filter(
    s => s.mfa_enabled && s.breach_count === 0 && (s.weak_password_count + s.reused_password_count) === 0,
  ).length;
  const trainingScore = clamp(60 + (readyEmployees / totalEmployees) * 40);

  const { data: graphSync } = await sb
    .from('ms_graph_sync')
    .select('last_synced_at')
    .eq('org_id', orgId)
    .order('last_synced_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const graphAgeDays = graphSync?.last_synced_at
    ? Math.max(0, (Date.now() - new Date(graphSync.last_synced_at as string).getTime()) / 86400000)
    : 30;
  const softwareScore = clamp(100 - Math.min(graphAgeDays * 2, 60));

  const { count: activeThreats } = await sb
    .from('safeweb_threats')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('status', 'active');
  const domainScore = clamp(100 - Math.min((activeThreats ?? 0) * 8, 70));

  const overall = clamp(
    (identityScore * WEIGHTS.identity +
      deviceScore * WEIGHTS.device +
      threatScore * WEIGHTS.threat +
      exposureScore * WEIGHTS.exposure +
      complianceScore * WEIGHTS.compliance +
      trainingScore * WEIGHTS.training +
      softwareScore * WEIGHTS.software +
      domainScore * WEIGHTS.domain) / 100,
  );

  // Yesterday for delta
  const { data: prior } = await sb
    .from('ray_org_health')
    .select('overall_score')
    .eq('org_id', orgId)
    .lt('snapshot_date', today)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  const scoreDelta = prior?.overall_score != null ? overall - (prior.overall_score as number) : 0;

  const stats = {
    employees: signals.length,
    mfa_enabled: signals.filter(s => s.mfa_enabled).length,
    mfa_missing: signals.filter(s => !s.mfa_enabled).length,
    breached_employees: breachedEmployees,
    weak_password_employees: weakEmployees,
    idle_employees: idleEmployees,
  };

  await sb.from('ray_org_health').upsert({
    org_id: orgId,
    snapshot_date: today,
    overall_score: overall,
    score_delta: scoreDelta,
    identity_score: identityScore,
    device_score: deviceScore,
    threat_score: threatScore,
    exposure_score: exposureScore,
    compliance_score: complianceScore,
    training_score: trainingScore,
    software_score: softwareScore,
    domain_score: domainScore,
    stats,
    ray_notes: {
      identity: `${stats.mfa_enabled} of ${stats.employees} have MFA enabled.`,
      threat: breachedEmployees ? `${breachedEmployees} employees have at least one breached credential.` : 'No active credential breaches.',
    },
  }, { onConflict: 'org_id,snapshot_date' });

  return { org_id: orgId, employees: signals.length, score: overall, delta: scoreDelta };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Verify caller — either service-role (cron) or an authenticated org admin.
    const authHeader = req.headers.get('Authorization') ?? '';
    const isServiceRole = authHeader.includes(SERVICE_ROLE);
    let callerUserId: string | null = null;
    if (!isServiceRole) {
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'unauthenticated' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
      const { data: ud, error: uerr } = await userClient.auth.getUser();
      if (uerr || !ud?.user) {
        return new Response(JSON.stringify({ error: 'unauthenticated' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      callerUserId = ud.user.id;
    }

    const body = await req.json().catch(() => ({} as any));

    let orgIds: string[] = [];
    if (body?.all === true) {
      if (!isServiceRole) {
        return new Response(JSON.stringify({ error: 'forbidden' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data } = await sb.from('org_teams').select('id');
      orgIds = (data ?? []).map((r: any) => r.id as string);
    } else if (body?.org_id) {
      const targetOrg = String(body.org_id);
      if (!isServiceRole && callerUserId) {
        // Confirm caller is an admin/owner of that org.
        const { data: membership } = await sb
          .from('org_team_members')
          .select('role')
          .eq('org_id', targetOrg)
          .eq('user_id', callerUserId)
          .maybeSingle();
        const role = membership?.role ?? '';
        if (!['owner', 'admin'].includes(role)) {
          return new Response(JSON.stringify({ error: 'forbidden' }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      orgIds = [targetOrg];
    } else {
      return new Response(JSON.stringify({ error: 'org_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = [];
    for (const id of orgIds) {
      try { results.push(await syncOrg(sb, id)); }
      catch (e) { results.push({ org_id: id, error: String((e as Error).message) }); }
    }
    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
