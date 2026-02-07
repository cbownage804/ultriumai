import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Per-technician plans (canonical pricing, $20 less than Atera)
const PLAN_PRICES: Record<string, { price_id: string; product_id: string; name: string }> = {
  // IT Department Plans
  'it-professional': { price_id: 'price_1SxuTIH1u6E0bsJTmXs4WsZF', product_id: 'prod_Tvm1tGkEFFA8xx', name: 'IT Professional' },
  'it-expert':       { price_id: 'price_1SxuTKH1u6E0bsJTokP26ceC', product_id: 'prod_Tvm1v7saOMFPLn', name: 'IT Expert' },
  'it-master':       { price_id: 'price_1SxuTMH1u6E0bsJTBvbwyyMK', product_id: 'prod_Tvm1N7n2bkJpMd', name: 'IT Master' },
  // MSP Plans
  'msp-pro':         { price_id: 'price_1SxuTOH1u6E0bsJTaXDSWla4', product_id: 'prod_Tvm1aJEZ4WXQJN', name: 'MSP Pro' },
  'msp-growth':      { price_id: 'price_1SxuTPH1u6E0bsJT5E9UzVhs', product_id: 'prod_Tvm1Wp6LRat7DV', name: 'MSP Growth' },
  'msp-power':       { price_id: 'price_1SxuTQH1u6E0bsJTsfAgrdLQ', product_id: 'prod_Tvm1sVN7zuCb2R', name: 'MSP Power' },
};

// Module add-on prices (per-user/mo)
const ADDON_PRICES: Record<string, { price_id: string; product_id: string; name: string }> = {
  'pursuit-xdr':     { price_id: 'price_1SxuTUH1u6E0bsJTMPO2csv9', product_id: 'prod_Tvm15XS4URJYDf', name: 'Pursuit XDR' },
  'sentinel-saas':   { price_id: 'price_1SxuTWH1u6E0bsJTK6myzbhu', product_id: 'prod_Tvm14lHuxDHOyk', name: 'Sentinel SaaS' },
  'recon-pentest':   { price_id: 'price_1SxuTXH1u6E0bsJTm68uN9GV', product_id: 'prod_Tvm1Bv6Y169hG6', name: 'Recon Pentest' },
  'cortex-ai':       { price_id: 'price_1SxuTZH1u6E0bsJT2NEiuN4K', product_id: 'prod_Tvm1lPWrLHU5BG', name: 'Cortex AI' },
  'comply':          { price_id: 'price_1SxuTaH1u6E0bsJT5NSVONG8', product_id: 'prod_Tvm1BCKLECzk9L', name: 'Comply' },
  'cross-client-soc':{ price_id: 'price_1SxuTcH1u6E0bsJTDDJsq086', product_id: 'prod_Tvm1pOuwM3afS1', name: 'Cross-Client SOC' },
  'atlas-docs':      { price_id: 'price_1SxuTdH1u6E0bsJTScVKEytG', product_id: 'prod_Tvm1IMy0GKTI7u', name: 'Atlas Docs' },
  
  'ai-copilot':      { price_id: 'price_1SxuTgH1u6E0bsJTKV8J0qSR', product_id: 'prod_Tvm1CcIDVjRGaW', name: 'AI Copilot' },
  'network-discovery':{ price_id: 'price_1SxuTiH1u6E0bsJTRwQiRkcm', product_id: 'prod_Tvm19bNlVCzSw2', name: 'Network Discovery' },
};

// One-time onboarding fee
const ONBOARDING_FEE = {
  price_id: "price_1SpE8dH1u6E0bsJTYxsepk7j",
  product_id: "prod_TmnkZrDfs3mQ4T",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VANGUARD-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { planId, seats = 1, addons = [], includeOnboarding = true } = await req.json();

    const plan = PLAN_PRICES[planId];
    if (!plan) throw new Error(`Invalid plan: ${planId}`);

    const seatCount = Math.max(1, parseInt(seats) || 1);
    logStep("Checkout request", { planId, seats: seatCount, addons, includeOnboarding });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    // Build line items: base plan
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price: plan.price_id, quantity: seatCount },
    ];

    // Add selected module add-ons (per-user quantity)
    for (const addonId of addons) {
      const addon = ADDON_PRICES[addonId];
      if (addon) {
        lineItems.push({ price: addon.price_id, quantity: seatCount });
        logStep("Adding addon", { addonId, name: addon.name });
      }
    }

    // Add one-time onboarding fee
    if (includeOnboarding) {
      lineItems.push({ price: ONBOARDING_FEE.price_id, quantity: 1 });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: lineItems,
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/vanguard/app/dashboard?subscription=success`,
      cancel_url: `${req.headers.get("origin")}/vanguard/pricing?subscription=canceled`,
      metadata: {
        user_id: user.id,
        plan_id: planId,
        seats: seatCount.toString(),
        addons: JSON.stringify(addons),
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_id: planId,
          seats: seatCount.toString(),
          addons: JSON.stringify(addons),
        },
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
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
