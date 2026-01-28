import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-SYNC-SUBSCRIPTION] ${step}${detailsStr}`);
};

// AI Studio price ID to tier mapping
const AI_STUDIO_PRICE_TO_TIER: Record<string, string> = {
  'price_1SufpiH1u6E0bsJTjYHxUB0S': 'msp_starter',
  'price_1SufpkH1u6E0bsJTvIBfLHhJ': 'msp_pro',
  'price_1SufplH1u6E0bsJTBSp1Sk22': 'msp_elite',
  'price_1SufpmH1u6E0bsJTNXc7zgdh': 'platform_pro',
  'price_1SufpoH1u6E0bsJTeVF7r7l8': 'team_basic',
  'price_1SufppH1u6E0bsJTQVp5tPOV': 'team_plus',
  'price_1SufpqH1u6E0bsJT9kB6UsXe': 'website_basic',
  'price_1SufprH1u6E0bsJThEY4BJTd': 'website_pro',
};

// SafeSuite price ID to tier mapping
const SAFESUITE_PRICE_TO_TIER: Record<string, string> = {
  'price_1SrTegH1u6E0bsJTKpGm5qxr': 'pro',
  'price_1SrTeiH1u6E0bsJTarTH7ajs': 'pro', // yearly
  'price_1SrTejH1u6E0bsJTwd4K8st5': 'business',
  'price_1SrTelH1u6E0bsJTmep4lSIP': 'business', // yearly
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Verify admin authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: adminUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !adminUser) throw new Error("Unauthorized");
    
    // Verify admin is UltriumAI employee
    if (!adminUser.email?.endsWith('@ultriumai.com')) {
      throw new Error("Admin access required");
    }
    logStep("Admin authenticated", { adminEmail: adminUser.email });

    // Get target user from request body
    const { userId, userEmail } = await req.json();
    if (!userId || !userEmail) {
      throw new Error("userId and userEmail are required");
    }
    logStep("Syncing subscription for user", { userId, userEmail });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Look up customer in Stripe by email
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found", { userEmail });
      
      // Update to free tier
      await supabaseAdmin.from("subscribers").upsert({
        email: userEmail,
        user_id: userId,
        stripe_customer_id: null,
        subscribed: false,
        subscription_tier: "free",
        subscription_end: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      return new Response(JSON.stringify({
        success: true,
        message: "No Stripe customer found - set to free tier",
        ai_studio: { tier: 'free', subscribed: false },
        safesuite: { tier: 'free', subscribed: false },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get all active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
    });

    logStep("Found subscriptions", { count: subscriptions.data.length });

    let aiStudioTier = 'free';
    let aiStudioSubscribed = false;
    let aiStudioEnd: string | null = null;
    let aiStudioStripeId: string | null = null;

    let safesuiteTier = 'free';
    let safesuiteSubscribed = false;
    let safesuiteEnd: string | null = null;
    let safesuiteStripeId: string | null = null;

    // Process each subscription to determine products
    for (const subscription of subscriptions.data) {
      for (const item of subscription.items.data) {
        const priceId = item.price.id;
        const endDate = new Date(subscription.current_period_end * 1000).toISOString();
        
        // Check if this is an AI Studio subscription
        if (AI_STUDIO_PRICE_TO_TIER[priceId]) {
          aiStudioTier = AI_STUDIO_PRICE_TO_TIER[priceId];
          aiStudioSubscribed = true;
          aiStudioEnd = endDate;
          aiStudioStripeId = subscription.id;
          logStep("Found AI Studio subscription", { priceId, tier: aiStudioTier });
        }
        
        // Check if this is a SafeSuite subscription
        if (SAFESUITE_PRICE_TO_TIER[priceId]) {
          safesuiteTier = SAFESUITE_PRICE_TO_TIER[priceId];
          safesuiteSubscribed = true;
          safesuiteEnd = endDate;
          safesuiteStripeId = subscription.id;
          logStep("Found SafeSuite subscription", { priceId, tier: safesuiteTier });
        }
      }
    }

    // Update AI Studio subscription in database
    const { error: aiError } = await supabaseAdmin.from("subscribers").upsert({
      email: userEmail,
      user_id: userId,
      stripe_customer_id: customerId,
      subscribed: aiStudioSubscribed,
      subscription_tier: aiStudioTier,
      subscription_end: aiStudioEnd,
      stripe_subscription_id: aiStudioStripeId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    if (aiError) {
      logStep("Error updating AI Studio subscription", { error: aiError });
    }

    // Update SafeSuite subscription in database
    const { error: ssError } = await supabaseAdmin.from("safesuite_subscriptions").upsert({
      user_id: userId,
      tier: safesuiteTier,
      status: safesuiteSubscribed ? 'active' : 'inactive',
      stripe_subscription_id: safesuiteStripeId,
      current_period_end: safesuiteEnd,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    if (ssError) {
      logStep("Error updating SafeSuite subscription", { error: ssError });
    }

    logStep("Sync complete", { aiStudioTier, safesuiteTier });

    return new Response(JSON.stringify({
      success: true,
      message: "Subscription synced from Stripe",
      ai_studio: { 
        tier: aiStudioTier, 
        subscribed: aiStudioSubscribed,
        subscription_end: aiStudioEnd,
        stripe_subscription_id: aiStudioStripeId,
      },
      safesuite: { 
        tier: safesuiteTier, 
        subscribed: safesuiteSubscribed,
        subscription_end: safesuiteEnd,
        stripe_subscription_id: safesuiteStripeId,
      },
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
