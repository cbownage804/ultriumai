/**
 * Generate a PowerShell installer script that downloads and runs the MSI
 * with auto-provisioning token for true 1-click deployment.
 */

import { supabase } from '@/integrations/supabase/client';

interface MsiInstallerOptions {
  clientId?: string;
  clientName?: string;
  enableTray?: boolean;
  maxUses?: number;
  expiresInDays?: number;
}

interface ProvisioningTokenResponse {
  token: string;
  expires_at: string;
  max_uses: number;
}

// MSI download URL from Supabase Storage
const MSI_DOWNLOAD_URL = 'https://nsyobmjpdpvesjwdphlh.supabase.co/storage/v1/object/public/vanguard-agents/VanguardAgent.msi';
const PROVISION_ENDPOINT = 'https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/agent-provision';

/**
 * Create a provisioning token via the edge function
 */
export async function createProvisioningToken(options: MsiInstallerOptions): Promise<ProvisioningTokenResponse | null> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    console.error('[createProvisioningToken] No active session');
    return null;
  }

  try {
    const response = await fetch(`${PROVISION_ENDPOINT}?action=create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        client_id: options.clientId,
        client_name: options.clientName,
        enable_tray: options.enableTray ?? true,
        max_uses: options.maxUses ?? 1,
        expires_in_days: options.expiresInDays ?? 7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create provisioning token');
    }

    return await response.json();
  } catch (err: unknown) {
    console.error('[createProvisioningToken] Error:', err);
    return null;
  }
}

/**
 * Generate a PowerShell script with embedded provisioning token
 * The agent will call the provision endpoint to get full credentials on first run
 */
export function generateMsiInstallerScript(provisioningToken: string, clientName?: string): string {
  const escapedClientName = clientName || 'Vanguard Device';
  
  const lines = [
    '#Requires -RunAsAdministrator',
    '# =============================================================================',
    '# Ultrium Vanguard Agent - 1-Click Installer',
    `# Pre-configured for: ${escapedClientName}`,
    '# =============================================================================',
    '',
    '$ErrorActionPreference = "Stop"',
    '$ProgressPreference = "SilentlyContinue"',
    '',
    '# Provisioning token (auto-generated, valid for 7 days)',
    `$PROVISION_TOKEN = "${provisioningToken}"`,
    `$MSI_URL = "${MSI_DOWNLOAD_URL}"`,
    `$PROVISION_URL = "${PROVISION_ENDPOINT}"`,
    '',
    'function Write-Banner {',
    '    Write-Host ""',
    '    Write-Host "  VANGUARD AGENT INSTALLER" -ForegroundColor Cyan',
    '    Write-Host "  Enterprise RMM + XDR Agent" -ForegroundColor White',
    `    Write-Host "  Customer: ${escapedClientName}" -ForegroundColor Yellow`,
    '    Write-Host ""',
    '}',
    '',
    'function Get-Credentials {',
    '    Write-Host "[1/4] Fetching provisioning credentials..." -ForegroundColor Yellow',
    '    ',
    '    try {',
    '        $body = @{ token = $PROVISION_TOKEN; device_id = $env:COMPUTERNAME } | ConvertTo-Json',
    '        $response = Invoke-RestMethod -Uri "$PROVISION_URL`?action=redeem" -Method POST -Body $body -ContentType "application/json"',
    '        ',
    '        if ($response.secret_key) {',
    '            Write-Host "   Credentials received successfully" -ForegroundColor Green',
    '            return $response',
    '        }',
    '    }',
    '    catch {',
    '        $errorMsg = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue',
    '        if ($errorMsg.error) {',
    '            Write-Host "   Error: $($errorMsg.error)" -ForegroundColor Red',
    '        } else {',
    '            Write-Host "   Error: $_" -ForegroundColor Red',
    '        }',
    '    }',
    '    return $null',
    '}',
    '',
    'function Download-Msi {',
    '    param([string]$Destination)',
    '    ',
    '    Write-Host "[2/4] Downloading Vanguard Agent MSI..." -ForegroundColor Yellow',
    '    ',
    '    try {',
    '        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12',
    '        $webClient = New-Object System.Net.WebClient',
    '        $webClient.DownloadFile($MSI_URL, $Destination)',
    '        ',
    '        if (Test-Path $Destination) {',
    '            $size = (Get-Item $Destination).Length / 1MB',
    '            Write-Host "   Downloaded: $([math]::Round($size, 1)) MB" -ForegroundColor Green',
    '            return $true',
    '        }',
    '    }',
    '    catch {',
    '        Write-Host "   Download failed: $_" -ForegroundColor Red',
    '    }',
    '    return $false',
    '}',
    '',
    'function Install-Agent {',
    '    param([string]$MsiPath, $Creds)',
    '    ',
    '    Write-Host "[3/4] Installing Vanguard Agent..." -ForegroundColor Yellow',
    '    ',
    '    $enableTray = if ($Creds.enable_tray) { "1" } else { "0" }',
    '    $msiArgs = "/i `"$MsiPath`" /qn /norestart USERID=`"$($Creds.user_id)`" SECRETKEY=`"$($Creds.secret_key)`" ENABLETRAY=`"$enableTray`""',
    '    ',
    '    if ($Creds.client_id) {',
    '        $msiArgs += " CLIENTID=`"$($Creds.client_id)`""',
    '    }',
    '    ',
    '    $process = Start-Process -FilePath "msiexec.exe" -ArgumentList $msiArgs -Wait -PassThru',
    '    ',
    '    if ($process.ExitCode -eq 0 -or $process.ExitCode -eq 3010) {',
    '        Write-Host "   Installation successful!" -ForegroundColor Green',
    '        return $true',
    '    }',
    '    else {',
    '        Write-Host "   Installation failed (exit code: $($process.ExitCode))" -ForegroundColor Red',
    '        return $false',
    '    }',
    '}',
    '',
    'function Verify-Installation {',
    '    Write-Host "[4/4] Verifying installation..." -ForegroundColor Yellow',
    '    Start-Sleep -Seconds 3',
    '    ',
    '    $service = Get-Service -Name "VanguardAgent" -ErrorAction SilentlyContinue',
    '    if ($service -and $service.Status -eq "Running") {',
    '        Write-Host "   Service running!" -ForegroundColor Green',
    '        return $true',
    '    }',
    '    elseif ($service) {',
    '        Write-Host "   Service installed (Status: $($service.Status))" -ForegroundColor Yellow',
    '        return $true',
    '    }',
    '    Write-Host "   Service not found" -ForegroundColor Red',
    '    return $false',
    '}',
    '',
    '# =============================================================================',
    '# Main',
    '# =============================================================================',
    '',
    'Write-Banner',
    '',
    '# Get credentials from provisioning token',
    '$creds = Get-Credentials',
    'if (-not $creds) {',
    '    Write-Host ""',
    '    Write-Host "ERROR: Failed to provision agent. Token may be expired or already used." -ForegroundColor Red',
    '    Write-Host "Please download a new installer from your Vanguard dashboard." -ForegroundColor Yellow',
    '    exit 1',
    '}',
    '',
    '# Download MSI',
    '$tempDir = Join-Path $env:TEMP "VanguardInstall-$(Get-Random)"',
    'New-Item -ItemType Directory -Path $tempDir -Force | Out-Null',
    '$msiPath = Join-Path $tempDir "VanguardAgent.msi"',
    '',
    'try {',
    '    if (-not (Download-Msi -Destination $msiPath)) {',
    '        throw "MSI download failed"',
    '    }',
    '    ',
    '    if (-not (Install-Agent -MsiPath $msiPath -Creds $creds)) {',
    '        throw "Installation failed"',
    '    }',
    '    ',
    '    $verified = Verify-Installation',
    '    ',
    '    Write-Host ""',
    '    if ($verified) {',
    '        Write-Host "============================================" -ForegroundColor Green',
    '        Write-Host "  Installation Complete!" -ForegroundColor Green',
    '        Write-Host "============================================" -ForegroundColor Green',
    '        Write-Host ""',
    '        Write-Host "  Dashboard: https://ultriumai.com/vanguard" -ForegroundColor Cyan',
    '    }',
    '}',
    'catch {',
    '    Write-Host ""',
    '    Write-Host "ERROR: $_" -ForegroundColor Red',
    '    exit 1',
    '}',
    'finally {',
    '    if (Test-Path $tempDir) {',
    '        Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue',
    '    }',
    '}',
  ];

  return lines.join('\n');
}

/**
 * Generate installer script as a downloadable blob
 */
export function generateMsiInstallerBlob(provisioningToken: string, clientName?: string): Blob {
  const script = generateMsiInstallerScript(provisioningToken, clientName);
  return new Blob([script], { type: 'application/octet-stream' });
}

/**
 * Generate a simple one-liner for copy-paste deployment
 */
export function generateMsiOneLiner(provisioningToken: string): string {
  return `# Run in elevated PowerShell (token valid for 7 days, single use):
irm "https://ultriumai.com/install.ps1?token=${provisioningToken}" | iex`;
}

/**
 * Full flow: Create token + generate installer
 */
export async function generateOneClickInstaller(options: MsiInstallerOptions): Promise<{
  blob: Blob;
  token: string;
  expiresAt: string;
} | null> {
  // Create provisioning token
  const tokenResponse = await createProvisioningToken(options);
  
  if (!tokenResponse) {
    return null;
  }

  // Generate installer with embedded token
  const blob = generateMsiInstallerBlob(tokenResponse.token, options.clientName);

  return {
    blob,
    token: tokenResponse.token,
    expiresAt: tokenResponse.expires_at,
  };
}
