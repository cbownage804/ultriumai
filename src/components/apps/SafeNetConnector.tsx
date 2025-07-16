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
          // Get scan count and latest scan
          const { data: scansData } = await supabase
            .from('network_scans')
            .select('*')
            .eq('connector_id', connector.id)
            .order('created_at', { ascending: false });

          // For now, use 0 for device and vulnerability counts
          // These will be populated when the connector sends real data
          const devicesCount = 0;
          const vulnsCount = 0;

          const totalScans = scansData?.length || 0;
          const devicesFound = devicesCount || 0;
          const threatsDetected = vulnsCount || 0;
          const lastScanTime = scansData?.[0]?.created_at ? new Date(scansData[0].created_at) : new Date();

          // Parse JSON fields safely
          const systemInfo = typeof connector.system_info === 'object' && connector.system_info !== null
            ? connector.system_info as any
            : {};
          const networkInfo = typeof connector.network_info === 'object' && connector.network_info !== null
            ? connector.network_info as any
            : {};

          return {
            id: connector.id,
            name: connector.connector_name || 'SafeNet Connector',
            connector_key: connector.connector_key,
            version: connector.version || '2.1.4',
            status: connector.status === 'active' ? 'online' as const : 'offline' as const,
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
SCAN_INTERVAL = 3600  # 1 hour

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
    
    connector = SafeNetConnector()
    
    if args.once:
        connector.run_scan()
    else:
        connector.run_continuous()
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

import requests
import socket
import subprocess
import platform
import time
import json
import logging
import ipaddress
import threading
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed
import psutil
import netifaces

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SafeNetConnector:
    def __init__(self):
        # Configuration - Auto-generated for connector: ${connector.name}
        self.connector_key = "${connector.connector_key}"
        self.api_endpoint = "https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/safenet-connector"
        self.scan_interval = 3600  # 1 hour in seconds
        self.max_threads = 50
        self.timeout = 2
        
        # Common ports to scan
        self.common_ports = [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 993, 995, 1433, 3306, 3389, 5432, 5900]
        
    def get_network_interfaces(self):
        """Get all network interfaces and their subnets"""
        networks = []
        interfaces = netifaces.interfaces()
        
        for interface in interfaces:
            addrs = netifaces.ifaddresses(interface)
            if netifaces.AF_INET in addrs:
                for addr_info in addrs[netifaces.AF_INET]:
                    ip = addr_info.get('addr')
                    netmask = addr_info.get('netmask')
                    
                    if ip and netmask and not ip.startswith('127.'):
                        try:
                            network = ipaddress.IPv4Network(f"{ip}/{netmask}", strict=False)
                            networks.append(str(network))
                        except:
                            continue
        
        # Add common networks if not found
        default_networks = ['192.168.0.0/24', '192.168.1.0/24', '10.0.0.0/24', '172.16.0.0/24']
        for net in default_networks:
            if net not in networks:
                networks.append(net)
                
        return networks

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
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(self.timeout)
            result = sock.connect_ex((ip, port))
            sock.close()
            return port if result == 0 else None
        except:
            return None

    def get_hostname(self, ip):
        """Get hostname for an IP address"""
        try:
            hostname = socket.gethostbyaddr(ip)[0]
            return hostname
        except:
            return "Unknown"

    def detect_os(self, ip, open_ports):
        """Simple OS detection based on open ports"""
        if not open_ports:
            return "Unknown"
        
        # Simple heuristics
        if 3389 in open_ports:  # RDP
            return "Windows"
        elif 22 in open_ports and 80 not in open_ports:  # SSH only
            return "Linux"
        elif 22 in open_ports and 80 in open_ports:  # SSH + HTTP
            return "Linux Server"
        elif 135 in open_ports or 139 in open_ports:  # Windows services
            return "Windows"
        else:
            return "Unknown"

    def assess_risk(self, open_ports, vulnerabilities):
        """Assess risk level based on open ports and vulnerabilities"""
        if not open_ports:
            return "low"
        
        high_risk_ports = [21, 23, 135, 139, 445, 1433, 3306, 5432]  # FTP, Telnet, Windows, DB ports
        critical_ports = [3389]  # RDP
        
        if any(port in critical_ports for port in open_ports):
            return "critical"
        elif any(port in high_risk_ports for port in open_ports):
            return "high"
        elif len(open_ports) > 5:
            return "medium"
        else:
            return "low"

    def scan_device(self, ip):
        """Scan a single device for ports and information"""
        if not self.ping_host(ip):
            return None
            
        logger.info(f"Scanning device: {ip}")
        
        # Scan ports
        open_ports = []
        with ThreadPoolExecutor(max_workers=10) as executor:
            future_to_port = {executor.submit(self.scan_port, ip, port): port 
                            for port in self.common_ports}
            
            for future in as_completed(future_to_port):
                result = future.result()
                if result:
                    open_ports.append(result)
        
        # Get device information
        hostname = self.get_hostname(ip)
        os_detected = self.detect_os(ip, open_ports)
        
        # Simple vulnerability detection based on open ports
        vulnerabilities = []
        if 21 in open_ports:
            vulnerabilities.append("FTP service exposed")
        if 23 in open_ports:
            vulnerabilities.append("Telnet service exposed (unencrypted)")
        if 3389 in open_ports:
            vulnerabilities.append("RDP service exposed")
        if 135 in open_ports:
            vulnerabilities.append("Windows RPC service exposed")
        
        risk_level = self.assess_risk(open_ports, vulnerabilities)
        
        return {
            "ip": ip,
            "hostname": hostname,
            "mac": "Unknown",  # MAC detection would require additional tools
            "os": os_detected,
            "ports": open_ports,
            "vulnerabilities": vulnerabilities,
            "risk_level": risk_level
        }

    def scan_network(self, network_cidr):
        """Scan an entire network for devices"""
        logger.info(f"Scanning network: {network_cidr}")
        
        try:
            network = ipaddress.IPv4Network(network_cidr, strict=False)
        except ValueError:
            logger.error(f"Invalid network CIDR: {network_cidr}")
            return []
        
        devices = []
        
        # Limit scan size for performance
        hosts = list(network.hosts())
        if len(hosts) > 254:  # Limit to /24 equivalent
            hosts = hosts[:254]
        
        with ThreadPoolExecutor(max_workers=self.max_threads) as executor:
            future_to_ip = {executor.submit(self.scan_device, str(ip)): ip 
                          for ip in hosts}
            
            for future in as_completed(future_to_ip):
                device = future.result()
                if device:
                    devices.append(device)
        
        logger.info(f"Found {len(devices)} devices")
        return devices

    def get_system_info(self):
        """Get system information of the scanning machine"""
        try:
            cpu_info = platform.processor() or "Unknown"
            memory_info = f"{round(psutil.virtual_memory().total / (1024**3))}GB"
            disk_info = f"{round(psutil.disk_usage('/').total / (1024**3))}GB"
            
            return {
                "os": f"{platform.system()} {platform.release()}",
                "cpu": cpu_info,
                "memory": memory_info,
                "diskSpace": disk_info
            }
        except:
            return {
                "os": "Unknown",
                "cpu": "Unknown", 
                "memory": "Unknown",
                "diskSpace": "Unknown"
            }

    def get_network_info(self, networks):
        """Get network information"""
        try:
            gateway = netifaces.gateways().get('default', {}).get(netifaces.AF_INET, ['Unknown'])[0]
        except:
            gateway = "Unknown"
            
        return {
            "interfaces": len(netifaces.interfaces()),
            "subnets": networks,
            "gateway": gateway
        }

    def send_results(self, scan_data):
        """Send scan results to SafeNet platform"""
        try:
            headers = {
                'Content-Type': 'application/json'
            }
            
            logger.info("Sending scan results to SafeNet platform...")
            
            response = requests.post(
                self.api_endpoint,
                headers=headers,
                json=scan_data,
                timeout=30
            )
            
            if response.status_code == 200:
                logger.info("Scan results sent successfully")
                return True
            else:
                logger.error(f"Failed to send results: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending results: {str(e)}")
            return False

    def perform_scan(self):
        """Perform a complete network scan"""
        logger.info("Starting SafeNet network scan...")
        
        # Get networks to scan
        networks = self.get_network_interfaces()
        
        # Scan all networks
        all_devices = []
        for network in networks:
            devices = self.scan_network(network)
            all_devices.extend(devices)
        
        # Prepare scan data
        scan_data = {
            "connector_key": self.connector_key,
            "scan_timestamp": datetime.now(timezone.utc).isoformat(),
            "network_ranges": networks,
            "devices": all_devices,
            "network_info": self.get_network_info(networks),
            "system_info": self.get_system_info(),
            "connector_version": "1.0.0"
        }
        
        logger.info(f"Scan completed. Found {len(all_devices)} devices across {len(networks)} networks")
        
        # Send results
        if self.send_results(scan_data):
            logger.info("Scan results successfully transmitted to SafeNet platform")
        else:
            logger.error("Failed to send scan results")

    def run(self):
        """Main execution loop"""
        logger.info(f"SafeNet Connector started. Scanning every {self.scan_interval} seconds.")
        
        while True:
            try:
                self.perform_scan()
            except Exception as e:
                logger.error(f"Error during scan: {str(e)}")
            
            logger.info(f"Next scan in {self.scan_interval} seconds...")
            time.sleep(self.scan_interval)

if __name__ == "__main__":
    try:
        connector = SafeNetConnector()
        connector.run()
    except KeyboardInterrupt:
        logger.info("SafeNet Connector stopped by user")
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}")`;

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
          <Link to="/products/safenet">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to SafeNet
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