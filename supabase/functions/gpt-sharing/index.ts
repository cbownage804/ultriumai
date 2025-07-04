import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShareRequest {
  gpt_id: string;
  sharing_level: 'private' | 'link' | 'public';
  custom_domain?: string;
  whitelisted_domains?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'update-sharing':
        return await handleUpdateSharing(req, supabaseClient, user);
      case 'generate-embed':
        return await handleGenerateEmbed(req, supabaseClient, user);
      case 'get-analytics':
        return await handleGetAnalytics(req, supabaseClient, user);
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error('GPT sharing error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleUpdateSharing(req: Request, supabaseClient: any, user: any) {
  const { gpt_id, sharing_level, custom_domain, whitelisted_domains }: ShareRequest = await req.json();

  // Verify user owns the GPT
  const { data: gpt, error: gptError } = await supabaseClient
    .from('custom_gpts')
    .select('*')
    .eq('id', gpt_id)
    .eq('user_id', user.id)
    .single();

  if (gptError || !gpt) {
    return new Response(JSON.stringify({ error: 'GPT not found or unauthorized' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Update sharing settings
  const updates: any = {
    sharing_level,
    updated_at: new Date().toISOString()
  };

  if (whitelisted_domains) {
    updates.whitelisted_domains = whitelisted_domains.join(',');
  }

  if (custom_domain) {
    // Validate custom domain format
    if (!isValidDomain(custom_domain)) {
      return new Response(JSON.stringify({ error: 'Invalid domain format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Store custom domain in integration settings
    const integrationSettings = gpt.integration_settings || {};
    integrationSettings.custom_domain = custom_domain;
    updates.integration_settings = integrationSettings;
  }

  const { error: updateError } = await supabaseClient
    .from('custom_gpts')
    .update(updates)
    .eq('id', gpt_id);

  if (updateError) {
    console.error('Error updating sharing settings:', updateError);
    return new Response(JSON.stringify({ error: 'Failed to update sharing settings' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Generate sharing URLs
  const baseUrl = custom_domain ? `https://${custom_domain}` : Deno.env.get('SITE_URL');
  const gptSlug = gpt.name.toLowerCase().replace(/\s+/g, '-');
  
  const sharingUrls = {
    public_url: `${baseUrl}/gpt/${gptSlug}`,
    embed_url: `${baseUrl}/gpt/${gptSlug}?embed=true`,
    api_endpoint: `${baseUrl}/api/gpt/${gpt_id}/chat`
  };

  return new Response(JSON.stringify({ 
    success: true, 
    sharing_urls: sharingUrls,
    updated_gpt: { ...gpt, ...updates }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleGenerateEmbed(req: Request, supabaseClient: any, user: any) {
  const { gpt_id, width = '400px', height = '600px', theme = 'auto' } = await req.json();

  // Verify user owns the GPT
  const { data: gpt, error: gptError } = await supabaseClient
    .from('custom_gpts')
    .select('*')
    .eq('id', gpt_id)
    .eq('user_id', user.id)
    .single();

  if (gptError || !gpt) {
    return new Response(JSON.stringify({ error: 'GPT not found or unauthorized' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!gpt.embed_enabled) {
    return new Response(JSON.stringify({ error: 'Embedding not enabled for this GPT' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const baseUrl = Deno.env.get('SITE_URL');
  const gptSlug = gpt.name.toLowerCase().replace(/\s+/g, '-');
  const embedUrl = `${baseUrl}/gpt/${gptSlug}?embed=true&theme=${theme}`;

  const embedCode = `<iframe
  src="${embedUrl}"
  width="${width}"
  height="${height}"
  frameborder="0"
  style="border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"
  title="${gpt.name} - AI Assistant"
></iframe>`;

  const jsSnippet = `<script>
(function() {
  const iframe = document.createElement('iframe');
  iframe.src = '${embedUrl}';
  iframe.width = '${width}';
  iframe.height = '${height}';
  iframe.frameBorder = '0';
  iframe.style.borderRadius = '8px';
  iframe.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
  iframe.title = '${gpt.name} - AI Assistant';
  
  const container = document.getElementById('ultrium-gpt-container');
  if (container) {
    container.appendChild(iframe);
  }
})();
</script>`;

  return new Response(JSON.stringify({ 
    embed_code: embedCode,
    js_snippet: jsSnippet,
    embed_url: embedUrl,
    preview_html: generatePreviewHTML(gpt, embedCode)
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleGetAnalytics(req: Request, supabaseClient: any, user: any) {
  const url = new URL(req.url);
  const gptId = url.searchParams.get('gpt_id');
  const timeRange = url.searchParams.get('range') || '7d';

  if (!gptId) {
    return new Response(JSON.stringify({ error: 'GPT ID required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Verify user owns the GPT
  const { data: gpt, error: gptError } = await supabaseClient
    .from('custom_gpts')
    .select('*')
    .eq('id', gptId)
    .eq('user_id', user.id)
    .single();

  if (gptError || !gpt) {
    return new Response(JSON.stringify({ error: 'GPT not found or unauthorized' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  
  switch (timeRange) {
    case '24h':
      startDate.setHours(startDate.getHours() - 24);
      break;
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    default:
      startDate.setDate(startDate.getDate() - 7);
  }

  // Get analytics data
  const { data: analytics, error: analyticsError } = await supabaseClient
    .from('gpt_analytics')
    .select('*')
    .eq('gpt_id', gptId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: true });

  if (analyticsError) {
    console.error('Error fetching analytics:', analyticsError);
    return new Response(JSON.stringify({ error: 'Failed to fetch analytics' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Process analytics data
  const totalInteractions = analytics.length;
  const uniqueSessions = new Set(analytics.map(a => a.session_id)).size;
  const avgResponseTime = analytics
    .filter(a => a.response_time_ms)
    .reduce((sum, a) => sum + (a.response_time_ms || 0), 0) / totalInteractions || 0;
  
  const satisfactionRatings = analytics.filter(a => a.satisfaction_rating);
  const avgSatisfaction = satisfactionRatings.length > 0
    ? satisfactionRatings.reduce((sum, a) => sum + (a.satisfaction_rating || 0), 0) / satisfactionRatings.length
    : 0;

  return new Response(JSON.stringify({ 
    total_interactions: totalInteractions,
    unique_sessions: uniqueSessions,
    avg_response_time_ms: Math.round(avgResponseTime),
    avg_satisfaction: Number(avgSatisfaction.toFixed(2)),
    time_range: timeRange,
    raw_data: analytics
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isValidDomain(domain: string): boolean {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
  return domainRegex.test(domain);
}

function generatePreviewHTML(gpt: any, embedCode: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${gpt.name} - Embed Preview</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 40px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .embed-container {
            display: flex;
            justify-content: center;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Embed Preview: ${gpt.name}</h1>
            <p>This is how your GPT will appear when embedded on other websites.</p>
        </div>
        
        <div class="embed-container">
            ${embedCode}
        </div>
        
        <div class="header">
            <p><small>Powered by UltriumGPT</small></p>
        </div>
    </div>
</body>
</html>`;
}