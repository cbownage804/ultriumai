// ray-scan: proactively scan the caller's devices + identity signals and
// upsert recommendations into ray_recommendations. Dedupes by fingerprint so
// running repeatedly does not create noise. JWT-authenticated.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

type Rec = {
  category: "device" | "identity" | "posture";
  severity: "info" | "success" | "warn" | "danger";
  rule_slug: string;
  subject_type?: string;
  subject_id?: string;
  title: string;
  body?: string;
  evidence?: Record<string, unknown>;
  suggested_actions?: Array<{
    id: string;
    label: string;
    intent: "navigate";
    target: string;
  }>;
};

async function sha1(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-1", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fingerprintOf(userId: string, orgId: string | null, r: Rec) {
  return sha1(
    [userId, orgId ?? "-", r.category, r.rule_slug, r.subject_id ?? "-"].join(
      "|",
    ),
  );
}

async function scanDevices(
  admin: ReturnType<typeof createClient>,
  userId: string,
): Promise<Rec[]> {
  const recs: Rec[] = [];
  const { data: devices = [] } = await admin
    .from("wrayth_devices")
    .select("id, hostname, last_seen_at, revoked_at")
    .eq("user_id", userId)
    .is("revoked_at", null);

  if (!devices?.length) return recs;

  const deviceIds = devices.map((d: any) => d.id);
  const { data: postures = [] } = await admin
    .from("wrayth_device_posture")
    .select("device_id, findings, captured_at")
    .in("device_id", deviceIds)
    .order("captured_at", { ascending: false });

  // Latest posture per device
  const latest = new Map<string, any>();
  for (const p of postures ?? []) {
    if (!latest.has((p as any).device_id)) latest.set((p as any).device_id, p);
  }

  const now = Date.now();
  for (const d of devices as any[]) {
    const hostname = d.hostname || "device";
    const posture = latest.get(d.id)?.findings ?? {};

    // Stale checkin
    if (d.last_seen_at) {
      const age = now - new Date(d.last_seen_at).getTime();
      if (age > 14 * 24 * 3600 * 1000) {
        recs.push({
          category: "device",
          severity: "info",
          rule_slug: "device_stale_checkin",
          subject_type: "device",
          subject_id: d.id,
          title: `${hostname} hasn't checked in`,
          body: `Last seen ${Math.round(age / (24 * 3600 * 1000))} days ago. Check that the Wrayth agent is running.`,
          evidence: { last_seen_at: d.last_seen_at },
          suggested_actions: [
            { id: "open_devices", label: "Open devices", intent: "navigate", target: "/app/vanguard/devices" },
          ],
        });
      }
    }

    if (posture.bitlocker_enabled === false) {
      recs.push({
        category: "device",
        severity: "warn",
        rule_slug: "bitlocker_off",
        subject_type: "device",
        subject_id: d.id,
        title: `BitLocker is off on ${hostname}`,
        body: "Disk encryption is disabled. Enable BitLocker to protect data at rest.",
        evidence: { bitlocker_enabled: false },
        suggested_actions: [
          { id: "review_device", label: "Review device", intent: "navigate", target: "/app/vanguard/devices" },
        ],
      });
    }

    if (posture.defender_enabled === false) {
      recs.push({
        category: "device",
        severity: "danger",
        rule_slug: "defender_off",
        subject_type: "device",
        subject_id: d.id,
        title: `Microsoft Defender is off on ${hostname}`,
        body: "Real-time protection is disabled. Turn Defender back on.",
        evidence: { defender_enabled: false },
        suggested_actions: [
          { id: "review_device", label: "Review device", intent: "navigate", target: "/app/vanguard/devices" },
        ],
      });
    } else if (posture.defender_cloud_protection === false) {
      recs.push({
        category: "device",
        severity: "warn",
        rule_slug: "defender_cloud_off",
        subject_type: "device",
        subject_id: d.id,
        title: `Defender Cloud Protection disabled on ${hostname}`,
        body: "Cloud-delivered protection catches new threats faster. Enable it in Defender settings.",
        evidence: { defender_cloud_protection: false },
        suggested_actions: [
          { id: "review_device", label: "Review device", intent: "navigate", target: "/app/vanguard/devices" },
        ],
      });
    }

    if (posture.rdp_enabled === true) {
      recs.push({
        category: "device",
        severity: "warn",
        rule_slug: "rdp_enabled",
        subject_type: "device",
        subject_id: d.id,
        title: `Remote Desktop is enabled on ${hostname}`,
        body: "RDP is a common attack surface. Disable it if you don't need remote access.",
        evidence: { rdp_enabled: true },
        suggested_actions: [
          { id: "review_device", label: "Review device", intent: "navigate", target: "/app/vanguard/devices" },
        ],
      });
    }

    const pendingPatches = Number(posture.pending_patches ?? 0);
    if (pendingPatches > 0) {
      recs.push({
        category: "device",
        severity: pendingPatches >= 10 ? "warn" : "info",
        rule_slug: "pending_patches",
        subject_type: "device",
        subject_id: d.id,
        title: `${pendingPatches} pending updates on ${hostname}`,
        body: "Install pending security updates to close known vulnerabilities.",
        evidence: { pending_patches: pendingPatches },
        suggested_actions: [
          { id: "review_device", label: "Review device", intent: "navigate", target: "/app/vanguard/devices" },
        ],
      });
    }

    const localAdmins = Number(posture.local_admin_count ?? 0);
    if (localAdmins > 1) {
      recs.push({
        category: "device",
        severity: "info",
        rule_slug: "multiple_local_admins",
        subject_type: "device",
        subject_id: d.id,
        title: `${localAdmins} local admins on ${hostname}`,
        body: "Multiple local administrators increase risk. Consider reducing to one.",
        evidence: { local_admin_count: localAdmins },
      });
    }
  }
  return recs;
}

