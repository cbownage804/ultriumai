import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TicketAnalysisRequest {
  ticket_id: string;
  title: string;
  description: string;
  client_id?: string;
}

interface AIAnalysisResult {
  suggested_category: string;
  category_confidence: number;
  suggested_priority: string;
  priority_confidence: number;
  priority_factors: {
    urgency_keywords: string[];
    impact_indicators: string[];
  };
  sentiment: 'positive' | 'neutral' | 'negative' | 'frustrated' | 'urgent';
  sentiment_score: number;
  escalation_recommended: boolean;
  estimated_resolution_hours: number;
  suggested_responses: Array<{
    response: string;
    confidence: number;
    source: 'canned' | 'kb' | 'ai';
  }>;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AI-TICKET-PROCESSOR] ${step}${detailsStr}`);
};

const SYSTEM_PROMPT = `You are an AI assistant for an IT helpdesk/MSP ticketing system. Analyze support tickets and provide structured insights.

For each ticket, you must determine:
1. Category: One of [hardware, software, network, security, email, backup, access, printing, general]
2. Priority: One of [low, medium, high, critical] based on business impact and urgency
3. Sentiment: The customer's emotional state [positive, neutral, negative, frustrated, urgent]
4. Escalation: Whether this needs immediate human attention
5. Resolution estimate: Based on typical IT support patterns

Look for these urgency indicators:
- URGENT/ASAP/immediately/emergency/down/broken/can't work
- Multiple users affected, business-critical systems
- Security incidents, data loss risks
- Executive/VIP mentions

Look for these sentiment indicators:
- Frustrated: repeated issues, complaints, negative language, ALL CAPS
- Urgent: time pressure, deadlines, business impact
- Positive: thanks, appreciation, understanding

Provide 1-3 suggested response templates appropriate for the situation.`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: TicketAnalysisRequest = await req.json();
    logStep("Received ticket for analysis", { ticketId: payload.ticket_id });

    // Build the user prompt
    const userPrompt = `Analyze this support ticket:

Title: ${payload.title}
Description: ${payload.description}

Respond with a JSON object containing:
{
  "suggested_category": "one of: hardware, software, network, security, email, backup, access, printing, general",
  "category_confidence": 0.0-1.0,
  "suggested_priority": "one of: low, medium, high, critical",
  "priority_confidence": 0.0-1.0,
  "priority_factors": {
    "urgency_keywords": ["list", "of", "detected", "keywords"],
    "impact_indicators": ["list", "of", "impact", "factors"]
  },
  "sentiment": "one of: positive, neutral, negative, frustrated, urgent",
  "sentiment_score": -1.0 to 1.0 (negative to positive),
  "escalation_recommended": true/false,
  "estimated_resolution_hours": number,
  "suggested_responses": [
    {
      "response": "A professional response template...",
      "confidence": 0.0-1.0,
      "source": "ai"
    }
  ]
}`;

    // Call Lovable AI Gateway with tool calling for structured output
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_ticket",
              description: "Provide structured analysis of a support ticket",
              parameters: {
                type: "object",
                properties: {
                  suggested_category: { 
                    type: "string", 
                    enum: ["hardware", "software", "network", "security", "email", "backup", "access", "printing", "general"]
                  },
                  category_confidence: { type: "number", minimum: 0, maximum: 1 },
                  suggested_priority: { 
                    type: "string", 
                    enum: ["low", "medium", "high", "critical"]
                  },
                  priority_confidence: { type: "number", minimum: 0, maximum: 1 },
                  priority_factors: {
                    type: "object",
                    properties: {
                      urgency_keywords: { type: "array", items: { type: "string" } },
                      impact_indicators: { type: "array", items: { type: "string" } }
                    },
                    required: ["urgency_keywords", "impact_indicators"]
                  },
                  sentiment: { 
                    type: "string", 
                    enum: ["positive", "neutral", "negative", "frustrated", "urgent"]
                  },
                  sentiment_score: { type: "number", minimum: -1, maximum: 1 },
                  escalation_recommended: { type: "boolean" },
                  estimated_resolution_hours: { type: "number" },
                  suggested_responses: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        response: { type: "string" },
                        confidence: { type: "number" },
                        source: { type: "string", enum: ["canned", "kb", "ai"] }
                      },
                      required: ["response", "confidence", "source"]
                    }
                  }
                },
                required: ["suggested_category", "category_confidence", "suggested_priority", "priority_confidence", "priority_factors", "sentiment", "sentiment_score", "escalation_recommended", "estimated_resolution_hours", "suggested_responses"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_ticket" } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later" }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted, please add funds" }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await aiResponse.text();
      logStep("AI gateway error", { status: aiResponse.status, error: errorText });
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    logStep("AI response received", { hasChoices: !!aiData.choices });

    // Extract the tool call result
    let analysis: AIAnalysisResult;
    
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      analysis = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try to parse from content
      const content = aiData.choices?.[0]?.message?.content;
      if (content) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not parse AI response');
        }
      } else {
        throw new Error('No valid AI response');
      }
    }

    logStep("Analysis parsed", { 
      category: analysis.suggested_category, 
      priority: analysis.suggested_priority,
      sentiment: analysis.sentiment 
    });

    // Find similar tickets from history (simplified - based on category)
    const { data: similarTickets } = await supabase
      .from('tickets')
      .select('id')
      .neq('id', payload.ticket_id)
      .eq('status', 'resolved')
      .limit(5);

    // Find relevant KB articles
    const { data: kbArticles } = await supabase
      .from('knowledge_base_articles')
      .select('id')
      .or(`category.ilike.%${analysis.suggested_category}%,tags.cs.{${analysis.suggested_category}}`)
      .eq('status', 'published')
      .limit(3);

    // Store the analysis
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('ticket_ai_analysis')
      .upsert({
        ticket_id: payload.ticket_id,
        user_id: (await supabase.from('tickets').select('user_id').eq('id', payload.ticket_id).single()).data?.user_id,
        suggested_category: analysis.suggested_category,
        category_confidence: analysis.category_confidence,
        suggested_priority: analysis.suggested_priority,
        priority_confidence: analysis.priority_confidence,
        priority_factors: analysis.priority_factors,
        sentiment: analysis.sentiment,
        sentiment_score: analysis.sentiment_score,
        escalation_recommended: analysis.escalation_recommended,
        estimated_resolution_hours: analysis.estimated_resolution_hours,
        suggested_responses: analysis.suggested_responses,
        similar_ticket_ids: similarTickets?.map(t => t.id) || [],
        suggested_kb_articles: kbArticles?.map(a => a.id) || [],
        model_version: 'gemini-3-flash-preview',
        processed_at: new Date().toISOString()
      }, { onConflict: 'ticket_id' })
      .select()
      .single();

    if (saveError) {
      logStep("Failed to save analysis", { error: saveError.message });
    } else {
      logStep("Analysis saved", { id: savedAnalysis?.id });
    }

    return new Response(JSON.stringify({
      success: true,
      analysis: {
        ...analysis,
        similar_ticket_ids: similarTickets?.map(t => t.id) || [],
        suggested_kb_articles: kbArticles?.map(a => a.id) || []
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    logStep("ERROR in ai-ticket-analyzer", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
