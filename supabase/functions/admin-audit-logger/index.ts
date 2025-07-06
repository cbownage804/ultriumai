import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AuditLogEntry {
  admin_user_id: string;
  admin_email: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  resource_name?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  metadata?: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      admin_user_id,
      admin_email,
      action,
      resource_type,
      resource_id,
      resource_name,
      old_values,
      new_values,
      metadata = {}
    }: AuditLogEntry = await req.json();

    // Get IP and User Agent from request headers
    const ip_address = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    const user_agent = req.headers.get('user-agent') || 'unknown';

    console.log(`Audit Log: ${admin_email} performed ${action} on ${resource_type}`, {
      resource_id,
      resource_name,
      ip_address,
      metadata
    });

    // Insert audit log entry
    const { error } = await supabase
      .from('admin_audit_trails')
      .insert({
        admin_user_id,
        admin_email,
        action,
        resource_type,
        resource_id,
        resource_name,
        old_values,
        new_values,
        ip_address,
        user_agent,
        metadata
      });

    if (error) {
      console.error('Failed to log audit entry:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Audit entry logged successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Audit logger error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to log audit entry',
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});