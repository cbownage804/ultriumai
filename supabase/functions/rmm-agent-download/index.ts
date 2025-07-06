import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname;
    
    // Extract the installer type from the path
    const installerMatch = pathname.match(/\/(ultrium-rmm-agent-(windows|macos|linux)\.(msi|pkg|deb))$/);
    
    if (!installerMatch) {
      return new Response('Not Found', { status: 404, headers: corsHeaders });
    }

    const [, filename, platform, extension] = installerMatch;
    
    // Get agent configuration from query parameters
    const agentId = url.searchParams.get('agent_id');
    const clientId = url.searchParams.get('client_id');
    
    console.log(`Downloading agent installer: ${filename} for client: ${clientId}, agent: ${agentId}`);

    // For now, return a placeholder installer script/configuration
    // In a real implementation, you would generate actual installer files
    let content: string;
    let contentType: string;
    
    switch (platform) {
      case 'windows':
        content = generateWindowsInstaller(agentId, clientId);
        contentType = 'application/octet-stream';
        break;
      case 'macos':
        content = generateMacOSInstaller(agentId, clientId);
        contentType = 'application/octet-stream';
        break;
      case 'linux':
        content = generateLinuxInstaller(agentId, clientId);
        contentType = 'application/octet-stream';
        break;
      default:
        return new Response('Unsupported platform', { status: 400, headers: corsHeaders });
    }

    const response = new Response(content, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': content.length.toString(),
      },
    });

    return response;

  } catch (error) {
    console.error('Agent download error:', error);
    return new Response(
      JSON.stringify({ error: 'Download failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateWindowsInstaller(agentId: string | null, clientId: string | null): string {
  // Generate a PowerShell script that acts as the installer
  return `@echo off
REM Ultrium RMM Agent Installer for Windows
REM Generated: ${new Date().toISOString()}
REM Agent ID: ${agentId || 'AUTO_GENERATE'}
REM Client ID: ${clientId || 'UNKNOWN'}

echo Installing Ultrium RMM Agent...
echo Agent ID: ${agentId || 'AUTO_GENERATE'}
echo Client ID: ${clientId || 'UNKNOWN'}

REM Create agent directory
mkdir "C:\\Program Files\\Ultrium\\RMM Agent" 2>nul

REM Create configuration file
echo {> "C:\\Program Files\\Ultrium\\RMM Agent\\config.json"
echo   "agentId": "${agentId || 'AUTO_GENERATE'}",>> "C:\\Program Files\\Ultrium\\RMM Agent\\config.json"
echo   "clientId": "${clientId || 'UNKNOWN'}",>> "C:\\Program Files\\Ultrium\\RMM Agent\\config.json"
echo   "reportingEndpoint": "${Deno.env.get('SUPABASE_URL')}/functions/v1/rmm-agent",>> "C:\\Program Files\\Ultrium\\RMM Agent\\config.json"
echo   "syncInterval": 300,>> "C:\\Program Files\\Ultrium\\RMM Agent\\config.json"
echo   "autoDetectHostname": true>> "C:\\Program Files\\Ultrium\\RMM Agent\\config.json"
echo }>> "C:\\Program Files\\Ultrium\\RMM Agent\\config.json"

REM Install as Windows service (placeholder)
echo Installing RMM Agent service...
echo Service installation completed.

echo.
echo Ultrium RMM Agent installation completed!
echo The agent will start monitoring this system automatically.
echo.
pause`;
}

function generateMacOSInstaller(agentId: string | null, clientId: string | null): string {
  // Generate a shell script installer for macOS
  return `#!/bin/bash
# Ultrium RMM Agent Installer for macOS
# Generated: ${new Date().toISOString()}
# Agent ID: ${agentId || 'AUTO_GENERATE'}
# Client ID: ${clientId || 'UNKNOWN'}

echo "Installing Ultrium RMM Agent..."
echo "Agent ID: ${agentId || 'AUTO_GENERATE'}"
echo "Client ID: ${clientId || 'UNKNOWN'}"

# Create agent directory
sudo mkdir -p "/opt/ultrium/rmm-agent"

# Create configuration file
sudo cat > "/opt/ultrium/rmm-agent/config.json" << EOF
{
  "agentId": "${agentId || 'AUTO_GENERATE'}",
  "clientId": "${clientId || 'UNKNOWN'}",
  "reportingEndpoint": "${Deno.env.get('SUPABASE_URL')}/functions/v1/rmm-agent",
  "syncInterval": 300,
  "autoDetectHostname": true
}
EOF

# Create launch daemon (placeholder)
echo "Installing RMM Agent daemon..."
echo "Daemon installation completed."

echo ""
echo "Ultrium RMM Agent installation completed!"
echo "The agent will start monitoring this system automatically."
echo ""`;
}

function generateLinuxInstaller(agentId: string | null, clientId: string | null): string {
  // Generate a shell script installer for Linux
  return `#!/bin/bash
# Ultrium RMM Agent Installer for Linux
# Generated: ${new Date().toISOString()}
# Agent ID: ${agentId || 'AUTO_GENERATE'}
# Client ID: ${clientId || 'UNKNOWN'}

echo "Installing Ultrium RMM Agent..."
echo "Agent ID: ${agentId || 'AUTO_GENERATE'}"
echo "Client ID: ${clientId || 'UNKNOWN'}"

# Create agent directory
sudo mkdir -p "/opt/ultrium/rmm-agent"

# Create configuration file
sudo cat > "/opt/ultrium/rmm-agent/config.json" << EOF
{
  "agentId": "${agentId || 'AUTO_GENERATE'}",
  "clientId": "${clientId || 'UNKNOWN'}",
  "reportingEndpoint": "${Deno.env.get('SUPABASE_URL')}/functions/v1/rmm-agent",
  "syncInterval": 300,
  "autoDetectHostname": true
}
EOF

# Create systemd service (placeholder)
echo "Installing RMM Agent service..."
echo "Service installation completed."

echo ""
echo "Ultrium RMM Agent installation completed!"
echo "The agent will start monitoring this system automatically."
echo ""`;
}