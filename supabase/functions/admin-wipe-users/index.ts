// Danger-zone edge function: wipes every auth.users row except brandon@ultriumai.com.
// Requires the caller to be a super_admin. Requires body { confirm: "WIPE ALL USERS" }.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const KEEP_EMAIL = 'brandon@ultriumai.com';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get('Authorization') ?? '';
    if (!auth.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
    const supa = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
    const { data: u } = await supa.auth.getUser();
    if (!u.user) return json({ error: 'Unauthorized' }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
    const { data: isSuper } = await admin.rpc('has_platform_role', { _user_id: u.user.id, _role: 'super_admin' });
    if (!isSuper) return json({ error: 'Forbidden — super_admin required' }, 403);

    const body = await req.json().catch(() => ({}));
    if (body?.confirm !== 'WIPE ALL USERS') {
      return json({ error: 'Refusing without confirm phrase "WIPE ALL USERS"' }, 400);
    }

    let deleted = 0;
    let kept = 0;
    const errors: string[] = [];
    let page = 1;
    // Snapshot list first so pagination isn't disturbed by deletions.
    const all: { id: string; email: string | null }[] = [];
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      data.users.forEach((usr) => all.push({ id: usr.id, email: usr.email ?? null }));
      if (data.users.length < 200) break;
      page += 1;
      if (page > 50) break; // safety
    }

    for (const user of all) {
      if ((user.email ?? '').toLowerCase() === KEEP_EMAIL) { kept += 1; continue; }
      const { error } = await admin.auth.admin.deleteUser(user.id);
      if (error) errors.push(`${user.email}: ${error.message}`);
      else deleted += 1;
    }

    // Best-effort cleanup on tables lacking FK cascade (ignore per-table errors).
    const orphanTables = [
      'profiles', 'subscribers', 'user_credits', 'user_roles',
      'ai_credit_ledger', 'msp_staff', 'msp_clients',
      'safepass_entries', 'safepass_vaults',
    ];
    for (const t of orphanTables) {
      await admin.from(t).delete().not('user_id', 'is', null).neq('user_id', await keeperId(admin)).then(() => {}).catch(() => {});
    }

    await admin.from('admin_audit_trails').insert({
      actor_user_id: u.user.id,
      action: 'DANGER.wipe_users',
      metadata: { deleted, kept, errors_count: errors.length },
    }).then(() => {}).catch(() => {});

    return json({ ok: true, deleted, kept, errors });
  } catch (e) {
    console.error('[admin-wipe-users]', e);
    return json({ error: (e as Error).message }, 500);
  }
});

async function keeperId(admin: ReturnType<typeof createClient>) {
  const { data } = await (admin as any).auth.admin.listUsers({ page: 1, perPage: 200 });
  const k = data.users.find((u: any) => (u.email ?? '').toLowerCase() === KEEP_EMAIL);
  return k?.id ?? '00000000-0000-0000-0000-000000000000';
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
