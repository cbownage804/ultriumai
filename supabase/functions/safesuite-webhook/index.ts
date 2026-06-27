import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// SafeSuite price ID to tier mapping (live Stripe IDs)
const PRICE_TO_TIER: Record<string, string> = {
  'price_1SrTegH1u6E0bsJTKpGm5qxr': 'pro',        // Pro monthly
  'price_1SrTeiH1u6E0bsJTarTH7ajs': 'pro',        // Pro yearly
  'price_1SrTejH1u6E0bsJTwd4K8st5': 'business',   // Business monthly
  'price_1SrTelH1u6E0bsJTmep4lSIP': 'business',   // Business yearly
  'price_1SuesEH1u6E0bsJT6o2Hxp0T': 'enterprise', // Enterprise monthly
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SAFESUITE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("No Stripe signature found");

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err.message });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Event verified", { type: event.type, id: event.id });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", { sessionId: session.id, customerId: session.customer });

        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          await handleSubscriptionUpdate(supabaseAdmin, stripe, subscription);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(supabaseAdmin, stripe, subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(supabaseAdmin, stripe, subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          await handleSubscriptionUpdate(supabaseAdmin, stripe, subscription);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment failed", { invoiceId: invoice.id, customerId: invoice.customer });
        // Could send notification or update status
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
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

// Helper to safely convert Unix timestamp to ISO string
function safeTimestampToISO(timestamp: number | null | undefined): string | null {
  if (!timestamp || timestamp <= 0) return null;
  try {
    const date = new Date(timestamp * 1000);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
}

async function handleSubscriptionUpdate(
  supabase: ReturnType<typeof createClient>,
  stripe: Stripe,
  subscription: Stripe.Subscription
) {
  logStep("Processing subscription update", { subscriptionId: subscription.id });

  // Get customer email
  const customer = await stripe.customers.retrieve(subscription.customer as string);
  if (customer.deleted) {
    logStep("Customer deleted, skipping");
    return;
  }

  const email = customer.email;
  if (!email) {
    logStep("No email for customer", { customerId: customer.id });
    return;
  }

  // Find user by email
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    logStep("Error listing users", { error: userError.message });
    return;
  }

  const user = users.users.find(u => u.email === email);
  if (!user) {
    logStep("No user found for email", { email });
    return;
  }

  // Get subscription details with safe date parsing
  const priceId = subscription.items.data[0]?.price.id;
  const tier = PRICE_TO_TIER[priceId] || 'pro';
  const status = subscription.status;
  const currentPeriodEnd = safeTimestampToISO(subscription.current_period_end);
  const currentPeriodStart = safeTimestampToISO(subscription.current_period_start);
  const cancelAtPeriodEnd = subscription.cancel_at_period_end;

  logStep("Subscription details", { 
    userId: user.id, 
    tier, 
    status,
    priceId,
    periodStart: currentPeriodStart,
    periodEnd: currentPeriodEnd
  });

  const upsertData: Record<string, unknown> = {
    user_id: user.id,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customer.id,
    stripe_price_id: priceId,
    tier,
    status: status === 'active' || status === 'trialing' ? 'active' : status,
    cancel_at_period_end: cancelAtPeriodEnd,
    updated_at: new Date().toISOString(),
  };

  // Only add period dates if valid
  if (currentPeriodStart) {
    upsertData.current_period_start = currentPeriodStart;
  }
  if (currentPeriodEnd) {
    upsertData.current_period_end = currentPeriodEnd;
  }

  const { error: upsertError } = await supabase
    .from('safesuite_subscriptions')
    .upsert(upsertData, {
      onConflict: 'user_id',
    });

  if (upsertError) {
    logStep("Error upserting subscription", { error: upsertError.message });
  } else {
    logStep("Subscription upserted successfully", { tier, status });
  }
}

async function handleSubscriptionCanceled(
  supabase: ReturnType<typeof createClient>,
  stripe: Stripe,
  subscription: Stripe.Subscription
) {
  logStep("Processing subscription cancellation", { subscriptionId: subscription.id });

  // Get customer email
  const customer = await stripe.customers.retrieve(subscription.customer as string);
  if (customer.deleted) return;

  const email = customer.email;
  if (!email) return;

  // Find user by email
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users?.users.find(u => u.email === email);
  if (!user) return;

  // Update subscription to canceled/free
  const { error } = await supabase
    .from('safesuite_subscriptions')
    .update({
      tier: 'free',
      status: 'canceled',
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  if (error) {
    logStep("Error updating canceled subscription", { error: error.message });
  } else {
    logStep("Subscription canceled successfully", { userId: user.id });
  }
}
