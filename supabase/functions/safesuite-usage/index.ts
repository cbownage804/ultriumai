import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SAFESUITE-USAGE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    let body = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is fine for 'get all' action
    }
    
    const { action = 'get', product } = body as { action?: string; product?: string };

    // Calculate current billing period
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    // If no product specified and action is 'get', return all usage
    if (action === 'get' && !product) {
      // Initialize usage object
      const usage = {
        safepass: 0,
        safescan: 0,
        safeweb: 0,
        safetrack: 0
      };

      // SafePass: Count actual password entries (not incremental tracking)
      const { count: safepassCount, error: safepassError } = await supabaseClient
        .from('safepass_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (!safepassError && safepassCount !== null) {
        usage.safepass = safepassCount;
      }
      logStep("SafePass entries counted", { count: usage.safepass });

      // SafeScan: Aggregate counts from multiple scan tables this billing period
      let totalScans = 0;
      
      // Document scans
      const { count: docScanCount } = await supabaseClient
        .from('document_scans')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', periodStart.toISOString())
        .lt('created_at', periodEnd.toISOString());
      if (docScanCount) totalScans += docScanCount;
      
      // Email scans
      const { count: emailScanCount } = await supabaseClient
        .from('email_scans')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', periodStart.toISOString())
        .lt('created_at', periodEnd.toISOString());
      if (emailScanCount) totalScans += emailScanCount;
      
      // Security scans (URL scans)
      const { count: secScanCount } = await supabaseClient
        .from('security_scans')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', periodStart.toISOString())
        .lt('created_at', periodEnd.toISOString());
      if (secScanCount) totalScans += secScanCount;
      
      usage.safescan = totalScans;
      logStep("SafeScan scans counted", { count: usage.safescan, docScanCount, emailScanCount, secScanCount });

      // SafeWeb: Count monitored assets (status = 'active', not is_active column)
      const { count: safewebCount, error: safewebError } = await supabaseClient
        .from('safeweb_assets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active');
      
      if (!safewebError && safewebCount !== null) {
        usage.safeweb = safewebCount;
      }
      logStep("SafeWeb assets counted", { count: usage.safeweb });

      // SafeTrack: Count tracked assets
      const { count: safetrackCount, error: safetrackError } = await supabaseClient
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (!safetrackError && safetrackCount !== null) {
        usage.safetrack = safetrackCount;
      }
      logStep("SafeTrack assets counted", { count: usage.safetrack });

      logStep("All usage retrieved", usage);

      return new Response(JSON.stringify({ usage }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // For specific product operations, validate product
    if (product && !['safepass', 'safescan', 'safeweb', 'safetrack'].includes(product)) {
      throw new Error("Invalid product specified");
    }

    if (action === 'get' && product) {
      // Get current usage for specific product
      const { data: usageData, error: usageError } = await supabaseClient
        .from('safesuite_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('product', product)
        .gte('period_start', periodStart.toISOString())
        .lt('period_end', periodEnd.toISOString())
        .maybeSingle();

      if (usageError) throw usageError;

      logStep("Usage retrieved", { product, count: usageData?.usage_count || 0 });

      return new Response(JSON.stringify({ 
        usage: usageData?.usage_count || 0,
        product 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === 'increment') {
      if (!product) {
        throw new Error("Product required for increment action");
      }

      // Increment usage for a specific product
      const { data: existingUsage, error: fetchError } = await supabaseClient
        .from('safesuite_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('product', product)
        .gte('period_start', periodStart.toISOString())
        .lt('period_end', periodEnd.toISOString())
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      let newCount;
      if (existingUsage) {
        // Update existing record
        newCount = existingUsage.usage_count + 1;
        const { error: updateError } = await supabaseClient
          .from('safesuite_usage')
          .update({ usage_count: newCount })
          .eq('id', existingUsage.id);

        if (updateError) throw updateError;
      } else {
        // Create new record
        newCount = 1;
        const { error: insertError } = await supabaseClient
          .from('safesuite_usage')
          .insert({
            user_id: user.id,
            product: product,
            usage_count: 1,
            period_start: periodStart.toISOString(),
            period_end: periodEnd.toISOString()
          });

        if (insertError) throw insertError;
      }

      logStep("Usage incremented", { product, newCount });

      return new Response(JSON.stringify({ 
        success: true, 
        product, 
        usage_count: newCount 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error("Invalid action specified");

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
