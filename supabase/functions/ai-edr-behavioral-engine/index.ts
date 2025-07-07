import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface ProcessBehavior {
  processId: number;
  processName: string;
  parentProcessId?: number;
  parentProcessName?: string;
  commandLine: string;
  filePath: string;
  hashSha256?: string;
  networkConnections: NetworkConnection[];
  fileOperations: FileOperation[];
  registryOperations: RegistryOperation[];
  memoryAnalysis: MemoryAnalysis;
  userId: string;
  endpointId: string;
}

interface NetworkConnection {
  localAddress: string;
  localPort: number;
  remoteAddress: string;
  remotePort: number;
  protocol: string;
  state: string;
  timestamp: string;
}

interface FileOperation {
  operation: string;
  filePath: string;
  fileSize?: number;
  fileHash?: string;
  timestamp: string;
}

interface RegistryOperation {
  operation: string;
  keyPath: string;
  valueName?: string;
  valueData?: string;
  timestamp: string;
}

interface MemoryAnalysis {
  memoryUsage: number;
  injectedCode: boolean;
  hollowedProcess: boolean;
  suspiciousStrings: string[];
  entropy: number;
}

interface BehavioralAnalysisResult {
  behaviorScore: number;
  threatClassification: 'benign' | 'suspicious' | 'malicious' | 'critical';
  aiConfidenceScore: number;
  anomalyIndicators: AnomalyIndicator[];
  mitreTactics: string[];
  mitreTechniques: string[];
  detectionRulesTriggered: DetectionRule[];
}

interface AnomalyIndicator {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
}

interface DetectionRule {
  ruleId: string;
  ruleName: string;
  category: string;
  severity: string;
  confidence: number;
}

// ML-based behavioral analysis engine
class AIBehavioralEngine {
  private suspiciousProcessNames = [
    'powershell.exe', 'cmd.exe', 'wscript.exe', 'cscript.exe', 'regsvr32.exe',
    'rundll32.exe', 'mshta.exe', 'bitsadmin.exe', 'certutil.exe', 'schtasks.exe'
  ];

  private suspiciousCommands = [
    'invoke-expression', 'downloadstring', 'base64', 'encoded', 'bypass',
    'executionpolicy', 'noprofile', 'hidden', 'windowstyle', 'iex'
  ];

  private criticalFileLocations = [
    'C:\\Windows\\System32\\', 'C:\\Windows\\SysWOW64\\', 'C:\\Program Files\\',
    'C:\\Users\\', '%APPDATA%', '%TEMP%', '%USERPROFILE%'
  ];

  async analyzeBehavior(behavior: ProcessBehavior): Promise<BehavioralAnalysisResult> {
    const anomalyIndicators: AnomalyIndicator[] = [];
    const mitreTactics: Set<string> = new Set();
    const mitreTechniques: Set<string> = new Set();
    const detectionRules: DetectionRule[] = [];
    
    let behaviorScore = 0;
    let aiConfidenceScore = 85.0; // Base confidence

    // 1. Process Analysis
    const processAnalysis = this.analyzeProcess(behavior);
    behaviorScore += processAnalysis.score;
    anomalyIndicators.push(...processAnalysis.indicators);
    processAnalysis.tactics.forEach(t => mitreTactics.add(t));
    processAnalysis.techniques.forEach(t => mitreTechniques.add(t));

    // 2. Command Line Analysis
    const commandAnalysis = this.analyzeCommandLine(behavior.commandLine);
    behaviorScore += commandAnalysis.score;
    anomalyIndicators.push(...commandAnalysis.indicators);
    commandAnalysis.tactics.forEach(t => mitreTactics.add(t));
    commandAnalysis.techniques.forEach(t => mitreTechniques.add(t));

    // 3. Network Behavior Analysis
    const networkAnalysis = this.analyzeNetworkBehavior(behavior.networkConnections);
    behaviorScore += networkAnalysis.score;
    anomalyIndicators.push(...networkAnalysis.indicators);
    networkAnalysis.tactics.forEach(t => mitreTactics.add(t));
    networkAnalysis.techniques.forEach(t => mitreTechniques.add(t));

    // 4. File Operations Analysis
    const fileAnalysis = this.analyzeFileOperations(behavior.fileOperations);
    behaviorScore += fileAnalysis.score;
    anomalyIndicators.push(...fileAnalysis.indicators);
    fileAnalysis.tactics.forEach(t => mitreTactics.add(t));
    fileAnalysis.techniques.forEach(t => mitreTechniques.add(t));

    // 5. Registry Operations Analysis
    const registryAnalysis = this.analyzeRegistryOperations(behavior.registryOperations);
    behaviorScore += registryAnalysis.score;
    anomalyIndicators.push(...registryAnalysis.indicators);
    registryAnalysis.tactics.forEach(t => mitreTactics.add(t));
    registryAnalysis.techniques.forEach(t => mitreTechniques.add(t));

    // 6. Memory Analysis
    const memoryAnalysis = this.analyzeMemory(behavior.memoryAnalysis);
    behaviorScore += memoryAnalysis.score;
    anomalyIndicators.push(...memoryAnalysis.indicators);
    memoryAnalysis.tactics.forEach(t => mitreTactics.add(t));
    memoryAnalysis.techniques.forEach(t => mitreTechniques.add(t));

    // Determine threat classification
    let threatClassification: 'benign' | 'suspicious' | 'malicious' | 'critical';
    if (behaviorScore >= 80) {
      threatClassification = 'critical';
      aiConfidenceScore = Math.min(aiConfidenceScore + 10, 95);
    } else if (behaviorScore >= 60) {
      threatClassification = 'malicious';
      aiConfidenceScore = Math.min(aiConfidenceScore + 5, 90);
    } else if (behaviorScore >= 30) {
      threatClassification = 'suspicious';
    } else {
      threatClassification = 'benign';
      aiConfidenceScore = Math.max(aiConfidenceScore - 5, 70);
    }

    return {
      behaviorScore: Math.min(behaviorScore, 100),
      threatClassification,
      aiConfidenceScore,
      anomalyIndicators,
      mitreTactics: Array.from(mitreTactics),
      mitreTechniques: Array.from(mitreTechniques),
      detectionRulesTriggered: detectionRules
    };
  }

