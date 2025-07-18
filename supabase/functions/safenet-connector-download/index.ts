import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generateWindowsInstaller(agentId: string | null, clientId: string | null): string {
  return `@echo off
setlocal enabledelayedexpansion
title SafeNet Connector Installer v2.1

REM FORCE WINDOW TO STAY OPEN - AGGRESSIVE MODE
echo.
echo SafeNet Connector Installer Starting...
echo Window will stay open for troubleshooting
echo.
pause

:start
cls
echo.
echo ====================================
echo SafeNet Connector Installer v2.0
echo ====================================
echo.
echo Agent ID: ${agentId || 'auto-generated'}
echo Client ID: ${clientId || 'default'}
echo.
echo Starting installation process...
echo.
timeout /t 1 /nobreak >nul

echo [STEP 1/6] Checking Python installation...
python --version 2>nul
if errorlevel 1 (
    echo.
    echo [ERROR] Python is not installed or not in PATH
    echo.
    echo Please install Python 3.7+ from: https://www.python.org/downloads/
    echo IMPORTANT: Check "Add Python to PATH" during installation
    echo.
    echo After installing Python, run this installer again.
    echo.
    goto force_pause
)

for /f "tokens=*" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo [SUCCESS] Python found: !PYTHON_VERSION!
echo.
timeout /t 1 /nobreak >nul

echo [STEP 2/6] Checking pip...
python -m pip --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] pip is not available
    echo Please reinstall Python with pip included
    goto force_pause
)
echo [SUCCESS] pip is available
echo.
timeout /t 1 /nobreak >nul

echo [STEP 3/6] Installing required packages...
echo This may take 30-60 seconds...
python -m pip install requests psutil --quiet --disable-pip-version-check 2>nul
if errorlevel 1 (
    echo [WARNING] Package installation had issues, but continuing...
) else (
    echo [SUCCESS] Packages installed successfully
)
echo.
timeout /t 1 /nobreak >nul

echo [STEP 4/6] Creating SafeNet directory...
set "SAFENET_DIR=%USERPROFILE%\\SafeNet"
if not exist "!SAFENET_DIR!" mkdir "!SAFENET_DIR!"
echo Directory created: !SAFENET_DIR!
echo.
timeout /t 1 /nobreak >nul

echo [STEP 5/6] Creating connector script...
pushd "!SAFENET_DIR!" 2>nul
if errorlevel 1 (
    echo [ERROR] Could not access SafeNet directory
    goto force_pause
)

REM Create the connector script
echo Creating connector script...
(
echo import sys
echo import os
echo import json
echo import time
echo import socket
echo import subprocess
echo from datetime import datetime, timezone
echo(
echo print^('SafeNet Connector v2.0'^)
echo print^('====================='^)
echo print^(f'Agent ID: ${agentId || 'auto-generated'}'^)
echo print^(f'Client ID: ${clientId || 'default'}'^)
echo print^(''^)
echo(
echo class SafeNetConnector:
echo     def __init__^(self^):
echo         self.agent_id = '${agentId || 'auto-generated'}'
echo         self.client_id = '${clientId || 'default'}'
echo         self.connector_key = self.agent_id  # Use agent_id as connector_key
echo         self.endpoint = 'https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/safenet-api/scan-data'
echo(
echo     def discover_devices^(self^):
echo         devices = []
echo         try:
echo             hostname = socket.gethostname^(^)
echo             local_ip = socket.gethostbyname^(hostname^)
echo(
echo             device = {
echo                 'hostname': hostname,
echo                 'ip_address': local_ip,
echo                 'device_type': 'computer',
echo                 'os_family': os.name,
echo                 'status': 'online',
echo                 'risk_level': 'low',
echo                 'device_name': hostname,
echo                 'is_managed': False,
echo                 'is_critical': False
echo             }
echo             devices.append^(device^)
echo             print^(f'Found device: {hostname} ^({local_ip}^)'^)
echo         except Exception as e:
echo             print^(f'Discovery error: {e}'^)
echo         return devices
echo(
echo     def send_report^(self, devices^):
echo         try:
echo             import requests
echo             report = {
echo                 'connector_key': self.connector_key,
echo                 'scan_type': 'basic_discovery',
echo                 'network_ranges': ['local'],
echo                 'devices_found': len^(devices^),
echo                 'scan_duration': 5,
echo                 'hostname': socket.gethostname^(^),
echo                 'results': {'discovered': len^(devices^)},
echo                 'devices': devices
echo             }
echo             response = requests.post^(self.endpoint, json=report, timeout=30^)
echo             if response.status_code == 200:
echo                 print^('Report sent successfully'^)
echo             else:
echo                 print^(f'Report failed: {response.status_code}'^)
echo                 print^(f'Response: {response.text}'^)
echo         except Exception as e:
echo             print^(f'Report error: {e}'^)
echo(
echo     def run_scan^(self^):
echo         print^('Starting network scan...'^)
echo         devices = self.discover_devices^(^)
echo         self.send_report^(devices^)
echo         print^(f'Scan complete. Found {len^(devices^)} devices'^)
echo(
echo def main^(^):
echo     try:
echo         connector = SafeNetConnector^(^)
echo         print^('SafeNet Connector is ready!'^)
echo         print^('Choose an option:'^)
echo         print^('1. Run single scan'^)
echo         print^('2. Run continuous monitoring'^)
echo         print^('3. Exit'^)
echo(
echo         while True:
echo             choice = input^('Enter choice ^(1-3^): '^).strip^(^)
echo             if choice == '1':
echo                 connector.run_scan^(^)
echo             elif choice == '2':
echo                 print^('Starting continuous monitoring...'^)
echo                 print^('Press Ctrl+C to stop'^)
echo                 try:
echo                     while True:
echo                         connector.run_scan^(^)
echo                         time.sleep^(60^)
echo                 except KeyboardInterrupt:
echo                     print^('Monitoring stopped'^)
echo                     break
echo             elif choice == '3':
echo                 break
echo             else:
echo                 print^('Invalid choice'^)
echo     except Exception as e:
echo         print^(f'Error: {e}'^)
echo         input^('Press Enter to exit...'^)
echo(
echo if __name__ == '__main__':
echo     main^(^)
) > safenet_connector.py

popd

echo.
echo [SUCCESS] SafeNet Connector installed successfully!
echo.
echo Installation complete! The connector has been saved to:
echo   !SAFENET_DIR!\\safenet_connector.py
echo.
echo To run the connector:
echo   1. Open Command Prompt as Administrator (recommended)
echo   2. Navigate to: !SAFENET_DIR!
echo   3. Run: python safenet_connector.py
echo.
echo Starting SafeNet Connector now...
echo.

python "!SAFENET_DIR!\\safenet_connector.py"
if errorlevel 1 (
    echo.
    echo [ERROR] Failed to start connector
    echo Please try running manually from the SafeNet directory
    goto force_pause
)

goto success_end

:force_pause
echo.
echo ==========================================
echo Installation paused - please review above
echo ==========================================
echo Press any key to continue...
pause >nul
goto start

:success_end
echo.
echo ==========================================
echo Installation completed successfully!
echo Press any key to close this window...
echo ==========================================
pause >nul
exit /b 0`;
}

