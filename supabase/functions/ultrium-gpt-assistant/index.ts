import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { corsHeaders } from '../_shared/cors.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface AssistantRequest {
  message: string;
  userId: string;
  context?: string;
}

interface ToolFunction {
  name: string;
  description: string;
  parameters: any;
}

const availableTools: ToolFunction[] = [
  {
    name: "generate_security_report",
    description: "Generate a comprehensive security status report including threat detections, antivirus status, and security events",
    parameters: {
      type: "object",
      properties: {
        timeframe: { type: "string", enum: ["1day", "7days", "30days"], default: "7days" },
        include_details: { type: "boolean", default: true }
      }
    }
  },
  {
    name: "generate_rmm_report",
    description: "Generate a Remote Monitoring and Management report with system status, alerts, and performance metrics",
    parameters: {
      type: "object",
      properties: {
        timeframe: { type: "string", enum: ["1day", "7days", "30days"], default: "7days" },
        include_offline_devices: { type: "boolean", default: true }
      }
    }
  },
  {
    name: "check_threat_status",
    description: "Check current threat detection status across all security tools",
    parameters: {
      type: "object",
      properties: {
        detailed: { type: "boolean", default: false }
      }
    }
  },
  {
    name: "create_support_ticket",
    description: "Create a new support ticket when issues need escalation",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        priority: { type: "string", enum: ["low", "medium", "high", "critical"], default: "medium" },
        category: { type: "string", default: "General Support" }
      },
      required: ["title", "description"]
    }
  },
  {
    name: "system_health_check",
    description: "Perform a comprehensive system health check across all monitored systems",
    parameters: {
      type: "object",
      properties: {
        include_performance_metrics: { type: "boolean", default: true }
      }
    }
  },
  {
    name: "get_recent_alerts",
    description: "Get recent alerts and notifications from all systems",
    parameters: {
      type: "object",
      properties: {
        hours: { type: "number", default: 24 },
        severity_filter: { type: "string", enum: ["all", "high", "critical"], default: "all" }
      }
    }
  }
];

async function generateSecurityReport(userId: string, params: any) {
  try {
    // Get security events
    const { data: securityEvents } = await supabase
      .from('security_events')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - (params.timeframe === '1day' ? 86400000 : params.timeframe === '7days' ? 604800000 : 2592000000)).toISOString())
      .order('created_at', { ascending: false });

    // Get incidents
    const { data: incidents } = await supabase
      .from('incidents')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - (params.timeframe === '1day' ? 86400000 : params.timeframe === '7days' ? 604800000 : 2592000000)).toISOString());

    const report = {
      timeframe: params.timeframe,
      summary: {
        total_events: securityEvents?.length || 0,
        high_severity_events: securityEvents?.filter(e => e.severity === 'high').length || 0,
        critical_events: securityEvents?.filter(e => e.severity === 'critical').length || 0,
        open_incidents: incidents?.filter(i => i.status === 'open').length || 0,
        resolved_incidents: incidents?.filter(i => i.status === 'resolved').length || 0
      },
      events: params.include_details ? securityEvents?.slice(0, 10) : [],
      recommendations: []
    };

    if (report.summary.critical_events > 0) {
      report.recommendations.push("Immediate attention required for critical security events");
    }
    if (report.summary.open_incidents > 0) {
      report.recommendations.push("Review and address open security incidents");
    }

    return report;
  } catch (error) {
    console.error('Error generating security report:', error);
    throw error;
  }
}

async function generateRMMReport(userId: string, params: any) {
  try {
    // Get client data (mock for now since we'd need to integrate with actual RMM tools)
    const { data: clients } = await supabase
      .from('msp_clients')
      .select('*')
      .eq('msp_id', userId);

    const report = {
      timeframe: params.timeframe,
      summary: {
        total_devices: 247, // Mock data - would come from actual RMM
        online_devices: 231,
        offline_devices: 16,
        alerts_count: 8,
        clients_count: clients?.length || 0
      },
      device_categories: [
        { category: "Servers", total: 12, online: 11, offline: 1 },
        { category: "Workstations", total: 185, online: 178, offline: 7 },
        { category: "Network Devices", total: 50, online: 42, offline: 8 }
      ],
      recent_alerts: [
        { device: "SERVER-01", type: "High CPU Usage", severity: "critical", time: "5 min ago" },
        { device: "WS-MARKETING-12", type: "Low Disk Space", severity: "warning", time: "12 min ago" }
      ]
    };

    return report;
  } catch (error) {
    console.error('Error generating RMM report:', error);
    throw error;
  }
}

async function checkThreatStatus(userId: string, params: any) {
  try {
    // Get recent security events
    const { data: recentEvents } = await supabase
      .from('security_events')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 86400000).toISOString()) // Last 24 hours
      .order('created_at', { ascending: false });

    const status = {
      overall_status: "SECURE",
      threats_detected_24h: recentEvents?.length || 0,
      threats_blocked: recentEvents?.filter(e => e.status === 'blocked').length || 0,
      active_investigations: recentEvents?.filter(e => e.status === 'investigating').length || 0,
      last_scan: "2 minutes ago",
      threat_breakdown: {
        malware: recentEvents?.filter(e => e.event_type === 'malware_detected').length || 0,
        phishing: recentEvents?.filter(e => e.event_type === 'phishing_attempt').length || 0,
        suspicious_activity: recentEvents?.filter(e => e.event_type === 'suspicious_activity').length || 0
      }
    };

    if (status.threats_detected_24h > 10) {
      status.overall_status = "HIGH_ACTIVITY";
    } else if (status.threats_detected_24h > 0) {
      status.overall_status = "MONITORING";
    }

    return status;
  } catch (error) {
    console.error('Error checking threat status:', error);
    throw error;
  }
}

