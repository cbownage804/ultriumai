import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("MERAKI_API_KEY");
    if (!apiKey) {
      console.log("No MERAKI_API_KEY configured");
      return new Response(JSON.stringify({ 
        organizations: [],
        networks: [],
        configured: false,
        message: "Meraki API key not configured"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch organizations
    const orgsRes = await fetch("https://api.meraki.com/api/v1/organizations", {
      headers: { "X-Cisco-Meraki-API-Key": apiKey },
    });

    if (!orgsRes.ok) {
      console.error("Meraki orgs error:", orgsRes.status);
      return new Response(JSON.stringify({ 
        error: "Failed to fetch Meraki organizations",
        status: orgsRes.status 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orgs = await orgsRes.json();
    console.log(`Fetched ${orgs.length} Meraki organizations`);

    // Fetch networks for each org
    const networksList: any[] = [];
    
    for (const org of orgs) {
      try {
        const networksRes = await fetch(
          `https://api.meraki.com/api/v1/organizations/${org.id}/networks`,
          { headers: { "X-Cisco-Meraki-API-Key": apiKey } }
        );
        
        if (networksRes.ok) {
          const networks = await networksRes.json();
          for (const network of networks) {
            networksList.push({
              id: network.id,
              name: network.name,
              organization_id: org.id,
              organization_name: org.name,
              timeZone: network.timeZone,
              tags: network.tags,
              productTypes: network.productTypes,
            });
          }
        }
      } catch (e) {
        console.error(`Error fetching networks for org ${org.id}:`, e);
      }
    }

    console.log(`Fetched ${networksList.length} total networks`);

    return new Response(JSON.stringify({
      configured: true,
      organizations: orgs.map((o: any) => ({
        id: o.id,
        name: o.name,
        url: o.url,
      })),
      networks: networksList,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Meraki networks error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
