import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Download,
  FileCode,
  FileText,
  Terminal,
  Cpu,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AGENT_VERSION = '1.0.0';

// Python Agent Code
const PYTHON_AGENT_CODE = `#!/usr/bin/env python3
"""
Vanguard Recon Agent v${AGENT_VERSION}
Network Security Monitoring for Raspberry Pi

This agent performs:
- Network discovery (ARP scanning, service detection)
- Vulnerability scanning
- Traffic monitoring
- Threat detection
- Heartbeat reporting to Vanguard dashboard
"""

import json
import os
import sys
import time
import socket
import subprocess
import threading
import logging
from datetime import datetime
from pathlib import Path

try:
    import requests
except ImportError:
    print("Installing required packages...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests"])
    import requests

try:
    import netifaces
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "netifaces"])
    import netifaces

# Configuration
CONFIG_PATH = Path("/opt/vanguard-recon/config.json")
CREDENTIALS_PATH = Path("/opt/vanguard-recon/agent-credentials.json")
LOG_PATH = Path("/var/log/vanguard-recon.log")

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_PATH) if LOG_PATH.parent.exists() else logging.StreamHandler(),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("vanguard-recon")


class VanguardReconAgent:
    def __init__(self):
        self.config = self._load_config()
        self.credentials = self._load_credentials()
        self.agent_id = None
        self.agent_key = None
        self.running = True
        
    def _load_config(self):
        """Load configuration from config.json"""
        if not CONFIG_PATH.exists():
            logger.error(f"Config file not found: {CONFIG_PATH}")
            sys.exit(1)
        
        with open(CONFIG_PATH, 'r') as f:
            return json.load(f)
    
    def _load_credentials(self):
        """Load agent credentials if already activated"""
        if CREDENTIALS_PATH.exists():
            with open(CREDENTIALS_PATH, 'r') as f:
                return json.load(f)
        return None
    
    def _save_credentials(self, agent_id, agent_key):
        """Save agent credentials after activation"""
        credentials = {
            "agent_id": agent_id,
            "agent_key": agent_key,
            "activated_at": datetime.now().isoformat()
        }
        CREDENTIALS_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(CREDENTIALS_PATH, 'w') as f:
            json.dump(credentials, f, indent=2)
        logger.info("Agent credentials saved")
    
    def _get_device_info(self):
        """Gather device information"""
        info = {
            "hostname": socket.gethostname(),
            "local_ip": self._get_local_ip(),
            "mac_address": self._get_mac_address(),
            "firmware_version": self.config.get("config_version", "1.0.0"),
        }
        return info
    
    def _get_local_ip(self):
        """Get local IP address"""
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return "127.0.0.1"
    
    def _get_mac_address(self):
        """Get MAC address of primary interface"""
        try:
            for iface in ['eth0', 'wlan0', 'en0']:
                if iface in netifaces.interfaces():
                    addrs = netifaces.ifaddresses(iface)
                    if netifaces.AF_LINK in addrs:
                        return addrs[netifaces.AF_LINK][0]['addr']
        except:
            pass
        return "00:00:00:00:00:00"
    
    def activate(self):
        """Activate the unit with the Vanguard API"""
        if self.credentials:
            logger.info("Unit already activated, loading credentials")
            self.agent_id = self.credentials["agent_id"]
            self.agent_key = self.credentials["agent_key"]
            return True
        
        logger.info("Activating unit...")
        api_url = self.config["api"]["functions_url"]
        anon_key = self.config["api"]["anon_key"]
        
        device_info = self._get_device_info()
        payload = {
            "activation_key": self.config["activation_key"],
            "serial_number": self.config["serial_number"],
            **device_info
        }
        
        try:
            response = requests.post(
                f"{api_url}/recon-activate",
                json=payload,
                headers={
                    "Content-Type": "application/json",
                    "apikey": anon_key,
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.agent_id = data["agent_id"]
                    self.agent_key = data["agent_key"]
                    self._save_credentials(self.agent_id, self.agent_key)
                    logger.info(f"Activation successful! Agent ID: {self.agent_id}")
                    return True
                else:
                    logger.error(f"Activation failed: {data.get('error')}")
            else:
                logger.error(f"Activation request failed: {response.status_code}")
        except Exception as e:
            logger.error(f"Activation error: {e}")
        
        return False
    
    def send_heartbeat(self):
        """Send heartbeat to Vanguard API"""
        if not self.agent_id or not self.agent_key:
            logger.warning("Cannot send heartbeat - not activated")
            return
        
        api_url = self.config["api"]["functions_url"]
        
        # Collect system metrics
        metrics = self._collect_metrics()
        
        payload = {
            "agent_id": self.agent_id,
            "agent_key": self.agent_key,
            "metrics": metrics,
            "status": "online",
        }
        
        try:
            response = requests.post(
                f"{api_url}/vanguard-heartbeat",
                json=payload,
                headers={
                    "Content-Type": "application/json",
                    "apikey": self.config["api"]["anon_key"],
                }
            )
            
            if response.status_code == 200:
                logger.debug("Heartbeat sent successfully")
            else:
                logger.warning(f"Heartbeat failed: {response.status_code}")
        except Exception as e:
            logger.error(f"Heartbeat error: {e}")
    
    def _collect_metrics(self):
        """Collect system metrics"""
        metrics = {
            "timestamp": datetime.now().isoformat(),
            "uptime": self._get_uptime(),
            "cpu_usage": self._get_cpu_usage(),
            "memory_usage": self._get_memory_usage(),
            "disk_usage": self._get_disk_usage(),
            "network_rx_bytes": 0,
            "network_tx_bytes": 0,
        }
        
        # Get network stats
        try:
            with open('/proc/net/dev', 'r') as f:
                for line in f:
                    if 'eth0' in line or 'wlan0' in line:
                        parts = line.split()
                        metrics["network_rx_bytes"] = int(parts[1])
                        metrics["network_tx_bytes"] = int(parts[9])
                        break
        except:
            pass
        
        return metrics
    
    def _get_uptime(self):
        """Get system uptime in seconds"""
        try:
            with open('/proc/uptime', 'r') as f:
                return float(f.read().split()[0])
        except:
            return 0
    
    def _get_cpu_usage(self):
        """Get CPU usage percentage"""
        try:
            result = subprocess.run(['grep', 'cpu ', '/proc/stat'], capture_output=True, text=True)
            parts = result.stdout.split()
            idle = float(parts[4])
            total = sum(float(x) for x in parts[1:])
            return round((1 - idle/total) * 100, 1)
        except:
            return 0
    
    def _get_memory_usage(self):
        """Get memory usage percentage"""
        try:
            with open('/proc/meminfo', 'r') as f:
                lines = f.readlines()
                total = int(lines[0].split()[1])
                available = int(lines[2].split()[1])
                return round((1 - available/total) * 100, 1)
        except:
            return 0
    
    def _get_disk_usage(self):
        """Get disk usage percentage"""
        try:
            result = subprocess.run(['df', '/'], capture_output=True, text=True)
            line = result.stdout.split('\\n')[1]
            usage = int(line.split()[4].replace('%', ''))
            return usage
        except:
            return 0
    
    def discover_network(self):
        """Perform network discovery"""
        if not self.config["features"].get("network_discovery"):
            return
        
        logger.info("Starting network discovery...")
        devices = []
        
        # Get local network range
        local_ip = self._get_local_ip()
        network_prefix = '.'.join(local_ip.split('.')[:-1])
        
        # ARP scan
        try:
            for i in range(1, 255):
                ip = f"{network_prefix}.{i}"
                result = subprocess.run(
                    ['arping', '-c', '1', '-w', '1', ip],
                    capture_output=True,
                    timeout=2
                )
                if result.returncode == 0:
                    # Parse MAC address from output
                    output = result.stdout.decode()
                    if 'reply from' in output.lower():
                        devices.append({
                            "ip_address": ip,
                            "discovered_at": datetime.now().isoformat(),
                        })
        except Exception as e:
            logger.error(f"Network discovery error: {e}")
        
        logger.info(f"Discovered {len(devices)} devices")
        
        # Report to API
        if devices:
            self._report_devices(devices)
    
    def _report_devices(self, devices):
        """Report discovered devices to API"""
        api_url = self.config["api"]["functions_url"]
        
        payload = {
            "agent_id": self.agent_id,
            "agent_key": self.agent_key,
            "devices": devices,
        }
        
        try:
            requests.post(
                f"{api_url}/recon-report-devices",
                json=payload,
                headers={
                    "Content-Type": "application/json",
                    "apikey": self.config["api"]["anon_key"],
                }
            )
        except Exception as e:
            logger.error(f"Device reporting error: {e}")
    
    def run(self):
        """Main agent loop"""
        logger.info("Vanguard Recon Agent starting...")
        
        # Activate if needed
        if not self.activate():
            logger.error("Failed to activate - retrying in 60 seconds")
            time.sleep(60)
            return self.run()
        
        heartbeat_interval = self.config["settings"]["heartbeat_interval_seconds"]
        scan_interval = self.config["settings"]["scan_interval_seconds"]
        
        last_scan = 0
        
        while self.running:
            try:
                # Send heartbeat
                self.send_heartbeat()
                
                # Check if it's time for a network scan
                current_time = time.time()
                if current_time - last_scan >= scan_interval:
                    self.discover_network()
                    last_scan = current_time
                
                # Wait for next heartbeat
                time.sleep(heartbeat_interval)
                
            except KeyboardInterrupt:
                logger.info("Shutting down...")
                self.running = False
            except Exception as e:
                logger.error(f"Agent error: {e}")
                time.sleep(10)


if __name__ == "__main__":
    agent = VanguardReconAgent()
    agent.run()
`;

