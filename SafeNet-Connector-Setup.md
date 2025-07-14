# SafeNet Connector Setup Guide

## Overview
The SafeNet Connector is a Python-based network scanner that runs on client networks and reports scan results back to the SafeNet dashboard. It performs comprehensive network discovery, port scanning, vulnerability detection, and automatically creates security events for high-risk devices.

## Installation

### Prerequisites
- Python 3.8 or higher
- nmap installed on the system
- Network access to perform scans
- Valid SafeNet API key

### System Requirements

#### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install python3 python3-pip nmap
```

#### CentOS/RHEL:
```bash
sudo yum install python3 python3-pip nmap
```

#### Windows:
1. Install Python from python.org
2. Install nmap from nmap.org
3. Add both to system PATH

### Install Python Dependencies
```bash
pip install -r safenet-requirements.txt
```

## Configuration

### 1. Get Your API Key
1. Log into your SafeNet dashboard
2. Go to Settings > API Keys
3. Create a new SafeNet Connector API key
4. Copy the key for use in the next step

### 2. Configure the Connector
Edit the `safenet_connector.py` file or use command line arguments:

```python
# In safenet_connector.py, update these values:
API_KEY = "your-safenet-api-key-here"
SAFENET_API_URL = "https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/safenet-connector"
SCAN_INTERVAL = 300  # 5 minutes
```

## Usage

### Test Run (Single Scan)
```bash
python3 safenet_connector.py --test --api-key YOUR_API_KEY
```

### Production Run (Continuous Scanning)
```bash
python3 safenet_connector.py --api-key YOUR_API_KEY --interval 300
```

### Command Line Options
- `--api-key`: Your SafeNet API key (required)
- `--api-url`: SafeNet API endpoint URL
- `--interval`: Scan interval in seconds (default: 300)
- `--test`: Run a single test scan and exit

## What It Scans

### Network Discovery
- Automatically detects local network interfaces
- Discovers network ranges (192.168.x.x, 10.x.x.x, etc.)
- Performs host discovery across detected ranges

### Device Information
- IP address and hostname
- MAC address (when available)
- Operating system detection
- Device type classification (server, workstation, router, printer, etc.)

### Port Scanning
- Scans common ports (1-1000)
- Service version detection
- Protocol identification

### Vulnerability Detection
- Checks for common security issues:
  - Cleartext authentication (FTP, Telnet)
  - Unencrypted HTTP services
  - Exposed RDP and SMB services
  - Outdated service versions
  - Open database ports

### Risk Assessment
- **Safe**: No vulnerabilities, minimal open ports
- **Low**: Many open ports but no known vulnerabilities
- **Medium**: Some vulnerabilities detected
- **High**: High-impact vulnerabilities found
- **Critical**: Critical security exposures detected

## Deployment Options

### As a Service (Linux)
Create a systemd service file:

```bash
sudo nano /etc/systemd/system/safenet-connector.service
```

```ini
[Unit]
Description=SafeNet Network Connector
After=network.target

[Service]
Type=simple
User=safenet
WorkingDirectory=/opt/safenet-connector
ExecStart=/usr/bin/python3 /opt/safenet-connector/safenet_connector.py --api-key YOUR_API_KEY
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable safenet-connector
sudo systemctl start safenet-connector
```

### As a Scheduled Task (Windows)
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., daily at startup)
4. Set action to run: `python.exe C:\path\to\safenet_connector.py --api-key YOUR_API_KEY`

### Docker Deployment
```dockerfile
FROM python:3.9-slim

RUN apt-get update && apt-get install -y nmap && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY safenet-requirements.txt .
RUN pip install -r safenet-requirements.txt

COPY safenet_connector.py .

CMD ["python", "safenet_connector.py", "--api-key", "$SAFENET_API_KEY"]
```

## Integration with SafeNet Dashboard

### Real-time Updates
- Scan results appear immediately in the SafeNet dashboard
- High/critical risk devices automatically create security events
- Network topology is visualized with device locations
- Historical scan data is preserved for trend analysis

### Security Events
When high or critical risk devices are detected:
- Automatic security event creation
- Detailed vulnerability information
- Recommended remediation steps
- Integration with incident response workflows

### Analytics
- Scan performance metrics
- Device discovery trends
- Vulnerability statistics
- Network security posture over time

## Troubleshooting

### Common Issues

#### Permission Denied
- Run as administrator/root for full network scanning capabilities
- Ensure nmap is properly installed and accessible

#### Network Timeouts
- Adjust scan intervals for larger networks
- Check firewall settings
- Verify network connectivity

#### API Authentication Errors
- Verify API key is correct
- Check API endpoint URL
- Ensure network can reach SafeNet servers

### Logging
Logs are written to:
- Console output (real-time)
- `safenet_connector.log` (file-based)

Log levels can be adjusted in the script configuration.

## Security Considerations

### Network Impact
- Scans use standard network discovery techniques
- Minimal network traffic generated
- No intrusive or dangerous scanning methods

### Data Privacy
- Only metadata about devices is collected
- No personal or sensitive data is accessed
- All communication encrypted in transit

### Access Control
- API key authentication required
- Scoped permissions for connector operations
- Audit trail of all scan activities

## Support

For technical support:
1. Check the SafeNet dashboard logs
2. Review connector log files
3. Verify network connectivity
4. Contact SafeNet support with log details

## Version History

### v1.0.0
- Initial release
- Basic network scanning
- Device discovery and classification
- Vulnerability detection
- SafeNet dashboard integration