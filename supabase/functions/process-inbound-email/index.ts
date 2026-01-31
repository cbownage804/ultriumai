import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InboundEmailPayload {
  from: string; // Full from header: "John Doe <john@acme.com>"
  to: string; // The support email address
  subject: string;
  body_text?: string;
  body_html?: string;
  message_id?: string;
  in_reply_to?: string;
  references?: string;
  cc?: string[];
  has_attachments?: boolean;
  attachments?: Array<{ filename: string; content_type: string; size: number }>;
  raw_headers?: Record<string, string>;
  // For webhook from email forwarding services
  config_id?: string;
  user_id?: string;
}

interface MatchResult {
  client_id: string | null;
  contact_id: string | null;
  device_id: string | null;
  match_method: 'contact_email' | 'domain' | 'device' | 'thread' | 'default' | null;
  match_confidence: number;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-EMAIL] ${step}${detailsStr}`);
};

// Extract email address from "Display Name <email@domain.com>" format
function parseEmailAddress(emailString: string): { name: string; email: string } {
  const match = emailString.match(/^(?:(.+?)\s*<)?([^<>]+)>?$/);
  if (match) {
    return {
      name: match[1]?.trim() || '',
      email: match[2]?.trim().toLowerCase() || emailString.toLowerCase()
    };
  }
  return { name: '', email: emailString.toLowerCase() };
}

// Extract domain from email address
function extractDomain(email: string): string {
  const parts = email.split('@');
  return parts[1] || '';
}

// Try to extract device info from email body
function extractDeviceInfo(body: string, patterns: string[]): Record<string, string> | null {
  const deviceInfo: Record<string, string> = {};
  
  for (const pattern of patterns) {
    const regex = new RegExp(`${pattern}\\s*[:\\-]?\\s*([^\\n\\r]+)`, 'i');
    const match = body.match(regex);
    if (match && match[1]) {
      const key = pattern.replace(/[:\-\s]/g, '').toLowerCase();
      deviceInfo[key] = match[1].trim();
    }
  }
  
  return Object.keys(deviceInfo).length > 0 ? deviceInfo : null;
}

// Generate thread ID from subject
function generateThreadId(subject: string): string {
  // Remove common prefixes and normalize
  const normalized = subject
    .toLowerCase()
    .replace(/^(re:|fw:|fwd:)\s*/gi, '')
    .trim();
  
  // Create a simple hash
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `thread_${Math.abs(hash).toString(36)}`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: InboundEmailPayload = await req.json();
    logStep("Received email payload", { from: payload.from, subject: payload.subject });

    // Parse the from address
    const { name: senderName, email: senderEmail } = parseEmailAddress(payload.from);
    const senderDomain = extractDomain(senderEmail);
    logStep("Parsed sender", { name: senderName, email: senderEmail, domain: senderDomain });

    // Find the email config based on the "to" address
    const { data: emailConfig, error: configError } = await supabase
      .from('vanguard_email_configs')
      .select('*, email_routing_settings(*)')
      .eq('incoming_email', payload.to.toLowerCase())
      .eq('is_active', true)
      .single();

    if (configError || !emailConfig) {
      logStep("No active config found for address", { to: payload.to });
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No active email configuration found for this address' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = emailConfig.user_id;
    const routingSettings = emailConfig.email_routing_settings?.[0] || {
      enable_contact_matching: true,
      enable_domain_matching: true,
      enable_device_matching: true,
      enable_auto_learning: true,
      unknown_sender_action: 'create_unassigned',
      parse_device_info: false,
      device_info_patterns: ['Device:', 'Hostname:', 'Computer:'],
    };

    logStep("Found email config", { configId: emailConfig.id, userId });

    // Initialize match result
    let matchResult: MatchResult = {
      client_id: null,
      contact_id: null,
      device_id: null,
      match_method: null,
      match_confidence: 0
    };

    // STEP 1: Check for thread/conversation match (existing ticket reply)
    if (payload.in_reply_to || payload.references) {
      const threadId = generateThreadId(payload.subject);
      
      const { data: existingEmail } = await supabase
        .from('vanguard_inbound_emails')
        .select('matched_client_id, matched_contact_id, ticket_id')
        .eq('user_id', userId)
        .eq('thread_id', threadId)
        .not('matched_client_id', 'is', null)
        .order('received_at', { ascending: false })
        .limit(1)
        .single();

      if (existingEmail?.matched_client_id) {
        matchResult = {
          client_id: existingEmail.matched_client_id,
          contact_id: existingEmail.matched_contact_id,
          device_id: null,
          match_method: 'thread',
          match_confidence: 0.95
        };
        logStep("Matched via thread", { threadId, clientId: existingEmail.matched_client_id });
      }
    }

    // STEP 2: Try contact email exact match
    if (!matchResult.client_id && routingSettings.enable_contact_matching) {
      // First check our explicit mappings
      const { data: contactMapping } = await supabase
        .from('email_contact_mappings')
        .select('client_id, contact_id')
        .eq('user_id', userId)
        .eq('email_address', senderEmail)
        .eq('is_active', true)
        .single();

      if (contactMapping?.client_id) {
        matchResult = {
          client_id: contactMapping.client_id,
          contact_id: contactMapping.contact_id,
          device_id: null,
          match_method: 'contact_email',
          match_confidence: 1.0
        };
        logStep("Matched via contact mapping", { clientId: contactMapping.client_id });
      } else {
        // Check client_contacts table directly
        const { data: contact } = await supabase
          .from('client_contacts')
          .select('id, client_id')
          .eq('email', senderEmail)
          .eq('is_active', true)
          .single();

        if (contact?.client_id) {
          // Verify this client belongs to the user
          const { data: client } = await supabase
            .from('msp_clients')
            .select('id')
            .eq('id', contact.client_id)
            .eq('msp_id', userId)
            .single();

          if (client) {
            matchResult = {
              client_id: contact.client_id,
              contact_id: contact.id,
              device_id: null,
              match_method: 'contact_email',
              match_confidence: 1.0
            };
            logStep("Matched via client_contacts table", { clientId: contact.client_id });

            // Auto-learn this mapping if enabled
            if (routingSettings.enable_auto_learning) {
              await supabase.from('email_contact_mappings').upsert({
                user_id: userId,
                email_config_id: emailConfig.id,
                email_address: senderEmail,
                client_id: contact.client_id,
                contact_id: contact.id,
                is_active: true,
                auto_created: true
              }, { onConflict: 'user_id, email_address' });
              logStep("Auto-learned contact mapping");
            }
          }
        }
      }
    }

    // STEP 3: Try domain match
    if (!matchResult.client_id && routingSettings.enable_domain_matching && senderDomain) {
      // Check explicit domain mappings
      const { data: domainMapping } = await supabase
        .from('email_domain_mappings')
        .select('client_id')
        .eq('user_id', userId)
        .eq('domain', senderDomain)
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .limit(1)
        .single();

      if (domainMapping?.client_id) {
        matchResult = {
          client_id: domainMapping.client_id,
          contact_id: null,
          device_id: null,
          match_method: 'domain',
          match_confidence: 0.85
        };
        logStep("Matched via domain mapping", { domain: senderDomain, clientId: domainMapping.client_id });
      } else {
        // Check if client domain matches
        const { data: clientByDomain } = await supabase
          .from('msp_clients')
          .select('id')
          .eq('msp_id', userId)
          .eq('domain', senderDomain)
          .eq('is_active', true)
          .single();

        if (clientByDomain) {
          matchResult = {
            client_id: clientByDomain.id,
            contact_id: null,
            device_id: null,
            match_method: 'domain',
            match_confidence: 0.80
          };
          logStep("Matched via client domain field", { domain: senderDomain, clientId: clientByDomain.id });
        }
      }
    }

    // STEP 4: Try device match (if parsing is enabled and we have body content)
    let extractedDeviceInfo = null;
    if (!matchResult.client_id && routingSettings.enable_device_matching && routingSettings.parse_device_info) {
      const bodyContent = payload.body_text || '';
      extractedDeviceInfo = extractDeviceInfo(bodyContent, routingSettings.device_info_patterns);

      if (extractedDeviceInfo) {
        logStep("Extracted device info from body", extractedDeviceInfo);

        // Try to match hostname or other identifiers
        const hostname = extractedDeviceInfo.hostname || extractedDeviceInfo.device || extractedDeviceInfo.computer;
        
        if (hostname) {
          const { data: deviceMapping } = await supabase
            .from('email_device_mappings')
            .select('client_id, agent_id')
            .eq('user_id', userId)
            .eq('device_identifier', hostname.toLowerCase())
            .eq('is_active', true)
            .single();

          if (deviceMapping?.client_id) {
            matchResult = {
              client_id: deviceMapping.client_id,
              contact_id: null,
              device_id: deviceMapping.agent_id,
              match_method: 'device',
              match_confidence: 0.90
            };
            logStep("Matched via device mapping", { hostname, clientId: deviceMapping.client_id });
          } else {
            // Try matching via vanguard_agents table
            const { data: agent } = await supabase
              .from('vanguard_agents')
              .select('id, client_id')
              .eq('user_id', userId)
              .ilike('name', hostname)
              .single();

            if (agent?.client_id) {
              matchResult = {
                client_id: agent.client_id,
                contact_id: null,
                device_id: agent.id,
                match_method: 'device',
                match_confidence: 0.85
              };
              logStep("Matched via vanguard_agents table", { hostname, clientId: agent.client_id });
            }
          }
        }
      }
    }

    // STEP 5: Apply default client if configured and no match found
    if (!matchResult.client_id && routingSettings.unknown_sender_action === 'assign_default' && routingSettings.default_client_id) {
      matchResult = {
        client_id: routingSettings.default_client_id,
        contact_id: null,
        device_id: null,
        match_method: 'default',
        match_confidence: 0.50
      };
      logStep("Using default client", { clientId: routingSettings.default_client_id });
    }

    // Generate thread ID for this email
    const threadId = generateThreadId(payload.subject);

    // Create the inbound email record
    const { data: inboundEmail, error: insertError } = await supabase
      .from('vanguard_inbound_emails')
      .insert({
        user_id: userId,
        config_id: emailConfig.id,
        from_address: senderEmail,
        sender_name: senderName,
        subject: payload.subject,
        body: payload.body_html || payload.body_text || '',
        received_at: new Date().toISOString(),
        status: routingSettings.unknown_sender_action === 'hold_for_review' && !matchResult.client_id ? 'pending' : 'pending',
        has_attachments: payload.has_attachments || false,
        raw_headers: payload.raw_headers || {},
        matched_client_id: matchResult.client_id,
        matched_contact_id: matchResult.contact_id,
        matched_device_id: matchResult.device_id,
        match_method: matchResult.match_method,
        match_confidence: matchResult.match_confidence,
        thread_id: threadId,
        message_id: payload.message_id,
        in_reply_to: payload.in_reply_to,
        cc_addresses: payload.cc,
        extracted_device_info: extractedDeviceInfo
      })
      .select()
      .single();

    if (insertError) {
      logStep("Failed to insert inbound email", { error: insertError.message });
      throw insertError;
    }

    logStep("Created inbound email record", { id: inboundEmail.id, matchResult });

    // Auto-create ticket if configured and we have enough confidence
    let ticketId = null;
    if (emailConfig.auto_create_tickets && matchResult.match_confidence >= 0.5) {
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          user_id: userId,
          title: payload.subject || 'New Email Request',
          description: `Email from: ${payload.from}\n\n${payload.body_text || '(No text content)'}`,
          status: 'open',
          priority: emailConfig.default_priority || 'medium',
          client_id: matchResult.client_id,
          source: 'email',
          external_id: inboundEmail.id
        })
        .select('id')
        .single();

      if (!ticketError && ticket) {
        ticketId = ticket.id;
        
        // Update the inbound email with the ticket reference
        await supabase
          .from('vanguard_inbound_emails')
          .update({ ticket_id: ticketId, status: 'converted' })
          .eq('id', inboundEmail.id);

        logStep("Auto-created ticket", { ticketId, clientId: matchResult.client_id });
      }
    }

    // Send auto-reply if configured
    if (emailConfig.auto_reply_enabled && emailConfig.auto_reply_template) {
      // Queue auto-reply (you could call your send-email function here)
      logStep("Auto-reply would be sent", { template: emailConfig.auto_reply_template });
    }

    return new Response(JSON.stringify({
      success: true,
      email_id: inboundEmail.id,
      ticket_id: ticketId,
      match_result: matchResult,
      thread_id: threadId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    logStep("ERROR in process-inbound-email", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
