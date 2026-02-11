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

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { node_id, action } = body;

    // Handle status check
    if (action === "get_status") {
      const { msp_id } = body;
      const server = await getAssignedServer(supabase, msp_id);
      return new Response(JSON.stringify({
        configured: !!server,
        region: server?.region || null,
        server_name: server?.display_name || null,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Remote session request
    if (!node_id) {
      return new Response(JSON.stringify({ error: "node_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up the platform-managed server for this MSP
    const { msp_id } = body;
    const server = await getAssignedServer(supabase, msp_id);

    if (!server) {
      return new Response(
        JSON.stringify({
          error: "Remote access not provisioned",
          details: "Your account has not been assigned a remote access server. Contact support.",
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const baseUrl = server.server_url.replace(/\/+$/, "");

    // Generate a login token via MeshCentral API
    const tokenResponse = await fetch(`${baseUrl}/api/gettoken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: server.admin_username,
        pass: server.admin_password_encrypted,
        expire: 300,
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error("MeshCentral token request failed:", tokenResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "Failed to generate remote access token", details: errText }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const tokenData = await tokenResponse.json();
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

/**
 * Look up the platform-managed MeshCentral server assigned to an MSP.
 * Falls back to global env secrets for backwards compatibility.
 */
async function getAssignedServer(supabase: any, mspId?: string) {
  if (mspId) {
    const { data: assignment } = await supabase
      .from("meshcentral_msp_assignments")
      .select("server_id, mesh_group_id, meshcentral_servers(server_url, admin_username, admin_password_encrypted, region, display_name)")
      .eq("msp_id", mspId)
      .eq("is_active", true)
      .maybeSingle();

    if (assignment?.meshcentral_servers) {
      return assignment.meshcentral_servers;
    }
  }

  // Fallback: check for a default regional server or global env vars
  const { data: defaultServer } = await supabase
    .from("meshcentral_servers")
    .select("server_url, admin_username, admin_password_encrypted, region, display_name")
    .eq("is_active", true)
    .order("current_device_count", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (defaultServer) return defaultServer;

  // Legacy fallback to env vars
  const meshUrl = Deno.env.get("MESHCENTRAL_URL");
  const meshUser = Deno.env.get("MESHCENTRAL_ADMIN_USER");
  const meshPass = Deno.env.get("MESHCENTRAL_ADMIN_PASS");

  if (meshUrl && meshUser && meshPass) {
    return {
      server_url: meshUrl,
      admin_username: meshUser,
      admin_password_encrypted: meshPass,
      region: "default",
      display_name: "Default Server",
    };
  }

  return null;
}
