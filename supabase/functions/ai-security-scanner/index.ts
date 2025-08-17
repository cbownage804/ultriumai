import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SecurityScanRequest {
  target: string;
  scanType: 'vulnerability' | 'penetration' | 'compliance' | 'full';
  options?: {
    depth?: number;
    aggressive?: boolean;
    includeSubdomains?: boolean;
  };
}

interface VulnerabilityFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  cve?: string;
  cvss?: number;
  location: string;
  evidence: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth header and verify user
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { target, scanType, options = {} }: SecurityScanRequest = await req.json();

    if (!target) {
      throw new Error('Target is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create scan record
    const scanId = crypto.randomUUID();
    const { error: insertError } = await supabase
      .from('security_scans')
      .insert({
        id: scanId,
        user_id: user.id,
        target,
        scan_type: scanType,
        status: 'running',
        started_at: new Date().toISOString(),
        options
      });

    if (insertError) {
      console.error('Error creating scan record:', insertError);
    }

    // Perform security analysis based on scan type
    let findings: VulnerabilityFinding[] = [];
    
    switch (scanType) {
      case 'vulnerability':
        findings = await performVulnerabilityAssessment(target, options, openAIApiKey);
        break;
      case 'penetration':
        findings = await performPenetrationTest(target, options, openAIApiKey);
        break;
      case 'compliance':
        findings = await performComplianceCheck(target, options, openAIApiKey);
        break;
      case 'full':
        const vulnFindings = await performVulnerabilityAssessment(target, options, openAIApiKey);
        const penFindings = await performPenetrationTest(target, options, openAIApiKey);
        const compFindings = await performComplianceCheck(target, options, openAIApiKey);
        findings = [...vulnFindings, ...penFindings, ...compFindings];
        break;
    }

    // Store findings in database
    if (findings.length > 0) {
      const { error: findingsError } = await supabase
        .from('security_findings')
        .insert(
          findings.map(finding => ({
            ...finding,
            scan_id: scanId,
            user_id: user.id,
            created_at: new Date().toISOString()
          }))
        );

      if (findingsError) {
        console.error('Error storing findings:', findingsError);
      }
    }

    // Update scan status
    await supabase
      .from('security_scans')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        findings_count: findings.length,
        critical_count: findings.filter(f => f.severity === 'critical').length,
        high_count: findings.filter(f => f.severity === 'high').length,
        medium_count: findings.filter(f => f.severity === 'medium').length,
        low_count: findings.filter(f => f.severity === 'low').length
      })
      .eq('id', scanId);

    return new Response(
      JSON.stringify({
        scanId,
        findings: findings.length,
        critical: findings.filter(f => f.severity === 'critical').length,
        high: findings.filter(f => f.severity === 'high').length,
        medium: findings.filter(f => f.severity === 'medium').length,
        low: findings.filter(f => f.severity === 'low').length,
        summary: generateScanSummary(findings),
        results: findings
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in ai-security-scanner:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function performVulnerabilityAssessment(
  target: string,
  options: any,
  apiKey: string
): Promise<VulnerabilityFinding[]> {
  // AI-powered vulnerability assessment
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert cybersecurity analyst performing vulnerability assessments. Analyze the target and identify potential security vulnerabilities. Return findings in JSON format with: id, severity, title, description, impact, recommendation, location, evidence.`
        },
        {
          role: 'user',
          content: `Perform a comprehensive vulnerability assessment on: ${target}. Include common web vulnerabilities like XSS, SQL injection, CSRF, insecure configurations, exposed services, and security misconfigurations.`
        }
      ],
    }),
  });

  const data = await response.json();
  const analysisText = data.choices[0].message.content;
  
  return parseSecurityFindings(analysisText, 'vulnerability');
}

async function performPenetrationTest(
  target: string,
  options: any,
  apiKey: string
): Promise<VulnerabilityFinding[]> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a penetration testing expert. Analyze the target for exploitable vulnerabilities and attack vectors. Focus on practical exploitation scenarios and provide detailed attack chains.`
        },
        {
          role: 'user',
          content: `Conduct a penetration test analysis on: ${target}. Identify attack vectors, exploitation paths, privilege escalation opportunities, and data exfiltration risks.`
        }
      ],
    }),
  });

  const data = await response.json();
  const analysisText = data.choices[0].message.content;
  
  return parseSecurityFindings(analysisText, 'penetration');
}

async function performComplianceCheck(
  target: string,
  options: any,
  apiKey: string
): Promise<VulnerabilityFinding[]> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a compliance auditor specializing in cybersecurity standards (OWASP, NIST, ISO 27001, PCI DSS). Assess the target against security compliance requirements.`
        },
        {
          role: 'user',
          content: `Perform a compliance assessment on: ${target}. Check against OWASP Top 10, NIST Cybersecurity Framework, and common security standards. Identify compliance gaps and violations.`
        }
      ],
    }),
  });

  const data = await response.json();
  const analysisText = data.choices[0].message.content;
  
  return parseSecurityFindings(analysisText, 'compliance');
}

function parseSecurityFindings(analysisText: string, category: string): VulnerabilityFinding[] {
  const findings: VulnerabilityFinding[] = [];
  
  // Extract findings from AI analysis (simplified parsing)
  const lines = analysisText.split('\n');
  let currentFinding: Partial<VulnerabilityFinding> = {};
  
  for (const line of lines) {
    if (line.includes('CRITICAL') || line.includes('HIGH') || line.includes('MEDIUM') || line.includes('LOW')) {
      if (currentFinding.title) {
        findings.push(currentFinding as VulnerabilityFinding);
      }
      currentFinding = {
        id: crypto.randomUUID(),
        severity: extractSeverity(line),
        title: line.replace(/^(CRITICAL|HIGH|MEDIUM|LOW)\s*:?\s*/, ''),
        description: '',
        impact: '',
        recommendation: '',
        location: '',
        evidence: []
      };
    } else if (line.trim() && currentFinding.title) {
      if (!currentFinding.description) {
        currentFinding.description = line.trim();
      } else if (!currentFinding.impact && line.toLowerCase().includes('impact')) {
        currentFinding.impact = line.trim();
      } else if (!currentFinding.recommendation && (line.toLowerCase().includes('recommend') || line.toLowerCase().includes('fix'))) {
        currentFinding.recommendation = line.trim();
      }
    }
  }
  
  if (currentFinding.title) {
    findings.push(currentFinding as VulnerabilityFinding);
  }
  
  return findings;
}

function extractSeverity(text: string): 'critical' | 'high' | 'medium' | 'low' | 'info' {
  const lower = text.toLowerCase();
  if (lower.includes('critical')) return 'critical';
  if (lower.includes('high')) return 'high';
  if (lower.includes('medium')) return 'medium';
  if (lower.includes('low')) return 'low';
  return 'info';
}

function generateScanSummary(findings: VulnerabilityFinding[]): string {
  const critical = findings.filter(f => f.severity === 'critical').length;
  const high = findings.filter(f => f.severity === 'high').length;
  const medium = findings.filter(f => f.severity === 'medium').length;
  const low = findings.filter(f => f.severity === 'low').length;
  
  return `Security scan completed. Found ${findings.length} issues: ${critical} critical, ${high} high, ${medium} medium, ${low} low severity.`;
}