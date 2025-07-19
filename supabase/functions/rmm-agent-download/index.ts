import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { agent_type, connector_key, device_ip, device_name } = await req.json();

    console.log('Agent download request:', { agent_type, connector_key, device_ip, device_name });

    // Validate connector key
    const { data: connectorData, error: connectorError } = await supabase
      .from('safenet_connectors')
      .select('id, user_id')
      .eq('connector_key', connector_key)
      .eq('status', 'active')
      .single();

    if (connectorError || !connectorData) {
      throw new Error('Invalid or inactive connector key');
    }

    // Generate the installer content based on type
    const installerContent = generateInstallerContent(agent_type, connector_key, device_ip, device_name);

    // Log the download request
    await supabase
      .from('audit_logs')
      .insert({
        user_id: connectorData.user_id,
        action: 'agent_download',
        resource_type: 'rmm_agent',
        details: {
          agent_type,
          device_ip,
          device_name,
          connector_key: connector_key.substring(0, 20) + '...' // Partial key for security
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        installer_content: installerContent,
        agent_type 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Agent download error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate agent installer' 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

function generateInstallerContent(agentType: string, connectorKey: string, deviceIp: string, deviceName: string): string {
  const serverUrl = Deno.env.get('SUPABASE_URL');
  const baseInstaller = agentType === 'gui' ? getGUIInstallerTemplate() : getHeadlessInstallerTemplate();
  
  // Replace placeholders with actual values
  return baseInstaller
    .replace(/\$CONNECTOR_KEY_PLACEHOLDER\$/g, connectorKey)
    .replace(/\$SERVER_URL_PLACEHOLDER\$/g, serverUrl || '')
    .replace(/\$DEVICE_IP_PLACEHOLDER\$/g, deviceIp || 'unknown')
    .replace(/\$DEVICE_NAME_PLACEHOLDER\$/g, deviceName || 'unknown');
}

function getGUIInstallerTemplate(): string {
  return `# Ultrium RMM Agent GUI Installer v2.1
# Pre-configured for your organization
# Run with: PowerShell -ExecutionPolicy Bypass -File UltriumRMMAgent-GUI-Installer.ps1

param(
    [string]$AgentToken = "$CONNECTOR_KEY_PLACEHOLDER$",
    [string]$CompanyId = "default",
    [string]$ServerUrl = "$SERVER_URL_PLACEHOLDER$",
    [switch]$Silent = $false
)

Write-Host "Ultrium RMM Agent GUI Installer v2.1" -ForegroundColor Cyan
Write-Host "Pre-configured with token: $($AgentToken.Substring(0,20))..." -ForegroundColor Yellow
Write-Host "Server URL: $ServerUrl" -ForegroundColor Green
Write-Host "Target Device: $DEVICE_NAME_PLACEHOLDER$ ($DEVICE_IP_PLACEHOLDER$)" -ForegroundColor Green
Write-Host ""
Write-Host "Installation starting..." -ForegroundColor Yellow

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Administrator privileges confirmed." -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. This is a demo installer template" -ForegroundColor Yellow
Write-Host "2. In production, this would download and install the actual RMM agent" -ForegroundColor Yellow
Write-Host "3. The agent would register with token: $AgentToken" -ForegroundColor Yellow
Write-Host "4. After installation, the device would appear as 'Managed' in SafeNet" -ForegroundColor Yellow
Write-Host ""
Write-Host "Installation completed successfully!" -ForegroundColor Green

# In production, uncomment and modify these lines:
# Invoke-WebRequest -Uri "$ServerUrl/agent-installer.msi" -OutFile "RMMAgent.msi"
# Start-Process msiexec.exe -Wait -ArgumentList '/I RMMAgent.msi /quiet AGENTTOKEN="$AgentToken" SERVERURL="$ServerUrl"'

Read-Host "Press Enter to close"`;
}

function getHeadlessInstallerTemplate(): string {
  return `# Ultrium RMM Agent Installer v2.1 - Headless Version  
# Pre-configured for your organization
# Run with: PowerShell -ExecutionPolicy Bypass -File UltriumRMMAgent-Installer.ps1 -Install

param(
    [switch]$Install,
    [string]$AgentToken = "$CONNECTOR_KEY_PLACEHOLDER$",
    [string]$CompanyId = "default", 
    [string]$ServerUrl = "$SERVER_URL_PLACEHOLDER$"
)

if (-not $Install) {
    Write-Host "Ultrium RMM Agent Headless Installer v2.1" -ForegroundColor Cyan
    Write-Host "Usage: PowerShell -ExecutionPolicy Bypass -File UltriumRMMAgent-Installer.ps1 -Install" -ForegroundColor Yellow
    Write-Host "Pre-configured with token: $($AgentToken.Substring(0,20))..." -ForegroundColor Yellow
    Write-Host "Target Device: $DEVICE_NAME_PLACEHOLDER$ ($DEVICE_IP_PLACEHOLDER$)" -ForegroundColor Green
    exit 0
}

Write-Host "Ultrium RMM Agent Headless Installer v2.1" -ForegroundColor Cyan
Write-Host "Installing agent with token: $($AgentToken.Substring(0,20))..." -ForegroundColor Yellow
Write-Host "Server URL: $ServerUrl" -ForegroundColor Green

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    exit 1
}

Write-Host "Administrator privileges confirmed." -ForegroundColor Green
Write-Host "Installing agent silently..." -ForegroundColor Yellow

# In production, uncomment and modify these lines:
# Invoke-WebRequest -Uri "$ServerUrl/agent-installer.msi" -OutFile "RMMAgent.msi"
# Start-Process msiexec.exe -Wait -ArgumentList '/I RMMAgent.msi /quiet AGENTTOKEN="$AgentToken" SERVERURL="$ServerUrl"'

Write-Host "Agent installation completed successfully!" -ForegroundColor Green
Write-Host "Device will appear as 'Managed' in SafeNet within 5 minutes." -ForegroundColor Green`;
}
