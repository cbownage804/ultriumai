import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
    const { messages, context, stream = false, agentId } = await req.json();
    console.log('Vanguard AI Copilot - Processing request', { agentId, hasContext: !!context });

    // If agentId is provided, fetch agent data and recent metrics
    let agentContext = '';
    let agentCommands: any[] = [];
    
    if (agentId) {
      // Get agent details
      const { data: agent } = await supabase
        .from('vanguard_agents')
        .select('*')
        .eq('id', agentId)
        .single();
      
      if (agent) {
        // Get recent metrics
        const { data: metrics } = await supabase
          .from('vanguard_agent_metrics')
          .select('*')
          .eq('agent_id', agentId)
          .order('recorded_at', { ascending: false })
          .limit(10);
        
        // Get recent scan results from network_assets
        const { data: networkAssets } = await supabase
          .from('network_assets')
          .select('*')
          .eq('user_id', agent.user_id)
          .order('last_seen', { ascending: false })
          .limit(50);
        
        // Get recent commands
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
          { name: 'scan_network', description: 'Scan the local network for hosts and services', params: { target: 'optional CIDR' } },
          { name: 'scan_host', description: 'Scan a specific host for open ports', params: { target: 'required IP', ports: 'optional range' } },
          { name: 'assess_vulnerabilities', description: 'Run vulnerability assessment with CVE lookup', params: { target: 'optional CIDR' } },
          { name: 'run_exploits', description: 'Run safe exploitation tests on a host', params: { target: 'required IP' } },
          { name: 'get_system_info', description: 'Get agent system information', params: {} },
          { name: 'get_metrics', description: 'Get current system metrics', params: {} },
          { name: 'run_command', description: 'Execute a shell command on the agent', params: { command: 'required shell command' } },
        ];
      }
    }

    const systemPrompt = `You are Vanguard AI Copilot, an expert security operations assistant integrated into the Ultrium Vanguard platform.

You have DIRECT ACCESS to a security agent running on the user's network. You can command this agent to perform real security operations.

## Your Capabilities
- **Network Scanning**: Discover hosts, scan ports, detect services
- **Vulnerability Assessment**: Look up CVEs, assess security risks
- **Exploitation Testing**: Run safe (non-destructive) exploit checks
- **Command Execution**: Run shell commands on the agent
- **Real-time Monitoring**: Access system metrics and health data

## Agent Commands You Can Issue
${agentCommands.length > 0 ? agentCommands.map(c => `- **${c.name}**: ${c.description}`).join('\n') : 'No agent connected - general security advice only'}

${agentContext}

## How to Issue Commands
When the user asks you to perform a security operation, respond with a JSON command block that the frontend will parse and send to the agent:

\`\`\`vanguard-command
{
  "command_type": "scan_network",
  "payload": { "target": "192.168.1.0/24" }
}
\`\`\`

## Guidelines
- Be proactive about security - suggest scans and assessments
- Explain findings in business terms, not just technical jargon
- Prioritize critical vulnerabilities and provide actionable remediation
- When you discover issues, recommend specific next steps
- If the agent is offline, explain what operations would be available when online
- Always provide context about WHY something is a security risk

## Additional Context
${context ? JSON.stringify(context) : 'No additional context provided.'}`;

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

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || 'I apologize, but I was unable to generate a response.';

      // Parse any commands from the response
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
