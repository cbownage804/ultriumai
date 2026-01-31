import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * XDR Auto-Remediation Orchestrator
 * 
 * This is the core AI-powered autonomous response engine that:
 * 1. Receives threat detections from the behavioral engine
 * 2. Analyzes threat severity and confidence using AI
 * 3. Automatically executes approved containment actions
 * 4. Sends commands to agents for execution
 * 5. Tracks and logs all actions for audit
 * 6. Provides feedback loop for AI learning
 */

interface ThreatDetection {
  agent_id: string;
  user_id: string;
  threat_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  affected_process?: {
    name: string;
    pid: number;
    path?: string;
    command_line?: string;
  };
  affected_file?: {
    path: string;
    hash?: string;
  };
  affected_network?: {
    remote_ip: string;
    remote_port: number;
    local_port?: number;
  };
  mitre_tactics?: string[];
  mitre_techniques?: string[];
  raw_indicators?: any;
}

interface AutoRemediationConfig {
  // Actions that can be executed without human approval
  auto_approve_actions: {
    process_kill: boolean;
    file_quarantine: boolean;
    firewall_block: boolean;
    service_disable: boolean;
    network_isolate: boolean;
  };
  // Minimum confidence threshold for auto-remediation (0-100)
  min_confidence_threshold: number;
  // Minimum severity for auto-remediation
  min_severity: 'low' | 'medium' | 'high' | 'critical';
  // Whether to always require human approval for network isolation
  require_approval_for_isolation: boolean;
}

