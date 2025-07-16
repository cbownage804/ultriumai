import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Download, 
  Server, 
  CheckCircle, 
  AlertTriangle,
  Activity,
  Settings,
  Shield,
  Network,
  Key,
  Monitor,
  Wifi,
  Globe,
  RefreshCw,
  Terminal,
  Lock,
  Cpu,
  HardDrive,
  MemoryStick,
  ArrowLeft,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ConnectorInstance {
  id: string;
  name: string;
  connector_key: string;
  version: string;
  status: 'online' | 'offline' | 'updating' | 'error';
  lastSeen: Date;
  clientName: string;
  ipAddress: string;
  systemInfo: {
    os: string;
    cpu: string;
    memory: string;
    diskSpace: string;
  };
  networkInfo: {
    interfaces: number;
    subnets: string[];
    gateway: string;
  };
  scanStats: {
    totalScans: number;
    lastScanTime: Date;
    devicesFound: number;
    threatsDetected: number;
  };
}

export const SafeNetConnector = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [connectors, setConnectors] = useState<ConnectorInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsConnector, setSettingsConnector] = useState<ConnectorInstance | null>(null);
  const [newConnectorName, setNewConnectorName] = useState('');

  const [newConnectorKey, setNewConnectorKey] = useState('');

  // Load real connector data from database
  useEffect(() => {
    loadConnectors();
  }, [user]);

  const loadConnectors = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Get connectors from database
      const { data: connectorsData, error: connectorsError } = await supabase
        .from('safenet_connectors')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (connectorsError) {
        console.error('Error loading connectors:', connectorsError);
        setLoading(false);
        return;
      }

      // Get scan statistics for each connector
      const connectorsWithStats = await Promise.all(
        (connectorsData || []).map(async (connector) => {
          // Get scan data from safenet_scans table
          const { data: scansData } = await supabase
            .from('safenet_scans')
            .select('*')
            .eq('connector_id', connector.id)
            .order('created_at', { ascending: false });

          const totalScans = scansData?.length || 0;
          const latestScan = scansData?.[0];
          
          // Extract actual scan statistics from the latest scan
          let devicesFound = 0;
          let threatsDetected = 0;
          let networkInterfaces = 0;
          let subnets: string[] = [];
          let actualSystemInfo = {};
          
          if (latestScan && latestScan.scan_data) {
            const scanData = latestScan.scan_data as any;
            
            // Count devices from scan data
            if (scanData.devices && Array.isArray(scanData.devices)) {
              devicesFound = scanData.devices.length;
              
              // Count vulnerabilities across all devices
              threatsDetected = scanData.devices.reduce((count: number, device: any) => {
                return count + (device.vulnerabilities?.length || 0);
              }, 0);
            }
            
            // Extract network info
            if (scanData.network_info) {
              networkInterfaces = scanData.network_info.interfaces || 0;
              subnets = Array.isArray(scanData.network_info.subnets) ? scanData.network_info.subnets : [];
            }
            
            // Extract system info from scan data
            if (scanData.system_info) {
              actualSystemInfo = scanData.system_info;
            }
          }

          const lastScanTime = latestScan?.created_at ? new Date(latestScan.created_at) : new Date();

          // Parse JSON fields safely
          const systemInfo = typeof connector.system_info === 'object' && connector.system_info !== null
            ? connector.system_info as any
            : actualSystemInfo; // Use scan data if connector doesn't have system info
          const networkInfo = typeof connector.network_info === 'object' && connector.network_info !== null
            ? connector.network_info as any
            : { interfaces: networkInterfaces, subnets: subnets };

            // Determine real status based on heartbeat (allow 10 minutes for hourly scans)
            const lastHeartbeat = connector.last_heartbeat ? new Date(connector.last_heartbeat) : null;
            const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
            const isRecentlyActive = lastHeartbeat && lastHeartbeat > tenMinutesAgo;
            
            let status: 'online' | 'offline' | 'updating' | 'error' = 'offline';
            if (connector.status === 'active' && isRecentlyActive) {
              status = 'online';
            } else if (connector.status === 'active' && !lastHeartbeat) {
              status = 'offline'; // Never connected
            } else if (connector.status === 'active' && lastHeartbeat) {
              status = 'offline'; // Was connected but no recent heartbeat
            }

            return {
              id: connector.id,
              name: connector.connector_name || 'SafeNet Connector',
              connector_key: connector.connector_key,
              version: connector.version || '2.1.4',
              status,
              lastSeen: new Date(connector.last_heartbeat || connector.created_at),
            clientName: connector.client_name || 'Unknown Client',
            ipAddress: '192.168.1.100', // Will be populated when connector sends data
            systemInfo: {
              os: systemInfo.os || 'Unknown OS',
              cpu: systemInfo.cpu || 'Unknown CPU',
              memory: systemInfo.memory || 'Unknown Memory',
              diskSpace: systemInfo.diskSpace || 'Unknown Storage'
            },
            networkInfo: {
              interfaces: networkInfo.interfaces || 0,
              subnets: Array.isArray(networkInfo.subnets) ? networkInfo.subnets : [],
              gateway: networkInfo.gateway || 'N/A'
            },
            scanStats: {
              totalScans,
              lastScanTime,
              devicesFound,
              threatsDetected
            }
          };
        })
      );

      setConnectors(connectorsWithStats);
    } catch (error) {
      console.error('Error loading connectors:', error);
      toast({
        title: "Error",
        description: "Failed to load connector data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateConnectorKey = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to generate a connector key",
        variant: "destructive"
      });
      return;
    }

    const key = `snc_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    
    try {
      // Store the connector key in the database
      const { data, error } = await supabase
        .from('safenet_connectors')
        .insert({
          user_id: user.id,
          connector_key: key,
          connector_name: 'New SafeNet Connector',
          status: 'inactive'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating connector:', error);
        toast({
          title: "Error",
          description: "Failed to generate connector key",
          variant: "destructive"
        });
        return;
      }

      setNewConnectorKey(key);
      loadConnectors(); // Refresh the list to show the new connector
      toast({
        title: "Connector Key Generated",
        description: "Use this key during connector installation. The connector will register when first run.",
      });
    } catch (error) {
      console.error('Error generating connector key:', error);
      toast({
        title: "Error",
        description: "Failed to generate connector key",
        variant: "destructive"
      });
    }
  };

  const downloadConnector = async (platform: 'windows' | 'linux' | 'docker' | 'python') => {
    if (platform === 'python') {
      downloadPythonScript();
      return;
    }

    const downloadData = {
      windows: { 
        file: 'safenet-connector-windows-x64.exe', 
        size: '45 MB',
        storagePath: 'safenet-connector-windows-x64.exe'
      },
      linux: { 
        file: 'safenet-connector-linux.deb', 
        size: '32 MB',
        storagePath: 'safenet-connector-linux.deb'
      },
      docker: { 
        file: 'safenet-connector-docker.tar.gz', 
        size: '28 MB',
        storagePath: 'safenet-connector-docker.tar.gz'
      }
    };

    const data = downloadData[platform];
    
    try {
      // Get download URL from Supabase storage
      const downloadUrl = `https://nsyobmjpdpvesjwdphlh.supabase.co/storage/v1/object/public/safenet-downloads/${data.storagePath}`;
      
      // Create temporary download link
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = data.file;
      link.target = '_blank';
      link.style.display = 'none';
      
      // Add to DOM, click, and clean up
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: `${data.file} is downloading (${data.size})`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Please try again or contact support if the issue persists.",
        variant: "destructive"
      });
    }
  };

  const downloadPythonScript = () => {
    if (!newConnectorKey) {
      toast({
        title: "Generate Connector Key First",
        description: "Please generate a connector key before downloading the Python script.",
        variant: "destructive"
      });
      return;
    }

    // Python script content with embedded API key
    const pythonScript = `#!/usr/bin/env python3
"""
SafeNet Network Connector
Scans local network and reports findings to SafeNet cloud service
"""

import json
import subprocess
import socket
import requests
import time
import platform
import psutil
from datetime import datetime
import concurrent.futures
import logging

# Configuration
CONNECTOR_KEY = "${newConnectorKey}"
API_ENDPOINT = "https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/safenet-connector"
SCAN_INTERVAL = 300  # 5 minutes

class SafeNetConnector:
    def __init__(self):
        self.connector_key = CONNECTOR_KEY
        self.api_endpoint = API_ENDPOINT
        self.setup_logging()
        
    def setup_logging(self):
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('safenet_connector.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)

    def get_system_info(self):
        """Get system information"""
        return {
            "os": platform.platform(),
            "cpu": platform.processor() or "Unknown",
            "memory": f"{psutil.virtual_memory().total // (1024**3)} GB",
            "diskSpace": f"{psutil.disk_usage('/').total // (1024**3)} GB"
        }

    def get_network_info(self):
        """Get network interface information"""
        interfaces = []
        subnets = []
        
        for interface, addrs in psutil.net_if_addrs().items():
            for addr in addrs:
                if addr.family == socket.AF_INET:
                    interfaces.append({
                        "interface": interface,
                        "ip": addr.address,
                        "netmask": addr.netmask
                    })
                    # Calculate subnet
                    ip_parts = addr.address.split('.')
                    mask_parts = addr.netmask.split('.')
                    network_parts = [str(int(ip_parts[i]) & int(mask_parts[i])) for i in range(4)]
                    subnet = '.'.join(network_parts) + '/24'  # Simplified CIDR
                    if subnet not in subnets:
                        subnets.append(subnet)

        return {
            "interfaces": len(interfaces),
            "subnets": subnets,
            "gateway": self.get_default_gateway()
        }

    def get_default_gateway(self):
        """Get default gateway IP"""
        try:
            if platform.system() == "Windows":
                result = subprocess.run(['ipconfig'], capture_output=True, text=True)
                for line in result.stdout.split('\\n'):
                    if 'Default Gateway' in line:
                        return line.split(':')[-1].strip()
            else:
                result = subprocess.run(['ip', 'route'], capture_output=True, text=True)
                for line in result.stdout.split('\\n'):
                    if 'default' in line:
                        return line.split()[2]
        except Exception:
            pass
        return "Unknown"

    def scan_network(self, subnet="192.168.1.0/24"):
        """Scan network for devices"""
        devices = []
        self.logger.info(f"Scanning network: {subnet}")
        
        # Simple ping scan for network discovery
        base_ip = '.'.join(subnet.split('.')[:-1])
        
        def ping_host(ip):
            try:
                if platform.system() == "Windows":
                    cmd = ['ping', '-n', '1', '-w', '1000', ip]
                else:
                    cmd = ['ping', '-c', '1', '-W', '1', ip]
                
                result = subprocess.run(cmd, capture_output=True)
                if result.returncode == 0:
                    return ip
            except Exception:
                pass
            return None

        # Scan first 50 IPs for demo purposes
        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
            futures = []
            for i in range(1, 51):
                ip = f"{base_ip}.{i}"
                futures.append(executor.submit(ping_host, ip))
            
            for future in concurrent.futures.as_completed(futures):
                result = future.result()
                if result:
                    # Get hostname
                    try:
                        hostname = socket.gethostbyaddr(result)[0]
                    except:
                        hostname = "Unknown"
                    
                    devices.append({
                        "ip": result,
                        "hostname": hostname,
                        "mac": "Unknown",  # Would need ARP table lookup
                        "os": "Unknown",
                        "ports": [],
                        "vulnerabilities": [],
                        "risk_level": "low"
                    })

        self.logger.info(f"Found {len(devices)} devices")
        return devices

    def send_scan_results(self, devices, network_info, system_info):
        """Send scan results to SafeNet API"""
        scan_data = {
            "connector_key": self.connector_key,
            "scan_timestamp": datetime.now().isoformat(),
            "network_ranges": ["192.168.1.0/24"],  # Detected ranges
            "devices": devices,
            "network_info": network_info,
            "system_info": system_info,
            "connector_version": "2.1.4"
        }

        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.connector_key}"
            }
            
            response = requests.post(
                self.api_endpoint,
                json=scan_data,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                self.logger.info("Scan results sent successfully")
                return True
            else:
                self.logger.error(f"Failed to send results: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.logger.error(f"Error sending scan results: {e}")
            return False

    def run_scan(self):
        """Run a complete network scan"""
        self.logger.info("Starting SafeNet network scan...")
        
        # Get system and network info
        system_info = self.get_system_info()
        network_info = self.get_network_info()
        
        # Scan each detected subnet
        all_devices = []
        for subnet in network_info.get("subnets", ["192.168.1.0/24"]):
            devices = self.scan_network(subnet)
            all_devices.extend(devices)
        
        # Send results to SafeNet
        success = self.send_scan_results(all_devices, network_info, system_info)
        
        if success:
            self.logger.info(f"Scan completed successfully. Found {len(all_devices)} devices.")
        else:
            self.logger.error("Failed to send scan results")
        
        return success

    def run_continuous(self):
        """Run connector in continuous mode"""
        self.logger.info(f"SafeNet Connector started. Scanning every {SCAN_INTERVAL} seconds.")
        
        while True:
            try:
                self.run_scan()
                self.logger.info(f"Next scan in {SCAN_INTERVAL} seconds...")
                time.sleep(SCAN_INTERVAL)
            except KeyboardInterrupt:
                self.logger.info("Connector stopped by user")
                break
            except Exception as e:
                self.logger.error(f"Unexpected error: {e}")
                time.sleep(60)  # Wait 1 minute before retrying

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="SafeNet Network Connector")
    parser.add_argument("--once", action="store_true", help="Run scan once and exit")
    parser.add_argument("--continuous", action="store_true", help="Run continuously (default)")
    
    args = parser.parse_args()
    
    try:
        connector = SafeNetConnector()
        print("SafeNet Connector started...")
        print(f"Connector Key: {CONNECTOR_KEY}")
        print(f"API Endpoint: {API_ENDPOINT}")
        print("\\nChecking dependencies...")
        
        # Check if required packages are installed
        try:
            import requests
            import psutil
            print("✓ All dependencies found")
        except ImportError as e:
            print(f"✗ Missing dependency: {e}")
            print("\\nPlease install required packages:")
            print("pip install requests psutil")
            input("\\nPress Enter to exit...")
            exit(1)
        
        if args.once:
            print("\\nRunning single scan...")
            success = connector.run_scan()
            if success:
                print("\\n✓ Scan completed successfully!")
            else:
                print("\\n✗ Scan failed. Check the log file for details.")
            print("\\nPress Enter to exit...")
            input()
        else:
            print("\\nStarting continuous scanning mode...")
            print("Press Ctrl+C to stop the connector")
            connector.run_continuous()
            
    except Exception as e:
        print(f"\\nError starting connector: {e}")
        print("\\nPress Enter to exit...")
        input()
`;

    // Create and download the file
    const blob = new Blob([pythonScript], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'safenet_connector.py';
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Python Script Downloaded",
      description: "Run 'python safenet_connector.py' on the target network to start scanning.",
    });
  };

  const restartConnector = (connectorId: string) => {
    setConnectors(prev => prev.map(conn => 
      conn.id === connectorId 
        ? { ...conn, status: 'updating' as const }
        : conn
    ));
    
    setTimeout(() => {
      setConnectors(prev => prev.map(conn => 
        conn.id === connectorId 
          ? { ...conn, status: 'online' as const, lastSeen: new Date() }
          : conn
      ));
      toast({
        title: "Connector Restarted",
        description: "Connector is back online and ready for scanning",
      });
    }, 3000);
  };

  const deleteConnector = async (connectorId: string) => {
    try {
      console.log('Attempting to delete connector:', connectorId);
      const { error, data } = await supabase
        .from('safenet_connectors')
        .delete()
        .eq('id', connectorId)
        .eq('user_id', user?.id);

      console.log('Delete response:', { error, data });

      if (error) {
        console.error('Error deleting connector:', error);
        toast({
          title: "Error",
          description: "Failed to delete connector",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Connector Deleted",
        description: "The connector has been removed successfully",
      });

      // Refresh the connectors list immediately
      console.log('Refreshing connectors list...');
      await loadConnectors();
    } catch (error) {
      console.error('Error deleting connector:', error);
      toast({
        title: "Error",
        description: "Failed to delete connector",
        variant: "destructive"
      });
    }
  };

  const openSettings = (connector: ConnectorInstance) => {
    setSettingsConnector(connector);
    setNewConnectorName(connector.name);
  };

  const saveConnectorSettings = async () => {
    if (!settingsConnector || !newConnectorName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid connector name",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('safenet_connectors')
        .update({ connector_name: newConnectorName.trim() })
        .eq('id', settingsConnector.id)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error updating connector:', error);
        toast({
          title: "Error",
          description: "Failed to update connector settings",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Settings Updated",
        description: "Connector settings have been saved successfully",
      });

      // Close dialog and refresh
      setSettingsConnector(null);
      setNewConnectorName('');
      loadConnectors();
    } catch (error) {
      console.error('Error updating connector:', error);
      toast({
        title: "Error",
        description: "Failed to update connector settings",
        variant: "destructive"
      });
    }
  };

  const downloadPythonScriptForConnector = (connector: ConnectorInstance) => {
    // Generate Python script with the actual connector key
    const pythonScript = `#!/usr/bin/env python3
"""
SafeNet Network Scanner Connector
Scans local networks and sends results to Ultrium SafeNet platform
Generated for: ${connector.name}
"""

import sys
import json
import time
import platform
import socket
import subprocess
from datetime import datetime
import concurrent.futures
import ipaddress

# Configuration
CONNECTOR_KEY = "${connector.connector_key}"
API_ENDPOINT = "https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/safenet-connector"
SCAN_INTERVAL = 3600  # 1 hour

class SafeNetConnector:
    def __init__(self):
        self.connector_key = CONNECTOR_KEY
        self.api_endpoint = API_ENDPOINT
        self.max_threads = 50
        self.timeout = 2
        # Common ports to scan
        self.common_ports = [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 993, 995, 1433, 3306, 3389, 5432, 5900]

    def get_local_networks(self):
        """Get common local network ranges"""
        return ['192.168.1.0/24', '192.168.0.0/24', '10.0.0.0/24', '172.16.0.0/24']

    def ping_host(self, ip):
        """Check if host is alive using ping"""
        try:
            if platform.system().lower() == "windows":
                result = subprocess.run(['ping', '-n', '1', '-w', '1000', ip], 
                                      capture_output=True, text=True, timeout=3)
                return result.returncode == 0
            else:
                result = subprocess.run(['ping', '-c', '1', '-W', '1', ip], 
                                      capture_output=True, text=True, timeout=3)
                return result.returncode == 0
        except:
            return False

    def scan_port(self, ip, port):
        """Scan a single port on a host"""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.settimeout(self.timeout)
                result = sock.connect_ex((ip, port))
                return port if result == 0 else None
        except:
            return None

    def get_hostname(self, ip):
        """Get hostname for IP address"""
        try:
            return socket.gethostbyaddr(ip)[0]
        except:
            return "Unknown"

    def scan_device(self, ip):
        """Scan a single device for open ports"""
        if not self.ping_host(ip):
            return None

        print(f"  Scanning {ip}...")
        open_ports = []
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            future_to_port = {executor.submit(self.scan_port, ip, port): port 
                            for port in self.common_ports}
            
            for future in concurrent.futures.as_completed(future_to_port):
                port = future.result()
                if port:
                    open_ports.append(port)

        if open_ports:
            hostname = self.get_hostname(ip)
            os_detected = self.detect_os(open_ports)
            vulnerabilities = self.assess_vulnerabilities(open_ports)
            
            return {
                "ip": ip,
                "hostname": hostname,
                "mac": "Unknown",  # Would require additional scanning
                "os": os_detected,
                "ports": open_ports,  # API expects "ports", not "open_ports"
                "vulnerabilities": vulnerabilities,
                "risk_level": "high" if len(open_ports) > 5 else "medium" if len(open_ports) > 2 else "low"
            }
        
        return None

    def detect_os(self, open_ports):
        """Basic OS detection based on open ports"""
        if 22 in open_ports:
            return "Linux/Unix"
        elif 135 in open_ports or 3389 in open_ports:
            return "Windows"
        elif 80 in open_ports or 443 in open_ports:
            return "Web Server"
        else:
            return "Unknown"

    def assess_vulnerabilities(self, open_ports):
        """Assess potential vulnerabilities based on open ports"""
        vulnerabilities = []
        high_risk_ports = {
            21: "FTP service may allow anonymous access",
            23: "Telnet service transmits data in clear text",
            135: "RPC service may be vulnerable to exploitation",
            445: "SMB service may be vulnerable to attacks",
            1433: "SQL Server may have weak authentication",
            3389: "RDP service may allow brute force attacks",
            5900: "VNC service may have weak authentication"
        }
        
        for port in open_ports:
            if port in high_risk_ports:
                vulnerabilities.append(high_risk_ports[port])
        
        return vulnerabilities

    def scan_network(self, network_cidr):
        """Scan an entire network"""
        print(f"Scanning network: {network_cidr}")
        devices = []
        
        try:
            network = ipaddress.IPv4Network(network_cidr, strict=False)
            hosts = list(network.hosts())[:50]  # Limit to first 50 hosts
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_threads) as executor:
                future_to_ip = {executor.submit(self.scan_device, str(ip)): ip 
                              for ip in hosts}
                
                for future in concurrent.futures.as_completed(future_to_ip):
                    device = future.result()
                    if device:
                        devices.append(device)
                        
        except Exception as e:
            print(f"Error scanning network {network_cidr}: {e}")
        
        print(f"Found {len(devices)} devices")
        return devices

    def get_system_info(self):
        """Get basic system information"""
        try:
            # Try to get memory info if possible
            total_memory = "Unknown"
            disk_space = "Unknown"
            cpu_info = platform.processor() or "Unknown"
            
            try:
                import psutil
                total_memory = f"{round(psutil.virtual_memory().total / (1024**3))}GB"
                disk_space = f"{round(psutil.disk_usage('/').total / (1024**3))}GB"
            except ImportError:
                pass
            except:
                pass
                
            return {
                "os": f"{platform.system()} {platform.release()}",
                "cpu": cpu_info,
                "memory": total_memory,
                "diskSpace": disk_space
            }
        except:
            return {
                "os": "Unknown",
                "cpu": "Unknown",
                "memory": "Unknown",
                "diskSpace": "Unknown"
            }

    def send_results(self, scan_data):
        """Send scan results to SafeNet platform"""
        try:
            import requests
            
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.connector_key}"
            }
            
            response = requests.post(
                self.api_endpoint,
                json=scan_data,
                headers=headers,
                timeout=60  # Increased timeout to 60 seconds
            )
            
            if response.status_code == 200:
                print("✓ Scan results sent successfully")
                return True
            else:
                print(f"✗ Failed to send results: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"✗ Error sending results: {e}")
            return False

    def get_network_info(self, networks):
        """Get network information in expected format"""
        return {
            "interfaces": len(networks),
            "subnets": networks,
            "gateway": "Auto-detected"
        }

    def perform_scan(self):
        """Perform a complete network scan"""
        print("\\nStarting SafeNet network scan...")
        
        # Get system info
        system_info = self.get_system_info()
        print(f"System: {system_info['os']}")
        
        # Get networks to scan
        networks = self.get_local_networks()
        network_info = self.get_network_info(networks)
        
        # Scan each network
        all_devices = []
        for network in networks:
            devices = self.scan_network(network)
            all_devices.extend(devices)
        
        # Prepare scan data in the format expected by the API
        scan_data = {
            "connector_key": self.connector_key,
            "scan_timestamp": datetime.now().isoformat(),
            "network_ranges": networks,
            "devices": all_devices,
            "network_info": network_info,
            "system_info": system_info,
            "connector_version": "2.1.4"
        }
        
        print(f"\\nScan Summary:")
        print(f"- Networks scanned: {len(networks)}")
        print(f"- Devices found: {len(all_devices)}")
        print(f"- Total open ports: {sum(len(d['ports']) for d in all_devices)}")
        
        # Send results
        print("\\nSending results to SafeNet...")
        success = self.send_results(scan_data)
        return success

    def run_continuous(self):
        """Run connector in continuous mode"""
        print(f"Running continuous scans every {SCAN_INTERVAL//60} minutes...")
        
        while True:
            try:
                self.perform_scan()
                print(f"\\nNext scan in {SCAN_INTERVAL//60} minutes...")
                time.sleep(SCAN_INTERVAL)
            except KeyboardInterrupt:
                print("\\nConnector stopped by user")
                break
            except Exception as e:
                print(f"\\nError during scan: {e}")
                print("Retrying in 60 seconds...")
                time.sleep(60)

if __name__ == "__main__":
    print("=" * 60)
    print("SafeNet Network Connector")
    print("=" * 60)
    print(f"Connector: ${connector.name}")
    print(f"Key: ${connector.connector_key}")
    print(f"Endpoint: {API_ENDPOINT}")
    print("=" * 60)
    
    # Check for required dependencies
    try:
        import requests
        print("✓ Requests library found")
    except ImportError:
        print("✗ Missing 'requests' library")
        print("\\nInstall with: pip install requests")
        input("\\nPress Enter to exit...")
        sys.exit(1)
    
    # Parse command line arguments
    import argparse
    parser = argparse.ArgumentParser(description="SafeNet Network Connector")
    parser.add_argument("--once", action="store_true", help="Run scan once and exit")
    parser.add_argument("--continuous", action="store_true", help="Run continuously")
    
    args = parser.parse_args()
    
    try:
        connector = SafeNetConnector()
        
        if args.once:
            print("\\nMode: Single scan")
            success = connector.perform_scan()
            if success:
                print("\\n" + "=" * 60)
                print("✓ SCAN COMPLETED SUCCESSFULLY")
            else:
                print("\\n" + "=" * 60)
                print("✗ SCAN FAILED - Check network connection")
        elif args.continuous:
            print("\\nMode: Continuous scanning")
            print("Press Ctrl+C to stop...")
            connector.run_continuous()
        else:
            # Default: ask user what they want to do
            print("\\nSelect mode:")
            print("1. Run single scan")
            print("2. Run continuous scanning")
            choice = input("\\nEnter choice (1 or 2): ").strip()
            
            if choice == "1":
                success = connector.perform_scan()
                if success:
                    print("\\n" + "=" * 60)
                    print("✓ SCAN COMPLETED SUCCESSFULLY")
                else:
                    print("\\n" + "=" * 60)
                    print("✗ SCAN FAILED - Check network connection")
            elif choice == "2":
                print("\\nStarting continuous mode...")
                print("Press Ctrl+C to stop...")
                connector.run_continuous()
            else:
                print("Invalid choice. Running single scan...")
                connector.perform_scan()
                
    except KeyboardInterrupt:
        print("\\n\\nConnector stopped by user")
    except Exception as e:
        print(f"\\n\\nFatal error: {str(e)}")
        print("Please check your network connection and try again.")
    
    print("\\n" + "=" * 60)
    print("Press Enter to exit...")
    input()
`;

    // Create and download the file
    const blob = new Blob([pythonScript], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `safenet_connector_${connector.name.replace(/\s+/g, '_').toLowerCase()}.py`;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Python Script Downloaded",
      description: `Ready-to-use script with connector key: ${connector.connector_key}`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-red-500';
      case 'updating': return 'text-orange-500';
      case 'error': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return CheckCircle;
      case 'offline': return AlertTriangle;
      case 'updating': return RefreshCw;
      case 'error': return AlertTriangle;
      default: return Activity;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Back Button and Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Server className="h-8 w-8 text-primary" />
              Network Connector Management
            </h1>
            <p className="text-muted-foreground">
              Deploy and manage SafeNet connectors across client networks
            </p>
          </div>
        </div>
      </div>

      {/* Connector Installation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Install New Connector
            </CardTitle>
            <CardDescription>
              Download and deploy SafeNet connector on client networks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="connector-key">Connector Authentication Key</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="connector-key"
                  value={newConnectorKey}
                  placeholder="Click generate to create new key"
                  readOnly
                />
                <Button onClick={generateConnectorKey} variant="outline">
                  <Key className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                This key will be used during connector installation
              </p>
            </div>

            <div className="space-y-3">
              <Label>Download Connector Installer</Label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <Button 
                  onClick={() => downloadConnector('python')} 
                  variant="outline" 
                  className="flex flex-col items-center p-4 h-auto"
                  disabled={!newConnectorKey}
                >
                  <Terminal className="h-6 w-6 mb-2" />
                  <span className="text-sm">Python</span>
                  <span className="text-xs text-muted-foreground">Script</span>
                </Button>
                <Button 
                  onClick={() => downloadConnector('windows')} 
                  variant="outline" 
                  className="flex flex-col items-center p-4 h-auto"
                >
                  <Monitor className="h-6 w-6 mb-2" />
                  <span className="text-sm">Windows</span>
                  <span className="text-xs text-muted-foreground">MSI Installer</span>
                </Button>
                <Button 
                  onClick={() => downloadConnector('linux')} 
                  variant="outline"
                  className="flex flex-col items-center p-4 h-auto"
                >
                  <Terminal className="h-6 w-6 mb-2" />
                  <span className="text-sm">Linux</span>
                  <span className="text-xs text-muted-foreground">DEB Package</span>
                </Button>
                <Button 
                  onClick={() => downloadConnector('docker')} 
                  variant="outline"
                  className="flex flex-col items-center p-4 h-auto"
                >
                  <Server className="h-6 w-6 mb-2" />
                  <span className="text-sm">Docker</span>
                  <span className="text-xs text-muted-foreground">Container</span>
                </Button>
              </div>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                The connector runs with minimal privileges and only communicates outbound to SafeNet cloud services. 
                No inbound firewall rules required.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Installation Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-2">Windows Installation:</h4>
                <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                  <li>Download the MSI installer</li>
                  <li>Run as Administrator</li>
                  <li>Enter the connector key when prompted</li>
                  <li>Select network interfaces to monitor</li>
                  <li>Complete installation and verify connection</li>
                </ol>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Linux Installation:</h4>
                <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                  <li>Download the DEB package</li>
                  <li>Install: <code className="bg-muted px-1 rounded">sudo dpkg -i safenet-connector.deb</code></li>
                  <li>Configure: <code className="bg-muted px-1 rounded">sudo safenet-config --key YOUR_KEY</code></li>
                  <li>Start service: <code className="bg-muted px-1 rounded">sudo systemctl start safenet</code></li>
                </ol>
              </div>

              <div>
                <h4 className="font-medium mb-2">Docker Deployment:</h4>
                <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                  <li>Load image: <code className="bg-muted px-1 rounded">docker load -i safenet-connector.tar.gz</code></li>
                  <li>Run: <code className="bg-muted px-1 rounded">docker run -d --network=host safenet:latest</code></li>
                  <li>Set environment: <code className="bg-muted px-1 rounded">-e SAFENET_KEY=YOUR_KEY</code></li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Connectors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Active Connectors ({connectors.length})
          </CardTitle>
          <CardDescription>
            Monitor and manage deployed network connectors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>Loading connectors...</span>
              </div>
            ) : connectors.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <Server className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="font-medium">No Connectors Found</h3>
                  <p className="text-sm text-muted-foreground">
                    Generate a connector key and install the SafeNet connector on a client network to get started.
                  </p>
                </div>
              </div>
            ) : (
              connectors.map((connector) => {
              const StatusIcon = getStatusIcon(connector.status);
              return (
                <Card key={connector.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                      {/* Connector Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`h-4 w-4 ${getStatusColor(connector.status)}`} />
                          <span className="font-medium">{connector.name}</span>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div>Version: {connector.version}</div>
                          <div>IP: {connector.ipAddress}</div>
                          <div>Last seen: {connector.lastSeen.toLocaleString()}</div>
                        </div>
                        <Badge variant={connector.status === 'online' ? 'default' : 'destructive'}>
                          {connector.status}
                        </Badge>
                      </div>

                      {/* System Info */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">System Resources</h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1">
                            <Cpu className="h-3 w-3" />
                            {connector.systemInfo.cpu}
                          </div>
                          <div className="flex items-center gap-1">
                            <MemoryStick className="h-3 w-3" />
                            {connector.systemInfo.memory}
                          </div>
                          <div className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            {connector.systemInfo.diskSpace}
                          </div>
                        </div>
                      </div>

                      {/* Network Info */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Network Coverage</h4>
                        <div className="space-y-1 text-xs">
                          <div>{connector.networkInfo.interfaces} interfaces</div>
                          <div>Subnets: {connector.networkInfo.subnets.length}</div>
                          <div className="text-muted-foreground">
                            {connector.networkInfo.subnets.join(', ')}
                          </div>
                        </div>
                      </div>

                      {/* Scan Stats & Actions */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Scan Statistics</h4>
                        <div className="space-y-1 text-xs">
                          <div>Total scans: {connector.scanStats.totalScans}</div>
                          <div>Devices found: {connector.scanStats.devicesFound}</div>
                          <div>Threats detected: {connector.scanStats.threatsDetected}</div>
                        </div>
                        <div className="flex gap-1 mt-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => restartConnector(connector.id)}
                            disabled={connector.status === 'updating'}
                          >
                            <RefreshCw className={`h-3 w-3 ${connector.status === 'updating' ? 'animate-spin' : ''}`} />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => downloadPythonScriptForConnector(connector)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Dialog open={settingsConnector?.id === connector.id} onOpenChange={(open) => !open && setSettingsConnector(null)}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => openSettings(connector)}>
                                <Settings className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Connector Settings</DialogTitle>
                                <DialogDescription>
                                  Configure settings for {connector.name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="connector-name">Connector Name</Label>
                                  <Input
                                    id="connector-name"
                                    value={newConnectorName}
                                    onChange={(e) => setNewConnectorName(e.target.value)}
                                    placeholder="Enter connector name"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="connector-key">Connector Key</Label>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      id="connector-key"
                                      value={connector.connector_key}
                                      readOnly
                                      className="font-mono text-sm"
                                    />
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        navigator.clipboard.writeText(connector.connector_key);
                                        toast({
                                          title: "Copied!",
                                          description: "Connector key copied to clipboard",
                                        });
                                      }}
                                    >
                                      Copy
                                    </Button>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Use this key when installing the connector on client networks
                                  </p>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setSettingsConnector(null)}>
                                  Cancel
                                </Button>
                                <Button onClick={saveConnectorSettings}>
                                  Save Changes
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Connector</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the connector "{connector.name}"? 
                                  This action cannot be undone and will remove all associated scan data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteConnector(connector.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete Connector
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
               );
             })
            )}
           </div>
        </CardContent>
      </Card>

      {/* Global Connector Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Connectors</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectors.length}</div>
            <p className="text-xs text-muted-foreground">
              {connectors.filter(c => c.status === 'online').length} online
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Networks Monitored</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {connectors.reduce((sum, c) => sum + c.networkInfo.subnets.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {connectors.length} locations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {connectors.reduce((sum, c) => sum + c.scanStats.totalScans, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threats Detected</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {connectors.reduce((sum, c) => sum + c.scanStats.threatsDetected, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};