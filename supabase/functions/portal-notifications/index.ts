import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-portal-session",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PORTAL-NOTIFICATIONS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'notify';
    logStep(`Action: ${action}`);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.json();

    switch (action) {
      case 'ticket-update':
        return await handleTicketUpdate(supabaseClient, body);
      case 'new-comment':
        return await handleNewComment(supabaseClient, body);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleTicketUpdate(supabase: any, { ticketId, oldStatus, newStatus }: any) {
  logStep("Sending ticket update notification", { ticketId, oldStatus, newStatus });

  // Get ticket details with contact info
  const { data: ticket, error: ticketError } = await supabase
    .from('helpdesk_tickets')
    .select('subject, contact_id, customer_id')
    .eq('id', ticketId)
    .single();

  if (ticketError || !ticket) {
    throw new Error("Ticket not found");
  }

  // Get contact email
  const { data: contact } = await supabase
    .from('client_contacts')
    .select('email, first_name, last_name')
    .eq('id', ticket.contact_id)
    .single();

  if (!contact?.email) {
    logStep("No contact email found, skipping notification");
    return new Response(JSON.stringify({ skipped: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }

  // Send email notification
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    logStep("RESEND_API_KEY not configured, skipping email");
    return new Response(JSON.stringify({ skipped: true, reason: 'no_resend_key' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }

  const resend = new Resend(resendApiKey);
  
  await resend.emails.send({
    from: 'Support <hello@send.ultriumai.com>',
    to: [contact.email],
    subject: `Ticket Update: ${ticket.subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0891b2;">Your Ticket Has Been Updated</h2>
        <p>Hi ${contact.first_name || 'there'},</p>
        <p>Your support ticket has been updated:</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <strong>${ticket.subject}</strong><br/>
          <span style="color: #6b7280;">Status changed from <strong>${oldStatus}</strong> to <strong>${newStatus}</strong></span>
        </div>
        <p>You can view your ticket in the customer portal.</p>
        <p style="color: #9ca3af; font-size: 12px;">This is an automated notification.</p>
      </div>
    `
  });

  logStep("Email notification sent", { to: contact.email });

  // Log the notification
  await supabase.from('client_portal_notifications').insert({
    client_id: ticket.customer_id,
    contact_id: ticket.contact_id,
    notification_type: 'ticket_status_change',
    title: 'Ticket Status Updated',
    message: `Your ticket "${ticket.subject}" status changed to ${newStatus}`,
    metadata: { ticketId, oldStatus, newStatus },
    is_read: false
  });

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function handleNewComment(supabase: any, { ticketId, commentId, commenterType }: any) {
  // Only notify for technician comments (not customer's own)
  if (commenterType === 'customer') {
    return new Response(JSON.stringify({ skipped: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }

  logStep("Sending new comment notification", { ticketId, commentId });

  // Get ticket and contact
  const { data: ticket } = await supabase
    .from('helpdesk_tickets')
    .select('subject, contact_id, customer_id')
    .eq('id', ticketId)
    .single();

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  const { data: contact } = await supabase
    .from('client_contacts')
    .select('email, first_name')
    .eq('id', ticket.contact_id)
    .single();

  if (!contact?.email) {
    return new Response(JSON.stringify({ skipped: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (resendApiKey) {
    const resend = new Resend(resendApiKey);
    
    await resend.emails.send({
      from: 'Support <hello@send.ultriumai.com>',
      to: [contact.email],
      subject: `New Reply: ${ticket.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0891b2;">New Reply on Your Ticket</h2>
          <p>Hi ${contact.first_name || 'there'},</p>
          <p>A support technician has replied to your ticket:</p>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <strong>${ticket.subject}</strong>
          </div>
          <p>Log in to the customer portal to view the reply and respond.</p>
          <p style="color: #9ca3af; font-size: 12px;">This is an automated notification.</p>
        </div>
      `
    });

    logStep("Comment notification sent", { to: contact.email });
  }

  // Log notification
  await supabase.from('client_portal_notifications').insert({
    client_id: ticket.customer_id,
    contact_id: ticket.contact_id,
    notification_type: 'new_comment',
    title: 'New Reply on Your Ticket',
    message: `A technician has replied to "${ticket.subject}"`,
    metadata: { ticketId, commentId },
    is_read: false
  });

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}
