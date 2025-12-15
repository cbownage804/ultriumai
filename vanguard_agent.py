#!/usr/bin/env python3
"""
Ultrium Vanguard Agent
======================
A production-ready agent for the Vanguard security operations platform.
Sends system metrics, polls for commands, and reports scan results.

Usage:
    python vanguard_agent.py                    # Run with config.yaml
    python vanguard_agent.py --config /path/to/config.yaml
    python vanguard_agent.py --register         # One-time registration
    python vanguard_agent.py --test             # Test connection
"""

import asyncio
import aiohttp
import argparse
import logging
import platform
import signal
import socket
import sys
import time
import uuid
from datetime import datetime
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Any, Dict, Optional

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
                    cfg[section].update(values)
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
    
    payload = {
        "device_id": config["agent"]["device_id"],
        "name": config["agent"].get("name", platform.node()),
        "location": config["agent"].get("location", "default"),
        "user_id": config["agent"]["user_id"],
        "ip_address": get_ip_address(),
        "os_type": platform.system(),
        "os_version": platform.release(),
        "agent_version": "1.0.0",
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


async def execute_command(command: Dict[str, Any]) -> Dict[str, Any]:
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
                import subprocess
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
                result = await execute_command(cmd)
                await send_command_response(session, result)
                
        except Exception as e:
            log.error(f"Command loop error: {e}")
        
        await asyncio.sleep(interval)


async def main_async(args: argparse.Namespace) -> None:
    """Main async entry point."""
    global config, running
    
    # Load configuration
    config = load_config(args.config)
    setup_logging(config)
    
    log.info("=" * 60)
    log.info("Ultrium Vanguard Agent Starting")
    log.info(f"Device ID: {config['agent']['device_id']}")
    log.info(f"Endpoint: {config['api']['endpoint']}")
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
        
        # Normal operation: register first, then run loops
        if not await register_agent(session):
            log.error("Failed to register, exiting")
            sys.exit(1)
        
        # Run heartbeat and command loops concurrently
        tasks = [
            asyncio.create_task(heartbeat_loop(session)),
            asyncio.create_task(command_loop(session)),
        ]
        
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
