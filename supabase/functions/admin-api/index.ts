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
    const now = Date.now();
    const dayAgo = new Date(now - 24 * 3600 * 1000).toISOString();
    const weekAgo = new Date(now - 7 * 24 * 3600 * 1000).toISOString();
    const monthAgo = new Date(now - 30 * 24 * 3600 * 1000).toISOString();

    const [
      users, usersActive, usersNew,
      orgTeams, orgTeamsActive,
      msps, mspClients,
      devices, devicesOnline,
      threats, credits,
    ] = await Promise.all([
      db.from('profiles').select('id', { count: 'exact', head: true }),
      db.from('profiles').select('id', { count: 'exact', head: true }).gte('updated_at', monthAgo),
      db.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
      db.from('org_teams').select('id', { count: 'exact', head: true }),
      db.from('org_teams').select('id', { count: 'exact', head: true }).gte('updated_at', monthAgo),
      db.from('msps').select('id', { count: 'exact', head: true }),
      db.from('msp_clients').select('id', { count: 'exact', head: true }),
      db.from('devices').select('id', { count: 'exact', head: true }),
      db.from('devices').select('id', { count: 'exact', head: true }).eq('status', 'online'),
      db.from('security_alerts').select('id', { count: 'exact', head: true }).gte('created_at', dayAgo),
      db.from('ai_credit_ledger').select('credits_delta').gte('created_at', dayAgo),
    ]);
    const rcToday = (credits.data ?? []).reduce((s: number, r: any) => s + Math.abs(Number(r.credits_delta ?? 0)), 0);
    const deviceTotal = devices.count ?? 0;
    const onlineCount = devicesOnline.count ?? 0;
    return {
      users: users.count ?? 0,
      users_active_30d: usersActive.count ?? 0,
      users_new_7d: usersNew.count ?? 0,
      orgs: orgTeams.count ?? 0,
      orgs_active: orgTeamsActive.count ?? 0,
      msps: msps.count ?? 0,
      msp_clients: mspClients.count ?? 0,
      devices: deviceTotal,
      devices_online: onlineCount,
      devices_offline: Math.max(0, deviceTotal - onlineCount),
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
      mfa_enabled: Array.isArray((u as any).factors) && (u as any).factors.length > 0,
    }));
    if (q) items = items.filter((u) => (u.email ?? '').toLowerCase().includes(q.toLowerCase()));
    // Attach platform role, subscription tier, RC balance, primary organization, device count.
    const ids = items.map((i) => i.id);
    const [{ data: adminsRows }, { data: subs }, { data: creditsRows }, { data: ownedOrgs }, { data: memberships }, { data: deviceRows }] = await Promise.all([
      db.from('platform_admins').select('user_id, role').in('user_id', ids),
      db.from('subscribers').select('user_id, subscription_tier, subscribed').in('user_id', ids),
      db.from('user_credits').select('user_id, balance').in('user_id', ids),
      db.from('org_teams').select('id, name, owner_id').in('owner_id', ids),
      db.from('org_team_members').select('user_id, organization_id, org_teams:org_teams(id, name)').in('user_id', ids).eq('status', 'active'),
      db.from('devices').select('user_id').in('user_id', ids),
    ]);
    const adminMap = new Map((adminsRows ?? []).map((r: any) => [r.user_id, r.role]));
    const subMap = new Map((subs ?? []).map((r: any) => [r.user_id, r]));
    const credMap = new Map((creditsRows ?? []).map((r: any) => [r.user_id, r.balance]));
    const deviceMap = new Map<string, number>();
    for (const d of (deviceRows ?? []) as any[]) {
      deviceMap.set(d.user_id, (deviceMap.get(d.user_id) ?? 0) + 1);
    }
    // Prefer owned orgs; fall back to first active membership.
    const orgByUser = new Map<string, { id: string; name: string | null }>();
    for (const o of (ownedOrgs ?? []) as any[]) {
      if (!orgByUser.has(o.owner_id)) orgByUser.set(o.owner_id, { id: o.id, name: o.name });
    }
    for (const m of (memberships ?? []) as any[]) {
      if (orgByUser.has(m.user_id)) continue;
      orgByUser.set(m.user_id, { id: m.organization_id, name: m.org_teams?.name ?? null });
    }
    return {
      items: items.map((u) => {
        const org = orgByUser.get(u.id);
        return {
          ...u,
          platform_role: adminMap.get(u.id) ?? null,
          tier: subMap.get(u.id)?.subscription_tier ?? 'free',
          subscribed: subMap.get(u.id)?.subscribed ?? false,
          rc_balance: credMap.get(u.id) ?? 0,
          device_count: deviceMap.get(u.id) ?? 0,
          org_id: org?.id ?? null,
          org_name: org?.name ?? null,
        };
      }),
    };
  },

  async 'users.get'(_req, body) {
    const db = admin();
    const id = body.id as string;
    const [
      { data: u }, { data: profile }, { data: sub }, { data: cred }, { data: devices },
      { data: threats }, { data: remediations }, { data: investigations }, { data: audit },
    ] = await Promise.all([
      db.auth.admin.getUserById(id),
      db.from('profiles').select('*').eq('id', id).maybeSingle(),
      db.from('subscribers').select('*').eq('user_id', id).maybeSingle(),
      db.from('user_credits').select('*').eq('user_id', id).maybeSingle(),
      db.from('devices').select('id, name, os, last_seen_at, status').eq('user_id', id).limit(50),
      db.from('security_alerts').select('id, title, severity, status, created_at').eq('user_id', id).order('created_at', { ascending: false }).limit(50),
      db.from('wrayth_remediation_actions').select('id, action_type, provider, status, created_at, duration_ms, reversible').eq('user_id', id).order('created_at', { ascending: false }).limit(50),
      db.from('ray_investigations').select('id, input_label, status, verdict, confidence, created_at').eq('user_id', id).order('created_at', { ascending: false }).limit(30),
      db.from('admin_audit_trails').select('id, action, actor_user_id, created_at, metadata').eq('target_id', id).order('created_at', { ascending: false }).limit(50),
    ]);
    const mfaEnabled = Array.isArray((u?.user as any)?.factors) && (u?.user as any).factors.length > 0;
    const activeThreats = (threats ?? []).filter((t: any) => t.status !== 'resolved' && t.status !== 'closed').length;
    const daysSince = (u?.user?.last_sign_in_at)
      ? Math.floor((Date.now() - new Date(u.user.last_sign_in_at).getTime()) / (24 * 3600 * 1000))
      : null;
    const name = (profile?.full_name || u?.user?.email?.split('@')[0] || 'This user').split(' ')[0];
    const rayBrief = [
      `${name} has ${devices?.length ?? 0} device${(devices?.length ?? 0) === 1 ? '' : 's'}`,
      activeThreats > 0 ? `${activeThreats} active threat${activeThreats === 1 ? '' : 's'}` : 'no active threats',
      mfaEnabled ? 'MFA enabled' : 'MFA not enrolled',
      daysSince !== null ? `last signed in ${daysSince === 0 ? 'today' : `${daysSince} day${daysSince === 1 ? '' : 's'} ago`}` : 'has never signed in',
    ].join(', ') + '.';
    return {
      user: u?.user ?? null,
      profile, subscription: sub, credits: cred,
      devices: devices ?? [],
      threats: threats ?? [],
      remediations: remediations ?? [],
      investigations: investigations ?? [],
      audit: audit ?? [],
      mfa_enabled: mfaEnabled,
      ray_brief: rayBrief,
    };
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
    // Source of truth for real customer orgs is org_teams (user-owned workspaces).
    const { data: orgs } = await db.from('org_teams').select('id, name, slug, owner_id, billing_email, created_at, updated_at').limit(500);
    const rows = orgs ?? [];
    const ownerIds = Array.from(new Set(rows.map((o: any) => o.owner_id).filter(Boolean))) as string[];
    const orgIds = rows.map((o: any) => o.id);

    const [ownerAuth, ownerProfiles, memberRows, deviceRows, subRows] = await Promise.all([
      ownerIds.length ? db.auth.admin.listUsers({ page: 1, perPage: 200 }) : Promise.resolve({ data: { users: [] as any[] } } as any),
      ownerIds.length ? db.from('profiles').select('id, full_name').in('id', ownerIds) : Promise.resolve({ data: [] as any[] } as any),
      orgIds.length ? db.from('org_team_members').select('organization_id').in('organization_id', orgIds).eq('status', 'active') : Promise.resolve({ data: [] as any[] } as any),
      orgIds.length ? db.from('devices').select('org_id, last_checkin').in('org_id', orgIds) : Promise.resolve({ data: [] as any[] } as any),
      ownerIds.length ? db.from('subscribers').select('user_id, subscription_tier').in('user_id', ownerIds) : Promise.resolve({ data: [] as any[] } as any),
    ]);
    const emailByOwner = new Map<string, string | null>();
    for (const u of (ownerAuth.data?.users ?? []) as any[]) {
      if (ownerIds.includes(u.id)) emailByOwner.set(u.id, u.email ?? null);
    }
    const nameByOwner = new Map((ownerProfiles.data ?? []).map((p: any) => [p.id, p.full_name]));
    const tierByOwner = new Map((subRows.data ?? []).map((s: any) => [s.user_id, s.subscription_tier]));
    const memberCount = new Map<string, number>();
    for (const m of (memberRows.data ?? []) as any[]) {
      memberCount.set(m.organization_id, (memberCount.get(m.organization_id) ?? 0) + 1);
    }
    const deviceCount = new Map<string, number>();
    const lastActivity = new Map<string, string | null>();
    for (const d of (deviceRows.data ?? []) as any[]) {
      deviceCount.set(d.org_id, (deviceCount.get(d.org_id) ?? 0) + 1);
      const cur = lastActivity.get(d.org_id) ?? null;
      if (d.last_checkin && (!cur || d.last_checkin > cur)) lastActivity.set(d.org_id, d.last_checkin);
    }
    return {
      items: rows.map((o: any) => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
        owner_id: o.owner_id,
        owner_email: emailByOwner.get(o.owner_id) ?? null,
        owner_display_name: nameByOwner.get(o.owner_id) ?? null,
        tier: tierByOwner.get(o.owner_id) ?? 'free',
        member_count: (memberCount.get(o.id) ?? 0) + 1, // owner always counts
        device_count: deviceCount.get(o.id) ?? 0,
        created_at: o.created_at,
        last_activity_at: lastActivity.get(o.id) ?? o.updated_at ?? o.created_at,
      })),
    };
  },

  async 'orgs.get'(_req, body) {
    const db = admin();
    const id = body.id as string;
    const { data: org } = await db.from('org_teams').select('*').eq('id', id).maybeSingle();
    if (!org) return { org: null, members: [], devices: [], remediations: [], timeline: [], billing: { stripe_customer_id: null, subscription_end: null, seats: 0, max_seats: null, rc_balance: 0 } };

    const [{ data: memberRows }, { data: devices }, { data: remediations }, { data: timeline }, { data: sub }, { data: cred }] = await Promise.all([
      db.from('org_team_members').select('user_id, email, role, status, joined_at').eq('organization_id', id),
      db.from('devices').select('id, hostname, agent_version, status, last_checkin').eq('org_id', id).order('last_checkin', { ascending: false }).limit(200),
      org.owner_id ? db.from('wrayth_remediation_actions').select('id, action_type, provider, status, created_at, duration_ms').eq('user_id', org.owner_id).order('created_at', { ascending: false }).limit(50) : Promise.resolve({ data: [] } as any),
      db.from('ray_org_timeline').select('id, occurred_at, category, summary, severity').eq('org_id', id).order('occurred_at', { ascending: false }).limit(30),
      org.owner_id ? db.from('subscribers').select('*').eq('user_id', org.owner_id).maybeSingle() : Promise.resolve({ data: null } as any),
      org.owner_id ? db.from('user_credits').select('balance').eq('user_id', org.owner_id).maybeSingle() : Promise.resolve({ data: null } as any),
    ]);

    // Attach owner email + name to org for the detail header.
    let ownerEmail: string | null = null;
    let ownerName: string | null = null;
    if (org.owner_id) {
      const { data: u } = await db.auth.admin.getUserById(org.owner_id);
      ownerEmail = u?.user?.email ?? null;
      const { data: p } = await db.from('profiles').select('full_name').eq('id', org.owner_id).maybeSingle();
      ownerName = p?.full_name ?? null;
    }

    // Enrich member rows with email + last_sign_in via a single auth list.
    const memberIds = (memberRows ?? []).map((m: any) => m.user_id).filter(Boolean);
    const authInfo = new Map<string, { email: string | null; last_sign_in_at: string | null }>();
    if (memberIds.length) {
      const { data: authUsers } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
      for (const u of authUsers?.users ?? []) {
        if (memberIds.includes(u.id)) authInfo.set(u.id, { email: u.email ?? null, last_sign_in_at: u.last_sign_in_at ?? null });
      }
    }

    const members = (memberRows ?? []).map((m: any) => ({
      user_id: m.user_id,
      email: authInfo.get(m.user_id)?.email ?? m.email ?? null,
      role: m.role,
      status: m.status,
      joined_at: m.joined_at,
      last_sign_in_at: authInfo.get(m.user_id)?.last_sign_in_at ?? null,
    }));

    const lastDeviceCheckin = (devices ?? [])
      .map((d: any) => d.last_checkin)
      .filter(Boolean)
      .sort()
      .pop() ?? null;

    return {
      org: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        owner_id: org.owner_id,
        owner_email: ownerEmail,
        owner_display_name: ownerName,
        tier: sub?.subscription_tier ?? 'free',
        billing_email: org.billing_email,
        created_at: org.created_at,
        last_activity_at: lastDeviceCheckin ?? org.updated_at ?? org.created_at,
      },
      members,
      devices: devices ?? [],
      remediations: (remediations as any[]) ?? [],
      timeline: timeline ?? [],
      billing: {
        stripe_customer_id: sub?.stripe_customer_id ?? null,
        subscription_end: sub?.subscription_end ?? null,
        seats: members.length + 1,
        max_seats: org.max_members ?? null,
        rc_balance: Number(cred?.balance ?? 0),
      },
    };
  },

  async 'msps.list'() {
    const db = admin();
    const { data } = await db
      .from('msps')
      .select('id, company_name, brand_name, subscription_tier, is_active, contact_email, created_at, max_clients, monthly_rate_per_user')
      .order('created_at', { ascending: false })
      .limit(500);
    const ids = (data ?? []).map((m: any) => m.id);
    const { data: clients } = ids.length
      ? await db
          .from('msp_clients')
          .select('msp_id, id, company_name, billing_status, health_status, is_active, current_users, endpoints, alerts, monthly_rate')
          .in('msp_id', ids)
      : { data: [] as any[] };
    const byMsp = new Map<string, any[]>();
    (clients ?? []).forEach((c: any) => {
      if (!byMsp.has(c.msp_id)) byMsp.set(c.msp_id, []);
      byMsp.get(c.msp_id)!.push(c);
    });
    return {
      items: (data ?? []).map((m: any) => {
        const cs = byMsp.get(m.id) ?? [];
        const active_clients = cs.filter((c: any) => c.is_active !== false).length;
        const endpoints = cs.reduce((s: number, c: any) => s + Number(c.endpoints ?? c.current_users ?? 0), 0);
        const alerts = cs.reduce((s: number, c: any) => s + Number(c.alerts ?? 0), 0);
        const mrr = cs.reduce((s: number, c: any) => s + Number(c.monthly_rate ?? 0), 0);
        const critical_clients = cs.filter((c: any) => (c.health_status ?? '').toLowerCase() === 'critical').length;
        return {
          id: m.id,
          name: m.brand_name || m.company_name || 'Unnamed MSP',
          tier: m.subscription_tier ?? 'msp',
          status: m.is_active === false ? 'inactive' : 'active',
          contact_email: m.contact_email,
          created_at: m.created_at,
          clients_count: cs.length,
          active_clients,
          endpoints,
          alerts,
          mrr,
          critical_clients,
          clients: cs.slice(0, 4),
        };
      }),
    };
  },

  async 'msps.get'(_req, body) {
    const db = admin();
    const id = body.id;
    const [{ data: msp }, { data: clients }, { data: staff }, { data: revenue }] = await Promise.all([
      db.from('msps').select('*').eq('id', id).maybeSingle(),
      db.from('msp_clients').select('*').eq('msp_id', id).order('company_name'),
      db.from('msp_staff').select('*').eq('msp_id', id),
      db.from('msp_revenue').select('*').eq('msp_id', id).order('created_at', { ascending: false }).limit(60),
    ]);
    const cs = clients ?? [];
    const totals = {
      clients: cs.length,
      active_clients: cs.filter((c: any) => c.is_active !== false).length,
      endpoints: cs.reduce((s: number, c: any) => s + Number(c.endpoints ?? c.current_users ?? 0), 0),
      alerts: cs.reduce((s: number, c: any) => s + Number(c.alerts ?? 0), 0),
      mrr: cs.reduce((s: number, c: any) => s + Number(c.monthly_rate ?? 0), 0),
      health: {
        healthy: cs.filter((c: any) => (c.health_status ?? '').toLowerCase() === 'healthy').length,
        warning: cs.filter((c: any) => (c.health_status ?? '').toLowerCase() === 'warning').length,
        critical: cs.filter((c: any) => (c.health_status ?? '').toLowerCase() === 'critical').length,
        unknown: cs.filter((c: any) => !c.health_status).length,
      },
    };
    return { msp, clients: cs, staff: staff ?? [], revenue: revenue ?? [], totals };
  },

  async 'billing.overview'() {
    const db = admin();
    const now = Date.now();
    const dayAgo = new Date(now - 24 * 3600 * 1000).toISOString();
    const monthAgo = new Date(now - 30 * 24 * 3600 * 1000).toISOString();
    const twoMonthsAgo = new Date(now - 60 * 24 * 3600 * 1000).toISOString();

    const [{ data: subs }, { data: txns }, { data: credits }] = await Promise.all([
      db
        .from('subscribers')
        .select('subscription_tier, subscribed, status, cancel_at_period_end, subscription_end, created_at, updated_at'),
      db
        .from('payment_transactions')
        .select('amount, status, created_at, transaction_type, description, user_id, stripe_payment_intent_id')
        .gte('created_at', twoMonthsAgo)
        .order('created_at', { ascending: false }),
      db.from('ai_credit_ledger').select('credits_delta, reason, created_at').gte('created_at', monthAgo),
    ]);

    const planMix: Record<string, number> = {};
    (subs ?? []).forEach((s: any) => {
      if (!s.subscribed) return;
      const t = (s.subscription_tier ?? 'unknown').toString().toLowerCase();
      planMix[t] = (planMix[t] ?? 0) + 1;
    });

    const paidCount = (subs ?? []).filter((s: any) => s.subscribed).length;
    const total = (subs ?? []).length;

    // payment_transactions.amount is stored in CENTS.
    const succeeded = (txns ?? []).filter((t: any) => t.status === 'succeeded' || t.status === 'completed' || t.status === 'paid');
    const last30 = succeeded.filter((t: any) => t.created_at >= monthAgo);
    const prior30 = succeeded.filter((t: any) => t.created_at < monthAgo);
    const cents = (arr: any[]) => arr.reduce((s: number, t: any) => s + Number(t.amount ?? 0), 0);
    const rev30 = cents(last30) / 100;
    const revPrior = cents(prior30) / 100;
    const growthPct = revPrior > 0 ? ((rev30 - revPrior) / revPrior) * 100 : rev30 > 0 ? 100 : 0;

    // Daily revenue trend (last 30 days, dollars).
    const trend: Array<{ date: string; revenue: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const start = new Date(now - i * 24 * 3600 * 1000);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(start.getTime() + 24 * 3600 * 1000);
      const startIso = start.toISOString();
      const endIso = end.toISOString();
      const dayTotal = cents(last30.filter((t: any) => t.created_at >= startIso && t.created_at < endIso)) / 100;
      trend.push({ date: startIso.slice(0, 10), revenue: dayTotal });
    }

    const refunds30 = (txns ?? []).filter((t: any) => t.created_at >= monthAgo && (t.status === 'refunded' || t.transaction_type === 'refund'));
    const failed30 = (txns ?? []).filter((t: any) => t.created_at >= monthAgo && t.status === 'failed');

    const newSubs30 = (subs ?? []).filter((s: any) => s.subscribed && s.created_at && s.created_at >= monthAgo).length;
    const churned30 = (subs ?? []).filter(
      (s: any) => (s.status === 'canceled' || s.cancel_at_period_end === true) && (s.updated_at ?? s.subscription_end ?? '') >= monthAgo,
    ).length;
    const churnPct = paidCount + churned30 > 0 ? (churned30 / (paidCount + churned30)) * 100 : 0;
    const arpu = paidCount > 0 ? rev30 / paidCount : 0;

    const rcConsumed30 = (credits ?? [])
      .filter((c: any) => Number(c.credits_delta ?? 0) < 0)
      .reduce((s: number, c: any) => s + Math.abs(Number(c.credits_delta)), 0);
    const rcToday = (credits ?? [])
      .filter((c: any) => c.created_at >= dayAgo)
      .reduce((s: number, c: any) => s + Math.abs(Number(c.credits_delta ?? 0)), 0);
    const purchasesToday = (credits ?? []).filter(
      (c: any) => (c.reason ?? '').includes('purchase') && c.created_at >= dayAgo,
    ).length;

    const recent = (txns ?? []).slice(0, 12).map((t: any) => ({
      id: t.stripe_payment_intent_id ?? undefined,
      created_at: t.created_at,
      amount: Number(t.amount ?? 0) / 100,
      status: t.status,
      type: t.transaction_type,
      description: t.description,
    }));

    return {
      mrr_estimate: rev30,
      arr_estimate: rev30 * 12,
      growth_pct: growthPct,
      revenue_trend: trend,
      paid_subscribers: paidCount,
      total_subscribers: total,
      new_subs_30d: newSubs30,
      churned_30d: churned30,
      churn_pct: churnPct,
      arpu,
      plan_mix: planMix,
      rc_today: rcToday,
      rc_30d: rcConsumed30,
      purchases_today: purchasesToday,
      failed_payments: failed30.length,
      refunds: refunds30.length,
      refunds_amount_30d: cents(refunds30) / 100,
      recent_transactions: recent,
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

  /**
   * Real platform-service health checks. Every probe returns 'ok' | 'degraded' | 'down'
   * with a short reason. Nothing is faked — if a service isn't configured, we return
   * 'not_configured' so the UI can render it as neutral instead of green.
   */
  async 'platform.status'() {
    const db = admin();
    const checks: Array<{ id: string; label: string; status: 'ok' | 'degraded' | 'down' | 'not_configured'; detail?: string }> = [];

    // Database — round-trip a lightweight count.
    try {
      const started = Date.now();
      const { error } = await db.from('profiles').select('id', { count: 'exact', head: true });
      const ms = Date.now() - started;
      if (error) checks.push({ id: 'database', label: 'Database', status: 'down', detail: error.message });
      else checks.push({ id: 'database', label: 'Database', status: ms > 1500 ? 'degraded' : 'ok', detail: `${ms}ms` });
    } catch (e) {
      checks.push({ id: 'database', label: 'Database', status: 'down', detail: (e as Error).message });
    }

    // Authentication — the fact that this request reached here means auth is up,
    // but confirm the admin client can list at least one user page.
    try {
      const { error } = await db.auth.admin.listUsers({ page: 1, perPage: 1 });
      checks.push({ id: 'auth', label: 'Authentication', status: error ? 'down' : 'ok', detail: error?.message });
    } catch (e) {
      checks.push({ id: 'auth', label: 'Authentication', status: 'down', detail: (e as Error).message });
    }

    // AI Services — presence of the Lovable AI Gateway key.
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    checks.push({
      id: 'ai',
      label: 'AI Services',
      status: lovableKey ? 'ok' : 'not_configured',
      detail: lovableKey ? undefined : 'LOVABLE_API_KEY not set',
    });

    // Billing — presence of Stripe secret. We deliberately don't call Stripe here
    // to avoid burning rate limits on every dashboard load.
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    checks.push({
      id: 'billing',
      label: 'Billing',
      status: stripeKey ? 'ok' : 'not_configured',
      detail: stripeKey ? undefined : 'STRIPE_SECRET_KEY not set',
    });

    // Agent Updates — must have at least one row in wrayth_agent_release.
    try {
      const { count } = await db.from('wrayth_agent_release').select('id', { count: 'exact', head: true });
      checks.push({
        id: 'agents',
        label: 'Agent Updates',
        status: (count ?? 0) > 0 ? 'ok' : 'not_configured',
        detail: (count ?? 0) > 0 ? `${count} releases` : 'No agent releases published',
      });
    } catch {
      checks.push({ id: 'agents', label: 'Agent Updates', status: 'not_configured' });
    }

    // Email — presence of the transactional email key.
    const resendKey = Deno.env.get('RESEND_API_KEY');
    checks.push({
      id: 'email',
      label: 'Email Delivery',
      status: resendKey ? 'ok' : 'not_configured',
      detail: resendKey ? undefined : 'RESEND_API_KEY not set',
    });

    return { checks, checked_at: new Date().toISOString() };
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
