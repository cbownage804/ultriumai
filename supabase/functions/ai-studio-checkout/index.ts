import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Stripe Product IDs for AI Studio plans
const AI_STUDIO_PRODUCTS = {
  basic: "prod_TzZJTYRaWGzhu2",
  pro: "prod_TzZJLMfnYLLhS9",
} as const;

// Credit tier pricing (in cents) - must match CREDIT_TIERS in aiStudioCredits.ts
const CREDIT_TIER_PRICING: Record<string, { credits: number; monthlyPrice: number; annualPrice: number }[]> = {
  basic: [
    { credits: 100, monthlyPrice: 2500, annualPrice: 20000 },
    { credits: 200, monthlyPrice: 4500, annualPrice: 36000 },
    { credits: 400, monthlyPrice: 7900, annualPrice: 63900 },
    { credits: 800, monthlyPrice: 13900, annualPrice: 111900 },
    { credits: 1200, monthlyPrice: 18900, annualPrice: 151900 },
    { credits: 2000, monthlyPrice: 27900, annualPrice: 223900 },
    { credits: 3000, monthlyPrice: 37900, annualPrice: 303900 },
    { credits: 4000, monthlyPrice: 46900, annualPrice: 375900 },
    { credits: 5000, monthlyPrice: 54900, annualPrice: 439900 },
    { credits: 7500, monthlyPrice: 74900, annualPrice: 599900 },
    { credits: 10000, monthlyPrice: 94900, annualPrice: 759900 },
  ],
  pro: [
    { credits: 100, monthlyPrice: 5000, annualPrice: 40000 },
    { credits: 200, monthlyPrice: 9000, annualPrice: 72000 },
    { credits: 400, monthlyPrice: 15900, annualPrice: 127900 },
    { credits: 800, monthlyPrice: 27900, annualPrice: 223900 },
    { credits: 1200, monthlyPrice: 37900, annualPrice: 303900 },
    { credits: 2000, monthlyPrice: 54900, annualPrice: 439900 },
    { credits: 3000, monthlyPrice: 74900, annualPrice: 599900 },
    { credits: 4000, monthlyPrice: 94900, annualPrice: 759900 },
    { credits: 5000, monthlyPrice: 109900, annualPrice: 879900 },
    { credits: 7500, monthlyPrice: 149900, annualPrice: 1199900 },
    { credits: 10000, monthlyPrice: 189900, annualPrice: 1519900 },
  ],
};

// Credit Pack price IDs (one-time purchases)
const CREDIT_PACK_PRICES: Record<string, { priceId: string; credits: number; name: string }> = {
  small:  { priceId: "price_1T1aAUH1u6E0bsJTlMIOXk7J", credits: 100, name: "100 Credits" },
  medium: { priceId: "price_1T1aAVH1u6E0bsJTkhPh0YMY", credits: 300, name: "300 Credits" },
  large:  { priceId: "price_1T1aAWH1u6E0bsJT2YBT1aRQ", credits: 750, name: "750 Credits" },
  mega:   { priceId: "price_1T1aAXH1u6E0bsJT6GkPZLnn", credits: 2000, name: "2,000 Credits" },
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

    const body = await req.json().catch(() => ({}));
    const planId: string | null = body?.plan_id ?? body?.planId ?? null;
    const credits: number | null = body?.credits ?? null;
    const billingInterval: string = body?.billing_interval ?? 'monthly';
    const creditPack: string | null = body?.credit_pack ?? null;
    logStep("Request body", { planId, credits, billingInterval, creditPack });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    }

    const origin = req.headers.get("origin") || "https://ultriumai.lovable.app";
    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let mode: Stripe.Checkout.SessionCreateParams.Mode = "subscription";
    let subscriptionMetadata: Record<string, string> = {};

    // ── CREDIT PACK (one-time purchase) ──
    if (creditPack && CREDIT_PACK_PRICES[creditPack]) {
      const pack = CREDIT_PACK_PRICES[creditPack];
      lineItems.push({ price: pack.priceId, quantity: 1 });
      mode = "payment";
      logStep("Credit pack checkout", { pack: creditPack, credits: pack.credits });
    }
    // ── SUBSCRIPTION PLAN ──
    else if (planId && AI_STUDIO_PRODUCTS[planId as keyof typeof AI_STUDIO_PRODUCTS]) {
      const productId = AI_STUDIO_PRODUCTS[planId as keyof typeof AI_STUDIO_PRODUCTS];
      const tiers = CREDIT_TIER_PRICING[planId];
      
      if (!tiers) throw new Error(`Invalid plan: ${planId}`);
      
      // Find the matching tier by credits
      const tier = tiers.find(t => t.credits === credits);
      if (!tier) throw new Error(`Invalid credit amount ${credits} for plan ${planId}`);

      const isAnnual = billingInterval === 'annual';
      const unitAmount = isAnnual ? tier.annualPrice : tier.monthlyPrice;
      const interval = isAnnual ? 'year' : 'month';

      lineItems.push({
        price_data: {
          currency: 'usd',
          product: productId,
          unit_amount: unitAmount,
          recurring: { interval },
        },
        quantity: 1,
      });

      subscriptionMetadata = {
        user_id: user.id,
        product: 'ai_studio',
        plan_id: planId,
        credits: String(tier.credits),
        billing_interval: billingInterval,
      };

      logStep("Subscription checkout", { planId, credits: tier.credits, amount: unitAmount, interval });
    } else {
      throw new Error("No valid plan or credit pack specified");
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: lineItems,
      mode,
      success_url: `${origin}/ai-studio?checkout=success&plan=${planId || creditPack}`,
      cancel_url: `${origin}/pricing/ai-studio?checkout=cancelled`,
      metadata: {
        user_id: user.id,
        product: 'ai_studio',
        plan_id: planId || null,
        credit_pack: creditPack || null,
        credits: credits ? String(credits) : null,
      },
    };

    if (mode === "subscription") {
      sessionParams.subscription_data = { metadata: subscriptionMetadata };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
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
