import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GENERATE-MSP-INVOICE] ${step}${detailsStr}`);
};

interface TimeEntry {
  id: string;
  description: string;
  duration_minutes: number;
  hourly_rate: number;
  is_billable: boolean;
}

interface InvoiceRequest {
  clientId: string;
  clientName: string;
  clientEmail: string;
  timeEntryIds?: string[];
  lineItems?: Array<{
    description: string;
    amount: number;
    quantity?: number;
  }>;
  dueInDays?: number;
}

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

    const body: InvoiceRequest = await req.json();
    logStep("Request body", { clientId: body.clientId, clientName: body.clientName });

    // Find or create Stripe customer for the client
    let customerId: string;
    const customers = await stripe.customers.list({ email: body.clientEmail, limit: 1 });
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    } else {
      const newCustomer = await stripe.customers.create({
        email: body.clientEmail,
        name: body.clientName,
        metadata: {
          msp_client_id: body.clientId,
          created_by: user.id
        }
      });
      customerId = newCustomer.id;
      logStep("Created new Stripe customer", { customerId });
    }

    // Calculate line items from time entries if provided
    let invoiceLineItems: Array<{ description: string; amount: number; quantity: number }> = [];
    
    if (body.timeEntryIds && body.timeEntryIds.length > 0) {
      const { data: timeEntries, error: teError } = await supabaseClient
        .from('vanguard_time_entries')
        .select('*')
        .in('id', body.timeEntryIds)
        .eq('is_billable', true);

      if (teError) throw teError;

      invoiceLineItems = (timeEntries || []).map((entry: TimeEntry) => {
        const hours = entry.duration_minutes / 60;
        const amount = Math.round(hours * entry.hourly_rate * 100); // Convert to cents
        return {
          description: entry.description || 'Professional Services',
          amount: amount,
          quantity: 1
        };
      });
      logStep("Calculated time entry line items", { count: invoiceLineItems.length });
    } else if (body.lineItems) {
      invoiceLineItems = body.lineItems.map(item => ({
        description: item.description,
        amount: Math.round(item.amount * 100), // Convert to cents
        quantity: item.quantity || 1
      }));
    }

    if (invoiceLineItems.length === 0) {
      throw new Error("No line items provided for invoice");
    }

    // Create Stripe invoice
    const invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: 'send_invoice',
      days_until_due: body.dueInDays || 30,
      metadata: {
        msp_client_id: body.clientId,
        generated_by: user.id,
        time_entry_ids: body.timeEntryIds?.join(',') || ''
      }
    });
    logStep("Created Stripe invoice", { invoiceId: invoice.id });

    // Add line items to invoice
    for (const item of invoiceLineItems) {
      await stripe.invoiceItems.create({
        customer: customerId,
        invoice: invoice.id,
        amount: item.amount,
        currency: 'usd',
        description: item.description
      });
    }
    logStep("Added line items to invoice", { count: invoiceLineItems.length });

    // Finalize the invoice
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
    logStep("Finalized invoice", { 
      invoiceId: finalizedInvoice.id, 
      number: finalizedInvoice.number,
      total: finalizedInvoice.total 
    });

    // Store invoice in our database
    const { error: dbError } = await supabaseClient
      .from('business_invoices')
      .insert({
        stripe_invoice_id: finalizedInvoice.id,
        invoice_number: finalizedInvoice.number,
        amount_due: finalizedInvoice.total,
        currency: finalizedInvoice.currency,
        status: 'open',
        issued_at: new Date().toISOString(),
        due_date: new Date(Date.now() + (body.dueInDays || 30) * 24 * 60 * 60 * 1000).toISOString(),
        line_items: invoiceLineItems,
        notes: `Invoice for ${body.clientName}`
      });

    if (dbError) {
      console.error('Failed to store invoice in database:', dbError);
    }

    // Mark time entries as invoiced if applicable
    if (body.timeEntryIds && body.timeEntryIds.length > 0) {
      await supabaseClient
        .from('vanguard_time_entries')
        .update({ invoice_id: finalizedInvoice.id })
        .in('id', body.timeEntryIds);
    }

    return new Response(JSON.stringify({
      success: true,
      invoiceId: finalizedInvoice.id,
      invoiceNumber: finalizedInvoice.number,
      invoiceUrl: finalizedInvoice.hosted_invoice_url,
      pdfUrl: finalizedInvoice.invoice_pdf,
      total: finalizedInvoice.total,
      status: finalizedInvoice.status
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
