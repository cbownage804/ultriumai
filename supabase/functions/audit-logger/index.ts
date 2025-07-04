import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AUDIT-LOGGER] ${step}${detailsStr}`);
};

const getClientInfo = (req: Request) => {
  const userAgent = req.headers.get('user-agent') || '';
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  
  // Try to get the most accurate IP address
  const ipAddress = cfConnectingIp || realIp || forwarded?.split(',')[0] || 'unknown';
  
  return { userAgent, ipAddress };
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error('Invalid or expired token');
    }

    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    // Parse request body
    const { action, resource_type, resource_id, details } = await req.json();
    
    if (!action) {
      throw new Error('Action is required');
    }

    // Get client information
    const { userAgent, ipAddress } = getClientInfo(req);

    // Insert audit log
    const { error: insertError } = await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action,
        resource_type: resource_type || null,
        resource_id: resource_id || null,
        ip_address: ipAddress !== 'unknown' ? ipAddress : null,
        user_agent: userAgent,
        details: details || {}
      });

    if (insertError) {
      throw insertError;
    }

    logStep("Audit log created", { action, resourceType: resource_type, userId: user.id });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    logStep("ERROR in audit-logger", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);