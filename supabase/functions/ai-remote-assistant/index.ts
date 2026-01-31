import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { context, query, integrations } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let relatedDocuments: any[] = [];
    let relatedPasswords: any[] = [];

    // Get SafeDoc documents if requested
    if (integrations?.safedoc) {
      const { data: docData } = await supabase.functions.invoke('safedoc-agent-integration', {
        body: {
          action: 'get_related_documents',
          context: context,
          device_id: context.device_id
        }
      });
      relatedDocuments = docData?.documents || [];
    }

    // Get SafePass suggestions if requested
    if (integrations?.safepass) {
      const { data: passData } = await supabase.functions.invoke('safepass-agent-integration', {
        body: {
          action: 'get_context_suggestions',
          context: context,
          device_id: context.device_id
        }
      });
      relatedPasswords = passData?.suggestions || [];
    }

    // Build context for AI
    const contextInfo = [];
    if (context.device_id) contextInfo.push(`Device ID: ${context.device_id}`);
    if (context.hostname) contextInfo.push(`Hostname: ${context.hostname}`);
    if (context.os) contextInfo.push(`OS: ${context.os}`);
    if (context.current_app) contextInfo.push(`Current Application: ${context.current_app}`);
    if (relatedDocuments.length > 0) {
      contextInfo.push(`Related Documents: ${relatedDocuments.map(d => d.title).join(', ')}`);
    }
    if (relatedPasswords.length > 0) {
      contextInfo.push(`Available Credentials: ${relatedPasswords.length} entries`);
    }

    // Generate AI response using Lovable AI Gateway
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are Vanguard AI Remote Assistant, an intelligent helper for IT technicians during remote sessions.
            
You have access to:
- Device context and system information
- Related documentation from SafeDoc
- Password/credential suggestions from SafePass
- Ability to suggest actions for the technician

Current Context:
${contextInfo.join('\n')}

Provide helpful, actionable responses. If you can suggest specific actions (like filling credentials, running scripts, or checking documentation), mention them clearly.`
          },
          { role: 'user', content: query || 'What can you help me with in this session?' }
        ]
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const response = aiData.choices?.[0]?.message?.content || 
      "I'm your AI remote assistant. How can I help you today?";

    // Generate contextual action suggestions
    const suggestions = generateActionSuggestions(context, integrations, relatedDocuments, relatedPasswords);

    return new Response(
      JSON.stringify({
        response,
        suggestions,
        related_documents: relatedDocuments,
        related_passwords: relatedPasswords.map(p => ({ ...p, password: undefined })), // Never expose actual passwords
        suggested_actions: []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('AI Remote Assistant Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateActionSuggestions(context: any, integrations: any, documents: any[], passwords: any[]): string[] {
  const suggestions = [];
  
  if (integrations?.safedoc && documents.length > 0) {
    suggestions.push('View related documentation');
    suggestions.push('Search knowledge base');
  }
  
  if (integrations?.safepass && passwords.length > 0) {
    suggestions.push('Auto-fill credentials');
    suggestions.push('Generate secure password');
  }
  
  if (context.os?.toLowerCase().includes('windows')) {
    suggestions.push('Run system diagnostics');
    suggestions.push('Check Windows Update status');
    suggestions.push('View Event Viewer logs');
  }
  
  if (context.os?.toLowerCase().includes('mac')) {
    suggestions.push('Check system health');
    suggestions.push('View Console logs');
  }
  
  suggestions.push('Check device security status');
  suggestions.push('View recent alerts');
  
  return suggestions.slice(0, 6);
}
