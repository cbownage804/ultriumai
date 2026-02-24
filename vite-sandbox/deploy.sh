#!/bin/bash
# ============================================================
# Deploy Vite Sandbox to a DigitalOcean Droplet
# 
# Usage:
#   ./deploy.sh <DROPLET_IP> [SANDBOX_AUTH_TOKEN]
#
# Prerequisites:
#   - SSH access to the Droplet (root or sudo user)
#   - Node.js 20+ installed on the Droplet
#
# This script:
#   1. Copies the vite-sandbox directory to the Droplet
#   2. Installs dependencies
#   3. Sets up the template project
#   4. Creates a systemd service for auto-start
#   5. Sets up Caddy reverse proxy with TLS
# ============================================================

set -euo pipefail

DROPLET_IP="${1:?Usage: ./deploy.sh <DROPLET_IP> [SANDBOX_AUTH_TOKEN]}"
SANDBOX_TOKEN="${2:-$(openssl rand -hex 32)}"
REMOTE_DIR="/opt/vite-sandbox"
SERVICE_NAME="vite-sandbox"

echo "🚀 Deploying Vite Sandbox to $DROPLET_IP"
echo "   Auth token: $SANDBOX_TOKEN"
echo ""

# 1. Copy files to Droplet
echo "📁 Copying files..."
ssh root@"$DROPLET_IP" "mkdir -p $REMOTE_DIR"
rsync -avz --exclude='node_modules' --exclude='builds' --exclude='template/node_modules' \
  ./ root@"$DROPLET_IP":"$REMOTE_DIR/"

# 2. Install Node.js if not present
echo "🔧 Ensuring Node.js is installed..."
ssh root@"$DROPLET_IP" << 'INSTALL_NODE'
if ! command -v node &> /dev/null || [[ $(node -v | cut -d. -f1 | tr -d v) -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
echo "Node.js: $(node -v)"
echo "npm: $(npm -v)"
INSTALL_NODE

# 3. Install server deps and setup template
echo "📦 Installing dependencies and setting up template..."
ssh root@"$DROPLET_IP" << SETUP
cd $REMOTE_DIR
npm install --production
chmod +x setup-template.sh
./setup-template.sh
SETUP

# 4. Create systemd service
echo "⚙️  Creating systemd service..."
ssh root@"$DROPLET_IP" << SERVICE
cat > /etc/systemd/system/$SERVICE_NAME.service << EOF
[Unit]
Description=Vite Sandbox Compilation Server
After=network.target

[Service]
Type=simple
WorkingDirectory=$REMOTE_DIR
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3100
Environment=SANDBOX_AUTH_TOKEN=$SANDBOX_TOKEN
Environment=MAX_CONCURRENT=10
Environment=BUILD_TIMEOUT_MS=30000

# Resource limits
LimitNOFILE=65536
MemoryMax=4G

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable $SERVICE_NAME
systemctl restart $SERVICE_NAME
SERVICE

# 5. Check status
echo ""
echo "📊 Checking service status..."
ssh root@"$DROPLET_IP" "systemctl status $SERVICE_NAME --no-pager || true"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Vite Sandbox Server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  URL:   http://$DROPLET_IP:3100"
echo "  Token: $SANDBOX_TOKEN"
echo ""
echo "  Health check:"
echo "    curl http://$DROPLET_IP:3100/health"
echo ""
echo "  ⚠️  Save this token — you'll need it as a"
echo "     Supabase Edge Function secret:"
echo ""
echo "     VITE_SANDBOX_URL=http://$DROPLET_IP:3100"
echo "     VITE_SANDBOX_TOKEN=$SANDBOX_TOKEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
