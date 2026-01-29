# Vanguard Agent for macOS

Native Swift macOS agent for the Ultrium Vanguard RMM platform.

## Features

- **System Telemetry**: CPU, RAM, disk, network monitoring
- **Process Monitoring**: Track top resource-consuming processes
- **Remote Commands**: Shell, AppleScript, Homebrew package management
- **Background Service**: Runs silently with menu bar status icon
- **Auto-Registration**: Self-registers with Vanguard platform

## Requirements

- macOS 13.0+ (Ventura or later)
- Xcode 15.0+ for development
- Apple Developer account for code signing

## Building

### Development

```bash
cd VanguardAgentMac
open VanguardAgent.xcodeproj
```

Build and run from Xcode.

### Release Build

```bash
xcodebuild -project VanguardAgent.xcodeproj \
  -scheme VanguardAgent \
  -configuration Release \
  -archivePath build/VanguardAgent.xcarchive \
  archive

xcodebuild -exportArchive \
  -archivePath build/VanguardAgent.xcarchive \
  -exportPath build/Release \
  -exportOptionsPlist ExportOptions.plist
```

## Installation

### Manual

1. Download VanguardAgent.app from releases
2. Move to /Applications
3. Open and configure in Settings
4. Grant permissions when prompted

### MDM/Jamf Deployment

Create a configuration profile with:

```xml
<key>apiEndpoint</key>
<string>https://your-api-endpoint</string>
<key>userId</key>
<string>YOUR-USER-UUID</string>
<key>secretKey</key>
<string>vgd_sk_xxx</string>
```

### Command Line Registration

```bash
defaults write com.ultrium.VanguardAgent userId "YOUR-UUID"
defaults write com.ultrium.VanguardAgent secretKey "vgd_sk_xxx"
open -a VanguardAgent
```

## Supported Commands

| Command Type | Description |
|--------------|-------------|
| `shell` | Execute shell command (zsh) |
| `applescript` | Execute AppleScript |
| `get_system_info` | Get detailed system information |
| `list_apps` | List installed applications |
| `restart` | Schedule system restart |
| `install_brew_package` | Install Homebrew package |
| `get_logs` | Retrieve system logs |

## Permissions Required

The agent requires these permissions (granted on first launch or via MDM):

- **Full Disk Access**: For reading system files and logs
- **Accessibility**: For AppleScript automation
- **Network**: For API communication

## Configuration

Settings are stored in UserDefaults:

- `apiEndpoint`: API server URL
- `userId`: Vanguard user UUID
- `secretKey`: Agent authentication key
- `deviceName`: Display name for this device

## Security

- All API communication uses HTTPS
- Secret key stored in UserDefaults (consider Keychain for production)
- Code signing required for distribution
- Notarization recommended for Gatekeeper

## Logs

View agent logs:

```bash
log show --predicate 'subsystem == "com.ultrium.VanguardAgent"' --last 1h
```

## Support

- Dashboard: https://ultriumai.com/vanguard
- Docs: https://docs.ultriumai.com/vanguard
- Email: support@ultriumai.com
