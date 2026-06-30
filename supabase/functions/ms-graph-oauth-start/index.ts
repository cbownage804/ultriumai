/**
 * ms-graph-oauth-start — Builds the Microsoft Entra ID authorization URL
 * Ray sends users to in order to connect a Microsoft 365 tenant.
 *
 * Body: { redirectOrigin: string }  // the app origin we should bounce back to
 * Returns: { url: string }
 *
 * Requires AZURE_CLIENT_ID. The callback is always our own edge function so the
 * Microsoft app registration only needs one redirect URI no matter where the
 * frontend is deployed.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const GRAPH_SCOPES = [
  "offline_access",
  "openid",
  "profile",
  "email",
  "User.Read",
  "Directory.Read.All",
  "Policy.Read.All",
  "Reports.Read.All",
  "AuditLog.Read.All",
].join(" ");

function callbackUrl() {
  const supaUrl = Deno.env.get("SUPABASE_URL")!;
  return `${supaUrl}/functions/v1/ms-graph-oauth-callback`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const clientId = Deno.env.get("AZURE_CLIENT_ID");
    if (!clientId) {
      return new Response(
        JSON.stringify({
          error:
            "Microsoft 365 isn't configured yet. Ask your admin to add AZURE_CLIENT_ID and AZURE_CLIENT_SECRET.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const redirectOrigin: string = body.redirectOrigin || "";

    // State carries who is connecting and where to bounce back to.
    const state = btoa(
      JSON.stringify({ uid: userData.user.id, origin: redirectOrigin, nonce: crypto.randomUUID() }),
    );

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: callbackUrl(),
      response_mode: "query",
      scope: GRAPH_SCOPES,
      state,
      prompt: "select_account",
    });

    const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
    return new Response(JSON.stringify({ url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
