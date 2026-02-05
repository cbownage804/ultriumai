/**
 * Generate a professional EXE installer package for Vanguard Agent
 * Downloads the stub EXE and bundles it with a config file
 */

import JSZip from 'jszip';
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

// Download URLs from Supabase Storage
const MSI_DOWNLOAD_URL = 'https://nsyobmjpdpvesjwdphlh.supabase.co/storage/v1/object/public/vanguard-agents/VanguardAgent.msi';
const INSTALLER_EXE_URL = 'https://nsyobmjpdpvesjwdphlh.supabase.co/storage/v1/object/public/vanguard-agents/VanguardInstaller.exe';
const PROVISION_ENDPOINT = 'https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/agent-provision';

/**
 * PowerShell's -EncodedCommand expects Base64 of UTF-16LE ("Unicode"), not UTF-8.
 */
function toPowerShellEncodedCommandBase64(script: string): string {
  const bytes = new Uint8Array(script.length * 2);
  for (let i = 0; i < script.length; i++) {
    const code = script.charCodeAt(i);
    bytes[i * 2] = code & 0xff;
    bytes[i * 2 + 1] = code >> 8;
  }

  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function chunkString(str: string, size: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += size) chunks.push(str.slice(i, i + size));
  return chunks;
}

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
 * Generate a self-elevating CMD/BAT installer with embedded PowerShell
 * This provides a true "double-click to install" experience like Datto/Atera
 */
