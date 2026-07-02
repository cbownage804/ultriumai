// Sends the most recent unsent digest per scope. Emails via Resend and posts
// an in-app notification. Teams/Slack delivery is intentionally deferred.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

function renderHtml(digest: any) {
  const rows = (digest.highlights ?? []).map((h: any) => {
    const dot = h.severity === "danger" ? "🔴" : h.severity === "warn" ? "🟡" : "🟢";
    return `<li>${dot} <strong>${h.title ?? "Finding"}</strong> <span style="color:#888">(${h.category ?? ""})</span></li>`;
  }).join("");
  const c = digest.counts ?? {};
  const scoreLine = digest.score_after != null
    ? `<p>Security score: <strong>${digest.score_after}</strong>${digest.score_before != null ? ` (was ${digest.score_before})` : ""}</p>`
    : "";
  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
  <h2 style="margin:0 0 8px">Your weekly Ray digest</h2>
  <p style="color:#666;margin:0 0 16px">${digest.week_start} → ${digest.week_end}</p>
  ${scoreLine}
  <p>${c.new_findings ?? 0} new findings, ${c.resolved ?? 0} resolved, ${c.danger ?? 0} critical open.</p>
  ${rows ? `<h3>Highlights</h3><ul>${rows}</ul>` : "<p>No new findings this week.</p>"}
  <p style="margin-top:24px;color:#666;font-size:12px">— Ray, your AI security copilot</p>
  </body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  try {
    const body = await req.json().catch(() => ({} as any));
    const digestId: string | undefined = body?.digest_id;

    let q = admin.from("ray_digests").select("*").is("sent_at", null).order("created_at", { ascending: false }).limit(500);
    if (digestId) q = admin.from("ray_digests").select("*").eq("id", digestId).limit(1) as any;
    const { data: digests = [] } = await q;

    const results: any[] = [];
    for (const d of digests ?? []) {
      const digest = d as any;
      // Resolve recipient emails
      const emails: string[] = [];
      if (digest.user_id) {
        const { data: u } = await admin.auth.admin.getUserById(digest.user_id);
        if (u?.user?.email) emails.push(u.user.email);
      } else if (digest.org_id) {
        const { data: members } = await admin
          .from("org_team_members")
          .select("user_id, role")
          .eq("organization_id", digest.org_id)
          .in("role", ["owner", "admin"]);
        for (const m of members ?? []) {
          const { data: u } = await admin.auth.admin.getUserById((m as any).user_id);
          if (u?.user?.email) emails.push(u.user.email);
        }
      }

      const delivery: any = { email: null, in_app: null };
      const html = renderHtml(digest);
      const subject = `Ray weekly digest — ${digest.week_start}`;

      if (RESEND_API_KEY && emails.length > 0) {
        try {
          const r = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
            body: JSON.stringify({
              from: "Ray <hello@send.ultriumai.com>",
              to: emails,
              subject,
              html,
            }),
          });
          delivery.email = { ok: r.ok, status: r.status, recipients: emails.length };
        } catch (e) {
          delivery.email = { ok: false, error: (e as Error).message };
        }
      } else {
        delivery.email = { ok: false, skipped: RESEND_API_KEY ? "no_recipients" : "no_api_key" };
      }

      // In-app notifications
      try {
        const targets: string[] = [];
        if (digest.user_id) targets.push(digest.user_id);
        else if (digest.org_id) {
          const { data: members } = await admin
            .from("org_team_members")
            .select("user_id, role")
            .eq("organization_id", digest.org_id)
            .in("role", ["owner", "admin"]);
          for (const m of members ?? []) targets.push((m as any).user_id);
        }
        for (const uid of targets) {
          await admin.from("notifications").insert({
            user_id: uid,
            title: "Your weekly Ray digest is ready",
            message: `${digest.counts?.new_findings ?? 0} new findings this week.`,
            type: "info",
            metadata: { digest_id: digest.id, week_start: digest.week_start },
          });
        }
        delivery.in_app = { ok: true, recipients: targets.length };
      } catch (e) {
        delivery.in_app = { ok: false, error: (e as Error).message };
      }

      await admin.from("ray_digests")
        .update({ sent_at: new Date().toISOString(), delivery_status: delivery })
        .eq("id", digest.id);

      results.push({ id: digest.id, delivery });
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ray-digest-send error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
