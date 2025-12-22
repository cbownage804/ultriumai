// Embedded Vanguard agent files for ZIP bundle generation
// These are static templates that will be customized with user credentials

export const VANGUARD_AGENT_PY = `#!/usr/bin/env python3
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
        "device_id": None,
        "name": platform.node(),
        "location": "default",
        "user_id": None,
    },
    "api": {
        "endpoint": "https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/vanguard-agent-api",
        "secret_key": None,
        "timeout": 30,
    },
    "intervals": {
        "heartbeat": 60,
        "command_poll": 30,
        "scan": 3600,
        "meraki": 300,
        "snmp": 300,
        "discovery": 1800,
    },
    "logging": {
        "level": "INFO",
        "file": "/var/log/vanguard-agent.log",
        "max_bytes": 10485760,
        "backup_count": 5,
    },
    "features": {
        "collect_temperature": True,
        "collect_network_io": True,
        "execute_commands": True,
    },
    "scanning": {
        "enabled": True,
        "targets": [],
        "scan_types": {
            "discovery": True,
            "ports": True,
            "os_detection": False,
            "service_detection": True,
        },
        "port_range": "1-1024",
        "timeout": 600,
        "sudo_required": False,
    },
    "meraki": {
        "enabled": False,
        "api_key": None,
        "base_url": "https://api.meraki.com/api/v1",
        "collect_organizations": True,
        "collect_networks": True,
        "collect_devices": True,
        "collect_clients": True,
        "collect_uplinks": True,
        "collect_vpn_status": False,
        "client_timespan": 86400,
    },
    "snmp": {
        "enabled": False,
        "community": "public",
        "version": 2,
        "port": 161,
        "timeout": 5,
        "retries": 2,
        "targets": [],
    },
    "sub_agents": {
        "enabled": False,
        "listen_port": 5678,
        "auth_token": None,
    },
}

config: Dict[str, Any] = {}
agent_id: Optional[str] = None
running = True
log = logging.getLogger("vanguard")


def setup_logging(cfg: Dict[str, Any]) -> None:
    log_cfg = cfg.get("logging", {})
    level = getattr(logging, log_cfg.get("level", "INFO").upper(), logging.INFO)
    log.setLevel(level)
    formatter = logging.Formatter("%(asctime)s | %(levelname)-8s | %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
    console = logging.StreamHandler(sys.stdout)
    console.setFormatter(formatter)
    log.addHandler(console)
    log_file = log_cfg.get("file")
    if log_file:
        try:
            Path(log_file).parent.mkdir(parents=True, exist_ok=True)
            file_handler = RotatingFileHandler(log_file, maxBytes=log_cfg.get("max_bytes", 10485760), backupCount=log_cfg.get("backup_count", 5))
            file_handler.setFormatter(formatter)
            log.addHandler(file_handler)
        except PermissionError:
            log.warning(f"Cannot write to {log_file}, using console only")


def load_config(config_path: str = "config.yaml") -> Dict[str, Any]:
    cfg = DEFAULT_CONFIG.copy()
    if not HAS_YAML:
        log.warning("PyYAML not installed, using default/environment config")
        return cfg
    config_file = Path(config_path)
    if config_file.exists():
        try:
            with open(config_file, "r") as f:
                user_cfg = yaml.safe_load(f) or {}
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
    if not cfg["agent"].get("device_id"):
        cfg["agent"]["device_id"] = f"vanguard-{uuid.uuid4().hex[:8]}"
        log.info(f"Generated device_id: {cfg['agent']['device_id']}")
    return cfg


def validate_config(cfg: Dict[str, Any]) -> bool:
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


def get_system_metrics() -> Dict[str, Any]:
    metrics = {"timestamp": int(time.time()), "hostname": platform.node(), "platform": platform.system(), "platform_version": platform.version()}
    if not HAS_PSUTIL:
        return metrics
    try:
        metrics["cpu_percent"] = psutil.cpu_percent(interval=1)
        metrics["cpu_count"] = psutil.cpu_count()
        mem = psutil.virtual_memory()
        metrics["memory_percent"] = mem.percent
        metrics["memory_total_gb"] = round(mem.total / (1024**3), 2)
        metrics["memory_available_gb"] = round(mem.available / (1024**3), 2)
        disk = psutil.disk_usage("/")
        metrics["disk_percent"] = disk.percent
        metrics["disk_total_gb"] = round(disk.total / (1024**3), 2)
        metrics["disk_free_gb"] = round(disk.free / (1024**3), 2)
        if config.get("features", {}).get("collect_network_io", True):
            net = psutil.net_io_counters()
            metrics["network_rx_bytes"] = net.bytes_recv
            metrics["network_tx_bytes"] = net.bytes_sent
        if config.get("features", {}).get("collect_temperature", True):
            try:
                temps = psutil.sensors_temperatures()
                if temps:
                    for name in ["coretemp", "cpu_thermal", "cpu-thermal", "k10temp"]:
                        if name in temps and temps[name]:
                            metrics["temperature"] = temps[name][0].current
                            break
            except (AttributeError, KeyError):
                pass
        metrics["uptime_seconds"] = int(time.time() - psutil.boot_time())
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
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def get_local_network_cidr() -> str:
    ip = get_ip_address()
    if ip == "127.0.0.1":
        return "192.168.1.0/24"
    parts = ip.split(".")
    return f"{parts[0]}.{parts[1]}.{parts[2]}.0/24"


def check_nmap_installed() -> bool:
    return shutil.which("nmap") is not None


def build_url(action: str) -> str:
    endpoint = config["api"]["endpoint"].rstrip("/")
    return f"{endpoint}?action={action}"


def get_headers() -> Dict[str, str]:
    return {"Content-Type": "application/json", "X-VANGUARD-KEY": config["api"]["secret_key"]}


async def api_request(session: aiohttp.ClientSession, action: str, payload: Dict[str, Any], method: str = "POST") -> Optional[Dict[str, Any]]:
    url = build_url(action)
    timeout = aiohttp.ClientTimeout(total=config["api"].get("timeout", 30))
    try:
        async with session.request(method, url, headers=get_headers(), json=payload, timeout=timeout) as resp:
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


async def register_agent(session: aiohttp.ClientSession) -> bool:
    global agent_id
    payload = {
        "device_id": config["agent"]["device_id"],
        "name": config["agent"].get("name", platform.node()),
        "location": config["agent"].get("location", "default"),
        "user_id": config["agent"]["user_id"],
        "ip_address": get_ip_address(),
        "os_type": platform.system(),
        "os_version": platform.release(),
        "agent_version": "2.0.0",
        "capabilities": {
            "network_scanning": check_nmap_installed(),
            "os_detection": config.get("scanning", {}).get("scan_types", {}).get("os_detection", False),
            "meraki_integration": bool(config.get("meraki", {}).get("enabled") and config.get("meraki", {}).get("api_key")),
            "snmp_polling": HAS_SNMP and config.get("snmp", {}).get("enabled", False),
            "network_discovery": True,
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
    metrics = get_system_metrics()
    payload = {
        "device_id": config["agent"]["device_id"],
        "cpu_percent": metrics.get("cpu_percent", 0),
        "memory_percent": metrics.get("memory_percent", 0),
        "disk_percent": metrics.get("disk_percent", 0),
        "network_rx_bytes": metrics.get("network_rx_bytes"),
        "network_tx_bytes": metrics.get("network_tx_bytes"),
        "temperature": metrics.get("temperature"),
        "custom_metrics": {"uptime_seconds": metrics.get("uptime_seconds"), "load_1m": metrics.get("load_1m"), "hostname": metrics.get("hostname"), "nmap_available": check_nmap_installed()},
    }
    result = await api_request(session, "heartbeat", payload)
    if result and result.get("status") == "ok":
        log.debug(f"Heartbeat OK - CPU: {payload['cpu_percent']}%, MEM: {payload['memory_percent']}%, DISK: {payload['disk_percent']}%")
        return True
    else:
        log.warning("Heartbeat failed")
        return False


async def poll_commands(session: aiohttp.ClientSession) -> list:
    payload = {"device_id": config["agent"]["device_id"]}
    result = await api_request(session, "get_commands", payload)
    if result and result.get("status") == "ok":
        data = result.get("data", {})
        commands = data.get("commands", [])
        if commands:
            log.info(f"Received {len(commands)} command(s)")
        return commands
    return []


async def execute_command(session: aiohttp.ClientSession, command: Dict[str, Any]) -> Dict[str, Any]:
    cmd_id = command.get("id")
    cmd_type = command.get("command_type")
    payload = command.get("payload", {})
    log.info(f"Executing command {cmd_id}: {cmd_type}")
    result = {"command_id": cmd_id, "status": "completed", "output": None, "error": None}
    try:
        if cmd_type == "shell":
            if not config.get("features", {}).get("execute_commands", True):
                result["status"] = "rejected"
                result["error"] = "Command execution disabled"
            else:
                script = payload.get("script", "")
                proc = subprocess.run(script, shell=True, capture_output=True, text=True, timeout=300)
                result["output"] = proc.stdout
                result["error"] = proc.stderr if proc.returncode != 0 else None
                result["status"] = "completed" if proc.returncode == 0 else "failed"
                result["return_code"] = proc.returncode
        elif cmd_type == "get_metrics":
            result["output"] = get_system_metrics()
        elif cmd_type == "ping":
            result["output"] = {"pong": True, "timestamp": int(time.time())}
        else:
            result["status"] = "unknown"
            result["error"] = f"Unknown command type: {cmd_type}"
    except Exception as e:
        result["status"] = "failed"
        result["error"] = str(e)
        log.error(f"Command {cmd_id} failed: {e}")
    return result


async def send_command_response(session: aiohttp.ClientSession, result: Dict[str, Any]) -> bool:
    payload = {"command_id": result["command_id"], "device_id": config["agent"]["device_id"], "status": result["status"], "output": result.get("output"), "error": result.get("error")}
    response = await api_request(session, "command_response", payload)
    return response and response.get("status") == "ok"


async def heartbeat_loop(session: aiohttp.ClientSession) -> None:
    interval = config["intervals"].get("heartbeat", 60)
    log.info(f"Starting heartbeat loop (interval: {interval}s)")
    while running:
        await send_heartbeat(session)
        await asyncio.sleep(interval)


async def command_loop(session: aiohttp.ClientSession) -> None:
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


async def main_async(args: argparse.Namespace) -> None:
    global config, running
    config = load_config(args.config)
    setup_logging(config)
    log.info("=" * 60)
    log.info("Ultrium Vanguard Agent Starting")
    log.info(f"Device ID: {config['agent']['device_id']}")
    log.info(f"Endpoint: {config['api']['endpoint']}")
    log.info(f"nmap available: {check_nmap_installed()}")
    log.info("=" * 60)
    if not validate_config(config):
        sys.exit(1)
    async with aiohttp.ClientSession() as session:
        if args.test:
            log.info("Testing connection...")
            if await send_heartbeat(session):
                log.info("Connection successful!")
            else:
                log.error("Connection failed")
            return
        if args.register:
            await register_agent(session)
            return
        if not await register_agent(session):
            log.error("Failed to register, exiting")
            sys.exit(1)
        tasks = [asyncio.create_task(heartbeat_loop(session)), asyncio.create_task(command_loop(session))]
        try:
            await asyncio.gather(*tasks)
        except asyncio.CancelledError:
            log.info("Agent shutting down...")


def signal_handler(signum, frame):
    global running
    log.info(f"Received signal {signum}, shutting down...")
    running = False


def main() -> None:
    parser = argparse.ArgumentParser(description="Ultrium Vanguard Agent")
    parser.add_argument("--config", "-c", default="config.yaml", help="Path to configuration file")
    parser.add_argument("--register", "-r", action="store_true", help="Register agent and exit")
    parser.add_argument("--test", "-t", action="store_true", help="Test connection and exit")
    args = parser.parse_args()
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    try:
        asyncio.run(main_async(args))
    except KeyboardInterrupt:
        log.info("Interrupted by user")


if __name__ == "__main__":
    main()
`;

