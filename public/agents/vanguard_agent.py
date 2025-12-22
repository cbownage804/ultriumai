#!/usr/bin/env python3
"""
Ultrium Vanguard Agent v1.0.0
Full-featured RMM agent with network scanning, command execution, and AI capabilities.

Usage:
    python3 vanguard_agent.py --device-id YOUR_DEVICE_ID --user-id YOUR_USER_ID

Requirements:
    pip install psutil requests
    
Optional for network scanning:
    sudo apt install nmap
"""

import os
import sys
import time
import json
import socket
import platform
import subprocess
import argparse
import threading
from datetime import datetime
from typing import Dict, Any, Optional, List

try:
    import psutil
except ImportError:
    print("Installing psutil...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "psutil"])
    import psutil

try:
    import requests
except ImportError:
    print("Installing requests...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests"])
    import requests

# Configuration
AGENT_VERSION = "1.0.0"
API_URL = "https://mwngjymbntbhpxrnjojs.supabase.co/functions/v1/vanguard-agent-api"
VANGUARD_SECRET = "vgd_sk_7Kx9mPqR3nTwYz2JfL8sHcN6bVdXaE4uGtM1oWpQ5iA"

class VanguardAgent:
    def __init__(self, device_id: str, user_id: str, name: Optional[str] = None, location: Optional[str] = None):
        self.device_id = device_id
        self.user_id = user_id
        self.name = name or socket.gethostname()
        self.location = location
        self.running = False
        self.agent_id = None
        
        self.headers = {
            "Content-Type": "application/json",
            "X-Vanguard-Key": VANGUARD_SECRET
        }
    
    def log(self, message: str, level: str = "INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
    
    def get_ip_address(self) -> str:
        """Get the primary IP address of this machine."""
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return "127.0.0.1"
    
    def get_system_info(self) -> Dict[str, Any]:
        """Collect comprehensive system information."""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # Network interfaces
            net_io = {}
            net_addrs = psutil.net_if_addrs()
            for iface, addrs in net_addrs.items():
                for addr in addrs:
                    if addr.family == socket.AF_INET:
                        io = psutil.net_io_counters(pernic=True).get(iface)
                        net_io[iface] = {
                            "ip_address": addr.address,
                            "bytes_sent": io.bytes_sent if io else 0,
                            "bytes_recv": io.bytes_recv if io else 0
                        }
            
            # Temperature (Linux)
            temperature = None
            try:
                temps = psutil.sensors_temperatures()
                if temps:
                    for name, entries in temps.items():
                        for entry in entries:
                            if entry.current:
                                temperature = entry.current
                                break
            except:
                pass
            
            # Load average (Unix)
            load_avg = None
            try:
                load_avg = os.getloadavg()
            except:
                pass
            
            # Boot time
            boot_time = datetime.fromtimestamp(psutil.boot_time()).isoformat()
            
            return {
                "cpu_percent": cpu_percent,
                "memory": {
                    "total": memory.total,
                    "available": memory.available,
                    "percent": memory.percent
                },
                "disk_root": {
                    "total": disk.total,
                    "free": disk.free,
                    "percent": disk.percent
                },
                "net_io": net_io,
                "temperature": temperature,
                "load_avg": load_avg,
                "boot_time": boot_time,
                "os_version": f"{platform.system()} {platform.release()}",
                "hostname": socket.gethostname()
            }
        except Exception as e:
            self.log(f"Error collecting system info: {e}", "ERROR")
            return {}
    
    def get_hailo_status(self) -> Dict[str, Any]:
        """Check for Hailo AI accelerator."""
        hailo_status = {"detected": False}
        try:
            # Check for Hailo device
            result = subprocess.run(["hailortcli", "fw-control", "identify"], 
                                  capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                hailo_status["detected"] = True
                hailo_status["board_name"] = "Hailo-8"
                hailo_status["info"] = result.stdout.strip()
        except:
            pass
        return hailo_status
    
    def register(self) -> bool:
        """Register this agent with the server."""
        try:
            system_info = self.get_system_info()
            hailo = self.get_hailo_status()
            
            payload = {
                "device_id": self.device_id,
                "user_id": self.user_id,
                "name": self.name,
                "location": self.location,
                "ip_address": self.get_ip_address(),
                "agent_version": AGENT_VERSION,
                "firmware_version": f"{platform.system()} {platform.release()}",
                "hailo_board_name": hailo.get("board_name"),
                "system_info": system_info,
                "hailo": hailo
            }
            
            response = requests.post(
                f"{API_URL}?action=register",
                headers=self.headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                self.agent_id = data.get("agent_id")
                self.log(f"Registered successfully. Agent ID: {self.agent_id}")
                return True
            else:
                self.log(f"Registration failed: {response.status_code} - {response.text}", "ERROR")
                return False
        except Exception as e:
            self.log(f"Registration error: {e}", "ERROR")
            return False
    
    def send_heartbeat(self) -> bool:
        """Send heartbeat with current metrics."""
        try:
            system = self.get_system_info()
            hailo = self.get_hailo_status()
            
            payload = {
                "device_id": self.device_id,
                "agent_version": AGENT_VERSION,
                "metrics": {
                    "system": system,
                    "hailo": hailo,
                    "agent_version": AGENT_VERSION
                }
            }
            
            response = requests.post(
                f"{API_URL}?action=heartbeat",
                headers=self.headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log(f"Heartbeat sent. Received: {data.get('received', {})}")
                return True
            else:
                self.log(f"Heartbeat failed: {response.status_code}", "WARN")
                return False
        except Exception as e:
            self.log(f"Heartbeat error: {e}", "ERROR")
            return False
    
    def get_pending_commands(self) -> List[Dict]:
        """Fetch pending commands from server."""
        try:
            response = requests.post(
                f"{API_URL}?action=get_commands",
                headers=self.headers,
                json={"device_id": self.device_id},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                commands = data.get("commands", [])
                if commands:
                    self.log(f"Received {len(commands)} command(s)")
                return commands
            return []
        except Exception as e:
            self.log(f"Error fetching commands: {e}", "ERROR")
            return []
    
    def send_command_response(self, command_id: str, response: Any, success: bool, error_message: str = None):
        """Send command execution result back to server."""
        try:
            payload = {
                "command_id": command_id,
                "response": response,
                "success": success,
                "error_message": error_message
            }
            
            requests.post(
                f"{API_URL}?action=command_response",
                headers=self.headers,
                json=payload,
                timeout=30
            )
        except Exception as e:
            self.log(f"Error sending command response: {e}", "ERROR")
    
    def execute_command(self, command: Dict) -> None:
        """Execute a single command and send result."""
        command_id = command.get("id")
        command_type = command.get("command_type")
        payload = command.get("payload", {})
        
        self.log(f"Executing command: {command_type}")
        
        try:
            if command_type == "ping":
                result = {"status": "pong", "timestamp": datetime.now().isoformat()}
                self.send_command_response(command_id, result, True)
            
            elif command_type == "health_check":
                result = self.get_system_info()
                result["agent_version"] = AGENT_VERSION
                result["status"] = "healthy"
                self.send_command_response(command_id, result, True)
            
            elif command_type == "run_script" or command_type == "shell":
                script = payload.get("script", "")
                shell = payload.get("shell", "bash")
                
                if shell == "bash":
                    result = subprocess.run(
                        ["bash", "-c", script],
                        capture_output=True,
                        text=True,
                        timeout=300
                    )
                elif shell == "powershell":
                    result = subprocess.run(
                        ["powershell", "-Command", script],
                        capture_output=True,
                        text=True,
                        timeout=300
                    )
                else:
                    result = subprocess.run(
                        script,
                        shell=True,
                        capture_output=True,
                        text=True,
                        timeout=300
                    )
                
                output = {
                    "stdout": result.stdout,
                    "stderr": result.stderr,
                    "return_code": result.returncode
                }
                self.send_command_response(command_id, output, result.returncode == 0)
            
            elif command_type == "scan_network":
                result = self.scan_network()
                self.send_command_response(command_id, result, True)
            
            elif command_type == "scan_vulnerabilities":
                result = self.scan_vulnerabilities()
                self.send_command_response(command_id, result, True)
            
            elif command_type == "get_inventory":
                result = self.get_inventory()
                self.send_command_response(command_id, result, True)
            
            elif command_type == "get_software_list":
                result = self.get_software_list()
                self.send_command_response(command_id, result, True)
            
            elif command_type == "check_patches":
                result = self.check_patches()
                self.send_command_response(command_id, result, True)
            
            elif command_type == "get_interfaces":
                result = self.get_network_interfaces()
                self.send_command_response(command_id, result, True)
            
            elif command_type == "get_connections":
                result = self.get_active_connections()
                self.send_command_response(command_id, result, True)
            
            elif command_type == "get_firewall_rules":
                result = self.get_firewall_rules()
                self.send_command_response(command_id, result, True)
            
            elif command_type == "reboot":
                self.send_command_response(command_id, {"status": "rebooting"}, True)
                os.system("sudo reboot")
            
            elif command_type == "shutdown":
                self.send_command_response(command_id, {"status": "shutting down"}, True)
                os.system("sudo shutdown -h now")
            
            elif command_type == "restart_agent":
                self.send_command_response(command_id, {"status": "restarting"}, True)
                os.execv(sys.executable, [sys.executable] + sys.argv)
            
            elif command_type == "apt_update":
                result = subprocess.run(
                    ["sudo", "apt", "update"],
                    capture_output=True, text=True, timeout=300
                )
                self.send_command_response(command_id, {"output": result.stdout}, result.returncode == 0)
            
            elif command_type == "apt_upgrade":
                result = subprocess.run(
                    ["sudo", "apt", "upgrade", "-y"],
                    capture_output=True, text=True, timeout=600
                )
                self.send_command_response(command_id, {"output": result.stdout}, result.returncode == 0)
            
            else:
                self.send_command_response(
                    command_id, 
                    {"error": f"Unknown command: {command_type}"}, 
                    False, 
                    f"Unknown command type: {command_type}"
                )
        
        except subprocess.TimeoutExpired:
            self.send_command_response(command_id, None, False, "Command timed out")
        except Exception as e:
            self.send_command_response(command_id, None, False, str(e))
    
    def scan_network(self) -> Dict[str, Any]:
        """Scan local network for devices."""
        devices = []
        
        try:
            # Get local network CIDR
            ip = self.get_ip_address()
            network = ".".join(ip.split(".")[:-1]) + ".0/24"
            
            # Try nmap first (most comprehensive)
            try:
                result = subprocess.run(
                    ["nmap", "-sn", "-oG", "-", network],
                    capture_output=True, text=True, timeout=120
                )
                
                for line in result.stdout.split("\n"):
                    if "Host:" in line and "Status: Up" in line:
                        parts = line.split()
                        if len(parts) >= 2:
                            devices.append({
                                "ip_address": parts[1],
                                "status": "up",
                                "scan_method": "nmap"
                            })
            except FileNotFoundError:
                # Fallback to ARP scan
                result = subprocess.run(
                    ["arp", "-a"],
                    capture_output=True, text=True, timeout=30
                )
                
                for line in result.stdout.split("\n"):
                    if "(" in line and ")" in line:
                        try:
                            ip_match = line.split("(")[1].split(")")[0]
                            mac = line.split("at ")[1].split(" ")[0] if "at " in line else None
                            devices.append({
                                "ip_address": ip_match,
                                "mac_address": mac,
                                "status": "up",
                                "scan_method": "arp"
                            })
                        except:
                            pass
            
            return {
                "network": network,
                "devices_found": len(devices),
                "devices": devices,
                "scan_time": datetime.now().isoformat()
            }
        
        except Exception as e:
            return {"error": str(e), "devices": []}
    
    def scan_vulnerabilities(self) -> Dict[str, Any]:
        """Run vulnerability scan using nmap NSE scripts."""
        try:
            ip = self.get_ip_address()
            network = ".".join(ip.split(".")[:-1]) + ".0/24"
            
            # Run nmap with vulnerability scripts
            result = subprocess.run([
                "nmap", "-sV", "--script", "vuln",
                "-p", "22,80,443,445,3389,8080",
                network, "--open", "-oX", "-"
            ], capture_output=True, text=True, timeout=600)
            
            # Parse XML output for vulnerabilities
            vulnerabilities = []
            if "VULNERABLE" in result.stdout:
                for line in result.stdout.split("\n"):
                    if "VULNERABLE" in line or "CVE-" in line:
                        vulnerabilities.append(line.strip())
            
            return {
                "scan_type": "vulnerability",
                "target": network,
                "vulnerabilities_found": len(vulnerabilities),
                "findings": vulnerabilities[:50],  # Limit to 50
                "scan_time": datetime.now().isoformat()
            }
        
        except FileNotFoundError:
            return {"error": "nmap not installed. Install with: sudo apt install nmap"}
        except Exception as e:
            return {"error": str(e)}
    
    def get_inventory(self) -> Dict[str, Any]:
        """Get hardware and software inventory."""
        inventory = {
            "hostname": socket.gethostname(),
            "os": f"{platform.system()} {platform.release()}",
            "architecture": platform.machine(),
            "processor": platform.processor(),
            "python_version": platform.python_version(),
            "cpu_count": psutil.cpu_count(),
            "memory_total_gb": round(psutil.virtual_memory().total / (1024**3), 2),
            "disk_total_gb": round(psutil.disk_usage('/').total / (1024**3), 2)
        }
        
        # Get installed software (Debian/Ubuntu)
        try:
            result = subprocess.run(
                ["dpkg", "-l"],
                capture_output=True, text=True, timeout=30
            )
            packages = []
            for line in result.stdout.split("\n")[5:]:  # Skip header
                if line.startswith("ii"):
                    parts = line.split()
                    if len(parts) >= 3:
                        packages.append({
                            "name": parts[1],
                            "version": parts[2]
                        })
            inventory["installed_packages"] = packages[:100]  # Limit
            inventory["package_count"] = len(packages)
        except:
            pass
        
        return inventory
    
    def get_software_list(self) -> List[Dict]:
        """Get list of installed software."""
        packages = []
        
        # Try dpkg (Debian/Ubuntu)
        try:
            result = subprocess.run(
                ["dpkg-query", "-W", "-f=${Package}|${Version}|${Status}\n"],
                capture_output=True, text=True, timeout=30
            )
            for line in result.stdout.strip().split("\n"):
                if "|" in line:
                    parts = line.split("|")
                    if len(parts) >= 2 and "install ok installed" in line:
                        packages.append({
                            "name": parts[0],
                            "version": parts[1],
                            "type": "deb"
                        })
            return packages[:200]
        except:
            pass
        
        # Try rpm (RHEL/CentOS)
        try:
            result = subprocess.run(
                ["rpm", "-qa", "--qf", "%{NAME}|%{VERSION}\n"],
                capture_output=True, text=True, timeout=30
            )
            for line in result.stdout.strip().split("\n"):
                if "|" in line:
                    parts = line.split("|")
                    packages.append({
                        "name": parts[0],
                        "version": parts[1],
                        "type": "rpm"
                    })
            return packages[:200]
        except:
            pass
        
        return packages
    
    def check_patches(self) -> Dict[str, Any]:
        """Check for available system updates."""
        updates = {"available": [], "security": []}
        
        try:
            # Update package lists first
            subprocess.run(["sudo", "apt", "update"], 
                         capture_output=True, timeout=120)
            
            # Get upgradable packages
            result = subprocess.run(
                ["apt", "list", "--upgradable"],
                capture_output=True, text=True, timeout=30
            )
            
            for line in result.stdout.split("\n")[1:]:  # Skip "Listing..."
                if "/" in line:
                    pkg_name = line.split("/")[0]
                    updates["available"].append(pkg_name)
            
            # Check security updates
            result = subprocess.run(
                ["apt", "list", "--upgradable"],
                capture_output=True, text=True, timeout=30
            )
            
            for line in result.stdout.split("\n"):
                if "security" in line.lower():
                    pkg_name = line.split("/")[0]
                    updates["security"].append(pkg_name)
            
            return {
                "total_available": len(updates["available"]),
                "security_updates": len(updates["security"]),
                "packages": updates["available"][:50],
                "check_time": datetime.now().isoformat()
            }
        except Exception as e:
            return {"error": str(e)}
    
    def get_network_interfaces(self) -> Dict[str, Any]:
        """Get network interface information."""
        interfaces = {}
        
        for iface, addrs in psutil.net_if_addrs().items():
            stats = psutil.net_if_stats().get(iface)
            io = psutil.net_io_counters(pernic=True).get(iface)
            
            interfaces[iface] = {
                "addresses": [],
                "is_up": stats.isup if stats else False,
                "speed": stats.speed if stats else 0,
                "mtu": stats.mtu if stats else 0,
                "bytes_sent": io.bytes_sent if io else 0,
                "bytes_recv": io.bytes_recv if io else 0
            }
            
            for addr in addrs:
                interfaces[iface]["addresses"].append({
                    "family": str(addr.family),
                    "address": addr.address,
                    "netmask": addr.netmask
                })
        
        return interfaces
    
    def get_active_connections(self) -> List[Dict]:
        """Get active network connections."""
        connections = []
        
        for conn in psutil.net_connections(kind='inet'):
            try:
                connections.append({
                    "local_addr": f"{conn.laddr.ip}:{conn.laddr.port}" if conn.laddr else None,
                    "remote_addr": f"{conn.raddr.ip}:{conn.raddr.port}" if conn.raddr else None,
                    "status": conn.status,
                    "pid": conn.pid
                })
            except:
                pass
        
        return connections[:100]  # Limit
    
    def get_firewall_rules(self) -> Dict[str, Any]:
        """Get firewall rules (iptables/ufw)."""
        rules = {"iptables": [], "ufw": None}
        
        try:
            # Try iptables
            result = subprocess.run(
                ["sudo", "iptables", "-L", "-n"],
                capture_output=True, text=True, timeout=30
            )
            rules["iptables"] = result.stdout.split("\n")[:50]
        except:
            pass
        
        try:
            # Try ufw
            result = subprocess.run(
                ["sudo", "ufw", "status", "verbose"],
                capture_output=True, text=True, timeout=30
            )
            rules["ufw"] = result.stdout
        except:
            pass
        
        return rules
    
    def run(self, heartbeat_interval: int = 30, command_poll_interval: int = 5):
        """Main agent loop."""
        self.running = True
        self.log(f"Starting Vanguard Agent v{AGENT_VERSION}")
        self.log(f"Device ID: {self.device_id}")
        self.log(f"Name: {self.name}")
        
        # Register first
        if not self.register():
            self.log("Failed to register, retrying in 10 seconds...", "WARN")
            time.sleep(10)
            if not self.register():
                self.log("Registration failed. Exiting.", "ERROR")
                return
        
        last_heartbeat = 0
        
        while self.running:
            try:
                current_time = time.time()
                
                # Send heartbeat
                if current_time - last_heartbeat >= heartbeat_interval:
                    self.send_heartbeat()
                    last_heartbeat = current_time
                
                # Poll for commands
                commands = self.get_pending_commands()
                for cmd in commands:
                    threading.Thread(target=self.execute_command, args=(cmd,)).start()
                
                time.sleep(command_poll_interval)
                
            except KeyboardInterrupt:
                self.log("Shutting down...")
                self.running = False
            except Exception as e:
                self.log(f"Error in main loop: {e}", "ERROR")
                time.sleep(10)
        
        self.log("Agent stopped.")


def main():
    parser = argparse.ArgumentParser(description="Ultrium Vanguard Agent")
    parser.add_argument("--device-id", required=True, help="Unique device identifier")
    parser.add_argument("--user-id", required=True, help="Owner user ID from Ultrium dashboard")
    parser.add_argument("--name", help="Device name (default: hostname)")
    parser.add_argument("--location", help="Physical location")
    parser.add_argument("--heartbeat", type=int, default=30, help="Heartbeat interval in seconds")
    parser.add_argument("--poll", type=int, default=5, help="Command poll interval in seconds")
    
    args = parser.parse_args()
    
    agent = VanguardAgent(
        device_id=args.device_id,
        user_id=args.user_id,
        name=args.name,
        location=args.location
    )
    
    agent.run(
        heartbeat_interval=args.heartbeat,
        command_poll_interval=args.poll
    )


if __name__ == "__main__":
    main()