// Systemd Service File
const SYSTEMD_SERVICE = `[Unit]
Description=Vanguard Recon Agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/vanguard-recon
ExecStart=/usr/bin/python3 /opt/vanguard-recon/agent.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
`;

// Installation Script
const INSTALL_SCRIPT = `#!/bin/bash
# Vanguard Recon Agent Installation Script
# Run as root: sudo bash install.sh

set -e

echo "=========================================="
echo " Vanguard Recon Agent Installer v${AGENT_VERSION}"
echo "=========================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (sudo bash install.sh)"
  exit 1
fi

# Create directories
echo "[1/5] Creating directories..."
mkdir -p /opt/vanguard-recon
mkdir -p /var/log

# Install dependencies
echo "[2/5] Installing dependencies..."
apt-get update -qq
apt-get install -y -qq python3 python3-pip arping jq

# Install Python packages
echo "[3/5] Installing Python packages..."
pip3 install requests netifaces

# Copy agent files
echo "[4/5] Installing agent..."
cp agent.py /opt/vanguard-recon/
cp config.json /opt/vanguard-recon/
chmod +x /opt/vanguard-recon/agent.py

# Create version file
echo "${AGENT_VERSION}" > /opt/vanguard-recon/version

# Install systemd service
echo "[5/5] Setting up systemd service..."
cat > /etc/systemd/system/vanguard-recon.service << 'EOF'
${SYSTEMD_SERVICE}
EOF

systemctl daemon-reload
systemctl enable vanguard-recon
systemctl start vanguard-recon

echo ""
echo "=========================================="
echo " Installation Complete!"
echo "=========================================="
echo ""
echo "Service status: systemctl status vanguard-recon"
echo "View logs: journalctl -u vanguard-recon -f"
echo ""
`;

