#!/usr/bin/env python3
"""
Ultrium Vanguard Agent
======================
A production-ready agent for the Vanguard security operations platform.
Sends system metrics, polls for commands, runs network scans, collects Meraki data,
monitors network devices via SNMP, and supports sub-agent collection.

Usage:
    python vanguard_agent.py                    # Run with config.yaml
    python vanguard_agent.py --config /path/to/config.yaml
    python vanguard_agent.py --register         # One-time registration
    python vanguard_agent.py --test             # Test connection
    python vanguard_agent.py --scan             # Run one-time network scan
    python vanguard_agent.py --meraki           # Run one-time Meraki sync
    python vanguard_agent.py --snmp             # Run one-time SNMP poll
    python vanguard_agent.py --discover         # Run ARP network discovery
"""

import asyncio
import aiohttp
import argparse
import json
import logging
import platform
import re
import shutil
import signal
import socket
import struct
import subprocess
import sys
import time
import uuid
import xml.etree.ElementTree as ET
from datetime import datetime
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# Optional imports
try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False
    print("Warning: psutil not installed. Install with: pip install psutil")

try:
    import yaml
    HAS_YAML = True
except ImportError:
    HAS_YAML = False
    print("Warning: PyYAML not installed. Install with: pip install pyyaml")

# SNMP support (optional)
try:
    from pysnmp.hlapi.asyncio import *
    HAS_SNMP = True
except ImportError:
    HAS_SNMP = False

# =============================================================================
# Configuration
# =============================================================================

DEFAULT_CONFIG = {
    "agent": {
        "device_id": None,  # Will be auto-generated if not set
        "name": platform.node(),
        "location": "default",
        "user_id": None,  # Required: the Vanguard user who owns this agent
    },
    "api": {
        "endpoint": "https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/vanguard-agent-api",
        "secret_key": None,  # Required: X-VANGUARD-KEY
        "timeout": 30,
    },
    "intervals": {
        "heartbeat": 60,  # seconds
        "command_poll": 30,  # seconds
        "scan": 3600,  # seconds (1 hour)
        "meraki": 300,  # seconds (5 minutes)
        "snmp": 300,  # seconds (5 minutes)
        "discovery": 1800,  # seconds (30 minutes)
    },
    "logging": {
        "level": "INFO",
        "file": "/var/log/vanguard-agent.log",
        "max_bytes": 10485760,  # 10MB
        "backup_count": 5,
    },
    "features": {
        "collect_temperature": True,
        "collect_network_io": True,
        "execute_commands": True,
    },
    "scanning": {
        "enabled": False,  # Disabled by default
        "targets": [],  # Auto-detect if empty
        "scan_types": {
            "discovery": True,
            "ports": True,
            "os_detection": False,  # Requires sudo
            "service_detection": True,
        },
        "port_range": "1-1024",
        "timeout": 600,  # 10 minutes max per scan
        "sudo_required": False,
    },
    "meraki": {
        "enabled": False,
        "api_key": None,  # Meraki Dashboard API key
        "base_url": "https://api.meraki.com/api/v1",
        "collect_organizations": True,
        "collect_networks": True,
        "collect_devices": True,
        "collect_clients": True,
        "collect_uplinks": True,
        "collect_vpn_status": False,
        "client_timespan": 86400,  # 24 hours in seconds
    },
    "snmp": {
        "enabled": False,
        "community": "public",  # SNMP v2c community string
        "version": 2,  # 1, 2, or 3
        "port": 161,
        "timeout": 5,  # seconds
        "retries": 2,
        "targets": [],  # List of IPs or auto-discover
        "v3_credentials": {  # Only for SNMPv3
            "username": None,
            "auth_protocol": "SHA",  # MD5, SHA, SHA224, SHA256, SHA384, SHA512
            "auth_password": None,
            "priv_protocol": "AES",  # DES, 3DES, AES, AES192, AES256
            "priv_password": None,
        },
    },
    "sub_agents": {
        "enabled": False,
        "listen_port": 5678,  # Port for sub-agents to report to
        "auth_token": None,  # Shared secret for sub-agent auth
        "agents": [],  # List of registered sub-agents
    },
}

# Global state
config: Dict[str, Any] = {}
agent_id: Optional[str] = None
running = True
log = logging.getLogger("vanguard")


# =============================================================================
# Logging Setup
# =============================================================================

def setup_logging(cfg: Dict[str, Any]) -> None:
    """Configure logging with file rotation and console output."""
    log_cfg = cfg.get("logging", {})
    level = getattr(logging, log_cfg.get("level", "INFO").upper(), logging.INFO)
    
    log.setLevel(level)
    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    
    # Console handler
    console = logging.StreamHandler(sys.stdout)
    console.setFormatter(formatter)
    log.addHandler(console)
    
    # File handler (optional)
    log_file = log_cfg.get("file")
    if log_file:
        try:
            Path(log_file).parent.mkdir(parents=True, exist_ok=True)
            file_handler = RotatingFileHandler(
                log_file,
                maxBytes=log_cfg.get("max_bytes", 10485760),
                backupCount=log_cfg.get("backup_count", 5)
            )
            file_handler.setFormatter(formatter)
            log.addHandler(file_handler)
        except PermissionError:
            log.warning(f"Cannot write to {log_file}, using console only")


# =============================================================================
# Configuration Loading
# =============================================================================

def load_config(config_path: str = "config.yaml") -> Dict[str, Any]:
    """Load configuration from YAML file, merging with defaults."""
    cfg = DEFAULT_CONFIG.copy()
    
    if not HAS_YAML:
        log.warning("PyYAML not installed, using default/environment config")
        return cfg
    
    config_file = Path(config_path)
    if config_file.exists():
        try:
            with open(config_file, "r") as f:
                user_cfg = yaml.safe_load(f) or {}
            
            # Deep merge
            for section, values in user_cfg.items():
                if section in cfg and isinstance(cfg[section], dict):
                    if isinstance(values, dict):
                        for k, v in values.items():
                            if k in cfg[section] and isinstance(cfg[section][k], dict) and isinstance(v, dict):
                                cfg[section][k].update(v)
                            else:
                                cfg[section][k] = v
                    else:
                        cfg[section] = values
                else:
                    cfg[section] = values
            
            log.info(f"Loaded config from {config_path}")
        except Exception as e:
            log.error(f"Failed to load config: {e}")
    else:
        log.warning(f"Config file {config_path} not found, using defaults")
    
    # Generate device_id if not set
    if not cfg["agent"].get("device_id"):
        cfg["agent"]["device_id"] = f"vanguard-{uuid.uuid4().hex[:8]}"
        log.info(f"Generated device_id: {cfg['agent']['device_id']}")
    
    return cfg


def validate_config(cfg: Dict[str, Any]) -> bool:
    """Validate required configuration values."""
    errors = []
    
    if not cfg["api"].get("secret_key"):
        errors.append("api.secret_key is required (X-VANGUARD-KEY)")
    
    if not cfg["agent"].get("user_id"):
        errors.append("agent.user_id is required (Vanguard user UUID)")
    
    if errors:
        for err in errors:
            log.error(f"Config error: {err}")
        return False
    
    return True


# =============================================================================
# System Metrics Collection
# =============================================================================

