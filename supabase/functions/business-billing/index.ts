import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[BUSINESS-BILLING] ${step}${detailsStr}`);
};

// Business pricing structure (retail prices - higher than MSP wholesale)
const BUSINESS_PRICING = {
  starter: {
    monthly: { platform: 199, per_user: 35 },
    annual: { platform: 1990, per_user: 350 }
  },
  professional: {
    monthly: { platform: 399, per_user: 55 },
    annual: { platform: 3990, per_user: 550 }
  },
  enterprise: {
    monthly: { platform: 799, per_user: 75 },
    annual: { platform: 7990, per_user: 750 }
  }
};

const ADDON_PRICING = {
  safesecure: { monthly: 25, annual: 250 },
  safecenter: { monthly: 35, annual: 350 }
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
    logStep("Function started");

    const url = new URL(req.url);
    let action = url.searchParams.get("action");
    const method = req.method;
    
    // For POST requests, also check body for action
    if (method === "POST" && !action) {
      try {
        const body = await req.json();
        action = body.action;
      } catch (e) {
        // If body parsing fails, continue with URL param
      }
    }

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    const isUltriumAdmin = user.email.endsWith('@ultriumai.com');
    logStep("User authenticated", { userId: user.id, email: user.email, isAdmin: isUltriumAdmin });

    if (method === "POST" && action === "create_business_checkout") {
      const { 
        package_type, 
        billing_cycle, 
        seat_count = 1, 
        addons = [], 
        company_info,
        trial_days = 14
      } = await req.json();

      logStep("Creating business checkout", { package_type, billing_cycle, seat_count, addons });

      if (!package_type || !billing_cycle) {
        throw new Error("Package type and billing cycle are required");
      }

      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
        apiVersion: "2023-10-16",
      });

      // Calculate pricing
      const packagePrice = BUSINESS_PRICING[package_type][billing_cycle];
      const totalPlatformCost = packagePrice.platform;
      const totalUserCost = packagePrice.per_user * seat_count;
      
      let totalAddonCost = 0;
      const addonLineItems = [];
      
      for (const addon of addons) {
        const addonPrice = ADDON_PRICING[addon];
        if (addonPrice) {
          totalAddonCost += addonPrice[billing_cycle] * seat_count;
          addonLineItems.push({
            price_data: {
              currency: "usd",
              product_data: { 
                name: `${addon.toUpperCase()} Add-on`,
                description: `${addon} security add-on for ${seat_count} users`
              },
              unit_amount: addonPrice[billing_cycle] * 100,
              recurring: { interval: billing_cycle === 'annual' ? 'year' : 'month' }
            },
            quantity: seat_count
          });
        }
      }

      const totalAmount = totalPlatformCost + totalUserCost + totalAddonCost;

      // Check for existing customer
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      let customerId;
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }

      // Create line items
      const lineItems = [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: `${package_type.charAt(0).toUpperCase() + package_type.slice(1)} Platform`,
              description: `Base platform fee for ${package_type} package`
            },
            unit_amount: totalPlatformCost * 100,
            recurring: { interval: billing_cycle === 'annual' ? 'year' : 'month' }
          },
          quantity: 1
        },
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: `User Seats`,
              description: `Per-user licensing for ${seat_count} users`
            },
            unit_amount: packagePrice.per_user * 100,
            recurring: { interval: billing_cycle === 'annual' ? 'year' : 'month' }
          },
          quantity: seat_count
        },
        ...addonLineItems
      ];

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: lineItems,
        mode: "subscription",
        allow_promotion_codes: true,
        billing_address_collection: "required",
        tax_id_collection: { enabled: true },
        custom_fields: [
          {
            key: "company_size",
            label: { type: "custom", custom: "Company Size" },
            type: "dropdown",
            dropdown: {
              options: [
                { label: "Startup (1-10 employees)", value: "startup" },
                { label: "Small (11-50 employees)", value: "small" },
                { label: "Medium (51-200 employees)", value: "medium" },
                { label: "Large (201-1000 employees)", value: "large" },
                { label: "Enterprise (1000+ employees)", value: "enterprise" }
              ]
            }
          },
          {
            key: "industry",
            label: { type: "custom", custom: "Industry" },
            type: "text"
          }
        ],
        subscription_data: {
          trial_period_days: trial_days,
          metadata: {
            package_type,
            seat_count: seat_count.toString(),
            addons: JSON.stringify(addons),
            user_id: user.id
          }
        },
        success_url: `${req.headers.get("origin")}/business-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get("origin")}/pricing?canceled=true`,
        metadata: {
          type: "business_subscription",
          user_id: user.id,
          package_type
        }
      });

      logStep("Checkout session created", { sessionId: session.id, url: session.url });

      return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if ((method === "GET" || method === "POST") && action === "business_dashboard") {
      // Get business customer and subscription info
      const { data: businessCustomer } = await supabaseClient
        .from("business_customers")
        .select("*")
        .eq("user_id", user.id)
        .single();

      let subscription = null;
      let invoices = [];
      let usage = null;

      if (businessCustomer) {
        const { data: subscriptionData } = await supabaseClient
          .from("business_subscriptions")
          .select("*")
          .eq("business_customer_id", businessCustomer.id)
          .eq("status", "active")
          .single();

        subscription = subscriptionData;

        if (subscription) {
          const { data: invoiceData } = await supabaseClient
            .from("business_invoices")
            .select("*")
            .eq("business_customer_id", businessCustomer.id)
            .order("created_at", { ascending: false })
            .limit(10);

          invoices = invoiceData || [];

          const currentMonth = new Date().toISOString().slice(0, 7);
          const { data: usageData } = await supabaseClient
            .from("business_usage_tracking")
            .select("*")
            .eq("business_customer_id", businessCustomer.id)
            .eq("tracking_period", currentMonth)
            .single();

          usage = usageData;
        }
      }

      return new Response(JSON.stringify({
        customer: businessCustomer,
        subscription,
        invoices,
        usage,
        pricing: BUSINESS_PRICING
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if ((method === "GET" || method === "POST") && action === "admin_business_overview" && isUltriumAdmin) {
      // Admin overview of all business customers
      const { data: customers } = await supabaseClient
        .from("business_customers")
        .select(`
          *,
          business_subscriptions(*),
          business_invoices(*)
        `)
        .order("created_at", { ascending: false });

      const summary = {
        totalCustomers: customers?.length || 0,
        activeSubscriptions: 0,
        monthlyRevenue: 0,
        annualRevenue: 0,
        packageBreakdown: {
          starter: 0,
          professional: 0,
          enterprise: 0
        }
      };

      customers?.forEach(customer => {
        customer.business_subscriptions?.forEach((sub: any) => {
          if (sub.status === 'active') {
            summary.activeSubscriptions++;
            summary.monthlyRevenue += Number(sub.monthly_amount) || 0;
            summary.annualRevenue += (Number(sub.monthly_amount) || 0) * 12;
            if (summary.packageBreakdown[sub.package_type]) {
              summary.packageBreakdown[sub.package_type]++;
            }
          }
        });
      });

      return new Response(JSON.stringify({
        ...summary,
        customers: customers || []
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (method === "POST" && action === "create_enterprise_quote") {
      // Handle enterprise sales quotes
      const { seats, requirements, contact_info } = await req.json();
      
      logStep("Creating enterprise quote", { seats, requirements });

      // Store quote request
      const { data: quote, error } = await supabaseClient
        .from("business_customers")
        .upsert({
          user_id: user.id,
          company_name: contact_info.company_name,
          business_email: user.email,
          billing_address: contact_info.billing_address,
          tax_id: contact_info.tax_id,
          industry: contact_info.industry,
          company_size: seats > 1000 ? 'enterprise' : 'large'
        }, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      return new Response(JSON.stringify({
        message: "Enterprise quote request submitted",
        quote_id: quote?.id,
        next_steps: "Our enterprise sales team will contact you within 24 hours"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(
      JSON.stringify({ error: "Action not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in business-billing", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});