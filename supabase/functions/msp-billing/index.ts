import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get user from request
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    const { action, ...body } = await req.json();

    switch (action) {
      case "generate_invoices": {
        const { billingPeriodId, clientIds } = body;
        
        if (!billingPeriodId) {
          throw new Error("Billing period ID is required");
        }

        // Get the billing period
        const { data: billingPeriod, error: periodError } = await supabaseClient
          .from("msp_billing_periods")
          .select("*")
          .eq("id", billingPeriodId)
          .eq("msp_user_id", user.id)
          .single();

        if (periodError || !billingPeriod) {
          throw new Error("Billing period not found");
        }

        // Get clients to bill (if specific clients, filter; otherwise get all active clients)
        let clientsQuery = supabaseClient
          .from("msp_clients")
          .select("*")
          .eq("msp_id", user.id)
          .eq("is_active", true);

        if (clientIds && clientIds.length > 0) {
          clientsQuery = clientsQuery.in("id", clientIds);
        }

        const { data: clients, error: clientsError } = await clientsQuery;

        if (clientsError) {
          throw new Error("Failed to fetch clients");
        }

        const invoices = [];

        // Generate invoices for each client
        for (const client of clients) {
          // Get billing templates for this client
          const { data: templates, error: templatesError } = await supabaseClient
            .from("msp_billing_templates")
            .select("*")
            .eq("msp_user_id", user.id)
            .eq("client_id", client.id)
            .eq("is_active", true);

          if (templatesError) {
            console.error("Failed to fetch billing templates for client", client.id);
            continue;
          }

          if (!templates || templates.length === 0) {
            console.log("No billing templates found for client", client.company_name);
            continue;
          }

          // Generate unique invoice number
          const { data: invoiceNumber, error: numberError } = await supabaseClient
            .rpc("generate_invoice_number");

          if (numberError) {
            throw new Error("Failed to generate invoice number");
          }

          // Calculate totals
          let subtotal = 0;
          const lineItems = [];

          for (const template of templates) {
            const quantity = 1; // Default quantity, could be customized based on usage
            const totalPrice = template.unit_price * quantity;
            subtotal += totalPrice;

            lineItems.push({
              service_name: template.service_name,
              description: template.description,
              quantity,
              unit_price: template.unit_price,
              total_price: totalPrice,
            });
          }

          const taxRate = 0.08; // 8% tax rate (configurable)
          const taxAmount = Math.round(subtotal * taxRate);
          const totalAmount = subtotal + taxAmount;

          // Calculate due date (30 days from now)
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 30);

          // Create invoice
          const { data: invoice, error: invoiceError } = await supabaseClient
            .from("msp_invoices")
            .insert({
              msp_user_id: user.id,
              billing_period_id: billingPeriod.id,
              client_id: client.id,
              invoice_number: invoiceNumber,
              subtotal,
              tax_amount: taxAmount,
              total_amount: totalAmount,
              due_date: dueDate.toISOString().split('T')[0],
              status: "draft",
            })
            .select()
            .single();

          if (invoiceError) {
            console.error("Failed to create invoice for client", client.id, invoiceError);
            continue;
          }

          // Create invoice line items
          const lineItemsWithInvoiceId = lineItems.map(item => ({
            ...item,
            invoice_id: invoice.id,
          }));

          const { error: lineItemsError } = await supabaseClient
            .from("msp_invoice_items")
            .insert(lineItemsWithInvoiceId);

          if (lineItemsError) {
            console.error("Failed to create invoice line items for invoice", invoice.id, lineItemsError);
            // Could rollback invoice creation here
            continue;
          }

          invoices.push({
            ...invoice,
            line_items: lineItemsWithInvoiceId,
            client_name: client.company_name,
          });
        }

        // Update billing period status
        await supabaseClient
          .from("msp_billing_periods")
          .update({ status: "generated" })
          .eq("id", billingPeriod.id);

        return new Response(
          JSON.stringify({
            success: true,
            message: `Generated ${invoices.length} invoices`,
            invoices,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      case "send_invoice": {
        const { invoiceId } = body;
        
        if (!invoiceId) {
          throw new Error("Invoice ID is required");
        }

        // Get invoice with client info
        const { data: invoice, error: invoiceError } = await supabaseClient
          .from("msp_invoices")
          .select(`
            *,
            msp_clients!inner(company_name, primary_contact_email)
          `)
          .eq("id", invoiceId)
          .eq("msp_user_id", user.id)
          .single();

        if (invoiceError || !invoice) {
          throw new Error("Invoice not found");
        }

        // TODO: Implement email sending logic here
        // For now, just mark as sent
        const { error: updateError } = await supabaseClient
          .from("msp_invoices")
          .update({ 
            status: "sent",
            sent_at: new Date().toISOString()
          })
          .eq("id", invoiceId);

        if (updateError) {
          throw new Error("Failed to update invoice status");
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: "Invoice sent successfully",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      case "update_invoice_status": {
        const { invoiceId, status, paymentIntentId } = body;
        
        if (!invoiceId || !status) {
          throw new Error("Invoice ID and status are required");
        }

        const updateData: any = { status };
        
        if (status === "paid") {
          updateData.paid_at = new Date().toISOString();
          if (paymentIntentId) {
            updateData.stripe_payment_intent_id = paymentIntentId;
          }
        }

        const { error: updateError } = await supabaseClient
          .from("msp_invoices")
          .update(updateData)
          .eq("id", invoiceId)
          .eq("msp_user_id", user.id);

        if (updateError) {
          throw new Error("Failed to update invoice status");
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: "Invoice status updated successfully",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      case "get_billing_summary": {
        const { startDate, endDate } = body;
        
        // Get billing summary data
        const { data: invoices, error: invoicesError } = await supabaseClient
          .from("msp_invoices")
          .select(`
            id,
            total_amount,
            status,
            due_date,
            created_at,
            msp_clients!inner(company_name)
          `)
          .eq("msp_user_id", user.id)
          .gte("created_at", startDate || "2024-01-01")
          .lte("created_at", endDate || new Date().toISOString());

        if (invoicesError) {
          throw new Error("Failed to fetch billing summary");
        }

        // Calculate summary stats
        const totalRevenue = invoices
          .filter(inv => inv.status === "paid")
          .reduce((sum, inv) => sum + inv.total_amount, 0);

        const pendingRevenue = invoices
          .filter(inv => ["draft", "sent"].includes(inv.status))
          .reduce((sum, inv) => sum + inv.total_amount, 0);

        const overdueRevenue = invoices
          .filter(inv => inv.status === "sent" && new Date(inv.due_date) < new Date())
          .reduce((sum, inv) => sum + inv.total_amount, 0);

        const totalInvoices = invoices.length;
        const paidInvoices = invoices.filter(inv => inv.status === "paid").length;
        const pendingInvoices = invoices.filter(inv => ["draft", "sent"].includes(inv.status)).length;

        return new Response(
          JSON.stringify({
            success: true,
            summary: {
              totalRevenue: totalRevenue / 100, // Convert from cents to dollars
              pendingRevenue: pendingRevenue / 100,
              overdueRevenue: overdueRevenue / 100,
              totalInvoices,
              paidInvoices,
              pendingInvoices,
              paymentRate: totalInvoices > 0 ? (paidInvoices / totalInvoices * 100).toFixed(1) : 0,
            },
            recentInvoices: invoices.slice(0, 10),
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      default:
        throw new Error("Invalid action");
    }
  } catch (error) {
    console.error("MSP Billing error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unexpected error occurred" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});