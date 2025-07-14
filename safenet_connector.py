#!/usr/bin/env python3
"""
SafeNet Network Connector
A lightweight network scanner that runs on client networks and reports to SafeNet dashboard.
"""

import asyncio
import aiohttp
import json
import logging
import nmap
import psutil
import socket
import subprocess
import sys
import time
from datetime import datetime
from typing import Dict, List, Optional, Any
import argparse
import schedule
import threading

# Configuration
SAFENET_API_URL = "https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/safenet-api"
CONNECTOR_KEY = "your-connector-key"  # Replace with actual connector key from SafeNet dashboard
SCAN_INTERVAL = 300  # 5 minutes
HOSTNAME = socket.gethostname()

class SafeNetConnector:
    def __init__(self, connector_key: str, api_url: str):
        self.connector_key = connector_key
        self.api_url = api_url.rstrip('/')
        self.connector_id = None
        self.logger = self.setup_logging()
        
        try:
            self.nm = nmap.PortScanner()
        except nmap.PortScannerError:
            self.logger.error("Nmap not found. Please install nmap.")
            sys.exit(1)
        
    def setup_logging(self) -> logging.Logger:
        """Setup logging configuration"""
        logger = logging.getLogger('safenet_connector')
        logger.setLevel(logging.INFO)
        
        # Create console handler
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
        # Create file handler
        try:
            file_handler = logging.FileHandler('safenet_connector.log')
            file_handler.setFormatter(formatter)
            logger.addHandler(file_handler)
        except Exception as e:
            logger.warning(f"Could not create log file: {e}")
        
        return logger

    def get_network_interfaces(self) -> List[Dict[str, Any]]:
        """Get all network interfaces and their details"""
        interfaces = []
        
        try:
            for interface, addrs in psutil.net_if_addrs().items():
                interface_info = {
                    'name': interface,
                    'addresses': [],
                    'stats': {}
                }
                
                for addr in addrs:
                    if addr.family == socket.AF_INET:
                        interface_info['addresses'].append({
                            'ip': addr.address,
                            'netmask': addr.netmask,
                            'broadcast': addr.broadcast
                        })
                
                # Get interface statistics
                try:
                    stats = psutil.net_if_stats()[interface]
                    interface_info['stats'] = {
                        'is_up': stats.isup,
                        'duplex': stats.duplex,
                        'speed': stats.speed,
                        'mtu': stats.mtu
                    }
                except KeyError:
                    pass
                
                if interface_info['addresses']:
                    interfaces.append(interface_info)
                    
        except Exception as e:
            self.logger.error(f"Error getting network interfaces: {e}")
        
        return interfaces

    def discover_network_range(self) -> List[str]:
        """Discover network ranges to scan"""
        ranges = []
        
        try:
            interfaces = self.get_network_interfaces()
            
            for interface in interfaces:
                for addr in interface['addresses']:
                    ip = addr['ip']
                    netmask = addr['netmask']
                    
                    # Skip loopback
                    if ip.startswith('127.'):
                        continue
                    
                    # Calculate network range
                    import ipaddress
                    network = ipaddress.IPv4Network(f"{ip}/{netmask}", strict=False)
                    ranges.append(str(network))
                    
        except Exception as e:
            self.logger.error(f"Error discovering network ranges: {e}")
            # Fallback to common ranges
            ranges = ['192.168.1.0/24', '192.168.0.0/24', '10.0.0.0/24']
        
        return ranges

    def scan_network(self, network_range: str) -> Dict[str, Any]:
        """Perform network scan using nmap"""
        self.logger.info(f"Scanning network range: {network_range}")
        
        try:
            # Perform host discovery
            self.nm.scan(hosts=network_range, arguments='-sn')
            hosts = list(self.nm.all_hosts())
            
            devices = []
            
            for host in hosts:
                try:
                    device_info = self.scan_host(host)
                    if device_info:
                        devices.append(device_info)
                except Exception as e:
                    self.logger.warning(f"Error scanning host {host}: {e}")
            
            return {
                'network_range': network_range,
                'scan_type': 'comprehensive',
                'devices_found': len(devices),
                'timestamp': datetime.utcnow().isoformat(),
                'devices': devices,
                'scanner_info': {
                    'hostname': HOSTNAME,
                    'version': '1.0.0',
                    'scan_duration': 0  # Will be calculated
                }
            }
            
        except Exception as e:
            self.logger.error(f"Error scanning network {network_range}: {e}")
            return {
                'network_range': network_range,
                'scan_type': 'comprehensive',
                'devices_found': 0,
                'timestamp': datetime.utcnow().isoformat(),
                'devices': [],
                'error': str(e)
            }

    def scan_host(self, host: str) -> Optional[Dict[str, Any]]:
        """Perform detailed scan of a single host"""
        try:
            # Port scan
            self.nm.scan(host, '1-1000', '-sV -O --version-detection')
            
            if host not in self.nm.all_hosts():
                return None
            
            host_info = self.nm[host]
            
            # Get open ports
            open_ports = []
            services = []
            
            for protocol in host_info.all_protocols():
                ports = host_info[protocol].keys()
                for port in ports:
                    port_info = host_info[protocol][port]
                    if port_info['state'] == 'open':
                        open_ports.append(port)
                        services.append({
                            'port': port,
                            'protocol': protocol,
                            'service': port_info.get('name', 'unknown'),
                            'version': port_info.get('version', ''),
                            'product': port_info.get('product', '')
                        })
            
            # Detect vulnerabilities based on services
            vulnerabilities = self.detect_vulnerabilities(services)
            
            # Determine device type
            device_type = self.determine_device_type(open_ports, services)
            
            # Calculate risk level
            risk_level = self.calculate_risk_level(vulnerabilities, open_ports)
            
            return {
                'ip_address': host,
                'hostname': host_info.hostname() if host_info.hostname() else f"device-{host.split('.')[-1]}",
                'device_type': device_type,
                'mac_address': self.get_mac_address(host),
                'os_info': self.get_os_info(host_info),
                'open_ports': open_ports,
                'services': services,
                'vulnerabilities': vulnerabilities,
                'risk_level': risk_level,
                'last_seen': datetime.utcnow().isoformat(),
                'status': 'online'
            }
            
        except Exception as e:
            self.logger.warning(f"Error scanning host {host}: {e}")
            return None

    def get_mac_address(self, ip: str) -> Optional[str]:
        """Get MAC address for an IP"""
        try:
            # Try ARP table
            result = subprocess.run(['arp', '-n', ip], capture_output=True, text=True)
            if result.returncode == 0:
                lines = result.stdout.split('\n')
                for line in lines:
                    if ip in line:
                        parts = line.split()
                        if len(parts) >= 3:
                            return parts[2]
        except:
            pass
        return None

    def get_os_info(self, host_info) -> str:
        """Extract OS information from nmap results"""
        try:
            if 'osmatch' in host_info:
                osmatch = host_info['osmatch']
                if osmatch:
                    return osmatch[0]['name']
        except:
            pass
        return 'Unknown'

    def determine_device_type(self, open_ports: List[int], services: List[Dict]) -> str:
        """Determine device type based on open ports and services"""
        # Web server
        if 80 in open_ports or 443 in open_ports:
            return 'server'
        
        # SSH server
        if 22 in open_ports:
            return 'server'
        
        # Database
        if any(port in open_ports for port in [3306, 5432, 1433, 27017]):
            return 'database'
        
        # Router/Network device
        if 23 in open_ports or 161 in open_ports:
            return 'router'
        
        # Windows workstation
        if 3389 in open_ports or 445 in open_ports:
            return 'workstation'
        
        # Printer
        if 631 in open_ports or 9100 in open_ports:
            return 'printer'
        
        return 'unknown'

    def detect_vulnerabilities(self, services: List[Dict]) -> List[str]:
        """Detect potential vulnerabilities based on services"""
        vulnerabilities = []
        
        for service in services:
            port = service['port']
            name = service['service'].lower()
            version = service['version'].lower()
            
            # Common vulnerability checks
            if port == 21 and 'ftp' in name:
                vulnerabilities.append('FTP-CLEARTEXT-AUTH')
            
            if port == 23 and 'telnet' in name:
                vulnerabilities.append('TELNET-CLEARTEXT-AUTH')
            
            if port == 80 and 'http' in name:
                vulnerabilities.append('HTTP-CLEARTEXT')
            
            if port == 445 and 'smb' in name:
                vulnerabilities.append('SMB-EXPOSURE')
            
            if port == 3389 and 'rdp' in name:
                vulnerabilities.append('RDP-EXPOSURE')
            
            # Version-specific checks
            if 'apache' in version and any(v in version for v in ['2.2', '2.0']):
                vulnerabilities.append('APACHE-OUTDATED')
            
            if 'openssh' in version and any(v in version for v in ['7.0', '6.', '5.']):
                vulnerabilities.append('SSH-OUTDATED')
        
        return vulnerabilities

    def calculate_risk_level(self, vulnerabilities: List[str], open_ports: List[int]) -> str:
        """Calculate risk level based on findings"""
        critical_vulns = ['RDP-EXPOSURE', 'SMB-EXPOSURE', 'TELNET-CLEARTEXT-AUTH']
        high_vulns = ['FTP-CLEARTEXT-AUTH', 'HTTP-CLEARTEXT', 'SSH-OUTDATED']
        
        if any(vuln in vulnerabilities for vuln in critical_vulns):
            return 'critical'
        
        if any(vuln in vulnerabilities for vuln in high_vulns):
            return 'high'
        
        if len(vulnerabilities) > 0:
            return 'medium'
        
        if len(open_ports) > 10:
            return 'low'
        
        return 'safe'

    async def register_connector(self) -> bool:
        """Register connector with SafeNet API"""
        try:
            system_info = {
                'os': sys.platform,
                'hostname': HOSTNAME,
                'python_version': sys.version,
                'interfaces': self.get_network_interfaces()
            }
            
            registration_data = {
                'connector_key': self.connector_key,
                'connector_name': f"SafeNet Connector - {HOSTNAME}",
                'client_name': HOSTNAME,
                'version': '1.0.0',
                'system_info': system_info,
                'network_info': {
                    'discovered_ranges': self.discover_network_range()
                }
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.api_url}/register",
                    json=registration_data,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        self.connector_id = result.get('connector_id')
                        self.logger.info(f"Connector registered successfully. ID: {self.connector_id}")
                        return True
                    else:
                        error_text = await response.text()
                        self.logger.error(f"Failed to register connector: {response.status} - {error_text}")
                        return False
                        
        except Exception as e:
            self.logger.error(f"Error registering connector: {e}")
            return False

    async def send_heartbeat(self) -> bool:
        """Send heartbeat to maintain connection status"""
        try:
            heartbeat_data = {
                'connector_key': self.connector_key
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.api_url}/heartbeat",
                    json=heartbeat_data,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    return response.status == 200
                        
        except Exception as e:
            self.logger.warning(f"Heartbeat failed: {e}")
            return False

    async def send_scan_results(self, scan_results: Dict[str, Any]) -> bool:
        """Send scan results to SafeNet API"""
        try:
            # Prepare data for the new API format
            scan_data = {
                'connector_key': self.connector_key,
                'scan_type': 'comprehensive',
                'network_ranges': [],
                'devices_found': 0,
                'scan_duration': scan_results.get('scan_duration', 0),
                'hostname': HOSTNAME,
                'results': scan_results,
                'devices': []
            }
            
            # Extract network ranges and devices from results
            if 'results' in scan_results and isinstance(scan_results['results'], list):
                for result in scan_results['results']:
                    if 'network_range' in result:
                        scan_data['network_ranges'].append(result['network_range'])
                    if 'devices' in result:
                        for device in result['devices']:
                            scan_data['devices'].append({
                                'ip_address': device['ip_address'],
                                'hostname': device['hostname'], 
                                'device_type': device['device_type'],
                                'mac_address': device.get('mac_address'),
                                'os_info': device.get('os_info'),
                                'open_ports': device.get('open_ports', []),
                                'services': device.get('services', []),
                                'vulnerabilities': device.get('vulnerabilities', []),
                                'risk_level': device['risk_level'],
                                'status': device['status'],
                                'network_range': result['network_range']
                            })
                        scan_data['devices_found'] += len(result['devices'])
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.api_url}/scan-data",
                    json=scan_data,
                    timeout=aiohttp.ClientTimeout(total=60)
                ) as response:
                    if response.status == 200:
                        self.logger.info("Scan results sent successfully")
                        return True
                    else:
                        error_text = await response.text()
                        self.logger.error(f"Failed to send results: {response.status} - {error_text}")
                        return False
                        
        except Exception as e:
            self.logger.error(f"Error sending scan results: {e}")
            return False

    async def run_full_scan(self):
        """Run a full network scan and send results"""
        self.logger.info("Starting full network scan")
        start_time = time.time()
        
        try:
            # Discover network ranges
            network_ranges = self.discover_network_range()
            
            all_results = []
            
            for network_range in network_ranges:
                scan_result = self.scan_network(network_range)
                scan_result['scan_duration'] = time.time() - start_time
                all_results.append(scan_result)
            
            # Combine results
            combined_result = {
                'scan_type': 'full_network',
                'timestamp': datetime.utcnow().isoformat(),
                'hostname': HOSTNAME,
                'networks_scanned': len(network_ranges),
                'total_devices': sum(r['devices_found'] for r in all_results),
                'scan_duration': time.time() - start_time,
                'results': all_results
            }
            
            # Send to SafeNet dashboard
            success = await self.send_scan_results(combined_result)
            
            if success:
                self.logger.info(f"Full scan completed successfully. Found {combined_result['total_devices']} devices")
            else:
                self.logger.error("Failed to send scan results")
                
        except Exception as e:
            self.logger.error(f"Error during full scan: {e}")

    async def run_scheduled_scans(self):
        """Run the connector with scheduled scans"""
        self.logger.info(f"Starting SafeNet Connector with {SCAN_INTERVAL}s interval")
        
        # Register connector first
        if not await self.register_connector():
            self.logger.error("Failed to register connector. Exiting.")
            return
        
        async def run_scan():
            # Send heartbeat
            await self.send_heartbeat()
            # Run scan
            await self.run_full_scan()
        
        # Run initial scan
        await run_scan()
        
        # Schedule regular scans
        while True:
            try:
                await asyncio.sleep(SCAN_INTERVAL)
                await run_scan()
            except KeyboardInterrupt:
                self.logger.info("Received shutdown signal")
                break
            except Exception as e:
                self.logger.error(f"Error in scan loop: {e}")
                await asyncio.sleep(10)  # Wait before retrying

