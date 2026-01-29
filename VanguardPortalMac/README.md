# Vanguard Customer Portal for macOS

Native Swift menu bar application for end-user IT support access.

## Features

- **Menu Bar Integration**: Always-accessible support portal
- **Quick Actions**: One-click access to common support tasks
- **Ticket Submission**: Create support tickets directly from the app
- **System Info**: View device information for technician reference
- **White-Label Ready**: Customizable branding (name, colors, logo)

## Requirements

- macOS 13.0+ (Ventura or later)
- Xcode 15.0+ for development

## Building

### Development

```bash
cd VanguardPortalMac
open VanguardPortal.xcodeproj
```

### Release Build

```bash
xcodebuild -project VanguardPortal.xcodeproj \
  -scheme VanguardPortal \
  -configuration Release \
  archive -archivePath build/VanguardPortal.xcarchive

xcodebuild -exportArchive \
  -archivePath build/VanguardPortal.xcarchive \
  -exportPath build/Release \
  -exportOptionsPlist ExportOptions.plist
```

## Configuration

### Bundle Configuration

Include a `config.json` in the app bundle:

```json
{
  "portalKey": "your-portal-key",
  "portalUrl": "https://your-msp-portal.com",
  "companyName": "Your MSP Name",
  "brandColor": "#3B82F6"
}
```

### User Defaults (MDM/Script)

```bash
defaults write com.ultrium.VanguardPortal portalKey "your-key"
defaults write com.ultrium.VanguardPortal portalUrl "https://portal.yourmsp.com"
defaults write com.ultrium.VanguardPortal companyName "Your Company"
defaults write com.ultrium.VanguardPortal brandColor "#3B82F6"
```

## MDM Deployment

### Jamf Pro

1. Package the signed .app
2. Create a policy to deploy to /Applications
3. Use a configuration profile for settings

### Intune

1. Wrap as .pkg or .dmg
2. Deploy as macOS LOB app
3. Use custom profiles for configuration

## Branding

The portal supports white-label customization:

| Property | Description |
|----------|-------------|
| `companyName` | Displayed in header and tooltip |
| `brandColor` | Primary accent color (hex) |
| `portalUrl` | Your web portal URL |
| `portalKey` | Client-specific portal identifier |

## Security

- All web traffic uses HTTPS
- Portal key is stored in UserDefaults
- Sandboxed application
- Code signing required

## Support

- Dashboard: https://ultriumai.com/vanguard
- Email: support@ultriumai.com
