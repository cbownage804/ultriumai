import JSZip from 'jszip';

import { devLog } from '@/lib/logger';
interface WindowsAgentZipOptions {
  userId: string;
  apiEndpoint: string;
  secretKey: string;
  deviceName?: string;
  clientId?: string;
  clientName?: string;
  onProgress?: (progress: number, message: string) => void;
}

// Re-export for convenience - callers should use getAgentConfig() to get these values
export type { WindowsAgentZipOptions };

// Primary: Supabase Storage bucket for agent downloads
const STORAGE_BASE_URL = 'https://nsyobmjpdpvesjwdphlh.supabase.co/storage/v1/object/public/vanguard-agents';
// Fallback: GitHub Releases (public)
const GITHUB_RELEASE_URL = 'https://github.com/ultriuminc/ultriumai-app/releases/latest/download';
const EXE_FILENAME = 'VanguardAgent-win-x64.exe';

// Cache to avoid re-downloading
let cachedExeBlob: Blob | null = null;

async function fetchPreBuiltExe(onProgress?: (progress: number, message: string) => void): Promise<Blob | null> {
  // Return cached if available
  if (cachedExeBlob) {
    return cachedExeBlob;
  }

  const sources = [
    { name: 'Supabase Storage', url: `${STORAGE_BASE_URL}/${EXE_FILENAME}` },
    { name: 'GitHub Release', url: `${GITHUB_RELEASE_URL}/${EXE_FILENAME}` },
  ];

  for (const source of sources) {
    try {
      onProgress?.(10, `Fetching from ${source.name}...`);
      
      const response = await fetch(source.url, {
        method: 'GET',
        headers: { 'Accept': 'application/octet-stream' },
      });

      if (response.ok) {
        onProgress?.(50, 'Downloading executable...');
        cachedExeBlob = await response.blob();
        
        // Verify it's a valid EXE (should be > 1MB for a .NET self-contained app)
        if (cachedExeBlob.size > 1024 * 1024) {
          onProgress?.(80, 'Download complete');
          devLog.log(`Agent EXE fetched from ${source.name} (${(cachedExeBlob.size / 1024 / 1024).toFixed(1)} MB)`);
          return cachedExeBlob;
        } else {
          devLog.warn(`${source.name}: Downloaded file too small, likely not valid EXE`);
          cachedExeBlob = null;
        }
      }
    } catch (error) {
      devLog.warn(`Failed to fetch from ${source.name}:`, error);
    }
  }

  devLog.warn('Agent EXE not found in any source, using config-only bundle');
  return null;
}

// C# Program.cs content (for build reference only)
const PROGRAM_CS = `// Vanguard Agent - Entry Point
// Build: dotnet publish -c Release -r win-x64 --self-contained -p:PublishSingleFile=true

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = Host.CreateApplicationBuilder(args);

// Check for command-line flags
if (args.Contains("--install"))
{
    Console.WriteLine("Installing Vanguard Agent as Windows Service...");
    var exePath = Environment.ProcessPath ?? "VanguardAgent.exe";
    var psi = new System.Diagnostics.ProcessStartInfo
    {
        FileName = "sc.exe",
        Arguments = $"create VanguardAgent binPath= \\"{exePath}\\" start= auto DisplayName= \\"Vanguard Agent\\"",
        UseShellExecute = false,
        CreateNoWindow = true
    };
    System.Diagnostics.Process.Start(psi)?.WaitForExit();
    Console.WriteLine("Service installed! Run: net start VanguardAgent");
    return;
}

if (args.Contains("--uninstall"))
{
    Console.WriteLine("Removing Vanguard Agent service...");
    System.Diagnostics.Process.Start("net", "stop VanguardAgent")?.WaitForExit();
    System.Diagnostics.Process.Start("sc.exe", "delete VanguardAgent")?.WaitForExit();
    Console.WriteLine("Service removed.");
    return;
}

builder.Services.AddWindowsService(options => options.ServiceName = "VanguardAgent");
var host = builder.Build();
await host.RunAsync();
`;

// PowerShell installer script
const INSTALL_PS1 = `# =============================================================================
# Vanguard Agent Windows Installer
# =============================================================================
# Run as Administrator: powershell -ExecutionPolicy Bypass -File install.ps1
# =============================================================================

param(
    [string]$InstallDir = "C:\\Program Files\\Vanguard"
)

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Vanguard Agent Installer" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check for admin
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator"))
{
    Write-Host "ERROR: Please run as Administrator" -ForegroundColor Red
    exit 1
}

Write-Host "[1/4] Creating installation directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null

Write-Host "[2/4] Copying agent files..." -ForegroundColor Yellow
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Copy-Item "$ScriptDir\\VanguardAgent.exe" "$InstallDir\\" -Force
Copy-Item "$ScriptDir\\config.json" "$InstallDir\\" -Force

Write-Host "[3/4] Installing Windows Service..." -ForegroundColor Yellow
& "$InstallDir\\VanguardAgent.exe" --install

Write-Host "[4/4] Starting service..." -ForegroundColor Yellow
Start-Service VanguardAgent -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Installation Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Service Status:" -ForegroundColor White
Get-Service VanguardAgent | Format-Table Status, Name, DisplayName

Write-Host ""
Write-Host "Configuration: $InstallDir\\config.json" -ForegroundColor White
Write-Host "Logs: Event Viewer > Windows Logs > Application" -ForegroundColor White
`;