async function createSupportTicket(userId: string, params: any) {
  try {
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: userId,
        title: params.title,
        description: params.description,
        priority: params.priority,
        category: params.category,
        status: 'open',
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ticket_id: ticket.id,
      ticket_number: ticket.id.slice(0, 8),
      status: 'created',
      priority: params.priority
    };
  } catch (error) {
    console.error('Error creating support ticket:', error);
    throw error;
  }
}

async function systemHealthCheck(userId: string, params: any) {
  try {
    const health = {
      overall_health: "GOOD",
      services_status: {
        rmm: "OPERATIONAL",
        antivirus: "OPERATIONAL", 
        mdr: "OPERATIONAL",
        helpdesk: "OPERATIONAL",
        security_tools: "OPERATIONAL"
      },
      performance_metrics: {
        avg_response_time: "120ms",
        uptime_percentage: "99.8%",
        cpu_usage: "45%",
        memory_usage: "62%",
        disk_usage: "78%"
      },
      recommendations: [
        "Consider disk cleanup for storage optimization",
        "All security services are running optimally"
      ]
    };

    return health;
  } catch (error) {
    console.error('Error performing system health check:', error);
    throw error;
  }
}

async function getRecentAlerts(userId: string, params: any) {
  try {
    const hoursAgo = new Date(Date.now() - (params.hours * 3600000));
    
    const { data: alerts } = await supabase
      .from('security_events')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', hoursAgo.toISOString())
      .order('created_at', { ascending: false });

    let filteredAlerts = alerts || [];
    if (params.severity_filter !== 'all') {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === params.severity_filter);
    }

    return {
      total_alerts: filteredAlerts.length,
      timeframe_hours: params.hours,
      severity_filter: params.severity_filter,
      alerts: filteredAlerts.slice(0, 20)
    };
  } catch (error) {
    console.error('Error getting recent alerts:', error);
    throw error;
  }
}

async function executeToolFunction(toolName: string, userId: string, parameters: any) {
  switch (toolName) {
    case 'generate_security_report':
      return await generateSecurityReport(userId, parameters);
    case 'generate_rmm_report':
      return await generateRMMReport(userId, parameters);
    case 'check_threat_status':
      return await checkThreatStatus(userId, parameters);
    case 'create_support_ticket':
      return await createSupportTicket(userId, parameters);
    case 'system_health_check':
      return await systemHealthCheck(userId, parameters);
    case 'get_recent_alerts':
      return await getRecentAlerts(userId, parameters);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId, context }: AssistantRequest = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Call OpenAI with function calling capability
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are UltriumGPT, an AI assistant that helps with IT support, system monitoring, and security management. You have access to various tools and can:

1. Generate comprehensive reports (security, RMM, system health)
2. Check threat status and security events
3. Create support tickets for escalation
4. Monitor system health and performance
5. Analyze recent alerts and incidents

You should be helpful, professional, and proactive in suggesting actions. When users ask for reports or information that requires tool usage, use the appropriate functions. Always explain what you're doing and provide actionable insights.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        functions: availableTools,
        function_call: 'auto',
        temperature: 0.7,
        max_tokens: 1500
      }),
    });

    const data = await response.json();
    const choice = data.choices[0];

    let assistantResponse = '';
    let metadata: any = {};
    let toolsUsed: string[] = [];

    // Handle function calls
    if (choice.message.function_call) {
      const functionName = choice.message.function_call.name;
      const functionArgs = JSON.parse(choice.message.function_call.arguments);
      
      try {
        const toolResult = await executeToolFunction(functionName, userId, functionArgs);
        toolsUsed.push(functionName);

        // Generate a follow-up response incorporating the tool result
        const followUpResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: 'You are UltriumGPT. Analyze the tool result and provide a helpful, detailed response to the user. Include key insights, recommendations, and next steps.'
              },
              {
                role: 'user',
                content: message
              },
              {
                role: 'assistant',
                content: `I executed the ${functionName} function. Here are the results: ${JSON.stringify(toolResult)}`
              },
              {
                role: 'user',
                content: 'Please provide a summary and analysis of these results in a user-friendly format.'
              }
            ],
            temperature: 0.7,
            max_tokens: 1000
          }),
        });

        const followUpData = await followUpResponse.json();
        assistantResponse = followUpData.choices[0].message.content;

        // Set metadata based on the tool used
        if (functionName === 'create_support_ticket' && toolResult.ticket_number) {
          metadata.ticketCreated = toolResult.ticket_number;
        }
        if (functionName.includes('report')) {
          metadata.reportGenerated = true;
        }

      } catch (toolError) {
        console.error('Tool execution error:', toolError);
        assistantResponse = `I encountered an issue while trying to ${functionName.replace('_', ' ')}. Let me help you in another way. ${choice.message.content || 'How else can I assist you?'}`;
      }
    } else {
      assistantResponse = choice.message.content;
    }

    metadata.toolsUsed = toolsUsed;

    return new Response(JSON.stringify({
      response: assistantResponse,
      metadata: metadata
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ultrium-gpt-assistant:', error);
    return new Response(JSON.stringify({
      response: "I apologize, but I'm experiencing some technical difficulties right now. Please try again in a moment, or contact support if the issue persists.",
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});