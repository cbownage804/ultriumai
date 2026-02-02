import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CommandRequest {
  action: string;
  agent_id?: string;
  payload?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body: CommandRequest = await req.json();
    const { action, agent_id, payload } = body;

    switch (action) {
      // ===== FILE TRANSFER =====
      case 'initiate_transfer': {
        if (!agent_id || !payload?.direction || !payload?.file_path) {
          return new Response(JSON.stringify({ error: 'Missing required fields' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Create transfer record
        const { data: transfer, error: transferError } = await supabase
          .from('horizon_file_transfers')
          .insert({
            user_id: user.id,
            agent_id,
            direction: payload.direction,
            file_name: payload.file_name || 'unknown',
            file_path: payload.file_path,
            file_size_bytes: payload.file_size || null,
            status: 'pending'
          })
          .select()
          .single();

        if (transferError) throw transferError;

        // Queue command to agent
        await supabase.from('vanguard_agent_commands').insert({
          agent_id,
          command_type: 'file_transfer',
          payload: {
            transfer_id: transfer.id,
            direction: payload.direction,
            file_path: payload.file_path
          },
          status: 'pending'
        });

        return new Response(JSON.stringify({ success: true, transfer }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // ===== WAKE ON LAN =====
      case 'wake_on_lan': {
        if (!payload?.mac_address) {
          return new Response(JSON.stringify({ error: 'MAC address required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Create WoL request record
        const { data: wolRequest, error: wolError } = await supabase
          .from('horizon_wol_requests')
          .insert({
            user_id: user.id,
            target_mac_address: payload.mac_address,
            target_device_name: payload.device_name || null,
            agent_id: agent_id || null,
            broadcast_address: payload.broadcast_address || '255.255.255.255',
            status: 'pending'
          })
          .select()
          .single();

        if (wolError) throw wolError;

        // If scanner agent specified, send command to it
        if (agent_id) {
          await supabase.from('vanguard_agent_commands').insert({
            agent_id,
            command_type: 'wake_on_lan',
            payload: {
              wol_request_id: wolRequest.id,
              mac_address: payload.mac_address,
              broadcast_address: payload.broadcast_address || '255.255.255.255'
            },
            status: 'pending'
          });
        }

        return new Response(JSON.stringify({ success: true, request: wolRequest }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // ===== VULNERABILITY SCAN =====
      case 'start_vuln_scan': {
        if (!agent_id) {
          return new Response(JSON.stringify({ error: 'Agent ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Create scan record
        const { data: scan, error: scanError } = await supabase
          .from('horizon_vulnerability_scans')
          .insert({
            user_id: user.id,
            agent_id,
            scan_type: payload?.scan_type || 'full',
            status: 'pending',
            started_at: new Date().toISOString()
          })
          .select()
          .single();

        if (scanError) throw scanError;

        // Queue scan command to agent
        await supabase.from('vanguard_agent_commands').insert({
          agent_id,
          command_type: 'vulnerability_scan',
          payload: {
            scan_id: scan.id,
            scan_type: payload?.scan_type || 'full'
          },
          status: 'pending'
        });

        return new Response(JSON.stringify({ success: true, scan }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // ===== THREAT HUNT =====
      case 'start_threat_hunt': {
        if (!payload?.hunt_name) {
          return new Response(JSON.stringify({ error: 'Hunt name required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { data: hunt, error: huntError } = await supabase
          .from('horizon_threat_hunts')
          .insert({
            user_id: user.id,
            hunt_name: payload.hunt_name,
            hunt_type: payload.hunt_type || 'ioc',
            query_parameters: payload.query_parameters || {},
            status: 'running',
            started_at: new Date().toISOString()
          })
          .select()
          .single();

        if (huntError) throw huntError;

        // If targeting specific agents, queue commands
        const targetAgents = payload.agent_ids || [];
        if (targetAgents.length > 0) {
          const commands = targetAgents.map((agId: string) => ({
            agent_id: agId,
            command_type: 'threat_hunt',
            payload: {
              hunt_id: hunt.id,
              hunt_type: payload.hunt_type || 'ioc',
              query_parameters: payload.query_parameters || {}
            },
            status: 'pending'
          }));

          await supabase.from('vanguard_agent_commands').insert(commands);
        }

        return new Response(JSON.stringify({ success: true, hunt }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // ===== SECURITY BASELINE CHECK =====
      case 'run_baseline_check': {
        if (!agent_id || !payload?.baseline_id) {
          return new Response(JSON.stringify({ error: 'Agent and baseline ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Get baseline config
        const { data: baseline } = await supabase
          .from('horizon_security_baselines')
          .select('*')
          .eq('id', payload.baseline_id)
          .single();

        if (!baseline) {
          return new Response(JSON.stringify({ error: 'Baseline not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Queue baseline check command
        await supabase.from('vanguard_agent_commands').insert({
          agent_id,
          command_type: 'security_baseline',
          payload: {
            baseline_id: baseline.id,
            baseline_type: baseline.baseline_type,
            policy_config: baseline.policy_config
          },
          status: 'pending'
        });

        return new Response(JSON.stringify({ success: true, message: 'Baseline check queued' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // ===== EXECUTE PLAYBOOK =====
      case 'execute_playbook': {
        if (!payload?.playbook_id) {
          return new Response(JSON.stringify({ error: 'Playbook ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Get playbook
        const { data: playbook } = await supabase
          .from('horizon_playbooks')
          .select('*')
          .eq('id', payload.playbook_id)
          .single();

        if (!playbook) {
          return new Response(JSON.stringify({ error: 'Playbook not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Create execution record
        const { data: execution, error: execError } = await supabase
          .from('horizon_playbook_executions')
          .insert({
            playbook_id: playbook.id,
            user_id: user.id,
            agent_id: agent_id || null,
            trigger_source: 'api',
            status: 'running'
          })
          .select()
          .single();

        if (execError) throw execError;

        // Update playbook stats
        await supabase
          .from('horizon_playbooks')
          .update({ last_executed_at: new Date().toISOString() })
          .eq('id', playbook.id);

        // Queue commands for each step
        if (agent_id && Array.isArray(playbook.steps)) {
          for (const step of playbook.steps) {
            await supabase.from('vanguard_agent_commands').insert({
              agent_id,
              command_type: 'playbook_step',
              payload: {
                execution_id: execution.id,
                step
              },
              status: 'pending'
            });
          }
        }

        return new Response(JSON.stringify({ success: true, execution }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // ===== LOG ACTIVITY =====
      case 'log_activity': {
        const { error: logError } = await supabase
          .from('horizon_activity_logs')
          .insert({
            user_id: user.id,
            tenant_id: payload?.tenant_id || null,
            action_type: payload?.action_type || 'unknown',
            resource_type: payload?.resource_type || 'unknown',
            resource_id: payload?.resource_id || null,
            resource_name: payload?.resource_name || null,
            details: payload?.details || {}
          });

        if (logError) throw logError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Horizon command error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});