// Batch file for quick install
const INSTALL_BAT = `@echo off
echo ============================================
echo   Vanguard Agent Installer
echo ============================================
echo.

:: Check for admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Please run as Administrator
    pause
    exit /b 1
)

set INSTALL_DIR=C:\\Program Files\\Vanguard

echo Installing to %INSTALL_DIR%...
mkdir "%INSTALL_DIR%" 2>nul

copy /Y "VanguardAgent.exe" "%INSTALL_DIR%\\" >nul
copy /Y "config.json" "%INSTALL_DIR%\\" >nul

echo Installing Windows Service...
"%INSTALL_DIR%\\VanguardAgent.exe" --install

echo Starting service...
net start VanguardAgent

echo.
echo Installation complete!
echo.
echo Configuration: %INSTALL_DIR%\\config.json
pause
`;

// Uninstall batch file
const UNINSTALL_BAT = `@echo off
echo ============================================
echo   Vanguard Agent Uninstaller
echo ============================================
echo.

:: Check for admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Please run as Administrator
    pause
    exit /b 1
)

set INSTALL_DIR=C:\\Program Files\\Vanguard

echo Stopping service...
net stop VanguardAgent 2>nul

echo Removing service...
sc delete VanguardAgent 2>nul

echo Removing files...
rmdir /S /Q "%INSTALL_DIR%" 2>nul

echo.
echo Uninstallation complete!
pause
`;

// README for Windows
const WINDOWS_README = `# Vanguard Agent for Windows

Enterprise RMM agent for Windows systems.

## Quick Install

1. **Run as Administrator**: Right-click \`install.bat\` and select "Run as Administrator"
2. The agent will be installed to \`C:\\Program Files\\Vanguard\`
3. The service will start automatically

## Manual Install

\`\`\`powershell
# Run PowerShell as Administrator
.\\install.ps1
\`\`\`

## Configuration

Edit \`C:\\Program Files\\Vanguard\\config.json\` to customize:
- Device name
- Heartbeat interval
- Feature flags

## Service Management

\`\`\`powershell
# Check status
Get-Service VanguardAgent

# Stop service
Stop-Service VanguardAgent

# Start service
Start-Service VanguardAgent

# View logs
Get-EventLog -LogName Application -Source VanguardAgent -Newest 50
\`\`\`

## Uninstall

Right-click \`uninstall.bat\` and select "Run as Administrator"

## Features

- Real-time CPU, RAM, disk monitoring
- Process and service inventory
- Network adapter enumeration
- Installed software tracking
- Remote command execution
- Windows Service integration

## Support

Dashboard: https://ultriumai.com/vanguard
`;

export async function generateWindowsAgentZip(options: WindowsAgentZipOptions): Promise<Blob> {
  const {
    userId,
    apiEndpoint,
    secretKey,
    deviceName = 'Vanguard-Windows',
    clientId,
    clientName,
    onProgress,
  } = options;

  const zip = new JSZip();

  // Try to fetch pre-built EXE from GitHub Releases
  onProgress?.(5, 'Checking for pre-built agent...');
  const exeBlob = await fetchPreBuiltExe(onProgress);
  
  if (exeBlob) {
    // Include the actual EXE binary from GitHub Release
    zip.file('VanguardAgent.exe', exeBlob);
    onProgress?.(85, 'Bundling with your credentials...');
  } else {
    // Fallback: include build instructions if EXE not available
    zip.file('BUILD_INSTRUCTIONS.md', `# Building VanguardAgent.exe

This ZIP contains configuration and installer scripts. The pre-built EXE is not yet available.

## Build from Source
\`\`\`powershell
# Clone the repository  
git clone https://github.com/ultrium/vanguard-agent.git
cd vanguard-agent/VanguardAgent

# Build single-file EXE
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true

# Output: bin/Release/net8.0-windows/win-x64/publish/VanguardAgent.exe
\`\`\`

## After obtaining VanguardAgent.exe
1. Place VanguardAgent.exe in this folder
2. Run install.bat as Administrator
`);
    onProgress?.(85, 'Creating config-only bundle...');
  }

  // Create config.json with user credentials and optional client association
  const configJson = JSON.stringify({
    user_id: userId,
    secret_key: secretKey,
    device_id: null,
    device_name: clientName ? `${clientName}-${deviceName}` : deviceName,
    api_endpoint: apiEndpoint,
    client_id: clientId || null,
    client_name: clientName || null,
    heartbeat_interval: 60,
    command_poll_interval: 30,
    telemetry_interval: 300,
    features: {
      collect_processes: true,
      collect_services: true,
      collect_network: true,
      collect_installed_software: true,
      execute_commands: true,
    },
  }, null, 2);

  zip.file('config.json', configJson);
  zip.file('install.bat', INSTALL_BAT);
  zip.file('install.ps1', INSTALL_PS1);
  zip.file('uninstall.bat', UNINSTALL_BAT);
  zip.file('README.md', WINDOWS_README);

  onProgress?.(95, 'Compressing package...');
  
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  onProgress?.(100, 'Complete!');
  return blob;
}
