import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-MSP-BILLING-DATA] ${step}${detailsStr}`);
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get all subscriptions for Vanguard products
    const vanguardProductPrefixes = ['prod_Tslb', 'prod_TsQh', 'prod_TsPz', 'prod_TsPs', 'prod_TsPh'];
    
    // Fetch all active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
      expand: ['data.customer', 'data.items.data.price.product']
    });
    logStep("Fetched subscriptions", { count: subscriptions.data.length });

    // Filter for Vanguard-related subscriptions and calculate MRR
    let totalMRR = 0;
    const clientSubscriptions: Array<{
      customerId: string;
      customerName: string;
      customerEmail: string;
      subscriptionId: string;
      productName: string;
      amount: number;
      interval: string;
      currentPeriodEnd: string;
      status: string;
    }> = [];

    for (const sub of subscriptions.data) {
      for (const item of sub.items.data) {
        const product = item.price.product as Stripe.Product;
        
        // Check if it's a Vanguard product
        const isVanguardProduct = vanguardProductPrefixes.some(prefix => product.id.startsWith(prefix));
        
        if (isVanguardProduct || product.name?.includes('Vanguard') || product.name?.includes('AI Studio') || product.name?.includes('SafeSuite') || product.name?.includes('Recon')) {
          const amount = item.price.unit_amount || 0;
          const interval = item.price.recurring?.interval || 'month';
          
          // Convert to monthly if yearly
          const monthlyAmount = interval === 'year' ? amount / 12 : amount;
          totalMRR += monthlyAmount;

          const customer = sub.customer as Stripe.Customer;
          
          clientSubscriptions.push({
            customerId: customer.id,
            customerName: customer.name || customer.email || 'Unknown',
            customerEmail: customer.email || '',
            subscriptionId: sub.id,
            productName: product.name,
            amount: amount,
            interval: interval,
            currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
            status: sub.status
          });
        }
      }
    }

    logStep("Calculated MRR", { totalMRR: totalMRR / 100, subscriptionCount: clientSubscriptions.length });

    // Get recent invoices
    const invoices = await stripe.invoices.list({
      limit: 50
    });

    const recentInvoices = invoices.data.map(inv => ({
      id: inv.id,
      number: inv.number,
      customerName: (inv.customer as Stripe.Customer)?.name || inv.customer_email || 'Unknown',
      amount: inv.total,
      status: inv.status,
      dueDate: inv.due_date ? new Date(inv.due_date * 1000).toISOString() : null,
      paidAt: inv.status_transitions?.paid_at ? new Date(inv.status_transitions.paid_at * 1000).toISOString() : null,
      hostedUrl: inv.hosted_invoice_url,
      pdfUrl: inv.invoice_pdf
    }));

    // Calculate metrics
    const paidInvoices = invoices.data.filter(i => i.status === 'paid');
    const openInvoices = invoices.data.filter(i => i.status === 'open');
    const overdueInvoices = invoices.data.filter(i => 
      i.status === 'open' && i.due_date && i.due_date * 1000 < Date.now()
    );

    const totalCollected = paidInvoices.reduce((sum, i) => sum + i.total, 0);
    const totalOutstanding = openInvoices.reduce((sum, i) => sum + i.total, 0);
    const totalOverdue = overdueInvoices.reduce((sum, i) => sum + i.total, 0);

    // Get previous month's MRR for comparison (from analytics_snapshots if available)
    let previousMRR = totalMRR * 0.95; // Default to 5% lower if no historical data
    const { data: snapshot } = await supabaseClient
      .from('analytics_snapshots')
      .select('data_snapshot')
      .eq('snapshot_type', 'mrr')
      .eq('user_id', user.id)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (snapshot?.data_snapshot) {
      const snapData = snapshot.data_snapshot as { totalMRR?: number };
      previousMRR = snapData.totalMRR || previousMRR;
    }

    // Store current MRR as snapshot
    await supabaseClient
      .from('analytics_snapshots')
      .upsert({
        user_id: user.id,
        snapshot_type: 'mrr',
        snapshot_date: new Date().toISOString().split('T')[0],
        data_snapshot: { totalMRR: totalMRR, subscriptionCount: clientSubscriptions.length }
      }, { onConflict: 'user_id,snapshot_type,snapshot_date' });

    return new Response(JSON.stringify({
      mrr: {
        current: totalMRR / 100,
        previous: previousMRR / 100,
        change: (totalMRR - previousMRR) / 100,
        changePercent: previousMRR > 0 ? ((totalMRR - previousMRR) / previousMRR * 100).toFixed(1) : '0'
      },
      subscriptions: clientSubscriptions,
      invoices: recentInvoices,
      metrics: {
        totalCollected: totalCollected / 100,
        totalOutstanding: totalOutstanding / 100,
        totalOverdue: totalOverdue / 100,
        paidCount: paidInvoices.length,
        openCount: openInvoices.length,
        overdueCount: overdueInvoices.length
      }
    }), {
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
