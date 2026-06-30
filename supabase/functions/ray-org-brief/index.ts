/**
 * ray-org-brief — Generates Ray's daily executive briefing.
 *
 * Scopes:
 *   - 'org' (default): one briefing per organization, narrated for the CEO.
 *   - 'msp': one cross-client rollup for the MSP owner.
 *
 * Pipeline:
 *   1. Pull latest ray_org_health + signal aggregates (already computed by
 *      ray-org-sync; we'll trigger sync inline if today's snapshot is missing).
 *   2. Ask Lovable AI (Gemini) for the JARVIS-tone summary; fall back to a
 *      deterministic script if AI is unavailable.
 *   3. Upsert into ray_org_briefings with scope + brief_date uniqueness.
 *   4. Log a ray_org_timeline event so the day's brief is part of history.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { corsHeaders } from '../_shared/cors.ts';

const RAY_SYSTEM = `You are Ray, the security intelligence inside Wrayth.
Tone: JARVIS — calm, confident, concise. First person.
You are writing an executive morning brief for a CEO or MSP owner.
Use ONLY the supplied numbers. Never invent. No emoji. No marketing.
Return STRICT JSON only.`;

interface BriefShape {
  greeting: string;
  summary: string;
  recommendation: string;
}

async function callRayAI(prompt: string): Promise<BriefShape | null> {
  const key = Deno.env.get('LOVABLE_API_KEY');
  if (!key) return null;
  try {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: RAY_SYSTEM },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const text = json?.choices?.[0]?.message?.content;
    if (!text) return null;
    const parsed = JSON.parse(text);
    if (!parsed?.summary) return null;
    return {
      greeting: String(parsed.greeting ?? ''),
      summary: String(parsed.summary),
      recommendation: String(parsed.recommendation ?? ''),
    };
  } catch {
    return null;
  }
}

function deterministicOrgBrief(name: string, h: any, stats: any, top: any): BriefShape {
  const greeting = `Good morning, ${name}.`;
  const parts: string[] = [];
  parts.push(`I checked all ${stats.employees ?? 0} employees overnight.`);
  if ((stats.breached_employees ?? 0) > 0) {
    parts.push(`${stats.breached_employees} have a credential in a known breach.`);
  } else {
    parts.push('No critical credential breaches were detected.');
  }
  if ((stats.mfa_missing ?? 0) > 0) {
    parts.push(`${stats.mfa_missing} employee${stats.mfa_missing === 1 ? '' : 's'} still ${stats.mfa_missing === 1 ? 'has' : 'have'}n't enabled MFA.`);
  }
  const delta = h?.score_delta ?? 0;
  if (delta > 0) parts.push(`Your average security score is up ${delta} since yesterday.`);
  else if (delta < 0) parts.push(`Your average security score is down ${Math.abs(delta)} since yesterday.`);
  else parts.push(`Your average security score is steady at ${h?.overall_score ?? 0}.`);
  const recommendation = top
    ? `I'd start with ${top.display_name} — ${top.top_risks?.[0] ?? 'an unresolved priority'} would give the biggest lift today.`
    : 'Nothing urgent right now. I will keep watching.';
  return { greeting, summary: parts.join(' '), recommendation };
}

async function generateOrgBrief(sb: SupabaseClient, orgId: string, force: boolean) {
  const today = new Date().toISOString().slice(0, 10);

  if (!force) {
    const { data: existing } = await sb.from('ray_org_briefings').select('*').eq('scope', 'org').eq('org_id', orgId).eq('brief_date', today).maybeSingle();
    if (existing) return existing;
  }

  // Ensure today's signals exist
  let { data: health } = await sb.from('ray_org_health').select('*').eq('org_id', orgId).eq('snapshot_date', today).maybeSingle();
  if (!health) {
    // Trigger sync inline (synchronous so we have data to brief on)
    try {
      await sb.functions.invoke('ray-org-sync', { body: { org_id: orgId } });
    } catch { /* noop */ }
    const r = await sb.from('ray_org_health').select('*').eq('org_id', orgId).eq('snapshot_date', today).maybeSingle();
    health = r.data;
  }

  const [{ data: org }, { data: profiles }] = await Promise.all([
    sb.from('org_teams').select('name, owner_id').eq('id', orgId).maybeSingle(),
    sb.from('ray_org_profiles').select('display_name, score, top_risks, mfa_enabled, breach_count').eq('org_id', orgId).order('priority_rank').limit(5),
  ]);

  let ownerName = 'there';
  if (org?.owner_id) {
    const { data: ud } = await sb.auth.admin.getUserById(org.owner_id);
    const meta = (ud?.user?.user_metadata ?? {}) as Record<string, unknown>;
    ownerName = ((meta.full_name as string) ?? (meta.name as string) ?? ud?.user?.email?.split('@')[0] ?? 'there').split(' ')[0];
  }

  const top = profiles?.[0] ?? null;
  const stats = (health?.stats as Record<string, number>) ?? {};

  const prompt = `Write a 3-4 sentence executive morning brief.
Owner first name: ${ownerName}
Org: ${org?.name ?? 'your organization'}
Score: ${health?.overall_score ?? 0} (delta: ${health?.score_delta ?? 0})
Stats: ${JSON.stringify(stats)}
Top 3 priorities: ${JSON.stringify((profiles ?? []).slice(0, 3).map(p => ({ name: p.display_name, score: p.score, risks: p.top_risks })))}

Return JSON:
{
  "greeting": "Good morning, <name>.",
  "summary": "<2-3 sentences referencing the real numbers above.>",
  "recommendation": "<one sentence on what to do first today.>"
}`;

  const ai = await callRayAI(prompt);
  const shape = ai ?? deterministicOrgBrief(ownerName, health, stats, top);

  const briefRow = {
    scope: 'org' as const,
    org_id: orgId,
    msp_owner_user_id: null,
    brief_date: today,
    greeting: shape.greeting,
    summary: shape.summary,
    recommendation: shape.recommendation,
    stats: { ...stats, overall_score: health?.overall_score ?? 0, score_delta: health?.score_delta ?? 0 },
    spoken_script: `${shape.greeting} ${shape.summary} ${shape.recommendation}`,
  };

  const { data: saved } = await sb
    .from('ray_org_briefings')
    .upsert(briefRow, { onConflict: 'org_id,brief_date' })
    .select()
    .maybeSingle();

  await sb.from('ray_org_timeline').insert({
    org_id: orgId,
    actor: 'Ray',
    category: 'briefing',
    summary: `Ray published the morning briefing — score ${health?.overall_score ?? 0}.`,
    severity: 'info',
  });

  return saved ?? briefRow;
}

