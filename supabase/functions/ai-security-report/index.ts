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
    const { scanResults, reportType, userId, clientId, frameworks } = await req.json();

    if (!scanResults || !userId) {
      throw new Error('Scan results and user ID are required');
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Determine report style based on type
    const reportStyles: Record<string, string> = {
      executive: `Generate an EXECUTIVE SUMMARY for C-level leadership. Focus on:
- Business impact and risk exposure
- Key findings in non-technical language
- Cost/benefit of remediation
- Comparative industry benchmarks
- Strategic recommendations`,

      technical: `Generate a TECHNICAL REPORT for IT/Security teams. Include:
- Detailed vulnerability analysis
- CVE references where applicable
- Step-by-step remediation procedures
- Configuration recommendations
- Testing verification steps`,

      compliance: `Generate a COMPLIANCE REPORT mapped to frameworks: ${frameworks?.join(', ') || 'SOC2, ISO27001, HIPAA'}. Include:
- Control mapping to each framework
- Gap analysis per requirement
- Evidence collection guidance
- Audit-ready documentation
- Remediation priority by compliance impact`,

      attackPath: `Generate an ATTACK PATH ANALYSIS. Show:
- Potential attack chains from findings
- Privilege escalation paths
- Lateral movement opportunities
- Business critical asset exposure
- Kill chain mitigation points`
    };

    const systemPrompt = reportStyles[reportType] || reportStyles.technical;

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
            content: `You are an expert cybersecurity analyst generating professional security reports.
${systemPrompt}

Output a JSON object with this structure:
{
  "reportTitle": "Report title",
  "generatedAt": "ISO timestamp",
  "executiveSummary": "2-3 paragraph overview",
  "riskScore": 0-100,
  "riskLevel": "Critical" | "High" | "Medium" | "Low",
  "keyFindings": [
    {
      "title": "Finding title",
      "severity": "critical" | "high" | "medium" | "low" | "info",
      "description": "Detailed description",
      "impact": "Business impact",
      "remediation": "How to fix",
      "effort": "low" | "medium" | "high",
      "complianceMapping": ["SOC2 CC6.1", "ISO27001 A.12.6"]
    }
  ],
  "remediationRoadmap": [
    {
      "phase": 1,
      "title": "Phase title",
      "timeframe": "1-2 weeks",
      "items": ["Action 1", "Action 2"],
      "resources": "Estimated resources needed"
    }
  ],
  "complianceStatus": {
    "framework": { "compliant": 0, "partial": 0, "nonCompliant": 0, "total": 0 }
  },
  "recommendations": ["Strategic recommendation 1", "Strategic recommendation 2"],
  "nextSteps": ["Immediate action 1", "Immediate action 2"]
}`
          },
          {
            role: 'user',
            content: `Analyze these security scan results and generate a ${reportType || 'technical'} report:

${JSON.stringify(scanResults, null, 2)}

Generate a comprehensive, actionable security report.`
          }
        ],
        max_tokens: 8000
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI report generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    let report;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        report = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
    }

    if (!report) {
      throw new Error('Failed to generate report');
    }

    // Add metadata
    report.metadata = {
      reportType,
      generatedBy: 'Vanguard Cortex AI',
      userId,
      clientId,
      scanResultsCount: Array.isArray(scanResults) ? scanResults.length : 1
    };

    return new Response(
      JSON.stringify({
        success: true,
        report
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Security report error:', error);
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
