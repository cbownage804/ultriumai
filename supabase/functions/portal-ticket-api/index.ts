import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-portal-session",
};

interface CreateTicketRequest {
  subject: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PORTAL-TICKET] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'list';
    logStep(`Action: ${action}`);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get portal user from session header
    const sessionToken = req.headers.get('x-portal-session');
    const portalUserId = url.searchParams.get('portalUserId');
    
    if (!portalUserId) {
      throw new Error("Portal user ID required");
    }

    // Get portal user with permissions
    const { data: portalUser, error: userError } = await supabaseClient
      .from('client_portal_users')
      .select('*, client_contacts!inner(id, portal_role, can_view_all_company_tickets, client_id)')
      .eq('id', portalUserId)
      .eq('is_active', true)
      .single();

    if (userError || !portalUser) {
      throw new Error("Invalid portal user");
    }

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip');
    const userAgent = req.headers.get('user-agent');

    switch (action) {
      case 'list':
        return await handleListTickets(supabaseClient, portalUser, clientIp, userAgent);
      case 'get':
        const ticketId = url.searchParams.get('ticketId');
        return await handleGetTicket(supabaseClient, portalUser, ticketId!, clientIp, userAgent);
      case 'create':
        const body = await req.json();
        return await handleCreateTicket(supabaseClient, portalUser, body as CreateTicketRequest, clientIp, userAgent);
      case 'add-comment':
        const commentBody = await req.json();
        return await handleAddComment(supabaseClient, portalUser, commentBody, clientIp, userAgent);
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

async function handleListTickets(supabase: any, portalUser: any, clientIp: string | null, userAgent: string | null) {
  const contactId = portalUser.contact_id;
  const clientId = portalUser.client_contacts.client_id;
  const canViewAll = portalUser.client_contacts.can_view_all_company_tickets || 
                     portalUser.client_contacts.portal_role === 'admin';

  logStep("Listing tickets", { contactId, canViewAll });

  let query = supabase
    .from('helpdesk_tickets')
    .select('id, subject, status, priority, category, created_at, updated_at, contact_id')
    .eq('customer_id', clientId)
    .order('created_at', { ascending: false });

  // If user can't view all, filter to their own tickets
  if (!canViewAll) {
    query = query.eq('contact_id', contactId);
  }

  const { data: tickets, error } = await query.limit(100);

  if (error) throw error;

  // Log activity
  await supabase.rpc('log_portal_activity', {
    p_portal_user_id: portalUser.id,
    p_activity_type: 'view_tickets',
    p_activity_details: { count: tickets?.length || 0 },
    p_ip_address: clientIp,
    p_user_agent: userAgent
  });

  return new Response(JSON.stringify({ tickets: tickets || [] }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function handleGetTicket(
  supabase: any, 
  portalUser: any, 
  ticketId: string,
  clientIp: string | null, 
  userAgent: string | null
) {
  if (!ticketId) throw new Error("Ticket ID required");

  const contactId = portalUser.contact_id;
  const clientId = portalUser.client_contacts.client_id;
  const canViewAll = portalUser.client_contacts.can_view_all_company_tickets || 
                     portalUser.client_contacts.portal_role === 'admin';

  // Get ticket
  const { data: ticket, error: ticketError } = await supabase
    .from('helpdesk_tickets')
    .select('*')
    .eq('id', ticketId)
    .eq('customer_id', clientId)
    .single();

  if (ticketError || !ticket) {
    throw new Error("Ticket not found");
  }

  // Check permission
  if (!canViewAll && ticket.contact_id !== contactId) {
    throw new Error("Access denied to this ticket");
  }

  // Get comments
  const { data: comments } = await supabase
    .from('ticket_comments')
    .select('id, content, is_internal, created_at, commenter_name, commenter_type')
    .eq('ticket_id', ticketId)
    .eq('is_internal', false) // Portal users only see public comments
    .order('created_at', { ascending: true });

  // Log activity
  await supabase.rpc('log_portal_activity', {
    p_portal_user_id: portalUser.id,
    p_activity_type: 'view_ticket',
    p_activity_details: { ticketId, subject: ticket.subject },
    p_ip_address: clientIp,
    p_user_agent: userAgent
  });

  return new Response(JSON.stringify({ ticket, comments: comments || [] }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function handleCreateTicket(
  supabase: any, 
  portalUser: any, 
  { subject, description, priority, category }: CreateTicketRequest,
  clientIp: string | null, 
  userAgent: string | null
) {
  if (!subject?.trim()) throw new Error("Subject is required");
  if (!description?.trim()) throw new Error("Description is required");

  const contactId = portalUser.contact_id;
  const clientId = portalUser.client_contacts.client_id;

  // Get MSP user_id from customer
  const { data: customer } = await supabase
    .from('rmm_customers')
    .select('user_id')
    .eq('id', clientId)
    .single();

  if (!customer) throw new Error("Customer not found");

  logStep("Creating ticket", { subject, contactId });

  // Create ticket with contact attribution
  const { data: ticket, error: ticketError } = await supabase
    .from('helpdesk_tickets')
    .insert({
      user_id: customer.user_id,
      customer_id: clientId,
      contact_id: contactId, // Auto-attribute to the portal user's contact
      subject: subject.trim(),
      description: description.trim(),
      priority: priority || 'medium',
      category: category || 'general',
      status: 'open',
      source: 'customer_portal'
    })
    .select()
    .single();

  if (ticketError) throw ticketError;

  // Log activity
  await supabase.rpc('log_portal_activity', {
    p_portal_user_id: portalUser.id,
    p_activity_type: 'create_ticket',
    p_activity_details: { ticketId: ticket.id, subject },
    p_ip_address: clientIp,
    p_user_agent: userAgent
  });

  logStep("Ticket created", { ticketId: ticket.id });

  return new Response(JSON.stringify({ ticket }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 201,
  });
}

async function handleAddComment(
  supabase: any, 
  portalUser: any, 
  { ticketId, content }: { ticketId: string; content: string },
  clientIp: string | null, 
  userAgent: string | null
) {
  if (!ticketId) throw new Error("Ticket ID required");
  if (!content?.trim()) throw new Error("Comment content is required");

  const contactId = portalUser.contact_id;
  const clientId = portalUser.client_contacts.client_id;
  const canViewAll = portalUser.client_contacts.can_view_all_company_tickets;

  // Verify ticket access
  const { data: ticket } = await supabase
    .from('helpdesk_tickets')
    .select('id, contact_id, customer_id')
    .eq('id', ticketId)
    .eq('customer_id', clientId)
    .single();

  if (!ticket) throw new Error("Ticket not found");
  if (!canViewAll && ticket.contact_id !== contactId) {
    throw new Error("Access denied to this ticket");
  }

  // Add comment
  const { data: comment, error: commentError } = await supabase
    .from('ticket_comments')
    .insert({
      ticket_id: ticketId,
      content: content.trim(),
      is_internal: false,
      commenter_name: portalUser.full_name,
      commenter_type: 'customer'
    })
    .select()
    .single();

  if (commentError) throw commentError;

  // Update ticket updated_at
  await supabase
    .from('helpdesk_tickets')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', ticketId);

  // Log activity
  await supabase.rpc('log_portal_activity', {
    p_portal_user_id: portalUser.id,
    p_activity_type: 'add_comment',
    p_activity_details: { ticketId },
    p_ip_address: clientIp,
    p_user_agent: userAgent
  });

  return new Response(JSON.stringify({ comment }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 201,
  });
}
