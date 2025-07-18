#!/usr/bin/env python3
"""
SafeNet Network Connector
Advanced network scanner and security assessment tool.
"""

import socket
import subprocess
import platform
import time
import json
import logging
import os
import sys
import ipaddress
import concurrent.futures
import threading
from datetime import datetime
from pathlib import Path
import argparse

try:
    import requests
    import nmap
    import psutil
except ImportError as e:
    print(f"ERROR: Required package not installed: {e}")
    print("Run: pip install -r safenet-requirements.txt")
    sys.exit(1)

# ============================
# CONFIGURATION
# ============================

SAFENET_API_URL = "https://nsyobmjpdpvesjwdphlh.functions.supabase.co/safenet-api"
SCAN_INTERVAL = 300  # 5 minutes
CONNECTOR_VERSION = "2.0.0"
MAX_THREADS = 50
TIMEOUT_CONNECT = 3
TIMEOUT_SCAN = 30

# ============================
# LOGGING SETUP
# ============================

def setup_logging():
    """Setup comprehensive logging"""
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # File handler
    file_handler = logging.FileHandler(
        log_dir / f"safenet_connector_{datetime.now().strftime('%Y%m%d')}.log"
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.DEBUG)
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    console_handler.setLevel(logging.INFO)
    
    # Root logger
    logger = logging.getLogger()
    logger.setLevel(logging.DEBUG)
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger

logger = setup_logging()

# ============================
# NETWORK DISCOVERY
# ============================

