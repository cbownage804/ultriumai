import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Check, Terminal, Server, Plus, Loader2, Download, Package, Monitor, Cpu, Building2, Apple, Link2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { generateVanguardZip, downloadBlob } from '@/utils/generateVanguardZip';
import { generateWindowsAgentZip } from '@/utils/generateWindowsAgentZip';

const API_ENDPOINT = 'https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/vanguard-agent-api';
const VANGUARD_SECRET = 'vgd_sk_7Kx9mPqR3nTwYz2JfL8sHcN6bVdXaE4uGtM1oWpQ5iA';

// Supabase Storage bucket for agent downloads
const STORAGE_BASE = 'https://nsyobmjpdpvesjwdphlh.supabase.co/storage/v1/object/public/vanguard-agents';
const AGENT_DOWNLOAD_URLS = {
  windows: `${STORAGE_BASE}/VanguardAgent-Setup.exe`,
  windowsMsi: `${STORAGE_BASE}/VanguardAgent.msi`,
  macos: `${STORAGE_BASE}/VanguardAgent.dmg`,
  linux: `${STORAGE_BASE}/vanguard-agent-linux.tar.gz`,
};

type SelectedOS = 'windows' | 'macos' | 'linux';

interface MSPClient {
  id: string;
  company_name: string;
}

