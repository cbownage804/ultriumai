#!/usr/bin/env python3
"""
Ultrium Vanguard Agent v2.0.0 - Full Penetration Testing Suite
Complete RMM agent with advanced network scanning, vulnerability assessment,
service enumeration, credential testing, and AI-powered security analysis.

Usage:
    python3 vanguard_agent.py --device-id YOUR_DEVICE_ID --user-id YOUR_USER_ID

Requirements:
    pip install psutil requests python-nmap
    
Optional for full pentest capabilities:
    sudo apt install nmap nikto hydra smbclient ldap-utils sslscan masscan gobuster curl
    git clone https://github.com/CiscoCXSecurity/enum4linux-ng.git /opt/enum4linux-ng
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
import re
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import Dict, Any, Optional, List, Tuple

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

# Try to import python-nmap for advanced scanning
try:
    import nmap
    NMAP_AVAILABLE = True
except ImportError:
    NMAP_AVAILABLE = False

# Configuration
AGENT_VERSION = "2.0.0"
API_URL = "https://mwngjymbntbhpxrnjojs.supabase.co/functions/v1/vanguard-agent-api"
VANGUARD_SECRET = "vgd_sk_7Kx9mPqR3nTwYz2JfL8sHcN6bVdXaE4uGtM1oWpQ5iA"

# Default credentials database for testing
DEFAULT_CREDENTIALS = {
    "ssh": [("root", "root"), ("admin", "admin"), ("root", "toor"), ("admin", "password"), ("root", "password123")],
    "ftp": [("anonymous", ""), ("ftp", "ftp"), ("admin", "admin"), ("root", "root")],
    "mysql": [("root", ""), ("root", "root"), ("mysql", "mysql"), ("admin", "admin")],
    "postgres": [("postgres", "postgres"), ("admin", "admin"), ("root", "root")],
    "redis": [("", ""), ("", "redis")],
    "mongodb": [("admin", "admin"), ("root", "root")],
    "smb": [("guest", ""), ("administrator", "admin"), ("admin", "admin")],
    "rdp": [("administrator", "admin"), ("admin", "admin"), ("user", "user")],
    "http": [("admin", "admin"), ("admin", "password"), ("root", "root"), ("admin", "123456")],
}

# Common web paths for directory bruteforcing
COMMON_PATHS = [
    "admin", "administrator", "login", "wp-admin", "wp-login.php", "phpmyadmin",
    "admin.php", "config.php", ".git", ".env", "backup", "api", "console",
    "dashboard", "manager", "panel", "portal", "uploads", "files", "data",
    "includes", "private", "secret", "test", "dev", "staging", ".htaccess",
    "robots.txt", "sitemap.xml", "crossdomain.xml", "server-status", "info.php"
]


class VanguardAgent:
    def __init__(self, device_id: str, user_id: str, name: Optional[str] = None, location: Optional[str] = None):
        self.device_id = device_id
        self.user_id = user_id
        self.name = name or socket.gethostname()
        self.location = location
        self.running = False
        self.agent_id = None
        self.scan_progress = {}
        
        self.headers = {
            "Content-Type": "application/json",
            "X-Vanguard-Key": VANGUARD_SECRET
        }
    
    def log(self, message: str, level: str = "INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
    
    def update_progress(self, scan_id: str, phase: str, progress: int, message: str = ""):
        """Track scan progress for reporting."""
        self.scan_progress[scan_id] = {
            "phase": phase,
            "progress": progress,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        self.log(f"[{scan_id}] {phase}: {progress}% - {message}")
    
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
    
    # ==================== PENTESTING SUITE ====================
    
    def scan_ports_deep(self, target: str, options: Dict = None) -> Dict[str, Any]:
        """Deep port scan with service detection and OS fingerprinting."""
        options = options or {}
        port_range = options.get("port_range", "1-65535")
        timing = options.get("timing", "T4")  # T0-T5
        
        results = {
            "target": target,
            "scan_type": "deep_port_scan",
            "ports": [],
            "os_detection": None,
            "findings": [],
            "scan_time": datetime.now().isoformat()
        }
        
        try:
            # Fast scan with masscan if available
            if options.get("use_masscan", False):
                try:
                    masscan_result = subprocess.run(
                        ["masscan", target, "-p", port_range, "--rate=10000", "-oJ", "-"],
                        capture_output=True, text=True, timeout=300
                    )
                    if masscan_result.returncode == 0:
                        try:
                            ports = json.loads(masscan_result.stdout)
                            for p in ports:
                                results["ports"].append({
                                    "port": p.get("port"),
                                    "protocol": p.get("proto"),
                                    "state": "open"
                                })
                        except:
                            pass
                except FileNotFoundError:
                    pass
            
            # Detailed scan with nmap
            nmap_args = [
                "nmap", "-sV", "-sC",  # Version detection + default scripts
                f"-{timing}",  # Timing template
                "-p", port_range if port_range != "1-65535" else "1-1000",
                "--open",  # Only show open ports
            ]
            
            if options.get("os_detection", True):
                nmap_args.append("-O")  # OS detection
            
            if options.get("aggressive", False):
                nmap_args.append("-A")  # Aggressive mode
            
            nmap_args.extend(["-oX", "-", target])
            
            result = subprocess.run(nmap_args, capture_output=True, text=True, timeout=600)
            
            if result.returncode == 0:
                # Parse XML output
                try:
                    root = ET.fromstring(result.stdout)
                    
                    for host in root.findall('.//host'):
                        # Get OS info
                        os_match = host.find('.//osmatch')
                        if os_match is not None:
                            results["os_detection"] = {
                                "name": os_match.get("name"),
                                "accuracy": os_match.get("accuracy")
                            }
                        
                        # Get ports
                        for port in host.findall('.//port'):
                            port_id = port.get("portid")
                            protocol = port.get("protocol")
                            state = port.find('state')
                            service = port.find('service')
                            
                            port_info = {
                                "port": int(port_id),
                                "protocol": protocol,
                                "state": state.get("state") if state is not None else "unknown",
                                "service": service.get("name") if service is not None else "unknown",
                                "version": service.get("version") if service is not None else None,
                                "product": service.get("product") if service is not None else None
                            }
                            
                            results["ports"].append(port_info)
                            
                            # Add finding for critical ports
                            if int(port_id) in [21, 22, 23, 25, 445, 3389, 5900]:
                                results["findings"].append({
                                    "title": f"Critical service on port {port_id}",
                                    "port": int(port_id),
                                    "service": port_info["service"],
                                    "severity": "medium",
                                    "description": f"Found {port_info['service']} running on port {port_id}"
                                })
                except Exception as e:
                    self.log(f"Error parsing nmap XML: {e}", "ERROR")
            
            results["total_open_ports"] = len(results["ports"])
            
        except FileNotFoundError:
            results["error"] = "nmap not installed. Install with: sudo apt install nmap"
        except subprocess.TimeoutExpired:
            results["error"] = "Scan timed out"
        except Exception as e:
            results["error"] = str(e)
        
        return results
    
    def scan_ssl(self, target: str, port: int = 443) -> Dict[str, Any]:
        """SSL/TLS security analysis."""
        results = {
            "target": target,
            "port": port,
            "scan_type": "ssl_analysis",
            "certificate": None,
            "protocols": [],
            "ciphers": [],
            "vulnerabilities": [],
            "findings": [],
            "scan_time": datetime.now().isoformat()
        }
        
        try:
            # Try sslscan first
            try:
                sslscan_result = subprocess.run(
                    ["sslscan", "--no-colour", f"{target}:{port}"],
                    capture_output=True, text=True, timeout=60
                )
                
                if sslscan_result.returncode == 0:
                    output = sslscan_result.stdout
                    
                    # Check for weak protocols
                    if "SSLv2" in output and "enabled" in output.lower():
                        results["findings"].append({
                            "title": "SSLv2 Enabled",
                            "severity": "critical",
                            "description": "SSLv2 is deprecated and vulnerable. Disable immediately.",
                            "cve": "CVE-2016-0800"
                        })
                    
                    if "SSLv3" in output and "enabled" in output.lower():
                        results["findings"].append({
                            "title": "SSLv3 Enabled (POODLE)",
                            "severity": "high",
                            "description": "SSLv3 is vulnerable to POODLE attack. Disable immediately.",
                            "cve": "CVE-2014-3566"
                        })
                    
                    if "TLSv1.0" in output:
                        results["protocols"].append("TLSv1.0")
                        results["findings"].append({
                            "title": "TLSv1.0 Enabled",
                            "severity": "medium",
                            "description": "TLSv1.0 is deprecated. Consider upgrading to TLSv1.2+."
                        })
                    
                    if "TLSv1.1" in output:
                        results["protocols"].append("TLSv1.1")
                    if "TLSv1.2" in output:
                        results["protocols"].append("TLSv1.2")
                    if "TLSv1.3" in output:
                        results["protocols"].append("TLSv1.3")
                    
                    # Check for weak ciphers
                    weak_ciphers = ["RC4", "DES", "3DES", "MD5", "NULL", "EXPORT", "anon"]
                    for cipher in weak_ciphers:
                        if cipher in output:
                            results["findings"].append({
                                "title": f"Weak cipher detected: {cipher}",
                                "severity": "high",
                                "description": f"Weak cipher {cipher} is supported. This should be disabled."
                            })
                    
                    # Check for Heartbleed
                    if "heartbleed" in output.lower() and "vulnerable" in output.lower():
                        results["findings"].append({
                            "title": "Heartbleed Vulnerability",
                            "severity": "critical",
                            "description": "Server is vulnerable to Heartbleed (CVE-2014-0160).",
                            "cve": "CVE-2014-0160"
                        })
            except FileNotFoundError:
                pass
            
            # Use nmap ssl scripts as fallback/supplement
            nmap_result = subprocess.run(
                ["nmap", "-sV", "--script", "ssl-enum-ciphers,ssl-cert,ssl-heartbleed,ssl-poodle,ssl-dh-params",
                 "-p", str(port), target, "-oX", "-"],
                capture_output=True, text=True, timeout=120
            )
            
            if nmap_result.returncode == 0:
                try:
                    root = ET.fromstring(nmap_result.stdout)
                    
                    for script in root.findall('.//script'):
                        script_id = script.get("id")
                        output = script.get("output", "")
                        
                        if script_id == "ssl-cert":
                            # Parse certificate info
                            results["certificate"] = {
                                "raw": output[:500]  # Truncate
                            }
                            
                            # Check expiry
                            if "Not valid after:" in output:
                                try:
                                    exp_line = [l for l in output.split("\n") if "Not valid after" in l][0]
                                    exp_date = exp_line.split(":", 1)[1].strip()
                                    results["certificate"]["expires"] = exp_date
                                except:
                                    pass
                        
                        elif script_id == "ssl-heartbleed":
                            if "VULNERABLE" in output:
                                results["vulnerabilities"].append("Heartbleed")
                        
                        elif script_id == "ssl-poodle":
                            if "VULNERABLE" in output:
                                results["vulnerabilities"].append("POODLE")
                except:
                    pass
            
        except subprocess.TimeoutExpired:
            results["error"] = "Scan timed out"
        except Exception as e:
            results["error"] = str(e)
        
        return results
    
    def scan_web(self, target: str, options: Dict = None) -> Dict[str, Any]:
        """Web application security scanning."""
        options = options or {}
        results = {
            "target": target,
            "scan_type": "web_scan",
            "technologies": [],
            "directories": [],
            "headers": {},
            "vulnerabilities": [],
            "findings": [],
            "scan_time": datetime.now().isoformat()
        }
        
        # Ensure target has protocol
        if not target.startswith(("http://", "https://")):
            target = f"http://{target}"
        
        try:
            # HTTP Headers analysis
            try:
                response = requests.get(target, timeout=10, verify=False, allow_redirects=True)
                results["status_code"] = response.status_code
                results["headers"] = dict(response.headers)
                
                # Check security headers
                security_headers = {
                    "Strict-Transport-Security": "HSTS",
                    "X-Content-Type-Options": "Content Type Options",
                    "X-Frame-Options": "Clickjacking Protection",
                    "X-XSS-Protection": "XSS Protection",
                    "Content-Security-Policy": "CSP"
                }
                
                for header, name in security_headers.items():
                    if header not in response.headers:
                        results["findings"].append({
                            "title": f"Missing {name} Header",
                            "severity": "medium" if header == "Content-Security-Policy" else "low",
                            "description": f"Missing {header} header. This could expose the application to attacks."
                        })
                
                # Server banner disclosure
                if "Server" in response.headers:
                    server = response.headers["Server"]
                    results["technologies"].append(server)
                    results["findings"].append({
                        "title": "Server Banner Disclosure",
                        "severity": "info",
                        "description": f"Server header reveals: {server}"
                    })
                
                # Technology detection from response
                body = response.text.lower()
                if "wordpress" in body or "wp-content" in body:
                    results["technologies"].append("WordPress")
                if "drupal" in body:
                    results["technologies"].append("Drupal")
                if "joomla" in body:
                    results["technologies"].append("Joomla")
                if "jquery" in body:
                    results["technologies"].append("jQuery")
                if "react" in body:
                    results["technologies"].append("React")
                if "angular" in body:
                    results["technologies"].append("Angular")
                if "vue" in body:
                    results["technologies"].append("Vue.js")
                
            except requests.RequestException as e:
                results["connection_error"] = str(e)
            
            # Directory bruteforcing
            if options.get("bruteforce", True):
                for path in COMMON_PATHS[:20]:  # Limit for speed
                    try:
                        url = f"{target.rstrip('/')}/{path}"
                        resp = requests.get(url, timeout=5, verify=False, allow_redirects=False)
                        if resp.status_code in [200, 301, 302, 403]:
                            results["directories"].append({
                                "path": f"/{path}",
                                "status": resp.status_code,
                                "size": len(resp.content)
                            })
                            
                            if path in [".git", ".env", "config.php", ".htaccess", "backup"]:
                                results["findings"].append({
                                    "title": f"Sensitive path accessible: /{path}",
                                    "severity": "high",
                                    "description": f"Found accessible sensitive path at /{path}"
                                })
                    except:
                        pass
            
            # Use gobuster if available for more thorough scanning
            if options.get("use_gobuster", False):
                try:
                    gobuster_result = subprocess.run(
                        ["gobuster", "dir", "-u", target, "-w", "/usr/share/wordlists/dirb/common.txt",
                         "-q", "-t", "10", "--timeout", "10s"],
                        capture_output=True, text=True, timeout=120
                    )
                    if gobuster_result.returncode == 0:
                        for line in gobuster_result.stdout.split("\n"):
                            if line.strip():
                                results["directories"].append({"raw": line.strip()})
                except:
                    pass
            
            # Use nikto if available
            if options.get("use_nikto", False):
                try:
                    nikto_result = subprocess.run(
                        ["nikto", "-h", target, "-maxtime", "120s", "-Format", "json", "-output", "-"],
                        capture_output=True, text=True, timeout=180
                    )
                    if nikto_result.returncode == 0:
                        results["nikto_scan"] = nikto_result.stdout[:2000]  # Truncate
                except:
                    pass
            
        except Exception as e:
            results["error"] = str(e)
        
        return results
    
    def scan_smb(self, target: str) -> Dict[str, Any]:
        """SMB enumeration and vulnerability scanning."""
        results = {
            "target": target,
            "scan_type": "smb_scan",
            "shares": [],
            "users": [],
            "os_info": None,
            "vulnerabilities": [],
            "findings": [],
            "scan_time": datetime.now().isoformat()
        }
        
        try:
            # Check for SMB port
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            result = sock.connect_ex((target, 445))
            sock.close()
            
            if result != 0:
                results["error"] = "SMB port 445 not open"
                return results
            
            results["smb_port_open"] = True
            
            # Use nmap SMB scripts
            nmap_result = subprocess.run(
                ["nmap", "-sV", "--script", "smb-enum-shares,smb-enum-users,smb-os-discovery,smb-vuln-*",
                 "-p", "445", target, "-oX", "-"],
                capture_output=True, text=True, timeout=120
            )
            
            if nmap_result.returncode == 0:
                try:
                    root = ET.fromstring(nmap_result.stdout)
                    
                    for script in root.findall('.//script'):
                        script_id = script.get("id")
                        output = script.get("output", "")
                        
                        if script_id == "smb-enum-shares":
                            # Parse shares
                            for line in output.split("\n"):
                                if "$" in line or ":" in line:
                                    results["shares"].append(line.strip())
                        
                        elif script_id == "smb-os-discovery":
                            results["os_info"] = output.strip()[:200]
                        
                        elif "smb-vuln" in script_id:
                            if "VULNERABLE" in output:
                                vuln_name = script_id.replace("smb-vuln-", "").upper()
                                results["vulnerabilities"].append(vuln_name)
                                
                                severity = "critical"
                                cve = None
                                
                                if "ms17-010" in script_id.lower():
                                    cve = "CVE-2017-0144"
                                    results["findings"].append({
                                        "title": "EternalBlue Vulnerability (MS17-010)",
                                        "severity": "critical",
                                        "description": "System is vulnerable to EternalBlue/WannaCry exploit.",
                                        "cve": cve
                                    })
                                elif "ms08-067" in script_id.lower():
                                    cve = "CVE-2008-4250"
                                    results["findings"].append({
                                        "title": "MS08-067 Vulnerability",
                                        "severity": "critical",
                                        "description": "System is vulnerable to Conficker worm exploit.",
                                        "cve": cve
                                    })
                                else:
                                    results["findings"].append({
                                        "title": f"SMB Vulnerability: {vuln_name}",
                                        "severity": "high",
                                        "description": output[:200]
                                    })
                except:
                    pass
            
            # Try smbclient for anonymous access
            try:
                smb_result = subprocess.run(
                    ["smbclient", "-L", f"//{target}", "-N"],
                    capture_output=True, text=True, timeout=30
                )
                if smb_result.returncode == 0:
                    results["findings"].append({
                        "title": "SMB Anonymous Access Allowed",
                        "severity": "high",
                        "description": "SMB server allows anonymous listing of shares."
                    })
                    results["anonymous_access"] = True
            except:
                pass
            
            # Try enum4linux-ng
            try:
                enum_result = subprocess.run(
                    ["/opt/enum4linux-ng/enum4linux-ng.py", "-A", target],
                    capture_output=True, text=True, timeout=120
                )
                if enum_result.returncode == 0:
                    results["enum4linux_output"] = enum_result.stdout[:2000]
            except:
                pass
            
        except Exception as e:
            results["error"] = str(e)
        
        return results
    
    def scan_ssh(self, target: str, port: int = 22) -> Dict[str, Any]:
        """SSH security analysis."""
        results = {
            "target": target,
            "port": port,
            "scan_type": "ssh_scan",
            "algorithms": {},
            "banner": None,
            "vulnerabilities": [],
            "findings": [],
            "scan_time": datetime.now().isoformat()
        }
        
        try:
            # Get SSH banner
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(10)
                sock.connect((target, port))
                banner = sock.recv(1024).decode('utf-8', errors='ignore').strip()
                sock.close()
                results["banner"] = banner
                
                # Check for old SSH versions
                if "SSH-1" in banner:
                    results["findings"].append({
                        "title": "SSH Protocol 1 Supported",
                        "severity": "critical",
                        "description": "SSH v1 is deprecated and has known vulnerabilities."
                    })
                
                # Check for version disclosure
                if "OpenSSH" in banner:
                    results["findings"].append({
                        "title": "SSH Version Disclosure",
                        "severity": "info",
                        "description": f"SSH version disclosed: {banner}"
                    })
                    
                    # Check for old OpenSSH versions
                    version_match = re.search(r'OpenSSH[_\s](\d+\.\d+)', banner)
                    if version_match:
                        version = float(version_match.group(1))
                        if version < 7.0:
                            results["findings"].append({
                                "title": "Outdated SSH Version",
                                "severity": "high",
                                "description": f"OpenSSH {version} is outdated. Upgrade to 8.0+."
                            })
            except:
                pass
            
            # Use nmap for algorithm enumeration
            nmap_result = subprocess.run(
                ["nmap", "-sV", "--script", "ssh2-enum-algos,ssh-auth-methods",
                 "-p", str(port), target, "-oX", "-"],
                capture_output=True, text=True, timeout=60
            )
            
            if nmap_result.returncode == 0:
                try:
                    root = ET.fromstring(nmap_result.stdout)
                    
                    for script in root.findall('.//script'):
                        script_id = script.get("id")
                        output = script.get("output", "")
                        
                        if script_id == "ssh2-enum-algos":
                            results["algorithms"]["raw"] = output[:500]
                            
                            # Check for weak algorithms
                            weak_algos = ["arcfour", "3des", "blowfish", "des", "rc4", "md5"]
                            for algo in weak_algos:
                                if algo.lower() in output.lower():
                                    results["findings"].append({
                                        "title": f"Weak SSH Algorithm: {algo}",
                                        "severity": "medium",
                                        "description": f"SSH supports weak algorithm: {algo}"
                                    })
                        
                        elif script_id == "ssh-auth-methods":
                            results["auth_methods"] = output.strip()
                            if "password" in output.lower():
                                results["findings"].append({
                                    "title": "SSH Password Authentication Enabled",
                                    "severity": "low",
                                    "description": "Password authentication is enabled. Consider key-only auth."
                                })
                except:
                    pass
            
        except Exception as e:
            results["error"] = str(e)
        
        return results
    
    def scan_ftp(self, target: str, port: int = 21) -> Dict[str, Any]:
        """FTP security analysis."""
        results = {
            "target": target,
            "port": port,
            "scan_type": "ftp_scan",
            "banner": None,
            "anonymous_access": False,
            "vulnerabilities": [],
            "findings": [],
            "scan_time": datetime.now().isoformat()
        }
        
        try:
            # Get FTP banner and test anonymous access
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(10)
                sock.connect((target, port))
                banner = sock.recv(1024).decode('utf-8', errors='ignore').strip()
                results["banner"] = banner
                
                # Test anonymous login
                sock.send(b"USER anonymous\r\n")
                resp = sock.recv(1024).decode('utf-8', errors='ignore')
                if "331" in resp:  # Password required
                    sock.send(b"PASS anonymous@test.com\r\n")
                    resp = sock.recv(1024).decode('utf-8', errors='ignore')
                    if "230" in resp:  # Login successful
                        results["anonymous_access"] = True
                        results["findings"].append({
                            "title": "FTP Anonymous Access Allowed",
                            "severity": "high",
                            "description": "FTP server allows anonymous login."
                        })
                
                sock.close()
            except:
                pass
            
            # Use nmap FTP scripts
            nmap_result = subprocess.run(
                ["nmap", "-sV", "--script", "ftp-anon,ftp-bounce,ftp-vuln-*",
                 "-p", str(port), target, "-oX", "-"],
                capture_output=True, text=True, timeout=60
            )
            
            if nmap_result.returncode == 0:
                try:
                    root = ET.fromstring(nmap_result.stdout)
                    
                    for script in root.findall('.//script'):
                        script_id = script.get("id")
                        output = script.get("output", "")
                        
                        if "VULNERABLE" in output:
                            results["vulnerabilities"].append(script_id)
                            results["findings"].append({
                                "title": f"FTP Vulnerability: {script_id}",
                                "severity": "high",
                                "description": output[:200]
                            })
                        
                        if script_id == "ftp-bounce":
                            if "bounces to" in output:
                                results["findings"].append({
                                    "title": "FTP Bounce Attack Possible",
                                    "severity": "medium",
                                    "description": "FTP server may allow bounce attacks."
                                })
                except:
                    pass
            
        except Exception as e:
            results["error"] = str(e)
        
        return results
    
    def scan_dns(self, target: str) -> Dict[str, Any]:
        """DNS enumeration and security testing."""
        results = {
            "target": target,
            "scan_type": "dns_scan",
            "records": {},
            "zone_transfer": None,
            "findings": [],
            "scan_time": datetime.now().isoformat()
        }
        
        try:
            # Try zone transfer
            try:
                zone_result = subprocess.run(
                    ["dig", "AXFR", target, f"@{target}"],
                    capture_output=True, text=True, timeout=30
                )
                if zone_result.returncode == 0 and "XFR size" in zone_result.stdout:
                    results["zone_transfer"] = "ALLOWED"
                    results["findings"].append({
                        "title": "DNS Zone Transfer Allowed",
                        "severity": "high",
                        "description": "DNS server allows zone transfers. This exposes all DNS records."
                    })
                    results["records"]["zone_data"] = zone_result.stdout[:2000]
                else:
                    results["zone_transfer"] = "DENIED"
            except:
                pass
            
            # DNS enumeration with nmap
            nmap_result = subprocess.run(
                ["nmap", "-sU", "-sV", "--script", "dns-nsid,dns-recursion,dns-cache-snoop",
                 "-p", "53", target, "-oX", "-"],
                capture_output=True, text=True, timeout=60
            )
            
            if nmap_result.returncode == 0:
                try:
                    root = ET.fromstring(nmap_result.stdout)
                    
                    for script in root.findall('.//script'):
                        script_id = script.get("id")
                        output = script.get("output", "")
                        
                        if script_id == "dns-recursion" and "enabled" in output.lower():
                            results["findings"].append({
                                "title": "DNS Recursion Enabled",
                                "severity": "medium",
                                "description": "DNS server allows recursive queries. Could be used for amplification attacks."
                            })
                except:
                    pass
            
        except Exception as e:
            results["error"] = str(e)
        
        return results
    
    def scan_rdp(self, target: str, port: int = 3389) -> Dict[str, Any]:
        """RDP security analysis including BlueKeep check."""
        results = {
            "target": target,
            "port": port,
            "scan_type": "rdp_scan",
            "encryption": None,
            "vulnerabilities": [],
            "findings": [],
            "scan_time": datetime.now().isoformat()
        }
        
        try:
            # Check if RDP port is open
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(10)
            result = sock.connect_ex((target, port))
            sock.close()
            
            if result != 0:
                results["error"] = "RDP port not open"
                return results
            
            results["rdp_port_open"] = True
            
            # Use nmap RDP scripts
            nmap_result = subprocess.run(
                ["nmap", "-sV", "--script", "rdp-enum-encryption,rdp-vuln-ms12-020,rdp-ntlm-info",
                 "-p", str(port), target, "-oX", "-"],
                capture_output=True, text=True, timeout=60
            )
            
            if nmap_result.returncode == 0:
                try:
                    root = ET.fromstring(nmap_result.stdout)
                    
                    for script in root.findall('.//script'):
                        script_id = script.get("id")
                        output = script.get("output", "")
                        
                        if script_id == "rdp-enum-encryption":
                            results["encryption"] = output[:200]
                            if "FIPS" not in output and "HIGH" not in output.upper():
                                results["findings"].append({
                                    "title": "Weak RDP Encryption",
                                    "severity": "medium",
                                    "description": "RDP is not using strong encryption."
                                })
                        
                        elif "ms12-020" in script_id:
                            if "VULNERABLE" in output:
                                results["vulnerabilities"].append("MS12-020")
                                results["findings"].append({
                                    "title": "MS12-020 Vulnerability (BlueKeep Predecessor)",
                                    "severity": "critical",
                                    "description": "RDP is vulnerable to MS12-020.",
                                    "cve": "CVE-2012-0002"
                                })
                except:
                    pass
            
            # Check for BlueKeep (CVE-2019-0708)
            # Note: Actual exploit check would require more sophisticated tools
            results["findings"].append({
                "title": "RDP Service Exposed",
                "severity": "medium",
                "description": "RDP is exposed. Ensure NLA is enabled and check for CVE-2019-0708 (BlueKeep)."
            })
            
        except Exception as e:
            results["error"] = str(e)
        
        return results
    
    def test_default_creds(self, target: str, services: List[str] = None) -> Dict[str, Any]:
        """Test for default credentials on common services."""
        services = services or ["ssh", "ftp", "http"]
        results = {
            "target": target,
            "scan_type": "credential_test",
            "vulnerable_services": [],
            "findings": [],
            "scan_time": datetime.now().isoformat()
        }
        
        for service in services:
            if service not in DEFAULT_CREDENTIALS:
                continue
            
            port_map = {
                "ssh": 22, "ftp": 21, "mysql": 3306, "postgres": 5432,
                "redis": 6379, "mongodb": 27017, "smb": 445, "rdp": 3389, "http": 80
            }
            port = port_map.get(service, 80)
            
            # Check if port is open first
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(3)
                result = sock.connect_ex((target, port))
                sock.close()
                if result != 0:
                    continue
            except:
                continue
            
            for username, password in DEFAULT_CREDENTIALS[service][:3]:  # Limit attempts
                try:
                    if service == "ssh":
                        # Use ssh command to test (non-interactive)
                        result = subprocess.run(
                            ["sshpass", "-p", password, "ssh", "-o", "StrictHostKeyChecking=no",
                             "-o", "ConnectTimeout=5", f"{username}@{target}", "exit"],
                            capture_output=True, text=True, timeout=10
                        )
                        if result.returncode == 0:
                            results["vulnerable_services"].append({
                                "service": "ssh",
                                "username": username,
                                "password": password
                            })
                            results["findings"].append({
                                "title": f"Default SSH Credentials: {username}:{password}",
                                "severity": "critical",
                                "description": f"SSH accepts default credentials {username}:{password}"
                            })
                            break
                    
                    elif service == "ftp":
                        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                        sock.settimeout(5)
                        sock.connect((target, 21))
                        sock.recv(1024)
                        sock.send(f"USER {username}\r\n".encode())
                        sock.recv(1024)
                        sock.send(f"PASS {password}\r\n".encode())
                        resp = sock.recv(1024).decode()
                        sock.close()
                        if "230" in resp:
                            results["vulnerable_services"].append({
                                "service": "ftp",
                                "username": username,
                                "password": password
                            })
                            results["findings"].append({
                                "title": f"Default FTP Credentials: {username}:{password}",
                                "severity": "critical",
                                "description": f"FTP accepts default credentials {username}:{password}"
                            })
                            break
                    
                    elif service == "http":
                        # Test common auth endpoints
                        for path in ["/admin", "/login", "/manager/html"]:
                            try:
                                resp = requests.get(
                                    f"http://{target}{path}",
                                    auth=(username, password),
                                    timeout=5,
                                    verify=False
                                )
                                if resp.status_code == 200:
                                    results["vulnerable_services"].append({
                                        "service": "http",
                                        "path": path,
                                        "username": username
                                    })
                                    results["findings"].append({
                                        "title": f"Default HTTP Credentials at {path}",
                                        "severity": "high",
                                        "description": f"HTTP Basic Auth accepts {username}:{password}"
                                    })
                            except:
                                pass
                except:
                    pass
        
        return results
    
    def scan_cve(self, target: str, options: Dict = None) -> Dict[str, Any]:
        """Advanced CVE vulnerability scanning."""
        options = options or {}
        results = {
            "target": target,
            "scan_type": "cve_scan",
            "cves_found": [],
            "findings": [],
            "scan_time": datetime.now().isoformat()
        }
        
        try:
            # Comprehensive nmap vuln scan
            nmap_scripts = [
                "vuln",
                "exploit",
                "http-vuln-*",
                "smb-vuln-*",
                "ssl-*",
                "auth"
            ]
            
            nmap_result = subprocess.run(
                ["nmap", "-sV", "--script", ",".join(nmap_scripts),
                 "-p", options.get("ports", "21,22,23,25,80,443,445,3306,3389,8080"),
                 target, "-oX", "-"],
                capture_output=True, text=True, timeout=600
            )
            
            if nmap_result.returncode == 0:
                try:
                    root = ET.fromstring(nmap_result.stdout)
                    
                    for script in root.findall('.//script'):
                        script_id = script.get("id")
                        output = script.get("output", "")
                        
                        # Look for CVE references
                        cve_matches = re.findall(r'CVE-\d{4}-\d{4,7}', output, re.IGNORECASE)
                        for cve in cve_matches:
                            if cve not in results["cves_found"]:
                                results["cves_found"].append(cve)
                        
                        if "VULNERABLE" in output:
                            severity = "critical" if any(x in script_id for x in ["ms17", "ms08", "heartbleed", "bluekeep"]) else "high"
                            
                            finding = {
                                "title": f"Vulnerability: {script_id}",
                                "severity": severity,
                                "description": output[:300]
                            }
                            
                            if cve_matches:
                                finding["cves"] = cve_matches
                            
                            results["findings"].append(finding)
                except:
                    pass
            
            # Check for specific high-profile vulnerabilities
            high_profile_checks = {
                "Log4Shell": ("http", 80, "log4j"),
                "ProxyShell": ("https", 443, "exchange"),
                "PrintNightmare": ("smb", 445, "print")
            }
            
            for vuln_name, (proto, port, keyword) in high_profile_checks.items():
                try:
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(3)
                    result = sock.connect_ex((target, port))
                    sock.close()
                    if result == 0:
                        results["findings"].append({
                            "title": f"Potential {vuln_name} Target",
                            "severity": "info",
                            "description": f"Port {port} is open. Manual testing for {vuln_name} recommended."
                        })
                except:
                    pass
            
        except Exception as e:
            results["error"] = str(e)
        
        return results
    
    def pentest_full(self, target: str, options: Dict = None) -> Dict[str, Any]:
        """Complete penetration testing workflow."""
        options = options or {}
        scan_id = f"pentest_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        results = {
            "target": target,
            "scan_type": "full_pentest",
            "scan_id": scan_id,
            "phases": {},
            "findings": [],
            "summary": {},
            "scan_time": datetime.now().isoformat()
        }
        
        try:
            # Phase 1: Discovery
            self.update_progress(scan_id, "Discovery", 10, "Starting port scan...")
            results["phases"]["port_scan"] = self.scan_ports_deep(target, {
                "port_range": options.get("port_range", "1-1000"),
                "timing": "T4"
            })
            
            # Phase 2: Service Enumeration
            self.update_progress(scan_id, "Enumeration", 30, "Enumerating services...")
            
            open_ports = [p["port"] for p in results["phases"]["port_scan"].get("ports", [])]
            
            if 22 in open_ports:
                results["phases"]["ssh"] = self.scan_ssh(target)
            
            if 21 in open_ports:
                results["phases"]["ftp"] = self.scan_ftp(target)
            
            if 445 in open_ports:
                results["phases"]["smb"] = self.scan_smb(target)
            
            if 3389 in open_ports:
                results["phases"]["rdp"] = self.scan_rdp(target)
            
            if 53 in open_ports:
                results["phases"]["dns"] = self.scan_dns(target)
            
            # Phase 3: Web Application Scanning
            if 80 in open_ports or 443 in open_ports or 8080 in open_ports:
                self.update_progress(scan_id, "Web Scan", 50, "Scanning web application...")
                web_target = f"https://{target}" if 443 in open_ports else f"http://{target}"
                results["phases"]["web"] = self.scan_web(web_target, options)
                
                if 443 in open_ports:
                    results["phases"]["ssl"] = self.scan_ssl(target, 443)
            
            # Phase 4: Vulnerability Assessment
            self.update_progress(scan_id, "Vulnerability Scan", 70, "Running CVE checks...")
            results["phases"]["cve"] = self.scan_cve(target, options)
            
            # Phase 5: Credential Testing
            if options.get("test_credentials", False):
                self.update_progress(scan_id, "Credential Test", 85, "Testing default credentials...")
                results["phases"]["credentials"] = self.test_default_creds(target)
            
            # Aggregate findings
            self.update_progress(scan_id, "Finalizing", 95, "Generating report...")
            
            all_findings = []
            for phase_name, phase_data in results["phases"].items():
                if isinstance(phase_data, dict) and "findings" in phase_data:
                    for finding in phase_data["findings"]:
                        finding["phase"] = phase_name
                        all_findings.append(finding)
            
            results["findings"] = all_findings
            
            # Generate summary
            critical_count = len([f for f in all_findings if f.get("severity") == "critical"])
            high_count = len([f for f in all_findings if f.get("severity") == "high"])
            medium_count = len([f for f in all_findings if f.get("severity") == "medium"])
            low_count = len([f for f in all_findings if f.get("severity") in ["low", "info"]])
            
            results["summary"] = {
                "total_findings": len(all_findings),
                "critical": critical_count,
                "high": high_count,
                "medium": medium_count,
                "low": low_count,
                "open_ports": len(results["phases"]["port_scan"].get("ports", [])),
                "os_detected": results["phases"]["port_scan"].get("os_detection"),
                "risk_score": min(100, critical_count * 25 + high_count * 10 + medium_count * 5 + low_count)
            }
            
            self.update_progress(scan_id, "Complete", 100, "Pentest complete!")
            
        except Exception as e:
            results["error"] = str(e)
            self.log(f"Pentest error: {e}", "ERROR")
        
        return results
    
    # ==================== ORIGINAL METHODS ====================
    
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
                        capture_output=True, text=True, timeout=300
                    )
                elif shell == "powershell":
                    result = subprocess.run(
                        ["powershell", "-Command", script],
                        capture_output=True, text=True, timeout=300
                    )
                else:
                    result = subprocess.run(
                        script, shell=True,
                        capture_output=True, text=True, timeout=300
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
            
            # NEW PENTEST COMMANDS
            elif command_type == "scan_ports_deep":
                target = payload.get("target", self.get_ip_address())
                result = self.scan_ports_deep(target, payload.get("options", {}))
                self.send_command_response(command_id, result, True)
            
            elif command_type == "scan_ssl":
                target = payload.get("target")
                port = payload.get("port", 443)
                result = self.scan_ssl(target, port)
                self.send_command_response(command_id, result, True)
            
            elif command_type == "scan_web":
                target = payload.get("target")
                result = self.scan_web(target, payload.get("options", {}))
                self.send_command_response(command_id, result, True)
            
            elif command_type == "scan_smb":
                target = payload.get("target")
                result = self.scan_smb(target)
                self.send_command_response(command_id, result, True)
            
            elif command_type == "scan_ssh":
                target = payload.get("target")
                port = payload.get("port", 22)
                result = self.scan_ssh(target, port)
                self.send_command_response(command_id, result, True)
            
            elif command_type == "scan_ftp":
                target = payload.get("target")
                port = payload.get("port", 21)
                result = self.scan_ftp(target, port)
                self.send_command_response(command_id, result, True)
            
            elif command_type == "scan_dns":
                target = payload.get("target")
                result = self.scan_dns(target)
                self.send_command_response(command_id, result, True)
            
            elif command_type == "scan_rdp":
                target = payload.get("target")
                port = payload.get("port", 3389)
                result = self.scan_rdp(target, port)
                self.send_command_response(command_id, result, True)
            
            elif command_type == "test_default_creds":
                target = payload.get("target")
                services = payload.get("services")
                result = self.test_default_creds(target, services)
                self.send_command_response(command_id, result, True)
            
            elif command_type == "scan_cve":
                target = payload.get("target")
                result = self.scan_cve(target, payload.get("options", {}))
                self.send_command_response(command_id, result, True)
            
            elif command_type == "pentest_full":
                target = payload.get("target", "auto")
                if target == "auto":
                    target = ".".join(self.get_ip_address().split(".")[:-1]) + ".0/24"
                result = self.pentest_full(target, payload.get("options", {}))
                self.send_command_response(command_id, result, True)
            
            # ORIGINAL COMMANDS
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
            ip = self.get_ip_address()
            network = ".".join(ip.split(".")[:-1]) + ".0/24"
            
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
            
            result = subprocess.run([
                "nmap", "-sV", "--script", "vuln",
                "-p", "22,80,443,445,3389,8080",
                network, "--open", "-oX", "-"
            ], capture_output=True, text=True, timeout=600)
            
            vulnerabilities = []
            if "VULNERABLE" in result.stdout:
                for line in result.stdout.split("\n"):
                    if "VULNERABLE" in line or "CVE-" in line:
                        vulnerabilities.append(line.strip())
            
            return {
                "scan_type": "vulnerability",
                "target": network,
                "vulnerabilities_found": len(vulnerabilities),
                "findings": vulnerabilities[:50],
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
        
        try:
            result = subprocess.run(
                ["dpkg", "-l"],
                capture_output=True, text=True, timeout=30
            )
            packages = []
            for line in result.stdout.split("\n")[5:]:
                if line.startswith("ii"):
                    parts = line.split()
                    if len(parts) >= 3:
                        packages.append({
                            "name": parts[1],
                            "version": parts[2]
                        })
            inventory["installed_packages"] = packages[:100]
            inventory["package_count"] = len(packages)
        except:
            pass
        
        return inventory
    
    def get_software_list(self) -> List[Dict]:
        """Get list of installed software."""
        packages = []
        
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
            subprocess.run(["sudo", "apt", "update"], 
                         capture_output=True, timeout=120)
            
            result = subprocess.run(
                ["apt", "list", "--upgradable"],
                capture_output=True, text=True, timeout=30
            )
            
            for line in result.stdout.split("\n")[1:]:
                if "/" in line:
                    pkg_name = line.split("/")[0]
                    updates["available"].append(pkg_name)
            
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
        
        return connections[:100]
    
    def get_firewall_rules(self) -> Dict[str, Any]:
        """Get firewall rules (iptables/ufw)."""
        rules = {"iptables": [], "ufw": None}
        
        try:
            result = subprocess.run(
                ["sudo", "iptables", "-L", "-n"],
                capture_output=True, text=True, timeout=30
            )
            rules["iptables"] = result.stdout.split("\n")[:50]
        except:
            pass
        
        try:
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
                
                if current_time - last_heartbeat >= heartbeat_interval:
                    self.send_heartbeat()
                    last_heartbeat = current_time
                
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
    parser = argparse.ArgumentParser(description="Ultrium Vanguard Agent - Full Pentesting Suite")
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
