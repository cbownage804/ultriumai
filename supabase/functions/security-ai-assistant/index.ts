import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SecurityContext {
  security_state?: {
    activeAlerts: number;
    criticalThreats: number;
    openIncidents: number;
    complianceScore: number;
  };
  conversation_history?: Array<{
    role: string;
    content: string;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

    if (!supabaseUrl || !supabaseServiceKey || !openAIApiKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { message, context }: { message: string; context: SecurityContext } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get current user ID from auth
    const authHeader = req.headers.get('authorization');
    let userId = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    // Gather real-time security data for context
    const securityData = await gatherSecurityContext(supabase, userId);
    
    // Build comprehensive context for the AI
    const systemPrompt = `You are UltriumDefender AI, an elite cybersecurity analyst and automated security operations assistant. You have real-time access to the user's security infrastructure and data.

**Your Capabilities:**
- Real-time threat analysis and incident response
- Compliance monitoring and reporting
- Automated security recommendations
- Risk assessment and mitigation strategies
- Security operations assistance

**Current Security State:**
${JSON.stringify(securityData, null, 2)}

**Instructions:**
1. Always provide actionable, specific security advice
2. Reference current security metrics when relevant
3. Suggest automated actions when appropriate
4. Use security terminology accurately
5. Prioritize critical threats and incidents
6. Be concise but comprehensive
7. Include specific next steps when possible

**Response Format:**
- Use markdown formatting for clarity
- Include severity indicators (🔴 Critical, 🟡 Warning, 🟢 Good)
- Suggest follow-up questions or actions
- Reference specific security data when relevant`;

    // Prepare conversation history for context
    const conversationHistory = context.conversation_history || [];
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-8), // Last 8 messages for context
      { role: 'user', content: message }
    ];

    // Call OpenAI for intelligent security analysis
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: messages,
        temperature: 0.3, // Lower temperature for more precise security responses
        max_tokens: 2000,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Generate contextual suggestions based on the response and current security state
    const suggestions = generateSecuritySuggestions(aiResponse, securityData, message);

    // Log the interaction for security audit
    if (userId) {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action: 'security_ai_query',
          resource_type: 'security_assistant',
          details: {
            query: message,
            response_length: aiResponse.length,
            security_context: securityData
          }
        });
    }

    return new Response(
      JSON.stringify({
        response: aiResponse,
        context: {
          activeAlerts: securityData.activeAlerts,
          criticalThreats: securityData.criticalThreats,
          openIncidents: securityData.openIncidents,
          complianceScore: securityData.complianceScore,
          suggestions: suggestions
        },
        suggested_actions: generateAutomatedActions(aiResponse, securityData),
        usage: data.usage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in security-ai-assistant function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function gatherSecurityContext(supabase: any, userId: string | null) {
  const securityContext = {
    activeAlerts: 0,
    criticalThreats: 0,
    openIncidents: 0,
    complianceScore: 85,
    recentEvents: [],
    vulnerabilities: [],
    networkActivity: [],
    complianceStatus: []
  };

  if (!userId) return securityContext;

  try {
    // Get active security events
    const { data: securityEvents } = await supabase
      .from('security_events')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10);

    if (securityEvents) {
      securityContext.activeAlerts = securityEvents.length;
      securityContext.criticalThreats = securityEvents.filter(e => e.severity === 'critical').length;
      securityContext.recentEvents = securityEvents;
    }

    // Get open incidents
    const { data: incidents } = await supabase
      .from('incidents')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['open', 'investigating', 'escalated'])
      .limit(5);

    if (incidents) {
      securityContext.openIncidents = incidents.length;
    }

    // Get compliance status
    const { data: compliance } = await supabase
      .from('compliance_status')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(5);

    if (compliance && compliance.length > 0) {
      const avgScore = compliance.reduce((sum, c) => sum + (c.score || 0), 0) / compliance.length;
      securityContext.complianceScore = Math.round(avgScore);
      securityContext.complianceStatus = compliance;
    }

    // Get recent EDR alerts
    const { data: edrAlerts } = await supabase
      .from('edr_realtime_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'new')
      .order('created_at', { ascending: false })
      .limit(5);

    if (edrAlerts) {
      securityContext.activeAlerts += edrAlerts.length;
      securityContext.criticalThreats += edrAlerts.filter(a => a.severity === 'critical').length;
    }

  } catch (error) {
    console.error('Error gathering security context:', error);
  }

  return securityContext;
}

function generateSecuritySuggestions(aiResponse: string, securityData: any, userQuery: string): string[] {
  const suggestions = [];

  // Context-aware suggestions based on current security state
  if (securityData.criticalThreats > 0) {
    suggestions.push("Investigate critical threats immediately");
    suggestions.push("Show threat mitigation steps");
  }

  if (securityData.openIncidents > 0) {
    suggestions.push("Review open incident details");
    suggestions.push("Generate incident response plan");
  }

  if (securityData.complianceScore < 90) {
    suggestions.push("Show compliance improvement plan");
    suggestions.push("List non-compliant controls");
  }

  // Query-specific suggestions
  if (userQuery.toLowerCase().includes('risk')) {
    suggestions.push("Calculate risk score");
    suggestions.push("Show risk mitigation timeline");
  }

  if (userQuery.toLowerCase().includes('report')) {
    suggestions.push("Generate executive summary");
    suggestions.push("Export detailed security report");
  }

  // Always include these common actions
  suggestions.push("Run security health check");
  suggestions.push("Show security trends");

  return suggestions.slice(0, 3); // Limit to 3 suggestions
}

function generateAutomatedActions(aiResponse: string, securityData: any): string[] {
  const actions = [];

  // Automated response suggestions based on AI analysis
  if (aiResponse.includes('critical') || aiResponse.includes('immediate')) {
    actions.push('Create high-priority incident');
    actions.push('Send alert to security team');
  }

  if (aiResponse.includes('block') || aiResponse.includes('quarantine')) {
    actions.push('Auto-quarantine suspicious files');
    actions.push('Block suspicious network traffic');
  }

  if (aiResponse.includes('patch') || aiResponse.includes('update')) {
    actions.push('Schedule security updates');
    actions.push('Generate patch management report');
  }

  if (securityData.criticalThreats > 3) {
    actions.push('Activate incident response team');
    actions.push('Enable enhanced monitoring');
  }

  return actions;
}