export default function VanguardSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState<string | null>(null);
  
  // OS selection state
  const [selectedOS, setSelectedOS] = useState<SelectedOS>('windows');
  
  // Client selection state
  const [clients, setClients] = useState<MSPClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [loadingClients, setLoadingClients] = useState(true);
  
  // Manual device registration state
  const [deviceName, setDeviceName] = useState('');
  const [deviceLocation, setDeviceLocation] = useState('');
  const [deviceIp, setDeviceIp] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingWindows, setIsDownloadingWindows] = useState(false);
  const [windowsDownloadProgress, setWindowsDownloadProgress] = useState(0);
  const [windowsDownloadMessage, setWindowsDownloadMessage] = useState('');

  // Fetch MSP clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      if (!user?.id) return;
      
      try {
        // Cast supabase to any to avoid TypeScript deep instantiation issues with msp_clients
        const sb: any = supabase;
        const { data, error } = await sb
          .from('msp_clients')
          .select('id, company_name')
          .eq('user_id', user.id)
          .order('company_name');
        
        if (error) throw error;
        setClients(data || []);
      } catch (error) {
        console.error('Failed to fetch clients:', error);
      } finally {
        setLoadingClients(false);
      }
    };
    
    fetchClients();
  }, [user?.id]);

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleManualRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !deviceName) {
      toast.error('Please enter a device name');
      return;
    }

    setIsRegistering(true);
    try {
      // Generate a unique device ID
      const deviceId = `manual_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const { error } = await supabase
        .from('vanguard_agents')
        .insert({
          user_id: user.id,
          device_id: deviceId,
          name: deviceName,
          location: deviceLocation || null,
          ip_address: deviceIp || null,
          status: 'offline',
          agent_version: 'manual',
        });

      if (error) throw error;

      toast.success('Device registered successfully!');
      setDeviceName('');
      setDeviceLocation('');
      setDeviceIp('');
      navigate('/vanguard/devices');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to register device');
    } finally {
      setIsRegistering(false);
    }
  };

  const configYaml = `# Vanguard Agent Configuration
# Place this file at /etc/vanguard/config.yaml on your Pi/Ubuntu server

ultrium_api:
  endpoint: "${API_ENDPOINT}"
  secret_key: "${VANGUARD_SECRET}"
  user_id: "${user?.id || 'YOUR_USER_ID'}"
  heartbeat_interval: 30  # seconds

device:
  name: "Vanguard-01"
  location: "Main Office"

thresholds:
  cpu_percent_critical: 90
  cpu_percent_warning: 70
  memory_percent_critical: 90
  memory_percent_warning: 70
  disk_percent_critical: 90
  disk_percent_warning: 70

hailo:
  enabled: true
  model_path: "/opt/hailo/models/"

scanning:
  network_ranges:
    - "192.168.1.0/24"
  scan_interval: 3600  # seconds
`;

  const pythonScript = `#!/usr/bin/env python3
"""
Vanguard Agent - Ultrium Security Appliance
Connects to UltriumAI dashboard for monitoring and control
"""

import os
import time
import json
import socket
import hashlib
import requests
import psutil
import yaml
from datetime import datetime

# Load configuration
CONFIG_PATH = os.environ.get('VANGUARD_CONFIG', '/etc/vanguard/config.yaml')

with open(CONFIG_PATH) as f:
    config = yaml.safe_load(f)

API_ENDPOINT = config['ultrium_api']['endpoint']
SECRET_KEY = config['ultrium_api']['secret_key']
USER_ID = config['ultrium_api']['user_id']
HEARTBEAT_INTERVAL = config['ultrium_api'].get('heartbeat_interval', 30)
DEVICE_NAME = config['device'].get('name', socket.gethostname())
DEVICE_LOCATION = config['device'].get('location', 'Unknown')

# Generate unique device ID from hardware
def get_device_id():
    mac = ':'.join(['{:02x}'.format((uuid.getnode() >> i) & 0xff) for i in range(0, 48, 8)])
    return hashlib.sha256(mac.encode()).hexdigest()[:16]

DEVICE_ID = get_device_id()

HEADERS = {
    'Content-Type': 'application/json',
    'X-VANGUARD-KEY': SECRET_KEY
}

def get_system_metrics():
    """Collect system metrics"""
    return {
        'cpu_percent': psutil.cpu_percent(interval=1),
        'memory_percent': psutil.virtual_memory().percent,
        'disk_percent': psutil.disk_usage('/').percent,
        'network_rx_bytes': psutil.net_io_counters().bytes_recv,
        'network_tx_bytes': psutil.net_io_counters().bytes_sent,
        'temperature': get_temperature()
    }

def get_temperature():
    """Get CPU temperature (Raspberry Pi / Linux)"""
    try:
        temps = psutil.sensors_temperatures()
        if 'cpu_thermal' in temps:
            return temps['cpu_thermal'][0].current
        if 'coretemp' in temps:
            return temps['coretemp'][0].current
    except:
        pass
    return None

def get_hailo_status():
    """Get Hailo AI accelerator status"""
    try:
        # Check if Hailo is available
        result = subprocess.run(['hailortcli', 'fw-control', 'identify'], 
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            return {
                'available': True,
                'output': result.stdout.strip()
            }
    except:
        pass
    return {'available': False}

def register_agent():
    """Register this device with the Ultrium dashboard"""
    payload = {
        'device_id': DEVICE_ID,
        'user_id': USER_ID,
        'name': DEVICE_NAME,
        'location': DEVICE_LOCATION,
        'ip_address': get_local_ip(),
        'agent_version': '1.0.0',
        'hailo_board_name': get_hailo_status().get('output', '')
    }
    
    response = requests.post(
        f"{API_ENDPOINT}?action=register",
        headers=HEADERS,
        json=payload,
        timeout=10
    )
    
    if response.status_code == 200:
        print(f"[+] Agent registered: {DEVICE_ID}")
        return response.json()
    else:
        print(f"[-] Registration failed: {response.text}")
        return None

def send_heartbeat():
    """Send heartbeat with current metrics"""
    metrics = get_system_metrics()
    metrics['device_id'] = DEVICE_ID
    metrics['hailo_status'] = get_hailo_status()
    
    response = requests.post(
        f"{API_ENDPOINT}?action=heartbeat",
        headers=HEADERS,
        json=metrics,
        timeout=10
    )
    
    return response.status_code == 200

def get_pending_commands():
    """Poll for pending commands from dashboard"""
    response = requests.post(
        f"{API_ENDPOINT}?action=get_commands",
        headers=HEADERS,
        json={'device_id': DEVICE_ID},
        timeout=10
    )
    
    if response.status_code == 200:
        return response.json().get('commands', [])
    return []

def execute_command(command):
    """Execute a command from the dashboard"""
    cmd_type = command['command_type']
    payload = command.get('payload', {})
    
    result = {'success': False, 'response': None, 'error_message': None}
    
    try:
        if cmd_type == 'ask':
            # Forward to local AI endpoint
            question = payload.get('question', '')
            ai_response = requests.post(
                'http://localhost:8080/ask',
                json={'question': question},
                timeout=30
            )
            result['response'] = ai_response.json()
            result['success'] = True
            
        elif cmd_type == 'scan_network':
            # Run network scan
            result['response'] = run_network_scan()
            result['success'] = True
            
        elif cmd_type == 'reboot':
            os.system('sudo reboot')
            result['success'] = True
            
        else:
            result['error_message'] = f'Unknown command: {cmd_type}'
            
    except Exception as e:
        result['error_message'] = str(e)
    
    # Report result back
    requests.post(
        f"{API_ENDPOINT}?action=command_response",
        headers=HEADERS,
        json={
            'command_id': command['id'],
            **result
        },
        timeout=10
    )
    
    return result

def get_local_ip():
    """Get the local IP address"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return '127.0.0.1'

def main():
    print(f"Vanguard Agent v1.0.0")
    print(f"Device ID: {DEVICE_ID}")
    print(f"Endpoint: {API_ENDPOINT}")
    
    # Register on startup
    register_agent()
    
    # Main loop
    while True:
        try:
            # Send heartbeat
            if send_heartbeat():
                print(f"[{datetime.now()}] Heartbeat sent")
            
            # Check for commands
            commands = get_pending_commands()
            for cmd in commands:
                print(f"[{datetime.now()}] Executing: {cmd['command_type']}")
                execute_command(cmd)
                
        except Exception as e:
            print(f"[-] Error: {e}")
        
        time.sleep(HEARTBEAT_INTERVAL)

if __name__ == '__main__':
    main()
`;

  const handleDownloadZip = async () => {
    if (!user?.id) {
      toast.error('Please log in to download the agent bundle');
      return;
    }

    setIsDownloading(true);
    try {
      const blob = await generateVanguardZip({
        userId: user.id,
        apiEndpoint: API_ENDPOINT,
        secretKey: VANGUARD_SECRET,
        deviceName: 'Vanguard-Agent',
        deviceLocation: 'Default Location',
      });

      downloadBlob(blob, 'vanguard-agent-linux.zip');
      toast.success('Linux agent bundle downloaded!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to generate download');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadWindowsZip = async () => {
    if (!user?.id) {
      toast.error('Please log in to download the agent bundle');
      return;
    }

    setIsDownloadingWindows(true);
    setWindowsDownloadProgress(0);
    setWindowsDownloadMessage('Initializing...');
    
    try {
      const blob = await generateWindowsAgentZip({
        userId: user.id,
        apiEndpoint: API_ENDPOINT,
        secretKey: VANGUARD_SECRET,
        deviceName: 'Vanguard-Windows',
        clientId: selectedClientId || undefined,
        clientName: selectedClient?.company_name,
        onProgress: (progress, message) => {
          setWindowsDownloadProgress(progress);
          setWindowsDownloadMessage(message);
        },
      });

      const filename = selectedClient 
        ? `vanguard-agent-${selectedClient.company_name.replace(/[^a-zA-Z0-9]/g, '-')}-windows.zip`
        : 'vanguard-agent-windows.zip';
      
      downloadBlob(blob, filename);
      toast.success(`Windows agent bundle downloaded${selectedClient ? ` for ${selectedClient.company_name}` : ''}!`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to generate download. The EXE may still be building.');
    } finally {
      setIsDownloadingWindows(false);
      setWindowsDownloadProgress(0);
      setWindowsDownloadMessage('');
    }
  };

  useEffect(() => {
    document.title = 'Setup Vanguard Device | Ultrium Vanguard';
  }, []);

  // Get download URL for selected OS
  const getDownloadUrl = () => {
    switch (selectedOS) {
      case 'windows':
        return AGENT_DOWNLOAD_URLS.windows;
      case 'macos':
        return AGENT_DOWNLOAD_URLS.macos;
      case 'linux':
        return AGENT_DOWNLOAD_URLS.linux;
    }
  };

  // Get installation command for selected OS
  const getInstallCommand = () => {
    const userId = user?.id || 'YOUR_USER_ID';
    const clientIdParam = selectedClientId ? ` CLIENTID="${selectedClientId}"` : '';
    
    switch (selectedOS) {
      case 'windows':
        return `# Silent install (run as Administrator)
msiexec /i VanguardAgent.msi /qn USERID="${userId}" SECRETKEY="${VANGUARD_SECRET}"${clientIdParam}

# Or interactive install
.\\VanguardAgent-Setup.exe`;
      case 'macos':
        return `# Mount and install
hdiutil attach VanguardAgent.dmg
sudo installer -pkg /Volumes/VanguardAgent/VanguardAgent.pkg -target /

# Configure the agent
sudo defaults write /Library/Preferences/com.ultriumai.vanguard userid "${userId}"
sudo defaults write /Library/Preferences/com.ultriumai.vanguard secretkey "${VANGUARD_SECRET}"${selectedClientId ? `
sudo defaults write /Library/Preferences/com.ultriumai.vanguard clientid "${selectedClientId}"` : ''}

# Start the service
sudo launchctl load /Library/LaunchDaemons/com.ultriumai.vanguard.plist`;
      case 'linux':
        return `# Extract and install
tar -xzf vanguard-agent-linux.tar.gz
cd vanguard-agent
sudo ./install.sh

# Configure the agent
sudo tee /etc/vanguard/config.yaml << EOF
ultrium_api:
  endpoint: "${API_ENDPOINT}"
  secret_key: "${VANGUARD_SECRET}"
  user_id: "${userId}"${selectedClientId ? `
  client_id: "${selectedClientId}"` : ''}
  heartbeat_interval: 30
EOF

# Start the service
sudo systemctl enable vanguard-agent
sudo systemctl start vanguard-agent`;
    }
  };

  const handleCopyDownloadLink = () => {
    const url = getDownloadUrl();
    navigator.clipboard.writeText(url);
    setCopied('download-link');
    toast.success('Download link copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCopyInstallCommand = () => {
    const command = getInstallCommand();
    navigator.clipboard.writeText(command);
    setCopied('install-command');
    toast.success('Install command copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDirectDownload = () => {
    const url = getDownloadUrl();
    window.open(url, '_blank');
    toast.success(`Downloading ${selectedOS} agent...`);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Add Device</h1>
        <p className="text-muted-foreground">
          Deploy Vanguard agents on Windows, macOS, Linux, or servers
        </p>
      </div>

        <div className="space-y-6">
          {/* Download Agent - Platform Selector */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Download Agent
              </CardTitle>
              <CardDescription>
                Select your operating system to get the correct agent installer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* OS Selection Tabs */}
              <div className="space-y-4">
                <Label className="font-medium">Operating System</Label>
                <Tabs value={selectedOS} onValueChange={(v) => setSelectedOS(v as SelectedOS)} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="windows" className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Windows
                    </TabsTrigger>
                    <TabsTrigger value="macos" className="flex items-center gap-2">
                      <Apple className="h-4 w-4" />
                      macOS
                    </TabsTrigger>
                    <TabsTrigger value="linux" className="flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      Linux
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="windows" className="mt-4">
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-green-500" />
                        <span>Windows 10/11, Server 2019+</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-green-500" />
                        <span>Windows Service integration</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-green-500" />
                        <span>MSI package for silent RMM deployment</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Badge variant="secondary">EXE</Badge>
                      <Badge variant="secondary">MSI</Badge>
                    </div>
                  </TabsContent>

                  <TabsContent value="macos" className="mt-4">
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-green-500" />
                        <span>macOS 12 Monterey and later</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-green-500" />
                        <span>Native Swift implementation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-green-500" />
                        <span>Apple Silicon and Intel support</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Badge variant="secondary">DMG</Badge>
                      <Badge variant="secondary">PKG</Badge>
                    </div>
                  </TabsContent>

                  <TabsContent value="linux" className="mt-4">
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-green-500" />
                        <span>Ubuntu 20.04+, Debian 11+, RHEL 8+</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-green-500" />
                        <span>Systemd service integration</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-green-500" />
                        <span>Network scanning & SNMP support</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Badge variant="secondary">tar.gz</Badge>
                      <Badge variant="secondary">Python</Badge>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Client Selector */}
              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <Label className="font-medium">Assign to Client (Optional)</Label>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate('/vanguard/app/customers')}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Manage Clients
                  </Button>
                </div>
                {loadingClients ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading clients...
                  </div>
                ) : clients.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No clients configured. Agent will be added to your default organization.
                  </p>
                ) : (
                  <>
                    <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a client to associate this agent with..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">
                          <span className="text-muted-foreground">No client (personal use)</span>
                        </SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.company_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedClient && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Devices will automatically appear under <span className="font-medium text-foreground">{selectedClient.company_name}</span>.
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Download Actions */}
              <div className="space-y-4">
                {/* Download Link */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Download Link</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={getDownloadUrl()} 
                      readOnly 
                      className="font-mono text-xs flex-1" 
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleCopyDownloadLink}
                      title="Copy link"
                    >
                      {copied === 'download-link' ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Download Buttons */}
                <div className="flex gap-3">
                  <Button onClick={handleDirectDownload} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download {selectedOS === 'windows' ? 'Windows' : selectedOS === 'macos' ? 'macOS' : 'Linux'} Agent
                  </Button>
                  {selectedOS === 'windows' && (
                    <Button 
                      variant="outline"
                      onClick={() => window.open(AGENT_DOWNLOAD_URLS.windowsMsi, '_blank')}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      MSI Package
                    </Button>
                  )}
                </div>
              </div>

              {/* Installation Command */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Installation Command</Label>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleCopyInstallCommand}
                  >
                    {copied === 'install-command' ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    Copy
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono whitespace-pre-wrap">
                  {getInstallCommand()}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Manual Device Registration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Manual Registration
              </CardTitle>
              <CardDescription>
                Register a device manually for testing (agent not required)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualRegister} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="deviceName">Device Name *</Label>
                    <Input
                      id="deviceName"
                      placeholder="e.g., WORKSTATION-01"
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="deviceLocation">Location</Label>
                    <Input
                      id="deviceLocation"
                      placeholder="e.g., Main Office"
                      value={deviceLocation}
                      onChange={(e) => setDeviceLocation(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="deviceIp">IP Address</Label>
                    <Input
                      id="deviceIp"
                      placeholder="e.g., 192.168.1.100"
                      value={deviceIp}
                      onChange={(e) => setDeviceIp(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" disabled={isRegistering || !deviceName}>
                  {isRegistering ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Register Device
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Connection Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Connection Details
              </CardTitle>
              <CardDescription>
                Use these credentials in your Vanguard agent configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>API Endpoint</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={API_ENDPOINT} readOnly className="font-mono text-sm" />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(API_ENDPOINT, 'Endpoint')}
                  >
                    {copied === 'Endpoint' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label>Secret Key</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={VANGUARD_SECRET} readOnly className="font-mono text-sm" />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(VANGUARD_SECRET, 'Secret')}
                  >
                    {copied === 'Secret' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label>Your User ID</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={user?.id || ''} readOnly className="font-mono text-sm" />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(user?.id || '', 'User ID')}
                  >
                    {copied === 'User ID' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration Files */}
          <Tabs defaultValue="config">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="config">config.yaml</TabsTrigger>
              <TabsTrigger value="agent">Python Agent</TabsTrigger>
            </TabsList>
            
            <TabsContent value="config">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Configuration File</CardTitle>
                      <CardDescription>
                        Save as /etc/vanguard/config.yaml on your device
                      </CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(configYaml, 'Config')}
                    >
                      {copied === 'Config' ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                      Copy
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono">
                    {configYaml}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="agent">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Python Agent Script</CardTitle>
                      <CardDescription>
                        Save as /opt/vanguard/agent.py and run as a service
                      </CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(pythonScript, 'Agent')}
                    >
                      {copied === 'Agent' ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                      Copy
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono max-h-96">
                    {pythonScript}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Quick Start */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Quick Start Commands
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 font-mono text-sm">
                <div className="bg-muted p-3 rounded">
                  <p className="text-muted-foreground mb-1"># Install dependencies</p>
                  <p>sudo pip3 install psutil pyyaml requests</p>
                </div>
                <div className="bg-muted p-3 rounded">
                  <p className="text-muted-foreground mb-1"># Create directories</p>
                  <p>sudo mkdir -p /etc/vanguard /opt/vanguard</p>
                </div>
                <div className="bg-muted p-3 rounded">
                  <p className="text-muted-foreground mb-1"># Run the agent</p>
                  <p>sudo python3 /opt/vanguard/agent.py</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}
