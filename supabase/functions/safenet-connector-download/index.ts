import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Enhanced SafeNet Python Connector Script with Built-in Discovery
const pythonConnectorScript = `#!/usr/bin/env python3
"""
SafeNet Network Scanner Connector with Enhanced Discovery
Comprehensive network discovery, mapping, and security vulnerability assessment
Runs as a service with built-in credentials and enhanced detection capabilities
"""

import socket
import subprocess
import json
import time
import threading
import os
import sys
import platform
from datetime import datetime, timezone
import ipaddress
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

# Enhanced modules (install automatically if missing)
REQUIRED_MODULES = ['requests', 'psutil', 'netifaces', 'python-nmap', 'schedule', 'ipaddress']
OPTIONAL_MODULES = ['pysnmp', 'wmi', 'paramiko']

def install_build_tools_windows():
    """Install Visual C++ build tools on Windows"""
    if platform.system() != 'Windows':
        return True
        
    print("Installing Microsoft Visual C++ Build Tools for Python compilation...")
    try:
        # Method 1: Try chocolatey
        result = subprocess.run(['choco', 'install', 'visualstudio2022buildtools', 
                               '--include-recommended', '-y'], 
                              capture_output=True, text=True, timeout=300)
        if result.returncode == 0:
            print("Build tools installed via Chocolatey")
            return True
    except:
        pass
    
    try:
        # Method 2: Download and install VS Build Tools
        import urllib.request
        import tempfile
        
        build_tools_url = "https://aka.ms/vs/17/release/vs_buildtools.exe"
        temp_dir = tempfile.gettempdir()
        installer_path = os.path.join(temp_dir, "vs_buildtools.exe")
        
        print("Downloading Visual Studio Build Tools installer...")
        urllib.request.urlretrieve(build_tools_url, installer_path)
        
        print("Installing build tools (this may take 5-10 minutes)...")
        result = subprocess.run([installer_path, "--quiet", "--wait", 
                               "--add", "Microsoft.VisualStudio.Workload.VCTools",
                               "--add", "Microsoft.VisualStudio.Component.VC.Tools.x86.x64",
                               "--add", "Microsoft.VisualStudio.Component.Windows10SDK.19041"], 
                              timeout=600)
        
        if result.returncode == 0:
            print("Build tools installed successfully")
            return True
            
    except Exception as e:
        print(f"Failed to install build tools: {e}")
    
    print("Could not install build tools automatically.")
    print("Please manually install Microsoft C++ Build Tools from:")
    print("https://visualstudio.microsoft.com/visual-cpp-build-tools/")
    print("Make sure to select 'C++ build tools' workload during installation.")
    return False

def install_module(module_name):
    """Install a Python module using pip with enhanced error handling"""
    try:
        print(f"Installing {module_name}...")
        
        # Special handling for netifaces on Windows
        if module_name == 'netifaces' and platform.system() == 'Windows':
            # Try binary wheel first
            try:
                subprocess.check_call([sys.executable, '-m', 'pip', 'install', 
                                     'netifaces', '--only-binary=all'], 
                                    timeout=120)
                print(f"Successfully installed {module_name} (binary)")
                return True
            except:
                print("Binary wheel not available, installing build tools...")
                if not install_build_tools_windows():
                    return False
                # Now try to install from source
                subprocess.check_call([sys.executable, '-m', 'pip', 'install', 
                                     'netifaces', '--no-binary=netifaces'], 
                                    timeout=300)
                print(f"Successfully installed {module_name} (from source)")
                return True
        else:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', module_name], 
                                timeout=120)
            print(f"Successfully installed {module_name}")
            return True
            
    except subprocess.TimeoutExpired:
        print(f"Timeout installing {module_name}")
        return False
    except Exception as e:
        print(f"Failed to install {module_name}: {e}")
        return False

def check_and_install_modules():
    """Check and install required modules"""
    # Upgrade pip first
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '--upgrade', 'pip'])
    except:
        pass
        
    for module in REQUIRED_MODULES:
        module_import_name = module
        if module == 'python-nmap':
            module_import_name = 'nmap'
        elif module == 'ipaddress':
            try:
                import ipaddress
                continue  # ipaddress is built-in for Python 3.3+
            except ImportError:
                pass
                
        try:
            __import__(module_import_name)
            print(f"Module {module} already installed")
        except ImportError:
            print(f"Installing required module: {module}")
            if not install_module(module):
                print(f"CRITICAL: Failed to install {module}")
                return False
    return True

print("SafeNet Connector Installer")
print("===========================")
if not check_and_install_modules():
    print("\\nInstallation failed! Please check the errors above.")
    print("You may need to:")
    print("1. Run as administrator (Windows)")
    print("2. Install Visual C++ Build Tools manually")
    print("3. Update Python pip: python -m pip install --upgrade pip")
    input("Press Enter to exit...")
    sys.exit(1)

print("\\nAll required modules installed successfully!")

import requests
import psutil
import netifaces

# Try to import optional modules for enhanced discovery
try:
    from pysnmp.hlapi import *
    SNMP_AVAILABLE = True
except ImportError:
    SNMP_AVAILABLE = False
    
try:
    import wmi
    WMI_AVAILABLE = True
except ImportError:
    WMI_AVAILABLE = False
    
try:
    import paramiko
    SSH_AVAILABLE = True
except ImportError:
    SSH_AVAILABLE = False

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('safenet_connector.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class SafeNetConnector:
    def __init__(self, api_key, server_url="https://nsyobmjpdpvesjwdphlh.supabase.co"):
        self.api_key = api_key
        self.server_url = server_url
        self.running = False
        
class SafeNetConnector:
    def __init__(self, api_key, server_url="https://nsyobmjpdpvesjwdphlh.supabase.co"):
        self.api_key = api_key
        self.server_url = server_url
        self.running = False
        
        # Enhanced discovery settings
        self.enable_enhanced_discovery = True
        self.snmp_community = "public"
        self.snmp_timeout = 5
        self.ssh_timeout = 10
        self.wmi_timeout = 15
        self.max_threads = 50
        self.timeout = 2
        
        # Built-in credentials for enhanced discovery
        self.common_credentials = [
            {"username": "admin", "password": "admin"},
            {"username": "admin", "password": "password"}, 
            {"username": "root", "password": "root"},
            {"username": "user", "password": "user"},
            {"username": "administrator", "password": "admin"},
            {"username": "guest", "password": "guest"},
            {"username": "service", "password": "service"},
        ]
        
        # Extended ports for comprehensive scanning
        self.common_ports = [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 161, 443, 445, 993, 995, 1433, 3306, 3389, 5432, 5900, 8080, 8443, 9200, 27017]
        
    def enhanced_snmp_discovery(self, ip):
        """Enhanced device discovery using SNMP"""
        device_info = {}
        if not SNMP_AVAILABLE:
            return device_info
            
        try:
            # System description and name
            for oid, name in [('1.3.6.1.2.1.1.1.0', 'system_description'), 
                            ('1.3.6.1.2.1.1.5.0', 'snmp_hostname'),
                            ('1.3.6.1.2.1.1.6.0', 'location')]:
                try:
                    iterator = getCmd(SnmpEngine(),
                                    CommunityData(self.snmp_community),
                                    UdpTransportTarget((ip, 161), timeout=self.snmp_timeout),
                                    ContextData(),
                                    ObjectType(ObjectIdentity(oid)))
                    
                    errorIndication, errorStatus, errorIndex, varBinds = next(iterator)
                    if not errorIndication and not errorStatus:
                        device_info[name] = str(varBinds[0][1])
                except:
                    continue
                    
        except Exception as e:
            logger.debug(f"SNMP discovery failed for {ip}: {e}")
            
        return device_info

    def enhanced_wmi_discovery(self, ip):
        """Enhanced Windows device discovery using WMI"""
        device_info = {}
        if not WMI_AVAILABLE or platform.system() != "Windows":
            return device_info
            
        try:
            for cred in self.common_credentials:
                try:
                    c = wmi.WMI(computer=ip, user=cred['username'], password=cred['password'])
                    
                    # System info
                    for system in c.Win32_ComputerSystem():
                        device_info.update({
                            'manufacturer': system.Manufacturer,
                            'model': system.Model,
                            'total_memory': f"{int(system.TotalPhysicalMemory) // (1024**3)}GB"
                        })
                        break
                        
                    # OS info  
                    for os_info in c.Win32_OperatingSystem():
                        device_info.update({
                            'os_name': os_info.Caption,
                            'os_version': os_info.Version,
                            'service_pack': str(os_info.ServicePackMajorVersion)
                        })
                        break
                        
                    break  # Success
                except:
                    continue
                    
        except Exception as e:
            logger.debug(f"WMI discovery failed for {ip}: {e}")
            
        return device_info

    def enhanced_ssh_discovery(self, ip):
        """Enhanced Linux/Unix device discovery using SSH"""
        device_info = {}
        if not SSH_AVAILABLE:
            return device_info
            
        try:
            for cred in self.common_credentials:
                try:
                    ssh = paramiko.SSHClient()
                    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
                    ssh.connect(ip, username=cred['username'], password=cred['password'], timeout=self.ssh_timeout)
                    
                    # Get system info
                    commands = {
                        'uname': 'uname -a',
                        'os_release': 'cat /etc/os-release 2>/dev/null || cat /etc/redhat-release 2>/dev/null',
                        'uptime': 'uptime',
                        'memory': 'free -h | head -2',
                        'disk': 'df -h | head -5'
                    }
                    
                    for key, cmd in commands.items():
                        try:
                            stdin, stdout, stderr = ssh.exec_command(cmd)
                            output = stdout.read().decode().strip()
                            if output:
                                device_info[key] = output
                        except:
                            continue
                    
                    ssh.close()
                    break
                except:
                    continue
                    
        except Exception as e:
            logger.debug(f"SSH discovery failed for {ip}: {e}")
            
        return device_info

    def enhanced_nmap_scan(self, ip):
        """Enhanced port scanning and OS detection"""
        device_info = {}
        try:
            # Try nmap for advanced detection
            result = subprocess.run(['nmap', '-sV', '-O', '--version-light', '--osscan-guess', ip], 
                                  capture_output=True, text=True, timeout=120)
            
            if result.returncode == 0:
                output = result.stdout
                device_info['nmap_scan'] = output
                
                # Parse OS
                for line in output.split('\\n'):
                    if 'Running:' in line:
                        device_info['nmap_os'] = line.split('Running:')[1].strip()
                        break
                        
                # Parse services
                services = []
                for line in output.split('\\n'):
                    if '/tcp' in line and 'open' in line:
                        parts = line.split()
                        if len(parts) >= 3:
                            services.append({
                                'port': int(parts[0].split('/')[0]),
                                'service': parts[2],
                                'version': ' '.join(parts[3:]) if len(parts) > 3 else ''
                            })
                device_info['services'] = services
                
        except:
            pass
            
        return device_info

    def classify_device_type(self, ip, open_ports, enhanced_info):
        """Smart device classification"""
        # Enhanced classification logic
        if enhanced_info.get('system_description'):
            desc = enhanced_info['system_description'].lower()
            if 'router' in desc or 'cisco' in desc:
                return 'router'
            elif 'switch' in desc:
                return 'switch'
            elif 'printer' in desc:
                return 'printer'
            elif 'access point' in desc or 'wireless' in desc:
                return 'access_point'
                
        if enhanced_info.get('nmap_os'):
            os_info = enhanced_info['nmap_os'].lower()
            if 'router' in os_info:
                return 'router'
            elif 'printer' in os_info:
                return 'printer'
                
        # Port-based classification
        if 161 in open_ports and (80 in open_ports or 443 in open_ports):
            return 'managed_device'
        elif 3389 in open_ports and (135 in open_ports or 445 in open_ports):
            return 'windows_server'
        elif 22 in open_ports and (80 in open_ports or 443 in open_ports):
            return 'linux_server'
        elif 1433 in open_ports or 3306 in open_ports or 5432 in open_ports:
            return 'database_server'
        elif 22 in open_ports:
            return 'linux_workstation'
        elif 135 in open_ports or 139 in open_ports or 445 in open_ports:
            return 'windows_workstation'
        else:
            return 'unknown'

    def detect_vulnerabilities(self, ip, open_ports, enhanced_info):
        """Comprehensive vulnerability detection"""
        vulnerabilities = []
        
        # Critical vulnerabilities
        if 23 in open_ports:
            vulnerabilities.append({
                "type": "insecure_protocol",
                "severity": "critical",
                "title": "Telnet Service Exposed",
                "description": "Unencrypted Telnet service allows credential interception",
                "port": 23,
                "solution": "Disable Telnet and use SSH instead"
            })
            
        if 21 in open_ports:
            vulnerabilities.append({
                "type": "insecure_protocol", 
                "severity": "high",
                "title": "FTP Service Exposed",
                "description": "FTP service may allow unauthorized file access",
                "port": 21,
                "solution": "Use SFTP or disable FTP service"
            })
            
        if 3389 in open_ports:
            vulnerabilities.append({
                "type": "exposed_service",
                "severity": "high", 
                "title": "RDP Service Exposed",
                "description": "Remote Desktop exposed to network attacks",
                "port": 3389,
                "solution": "Restrict RDP access and use VPN"
            })
            
        # Check for weak services
        if enhanced_info.get('services'):
            for service in enhanced_info['services']:
                version = service.get('version', '').lower()
                if 'ssh' in version and ('openssh 6.' in version or 'openssh 7.0' in version):
                    vulnerabilities.append({
                        "type": "vulnerable_version",
                        "severity": "medium",
                        "title": "Potentially Vulnerable SSH",
                        "description": f"SSH version may have known vulnerabilities: {service['version']}",
                        "port": service['port'],
                        "solution": "Update SSH to latest version"
                    })
                    
        # OS-specific vulnerabilities
        if enhanced_info.get('os_name'):
            os_name = enhanced_info['os_name'].lower()
            if any(eol_os in os_name for eol_os in ['windows server 2008', 'windows 7', 'windows xp']):
                vulnerabilities.append({
                    "type": "end_of_life",
                    "severity": "critical",
                    "title": "End-of-Life Operating System",
                    "description": "OS no longer receives security updates",
                    "port": None,
                    "solution": "Upgrade to supported OS version"
                })
                
        return vulnerabilities

    def get_mac_address(self, ip):
        """Get MAC address from ARP table"""
        try:
            if platform.system() == "Windows":
                result = subprocess.run(['arp', '-a', ip], capture_output=True, text=True, timeout=5)
                for line in result.stdout.split('\\n'):
                    if ip in line:
                        parts = line.split()
                        for part in parts:
                            if len(part) == 17 and (part.count('-') == 5 or part.count(':') == 5):
                                return part.replace('-', ':')
            else:
                result = subprocess.run(['arp', '-n', ip], capture_output=True, text=True, timeout=5)
                for line in result.stdout.split('\\n'):
                    if ip in line:
                        parts = line.split()
                        for part in parts:
                            if len(part) == 17 and part.count(':') == 5:
                                return part
        except:
            pass
        return "Unknown"
        
    def scan_device_enhanced(self, ip):
        """Comprehensive device scanning"""
        # Quick connectivity test
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex((ip, 80))
            sock.close()
            if result != 0:
                # Try another common port
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM) 
                sock.settimeout(1)
                result = sock.connect_ex((ip, 22))
                sock.close()
                if result != 0:
                    return None
        except:
            return None
            
        print(f"Scanning device: {ip}")
        
        # Port scanning
        open_ports = []
        for port in self.common_ports:
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(self.timeout)
                result = sock.connect_ex((ip, port))
                if result == 0:
                    open_ports.append(port)
                sock.close()
            except:
                pass
        
        # Get basic info
        hostname = self.get_hostname(ip)
        mac_address = self.get_mac_address(ip)
        
        # Enhanced discovery
        enhanced_info = {}
        if self.enable_enhanced_discovery:
            # Run discovery methods
            if 161 in open_ports:  # SNMP
                enhanced_info.update(self.enhanced_snmp_discovery(ip))
            if any(p in open_ports for p in [135, 139, 445, 3389]):  # Windows
                enhanced_info.update(self.enhanced_wmi_discovery(ip))
            if 22 in open_ports:  # SSH
                enhanced_info.update(self.enhanced_ssh_discovery(ip))
            
            # Nmap scan
            enhanced_info.update(self.enhanced_nmap_scan(ip))
        
        # Classification and analysis
        device_type = self.classify_device_type(ip, open_ports, enhanced_info)
        vulnerabilities = self.detect_vulnerabilities(ip, open_ports, enhanced_info)
        
        # OS detection
        os_detected = "Unknown"
        if enhanced_info.get('os_name'):
            os_detected = enhanced_info['os_name']
        elif enhanced_info.get('uname'):
            os_detected = enhanced_info['uname'].split()[0]
        elif enhanced_info.get('nmap_os'):
            os_detected = enhanced_info['nmap_os']
        elif open_ports:
            if 3389 in open_ports:
                os_detected = "Windows"
            elif 22 in open_ports:
                os_detected = "Linux/Unix"
                
        return {
            "ip": ip,
            "hostname": hostname,
            "mac": mac_address,
            "ports": open_ports,
            "os": os_detected,
            "device_type": device_type,
            "vulnerabilities": vulnerabilities,
            "risk_level": "critical" if any(v["severity"] == "critical" for v in vulnerabilities) else "high" if vulnerabilities else "low",
            "last_seen": datetime.now().isoformat(),
            "manufacturer": enhanced_info.get('manufacturer', 'Unknown'),
            "model": enhanced_info.get('model', 'Unknown'),
            "system_description": enhanced_info.get('system_description', ''),
            "discovery_method": "enhanced" if enhanced_info else "basic"
        }
    
    def get_hostname(self, ip):
        """Get hostname for IP address"""
        try:
            return socket.gethostbyaddr(ip)[0]
        except:
            return f"device-{ip.split('.')[-1]}"
    
    def scan_network(self):
        """Enhanced network discovery"""
        devices = []
        try:
            # Get local network range
            hostname = socket.gethostname()
            local_ip = socket.gethostbyname(hostname)
            network = ipaddress.IPv4Network(f"{local_ip}/24", strict=False)
            
            print(f"Scanning network: {network}")
            print("Enhanced discovery enabled - performing comprehensive scans...")
            
            # Scan all hosts in parallel
            with ThreadPoolExecutor(max_workers=self.max_threads) as executor:
                futures = {executor.submit(self.scan_device_enhanced, str(ip)): ip for ip in network.hosts()}
                
                for future in futures:
                    try:
                        device = future.result(timeout=60)
                        if device:
                            devices.append(device)
                            print(f"Found device: {device['ip']} ({device['hostname']}) - {device['device_type']} - {len(device['vulnerabilities'])} vulnerabilities")
                    except Exception as e:
                        continue
                        
        except Exception as e:
            print(f"Network scan error: {e}")
            
        return devices
        
    def run_scan_cycle(self):
        """Run enhanced scan cycle"""
        print("Starting SafeNet Enhanced Scan Cycle...")
        
        # Enhanced device discovery
        devices = self.scan_network()
        print(f"Discovered {len(devices)} devices with enhanced scanning")
        
        # Calculate statistics
        total_vulnerabilities = sum(len(device.get('vulnerabilities', [])) for device in devices)
        critical_devices = sum(1 for device in devices if device.get('risk_level') == 'critical')
        managed_devices = sum(1 for device in devices if device.get('discovery_method') == 'enhanced')
        
        print(f"Enhanced Discovery Results:")
        print(f"- Total devices: {len(devices)}")
        print(f"- Enhanced discovery: {managed_devices} devices") 
        print(f"- Total vulnerabilities: {total_vulnerabilities}")
        print(f"- Critical risk devices: {critical_devices}")
        
        # Prepare enhanced payload
        scan_data = {
            "connector_key": self.api_key,
            "scan_type": "enhanced_network_discovery",
            "scan_timestamp": datetime.now().isoformat(),
            "connector_version": "2.0.0",
            "devices": devices,
            "scan_statistics": {
                "total_devices": len(devices),
                "enhanced_discovered": managed_devices,
                "total_vulnerabilities": total_vulnerabilities,
                "critical_devices": critical_devices
            },
            "system_info": {
                "os": platform.system(),
                "platform": platform.platform(),
                "python_version": platform.python_version(),
                "enhanced_modules": {
                    "snmp": SNMP_AVAILABLE,
                    "wmi": WMI_AVAILABLE, 
                    "ssh": SSH_AVAILABLE
                }
            },
            "network_info": {
                "gateway": socket.gethostbyname(socket.gethostname()),
                "subnets": [f"{socket.gethostbyname(socket.gethostname())}/24"]
            }
        }
        
        
        # Send to server
        try:
            headers = {
                "Content-Type": "application/json",
                "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zeW9ibWpwZHB2ZXNqd2RwaGxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NjM3MjksImV4cCI6MjA2NzEzOTcyOX0.vkV_Xr2T28WA6kiOzcZ3LhzmbkozWNy8Lvx0b7GTgWI"
            }
            
            response = requests.post(
                f"{self.server_url}/functions/v1/safenet-connector",
                headers=headers,
                json=scan_data,
                timeout=30
            )
            
            if response.status_code == 200:
                print("Enhanced scan data sent successfully")
            else:
                print(f"Failed to send scan data: {response.status_code}")
                
        except Exception as e:
            print(f"Error sending scan data: {e}")
        
        print(f"Enhanced scan cycle complete. Found {len(devices)} devices, {total_vulnerabilities} vulnerabilities")
        
    def start_monitoring(self):
        """Start continuous enhanced monitoring"""
        self.running = True
        print("SafeNet Enhanced Connector started - monitoring network...")
        print("Enhanced capabilities:")
        print(f"- SNMP Discovery: {'Enabled' if SNMP_AVAILABLE else 'Disabled (pysnmp not installed)'}")
        print(f"- WMI Discovery: {'Enabled' if WMI_AVAILABLE else 'Disabled (wmi not installed)'}")
        print(f"- SSH Discovery: {'Enabled' if SSH_AVAILABLE else 'Disabled (paramiko not installed)'}")
        print(f"- Built-in Credentials: {len(self.common_credentials)} sets configured")
        print(f"- Port Scanning: {len(self.common_ports)} ports")
        
        while self.running:
            try:
                self.run_scan_cycle()
                print(f"Next scan in 300 seconds...")
                time.sleep(300)  # Enhanced scan every 5 minutes
            except KeyboardInterrupt:
                print("\\nShutting down SafeNet Enhanced Connector...")
                self.running = False
                break
            except Exception as e:
                print(f"Error in monitoring loop: {e}")
                time.sleep(60)

def main():
    try:
        # Organization key is embedded in the script
        org_key = "AGENT_ID_PLACEHOLDER"
        
        if not org_key.startswith("sk-safenet-"):
            print("Error: Invalid organization key format")
            input("Press Enter to exit...")
            sys.exit(1)
        
        print("SafeNet Enhanced Network Scanner Connector v2.0")
        print("==============================================")
        print(f"Organization Key: {org_key}")
        
        connector = SafeNetConnector(org_key)
        
        try:
            # Run initial enhanced scan
            connector.run_scan_cycle()
            
            # Start continuous monitoring
            connector.start_monitoring()
            
        except Exception as e:
            print(f"Fatal error: {e}")
            input("Press Enter to exit...")
            sys.exit(1)
            
    except Exception as e:
        print(f"Unexpected error: {e}")
        input("Press Enter to exit...")
        sys.exit(1)

if __name__ == "__main__":
    main()
`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const platform = pathParts[pathParts.length - 1]; // Get last part of path
    
    // Extract query parameters
    const agentId = url.searchParams.get('agentId');
    const clientId = url.searchParams.get('clientId');
    
    console.log(`Download request for platform: ${platform}, agentId: ${agentId}`);

    let filename: string;
    let content: string;
    let contentType: string;

    // Generate script with embedded agent ID
    const scriptContent = pythonConnectorScript.replace('AGENT_ID_PLACEHOLDER', agentId || 'sk-safenet-demo');

    switch (platform) {
      case 'python':
        filename = 'safenet_connector.py';
        content = scriptContent;
        contentType = 'text/x-python';
        break;
        
      case 'windows':
        filename = 'safenet_connector.exe';
        // In a real implementation, this would be a compiled Python executable
        content = scriptContent;
        contentType = 'application/octet-stream';
        break;
        
      case 'linux':
        filename = 'safenet_connector';
        content = scriptContent;
        contentType = 'application/x-executable';
        break;
        
      case 'macos':
        filename = 'safenet_connector.app';
        content = scriptContent;
        contentType = 'application/octet-stream';
        break;
        
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid platform specified' }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

    return new Response(content, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': content.length.toString(),
      },
    });

  } catch (error) {
    console.error('Download error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});