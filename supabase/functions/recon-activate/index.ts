import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[RECON-ACTIVATE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Activation request received");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Parse activation request from the Pi agent
    const { 
      activation_key, 
      serial_number, 
      mac_address,
      firmware_version,
      local_ip,
      hostname 
    } = await req.json();

    logStep("Parsing activation data", { activation_key, serial_number, mac_address });

    if (!activation_key) {
      throw new Error("Activation key is required");
    }

    // Find the inventory item with this activation key
    const { data: inventoryItem, error: inventoryError } = await supabaseClient
      .from("recon_inventory")
      .select("*, recon_orders(*)")
      .eq("activation_key", activation_key)
      .single();

    if (inventoryError || !inventoryItem) {
      logStep("Invalid activation key", { activation_key });
      throw new Error("Invalid activation key");
    }

    logStep("Found inventory item", { 
      inventoryId: inventoryItem.id, 
      status: inventoryItem.status 
    });

    // Check if already activated
    if (inventoryItem.status === "active") {
      logStep("Unit already activated");
      
      // Return existing agent info
      const { data: agent } = await supabaseClient
        .from("vanguard_agents")
        .select("id, agent_key")
        .eq("id", inventoryItem.agent_id)
        .single();

      return new Response(JSON.stringify({
        success: true,
        already_activated: true,
        agent_id: agent?.id,
        agent_key: agent?.agent_key,
        message: "Unit is already activated",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get the associated order to find the user
    const order = inventoryItem.recon_orders;
    if (!order) {
      throw new Error("No associated order found");
    }

    logStep("Found associated order", { orderId: order.id, userId: order.user_id });

    // Generate a unique agent key for API authentication
    const agentKey = `vgd_${crypto.randomUUID().replace(/-/g, "")}`;

    // Create a new Vanguard agent for this unit
    const { data: newAgent, error: agentError } = await supabaseClient
      .from("vanguard_agents")
      .insert({
        user_id: order.user_id,
        name: `Recon Unit - ${serial_number || inventoryItem.serial_number}`,
        hostname: hostname || `recon-${inventoryItem.serial_number}`,
        local_ip: local_ip || null,
        agent_key: agentKey,
        agent_version: firmware_version || "1.0.0",
        os_type: "linux",
        os_version: "Raspberry Pi OS",
        status: "online",
        last_heartbeat: new Date().toISOString(),
        capabilities: ["network_discovery", "vulnerability_scan", "traffic_monitor", "threat_detection"],
      })
      .select()
      .single();

    if (agentError) {
      logStep("Failed to create agent", { error: agentError.message });
      throw new Error(`Failed to create agent: ${agentError.message}`);
    }

    logStep("Created new agent", { agentId: newAgent.id });

    // Update inventory item to active status
    const { error: updateError } = await supabaseClient
      .from("recon_inventory")
      .update({
        status: "active",
        agent_id: newAgent.id,
        activated_at: new Date().toISOString(),
        firmware_version: firmware_version || inventoryItem.firmware_version,
        mac_address: mac_address || inventoryItem.mac_address,
      })
      .eq("id", inventoryItem.id);

    if (updateError) {
      logStep("Failed to update inventory", { error: updateError.message });
    }

    // Update order status to active
    await supabaseClient
      .from("recon_orders")
      .update({ order_status: "active" })
      .eq("id", order.id);

    // Log the activation
    await supabaseClient
      .from("recon_activation_logs")
      .insert({
        inventory_id: inventoryItem.id,
        activation_status: "success",
        activation_ip: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown",
        device_info: {
          serial_number,
          mac_address,
          firmware_version,
          local_ip,
          hostname,
        },
      });

    logStep("Activation complete", { agentId: newAgent.id });

    return new Response(JSON.stringify({
      success: true,
      agent_id: newAgent.id,
      agent_key: agentKey,
      api_endpoint: `${Deno.env.get("SUPABASE_URL")}/functions/v1`,
      message: "Unit activated successfully",
      config: {
        heartbeat_interval: 60,
        scan_interval: 3600,
        log_level: "info",
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });

    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
