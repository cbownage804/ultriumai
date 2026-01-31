import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { emailContent, emailSubject, senderEmail, senderName, attachments, userId, clientId } = await req.json();

    if (!emailContent || !userId) {
      throw new Error('Email content and user ID are required');
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build content for analysis - include attachments if they're images
    const contentParts: any[] = [
      {
        type: "text",
        text: `Analyze this incoming support email and extract structured ticket information:

**From:** ${senderName || 'Unknown'} <${senderEmail || 'unknown@email.com'}>
**Subject:** ${emailSubject || 'No subject'}

**Email Body:**
${emailContent}

Extract and return a JSON object with:
{
  "title": "Clear, concise ticket title (max 100 chars)",
  "description": "Cleaned and formatted ticket description",
  "priority": "low" | "medium" | "high" | "critical",
  "category": "Hardware" | "Software" | "Network" | "Security" | "Email" | "Access" | "Other",
  "urgency_indicators": ["list of keywords that indicate urgency"],
  "affected_systems": ["list of systems/software mentioned"],
  "contact_info": { "name": "", "email": "", "phone": "" },
  "suggested_tags": ["relevant", "tags"],
  "sentiment": "frustrated" | "neutral" | "urgent" | "grateful",
  "requires_immediate_attention": true/false,
  "auto_response_suggested": "Brief acknowledgment message for the user"
}`
      }
    ];

    // Add image attachments for vision analysis
    if (attachments && attachments.length > 0) {
      const imageAttachments = attachments
        .filter((a: any) => a.contentType?.startsWith('image/'))
        .slice(0, 5);

      for (const attachment of imageAttachments) {
        if (attachment.base64) {
          contentParts.push({
            type: "image_url",
            image_url: {
              url: `data:${attachment.contentType};base64,${attachment.base64}`
            }
          });
        }
      }

      if (imageAttachments.length > 0) {
        contentParts[0].text += `\n\nThe email includes ${imageAttachments.length} screenshot(s)/image(s). Analyze them to better understand the issue being reported.`;
      }
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert IT helpdesk email analyzer. Parse incoming support emails to extract structured ticket data. 
Be thorough in detecting urgency, affected systems, and categorization.
Always respond with valid JSON only.`
          },
          {
            role: 'user',
            content: contentParts
          }
        ],
        max_tokens: 2000
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    let parsedTicket;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedTicket = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
    }

    // Fallback if AI parsing fails
    if (!parsedTicket) {
      parsedTicket = {
        title: emailSubject || 'Support Request',
        description: emailContent,
        priority: 'medium',
        category: 'Other',
        urgency_indicators: [],
        affected_systems: [],
        contact_info: { name: senderName, email: senderEmail },
        suggested_tags: ['email-submitted'],
        sentiment: 'neutral',
        requires_immediate_attention: false,
        auto_response_suggested: 'Thank you for contacting support. We have received your request and will respond shortly.'
      };
    }

    // Optionally create the ticket directly
    if (clientId) {
      const { data: ticket, error: ticketError } = await supabase
        .from('vanguard_tickets')
        .insert({
          title: parsedTicket.title,
          description: parsedTicket.description,
          priority: parsedTicket.priority,
          status: 'new',
          client_id: clientId,
          user_id: userId,
          source: 'email',
          metadata: {
            original_email: {
              subject: emailSubject,
              sender: senderEmail,
              sender_name: senderName
            },
            ai_analysis: {
              category: parsedTicket.category,
              sentiment: parsedTicket.sentiment,
              urgency_indicators: parsedTicket.urgency_indicators,
              affected_systems: parsedTicket.affected_systems,
              requires_immediate_attention: parsedTicket.requires_immediate_attention
            }
          }
        })
        .select()
        .single();

      if (ticketError) {
        console.error('Error creating ticket:', ticketError);
      } else {
        parsedTicket.created_ticket_id = ticket?.id;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        ticket: parsedTicket
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Email parser error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
