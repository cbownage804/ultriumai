import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the user's JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { node_id } = await req.json();
    if (!node_id) {
      return new Response(JSON.stringify({ error: "node_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get MeshCentral config from secrets
    const meshUrl = Deno.env.get("MESHCENTRAL_URL");
    const meshUser = Deno.env.get("MESHCENTRAL_ADMIN_USER");
    const meshPass = Deno.env.get("MESHCENTRAL_ADMIN_PASS");

    if (!meshUrl || !meshUser || !meshPass) {
      return new Response(
        JSON.stringify({
          error: "MeshCentral not configured",
          details: "MESHCENTRAL_URL, MESHCENTRAL_ADMIN_USER, and MESHCENTRAL_ADMIN_PASS secrets must be set",
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Clean the URL (remove trailing slash)
    const baseUrl = meshUrl.replace(/\/+$/, "");

    // Generate a login token via MeshCentral API
    // MeshCentral supports token-based login via POST /api/gettoken
    const tokenResponse = await fetch(`${baseUrl}/api/gettoken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: meshUser,
        pass: meshPass,
        // Request a short-lived token (5 minutes)
        expire: 300,
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error("MeshCentral token request failed:", tokenResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "Failed to generate MeshCentral token", details: errText }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const tokenData = await tokenResponse.json();

    // Build the remote desktop URL
    // MeshCentral uses the format: /login?token=TOKEN&gotonode=NODEID&viewmode=12
    // viewmode 12 = desktop view
    const loginToken = tokenData.token || tokenData;
    const remoteUrl = `${baseUrl}/login?token=${encodeURIComponent(
      typeof loginToken === "string" ? loginToken : JSON.stringify(loginToken)
    )}&gotonode=${encodeURIComponent(node_id)}&viewmode=12`;

    return new Response(
      JSON.stringify({
        url: remoteUrl,
        expires_in: 300,
        node_id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("MeshCentral auth error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
