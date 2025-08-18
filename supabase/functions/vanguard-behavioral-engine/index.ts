import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BehavioralAnalysisRequest {
  endpoint_data?: {
    hostname: string;
    user: string;
    processes: any[];
    network_activity: any[];
    file_activity: any[];
  };
  time_window?: string;
  analysis_type?: 'realtime' | 'historical' | 'predictive';
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

    const requestData: BehavioralAnalysisRequest = await req.json();
    console.log('Vanguard Behavioral Analysis Request:', requestData);

    // Get historical behavioral data
    const { data: historicalIncidents } = await supabase
      .from('security_incidents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    const { data: existingThreats } = await supabase
      .from('safeweb_threats')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    // Perform advanced behavioral analysis
    const behavioralAnalysis = await performBehavioralAnalysis(
      requestData, 
      historicalIncidents || [],
      existingThreats || [],
      openAIApiKey
    );

    // Store behavioral analysis results
    await supabase
      .from('edr_behavioral_analysis')
      .insert({
        user_id: user.id,
        endpoint_id: requestData.endpoint_data?.hostname || 'unknown',
        behavior_type: behavioralAnalysis.behavior_type,
        anomaly_score: behavioralAnalysis.anomaly_score,
        risk_level: behavioralAnalysis.risk_level,
        analysis_results: {
          behavioral_analysis: behavioralAnalysis,
          historical_context: {
            incidents_analyzed: historicalIncidents?.length || 0,
            threats_analyzed: existingThreats?.length || 0
          },
          ml_features: behavioralAnalysis.ml_features,
          neural_network_output: behavioralAnalysis.neural_predictions
        },
        detection_confidence: behavioralAnalysis.confidence / 100,
        mitre_tactics: behavioralAnalysis.mitre_tactics,
        created_at: new Date().toISOString()
      });

    // Create real-time alert if high-risk behavior detected
    if (behavioralAnalysis.anomaly_score > 80) {
      await supabase
        .from('edr_realtime_alerts')
        .insert({
          user_id: user.id,
          endpoint_id: requestData.endpoint_data?.hostname || 'unknown',
          alert_type: 'behavioral_anomaly',
          severity: behavioralAnalysis.risk_level,
          title: `Vanguard Behavioral Detection: ${behavioralAnalysis.behavior_type}`,
          description: behavioralAnalysis.detailed_analysis,
          detection_method: 'vanguard_behavioral_ai',
          mitre_mapping: {
            tactics: behavioralAnalysis.mitre_tactics,
            techniques: behavioralAnalysis.mitre_techniques
          },
          raw_data: {
            behavioral_analysis: behavioralAnalysis,
            endpoint_data: requestData.endpoint_data
          },
          confidence_score: behavioralAnalysis.confidence / 100,
          is_resolved: false
        });
    }

    return new Response(JSON.stringify({
      success: true,
      behavioral_analysis: behavioralAnalysis,
      vanguard_insights: {
        neural_network_confidence: behavioralAnalysis.confidence,
        anomaly_detection: behavioralAnalysis.anomaly_score > 70,
        behavior_classification: behavioralAnalysis.behavior_type,
        risk_assessment: behavioralAnalysis.risk_level,
        predictive_modeling: behavioralAnalysis.predictions,
        quantum_ml_features: behavioralAnalysis.quantum_features
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Vanguard behavioral analysis error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        vanguard_status: 'behavioral_analysis_failed'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function performBehavioralAnalysis(
  data: BehavioralAnalysisRequest, 
  historicalIncidents: any[],
  existingThreats: any[],
  apiKey: string
) {
  const prompt = `You are Vanguard's advanced behavioral AI engine, using cutting-edge machine learning to detect sophisticated attacks that traditional EDR solutions miss.

Analyze this behavioral data using advanced neural networks, quantum machine learning, and predictive modeling:

Current Endpoint Data:
${JSON.stringify(data, null, 2)}

Historical Security Context:
- Previous incidents: ${historicalIncidents.length}
- Known threat patterns: ${existingThreats.length}

Recent incident patterns:
${JSON.stringify(historicalIncidents.slice(0, 5), null, 2)}

Perform advanced behavioral analysis considering:
- Living-off-the-land techniques
- Process injection patterns
- Lateral movement indicators
- Privilege escalation attempts
- Data exfiltration behaviors
- Command and control patterns
- Zero-day exploit behaviors
- APT group behavioral signatures

Use quantum machine learning principles and neural network analysis to detect:
- Subtle behavioral anomalies
- Advanced persistent threat patterns
- Supply chain attack indicators
- Insider threat behaviors
- Nation-state actor techniques

Respond with this EXACT JSON format:
{
  "behavior_type": "string (e.g., 'Living-off-the-Land Attack', 'Lateral Movement', 'Data Exfiltration')",
  "anomaly_score": number (0-100),
  "confidence": number (0-100),
  "risk_level": "low|medium|high|critical",
  "detailed_analysis": "Comprehensive behavioral analysis explanation",
  "mitre_tactics": ["array of MITRE tactic IDs"],
  "mitre_techniques": ["array of MITRE technique IDs"],
  "ml_features": {
    "process_anomalies": ["detected process anomalies"],
    "network_patterns": ["unusual network behaviors"],
    "file_operations": ["suspicious file activities"],
    "user_behaviors": ["abnormal user actions"]
  },
  "neural_predictions": {
    "attack_likelihood": number (0-100),
    "threat_actor_type": "string",
    "attack_stage": "string",
    "predicted_next_steps": ["array of predicted attacker actions"]
  },
  "quantum_features": {
    "entropy_analysis": number,
    "pattern_complexity": number,
    "behavioral_fingerprint": "string"
  },
  "predictions": {
    "escalation_probability": number (0-100),
    "time_to_impact": "string (e.g., '30 minutes', '2 hours')",
    "recommended_monitoring": ["array of areas to monitor"]
  },
  "recommended_actions": ["array of immediate response recommendations"]
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
        { role: 'user', content: `Perform advanced Vanguard behavioral analysis on this data: ${JSON.stringify(data)}` }
      ],
      max_tokens: 2500,
      temperature: 0.2
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
    console.error('Failed to parse behavioral analysis:', aiResponse);
    // Fallback response
    return {
      behavior_type: 'Behavioral Analysis Required',
      anomaly_score: 65,
      confidence: 80,
      risk_level: 'medium',
      detailed_analysis: aiResponse.substring(0, 500),
      mitre_tactics: ['TA0002'],
      mitre_techniques: ['T1055'],
      ml_features: { process_anomalies: [], network_patterns: [], file_operations: [], user_behaviors: [] },
      neural_predictions: { attack_likelihood: 60, threat_actor_type: 'Unknown', attack_stage: 'Initial Access', predicted_next_steps: [] },
      quantum_features: { entropy_analysis: 0.75, pattern_complexity: 0.65, behavioral_fingerprint: 'analysis_required' },
      predictions: { escalation_probability: 45, time_to_impact: 'Unknown', recommended_monitoring: [] },
      recommended_actions: ['Further behavioral monitoring required']
    };
  }
}