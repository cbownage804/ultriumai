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
    const { action, agent_id, case_id, target_details } = body;

    if (!action || !agent_id) {
      return new Response(JSON.stringify({ error: "action and agent_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate action type
    const validActions = ['network_isolate', 'process_kill', 'file_quarantine', 'user_disable', 'service_stop', 'registry_block', 'firewall_block'];
    if (!validActions.includes(action)) {
      return new Response(JSON.stringify({ error: `Invalid action. Valid actions: ${validActions.join(', ')}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify agent belongs to user
    const { data: agent } = await supabase
      .from('vanguard_agents')
      .select('*')
      .eq('id', agent_id)
      .eq('user_id', user.id)
      .single();

    if (!agent) {
      return new Response(JSON.stringify({ error: "Agent not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create containment action record
    const { data: containmentAction, error: actionError } = await supabase
      .from('containment_actions')
      .insert({
        user_id: user.id,
        agent_id,
        case_id: case_id || null,
        action_type: action,
        target_details: target_details || {},
        status: 'pending',
        executed_by: user.id,
        requires_approval: action === 'network_isolate', // Network isolation requires approval
      })
      .select()
      .single();

    if (actionError) throw actionError;

    // Map containment action to agent command
    let commandType = '';
    let commandPayload: any = { containment_action_id: containmentAction.id };

    switch (action) {
      case 'network_isolate':
        commandType = 'network_isolate';
        commandPayload.isolate = true;
        commandPayload.allow_list = target_details?.allow_list || [];
        break;
      case 'process_kill':
        commandType = 'process_kill';
        commandPayload.process_id = target_details?.process_id;
        commandPayload.process_name = target_details?.process_name;
        commandPayload.force = target_details?.force || false;
        break;
      case 'file_quarantine':
        commandType = 'file_quarantine';
        commandPayload.file_path = target_details?.file_path;
        commandPayload.delete_after_quarantine = target_details?.delete || false;
        break;
      case 'service_stop':
        commandType = 'service_stop';
        commandPayload.service_name = target_details?.service_name;
        commandPayload.disable = target_details?.disable || false;
        break;
      case 'firewall_block':
        commandType = 'firewall_block';
        commandPayload.ip_address = target_details?.ip_address;
        commandPayload.port = target_details?.port;
        commandPayload.direction = target_details?.direction || 'both';
        break;
      default:
        commandType = action;
    }

    // Send command to agent
    const { data: agentCmd, error: cmdError } = await supabase
      .from('vanguard_agent_commands')
      .insert({
        agent_id,
        user_id: user.id,
        command_type: commandType,
        payload: commandPayload,
        status: 'pending',
      })
      .select()
      .single();

    if (cmdError) throw cmdError;

    // Update containment action status
    await supabase
      .from('containment_actions')
      .update({ status: 'executing' })
      .eq('id', containmentAction.id);

    // Log to MDR case if provided
    if (case_id) {
      await supabase.from('mdr_case_activities').insert({
        case_id,
        user_id: user.id,
        activity_type: 'action_taken',
        description: `Containment action initiated: ${action} on ${agent.hostname}`,
        new_value: { action, target_details, command_id: agentCmd.id },
      });
    }

    console.log(`Containment action ${action} initiated on agent ${agent.hostname}`);

    return new Response(JSON.stringify({
      containment_action: containmentAction,
      command_id: agentCmd.id,
      status: 'executing',
      message: `${action} command sent to ${agent.hostname}`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Containment action error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
