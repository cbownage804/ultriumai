import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map real Stripe product IDs → Vanguard tier names
const PRODUCT_TO_TIER: Record<string, string> = {
  // IT Department Plans
  'prod_Tvm1tGkEFFA8xx': 'it-professional',
  'prod_Tvm1v7saOMFPLn': 'it-expert',
  'prod_Tvm1N7n2bkJpMd': 'it-master',
  // MSP Plans
  'prod_Tvm1aJEZ4WXQJN': 'msp-pro',
  'prod_Tvm1Wp6LRat7DV': 'msp-growth',
  'prod_Tvm1sVN7zuCb2R': 'msp-power',
};

// Add-on product IDs
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

const ALL_VANGUARD_PRODUCTS = new Set([
  ...Object.keys(PRODUCT_TO_TIER),
  ...Object.keys(ADDON_PRODUCTS),
]);

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

    // Check for admin override in database first
    const { data: dbSub } = await supabaseClient
      .from('vanguard_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (dbSub?.admin_override) {
      logStep("Admin override found", { tier: dbSub.tier, seats: dbSub.seat_count });
      return new Response(JSON.stringify({
        subscribed: true,
        tier: dbSub.tier,
        seat_count: dbSub.seat_count,
        addons: dbSub.addons || [],
        subscription_end: dbSub.current_period_end,
        admin_override: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check Stripe for active subscriptions
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({
        subscribed: false,
        tier: 'free',
        seat_count: 0,
        addons: [],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get ALL active subscriptions (user may have base plan + add-ons in one subscription)
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 10,
    });

    // Find the Vanguard subscription (contains a base plan product)
    let vanguardSub: Stripe.Subscription | null = null;
    let tier = 'free';
    let seatCount = 0;
    const activeAddons: string[] = [];

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

    if (!vanguardSub) {
      logStep("No active Vanguard subscription found");
      return new Response(JSON.stringify({
        subscribed: false,
        tier: 'free',
        seat_count: 0,
        addons: [],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscriptionEnd = new Date(vanguardSub.current_period_end * 1000).toISOString();
    logStep("Active Vanguard subscription found", {
      subscriptionId: vanguardSub.id,
      tier,
      seats: seatCount,
      addons: activeAddons,
      endDate: subscriptionEnd,
    });

    // Cache to database
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
      }, { onConflict: 'user_id' });

    return new Response(JSON.stringify({
      subscribed: true,
      tier,
      seat_count: seatCount,
      addons: activeAddons,
      subscription_end: subscriptionEnd,
      stripe_subscription_id: vanguardSub.id,
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
