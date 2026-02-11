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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action } = body;

    // ── Internal provisioning action (called by DB trigger via pg_net) ──
    if (action === "provision_msp") {
      const internalSecret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      const authHeader = req.headers.get("Authorization");
      if (authHeader !== `Bearer ${internalSecret}`) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { msp_id, msp_name } = body;
      if (!msp_id) {
        return new Response(JSON.stringify({ error: "msp_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = await provisionMspGroup(supabase, msp_id, msp_name || "MSP");
      return new Response(JSON.stringify(result), {
        status: result.error ? 500 : 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── All other actions require user auth ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { node_id } = body;

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
 * Provision a device group on MeshCentral for a new MSP and save the assignment.
 */
async function provisionMspGroup(supabase: any, mspId: string, mspName: string) {
  // 1. Pick the least-loaded server
  const { data: server, error: serverErr } = await supabase
    .from("meshcentral_servers")
    .select("*")
    .eq("is_active", true)
    .order("current_device_count", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (serverErr || !server) {
    console.error("No active MeshCentral servers available:", serverErr);
    return { error: "No active servers available" };
  }

  const baseUrl = server.server_url.replace(/\/+$/, "");

  // 2. Authenticate with MeshCentral to get admin token
  let adminToken: string;
  try {
    const authRes = await fetch(`${baseUrl}/api/gettoken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: server.admin_username,
        pass: server.admin_password_encrypted,
        expire: 60,
      }),
    });
    if (!authRes.ok) throw new Error(`Auth failed: ${authRes.status}`);
    const authData = await authRes.json();
    adminToken = typeof authData === "string" ? authData : authData.token || JSON.stringify(authData);
  } catch (e) {
    console.error("MeshCentral admin auth failed:", e);
    // Still create the assignment without a real mesh group — can be synced later
    adminToken = "";
  }

  // 3. Create a device group on MeshCentral
  let meshGroupId = `msp-${mspId.substring(0, 8)}`;
  if (adminToken) {
    try {
      const createGroupRes = await fetch(`${baseUrl}/api/createmeshgroup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-meshcentral-token": adminToken,
        },
        body: JSON.stringify({
          name: `Vanguard - ${mspName}`,
          desc: `Auto-provisioned device group for MSP ${mspName}`,
          type: 2, // type 2 = agent-managed devices
        }),
      });
      if (createGroupRes.ok) {
        const groupData = await createGroupRes.json();
        meshGroupId = groupData.meshid || groupData.id || meshGroupId;
        console.log(`Created MeshCentral group "${mspName}": ${meshGroupId}`);
      } else {
        console.warn("MeshCentral group creation returned:", createGroupRes.status, await createGroupRes.text());
      }
    } catch (e) {
      console.warn("MeshCentral group creation failed (will use placeholder):", e);
    }
  }

  // 4. Save the assignment
  const { error: assignErr } = await supabase
    .from("meshcentral_msp_assignments")
    .insert({
      msp_id: mspId,
      server_id: server.id,
      mesh_group_id: meshGroupId,
      is_active: true,
    });

  if (assignErr) {
    console.error("Assignment insert error:", assignErr);
    return { error: "Failed to save assignment", details: assignErr.message };
  }

  // 5. Increment device count
  await supabase
    .from("meshcentral_servers")
    .update({
      current_device_count: (server.current_device_count || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", server.id);

  return { success: true, server_region: server.region, mesh_group_id: meshGroupId };
}

/**
 * Look up the platform-managed MeshCentral server assigned to an MSP.
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

  // Fallback: least-loaded active server
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