export function generateCmdInstaller(provisioningToken: string, clientName?: string, enableTray?: boolean): string {
  const escapedClientName = (clientName || 'Vanguard Device').replace(/'/g, "''").replace(/&/g, '^&');
  const trayFlag = enableTray ? '1' : '0';
  
  // Build the PowerShell script as an array of lines
  const psLines = [
    '$ErrorActionPreference = "Stop"',
    '$ProgressPreference = "SilentlyContinue"',
    '',
    `$token = "${provisioningToken}"`,
    `$msiUrl = "${MSI_DOWNLOAD_URL}"`,
    `$provisionUrl = "${PROVISION_ENDPOINT}"`,
    `$enableTray = "${trayFlag}"`,
    '',
    'Write-Host ""',
    'Write-Host "  VANGUARD AGENT INSTALLER" -ForegroundColor Cyan',
    'Write-Host "  Enterprise RMM + XDR Agent" -ForegroundColor White',
    `Write-Host "  Customer: ${escapedClientName}" -ForegroundColor Yellow`,
    'Write-Host ""',
    '',
    'Write-Host "[1/4] Fetching credentials..." -ForegroundColor Yellow',
    'try {',
    '    $body = @{ token = $token; device_id = $env:COMPUTERNAME } | ConvertTo-Json',
    '    $creds = Invoke-RestMethod -Uri "$provisionUrl`?action=redeem" -Method POST -Body $body -ContentType "application/json"',
    '    if (-not $creds.secret_key) { throw "No credentials returned" }',
    '    Write-Host "   OK" -ForegroundColor Green',
    '} catch {',
    '    Write-Host "   Failed: $($_.Exception.Message)" -ForegroundColor Red',
    '    Write-Host ""',
    '    Write-Host "Token may be expired. Download a new installer from your dashboard." -ForegroundColor Yellow',
    '    Read-Host "Press Enter to exit"',
    '    exit 1',
    '}',
    '',
    'Write-Host "[2/4] Downloading MSI..." -ForegroundColor Yellow',
    '$tempDir = Join-Path $env:TEMP ("VanguardInstall-" + (Get-Random))',
    'New-Item -ItemType Directory -Path $tempDir -Force | Out-Null',
    '$msiPath = Join-Path $tempDir "VanguardAgent.msi"',
    'try {',
    '    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12',
    '    $wc = New-Object System.Net.WebClient',
    '    $wc.DownloadFile($msiUrl, $msiPath)',
    '    $size = [math]::Round((Get-Item $msiPath).Length / 1MB, 1)',
    '    Write-Host "   Downloaded: $size MB" -ForegroundColor Green',
    '} catch {',
    '    Write-Host "   Failed: $($_.Exception.Message)" -ForegroundColor Red',
    '    Read-Host "Press Enter to exit"',
    '    exit 1',
    '}',
    '',
    'Write-Host "[3/4] Installing..." -ForegroundColor Yellow',
    '# Note: ENABLETRAY must be passed without quotes for WiX condition to work',
    '$msiArgs = "/i `"$msiPath`" /qn /norestart USERID=`"$($creds.user_id)`" SECRETKEY=`"$($creds.secret_key)`" ENABLETRAY=$enableTray"',
    'if ($creds.client_id) { $msiArgs += " CLIENTID=`"$($creds.client_id)`"" }',
    '$proc = Start-Process msiexec.exe -ArgumentList $msiArgs -Wait -PassThru',
    'if ($proc.ExitCode -eq 0 -or $proc.ExitCode -eq 3010) {',
    '    Write-Host "   OK" -ForegroundColor Green',
    '} else {',
    '    Write-Host "   Failed (exit code: $($proc.ExitCode))" -ForegroundColor Red',
    '    Read-Host "Press Enter to exit"',
    '    exit 1',
    '}',
    '',
    'Write-Host "[4/4] Verifying..." -ForegroundColor Yellow',
    'Start-Sleep -Seconds 3',
    '$svc = Get-Service -Name "VanguardAgent" -ErrorAction SilentlyContinue',
    'if ($svc -and $svc.Status -eq "Running") {',
    '    Write-Host "   Service running!" -ForegroundColor Green',
    '} elseif ($svc) {',
    '    Write-Host "   Service installed (status: $($svc.Status))" -ForegroundColor Yellow',
    '} else {',
    '    Write-Host "   Service not found" -ForegroundColor Red',
    '}',
    '',
    '# Launch tray app if enabled',
    'if ($enableTray -eq "1") {',
    '    Write-Host ""',
    '    Write-Host "Starting Vanguard Portal tray app..." -ForegroundColor Yellow',
    '    # Debug: Check what the service binary path is',
    '    $svcBin = (Get-WmiObject Win32_Service -Filter "Name=\'VanguardAgent\'" -ErrorAction SilentlyContinue).PathName',
    '    if ($svcBin) {',
    '        Write-Host "   Service binary: $svcBin" -ForegroundColor Cyan',
    '        # Extract directory from service path (remove quotes and args)',
    '        $svcExe = $svcBin -replace \'"\', \'\' -replace \' --.*$\', \'\'',
    '        if (Test-Path $svcExe) {',
    '            Write-Host "   Launching from service path..." -ForegroundColor Green',
    '            Start-Process -FilePath $svcExe -WindowStyle Hidden',
    '            Write-Host "   Tray app launched! Check your system tray." -ForegroundColor Green',
    '        } else {',
    '            Write-Host "   Service exe not found at extracted path: $svcExe" -ForegroundColor Yellow',
    '        }',
    '    } else {',
    '        Write-Host "   Could not get service binary path" -ForegroundColor Yellow',
    '        # Fallback: Check standard locations',
    '        $installDir = "C:\\Program Files\\Vanguard"',
    '        if (Test-Path $installDir) {',
    '            Write-Host "   Install dir contents:" -ForegroundColor Cyan',
    '            Get-ChildItem $installDir | ForEach-Object { Write-Host "     - $($_.Name)" -ForegroundColor Gray }',
    '        } else {',
    '            Write-Host "   Install directory not found: $installDir" -ForegroundColor Red',
    '        }',
    '    }',
    '}',
    '',
    'Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue',
    '',
    'Write-Host ""',
    'Write-Host "============================================" -ForegroundColor Green',
    'Write-Host "  Installation Complete!" -ForegroundColor Green',
    'Write-Host "============================================" -ForegroundColor Green',
    'Write-Host ""',
    'Write-Host "  Dashboard: https://ultriumai.com/vanguard" -ForegroundColor Cyan',
    'if ($enableTray -eq "1") {',
    '    Write-Host "  Tray: Look for Vanguard icon in system tray" -ForegroundColor Cyan',
    '}',
    'Write-Host ""',
    'Read-Host "Press Enter to close"',
  ];
  
  // Convert to Base64 encoded PowerShell command for reliability
  const psScript = psLines.join('\r\n');
  const base64Script = toPowerShellEncodedCommandBase64(psScript);
  // Keep each echo line comfortably under cmd.exe's per-line limit
  const base64Chunks = chunkString(base64Script, 700);
  
  // CMD wrapper that self-elevates and runs Base64-encoded PowerShell
  const cmdScript = `@echo off
:: =============================================================================
:: Ultrium Vanguard Agent - 1-Click Installer
:: Pre-configured for: ${escapedClientName}
:: Just double-click to install - no configuration needed!
:: =============================================================================

title Ultrium Vanguard Agent Installer

:: Check for admin rights and self-elevate if needed
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Requesting administrator privileges...
    powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

:: Write Base64 payload to a temp file (avoids command-length limits)
set "B64FILE=%TEMP%\\VanguardInstall-%RANDOM%.b64"
> "%B64FILE%" (
${base64Chunks.map((c) => `  echo ${c}`).join('\r\n')}
)

:: Decode + execute inside PowerShell
powershell -NoProfile -ExecutionPolicy Bypass -Command "$b64=Get-Content -Raw '%B64FILE%'; $bytes=[Convert]::FromBase64String($b64); $script=[Text.Encoding]::Unicode.GetString($bytes); try { iex $script } catch { Write-Host $_ -ForegroundColor Red; exit 1 }"
set "PS_EXIT=%errorlevel%"
del "%B64FILE%" >nul 2>&1

:: If PowerShell failed before it could prompt, keep the window open.
if not "%PS_EXIT%"=="0" (
    echo.
    echo Installer failed (exit code: %PS_EXIT%).
    pause
    exit /b %PS_EXIT%
)
`;

  return cmdScript;
}

/**
 * Generate installer as a downloadable blob (CMD format)
 */
export function generateMsiInstallerBlob(provisioningToken: string, clientName?: string, enableTray?: boolean): Blob {
  const script = generateCmdInstaller(provisioningToken, clientName, enableTray);
  return new Blob([script], { type: 'application/x-msdos-program' });
}

/**
 * Legacy: Generate PowerShell script (for advanced users)
 */
export function generateMsiInstallerScript(provisioningToken: string, clientName?: string): string {
  const escapedClientName = clientName || 'Vanguard Device';
  
  const lines = [
    '#Requires -RunAsAdministrator',
    '# Ultrium Vanguard Agent - PowerShell Installer',
    `# Pre-configured for: ${escapedClientName}`,
    '',
    '$ErrorActionPreference = "Stop"',
    `$token = "${provisioningToken}"`,
    `$msiUrl = "${MSI_DOWNLOAD_URL}"`,
    `$provisionUrl = "${PROVISION_ENDPOINT}"`,
    '',
    'Write-Host "Fetching credentials..." -ForegroundColor Yellow',
    '$body = @{ token = $token; device_id = $env:COMPUTERNAME } | ConvertTo-Json',
    '$creds = Invoke-RestMethod -Uri "$provisionUrl?action=redeem" -Method POST -Body $body -ContentType "application/json"',
    '',
    'Write-Host "Downloading MSI..." -ForegroundColor Yellow',
    '$msiPath = Join-Path $env:TEMP "VanguardAgent.msi"',
    '[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12',
    '(New-Object System.Net.WebClient).DownloadFile($msiUrl, $msiPath)',
    '',
    'Write-Host "Installing..." -ForegroundColor Yellow',
    '$enableTray = if ($creds.enable_tray) { "1" } else { "0" }',
    '# Note: ENABLETRAY must be passed without quotes for WiX condition to work',
    '$msiArgs = "/i `"$msiPath`" /qn /norestart USERID=`"$($creds.user_id)`" SECRETKEY=`"$($creds.secret_key)`" ENABLETRAY=$enableTray"',
    'if ($creds.client_id) { $msiArgs += " CLIENTID=`"$($creds.client_id)`"" }',
    'Start-Process msiexec.exe -ArgumentList $msiArgs -Wait',
    '',
    'Write-Host "Done! Service should be running." -ForegroundColor Green',
  ];
  
  return lines.join('\n');
}

/**
 * Generate a simple one-liner for copy-paste deployment
 */
export function generateMsiOneLiner(provisioningToken: string): string {
  const provisionUrl = PROVISION_ENDPOINT;
  const msiUrl = MSI_DOWNLOAD_URL;
  
  // Note: ENABLETRAY passed without quotes for WiX condition compatibility
  return `# Run in elevated PowerShell:
$t="${provisioningToken}";$c=irm "${provisionUrl}?action=redeem" -Method POST -Body (@{token=$t;device_id=$env:COMPUTERNAME}|ConvertTo-Json) -ContentType "application/json";$m="$env:TEMP\\VanguardAgent.msi";(New-Object Net.WebClient).DownloadFile("${msiUrl}",$m);$et=if($c.enable_tray){"1"}else{"0"};msiexec /i $m /qn USERID="$($c.user_id)" SECRETKEY="$($c.secret_key)" ENABLETRAY=$et`;
}

/**
 * Full flow: Create token + generate single-file EXE installer
 * The EXE has config appended to its tail, so it's truly self-contained
 */
export async function generateOneClickInstaller(options: MsiInstallerOptions): Promise<{
  blob: Blob;
  filename: string;
  token: string;
  expiresAt: string;
} | null> {
  // Create provisioning token
  const tokenResponse = await createProvisioningToken(options);
  
  if (!tokenResponse) {
    return null;
  }

  const safeName = (options.clientName || 'VanguardAgent').replace(/[^a-zA-Z0-9]/g, '-');
  
  // Try to generate self-contained EXE (professional)
  try {
    const exeBlob = await generateSelfContainedExe(
      tokenResponse.token,
      options.clientName,
      options.enableTray
    );
    
    if (exeBlob) {
      return {
        blob: exeBlob,
        filename: `Install-${safeName}.exe`,
        token: tokenResponse.token,
        expiresAt: tokenResponse.expires_at,
      };
    }
  } catch (err) {
    console.warn('[generateOneClickInstaller] EXE generation failed, falling back to CMD:', err);
  }
  
  // Fallback to CMD installer if EXE download fails
  const blob = generateMsiInstallerBlob(tokenResponse.token, options.clientName, options.enableTray);

  return {
    blob,
    filename: `Install-${safeName}.cmd`,
    token: tokenResponse.token,
    expiresAt: tokenResponse.expires_at,
  };
}

/**
 * Generate a self-contained EXE installer by appending config to the stub EXE
 * The C# installer reads config from its own tail after a marker
 */
async function generateSelfContainedExe(
  provisioningToken: string,
  clientName?: string,
  enableTray?: boolean
): Promise<Blob | null> {
  // Download the installer EXE stub
  const response = await fetch(INSTALLER_EXE_URL);
  if (!response.ok) {
    throw new Error(`Failed to download installer: ${response.status}`);
  }
  
  const exeBytes = new Uint8Array(await response.arrayBuffer());
  
  // Create the config JSON
  const config = {
    token: provisioningToken,
    client_name: clientName || 'Vanguard Device',
    enable_tray: enableTray ?? true,
    msi_url: MSI_DOWNLOAD_URL,
    provision_url: PROVISION_ENDPOINT,
  };
  
  // Marker + JSON to append
  const marker = '---VANGUARD_CONFIG_START---';
  const configPayload = marker + JSON.stringify(config);
  const configBytes = new TextEncoder().encode(configPayload);
  
  // Combine EXE + config
  const combined = new Uint8Array(exeBytes.length + configBytes.length);
  combined.set(exeBytes, 0);
  combined.set(configBytes, exeBytes.length);
  
  return new Blob([combined], { type: 'application/x-msdownload' });
}
