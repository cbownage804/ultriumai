import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PSASyncRequest {
  action: 'sync_tickets' | 'sync_clients' | 'sync_devices' | 'test_connection' | 'get_config';
  psa_type: 'connectwise' | 'autotask' | 'halo';
  credentials?: {
    api_url?: string;
    company_id?: string;
    public_key?: string;
    private_key?: string;
    client_id?: string;
  };
  sync_options?: {
    direction: 'import' | 'export' | 'bidirectional';
    entity_types: string[];
    since?: string;
  };
}

serve(async (req) => {
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

    const body: PSASyncRequest = await req.json();
    const { action, psa_type, credentials, sync_options } = body;

    switch (action) {
      case 'test_connection': {
        if (!credentials) {
          return new Response(JSON.stringify({ error: 'Credentials required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const result = await testPSAConnection(psa_type, credentials);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_config': {
        // Get stored PSA configuration for user
        const { data: config } = await supabase
          .from('psa_integrations')
          .select('*')
          .eq('user_id', user.id)
          .eq('psa_type', psa_type)
          .maybeSingle();

        return new Response(JSON.stringify({ 
          configured: !!config,
          psa_type,
          api_url: config?.api_url,
          last_sync: config?.last_sync_at,
          sync_status: config?.sync_status
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'sync_tickets': {
        // Get PSA config
        const { data: config } = await supabase
          .from('psa_integrations')
          .select('*')
          .eq('user_id', user.id)
          .eq('psa_type', psa_type)
          .single();

        if (!config) {
          return new Response(JSON.stringify({ error: 'PSA not configured' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Perform sync based on PSA type
        const syncResult = await syncTickets(psa_type, config, user.id, sync_options, supabase);
        
        // Update last sync time
        await supabase
          .from('psa_integrations')
          .update({ 
            last_sync_at: new Date().toISOString(),
            sync_status: syncResult.success ? 'success' : 'error'
          })
          .eq('id', config.id);

        return new Response(JSON.stringify(syncResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'sync_clients': {
        const { data: config } = await supabase
          .from('psa_integrations')
          .select('*')
          .eq('user_id', user.id)
          .eq('psa_type', psa_type)
          .single();

        if (!config) {
          return new Response(JSON.stringify({ error: 'PSA not configured' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const syncResult = await syncClients(psa_type, config, user.id, supabase);
        
        return new Response(JSON.stringify(syncResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'sync_devices': {
        const { data: config } = await supabase
          .from('psa_integrations')
          .select('*')
          .eq('user_id', user.id)
          .eq('psa_type', psa_type)
          .single();

        if (!config) {
          return new Response(JSON.stringify({ error: 'PSA not configured' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const syncResult = await syncDevices(psa_type, config, user.id, supabase);
        
        return new Response(JSON.stringify(syncResult), {
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
    console.error('PSA sync error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Sync failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Test PSA connection
async function testPSAConnection(
  psaType: string, 
  credentials: PSASyncRequest['credentials']
): Promise<{ success: boolean; message: string; company_name?: string }> {
  try {
    if (psaType === 'connectwise') {
      // ConnectWise Manage API test
      const authString = `${credentials?.company_id}+${credentials?.public_key}:${credentials?.private_key}`;
      const authHeader = `Basic ${btoa(authString)}`;
      
      const response = await fetch(`${credentials?.api_url}/v4_6_release/apis/3.0/system/info`, {
        headers: {
          'Authorization': authHeader,
          'clientId': credentials?.client_id || '',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return { 
          success: true, 
          message: 'Connection successful',
          company_name: data.companyName 
        };
      } else {
        return { success: false, message: `Connection failed: ${response.statusText}` };
      }
    }

    if (psaType === 'autotask') {
      // Autotask API test - placeholder
      return { 
        success: true, 
        message: 'Autotask integration configured (API test pending)' 
      };
    }

    if (psaType === 'halo') {
      // HaloPSA API test - placeholder
      return { 
        success: true, 
        message: 'HaloPSA integration configured (API test pending)' 
      };
    }

    return { success: false, message: 'Unsupported PSA type' };
  } catch (error) {
    return { success: false, message: error.message || 'Connection test failed' };
  }
}

// Sync tickets from PSA
async function syncTickets(
  psaType: string,
  config: any,
  userId: string,
  options: PSASyncRequest['sync_options'],
  supabase: any
): Promise<{ success: boolean; imported: number; exported: number; errors: string[] }> {
  const result = { success: true, imported: 0, exported: 0, errors: [] as string[] };
  
  try {
    if (psaType === 'connectwise') {
      // Fetch tickets from ConnectWise
      const authString = `${config.company_id}+${config.public_key}:${config.private_key}`;
      const authHeader = `Basic ${btoa(authString)}`;
      
      const sinceDate = options?.since || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const response = await fetch(
        `${config.api_url}/v4_6_release/apis/3.0/service/tickets?conditions=lastUpdated > [${sinceDate}]&pageSize=100`,
        {
          headers: {
            'Authorization': authHeader,
            'clientId': config.client_id || '',
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const tickets = await response.json();
        
        // Map and import tickets
        for (const ticket of tickets) {
          const { error } = await supabase.from('tickets').upsert({
            user_id: userId,
            external_id: `cw_${ticket.id}`,
            title: ticket.summary,
            description: ticket.initialDescription,
            status: mapCWStatus(ticket.status?.name),
            priority: mapCWPriority(ticket.priority?.name),
            source: 'connectwise',
            external_data: ticket,
            updated_at: new Date().toISOString()
          }, { onConflict: 'external_id' });

          if (error) {
            result.errors.push(`Failed to import ticket ${ticket.id}: ${error.message}`);
          } else {
            result.imported++;
          }
        }
      }
    }

    // Similar logic for Autotask and HaloPSA...
    
    return result;
  } catch (error) {
    result.success = false;
    result.errors.push(error.message);
    return result;
  }
}

// Sync clients from PSA
async function syncClients(
  psaType: string,
  config: any,
  userId: string,
  supabase: any
): Promise<{ success: boolean; imported: number; errors: string[] }> {
  // Placeholder - implement actual PSA client sync
  return { success: true, imported: 0, errors: [] };
}

// Sync devices from PSA
async function syncDevices(
  psaType: string,
  config: any,
  userId: string,
  supabase: any
): Promise<{ success: boolean; imported: number; errors: string[] }> {
  // Placeholder - implement actual PSA device sync
  return { success: true, imported: 0, errors: [] };
}

// Helper functions to map ConnectWise statuses/priorities
function mapCWStatus(cwStatus: string): string {
  const statusMap: Record<string, string> = {
    'New': 'open',
    'In Progress': 'in_progress',
    'Waiting': 'pending',
    'Closed': 'closed',
    'Resolved': 'resolved'
  };
  return statusMap[cwStatus] || 'open';
}

function mapCWPriority(cwPriority: string): string {
  const priorityMap: Record<string, string> = {
    'Priority 1': 'critical',
    'Priority 2': 'high',
    'Priority 3': 'medium',
    'Priority 4': 'low'
  };
  return priorityMap[cwPriority] || 'medium';
}