function generateMacOSInstaller(agentId: string | null, clientId: string | null): string {
  return `#!/bin/bash
# SafeNet Connector Installer for macOS/Linux

echo "===================================="
echo "SafeNet Connector Installer v2.0"
echo "===================================="
echo ""
echo "Agent ID: ${agentId || 'auto-generated'}"
echo "Client ID: ${clientId || 'default'}"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    echo ""
    echo "Please install Python 3.7+ from: https://www.python.org/downloads/"
    echo "Or use your package manager:"
    echo "  macOS: brew install python3"
    echo "  Ubuntu/Debian: sudo apt install python3 python3-pip"
    echo "  CentOS/RHEL: sudo yum install python3 python3-pip"
    read -p "Press Enter to exit..."
    exit 1
fi

echo "✓ Python 3 found"
echo "Installing SafeNet Connector..."
echo ""

# Install required packages
echo "Installing required Python packages..."
python3 -m pip install requests psutil

# Create SafeNet directory
mkdir -p ~/SafeNet
cd ~/SafeNet

# Create the connector script
echo "Creating connector script..."
cat > safenet_connector.py << 'EOF'
import sys
import os
import json
import time
import socket
import subprocess
from datetime import datetime, timezone

print('SafeNet Connector v2.0')
print('=====================')
print(f'Agent ID: ${agentId || 'auto-generated'}')
print(f'Client ID: ${clientId || 'default'}')
print()

class SafeNetConnector:
    def __init__(self):
        self.agent_id = '${agentId || 'auto-generated'}'
        self.client_id = '${clientId || 'default'}'
        self.endpoint = 'https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/safenet-api'
        
    def discover_devices(self):
        devices = []
        try:
            hostname = socket.gethostname()
            local_ip = socket.gethostbyname(hostname)
            
            device = {
                'hostname': hostname,
                'ip_address': local_ip,
                'device_type': 'computer',
                'os': os.name,
                'status': 'online',
                'discovered_at': datetime.now(timezone.utc).isoformat()
            }
            devices.append(device)
            print(f'Found device: {hostname} ({local_ip})')
        except Exception as e:
            print(f'Discovery error: {e}')
        return devices

    def send_report(self, devices):
        try:
            import requests
            report = {
                'agent_id': self.agent_id,
                'client_id': self.client_id,
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'devices': devices,
                'scan_type': 'basic_discovery'
            }
            response = requests.post(self.endpoint, json=report, timeout=30)
            if response.status_code == 200:
                print('✓ Report sent successfully')
            else:
                print(f'Report failed: {response.status_code}')
        except Exception as e:
            print(f'Report error: {e}')

    def run_scan(self):
        print('Starting network scan...')
        devices = self.discover_devices()
        self.send_report(devices)
        print(f'Scan complete. Found {len(devices)} devices')

def main():
    try:
        connector = SafeNetConnector()
        print('SafeNet Connector is ready!')
        print('Choose an option:')
        print('1. Run single scan')
        print('2. Run continuous monitoring')
        print('3. Exit')
        
        while True:
            choice = input('Enter choice (1-3): ').strip()
            if choice == '1':
                connector.run_scan()
            elif choice == '2':
                print('Starting continuous monitoring...')
                print('Press Ctrl+C to stop')
                try:
                    while True:
                        connector.run_scan()
                        time.sleep(60)
                except KeyboardInterrupt:
                    print('Monitoring stopped')
                    break
            elif choice == '3':
                break
            else:
                print('Invalid choice')
    except Exception as e:
        print(f'Error: {e}')
        input('Press Enter to exit...')

if __name__ == '__main__':
    main()
EOF

echo ""
echo "✓ SafeNet Connector installed successfully!"
echo ""
echo "To run the connector later:"
echo "  cd ~/SafeNet"
echo "  python3 safenet_connector.py"
echo ""
echo "Starting SafeNet Connector now..."
python3 safenet_connector.py`;
}

