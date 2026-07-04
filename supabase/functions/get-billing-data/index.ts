import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-BILLING-DATA] ${step}${detailsStr}`);
};

// Product ID to name mapping — Wrayth-only. Any subscription/invoice not
// tied to one of these products is filtered out of the in-app billing UI.
const PRODUCT_NAMES: Record<string, { name: string; product: string; tier: string }> = {
  'prod_TnSxL9TgGCz1jI': { name: 'Wrayth Pro', product: 'wrayth', tier: 'pro' },
  'prod_TnSxu5PsRCLf38': { name: 'Wrayth Business', product: 'wrayth', tier: 'business' },
  'prod_TsQkzLTz3wBSa2': { name: 'Wrayth Enterprise', product: 'wrayth', tier: 'enterprise' },
  'prod_TsQme3v03oM1uh': { name: 'Wrayth Enterprise', product: 'wrayth', tier: 'enterprise' },
};

const isWraythProduct = (productId: string | undefined | null): boolean =>
  !!productId && !!PRODUCT_NAMES[productId];

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is not set');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header provided');

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error('Invalid or expired token');

    const user = userData.user;
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find customer by email
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({
        subscriptions: [],
        invoices: [],
        usage: [],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Fetch all subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 100,
      expand: ['data.items.data.price.product'],
    });

    const formattedSubscriptions = subscriptions.data.map(sub => {
      const item = sub.items.data[0];
      const price = item.price;
      const productId = typeof price.product === 'string' ? price.product : price.product?.id;
      const productInfo = PRODUCT_NAMES[productId || ''] || { name: 'Subscription', product: 'unknown' };
      
      // Determine tier from price metadata or product name
      let tier = 'standard';
      const productName = typeof price.product === 'object' ? price.product?.name : '';
      if (productName?.toLowerCase().includes('pro')) tier = 'pro';
      if (productName?.toLowerCase().includes('business')) tier = 'business';
      if (productName?.toLowerCase().includes('enterprise')) tier = 'enterprise';
      if (productName?.toLowerCase().includes('starter')) tier = 'starter';
      
      return {
        id: sub.id,
        product: productInfo.product,
        productName: productInfo.name || productName || 'Subscription',
        tier,
        status: sub.status,
        amount: price.unit_amount || 0,
        currency: price.currency,
        interval: price.recurring?.interval || 'month',
        currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      };
    });

    logStep("Formatted subscriptions", { count: formattedSubscriptions.length });

    // Fetch recent invoices
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 10,
    });

    const formattedInvoices = invoices.data.map(inv => ({
      id: inv.id,
      number: inv.number,
      status: inv.status,
      amount: inv.amount_paid || inv.amount_due,
      currency: inv.currency,
      date: new Date((inv.created || 0) * 1000).toISOString(),
      pdfUrl: inv.invoice_pdf,
      description: inv.lines.data[0]?.description || 'Invoice',
    }));

    logStep("Formatted invoices", { count: formattedInvoices.length });

    // Fetch usage data from database
    const { data: usageData } = await supabaseClient
      .from('ai_credit_ledger')
      .select('credits_used, usage_type')
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    // Aggregate usage by type
    const usageByType: Record<string, number> = {};
    (usageData || []).forEach(entry => {
      usageByType[entry.usage_type] = (usageByType[entry.usage_type] || 0) + entry.credits_used;
    });

    const usage = Object.entries(usageByType).map(([type, used]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' '),
      used,
      limit: null, // Will be determined by subscription tier
      unit: 'credits',
      product: 'ai_studio',
    }));

    logStep("Formatted usage", { count: usage.length });

    return new Response(JSON.stringify({
      subscriptions: formattedSubscriptions,
      invoices: formattedInvoices,
      usage,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
