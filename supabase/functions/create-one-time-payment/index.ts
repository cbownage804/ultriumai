import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-ONE-TIME-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { planId, metadata, successUrl, cancelUrl } = await req.json();
    logStep("Request data received", { planId, successUrl, cancelUrl });

    // Get pricing plan details
    const { data: plan, error: planError } = await supabaseClient
      .from('pricing_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      throw new Error("Pricing plan not found");
    }
    logStep("Pricing plan found", { planName: plan.name, price: plan.monthly_price });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      });
      customerId = customer.id;
      logStep("New customer created", { customerId });
    }

    // Calculate total amount (including onboarding fee if applicable)
    const baseAmount = plan.monthly_price * 100; // Convert to cents
    const onboardingFee = plan.onboarding_fee ? plan.onboarding_fee * 100 : 0;
    const totalAmount = baseAmount + onboardingFee;

    // Create Stripe checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${plan.name} Plan Setup`,
              description: `One-time setup for ${plan.name} plan${onboardingFee ? ` (includes $${plan.onboarding_fee} setup fee)` : ''}`,
            },
            unit_amount: totalAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl || `${req.headers.get("origin")}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=onetime`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/payment/cancel?type=onetime`,
      metadata: {
        user_id: user.id,
        plan_id: planId,
        payment_type: 'onetime_setup',
        ...metadata,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Create record in one_time_payments table
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    await supabaseService.from("one_time_payments").insert({
      user_id: user.id,
      stripe_session_id: session.id,
      product_name: `${plan.name} Plan Setup`,
      amount: totalAmount,
      currency: "usd",
      payment_type: "plan_setup",
      status: "pending",
      metadata: {
        plan_id: planId,
        plan_name: plan.name,
        base_amount: baseAmount,
        onboarding_fee: onboardingFee,
      },
    });

    logStep("Payment record created in database");

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-one-time-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});