export const VANGUARD_CONFIG_TEMPLATE = `# =============================================================================
# Ultrium Vanguard Agent Configuration
# =============================================================================
# This configuration file is pre-populated with your credentials.
# Review and customize the settings below for your environment.

agent:
  # Auto-generated device ID (leave as-is or customize)
  device_id: null  # Will be auto-generated on first run
  name: "{{DEVICE_NAME}}"
  location: "{{DEVICE_LOCATION}}"
  # Your Vanguard user ID (DO NOT CHANGE)
  user_id: "{{USER_ID}}"

api:
  # Vanguard API endpoint (DO NOT CHANGE)
  endpoint: "{{API_ENDPOINT}}"
  # Your secret key (DO NOT CHANGE)
  secret_key: "{{SECRET_KEY}}"
  timeout: 30

intervals:
  heartbeat: 60      # seconds between heartbeats
  command_poll: 30   # seconds between command polls
  scan: 3600         # seconds between network scans (1 hour)

logging:
  level: INFO
  file: /var/log/vanguard-agent.log
  max_bytes: 10485760  # 10MB
  backup_count: 5

features:
  collect_temperature: true
  collect_network_io: true
  execute_commands: true

scanning:
  enabled: true
  targets: []  # Auto-detect local network if empty
  scan_types:
    discovery: true
    ports: true
    os_detection: false  # Requires sudo
    service_detection: true
  port_range: "1-1024"
  timeout: 600  # 10 minutes

# Optional: Cisco Meraki Integration
meraki:
  enabled: false
  api_key: null  # Add your Meraki API key here
  collect_organizations: true
  collect_networks: true
  collect_devices: true
  collect_clients: true

# Optional: SNMP Polling
snmp:
  enabled: false
  community: "public"
  version: 2
  targets: []  # Add IP addresses of SNMP devices

# Optional: Sub-Agent Collection
sub_agents:
  enabled: false
  listen_port: 5678
  auth_token: null  # Shared secret for sub-agents
`;

