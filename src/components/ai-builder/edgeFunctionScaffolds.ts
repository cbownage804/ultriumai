/**
 * Wave 16: Edge Function Scaffolding from Intent
 * Detects edge function intents and generates complete scaffold
 * with CORS, auth, error handling, and config.toml entries.
 */

export interface EdgeFunctionScaffold {
  name: string;
  code: string;
  configToml: string;
  description: string;
  requiredSecrets: string[];
}

// ── Intent detection ──
interface DetectedIntent {
  type: 'webhook' | 'cron' | 'api-proxy' | 'email' | 'payment' | 'ai' | 'generic';
  service: string | null;
  name: string;
  description: string;
}

export function detectEdgeFunctionIntent(input: string): DetectedIntent | null {
  const lower = input.toLowerCase();

  // Must have edge function / serverless / backend intent
  const hasBackendIntent = /\b(edge function|serverless|backend|webhook|cron|api proxy|endpoint|server-side|cloud function)\b/.test(lower);
  const hasCreateVerb = /\b(create|add|build|set up|make|generate|scaffold|implement)\b/.test(lower);

  if (!hasCreateVerb && !hasBackendIntent) return null;

  // Stripe webhook
  if (/\b(stripe|payment)\b/.test(lower) && /\b(webhook|listen|event)\b/.test(lower)) {
    return { type: 'webhook', service: 'stripe', name: 'stripe-webhook', description: 'Stripe payment webhook handler' };
  }

  // Email sending
  if (/\b(send|email|notification|resend|sendgrid|mailgun)\b/.test(lower) && /\b(email|notification|welcome|invite)\b/.test(lower)) {
    const service = /resend/.test(lower) ? 'resend' : /sendgrid/.test(lower) ? 'sendgrid' : 'resend';
    return { type: 'email', service, name: 'send-email', description: 'Email sending service' };
  }

  // Cron job
  if (/\b(cron|schedule|daily|weekly|hourly|recurring|periodic)\b/.test(lower)) {
    return { type: 'cron', service: null, name: 'scheduled-task', description: 'Scheduled cron job' };
  }

  // AI/LLM proxy
  if (/\b(openai|gpt|claude|anthropic|ai|llm|chat completion)\b/.test(lower) && /\b(proxy|call|invoke|endpoint)\b/.test(lower)) {
    const service = /claude|anthropic/.test(lower) ? 'anthropic' : 'openai';
    return { type: 'ai', service, name: 'ai-proxy', description: 'AI/LLM API proxy' };
  }

  // API proxy
  if (/\b(proxy|forward|external api|third.party|api)\b/.test(lower) && hasBackendIntent) {
    return { type: 'api-proxy', service: null, name: 'api-proxy', description: 'External API proxy' };
  }

  // Generic edge function
  if (hasBackendIntent) {
    const nameMatch = lower.match(/(?:edge function|function)\s+(?:called|named)\s+["']?(\w[\w-]*)["']?/);
    const name = nameMatch?.[1] || 'custom-function';
    return { type: 'generic', service: null, name, description: 'Custom edge function' };
  }

  return null;
}

// ── Scaffold generators ──
const CORS_HEADERS = `const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};`;

function generateStripeWebhook(): EdgeFunctionScaffold {
  return {
    name: 'stripe-webhook',
    requiredSecrets: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
    configToml: `[functions.stripe-webhook]\nverify_jwt = false`,
    description: 'Handles Stripe webhook events (checkout.session.completed, payment_intent.succeeded, etc.)',
    code: `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

${CORS_HEADERS}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });
  const signature = req.headers.get('stripe-signature')!;
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, Deno.env.get('STRIPE_WEBHOOK_SECRET')!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Checkout completed:', session.id);
      // TODO: Update your database with the payment info
      break;
    }
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent;
      console.log('Payment succeeded:', pi.id);
      break;
    }
    default:
      console.log('Unhandled event type:', event.type);
  }

  return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
`,
  };
}

function generateEmailFunction(service: string): EdgeFunctionScaffold {
  const isResend = service === 'resend';
  return {
    name: 'send-email',
    requiredSecrets: isResend ? ['RESEND_API_KEY'] : ['SENDGRID_API_KEY'],
    configToml: `[functions.send-email]\nverify_jwt = false`,
    description: `Send transactional emails via ${isResend ? 'Resend' : 'SendGrid'}`,
    code: `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

${CORS_HEADERS}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { to, subject, html } = await req.json();
    if (!to || !subject) {
      return new Response(JSON.stringify({ error: 'Missing to or subject' }), { status: 400, headers: corsHeaders });
    }

${isResend ? `    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: \`Bearer \${Deno.env.get('RESEND_API_KEY')}\`,
      },
      body: JSON.stringify({
        from: 'noreply@yourdomain.com',
        to,
        subject,
        html: html || \`<p>\${subject}</p>\`,
      }),
    });` : `    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: \`Bearer \${Deno.env.get('SENDGRID_API_KEY')}\`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: 'noreply@yourdomain.com' },
        subject,
        content: [{ type: 'text/html', value: html || \`<p>\${subject}</p>\` }],
      }),
    });`}

    if (!res.ok) {
      const errText = await res.text();
      console.error('Email send failed:', errText);
      return new Response(JSON.stringify({ error: 'Failed to send email' }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Email error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
`,
  };
}

function generateCronFunction(): EdgeFunctionScaffold {
  return {
    name: 'scheduled-task',
    requiredSecrets: [],
    configToml: `[functions.scheduled-task]\nverify_jwt = false`,
    description: 'Scheduled background task (trigger via pg_cron or external scheduler)',
    code: `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

${CORS_HEADERS}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // Verify this is a legitimate cron call (optional: check authorization header)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.includes(Deno.env.get('SUPABASE_ANON_KEY') || '')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // TODO: Add your scheduled task logic here
    // Example: Clean up expired records
    // const { error } = await supabase
    //   .from('temp_records')
    //   .delete()
    //   .lt('expires_at', new Date().toISOString());

    console.log('Scheduled task executed at:', new Date().toISOString());

    return new Response(JSON.stringify({ success: true, executedAt: new Date().toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Scheduled task error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
`,
  };
}

function generateAIProxy(service: string): EdgeFunctionScaffold {
  const isAnthropic = service === 'anthropic';
  return {
    name: 'ai-proxy',
    requiredSecrets: isAnthropic ? ['ANTHROPIC_API_KEY'] : ['OPENAI_API_KEY'],
    configToml: `[functions.ai-proxy]\nverify_jwt = false`,
    description: `Proxy for ${isAnthropic ? 'Anthropic Claude' : 'OpenAI'} API calls`,
    code: `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

${CORS_HEADERS}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { messages, model, max_tokens = 1024 } = await req.json();
    if (!messages?.length) {
      return new Response(JSON.stringify({ error: 'Messages required' }), { status: 400, headers: corsHeaders });
    }

${isAnthropic ? `    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-20250514',
        max_tokens,
        messages,
      }),
    });` : `    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: \`Bearer \${Deno.env.get('OPENAI_API_KEY')}\`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        max_tokens,
        messages,
      }),
    });`}

    if (!res.ok) {
      const errText = await res.text();
      console.error('AI API error:', errText);
      return new Response(JSON.stringify({ error: 'AI API call failed', details: errText }), {
        status: res.status,
        headers: corsHeaders,
      });
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('AI proxy error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
`,
  };
}

function generateGenericFunction(name: string): EdgeFunctionScaffold {
  return {
    name,
    requiredSecrets: [],
    configToml: `[functions.${name}]\nverify_jwt = false`,
    description: `Custom edge function: ${name}`,
    code: `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

${CORS_HEADERS}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const body = req.method === 'POST' ? await req.json() : {};

    // TODO: Implement your function logic here
    console.log('${name} invoked with:', body);

    return new Response(JSON.stringify({ success: true, data: body }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('${name} error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
`,
  };
}

/**
 * Generate the complete edge function scaffold for a detected intent.
 */
export function generateEdgeFunctionScaffold(intent: DetectedIntent): EdgeFunctionScaffold {
  switch (intent.type) {
    case 'webhook':
      if (intent.service === 'stripe') return generateStripeWebhook();
      return generateGenericFunction(intent.name);
    case 'email':
      return generateEmailFunction(intent.service || 'resend');
    case 'cron':
      return generateCronFunction();
    case 'ai':
      return generateAIProxy(intent.service || 'openai');
    default:
      return generateGenericFunction(intent.name);
  }
}

/**
 * Build a prompt directive for edge function generation.
 */
export function buildEdgeFunctionDirective(intent: DetectedIntent): string {
  return `
[EDGE FUNCTION DIRECTIVE]
The user wants to create an edge function: "${intent.description}"
Type: ${intent.type}${intent.service ? ` | Service: ${intent.service}` : ''}
Generate the function using ===EDGE_FUNCTION: ${intent.name}=== delimiters.
Requirements:
- Include CORS headers for web app compatibility
- Set verify_jwt = false in config.toml, validate auth in code
- Use Deno.env.get() for all secrets (never hardcode)
- Include proper error handling with try/catch
- Return structured JSON responses
- Log errors with console.error for debugging`;
}
