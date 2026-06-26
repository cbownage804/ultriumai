import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AuditLogEntry {
  action: string;
  resource_type: string;
  resource_id?: string;
  resource_name?: string;
  old_values?: any;
  new_values?: any;
  metadata?: any;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Require valid bearer token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Look up profile/email; require @ultriumai.com admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userData.user.id)
      .single();

    const adminEmail = profile?.email || userData.user.email || '';
    if (!adminEmail.endsWith('@ultriumai.com')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: AuditLogEntry = await req.json();
    const { action, resource_type, resource_id, resource_name, old_values, new_values, metadata = {} } = body;

    if (!action || !resource_type) {
      return new Response(JSON.stringify({ error: 'action and resource_type are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ip_address = req.headers.get('x-forwarded-for') ||
                       req.headers.get('x-real-ip') ||
                       'unknown';
    const user_agent = req.headers.get('user-agent') || 'unknown';

    const { error } = await supabase
      .from('admin_audit_trails')
      .insert({
        admin_user_id: userData.user.id,
        admin_email: adminEmail,
        action,
        resource_type,
        resource_id,
        resource_name,
        old_values,
        new_values,
        ip_address,
        user_agent,
        metadata,
      });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Audit logger error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to log audit entry' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
