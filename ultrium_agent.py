#!/usr/bin/env python3
"""
Ultrium RMM Agent
A lightweight Python agent for remote monitoring and management.
"""

import os
import requests
import subprocess
import platform
import socket
import time
import json
import logging
import os
import sys
from datetime import datetime
from pathlib import Path

try:
    import psutil
except ImportError:
    print("ERROR: psutil not installed. Run: pip install psutil")
    sys.exit(1)

# ============================
# CONFIGURATION
# ============================

# Update these values for your deployment
SUPABASE_FUNCTIONS_BASE = os.environ.get("ULTRIUM_FUNCTIONS_BASE", "https://nsyobmjpdpvesjwdphlh.functions.supabase.co")
# API key must be provided via the ULTRIUM_API_KEY environment variable or a per-device
# provisioning token. Do NOT hardcode a shared key in source — that allows anyone with
# code access to impersonate an agent.
API_KEY = os.environ.get("ULTRIUM_API_KEY", "")
if not API_KEY:
    raise SystemExit("ULTRIUM_API_KEY environment variable is required. Provision a per-device key via the Vanguard agent provisioning flow.")
HOSTNAME = socket.gethostname()
POLL_INTERVAL = 60  # seconds
COMMAND_TIMEOUT = 300  # 5 minutes max per command

# Deployment Configuration
DEPLOYMENT_TYPE = "direct"  # Options: "direct" or "msp_client"
MSP_CLIENT_ID = None  # Set this for MSP client deployments

# Build headers based on deployment type
HEADERS = {
    "Content-Type": "application/json",
    "x-ultrium-key": API_KEY,
    "x-deployment-type": DEPLOYMENT_TYPE
}

# Add MSP client header if configured
if DEPLOYMENT_TYPE == "msp_client" and MSP_CLIENT_ID:
    HEADERS["x-msp-client-id"] = MSP_CLIENT_ID

# ============================
# LOGGING SETUP
# ============================

def setup_logging():
    """Setup logging to both file and console"""
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_dir / f"ultrium_agent_{datetime.now().strftime('%Y%m%d')}.log"),
            logging.StreamHandler(sys.stdout)
        ]
    )
    return logging.getLogger(__name__)

logger = setup_logging()

# ============================
# SYSTEM INFORMATION
# ============================

def collect_system_info():
    """Collect current system metrics and information"""
    try:
        # Get network interface info
        ip_address = "127.0.0.1"
        try:
            # Try to get actual IP by connecting to external host
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip_address = s.getsockname()[0]
            s.close()
        except:
            ip_address = socket.gethostbyname(HOSTNAME)

        system_info = {
            "hostname": HOSTNAME,
            "ip_address": ip_address,
            "os": f"{platform.system()} {platform.release()} {platform.version()}",
            "cpu_usage": round(psutil.cpu_percent(interval=1), 2),
            "ram_usage": round(psutil.virtual_memory().percent, 2),
            "disk_usage": round(get_disk_usage(), 2),
            "rustdesk_id": get_rustdesk_id(),
            "agent_version": "1.0.0",
            "last_boot": datetime.fromtimestamp(psutil.boot_time()).isoformat()
        }
        
        logger.debug(f"System info collected: {system_info}")
        return system_info
        
    except Exception as e:
        logger.error(f"Error collecting system info: {e}")
        return {
            "hostname": HOSTNAME,
            "ip_address": "unknown",
            "os": "unknown",
            "cpu_usage": 0,
            "ram_usage": 0,
            "disk_usage": 0
        }

def get_disk_usage():
    """Get disk usage percentage for primary drive"""
    try:
        if platform.system() == "Windows":
            return psutil.disk_usage('C:').percent
        else:
            return psutil.disk_usage('/').percent
    except:
        return 0

def get_rustdesk_id():
    """Get RustDesk ID if available"""
    possible_paths = [
        "C:\\Program Files\\RustDesk\\id",
        "C:\\Program Files (x86)\\RustDesk\\id",
        "/usr/share/rustdesk/id",
        os.path.expanduser("~/.config/rustdesk/id")
    ]
    
    for path in possible_paths:
        try:
            if os.path.exists(path):
                with open(path, "r") as f:
                    rustdesk_id = f.read().strip()
                    if rustdesk_id:
                        return rustdesk_id
        except Exception as e:
            logger.debug(f"Could not read RustDesk ID from {path}: {e}")
    
    return None

# ============================
# COMMAND EXECUTION
# ============================

def execute_powershell_command(script_content, timeout=COMMAND_TIMEOUT):
    """Execute PowerShell script and return results"""
    logger.info(f"Executing PowerShell command (timeout: {timeout}s)")
    logger.debug(f"Script: {script_content[:200]}{'...' if len(script_content) > 200 else ''}")
    
    start_time = datetime.now()
    
    try:
        if platform.system() != "Windows":
            return "", "PowerShell commands are only supported on Windows", 1
            
        result = subprocess.run(
            ["powershell", "-ExecutionPolicy", "Bypass", "-Command", script_content],
            capture_output=True,
            text=True,
            timeout=timeout,
            encoding='utf-8',
            errors='replace'
        )
        
        execution_time = (datetime.now() - start_time).total_seconds()
        logger.info(f"Command completed in {execution_time:.2f}s with exit code {result.returncode}")
        
        return result.stdout, result.stderr, result.returncode
        
    except subprocess.TimeoutExpired:
        error_msg = f"Command timed out after {timeout} seconds"
        logger.error(error_msg)
        return "", error_msg, -1
        
    except Exception as e:
        error_msg = f"Error executing PowerShell command: {str(e)}"
        logger.error(error_msg)
        return "", error_msg, -1

