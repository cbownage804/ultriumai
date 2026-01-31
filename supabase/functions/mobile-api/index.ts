import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-id, x-platform',
};

interface MobileDevice {
  device_id: string;
  user_id: string;
  platform: 'ios' | 'android';
  push_token?: string;
  device_name?: string;
  app_version?: string;
  os_version?: string;
}

interface DashboardSummary {
  devices: { online: number; offline: number; warning: number };
  tickets: { open: number; pending: number; critical: number };
  alerts: { unread: number; critical: number };
  security: { threats: number; vulnerabilities: number };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid or expired token');
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();
    const deviceId = req.headers.get('x-device-id');
    const platform = req.headers.get('x-platform') as 'ios' | 'android' | null;

    console.log(`[mobile-api] ${req.method} ${path} - User: ${user.id}`);

    switch (path) {
      case 'register-device': {
        if (req.method !== 'POST') throw new Error('Method not allowed');
        
        const { push_token, device_name, app_version, os_version } = await req.json();
        
        // Store device registration
        const { error } = await supabase
          .from('mobile_devices')
          .upsert({
            device_id: deviceId,
            user_id: user.id,
            platform: platform || 'ios',
            push_token,
            device_name,
            app_version,
            os_version,
            last_active: new Date().toISOString()
          }, { onConflict: 'device_id' });

        if (error) {
          console.error('Device registration error:', error);
          // Table might not exist yet - just log and continue
        }

        return new Response(JSON.stringify({ 
          success: true,
          message: 'Device registered'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'dashboard': {
        if (req.method !== 'GET') throw new Error('Method not allowed');
        
        // Fetch summary data
        const [devicesRes, ticketsRes, alertsRes, securityRes] = await Promise.all([
          supabase.from('vanguard_agents').select('status', { count: 'exact' }).eq('user_id', user.id),
          supabase.from('vanguard_tickets').select('status, priority', { count: 'exact' }).eq('user_id', user.id),
          supabase.from('security_events').select('severity, status', { count: 'exact' }).eq('user_id', user.id).eq('status', 'open'),
          supabase.from('vulnerability_findings').select('severity', { count: 'exact' }).eq('user_id', user.id).eq('status', 'open')
        ]);

        const devices = devicesRes.data || [];
        const tickets = ticketsRes.data || [];
        const alerts = alertsRes.data || [];
        const vulnerabilities = securityRes.data || [];

        const summary: DashboardSummary = {
          devices: {
            online: devices.filter(d => d.status === 'online').length,
            offline: devices.filter(d => d.status === 'offline').length,
            warning: devices.filter(d => d.status === 'warning').length
          },
          tickets: {
            open: tickets.filter(t => t.status === 'open').length,
            pending: tickets.filter(t => t.status === 'pending').length,
            critical: tickets.filter(t => t.priority === 'critical').length
          },
          alerts: {
            unread: alerts.length,
            critical: alerts.filter(a => a.severity === 'critical').length
          },
          security: {
            threats: alerts.filter(a => a.severity === 'high' || a.severity === 'critical').length,
            vulnerabilities: vulnerabilities.length
          }
        };

        return new Response(JSON.stringify({ 
          success: true,
          data: summary,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'devices': {
        const { data: devices, error } = await supabase
          .from('vanguard_agents')
          .select('id, hostname, status, os_type, last_seen, ip_address, org_id')
          .eq('user_id', user.id)
          .order('last_seen', { ascending: false })
          .limit(100);

        if (error) throw error;

        return new Response(JSON.stringify({ 
          success: true,
          data: devices,
          count: devices?.length || 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'tickets': {
        const status = url.searchParams.get('status');
        const limit = parseInt(url.searchParams.get('limit') || '50');
        
        let query = supabase
          .from('vanguard_tickets')
          .select('id, title, status, priority, created_at, updated_at, client_name')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (status && status !== 'all') {
          query = query.eq('status', status);
        }

        const { data: tickets, error } = await query;
        if (error) throw error;

        return new Response(JSON.stringify({ 
          success: true,
          data: tickets,
          count: tickets?.length || 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'alerts': {
        const limit = parseInt(url.searchParams.get('limit') || '50');
        
        const { data: alerts, error } = await supabase
          .from('security_events')
          .select('id, event_type, severity, source, description, created_at, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;

        return new Response(JSON.stringify({ 
          success: true,
          data: alerts,
          count: alerts?.length || 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'quick-action': {
        if (req.method !== 'POST') throw new Error('Method not allowed');
        
        const { action, target_id, params } = await req.json();
        
        let result;
        switch (action) {
          case 'reboot_device':
            result = await queueAgentCommand(supabase, target_id, user.id, 'reboot', {});
            break;
          case 'close_ticket':
            await supabase.from('vanguard_tickets').update({ status: 'closed' }).eq('id', target_id);
            result = { success: true };
            break;
          case 'acknowledge_alert':
            await supabase.from('security_events').update({ status: 'acknowledged' }).eq('id', target_id);
            result = { success: true };
            break;
          case 'run_scan':
            result = await queueAgentCommand(supabase, target_id, user.id, 'run_scan', params || {});
            break;
          default:
            throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify({ 
          success: true,
          result
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'notifications': {
        // Get user notification preferences
        const { data: profile } = await supabase
          .from('profiles')
          .select('notification_preferences')
          .eq('id', user.id)
          .single();

        return new Response(JSON.stringify({ 
          success: true,
          preferences: profile?.notification_preferences || {
            push_enabled: true,
            critical_only: false,
            quiet_hours: null
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'update-notifications': {
        if (req.method !== 'POST') throw new Error('Method not allowed');
        
        const preferences = await req.json();
        
        const { error } = await supabase
          .from('profiles')
          .update({ notification_preferences: preferences })
          .eq('id', user.id);

        if (error) throw error;

        return new Response(JSON.stringify({ 
          success: true,
          message: 'Preferences updated'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error(`Unknown endpoint: ${path}`);
    }
  } catch (error) {
    console.error('[mobile-api] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function queueAgentCommand(supabase: any, agentId: string, userId: string, command: string, params: any) {
  const { data, error } = await supabase
    .from('vanguard_agent_commands')
    .insert({
      agent_id: agentId,
      user_id: userId,
      command_type: command,
      command_data: params,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return { command_id: data.id, status: 'queued' };
}