def get_system_metrics() -> Dict[str, Any]:
    """Collect system performance metrics."""
    metrics = {
        "timestamp": int(time.time()),
        "hostname": platform.node(),
        "platform": platform.system(),
        "platform_version": platform.version(),
    }
    
    if not HAS_PSUTIL:
        return metrics
    
    try:
        # CPU
        metrics["cpu_percent"] = psutil.cpu_percent(interval=1)
        metrics["cpu_count"] = psutil.cpu_count()
        
        # Memory
        mem = psutil.virtual_memory()
        metrics["memory_percent"] = mem.percent
        metrics["memory_total_gb"] = round(mem.total / (1024**3), 2)
        metrics["memory_available_gb"] = round(mem.available / (1024**3), 2)
        
        # Disk
        disk = psutil.disk_usage("/")
        metrics["disk_percent"] = disk.percent
        metrics["disk_total_gb"] = round(disk.total / (1024**3), 2)
        metrics["disk_free_gb"] = round(disk.free / (1024**3), 2)
        
        # Network I/O (optional)
        if config.get("features", {}).get("collect_network_io", True):
            net = psutil.net_io_counters()
            metrics["network_rx_bytes"] = net.bytes_recv
            metrics["network_tx_bytes"] = net.bytes_sent
        
        # Temperature (optional, Linux only)
        if config.get("features", {}).get("collect_temperature", True):
            try:
                temps = psutil.sensors_temperatures()
                if temps:
                    # Get CPU temperature (varies by platform)
                    for name in ["coretemp", "cpu_thermal", "cpu-thermal", "k10temp"]:
                        if name in temps and temps[name]:
                            metrics["temperature"] = temps[name][0].current
                            break
            except (AttributeError, KeyError):
                pass  # Temperature not available on this platform
        
        # Uptime
        metrics["uptime_seconds"] = int(time.time() - psutil.boot_time())
        
        # Load average (Unix only)
        try:
            load = psutil.getloadavg()
            metrics["load_1m"] = load[0]
            metrics["load_5m"] = load[1]
            metrics["load_15m"] = load[2]
        except (AttributeError, OSError):
            pass
        
    except Exception as e:
        log.warning(f"Error collecting metrics: {e}")
    
    return metrics


