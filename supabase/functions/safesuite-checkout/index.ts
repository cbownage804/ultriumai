import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// SafeSuite tier price IDs
const TIER_PRICES = {
  pro: {
    monthly: "price_1SrTegH1u6E0bsJTKpGm5qxr",
    yearly: "price_1SrTeiH1u6E0bsJTarTH7ajs"
  },
  business: {
    monthly: "price_1SrTejH1u6E0bsJTwd4K8st5",
    yearly: "price_1SrTelH1u6E0bsJTmep4lSIP"
  },
  enterprise: {
    monthly: "price_1SuesEH1u6E0bsJT6o2Hxp0T",
    yearly: "price_1SuesEH1u6E0bsJT6o2Hxp0T" // No live yearly price yet; falls back to monthly
  }
};

// Real SafeSuite product IDs (looked up from live Stripe) for upgrade detection
const SAFESUITE_PRODUCT_IDS = [
  "prod_Tp7uzqASD23WKz", // Pro monthly
  "prod_Tp7uGQiqO9MvZo", // Pro yearly
  "prod_Tp7u0hIR2UlTr1", // Business monthly
  "prod_Tp7uUCb3bDPasl", // Business yearly
  "prod_TsPhrnVrS2CTEI"  // Enterprise monthly
];

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SAFESUITE-CHECKOUT] ${step}${detailsStr}`);
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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const body = await req.json();
    const { tier, billing } = body;
    
    if (!tier || !['pro', 'business'].includes(tier)) {
      throw new Error("Invalid tier specified");
    }
    
    const billingCycle = billing === 'yearly' ? 'yearly' : 'monthly';
    const priceId = TIER_PRICES[tier as keyof typeof TIER_PRICES][billingCycle];
    
    logStep("Processing checkout request", { tier, billingCycle, priceId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Check if customer already exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
      
      // Check for existing SafeSuite subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 10,
      });
      
      // Find any existing SafeSuite subscription
      const existingSafesuiteSubItem = subscriptions.data.find(sub => {
        return sub.items.data.some(item => {
          const productId = typeof item.price.product === 'string' 
            ? item.price.product 
            : item.price.product?.id;
          return SAFESUITE_PRODUCT_IDS.includes(productId || '');
        });
      });
      
      if (existingSafesuiteSubItem) {
        logStep("Found existing SafeSuite subscription, upgrading instead of creating new", {
          subscriptionId: existingSafesuiteSubItem.id,
          currentTier: existingSafesuiteSubItem.metadata?.tier
        });
        
        // Get the subscription item to update
        const itemToUpdate = existingSafesuiteSubItem.items.data.find(item => {
          const productId = typeof item.price.product === 'string' 
            ? item.price.product 
            : item.price.product?.id;
          return SAFESUITE_PRODUCT_IDS.includes(productId || '');
        });
        
        if (itemToUpdate) {
          // Update the existing subscription to the new price
          await stripe.subscriptions.update(existingSafesuiteSubItem.id, {
            items: [
              {
                id: itemToUpdate.id,
                price: priceId,
              }
            ],
            metadata: {
              user_id: user.id,
              tier: tier,
              product: 'safesuite'
            },
            proration_behavior: 'create_prorations', // Prorate the difference
          });
          
          logStep("Subscription upgraded successfully", { 
            subscriptionId: existingSafesuiteSubItem.id,
            newTier: tier,
            newPriceId: priceId
          });
          
          // Return success without redirect - subscription updated directly
          const origin = req.headers.get("origin") || "https://ultriumai.lovable.app";
          return new Response(JSON.stringify({ 
            success: true,
            upgraded: true,
            message: `Successfully upgraded to SafeSuite ${tier.charAt(0).toUpperCase() + tier.slice(1)}`,
            redirectUrl: `${origin}/safesuite/billing?upgraded=true&tier=${tier}`
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }
    }

    // No existing SafeSuite subscription - create new checkout session
    const origin = req.headers.get("origin") || "https://ultriumai.lovable.app";
    
    logStep("Creating new checkout session", { tier, billingCycle, priceId });
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/safesuite/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/safesuite/billing?canceled=true`,
      metadata: {
        user_id: user.id,
        tier: tier,
        billing_cycle: billingCycle,
        product: 'safesuite'
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          tier: tier,
          product: 'safesuite'
        }
      }
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
