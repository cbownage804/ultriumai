import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MonitorDeviceRequest {
  agent_id: string;
  action: 'add' | 'remove' | 'check' | 'list';
  device?: {
    name: string;
    type: 'snmp' | 'tcp' | 'http' | 'generic';
    ip_address: string;
    port?: number;
    community_string?: string; // for SNMP
    url_path?: string; // for HTTP
  };
  device_id?: string;
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

    const body: MonitorDeviceRequest = await req.json();
    const { agent_id, action, device, device_id } = body;

    if (!agent_id || !action) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify agent belongs to user
    const { data: agent, error: agentError } = await supabase
      .from('vanguard_agents')
      .select('id, hostname, metadata')
      .eq('id', agent_id)
      .eq('user_id', user.id)
      .single();

    if (agentError || !agent) {
      return new Response(JSON.stringify({ error: 'Agent not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const metadata = (agent.metadata as Record<string, unknown>) || {};
    const monitoredDevices = (metadata.monitored_devices as unknown[]) || [];

    let result: unknown;

    switch (action) {
      case 'list':
        return new Response(JSON.stringify({
          success: true,
          devices: monitoredDevices,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'add':
        if (!device) {
          return new Response(JSON.stringify({ error: 'Device data required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const newDevice = {
          id: crypto.randomUUID(),
          ...device,
          status: 'pending',
          last_check: null,
          created_at: new Date().toISOString(),
          created_by: user.id,
        };

        // Queue monitor command to agent
        await supabase.from('vanguard_agent_commands').insert({
          agent_id,
          user_id: user.id,
          command_type: 'add_monitor',
          command_payload: {
            device_id: newDevice.id,
            monitor_type: device.type,
            target: device.ip_address,
            port: device.port,
            community_string: device.community_string,
            url_path: device.url_path,
          },
          status: 'pending',
        });

        // Save to metadata
        const updatedDevices = [...monitoredDevices, newDevice];
        await supabase
          .from('vanguard_agents')
          .update({ 
            metadata: { ...metadata, monitored_devices: updatedDevices } 
          })
          .eq('id', agent_id);

        result = newDevice;
        break;

      case 'remove':
        if (!device_id) {
          return new Response(JSON.stringify({ error: 'Device ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Queue remove monitor command
        await supabase.from('vanguard_agent_commands').insert({
          agent_id,
          user_id: user.id,
          command_type: 'remove_monitor',
          command_payload: { device_id },
          status: 'pending',
        });

        const filteredDevices = monitoredDevices.filter((d: unknown) => 
          (d as Record<string, unknown>).id !== device_id
        );
        
        await supabase
          .from('vanguard_agents')
          .update({ 
            metadata: { ...metadata, monitored_devices: filteredDevices } 
          })
          .eq('id', agent_id);

        result = { deleted: device_id };
        break;

      case 'check':
        if (!device_id) {
          return new Response(JSON.stringify({ error: 'Device ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Queue immediate check command
        await supabase.from('vanguard_agent_commands').insert({
          agent_id,
          user_id: user.id,
          command_type: 'check_monitor',
          command_payload: { device_id },
          status: 'pending',
        });

        result = { queued: device_id };
        break;

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Log activity
    await supabase.from('vanguard_activity_logs').insert({
      user_id: user.id,
      activity_type: 'monitored_device',
      resource_type: 'agent',
      resource_id: agent_id,
      description: `${action} monitored device on ${agent.hostname}`,
      metadata: { action, device_id: device_id || (result as Record<string, unknown>)?.id },
    });

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in monitor-device:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