async function generateMspBrief(sb: SupabaseClient, mspUserId: string, force: boolean) {
  const today = new Date().toISOString().slice(0, 10);

  if (!force) {
    const { data: existing } = await sb.from('ray_org_briefings').select('*').eq('scope', 'msp').eq('msp_owner_user_id', mspUserId).eq('brief_date', today).maybeSingle();
    if (existing) return existing;
  }

  // Find every org the MSP owns
  const { data: ownedOrgs } = await sb.from('org_teams').select('id, name').eq('owner_id', mspUserId);
  const orgs = (ownedOrgs ?? []) as Array<{ id: string; name: string }>;

  // Make sure each has today's health
  const healthRows: any[] = [];
  for (const o of orgs) {
    let { data: h } = await sb.from('ray_org_health').select('*').eq('org_id', o.id).eq('snapshot_date', today).maybeSingle();
    if (!h) {
      try { await sb.functions.invoke('ray-org-sync', { body: { org_id: o.id } }); } catch { /* noop */ }
      const r = await sb.from('ray_org_health').select('*').eq('org_id', o.id).eq('snapshot_date', today).maybeSingle();
      h = r.data;
    }
    if (h) healthRows.push({ ...h, name: o.name });
  }

  const needAttention = healthRows.filter(h => (h.overall_score ?? 100) < 80 || (h.stats?.mfa_missing ?? 0) > 0 || (h.stats?.breached_employees ?? 0) > 0);
  needAttention.sort((a, b) => (a.overall_score ?? 0) - (b.overall_score ?? 0));

  const { data: ud } = await sb.auth.admin.getUserById(mspUserId);
  const meta = (ud?.user?.user_metadata ?? {}) as Record<string, unknown>;
  const ownerName = ((meta.full_name as string) ?? (meta.name as string) ?? ud?.user?.email?.split('@')[0] ?? 'there').split(' ')[0];

  const prompt = `Write a 2-3 sentence cross-client MSP morning brief.
Owner: ${ownerName}
Total client organizations checked: ${orgs.length}
Number that need attention today: ${needAttention.length}
Worst clients (lowest score first): ${JSON.stringify(needAttention.slice(0, 3).map(h => ({ name: h.name, score: h.overall_score, mfa_missing: h.stats?.mfa_missing, breached: h.stats?.breached_employees })))}

Return JSON:
{
  "greeting": "Good morning, <name>.",
  "summary": "I checked <N> client organizations overnight. <state who needs attention>.",
  "recommendation": "<one sentence on which client to look at first.>"
}`;

  const ai = await callRayAI(prompt);
  const shape: BriefShape = ai ?? {
    greeting: `Good morning, ${ownerName}.`,
    summary: `I checked ${orgs.length} client organization${orgs.length === 1 ? '' : 's'} overnight. ${needAttention.length} need${needAttention.length === 1 ? 's' : ''} attention today.`,
    recommendation: needAttention[0]
      ? `I'd start with ${needAttention[0].name} — score is at ${needAttention[0].overall_score}.`
      : 'Every client is in good shape. I will keep watching.',
  };

  const briefRow = {
    scope: 'msp' as const,
    org_id: null,
    msp_owner_user_id: mspUserId,
    brief_date: today,
    greeting: shape.greeting,
    summary: shape.summary,
    recommendation: shape.recommendation,
    stats: { client_count: orgs.length, attention_needed: needAttention.length },
    spoken_script: `${shape.greeting} ${shape.summary} ${shape.recommendation}`,
  };

  const { data: saved } = await sb
    .from('ray_org_briefings')
    .upsert(briefRow, { onConflict: 'msp_owner_user_id,brief_date' })
    .select()
    .maybeSingle();

  return saved ?? briefRow;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization') ?? '';
    const body = await req.json().catch(() => ({} as any));

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

    const scope: 'org' | 'msp' = body?.scope === 'msp' ? 'msp' : 'org';
    const force = body?.force === true;

    let userId: string | null = null;
    if (!authHeader.includes(SERVICE_ROLE)) {
      const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
      const { data: ud, error } = await userClient.auth.getUser();
      if (error || !ud?.user) {
        return new Response(JSON.stringify({ error: 'unauthenticated' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      userId = ud.user.id;
    }

    if (scope === 'msp') {
      const targetUserId = userId ?? String(body?.user_id ?? '');
      if (!targetUserId) return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const brief = await generateMspBrief(sb, targetUserId, force);
      return new Response(JSON.stringify({ brief }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const orgId = String(body?.org_id ?? '');
    if (!orgId) return new Response(JSON.stringify({ error: 'org_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const brief = await generateOrgBrief(sb, orgId, force);
    return new Response(JSON.stringify({ brief }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
