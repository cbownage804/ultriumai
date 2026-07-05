// Wrayth Platform Admin API — single edge function, action-routed.
// Requires the caller to be a platform admin (checked via has_platform_role).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

type Role = 'super_admin' | 'support' | 'billing_ops' | 'platform_ops' | 'read_only';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const admin = () => createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function requireAdmin(req: Request, role: Role = 'read_only') {
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return { error: 'Unauthorized', status: 401 as const };
  const supa = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: u, error } = await supa.auth.getUser();
  if (error || !u.user) return { error: 'Unauthorized', status: 401 as const };
  const { data: ok } = await admin().rpc('has_platform_role', { _user_id: u.user.id, _role: role });
  if (!ok) return { error: 'Forbidden', status: 403 as const };
  return { user: u.user };
}

async function audit(actor: string, action: string, target?: { type?: string; id?: string; meta?: any }) {
  try {
    await admin().from('admin_audit_trails').insert({
      actor_user_id: actor,
      action,
      target_type: target?.type ?? null,
      target_id: target?.id ?? null,
      metadata: target?.meta ?? null,
    });
  } catch (_) {/* audit table may differ; ignore */}
}

// ─── Actions ────────────────────────────────────────────────────────
const actions: Record<string, (req: Request, body: any, actor: string) => Promise<any>> = {
  async 'me'(_req, _body, actor) {
    const { data } = await admin().from('platform_admins').select('role').eq('user_id', actor);
    return { roles: (data ?? []).map((r) => r.role) };
  },

  async 'dashboard'() {
    const db = admin();
    const [users, orgs, msps, devices, threats, credits] = await Promise.all([
      db.from('profiles').select('id', { count: 'exact', head: true }),
      db.from('organizations').select('id', { count: 'exact', head: true }),
      db.from('msps').select('id', { count: 'exact', head: true }),
      db.from('devices').select('id', { count: 'exact', head: true }),
      db.from('security_alerts').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString()),
      db.from('ai_credit_ledger').select('credits_delta').gte('created_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString()),
    ]);
    const rcToday = (credits.data ?? []).reduce((s: number, r: any) => s + Math.abs(Number(r.credits_delta ?? 0)), 0);
    return {
      users: users.count ?? 0,
      orgs: orgs.count ?? 0,
      msps: msps.count ?? 0,
      devices: devices.count ?? 0,
      threats_24h: threats.count ?? 0,
      rc_today: rcToday,
    };
  },

  async 'users.list'(_req, body) {
    const q = (body?.search ?? '').toString().trim();
    const db = admin();
    const { data: authUsers, error } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) throw error;
    let items = authUsers.users.map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      banned_until: (u as any).banned_until ?? null,
      email_confirmed_at: u.email_confirmed_at,
      provider: u.app_metadata?.provider ?? 'email',
    }));
    if (q) items = items.filter((u) => (u.email ?? '').toLowerCase().includes(q.toLowerCase()));
    // Attach platform role + subscription tier
    const ids = items.map((i) => i.id);
    const [{ data: adminsRows }, { data: subs }, { data: creditsRows }] = await Promise.all([
      db.from('platform_admins').select('user_id, role').in('user_id', ids),
      db.from('subscribers').select('user_id, subscription_tier, subscribed').in('user_id', ids),
      db.from('user_credits').select('user_id, balance').in('user_id', ids),
    ]);
    const adminMap = new Map((adminsRows ?? []).map((r: any) => [r.user_id, r.role]));
    const subMap = new Map((subs ?? []).map((r: any) => [r.user_id, r]));
    const credMap = new Map((creditsRows ?? []).map((r: any) => [r.user_id, r.balance]));
    return {
      items: items.map((u) => ({
        ...u,
        platform_role: adminMap.get(u.id) ?? null,
        tier: subMap.get(u.id)?.subscription_tier ?? 'free',
        subscribed: subMap.get(u.id)?.subscribed ?? false,
        rc_balance: credMap.get(u.id) ?? 0,
      })),
    };
  },

  async 'users.get'(_req, body) {
    const db = admin();
    const id = body.id as string;
    const [{ data: u }, { data: profile }, { data: sub }, { data: cred }, { data: devices }] = await Promise.all([
      db.auth.admin.getUserById(id),
      db.from('profiles').select('*').eq('id', id).maybeSingle(),
      db.from('subscribers').select('*').eq('user_id', id).maybeSingle(),
      db.from('user_credits').select('*').eq('user_id', id).maybeSingle(),
      db.from('devices').select('id, name, os, last_seen_at, status').eq('user_id', id).limit(50),
    ]);
    return { user: u?.user ?? null, profile, subscription: sub, credits: cred, devices: devices ?? [] };
  },

  async 'users.suspend'(_req, body, actor) {
    await admin().auth.admin.updateUserById(body.id, { ban_duration: body.unban ? 'none' : '876000h' });
    await audit(actor, body.unban ? 'user.unsuspend' : 'user.suspend', { type: 'user', id: body.id });
    return { ok: true };
  },

  async 'users.delete'(_req, body, actor) {
    await admin().auth.admin.deleteUser(body.id);
    await audit(actor, 'user.delete', { type: 'user', id: body.id });
    return { ok: true };
  },

  async 'users.reset_password'(_req, body, actor) {
    const { data, error } = await admin().auth.admin.generateLink({ type: 'recovery', email: body.email });
    if (error) throw error;
    await audit(actor, 'user.reset_password', { type: 'user', id: body.id ?? body.email });
    return { link: data.properties?.action_link };
  },

  async 'users.impersonate'(_req, body, actor) {
    const { data, error } = await admin().auth.admin.generateLink({ type: 'magiclink', email: body.email });
    if (error) throw error;
    await admin().from('admin_impersonation_logs').insert({
      admin_user_id: actor, target_user_id: body.id, reason: body.reason ?? 'admin impersonation',
    }).then(() => {}).catch(() => {});
    await audit(actor, 'user.impersonate', { type: 'user', id: body.id });
    return { link: data.properties?.action_link };
  },

  async 'users.grant_role'(_req, body, actor) {
    await admin().from('platform_admins').upsert({ user_id: body.id, role: body.role, granted_by: actor });
    await audit(actor, 'user.grant_platform_role', { type: 'user', id: body.id, meta: { role: body.role } });
    return { ok: true };
  },

  async 'users.revoke_role'(_req, body, actor) {
    await admin().from('platform_admins').delete().eq('user_id', body.id).eq('role', body.role);
    await audit(actor, 'user.revoke_platform_role', { type: 'user', id: body.id, meta: { role: body.role } });
    return { ok: true };
  },

  async 'users.grant_credits'(_req, body, actor) {
    const delta = Number(body.delta ?? 0);
    await admin().from('ai_credit_ledger').insert({
      user_id: body.id, credits_delta: delta, reason: body.reason ?? 'admin grant',
    });
    // Update balance if user_credits row exists
    const { data: cur } = await admin().from('user_credits').select('balance').eq('user_id', body.id).maybeSingle();
    if (cur) {
      await admin().from('user_credits').update({ balance: Number(cur.balance ?? 0) + delta }).eq('user_id', body.id);
    } else {
      await admin().from('user_credits').insert({ user_id: body.id, balance: delta });
    }
    await audit(actor, 'user.grant_credits', { type: 'user', id: body.id, meta: { delta } });
    return { ok: true };
  },

  async 'orgs.list'() {
    const db = admin();
    const { data: orgs } = await db.from('organizations').select('*').limit(500);
    return { items: orgs ?? [] };
  },

  async 'msps.list'() {
    const db = admin();
    const { data } = await db.from('msps').select('id, name, plan, status, created_at').limit(500);
    const ids = (data ?? []).map((m: any) => m.id);
    const { data: clients } = await db.from('msp_clients').select('msp_id, id, name, status').in('msp_id', ids);
    const byMsp = new Map<string, any[]>();
    (clients ?? []).forEach((c: any) => {
      if (!byMsp.has(c.msp_id)) byMsp.set(c.msp_id, []);
      byMsp.get(c.msp_id)!.push(c);
    });
    return {
      items: (data ?? []).map((m: any) => ({ ...m, clients: byMsp.get(m.id) ?? [] })),
    };
  },

  async 'msps.get'(_req, body) {
    const db = admin();
    const id = body.id;
    const [{ data: msp }, { data: clients }, { data: staff }, { data: revenue }] = await Promise.all([
      db.from('msps').select('*').eq('id', id).maybeSingle(),
      db.from('msp_clients').select('*').eq('msp_id', id),
      db.from('msp_staff').select('*').eq('msp_id', id),
      db.from('msp_revenue').select('*').eq('msp_id', id).order('created_at', { ascending: false }).limit(30),
    ]);
    return { msp, clients: clients ?? [], staff: staff ?? [], revenue: revenue ?? [] };
  },

  async 'billing.overview'() {
    const db = admin();
    const now = Date.now();
    const dayAgo = new Date(now - 24 * 3600 * 1000).toISOString();
    const monthAgo = new Date(now - 30 * 24 * 3600 * 1000).toISOString();

    const [{ data: subs }, { data: txns }, { data: credits }] = await Promise.all([
      db.from('subscribers').select('subscription_tier, subscribed'),
      db.from('payment_transactions').select('amount, status, created_at, transaction_type').gte('created_at', monthAgo),
      db.from('ai_credit_ledger').select('credits_delta, reason, created_at').gte('created_at', dayAgo),
    ]);

    const planMix: Record<string, number> = { free: 0, pro: 0, business: 0, enterprise: 0, msp: 0 };
    (subs ?? []).forEach((s: any) => {
      const t = (s.subscription_tier ?? 'free').toString().toLowerCase();
      planMix[t] = (planMix[t] ?? 0) + 1;
    });
    const paidCount = (subs ?? []).filter((s: any) => s.subscribed).length;
    const revenue30d = (txns ?? [])
      .filter((t: any) => t.status === 'succeeded' || t.status === 'completed')
      .reduce((s: number, t: any) => s + Number(t.amount ?? 0), 0);
    const rcToday = (credits ?? []).reduce((s: number, c: any) => s + Math.abs(Number(c.credits_delta ?? 0)), 0);
    const purchasesToday = (credits ?? []).filter((c: any) => (c.reason ?? '').includes('purchase')).length;

    return {
      mrr_estimate: revenue30d, // rough approximation from last 30d succeeded payments
      arr_estimate: revenue30d * 12,
      paid_subscribers: paidCount,
      total_subscribers: (subs ?? []).length,
      plan_mix: planMix,
      rc_today: rcToday,
      purchases_today: purchasesToday,
      failed_payments: (txns ?? []).filter((t: any) => t.status === 'failed').length,
      refunds: (txns ?? []).filter((t: any) => t.status === 'refunded').length,
    };
  },

  async 'ops.announcements.list'() {
    const { data } = await admin().from('admin_announcements').select('*').order('created_at', { ascending: false }).limit(100);
    return { items: data ?? [] };
  },

  async 'ops.announcements.upsert'(_req, body, actor) {
    const row = { ...body.row, updated_by: actor };
    const { data, error } = await admin().from('admin_announcements').upsert(row).select().maybeSingle();
    if (error) throw error;
    await audit(actor, 'announcement.upsert', { type: 'announcement', id: data?.id });
    return { row: data };
  },

  async 'ops.announcements.delete'(_req, body, actor) {
    await admin().from('admin_announcements').delete().eq('id', body.id);
    await audit(actor, 'announcement.delete', { type: 'announcement', id: body.id });
    return { ok: true };
  },

  async 'ops.flags.list'() {
    const { data } = await admin().from('feature_flags').select('*').order('flag_key');
    return { items: data ?? [] };
  },

  async 'ops.flags.toggle'(_req, body, actor) {
    const { data, error } = await admin().from('feature_flags').update({ is_enabled: body.enabled, updated_by: actor }).eq('id', body.id).select().maybeSingle();
    if (error) throw error;
    await audit(actor, 'flag.toggle', { type: 'flag', id: body.id, meta: { enabled: body.enabled } });
    return { row: data };
  },

  async 'ops.audit.list'(_req, body) {
    const limit = Math.min(Number(body?.limit ?? 200), 500);
    const { data } = await admin().from('admin_audit_trails').select('*').order('created_at', { ascending: false }).limit(limit);
    return { items: data ?? [] };
  },

  async 'ops.support.list'() {
    const { data } = await admin().from('support_tickets').select('*').order('created_at', { ascending: false }).limit(200);
    return { items: data ?? [] };
  },

  async 'threat.overview'() {
    const db = admin();
    const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const [alerts, threats, phishing, vulns, paths] = await Promise.all([
      db.from('security_alerts').select('id, severity, created_at').gte('created_at', dayAgo).limit(1000),
      db.from('xdr_threats').select('id, threat_type, severity, status, created_at').limit(500),
      db.from('safemail_threats').select('id, threat_type, created_at').gte('created_at', dayAgo).limit(500),
      db.from('safenet_vulnerabilities').select('cve_id, severity, cvss_score').order('cvss_score', { ascending: false }).limit(50),
      db.from('ray_attack_paths').select('id, risk_score, name').order('risk_score', { ascending: false }).limit(20),
    ]);
    return {
      alerts_24h: alerts.data?.length ?? 0,
      threats_active: (threats.data ?? []).filter((t: any) => t.status !== 'resolved').length,
      phishing_24h: phishing.data?.length ?? 0,
      top_cves: vulns.data ?? [],
      top_attack_paths: paths.data ?? [],
    };
  },

  async 'fleet.overview'() {
    const db = admin();
    const [agents, rmm, release] = await Promise.all([
      db.from('vanguard_agents').select('id, hostname, os, agent_version, status, last_heartbeat_at').limit(1000),
      db.from('rmm_agents').select('id, status').limit(1000),
      db.from('wrayth_agent_release').select('version, channel, released_at').order('released_at', { ascending: false }).limit(5),
    ]);
    const online = (agents.data ?? []).filter((a: any) => a.status === 'online' || a.status === 'active').length;
    const osCounts: Record<string, number> = {};
    (agents.data ?? []).forEach((a: any) => { const k = (a.os ?? 'unknown').toString(); osCounts[k] = (osCounts[k] ?? 0) + 1; });
    return {
      total: agents.data?.length ?? 0,
      online,
      offline: (agents.data?.length ?? 0) - online,
      rmm_total: rmm.data?.length ?? 0,
      os_counts: osCounts,
      latest_release: release.data?.[0] ?? null,
      recent_agents: (agents.data ?? []).slice(0, 25),
    };
  },

  async 'ai.overview'() {
    const db = admin();
    const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const [ledger, runs, invocations, investigations] = await Promise.all([
      db.from('ai_credit_ledger').select('credits_delta, reason, created_at').gte('created_at', monthAgo),
      db.from('ai_agent_runs').select('id, agent_id, created_at').gte('created_at', monthAgo).limit(1000),
      db.from('ray_skill_invocations').select('skill_id, created_at').gte('created_at', monthAgo).limit(1000),
      db.from('ray_investigations').select('id, kind, created_at').gte('created_at', monthAgo).limit(500),
    ]);
    const rcConsumed = (ledger.data ?? []).filter((l: any) => Number(l.credits_delta ?? 0) < 0)
      .reduce((s: number, l: any) => s + Math.abs(Number(l.credits_delta)), 0);
    const skillCounts: Record<string, number> = {};
    (invocations.data ?? []).forEach((i: any) => { const k = i.skill_id ?? 'unknown'; skillCounts[k] = (skillCounts[k] ?? 0) + 1; });
    return {
      rc_30d: rcConsumed,
      runs_30d: runs.data?.length ?? 0,
      investigations_30d: investigations.data?.length ?? 0,
      top_skills: Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id, count]) => ({ id, count })),
    };
  },
};

// Some actions require elevated roles.
const ROLE_MAP: Record<string, Role> = {
  'users.suspend': 'support',
  'users.delete': 'super_admin',
  'users.reset_password': 'support',
  'users.impersonate': 'super_admin',
  'users.grant_role': 'super_admin',
  'users.revoke_role': 'super_admin',
  'users.grant_credits': 'billing_ops',
  'ops.announcements.upsert': 'platform_ops',
  'ops.announcements.delete': 'platform_ops',
  'ops.flags.toggle': 'platform_ops',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') ?? (await req.clone().json().catch(() => ({}))).action;
    if (!action || !actions[action]) {
      return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const requiredRole = ROLE_MAP[action] ?? 'read_only';
    const auth = await requireAdmin(req, requiredRole);
    if ('error' in auth) {
      return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const out = await actions[action](req, body, auth.user.id);
    return new Response(JSON.stringify(out ?? { ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('[admin-api]', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
