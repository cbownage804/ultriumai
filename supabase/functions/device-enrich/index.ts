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
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "enrich";

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

    const body = await req.json();

    if (action === "meraki_lookup") {
      // Look up device in Meraki by IP
      return await merakiLookup(body.ip_address);
    } else if (action === "ai_analyze") {
      // Use AI to analyze device
      return await aiAnalyzeDevice(body.device);
    } else {
      // Combined enrichment
      const results: any = { ip: body.ip_address };

      // Try Meraki lookup
      const merakiData = await getMerakiClientByIp(body.ip_address);
      if (merakiData) {
        results.meraki = merakiData;
      }

      // AI analysis
      const aiAnalysis = await getAiAnalysis(body.device || { ip: body.ip_address });
      if (aiAnalysis) {
        results.ai_analysis = aiAnalysis;
      }

      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Device enrich error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function merakiLookup(ipAddress: string) {
  const data = await getMerakiClientByIp(ipAddress);
  return new Response(JSON.stringify(data || { found: false }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getMerakiClientByIp(ipAddress: string): Promise<any | null> {
  const apiKey = Deno.env.get("MERAKI_API_KEY");
  if (!apiKey) {
    console.log("No MERAKI_API_KEY configured");
    return null;
  }

  try {
    // First get organizations
    const orgsRes = await fetch("https://api.meraki.com/api/v1/organizations", {
      headers: { "X-Cisco-Meraki-API-Key": apiKey },
    });
    
    if (!orgsRes.ok) {
      console.error("Meraki orgs error:", orgsRes.status);
      return null;
    }

    const orgs = await orgsRes.json();
    
    for (const org of orgs) {
      // Get networks for this org
      const networksRes = await fetch(
        `https://api.meraki.com/api/v1/organizations/${org.id}/networks`,
        { headers: { "X-Cisco-Meraki-API-Key": apiKey } }
      );
      
      if (!networksRes.ok) continue;
      const networks = await networksRes.json();

      for (const network of networks) {
        // Search clients in this network
        const clientsRes = await fetch(
          `https://api.meraki.com/api/v1/networks/${network.id}/clients?timespan=86400`,
          { headers: { "X-Cisco-Meraki-API-Key": apiKey } }
        );
        
        if (!clientsRes.ok) continue;
        const clients = await clientsRes.json();

        // Find client by IP
        const client = clients.find((c: any) => c.ip === ipAddress);
        if (client) {
          return {
            found: true,
            source: "meraki",
            organization: org.name,
            network: network.name,
            client: {
              id: client.id,
              mac: client.mac,
              description: client.description,
              ip: client.ip,
              vlan: client.vlan,
              switchport: client.switchport,
              manufacturer: client.manufacturer,
              os: client.os,
              user: client.user,
              firstSeen: client.firstSeen,
              lastSeen: client.lastSeen,
              status: client.status,
              ssid: client.ssid,
              recentDeviceName: client.recentDeviceName,
              recentDeviceSerial: client.recentDeviceSerial,
              usage: client.usage,
            },
          };
        }
      }
    }

    return { found: false, source: "meraki", message: "Device not found in Meraki networks" };
  } catch (error) {
    console.error("Meraki lookup error:", error);
    return null;
  }
}

async function aiAnalyzeDevice(device: any) {
  const analysis = await getAiAnalysis(device);
  return new Response(JSON.stringify(analysis || { error: "AI analysis failed" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getAiAnalysis(device: any): Promise<any | null> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    console.log("No LOVABLE_API_KEY configured");
    return null;
  }

  try {
    const prompt = `Analyze this network device and provide security insights:

Device Information:
- IP Address: ${device.ip || device.ip_address || "Unknown"}
- Hostname: ${device.hostname || "Unknown"}
- MAC Address: ${device.mac || "Unknown"}
- State: ${device.state || "Unknown"}
- OS: ${device.os || "Unknown"}
- Manufacturer: ${device.manufacturer || "Unknown"}

Please provide:
1. Likely device type (e.g., router, workstation, server, IoT device, printer, phone)
2. Potential security concerns for this device type
3. Recommended security actions
4. Risk level (Low, Medium, High, Critical)

Respond in JSON format with keys: device_type, security_concerns, recommendations, risk_level, confidence`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a network security analyst. Analyze devices and provide security insights. Always respond with valid JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) return null;

    // Try to parse JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // If JSON parsing fails, return structured response
        return {
          device_type: "Unknown",
          analysis: content,
          risk_level: "Medium",
        };
      }
    }

    return { analysis: content };
  } catch (error) {
    console.error("AI analysis error:", error);
    return null;
  }
}
