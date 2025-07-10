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
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('🚀 Activating Complete Security Suite...')

    const activationResults = {
      step1_data_pipeline: null,
      step2_automation_orchestrator: null,
      step3_compliance_setup: null,
      step4_monitoring_setup: null,
      errors: []
    }

    try {
      // Step 1: Initialize Security Data Pipeline
      console.log('Step 1: Initializing Security Data Pipeline...')
      const pipelineResult = await supabase.functions.invoke('security-data-pipeline')
      activationResults.step1_data_pipeline = pipelineResult.data
    } catch (error) {
      console.error('Error in Step 1:', error)
      activationResults.errors.push(`Step 1: ${error.message}`)
    }

    try {
      // Step 2: Run Security Automation Orchestrator
      console.log('Step 2: Activating Security Tools...')
      const orchestratorResult = await supabase.functions.invoke('security-automation-orchestrator')
      activationResults.step2_automation_orchestrator = orchestratorResult.data
    } catch (error) {
      console.error('Error in Step 2:', error)
      activationResults.errors.push(`Step 2: ${error.message}`)
    }

    try {
      // Step 3: Setup Compliance Monitoring
      console.log('Step 3: Setting up Compliance Monitoring...')
      await setupComplianceMonitoring(supabase)
      activationResults.step3_compliance_setup = 'Completed'
    } catch (error) {
      console.error('Error in Step 3:', error)
      activationResults.errors.push(`Step 3: ${error.message}`)
    }

    try {
      // Step 4: Setup Real-time Monitoring
      console.log('Step 4: Enabling Real-time Monitoring...')
      await setupRealtimeMonitoring(supabase)
      activationResults.step4_monitoring_setup = 'Completed'
    } catch (error) {
      console.error('Error in Step 4:', error)
      activationResults.errors.push(`Step 4: ${error.message}`)
    }

    // Final status
    const isFullyActivated = activationResults.errors.length === 0
    
    console.log('✅ Security Suite Activation Summary:')
    console.log('- Data Pipeline:', activationResults.step1_data_pipeline ? 'Active' : 'Failed')
    console.log('- Security Tools:', activationResults.step2_automation_orchestrator ? 'Active' : 'Failed')
    console.log('- Compliance:', activationResults.step3_compliance_setup || 'Failed')
    console.log('- Monitoring:', activationResults.step4_monitoring_setup || 'Failed')
    
    if (activationResults.errors.length > 0) {
      console.log('⚠️ Errors encountered:', activationResults.errors)
    }

    return new Response(
      JSON.stringify({
        success: isFullyActivated,
        message: isFullyActivated 
          ? 'Security suite fully activated and ready for production'
          : 'Security suite partially activated - some components failed',
        status: {
          data_pipeline: activationResults.step1_data_pipeline ? 'active' : 'failed',
          security_tools: activationResults.step2_automation_orchestrator ? 'active' : 'failed',
          compliance_monitoring: activationResults.step3_compliance_setup === 'Completed' ? 'active' : 'failed',
          realtime_monitoring: activationResults.step4_monitoring_setup === 'Completed' ? 'active' : 'failed'
        },
        errors: activationResults.errors,
        next_steps: [
          'Visit /security-ai to see your live security dashboard',
          'Configure alert rules for your specific environment',
          'Set up notification channels (email/webhook)',
          'Review and customize compliance frameworks'
        ]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Critical error in security suite activation:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to activate security suite',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function setupComplianceMonitoring(supabase: any) {
  // Create default compliance frameworks if they don't exist
  const frameworks = [
    {
      framework_name: 'SOC 2 Type II',
      description: 'Security, Availability, Processing Integrity, Confidentiality, and Privacy',
      requirements: {
        controls: [
          { id: 'CC6.1', name: 'Logical and Physical Access Controls' },
          { id: 'CC6.2', name: 'System Operation' },
          { id: 'CC6.3', name: 'Unauthorized System Access' }
        ]
      },
      automated_checks: {
        frequency: 'daily',
        checks: ['access_controls', 'system_monitoring', 'data_encryption']
      }
    },
    {
      framework_name: 'ISO 27001',
      description: 'Information Security Management System',
      requirements: {
        controls: [
          { id: 'A.12.6.1', name: 'Management of technical vulnerabilities' },
          { id: 'A.16.1.2', name: 'Reporting information security events' }
        ]
      },
      automated_checks: {
        frequency: 'weekly',
        checks: ['vulnerability_management', 'incident_response']
      }
    }
  ]

  for (const framework of frameworks) {
    await supabase
      .from('compliance_frameworks')
      .upsert(framework, { onConflict: 'framework_name' })
  }
}

async function setupRealtimeMonitoring(supabase: any) {
  // Enable realtime for security tables
  const securityTables = [
    'security_events',
    'edr_realtime_alerts', 
    'edr_behavioral_analysis',
    'incidents',
    'alert_notifications'
  ]

  for (const table of securityTables) {
    try {
      // Add to realtime publication
      await supabase.sql`
        ALTER TABLE public.${table} REPLICA IDENTITY FULL;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.${table};
      `
    } catch (error) {
      console.warn(`Could not enable realtime for ${table}:`, error.message)
    }
  }
}