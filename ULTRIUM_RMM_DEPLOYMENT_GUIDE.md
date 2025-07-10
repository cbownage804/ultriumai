# Ultrium RMM Agent Deployment Guide

## Overview

The Ultrium RMM Agent supports two deployment scenarios:
1. **Direct Business Deployment** - Agent registers directly under your business account
2. **MSP Client Deployment** - Agent registers under your MSP account but assigned to specific clients

## Dashboard Access

**Ultrium Dashboard URL:** `https://51e5cd04-5f19-440a-a7ba-de30fc766877.lovableproject.com/`

---

## 1. Direct Business Deployment

Use this for your own business computers or when selling directly to end customers.

### Configuration
```python
# In ultrium_agent.py
DEPLOYMENT_TYPE = "direct"
MSP_CLIENT_ID = None
```

### What This Does
- Device registers directly under your business account
- Appears in your main RMM dashboard
- Full control and management capabilities
- Perfect for internal IT infrastructure

---

## 2. MSP Client Deployment

Use this when deploying to client businesses under your MSP services.

### Prerequisites
1. Create the client in your Ultrium MSP portal first
2. Note the Client ID from the MSP dashboard

### Configuration
```python
# In ultrium_agent.py
DEPLOYMENT_TYPE = "msp_client"
MSP_CLIENT_ID = "client-uuid-here"  # Replace with actual client ID
```

### What This Does
- Device registers under your MSP account
- Automatically assigned to the specified client
- Appears in client-specific views
- Maintains MSP organizational structure
- Enables client-specific reporting and billing

---

## Deployment Process

### Step 1: Configure Agent
1. Open `ultrium_agent.py` in a text editor
2. Set `DEPLOYMENT_TYPE` and `MSP_CLIENT_ID` as appropriate
3. Verify the API key is set correctly

### Step 2: Create Installer Package
Using **PyInstaller** (Recommended for EXE):
```bash
pip install pyinstaller
pyinstaller --onefile --noconsole --add-data "ultrium_agent.py;." ultrium_agent.py
```

Using **cx_Freeze** (For MSI installer):
```python
# setup.py
from cx_Freeze import setup, Executable

setup(
    name="UltriumRMMAgent",
    version="1.0",
    description="Ultrium RMM Agent",
    executables=[Executable("ultrium_agent.py", base="Win32Service")]
)
```

### Step 3: System Tray Integration
The agent includes system tray functionality with:
- Connection status indicator
- Quick access to Ultrium dashboard
- Agent controls (start/stop/restart)
- Right-click context menu

### Step 4: Deploy to Target Systems
1. Run installer on target machine
2. Agent automatically configures as Windows service
3. System tray icon appears for logged-in users
4. Device registers in appropriate dashboard section

---

## Verification

### Check Registration
1. Log into Ultrium Dashboard
2. Navigate to RMM → Devices
3. Verify device appears in correct section:
   - **Direct**: Under main device list
   - **MSP Client**: Under specific client folder

### System Tray Features
- **Green Icon**: Connected and online
- **Red Icon**: Disconnected or offline
- **Right-click → Dashboard**: Opens Ultrium web portal
- **Right-click → Status**: Shows connection details

---

## Troubleshooting

### Device Not Appearing
1. Check API key configuration
2. Verify network connectivity
3. Check Windows Firewall settings
4. Review agent logs in `logs/` folder

### Wrong Client Assignment (MSP)
1. Verify `MSP_CLIENT_ID` matches dashboard
2. Check client exists in MSP portal
3. Restart agent service after config changes

### System Tray Not Showing
1. Check if user is logged in
2. Verify Windows notifications are enabled
3. Check system tray settings in Windows

---

## Client Management (For MSPs)

### Adding New Clients
1. Go to MSP → Clients in dashboard
2. Click "Add New Client"
3. Fill in client details
4. Note the generated Client ID
5. Use this ID in agent deployments

### Client-Specific Views
- Each client has dedicated device dashboard
- Separate alerting and reporting
- Individual billing and usage tracking
- Client-specific maintenance windows

### Bulk Deployment
For large MSP deployments:
1. Create master agent configuration
2. Use deployment script to set `MSP_CLIENT_ID`
3. Package with automated installer
4. Deploy via Group Policy or management tools

---

## Security Notes

- API keys are stored securely in agent configuration
- All communications use HTTPS encryption
- Agent runs with minimal system privileges
- Regular security updates via automatic agent updates

---

## Support

For technical support or deployment assistance:
- Check agent logs first: `logs/ultrium_agent_YYYYMMDD.log`
- Contact Ultrium Support through dashboard
- Join MSP Community Discord for peer support

---

## Quick Reference

| Deployment Type | Use Case | Client ID Required | Dashboard View |
|----------------|----------|-------------------|----------------|
| `direct` | Your business | No | Main device list |
| `msp_client` | Client business | Yes | Client-specific |

**Dashboard URL:** `https://51e5cd04-5f19-440a-a7ba-de30fc766877.lovableproject.com/`
**API Key:** `ultrium_rmm_7K9mP3xQ8vN2wR5tY6uI1oE4aS9dF7gH2jK5lM8nB3vC6xZ`