function generateLinuxInstaller(agentId: string | null, clientId: string | null): string {
  return generateMacOSInstaller(agentId, clientId);
}

function generatePowerShellInstaller(agentId: string | null, clientId: string | null): string {
  return `# SafeNet Connector PowerShell Installer v2.0
param(
    [string]$AgentId = "${agentId || 'auto-generated'}",
    [string]$ClientId = "${clientId || 'default'}"
)

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "SafeNet Connector Installer v2.0" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Agent ID: $AgentId" -ForegroundColor Yellow
Write-Host "Client ID: $ClientId" -ForegroundColor Yellow
Write-Host ""

try {
    # Check Python installation
    Write-Host "[STEP 1/5] Checking Python installation..." -ForegroundColor Green
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Python is not installed or not in PATH" -ForegroundColor Red
        Write-Host "Please install Python 3.7+ from: https://www.python.org/downloads/" -ForegroundColor Yellow
        Write-Host "IMPORTANT: Check 'Add Python to PATH' during installation" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "[SUCCESS] Python found: $pythonVersion" -ForegroundColor Green

    # Check pip
    Write-Host "[STEP 2/5] Checking pip..." -ForegroundColor Green
    python -m pip --version | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] pip is not available" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "[SUCCESS] pip is available" -ForegroundColor Green

    # Install packages
    Write-Host "[STEP 3/5] Installing required packages..." -ForegroundColor Green
    python -m pip install requests psutil --quiet --disable-pip-version-check
    Write-Host "[SUCCESS] Packages installed" -ForegroundColor Green

    # Create directory
    Write-Host "[STEP 4/5] Creating SafeNet directory..." -ForegroundColor Green
    $safenetDir = Join-Path $env:USERPROFILE "SafeNet"
    if (!(Test-Path $safenetDir)) {
        New-Item -ItemType Directory -Path $safenetDir | Out-Null
    }
    Write-Host "Directory: $safenetDir" -ForegroundColor Yellow

    # Create Python script
    Write-Host "[STEP 5/5] Creating connector script..." -ForegroundColor Green
    $pythonScript = @"
import sys
import os
import json
import time
import socket
import subprocess
from datetime import datetime, timezone

print('SafeNet Connector v2.0')
print('=====================')
print(f'Agent ID: ${agentId || 'auto-generated'}')
print(f'Client ID: ${clientId || 'default'}')
print('')

class SafeNetConnector:
    def __init__(self):
        self.agent_id = '${agentId || 'auto-generated'}'
        self.client_id = '${clientId || 'default'}'
        self.connector_key = self.agent_id
        self.endpoint = 'https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/safenet-api/scan-data'

    def discover_devices(self):
        devices = []
        try:
            hostname = socket.gethostname()
            local_ip = socket.gethostbyname(hostname)
            
            device = {
                'hostname': hostname,
                'ip_address': local_ip,
                'device_type': 'computer',
                'os_family': os.name,
                'status': 'online',
                'risk_level': 'low',
                'device_name': hostname,
                'is_managed': False,
                'is_critical': False
            }
            devices.append(device)
            print(f'Found device: {hostname} ({local_ip})')
        except Exception as e:
            print(f'Discovery error: {e}')
        return devices

    def send_report(self, devices):
        try:
            import requests
            report = {
                'connector_key': self.connector_key,
                'scan_type': 'basic_discovery',
                'network_ranges': ['local'],
                'devices_found': len(devices),
                'scan_duration': 5,
                'hostname': socket.gethostname(),
                'results': {'discovered': len(devices)},
                'devices': devices
            }
            response = requests.post(self.endpoint, json=report, timeout=30)
            if response.status_code == 200:
                print('Report sent successfully')
            else:
                print(f'Report failed: {response.status_code}')
                print(f'Response: {response.text}')
        except Exception as e:
            print(f'Report error: {e}')

    def run_scan(self):
        print('Starting network scan...')
        devices = self.discover_devices()
        self.send_report(devices)
        print(f'Scan complete. Found {len(devices)} devices')

def main():
    try:
        connector = SafeNetConnector()
        print('SafeNet Connector is ready!')
        print('Choose an option:')
        print('1. Run single scan')
        print('2. Run continuous monitoring')
        print('3. Exit')
        
        while True:
            choice = input('Enter choice (1-3): ').strip()
            if choice == '1':
                connector.run_scan()
            elif choice == '2':
                print('Starting continuous monitoring...')
                print('Press Ctrl+C to stop')
                try:
                    while True:
                        connector.run_scan()
                        time.sleep(60)
                except KeyboardInterrupt:
                    print('Monitoring stopped')
                    break
            elif choice == '3':
                break
            else:
                print('Invalid choice')
    except Exception as e:
        print(f'Error: {e}')
        input('Press Enter to exit...')

if __name__ == '__main__':
    main()
"@

    $scriptPath = Join-Path $safenetDir "safenet_connector.py"
    $pythonScript | Out-File -FilePath $scriptPath -Encoding UTF8

    Write-Host "[SUCCESS] SafeNet Connector installed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Installation complete! The connector has been saved to:" -ForegroundColor Cyan
    Write-Host "  $scriptPath" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Starting SafeNet Connector now..." -ForegroundColor Green
    
    Set-Location $safenetDir
    python safenet_connector.py

} catch {
    Write-Host "[ERROR] Installation failed: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname;
    
    // Extract platform from filename
    const filename = pathname.split('/').pop() || '';
    const agentId = url.searchParams.get('agentId');
    const clientId = url.searchParams.get('clientId');
    
    console.log(`Download request for platform: ${filename}, agentId: ${agentId}`);
    
    let installerContent: string;
    let contentType: string;
    let downloadFilename: string;
    
    if (filename.includes('windows') || filename.includes('.bat')) {
      installerContent = generateWindowsInstaller(agentId, clientId);
      contentType = 'application/x-msdos-program';
      downloadFilename = 'safenet-connector-install.bat';
    } else if (filename.includes('powershell') || filename.includes('.ps1')) {
      installerContent = generatePythonConnector(agentId, clientId);
      contentType = 'text/plain';
      downloadFilename = 'safenet_connector.py';
    } else if (filename.includes('python') || filename.includes('.py')) {
      installerContent = generatePythonConnector(agentId, clientId);
      contentType = 'text/x-python';
      downloadFilename = 'safenet_connector.py';
    } else if (filename.includes('macos') || filename.includes('darwin')) {
      installerContent = generateMacOSInstaller(agentId, clientId);
      contentType = 'application/x-sh';
      downloadFilename = 'safenet-connector-install.sh';
    } else if (filename.includes('linux')) {
      installerContent = generateLinuxInstaller(agentId, clientId);
      contentType = 'application/x-sh';
      downloadFilename = 'safenet-connector-install.sh';
    } else {
      // Default to Windows batch file
      installerContent = generateWindowsInstaller(agentId, clientId);
      contentType = 'application/x-msdos-program';
      downloadFilename = 'safenet-connector-install.bat';
    }

    return new Response(installerContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${downloadFilename}"`,
        'Content-Length': installerContent.length.toString(),
      },
    });

  } catch (error) {
    console.error('Download error:', error);
    return new Response(JSON.stringify({ error: 'Download failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});