class NetworkScanner:
    def __init__(self, api_key):
        self.api_key = api_key
        self.hostname = socket.gethostname()
        self.nm = nmap.PortScanner()
        self.discovered_devices = []
        self.network_ranges = []
        
    def get_local_networks(self):
        """Discover local network ranges"""
        networks = []
        
        try:
            for interface, addrs in psutil.net_if_addrs().items():
                for addr in addrs:
                    if addr.family == socket.AF_INET and not addr.address.startswith('127.'):
                        try:
                            # Calculate network from IP and netmask
                            network = ipaddress.IPv4Network(
                                f"{addr.address}/{addr.netmask}", 
                                strict=False
                            )
                            if network.is_private:
                                networks.append(str(network))
                                logger.info(f"Found local network: {network} on {interface}")
                        except (ValueError, AttributeError):
                            continue
                            
        except Exception as e:
            logger.error(f"Error discovering networks: {e}")
            # Fallback to common private networks
            networks = ["192.168.1.0/24", "10.0.0.0/24"]
            
        return list(set(networks))  # Remove duplicates
    
    def ping_sweep(self, network):
        """Perform ping sweep to find live hosts"""
        logger.info(f"Performing ping sweep on {network}")
        live_hosts = []
        
        try:
            net = ipaddress.IPv4Network(network)
            if net.num_addresses > 1024:
                logger.warning(f"Network {network} too large, limiting scan")
                # Limit to first 1024 hosts for large networks
                hosts = list(net.hosts())[:1024]
            else:
                hosts = list(net.hosts())
            
            def ping_host(ip):
                try:
                    if platform.system().lower() == "windows":
                        result = subprocess.run(
                            ["ping", "-n", "1", "-w", "1000", str(ip)],
                            capture_output=True, timeout=5
                        )
                    else:
                        result = subprocess.run(
                            ["ping", "-c", "1", "-W", "1", str(ip)],
                            capture_output=True, timeout=5
                        )
                    
                    if result.returncode == 0:
                        return str(ip)
                except:
                    pass
                return None
            
            # Parallel ping sweep
            with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
                futures = [executor.submit(ping_host, ip) for ip in hosts]
                for future in concurrent.futures.as_completed(futures):
                    result = future.result()
                    if result:
                        live_hosts.append(result)
                        
        except Exception as e:
            logger.error(f"Error in ping sweep: {e}")
            
        logger.info(f"Found {len(live_hosts)} live hosts in {network}")
        return live_hosts
    
    def scan_device(self, ip):
        """Comprehensive device scanning"""
        logger.debug(f"Scanning device: {ip}")
        device_info = {
            "ip_address": ip,
            "hostname": "unknown",
            "mac_address": None,
            "device_type": "unknown",
            "os_family": "unknown",
            "os_version": None,
            "manufacturer": None,
            "open_ports": [],
            "services": [],
            "vulnerabilities": [],
            "risk_level": "low",
            "last_seen": datetime.now().isoformat(),
            "response_time": None
        }
        
        try:
            start_time = time.time()
            
            # Try to resolve hostname
            try:
                device_info["hostname"] = socket.gethostbyaddr(ip)[0]
            except:
                device_info["hostname"] = f"device-{ip.split('.')[-1]}"
            
            # Port scan with nmap
            try:
                scan_result = self.nm.scan(
                    ip, 
                    '22,23,25,53,80,110,143,443,993,995,1433,3389,5432,8080,8443',
                    arguments='-sS -O --version-intensity 5'
                )
                
                if ip in scan_result['scan']:
                    host_data = scan_result['scan'][ip]
                    
                    # Extract port information
                    if 'tcp' in host_data:
                        for port, port_data in host_data['tcp'].items():
                            if port_data['state'] == 'open':
                                device_info["open_ports"].append(port)
                                
                                service_info = {
                                    "port": port,
                                    "protocol": "tcp",
                                    "service": port_data.get('name', 'unknown'),
                                    "version": port_data.get('version', ''),
                                    "product": port_data.get('product', ''),
                                    "extrainfo": port_data.get('extrainfo', '')
                                }
                                device_info["services"].append(service_info)
                    
                    # OS Detection
                    if 'osmatch' in host_data and host_data['osmatch']:
                        best_match = host_data['osmatch'][0]
                        device_info["os_family"] = self.classify_os(best_match['name'])
                        device_info["os_version"] = best_match['name']
                        device_info["manufacturer"] = self.extract_manufacturer(best_match['name'])
                    
                    # MAC Address
                    if 'addresses' in host_data and 'mac' in host_data['addresses']:
                        device_info["mac_address"] = host_data['addresses']['mac']
                        device_info["manufacturer"] = self.get_mac_vendor(device_info["mac_address"])
                        
            except Exception as scan_error:
                logger.warning(f"Nmap scan failed for {ip}: {scan_error}")
                # Fallback to simple port check
                device_info["open_ports"] = self.simple_port_scan(ip)
            
            # Device classification
            device_info["device_type"] = self.classify_device(device_info)
            
            # Vulnerability assessment
            device_info["vulnerabilities"] = self.assess_vulnerabilities(device_info)
            device_info["risk_level"] = self.calculate_risk_level(device_info)
            
            # Response time
            device_info["response_time"] = round((time.time() - start_time) * 1000, 2)
            
        except Exception as e:
            logger.error(f"Error scanning device {ip}: {e}")
            
        return device_info
    
    def simple_port_scan(self, ip):
        """Fallback simple port scanner"""
        open_ports = []
        common_ports = [22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 993, 995, 1433, 3389, 5432, 8080]
        
        def scan_port(port):
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(TIMEOUT_CONNECT)
                result = sock.connect_ex((ip, port))
                sock.close()
                return port if result == 0 else None
            except:
                return None
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
            futures = [executor.submit(scan_port, port) for port in common_ports]
            for future in concurrent.futures.as_completed(futures):
                result = future.result()
                if result:
                    open_ports.append(result)
                    
        return sorted(open_ports)
    
    def classify_os(self, os_string):
        """Classify operating system family"""
        os_lower = os_string.lower()
        if any(term in os_lower for term in ['windows', 'microsoft']):
            return 'windows'
        elif any(term in os_lower for term in ['linux', 'ubuntu', 'debian', 'centos', 'red hat']):
            return 'linux'
        elif any(term in os_lower for term in ['mac', 'macos', 'darwin']):
            return 'macos'
        elif any(term in os_lower for term in ['cisco', 'router', 'switch']):
            return 'network_device'
        elif any(term in os_lower for term in ['printer', 'canon', 'hp', 'epson']):
            return 'printer'
        else:
            return 'unknown'
    
    def extract_manufacturer(self, os_string):
        """Extract device manufacturer from OS string"""
        manufacturers = {
            'microsoft': 'Microsoft',
            'cisco': 'Cisco',
            'hp': 'HP',
            'dell': 'Dell',
            'apple': 'Apple',
            'canon': 'Canon',
            'epson': 'Epson',
            'brother': 'Brother',
            'netgear': 'Netgear',
            'linksys': 'Linksys',
            'dlink': 'D-Link'
        }
        
        os_lower = os_string.lower()
        for key, value in manufacturers.items():
            if key in os_lower:
                return value
        return "Unknown"
    
    def get_mac_vendor(self, mac_address):
        """Get vendor from MAC address (simplified)"""
        # This would typically use an OUI database
        mac_vendors = {
            '00:50:56': 'VMware',
            '08:00:27': 'VirtualBox',
            '00:0C:29': 'VMware',
            '00:16:3E': 'Xen',
            '00:1B:21': 'Intel'
        }
        
        oui = mac_address[:8].upper()
        return mac_vendors.get(oui, "Unknown")
    
    def classify_device(self, device_info):
        """Classify device type based on gathered information"""
        open_ports = device_info["open_ports"]
        os_family = device_info["os_family"]
        hostname = device_info["hostname"].lower()
        
        # Server classification
        if any(port in open_ports for port in [22, 23, 80, 443, 1433, 3389, 5432]):
            if any(term in hostname for term in ['server', 'srv', 'db', 'web', 'mail']):
                return 'server'
            elif 3389 in open_ports or os_family == 'windows':
                return 'server'
        
        # Network device
        if any(port in open_ports for port in [23, 80, 443]) and os_family == 'network_device':
            return 'network_device'
        
        # Printer
        if any(port in open_ports for port in [80, 443, 9100]) and 'printer' in hostname:
            return 'printer'
        
        # IoT device
        if len(open_ports) <= 2 and any(port in open_ports for port in [80, 443]):
            return 'iot'
        
        # Workstation (default for Windows/Mac with minimal services)
        if os_family in ['windows', 'macos'] and len(open_ports) <= 3:
            return 'workstation'
        
        return 'unknown'
    
    def assess_vulnerabilities(self, device_info):
        """Assess device vulnerabilities"""
        vulnerabilities = []
        open_ports = device_info["open_ports"]
        services = device_info["services"]
        
        # Check for risky services
        if 23 in open_ports:  # Telnet
            vulnerabilities.append({
                "type": "cleartext_authentication",
                "severity": "high",
                "description": "Telnet service allows cleartext authentication",
                "port": 23,
                "recommendation": "Disable Telnet and use SSH instead"
            })
        
        if 21 in open_ports:  # FTP
            vulnerabilities.append({
                "type": "cleartext_authentication",
                "severity": "medium",
                "description": "FTP service may allow cleartext authentication",
                "port": 21,
                "recommendation": "Use SFTP or FTPS instead"
            })
        
        if 80 in open_ports and 443 not in open_ports:  # HTTP without HTTPS
            vulnerabilities.append({
                "type": "unencrypted_web",
                "severity": "medium",
                "description": "Web service not using HTTPS encryption",
                "port": 80,
                "recommendation": "Enable HTTPS and redirect HTTP traffic"
            })
        
        if 3389 in open_ports:  # RDP
            vulnerabilities.append({
                "type": "remote_desktop_exposed",
                "severity": "high",
                "description": "RDP service exposed to network",
                "port": 3389,
                "recommendation": "Restrict RDP access and use VPN"
            })
        
        if 445 in open_ports:  # SMB
            vulnerabilities.append({
                "type": "smb_exposed",
                "severity": "medium",
                "description": "SMB file sharing exposed",
                "port": 445,
                "recommendation": "Secure SMB configuration and access controls"
            })
        
        # Check for database services
        db_ports = [1433, 3306, 5432, 27017]
        exposed_db_ports = [port for port in db_ports if port in open_ports]
        for port in exposed_db_ports:
            vulnerabilities.append({
                "type": "database_exposed",
                "severity": "high",
                "description": f"Database service exposed on port {port}",
                "port": port,
                "recommendation": "Restrict database access to authorized hosts only"
            })
        
        return vulnerabilities
    
    def calculate_risk_level(self, device_info):
        """Calculate overall risk level"""
        vulnerabilities = device_info["vulnerabilities"]
        open_ports = device_info["open_ports"]
        
        if not vulnerabilities and len(open_ports) <= 2:
            return "low"
        
        critical_vulns = [v for v in vulnerabilities if v["severity"] == "critical"]
        high_vulns = [v for v in vulnerabilities if v["severity"] == "high"]
        
        if critical_vulns:
            return "critical"
        elif high_vulns:
            return "high"
        elif vulnerabilities or len(open_ports) > 5:
            return "medium"
        else:
            return "low"
    
    def send_scan_results(self, devices):
        """Send scan results to SafeNet API"""
        try:
            payload = {
                "connector_key": self.api_key,
                "scan_type": "comprehensive_discovery",
                "hostname": self.hostname,
                "network_ranges": self.network_ranges,
                "devices_found": len(devices),
                "scan_duration": 0,  # Will be calculated
                "results": {
                    "discovered": len(devices),
                    "by_risk": {
                        "low": len([d for d in devices if d["risk_level"] == "low"]),
                        "medium": len([d for d in devices if d["risk_level"] == "medium"]),
                        "high": len([d for d in devices if d["risk_level"] == "high"]),
                        "critical": len([d for d in devices if d["risk_level"] == "critical"])
                    }
                },
                "devices": devices
            }
            
            response = requests.post(
                f"{SAFENET_API_URL}/scan-data",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                logger.info(f"Successfully sent {len(devices)} device results to SafeNet")
                return True
            else:
                logger.error(f"Failed to send results: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending scan results: {e}")
            return False
    
    def send_heartbeat(self):
        """Send heartbeat to SafeNet API"""
        try:
            payload = {
                "connector_key": self.api_key,
                "hostname": self.hostname,
                "version": CONNECTOR_VERSION,
                "status": "active"
            }
            
            response = requests.post(
                f"{SAFENET_API_URL}/heartbeat",
                json=payload,
                timeout=10
            )
            
            return response.status_code == 200
            
        except Exception as e:
            logger.debug(f"Heartbeat failed: {e}")
            return False
    
    def full_network_scan(self):
        """Perform complete network scan"""
        logger.info("Starting comprehensive network scan")
        start_time = time.time()
        
        # Discover networks
        self.network_ranges = self.get_local_networks()
        if not self.network_ranges:
            logger.error("No networks discovered")
            return []
        
        all_devices = []
        
        # Scan each network
        for network in self.network_ranges:
            logger.info(f"Scanning network: {network}")
            
            # Find live hosts
            live_hosts = self.ping_sweep(network)
            
            # Scan each live host
            if live_hosts:
                logger.info(f"Performing detailed scan of {len(live_hosts)} hosts")
                
                def scan_wrapper(ip):
                    return self.scan_device(ip)
                
                with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
                    device_futures = [executor.submit(scan_wrapper, ip) for ip in live_hosts]
                    for future in concurrent.futures.as_completed(device_futures):
                        device = future.result()
                        if device:
                            all_devices.append(device)
        
        scan_duration = time.time() - start_time
        logger.info(f"Scan completed in {scan_duration:.2f} seconds. Found {len(all_devices)} devices")
        
        # Update scan duration in results
        for device in all_devices:
            device["scan_duration"] = round(scan_duration, 2)
        
        return all_devices

# ============================
# MAIN APPLICATION
# ============================

def main():
    parser = argparse.ArgumentParser(description="SafeNet Network Connector")
    parser.add_argument("--api-key", required=True, help="SafeNet API key")
    parser.add_argument("--api-url", default=SAFENET_API_URL, help="SafeNet API URL")
    parser.add_argument("--interval", type=int, default=SCAN_INTERVAL, help="Scan interval in seconds")
    parser.add_argument("--test", action="store_true", help="Run single test scan")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose logging")
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Update global variables
    global SAFENET_API_URL, SCAN_INTERVAL
    SAFENET_API_URL = args.api_url
    SCAN_INTERVAL = args.interval
    
    # Initialize scanner
    scanner = NetworkScanner(args.api_key)
    
    logger.info(f"SafeNet Connector v{CONNECTOR_VERSION} starting")
    logger.info(f"Hostname: {scanner.hostname}")
    logger.info(f"API URL: {SAFENET_API_URL}")
    
    if args.test:
        # Single test scan
        logger.info("Running test scan...")
        devices = scanner.full_network_scan()
        
        if devices:
            logger.info(f"Test scan found {len(devices)} devices")
            for device in devices:
                logger.info(f"  {device['ip_address']} ({device['hostname']}) - {device['device_type']} - Risk: {device['risk_level']}")
            
            # Send results
            success = scanner.send_scan_results(devices)
            logger.info(f"Results sent: {'✅' if success else '❌'}")
        else:
            logger.warning("No devices found in test scan")
        
        return
    
    # Continuous scanning mode
    logger.info(f"Starting continuous scanning (interval: {SCAN_INTERVAL}s)")
    
    consecutive_errors = 0
    max_errors = 5
    
    while True:
        try:
            # Send heartbeat
            if not scanner.send_heartbeat():
                logger.warning("Heartbeat failed")
            
            # Perform scan
            devices = scanner.full_network_scan()
            
            if devices:
                # Send results
                if scanner.send_scan_results(devices):
                    consecutive_errors = 0  # Reset on success
                else:
                    consecutive_errors += 1
            else:
                logger.warning("No devices found in scan")
            
        except KeyboardInterrupt:
            logger.info("Scan stopped by user")
            break
        except Exception as e:
            consecutive_errors += 1
            logger.error(f"Scan error: {e}")
            
            if consecutive_errors >= max_errors:
                logger.critical(f"Too many consecutive errors ({consecutive_errors}). Exiting.")
                break
        
        # Wait for next scan
        logger.info(f"Waiting {SCAN_INTERVAL} seconds until next scan...")
        try:
            time.sleep(SCAN_INTERVAL)
        except KeyboardInterrupt:
            logger.info("Scan stopped by user")
            break

if __name__ == "__main__":
    main()