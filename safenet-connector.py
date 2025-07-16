#!/usr/bin/env python3
"""
SafeNet Network Scanner Connector
Scans local networks and sends results to Ultrium SafeNet platform
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
        # Configuration
        self.connector_key = "safenet_connector_demo_key_123"  # Replace with your actual connector key
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
        logger.error(f"Fatal error: {str(e)}")