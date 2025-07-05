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
    
    const { planType, interval } = await req.json();
    logStep("Request data", { planType, interval });

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
      logStep("No existing customer found");
    }

    // Define pricing for solutions
    const pricing = {
      // Main platform plans
      premium: {
        monthly: 10000, // $100.00
        yearly: 100000 // $1,000.00 (2 months free)
      },
      enterprise: {
        monthly: 50000, // $500.00
        yearly: 500000 // $5,000.00 (2 months free)
      },
      // Standalone solutions
      "ai-knowledge": {
        monthly: 10000, // $100.00
        yearly: 100000 // $1,000.00 (2 months free)
      },
      "basic-security": {
        monthly: 10000, // $100.00
        yearly: 100000 // $1,000.00 (2 months free)
      },
      "custom-chatbot": {
        monthly: 50000, // $500.00
        yearly: 500000 // $5,000.00 (2 months free)
      },
      "white-label": {
        monthly: 50000, // $500.00
        yearly: 500000 // $5,000.00 (2 months free)
      },
      "security-knowledge": {
        monthly: 10000, // $100.00
        yearly: 100000 // $1,000.00 (2 months free)
      },
      "security-apps": {
        monthly: 50000, // $500.00
        yearly: 500000 // $5,000.00 (2 months free)
      },
      "security-portal": {
        monthly: 50000, // $500.00
        yearly: 500000 // $5,000.00 (2 months free)
      }
    };

    // Define product names
    const productNames = {
      premium: "UltriumGPT Premium Plan",
      enterprise: "UltriumGPT Enterprise Plan",
      "ai-knowledge": "AI Knowledge Assistant",
      "basic-security": "Basic Security Scanning",
      "custom-chatbot": "Custom Business Chatbot",
      "white-label": "White-Label AI Platform",
      "security-knowledge": "Security Knowledge Base",
      "security-apps": "Security Apps Suite",
      "security-portal": "Client Security Portal"
    };

    const priceAmount = pricing[planType as keyof typeof pricing][interval as keyof typeof pricing.premium];
    logStep("Price calculated", { planType, interval, priceAmount });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: productNames[planType as keyof typeof productNames] || `UltriumGPT ${planType}`,
              description: `${productNames[planType as keyof typeof productNames] || planType} - ${interval} billing`
            },
            unit_amount: priceAmount,
            recurring: { interval: interval === "yearly" ? "year" : "month" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/pricing`,
      metadata: {
        user_id: user.id,
        plan_type: planType,
        interval: interval
      }
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
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