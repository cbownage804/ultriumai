import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Map SafeSuite tier to user_product_access level
const tierToAccessLevel = (tier: string): string => {
  switch (tier) {
    case 'business':
    case 'enterprise':
      return 'business';
    case 'pro':
    case 'premium':
      return 'pro';
    default:
      return 'free';
  }
};

// Vanguard product ID → tier mapping
const VANGUARD_PLAN_PRODUCTS: Record<string, string> = {
  'prod_Tvm1tGkEFFA8xx': 'it-professional',
  'prod_Tvm1v7saOMFPLn': 'it-expert',
  'prod_Tvm1N7n2bkJpMd': 'it-master',
  'prod_Tvm1aJEZ4WXQJN': 'msp-pro',
  'prod_Tvm1Wp6LRat7DV': 'msp-growth',
  'prod_Tvm1sVN7zuCb2R': 'msp-power',
};

const VANGUARD_ADDON_PRODUCTS: Record<string, string> = {
  'prod_Tvm15XS4URJYDf': 'pursuit-xdr',
  'prod_Tvm14lHuxDHOyk': 'sentinel-saas',
  'prod_Tvm1Bv6Y169hG6': 'recon-pentest',
  'prod_Tvm1lPWrLHU5BG': 'cortex-ai',
  'prod_Tvm1BCKLECzk9L': 'comply',
  'prod_Tvm1pOuwM3afS1': 'cross-client-soc',
  'prod_Tvm1IMy0GKTI7u': 'atlas-docs',
  'prod_Tvm1psna1dlfHE': 'phishing-sim',
  'prod_Tvm1CcIDVjRGaW': 'ai-copilot',
  'prod_Tvm19bNlVCzSw2': 'network-discovery',
};

const ALL_VANGUARD_PRODUCT_IDS = new Set([
  ...Object.keys(VANGUARD_PLAN_PRODUCTS),
  ...Object.keys(VANGUARD_ADDON_PRODUCTS),
]);

// Check if a subscription contains any Vanguard products
const isVanguardSubscription = (items: Stripe.SubscriptionItem[]): boolean => {
  return items.some(item => ALL_VANGUARD_PRODUCT_IDS.has(item.price.product as string));
};

// Extract Vanguard tier + addons from subscription items
const extractVanguardDetails = (items: Stripe.SubscriptionItem[]) => {
  let tier = 'free';
  let seatCount = 0;
  const addons: string[] = [];

  for (const item of items) {
    const productId = item.price.product as string;
    if (VANGUARD_PLAN_PRODUCTS[productId]) {
      tier = VANGUARD_PLAN_PRODUCTS[productId];
      seatCount = item.quantity || 1;
    }
    if (VANGUARD_ADDON_PRODUCTS[productId]) {
      addons.push(VANGUARD_ADDON_PRODUCTS[productId]);
    }
  }

  return { tier, seatCount, addons };
};

