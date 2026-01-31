# RustDesk Self-Hosted Setup Guide

Complete guide for deploying a self-hosted RustDesk infrastructure for Vanguard RMM.

## Why Self-Host RustDesk?

| Feature | Public Relay | Self-Hosted |
|---------|-------------|-------------|
| **Privacy** | Traffic routes through public servers | All traffic stays on your infrastructure |
| **Performance** | Variable latency | Optimized for your network topology |
| **Control** | Limited | Full control over access, logs, users |
| **Branding** | RustDesk branding | Custom branded clients possible |
| **Compliance** | May not meet requirements | HIPAA/SOC2/GDPR compliant deployments |
| **Cost** | Free tier limited | One-time server cost, unlimited connections |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Your Infrastructure                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐     ┌─────────────────┐                    │
│  │  hbbs Server    │     │  hbbr Server    │                    │
│  │  (ID/Rendezvous)│◄───►│  (Relay)        │                    │
│  │  Port: 21115-16 │     │  Port: 21117    │                    │
│  └────────┬────────┘     └────────┬────────┘                    │
│           │                       │                              │
│           └───────────┬───────────┘                              │
│                       │                                          │
│              ┌────────▼────────┐                                 │
│              │  Load Balancer  │ (Optional for HA)               │
│              │  yourrelay.com  │                                 │
│              └────────┬────────┘                                 │
│                       │                                          │
└───────────────────────┼─────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
   │ Client  │    │ Client  │    │ Client  │
   │ Endpoint│    │ Endpoint│    │ Endpoint│
   └─────────┘    └─────────┘    └─────────┘
```

## Server Requirements

### Minimum (Up to 100 concurrent connections)
- 1 vCPU
- 1GB RAM
- 10GB SSD
- Ubuntu 22.04 LTS or Debian 12

### Recommended (100-500 concurrent connections)
- 2 vCPU
- 2GB RAM
- 20GB SSD
- Low latency network (cloud provider near your clients)

### Enterprise (500+ concurrent connections)
- 4+ vCPU
- 4GB+ RAM
- Consider multiple relay servers geographically distributed

## Firewall Ports

| Port | Protocol | Service | Required |
|------|----------|---------|----------|
| 21115 | TCP | NAT type test | Yes |
| 21116 | TCP/UDP | ID registration + Heartbeat | Yes |
| 21117 | TCP | Relay | Yes |
| 21118 | TCP | Web client support | Optional |
| 21119 | TCP | Web client support | Optional |

## Installation Options

### Option 1: Docker (Recommended)

```bash
# Create directory
mkdir -p /opt/rustdesk-server && cd /opt/rustdesk-server

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3'

services:
  hbbs:
    container_name: hbbs
    image: rustdesk/rustdesk-server:latest
    command: hbbs
    volumes:
      - ./data:/root
    network_mode: host
    depends_on:
      - hbbr
    restart: unless-stopped

  hbbr:
    container_name: hbbr
    image: rustdesk/rustdesk-server:latest
    command: hbbr
    volumes:
      - ./data:/root
    network_mode: host
    restart: unless-stopped
EOF

# Start services
docker-compose up -d

# Get your public key (needed for clients)
cat /opt/rustdesk-server/data/id_ed25519.pub
```

### Option 2: Binary Installation

```bash
# Download latest release
wget https://github.com/rustdesk/rustdesk-server/releases/download/1.1.10-3/rustdesk-server-linux-amd64.zip
unzip rustdesk-server-linux-amd64.zip

# Create systemd services
sudo cat > /etc/systemd/system/rustdesk-hbbs.service << 'EOF'
[Unit]
Description=RustDesk ID/Rendezvous Server
After=network.target

[Service]
Type=simple
ExecStart=/opt/rustdesk/hbbs
WorkingDirectory=/opt/rustdesk
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo cat > /etc/systemd/system/rustdesk-hbbr.service << 'EOF'
[Unit]
Description=RustDesk Relay Server
After=network.target

[Service]
Type=simple
ExecStart=/opt/rustdesk/hbbr
WorkingDirectory=/opt/rustdesk
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable --now rustdesk-hbbs rustdesk-hbbr
```

### Option 3: RustDesk Pro (Commercial License)

For enterprise features:
- Web console for server management
- User management and access control
- Connection logs and audit trails
- LDAP/AD integration
- API access

Visit: https://rustdesk.com/pricing.html

## Client Configuration

### Vanguard Agent Auto-Configuration

The Vanguard agent automatically detects RustDesk and reports the ID. To pre-configure RustDesk on endpoints:

#### PowerShell Silent Install with Custom Server

```powershell
# Variables
$RelayServer = "yourrelay.yourdomain.com"
$PublicKey = "YOUR_PUBLIC_KEY_FROM_id_ed25519.pub"

