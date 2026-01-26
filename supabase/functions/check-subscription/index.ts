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
    
    // Use getClaims for JWT validation - doesn't require session to exist
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      throw new Error(`Authentication error: ${claimsError?.message || 'Invalid token'}`);
    }
    
    const userId = claimsData.claims.sub;
    const userEmail = claimsData.claims.email as string;
    
    if (!userId || !userEmail) {
      throw new Error("User not authenticated or email not available");
    }
    
    const user = { id: userId, email: userEmail };
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Give all UltriumAI employees enterprise status - check this FIRST before cache
    if (user.email.endsWith('@ultriumai.com') || user.email === 'brandon.howard@kwccpa.com') {
      logStep("UltriumAI employee detected - granting enterprise status", { email: user.email });
      
      // Update database to reflect enterprise status
      const enterpriseData = {
        email: user.email,
        user_id: user.id,
        stripe_customer_id: null,
        subscribed: true,
        subscription_tier: "enterprise",
        subscription_end: null,
        updated_at: new Date().toISOString(),
      };
      
      await supabaseClient.from("subscribers").upsert(enterpriseData, { onConflict: 'email' });
      
      return new Response(JSON.stringify({
        subscribed: true,
        subscription_tier: "enterprise",
        subscription_end: null // No expiration for admins
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
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
        
        // Determine subscription tier from price
        const priceId = subscription.items.data[0].price.id;
        const price = await stripe.prices.retrieve(priceId);
        const amount = price.unit_amount || 0;
        
        // Map amounts to our pricing tiers (per user amounts - doubled pricing)
        if (amount >= 8000) { // $80+ = Enterprise
          subscriptionTier = "enterprise";
        } else if (amount >= 5000) { // $50+ = Professional
          subscriptionTier = "professional";
        } else if (amount >= 3000) { // $30+ = Starter
          subscriptionTier = "starter";
        } else {
          subscriptionTier = "free";
        }
        logStep("Determined subscription tier", { priceId, amount, subscriptionTier });
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