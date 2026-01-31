# RustDesk Self-Hosted Setup Guide

Complete guide for deploying a self-hosted RustDesk infrastructure for Vanguard RMM with **dual-relay failover** for high availability.

## Why Self-Host RustDesk?

| Feature | Public Relay | Self-Hosted |
|---------|-------------|-------------|
| **Privacy** | Traffic routes through public servers | All traffic stays on your infrastructure |
| **Performance** | Variable latency | Optimized for your network topology |
| **Control** | Limited | Full control over access, logs, users |
| **Branding** | RustDesk branding | Custom branded clients possible |
| **Compliance** | May not meet requirements | HIPAA/SOC2/GDPR compliant deployments |
| **Cost** | Free tier limited | One-time server cost, unlimited connections |
| **Uptime** | Dependent on RustDesk | **Dual-relay failover for 99.99% uptime** |

## Architecture Overview (Dual-Relay)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       High Availability Architecture                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌───────────────────────────┐      ┌───────────────────────────┐           │
│  │   PRIMARY RELAY (US-East) │      │  SECONDARY RELAY (US-West) │           │
│  │   relay1.yourdomain.com   │      │  relay2.yourdomain.com     │           │
│  ├───────────────────────────┤      ├────────────────────────────┤           │
│  │  hbbs (ID/Rendezvous)     │      │  hbbs (ID/Rendezvous)      │           │
│  │  Port: 21115-21116        │      │  Port: 21115-21116         │           │
│  ├───────────────────────────┤      ├────────────────────────────┤           │
│  │  hbbr (Relay)             │      │  hbbr (Relay)              │           │
│  │  Port: 21117              │      │  Port: 21117               │           │
│  └────────────┬──────────────┘      └─────────────┬──────────────┘           │
│               │                                    │                          │
│               └────────────┬───────────────────────┘                          │
│                            │                                                  │
│                   ┌────────▼────────┐                                         │
│                   │  Vanguard API   │                                         │
│                   │  (Supabase)     │                                         │
│                   │  Serves config  │                                         │
│                   └────────┬────────┘                                         │
│                            │                                                  │
└────────────────────────────┼──────────────────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐        ┌────▼────┐        ┌────▼────┐
    │ Endpoint │        │ Endpoint │        │ Endpoint │
    │ (Auto-   │        │ (Auto-   │        │ (Auto-   │
    │ failover)│        │ failover)│        │ failover)│
    └──────────┘        └──────────┘        └──────────┘
```

## Server Requirements

### Per Relay Server (Minimum)
- 1 vCPU
- 1GB RAM
- 10GB SSD
- Ubuntu 22.04 LTS or Debian 12

### Recommended Providers

| Provider | Price | SLA | Best For |
|----------|-------|-----|----------|
| **Hetzner** | $4.50/mo | 99.9% | Best value |
| **DigitalOcean** | $6/mo | 99.99% | Easiest setup |
| **Vultr** | $6/mo | 100% | Good global coverage |
| **Linode** | $5/mo | 99.99% | Reliable |

**For dual-relay:** ~$10-12/mo total for both servers.

## Quick Start: Dual-Relay Setup

### Step 1: Deploy Primary Relay (US-East)

SSH into your first VPS and run:

```bash
#!/bin/bash
# Vanguard RustDesk Primary Relay Setup

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
docker compose up -d

# Wait for key generation
sleep 5

