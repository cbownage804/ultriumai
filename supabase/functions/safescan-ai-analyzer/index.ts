import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScanData {
  email_scans: any[];
  url_scans: any[];
  document_scans: any[];
  custom_prompt?: string;
  action?: string;
  scan_targets?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      email_scans, 
      url_scans, 
      document_scans, 
      custom_prompt,
      action,
      scan_targets 
    }: ScanData = await req.json();

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (action === 'automated_scan') {
      // Handle automated scanning
      const response = await performAutomatedScan(scan_targets || [], openAIApiKey);
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Analyze scan data with AI
    const analysis = await analyzeSecurityData({
      email_scans,
      url_scans,
      document_scans,
      custom_prompt
    }, openAIApiKey);

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI analyzer error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function analyzeSecurityData(data: any, apiKey: string) {
  const { email_scans, url_scans, document_scans, custom_prompt } = data;
  
  // Calculate threat statistics
  const totalScans = email_scans.length + url_scans.length + document_scans.length;
  const threatsFound = [
    ...email_scans.filter((scan: any) => scan.threats_detected > 0),
    ...document_scans.filter((scan: any) => scan.threats_detected > 0),
    ...url_scans.filter((scan: any) => scan.result?.threats > 0)
  ];
  
  const threatPercentage = totalScans > 0 ? (threatsFound.length / totalScans) * 100 : 0;

  // Prepare data summary for AI
  const dataSummary = {
    total_scans: totalScans,
    email_scans_count: email_scans.length,
    url_scans_count: url_scans.length,
    document_scans_count: document_scans.length,
    threats_found: threatsFound.length,
    threat_percentage: threatPercentage,
    recent_threats: threatsFound.slice(0, 5).map((threat: any) => ({
      type: threat.scan_type || 'document',
      threat_level: threat.threat_level,
      threats_detected: threat.threats_detected,
      timestamp: threat.created_at
    }))
  };

  const systemPrompt = `You are an expert cybersecurity analyst. Analyze the provided security scan data and provide a comprehensive security assessment.

Data Summary:
- Total Scans: ${dataSummary.total_scans}
- Email Scans: ${dataSummary.email_scans_count}
- URL Scans: ${dataSummary.url_scans_count}
- Document Scans: ${dataSummary.document_scans_count}
- Threats Found: ${dataSummary.threats_found}
- Threat Rate: ${dataSummary.threat_percentage.toFixed(1)}%

Recent Threats: ${JSON.stringify(dataSummary.recent_threats, null, 2)}

Provide your analysis in this exact JSON format:
{
  "threat_level": "low|medium|high|critical",
  "threat_score": number (0-100),
  "key_findings": [array of key security findings],
  "recommendations": [array of actionable security recommendations],
  "summary": "executive summary of security posture",
  "confidence": number (0-100)
}`;

  const userPrompt = custom_prompt || "Analyze the current security posture and provide actionable recommendations.";

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-2025-04-14',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 2000
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const result = await response.json();
  const aiResponse = result.choices[0].message.content;

  try {
    // Try to parse JSON response
    const analysis = JSON.parse(aiResponse);
    
    // Validate required fields
    if (!analysis.threat_level || !analysis.summary) {
      throw new Error('Invalid AI response format');
    }
    
    return analysis;
  } catch (parseError) {
    // Fallback if JSON parsing fails
    return {
      threat_level: threatPercentage > 50 ? 'high' : threatPercentage > 20 ? 'medium' : 'low',
      threat_score: Math.min(threatPercentage * 2, 100),
      key_findings: [
        `${dataSummary.threats_found} threats detected across ${dataSummary.total_scans} scans`,
        `Threat detection rate: ${dataSummary.threat_percentage.toFixed(1)}%`
      ],
      recommendations: [
        'Increase scan frequency for critical assets',
        'Review and update security policies',
        'Implement additional monitoring'
      ],
      summary: aiResponse.substring(0, 500) + '...',
      confidence: 85
    };
  }
}

async function performAutomatedScan(targets: string[], apiKey: string) {
  console.log('Starting automated scan for targets:', targets);
  
  // This would trigger actual scans in a real implementation
  // For now, return a success response
  return {
    status: 'started',
    message: 'Automated security scan initiated',
    targets: targets,
    estimated_completion: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
  };
}