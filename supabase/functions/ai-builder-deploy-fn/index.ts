import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { functionName, sourceCode, supabaseUrl, supabaseServiceKey } = await req.json();

    if (!functionName || !sourceCode) {
      return new Response(JSON.stringify({ error: "functionName and sourceCode are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate function name (alphanumeric + hyphens only)
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(functionName) && !/^[a-z0-9]$/.test(functionName)) {
      return new Response(JSON.stringify({ error: "Invalid function name. Use lowercase alphanumeric and hyphens only." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Detect required secrets from Deno.env.get() calls
    const secretPattern = /Deno\.env\.get\(\s*['"]([^'"]+)['"]\s*\)/g;
    const requiredSecrets: string[] = [];
    let match;
    while ((match = secretPattern.exec(sourceCode)) !== null) {
      const secretName = match[1];
      // Skip built-in Supabase secrets
      if (!['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_DB_URL'].includes(secretName)) {
        requiredSecrets.push(secretName);
      }
    }

    // If no Supabase credentials provided, return the function spec for manual deployment
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({
        success: true,
        deployed: false,
        manual: true,
        functionName,
        requiredSecrets,
        instructions: `To deploy this edge function:\n1. Create supabase/functions/${functionName}/index.ts in your Supabase project\n2. Paste the source code\n3. Run: supabase functions deploy ${functionName}`,
        sourceCode,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract project ref from URL
    const urlMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    const projectRef = urlMatch?.[1];
    if (!projectRef) {
      return new Response(JSON.stringify({ error: "Invalid Supabase URL format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try deploying via Supabase Management API
    // Note: The Management API requires a service_role key or personal access token
    // For now, we'll store the function code and provide deployment instructions
    const deployResult = {
      success: true,
      deployed: false,
      functionName,
      requiredSecrets,
      projectRef,
      invocationUrl: `${supabaseUrl}/functions/v1/${functionName}`,
      logsUrl: `https://supabase.com/dashboard/project/${projectRef}/functions/${functionName}/logs`,
      instructions: requiredSecrets.length > 0
        ? `This function requires the following secrets to be configured:\n${requiredSecrets.map(s => `• ${s}`).join('\n')}\n\nAdd them at: https://supabase.com/dashboard/project/${projectRef}/settings/functions`
        : null,
    };

    return new Response(JSON.stringify(deployResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("ai-builder-deploy-fn error:", err);
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
