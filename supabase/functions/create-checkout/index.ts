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
    
    // Define minimum users
    const minimumUsers = 5;
    
    const { planType, interval, userCount = minimumUsers } = await req.json();
    logStep("Request data", { planType, interval, userCount });

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

    // Define per-user pricing with 5 user minimum
    const pricingPerUser = {
      // Premium solutions: $20/user/month (min 5 users = $100/month)
      "ai-knowledge": { monthly: 2000, yearly: 20000 }, // $20/user, $200/user/year (2 months free)
      "basic-security": { monthly: 2000, yearly: 20000 },
      "security-knowledge": { monthly: 2000, yearly: 20000 },
      
      // Enterprise solutions: $35/user/month (min 5 users = $175/month)
      "custom-chatbot": { monthly: 3500, yearly: 35000 }, // $35/user, $350/user/year (2 months free)
      "white-label": { monthly: 3500, yearly: 35000 },
      "security-apps": { monthly: 3500, yearly: 35000 },
      "security-portal": { monthly: 3500, yearly: 35000 },
      
      // True Enterprise solutions: $50-100/user/month
      "enterprise-ai": { monthly: 5000, yearly: 50000 }, // $50/user, $500/user/year (2 months free)
      "enterprise-security": { monthly: 9000, yearly: 90000 }, // $90/user, $900/user/year (2 months free)
      "custom-enterprise": { monthly: 10000, yearly: 100000 }, // $100/user, $1000/user/year (2 months free)
      
      // Main platform plans (keep existing)
      "premium": { monthly: 10000, yearly: 100000 },
      "enterprise": { monthly: 50000, yearly: 500000 },
      
      // IT solutions
      "it-documentation": { monthly: 2000, yearly: 20000 }
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
      "security-portal": "Client Security Portal",
      "it-documentation": "IT Documentation Hub",
      "enterprise-ai": "Enterprise AI Command Center",
      "enterprise-security": "Enterprise Security Intelligence",
      "custom-enterprise": "Custom Enterprise Platform"
    };

    const pricePerUser = pricingPerUser[planType as keyof typeof pricingPerUser][interval as keyof typeof pricingPerUser["ai-knowledge"]];
    const totalUsers = Math.max(userCount, minimumUsers);
    const totalAmount = pricePerUser * totalUsers;
    
    logStep("Price calculated", { planType, interval, userCount: totalUsers, pricePerUser, totalAmount });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: productNames[planType as keyof typeof productNames] || `UltriumGPT ${planType}`,
              description: `${productNames[planType as keyof typeof productNames] || planType} - ${totalUsers} users - ${interval} billing`
            },
            unit_amount: totalAmount,
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
        interval: interval,
        user_count: totalUsers
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