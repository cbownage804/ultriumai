import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OperationRequest {
  agent_id: string;
  operation: string;
  payload?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

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

    const { agent_id, operation, payload = {} }: OperationRequest = await req.json();

    if (!agent_id || !operation) {
      return new Response(JSON.stringify({ error: "Missing agent_id or operation" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify agent belongs to user
    const { data: agent, error: agentError } = await supabase
      .from("vanguard_agents")
      .select("id, device_name, os_type")
      .eq("id", agent_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (agentError || !agent) {
      return new Response(JSON.stringify({ error: "Agent not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map operations to command types
    const operationMap: Record<string, string> = {
      // Registry operations
      read_registry: "registry_read",
      write_registry: "registry_write",
      delete_registry: "registry_delete",
      export_registry: "registry_export",
      
      // Event log operations
      get_event_logs: "get_event_logs",
      clear_event_log: "clear_event_log",
      
      // Service operations
      get_services: "get_services",
      service_action: "service_control",
      
      // Process operations
      get_processes: "get_processes",
      kill_process: "kill_process",
      kill_process_tree: "kill_process_tree",
      
      // Software operations
      get_installed_software: "get_software",
      install_software: "install_software",
      uninstall_software: "uninstall_software",
      
      // Task/Performance operations
      get_system_metrics: "get_metrics",
    };

    const commandType = operationMap[operation];
    if (!commandType) {
      return new Response(JSON.stringify({ error: `Unknown operation: ${operation}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create command for agent
    const { data: command, error: cmdError } = await supabase
      .from("vanguard_agent_commands")
      .insert({
        agent_id,
        user_id: user.id,
        command_type: commandType,
        command_payload: payload,
        status: "pending",
      })
      .select()
      .single();

    if (cmdError) {
      console.error("Command creation error:", cmdError);
      return new Response(JSON.stringify({ error: "Failed to create command" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For read operations, wait briefly for agent response
    const readOperations = [
      "read_registry", "get_event_logs", "get_services", 
      "get_processes", "get_installed_software", "get_system_metrics"
    ];

    if (readOperations.includes(operation)) {
      // Poll for result (max 5 seconds)
      const maxWait = 5000;
      const pollInterval = 500;
      let waited = 0;

      while (waited < maxWait) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        waited += pollInterval;

        const { data: updatedCmd } = await supabase
          .from("vanguard_agent_commands")
          .select("status, result, error_message")
          .eq("id", command.id)
          .single();

        if (updatedCmd?.status === "completed") {
          return new Response(JSON.stringify({
            success: true,
            command_id: command.id,
            ...updatedCmd.result,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (updatedCmd?.status === "failed") {
          return new Response(JSON.stringify({
            success: false,
            command_id: command.id,
            error: updatedCmd.error_message,
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Timeout - return command ID for polling
      return new Response(JSON.stringify({
        success: true,
        command_id: command.id,
        pending: true,
        message: "Command queued, agent may be offline or slow to respond",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Write operations - return immediately
    return new Response(JSON.stringify({
      success: true,
      command_id: command.id,
      message: `${operation} command queued`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Agent console operations error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
