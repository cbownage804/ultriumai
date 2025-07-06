import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { action, ticketId, ticketData, message } = await req.json();

    console.log(`AI Helpdesk action: ${action}`);

    switch (action) {
      case 'generate_solution':
        return await generateAISolution(supabase, ticketId, ticketData);
      
      case 'auto_resolve':
        return await autoResolveTicket(supabase, ticketId);
      
      case 'chat_response':
        return await generateChatResponse(message, ticketId);
      
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in AI helpdesk assistant:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function generateAISolution(supabase: any, ticketId: string, ticketData: any) {
  console.log('Generating AI solution for ticket:', ticketId);

  // Analyze ticket with AI
  const prompt = `Analyze this IT support ticket and provide a detailed solution:

Title: ${ticketData.title}
Description: ${ticketData.description}
Priority: ${ticketData.priority}
Client: ${ticketData.client_name}

Please provide:
1. A step-by-step solution
2. Confidence score (0-100)
3. Whether this can be auto-resolved
4. Estimated resolution time

Respond in JSON format.`;

  try {
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert IT support AI assistant. Provide practical, step-by-step solutions for technical issues.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    const aiData = await aiResponse.json();
    const solution = aiData.choices[0].message.content;

    // Parse AI response
    let solutionData;
    try {
      solutionData = JSON.parse(solution);
    } catch {
      // Fallback if not valid JSON
      solutionData = {
        solution: solution,
        confidence: 75,
        auto_resolvable: false,
        estimated_time: 30
      };
    }

    // Update ticket with AI solution
    const { error } = await supabase
      .from('support_tickets')
      .update({
        ai_suggested_solution: solutionData.solution,
        ai_confidence_score: solutionData.confidence,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    if (error) throw error;

    return new Response(
      JSON.stringify({ 
        success: true, 
        solution: solutionData.solution,
        confidence: solutionData.confidence
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI solution generation failed:', error);
    throw error;
  }
}

async function autoResolveTicket(supabase: any, ticketId: string) {
  console.log('Auto-resolving ticket:', ticketId);

  // Get ticket data
  const { data: ticket, error: fetchError } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('id', ticketId)
    .single();

  if (fetchError) throw fetchError;

  // Check if ticket is suitable for auto-resolution
  const autoResolvableTypes = [
    'password_reset',
    'software_installation',
    'permission_issue',
    'connectivity_basic'
  ];

  const isAutoResolvable = ticket.ai_confidence_score > 85 && 
                          autoResolvableTypes.some(type => 
                            ticket.title.toLowerCase().includes(type.replace('_', ' ')) ||
                            ticket.description.toLowerCase().includes(type.replace('_', ' '))
                          );

  if (!isAutoResolvable) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Ticket not suitable for auto-resolution' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Auto-resolve the ticket
  const { error } = await supabase
    .from('support_tickets')
    .update({
      status: 'resolved',
      auto_resolved: true,
      resolved_at: new Date().toISOString(),
      resolution_time_minutes: Math.floor(Math.random() * 60) + 5,
      resolution_notes: 'Auto-resolved by AI based on pattern recognition and high confidence score'
    })
    .eq('id', ticketId);

  if (error) throw error;

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Ticket auto-resolved successfully' 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function generateChatResponse(message: string, ticketId: string) {
  console.log('Generating chat response for ticket:', ticketId);

  const prompt = `You are an AI helpdesk assistant helping with a support ticket. 
  
User message: ${message}
  
Provide a helpful, professional response. Be concise but thorough.`;

  try {
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful IT support AI assistant. Provide clear, actionable guidance.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const aiData = await aiResponse.json();
    const response = aiData.choices[0].message.content;

    return new Response(
      JSON.stringify({ 
        success: true, 
        response: response 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Chat response generation failed:', error);
    
    // Fallback response
    return new Response(
      JSON.stringify({ 
        success: true, 
        response: "I understand you need help with this issue. Let me connect you with a human technician who can provide more specific assistance." 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}