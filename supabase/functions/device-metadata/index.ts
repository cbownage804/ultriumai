import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeviceMetadataRequest {
  agent_id: string;
  action: 'add' | 'update' | 'delete' | 'list';
  metadata_type: 'password' | 'custom_field' | 'attachment' | 'monitored_device';
  data?: Record<string, unknown>;
  metadata_id?: string;
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

    const body: DeviceMetadataRequest = await req.json();
    const { agent_id, action, metadata_type, data, metadata_id } = body;

    if (!agent_id || !action || !metadata_type) {
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

    // Get existing metadata or initialize
    const existingMetadata = (agent.metadata as Record<string, unknown>) || {};
    const metadataSection = (existingMetadata[metadata_type] as unknown[]) || [];

    let result: unknown;
    let updatedSection: unknown[];

    switch (action) {
      case 'list':
        return new Response(JSON.stringify({
          success: true,
          data: metadataSection,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'add':
        if (!data) {
          return new Response(JSON.stringify({ error: 'Data required for add action' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const newItem = {
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          created_by: user.id,
          ...data,
        };

        // Encrypt password if adding a password entry
        if (metadata_type === 'password' && data.password) {
          // In production, use proper encryption
          newItem.password_encrypted = btoa(String(data.password));
          delete (newItem as Record<string, unknown>).password;
        }

        updatedSection = [...metadataSection, newItem];
        result = newItem;
        break;

      case 'update':
        if (!metadata_id || !data) {
          return new Response(JSON.stringify({ error: 'ID and data required for update' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        updatedSection = metadataSection.map((item: unknown) => {
          const typedItem = item as Record<string, unknown>;
          if (typedItem.id === metadata_id) {
            const updated = { 
              ...typedItem, 
              ...data, 
              updated_at: new Date().toISOString(),
              updated_by: user.id,
            };
            result = updated;
            return updated;
          }
          return item;
        });
        
        if (!result) {
          return new Response(JSON.stringify({ error: 'Item not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        break;

      case 'delete':
        if (!metadata_id) {
          return new Response(JSON.stringify({ error: 'ID required for delete' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const beforeCount = metadataSection.length;
        updatedSection = metadataSection.filter((item: unknown) => {
          return (item as Record<string, unknown>).id !== metadata_id;
        });
        
        if (updatedSection.length === beforeCount) {
          return new Response(JSON.stringify({ error: 'Item not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        result = { deleted: metadata_id };
        break;

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Update agent metadata
    const updatedMetadata = {
      ...existingMetadata,
      [metadata_type]: updatedSection,
    };

    const { error: updateError } = await supabase
      .from('vanguard_agents')
      .update({ metadata: updatedMetadata })
      .eq('id', agent_id);

    if (updateError) {
      console.error('Failed to update metadata:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to save metadata' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log activity
    await supabase.from('vanguard_activity_logs').insert({
      user_id: user.id,
      activity_type: 'device_metadata',
      resource_type: 'agent',
      resource_id: agent_id,
      description: `${action} ${metadata_type} on ${agent.hostname}`,
      metadata: { action, metadata_type, item_id: metadata_id || (result as Record<string, unknown>)?.id },
    });

    return new Response(JSON.stringify({
      success: true,
      action,
      metadata_type,
      data: result,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in device-metadata:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