def main():
    parser = argparse.ArgumentParser(description='SafeNet Network Connector')
    parser.add_argument('--connector-key', default=CONNECTOR_KEY, help='SafeNet Connector Key from dashboard')
    parser.add_argument('--api-url', default=SAFENET_API_URL, help='SafeNet API URL')
    parser.add_argument('--interval', type=int, default=SCAN_INTERVAL, help='Scan interval in seconds')
    parser.add_argument('--test', action='store_true', help='Run a single test scan')
    
    args = parser.parse_args()
    
    if not args.connector_key or args.connector_key == "your-connector-key":
        print("Error: Please provide a valid connector key using --connector-key")
        print("Generate a connector key from the SafeNet dashboard and use:")
        print("python safenet_connector.py --connector-key snc_your_key_here")
        sys.exit(1)
    
    connector = SafeNetConnector(args.connector_key, args.api_url)
    
    if args.test:
        print("Running test scan...")
        asyncio.run(connector.run_full_scan())
    else:
        try:
            print("Starting SafeNet Connector...")
            asyncio.run(connector.run_scheduled_scans())
        except KeyboardInterrupt:
            print("\nShutting down SafeNet Connector...")
        except Exception as e:
            connector.logger.error(f"Fatal error: {e}")
            sys.exit(1)

if __name__ == "__main__":
    main()