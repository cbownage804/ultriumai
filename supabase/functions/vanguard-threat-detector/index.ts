import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ThreatDetectionRequest {
  endpoint?: string;
  file_hash?: string;
  network_activity?: any;
  process_data?: any;
  scan_type?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const requestData: ThreatDetectionRequest = await req.json();
    console.log('Vanguard Threat Detection Request:', requestData);

    // Perform advanced AI threat analysis
    const aiAnalysis = await performAdvancedThreatAnalysis(requestData, openAIApiKey);
    
    // Create security incident if threat detected
    if (aiAnalysis.threat_detected) {
      const { data: incident } = await supabase
        .from('security_incidents')
        .insert({
          user_id: user.id,
          incident_type: aiAnalysis.threat_type,
          severity: aiAnalysis.severity,
          title: aiAnalysis.title,
          description: aiAnalysis.description,
          source_system: 'Vanguard XDR',
          affected_assets: aiAnalysis.affected_assets,
          source_data: {
            ai_analysis: aiAnalysis,
            detection_method: 'vanguard_ai',
            mitre_tactics: aiAnalysis.mitre_tactics,
            confidence_score: aiAnalysis.confidence
          }
        })
        .select()
        .single();

      console.log('Created security incident:', incident?.id);

      // Create Safe MDR alert for high/critical threats
      if (['high', 'critical'].includes(aiAnalysis.severity)) {
        await supabase
          .from('safe_mdr_alerts')
          .insert({
            user_id: user.id,
            alert_type: aiAnalysis.threat_type,
            severity: aiAnalysis.severity,
            title: `Vanguard XDR: ${aiAnalysis.title}`,
            description: aiAnalysis.description,
            source_system: 'Vanguard XDR',
            affected_assets: aiAnalysis.affected_assets,
            tactics: aiAnalysis.mitre_tactics,
            techniques: aiAnalysis.mitre_techniques,
            indicators: aiAnalysis.iocs,
            status: 'new'
          });
      }
    }

    // Store threat intelligence data
    await supabase
      .from('safeweb_threats')
      .insert({
        user_id: user.id,
        threat_type: aiAnalysis.threat_type,
        title: aiAnalysis.title,
        description: aiAnalysis.description,
        severity: aiAnalysis.severity,
        status: aiAnalysis.threat_detected ? 'active' : 'resolved',
        source_name: 'Vanguard XDR Engine',
        confidence_score: Math.floor(aiAnalysis.confidence),
        threat_indicators: aiAnalysis.iocs,
        raw_data: {
          original_request: requestData,
          ai_analysis: aiAnalysis,
          detection_timestamp: new Date().toISOString()
        },
        affected_assets: aiAnalysis.affected_assets,
        tags: ['vanguard', 'xdr', 'ai-detected']
      });

    return new Response(JSON.stringify({
      success: true,
      analysis: aiAnalysis,
      vanguard_response: {
        threat_level: aiAnalysis.severity,
        confidence: aiAnalysis.confidence,
        mitre_mapping: {
          tactics: aiAnalysis.mitre_tactics,
          techniques: aiAnalysis.mitre_techniques
        },
        recommended_actions: aiAnalysis.recommendations,
        auto_remediation: aiAnalysis.auto_remediation
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Vanguard threat detection error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        vanguard_status: 'detection_failed'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function performAdvancedThreatAnalysis(data: ThreatDetectionRequest, apiKey: string) {
  const prompt = `You are Vanguard XDR, an advanced AI threat detection system that outperforms SentinelOne and CrowdStrike.

Analyze this security data for advanced persistent threats, zero-day exploits, living-off-the-land attacks, and sophisticated adversary techniques:

Data to analyze:
${JSON.stringify(data, null, 2)}

Perform advanced behavioral analysis considering:
- MITRE ATT&CK framework mapping
- APT group techniques and TTPs
- Zero-day exploit patterns
- Living-off-the-land attack signatures
- Quantum-resistant cryptographic analysis
- Supply chain attack vectors

Respond with this EXACT JSON format:
{
  "threat_detected": boolean,
  "threat_type": "string (e.g., 'APT Campaign', 'Zero-Day Exploit', 'Living-off-the-Land Attack')",
  "severity": "low|medium|high|critical",
  "confidence": number (0-100),
  "title": "Brief threat description",
  "description": "Detailed technical analysis",
  "mitre_tactics": ["array of MITRE tactic IDs"],
  "mitre_techniques": ["array of MITRE technique IDs like T1055.012"],
  "affected_assets": ["array of affected systems/assets"],
  "iocs": {
    "file_hashes": ["array"],
    "ip_addresses": ["array"],
    "domains": ["array"],
    "processes": ["array"]
  },
  "recommendations": ["array of security recommendations"],
  "auto_remediation": {
    "possible": boolean,
    "actions": ["array of automated response actions"]
  }
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-2025-04-14',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: `Analyze this data with advanced Vanguard XDR capabilities: ${JSON.stringify(data)}` }
      ],
      max_tokens: 2000,
      temperature: 0.3
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const result = await response.json();
  const aiResponse = result.choices[0].message.content;

  try {
    return JSON.parse(aiResponse);
  } catch (parseError) {
    console.error('Failed to parse AI response:', aiResponse);
    // Fallback response
    return {
      threat_detected: true,
      threat_type: 'AI Analysis Required',
      severity: 'medium',
      confidence: 75,
      title: 'Vanguard XDR Detection',
      description: aiResponse.substring(0, 500),
      mitre_tactics: ['TA0001'],
      mitre_techniques: ['T1078'],
      affected_assets: ['Unknown'],
      iocs: { file_hashes: [], ip_addresses: [], domains: [], processes: [] },
      recommendations: ['Further investigation required'],
      auto_remediation: { possible: false, actions: [] }
    };
  }
}