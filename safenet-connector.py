#!/usr/bin/env python3
"""
SafeNet Network Scanner Connector with Enhanced Discovery
Comprehensive network discovery, mapping, and security vulnerability assessment
Runs as a service with built-in credentials and enhanced detection capabilities
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
import os
import sys
import winreg
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed
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
        
        # Enhanced discovery settings
        self.enable_enhanced_discovery = True
        self.snmp_community = "public"  # Default SNMP community string
        self.snmp_timeout = 5
        self.ssh_timeout = 10
        self.wmi_timeout = 15
        
        # Built-in credentials for enhanced discovery
        self.common_credentials = [
            {"username": "admin", "password": "admin"},
            {"username": "admin", "password": "password"},
            {"username": "root", "password": "root"},
            {"username": "user", "password": "user"},
            {"username": "administrator", "password": "admin"},
        ]
        
        # Common ports to scan (expanded for better detection)
        self.common_ports = [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 161, 443, 445, 993, 995, 1433, 3306, 3389, 5432, 5900, 8080, 8443]
        
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

    def enhanced_snmp_discovery(self, ip):
        """Enhanced device discovery using SNMP"""
        if not SNMP_AVAILABLE:
            return {}
            
        device_info = {}
        try:
            # Get system description
            for (errorIndication, errorStatus, errorIndex, varBinds) in nextCmd(
                SnmpEngine(),
                CommunityData(self.snmp_community),
                UdpTransportTarget((ip, 161), timeout=self.snmp_timeout),
                ContextData(),
                ObjectType(ObjectIdentity('1.3.6.1.2.1.1.1.0')),  # sysDescr
                lexicographicMode=False, maxRows=1):
                
                if errorIndication or errorStatus:
                    break
                    
                for varBind in varBinds:
                    device_info['system_description'] = str(varBind[1])
                    break
                break
                
            # Get system name
            for (errorIndication, errorStatus, errorIndex, varBinds) in nextCmd(
                SnmpEngine(),
                CommunityData(self.snmp_community),
                UdpTransportTarget((ip, 161), timeout=self.snmp_timeout),
                ContextData(),
                ObjectType(ObjectIdentity('1.3.6.1.2.1.1.5.0')),  # sysName
                lexicographicMode=False, maxRows=1):
                
                if errorIndication or errorStatus:
                    break
                    
                for varBind in varBinds:
                    device_info['snmp_hostname'] = str(varBind[1])
                    break
                break
                
        except Exception as e:
            logger.debug(f"SNMP discovery failed for {ip}: {e}")
            
        return device_info

    def enhanced_wmi_discovery(self, ip):
        """Enhanced Windows device discovery using WMI"""
        if not WMI_AVAILABLE or platform.system() != "Windows":
            return {}
            
        device_info = {}
        try:
            # Try common credentials
            for cred in self.common_credentials:
                try:
                    c = wmi.WMI(computer=ip, user=cred['username'], password=cred['password'])
                    
                    # Get system info
                    for system in c.Win32_ComputerSystem():
                        device_info['manufacturer'] = system.Manufacturer
                        device_info['model'] = system.Model
                        device_info['total_memory'] = f"{int(system.TotalPhysicalMemory) // (1024**3)}GB"
                        break
                        
                    # Get OS info
                    for os_info in c.Win32_OperatingSystem():
                        device_info['os_name'] = os_info.Caption
                        device_info['os_version'] = os_info.Version
                        device_info['service_pack'] = os_info.ServicePackMajorVersion
                        break
                        
                    # Get network adapters
                    adapters = []
                    for adapter in c.Win32_NetworkAdapterConfiguration(IPEnabled=True):
                        adapters.append({
                            'description': adapter.Description,
                            'mac_address': adapter.MACAddress,
                            'ip_addresses': adapter.IPAddress
                        })
                    device_info['network_adapters'] = adapters
                    
                    break  # Success, exit credential loop
                    
                except Exception:
                    continue  # Try next credential
                    
        except Exception as e:
            logger.debug(f"WMI discovery failed for {ip}: {e}")
            
        return device_info

    def enhanced_ssh_discovery(self, ip):
        """Enhanced Linux/Unix device discovery using SSH"""
        if not SSH_AVAILABLE:
            return {}
            
        device_info = {}
        try:
            # Try common credentials
            for cred in self.common_credentials:
                try:
                    ssh = paramiko.SSHClient()
                    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
                    ssh.connect(ip, username=cred['username'], password=cred['password'], timeout=self.ssh_timeout)
                    
                    # Get system information
                    stdin, stdout, stderr = ssh.exec_command('uname -a')
                    device_info['uname'] = stdout.read().decode().strip()
                    
                    # Get OS release info
                    stdin, stdout, stderr = ssh.exec_command('cat /etc/os-release 2>/dev/null || cat /etc/redhat-release 2>/dev/null')
                    device_info['os_release'] = stdout.read().decode().strip()
                    
                    # Get network interfaces
                    stdin, stdout, stderr = ssh.exec_command('ip addr show 2>/dev/null || ifconfig')
                    device_info['network_interfaces'] = stdout.read().decode().strip()
                    
                    # Get running services
                    stdin, stdout, stderr = ssh.exec_command('systemctl list-units --type=service --state=running 2>/dev/null || service --status-all 2>/dev/null')
                    device_info['running_services'] = stdout.read().decode().strip()
                    
                    ssh.close()
                    break  # Success, exit credential loop
                    
                except Exception:
                    continue  # Try next credential
                    
        except Exception as e:
            logger.debug(f"SSH discovery failed for {ip}: {e}")
            
        return device_info

    def enhanced_nmap_scan(self, ip):
        """Enhanced port scanning using nmap if available"""
        device_info = {}
        try:
            # Try to use nmap for service detection
            result = subprocess.run(['nmap', '-sV', '-O', '--version-light', '--osscan-guess', ip], 
                                  capture_output=True, text=True, timeout=60)
            
            if result.returncode == 0:
                nmap_output = result.stdout
                device_info['nmap_scan'] = nmap_output
                
                # Parse OS detection
                if "Running:" in nmap_output:
                    os_line = [line for line in nmap_output.split('\n') if 'Running:' in line]
                    if os_line:
                        device_info['nmap_os'] = os_line[0].split('Running:')[1].strip()
                
                # Parse service versions
                services = []
                for line in nmap_output.split('\n'):
                    if '/tcp' in line and 'open' in line:
                        parts = line.split()
                        if len(parts) >= 3:
                            port = parts[0].split('/')[0]
                            service = parts[2] if len(parts) > 2 else 'unknown'
                            version = ' '.join(parts[3:]) if len(parts) > 3 else ''
                            services.append({
                                'port': int(port),
                                'service': service,
                                'version': version
                            })
                device_info['services'] = services
                
        except (subprocess.TimeoutExpired, FileNotFoundError):
            # nmap not available or timed out
            pass
        except Exception as e:
            logger.debug(f"Nmap scan failed for {ip}: {e}")
            
        return device_info

    def get_active_directory_info(self, ip):
        """Get Active Directory information if the device is a domain controller"""
        ad_info = {}
        try:
            if platform.system() == "Windows":
                # Check if it's a domain controller
                result = subprocess.run(['nslookup', '-type=SRV', f'_ldap._tcp.{ip}'], 
                                      capture_output=True, text=True, timeout=10)
                if result.returncode == 0 and 'ldap' in result.stdout.lower():
                    ad_info['is_domain_controller'] = True
                    
                    # Try to get domain information
                    result = subprocess.run(['nltest', '/dclist:', ip], 
                                          capture_output=True, text=True, timeout=10)
                    if result.returncode == 0:
                        ad_info['domain_info'] = result.stdout.strip()
                        
        except Exception as e:
            logger.debug(f"AD discovery failed for {ip}: {e}")
            
        return ad_info

    def classify_device_type(self, ip, open_ports, enhanced_info):
        """Enhanced device classification based on ports and discovered information"""
        # Check for specific device types based on enhanced information
        if enhanced_info.get('nmap_os'):
            nmap_os = enhanced_info['nmap_os'].lower()
            if 'router' in nmap_os or 'cisco' in nmap_os:
                return 'router'
            elif 'switch' in nmap_os:
                return 'switch'
            elif 'printer' in nmap_os or 'hp' in nmap_os:
                return 'printer'
                
        if enhanced_info.get('is_domain_controller'):
            return 'domain_controller'
            
        if enhanced_info.get('system_description'):
            desc = enhanced_info['system_description'].lower()
            if 'router' in desc:
                return 'router'
            elif 'switch' in desc:
                return 'switch'
            elif 'printer' in desc:
                return 'printer'
            elif 'access point' in desc or 'wireless' in desc:
                return 'access_point'
                
        # Fallback to port-based classification
        if 161 in open_ports and 80 in open_ports:  # SNMP + HTTP
            return 'managed_device'
        elif 3389 in open_ports:  # RDP
            return 'windows_server'
        elif 22 in open_ports and 80 in open_ports:  # SSH + HTTP
            return 'linux_server'
        elif 22 in open_ports:  # SSH only
            return 'linux_workstation'
        elif 135 in open_ports or 139 in open_ports or 445 in open_ports:  # Windows services
            return 'windows_workstation'
        elif 443 in open_ports or 80 in open_ports:  # Web services
            return 'web_server'
        else:
            return 'unknown'

    def detect_os(self, ip, open_ports, enhanced_info=None):
        """Enhanced OS detection using multiple methods"""
        if enhanced_info:
            # Use WMI information
            if enhanced_info.get('os_name'):
                return enhanced_info['os_name']
                
            # Use SSH information
            if enhanced_info.get('os_release'):
                os_release = enhanced_info['os_release']
                if 'ubuntu' in os_release.lower():
                    return 'Ubuntu Linux'
                elif 'centos' in os_release.lower():
                    return 'CentOS Linux'
                elif 'red hat' in os_release.lower():
                    return 'Red Hat Linux'
                elif 'debian' in os_release.lower():
                    return 'Debian Linux'
                    
            # Use nmap OS detection
            if enhanced_info.get('nmap_os'):
                return enhanced_info['nmap_os']
                
        # Fallback to port-based detection
        if not open_ports:
            return "Unknown"
        
        # Enhanced heuristics
        if 3389 in open_ports:  # RDP
            return "Windows Server"
        elif 22 in open_ports and 80 not in open_ports:  # SSH only
            return "Linux"
        elif 22 in open_ports and 80 in open_ports:  # SSH + HTTP
            return "Linux Server"
        elif 135 in open_ports or 139 in open_ports or 445 in open_ports:  # Windows services
            return "Windows"
        elif 161 in open_ports:  # SNMP - likely network device
            return "Network Device"
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
        """Enhanced device scanning with multiple discovery methods"""
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
        
        # Get basic device information
        hostname = self.get_hostname(ip)
        
        # Enhanced discovery if enabled
        enhanced_info = {}
        if self.enable_enhanced_discovery:
            # Run enhanced discovery methods in parallel
            with ThreadPoolExecutor(max_workers=4) as executor:
                futures = []
                
                # SNMP discovery
                if 161 in open_ports:
                    futures.append(executor.submit(self.enhanced_snmp_discovery, ip))
                    
                # WMI discovery for Windows
                if any(port in open_ports for port in [135, 139, 445, 3389]):
                    futures.append(executor.submit(self.enhanced_wmi_discovery, ip))
                    
                # SSH discovery for Linux/Unix
                if 22 in open_ports:
                    futures.append(executor.submit(self.enhanced_ssh_discovery, ip))
                    
                # Nmap discovery
                futures.append(executor.submit(self.enhanced_nmap_scan, ip))
                
                # Active Directory discovery
                futures.append(executor.submit(self.get_active_directory_info, ip))
                
                # Collect results
                for future in as_completed(futures):
                    try:
                        result = future.result(timeout=30)
                        enhanced_info.update(result)
                    except Exception as e:
                        logger.debug(f"Enhanced discovery method failed: {e}")
        
        # Enhanced OS detection
        os_detected = self.detect_os(ip, open_ports, enhanced_info)
        
        # Device type classification
        device_type = self.classify_device_type(ip, open_ports, enhanced_info)
        
        # Enhanced vulnerability detection
        vulnerabilities = self.enhanced_vulnerability_detection(ip, open_ports, enhanced_info)
        
        # Risk assessment
        risk_level = self.assess_risk(open_ports, vulnerabilities)
        
        # Get MAC address if possible
        mac_address = self.get_mac_address(ip)
        
        device_info = {
            "ip": ip,
            "hostname": hostname,
            "mac": mac_address,
            "os": os_detected,
            "device_type": device_type,
            "ports": open_ports,
            "vulnerabilities": vulnerabilities,
            "risk_level": risk_level,
            "last_seen": datetime.now(timezone.utc).isoformat(),
            "discovery_method": "enhanced" if enhanced_info else "basic",
            "connector_version": "2.0.0"
        }
        
        # Add enhanced information
        if enhanced_info:
            device_info.update({
                "manufacturer": enhanced_info.get('manufacturer', 'Unknown'),
                "model": enhanced_info.get('model', 'Unknown'),
                "system_description": enhanced_info.get('system_description', ''),
                "total_memory": enhanced_info.get('total_memory', 'Unknown'),
                "network_adapters": enhanced_info.get('network_adapters', []),
                "running_services": enhanced_info.get('running_services', ''),
                "is_managed": bool(enhanced_info.get('snmp_hostname') or enhanced_info.get('is_domain_controller')),
                "is_critical": device_type in ['domain_controller', 'router', 'switch', 'web_server']
            })
        
        return device_info
        
    def get_mac_address(self, ip):
        """Enhanced MAC address detection"""
        try:
            # Try ARP table lookup
            if platform.system() == "Windows":
                result = subprocess.run(['arp', '-a', ip], capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    for line in result.stdout.split('\n'):
                        if ip in line:
                            parts = line.split()
                            for part in parts:
                                if len(part) == 17 and part.count('-') == 5:  # Windows format
                                    return part.replace('-', ':')
                                elif len(part) == 17 and part.count(':') == 5:  # Unix format
                                    return part
            else:
                result = subprocess.run(['arp', '-n', ip], capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    for line in result.stdout.split('\n'):
                        if ip in line:
                            parts = line.split()
                            for part in parts:
                                if len(part) == 17 and part.count(':') == 5:
                                    return part
        except:
            pass
            
        return "Unknown"
        
    def enhanced_vulnerability_detection(self, ip, open_ports, enhanced_info):
        """Enhanced vulnerability detection using multiple sources"""
        vulnerabilities = []
        
        # Port-based vulnerabilities
        if 21 in open_ports:
            vulnerabilities.append({
                "type": "exposed_service",
                "severity": "medium",
                "title": "FTP Service Exposed",
                "description": "FTP service detected - may allow unauthorized file access",
                "port": 21
            })
            
        if 23 in open_ports:
            vulnerabilities.append({
                "type": "insecure_protocol",
                "severity": "high",
                "title": "Telnet Service Exposed",
                "description": "Unencrypted Telnet service detected",
                "port": 23
            })
            
        if 3389 in open_ports:
            vulnerabilities.append({
                "type": "exposed_service",
                "severity": "high",
                "title": "RDP Service Exposed",
                "description": "Remote Desktop Protocol exposed to network",
                "port": 3389
            })
            
        if 135 in open_ports:
            vulnerabilities.append({
                "type": "exposed_service",
                "severity": "medium",
                "title": "Windows RPC Exposed",
                "description": "Windows RPC service may allow remote exploitation",
                "port": 135
            })
            
        if 161 in open_ports:
            vulnerabilities.append({
                "type": "information_disclosure",
                "severity": "low",
                "title": "SNMP Service Exposed",
                "description": "SNMP service may reveal system information",
                "port": 161
            })
        
        # Enhanced detection based on discovered services
        if enhanced_info.get('services'):
            for service in enhanced_info['services']:
                if service.get('version'):
                    version = service['version'].lower()
                    # Check for known vulnerable versions
                    if 'ssh' in version and ('openssh 7.' in version or 'openssh 6.' in version):
                        vulnerabilities.append({
                            "type": "vulnerable_version",
                            "severity": "medium",
                            "title": "Potentially Vulnerable SSH Version",
                            "description": f"SSH version may have known vulnerabilities: {service['version']}",
                            "port": service['port']
                        })
        
        # OS-specific vulnerabilities
        if enhanced_info.get('os_name'):
            os_name = enhanced_info['os_name'].lower()
            if 'windows server 2008' in os_name or 'windows 7' in os_name:
                vulnerabilities.append({
                    "type": "end_of_life",
                    "severity": "critical",
                    "title": "End-of-Life Operating System",
                    "description": "Operating system is no longer supported and may have unpatched vulnerabilities",
                    "port": None
                })
        
        return vulnerabilities

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