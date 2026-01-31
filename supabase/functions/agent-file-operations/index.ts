import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FileOperationRequest {
  agent_id: string;
  operation: 'list_directory' | 'download' | 'upload' | 'delete' | 'create_directory';
  path: string;
  file_data?: string; // base64 for upload
  file_name?: string;
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

    const body: FileOperationRequest = await req.json();
    const { agent_id, operation, path, file_data, file_name } = body;

    if (!agent_id || !operation || !path) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify agent belongs to user
    const { data: agent, error: agentError } = await supabase
      .from('vanguard_agents')
      .select('id, status, hostname')
      .eq('id', agent_id)
      .eq('user_id', user.id)
      .single();

    if (agentError || !agent) {
      return new Response(JSON.stringify({ error: 'Agent not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create command for agent to execute
    let commandType: string;
    let commandPayload: Record<string, unknown> = { path };

    switch (operation) {
      case 'list_directory':
        commandType = 'list_directory';
        break;
      case 'download':
        commandType = 'download_file';
        break;
      case 'upload':
        commandType = 'upload_file';
        commandPayload = { 
          path, 
          file_name: file_name || 'uploaded_file',
          file_data: file_data 
        };
        break;
      case 'delete':
        commandType = 'delete_file';
        break;
      case 'create_directory':
        commandType = 'create_directory';
        break;
      default:
        return new Response(JSON.stringify({ error: 'Invalid operation' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Queue command to agent
    const { data: command, error: cmdError } = await supabase
      .from('vanguard_agent_commands')
      .insert({
        agent_id,
        user_id: user.id,
        command_type: commandType,
        command_payload: commandPayload,
        status: 'pending',
      })
      .select()
      .single();

    if (cmdError) {
      console.error('Failed to create command:', cmdError);
      return new Response(JSON.stringify({ error: 'Failed to queue command' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log the file operation
    await supabase.from('vanguard_activity_logs').insert({
      user_id: user.id,
      activity_type: 'file_operation',
      resource_type: 'agent',
      resource_id: agent_id,
      description: `${operation} at ${path} on ${agent.hostname}`,
      metadata: { operation, path, command_id: command.id },
    });

    return new Response(JSON.stringify({
      success: true,
      command_id: command.id,
      message: `${operation} command queued for agent`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in agent-file-operations:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
