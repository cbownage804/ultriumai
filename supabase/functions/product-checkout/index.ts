import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Product price mappings
const PRODUCTS: Record<string, { priceId: string; name: string; unit: string }> = {
  safescan: {
    priceId: "price_1SpENWH1u6E0bsJT76DbLmN1",
    name: "SafeScan™",
    unit: "org",
  },
  safepass: {
    priceId: "price_1SpENYH1u6E0bsJTQ6kMhSWd",
    name: "SafePass™",
    unit: "user",
  },
  rmm: {
    priceId: "price_1SpENbH1u6E0bsJT6p9Bvwgx",
    name: "RMM™",
    unit: "endpoint",
  },
  helpdesk: {
    priceId: "price_1SpENcH1u6E0bsJT5xuOIwvt",
    name: "Helpdesk™",
    unit: "agent",
  },
  safenet: {
    priceId: "price_1SpENeH1u6E0bsJTpgoWENVc",
    name: "SafeNet™",
    unit: "device",
  },
  safeweb: {
    priceId: "price_1SpENfH1u6E0bsJTfR422qT4",
    name: "SafeWeb™",
    unit: "user",
  },
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[PRODUCT-CHECKOUT] ${step}${detailsStr}`);
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
    const { productId, quantity = 1, billingInterval = "monthly" } = await req.json();
    logStep("Request parsed", { productId, quantity, billingInterval });

    // Validate product
    const product = PRODUCTS[productId];
    if (!product) {
      throw new Error(`Invalid product ID: ${productId}`);
    }
    logStep("Product validated", { product: product.name });

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    let userEmail: string | undefined;
    let customerId: string | undefined;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      if (userData.user?.email) {
        userEmail = userData.user.email;
        logStep("User authenticated", { email: userEmail });
      }
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check for existing Stripe customer
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Found existing customer", { customerId });
      }
    }

    const origin = req.headers.get("origin") || "https://ultriumai.lovable.app";

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [
        {
          price: product.priceId,
          quantity: quantity,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/payment/success?product=${productId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/portfolio?canceled=true`,
      subscription_data: {
        metadata: {
          product_id: productId,
          product_name: product.name,
          quantity: quantity.toString(),
          billing_interval: billingInterval,
        },
      },
      metadata: {
        product_id: productId,
        product_name: product.name,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

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
