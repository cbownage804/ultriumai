import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generateWindowsInstaller(agentId: string | null, clientId: string | null): string {
  return `@echo off
REM SafeNet Connector Installer for Windows
title SafeNet Connector Installer
echo.
echo ====================================
echo SafeNet Connector Installer v2.0
echo ====================================
echo.
echo Agent ID: ${agentId || 'auto-generated'}
echo Client ID: ${clientId || 'default'}
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo.
    echo Please install Python 3.7+ from: https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    echo.
    pause
    exit /b 1
)

echo ✓ Python found
echo Installing SafeNet Connector...
echo.

REM Install required packages
echo Installing required Python packages...
pip install requests psutil

REM Create SafeNet directory
if not exist "%USERPROFILE%\\SafeNet" mkdir "%USERPROFILE%\\SafeNet"
cd /d "%USERPROFILE%\\SafeNet"

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
echo.
echo print^('SafeNet Connector v2.0'^)
echo print^('====================='^)
echo print^(f'Agent ID: ${agentId || 'auto-generated'}'^)
echo print^(f'Client ID: ${clientId || 'default'}'^)
echo print^('^)
echo.
echo class SafeNetConnector:
echo     def __init__^(self^):
echo         self.agent_id = '${agentId || 'auto-generated'}'
echo         self.client_id = '${clientId || 'default'}'
echo         self.endpoint = 'https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/safenet-api'
echo         
echo     def discover_devices^(self^):
echo         devices = []
echo         try:
echo             hostname = socket.gethostname^(^)
echo             local_ip = socket.gethostbyname^(hostname^)
echo             
echo             device = {
echo                 'hostname': hostname,
echo                 'ip_address': local_ip,
echo                 'device_type': 'computer',
echo                 'os': os.name,
echo                 'status': 'online',
echo                 'discovered_at': datetime.now^(timezone.utc^).isoformat^(^)
echo             }
echo             devices.append^(device^)
echo             print^(f'Found device: {hostname} ^({local_ip}^)'^)
echo         except Exception as e:
echo             print^(f'Discovery error: {e}'^)
echo         return devices
echo.
echo     def send_report^(self, devices^):
echo         try:
echo             import requests
echo             report = {
echo                 'agent_id': self.agent_id,
echo                 'client_id': self.client_id,
echo                 'timestamp': datetime.now^(timezone.utc^).isoformat^(^),
echo                 'devices': devices,
echo                 'scan_type': 'basic_discovery'
echo             }
echo             response = requests.post^(self.endpoint, json=report, timeout=30^)
echo             if response.status_code == 200:
echo                 print^('✓ Report sent successfully'^)
echo             else:
echo                 print^(f'Report failed: {response.status_code}'^)
echo         except Exception as e:
echo             print^(f'Report error: {e}'^)
echo.
echo     def run_scan^(self^):
echo         print^('Starting network scan...'^)
echo         devices = self.discover_devices^(^)
echo         self.send_report^(devices^)
echo         print^(f'Scan complete. Found {len^(devices^)} devices'^)
echo.
echo def main^(^):
echo     try:
echo         connector = SafeNetConnector^(^)
echo         print^('SafeNet Connector is ready!'^)
echo         print^('Choose an option:'^)
echo         print^('1. Run single scan'^)
echo         print^('2. Run continuous monitoring'^)
echo         print^('3. Exit'^)
echo         
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
echo.
echo if __name__ == '__main__':
echo     main^(^)
) > safenet_connector.py

echo.
echo ✓ SafeNet Connector installed successfully!
echo.
echo To run the connector later:
echo   cd "%USERPROFILE%\\SafeNet"
echo   python safenet_connector.py
echo.
echo Starting SafeNet Connector now...
python safenet_connector.py

pause`;
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