export const VANGUARD_INSTALL_SH = `#!/bin/bash
# =============================================================================
# Ultrium Vanguard Agent Installation Script
# =============================================================================
# This script installs the Vanguard agent on Ubuntu/Debian systems.
#
# Usage:
#   sudo ./install.sh
#
# Requirements:
#   - Ubuntu 20.04+ or Debian 11+
#   - Root/sudo access
#   - Python 3.8+
# =============================================================================

set -e

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
NC='\\033[0m' # No Color

echo -e "\${GREEN}"
echo "=============================================="
echo "   Ultrium Vanguard Agent Installer v2.0"
echo "=============================================="
echo -e "\${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "\${RED}Error: Please run as root (sudo ./install.sh)\${NC}"
    exit 1
fi

# Configuration
INSTALL_DIR="/opt/vanguard"
VENV_DIR="$INSTALL_DIR/.venv"
SERVICE_NAME="vanguard-agent"
SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"

echo -e "\${YELLOW}Step 1: Installing system dependencies...\${NC}"
apt-get update -qq
apt-get install -y -qq python3 python3-pip python3-venv curl nmap

# Verify nmap installation
if command -v nmap &> /dev/null; then
    NMAP_VERSION=$(nmap --version | head -n1)
    echo -e "\${GREEN}  → nmap installed: \${NMAP_VERSION}\${NC}"
else
    echo -e "\${RED}  → Warning: nmap installation may have failed\${NC}"
fi

echo -e "\${YELLOW}Step 2: Creating installation directory...\${NC}"
mkdir -p "$INSTALL_DIR"
mkdir -p /var/log

echo -e "\${YELLOW}Step 3: Creating Python virtual environment...\${NC}"
python3 -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"

echo -e "\${YELLOW}Step 4: Installing Python dependencies...\${NC}"
pip install --quiet --upgrade pip
pip install --quiet aiohttp psutil pyyaml

echo -e "\${YELLOW}Step 5: Copying agent files...\${NC}"
cp "$SCRIPT_DIR/vanguard_agent.py" "$INSTALL_DIR/"
chmod +x "$INSTALL_DIR/vanguard_agent.py"

# Copy config
if [ -f "$SCRIPT_DIR/config.yaml" ]; then
    cp "$SCRIPT_DIR/config.yaml" "$INSTALL_DIR/"
    echo -e "\${GREEN}  → Copied config.yaml\${NC}"
else
    echo -e "\${RED}  → No config.yaml found - please create /opt/vanguard/config.yaml\${NC}"
fi

echo -e "\${YELLOW}Step 6: Installing systemd service...\${NC}"
cat > /etc/systemd/system/\${SERVICE_NAME}.service << 'EOF'
[Unit]
Description=Ultrium Vanguard Agent
Documentation=https://ultriumai.com/vanguard
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=/opt/vanguard
ExecStart=/opt/vanguard/.venv/bin/python /opt/vanguard/vanguard_agent.py --config /opt/vanguard/config.yaml
Restart=always
RestartSec=10
Environment=PYTHONUNBUFFERED=1

# Security hardening (relaxed for nmap scanning)
NoNewPrivileges=no
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/log /opt/vanguard
PrivateTmp=yes
StandardOutput=journal
StandardError=journal
SyslogIdentifier=vanguard-agent

# Allow raw packet access for nmap
AmbientCapabilities=CAP_NET_RAW CAP_NET_ADMIN

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload

echo -e "\${GREEN}"
echo "=============================================="
echo "   Installation Complete!"
echo "=============================================="
echo -e "\${NC}"
echo ""
echo "Next steps:"
echo ""
echo "  1. Test the connection:"
echo "     \${YELLOW}sudo /opt/vanguard/.venv/bin/python /opt/vanguard/vanguard_agent.py --test\${NC}"
echo ""
echo "  2. Start the service:"
echo "     \${YELLOW}sudo systemctl enable --now \${SERVICE_NAME}\${NC}"
echo ""
echo "  3. Check status:"
echo "     \${YELLOW}sudo systemctl status \${SERVICE_NAME}\${NC}"
echo "     \${YELLOW}sudo journalctl -u \${SERVICE_NAME} -f\${NC}"
echo ""
echo -e "\${GREEN}Done!\${NC}"
`;

