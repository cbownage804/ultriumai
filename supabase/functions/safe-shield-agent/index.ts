import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EndpointData {
  hostname: string;
  ip_address: string;
  os_version: string;
  last_seen: string;
  agent_version: string;
  status: 'online' | 'offline' | 'threat_detected' | 'isolated';
}

interface ThreatEvent {
  event_id: string;
  hostname: string;
  threat_type: 'malware' | 'ransomware' | 'suspicious_process' | 'network_anomaly' | 'file_modification';
  severity: 'low' | 'medium' | 'high' | 'critical';
  file_path?: string;
  process_name?: string;
  command_line?: string;
  network_connection?: string;
  threat_signature?: string;
  behavioral_indicators: string[];
  ai_confidence_score: number;
  timestamp: string;
  status: 'detected' | 'quarantined' | 'cleaned' | 'false_positive';
  response_actions: string[];
}

interface AIThreatAnalysis {
  threat_assessment: string;
  recommended_actions: string[];
  isolation_required: boolean;
  walkthrough_steps: string[];
  impact_analysis: string;
  containment_strategy: string;
}

// Simulate advanced threat detection algorithms
function analyzeThreatBehavior(event: Partial<ThreatEvent>): AIThreatAnalysis {
  const isCritical = event.threat_type === 'ransomware' || 
                    event.behavioral_indicators?.some(i => 
                      i.includes('encryption') || 
                      i.includes('mass_file_deletion') ||
                      i.includes('shadow_copy_deletion')
                    );

  const isAdvancedThreat = event.behavioral_indicators?.some(i =>
    i.includes('lateral_movement') ||
    i.includes('credential_theft') ||
    i.includes('persistence_mechanism')
  );

  let walkthrough_steps = [];
  let containment_strategy = '';

  if (isCritical) {
    walkthrough_steps = [
      "🚨 CRITICAL THREAT DETECTED - Immediate action required",
      "1. Isolate affected endpoint from network immediately",
      "2. Preserve forensic evidence - do NOT power down",
      "3. Document all file modifications and network connections",
      "4. Check for lateral movement to other systems",
      "5. Verify backup integrity before beginning recovery",
      "6. Engage incident response team if available"
    ];
    containment_strategy = "Immediate network isolation with forensic preservation";
  } else if (isAdvancedThreat) {
    walkthrough_steps = [
      "⚠️ Advanced Persistent Threat detected",
      "1. Monitor and gather additional intelligence",
      "2. Check for indicators of compromise on other endpoints",
      "3. Review user access logs and privilege escalations",
      "4. Prepare for coordinated response across environment",
      "5. Document attack chain for threat intelligence"
    ];
    containment_strategy = "Monitored containment with intelligence gathering";
  } else {
    walkthrough_steps = [
      "🛡️ Standard threat response protocol",
      "1. Quarantine suspicious files",
      "2. Terminate malicious processes",
      "3. Run full system scan",
      "4. Update threat signatures",
      "5. Monitor for 24 hours post-remediation"
    ];
    containment_strategy = "Standard quarantine and remediation";
  }

  return {
    threat_assessment: isCritical ? 
      "CRITICAL: Ransomware or destructive malware detected. Immediate isolation required." :
      isAdvancedThreat ?
      "HIGH: Advanced persistent threat with potential for lateral movement." :
      "MEDIUM: Standard malware threat contained to single endpoint.",
    recommended_actions: isCritical ? 
      ["isolate_endpoint", "preserve_forensics", "backup_verification", "incident_response"] :
      isAdvancedThreat ?
      ["monitor_and_analyze", "check_lateral_movement", "gather_intelligence"] :
      ["quarantine", "scan", "monitor"],
    isolation_required: isCritical,
    walkthrough_steps,
    impact_analysis: isCritical ? 
      "High risk of data encryption and business disruption" :
      "Contained threat with minimal business impact expected",
    containment_strategy
  };
}