async function scanIdentity(
  admin: ReturnType<typeof createClient>,
  userId: string,
): Promise<Rec[]> {
  const recs: Rec[] = [];

  const { count: weakCount } = await admin
    .from("safepass_entries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .lt("password_strength_score", 40);

  if ((weakCount ?? 0) > 0) {
    recs.push({
      category: "identity",
      severity: "warn",
      rule_slug: "weak_passwords",
      subject_type: "vault",
      subject_id: "self",
      title: `${weakCount} weak passwords in your vault`,
      body: "These accounts have weak passwords. Rotate them to a stronger value.",
      evidence: { weak_password_count: weakCount },
      suggested_actions: [
        { id: "open_vault", label: "Open SafePass", intent: "navigate", target: "/app/safepass" },
      ],
    });
  }

  const { count: compromisedCount } = await admin
    .from("safepass_entries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_compromised", true);

  if ((compromisedCount ?? 0) > 0) {
    recs.push({
      category: "identity",
      severity: "danger",
      rule_slug: "compromised_passwords",
      subject_type: "vault",
      subject_id: "self",
      title: `${compromisedCount} compromised passwords`,
      body: "These credentials appear in known breach data. Rotate them immediately.",
      evidence: { compromised_count: compromisedCount },
      suggested_actions: [
        { id: "open_vault", label: "Open SafePass", intent: "navigate", target: "/app/safepass" },
      ],
    });
  }

  const { data: breaches = [] } = await admin
    .from("dark_web_monitors")
    .select("id, email, breach_count, latest_breach, last_checked")
    .eq("user_id", userId)
    .eq("is_active", true)
    .gt("breach_count", 0);

  for (const b of (breaches ?? []) as any[]) {
    recs.push({
      category: "identity",
      severity: "danger",
      rule_slug: "dark_web_breach",
      subject_type: "email",
      subject_id: b.id,
      title: `${b.email} appears in breach data`,
      body: `${b.breach_count} breach${b.breach_count === 1 ? "" : "es"} — latest: ${b.latest_breach ?? "unknown"}.`,
      evidence: { email: b.email, breach_count: b.breach_count, latest: b.latest_breach },
      suggested_actions: [
        { id: "open_darkweb", label: "Review breaches", intent: "navigate", target: "/app/ray/darkweb" },
      ],
    });
  }

  return recs;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const started = Date.now();
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace("Bearer ", "");
  const authed = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: claims, error: claimsErr } = await authed.auth.getClaims(jwt);
  if (claimsErr || !claims?.claims?.sub) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = claims.claims.sub as string;

  // Resolve org membership (first active org)
  const { data: membership } = await admin
    .from("org_team_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  const orgId = (membership as any)?.organization_id ?? null;

  let created = 0;
  let updated = 0;
  let auto_resolved = 0;
  let status: "ok" | "error" | "partial" = "ok";
  let errorMsg: string | null = null;

  try {
    const [dev, ident] = await Promise.all([
      scanDevices(admin, userId),
      scanIdentity(admin, userId),
    ]);
    const allRecs = [...dev, ...ident];

    // Compute fingerprints
    const withFp = await Promise.all(
      allRecs.map(async (r) => ({ r, fp: await fingerprintOf(userId, orgId, r) })),
    );
    const detectedFps = new Set(withFp.map((x) => x.fp));

    for (const { r, fp } of withFp) {
      const row = {
        user_id: userId,
        org_id: orgId,
        category: r.category,
        severity: r.severity,
        rule_slug: r.rule_slug,
        subject_type: r.subject_type ?? null,
        subject_id: r.subject_id ?? null,
        title: r.title,
        body: r.body ?? "",
        evidence: r.evidence ?? {},
        suggested_actions: r.suggested_actions ?? [],
        fingerprint: fp,
        status: "new",
        priority: r.severity === "danger" ? 1 : r.severity === "warn" ? 2 : 3,
        source_finding_ids: [],
        last_seen_at: new Date().toISOString(),
      };

      const { data: existing } = await admin
        .from("ray_recommendations")
        .select("id, status, dismissed_at, completed_at")
        .eq("fingerprint", fp)
        .maybeSingle();

      if (existing) {
        const ex = existing as any;
        const patch: Record<string, unknown> = {
          severity: row.severity,
          title: row.title,
          body: row.body,
          evidence: row.evidence,
          suggested_actions: row.suggested_actions,
          last_seen_at: row.last_seen_at,
        };
        // Reopen resolved-critical findings only. Dismissed stays dismissed
        // (user explicitly told Ray to ignore). Resolved warn/info also stays.
        if (ex.status === "resolved" && r.severity === "danger") {
          patch.status = "new";
          patch.completed_at = null;
          patch.dismissed_at = null;
        }
        const { error } = await admin
          .from("ray_recommendations")
          .update(patch)
          .eq("id", ex.id);
        if (!error) updated++;
      } else {
        const { error } = await admin.from("ray_recommendations").insert(row);
        if (!error) created++;
      }
    }

    // Auto-resolve open recommendations that were previously created by this
    // scanner (have a fingerprint) but are no longer being detected. This is
    // what "recommendations expire appropriately" means for the QA pass.
    const { data: openWithFp = [] } = await admin
      .from("ray_recommendations")
      .select("id, fingerprint")
      .eq("user_id", userId)
      .eq("status", "new")
      .not("fingerprint", "is", null);

    const staleIds = (openWithFp ?? [])
      .filter((r: any) => r.fingerprint && !detectedFps.has(r.fingerprint))
      .map((r: any) => r.id);

    if (staleIds.length > 0) {
      const { error } = await admin
        .from("ray_recommendations")
        .update({
          status: "resolved",
          completed_at: new Date().toISOString(),
        })
        .in("id", staleIds);
      if (!error) auto_resolved = staleIds.length;
    }
  } catch (e) {
    status = "error";
    errorMsg = (e as Error).message?.slice(0, 500) ?? "unknown";
  }


  await admin.from("ray_scan_runs").insert({
    user_id: userId,
    org_id: orgId,
    status,
    recs_created: created,
    recs_updated: updated,
    duration_ms: Date.now() - started,
    error: errorMsg,
  });

  return new Response(
    JSON.stringify({
      ok: status === "ok",
      created,
      updated,
      auto_resolved,
      status,
      error: errorMsg,
      duration_ms: Date.now() - started,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );

});
