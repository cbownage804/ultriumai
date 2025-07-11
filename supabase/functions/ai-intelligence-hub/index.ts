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
    const { query, analysisType = 'comprehensive' } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Generate comprehensive analysis based on query
    const analysisPrompt = getAnalysisPrompt(analysisType, query);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: analysisPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenAI API error');
    }

    const analysis = data.choices[0].message.content;

    // Generate structured intelligence report
    const report = {
      summary: analysis,
      threatLevel: assessThreatLevel(analysis),
      insights: extractInsights(analysis),
      recommendations: extractActionItems(analysis),
      compliance: generateComplianceScores(),
      risks: extractRisks(analysis),
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-intelligence-hub function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getAnalysisPrompt(analysisType: string, query: string): string {
  const prompts = {
    comprehensive: `You are an advanced cybersecurity intelligence analyst. Provide a comprehensive analysis including:
1. Threat assessment and risk levels
2. Security implications and vulnerabilities  
3. Compliance considerations (SOC2, ISO 27001, etc.)
4. Actionable recommendations
5. Potential business impact

Format your response as detailed analysis with clear sections.`,
    
    threat: `You are a threat intelligence specialist. Focus on:
1. Threat actor analysis
2. Attack vectors and TTPs
3. Indicators of compromise
4. Mitigation strategies
5. Threat landscape context`,

    compliance: `You are a compliance analyst. Analyze for:
1. Regulatory requirements
2. Compliance gaps
3. Risk assessment
4. Remediation steps
5. Documentation needs`
  };

  return prompts[analysisType as keyof typeof prompts] || prompts.comprehensive;
}

function assessThreatLevel(analysis: string): 'low' | 'medium' | 'high' | 'critical' {
  const lowerAnalysis = analysis.toLowerCase();
  
  if (lowerAnalysis.includes('critical') || lowerAnalysis.includes('immediate')) {
    return 'critical';
  } else if (lowerAnalysis.includes('high') || lowerAnalysis.includes('urgent')) {
    return 'high';
  } else if (lowerAnalysis.includes('medium') || lowerAnalysis.includes('moderate')) {
    return 'medium';
  }
  
  return 'low';
}

function extractInsights(analysis: string): string[] {
  const sentences = analysis.split(/[.!?]+/);
  const insights: string[] = [];
  
  sentences.forEach(sentence => {
    if (sentence.length > 20 && 
        (sentence.toLowerCase().includes('insight') ||
         sentence.toLowerCase().includes('finding') ||
         sentence.toLowerCase().includes('analysis shows') ||
         sentence.toLowerCase().includes('indicates'))) {
      insights.push(sentence.trim());
    }
  });
  
  return insights.slice(0, 6);
}

function extractActionItems(analysis: string): string[] {
  const sentences = analysis.split(/[.!?]+/);
  const actions: string[] = [];
  
  sentences.forEach(sentence => {
    if (sentence.toLowerCase().includes('recommend') || 
        sentence.toLowerCase().includes('should') ||
        sentence.toLowerCase().includes('implement') ||
        sentence.toLowerCase().includes('consider')) {
      actions.push(sentence.trim());
    }
  });
  
  return actions.slice(0, 5);
}

function extractRisks(analysis: string): string[] {
  const sentences = analysis.split(/[.!?]+/);
  const risks: string[] = [];
  
  sentences.forEach(sentence => {
    if (sentence.toLowerCase().includes('risk') || 
        sentence.toLowerCase().includes('vulnerability') ||
        sentence.toLowerCase().includes('threat') ||
        sentence.toLowerCase().includes('exposure')) {
      risks.push(sentence.trim());
    }
  });
  
  return risks.slice(0, 4);
}

function generateComplianceScores() {
  // Simulate compliance scores - in real implementation, this would be based on actual analysis
  return {
    'SOC 2': Math.floor(Math.random() * 20) + 80,
    'ISO 27001': Math.floor(Math.random() * 25) + 75,
    'PCI DSS': Math.floor(Math.random() * 30) + 70,
    'GDPR': Math.floor(Math.random() * 15) + 85
  };
}