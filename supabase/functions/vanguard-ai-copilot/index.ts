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
    const { messages, context, stream = false, agentId, useTools = true } = await req.json();
    console.log('Vanguard AI Copilot - Processing request', { agentId, hasContext: !!context, useTools });

    // If agentId is provided, fetch agent data and recent metrics
    let agentContext = '';
    let agentCommands: any[] = [];
    
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
          .limit(10);
        
        const { data: networkAssets } = await supabase
          .from('network_assets')
          .select('*')
          .eq('user_id', agent.user_id)
          .order('last_seen', { ascending: false })
          .limit(50);
        
        const { data: commands } = await supabase
          .from('vanguard_agent_commands')
          .select('*')
          .eq('agent_id', agentId)
          .order('created_at', { ascending: false })
          .limit(10);

        agentContext = `
## Current Agent Status
- Name: ${agent.name}
- Device ID: ${agent.device_id}
- Status: ${agent.status}
- IP Address: ${agent.ip_address}
- Location: ${agent.location || 'Not set'}
- Agent Version: ${agent.agent_version}
- Last Heartbeat: ${agent.last_heartbeat}

## Recent Metrics (Last 10 readings)
${metrics?.map(m => `- CPU: ${m.cpu_percent}%, Memory: ${m.memory_percent}%, Disk: ${m.disk_percent}% @ ${m.recorded_at}`).join('\n') || 'No metrics available'}

## Network Assets Discovered (${networkAssets?.length || 0} devices)
${networkAssets?.slice(0, 10).map(a => `- ${a.ip_address} (${a.hostname || 'unknown'}) - ${a.device_type || 'unknown'} - Ports: ${a.open_ports?.join(', ') || 'none'}`).join('\n') || 'No assets discovered'}

## Recent Commands
${commands?.map(c => `- ${c.command_type}: ${c.status} @ ${c.created_at}`).join('\n') || 'No recent commands'}
`;

        agentCommands = [
          { name: 'scan_network', description: 'Scan the local network for hosts and services' },
          { name: 'scan_host', description: 'Scan a specific host for open ports' },
          { name: 'assess_vulnerabilities', description: 'Run vulnerability assessment with CVE lookup' },
          { name: 'run_exploits', description: 'Run safe exploitation tests on a host' },
          { name: 'get_system_info', description: 'Get agent system information' },
          { name: 'get_metrics', description: 'Get current system metrics' },
        ];
      }
    }

    const systemPrompt = `You are Vanguard AI, an advanced security operations copilot for the Ultrium Vanguard platform. You are THE differentiating feature - a conversational AI that can perform real security operations.

## Your Security Tool Capabilities
You have access to powerful security tools that you can invoke automatically:

1. **check_email_breach** - Check if any email has been exposed in data breaches. Shows leaked passwords, credentials.
2. **check_domain_breach** - Scan an entire domain for leaked credentials across all employees.
3. **scan_url** - Analyze any URL for phishing indicators, malicious content, and extract intelligence.
4. **check_ip_reputation** - Check if an IP is malicious, on blocklists, or associated with threats.
5. **scan_document_for_sensitive_data** - Find SSNs, credit cards, API keys, passwords in documents.
6. **scan_for_malware** - Detect malicious scripts, phishing, ransomware patterns in files.

## How You Work
When a user asks about security topics or requests scans:
- Use the appropriate tool to get REAL data
- Explain findings clearly with actionable recommendations
- Be proactive - if you find issues, emphasize their severity
- Provide specific remediation steps

${agentId ? `
## Agent Commands (for network operations)
${agentCommands.map(c => `- **${c.name}**: ${c.description}`).join('\n')}

When the user asks for network operations, respond with:
\`\`\`vanguard-command
{
  "command_type": "command_name",
  "payload": { ... }
}
\`\`\`
` : ''}

${agentContext}

## Additional Context
${context ? JSON.stringify(context) : 'No additional context provided.'}

## Guidelines
- Be conversational but professional
- When you use a tool, explain what you're doing and what you found
- Prioritize critical security issues
- Give specific, actionable advice
- You are the user's trusted security advisor`;

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