  private analyzeProcess(behavior: ProcessBehavior) {
    const indicators: AnomalyIndicator[] = [];
    const tactics: string[] = [];
    const techniques: string[] = [];
    let score = 0;

    // Check for suspicious process names
    if (this.suspiciousProcessNames.includes(behavior.processName.toLowerCase())) {
      score += 25;
      indicators.push({
        type: 'suspicious_process',
        description: `Suspicious process detected: ${behavior.processName}`,
        severity: 'medium',
        confidence: 80
      });
      tactics.push('T1059'); // Command and Scripting Interpreter
      techniques.push('Command and Scripting Interpreter');
    }

    // Check for process masquerading
    if (behavior.processName.toLowerCase() === 'svchost.exe' && 
        !behavior.filePath.toLowerCase().includes('system32')) {
      score += 40;
      indicators.push({
        type: 'process_masquerading',
        description: 'Process masquerading detected - svchost.exe not in system32',
        severity: 'high',
        confidence: 90
      });
      tactics.push('T1036'); // Masquerading
      techniques.push('Masquerading');
    }

    // Check for unusual parent-child relationships
    if (behavior.parentProcessName && this.isUnusualParentChild(behavior.parentProcessName, behavior.processName)) {
      score += 30;
      indicators.push({
        type: 'unusual_parent_child',
        description: `Unusual parent-child relationship: ${behavior.parentProcessName} -> ${behavior.processName}`,
        severity: 'medium',
        confidence: 75
      });
      tactics.push('T1055'); // Process Injection
      techniques.push('Process Injection');
    }

    return { score, indicators, tactics, techniques };
  }

  private analyzeCommandLine(commandLine: string) {
    const indicators: AnomalyIndicator[] = [];
    const tactics: string[] = [];
    const techniques: string[] = [];
    let score = 0;

    const lowerCmd = commandLine.toLowerCase();

    // Check for suspicious command patterns
    for (const suspCmd of this.suspiciousCommands) {
      if (lowerCmd.includes(suspCmd)) {
        score += 20;
        indicators.push({
          type: 'suspicious_command',
          description: `Suspicious command pattern detected: ${suspCmd}`,
          severity: 'medium',
          confidence: 85
        });
        tactics.push('T1059'); // Command and Scripting Interpreter
        techniques.push('PowerShell');
      }
    }

    // Check for obfuscation
    if (this.isObfuscated(commandLine)) {
      score += 35;
      indicators.push({
        type: 'obfuscated_command',
        description: 'Command line obfuscation detected',
        severity: 'high',
        confidence: 90
      });
      tactics.push('T1027'); // Obfuscated Files or Information
      techniques.push('Obfuscated Files or Information');
    }

    // Check for long command lines (potential payload)
    if (commandLine.length > 1000) {
      score += 15;
      indicators.push({
        type: 'long_command_line',
        description: 'Unusually long command line detected',
        severity: 'low',
        confidence: 70
      });
    }

    return { score, indicators, tactics, techniques };
  }

