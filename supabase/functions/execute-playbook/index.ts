import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlaybookRequest {
  action: 'execute' | 'create' | 'update' | 'delete' | 'list';
  playbook_id?: string;
  playbook_data?: {
    name: string;
    description?: string;
    threat_type: string;
    severity: string;
    steps: Array<{
      action: string;
      description: string;
      automated: boolean;
      timeout?: number;
      command_type?: string;
      command_payload?: Record<string, unknown>;
    }>;
  };
  target_agents?: string[];
  incident_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: PlaybookRequest = await req.json();
    const { action, playbook_id, playbook_data, target_agents, incident_id } = body;

    let result: Record<string, unknown> = {};

    switch (action) {
      case 'list': {
        const { data: playbooks, error } = await supabase
          .from('incident_playbooks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        result = { playbooks };
        break;
      }

      case 'execute': {
        if (!playbook_id) {
          return new Response(JSON.stringify({ error: 'Playbook ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get playbook
        const { data: playbook, error: pbError } = await supabase
          .from('incident_playbooks')
          .select('*')
          .eq('id', playbook_id)
          .single();

        if (pbError || !playbook) {
          return new Response(JSON.stringify({ error: 'Playbook not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const steps = playbook.steps as Array<{
          action: string;
          automated: boolean;
          command_type?: string;
          command_payload?: Record<string, unknown>;
        }>;

        // Get target agents (use provided or get all online)
        let agentIds = target_agents || [];
        if (agentIds.length === 0) {
          const { data: onlineAgents } = await supabase
            .from('vanguard_agents')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'online')
            .limit(10);
          agentIds = onlineAgents?.map(a => a.id) || [];
        }

        // Create execution record
        const { data: execution, error: execError } = await supabase
          .from('playbook_executions')
          .insert({
            playbook_id,
            user_id: user.id,
            status: 'running',
            started_at: new Date().toISOString(),
            target_agents: agentIds,
            incident_id,
          })
          .select()
          .single();

        if (execError) throw execError;

        // Queue automated steps as agent commands
        const automatedSteps = steps.filter(s => s.automated);
        const commands = [];

        for (const step of automatedSteps) {
          if (step.command_type && agentIds.length > 0) {
            for (const agentId of agentIds) {
              commands.push({
                agent_id: agentId,
                user_id: user.id,
                command_type: step.command_type,
                command_payload: {
                  ...step.command_payload,
                  playbook_execution_id: execution.id,
                  step_action: step.action,
                },
                status: 'pending',
              });
            }
          }
        }

        if (commands.length > 0) {
          await supabase.from('vanguard_agent_commands').insert(commands);
        }

        // Update playbook usage stats
        await supabase
          .from('incident_playbooks')
          .update({
            times_executed: (playbook.times_executed || 0) + 1,
            last_executed_at: new Date().toISOString(),
          })
          .eq('id', playbook_id);

        result = {
          execution_id: execution.id,
          playbook_name: playbook.name,
          total_steps: steps.length,
          automated_steps: automatedSteps.length,
          target_agents: agentIds.length,
          commands_queued: commands.length,
        };
        break;
      }

      case 'create': {
        if (!playbook_data) {
          return new Response(JSON.stringify({ error: 'Playbook data required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: newPlaybook, error: createError } = await supabase
          .from('incident_playbooks')
          .insert({
            user_id: user.id,
            name: playbook_data.name,
            description: playbook_data.description,
            threat_type: playbook_data.threat_type,
            severity: playbook_data.severity,
            steps: playbook_data.steps,
            times_executed: 0,
          })
          .select()
          .single();

        if (createError) throw createError;
        result = { playbook: newPlaybook };
        break;
      }

      case 'update': {
        if (!playbook_id || !playbook_data) {
          return new Response(JSON.stringify({ error: 'Playbook ID and data required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error: updateError } = await supabase
          .from('incident_playbooks')
          .update({
            name: playbook_data.name,
            description: playbook_data.description,
            threat_type: playbook_data.threat_type,
            severity: playbook_data.severity,
            steps: playbook_data.steps,
          })
          .eq('id', playbook_id)
          .eq('user_id', user.id);

        if (updateError) throw updateError;
        result = { message: 'Playbook updated' };
        break;
      }

      case 'delete': {
        if (!playbook_id) {
          return new Response(JSON.stringify({ error: 'Playbook ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error: deleteError } = await supabase
          .from('incident_playbooks')
          .delete()
          .eq('id', playbook_id)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;
        result = { message: 'Playbook deleted' };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Log activity
    await supabase.from('vanguard_activity_logs').insert({
      user_id: user.id,
      activity_type: 'playbook_operation',
      resource_type: 'playbook',
      resource_id: playbook_id,
      description: `Playbook ${action}`,
      metadata: { action, playbook_id },
    });

    return new Response(JSON.stringify({
      success: true,
      ...result,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in execute-playbook:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