def get_ip_address() -> str:
    """Get the primary IP address of this machine."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def get_local_network_cidr() -> str:
    """Auto-detect the local network CIDR."""
    ip = get_ip_address()
    if ip == "127.0.0.1":
        return "192.168.1.0/24"  # Default fallback
    
    # Assume /24 for most home/office networks
    parts = ip.split(".")
    return f"{parts[0]}.{parts[1]}.{parts[2]}.0/24"


# =============================================================================
# Network Scanning (nmap)
# =============================================================================

def check_nmap_installed() -> bool:
    """Check if nmap is installed and accessible."""
    return shutil.which("nmap") is not None


def parse_nmap_xml(xml_output: str) -> List[Dict[str, Any]]:
    """Parse nmap XML output into structured device data."""
    devices = []
    
    try:
        root = ET.fromstring(xml_output)
        
        for host in root.findall(".//host"):
            # Check if host is up
            status = host.find("status")
            if status is None or status.get("state") != "up":
                continue
            
            device = {
                "ip_address": None,
                "hostname": None,
                "mac_address": None,
                "manufacturer": None,
                "device_type": "unknown",
                "os_info": None,
                "open_ports": [],
            }
            
            # Get IP address
            for addr in host.findall("address"):
                if addr.get("addrtype") == "ipv4":
                    device["ip_address"] = addr.get("addr")
                elif addr.get("addrtype") == "mac":
                    device["mac_address"] = addr.get("addr")
                    device["manufacturer"] = addr.get("vendor")
            
            # Get hostname
            hostnames = host.find("hostnames")
            if hostnames is not None:
                hostname_elem = hostnames.find("hostname")
                if hostname_elem is not None:
                    device["hostname"] = hostname_elem.get("name")
            
            # Get OS info
            os_elem = host.find("os")
            if os_elem is not None:
                osmatch = os_elem.find("osmatch")
                if osmatch is not None:
                    device["os_info"] = osmatch.get("name")
                    # Infer device type from OS
                    os_name = device["os_info"].lower() if device["os_info"] else ""
                    if "windows" in os_name:
                        device["device_type"] = "workstation"
                    elif "linux" in os_name:
                        device["device_type"] = "server"
                    elif "router" in os_name or "cisco" in os_name:
                        device["device_type"] = "network"
                    elif "printer" in os_name or "hp" in os_name:
                        device["device_type"] = "printer"
            
            # Get open ports
            ports = host.find("ports")
            if ports is not None:
                for port in ports.findall("port"):
                    state = port.find("state")
                    if state is not None and state.get("state") == "open":
                        service = port.find("service")
                        port_info = {
                            "port": int(port.get("portid")),
                            "protocol": port.get("protocol"),
                            "service": service.get("name") if service is not None else "unknown",
                            "version": None,
                        }
                        if service is not None:
                            version_parts = []
                            if service.get("product"):
                                version_parts.append(service.get("product"))
                            if service.get("version"):
                                version_parts.append(service.get("version"))
                            if version_parts:
                                port_info["version"] = " ".join(version_parts)
                        
                        device["open_ports"].append(port_info)
                        
                        # Infer device type from services if not already set
                        if device["device_type"] == "unknown":
                            svc = port_info["service"].lower()
                            if svc in ["http", "https", "www"]:
                                device["device_type"] = "server"
                            elif svc in ["printer", "ipp", "jetdirect"]:
                                device["device_type"] = "printer"
                            elif svc in ["ssh", "telnet"]:
                                device["device_type"] = "server"
            
            if device["ip_address"]:
                devices.append(device)
    
    except ET.ParseError as e:
        log.error(f"Failed to parse nmap XML: {e}")
    
    return devices


async def run_nmap_scan(
    targets: List[str],
    scan_type: str = "discovery",
    port_range: str = "1-1024",
    timeout: int = 600,
    use_sudo: bool = False
) -> List[Dict[str, Any]]:
    """
    Run an nmap scan and return discovered devices.
    
    scan_type options:
        - "discovery": Quick ping scan to find live hosts
        - "ports": Port scan with service detection
        - "full": Full scan with OS detection (requires sudo)
    """
    if not check_nmap_installed():
        log.error("nmap is not installed. Install with: sudo apt install nmap")
        return []
    
    # Build nmap command
    cmd = ["nmap", "-oX", "-"]  # XML output to stdout
    
    if scan_type == "discovery":
        cmd.extend(["-sn"])  # Ping scan only
    elif scan_type == "ports":
        cmd.extend(["-sS", "-sV", "-p", port_range])  # SYN scan with service detection
    elif scan_type == "full":
        cmd.extend(["-sS", "-sV", "-O", "-p", port_range])  # Include OS detection
        use_sudo = True
    
    # Add timeout
    cmd.extend(["--host-timeout", f"{timeout}s"])
    
    # Add targets
    cmd.extend(targets)
    
    # Prepend sudo if needed
    if use_sudo:
        cmd = ["sudo"] + cmd
    
    log.info(f"Running nmap scan: {' '.join(cmd)}")
    
    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await asyncio.wait_for(
            proc.communicate(),
            timeout=timeout + 60  # Extra buffer for process overhead
        )
        
        if proc.returncode != 0:
            log.warning(f"nmap returned non-zero: {stderr.decode()[:200]}")
        
        xml_output = stdout.decode()
        devices = parse_nmap_xml(xml_output)
        log.info(f"Scan complete: discovered {len(devices)} devices")
        
        return devices
        
    except asyncio.TimeoutError:
        log.error(f"nmap scan timed out after {timeout}s")
        return []
    except Exception as e:
        log.error(f"nmap scan failed: {e}")
        return []


async def run_full_network_scan(targets: List[str] = None) -> List[Dict[str, Any]]:
    """
    Run a comprehensive network scan in stages:
    1. Discovery scan to find live hosts
    2. Port scan on discovered hosts
    3. Optionally OS detection (if enabled and sudo available)
    """
    scan_cfg = config.get("scanning", {})
    scan_types = scan_cfg.get("scan_types", {})
    port_range = scan_cfg.get("port_range", "1-1024")
    timeout = scan_cfg.get("timeout", 600)
    
    # Determine targets
    if not targets:
        targets = scan_cfg.get("targets", [])
    if not targets:
        targets = [get_local_network_cidr()]
        log.info(f"Auto-detected network: {targets[0]}")
    
    all_devices = []
    
    # Stage 1: Discovery
    if scan_types.get("discovery", True):
        log.info("Stage 1: Running host discovery...")
        devices = await run_nmap_scan(targets, "discovery", timeout=timeout)
        
        if not devices:
            log.info("No hosts discovered")
            return []
        
        log.info(f"Discovered {len(devices)} live hosts")
        
        # If only discovery is enabled, return now
        if not scan_types.get("ports", True):
            return devices
        
        # Get list of live IPs for port scanning
        live_ips = [d["ip_address"] for d in devices if d["ip_address"]]
    else:
        live_ips = targets
    
    # Stage 2: Port scan
    if scan_types.get("ports", True) and live_ips:
        log.info(f"Stage 2: Running port scan on {len(live_ips)} hosts...")
        
        # Determine scan type based on OS detection setting
        scan_type = "ports"
        use_sudo = False
        
        if scan_types.get("os_detection", False):
            scan_type = "full"
            use_sudo = scan_cfg.get("sudo_required", False)
        
        all_devices = await run_nmap_scan(
            live_ips,
            scan_type,
            port_range,
            timeout,
            use_sudo
        )
    
    return all_devices


# =============================================================================
# Cisco Meraki Integration
# =============================================================================

class MerakiClient:
    """Client for Cisco Meraki Dashboard API."""
    
    def __init__(self, api_key: str, base_url: str = "https://api.meraki.com/api/v1"):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "X-Cisco-Meraki-API-Key": api_key,
        }
    
    async def _request(
        self,
        session: aiohttp.ClientSession,
        method: str,
        endpoint: str,
        params: Dict = None,
        data: Dict = None
    ) -> Optional[Any]:
        """Make a request to the Meraki API."""
        url = f"{self.base_url}{endpoint}"
        
        try:
            async with session.request(
                method,
                url,
                headers=self.headers,
                params=params,
                json=data,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as resp:
                if resp.status == 200:
                    return await resp.json()
                elif resp.status == 429:
                    # Rate limited - wait and retry
                    retry_after = int(resp.headers.get("Retry-After", 1))
                    log.warning(f"Meraki rate limited, waiting {retry_after}s")
                    await asyncio.sleep(retry_after)
                    return await self._request(session, method, endpoint, params, data)
                else:
                    text = await resp.text()
                    log.warning(f"Meraki API error ({resp.status}): {text[:200]}")
                    return None
        except Exception as e:
            log.error(f"Meraki API request failed: {e}")
            return None
    
    async def get_organizations(self, session: aiohttp.ClientSession) -> List[Dict]:
        """Get all organizations the API key has access to."""
        result = await self._request(session, "GET", "/organizations")
        return result or []
    
    async def get_networks(self, session: aiohttp.ClientSession, org_id: str) -> List[Dict]:
        """Get all networks in an organization."""
        result = await self._request(session, "GET", f"/organizations/{org_id}/networks")
        return result or []
    
    async def get_devices(self, session: aiohttp.ClientSession, org_id: str) -> List[Dict]:
        """Get all devices in an organization."""
        result = await self._request(session, "GET", f"/organizations/{org_id}/devices")
        return result or []
    
    async def get_device_statuses(self, session: aiohttp.ClientSession, org_id: str) -> List[Dict]:
        """Get device statuses for an organization."""
        result = await self._request(session, "GET", f"/organizations/{org_id}/devices/statuses")
        return result or []
    
    async def get_network_clients(
        self,
        session: aiohttp.ClientSession,
        network_id: str,
        timespan: int = 86400
    ) -> List[Dict]:
        """Get clients in a network (default: last 24 hours)."""
        params = {"timespan": min(timespan, 2592000)}  # Max 30 days
        result = await self._request(session, "GET", f"/networks/{network_id}/clients", params)
        return result or []
    
    async def get_appliance_uplinks(self, session: aiohttp.ClientSession, org_id: str) -> List[Dict]:
        """Get uplink statuses for appliances in an organization."""
        result = await self._request(
            session, "GET",
            f"/organizations/{org_id}/appliance/uplink/statuses"
        )
        return result or []
    
    async def get_vpn_statuses(self, session: aiohttp.ClientSession, org_id: str) -> List[Dict]:
        """Get VPN statuses for an organization."""
        result = await self._request(
            session, "GET",
            f"/organizations/{org_id}/appliance/vpn/statuses"
        )
        return result or []
    
    async def get_org_summary(self, session: aiohttp.ClientSession, org_id: str) -> Dict:
        """Get organization license overview."""
        result = await self._request(session, "GET", f"/organizations/{org_id}/licenses/overview")
        return result or {}


async def collect_meraki_data(session: aiohttp.ClientSession) -> Dict[str, Any]:
    """Collect data from Meraki Dashboard API."""
    meraki_cfg = config.get("meraki", {})
    
    api_key = meraki_cfg.get("api_key")
    if not api_key:
        log.error("Meraki API key not configured")
        return {}
    
    base_url = meraki_cfg.get("base_url", "https://api.meraki.com/api/v1")
    client = MerakiClient(api_key, base_url)
    
    data = {
        "collected_at": datetime.utcnow().isoformat(),
        "organizations": [],
        "networks": [],
        "devices": [],
        "device_statuses": [],
        "clients": [],
        "uplinks": [],
        "vpn_statuses": [],
    }
    
    try:
        # Get organizations
        if meraki_cfg.get("collect_organizations", True):
            log.info("Collecting Meraki organizations...")
            orgs = await client.get_organizations(session)
            data["organizations"] = orgs
            log.info(f"Found {len(orgs)} organizations")
        
        # For each organization, collect additional data
        for org in data["organizations"]:
            org_id = org.get("id")
            org_name = org.get("name", "Unknown")
            
            if not org_id:
                continue
            
            # Get networks
            if meraki_cfg.get("collect_networks", True):
                log.info(f"Collecting networks for org: {org_name}")
                networks = await client.get_networks(session, org_id)
                for net in networks:
                    net["organization_id"] = org_id
                    net["organization_name"] = org_name
                data["networks"].extend(networks)
            
            # Get devices
            if meraki_cfg.get("collect_devices", True):
                log.info(f"Collecting devices for org: {org_name}")
                devices = await client.get_devices(session, org_id)
                for dev in devices:
                    dev["organization_id"] = org_id
                    dev["organization_name"] = org_name
                data["devices"].extend(devices)
                
                # Get device statuses
                statuses = await client.get_device_statuses(session, org_id)
                for status in statuses:
                    status["organization_id"] = org_id
                data["device_statuses"].extend(statuses)
            
            # Get uplinks
            if meraki_cfg.get("collect_uplinks", True):
                log.info(f"Collecting uplinks for org: {org_name}")
                uplinks = await client.get_appliance_uplinks(session, org_id)
                for uplink in uplinks:
                    uplink["organization_id"] = org_id
                data["uplinks"].extend(uplinks)
            
            # Get VPN statuses
            if meraki_cfg.get("collect_vpn_status", False):
                log.info(f"Collecting VPN status for org: {org_name}")
                vpn_statuses = await client.get_vpn_statuses(session, org_id)
                for vpn in vpn_statuses:
                    vpn["organization_id"] = org_id
                data["vpn_statuses"].extend(vpn_statuses)
        
        # Get clients for each network
        if meraki_cfg.get("collect_clients", True):
            timespan = meraki_cfg.get("client_timespan", 86400)
            for network in data["networks"]:
                net_id = network.get("id")
                net_name = network.get("name", "Unknown")
                
                if not net_id:
                    continue
                
                log.info(f"Collecting clients for network: {net_name}")
                clients = await client.get_network_clients(session, net_id, timespan)
                for cli in clients:
                    cli["network_id"] = net_id
                    cli["network_name"] = net_name
                    cli["organization_id"] = network.get("organization_id")
                data["clients"].extend(clients)
                
                # Rate limiting - small delay between network requests
                await asyncio.sleep(0.2)
        
        log.info(f"Meraki collection complete: {len(data['organizations'])} orgs, "
                 f"{len(data['networks'])} networks, {len(data['devices'])} devices, "
                 f"{len(data['clients'])} clients")
        
    except Exception as e:
        log.error(f"Error collecting Meraki data: {e}")
    
    return data


async def send_meraki_data(session: aiohttp.ClientSession, meraki_data: Dict[str, Any]) -> bool:
    """Send Meraki data to the Vanguard backend."""
    payload = {
        "device_id": config["agent"]["device_id"],
        "data_type": "meraki",
        "meraki_data": meraki_data,
        "timestamp": datetime.utcnow().isoformat(),
    }
    
    result = await api_request(session, "meraki_data", payload)
    
    if result and result.get("status") == "ok":
        log.info("Meraki data sent successfully")
        return True
    else:
        log.warning("Failed to send Meraki data")
        return False


# =============================================================================
# SNMP Monitoring
# =============================================================================

# Common SNMP OIDs for network device monitoring
SNMP_OIDS = {
    # System information
    "sysDescr": "1.3.6.1.2.1.1.1.0",
    "sysUpTime": "1.3.6.1.2.1.1.3.0",
    "sysName": "1.3.6.1.2.1.1.5.0",
    "sysLocation": "1.3.6.1.2.1.1.6.0",
    "sysContact": "1.3.6.1.2.1.1.4.0",
    
    # Interface statistics
    "ifNumber": "1.3.6.1.2.1.2.1.0",
    "ifDescr": "1.3.6.1.2.1.2.2.1.2",
    "ifType": "1.3.6.1.2.1.2.2.1.3",
    "ifSpeed": "1.3.6.1.2.1.2.2.1.5",
    "ifPhysAddress": "1.3.6.1.2.1.2.2.1.6",
    "ifAdminStatus": "1.3.6.1.2.1.2.2.1.7",
    "ifOperStatus": "1.3.6.1.2.1.2.2.1.8",
    "ifInOctets": "1.3.6.1.2.1.2.2.1.10",
    "ifOutOctets": "1.3.6.1.2.1.2.2.1.16",
    "ifInErrors": "1.3.6.1.2.1.2.2.1.14",
    "ifOutErrors": "1.3.6.1.2.1.2.2.1.20",
    
    # CPU/Memory (varies by vendor)
    "hrProcessorLoad": "1.3.6.1.2.1.25.3.3.1.2",  # HOST-RESOURCES-MIB
    "hrStorageUsed": "1.3.6.1.2.1.25.2.3.1.6",
    "hrStorageSize": "1.3.6.1.2.1.25.2.3.1.5",
    
    # Cisco specific
    "cpmCPUTotal5min": "1.3.6.1.4.1.9.9.109.1.1.1.1.5",
    "ciscoMemoryPoolUsed": "1.3.6.1.4.1.9.9.48.1.1.1.5",
    "ciscoMemoryPoolFree": "1.3.6.1.4.1.9.9.48.1.1.1.6",
}


async def snmp_get(target: str, oid: str, snmp_cfg: Dict) -> Optional[Any]:
    """Perform an SNMP GET request."""
    if not HAS_SNMP:
        return None
    
    try:
        community = snmp_cfg.get("community", "public")
        port = snmp_cfg.get("port", 161)
        timeout_val = snmp_cfg.get("timeout", 5)
        retries = snmp_cfg.get("retries", 2)
        
        errorIndication, errorStatus, errorIndex, varBinds = await getCmd(
            SnmpEngine(),
            CommunityData(community),
            UdpTransportTarget((target, port), timeout=timeout_val, retries=retries),
            ContextData(),
            ObjectType(ObjectIdentity(oid))
        )
        
        if errorIndication:
            log.debug(f"SNMP error for {target}: {errorIndication}")
            return None
        elif errorStatus:
            log.debug(f"SNMP status error for {target}: {errorStatus}")
            return None
        else:
            for varBind in varBinds:
                return varBind[1].prettyPrint()
        
    except Exception as e:
        log.debug(f"SNMP get failed for {target}: {e}")
    
    return None


async def snmp_walk(target: str, base_oid: str, snmp_cfg: Dict) -> List[Tuple[str, Any]]:
    """Perform an SNMP WALK request."""
    if not HAS_SNMP:
        return []
    
    results = []
    try:
        community = snmp_cfg.get("community", "public")
        port = snmp_cfg.get("port", 161)
        timeout_val = snmp_cfg.get("timeout", 5)
        
        async for errorIndication, errorStatus, errorIndex, varBinds in walkCmd(
            SnmpEngine(),
            CommunityData(community),
            UdpTransportTarget((target, port), timeout=timeout_val),
            ContextData(),
            ObjectType(ObjectIdentity(base_oid))
        ):
            if errorIndication or errorStatus:
                break
            for varBind in varBinds:
                oid_str = str(varBind[0])
                value = varBind[1].prettyPrint()
                results.append((oid_str, value))
        
    except Exception as e:
        log.debug(f"SNMP walk failed for {target}: {e}")
    
    return results


async def poll_snmp_device(target: str, snmp_cfg: Dict) -> Optional[Dict[str, Any]]:
    """Poll a single device via SNMP and return its data."""
    device_data = {
        "ip_address": target,
        "polled_at": datetime.utcnow().isoformat(),
        "snmp_reachable": False,
        "system": {},
        "interfaces": [],
        "metrics": {},
    }
    
    # Get system information
    sys_name = await snmp_get(target, SNMP_OIDS["sysName"], snmp_cfg)
    if sys_name:
        device_data["snmp_reachable"] = True
        device_data["system"]["name"] = sys_name
    else:
        # Device not reachable via SNMP
        return None
    
    device_data["system"]["description"] = await snmp_get(target, SNMP_OIDS["sysDescr"], snmp_cfg)
    device_data["system"]["uptime"] = await snmp_get(target, SNMP_OIDS["sysUpTime"], snmp_cfg)
    device_data["system"]["location"] = await snmp_get(target, SNMP_OIDS["sysLocation"], snmp_cfg)
    device_data["system"]["contact"] = await snmp_get(target, SNMP_OIDS["sysContact"], snmp_cfg)
    
    # Get interface information
    if_count = await snmp_get(target, SNMP_OIDS["ifNumber"], snmp_cfg)
    if if_count:
        device_data["interface_count"] = int(if_count)
        
        # Walk interface descriptions
        if_data = await snmp_walk(target, SNMP_OIDS["ifDescr"], snmp_cfg)
        if_oper_status = await snmp_walk(target, SNMP_OIDS["ifOperStatus"], snmp_cfg)
        if_in_octets = await snmp_walk(target, SNMP_OIDS["ifInOctets"], snmp_cfg)
        if_out_octets = await snmp_walk(target, SNMP_OIDS["ifOutOctets"], snmp_cfg)
        
        # Build interface list
        for oid, name in if_data:
            if_index = oid.split(".")[-1]
            interface = {
                "index": if_index,
                "name": name,
                "status": None,
                "in_octets": None,
                "out_octets": None,
            }
            
            # Find matching status and counters
            for status_oid, status in if_oper_status:
                if status_oid.endswith(f".{if_index}"):
                    interface["status"] = "up" if status == "1" else "down"
                    break
            
            for in_oid, in_val in if_in_octets:
                if in_oid.endswith(f".{if_index}"):
                    interface["in_octets"] = int(in_val)
                    break
            
            for out_oid, out_val in if_out_octets:
                if out_oid.endswith(f".{if_index}"):
                    interface["out_octets"] = int(out_val)
                    break
            
            device_data["interfaces"].append(interface)
    
    # Try to get CPU (host-resources MIB)
    cpu_load = await snmp_get(target, SNMP_OIDS["hrProcessorLoad"] + ".1", snmp_cfg)
    if cpu_load:
        device_data["metrics"]["cpu_percent"] = int(cpu_load)
    
    # Try Cisco-specific OIDs
    cisco_cpu = await snmp_get(target, SNMP_OIDS["cpmCPUTotal5min"] + ".1", snmp_cfg)
    if cisco_cpu:
        device_data["metrics"]["cpu_percent"] = int(cisco_cpu)
        device_data["vendor"] = "Cisco"
    
    return device_data


async def collect_snmp_data(targets: List[str] = None) -> List[Dict[str, Any]]:
    """Collect SNMP data from all configured or discovered targets."""
    snmp_cfg = config.get("snmp", {})
    
    if not HAS_SNMP:
        log.warning("SNMP support not available. Install with: pip install pysnmp")
        return []
    
    # Determine targets
    if not targets:
        targets = snmp_cfg.get("targets", [])
    
    if not targets:
        # Auto-discover targets via nmap or ARP
        log.info("No SNMP targets configured, attempting auto-discovery...")
        discovered = await discover_network_devices()
        targets = [d["ip_address"] for d in discovered if d.get("ip_address")]
    
    log.info(f"Polling {len(targets)} targets via SNMP...")
    
    # Poll devices concurrently
    tasks = [poll_snmp_device(target, snmp_cfg) for target in targets]
    results = await asyncio.gather(*tasks)
    
    # Filter out None results (unreachable devices)
    devices = [d for d in results if d is not None]
    
    log.info(f"SNMP collection complete: {len(devices)}/{len(targets)} devices responded")
    return devices


async def send_snmp_data(session: aiohttp.ClientSession, snmp_data: List[Dict]) -> bool:
    """Send SNMP data to the Vanguard backend."""
    payload = {
        "device_id": config["agent"]["device_id"],
        "data_type": "snmp",
        "snmp_devices": snmp_data,
        "timestamp": datetime.utcnow().isoformat(),
    }
    
    result = await api_request(session, "snmp_data", payload)
    
    if result and result.get("status") == "ok":
        log.info(f"SNMP data sent: {len(snmp_data)} devices")
        return True
    return False


# =============================================================================
# Network Discovery (ARP / Ping Sweep)
# =============================================================================

def get_arp_table() -> List[Dict[str, str]]:
    """Get the current ARP table."""
    devices = []
    
    try:
        if platform.system() == "Windows":
            output = subprocess.check_output(["arp", "-a"], text=True)
            # Parse Windows ARP output
            for line in output.split("\n"):
                match = re.search(r"(\d+\.\d+\.\d+\.\d+)\s+([\w-]+)", line)
                if match:
                    ip = match.group(1)
                    mac = match.group(2).replace("-", ":").lower()
                    if ip != "255.255.255.255" and not ip.startswith("224."):
                        devices.append({"ip_address": ip, "mac_address": mac})
        else:
            # Linux/Mac
            output = subprocess.check_output(["arp", "-a"], text=True)
            for line in output.split("\n"):
                match = re.search(r"\((\d+\.\d+\.\d+\.\d+)\)\s+at\s+([\w:]+)", line)
                if match:
                    devices.append({
                        "ip_address": match.group(1),
                        "mac_address": match.group(2).lower()
                    })
    except Exception as e:
        log.warning(f"Failed to get ARP table: {e}")
    
    return devices


async def ping_sweep(network_cidr: str) -> List[str]:
    """Perform a ping sweep to discover active hosts."""
    live_hosts = []
    
    try:
        # Use nmap for fast ping sweep if available
        if check_nmap_installed():
            proc = await asyncio.create_subprocess_exec(
                "nmap", "-sn", "-n", network_cidr, "-oG", "-",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=120)
            
            for line in stdout.decode().split("\n"):
                match = re.search(r"Host:\s+(\d+\.\d+\.\d+\.\d+)", line)
                if match:
                    live_hosts.append(match.group(1))
        else:
            # Fallback to Python ping (slower)
            import ipaddress
            network = ipaddress.ip_network(network_cidr, strict=False)
            
            async def ping_host(ip):
                try:
                    proc = await asyncio.create_subprocess_exec(
                        "ping", "-c", "1", "-W", "1", str(ip),
                        stdout=asyncio.subprocess.DEVNULL,
                        stderr=asyncio.subprocess.DEVNULL
                    )
                    await asyncio.wait_for(proc.wait(), timeout=2)
                    if proc.returncode == 0:
                        return str(ip)
                except:
                    pass
                return None
            
            # Ping all hosts concurrently (in batches)
            for batch_start in range(0, min(network.num_addresses, 256), 50):
                batch = list(network.hosts())[batch_start:batch_start+50]
                results = await asyncio.gather(*[ping_host(ip) for ip in batch])
                live_hosts.extend([ip for ip in results if ip])
    
    except Exception as e:
        log.warning(f"Ping sweep failed: {e}")
    
    return live_hosts


async def discover_network_devices() -> List[Dict[str, Any]]:
    """Discover devices on the network using multiple methods."""
    devices = {}
    
    # Get local network
    network_cidr = get_local_network_cidr()
    log.info(f"Discovering devices on {network_cidr}...")
    
    # Method 1: ARP table
    arp_devices = get_arp_table()
    for dev in arp_devices:
        ip = dev["ip_address"]
        if ip not in devices:
            devices[ip] = dev
        else:
            devices[ip].update(dev)
    
    log.info(f"Found {len(arp_devices)} devices in ARP table")
    
    # Method 2: Ping sweep
    live_hosts = await ping_sweep(network_cidr)
    for ip in live_hosts:
        if ip not in devices:
            devices[ip] = {"ip_address": ip}
    
    log.info(f"Found {len(live_hosts)} live hosts via ping sweep")
    
    # Try to get hostnames via DNS
    for ip, dev in devices.items():
        try:
            hostname, _, _ = socket.gethostbyaddr(ip)
            dev["hostname"] = hostname
        except:
            pass
    
    result = list(devices.values())
    log.info(f"Total discovered devices: {len(result)}")
    return result


# =============================================================================
# Sub-Agent Collection
# =============================================================================

# Storage for sub-agent data
sub_agent_data: Dict[str, Dict] = {}


async def handle_sub_agent_report(data: Dict) -> Dict:
    """Handle incoming report from a sub-agent."""
    agent_id = data.get("agent_id")
    if not agent_id:
        return {"error": "Missing agent_id"}
    
    # Validate auth token
    expected_token = config.get("sub_agents", {}).get("auth_token")
    if expected_token and data.get("auth_token") != expected_token:
        return {"error": "Invalid auth token"}
    
    # Store sub-agent data
    sub_agent_data[agent_id] = {
        "agent_id": agent_id,
        "hostname": data.get("hostname"),
        "ip_address": data.get("ip_address"),
        "metrics": data.get("metrics", {}),
        "last_seen": datetime.utcnow().isoformat(),
    }
    
    log.info(f"Received report from sub-agent: {agent_id}")
    return {"status": "ok"}


async def sub_agent_server():
    """Run a simple HTTP server for sub-agents to report to."""
    sub_cfg = config.get("sub_agents", {})
    
    if not sub_cfg.get("enabled"):
        return
    
    port = sub_cfg.get("listen_port", 5678)
    
    async def handler(reader, writer):
        try:
            # Read request
            data = await asyncio.wait_for(reader.read(65536), timeout=10)
            
            # Parse HTTP request (simple)
            lines = data.decode().split("\r\n")
            body_start = lines.index("") + 1 if "" in lines else -1
            
            if body_start > 0:
                body = "\r\n".join(lines[body_start:])
                try:
                    json_data = json.loads(body)
                    result = await handle_sub_agent_report(json_data)
                    response_body = json.dumps(result)
                except:
                    response_body = '{"error": "Invalid JSON"}'
            else:
                response_body = '{"error": "No body"}'
            
            # Send response
            response = f"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {len(response_body)}\r\n\r\n{response_body}"
            writer.write(response.encode())
            await writer.drain()
        except Exception as e:
            log.debug(f"Sub-agent handler error: {e}")
        finally:
            writer.close()
    
    server = await asyncio.start_server(handler, "0.0.0.0", port)
    log.info(f"Sub-agent server listening on port {port}")
    
    async with server:
        await server.serve_forever()


async def send_sub_agent_data(session: aiohttp.ClientSession) -> bool:
    """Send collected sub-agent data to the backend."""
    if not sub_agent_data:
        return True
    
    payload = {
        "device_id": config["agent"]["device_id"],
        "data_type": "sub_agents",
        "sub_agents": list(sub_agent_data.values()),
        "timestamp": datetime.utcnow().isoformat(),
    }
    
    result = await api_request(session, "sub_agent_data", payload)
    return result and result.get("status") == "ok"


# =============================================================================
# API Communication
# =============================================================================

def build_url(action: str) -> str:
    """Build API URL with action parameter."""
    endpoint = config["api"]["endpoint"].rstrip("/")
    return f"{endpoint}?action={action}"


def get_headers() -> Dict[str, str]:
    """Get headers for API requests."""
    return {
        "Content-Type": "application/json",
        "X-VANGUARD-KEY": config["api"]["secret_key"],
    }


async def api_request(
    session: aiohttp.ClientSession,
    action: str,
    payload: Dict[str, Any],
    method: str = "POST"
) -> Optional[Dict[str, Any]]:
    """Make an API request to the Vanguard backend."""
    url = build_url(action)
    timeout = aiohttp.ClientTimeout(total=config["api"].get("timeout", 30))
    
    try:
        async with session.request(
            method,
            url,
            headers=get_headers(),
            json=payload,
            timeout=timeout
        ) as resp:
            text = await resp.text()
            
            if resp.status == 200:
                try:
                    return {"status": "ok", "data": await resp.json()}
                except:
                    return {"status": "ok", "data": text}
            else:
                log.warning(f"API {action} failed ({resp.status}): {text[:200]}")
                return {"status": "error", "code": resp.status, "message": text}
                
    except asyncio.TimeoutError:
        log.error(f"API {action} timeout")
        return None
    except aiohttp.ClientError as e:
        log.error(f"API {action} error: {e}")
        return None


# =============================================================================
# Agent Operations
# =============================================================================

async def register_agent(session: aiohttp.ClientSession) -> bool:
    """Register this agent with the Vanguard backend."""
    global agent_id
    
    meraki_cfg = config.get("meraki", {})
    snmp_cfg = config.get("snmp", {})
    sub_agent_cfg = config.get("sub_agents", {})
    
    payload = {
        "device_id": config["agent"]["device_id"],
        "name": config["agent"].get("name", platform.node()),
        "location": config["agent"].get("location", "default"),
        "user_id": config["agent"]["user_id"],
        "ip_address": get_ip_address(),
        "os_type": platform.system(),
        "os_version": platform.release(),
        "agent_version": "2.0.0",  # Updated for comprehensive network monitoring
        "capabilities": {
            "network_scanning": check_nmap_installed(),
            "os_detection": config.get("scanning", {}).get("scan_types", {}).get("os_detection", False),
            "meraki_integration": bool(meraki_cfg.get("enabled") and meraki_cfg.get("api_key")),
            "snmp_polling": HAS_SNMP and snmp_cfg.get("enabled", False),
            "network_discovery": True,  # Always available via ARP/ping
            "sub_agent_collection": sub_agent_cfg.get("enabled", False),
        },
    }
    
    log.info(f"Registering agent: {payload['device_id']}")
    result = await api_request(session, "register", payload)
    
    if result and result.get("status") == "ok":
        data = result.get("data", {})
        agent_id = data.get("agent_id")
        log.info(f"Registration successful! Agent ID: {agent_id}")
        return True
    else:
        log.error("Registration failed")
        return False


async def send_heartbeat(session: aiohttp.ClientSession) -> bool:
    """Send heartbeat with system metrics."""
    metrics = get_system_metrics()
    meraki_cfg = config.get("meraki", {})
    
    payload = {
        "device_id": config["agent"]["device_id"],
        "cpu_percent": metrics.get("cpu_percent", 0),
        "memory_percent": metrics.get("memory_percent", 0),
        "disk_percent": metrics.get("disk_percent", 0),
        "network_rx_bytes": metrics.get("network_rx_bytes"),
        "network_tx_bytes": metrics.get("network_tx_bytes"),
        "temperature": metrics.get("temperature"),
        "custom_metrics": {
            "uptime_seconds": metrics.get("uptime_seconds"),
            "load_1m": metrics.get("load_1m"),
            "hostname": metrics.get("hostname"),
            "nmap_available": check_nmap_installed(),
            "meraki_enabled": bool(meraki_cfg.get("enabled") and meraki_cfg.get("api_key")),
        },
    }
    
    result = await api_request(session, "heartbeat", payload)
    
    if result and result.get("status") == "ok":
        log.debug(f"Heartbeat OK - CPU: {payload['cpu_percent']}%, MEM: {payload['memory_percent']}%, DISK: {payload['disk_percent']}%")
        return True
    else:
        log.warning("Heartbeat failed")
        return False


async def poll_commands(session: aiohttp.ClientSession) -> list:
    """Poll for pending commands from the backend."""
    payload = {
        "device_id": config["agent"]["device_id"],
    }
    
    result = await api_request(session, "get_commands", payload)
    
    if result and result.get("status") == "ok":
        data = result.get("data", {})
        commands = data.get("commands", [])
        if commands:
            log.info(f"Received {len(commands)} command(s)")
        return commands
    
    return []


async def execute_command(session: aiohttp.ClientSession, command: Dict[str, Any]) -> Dict[str, Any]:
    """Execute a command and return the result."""
    cmd_id = command.get("id")
    cmd_type = command.get("command_type")
    payload = command.get("payload", {})
    
    log.info(f"Executing command {cmd_id}: {cmd_type}")
    
    result = {
        "command_id": cmd_id,
        "status": "completed",
        "output": None,
        "error": None,
    }
    
    try:
        if cmd_type == "shell":
            # Execute shell command (be careful with security!)
            if not config.get("features", {}).get("execute_commands", True):
                result["status"] = "rejected"
                result["error"] = "Command execution disabled"
            else:
                script = payload.get("script", "")
                proc = subprocess.run(
                    script,
                    shell=True,
                    capture_output=True,
                    text=True,
                    timeout=300
                )
                result["output"] = proc.stdout
                result["error"] = proc.stderr if proc.returncode != 0 else None
                result["status"] = "completed" if proc.returncode == 0 else "failed"
                result["return_code"] = proc.returncode
                
        elif cmd_type == "get_metrics":
            result["output"] = get_system_metrics()
            
        elif cmd_type == "ping":
            result["output"] = {"pong": True, "timestamp": int(time.time())}
            
        elif cmd_type == "network_scan":
            # On-demand network scan
            if not check_nmap_installed():
                result["status"] = "failed"
                result["error"] = "nmap is not installed"
            else:
                targets = payload.get("targets", config.get("scanning", {}).get("targets", []))
                devices = await run_full_network_scan(targets if targets else None)
                result["output"] = {
                    "devices_found": len(devices),
                    "devices": devices,
                    "scan_time": datetime.utcnow().isoformat(),
                }
                # Also send results to the API
                await send_scan_results(session, [], devices)
        
        elif cmd_type == "meraki_sync":
            # On-demand Meraki data sync
            meraki_cfg = config.get("meraki", {})
            if not meraki_cfg.get("api_key"):
                result["status"] = "failed"
                result["error"] = "Meraki API key not configured"
            else:
                meraki_data = await collect_meraki_data(session)
                result["output"] = {
                    "organizations": len(meraki_data.get("organizations", [])),
                    "networks": len(meraki_data.get("networks", [])),
                    "devices": len(meraki_data.get("devices", [])),
                    "clients": len(meraki_data.get("clients", [])),
                    "sync_time": datetime.utcnow().isoformat(),
                }
                await send_meraki_data(session, meraki_data)
        
        elif cmd_type == "meraki_get_orgs":
            # Get Meraki organizations
            meraki_cfg = config.get("meraki", {})
            if not meraki_cfg.get("api_key"):
                result["status"] = "failed"
                result["error"] = "Meraki API key not configured"
            else:
                client = MerakiClient(meraki_cfg["api_key"])
                orgs = await client.get_organizations(session)
                result["output"] = orgs
        
        elif cmd_type == "snmp_poll":
            # On-demand SNMP poll
            if not HAS_SNMP:
                result["status"] = "failed"
                result["error"] = "pysnmp not installed. Install with: pip install pysnmp"
            else:
                targets = payload.get("targets", [])
                snmp_data = await collect_snmp_data(targets if targets else None)
                result["output"] = {
                    "devices_polled": len(snmp_data),
                    "devices": snmp_data,
                    "poll_time": datetime.utcnow().isoformat(),
                }
                await send_snmp_data(session, snmp_data)
        
        elif cmd_type == "discover":
            # On-demand network discovery
            discovered = await discover_network_devices()
            result["output"] = {
                "devices_found": len(discovered),
                "devices": discovered,
                "discovery_time": datetime.utcnow().isoformat(),
            }
        
        elif cmd_type == "get_arp":
            # Get ARP table
            arp_table = get_arp_table()
            result["output"] = {
                "entries": len(arp_table),
                "arp_table": arp_table,
            }
        
        elif cmd_type == "get_sub_agents":
            # Get sub-agent data
            result["output"] = {
                "sub_agent_count": len(sub_agent_data),
                "sub_agents": list(sub_agent_data.values()),
            }
                
        else:
            result["status"] = "unknown"
            result["error"] = f"Unknown command type: {cmd_type}"
            
    except Exception as e:
        result["status"] = "failed"
        result["error"] = str(e)
        log.error(f"Command {cmd_id} failed: {e}")
    
    return result


async def send_command_response(
    session: aiohttp.ClientSession,
    result: Dict[str, Any]
) -> bool:
    """Send command execution result back to the backend."""
    payload = {
        "command_id": result["command_id"],
        "device_id": config["agent"]["device_id"],
        "status": result["status"],
        "output": result.get("output"),
        "error": result.get("error"),
    }
    
    response = await api_request(session, "command_response", payload)
    return response and response.get("status") == "ok"


async def send_scan_results(
    session: aiohttp.ClientSession,
    findings: list,
    network_devices: list = None
) -> bool:
    """Send scan results to the backend."""
    payload = {
        "device_id": config["agent"]["device_id"],
        "findings": findings,
        "network_devices": network_devices or [],
        "scan_timestamp": datetime.utcnow().isoformat(),
    }
    
    result = await api_request(session, "scan_results", payload)
    
    if result and result.get("status") == "ok":
        log.info(f"Scan results sent: {len(findings)} findings, {len(network_devices or [])} devices")
        return True
    
    return False


# =============================================================================
# Main Loops
# =============================================================================

async def heartbeat_loop(session: aiohttp.ClientSession) -> None:
    """Continuously send heartbeats at configured interval."""
    interval = config["intervals"].get("heartbeat", 60)
    log.info(f"Starting heartbeat loop (interval: {interval}s)")
    
    while running:
        await send_heartbeat(session)
        await asyncio.sleep(interval)


async def command_loop(session: aiohttp.ClientSession) -> None:
    """Continuously poll for and execute commands."""
    interval = config["intervals"].get("command_poll", 30)
    log.info(f"Starting command loop (interval: {interval}s)")
    
    while running:
        try:
            commands = await poll_commands(session)
            
            for cmd in commands:
                result = await execute_command(session, cmd)
                await send_command_response(session, result)
                
        except Exception as e:
            log.error(f"Command loop error: {e}")
        
        await asyncio.sleep(interval)


async def scan_loop(session: aiohttp.ClientSession) -> None:
    """Periodically run network scans and report results."""
    scan_cfg = config.get("scanning", {})
    
    if not scan_cfg.get("enabled", False):
        log.info("Network scanning is disabled")
        return
    
    if not check_nmap_installed():
        log.warning("Network scanning enabled but nmap is not installed")
        return
    
    interval = config["intervals"].get("scan", 3600)
    log.info(f"Starting scan loop (interval: {interval}s)")
    
    # Initial delay to let other loops start first
    await asyncio.sleep(10)
    
    while running:
        try:
            log.info("Starting scheduled network scan...")
            devices = await run_full_network_scan()
            
            if devices:
                await send_scan_results(session, [], devices)
            
        except Exception as e:
            log.error(f"Scan loop error: {e}")
        
        await asyncio.sleep(interval)


async def meraki_loop(session: aiohttp.ClientSession) -> None:
    """Periodically collect and report Meraki data."""
    meraki_cfg = config.get("meraki", {})
    
    if not meraki_cfg.get("enabled", False):
        log.info("Meraki integration is disabled")
        return
    
    if not meraki_cfg.get("api_key"):
        log.warning("Meraki enabled but API key not configured")
        return
    
    interval = config["intervals"].get("meraki", 300)
    log.info(f"Starting Meraki loop (interval: {interval}s)")
    
    # Initial delay
    await asyncio.sleep(15)
    
    while running:
        try:
            log.info("Starting Meraki data collection...")
            meraki_data = await collect_meraki_data(session)
            
            if meraki_data.get("organizations"):
                await send_meraki_data(session, meraki_data)
            
        except Exception as e:
            log.error(f"Meraki loop error: {e}")
        
        await asyncio.sleep(interval)


async def snmp_loop(session: aiohttp.ClientSession) -> None:
    """Periodically poll SNMP devices and report data."""
    snmp_cfg = config.get("snmp", {})
    
    if not snmp_cfg.get("enabled", False):
        log.info("SNMP polling is disabled")
        return
    
    if not HAS_SNMP:
        log.warning("SNMP enabled but pysnmp not installed")
        return
    
    interval = config["intervals"].get("snmp", 300)
    log.info(f"Starting SNMP loop (interval: {interval}s)")
    
    # Initial delay
    await asyncio.sleep(20)
    
    while running:
        try:
            log.info("Starting SNMP data collection...")
            snmp_data = await collect_snmp_data()
            
            if snmp_data:
                await send_snmp_data(session, snmp_data)
            
        except Exception as e:
            log.error(f"SNMP loop error: {e}")
        
        await asyncio.sleep(interval)


async def discovery_loop(session: aiohttp.ClientSession) -> None:
    """Periodically discover network devices."""
    interval = config["intervals"].get("discovery", 1800)
    
    # Only run if explicitly enabled or no other discovery method is active
    scan_enabled = config.get("scanning", {}).get("enabled", False)
    snmp_enabled = config.get("snmp", {}).get("enabled", False)
    
    if scan_enabled or snmp_enabled:
        log.info("Discovery handled by nmap/SNMP, skipping passive discovery loop")
        return
    
    log.info(f"Starting discovery loop (interval: {interval}s)")
    
    # Initial delay
    await asyncio.sleep(25)
    
    while running:
        try:
            log.info("Starting network discovery...")
            devices = await discover_network_devices()
            
            if devices:
                # Send as scan results
                await send_scan_results(session, [], devices)
            
        except Exception as e:
            log.error(f"Discovery loop error: {e}")
        
        await asyncio.sleep(interval)


async def main_async(args: argparse.Namespace) -> None:
    """Main async entry point."""
    global config, running
    
    # Load configuration
    config = load_config(args.config)
    setup_logging(config)
    
    meraki_cfg = config.get("meraki", {})
    snmp_cfg = config.get("snmp", {})
    
    log.info("=" * 60)
    log.info("Ultrium Vanguard Agent Starting")
    log.info(f"Device ID: {config['agent']['device_id']}")
    log.info(f"Endpoint: {config['api']['endpoint']}")
    log.info(f"nmap available: {check_nmap_installed()}")
    log.info(f"SNMP available: {HAS_SNMP}")
    log.info(f"Meraki enabled: {meraki_cfg.get('enabled', False)}")
    log.info(f"SNMP enabled: {snmp_cfg.get('enabled', False)}")
    log.info("=" * 60)
    
    # Validate config
    if not validate_config(config):
        sys.exit(1)
    
    # Create HTTP session
    async with aiohttp.ClientSession() as session:
        
        # Test mode
        if args.test:
            log.info("Testing connection...")
            if await send_heartbeat(session):
                log.info("✓ Connection successful!")
            else:
                log.error("✗ Connection failed")
            return
        
        # Register mode
        if args.register:
            await register_agent(session)
            return
        
        # Scan mode (one-time scan)
        if args.scan:
            log.info("Running one-time network scan...")
            devices = await run_full_network_scan()
            if devices:
                print(f"\nDiscovered {len(devices)} devices:\n")
                for d in devices:
                    print(f"  {d['ip_address']:15} | {d.get('hostname') or 'N/A':20} | {d.get('os_info') or 'Unknown OS'}")
                    if d.get("open_ports"):
                        ports = ", ".join(str(p["port"]) for p in d["open_ports"][:5])
                        print(f"                    └─ Ports: {ports}")
                
                # Send results if we have valid config
                if validate_config(config):
                    await send_scan_results(session, [], devices)
                    log.info("Scan results sent to Vanguard")
            else:
                print("\nNo devices discovered")
            return
        
        # Meraki mode (one-time sync)
        if args.meraki:
            log.info("Running one-time Meraki sync...")
            if not meraki_cfg.get("api_key"):
                log.error("Meraki API key not configured in config.yaml")
                sys.exit(1)
            
            meraki_data = await collect_meraki_data(session)
            
            print(f"\nMeraki Data Summary:")
            print(f"  Organizations: {len(meraki_data.get('organizations', []))}")
            print(f"  Networks:      {len(meraki_data.get('networks', []))}")
            print(f"  Devices:       {len(meraki_data.get('devices', []))}")
            print(f"  Clients:       {len(meraki_data.get('clients', []))}")
            print(f"  Uplinks:       {len(meraki_data.get('uplinks', []))}")
            
            # Print organization details
            for org in meraki_data.get("organizations", []):
                print(f"\n  Org: {org.get('name')} (ID: {org.get('id')})")
            
            # Send to Vanguard if config is valid
            if validate_config(config):
                await send_meraki_data(session, meraki_data)
                log.info("Meraki data sent to Vanguard")
            return
        
        # SNMP mode (one-time poll)
        if args.snmp:
            log.info("Running one-time SNMP poll...")
            if not HAS_SNMP:
                log.error("pysnmp not installed. Install with: pip install pysnmp")
                sys.exit(1)
            
            snmp_data = await collect_snmp_data()
            
            print(f"\nSNMP Poll Summary:")
            print(f"  Devices responded: {len(snmp_data)}")
            
            for dev in snmp_data:
                print(f"\n  {dev['ip_address']}: {dev['system'].get('name', 'Unknown')}")
                if dev.get('system', {}).get('description'):
                    print(f"    Description: {dev['system']['description'][:60]}...")
                if dev.get('interface_count'):
                    print(f"    Interfaces: {dev['interface_count']}")
            
            # Send to Vanguard if config is valid
            if validate_config(config):
                await send_snmp_data(session, snmp_data)
                log.info("SNMP data sent to Vanguard")
            return
        
        # Discovery mode (one-time discovery)
        if args.discover:
            log.info("Running network discovery...")
            devices = await discover_network_devices()
            
            print(f"\nDiscovered {len(devices)} devices:\n")
            for d in devices:
                mac = d.get('mac_address', 'N/A')
                hostname = d.get('hostname', 'N/A')
                print(f"  {d['ip_address']:15} | {mac:17} | {hostname}")
            
            # Send to Vanguard if config is valid
            if validate_config(config):
                await send_scan_results(session, [], devices)
                log.info("Discovery results sent to Vanguard")
            return
        
        # Normal operation: register first, then run loops
        if not await register_agent(session):
            log.error("Failed to register, exiting")
            sys.exit(1)
        
        # Run all loops concurrently
        tasks = [
            asyncio.create_task(heartbeat_loop(session)),
            asyncio.create_task(command_loop(session)),
            asyncio.create_task(scan_loop(session)),
            asyncio.create_task(meraki_loop(session)),
            asyncio.create_task(snmp_loop(session)),
            asyncio.create_task(discovery_loop(session)),
        ]
        
        # Start sub-agent server if enabled
        sub_cfg = config.get("sub_agents", {})
        if sub_cfg.get("enabled"):
            tasks.append(asyncio.create_task(sub_agent_server()))
        
        try:
            await asyncio.gather(*tasks)
        except asyncio.CancelledError:
            log.info("Agent shutting down...")


def signal_handler(signum, frame):
    """Handle shutdown signals gracefully."""
    global running
    log.info(f"Received signal {signum}, shutting down...")
    running = False


def main() -> None:
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Ultrium Vanguard Agent",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    parser.add_argument(
        "--config", "-c",
        default="config.yaml",
        help="Path to configuration file (default: config.yaml)"
    )
    parser.add_argument(
        "--register", "-r",
        action="store_true",
        help="Register agent and exit"
    )
    parser.add_argument(
        "--test", "-t",
        action="store_true",
        help="Test connection and exit"
    )
    parser.add_argument(
        "--scan", "-s",
        action="store_true",
        help="Run one-time network scan (nmap) and exit"
    )
    parser.add_argument(
        "--meraki", "-m",
        action="store_true",
        help="Run one-time Meraki sync and exit"
    )
    parser.add_argument(
        "--snmp",
        action="store_true",
        help="Run one-time SNMP poll and exit"
    )
    parser.add_argument(
        "--discover", "-d",
        action="store_true",
        help="Run network discovery (ARP/ping) and exit"
    )
    
    args = parser.parse_args()
    
    # Setup signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Run async main
    try:
        asyncio.run(main_async(args))
    except KeyboardInterrupt:
        log.info("Interrupted by user")


if __name__ == "__main__":
    main()
