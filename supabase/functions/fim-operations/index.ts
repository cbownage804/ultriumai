import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FIMRequest {
  action: 'scan' | 'rebaseline' | 'add_path' | 'remove_path' | 'acknowledge_event';
  agent_id?: string;
  path?: string;
  paths?: string[];
  event_id?: string;
  baseline_id?: string;
  recursive?: boolean;
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

    const body: FIMRequest = await req.json();
    const { action, agent_id, path, paths, event_id, baseline_id, recursive } = body;

    if (!action) {
      return new Response(JSON.stringify({ error: 'Action required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let result: Record<string, unknown> = {};

    switch (action) {
      case 'scan': {
        if (!agent_id) {
          return new Response(JSON.stringify({ error: 'Agent ID required for scan' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Verify agent belongs to user
        const { data: agent, error: agentError } = await supabase
          .from('vanguard_agents')
          .select('id, hostname')
          .eq('id', agent_id)
          .eq('user_id', user.id)
          .single();

        if (agentError || !agent) {
          return new Response(JSON.stringify({ error: 'Agent not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get all monitored paths for this agent
        const { data: baselines } = await supabase
          .from('fim_baselines')
          .select('id, file_path')
          .eq('agent_id', agent_id)
          .eq('user_id', user.id)
          .eq('is_monitored', true);

        const pathsToScan = paths || baselines?.map(b => b.file_path) || [];

        // Queue FIM scan command to agent
        const { data: command, error: cmdError } = await supabase
          .from('vanguard_agent_commands')
          .insert({
            agent_id,
            user_id: user.id,
            command_type: 'fim_scan',
            command_payload: {
              paths: pathsToScan,
              recursive: recursive ?? true,
              compute_hash: true,
              get_permissions: true,
            },
            status: 'pending',
          })
          .select()
          .single();

        if (cmdError) {
          throw new Error('Failed to queue scan command');
        }

        result = {
          message: 'FIM scan queued',
          command_id: command.id,
          paths_count: pathsToScan.length,
          agent: agent.hostname,
        };
        break;
      }

      case 'rebaseline': {
        if (!baseline_id && !agent_id) {
          return new Response(JSON.stringify({ error: 'Baseline ID or Agent ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (baseline_id) {
          // Rebaseline single file
          const { data: baseline } = await supabase
            .from('fim_baselines')
            .select('*')
            .eq('id', baseline_id)
            .eq('user_id', user.id)
            .single();

          if (!baseline) {
            return new Response(JSON.stringify({ error: 'Baseline not found' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          // Queue rebaseline command
          await supabase.from('vanguard_agent_commands').insert({
            agent_id: baseline.agent_id,
            user_id: user.id,
            command_type: 'fim_rebaseline',
            command_payload: {
              baseline_id,
              path: baseline.file_path,
            },
            status: 'pending',
          });

          result = { message: 'Rebaseline queued', path: baseline.file_path };
        } else {
          // Rebaseline all for agent
          await supabase.from('vanguard_agent_commands').insert({
            agent_id,
            user_id: user.id,
            command_type: 'fim_rebaseline_all',
            command_payload: {},
            status: 'pending',
          });

          result = { message: 'Full rebaseline queued for agent' };
        }
        break;
      }

      case 'add_path': {
        if (!agent_id || !path) {
          return new Response(JSON.stringify({ error: 'Agent ID and path required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check if path already exists
        const { data: existing } = await supabase
          .from('fim_baselines')
          .select('id')
          .eq('agent_id', agent_id)
          .eq('file_path', path)
          .eq('user_id', user.id)
          .single();

        if (existing) {
          return new Response(JSON.stringify({ error: 'Path already monitored' }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Add to database
        const { data: newBaseline, error: insertError } = await supabase
          .from('fim_baselines')
          .insert({
            agent_id,
            user_id: user.id,
            file_path: path,
            file_hash: 'pending',
            is_monitored: true,
            is_directory: path.endsWith('/') || path.endsWith('\\'),
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Queue initial scan for this path
        await supabase.from('vanguard_agent_commands').insert({
          agent_id,
          user_id: user.id,
          command_type: 'fim_scan',
          command_payload: {
            paths: [path],
            recursive: true,
            baseline_id: newBaseline.id,
          },
          status: 'pending',
        });

        result = { message: 'Path added and initial scan queued', baseline: newBaseline };
        break;
      }

      case 'remove_path': {
        if (!baseline_id) {
          return new Response(JSON.stringify({ error: 'Baseline ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error: deleteError } = await supabase
          .from('fim_baselines')
          .delete()
          .eq('id', baseline_id)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;

        result = { message: 'Path removed from monitoring' };
        break;
      }

      case 'acknowledge_event': {
        if (!event_id) {
          return new Response(JSON.stringify({ error: 'Event ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error: updateError } = await supabase
          .from('fim_events')
          .update({
            is_acknowledged: true,
            acknowledged_by: user.id,
            acknowledged_at: new Date().toISOString(),
          })
          .eq('id', event_id)
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        result = { message: 'Event acknowledged' };
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
      activity_type: 'fim_operation',
      resource_type: 'fim',
      resource_id: agent_id || baseline_id || event_id,
      description: `FIM ${action} operation`,
      metadata: { action, agent_id, path, baseline_id, event_id },
    });

    return new Response(JSON.stringify({
      success: true,
      ...result,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fim-operations:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