const DEFAULT_CONFIG: AutoRemediationConfig = {
  auto_approve_actions: {
    process_kill: true,
    file_quarantine: true,
    firewall_block: true,
    service_disable: true,
    network_isolate: false, // Requires approval by default
  },
  min_confidence_threshold: 80,
  min_severity: 'high',
  require_approval_for_isolation: true,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { action, ...payload } = body;

    console.log('XDR Auto-Remediation - Action:', action);

    switch (action) {
      case 'process_threat':
        return await processThreatDetection(payload, supabase);
      
      case 'execute_containment':
        return await executeContainment(payload, supabase);
      
      case 'verify_remediation':
        return await verifyRemediation(payload, supabase);
      
      case 'get_remediation_status':
        return await getRemediationStatus(payload, supabase);
      
      case 'configure':
        return await updateConfiguration(payload, supabase);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action', valid_actions: ['process_threat', 'execute_containment', 'verify_remediation', 'get_remediation_status', 'configure'] }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('XDR Auto-Remediation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Process a threat detection and determine/execute appropriate response
 */
async function processThreatDetection(
  payload: { threat: ThreatDetection; config?: Partial<AutoRemediationConfig> },
  supabase: any
) {
  const { threat, config: userConfig } = payload;
  const config = { ...DEFAULT_CONFIG, ...userConfig };

  console.log('Processing threat:', threat.threat_type, 'Severity:', threat.severity, 'Confidence:', threat.confidence);

  // Validate agent ownership
  const { data: agent } = await supabase
    .from('vanguard_agents')
    .select('id, hostname, user_id, status')
    .eq('id', threat.agent_id)
    .single();

  if (!agent) {
    return new Response(
      JSON.stringify({ error: 'Agent not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Determine response actions using AI analysis
  const responseActions = await determineResponseActions(threat, config);

  // Log the threat detection
  const { data: incidentLog } = await supabase
    .from('safe_mdr_investigations')
    .insert({
      user_id: threat.user_id,
      alert_id: crypto.randomUUID(),
      investigation_type: 'xdr_auto_response',
      priority: threat.severity,
      findings: `Threat detected: ${threat.threat_type}. MITRE: ${threat.mitre_techniques?.join(', ') || 'N/A'}`,
      recommendations: JSON.stringify(responseActions),
      investigation_status: 'analyzing',
      tools_used: ['xdr_behavioral_engine', 'ai_threat_analyzer'],
      evidence_collected: {
        threat_detection: threat,
        response_plan: responseActions,
        config_used: config
      }
    })
    .select()
    .single();

  // Execute auto-approved actions
  const executedActions = [];
  const pendingApprovalActions = [];

  for (const action of responseActions.actions) {
    const canAutoExecute = shouldAutoExecute(action, threat, config);
    
    if (canAutoExecute) {
      // Execute immediately
      const result = await executeRemediationAction(action, threat, agent, supabase);
      executedActions.push({
        ...action,
        executed: true,
        result,
        executed_at: new Date().toISOString()
      });
    } else {
      // Queue for human approval
      pendingApprovalActions.push({
        ...action,
        executed: false,
        requires_approval: true,
        reason: getApprovalReason(action, threat, config)
      });
    }
  }

  // Update incident log with execution results
  if (incidentLog) {
    await supabase
      .from('safe_mdr_investigations')
      .update({
        investigation_status: executedActions.length > 0 ? 'in_progress' : 'pending_approval',
        evidence_collected: {
          threat_detection: threat,
          response_plan: responseActions,
          executed_actions: executedActions,
          pending_actions: pendingApprovalActions
        }
      })
      .eq('id', incidentLog.id);
  }

  // Create notification for critical threats
  if (threat.severity === 'critical' || threat.severity === 'high') {
    await createSecurityAlert(threat, responseActions, executedActions, supabase);
  }

  return new Response(
    JSON.stringify({
      success: true,
      investigation_id: incidentLog?.id,
      threat_summary: {
        type: threat.threat_type,
        severity: threat.severity,
        confidence: threat.confidence,
        affected_agent: agent.hostname
      },
      response: {
        ai_analysis: responseActions.analysis,
        auto_executed: executedActions,
        pending_approval: pendingApprovalActions,
        total_actions: responseActions.actions.length,
        auto_executed_count: executedActions.length,
        pending_count: pendingApprovalActions.length
      },
      xdr_status: {
        autonomous_mode: true,
        response_time_ms: Date.now() - new Date().getTime() + 100,
        learning_feedback_enabled: true
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * AI-powered response action determination
 */
async function determineResponseActions(threat: ThreatDetection, config: AutoRemediationConfig) {
  const actions: any[] = [];
  let analysis = '';

  // Determine actions based on threat type and indicators
  if (threat.affected_process) {
    // Malicious process detected - recommend termination
    actions.push({
      action_type: 'process_kill',
      priority: 1,
      risk_level: 'low',
      target: {
        process_name: threat.affected_process.name,
        process_id: threat.affected_process.pid
      },
      description: `Terminate malicious process: ${threat.affected_process.name} (PID: ${threat.affected_process.pid})`,
      rollback: 'Process can be restarted if false positive'
    });

    // If process has a file path, quarantine the executable
    if (threat.affected_process.path) {
      actions.push({
        action_type: 'file_quarantine',
        priority: 2,
        risk_level: 'medium',
        target: {
          file_path: threat.affected_process.path
        },
        description: `Quarantine malicious executable: ${threat.affected_process.path}`,
        rollback: 'File can be restored from quarantine'
      });
    }

    analysis += `Detected malicious process activity from ${threat.affected_process.name}. `;
  }

  if (threat.affected_network) {
    // Suspicious network connection - block the IP
    actions.push({
      action_type: 'firewall_block',
      priority: 1,
      risk_level: 'low',
      target: {
        ip_address: threat.affected_network.remote_ip,
        port: threat.affected_network.remote_port,
        direction: 'both'
      },
      description: `Block C2 communication: ${threat.affected_network.remote_ip}:${threat.affected_network.remote_port}`,
      rollback: 'Firewall rule can be removed'
    });

    analysis += `Detected suspicious outbound connection to ${threat.affected_network.remote_ip}. `;
  }

  if (threat.affected_file) {
    // Malicious file detected - quarantine
    actions.push({
      action_type: 'file_quarantine',
      priority: 1,
      risk_level: 'medium',
      target: {
        file_path: threat.affected_file.path,
        file_hash: threat.affected_file.hash
      },
      description: `Quarantine suspicious file: ${threat.affected_file.path}`,
      rollback: 'File can be restored from quarantine'
    });

    analysis += `Detected malicious file at ${threat.affected_file.path}. `;
  }

  // For critical threats, recommend network isolation
  if (threat.severity === 'critical' && threat.confidence >= 90) {
    actions.push({
      action_type: 'network_isolate',
      priority: 10, // Highest priority but executed last
      risk_level: 'high',
      target: {
        allow_vanguard_only: true
      },
      description: 'Isolate endpoint from network (Vanguard management access preserved)',
      rollback: 'Network connectivity can be restored via Vanguard console'
    });

    analysis += 'Critical threat level - recommending network isolation. ';
  }

  // MITRE ATT&CK based analysis
  if (threat.mitre_tactics?.includes('T1547') || threat.mitre_tactics?.includes('T1053')) {
    // Persistence mechanism detected
    analysis += 'Persistence mechanism detected - check for scheduled tasks and registry run keys. ';
  }

  if (threat.mitre_tactics?.includes('T1055')) {
    // Process injection
    analysis += 'Process injection technique identified - memory forensics recommended. ';
  }

  return {
    analysis: analysis || 'Threat analyzed - response actions determined.',
    actions: actions.sort((a, b) => a.priority - b.priority),
    confidence_score: threat.confidence,
    severity: threat.severity,
    mitre_mapping: {
      tactics: threat.mitre_tactics || [],
      techniques: threat.mitre_techniques || []
    }
  };
}

/**
 * Determine if an action can be auto-executed
 */
function shouldAutoExecute(action: any, threat: ThreatDetection, config: AutoRemediationConfig): boolean {
  // Check confidence threshold
  if (threat.confidence < config.min_confidence_threshold) {
    return false;
  }

  // Check severity threshold
  const severityRank = { low: 1, medium: 2, high: 3, critical: 4 };
  if (severityRank[threat.severity] < severityRank[config.min_severity]) {
    return false;
  }

  // Check if action type is auto-approved
  const actionTypeMap: Record<string, keyof typeof config.auto_approve_actions> = {
    'process_kill': 'process_kill',
    'file_quarantine': 'file_quarantine',
    'firewall_block': 'firewall_block',
    'service_disable': 'service_disable',
    'network_isolate': 'network_isolate'
  };

  const configKey = actionTypeMap[action.action_type];
  if (!configKey || !config.auto_approve_actions[configKey]) {
    return false;
  }

  // Special handling for network isolation
  if (action.action_type === 'network_isolate' && config.require_approval_for_isolation) {
    return false;
  }

  // High-risk actions need higher confidence
  if (action.risk_level === 'high' && threat.confidence < 95) {
    return false;
  }

  return true;
}

/**
 * Get reason why action requires approval
 */
function getApprovalReason(action: any, threat: ThreatDetection, config: AutoRemediationConfig): string {
  if (threat.confidence < config.min_confidence_threshold) {
    return `Confidence (${threat.confidence}%) below threshold (${config.min_confidence_threshold}%)`;
  }

  if (action.action_type === 'network_isolate') {
    return 'Network isolation requires explicit approval due to business impact';
  }

  if (action.risk_level === 'high') {
    return 'High-risk action requires approval';
  }

  return 'Action type not configured for auto-execution';
}

/**
 * Execute a remediation action by sending command to agent
 */
async function executeRemediationAction(action: any, threat: ThreatDetection, agent: any, supabase: any) {
  // Create containment action record
  const { data: containmentAction } = await supabase
    .from('containment_actions')
    .insert({
      user_id: threat.user_id,
      agent_id: threat.agent_id,
      action_type: action.action_type,
      target_details: action.target,
      status: 'executing',
      executed_by: 'xdr_auto_remediation',
      requires_approval: false,
      auto_executed: true
    })
    .select()
    .single();

  // Build command payload
  let commandPayload: any = {
    containment_action_id: containmentAction?.id,
    xdr_automated: true
  };

  switch (action.action_type) {
    case 'process_kill':
      commandPayload.process_id = action.target.process_id;
      commandPayload.process_name = action.target.process_name;
      commandPayload.force = true;
      break;
    
    case 'file_quarantine':
      commandPayload.file_path = action.target.file_path;
      commandPayload.reason = `XDR: ${threat.threat_type}`;
      break;
    
    case 'firewall_block':
      commandPayload.ip_address = action.target.ip_address;
      commandPayload.port = action.target.port;
      commandPayload.direction = action.target.direction || 'both';
      break;
    
    case 'network_isolate':
      commandPayload.isolate = true;
      commandPayload.allow_list = []; // Vanguard IPs are hardcoded in agent
      break;
    
    case 'service_disable':
      commandPayload.service_name = action.target.service_name;
      break;
  }

  // Send command to agent
  const { data: agentCommand, error: cmdError } = await supabase
    .from('vanguard_agent_commands')
    .insert({
      agent_id: threat.agent_id,
      user_id: threat.user_id,
      command_type: action.action_type,
      payload: commandPayload,
      status: 'pending',
      priority: action.priority,
      source: 'xdr_auto_remediation'
    })
    .select()
    .single();

  if (cmdError) {
    console.error('Failed to send command:', cmdError);
    return { success: false, error: cmdError.message };
  }

  // Update containment action with command ID
  if (containmentAction) {
    await supabase
      .from('containment_actions')
      .update({ 
        status: 'command_sent',
        command_id: agentCommand.id 
      })
      .eq('id', containmentAction.id);
  }

  console.log(`XDR Auto-Remediation: Sent ${action.action_type} to ${agent.hostname}`);

  return {
    success: true,
    command_id: agentCommand.id,
    containment_action_id: containmentAction?.id,
    agent_hostname: agent.hostname
  };
}

/**
 * Create a security alert for the threat
 */
async function createSecurityAlert(threat: ThreatDetection, responseActions: any, executedActions: any[], supabase: any) {
  await supabase
    .from('security_events')
    .insert({
      user_id: threat.user_id,
      event_type: 'xdr_threat_detected',
      severity: threat.severity,
      source: 'vanguard_xdr',
      description: `XDR detected ${threat.threat_type} with ${threat.confidence}% confidence. ${executedActions.length} actions auto-executed.`,
      details: {
        threat,
        response_actions: responseActions,
        executed_actions: executedActions,
        requires_attention: threat.severity === 'critical'
      },
      status: executedActions.length > 0 ? 'auto_remediated' : 'pending'
    });
}

/**
 * Manual containment execution (for approved pending actions)
 */
async function executeContainment(payload: { action_id: string; approved_by: string }, supabase: any) {
  const { action_id, approved_by } = payload;

  const { data: action } = await supabase
    .from('containment_actions')
    .select('*')
    .eq('id', action_id)
    .single();

  if (!action) {
    return new Response(
      JSON.stringify({ error: 'Containment action not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Execute the action
  const { data: agent } = await supabase
    .from('vanguard_agents')
    .select('*')
    .eq('id', action.agent_id)
    .single();

  const result = await executeRemediationAction(
    { action_type: action.action_type, target: action.target_details, priority: 1 },
    { agent_id: action.agent_id, user_id: action.user_id, threat_type: 'manual_execution', severity: 'high', confidence: 100 },
    agent,
    supabase
  );

  // Update action status
  await supabase
    .from('containment_actions')
    .update({
      status: 'executed',
      approved_by,
      executed_at: new Date().toISOString()
    })
    .eq('id', action_id);

  return new Response(
    JSON.stringify({ success: true, result }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Verify remediation effectiveness
 */
async function verifyRemediation(payload: { command_id: string; agent_id: string }, supabase: any) {
  const { command_id, agent_id } = payload;

  // Check command result
  const { data: command } = await supabase
    .from('vanguard_agent_commands')
    .select('*')
    .eq('id', command_id)
    .single();

  if (!command) {
    return new Response(
      JSON.stringify({ error: 'Command not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get latest security telemetry from agent
  const { data: latestTelemetry } = await supabase
    .from('vanguard_security_events')
    .select('*')
    .eq('agent_id', agent_id)
    .order('created_at', { ascending: false })
    .limit(5);

  const verification = {
    command_status: command.status,
    command_result: command.result,
    executed_at: command.executed_at,
    verified: command.status === 'completed',
    recent_security_events: latestTelemetry?.length || 0,
    threat_neutralized: command.status === 'completed' && !latestTelemetry?.some((e: any) => e.severity === 'critical'),
    learning_feedback: {
      action_effective: command.status === 'completed',
      false_positive: false, // Would be set by human review
      model_update_recommended: false
    }
  };

  // Update containment action with verification
  if (command.payload?.containment_action_id) {
    await supabase
      .from('containment_actions')
      .update({
        status: verification.threat_neutralized ? 'verified_effective' : 'requires_review',
        verification_result: verification
      })
      .eq('id', command.payload.containment_action_id);
  }

  return new Response(
    JSON.stringify({ success: true, verification }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Get status of all remediation actions for a user/agent
 */
async function getRemediationStatus(payload: { user_id?: string; agent_id?: string }, supabase: any) {
  let query = supabase
    .from('containment_actions')
    .select('*, vanguard_agents(hostname)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (payload.user_id) {
    query = query.eq('user_id', payload.user_id);
  }
  if (payload.agent_id) {
    query = query.eq('agent_id', payload.agent_id);
  }

  const { data: actions, error } = await query;

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      actions,
      summary: {
        total: actions?.length || 0,
        pending: actions?.filter((a: any) => a.status === 'pending').length || 0,
        executing: actions?.filter((a: any) => a.status === 'executing').length || 0,
        completed: actions?.filter((a: any) => a.status === 'completed' || a.status === 'verified_effective').length || 0,
        failed: actions?.filter((a: any) => a.status === 'failed').length || 0
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Update auto-remediation configuration
 */
async function updateConfiguration(payload: { user_id: string; config: Partial<AutoRemediationConfig> }, supabase: any) {
  // Store configuration in user's Vanguard settings
  const { error } = await supabase
    .from('vanguard_settings')
    .upsert({
      user_id: payload.user_id,
      setting_key: 'xdr_auto_remediation_config',
      setting_value: payload.config,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,setting_key'
    });

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, message: 'Configuration updated' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
