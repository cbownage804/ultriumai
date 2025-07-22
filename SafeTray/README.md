## SafeTray - Ultrium SafeNet System Tray Application

### Overview
SafeTray is a .NET 8 WPF system tray application that provides quick access to Ultrium SafeNet services and real-time status monitoring.

### Features
- **System Tray Icon**: Color-coded status indicator (Green/Yellow/Red/Gray)
- **Quick Access Menu**: One-click access to SafePass, network scans, alerts, and dashboard
- **Real-time Status**: Automatic status polling every 2 minutes
- **Toast Notifications**: Critical alert notifications
- **Named Pipe Communication**: Direct communication with PowerShell service

### Requirements
- .NET 8.0 Runtime
- Windows 10/11
- Ultrium SafeNet PowerShell service running

### Installation
1. Build the project: `dotnet build --configuration Release`
2. Copy the output to desired location
3. Run `SafeTray.exe`

### Architecture
- **Services/TrayIconService.cs**: Main tray icon management
- **Services/PipeClient.cs**: Named pipe communication with PowerShell service
- **Services/ApiClient.cs**: Supabase edge function API calls
- **Services/ToastService.cs**: Windows toast notifications
- **Models/TrayStatus.cs**: Data models for API responses

### Configuration
The application automatically reads the device ID from the Windows registry:
`HKLM\Software\UltriumSafeNet\DeviceId`

### API Endpoints
- **Tray Status**: `POST /functions/v1/tray-status`
- **Token Generation**: `POST /functions/v1/issue-tray-token`

### Menu Actions
- **Open SafePass**: SSO authentication to SafePass password manager
- **Run Network Scan**: Triggers network discovery scan via service
- **View Alerts**: Opens SafeShield dashboard
- **Open Dashboard**: Opens main Ultrium dashboard
- **Settings**: Configuration window (future)
- **Exit**: Closes application

### Status Indicators
- 🟢 **Green**: All systems healthy
- 🟡 **Yellow**: High-priority alerts or warnings
- 🔴 **Red**: Critical alerts or device offline
- ⚫ **Gray**: Unknown status or connection issues