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
    const { sessionId, title, duration, userId, frames, frameCount } = await req.json();

    if (!sessionId || !userId) {
      throw new Error('Session ID and User ID are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    const formatDuration = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    let generatedArticle;

    // Use AI Vision to analyze frames if available
    if (lovableApiKey && frames && frames.length > 0) {
      try {
        console.log(`Analyzing ${frames.length} frames with AI vision...`);

        // Build vision messages with frames
        const imageContents = frames.slice(0, 10).map((frame: string, index: number) => ({
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${frame}`
          }
        }));

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
                content: `You are an expert technical documentation writer. Analyze these screen recording frames and generate a detailed knowledge base article.

Your task:
1. Examine each frame carefully to understand what actions are being performed
2. Identify the application/website being used
3. Detect UI elements, buttons clicked, forms filled, navigation patterns
4. Create clear, actionable step-by-step documentation

Output a JSON object with this exact structure:
{
  "title": "How to: [specific action based on what you see]",
  "summary": "Clear overview of what this guide covers based on the screen content",
  "steps": [
    {
      "stepNumber": 1,
      "title": "Specific action title",
      "description": "Detailed description of what the user did in this frame, including specific UI elements, button names, menu items clicked, form fields filled",
      "timestamp": "0:00"
    }
  ],
  "category": "One of: How-To Guides, Troubleshooting, Configuration, Security Procedures, Onboarding, Best Practices",
  "tags": ["relevant", "tags", "based on content"],
  "tips": ["Helpful tips based on what you observed"]
}

Be specific! Mention exact button names, menu items, form fields, and application features you can see in the frames.`
              },
              {
                role: 'user',
                content: [
                  {
                    type: "text",
                    text: `Analyze these ${frames.length} screen recording frames from a ${formatDuration(duration)} recording titled "${title}". 
                    
The frames are captured every 5 seconds. Create a detailed step-by-step knowledge base article based on what you observe happening in each frame. Be specific about:
- What application/website is being used
- What buttons are clicked
- What forms are filled out
- What navigation occurs
- What the user accomplishes

Here are the frames to analyze:`
                  },
                  ...imageContents
                ]
              }
            ],
            max_tokens: 4000
          })
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content;
          
          if (content) {
            // Extract JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                generatedArticle = JSON.parse(jsonMatch[0]);
                console.log('Successfully generated article with AI vision analysis');
              } catch (parseError) {
                console.error('Failed to parse AI response as JSON:', parseError);
              }
            }
          }
        } else {
          const errorText = await aiResponse.text();
          console.error('AI vision API error:', aiResponse.status, errorText);
        }
      } catch (aiError) {
        console.error('AI vision generation error:', aiError);
      }
    }

    // Fallback to metadata-based generation if vision fails
    if (!generatedArticle && lovableApiKey) {
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
                content: `You are a technical documentation expert. Generate a professional knowledge base article from screen recording metadata. Create clear, actionable step-by-step guides.

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
                content: `Generate a knowledge base article for a screen recording:
- Title: "${title}"
- Duration: ${formatDuration(duration)}
- Frames captured: ${frameCount || 'unknown'}

Based on the title and duration, create appropriate documentation steps. Space timestamps evenly across the duration.`
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
        console.error('AI fallback generation error:', aiError);
      }
    }

    // Final fallback: template-based generation
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

    // Store the draft article
    await supabase.from('vanguard_kb_drafts').insert({
      user_id: userId,
      title: generatedArticle.title,
      content: JSON.stringify(generatedArticle),
      category: generatedArticle.category,
      tags: generatedArticle.tags,
      status: 'draft',
      generated_from: `Screen recording: ${title} (${formatDuration(duration)}, ${frameCount || 0} frames analyzed)`
    });

    return new Response(
      JSON.stringify({
        success: true,
        sessionId,
        article: generatedArticle,
        framesAnalyzed: frames?.length || 0
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
