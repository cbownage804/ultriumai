// Generates a Microsoft Teams app manifest.json for an org's Wrayth
// Ray Security Assistant. Ships BOTH a personal/static tab (embedding
// /app/ray/teams-embed) and, optionally, the existing bot entry so
// existing chat installs keep working.
//
// Query/body params:
//   - org_name   (string, optional): label the app for the customer.
//   - org_id     (uuid,   optional): pinned into the tab URL as ?orgId=…
//                                     for deterministic org resolution.
//   - bot_id     (string, optional): reuse an existing bot registration.
//   - include_bot (bool,  default true): drop the bot section entirely if false.
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_BASE_URL = "https://wrayth.ai";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const orgName = (body.org_name || "Your Organization").toString().slice(0, 60);
    const orgId = typeof body.org_id === "string" ? body.org_id : null;
    const includeBot = body.include_bot !== false;
    const botId = body.bot_id || crypto.randomUUID();

    // Personal/static tab entry — this is what the "app embedding" flow
    // actually launches. Bot section stays optional and separate.
    const embedUrl = orgId
      ? `${APP_BASE_URL}/app/ray/teams-embed?orgId=${encodeURIComponent(orgId)}`
      : `${APP_BASE_URL}/app/ray/teams-embed`;

    const staticTabs = [
      {
        entityId: "ray-assistant",
        name: "Ray Assistant",
        contentUrl: embedUrl,
        websiteUrl: embedUrl,
        scopes: ["personal"],
      },
    ];

    const manifest: Record<string, unknown> = {
      "$schema": "https://developer.microsoft.com/en-us/json-schemas/teams/v1.16/MicrosoftTeams.schema.json",
      manifestVersion: "1.16",
      version: "1.0.0",
      id: crypto.randomUUID(),
      packageName: "com.wrayth.assistant",
      developer: {
        name: "Wrayth",
        websiteUrl: APP_BASE_URL,
        privacyUrl: `${APP_BASE_URL}/privacy`,
        termsOfUseUrl: `${APP_BASE_URL}/terms`,
      },
      name: { short: "Ray Assistant", full: `Ray Security Assistant for ${orgName}` },
      description: {
        short: "Ray, your Wrayth Security Assistant",
        full:
          "Chat with Ray, your Wrayth Security Assistant, from inside Microsoft Teams. " +
          "Ray answers from your Wrayth security context and approved organization memory. " +
          "Vault secrets are never exposed.",
      },
      icons: { color: "color.png", outline: "outline.png" },
      accentColor: "#7C3AED",
      staticTabs,
      permissions: ["identity"],
      validDomains: [
        "wrayth.ai",
        "www.wrayth.ai",
        "wrayth.lovable.app",
        "nsyobmjpdpvesjwdphlh.supabase.co",
      ],
    };

    if (includeBot) {
      (manifest as any).bots = [{
        botId,
        scopes: ["personal", "team", "groupchat"],
        supportsFiles: false,
        isNotificationOnly: false,
      }];
      (manifest as any).permissions = ["identity", "messageTeamMembers"];
    }

    await supabase.from("integration_events").insert({
      user_id: user.id,
      provider: "microsoft_teams",
      event_type: "manifest_downloaded",
      actor: user.email || "user",
      detail: {
        org_name: orgName,
        org_id: orgId,
        include_bot: includeBot,
        has_static_tab: true,
      },
    });

    return new Response(JSON.stringify(manifest, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
