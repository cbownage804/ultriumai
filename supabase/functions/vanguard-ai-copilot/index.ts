import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Tool definitions for security operations
const securityTools = [
  {
    type: "function",
    function: {
      name: "check_email_breach",
      description: "Check if an email address has been exposed in data breaches. Returns breach history and leaked credentials from the dark web.",
      parameters: {
        type: "object",
        properties: {
          email: { type: "string", description: "The email address to check for breaches" }
        },
        required: ["email"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "check_domain_breach",
      description: "Check if a domain has leaked credentials in data breaches. Returns all leaked data associated with the domain.",
      parameters: {
        type: "object",
        properties: {
          domain: { type: "string", description: "The domain to check (e.g., example.com)" }
        },
        required: ["domain"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "scan_url",
      description: "Scan a URL to extract content, discover links, and analyze for potential phishing or malicious content.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "The URL to scan" }
        },
        required: ["url"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "check_ip_reputation",
      description: "Check if an IP address is on blocklists, associated with VPN/Tor, or has abuse reports.",
      parameters: {
        type: "object",
        properties: {
          ip: { type: "string", description: "The IP address to check" }
        },
        required: ["ip"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "scan_document_for_sensitive_data",
      description: "Analyze document text for sensitive data like SSNs, credit cards, API keys, passwords.",
      parameters: {
        type: "object",
        properties: {
          content: { type: "string", description: "The document text content to scan" },
          filename: { type: "string", description: "Optional filename for context" }
        },
        required: ["content"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "scan_for_malware",
      description: "Scan content for malicious patterns like script injection, phishing, ransomware indicators.",
      parameters: {
        type: "object",
        properties: {
          content: { type: "string", description: "The content to scan for malware" },
          filename: { type: "string", description: "Optional filename" }
        },
        required: ["content"]
      }
    }
  }
];

// Execute security tool calls
async function executeSecurityTool(name: string, args: any, supabase: any): Promise<any> {
  console.log(`Executing security tool: ${name}`, args);
  
  try {
    switch (name) {
      case "check_email_breach": {
        const { data, error } = await supabase.functions.invoke('dark-web-monitor', {
          body: { action: 'check_email', email: args.email }
        });
        if (error) throw error;
        return { 
          success: true, 
          email: args.email,
          breaches_found: data.breaches?.length || 0,
          leaked_credentials: data.leakedData?.length || 0,
          risk_level: data.risk_level,
          breaches: data.breaches?.slice(0, 5),
          sample_leaks: data.leakedData?.slice(0, 5)
        };
      }
      
      case "check_domain_breach": {
        const { data, error } = await supabase.functions.invoke('dark-web-monitor', {
          body: { action: 'check_domain', domain: args.domain }
        });
        if (error) throw error;
        return { 
          success: true,
          domain: args.domain,
          total_leaked: data.dehashedTotal || data.leakedData?.length || 0,
          risk_level: data.risk_level,
          sample_leaks: data.leakedData?.slice(0, 10)
        };
      }
      
      case "scan_url": {
        const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
          body: { 
            url: args.url, 
            options: { formats: ['markdown', 'links'], onlyMainContent: true } 
          }
        });
        if (error) throw error;
        return {
          success: true,
          url: args.url,
          title: data.data?.metadata?.title,
          status_code: data.data?.metadata?.statusCode,
          links_found: data.data?.links?.length || 0,
          content_preview: data.data?.markdown?.substring(0, 500)
        };
      }
      
      case "check_ip_reputation": {
        const { data, error } = await supabase.functions.invoke('ip-reputation', {
          body: { ip: args.ip }
        });
        if (error) throw error;
        return data;
      }
      
      case "scan_document_for_sensitive_data": {
        const { data, error } = await supabase.functions.invoke('document-scanner', {
          body: { content: args.content, filename: args.filename || 'document.txt' }
        });
        if (error) throw error;
        return data;
      }
      
      case "scan_for_malware": {
        const { data, error } = await supabase.functions.invoke('malware-scanner', {
          body: { content: args.content, filename: args.filename || 'file' }
        });
        if (error) throw error;
        return data;
      }
      
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (error) {
    console.error(`Tool ${name} error:`, error);
    return { error: error.message || 'Tool execution failed' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { messages, context, stream = false, agentId, userId, useTools = true, isFirstMessage = false } = await req.json();
    console.log('Vanguard AI Copilot - Processing request', { agentId, userId, hasContext: !!context, useTools, isFirstMessage });

    // Fetch real security data for context
    let securitySummary = '';
    let agentContext = '';
    let agentCommands: any[] = [];
    
    // Get user's actual security data
    if (userId) {
      // Recent threats
      const { data: recentThreats } = await supabase
        .from('security_incidents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      // Active alerts
      const { data: activeAlerts } = await supabase
        .from('security_alerts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);

      // Vulnerabilities
      const { data: vulnerabilities } = await supabase
        .from('safenet_vulnerabilities')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Compliance alerts
      const { data: complianceAlerts } = await supabase
        .from('compliance_alerts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'open')
        .limit(5);

      securitySummary = `
## LIVE SECURITY DATA FROM YOUR ENVIRONMENT

### Recent Security Incidents (${recentThreats?.length || 0} total)
${recentThreats?.length ? recentThreats.map(t => `- **${t.severity?.toUpperCase() || 'MEDIUM'}**: ${t.title || t.incident_type} - ${t.status} (${new Date(t.created_at).toLocaleDateString()})`).join('\n') : '✅ No recent incidents - looking good!'}

### Active Security Alerts (${activeAlerts?.length || 0} requiring attention)
${activeAlerts?.length ? activeAlerts.map(a => `- [${a.severity?.toUpperCase() || 'INFO'}] ${a.title || a.alert_type}: ${a.description?.substring(0, 100) || 'No details'}`).join('\n') : '✅ No active alerts'}

### Known Vulnerabilities (${vulnerabilities?.length || 0} detected)
${vulnerabilities?.length ? vulnerabilities.map(v => `- **${v.severity?.toUpperCase() || 'MEDIUM'}** (CVSS: ${v.cvss_score || 'N/A'}): ${v.title || v.cve_id || 'Unnamed'} - ${v.status || 'open'}`).join('\n') : '✅ No known vulnerabilities'}

### Compliance Status
${complianceAlerts?.length ? `⚠️ ${complianceAlerts.length} compliance issues need attention:\n${complianceAlerts.map(c => `- ${c.title}: ${c.description?.substring(0, 80) || 'Review required'}`).join('\n')}` : '✅ Compliance checks passing'}
`;
    }

    // If agentId is provided, fetch agent data and recent metrics
    if (agentId) {
      const { data: agent } = await supabase
        .from('vanguard_agents')
        .select('*')
        .eq('id', agentId)
        .single();
      
      if (agent) {
        const { data: metrics } = await supabase
          .from('vanguard_agent_metrics')
          .select('*')
          .eq('agent_id', agentId)
          .order('recorded_at', { ascending: false })
          .limit(5);
        
        const { data: networkAssets } = await supabase
          .from('network_assets')
          .select('*')
          .eq('user_id', agent.user_id)
          .order('last_seen', { ascending: false })
          .limit(20);

        const latestMetric = metrics?.[0];
        const onlineAssets = networkAssets?.filter(a => {
          const lastSeen = new Date(a.last_seen);
          return (Date.now() - lastSeen.getTime()) < 300000; // 5 min
        });

        agentContext = `
## YOUR VANGUARD AGENT STATUS
- **Agent Name**: ${agent.name}
- **Status**: ${agent.status === 'online' ? '🟢 ONLINE' : '🔴 OFFLINE'}
- **IP Address**: ${agent.ip_address}
- **Version**: ${agent.agent_version}
- **Last Heartbeat**: ${agent.last_heartbeat ? new Date(agent.last_heartbeat).toLocaleString() : 'Never'}

### Current System Health
${latestMetric ? `- CPU: ${latestMetric.cpu_percent?.toFixed(1)}% | Memory: ${latestMetric.memory_percent?.toFixed(1)}% | Disk: ${latestMetric.disk_percent?.toFixed(1)}%` : '- No metrics available yet'}

### Network Discovery (${networkAssets?.length || 0} devices found)
${networkAssets?.slice(0, 5).map(a => `- ${a.ip_address} (${a.hostname || 'unknown'}) - ${a.device_type || 'device'}`).join('\n') || 'No devices discovered yet'}
${networkAssets && networkAssets.length > 5 ? `... and ${networkAssets.length - 5} more devices` : ''}
`;

        agentCommands = [
          { name: 'scan_network', description: 'Scan the local network for hosts and services' },
          { name: 'scan_host', description: 'Scan a specific host for open ports and vulnerabilities' },
          { name: 'assess_vulnerabilities', description: 'Run vulnerability assessment with CVE lookup' },
          { name: 'get_system_info', description: 'Get detailed agent system information' },
        ];
      }
    }

    const systemPrompt = `You are Vanguard AI, the user's personal security advisor and operations copilot. You're friendly, conversational, and genuinely helpful - like talking to a knowledgeable security expert who's also a good friend.

## YOUR PERSONALITY
- Be warm and conversational - talk like a helpful colleague, not a robot
- Be proactive - notice issues in their data and bring them up naturally
- Ask clarifying questions when needed, like "Would you like me to dig deeper into that?"
- Use casual language: "Hey, I noticed...", "That's interesting, let me check...", "Good news!", "Heads up..."
- When you find issues, explain them clearly but don't be alarmist
- Celebrate wins: "Looking good!" when things are secure

## YOUR SECURITY TOOLS
You can perform REAL security operations:
1. **check_email_breach** - Check if an email has been exposed in data breaches
2. **check_domain_breach** - Scan a domain for leaked credentials
3. **scan_url** - Analyze URLs for phishing/malicious content
4. **check_ip_reputation** - Check if an IP is on blocklists or malicious
5. **scan_document_for_sensitive_data** - Find SSNs, credit cards, API keys in text
6. **scan_for_malware** - Detect malicious patterns in content

When using tools, explain what you're doing conversationally: "Let me check that email for you..." then share findings naturally.

${agentContext}

${securitySummary}

${agentId && agentCommands.length ? `
## AGENT COMMANDS YOU CAN RUN
${agentCommands.map(c => `- **${c.name}**: ${c.description}`).join('\n')}

When the user wants network operations, output:
\`\`\`vanguard-command
{
  "command_type": "command_name",
  "payload": { ... }
}
\`\`\`
` : ''}

${context ? `## ADDITIONAL CONTEXT\n${JSON.stringify(context)}` : ''}

## HOW TO RESPOND
${isFirstMessage ? `
This is the START of a new conversation. Greet the user warmly and:
1. If they have agents online, mention it positively
2. If there are any critical issues in their security data, mention the most important one
3. Ask what they'd like to focus on today
4. Keep it brief and friendly - 2-3 sentences max
` : `
Continue the conversation naturally. Be helpful, answer their question, and when appropriate ask follow-up questions to better help them.
`}

Remember: You're their trusted security partner. Be helpful, be real, be conversational.`;

    // If useTools is enabled, use tool calling for security operations
    if (useTools) {
      // First call with tools
      let response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          tools: securityTools,
          tool_choice: 'auto',
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: 'Payment required. Please add credits to continue.' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw new Error(`AI Gateway error: ${response.status}`);
      }

      let data = await response.json();
      let assistantMessage = data.choices?.[0]?.message;
      const conversationMessages = [
        { role: 'system', content: systemPrompt },
        ...messages
      ];

      // Handle tool calls iteratively
      let iterations = 0;
      const maxIterations = 5;
      const toolsUsed: string[] = [];

      while (assistantMessage?.tool_calls && iterations < maxIterations) {
        iterations++;
        console.log(`Processing ${assistantMessage.tool_calls.length} tool calls (iteration ${iterations})`);
        
        conversationMessages.push(assistantMessage);

        for (const toolCall of assistantMessage.tool_calls) {
          const args = JSON.parse(toolCall.function.arguments);
          toolsUsed.push(toolCall.function.name);
          const result = await executeSecurityTool(toolCall.function.name, args, supabase);
          
          conversationMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result, null, 2)
          });
        }

        response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: conversationMessages,
            tools: securityTools,
            tool_choice: 'auto',
          }),
        });

        if (!response.ok) {
          throw new Error(`AI Gateway error: ${response.status}`);
        }

        data = await response.json();
        assistantMessage = data.choices?.[0]?.message;
      }

      const content = assistantMessage?.content || 'I processed your request.';
      
      // Parse any agent commands from the response
      const commandMatch = content.match(/```vanguard-command\n([\s\S]*?)\n```/);
      let parsedCommand = null;
      if (commandMatch) {
        try {
          parsedCommand = JSON.parse(commandMatch[1]);
        } catch (e) {
          console.log('Could not parse command from response');
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          response: content,
          command: parsedCommand,
          tools_used: toolsUsed,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Non-tool mode (streaming or simple)
    if (stream) {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI Gateway error: ${response.status}`);
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    } else {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`AI Gateway error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || 'I apologize, but I was unable to generate a response.';

      const commandMatch = content.match(/```vanguard-command\n([\s\S]*?)\n```/);
      let parsedCommand = null;
      if (commandMatch) {
        try {
          parsedCommand = JSON.parse(commandMatch[1]);
        } catch (e) {
          console.log('Could not parse command from response');
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          response: content,
          command: parsedCommand,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in vanguard-ai-copilot:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