# Download RustDesk
$installerUrl = "https://github.com/rustdesk/rustdesk/releases/download/1.2.6/rustdesk-1.2.6-x86_64.exe"
$installerPath = "$env:TEMP\rustdesk-installer.exe"
Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath

# Silent install
Start-Process -FilePath $installerPath -ArgumentList "--silent-install" -Wait

# Configure custom server
$configPath = "$env:APPDATA\RustDesk\config\RustDesk.toml"
New-Item -Path (Split-Path $configPath) -ItemType Directory -Force

@"
rendezvous_server = '$RelayServer'
nat_type = 1
serial = 0

[options]
custom-rendezvous-server = '$RelayServer'
relay-server = '$RelayServer'
key = '$PublicKey'
"@ | Out-File -FilePath $configPath -Encoding UTF8

# Restart RustDesk service
Restart-Service RustDesk -ErrorAction SilentlyContinue
```

### Mass Deployment via Group Policy

1. Create MSI transform with your server settings
2. Deploy via GPO Software Installation
3. Or use Vanguard's script deployment feature

## Integration with Vanguard

### How It Works

1. **Agent Detection**: Vanguard agent auto-detects RustDesk ID on registration
2. **Dashboard Display**: IDs appear in device details → Remote Access tab
3. **One-Click Connect**: Click "Connect" to launch RustDesk with device ID
4. **Session Logging**: All remote sessions are logged in `remote_sessions` table

### API for Custom Integrations

```typescript
// Example: Get RustDesk ID for a device
const { data: agent } = await supabase
  .from('vanguard_agents')
  .select('rustdesk_id, hostname')
  .eq('id', deviceId)
  .single();

// Launch RustDesk connection
window.open(`rustdesk://${agent.rustdesk_id}`);
```

## Security Best Practices

### 1. Enable Encryption
RustDesk uses end-to-end encryption by default. Verify by checking the key exchange.

### 2. Restrict Access
```bash
# On your relay server, configure allowed IPs if needed
iptables -A INPUT -p tcp --dport 21117 -s YOUR_OFFICE_IP -j ACCEPT
iptables -A INPUT -p tcp --dport 21117 -j DROP
```

### 3. Set Permanent Passwords (Optional)
For unattended access, set a permanent password on endpoints:
```powershell
# Set permanent password via config
$password = "SecurePassword123!"
# RustDesk hashes passwords, configure via UI or rustdesk --password
```

### 4. Use Pro License for Audit Logs
RustDesk Pro provides connection logs, user management, and compliance features.

## Comparison: RustDesk vs Alternatives

| Feature | RustDesk (Self-Host) | TeamViewer | ConnectWise ScreenConnect | AnyDesk |
|---------|---------------------|------------|---------------------------|---------|
| **Self-Hosted** | ✅ Full | ❌ No | ✅ Yes | ❌ No |
| **Open Source** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Cost (100 devices)** | ~$20/mo server | $500+/mo | $300+/mo | $300+/mo |
| **File Transfer** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Unattended Access** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Mobile Apps** | ✅ iOS/Android | ✅ iOS/Android | ✅ iOS/Android | ✅ iOS/Android |
| **Multi-Monitor** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Session Recording** | ⚠️ Pro only | ✅ Yes | ✅ Yes | ⚠️ Extra |
| **LDAP/AD Integration** | ⚠️ Pro only | ✅ Enterprise | ✅ Yes | ⚠️ Extra |

## Recommended Path

### For Evaluation (Free)
1. Deploy self-hosted RustDesk using Docker
2. Use with Vanguard agent's auto-detection
3. Test on 10-20 endpoints

### For Production (RustDesk Pro)
1. Purchase RustDesk Pro license (~$99-299/year depending on features)
2. Get access to:
   - Web console
   - User management
   - Connection logs
   - API access
   - Priority support

### Why RustDesk Pro Over Free?

| You Need | Free | Pro |
|----------|------|-----|
| Basic remote access | ✅ | ✅ |
| Self-hosted relay | ✅ | ✅ |
| Web-based management console | ❌ | ✅ |
| User/group permissions | ❌ | ✅ |
| Connection audit logs | ❌ | ✅ |
| Address book sync | ❌ | ✅ |
| API access | ❌ | ✅ |
| LDAP/SSO integration | ❌ | ✅ |

## Troubleshooting

### Connection Times Out
```bash
# Check if ports are open
nc -zv your-server.com 21116
nc -zv your-server.com 21117

# Check server logs
docker logs hbbs
docker logs hbbr
```

### Client Can't Connect
1. Verify public key matches on client and server
2. Check firewall rules
3. Ensure rendezvous server is reachable

### NAT Issues
RustDesk handles most NAT scenarios. If direct connection fails:
- Relay server kicks in automatically
- Check that port 21117 is accessible

## Support Resources

- RustDesk Documentation: https://rustdesk.com/docs/
- GitHub Issues: https://github.com/rustdesk/rustdesk/issues
- Discord Community: https://discord.gg/nDceKgxnkV
