import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const APP_SYSTEM_PROMPTS: Record<string, string> = {
  safescan: `You are SafeScan AI, a security scanning assistant. You help users understand:
- URL, email, and document scan results
- Threat detection and risk levels
- Phishing and malware indicators
- Security best practices
Be concise, security-focused, and actionable.`,

  safepass: `You are SafePass AI, a password security assistant. You help users with:
- Password strength and best practices
- Understanding breach notifications
- Two-factor authentication guidance
- Secure credential management
Be security-conscious and practical.`,

  safemail: `You are SafeMail AI, an email security assistant. You help users with:
- Identifying phishing emails
- Understanding SPF, DKIM, DMARC
- Email header analysis
- Responding to email threats
Be precise and educational.`,

  safelink: `You are SafeLink AI, a URL security assistant. You help users with:
- Understanding URL scan results
- Domain reputation analysis
- Safe browsing practices
- Identifying malicious links
Be clear and protective.`,

  safedoc: `You are SafeDoc AI, a document security assistant. You help users with:
- Understanding document scan results
- Malware detection in files
- Safe file handling practices
- Identifying dangerous file types
Be thorough and cautious.`,

  safenet: `You are SafeNet AI, a network security assistant. You help users with:
- Network vulnerability assessment
- Firewall configuration guidance
- Intrusion detection insights
- Network security best practices
Be technical yet accessible.`,

  safeshield: `You are SafeShield AI, an endpoint protection assistant. You help users with:
- Endpoint security strategies
- Threat prevention measures
- Compliance and security frameworks
- Zero trust architecture
Be comprehensive and strategic.`,

  safekb: `You are SafeKB AI, a security knowledge assistant. You help users with:
- Security documentation and policies
- Training and awareness content
- Incident response planning
- Security framework implementation
Be educational and thorough.`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { app_type, messages, context } = await req.json();
    console.log(`[App AI Assistant] app_type: ${app_type}, messages: ${messages?.length}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = APP_SYSTEM_PROMPTS[app_type] || APP_SYSTEM_PROMPTS.safescan;
    
    let contextMessage = '';
    if (context) {
      contextMessage = `\n\nCurrent context:\n${JSON.stringify(context, null, 2)}`;
    }

    const apiMessages = [
      { role: 'system', content: systemPrompt + contextMessage },
      ...messages
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: apiMessages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a moment.',
          response: 'I apologize, but I\'m currently experiencing high demand. Please try again in a few seconds.'
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI credits exhausted.',
          response: 'AI features are temporarily unavailable. Please contact support.'
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'I could not generate a response.';

    console.log(`[App AI Assistant] Response generated successfully`);

    return new Response(JSON.stringify({ 
      response: aiResponse,
      app_type,
      tokens_used: data.usage?.total_tokens
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[App AI Assistant] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      response: 'I apologize, but I encountered an error. Please try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
