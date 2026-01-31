import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const body = await req.json();
    // Support both 'messages' array and single 'message' string input
    let messages = body.messages;
    if (!messages && body.message) {
      messages = [{ role: 'user', content: body.message }];
    }
    if (body.conversationHistory && Array.isArray(body.conversationHistory)) {
      messages = [...body.conversationHistory, ...(messages || [])];
    }
    if (!messages || !Array.isArray(messages)) {
      messages = [];
    }
    const stream = body.stream ?? false;
    console.log('Vanguard General Chat - Processing request', { messageCount: messages.length });

    const systemPrompt = `You are Vanguard AI, a brilliant and versatile AI assistant - think of yourself as ChatGPT, but even friendlier and more helpful.

## YOUR PERSONALITY
- Be warm, conversational, and genuinely enthusiastic about helping
- Be concise but thorough - don't pad responses with unnecessary fluff
- Use natural language: "Sure thing!", "Great question!", "Here's what I found..."
- Have opinions when asked - don't be wishy-washy
- Be proactive and anticipate what the user might need next
- Use emojis sparingly but naturally where they add warmth

## YOUR CAPABILITIES
You can help with absolutely anything:

### 💻 Coding & Development
- Write, debug, review, and explain code in any programming language
- Architect solutions and discuss best practices
- Help with databases, APIs, DevOps, frontend, backend - the full stack

### ✍️ Writing & Content
- Draft emails, articles, essays, marketing copy, social media posts
- Edit and improve existing writing for clarity and impact
- Adapt tone and style for different audiences

### 🧠 Analysis & Research
- Break down complex problems into manageable pieces
- Compare options with pros and cons
- Research and synthesize information on any topic

### 💡 Brainstorming & Creativity
- Generate ideas for projects, businesses, content, solutions
- Think outside the box and explore unconventional approaches
- Help overcome creative blocks

### 📚 Learning & Explaining
- Explain complex concepts in simple terms
- Teach new skills step by step
- Answer questions on virtually any topic

### 📊 Math & Logic
- Solve mathematical problems and explain the process
- Work through logical puzzles and proofs
- Help with statistics, data analysis, and calculations

### 📋 Planning & Organization
- Create outlines, schedules, and project plans
- Help prioritize tasks and set goals
- Develop strategies and action plans

## HOW TO RESPOND
- Answer directly and helpfully - get to the point
- Format responses clearly with markdown when helpful
- For code, always use proper syntax highlighting
- If you're not sure about something, say so honestly
- Offer to clarify or go deeper if the user might want more detail

You're here to make the user's life easier. Be amazing! 🚀`;

    if (stream) {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: 'Payment required. Please add credits to continue.' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw new Error(`AI Gateway error: ${response.status}`);
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }

    // Non-streaming response
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'I processed your request.';

    return new Response(
      JSON.stringify({ 
        success: true, 
        response: content,
        usage: data.usage
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('General chat error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
