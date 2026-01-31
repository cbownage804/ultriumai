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
    const { sessionId, title, duration, userId } = await req.json();

    if (!sessionId || !userId) {
      throw new Error('Session ID and User ID are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Format duration for display
    const formatDuration = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    let generatedArticle;

    // If Lovable AI is available, use it to generate better documentation
    if (lovableApiKey) {
      try {
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
                content: `You are a technical documentation expert. Generate professional knowledge base articles from screen recording metadata. Create clear, actionable step-by-step guides that IT professionals can follow.

Output JSON format:
{
  "title": "How to: [action]",
  "summary": "Brief overview of what this guide covers",
  "steps": [
    { "stepNumber": 1, "title": "Step title", "description": "Detailed step description", "timestamp": "0:00" }
  ],
  "category": "One of: How-To Guides, Troubleshooting, Configuration, Security Procedures, Onboarding, Best Practices, Quick Reference",
  "tags": ["tag1", "tag2"],
  "tips": ["Helpful tip 1", "Helpful tip 2"]
}`
              },
              {
                role: 'user',
                content: `Generate a knowledge base article for a screen recording with:
- Title: "${title}"
- Duration: ${formatDuration(duration)}

Based on the title and duration, infer what the recording might cover and create appropriate documentation steps. Space the timestamps evenly across the duration.`
              }
            ],
            tools: [
              {
                type: 'function',
                function: {
                  name: 'generate_kb_article',
                  description: 'Generate a structured knowledge base article',
                  parameters: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      summary: { type: 'string' },
                      steps: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            stepNumber: { type: 'number' },
                            title: { type: 'string' },
                            description: { type: 'string' },
                            timestamp: { type: 'string' }
                          },
                          required: ['stepNumber', 'title', 'description', 'timestamp']
                        }
                      },
                      category: { type: 'string' },
                      tags: { type: 'array', items: { type: 'string' } },
                      tips: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['title', 'summary', 'steps', 'category', 'tags', 'tips']
                  }
                }
              }
            ],
            tool_choice: { type: 'function', function: { name: 'generate_kb_article' } }
          })
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          
          if (toolCall?.function?.arguments) {
            generatedArticle = JSON.parse(toolCall.function.arguments);
          }
        }
      } catch (aiError) {
        console.error('AI generation error:', aiError);
        // Fall back to template-based generation
      }
    }

    // Fallback: Generate template-based article if AI fails or isn't available
    if (!generatedArticle) {
      const stepCount = Math.max(3, Math.min(8, Math.floor(duration / 30)));
      const timePerStep = duration / stepCount;

      const steps = [];
      for (let i = 0; i < stepCount; i++) {
        const timestamp = Math.floor(i * timePerStep);
        const mins = Math.floor(timestamp / 60);
        const secs = timestamp % 60;
        
        steps.push({
          stepNumber: i + 1,
          title: i === 0 ? 'Initial Setup' : 
                 i === stepCount - 1 ? 'Verification & Completion' : 
                 `Step ${i + 1}`,
          description: i === 0 ? 'Begin by accessing the application and preparing the environment.' :
                       i === stepCount - 1 ? 'Verify the results and confirm the operation completed successfully.' :
                       'Proceed with the next step in the process.',
          timestamp: `${mins}:${secs.toString().padStart(2, '0')}`
        });
      }

      // Infer category from title
      let category = 'How-To Guides';
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes('troubleshoot') || lowerTitle.includes('fix') || lowerTitle.includes('error')) {
        category = 'Troubleshooting';
      } else if (lowerTitle.includes('config') || lowerTitle.includes('setup') || lowerTitle.includes('install')) {
        category = 'Configuration';
      } else if (lowerTitle.includes('security') || lowerTitle.includes('firewall') || lowerTitle.includes('password')) {
        category = 'Security Procedures';
      } else if (lowerTitle.includes('onboard') || lowerTitle.includes('new user') || lowerTitle.includes('getting started')) {
        category = 'Onboarding';
      }

      // Generate tags from title
      const words = title.toLowerCase().split(/\s+/)
        .filter(w => w.length > 3 && !['that', 'this', 'with', 'from', 'have'].includes(w))
        .slice(0, 3);
      
      generatedArticle = {
        title: `How to: ${title}`,
        summary: `This guide walks through the process demonstrated in the ${formatDuration(duration)} recording titled "${title}". Follow the steps below to complete this procedure.`,
        steps,
        category,
        tags: [...words, 'walkthrough', 'screen-recording'].slice(0, 5),
        tips: [
          'Ensure all prerequisites are met before starting',
          'Save your work frequently during this process',
          'Contact support if you encounter any issues',
          'Refer to related documentation for additional context'
        ]
      };
    }

    // Store the session record
    await supabase.from('vanguard_kb_drafts').insert({
      user_id: userId,
      title: generatedArticle.title,
      content: JSON.stringify(generatedArticle),
      category: generatedArticle.category,
      tags: generatedArticle.tags,
      status: 'draft',
      generated_from: `Screen recording: ${title} (${formatDuration(duration)})`
    });

    return new Response(
      JSON.stringify({
        success: true,
        sessionId,
        article: generatedArticle
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Screen recording analyzer error:', error);
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
