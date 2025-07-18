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

# Installation script content truncated for brevity
# Full installation script would be included here
Write-Host "Ultrium RMM Agent GUI Installer v2.1" -ForegroundColor Cyan
Write-Host "Pre-configured with token: $($AgentToken.Substring(0,20))..." -ForegroundColor Yellow
Write-Host "Run this installer as Administrator on the target device." -ForegroundColor Green`;
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

# Installation script content truncated for brevity
# Full installation script would be included here
Write-Host "Ultrium RMM Agent Headless Installer v2.1" -ForegroundColor Cyan
Write-Host "Pre-configured with token: $($AgentToken.Substring(0,20))..." -ForegroundColor Yellow
Write-Host "Run with -Install parameter as Administrator on the target device." -ForegroundColor Green`;
}
