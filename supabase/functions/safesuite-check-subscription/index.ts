import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map live Stripe price IDs to tiers
const PRICE_TO_TIER: Record<string, string> = {
  "price_1SrTegH1u6E0bsJTKpGm5qxr": "pro",      // Pro monthly $9.99
  "price_1SrTeiH1u6E0bsJTarTH7ajs": "pro",      // Pro yearly $95.90
  "price_1SrTejH1u6E0bsJTwd4K8st5": "business", // Business monthly $29.99
  "price_1SrTelH1u6E0bsJTmep4lSIP": "business", // Business yearly $287.90
  "price_1SuesEH1u6E0bsJT6o2Hxp0T": "enterprise" // Enterprise monthly $45
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SAFESUITE-CHECK-SUB] ${step}${detailsStr}`);
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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Check for existing customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found, returning free tier");
      
      // Ensure user has a free subscription record
      await supabaseClient
        .from('safesuite_subscriptions')
        .upsert({
          user_id: user.id,
          tier: 'free',
          status: 'active'
        }, { onConflict: 'user_id' });
      
      return new Response(JSON.stringify({
        subscribed: false,
        tier: 'free',
        subscription_end: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Look for SafeSuite subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 10,
    });

    // Find a SafeSuite subscription
    let safeSuiteSubscription = null;
    for (const sub of subscriptions.data) {
      if (sub.metadata?.product === 'safesuite') {
        safeSuiteSubscription = sub;
        break;
      }
      // Also check price IDs
      const priceId = sub.items.data[0]?.price?.id;
      if (priceId && PRICE_TO_TIER[priceId]) {
        safeSuiteSubscription = sub;
        break;
      }
    }

    if (!safeSuiteSubscription) {
      logStep("No active SafeSuite subscription found");
      
      // Ensure user has a free subscription record
      await supabaseClient
        .from('safesuite_subscriptions')
        .upsert({
          user_id: user.id,
          tier: 'free',
          status: 'active',
          stripe_customer_id: customerId
        }, { onConflict: 'user_id' });
      
      return new Response(JSON.stringify({
        subscribed: false,
        tier: 'free',
        subscription_end: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const priceId = safeSuiteSubscription.items.data[0]?.price?.id;
    const tier = safeSuiteSubscription.metadata?.tier || PRICE_TO_TIER[priceId || ''] || 'pro';
    
    // Safely parse dates with fallback
    const periodEnd = safeSuiteSubscription.current_period_end;
    const periodStart = safeSuiteSubscription.current_period_start;
    const subscriptionEnd = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;
    const subscriptionStart = periodStart ? new Date(periodStart * 1000).toISOString() : null;
    
    logStep("Active SafeSuite subscription found", { 
      subscriptionId: safeSuiteSubscription.id, 
      tier, 
      endDate: subscriptionEnd 
    });

    // Update database subscription record
    const updateData: Record<string, any> = {
      user_id: user.id,
      tier: tier,
      stripe_subscription_id: safeSuiteSubscription.id,
      stripe_customer_id: customerId,
      stripe_price_id: priceId,
      cancel_at_period_end: safeSuiteSubscription.cancel_at_period_end,
      status: safeSuiteSubscription.status
    };
    
    if (subscriptionStart) updateData.current_period_start = subscriptionStart;
    if (subscriptionEnd) updateData.current_period_end = subscriptionEnd;
    
    await supabaseClient
      .from('safesuite_subscriptions')
      .upsert(updateData, { onConflict: 'user_id' });

    return new Response(JSON.stringify({
      subscribed: true,
      tier: tier,
      subscription_end: subscriptionEnd,
      cancel_at_period_end: safeSuiteSubscription.cancel_at_period_end
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
