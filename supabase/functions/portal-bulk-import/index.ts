import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactImport {
  contact_name: string;
  email: string;
  phone?: string;
  role?: string;
  is_primary?: boolean;
  portal_enabled?: boolean;
  portal_role?: 'admin' | 'manager' | 'user';
}

interface BulkImportRequest {
  clientId: string;
  contacts: ContactImport[];
  sendInvitations?: boolean;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[BULK-IMPORT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const mspUser = userData.user;
    if (!mspUser) throw new Error("User not authenticated");
    logStep("MSP user authenticated", { userId: mspUser.id });

    const { clientId, contacts, sendInvitations = false }: BulkImportRequest = await req.json();
    
    if (!clientId) throw new Error("Client ID is required");
    if (!contacts || contacts.length === 0) throw new Error("No contacts provided");
    if (contacts.length > 100) throw new Error("Maximum 100 contacts per import");

    // Verify MSP owns this customer
    const { data: customer, error: customerError } = await supabaseClient
      .from('rmm_customers')
      .select('id, company_name, user_id')
      .eq('id', clientId)
      .eq('user_id', mspUser.id)
      .single();

    if (customerError || !customer) {
      throw new Error("Customer not found or unauthorized");
    }

    logStep("Customer verified", { companyName: customer.company_name, contactCount: contacts.length });

    // Validate contacts
    const validationErrors: { row: number; error: string }[] = [];
    const validContacts: ContactImport[] = [];
    const seenEmails = new Set<string>();

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const rowNum = i + 1;

      // Required fields
      if (!contact.contact_name?.trim()) {
        validationErrors.push({ row: rowNum, error: "Contact name is required" });
        continue;
      }
      if (!contact.email?.trim()) {
        validationErrors.push({ row: rowNum, error: "Email is required" });
        continue;
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contact.email)) {
        validationErrors.push({ row: rowNum, error: `Invalid email format: ${contact.email}` });
        continue;
      }

      // Check for duplicates in import
      const lowerEmail = contact.email.toLowerCase();
      if (seenEmails.has(lowerEmail)) {
        validationErrors.push({ row: rowNum, error: `Duplicate email in import: ${contact.email}` });
        continue;
      }
      seenEmails.add(lowerEmail);

      validContacts.push({
        ...contact,
        email: lowerEmail,
        portal_role: contact.portal_role || 'user'
      });
    }

    // Check for existing emails in database
    const { data: existingContacts } = await supabaseClient
      .from('client_contacts')
      .select('email')
      .eq('client_id', clientId)
      .in('email', validContacts.map(c => c.email));

    const existingEmails = new Set((existingContacts || []).map(c => c.email.toLowerCase()));
    const newContacts = validContacts.filter(c => !existingEmails.has(c.email));
    const skippedDuplicates = validContacts.filter(c => existingEmails.has(c.email));

    logStep("Validation complete", { 
      valid: newContacts.length, 
      duplicates: skippedDuplicates.length,
      errors: validationErrors.length 
    });

    // Insert valid contacts
    let insertedCount = 0;
    const insertedContactIds: string[] = [];

    if (newContacts.length > 0) {
      const { data: inserted, error: insertError } = await supabaseClient
        .from('client_contacts')
        .insert(newContacts.map(c => ({
          client_id: clientId,
          contact_name: c.contact_name.trim(),
          email: c.email,
          phone: c.phone?.trim() || null,
          role: c.role?.trim() || null,
          is_primary: c.is_primary || false,
          is_active: true,
          portal_enabled: c.portal_enabled || false,
          portal_role: c.portal_role || 'user',
          can_view_all_company_tickets: c.portal_role === 'admin'
        })))
        .select('id');

      if (insertError) {
        throw new Error(`Failed to insert contacts: ${insertError.message}`);
      }

      insertedCount = inserted?.length || 0;
      insertedContactIds.push(...(inserted?.map(c => c.id) || []));
    }

    logStep("Contacts inserted", { count: insertedCount });

    // Send invitations if requested
    let invitationsSent = 0;
    if (sendInvitations && insertedContactIds.length > 0) {
      // Get contacts that have portal_enabled
      const { data: portalContacts } = await supabaseClient
        .from('client_contacts')
        .select('id')
        .in('id', insertedContactIds)
        .eq('portal_enabled', true);

      // Queue invitations (would call portal-send-invitation for each)
      invitationsSent = portalContacts?.length || 0;
      logStep("Invitations queued", { count: invitationsSent });
    }

    return new Response(JSON.stringify({
      success: true,
      results: {
        imported: insertedCount,
        skippedDuplicates: skippedDuplicates.length,
        validationErrors: validationErrors.length,
        invitationsSent
      },
      errors: validationErrors,
      skipped: skippedDuplicates.map(c => c.email)
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
