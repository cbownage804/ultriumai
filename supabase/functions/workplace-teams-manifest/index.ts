// Generates a Microsoft Teams app manifest.json for an org's Wrayth assistant.
// Returns a downloadable JSON blob. No secrets required — this is a template.
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const orgName = (body.org_name || "Your Organization").toString().slice(0, 60);
    const botId = body.bot_id || crypto.randomUUID();

    const manifest = {
      "$schema": "https://developer.microsoft.com/en-us/json-schemas/teams/v1.16/MicrosoftTeams.schema.json",
      manifestVersion: "1.16",
      version: "1.0.0",
      id: crypto.randomUUID(),
      packageName: "com.wrayth.assistant",
      developer: {
        name: "Wrayth",
        websiteUrl: "https://wrayth.lovable.app",
        privacyUrl: "https://wrayth.lovable.app/privacy",
        termsOfUseUrl: "https://wrayth.lovable.app/terms",
      },
      name: { short: "Wrayth", full: `Wrayth Assistant for ${orgName}` },
      description: {
        short: "Ask your company knowledge base",
        full: "Chat with Ray, your approved company knowledge-base assistant. Ray answers only from approved KB content and never exposes private vault secrets.",
      },
      icons: { color: "color.png", outline: "outline.png" },
      accentColor: "#7C3AED",
      bots: [{
        botId,
        scopes: ["personal", "team", "groupchat"],
        supportsFiles: false,
        isNotificationOnly: false,
      }],
      permissions: ["identity", "messageTeamMembers"],
      validDomains: ["wrayth.lovable.app", "nsyobmjpdpvesjwdphlh.supabase.co"],
    };

    // Log event
    await supabase.from("integration_events").insert({
      user_id: user.id,
      provider: "microsoft_teams",
      event_type: "manifest_downloaded",
      actor: user.email || "user",
      detail: { org_name: orgName },
    });

    return new Response(JSON.stringify(manifest, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
