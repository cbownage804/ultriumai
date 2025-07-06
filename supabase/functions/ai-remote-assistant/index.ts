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

    let response = "I'm your AI remote assistant. How can I help you today?";
    let suggestions: string[] = [];
    let relatedDocuments: any[] = [];
    let relatedPasswords: any[] = [];
    let suggestedActions: any[] = [];

    // Process query with context awareness
    if (query) {
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

      // Generate AI response based on context
      response = await generateContextualResponse(query, context, relatedDocuments, relatedPasswords);
      suggestions = generateActionSuggestions(context, integrations);
    }

    return new Response(
      JSON.stringify({
        response,
        suggestions,
        related_documents: relatedDocuments,
        related_passwords: relatedPasswords,
        suggested_actions: suggestedActions
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('AI Remote Assistant Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateContextualResponse(query: string, context: any, documents: any[], passwords: any[]): Promise<string> {
  // Simple AI response generation based on context
  if (query.toLowerCase().includes('password')) {
    return `I found ${passwords.length} password-related suggestions for your current context. Would you like me to help you manage your credentials?`;
  }
  
  if (query.toLowerCase().includes('document') || query.toLowerCase().includes('file')) {
    return `I found ${documents.length} related documents that might be helpful. Would you like me to scan any files for security threats?`;
  }
  
  return `I'm analyzing your current session context. I can help you with password management, document security, and system administration tasks.`;
}

function generateActionSuggestions(context: any, integrations: any): string[] {
  const suggestions = [];
  
  if (integrations?.safedoc) {
    suggestions.push('Scan current documents for threats');
    suggestions.push('Check file security status');
  }
  
  if (integrations?.safepass) {
    suggestions.push('Fill login credentials');
    suggestions.push('Generate secure password');
  }
  
  suggestions.push('Check system health');
  suggestions.push('View security alerts');
  
  return suggestions;
}