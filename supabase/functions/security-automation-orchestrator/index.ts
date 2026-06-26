import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
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


    console.log('🤖 Security Automation Orchestrator Starting...')

    const results = {
      document_scans: 0,
      email_scans: 0,
      network_scans: 0,
      compliance_checks: 0,
      incidents_created: 0,
      password_vulnerabilities_analyzed: 0,
      alerts_processed: 0
    }

    // 1. Activate Document Scanner with Sample Files
    await activateDocumentScanner(supabase, results)

    // 2. Activate Email Scanner with Sample Emails  
    await activateEmailScanner(supabase, results)

    // 3. Activate Network Scanner
    await activateNetworkScanner(supabase, results)

    // 4. Activate Compliance Connectors
    await activateComplianceChecks(supabase, results)

    // 5. Create Sample Incidents for Testing
    await createSampleIncidents(supabase, results)

    // 6. Activate SafePass Security Analysis
    await activateSafePassAnalysis(supabase, results)

    // 7. Process All Pending Alerts
    await processAlerts(supabase, results)

    console.log('✅ Security Automation Orchestrator Completed:', results)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'All security tools activated successfully',
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in security automation orchestrator:', error)
    return new Response(
      JSON.stringify({ error: 'Security automation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function activateDocumentScanner(supabase: any, results: any) {
  console.log('📄 Activating Document Scanner...')
  
  // Get sample user for testing
  const { data: user } = await supabase.from('profiles').select('id').limit(1).single()
  if (!user) return

  // Sample document scans
  const sampleFiles = [
    {
      fileHash: 'abc123def456789abcdef123456789abc',
      fileName: 'invoice_march_2024.pdf',
      fileSize: 245760,
      mimeType: 'application/pdf',
      mspId: user.id,
      clientId: user.id,
      userEmail: 'user@company.com'
    },
    {
      fileHash: 'malicious123456789abcdef987654321',
      fileName: 'suspicious_document.docx',
      fileSize: 1024000,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      mspId: user.id,
      clientId: user.id,
      userEmail: 'user@company.com'
    }
  ]

  for (const file of sampleFiles) {
    try {
      await supabase.functions.invoke('safedoc-scanner', { body: file })
      results.document_scans++
    } catch (error) {
      console.error('Error scanning document:', error)
    }
  }
}

async function activateEmailScanner(supabase: any, results: any) {
  console.log('📧 Activating Email Scanner...')

  // Get sample user
  const { data: user } = await supabase.from('profiles').select('id').limit(1).single()
  if (!user) return

  // Sample emails to scan
  const sampleEmails = [
    {
      sender_email: 'noreply@paypal.com',
      recipient_email: 'user@company.com',
      email_subject: 'Action Required: Verify Your Account',
      email_content: 'Dear customer, Your account has been suspended. Please verify by clicking here: http://paypal-verify.malicious.com',
      user_id: user.id
    },
    {
      sender_email: 'security@company.com',
      recipient_email: 'user@company.com', 
      email_subject: 'Security Alert: Unusual Login Activity',
      email_content: 'We detected an unusual login from a new device in Russia. If this was not you, please secure your account.',
      user_id: user.id
    }
  ]

  for (const email of sampleEmails) {
    try {
      await supabase.functions.invoke('safemail-scanner', { body: email })
      results.email_scans++
    } catch (error) {
      console.error('Error scanning email:', error)
    }
  }
}

async function activateNetworkScanner(supabase: any, results: any) {
  console.log('🌐 Activating Network Scanner...')

  // Get sample user
  const { data: user } = await supabase.from('profiles').select('id').limit(1).single()
  if (!user) return

  // Sample network scan requests
  const networkTargets = [
    {
      target_ip: '192.168.1.100',
      scan_type: 'port_scan',
      user_id: user.id,
      client_id: user.id
    },
    {
      target_url: 'https://suspicious-domain.com',
      scan_type: 'url_reputation',
      user_id: user.id,
      client_id: user.id
    }
  ]

  for (const target of networkTargets) {
    try {
      await supabase.functions.invoke('safenet-scanner', { body: target })
      results.network_scans++
    } catch (error) {
      console.error('Error scanning network target:', error)
    }
  }
}

async function activateComplianceChecks(supabase: any, results: any) {
  console.log('📋 Activating Compliance Checks...')

  // Get sample user
  const { data: user } = await supabase.from('profiles').select('id').limit(1).single()
  if (!user) return

  // Activate compliance connectors
  const complianceChecks = [
    {
      connector_type: 'aws',
      user_id: user.id,
      check_type: 'security_groups'
    },
    {
      connector_type: 'microsoft365',
      user_id: user.id,
      check_type: 'conditional_access'
    }
  ]

  for (const check of complianceChecks) {
    try {
      await supabase.functions.invoke('compliance-manager', { body: check })
      results.compliance_checks++
    } catch (error) {
      console.error('Error running compliance check:', error)
    }
  }
}

async function createSampleIncidents(supabase: any, results: any) {
  console.log('🚨 Creating Sample Incidents...')

  // Get sample user
  const { data: user } = await supabase.from('profiles').select('id').limit(1).single()
  if (!user) return

  const sampleIncidents = [
    {
      action: 'create_incident',
      title: 'Ransomware Attack Detected',
      description: 'Multiple endpoints showing signs of file encryption and ransom notes',
      priority: 'critical',
      severity: 'critical',
      affected_systems: ['SRV-FILE01', 'WS-ADMIN02', 'WS-HR01'],
      tags: ['ransomware', 'malware', 'encryption'],
      user_id: user.id
    },
    {
      action: 'create_incident',
      title: 'Data Exfiltration Attempt',
      description: 'Unusual outbound traffic patterns detected from database server',
      priority: 'high',
      severity: 'high',
      affected_systems: ['SRV-DB01'],
      tags: ['data_exfiltration', 'network_anomaly'],
      user_id: user.id
    }
  ]

  for (const incident of sampleIncidents) {
    try {
      await supabase.functions.invoke('incident-manager', { body: incident })
      results.incidents_created++
    } catch (error) {
      console.error('Error creating incident:', error)
    }
  }
}

async function activateSafePassAnalysis(supabase: any, results: any) {
  console.log('🔐 Activating SafePass Security Analysis...')

  // Get sample user
  const { data: user } = await supabase.from('profiles').select('id').limit(1).single()
  if (!user) return

  try {
    // Analyze password security across all vaults for the user
    await supabase.functions.invoke('safepass-scanner', { 
      body: { 
        action: 'analyze_security',
        user_id: user.id,
        scan_type: 'vault_security_assessment'
      }
    })

    // Check for credential exposure in breach databases
    await supabase.functions.invoke('safepass-scanner', { 
      body: { 
        action: 'check_breaches',
        user_id: user.id,
        scan_type: 'breach_monitoring'
      }
    })

    results.password_vulnerabilities_analyzed++
    console.log('✅ SafePass security analysis completed')
  } catch (error) {
    console.error('Error in SafePass security analysis:', error)
  }
}

async function processAlerts(supabase: any, results: any) {
  console.log('⚡ Processing All Pending Alerts...')

  try {
    await supabase.functions.invoke('siem-alert-processor')
    results.alerts_processed++
  } catch (error) {
    console.error('Error processing alerts:', error)
  }
}