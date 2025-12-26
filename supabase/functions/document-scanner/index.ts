import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Patterns to detect sensitive data
const sensitivePatterns = {
  ssn: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
  creditCard: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
  ipAddress: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
  apiKey: /\b(?:api[_-]?key|apikey|secret[_-]?key|access[_-]?token)[:\s=]["']?[A-Za-z0-9_\-]{16,}["']?/gi,
  password: /\b(?:password|passwd|pwd)[:\s=]["']?[^\s"']{4,}["']?/gi,
  awsKey: /\b(?:AKIA|ABIA|ACCA|ASIA)[A-Z0-9]{16}\b/g,
  privateKey: /-----BEGIN (?:RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  jwtToken: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
};

interface Finding {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  count: number;
  samples: string[];
  description: string;
}

function analyzeSensitiveData(content: string): Finding[] {
  const findings: Finding[] = [];
  
  const checks = [
    { key: 'ssn', label: 'Social Security Numbers', severity: 'critical' as const, desc: 'SSNs can be used for identity theft' },
    { key: 'creditCard', label: 'Credit Card Numbers', severity: 'critical' as const, desc: 'Financial data exposure risk' },
    { key: 'apiKey', label: 'API Keys', severity: 'high' as const, desc: 'Exposed API keys can lead to unauthorized access' },
    { key: 'awsKey', label: 'AWS Access Keys', severity: 'critical' as const, desc: 'Cloud infrastructure compromise risk' },
    { key: 'privateKey', label: 'Private Keys', severity: 'critical' as const, desc: 'Cryptographic keys should never be in documents' },
    { key: 'jwtToken', label: 'JWT Tokens', severity: 'high' as const, desc: 'Session tokens can be hijacked' },
    { key: 'password', label: 'Passwords', severity: 'high' as const, desc: 'Plain text passwords detected' },
    { key: 'email', label: 'Email Addresses', severity: 'low' as const, desc: 'PII that could be used for phishing' },
    { key: 'phone', label: 'Phone Numbers', severity: 'medium' as const, desc: 'Personal contact information exposed' },
    { key: 'ipAddress', label: 'IP Addresses', severity: 'low' as const, desc: 'Network infrastructure information' },
  ];
  
  for (const check of checks) {
    const pattern = sensitivePatterns[check.key as keyof typeof sensitivePatterns];
    const matches = content.match(pattern) || [];
    
    if (matches.length > 0) {
      // Mask sensitive data in samples
      const maskedSamples = matches.slice(0, 3).map(m => {
        if (check.severity === 'critical' || check.severity === 'high') {
          return m.substring(0, 4) + '****' + m.substring(m.length - 4);
        }
        return m;
      });
      
      findings.push({
        type: check.label,
        severity: check.severity,
        count: matches.length,
        samples: maskedSamples,
        description: check.desc,
      });
    }
  }
  
  return findings;
}

function calculateRiskScore(findings: Finding[]): number {
  let score = 0;
  const weights = { critical: 30, high: 20, medium: 10, low: 5 };
  
  for (const finding of findings) {
    score += weights[finding.severity] * Math.min(finding.count, 10);
  }
  
  return Math.min(100, score);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, filename, contentType } = await req.json();

    if (!content) {
      return new Response(
        JSON.stringify({ success: false, error: 'Document content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Scanning document: ${filename}, type: ${contentType}, size: ${content.length} chars`);

    // Analyze the content for sensitive data
    const findings = analyzeSensitiveData(content);
    const riskScore = calculateRiskScore(findings);
    
    // Determine risk level
    let riskLevel: string;
    if (riskScore >= 70) riskLevel = 'critical';
    else if (riskScore >= 50) riskLevel = 'high';
    else if (riskScore >= 30) riskLevel = 'medium';
    else if (riskScore > 0) riskLevel = 'low';
    else riskLevel = 'clean';

    // Generate recommendations
    const recommendations: string[] = [];
    if (findings.some(f => f.type === 'Social Security Numbers')) {
      recommendations.push('Remove or redact all SSNs from this document');
    }
    if (findings.some(f => f.type === 'Credit Card Numbers')) {
      recommendations.push('Mask credit card numbers (show only last 4 digits)');
    }
    if (findings.some(f => f.type === 'API Keys' || f.type === 'AWS Access Keys')) {
      recommendations.push('Rotate exposed API keys immediately');
    }
    if (findings.some(f => f.type === 'Passwords')) {
      recommendations.push('Never store passwords in documents - use a password manager');
    }
    if (findings.some(f => f.type === 'Private Keys')) {
      recommendations.push('Regenerate compromised private keys');
    }

    const result = {
      success: true,
      filename,
      scanned_at: new Date().toISOString(),
      risk_score: riskScore,
      risk_level: riskLevel,
      findings,
      total_findings: findings.reduce((sum, f) => sum + f.count, 0),
      recommendations,
      summary: findings.length > 0 
        ? `Found ${findings.length} types of sensitive data with ${findings.reduce((sum, f) => sum + f.count, 0)} total occurrences`
        : 'No sensitive data detected in this document',
    };

    console.log(`Scan complete: risk=${riskLevel}, findings=${findings.length}`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Document scanner error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Scan failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