// Determine product from metadata or price
const determineProduct = (metadata: Record<string, string> | null): string => {
  if (!metadata) return 'safesuite';
  const product = metadata.product || metadata.plan_type || metadata.plan_id || '';
  if (product.includes('vanguard') || product.startsWith('it-') || product.startsWith('msp-')) return 'vanguard';
  if (product.includes('ai') || product.includes('studio')) return 'ai_studio';
  return 'safesuite';
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Webhook received");
    
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey || !webhookSecret) {
      throw new Error("Missing Stripe keys");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      throw new Error("No signature provided");
    }

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    
    logStep("Event verified", { type: event.type, id: event.id });

    switch (event.type) {
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customer = await stripe.customers.retrieve(invoice.customer as string) as Stripe.Customer;
        
        if (!customer.email) {
          logStep("No customer email found");
          break;
        }

        // Get user by email
        const { data: users } = await supabaseClient.auth.admin.listUsers();
        const user = users.users.find(u => u.email === customer.email);

        // Send subscription confirmation email for new subscriptions
        if (invoice.billing_reason === 'subscription_create' && user) {
          try {
            const subscription = invoice.subscription 
              ? await stripe.subscriptions.retrieve(invoice.subscription as string)
              : null;
            
            await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-subscription-confirmed`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
              },
              body: JSON.stringify({
                email: customer.email,
                name: customer.name,
                product: subscription?.metadata?.product || 'UltriumAI',
                plan: subscription?.metadata?.plan_type || 'Premium',
                amount: invoice.amount_paid,
                currency: invoice.currency,
                billingCycle: subscription?.items?.data[0]?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly',
                nextBillingDate: subscription?.current_period_end 
                  ? new Date(subscription.current_period_end * 1000).toISOString()
                  : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              }),
            });
            logStep("Subscription confirmation email sent", { email: customer.email });
          } catch (emailError) {
            logStep("Failed to send confirmation email", { error: emailError });
          }
        }
        
        // Continue to update subscription status
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          // Fall through to subscription handling
        }
        break;
      }
      
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customer = await stripe.customers.retrieve(invoice.customer as string) as Stripe.Customer;
        
        if (!customer.email) break;

        // Send payment failed email
        try {
          await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-payment-failed`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
            },
            body: JSON.stringify({
              email: customer.email,
              name: customer.name,
              product: 'UltriumAI Subscription',
              amount: invoice.amount_due,
              currency: invoice.currency,
              failureReason: invoice.last_finalization_error?.message,
              retryDate: invoice.next_payment_attempt 
                ? new Date(invoice.next_payment_attempt * 1000).toISOString() 
                : null,
            }),
          });
          logStep("Payment failed email sent", { email: customer.email });
        } catch (emailError) {
          logStep("Failed to send payment failed email", { error: emailError });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        
        if (!customer.email) {
          logStep("No customer email found");
          break;
        }

        // Get user by email
        const { data: users } = await supabaseClient.auth.admin.listUsers();
        const user = users.users.find(u => u.email === customer.email);
        
        if (!user) {
          logStep("No user found for email", { email: customer.email });
          break;
        }

        // ── VANGUARD SUBSCRIPTION HANDLING ──
        if (isVanguardSubscription(subscription.items.data)) {
          const { tier: vTier, seatCount, addons } = extractVanguardDetails(subscription.items.data);
          const vEnd = new Date(subscription.current_period_end * 1000).toISOString();

          await supabaseClient.from('vanguard_subscriptions').upsert({
            user_id: user.id,
            stripe_customer_id: customer.id,
            stripe_subscription_id: subscription.id,
            tier: vTier,
            seat_count: seatCount,
            addons: addons,
            status: subscription.status === 'active' ? 'active' : subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: vEnd,
            admin_override: false,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

          // Also update user_product_access for Vanguard
          await supabaseClient.from('user_product_access').upsert({
            user_id: user.id,
            product: 'vanguard',
            access_level: vTier,
            granted_at: new Date().toISOString(),
            expires_at: subscription.status === 'active' ? vEnd : null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,product' });

          logStep("Vanguard subscription synced", {
            email: customer.email,
            tier: vTier,
            seats: seatCount,
            addons,
            status: subscription.status,
          });
          break;
        }

        // ── SAFESUITE / OTHER SUBSCRIPTION HANDLING ──
        const priceId = subscription.items.data[0].price.id;
        const price = await stripe.prices.retrieve(priceId);
        const amount = price.unit_amount || 0;
        
        let subscriptionTier = "free";
        const metadata = subscription.metadata || {};
        const planType = metadata.plan_type;
        
        const safeSuitePrices: Record<string, string> = {
          'price_1SrTegH1u6E0bsJTKpGm5qxr': 'pro',
          'price_1SrTeiH1u6E0bsJTarTH7ajs': 'pro',
          'price_1SrTejH1u6E0bsJTwd4K8st5': 'business',
          'price_1SrTelH1u6E0bsJTmep4lSIP': 'business',
        };
        
        if (safeSuitePrices[priceId]) {
          subscriptionTier = safeSuitePrices[priceId];
        } else if (planType) {
          if (planType === "business" || planType === "enterprise") subscriptionTier = "business";
          else if (planType === "pro" || planType === "premium") subscriptionTier = "pro";
          else subscriptionTier = planType;
        } else {
          if (amount >= 40000) subscriptionTier = "enterprise";
          else if (amount >= 8000) subscriptionTier = "premium";
          else if (amount >= 500) subscriptionTier = "pro";
        }
        
        const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
        const product = determineProduct(metadata);
        const accessLevel = tierToAccessLevel(subscriptionTier);
        
        await supabaseClient.from("subscribers").upsert({
          email: customer.email,
          stripe_customer_id: customer.id,
          subscribed: subscription.status === "active",
          subscription_tier: subscriptionTier,
          subscription_end: subscriptionEnd,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' });
        
        await supabaseClient.from("safesuite_subscriptions").upsert({
          user_id: user.id,
          tier: subscriptionTier,
          stripe_customer_id: customer.id,
          stripe_subscription_id: subscription.id,
          status: subscription.status,
          current_period_end: subscriptionEnd,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' }).catch(() => {});
        
        await supabaseClient.from("user_product_access").upsert({
          user_id: user.id,
          product: product,
          access_level: subscription.status === "active" ? accessLevel : 'free',
          granted_at: new Date().toISOString(),
          expires_at: subscription.status === "active" ? subscriptionEnd : null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,product' });
        
        logStep("Subscription synced", { 
          email: customer.email, 
          tier: subscriptionTier,
          product: product,
          accessLevel: accessLevel,
          status: subscription.status 
        });
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        
        if (!customer.email) break;
        
        const { data: users } = await supabaseClient.auth.admin.listUsers();
        const user = users.users.find(u => u.email === customer.email);

        // ── VANGUARD CANCELLATION ──
        if (isVanguardSubscription(subscription.items.data)) {
          if (user) {
            await supabaseClient.from('vanguard_subscriptions').upsert({
              user_id: user.id,
              tier: 'free',
              seat_count: 0,
              addons: [],
              status: 'canceled',
              admin_override: false,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });

            await supabaseClient.from('user_product_access').upsert({
              user_id: user.id,
              product: 'vanguard',
              access_level: 'free',
              expires_at: null,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id,product' });
          }
          logStep("Vanguard subscription cancelled", { email: customer.email });
          break;
        }

        // ── SAFESUITE / OTHER CANCELLATION ──
        await supabaseClient.from("subscribers").upsert({
          email: customer.email,
          stripe_customer_id: customer.id,
          subscribed: false,
          subscription_tier: "free",
          subscription_end: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' });
        
        if (user) {
          const metadata = subscription.metadata || {};
          const product = determineProduct(metadata);
          
          await supabaseClient.from("safesuite_subscriptions").upsert({
            user_id: user.id,
            tier: 'free',
            status: 'canceled',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' }).catch(() => {});
          
          await supabaseClient.from("user_product_access").upsert({
            user_id: user.id,
            product: product,
            access_level: 'free',
            expires_at: null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,product' });
        }
        
        logStep("Subscription cancelled", { email: customer.email });
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
      status: 400,
    });
  }
});