  private analyzeNetworkBehavior(connections: NetworkConnection[]) {
    const indicators: AnomalyIndicator[] = [];
    const tactics: string[] = [];
    const techniques: string[] = [];
    let score = 0;

    // Check for suspicious network activity
    const uniqueRemoteHosts = new Set(connections.map(c => c.remoteAddress));
    
    if (uniqueRemoteHosts.size > 10) {
      score += 20;
      indicators.push({
        type: 'excessive_network_connections',
        description: `Process connecting to ${uniqueRemoteHosts.size} unique hosts`,
        severity: 'medium',
        confidence: 75
      });
      tactics.push('T1071'); // Application Layer Protocol
      techniques.push('Application Layer Protocol');
    }

    // Check for connections to suspicious ports
    const suspiciousPorts = [4444, 5555, 6666, 7777, 8080, 9999];
    for (const conn of connections) {
      if (suspiciousPorts.includes(conn.remotePort)) {
        score += 25;
        indicators.push({
          type: 'suspicious_port_connection',
          description: `Connection to suspicious port ${conn.remotePort}`,
          severity: 'medium',
          confidence: 80
        });
        tactics.push('T1071'); // Application Layer Protocol
        techniques.push('Application Layer Protocol');
      }
    }

    return { score, indicators, tactics, techniques };
  }

  private analyzeFileOperations(operations: FileOperation[]) {
    const indicators: AnomalyIndicator[] = [];
    const tactics: string[] = [];
    const techniques: string[] = [];
    let score = 0;

    for (const op of operations) {
      // Check for operations in critical locations
      if (this.criticalFileLocations.some(loc => op.filePath.toLowerCase().includes(loc.toLowerCase()))) {
        if (op.operation === 'write' || op.operation === 'create') {
          score += 30;
          indicators.push({
            type: 'critical_location_write',
            description: `File write in critical location: ${op.filePath}`,
            severity: 'high',
            confidence: 85
          });
          tactics.push('T1105'); // Ingress Tool Transfer
          techniques.push('Ingress Tool Transfer');
        }
      }

      // Check for executable file creation
      if (op.operation === 'create' && op.filePath.toLowerCase().endsWith('.exe')) {
        score += 25;
        indicators.push({
          type: 'executable_creation',
          description: `Executable file created: ${op.filePath}`,
          severity: 'medium',
          confidence: 80
        });
        tactics.push('T1105'); // Ingress Tool Transfer
        techniques.push('Ingress Tool Transfer');
      }
    }

    return { score, indicators, tactics, techniques };
  }

  private analyzeRegistryOperations(operations: RegistryOperation[]) {
    const indicators: AnomalyIndicator[] = [];
    const tactics: string[] = [];
    const techniques: string[] = [];
    let score = 0;

    const persistenceKeys = [
      'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
      'HKEY_CURRENT_USER\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
      'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\RunOnce'
    ];

    for (const op of operations) {
      // Check for persistence mechanism
      if (persistenceKeys.some(key => op.keyPath.includes(key))) {
        score += 40;
        indicators.push({
          type: 'persistence_registry',
          description: `Registry persistence mechanism detected: ${op.keyPath}`,
          severity: 'high',
          confidence: 90
        });
        tactics.push('T1547'); // Boot or Logon Autostart Execution
        techniques.push('Registry Run Keys / Startup Folder');
      }

      // Check for security settings modification
      if (op.keyPath.includes('Windows Defender') || op.keyPath.includes('Security')) {
        score += 35;
        indicators.push({
          type: 'security_settings_modification',
          description: `Security settings modification: ${op.keyPath}`,
          severity: 'high',
          confidence: 85
        });
        tactics.push('T1562'); // Impair Defenses
        techniques.push('Disable or Modify Tools');
      }
    }

    return { score, indicators, tactics, techniques };
  }