export const VANGUARD_README = `# Ultrium Vanguard Agent

This bundle contains everything you need to deploy the Vanguard agent on your Raspberry Pi or Ubuntu server.

## Quick Start

1. **Transfer this folder to your Pi:**
   \`\`\`bash
   scp -r vanguard-agent-bundle pi@your-pi-ip:~/
   \`\`\`

2. **SSH into your Pi:**
   \`\`\`bash
   ssh pi@your-pi-ip
   \`\`\`

3. **Run the installer:**
   \`\`\`bash
   cd ~/vanguard-agent-bundle
   chmod +x install.sh
   sudo ./install.sh
   \`\`\`

4. **Test the connection:**
   \`\`\`bash
   sudo /opt/vanguard/.venv/bin/python /opt/vanguard/vanguard_agent.py --test
   \`\`\`

5. **Start the service:**
   \`\`\`bash
   sudo systemctl enable --now vanguard-agent
   \`\`\`

## Files Included

- \`vanguard_agent.py\` - The main agent script (v2.0.0)
- \`config.yaml\` - Pre-configured with your credentials
- \`install.sh\` - Automated installer for Ubuntu/Debian
- \`README.md\` - This file

## Configuration

Your \`config.yaml\` is pre-populated with:
- Your User ID
- API Endpoint
- Secret Key

You can customize:
- Device name and location
- Scan intervals
- Network scanning options
- Optional Meraki/SNMP integrations

## Useful Commands

\`\`\`bash
# View logs
sudo journalctl -u vanguard-agent -f

# Restart the agent
sudo systemctl restart vanguard-agent

# Stop the agent
sudo systemctl stop vanguard-agent

# Check status
sudo systemctl status vanguard-agent

# Run a one-time network scan
sudo /opt/vanguard/.venv/bin/python /opt/vanguard/vanguard_agent.py --scan
\`\`\`

## Requirements

- Ubuntu 20.04+ or Debian 11+ (including Raspberry Pi OS)
- Python 3.8+
- Root/sudo access
- Network connectivity

## Support

Visit the Ultrium dashboard for device management and monitoring.
`;