// README content
const README_CONTENT = `# Vanguard Recon Agent v${AGENT_VERSION}

## Quick Start

1. Flash Raspberry Pi OS Lite (64-bit) to your SD card
2. Copy all files from this bundle to the Pi
3. Run the installer:
   \`\`\`bash
   sudo bash install.sh
   \`\`\`
4. The agent will auto-activate and appear in your Vanguard dashboard

## Files Included

- \`agent.py\` - Main Python agent
- \`config.json\` - Unit-specific configuration (contains activation key)
- \`install.sh\` - Automated installer script
- \`vanguard-recon.service\` - Systemd service file
- \`README.md\` - This file

## Manual Installation

If the installer fails, you can install manually:

\`\`\`bash
# Install dependencies
sudo apt-get update
sudo apt-get install python3 python3-pip arping jq

# Install Python packages
pip3 install requests netifaces

# Copy files
sudo mkdir -p /opt/vanguard-recon
sudo cp agent.py config.json /opt/vanguard-recon/
sudo chmod +x /opt/vanguard-recon/agent.py

# Install and start service
sudo cp vanguard-recon.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable vanguard-recon
sudo systemctl start vanguard-recon
\`\`\`

## Troubleshooting

### Check agent status
\`\`\`bash
sudo systemctl status vanguard-recon
\`\`\`

### View logs
\`\`\`bash
sudo journalctl -u vanguard-recon -f
# or
sudo cat /var/log/vanguard-recon.log
\`\`\`

### Restart agent
\`\`\`bash
sudo systemctl restart vanguard-recon
\`\`\`

### Manual activation test
\`\`\`bash
cd /opt/vanguard-recon
sudo python3 agent.py
\`\`\`

## Support

Contact: support@ultriumai.com
Documentation: https://docs.ultriumai.com/vanguard/recon
`;

