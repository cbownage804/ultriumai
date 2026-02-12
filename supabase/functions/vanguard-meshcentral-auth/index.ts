import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Generate a MeshCentral login token using the loginTokenKey.
 * Token format: AES-256-GCM encrypted cookie → base64url(iv + authTag + ciphertext)
 * with +/ replaced by @$ and no = padding (MeshCentral convention).
 */
async function generateLoginToken(
  loginTokenKeyHex: string,
  username: string,
  domain: string = ""
): Promise<string> {
  // The loginTokenKey is a hex string. First 32 bytes (64 hex chars) = AES key
  const keyBytes = hexToBytes(loginTokenKeyHex.substring(0, 64));

  // Build the cookie payload matching MeshCentral's encodeCookie format
  const cookieData = JSON.stringify({
    a: 3, // action type 3 = login token
    u: `user/${domain}/${username}`,
    time: Math.floor(Date.now() / 1000),
    expire: Math.floor(Date.now() / 1000) + 300, // 5 min expiry
  });

  const encoder = new TextEncoder();
  const plaintext = encoder.encode(cookieData);

  // Generate random 12-byte IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Import AES-256-GCM key
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  // Encrypt with AES-256-GCM (produces ciphertext + 16-byte auth tag appended)
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    cryptoKey,
    plaintext
  );

  const encryptedArray = new Uint8Array(encrypted);
  // Web Crypto appends the auth tag at the end of the ciphertext
  const ciphertext = encryptedArray.slice(0, encryptedArray.length - 16);
  const authTag = encryptedArray.slice(encryptedArray.length - 16);

  // MeshCentral token format: base64(iv + authTag + ciphertext) with custom alphabet
  const combined = new Uint8Array(iv.length + authTag.length + ciphertext.length);
  combined.set(iv, 0);
  combined.set(authTag, iv.length);
  combined.set(ciphertext, iv.length + authTag.length);

  // Base64 encode then replace +/ with @$ and strip = padding
  const base64 = btoa(String.fromCharCode(...combined));
  const token = base64.replace(/\+/g, "@").replace(/\//g, "$").replace(/=+$/, "");

  return token;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

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

    // Get the login token key (from server record or env fallback)
    const loginTokenKey = server.login_token_key || Deno.env.get("MESHCENTRAL_LOGIN_KEY");

    if (!loginTokenKey) {
      console.error("No MESHCENTRAL_LOGIN_KEY configured");
      return new Response(
        JSON.stringify({ error: "Remote access not configured", details: "Login token key not set" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate login token locally using AES-256-GCM (no API call needed)
    const adminUser = server.admin_username || Deno.env.get("MESHCENTRAL_ADMIN_USER") || "admin";
    const loginToken = await generateLoginToken(loginTokenKey, adminUser);

    console.log(`Generated MeshCentral login token for user ${user.id}, node ${node_id}`);

    const remoteUrl = `${baseUrl}/?login=${encodeURIComponent(loginToken)}&gotonode=${encodeURIComponent(node_id)}&viewmode=12`;

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
    adminToken = "";
  }

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
          type: 2,
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
      .select("server_id, mesh_group_id, meshcentral_servers(server_url, admin_username, admin_password_encrypted, login_token_key, region, display_name)")
      .eq("msp_id", mspId)
      .eq("is_active", true)
      .maybeSingle();

    if (assignment?.meshcentral_servers) {
      return assignment.meshcentral_servers;
    }
  }

  const { data: defaultServer } = await supabase
    .from("meshcentral_servers")
    .select("server_url, admin_username, admin_password_encrypted, login_token_key, region, display_name")
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
      login_token_key: Deno.env.get("MESHCENTRAL_LOGIN_KEY") || null,
      region: "default",
      display_name: "Default Server",
    };
  }

  return null;
}
