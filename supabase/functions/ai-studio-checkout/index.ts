import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Fixed Stripe Price IDs for AI Studio subscription tiers
// Structure: PLAN_PRICES[planId][credits][interval]
const PLAN_PRICES: Record<string, Record<number, { monthly: string; annual: string }>> = {
  basic: {
    100:   { monthly: 'price_1T1aKwH1u6E0bsJTN17222wy', annual: 'price_1T1aLBH1u6E0bsJTjMxRuUtN' },
    200:   { monthly: 'price_1T1aKxH1u6E0bsJT3NpuCqR8', annual: 'price_1T1aLCH1u6E0bsJTQ5uCmG6k' },
    400:   { monthly: 'price_1T1aKyH1u6E0bsJT4BWLFzE1', annual: 'price_1T1aLDH1u6E0bsJTJFy1JwcR' },
    800:   { monthly: 'price_1T1aKzH1u6E0bsJTKhNFMSKu', annual: 'price_1T1aLEH1u6E0bsJTvTpa3CRJ' },
    1200:  { monthly: 'price_1T1aL0H1u6E0bsJTBSASRJ0q', annual: 'price_1T1aLFH1u6E0bsJTLHDLRsHj' },
    2000:  { monthly: 'price_1T1aL2H1u6E0bsJT1SUgGkku', annual: 'price_1T1aLGH1u6E0bsJT6064ZrIO' },
    3000:  { monthly: 'price_1T1aL2H1u6E0bsJTCf8qMQBo', annual: 'price_1T1aLHH1u6E0bsJTvdmGNI5m' },
    4000:  { monthly: 'price_1T1aL3H1u6E0bsJTJX4xmzMt', annual: 'price_1T1aLIH1u6E0bsJTVTNXnYGm' },
    5000:  { monthly: 'price_1T1aL4H1u6E0bsJTIEQ3YK2t', annual: 'price_1T1aLJH1u6E0bsJTSAOKu58n' },
    7500:  { monthly: 'price_1T1aL6H1u6E0bsJTO8yBZe8E', annual: 'price_1T1aLKH1u6E0bsJTVpzhUDnm' },
    10000: { monthly: 'price_1T1aL6H1u6E0bsJTiXBrMmPI', annual: 'price_1T1aLLH1u6E0bsJThmbV8AUB' },
  },
  pro: {
    100:   { monthly: 'price_1T1aLPH1u6E0bsJTqfFONEkx', annual: 'price_1T1aLdH1u6E0bsJTykIrwE8X' },
    200:   { monthly: 'price_1T1aLQH1u6E0bsJTojNtgdik', annual: 'price_1T1aLeH1u6E0bsJT1SHM5X6f' },
    400:   { monthly: 'price_1T1aLRH1u6E0bsJTuv01TVk6', annual: 'price_1T1aLfH1u6E0bsJTCNIErKK6' },
    800:   { monthly: 'price_1T1aLSH1u6E0bsJTc7DCy02X', annual: 'price_1T1aLgH1u6E0bsJTNxDNatS6' },
    1200:  { monthly: 'price_1T1aLTH1u6E0bsJTS5uHZ2rW', annual: 'price_1T1aLhH1u6E0bsJTikQVDvmk' },
    2000:  { monthly: 'price_1T1aLUH1u6E0bsJT0GACM9Kp', annual: 'price_1T1aLiH1u6E0bsJTbfXV8qx0' },
    3000:  { monthly: 'price_1T1aLVH1u6E0bsJTs088aQQa', annual: 'price_1T1aLjH1u6E0bsJT6n878gYl' },
    4000:  { monthly: 'price_1T1aLWH1u6E0bsJTwFnq6UG0', annual: 'price_1T1aLkH1u6E0bsJTQlN2wg7Y' },
    5000:  { monthly: 'price_1T1aLXH1u6E0bsJTVC5iksmz', annual: 'price_1T1aLlH1u6E0bsJTHxqXP8Om' },
    7500:  { monthly: 'price_1T1aLYH1u6E0bsJTkkZqNuby', annual: 'price_1T1aLmH1u6E0bsJTuDMa6uyV' },
    10000: { monthly: 'price_1T1aLZH1u6E0bsJTRUqqHkOr', annual: 'price_1T1aLnH1u6E0bsJTHHc29LLY' },
  },
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
    let priceId: string;
    let mode: Stripe.Checkout.SessionCreateParams.Mode = "subscription";
    let subscriptionMetadata: Record<string, string> = {};

    // ── CREDIT PACK (one-time purchase) ──
    if (creditPack && CREDIT_PACK_PRICES[creditPack]) {
      const pack = CREDIT_PACK_PRICES[creditPack];
      priceId = pack.priceId;
      mode = "payment";
      logStep("Credit pack checkout", { pack: creditPack, credits: pack.credits });
    }
    // ── SUBSCRIPTION PLAN ──
    else if (planId && PLAN_PRICES[planId] && credits) {
      const tierPrices = PLAN_PRICES[planId][credits];
      if (!tierPrices) throw new Error(`Invalid credit amount ${credits} for plan ${planId}`);

      const isAnnual = billingInterval === 'annual';
      priceId = isAnnual ? tierPrices.annual : tierPrices.monthly;

      subscriptionMetadata = {
        user_id: user.id,
        product: 'ai_studio',
        plan_id: planId,
        credits: String(credits),
        billing_interval: billingInterval,
      };

      logStep("Subscription checkout", { planId, credits, priceId, interval: billingInterval });
    } else {
      throw new Error("No valid plan or credit pack specified");
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
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