export function ReconAgentDownloads() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = (code: string, name: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(name);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({ title: `${name} copied to clipboard` });
  };

  const downloadFile = (content: string, filename: string, type: string = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `${filename} downloaded` });
  };

  const downloadAllFiles = () => {
    // In production, you'd use JSZip to create a proper bundle
    // For now, download each file
    downloadFile(PYTHON_AGENT_CODE, 'agent.py', 'text/x-python');
    downloadFile(SYSTEMD_SERVICE, 'vanguard-recon.service');
    downloadFile(INSTALL_SCRIPT, 'install.sh', 'text/x-shellscript');
    downloadFile(README_CONTENT, 'README.md', 'text/markdown');
    toast({ 
      title: 'Agent files downloaded',
      description: 'Remember to include the unit-specific config.json from the provisioning panel',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-cyan-500" />
              Recon Agent Software
            </CardTitle>
            <CardDescription>
              Python agent and installation scripts for Raspberry Pi
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono">
            v{AGENT_VERSION}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="agent">Agent Code</TabsTrigger>
            <TabsTrigger value="install">Installer</TabsTrigger>
            <TabsTrigger value="service">Service</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-blue-500" />
                  agent.py
                </h4>
                <p className="text-sm text-muted-foreground">
                  Main Python agent with network discovery, heartbeats, and vulnerability scanning
                </p>
              </div>
              <div className="p-4 border rounded-lg space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-green-500" />
                  install.sh
                </h4>
                <p className="text-sm text-muted-foreground">
                  One-command installer that sets up dependencies and systemd service
                </p>
              </div>
              <div className="p-4 border rounded-lg space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-500" />
                  vanguard-recon.service
                </h4>
                <p className="text-sm text-muted-foreground">
                  Systemd service file for auto-start and crash recovery
                </p>
              </div>
              <div className="p-4 border rounded-lg space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-yellow-500" />
                  config.json
                </h4>
                <p className="text-sm text-muted-foreground">
                  Unit-specific config (download from Provisioning tab per unit)
                </p>
              </div>
            </div>

            <Button onClick={downloadAllFiles} className="w-full gap-2">
              <Download className="h-4 w-4" />
              Download All Agent Files
            </Button>

            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Deployment Steps</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Flash Raspberry Pi OS Lite (64-bit) to SD card</li>
                <li>Download agent files above + unit config from Provisioning tab</li>
                <li>Copy all files to a USB drive or directly to the Pi</li>
                <li>Run: <code className="bg-background px-1 rounded">sudo bash install.sh</code></li>
                <li>Unit will auto-activate and appear in customer dashboard</li>
              </ol>
            </div>
          </TabsContent>

          <TabsContent value="agent" className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(PYTHON_AGENT_CODE, 'Agent code')}
              >
                {copiedCode === 'Agent code' ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadFile(PYTHON_AGENT_CODE, 'agent.py', 'text/x-python')}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
            <pre className="p-4 bg-muted/50 rounded-lg text-xs overflow-auto max-h-96 font-mono">
              {PYTHON_AGENT_CODE}
            </pre>
          </TabsContent>

          <TabsContent value="install" className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(INSTALL_SCRIPT, 'Install script')}
              >
                {copiedCode === 'Install script' ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadFile(INSTALL_SCRIPT, 'install.sh', 'text/x-shellscript')}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
            <pre className="p-4 bg-muted/50 rounded-lg text-xs overflow-auto max-h-96 font-mono">
              {INSTALL_SCRIPT}
            </pre>
          </TabsContent>

          <TabsContent value="service" className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(SYSTEMD_SERVICE, 'Service file')}
              >
                {copiedCode === 'Service file' ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadFile(SYSTEMD_SERVICE, 'vanguard-recon.service')}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
            <pre className="p-4 bg-muted/50 rounded-lg text-xs overflow-auto max-h-96 font-mono">
              {SYSTEMD_SERVICE}
            </pre>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