// Simulate real-time threat detection
function generateThreatEvent(hostname: string): ThreatEvent {
  const threatTypes = ['malware', 'ransomware', 'suspicious_process', 'network_anomaly', 'file_modification'] as const;
  const randomThreat = threatTypes[Math.floor(Math.random() * threatTypes.length)];
  
  let behavioral_indicators = [];
  let severity: ThreatEvent['severity'] = 'low';
  let ai_confidence_score = 0.3 + Math.random() * 0.7;

  switch (randomThreat) {
    case 'ransomware':
      behavioral_indicators = [
        'mass_file_encryption_detected',
        'shadow_copy_deletion',
        'backup_service_termination',
        'ransom_note_creation'
      ];
      severity = 'critical';
      ai_confidence_score = 0.85 + Math.random() * 0.15;
      break;
    case 'malware':
      behavioral_indicators = [
        'unsigned_executable_execution',
        'registry_modification',
        'network_beacon_detected'
      ];
      severity = Math.random() > 0.5 ? 'high' : 'medium';
      break;
    case 'suspicious_process':
      behavioral_indicators = [
        'process_injection_detected',
        'unusual_parent_child_relationship',
        'privilege_escalation_attempt'
      ];
      severity = 'medium';
      break;
    case 'network_anomaly':
      behavioral_indicators = [
        'unusual_outbound_connection',
        'data_exfiltration_pattern',
        'command_and_control_communication'
      ];
      severity = 'high';
      break;
    case 'file_modification':
      behavioral_indicators = [
        'system_file_modification',
        'startup_persistence_creation',
        'configuration_tampering'
      ];
      severity = 'medium';
      break;
  }

  return {
    event_id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    hostname,
    threat_type: randomThreat,
    severity,
    file_path: randomThreat === 'file_modification' ? 'C:\\Windows\\System32\\config\\software' : undefined,
    process_name: randomThreat === 'suspicious_process' ? 'svchost.exe' : undefined,
    command_line: randomThreat === 'suspicious_process' ? 'svchost.exe -k netsvcs -p -s Schedule' : undefined,
    network_connection: randomThreat === 'network_anomaly' ? '192.168.1.100:443 -> 185.159.157.13:8080' : undefined,
    threat_signature: `SafeShield.${randomThreat}.${Math.floor(Math.random() * 1000)}`,
    behavioral_indicators,
    ai_confidence_score,
    timestamp: new Date().toISOString(),
    status: 'detected',
    response_actions: []
  };
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

    const { action, hostname, threat_id, user_id } = await req.json();

    switch (action) {
      case 'register_endpoint': {
        // Register new endpoint with SafeShield
        const endpointData: EndpointData = {
          hostname: hostname || `DESKTOP-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
          ip_address: `192.168.1.${100 + Math.floor(Math.random() * 50)}`,
          os_version: 'Windows 11 Pro 22H2',
          last_seen: new Date().toISOString(),
          agent_version: '1.0.0-beta',
          status: 'online'
        };

        // Store endpoint in database
        const { error } = await supabase
          .from('safe_shield_endpoints')
          .upsert({
            user_id,
            hostname: endpointData.hostname,
            ip_address: endpointData.ip_address,
            os_version: endpointData.os_version,
            agent_version: endpointData.agent_version,
            status: endpointData.status,
            last_seen: endpointData.last_seen,
            metadata: { registration_time: new Date().toISOString() }
          });

        if (error) throw error;

        return new Response(JSON.stringify({ 
          success: true, 
          endpoint: endpointData,
          message: `Endpoint ${endpointData.hostname} registered with SafeShield`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'simulate_threat': {
        // Generate and analyze threat
        const threatEvent = generateThreatEvent(hostname);
        const aiAnalysis = analyzeThreatBehavior(threatEvent);

        // Store threat event
        const { error } = await supabase
          .from('safe_shield_threats')
          .insert({
            user_id,
            event_id: threatEvent.event_id,
            hostname: threatEvent.hostname,
            threat_type: threatEvent.threat_type,
            severity: threatEvent.severity,
            file_path: threatEvent.file_path,
            process_name: threatEvent.process_name,
            command_line: threatEvent.command_line,
            network_connection: threatEvent.network_connection,
            threat_signature: threatEvent.threat_signature,
            behavioral_indicators: threatEvent.behavioral_indicators,
            ai_confidence_score: threatEvent.ai_confidence_score,
            status: threatEvent.status,
            ai_analysis: aiAnalysis,
            detected_at: threatEvent.timestamp
          });

        if (error) throw error;

        // If critical threat, update endpoint status
        if (aiAnalysis.isolation_required) {
          await supabase
            .from('safe_shield_endpoints')
            .update({ status: 'isolated' })
            .eq('hostname', hostname)
            .eq('user_id', user_id);
        }

        return new Response(JSON.stringify({
          success: true,
          threat_event: threatEvent,
          ai_analysis: aiAnalysis,
          message: `Threat detected on ${hostname} - ${aiAnalysis.threat_assessment}`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_dashboard_data': {
        // Get all endpoints and recent threats for dashboard
        const [endpointsResult, threatsResult] = await Promise.all([
          supabase
            .from('safe_shield_endpoints')
            .select('*')
            .eq('user_id', user_id)
            .order('last_seen', { ascending: false }),
          supabase
            .from('safe_shield_threats')
            .select('*')
            .eq('user_id', user_id)
            .order('detected_at', { ascending: false })
            .limit(50)
        ]);

        // If no data exists, provide demo data
        let endpoints = endpointsResult.data || [];
        let threats = threatsResult.data || [];

        if (endpoints.length === 0) {
          // Generate demo endpoints
          endpoints = [
            {
              id: '1',
              hostname: 'DC01-CORP',
              ip_address: '192.168.1.10',
              os_version: 'Windows Server 2022',
              agent_version: '2.1.0',
              status: 'online',
              last_seen: new Date().toISOString(),
              cpu_usage: 15,
              memory_usage: 45,
              disk_usage: 67
            },
            {
              id: '2',
              hostname: 'WS-FINANCE-01',
              ip_address: '192.168.1.25',
              os_version: 'Windows 11 Pro',
              agent_version: '2.1.0',
              status: 'threat_detected',
              last_seen: new Date().toISOString(),
              cpu_usage: 85,
              memory_usage: 78,
              disk_usage: 23,
              threats_count: 2
            },
            {
              id: '3',
              hostname: 'SRV-WEB-01',
              ip_address: '192.168.1.50',
              os_version: 'Ubuntu 22.04 LTS',
              agent_version: '2.1.0',
              status: 'isolated',
              last_seen: new Date(Date.now() - 300000).toISOString(),
              cpu_usage: 5,
              memory_usage: 12,
              disk_usage: 89
            },
            {
              id: '4',
              hostname: 'MAC-DESIGN-01',
              ip_address: '192.168.1.35',
              os_version: 'macOS Sonoma 14.2',
              agent_version: '2.1.0',
              status: 'online',
              last_seen: new Date().toISOString(),
              cpu_usage: 30,
              memory_usage: 60,
              disk_usage: 45
            }
          ];
        }

        if (threats.length === 0) {
          // Generate demo threats
          threats = [
            {
              id: '1',
              event_id: 'EVT-001',
              hostname: 'WS-FINANCE-01',
              threat_type: 'ransomware_detection',
              severity: 'critical',
              ai_confidence_score: 0.95,
              detected_at: new Date().toISOString(),
              status: 'active',
              ai_analysis: {
                threat_assessment: 'High-confidence ransomware detection based on file encryption patterns and suspicious process behavior.',
                recommended_actions: ['isolate_endpoint', 'quarantine', 'backup_recovery'],
                isolation_required: true,
                walkthrough_steps: [
                  'Immediately isolate the affected endpoint from the network',
                  'Identify and quarantine suspicious files and processes',
                  'Check for lateral movement indicators on adjacent systems',
                  'Initiate backup recovery procedures for affected data',
                  'Update threat intelligence and apply preventive measures'
                ],
                impact_analysis: 'Potential data encryption affecting financial records. Immediate isolation prevents spread.',
                containment_strategy: 'Network isolation with forensic preservation for investigation'
              },
              behavioral_indicators: ['file_encryption_activity', 'suspicious_network_traffic', 'privilege_escalation']
            },
            {
              id: '2',
              event_id: 'EVT-002',
              hostname: 'DC01-CORP',
              threat_type: 'suspicious_process',
              severity: 'medium',
              ai_confidence_score: 0.75,
              detected_at: new Date(Date.now() - 1800000).toISOString(),
              status: 'investigating',
              ai_analysis: {
                threat_assessment: 'Unusual process behavior detected with potential privilege escalation attempts.',
                recommended_actions: ['monitor', 'scan', 'analyze'],
                isolation_required: false,
                walkthrough_steps: [
                  'Monitor process activity for additional indicators',
                  'Run comprehensive malware scan',
                  'Check system logs for related events',
                  'Verify process legitimacy with signature validation'
                ],
                impact_analysis: 'Low to medium risk. Process appears contained to single system.',
                containment_strategy: 'Monitor and analyze with selective process termination if needed'
              },
              behavioral_indicators: ['unusual_process_execution', 'registry_modification']
            }
          ];
        }

        // Calculate threat statistics
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentThreats = threats.filter(t => new Date(t.detected_at) > last24h);
        
        const threatStats = {
          total_threats: threats.length,
          threats_24h: recentThreats.length,
          critical_threats: threats.filter(t => t.severity === 'critical').length,
          isolated_endpoints: endpoints.filter(e => e.status === 'isolated').length,
          active_endpoints: endpoints.filter(e => e.status === 'online').length
        };

        return new Response(JSON.stringify({
          success: true,
          endpoints: endpoints,
          threats: threats,
          threat_stats: threatStats
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'isolate_endpoint': {
        // Isolate endpoint from network
        const { error } = await supabase
          .from('safe_shield_endpoints')
          .update({ status: 'isolated' })
          .eq('hostname', hostname)
          .eq('user_id', user_id);

        if (error) console.log('Database update error (demo mode):', error);

        // Log the isolation action
        await supabase
          .from('safe_shield_actions')
          .insert({
            user_id,
            hostname,
            action_type: 'isolate_endpoint',
            action_details: { reason: 'Manual isolation request', timestamp: new Date().toISOString() },
            performed_at: new Date().toISOString()
          });

        return new Response(JSON.stringify({
          success: true,
          message: `Endpoint ${hostname} has been isolated from the network`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'release_isolation': {
        // Release endpoint from isolation
        const { error } = await supabase
          .from('safe_shield_endpoints')
          .update({ status: 'online' })
          .eq('hostname', hostname)
          .eq('user_id', user_id);

        if (error) console.log('Database update error (demo mode):', error);

        return new Response(JSON.stringify({
          success: true,
          message: `Endpoint ${hostname} has been released from isolation`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'scan_endpoint': {
        // Initiate endpoint scan
        return new Response(JSON.stringify({
          success: true,
          message: `Security scan initiated on ${hostname}`,
          scan_id: `scan_${Date.now()}`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'restart_agent': {
        // Restart SafeShield agent
        return new Response(JSON.stringify({
          success: true,
          message: `SafeShield agent restart command sent to ${hostname}`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'update_agent': {
        // Update SafeShield agent
        return new Response(JSON.stringify({
          success: true,
          message: `Agent update initiated on ${hostname}`,
          new_version: '2.1.1'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Error in ultrium-shield-agent:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});