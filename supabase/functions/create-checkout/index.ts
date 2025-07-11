import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
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
    logStep("Function started");
    
    const { priceId, planType, successUrl, cancelUrl } = await req.json();
    logStep("Request data", { priceId, planType, successUrl, cancelUrl });

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2023-10-16" });
    
    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id }
      });
      customerId = customer.id;
      logStep("Created new customer", { customerId });
    }

    // Define price IDs for your plans - you'll need to create these in Stripe Dashboard
    const priceIds = {
      starter: {
        monthly: priceId || "price_starter_monthly", // Replace with actual Stripe price ID
        yearly: priceId || "price_starter_yearly"
      },
      professional: {
        monthly: priceId || "price_professional_monthly", // Replace with actual Stripe price ID  
        yearly: priceId || "price_professional_yearly"
      },
      enterprise: {
        monthly: priceId || "price_enterprise_monthly", // Replace with actual Stripe price ID
        yearly: priceId || "price_enterprise_yearly"
      }
    };

    let selectedPriceId = priceId;
    
    // If no priceId provided, create price on the fly
    if (!priceId && planType) {
      const planPricing = {
        starter: { amount: 1900, name: "UltriumAI Starter" }, // $19/month
        professional: { amount: 9900, name: "UltriumAI Professional" }, // $99/month
        enterprise: { amount: 29900, name: "UltriumAI Enterprise" } // $299/month
      };

      const plan = planPricing[planType as keyof typeof planPricing];
      if (plan) {
        const price = await stripe.prices.create({
          currency: 'usd',
          unit_amount: plan.amount,
          recurring: { interval: 'month' },
          product_data: {
            name: plan.name,
            description: `${plan.name} Plan - Monthly subscription`
          }
        });
        selectedPriceId = price.id;
        logStep("Created price on the fly", { planType, priceId: selectedPriceId });
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: selectedPriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl || `${req.headers.get("origin")}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/pricing`,
      metadata: {
        userId: user.id,
        planType: planType || 'unknown'
      }
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});