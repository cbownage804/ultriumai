import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map real Stripe product IDs → Vanguard tier names
const PRODUCT_TO_TIER: Record<string, string> = {
  'prod_Tvm1tGkEFFA8xx': 'it-professional',
  'prod_Tvm1v7saOMFPLn': 'it-expert',
  'prod_Tvm1N7n2bkJpMd': 'it-master',
  'prod_Tvm1aJEZ4WXQJN': 'msp-pro',
  'prod_Tvm1Wp6LRat7DV': 'msp-growth',
  'prod_Tvm1sVN7zuCb2R': 'msp-power',
};

const ADDON_PRODUCTS: Record<string, string> = {
  'prod_Tvm15XS4URJYDf': 'pursuit-xdr',
  'prod_Tvm14lHuxDHOyk': 'sentinel-saas',
  'prod_Tvm1Bv6Y169hG6': 'recon-pentest',
  'prod_Tvm1lPWrLHU5BG': 'cortex-ai',
  'prod_Tvm1BCKLECzk9L': 'comply',
  'prod_Tvm1pOuwM3afS1': 'cross-client-soc',
  'prod_Tvm1IMy0GKTI7u': 'atlas-docs',
  'prod_Tvm1CcIDVjRGaW': 'ai-copilot',
  'prod_Tvm19bNlVCzSw2': 'network-discovery',
};

const TRIAL_DURATION_DAYS = 14;

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VANGUARD-CHECK-SUB] ${step}${detailsStr}`);
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
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check for existing record in database
    const { data: dbSub } = await supabaseClient
      .from('vanguard_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Admin override - immediate return
    if (dbSub?.admin_override) {
      logStep("Admin override found", { tier: dbSub.tier, seats: dbSub.seat_count });
      return new Response(JSON.stringify({
        subscribed: true,
        tier: dbSub.tier,
        seat_count: dbSub.seat_count,
        addons: dbSub.addons || [],
        subscription_end: dbSub.current_period_end,
        admin_override: true,
        is_trial: false,
        trial_ends_at: null,
        trial_days_remaining: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check Stripe for active subscriptions
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    let vanguardSub: any = null;
    let tier = 'free';
    let seatCount = 0;
    const activeAddons: string[] = [];

    if (customers.data.length > 0) {
      const customerId = customers.data[0].id;
      logStep("Found Stripe customer", { customerId });

      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 10,
      });

      for (const sub of subscriptions.data) {
        for (const item of sub.items.data) {
          const productId = item.price.product as string;
          if (PRODUCT_TO_TIER[productId]) {
            vanguardSub = sub;
            tier = PRODUCT_TO_TIER[productId];
            seatCount = item.quantity || 1;
          }
          if (ADDON_PRODUCTS[productId]) {
            activeAddons.push(ADDON_PRODUCTS[productId]);
          }
        }
      }

      // If paid subscription found, cache and return
      if (vanguardSub) {
        const subscriptionEnd = new Date(vanguardSub.current_period_end * 1000).toISOString();
        logStep("Active Vanguard subscription found", { tier, seats: seatCount });

        await supabaseClient
          .from('vanguard_subscriptions')
          .upsert({
            user_id: user.id,
            stripe_customer_id: customerId,
            stripe_subscription_id: vanguardSub.id,
            tier,
            seat_count: seatCount,
            status: 'active',
            addons: activeAddons,
            current_period_start: new Date(vanguardSub.current_period_start * 1000).toISOString(),
            current_period_end: subscriptionEnd,
            admin_override: false,
            is_trial: false,
          }, { onConflict: 'user_id' });

        return new Response(JSON.stringify({
          subscribed: true,
          tier,
          seat_count: seatCount,
          addons: activeAddons,
          subscription_end: subscriptionEnd,
          stripe_subscription_id: vanguardSub.id,
          is_trial: false,
          trial_ends_at: null,
          trial_days_remaining: null,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // No paid subscription found — check/provision trial
    const now = new Date();

    if (dbSub?.is_trial && dbSub?.trial_ends_at) {
      const trialEnd = new Date(dbSub.trial_ends_at);
      const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      if (trialEnd > now) {
        logStep("Active trial", { daysRemaining, trialEnds: dbSub.trial_ends_at });
        return new Response(JSON.stringify({
          subscribed: true,
          tier: 'trial',
          seat_count: 1,
          addons: [],
          subscription_end: dbSub.trial_ends_at,
          is_trial: true,
          trial_ends_at: dbSub.trial_ends_at,
          trial_days_remaining: daysRemaining,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        logStep("Trial expired", { trialEnded: dbSub.trial_ends_at });
        return new Response(JSON.stringify({
          subscribed: false,
          tier: 'free',
          seat_count: 0,
          addons: [],
          is_trial: false,
          trial_ended: true,
          trial_ends_at: dbSub.trial_ends_at,
          trial_days_remaining: 0,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // No subscription and no trial — auto-provision a 14-day trial
    const trialStart = now.toISOString();
    const trialEnd = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    logStep("Provisioning new trial", { trialStart, trialEnd });

    await supabaseClient
      .from('vanguard_subscriptions')
      .upsert({
        user_id: user.id,
        tier: 'trial',
        seat_count: 1,
        status: 'trialing',
        addons: [],
        admin_override: false,
        is_trial: true,
        trial_started_at: trialStart,
        trial_ends_at: trialEnd,
      }, { onConflict: 'user_id' });

    return new Response(JSON.stringify({
      subscribed: true,
      tier: 'trial',
      seat_count: 1,
      addons: [],
      subscription_end: trialEnd,
      is_trial: true,
      trial_ends_at: trialEnd,
      trial_days_remaining: TRIAL_DURATION_DAYS,
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
