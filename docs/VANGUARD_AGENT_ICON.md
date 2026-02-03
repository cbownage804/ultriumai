# Vanguard Agent Windows Icon Configuration

This document describes how to configure the Vanguard icon for the Windows agent so it appears in the taskbar, system tray, and Programs list.

## Icon Files Required

The Vanguard icon has been added to the project at:
- `public/vanguard-icon.png` - Web/favicon use
- `src/assets/vanguard-icon.png` - React component imports

For the Windows agent, you need to generate `.ico` format files from the PNG.

## Converting PNG to ICO

Use one of these methods to create the `.ico` file:

### Option 1: Online Converter
1. Visit https://convertio.co/png-ico/ or https://icoconvert.com/
2. Upload `public/vanguard-icon.png`
3. Generate with multiple sizes: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256
4. Save as `vanguard.ico`

### Option 2: ImageMagick (Command Line)
```bash
magick convert vanguard-icon.png -define icon:auto-resize=256,128,64,48,32,16 vanguard.ico
```

## C# Windows Agent Configuration

### 1. Add Icon to Project

Place `vanguard.ico` in your C# project root or a `Resources` folder.

### 2. Update .csproj File

Add these properties to your `.csproj` file:

```xml
<PropertyGroup>
  <ApplicationIcon>vanguard.ico</ApplicationIcon>
</PropertyGroup>

<ItemGroup>
  <None Include="vanguard.ico" Pack="true" PackagePath="\" />
  <Content Include="vanguard.ico">
    <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
  </Content>
</ItemGroup>
```

### 3. Windows Service Display Name

In your service installer or `Program.cs`:

```csharp
// For Windows Service
ServiceBase.Run(new VanguardAgentService
{
    ServiceName = "VanguardAgent",
    // Display name shown in Services.msc
    // Note: Set via installer or sc.exe command
});

// When using sc.exe to install:
// sc create VanguardAgent binPath= "C:\Program Files\Vanguard\VanguardAgent.exe" DisplayName= "Vanguard Security Agent"
```

### 4. Add to Windows Programs (Add/Remove Programs)

For the agent to appear in "Apps & Features" / "Add or Remove Programs" with the icon:

**Option A: WiX Installer**
```xml
<Product ...>
  <Icon Id="VanguardIcon" SourceFile="vanguard.ico"/>
  <Property Id="ARPPRODUCTICON" Value="VanguardIcon" />
</Product>
```

**Option B: Inno Setup**
```pascal
[Setup]
SetupIconFile=vanguard.ico
UninstallDisplayIcon={app}\vanguard.ico
AppName=Vanguard Security Agent
AppPublisher=Ultrium AI
```

**Option C: Registry (Manual)**
```csharp
using Microsoft.Win32;

// During installation
var uninstallKey = Registry.LocalMachine.CreateSubKey(
    @"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\VanguardAgent"
);
uninstallKey.SetValue("DisplayIcon", @"C:\Program Files\Vanguard\vanguard.ico");
uninstallKey.SetValue("DisplayName", "Vanguard Security Agent");
uninstallKey.SetValue("Publisher", "Ultrium AI");
```

### 5. System Tray Icon (if applicable)

If the agent has a system tray presence:

```csharp
using System.Windows.Forms;

private NotifyIcon trayIcon;

public void InitializeTray()
{
    trayIcon = new NotifyIcon
    {
        Icon = new System.Drawing.Icon("vanguard.ico"),
        Visible = true,
        Text = "Vanguard Agent - Protected"
    };
    
    // Context menu
    var contextMenu = new ContextMenuStrip();
    contextMenu.Items.Add("Status", null, (s, e) => ShowStatus());
    contextMenu.Items.Add("Exit", null, (s, e) => ExitApplication());
    trayIcon.ContextMenuStrip = contextMenu;
}
```

## Build Configuration

Ensure your `build.ps1` or CI/CD includes:

```powershell
# Copy icon to output
Copy-Item "vanguard.ico" -Destination "$OutputPath\vanguard.ico"

# Sign the executable (EV certificate recommended)
& signtool sign /tr http://timestamp.digicert.com /td sha256 /fd sha256 /a "$OutputPath\VanguardAgent.exe"
```

## Verification

After building, verify the icon appears:
1. **File Explorer**: Right-click → Properties should show Vanguard icon
2. **Task Manager**: Running process shows Vanguard icon
3. **Taskbar**: Pinned/running app shows correct icon
4. **Add/Remove Programs**: Entry displays with Vanguard icon
5. **Services.msc**: Service listed as "Vanguard Security Agent"

## Branding Guidelines

- Icon: Cyan/purple shield with flame motif
- Display Name: "Vanguard Security Agent" or "Vanguard Agent"
- Publisher: "Ultrium AI"
- Description: "Enterprise security monitoring and endpoint protection agent"
