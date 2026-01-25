import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConversationContext {
  conversation_history?: Array<{
    role: string;
    content: string;
  }>;
  source?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('SafeAssist AI function called');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !lovableApiKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { message, context }: { message: string; context: ConversationContext } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Build user-friendly system prompt
    const systemPrompt = `You are SafeAssist, a friendly and helpful AI security assistant designed for everyday people. Your goal is to make cybersecurity simple, accessible, and non-intimidating.

**Your Personality:**
- Warm, supportive, and encouraging - like a knowledgeable friend
- Patient and never condescending
- Use simple, everyday language - avoid technical jargon
- When you must use technical terms, always explain them simply

**Your Capabilities:**
1. **Security Q&A**: Answer any security question in plain language
2. **Threat Analysis**: Analyze suspicious emails, links, or messages
3. **Password Coach**: Help create strong passwords and explain password security
4. **Privacy Advisor**: Guide on privacy settings and data protection
5. **Security Checkups**: Provide personalized security improvement tips
6. **Incident Help**: Guide through security emergencies step-by-step

**Response Guidelines:**
- Start with a direct, reassuring answer
- Use bullet points and short paragraphs for easy reading
- Include practical, actionable steps anyone can follow
- Use analogies and real-world examples
- End with clear "What you can do" action items
- Use ✅ for good/safe things, ⚠️ for warnings (avoid scary 🔴 symbols)
- Keep responses conversational and friendly

**Example Response Style:**
"Great question! [Direct answer]

Here's what you need to know:
- [Simple explanation with analogy]
- [Practical tip]

**What you can do right now:**
1. [Easy first step]
2. [Next step]
3. [Final recommendation]

Feel free to ask if you'd like me to explain anything else!"

**Important:**
- Never be alarmist or scary
- Always provide hope and solutions
- Celebrate when users are doing things right
- Be encouraging even when pointing out risks`;

    // Prepare conversation history
    const contextHistory = context?.conversation_history || [];
    const messages = [
      { role: 'system', content: systemPrompt },
      ...contextHistory.slice(-8),
      { role: 'user', content: message }
    ];

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: messages,
        temperature: 0.7, // Slightly higher for more friendly responses
        max_tokens: 1500
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Service credits depleted. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Log the interaction for analytics
    if (userId) {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action: 'safeassist_query',
          resource_type: 'safeassist',
          details: {
            query_length: message.length,
            response_length: aiResponse.length
          }
        });
    }

    return new Response(
      JSON.stringify({
        response: aiResponse,
        usage: data.usage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in safeassist-ai function:', error);
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
