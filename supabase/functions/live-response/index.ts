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

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "execute";
    const body = await req.json();

    switch (action) {
      case "start_session": {
        // Create a new live response session
        const { agent_id, session_type, case_id } = body;
        
        if (!agent_id) {
          return new Response(JSON.stringify({ error: "agent_id required" }), {
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

        // Create session
        const { data: session, error: sessionError } = await supabase
          .from('live_response_sessions')
          .insert({
            user_id: user.id,
            agent_id,
            session_type: session_type || 'shell',
            case_id: case_id || null,
            status: 'active',
          })
          .select()
          .single();

        if (sessionError) throw sessionError;

        console.log(`Started live response session ${session.id} for agent ${agent_id}`);

        return new Response(JSON.stringify({ session }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "execute": {
        // Execute a command in a live response session
        const { session_id, command } = body;

        if (!session_id || !command) {
          return new Response(JSON.stringify({ error: "session_id and command required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Verify session belongs to user and is active
        const { data: session } = await supabase
          .from('live_response_sessions')
          .select('*, vanguard_agents(*)')
          .eq('id', session_id)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (!session) {
          return new Response(JSON.stringify({ error: "Session not found or inactive" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Check for dangerous commands
        const dangerousPatterns = [
          /rm\s+-rf\s+\//i,
          /format\s+c:/i,
          /del\s+\/s\s+\/q/i,
          /shutdown/i,
          /reboot/i,
          /halt/i,
        ];
        const isDangerous = dangerousPatterns.some(p => p.test(command));

        // Send command to agent via command queue
        const { data: agentCmd, error: cmdError } = await supabase
          .from('vanguard_agent_commands')
          .insert({
            agent_id: session.agent_id,
            user_id: user.id,
            command_type: 'live_response',
            payload: {
              session_id,
              command,
              is_dangerous: isDangerous,
            },
            status: 'pending',
          })
          .select()
          .single();

        if (cmdError) throw cmdError;

        // Log the command
        const { data: cmdLog } = await supabase
          .from('live_response_commands')
          .insert({
            session_id,
            command,
            is_dangerous: isDangerous,
          })
          .select()
          .single();

        // Update session activity
        await supabase
          .from('live_response_sessions')
          .update({
            last_activity_at: new Date().toISOString(),
            commands_executed: session.commands_executed + 1,
          })
          .eq('id', session_id);

        console.log(`Executed command in session ${session_id}: ${command.substring(0, 50)}...`);

        return new Response(JSON.stringify({
          command_id: agentCmd.id,
          command_log_id: cmdLog?.id,
          is_dangerous: isDangerous,
          status: 'pending',
          message: 'Command queued for execution',
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "end_session": {
        const { session_id } = body;

        const { error } = await supabase
          .from('live_response_sessions')
          .update({
            status: 'terminated',
            ended_at: new Date().toISOString(),
          })
          .eq('id', session_id)
          .eq('user_id', user.id);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_history": {
        const { session_id } = body;

        const { data: commands } = await supabase
          .from('live_response_commands')
          .select('*')
          .eq('session_id', session_id)
          .order('executed_at', { ascending: true });

        return new Response(JSON.stringify({ commands }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("Live response error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
