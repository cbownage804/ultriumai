import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, ticketId, ticketData } = await req.json();
    console.log(`Vanguard AI Ticket Processor - Action: ${action}, Ticket: ${ticketId}`);

    switch (action) {
      case 'process_ticket':
        return await processTicket(supabase, ticketId, ticketData, LOVABLE_API_KEY);
      
      case 'generate_solution':
        return await generateSolution(supabase, ticketId, ticketData, LOVABLE_API_KEY);
      
      case 'analyze_security':
        return await analyzeSecurityContext(ticketData, LOVABLE_API_KEY);
      
      default:
        throw new Error(`Invalid action: ${action}`);
    }
  } catch (error) {
    console.error('Error in vanguard-ai-ticket-processor:', error);
    
    if (error.message?.includes('Rate limit') || error.status === 429) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (error.status === 402) {
      return new Response(
        JSON.stringify({ error: 'Payment required. Please add credits to continue.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processTicket(supabase: any, ticketId: string, ticketData: any, apiKey: string) {
  // Update status to processing
  await supabase
    .from('vanguard_service_tickets')
    .update({ ai_processing_status: 'processing' })
    .eq('id', ticketId);

  const systemPrompt = `You are Vanguard AI, an expert security operations assistant. You analyze IT and security support tickets and provide actionable solutions.

Your expertise includes:
- Cybersecurity incident response
- Network security troubleshooting  
- Malware analysis and remediation
- Access control and authentication issues
- Compliance and audit requirements
- General IT support

When analyzing tickets:
1. Identify the core issue and potential security implications
2. Assess priority and urgency
3. Provide step-by-step remediation guidance
4. Flag any security concerns that need immediate attention`;

  const prompt = `Analyze this support ticket and provide a solution:

**Title:** ${ticketData.title}
**Description:** ${ticketData.description}
**Category:** ${ticketData.category || 'General'}
**Security Category:** ${ticketData.security_category || 'Not specified'}
**Priority:** ${ticketData.priority}
**Requester:** ${ticketData.requester_name || 'Not specified'}

Provide your response using the suggest_ticket_solution function.`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'suggest_ticket_solution',
            description: 'Provide a structured solution for the support ticket',
            parameters: {
              type: 'object',
              properties: {
                summary: {
                  type: 'string',
                  description: 'Brief summary of the issue (2-3 sentences)'
                },
                solution: {
                  type: 'string',
                  description: 'Step-by-step solution to resolve the issue'
                },
                confidence_score: {
                  type: 'integer',
                  description: 'Confidence score 0-100 for the suggested solution'
                },
                auto_resolvable: {
                  type: 'boolean',
                  description: 'Whether this ticket can be auto-resolved by sending the solution to the user'
                },
                security_risk_level: {
                  type: 'string',
                  enum: ['none', 'low', 'medium', 'high', 'critical'],
                  description: 'Security risk level of this issue'
                },
                recommended_priority: {
                  type: 'string',
                  enum: ['low', 'medium', 'high', 'critical'],
                  description: 'Recommended priority based on analysis'
                },
                additional_notes: {
                  type: 'string',
                  description: 'Any additional notes for the technician'
                }
              },
              required: ['summary', 'solution', 'confidence_score', 'auto_resolvable', 'security_risk_level'],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'suggest_ticket_solution' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        throw { status: 429, message: 'Rate limit exceeded' };
      }
      if (response.status === 402) {
        throw { status: 402, message: 'Payment required' };
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    let result;
    if (toolCall?.function?.arguments) {
      result = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback if tool call didn't work
      result = {
        summary: 'Unable to generate summary',
        solution: data.choices?.[0]?.message?.content || 'Please review this ticket manually.',
        confidence_score: 50,
        auto_resolvable: false,
        security_risk_level: 'low'
      };
    }

    // Update ticket with AI analysis
    const { error: updateError } = await supabase
      .from('vanguard_service_tickets')
      .update({
        ai_suggested_solution: result.solution,
        ai_confidence_score: result.confidence_score,
        ai_summary: result.summary,
        ai_processing_status: 'completed',
        security_category: result.security_risk_level !== 'none' ? result.security_risk_level : ticketData.security_category,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    if (updateError) {
      console.error('Error updating ticket:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        ticketId,
        analysis: result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // Update status to failed
    await supabase
      .from('vanguard_service_tickets')
      .update({ ai_processing_status: 'failed' })
      .eq('id', ticketId);
    
    throw error;
  }
}

async function generateSolution(supabase: any, ticketId: string, ticketData: any, apiKey: string) {
  const systemPrompt = `You are Vanguard AI, a security operations expert. Generate detailed, actionable solutions for IT and security issues. Be specific and provide clear steps.`;

  const prompt = `Generate a detailed solution for this ticket:

**Title:** ${ticketData.title}
**Description:** ${ticketData.description}
**Category:** ${ticketData.category}
**Priority:** ${ticketData.priority}

Provide a comprehensive solution with:
1. Root cause analysis
2. Step-by-step remediation
3. Prevention recommendations
4. Any security considerations`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw { status: 429, message: 'Rate limit exceeded' };
    if (response.status === 402) throw { status: 402, message: 'Payment required' };
    throw new Error(`AI Gateway error: ${response.status}`);
  }

  const data = await response.json();
  const solution = data.choices?.[0]?.message?.content || 'Unable to generate solution';

  // Update ticket
  if (ticketId) {
    await supabase
      .from('vanguard_service_tickets')
      .update({
        ai_suggested_solution: solution,
        ai_processing_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);
  }

  return new Response(
    JSON.stringify({ success: true, solution }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function analyzeSecurityContext(ticketData: any, apiKey: string) {
  const systemPrompt = `You are a security analyst. Analyze the given context and identify potential security implications, risks, and recommended actions.`;

  const prompt = `Analyze the security context of this issue:

${JSON.stringify(ticketData, null, 2)}

Identify:
1. Security risk level (none/low/medium/high/critical)
2. Potential attack vectors or vulnerabilities
3. Recommended immediate actions
4. Long-term security improvements`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw { status: 429, message: 'Rate limit exceeded' };
    if (response.status === 402) throw { status: 402, message: 'Payment required' };
    throw new Error(`AI Gateway error: ${response.status}`);
  }

  const data = await response.json();
  const analysis = data.choices?.[0]?.message?.content || 'Unable to analyze';

  return new Response(
    JSON.stringify({ success: true, analysis }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
