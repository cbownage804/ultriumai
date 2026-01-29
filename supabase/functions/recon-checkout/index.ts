import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Recon pricing configuration - Stripe IDs
const HARDWARE_PRICES: Record<string, { amount: number; priceId: string }> = {
  lite: { amount: 29900, priceId: "price_1Sv04PH1u6E0bsJTexlWShH7" },   // $299
  pro: { amount: 49900, priceId: "price_1Sv04QH1u6E0bsJTnsRt9rzA" },    // $499
};

const SUBSCRIPTION_PRICES: Record<string, { monthly: number; priceId: string }> = {
  essential: { monthly: 2900, priceId: "price_1Sv04SH1u6E0bsJTtYePwpO7" },
  professional: { monthly: 4900, priceId: "price_1Sv04UH1u6E0bsJTeiWRFrsf" },
  enterprise: { monthly: 9900, priceId: "price_1Sv04VH1u6E0bsJTwblFcd66" },
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[RECON-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Parse request body
    const { 
      hardwareTier, 
      subscriptionTier, 
      customerName, 
      customerEmail, 
      customerPhone,
      shippingAddress 
    } = await req.json();

    logStep("Request parsed", { hardwareTier, subscriptionTier, customerEmail });

    // Validate tiers
    if (!HARDWARE_PRICES[hardwareTier]) {
      throw new Error(`Invalid hardware tier: ${hardwareTier}`);
    }
    const hardwareConfig = HARDWARE_PRICES[hardwareTier];
    if (!SUBSCRIPTION_PRICES[subscriptionTier]) {
      throw new Error(`Invalid subscription tier: ${subscriptionTier}`);
    }

    // Get user from auth header (optional - guest checkout allowed)
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      if (userData.user) {
        userId = userData.user.id;
        logStep("User authenticated", { userId });
      }
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check for existing Stripe customer
    let customerId: string | undefined;
    const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    const origin = req.headers.get("origin") || "https://ultriumai.lovable.app";
    const hardwareConfig = HARDWARE_PRICES[hardwareTier];
    const subscriptionConfig = SUBSCRIPTION_PRICES[subscriptionTier];

    // Create checkout session with hardware (one-time) using real Stripe price IDs
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      line_items: [
        // Hardware (one-time payment) - using real Stripe price ID
        {
          price: hardwareConfig.priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/vanguard/recon/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/vanguard/recon/checkout?hardware=${hardwareTier}&subscription=${subscriptionTier}&canceled=true`,
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB", "AU"],
      },
      metadata: {
        hardware_tier: hardwareTier,
        subscription_tier: subscriptionTier,
        subscription_price_id: subscriptionConfig.priceId,
        customer_name: customerName,
        customer_phone: customerPhone || "",
        user_id: userId || "",
        shipping_address: JSON.stringify(shippingAddress),
      },
    });

    logStep("Checkout session created", { sessionId: session.id });

    // Create order record in database
    if (userId) {
      const { error: orderError } = await supabaseClient
        .from("recon_orders")
        .insert({
          user_id: userId,
          order_status: "pending",
          hardware_tier: hardwareTier,
          subscription_tier: subscriptionTier,
          quantity: 1,
          unit_price_cents: hardwareConfig.amount,
          subscription_price_cents: subscriptionConfig.monthly,
          shipping_address: shippingAddress,
          customer_email: customerEmail,
          customer_name: customerName,
          customer_phone: customerPhone,
          stripe_checkout_session: session.id,
        });

      if (orderError) {
        logStep("Warning: Failed to create order record", { error: orderError.message });
      } else {
        logStep("Order record created");
      }
    }

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
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