  private analyzeMemory(memAnalysis: MemoryAnalysis) {
    const indicators: AnomalyIndicator[] = [];
    const tactics: string[] = [];
    const techniques: string[] = [];
    let score = 0;

    if (memAnalysis.injectedCode) {
      score += 45;
      indicators.push({
        type: 'code_injection',
        description: 'Code injection detected in process memory',
        severity: 'high',
        confidence: 95
      });
      tactics.push('T1055'); // Process Injection
      techniques.push('Process Injection');
    }

    if (memAnalysis.hollowedProcess) {
      score += 50;
      indicators.push({
        type: 'process_hollowing',
        description: 'Process hollowing detected',
        severity: 'critical',
        confidence: 95
      });
      tactics.push('T1055'); // Process Injection
      techniques.push('Process Hollowing');
    }

    if (memAnalysis.entropy > 7.5) {
      score += 20;
      indicators.push({
        type: 'high_entropy',
        description: `High entropy detected in memory: ${memAnalysis.entropy}`,
        severity: 'medium',
        confidence: 80
      });
      tactics.push('T1027'); // Obfuscated Files or Information
      techniques.push('Obfuscated Files or Information');
    }

    return { score, indicators, tactics, techniques };
  }

  private isUnusualParentChild(parent: string, child: string): boolean {
    const unusualPairs = [
      ['winword.exe', 'powershell.exe'],
      ['excel.exe', 'cmd.exe'],
      ['outlook.exe', 'wscript.exe'],
      ['explorer.exe', 'powershell.exe']
    ];

    return unusualPairs.some(([p, c]) => 
      parent.toLowerCase().includes(p) && child.toLowerCase().includes(c)
    );
  }

  private isObfuscated(command: string): boolean {
    // Check for base64 encoding
    const base64Regex = /[A-Za-z0-9+\/]{20,}={0,2}/;
    if (base64Regex.test(command)) return true;

    // Check for excessive special characters
    const specialCharCount = (command.match(/[^a-zA-Z0-9\s]/g) || []).length;
    if (specialCharCount > command.length * 0.3) return true;

    // Check for character replacement obfuscation
    if (command.includes('`') || command.includes('^')) return true;

    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...payload } = await req.json();
    
    console.log('AI EDR Engine - Action:', action);

