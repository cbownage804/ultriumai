import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Use getUser for JWT validation
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData?.user) {
      throw new Error(`Authentication error: ${userError?.message || 'Invalid token'}`);
    }
    
    const user = userData.user;
    
    if (!user.id || !user.email) {
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Note: Removed auto-enterprise for internal emails - use actual Stripe subscription data
    const isInternalUser = user.email.endsWith('@ultriumai.com') || user.email === 'brandon.howard@kwccpa.com';
    if (isInternalUser) {
      logStep("Internal user detected - will check actual Stripe subscription", { email: user.email });
    }

    // First, try to get subscription from database (fast)
    const { data: dbSubscription, error: dbError } = await supabaseClient
      .from("subscribers")
      .select("*")
      .eq("email", user.email)
      .single();

    logStep("Database check", { found: !!dbSubscription, email: user.email });

    // If we have recent data (updated within last hour), return it
    if (dbSubscription && !dbError) {
      const lastUpdated = new Date(dbSubscription.updated_at);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      if (lastUpdated > oneHourAgo) {
        logStep("Using cached subscription data", { tier: dbSubscription.subscription_tier });
        return new Response(JSON.stringify({
          subscribed: dbSubscription.subscribed,
          subscription_tier: dbSubscription.subscription_tier || "free",
          subscription_end: dbSubscription.subscription_end
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // Only hit Stripe API if we need fresh data
    logStep("Fetching fresh data from Stripe");
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    try {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      
      if (customers.data.length === 0) {
        logStep("No customer found, updating unsubscribed state");
        const unsubscribedData = {
          email: user.email,
          user_id: user.id,
          stripe_customer_id: null,
          subscribed: false,
          subscription_tier: "free",
          subscription_end: null,
          updated_at: new Date().toISOString(),
        };
        
        await supabaseClient.from("subscribers").upsert(unsubscribedData, { onConflict: 'email' });
        
        return new Response(JSON.stringify({ 
          subscribed: false, 
          subscription_tier: "free",
          subscription_end: null 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const customerId = customers.data[0].id;
      logStep("Found Stripe customer", { customerId });

      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });
      
      const hasActiveSub = subscriptions.data.length > 0;
      let subscriptionTier = "free";
      let subscriptionEnd = null;

      if (hasActiveSub) {
        const subscription = subscriptions.data[0];
        subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
        logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
        
        // Determine subscription tier from product ID
        const priceId = subscription.items.data[0].price.id;
        const productId = subscription.items.data[0].price.product as string;
        
        // Map product IDs to subscription tiers
        const productTierMap: Record<string, string> = {
          // AI Studio MSP Tiers
          "prod_TsQhHWymjiY3Zy": "msp_starter",     // MSP Starter $99
          "prod_TsPhioFXabALEY": "msp_starter",     // MSP Starter (older)
          "prod_TsQhJnC8GZPjrI": "msp_pro",         // MSP Pro $249
          "prod_TsPhtSBxqC7L0w": "msp_pro",         // MSP Pro (older)
          "prod_TsQhlE5ORVd1NC": "msp_elite",       // MSP Elite $499
          "prod_TsPhFEtb7FOMSg": "msp_elite",       // MSP Elite (older)
          "prod_TsQhOcMqgRSHxc": "platform_pro",    // Platform Pro $999
          "prod_TsPhQ6giwYyau7": "platform_pro",    // Platform Pro (older)
          // AI Studio Team Tiers
          "prod_TsQhnzjERazYLu": "team_basic",      // Team Basic $49
          "prod_TsQhyZilpXT6Te": "team_plus",       // Team Plus $149
          // AI Studio Website Tiers
          "prod_TsQhZ1WMs8dFSt": "website_basic",   // Website Basic $29
          "prod_TsPhgvwhBCk4tn": "website_basic",   // Website Basic (older)
          "prod_TsQhRCAEIpxai1": "website_pro",     // Website Pro $79
          "prod_TsPhciN9yjVX1c": "website_pro",     // Website Pro (older)
          // SafeSuite Tiers
          "prod_TsPzD1oR0cpYRl": "safesuite_pro",   // SafeSuite Pro
          "prod_TsPs3I5eCybg7o": "safesuite_pro",   // SafeSuite Pro (older)
          "prod_TsPzaw5xfK0fGn": "safesuite_business", // SafeSuite Business
          "prod_TsPhrnVrS2CTEI": "safesuite_enterprise", // SafeSuite Enterprise
        };
        
        subscriptionTier = productTierMap[productId] || "free";
        logStep("Determined subscription tier", { priceId, productId, subscriptionTier });
      } else {
        logStep("No active subscription found");
      }

      const subscriptionData = {
        email: user.email,
        user_id: user.id,
        stripe_customer_id: customerId,
        subscribed: hasActiveSub,
        subscription_tier: subscriptionTier,
        subscription_end: subscriptionEnd,
        updated_at: new Date().toISOString(),
      };

      await supabaseClient.from("subscribers").upsert(subscriptionData, { onConflict: 'email' });
      logStep("Updated database with subscription info", { subscribed: hasActiveSub, subscriptionTier });
      
      return new Response(JSON.stringify({
        subscribed: hasActiveSub,
        subscription_tier: subscriptionTier,
        subscription_end: subscriptionEnd
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
      
    } catch (stripeError) {
      logStep("Stripe API error, using database fallback", { error: stripeError });
      
      // If Stripe fails but we have database data, use that
      if (dbSubscription) {
        return new Response(JSON.stringify({
          subscribed: dbSubscription.subscribed,
          subscription_tier: dbSubscription.subscription_tier || "free",
          subscription_end: dbSubscription.subscription_end
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      throw stripeError;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});