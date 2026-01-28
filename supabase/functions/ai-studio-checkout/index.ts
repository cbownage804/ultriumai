import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// AI Studio Plan Price IDs - These should be created in Stripe
const PLAN_PRICES: Record<string, { priceId: string; name: string }> = {
  // MSP Plans
  msp_starter: { priceId: "price_ai_studio_msp_starter", name: "AI Studio MSP Starter" },
  msp_pro: { priceId: "price_ai_studio_msp_pro", name: "AI Studio MSP Pro" },
  msp_elite: { priceId: "price_ai_studio_msp_elite", name: "AI Studio MSP Elite" },
  // Team Plans
  team_basic: { priceId: "price_ai_studio_team_basic", name: "AI Studio Team Basic" },
  team_plus: { priceId: "price_ai_studio_team_plus", name: "AI Studio Team Plus" },
  // Website Plans
  website_basic: { priceId: "price_ai_studio_website_basic", name: "AI Studio Website Basic" },
  website_pro: { priceId: "price_ai_studio_website_pro", name: "AI Studio Website Pro" },
  // Legacy plan IDs (keep for backwards compatibility)
  creator: { priceId: "price_ai_studio_creator", name: "AI Studio Creator" },
  professional: { priceId: "price_ai_studio_professional", name: "AI Studio Professional" },
  agency: { priceId: "price_ai_studio_agency", name: "AI Studio Agency" },
};

// Usage Add-on Price IDs
const ADDON_PRICES: Record<string, { priceId: string; name: string }> = {
  "messages-5k": { priceId: "price_ai_studio_5k_messages", name: "5,000 Extra Messages" },
  "messages-25k": { priceId: "price_ai_studio_25k_messages", name: "25,000 Extra Messages" },
  "apps-5": { priceId: "price_ai_studio_5_apps", name: "5 Extra Apps" },
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AI-STUDIO-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { planId, addonId } = await req.json();
    logStep("Request body parsed", { planId, addonId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    }

    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let mode: Stripe.Checkout.SessionCreateParams.Mode = "subscription";

    // Handle plan subscription
    if (planId && PLAN_PRICES[planId]) {
      lineItems.push({
        price: PLAN_PRICES[planId].priceId,
        quantity: 1,
      });
      mode = "subscription";
      logStep("Adding subscription item", { planId, priceId: PLAN_PRICES[planId].priceId });
    }

    // Handle addon purchase
    if (addonId && ADDON_PRICES[addonId]) {
      lineItems.push({
        price: ADDON_PRICES[addonId].priceId,
        quantity: 1,
      });
      mode = "payment"; // Addons are one-time purchases
      logStep("Adding addon item", { addonId, priceId: ADDON_PRICES[addonId].priceId });
    }

    if (lineItems.length === 0) {
      throw new Error("No valid plan or addon specified");
    }

    const origin = req.headers.get("origin") || "https://ultriumai.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: lineItems,
      mode,
      success_url: `${origin}/ai-studio?checkout=success&plan=${planId || addonId}`,
      cancel_url: `${origin}/ai-studio?checkout=cancelled`,
      metadata: {
        user_id: user.id,
        plan_id: planId || null,
        addon_id: addonId || null,
      },
      subscription_data: mode === "subscription" ? {
        metadata: {
          user_id: user.id,
          plan_id: planId,
        }
      } : undefined,
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in ai-studio-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