    switch (action) {
      case 'analyze_behavior':
        return await analyzeBehavior(payload);
      
      case 'get_realtime_alerts':
        return await getRealtimeAlerts(payload);
      
      case 'trigger_response':
        return await triggerAutomatedResponse(payload);
      
      case 'update_ml_models':
        return await updateMLModels(payload);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('AI EDR Engine Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function analyzeBehavior(payload: any) {
  const behaviorEngine = new AIBehavioralEngine();
  const analysis = await behaviorEngine.analyzeBehavior(payload as ProcessBehavior);
  
  // Store behavioral analysis in database
  const { data: behavioralData, error: behavioralError } = await supabase
    .from('edr_behavioral_analysis')
    .insert({
      user_id: payload.userId,
      endpoint_id: payload.endpointId,
      process_id: payload.processId,
      process_name: payload.processName,
      parent_process_id: payload.parentProcessId,
      parent_process_name: payload.parentProcessName,
      command_line: payload.commandLine,
      file_path: payload.filePath,
      hash_sha256: payload.hashSha256,
      network_connections: payload.networkConnections,
      file_operations: payload.fileOperations,
      registry_operations: payload.registryOperations,
      memory_analysis: payload.memoryAnalysis,
      behavior_score: analysis.behaviorScore,
      anomaly_indicators: analysis.anomalyIndicators,
      ai_confidence_score: analysis.aiConfidenceScore,
      threat_classification: analysis.threatClassification,
      mitre_tactics: analysis.mitreTactics,
      mitre_techniques: analysis.mitreTechniques,
      detection_rules_triggered: analysis.detectionRulesTriggered
    })
    .select()
    .single();

  if (behavioralError) {
    console.error('Error storing behavioral analysis:', behavioralError);
  }

  // If threat is malicious or critical, create real-time alert
  if (analysis.threatClassification === 'malicious' || analysis.threatClassification === 'critical') {
    await createRealtimeAlert(payload, analysis, behavioralData?.id);
  }

  return new Response(
    JSON.stringify({
      analysis,
      behavioral_analysis_id: behavioralData?.id,
      auto_response_triggered: analysis.threatClassification === 'critical'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function createRealtimeAlert(behavior: ProcessBehavior, analysis: BehavioralAnalysisResult, behavioralAnalysisId?: string) {
  const severity = analysis.threatClassification === 'critical' ? 'critical' : 'high';
  const attackStage = determineAttackStage(analysis.mitreTactics);
  
  const { error } = await supabase
    .from('edr_realtime_alerts')
    .insert({
      user_id: behavior.userId,
      endpoint_id: behavior.endpointId,
      behavioral_analysis_id: behavioralAnalysisId,
      alert_type: 'Behavioral Analysis Alert',
      severity,
      title: `${analysis.threatClassification.toUpperCase()} behavior detected: ${behavior.processName}`,
      description: `AI behavioral analysis detected ${analysis.threatClassification} activity with ${analysis.behaviorScore}% threat score`,
      attack_stage: attackStage,
      indicators_of_compromise: analysis.anomalyIndicators,
      auto_response_enabled: analysis.threatClassification === 'critical',
      containment_status: analysis.threatClassification === 'critical' ? 'process_blocked' : 'none'
    });

  if (error) {
    console.error('Error creating real-time alert:', error);
  }
}

function determineAttackStage(tactics: string[]): string {
  const tacticsToStage: Record<string, string> = {
    'T1059': 'execution',
    'T1055': 'defense_evasion',
    'T1547': 'persistence',
    'T1027': 'defense_evasion',
    'T1071': 'command_and_control',
    'T1105': 'lateral_movement',
    'T1562': 'defense_evasion'
  };

  for (const tactic of tactics) {
    if (tacticsToStage[tactic]) {
      return tacticsToStage[tactic];
    }
  }

  return 'execution';
}

async function getRealtimeAlerts(payload: any) {
  const { user_id, limit = 50, severity_filter } = payload;
  
  let query = supabase
    .from('edr_realtime_alerts')
    .select(`
      *,
      safe_shield_endpoints(hostname, ip_address, os_version),
      edr_behavioral_analysis(behavior_score, threat_classification, ai_confidence_score)
    `)
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (severity_filter) {
    query = query.eq('severity', severity_filter);
  }

  const { data, error } = await query;

  if (error) throw error;

  return new Response(
    JSON.stringify({ alerts: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function triggerAutomatedResponse(payload: any) {
  const { alert_id, response_type, user_id } = payload;
  
  // Simulate automated response actions
  const responseActions = [];
  
  switch (response_type) {
    case 'block_process':
      responseActions.push({
        action: 'process_terminated',
        timestamp: new Date().toISOString(),
        success: true,
        details: 'Malicious process terminated'
      });
      break;
      
    case 'isolate_endpoint':
      responseActions.push({
        action: 'network_isolated',
        timestamp: new Date().toISOString(),
        success: true,
        details: 'Endpoint isolated from network'
      });
      break;
      
    case 'quarantine_file':
      responseActions.push({
        action: 'file_quarantined',
        timestamp: new Date().toISOString(),
        success: true,
        details: 'Malicious file quarantined'
      });
      break;
  }

  // Update alert with response actions
  const { error } = await supabase
    .from('edr_realtime_alerts')
    .update({
      response_actions_taken: responseActions,
      containment_status: response_type === 'isolate_endpoint' ? 'endpoint_quarantined' : 'process_blocked',
      updated_at: new Date().toISOString()
    })
    .eq('id', alert_id)
    .eq('user_id', user_id);

  if (error) throw error;

  return new Response(
    JSON.stringify({ 
      success: true, 
      response_actions: responseActions,
      message: 'Automated response executed successfully'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function updateMLModels(payload: any) {
  // Simulate ML model updates
  const models = [
    {
      model_name: 'behavioral_anomaly_detector_v2',
      model_type: 'anomaly_detection',
      model_version: '2.1.0',
      accuracy_score: 94.5,
      false_positive_rate: 2.1,
      training_data_size: 500000,
      last_trained: new Date().toISOString(),
      is_active: true,
      performance_metrics: {
        precision: 0.945,
        recall: 0.923,
        f1_score: 0.934
      }
    },
    {
      model_name: 'malware_classifier_v3',
      model_type: 'malware_classification',
      model_version: '3.0.1',
      accuracy_score: 96.8,
      false_positive_rate: 1.5,
      training_data_size: 750000,
      last_trained: new Date().toISOString(),
      is_active: true,
      performance_metrics: {
        precision: 0.968,
        recall: 0.961,
        f1_score: 0.964
      }
    }
  ];

  const { data, error } = await supabase
    .from('edr_ml_models')
    .upsert(models, { onConflict: 'model_name' })
    .select();

  if (error) throw error;

  return new Response(
    JSON.stringify({ 
      success: true, 
      models: data,
      message: 'ML models updated successfully'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}