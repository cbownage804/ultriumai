import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[WEBHOOK-DELIVERY] ${step}${detailsStr}`);
};

const generateSignature = (payload: string, secret: string): string => {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);
  
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  ).then(key => 
    crypto.subtle.sign('HMAC', key, messageData)
  ).then(signature => 
    'sha256=' + Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  );
};

const deliverWebhook = async (webhook: any, payload: any, supabase: any) => {
  const startTime = Date.now();
  let status = 'failed';
  let statusCode = 0;
  let errorMessage = '';

  try {
    const payloadString = JSON.stringify(payload);
    const signature = webhook.secret ? await generateSignature(payloadString, webhook.secret) : null;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'User-Agent': 'UltriumGPT-Webhooks/1.0'
    };

    if (signature) {
      headers['X-UltriumGPT-Signature'] = signature;
    }

    logStep("Delivering webhook", { 
      webhookId: webhook.id, 
      url: webhook.url,
      hasSignature: !!signature 
    });

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: payloadString,
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    statusCode = response.status;
    
    if (response.ok) {
      status = 'success';
      logStep("Webhook delivered successfully", { webhookId: webhook.id, statusCode });
    } else {
      const errorText = await response.text();
      errorMessage = `HTTP ${statusCode}: ${errorText}`;
      logStep("Webhook delivery failed", { webhookId: webhook.id, statusCode, error: errorMessage });
    }

  } catch (error: any) {
    errorMessage = error.message;
    logStep("Webhook delivery error", { webhookId: webhook.id, error: errorMessage });
  }

  const responseTime = Date.now() - startTime;

  // Log delivery attempt
  await supabase
    .from('webhook_deliveries')
    .insert({
      webhook_id: webhook.id,
      status,
      status_code: statusCode,
      response_time_ms: responseTime,
      error_message: errorMessage || null,
      payload
    });

  // Update webhook stats
  if (status === 'success') {
    await supabase
      .from('webhooks')
      .update({
        success_count: webhook.success_count + 1,
        last_triggered: new Date().toISOString()
      })
      .eq('id', webhook.id);
  } else {
    await supabase
      .from('webhooks')
      .update({
        failure_count: webhook.failure_count + 1
      })
      .eq('id', webhook.id);
  }

  return { status, statusCode, responseTime, errorMessage };
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

    const { event, payload, userId } = await req.json();

    if (!event || !payload) {
      throw new Error('Event and payload are required');
    }

    logStep("Processing webhook delivery", { event, userId });

    // Get active webhooks for this event
    let query = supabase
      .from('webhooks')
      .select('*')
      .eq('is_active', true)
      .contains('events', [event]);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: webhooks, error: webhooksError } = await query;

    if (webhooksError) {
      throw webhooksError;
    }

    if (!webhooks || webhooks.length === 0) {
      logStep("No active webhooks found for event", { event, userId });
      return new Response(JSON.stringify({ 
        message: 'No active webhooks found for this event',
        delivered: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    logStep("Found webhooks to deliver", { count: webhooks.length });

    // Deliver to all matching webhooks
    const deliveryPromises = webhooks.map(webhook => 
      deliverWebhook(webhook, payload, supabase)
    );

    const results = await Promise.allSettled(deliveryPromises);

    const successCount = results.filter(result => 
      result.status === 'fulfilled' && result.value.status === 'success'
    ).length;

    const failureCount = results.length - successCount;

    logStep("Webhook delivery completed", { 
      total: results.length, 
      success: successCount, 
      failed: failureCount 
    });

    return new Response(JSON.stringify({
      message: 'Webhook delivery completed',
      delivered: results.length,
      successful: successCount,
      failed: failureCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    logStep("ERROR in webhook-delivery", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);