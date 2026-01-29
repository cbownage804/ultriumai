# Ultrium Vanguard Agent for Windows

Enterprise RMM agent for Windows systems. Runs as a Windows Service and provides real-time monitoring, telemetry collection, and remote command execution.

## Features

- **System Telemetry**: CPU, RAM, disk usage monitoring
- **Process Monitoring**: Track running processes and resource usage
- **Service Monitoring**: Monitor Windows services status
- **Network Discovery**: Enumerate network adapters and connections
- **Software Inventory**: Track installed applications
- **Remote Commands**: Execute shell, PowerShell, service control, and more
- **Automatic Registration**: Self-registers with Vanguard platform

## Quick Start

### 1. Register the Agent

```bash
VanguardAgent.exe --register --user-id YOUR_USER_ID --secret-key YOUR_SECRET_KEY
```

Get your credentials from: https://ultriumai.com/vanguard/settings

### 2. Install as Windows Service

```bash
VanguardAgent.exe --install
```

### 3. Start the Service

```bash
net start VanguardAgent
```

## Command Line Options

| Flag | Description |
|------|-------------|
| `--register` | Register agent with Vanguard platform |
| `--install` | Install as Windows Service |
| `--uninstall` | Remove Windows Service |
| `--user-id` | Your Vanguard user UUID |
| `--secret-key` | Your agent secret key (vgd_sk_...) |
| `--device-name` | Custom device name (optional) |

## Configuration

Configuration is stored in `config.json` next to the executable:

```json
{
  "user_id": "your-uuid",
  "secret_key": "vgd_sk_...",
  "device_name": "WORKSTATION-01",
  "api_endpoint": "https://...",
  "heartbeat_interval": 60,
  "command_poll_interval": 30,
  "telemetry_interval": 300,
  "features": {
    "collect_processes": true,
    "collect_services": true,
    "collect_network": true,
    "collect_installed_software": true,
    "execute_commands": true
  }
}
```

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

## Building from Source

### Requirements

- .NET 8.0 SDK
- Windows 10/11 or Windows Server 2019+

### Build

```bash
cd VanguardAgent
dotnet build --configuration Release
```

### Publish Single-File EXE

```bash
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true
```

Output: `bin/Release/net8.0-windows/win-x64/publish/VanguardAgent.exe`

## Logs

When running as a service, logs are written to Windows Event Log under "VanguardAgent".

View logs:
```powershell
Get-EventLog -LogName Application -Source VanguardAgent -Newest 50
```

Or use:
```bash
sc query VanguardAgent
```

## Security

- Agent runs with SYSTEM privileges when installed as service
- All API communication uses HTTPS
- Secret key is stored locally in config.json (protect this file!)
- Command execution can be disabled in configuration

## Troubleshooting

### Agent won't start

1. Check config.json has valid user_id and secret_key
2. Verify network connectivity to API endpoint
3. Check Windows Event Log for errors

### Commands not executing

1. Verify `execute_commands` is true in config
2. Check the service has appropriate permissions
3. Review command output in Vanguard dashboard

## Uninstall

```bash
VanguardAgent.exe --uninstall
del "C:\Program Files\Vanguard\*" /Q
```

## Support

- Dashboard: https://ultriumai.com/vanguard
- Documentation: https://docs.ultriumai.com/vanguard
- Email: support@ultriumai.com
