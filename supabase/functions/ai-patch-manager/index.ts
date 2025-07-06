import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { action, clientId, patchIds, immediate, useAI } = await req.json();

    console.log(`AI Patch Manager action: ${action}`);

    switch (action) {
      case 'assess_patches':
        return await assessPatchRisk(supabase, clientId);
      
      case 'deploy_patches':
        return await deployPatches(supabase, patchIds, immediate, useAI);
      
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in AI patch manager:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function assessPatchRisk(supabase: any, clientId: string | null) {
  console.log('Running AI patch risk assessment for client:', clientId);

  // Get patches to assess
  let query = supabase
    .from('software_deployments')
    .select(`
      *,
      msp_clients(company_name, integration_settings)
    `)
    .eq('deployment_status', 'pending');

  if (clientId && clientId !== 'all') {
    query = query.eq('client_id', clientId);
  }

  const { data: patches, error } = await query;
  if (error) throw error;

  // Assess each patch with AI
  for (const patch of patches) {
    const riskScore = await calculatePatchRisk(patch);
    const priority = await determinePatchPriority(patch);
    
    // Update patch with AI assessment
    await supabase
      .from('software_deployments')
      .update({
        ai_priority_score: riskScore,
        ai_assessment: {
          risk_score: riskScore,
          priority_level: priority,
          recommendation: riskScore > 80 ? 'Deploy immediately' : 
                        riskScore > 60 ? 'Deploy in next maintenance window' : 
                        'Schedule for routine deployment',
          compatibility_score: Math.floor(Math.random() * 20) + 80,
          rollback_difficulty: riskScore > 70 ? 'High' : 'Low'
        },
        auto_approved: riskScore > 85 && patch.severity === 'critical'
      })
      .eq('id', patch.id);
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      assessedPatches: patches.length,
      message: `AI assessment completed for ${patches.length} patches`
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function calculatePatchRisk(patch: any): Promise<number> {
  // AI-based risk calculation
  let riskScore = 50; // Base score

  // Severity impact
  switch (patch.severity) {
    case 'critical': riskScore += 30; break;
    case 'important': riskScore += 20; break;
    case 'moderate': riskScore += 10; break;
    default: riskScore += 5;
  }

  // Patch type impact
  if (patch.package_id.includes('KB')) {
    riskScore += 15; // Windows updates are generally safer
  } else {
    riskScore += 5; // Third-party patches
  }

  // Historical success rate (simulated)
  const historicalSuccess = Math.floor(Math.random() * 20) + 80;
  riskScore += (100 - historicalSuccess) / 4;

  // System criticality (simulated based on client settings)
  const systemCriticality = patch.msp_clients?.integration_settings?.system_criticality || 'medium';
  switch (systemCriticality) {
    case 'high': riskScore += 10; break;
    case 'critical': riskScore += 15; break;
    default: riskScore += 5;
  }

  return Math.min(Math.max(Math.round(riskScore), 0), 100);
}

async function determinePatchPriority(patch: any): Promise<string> {
  if (patch.severity === 'critical') return 'immediate';
  if (patch.severity === 'important') return 'high';
  if (patch.severity === 'moderate') return 'medium';
  return 'low';
}

async function deployPatches(supabase: any, patchIds: string[], immediate: boolean, useAI: boolean) {
  console.log(`Deploying ${patchIds.length} patches, immediate: ${immediate}, AI: ${useAI}`);

  for (const patchId of patchIds) {
    // Get patch details
    const { data: patch, error: fetchError } = await supabase
      .from('software_deployments')
      .select('*')
      .eq('id', patchId)
      .single();

    if (fetchError) {
      console.error('Failed to fetch patch:', fetchError);
      continue;
    }

    // AI deployment strategy
    let deploymentStrategy = 'standard';
    let rollbackPlan = 'automatic';
    
    if (useAI) {
      const riskAssessment = await assessDeploymentRisk(patch);
      deploymentStrategy = riskAssessment.strategy;
      rollbackPlan = riskAssessment.rollbackPlan;
    }

    // Update patch status to installing
    await supabase
      .from('software_deployments')
      .update({
        deployment_status: 'installing',
        started_at: new Date().toISOString(),
        deployment_strategy: deploymentStrategy,
        rollback_plan: rollbackPlan,
        ai_managed: useAI
      })
      .eq('id', patchId);

    // Simulate deployment process
    setTimeout(async () => {
      const success = Math.random() > 0.1; // 90% success rate
      
      await supabase
        .from('software_deployments')
        .update({
          deployment_status: success ? 'completed' : 'failed',
          completed_at: new Date().toISOString(),
          deployment_log: success ? 
            'Patch deployed successfully' : 
            'Deployment failed - compatibility issue detected',
          requires_reboot: patch.package_id.includes('KB') && Math.random() > 0.3
        })
        .eq('id', patchId);
    }, Math.random() * 10000 + 5000); // Random delay 5-15 seconds
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      deployedPatches: patchIds.length,
      strategy: useAI ? 'AI-optimized deployment' : 'Standard deployment'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function assessDeploymentRisk(patch: any) {
  // AI deployment risk assessment
  const riskFactors = {
    systemUptime: Math.random() * 100,
    userActivity: Math.random() * 100,
    systemLoad: Math.random() * 100,
    historicalFailures: Math.random() * 20
  };

  let strategy = 'standard';
  let rollbackPlan = 'automatic';

  // Determine optimal deployment strategy
  if (riskFactors.systemUptime > 80 && riskFactors.userActivity < 30) {
    strategy = 'immediate_low_risk';
  } else if (riskFactors.systemLoad > 70 || riskFactors.userActivity > 80) {
    strategy = 'scheduled_maintenance';
    rollbackPlan = 'manual_verification';
  } else if (riskFactors.historicalFailures > 15) {
    strategy = 'staged_rollout';
    rollbackPlan = 'immediate_rollback';
  }

  return {
    strategy,
    rollbackPlan,
    riskScore: Math.round((riskFactors.systemLoad + riskFactors.historicalFailures) / 2),
    recommendation: `Deploy using ${strategy} strategy with ${rollbackPlan} rollback plan`
  };
}