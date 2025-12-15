#!/bin/bash
# =============================================================================
# Ultrium Vanguard Agent Installation Script
# =============================================================================
# This script installs the Vanguard agent on Ubuntu/Debian systems.
#
# Usage:
#   sudo ./vanguard_install.sh
#
# Requirements:
#   - Ubuntu 20.04+ or Debian 11+
#   - Root/sudo access
#   - Python 3.8+
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "=============================================="
echo "   Ultrium Vanguard Agent Installer"
echo "=============================================="
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Error: Please run as root (sudo ./vanguard_install.sh)${NC}"
    exit 1
fi

# Configuration
INSTALL_DIR="/opt/vanguard"
VENV_DIR="$INSTALL_DIR/.venv"
SERVICE_NAME="vanguard-agent"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${YELLOW}Step 1: Installing system dependencies...${NC}"
apt-get update -qq
apt-get install -y -qq python3 python3-pip python3-venv curl

echo -e "${YELLOW}Step 2: Creating installation directory...${NC}"
mkdir -p "$INSTALL_DIR"
mkdir -p /var/log

echo -e "${YELLOW}Step 3: Creating Python virtual environment...${NC}"
python3 -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"

echo -e "${YELLOW}Step 4: Installing Python dependencies...${NC}"
pip install --quiet --upgrade pip
pip install --quiet aiohttp psutil pyyaml

echo -e "${YELLOW}Step 5: Copying agent files...${NC}"
cp "$SCRIPT_DIR/vanguard_agent.py" "$INSTALL_DIR/"
chmod +x "$INSTALL_DIR/vanguard_agent.py"

# Copy or create config
if [ -f "$SCRIPT_DIR/config.yaml" ]; then
    cp "$SCRIPT_DIR/config.yaml" "$INSTALL_DIR/"
    echo -e "${GREEN}  → Copied existing config.yaml${NC}"
elif [ -f "$SCRIPT_DIR/vanguard_config.yaml" ]; then
    cp "$SCRIPT_DIR/vanguard_config.yaml" "$INSTALL_DIR/config.yaml"
    echo -e "${YELLOW}  → Copied template config - please edit /opt/vanguard/config.yaml${NC}"
else
    echo -e "${RED}  → No config file found - please create /opt/vanguard/config.yaml${NC}"
fi

echo -e "${YELLOW}Step 6: Installing systemd service...${NC}"
cat > /etc/systemd/system/${SERVICE_NAME}.service << 'EOF'
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
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/log /opt/vanguard
PrivateTmp=yes
StandardOutput=journal
StandardError=journal
SyslogIdentifier=vanguard-agent

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload

echo -e "${GREEN}"
echo "=============================================="
echo "   Installation Complete!"
echo "=============================================="
echo -e "${NC}"
echo ""
echo "Next steps:"
echo ""
echo "  1. Edit the configuration file:"
echo "     ${YELLOW}sudo nano /opt/vanguard/config.yaml${NC}"
echo ""
echo "  2. Update these required values:"
echo "     - agent.user_id: Your Vanguard user UUID"
echo "     - api.secret_key: Your X-VANGUARD-KEY"
echo ""
echo "  3. Test the connection:"
echo "     ${YELLOW}sudo /opt/vanguard/.venv/bin/python /opt/vanguard/vanguard_agent.py --test${NC}"
echo ""
echo "  4. Start the service:"
echo "     ${YELLOW}sudo systemctl enable --now ${SERVICE_NAME}${NC}"
echo ""
echo "  5. Check status:"
echo "     ${YELLOW}sudo systemctl status ${SERVICE_NAME}${NC}"
echo "     ${YELLOW}sudo journalctl -u ${SERVICE_NAME} -f${NC}"
echo ""
echo -e "${GREEN}Done!${NC}"
