import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Require admin caller
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const { data: userData, error: userErr } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const { data: profile } = await supabase
      .from('profiles').select('email').eq('id', userData.user.id).single()
    const email = profile?.email || userData.user.email || ''
    if (!email.endsWith('@ultriumai.com')) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }


    console.log('🚀 Starting Security Data Pipeline...')

    // Get all active users to generate security data for
    const { data: users } = await supabase
      .from('profiles')
      .select('id')
      .limit(10) // Process in batches

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users found to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let totalEventsGenerated = 0
    let totalThreatsGenerated = 0
    let totalAlertsGenerated = 0

    // Process each user
    for (const user of users) {
      console.log(`Processing security data for user: ${user.id}`)

      try {
        // 1. Generate Security Events
        const securityEvents = await generateSecurityEvents(user.id)
        for (const event of securityEvents) {
          await supabase.functions.invoke('siem-event-collector', {
            body: event
          })
          totalEventsGenerated++
        }

        // 2. Generate EDR Behavioral Analysis
        const behaviorAnalysis = await generateBehaviorAnalysis(supabase, user.id)
        totalThreatsGenerated += behaviorAnalysis.length

        // 3. Generate Real-time Alerts
        const alerts = await generateRealtimeAlerts(supabase, user.id)
        totalAlertsGenerated += alerts.length

        // 4. Trigger Threat Intelligence Update
        await supabase.functions.invoke('threat-intelligence-updater')

        // 5. Process any pending alerts
        await supabase.functions.invoke('siem-alert-processor')

      } catch (userError) {
        console.error(`Error processing user ${user.id}:`, userError)
      }
    }

    console.log(`✅ Security data pipeline completed:`)
    console.log(`- Generated ${totalEventsGenerated} security events`)
    console.log(`- Generated ${totalThreatsGenerated} threat analyses`)
    console.log(`- Generated ${totalAlertsGenerated} real-time alerts`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Security data pipeline completed successfully',
        stats: {
          users_processed: users.length,
          events_generated: totalEventsGenerated,
          threats_generated: totalThreatsGenerated,
          alerts_generated: totalAlertsGenerated
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in security data pipeline:', error)
    return new Response(
      JSON.stringify({ error: 'Security data pipeline failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function generateSecurityEvents(userId: string) {
  const eventTypes = [
    {
      source_app: 'Windows Defender',
      event_type: 'malware_detected',
      severity: 'high',
      title: 'Potential Malware Detected',
      description: 'Windows Defender blocked a potentially malicious file execution',
      affected_assets: ['DESKTOP-ABC123'],
      ip_address: '192.168.1.' + Math.floor(Math.random() * 255),
      threat_indicators: ['file:suspicious.exe', 'behavior:process_injection']
    },
    {
      source_app: 'Firewall',
      event_type: 'blocked_connection',
      severity: 'medium',
      title: 'Suspicious Network Connection Blocked',
      description: 'Outbound connection to known malicious IP blocked',
      affected_assets: ['FW-001'],
      ip_address: '10.0.0.' + Math.floor(Math.random() * 255),
      threat_indicators: ['ip:malicious_c2']
    },
    {
      source_app: 'EDR',
      event_type: 'process_anomaly',
      severity: 'critical',
      title: 'Abnormal Process Behavior Detected',
      description: 'Process exhibiting injection techniques and network callbacks',
      affected_assets: ['SRV-WEB01'],
      threat_indicators: ['mitre:T1055', 'mitre:T1071']
    }
  ]

  return eventTypes.map(event => ({
    ...event,
    user_id: userId,
    user_email: `user-${userId.slice(0, 8)}@company.com`
  }))
}

async function generateBehaviorAnalysis(supabase: any, userId: string) {
  const analyses = [
    {
      user_id: userId,
      endpoint_id: crypto.randomUUID(),
      process_id: Math.floor(Math.random() * 10000),
      process_name: 'powershell.exe',
      command_line: 'powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -EncodedCommand',
      file_path: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
      hash_sha256: 'a1b2c3d4e5f6789...',
      network_connections: [
        {
          remote_address: '192.168.100.50',
          remote_port: 4444,
          protocol: 'TCP',
          state: 'ESTABLISHED'
        }
      ],
      file_operations: [
        {
          operation: 'create',
          file_path: 'C:\\Temp\\payload.exe',
          timestamp: new Date().toISOString()
        }
      ],
      registry_operations: [
        {
          operation: 'set',
          key_path: 'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
          value_name: 'SecurityUpdate',
          timestamp: new Date().toISOString()
        }
      ],
      memory_analysis: {
        injected_code: true,
        hollowed_process: false,
        entropy: 7.8
      },
      behavior_score: 85,
      ai_confidence_score: 92.5,
      threat_classification: 'malicious',
      mitre_tactics: ['T1059', 'T1055'],
      mitre_techniques: ['PowerShell', 'Process Injection'],
      anomaly_indicators: [
        {
          type: 'suspicious_command',
          description: 'Encoded PowerShell command detected',
          severity: 'high'
        }
      ],
      status: 'monitoring'
    }
  ]

  for (const analysis of analyses) {
    await supabase
      .from('edr_behavioral_analysis')
      .insert(analysis)
  }

  return analyses
}

async function generateRealtimeAlerts(supabase: any, userId: string) {
  const alerts = [
    {
      user_id: userId,
      endpoint_id: crypto.randomUUID(),
      alert_type: 'process_injection',
      severity: 'high',
      title: 'Process Injection Detected',
      description: 'Malicious process attempting to inject code into legitimate process',
      indicators_of_compromise: [
        'Process hollowing technique detected',
        'Unusual memory allocation patterns',
        'Code injection into svchost.exe'
      ],
      response_actions_taken: [
        'Process terminated',
        'File quarantined',
        'Network connection blocked'
      ],
      auto_response_enabled: true,
      containment_status: 'process_blocked',
      status: 'new'
    },
    {
      user_id: userId,
      endpoint_id: crypto.randomUUID(),
      alert_type: 'command_control',
      severity: 'critical',
      title: 'Command & Control Communication',
      description: 'Endpoint communicating with known C2 infrastructure',
      indicators_of_compromise: [
        'Beacon activity detected',
        'Encrypted communication channel',
        'Data exfiltration attempt'
      ],
      response_actions_taken: [
        'Network isolation initiated',
        'Forensic image captured'
      ],
      auto_response_enabled: true,
      containment_status: 'network_isolated',
      status: 'investigating'
    }
  ]

  for (const alert of alerts) {
    await supabase
      .from('edr_realtime_alerts')
      .insert(alert)
  }

  return alerts
}