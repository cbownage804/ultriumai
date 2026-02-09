# Vanguard Agent

Combined RMM Agent + Customer Portal for Windows systems.

## Features

- **RMM Monitoring**: System telemetry, command execution, health tracking
- **Tray Icon**: Always-visible "Vanguard" shield icon in system tray
- **Customer Portal**: WebView2-based self-service portal popup
- **Quick Actions**: New tickets, view tickets, system health checks
- **SafeSuite Integration**: Access to SafePass, SafeScan, SafeWeb, SafeTrack

## Deployment Modes

### 1. Tray Application (Recommended)
Runs with tray icon + portal popup. Best for end-user workstations.

```bash
VanguardAgent.exe
```

### 2. Windows Service (Headless)
Runs as background service without tray icon. For servers.

```bash
VanguardAgent.exe --install
net start VanguardAgent
```

## Registration

```bash
VanguardAgent.exe --register ^
  --user-id YOUR_USER_ID ^
  --secret-key YOUR_SECRET_KEY ^
  --portal-key YOUR_PORTAL_KEY ^
  --portal-name "Your Company Support"
```

Get your credentials from: https://ultriumai.app/vanguard/settings

## Configuration

`config.json` controls both RMM and Portal:

```json
{
  "user_id": "uuid",
  "secret_key": "vgd_sk_xxx",
  "api_endpoint": "https://...",
  "heartbeat_interval": 60,
  "command_poll_interval": 30,
  "telemetry_interval": 300,
  "portal_key": "pk_xxx",
  "portal_name": "Vanguard",
  "portal_url": "https://ultriumai.app/customer-portal",
  "show_portal": true,
  "features": {
    "collect_processes": true,
    "collect_services": true,
    "collect_network": true,
    "collect_installed_software": true,
    "execute_commands": true
  }
}
```

## Command Line Options

| Flag | Description |
|------|-------------|
| `--register` | Register agent with Vanguard platform |
| `--install` | Install as Windows Service |
| `--uninstall` | Remove Windows Service |
| `--service` | Force service mode (no tray) |
| `--user-id` | Your Vanguard user UUID |
| `--secret-key` | Your agent secret key |
| `--portal-key` | Customer portal key |
| `--portal-name` | Custom portal name |
| `--device-name` | Custom device name |

## Supported Remote Commands

| Command Type | Description |
|--------------|-------------|
| `shell` | Execute CMD command |
| `powershell` | Execute PowerShell script |
| `service_start` | Start a Windows service |
| `service_stop` | Stop a Windows service |
| `service_restart` | Restart a Windows service |
| `process_kill` | Kill a process by ID or name |
| `file_download` | Download a file from URL |
| `reboot` | Schedule system reboot |

## Building

```powershell
cd VanguardAgent
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true

# Output: bin/Release/net8.0-windows/win-x64/publish/VanguardAgent.exe
```

## Custom Icon

Place `vanguard.ico` alongside the executable for custom tray/taskbar icon.

## Requirements

- Windows 10/11 or Windows Server 2019+
- .NET 8.0 Runtime (bundled in self-contained build)
- WebView2 Runtime (for portal popup)

## Uninstall

```bash
VanguardAgent.exe --uninstall
```

## Support

- Dashboard: https://ultriumai.app/vanguard
- Email: support@ultriumai.com