# Display public key
echo ""
echo "=========================================="
echo "PRIMARY RELAY SETUP COMPLETE"
echo "=========================================="
echo ""
echo "Server Address: $(curl -s ifconfig.me)"
echo ""
echo "Public Key (save this!):"
cat /opt/rustdesk-server/data/id_ed25519.pub
echo ""
echo "=========================================="
```

### Step 2: Deploy Secondary Relay (US-West)

SSH into your second VPS and run the **same script**. Save both public keys.

> **Note:** If both servers use the same key pair, copy `/opt/rustdesk-server/data/id_ed25519` and `id_ed25519.pub` from primary to secondary before starting Docker.

### Step 3: Configure Supabase Secrets

Add these secrets to your Supabase project at [Edge Functions Secrets](https://supabase.com/dashboard/project/nsyobmjpdpvesjwdphlh/settings/functions):

| Secret Name | Value | Example |
|-------------|-------|---------|
| `RUSTDESK_RELAY_SERVER` | Primary server hostname/IP | `relay1.yourdomain.com` |
| `RUSTDESK_PUBLIC_KEY` | Primary server public key | `abc123...` |
| `RUSTDESK_RELAY_REGION` | Primary region label | `US-East` |
| `RUSTDESK_RELAY_SERVER_2` | Secondary server hostname/IP | `relay2.yourdomain.com` |
| `RUSTDESK_PUBLIC_KEY_2` | Secondary public key (or same as primary) | `abc123...` |
| `RUSTDESK_RELAY_REGION_2` | Secondary region label | `US-West` |

### Step 4: Verify Configuration

Test the relay config endpoint:

```bash
curl https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/vanguard-relay-config
```

Expected response:
```json
{
  "relay_server": "relay1.yourdomain.com",
  "public_key": "abc123...",
  "relay_servers": [
    {"server": "relay1.yourdomain.com", "priority": 1, "region": "US-East"},
    {"server": "relay2.yourdomain.com", "priority": 2, "region": "US-West"}
  ],
  "failover_enabled": true,
  "auto_install": true,
  "rustdesk_version": "1.2.6"
}
```

### Step 5: Test Endpoint

1. Enroll a new device with the Vanguard agent
2. Agent auto-installs RustDesk and configures dual-relay
3. Check device details → Remote Access tab
4. Click "Connect" for one-click remote access

## Firewall Configuration

Open these ports on **both** relay servers:

| Port | Protocol | Service | Required |
|------|----------|---------|----------|
| 21115 | TCP | NAT type test | Yes |
| 21116 | TCP/UDP | ID registration + Heartbeat | Yes |
| 21117 | TCP | Relay traffic | Yes |
| 21118 | TCP | WebSocket (web client) | Optional |
| 21119 | TCP | WebSocket relay | Optional |

### UFW Example

```bash
sudo ufw allow 21115:21119/tcp
sudo ufw allow 21116/udp
sudo ufw reload
```

## How Failover Works

1. **Agent Configuration**: Vanguard agent configures RustDesk with both servers as comma-separated list
2. **Connection Attempt**: RustDesk tries primary server first
3. **Automatic Failover**: If primary is unreachable, client automatically tries secondary
4. **Transparent to Users**: Technicians see single "Connect" button — failover is invisible

### Failover Scenarios

| Scenario | Behavior |
|----------|----------|
| Primary healthy | All connections use primary |
| Primary down | New connections use secondary (~2s delay) |
| Primary recovers | New connections return to primary |
| Both down | Connection fails (rare with proper hosting) |

## Monitoring

### UptimeRobot (Free)

Set up monitors for both relays:

1. Go to [UptimeRobot](https://uptimerobot.com)
2. Add TCP monitor for `relay1.yourdomain.com:21116`
3. Add TCP monitor for `relay2.yourdomain.com:21116`
4. Configure email/SMS alerts

### Docker Health Checks

```bash
# Check primary
docker exec hbbs echo "healthy" || echo "unhealthy"
docker exec hbbr echo "healthy" || echo "unhealthy"
```

### Log Monitoring

```bash
# View logs
docker logs -f hbbs
docker logs -f hbbr
```

## Scaling Beyond Dual-Relay

For 1000+ endpoints or global presence:

### Geographic Distribution

| Region | Server | Latency Target |
|--------|--------|----------------|
| US-East | relay-use.yourdomain.com | <30ms for East Coast |
| US-West | relay-usw.yourdomain.com | <30ms for West Coast |
| EU | relay-eu.yourdomain.com | <30ms for Europe |

### Load Balancing (Optional)

For even higher availability, use a load balancer:

```bash
# Example: HAProxy in front of multiple relays
# This provides automatic health checking and failover
```

## RustDesk Pro Integration

If you purchase RustDesk Pro ($19.90/mo for 100 devices):

### Additional Features
- Web console for all devices
- User/group management
- Connection audit logs
- Address book sync
- SSO/LDAP integration

### Pro Setup

1. Purchase license at [rustdesk.com/pricing](https://rustdesk.com/pricing)
2. Add `RUSTDESK_API_SERVER` secret with your Pro API endpoint
3. Access web console at your Pro server URL

## Troubleshooting

### Connection Timeout

```bash
# Test port connectivity
nc -zv relay1.yourdomain.com 21116
nc -zv relay1.yourdomain.com 21117

# Check if Docker is running
docker ps | grep -E "hbbs|hbbr"
```

### Agent Not Connecting

1. Check agent logs: `%ProgramData%\VanguardAgent\Logs\`
2. Verify RustDesk config: `%APPDATA%\RustDesk\config\RustDesk.toml`
3. Ensure both relay servers are listed in `custom-rendezvous-server`

### Keys Not Matching

If agents can't authenticate:

```bash
# On relay server
cat /opt/rustdesk-server/data/id_ed25519.pub

# Compare with Supabase secret RUSTDESK_PUBLIC_KEY
```

## Cost Summary

### Dual-Relay Setup (Recommended)

| Item | Monthly Cost |
|------|--------------|
| Hetzner VPS (Primary) | $4.50 |
| Hetzner VPS (Secondary) | $4.50 |
| RustDesk Pro (100 devices) | $19.90 |
| **Total** | **$28.90/mo** |

### Scaling Costs

| Devices | RustDesk Pro | VPS (2x) | Total |
|---------|--------------|----------|-------|
| 100 | $19.90 | $9 | $29/mo |
| 500 | $60 | $12 | $72/mo |
| 1000 | $120 | $20 | $140/mo |

Compare to alternatives:
- TeamViewer (10 techs): ~$500/mo
- ConnectWise Control: ~$300/mo
- AnyDesk: ~$300/mo

## Next Steps

1. ✅ Deploy dual-relay servers
2. ✅ Configure Supabase secrets
3. ✅ Test with one endpoint
4. ⬜ Set up monitoring
5. ⬜ Roll out to all endpoints
6. ⬜ Consider RustDesk Pro for audit logs
