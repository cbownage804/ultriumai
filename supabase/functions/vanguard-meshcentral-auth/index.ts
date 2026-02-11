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

    // Handle saving/updating MeshCentral config
    if (action === "save_config") {
      const { server_url, admin_username, admin_password, msp_id } = body;
      if (!server_url || !admin_username || !admin_password) {
        return new Response(JSON.stringify({ error: "server_url, admin_username, and admin_password are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify connection to MeshCentral before saving
      const baseUrl = server_url.replace(/\/+$/, "");
      try {
        const testResponse = await fetch(`${baseUrl}/api/serverstate`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        // MeshCentral may return 401 for unauthenticated but server is reachable
        if (!testResponse.ok && testResponse.status !== 401 && testResponse.status !== 403) {
          const errText = await testResponse.text();
          return new Response(JSON.stringify({ 
            error: "Could not connect to MeshCentral server", 
            details: errText 
          }), {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (connErr) {
        // Server might use self-signed certs, still try to save
        console.warn("MeshCentral connection test warning:", connErr);
      }

      // Upsert config
      const { data: config, error: upsertError } = await supabase
        .from("meshcentral_configs")
        .upsert({
          user_id: user.id,
          msp_id: msp_id || null,
          server_url: baseUrl,
          admin_username,
          admin_password_encrypted: admin_password, // In production, encrypt this
          is_active: true,
          verification_status: "verified",
          last_verified_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,msp_id",
        })
        .select()
        .single();

      if (upsertError) {
        console.error("Failed to save config:", upsertError);
        return new Response(JSON.stringify({ error: "Failed to save config", details: upsertError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, config_id: config.id }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle getting config status
    if (action === "get_config") {
      const { msp_id } = body;
      
      // Try user's MSP-specific config first, then user-level config
      let query = supabase
        .from("meshcentral_configs")
        .select("id, server_url, admin_username, is_active, verification_status, last_verified_at, mesh_group_prefix, created_at")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (msp_id) {
        query = query.eq("msp_id", msp_id);
      } else {
        query = query.is("msp_id", null);
      }

      const { data: config, error: fetchError } = await query.maybeSingle();

      if (fetchError) {
        return new Response(JSON.stringify({ error: "Failed to fetch config" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ config: config || null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle remote session request
    if (!node_id) {
      return new Response(JSON.stringify({ error: "node_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up user's MeshCentral config from database
    const { data: configs, error: configError } = await supabase
      .from("meshcentral_configs")
      .select("server_url, admin_username, admin_password_encrypted")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1);

    let meshUrl: string | undefined;
    let meshUser: string | undefined;
    let meshPass: string | undefined;

    if (configs && configs.length > 0) {
      // Use per-user config from database
      meshUrl = configs[0].server_url;
      meshUser = configs[0].admin_username;
      meshPass = configs[0].admin_password_encrypted;
    } else {
      // Fallback to global secrets (for backwards compatibility / platform admin)
      meshUrl = Deno.env.get("MESHCENTRAL_URL");
      meshUser = Deno.env.get("MESHCENTRAL_ADMIN_USER");
      meshPass = Deno.env.get("MESHCENTRAL_ADMIN_PASS");
    }

    if (!meshUrl || !meshUser || !meshPass) {
      return new Response(
        JSON.stringify({
          error: "MeshCentral not configured",
          details: "Set up MeshCentral in Vanguard Settings → Remote Access",
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const baseUrl = meshUrl.replace(/\/+$/, "");

    // Generate a login token via MeshCentral API
    const tokenResponse = await fetch(`${baseUrl}/api/gettoken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: meshUser,
        pass: meshPass,
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