def process_command(command):
    """Process a single command from the server"""
    cmd_id = command.get('id')
    command_type = command.get('command_type', '')
    command_data = command.get('command_data', {})
    
    logger.info(f"Processing command {cmd_id} of type '{command_type}'")
    
    if command_type == 'powershell':
        script_content = command_data.get('script_content', '')
        timeout = command_data.get('timeout', COMMAND_TIMEOUT)
        
        if not script_content:
            return {
                "command_id": cmd_id,
                "output": "",
                "error": "No script content provided",
                "exit_code": -1
            }
        
        stdout, stderr, exit_code = execute_powershell_command(script_content, timeout)
        
        return {
            "command_id": cmd_id,
            "output": stdout,
            "error": stderr if stderr else None,
            "exit_code": exit_code,
            "execution_time": datetime.now().isoformat()
        }
    
    else:
        error_msg = f"Unsupported command type: {command_type}"
        logger.warning(error_msg)
        return {
            "command_id": cmd_id,
            "output": "",
            "error": error_msg,
            "exit_code": -1
        }

# ============================
# API COMMUNICATION
# ============================

def send_checkin():
    """Send device check-in to server"""
    try:
        data = collect_system_info()
        response = requests.post(
            f"{SUPABASE_FUNCTIONS_BASE}/rmm-checkin",
            json=data,
            headers=HEADERS,
            timeout=30
        )
        
        if response.status_code == 200:
            logger.debug("Check-in successful")
            return True
        else:
            logger.error(f"Check-in failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"Error during check-in: {e}")
        return False

def fetch_commands():
    """Fetch pending commands from server"""
    try:
        response = requests.get(
            f"{SUPABASE_FUNCTIONS_BASE}/rmm-commands",
            params={"hostname": HOSTNAME},
            headers=HEADERS,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            commands = data.get('commands', [])
            logger.info(f"Fetched {len(commands)} pending commands")
            return commands
        elif response.status_code == 404:
            logger.debug("No device found or no pending commands")
            return []
        else:
            logger.error(f"Error fetching commands: {response.status_code} - {response.text}")
            return []
            
    except Exception as e:
        logger.error(f"Error fetching commands: {e}")
        return []

def send_command_result(result_data):
    """Send command execution result to server"""
    try:
        response = requests.post(
            f"{SUPABASE_FUNCTIONS_BASE}/rmm-command-result",
            json=result_data,
            headers=HEADERS,
            timeout=30
        )
        
        if response.status_code == 200:
            logger.info(f"Result sent for command {result_data['command_id']}")
            return True
        else:
            logger.error(f"Error sending result: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"Error sending command result: {e}")
        return False

# ============================
# MAIN AGENT LOOP
# ============================

def validate_configuration():
    """Validate agent configuration before starting"""
    if API_KEY == "your-ultrium-secret-key":
        logger.error("ERROR: Please update API_KEY in the configuration section")
        return False
        
    if not SUPABASE_FUNCTIONS_BASE or "YOUR_PROJECT" in SUPABASE_FUNCTIONS_BASE:
        logger.error("ERROR: Please update SUPABASE_FUNCTIONS_BASE with your project URL")
        return False
        
    return True

def run_agent():
    """Main agent loop"""
    if not validate_configuration():
        return
    
    logger.info(f"Starting Ultrium RMM Agent v1.0.0")
    logger.info(f"Hostname: {HOSTNAME}")
    logger.info(f"OS: {platform.system()} {platform.release()}")
    logger.info(f"Poll interval: {POLL_INTERVAL} seconds")
    
    consecutive_errors = 0
    max_consecutive_errors = 5
    
    while True:
        try:
            # 1. Send check-in
            checkin_success = send_checkin()
            
            # 2. Fetch and process commands
            if checkin_success:
                commands = fetch_commands()
                
                for command in commands:
                    try:
                        result = process_command(command)
                        send_command_result(result)
                    except Exception as e:
                        logger.error(f"Error processing command {command.get('id')}: {e}")
            
            # Reset error counter on successful cycle
            consecutive_errors = 0
            
        except KeyboardInterrupt:
            logger.info("Agent stopped by user")
            break
            
        except Exception as e:
            consecutive_errors += 1
            logger.error(f"Unexpected error in main loop: {e}")
            
            if consecutive_errors >= max_consecutive_errors:
                logger.critical(f"Too many consecutive errors ({consecutive_errors}). Exiting.")
                break
        
        # Wait before next cycle
        try:
            time.sleep(POLL_INTERVAL)
        except KeyboardInterrupt:
            logger.info("Agent stopped by user")
            break

# ============================
# SERVICE MANAGEMENT
# ============================

def install_as_service():
    """Install agent as Windows service (requires admin privileges)"""
    if platform.system() != "Windows":
        print("Service installation is only supported on Windows")
        return
    
    service_script = f"""
@echo off
echo Installing Ultrium RMM Agent as Windows Service...
sc create "UltriumRMMAgent" binPath= "python.exe {os.path.abspath(__file__)}" start= auto
sc description "UltriumRMMAgent" "Ultrium Remote Monitoring and Management Agent"
echo Service installed. Starting service...
sc start "UltriumRMMAgent"
echo Done!
pause
"""
    
    with open("install_service.bat", "w") as f:
        f.write(service_script)
    
    print("Service installation script created: install_service.bat")
    print("Run as Administrator to install the service")

# ============================
# ENTRY POINT
# ============================

if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "--install-service":
            install_as_service()
        elif sys.argv[1] == "--test":
            print("Testing configuration...")
            if validate_configuration():
                print("✅ Configuration valid")
                info = collect_system_info()
                print(f"✅ System info: {json.dumps(info, indent=2)}")
            else:
                print("❌ Configuration invalid")
        else:
            print("Usage: python ultrium_agent.py [--install-service|--test]")
    else:
        run_agent()