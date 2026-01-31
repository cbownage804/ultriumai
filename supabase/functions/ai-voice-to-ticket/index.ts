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
    const { transcription, outputType, userId, clientId, metadata } = await req.json();

    if (!transcription || !userId) {
      throw new Error('Transcription and user ID are required');
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const outputPrompts: Record<string, string> = {
      ticket: `Convert this voice transcription into a structured support ticket:
{
  "title": "Clear ticket title (max 100 chars)",
  "description": "Formatted ticket description with key details",
  "priority": "low" | "medium" | "high" | "critical",
  "category": "Hardware" | "Software" | "Network" | "Security" | "Access" | "Other",
  "affected_systems": ["Systems mentioned"],
  "steps_to_reproduce": ["Step 1", "Step 2"],
  "expected_behavior": "What should happen",
  "actual_behavior": "What is happening",
  "urgency_level": 1-5,
  "suggested_assignee_type": "network" | "security" | "desktop" | "server" | "general"
}`,

      kb_article: `Convert this voice transcription into a knowledge base article:
{
  "title": "Article title",
  "summary": "Brief overview",
  "content": "Full formatted article content in markdown",
  "category": "How-To Guides" | "Troubleshooting" | "Configuration" | "Security" | "Best Practices",
  "tags": ["relevant", "tags"],
  "difficulty": "beginner" | "intermediate" | "advanced",
  "estimated_time": "5 minutes",
  "prerequisites": ["Prerequisite 1"],
  "related_articles": ["Suggested related topic 1"]
}`,

      notes: `Convert this voice transcription into structured meeting/session notes:
{
  "title": "Notes title",
  "date": "ISO date",
  "attendees_mentioned": ["Names mentioned"],
  "summary": "Executive summary",
  "key_points": ["Key point 1", "Key point 2"],
  "action_items": [
    { "task": "Task description", "assignee": "Person mentioned", "deadline": "If mentioned" }
  ],
  "decisions_made": ["Decision 1"],
  "follow_ups_needed": ["Follow-up 1"],
  "tags": ["relevant", "tags"]
}`,

      task_list: `Convert this voice transcription into actionable tasks:
{
  "title": "Task list title",
  "tasks": [
    {
      "title": "Task title",
      "description": "Task details",
      "priority": "low" | "medium" | "high",
      "estimated_effort": "30 minutes",
      "dependencies": ["Depends on X"],
      "category": "Task category"
    }
  ],
  "summary": "Overview of tasks extracted"
}`
    };

    const prompt = outputPrompts[outputType] || outputPrompts.ticket;

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
            content: `You are an expert at converting voice transcriptions into structured, professional documentation.
Clean up filler words, organize thoughts logically, and extract actionable information.

${prompt}

Return ONLY valid JSON.`
          },
          {
            role: 'user',
            content: `Convert this voice transcription:

"${transcription}"

${metadata?.duration ? `Recording duration: ${metadata.duration} seconds` : ''}
${metadata?.speakerCount ? `Number of speakers detected: ${metadata.speakerCount}` : ''}

Generate structured ${outputType || 'ticket'} output.`
          }
        ],
        max_tokens: 4000
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI processing failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
    }

    if (!result) {
      throw new Error('Failed to process transcription');
    }

    // Save based on output type
    let savedRecord = null;

    if (outputType === 'ticket' && clientId) {
      const { data: ticket, error } = await supabase
        .from('vanguard_tickets')
        .insert({
          title: result.title,
          description: result.description,
          priority: result.priority,
          status: 'new',
          client_id: clientId,
          user_id: userId,
          source: 'voice',
          metadata: {
            transcription_source: true,
            original_transcription: transcription.substring(0, 500),
            ai_analysis: {
              category: result.category,
              affected_systems: result.affected_systems,
              urgency_level: result.urgency_level
            }
          }
        })
        .select()
        .single();

      if (!error && ticket) {
        savedRecord = { type: 'ticket', id: ticket.id };
      }
    } else if (outputType === 'kb_article') {
      const { data: article, error } = await supabase
        .from('client_portal_kb')
        .insert({
          title: result.title,
          content: result.content,
          category: result.category,
          tags: result.tags,
          is_public: false,
          created_by: userId
        })
        .select()
        .single();

      if (!error && article) {
        savedRecord = { type: 'kb_article', id: article.id };
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        outputType,
        result,
        savedRecord,
        originalTranscriptionLength: transcription.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Voice to ticket error:', error);
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
