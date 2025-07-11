import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { imageData, prompt = "Analyze this image for security threats, vulnerabilities, and provide detailed insights." } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenAI Vision API error');
    }

    // Analyze the response for security insights
    const analysis = data.choices[0].message.content;
    
    // Extract security-related insights
    const insights = {
      summary: analysis,
      threats: extractThreats(analysis),
      recommendations: extractRecommendations(analysis),
      riskLevel: assessRiskLevel(analysis)
    };

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-vision-analyzer function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function extractThreats(analysis: string): string[] {
  const threatKeywords = ['vulnerability', 'threat', 'risk', 'security issue', 'exploit', 'malware', 'suspicious'];
  const threats: string[] = [];
  
  const sentences = analysis.split(/[.!?]+/);
  sentences.forEach(sentence => {
    if (threatKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
      threats.push(sentence.trim());
    }
  });
  
  return threats.slice(0, 5); // Limit to top 5 threats
}

function extractRecommendations(analysis: string): string[] {
  const recommendations: string[] = [];
  const sentences = analysis.split(/[.!?]+/);
  
  sentences.forEach(sentence => {
    if (sentence.toLowerCase().includes('recommend') || 
        sentence.toLowerCase().includes('should') ||
        sentence.toLowerCase().includes('consider')) {
      recommendations.push(sentence.trim());
    }
  });
  
  return recommendations.slice(0, 5); // Limit to top 5 recommendations
}

function assessRiskLevel(analysis: string): 'low' | 'medium' | 'high' | 'critical' {
  const lowerAnalysis = analysis.toLowerCase();
  
  if (lowerAnalysis.includes('critical') || lowerAnalysis.includes('severe')) {
    return 'critical';
  } else if (lowerAnalysis.includes('high') || lowerAnalysis.includes('dangerous')) {
    return 'high';
  } else if (lowerAnalysis.includes('medium') || lowerAnalysis.includes('moderate')) {
    return 'medium';
  }
  
  return 'low';
}