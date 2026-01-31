import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[RUN-COMPLIANCE-SCAN] ${step}${detailsStr}`);
};

interface ScanRequest {
  agentId: string;
  frameworks: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const body: ScanRequest = await req.json();
    logStep("Request body", { agentId: body.agentId, frameworks: body.frameworks });

    if (!body.agentId) throw new Error("Agent ID is required");
    if (!body.frameworks || body.frameworks.length === 0) throw new Error("At least one framework is required");

    // Verify agent exists and belongs to user
    const { data: agent, error: agentError } = await supabaseClient
      .from('vanguard_agents')
      .select('id, name, os_type')
      .eq('id', body.agentId)
      .eq('user_id', user.id)
      .single();

    if (agentError || !agent) throw new Error("Agent not found or access denied");
    logStep("Agent verified", { agentName: agent.name, os: agent.os_type });

    const jobIds: string[] = [];

    for (const framework of body.frameworks) {
      // Create scan job record
      const { data: job, error: jobError } = await supabaseClient
        .from('compliance_scan_jobs')
        .insert({
          user_id: user.id,
          agent_id: body.agentId,
          framework_type: framework,
          scan_status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (jobError) throw jobError;
      jobIds.push(job.id);

      // Queue command to agent
      const { error: cmdError } = await supabaseClient
        .from('vanguard_agent_commands')
        .insert({
          agent_id: body.agentId,
          user_id: user.id,
          command_type: 'compliance_scan',
          payload: {
            framework: framework,
            job_id: job.id,
            os_type: agent.os_type
          },
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (cmdError) {
        console.error('Failed to queue command:', cmdError);
      }

      logStep("Queued scan command", { framework, jobId: job.id });
    }

    // Update jobs to running status
    await supabaseClient
      .from('compliance_scan_jobs')
      .update({ 
        scan_status: 'running',
        started_at: new Date().toISOString()
      })
      .in('id', jobIds);

    return new Response(JSON.stringify({
      success: true,
      jobIds,
      message: `Started ${body.frameworks.length} compliance scan(s)`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
