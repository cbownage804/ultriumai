import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ORG-CHECKOUT] ${step}${detailsStr}`);
};

// Per-seat price IDs for org licenses
const ORG_LICENSE_PRICES: Record<string, Record<string, string>> = {
  safesuite: {
    pro: "price_1SycwFH1u6E0bsJTVQNxOlTu",
    business: "price_1SycwFH1u6E0bsJT3wOeNGqE",
    enterprise: "price_1SycwGH1u6E0bsJTkJJgRQG7",
  },
  ai_studio: {
    pro: "price_1SycwIH1u6E0bsJTiBQVNl09",
    business: "price_1SycwJH1u6E0bsJTkHd2vJ2D",
    enterprise: "price_1SycwKH1u6E0bsJTrdbzttpP",
  },
  vanguard: {
    pro: "price_1SycwLH1u6E0bsJTcCfKErNG",
    business: "price_1SycwMH1u6E0bsJTZ64sE3Lg",
    enterprise: "price_1SycwNH1u6E0bsJTWWIEkxUf",
  },
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

    const { product, accessLevel, seats, organizationId } = await req.json();
    logStep("Request data", { product, accessLevel, seats, organizationId });

    if (!product || !accessLevel || !seats || !organizationId) {
      throw new Error("Missing required fields: product, accessLevel, seats, organizationId");
    }

    // Authenticate user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get the price ID
    const priceId = ORG_LICENSE_PRICES[product]?.[accessLevel];
    if (!priceId) {
      throw new Error(`Invalid product/access level combination: ${product}/${accessLevel}`);
    }
    logStep("Price resolved", { priceId });

    // Init Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id, organizationId },
      });
      customerId = customer.id;
      logStep("Created new customer", { customerId });
    }

    // Create checkout session with per-seat quantity
    const origin = req.headers.get("origin") || "https://ultriumai.lovable.app";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: seats,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/organization?checkout=success&product=${product}&level=${accessLevel}&seats=${seats}`,
      cancel_url: `${origin}/organization?checkout=cancelled`,
      metadata: {
        userId: user.id,
        organizationId,
        product,
        accessLevel,
        seats: String(seats),
        type: "org_license",
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          organizationId,
          product,
          accessLevel,
          seats: String(seats),
          type: "org_license",
        },
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // After successful checkout, we'll provision the license via the success page
    // (or webhook if configured)

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
