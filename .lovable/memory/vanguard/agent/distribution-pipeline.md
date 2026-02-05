# Memory: vanguard/agent/distribution-pipeline
Updated: now

Vanguard agents are distributed via a professional EXE installer package that provides a polished GUI experience. The deployment workflow generates a ZIP containing:
1. `VanguardInstaller.exe` - A compiled C# WinForms application with admin manifest
2. `installer_config.json` - Pre-configured with provisioning token and client settings
3. `README.txt` - Installation instructions

## Build Pipeline

The `VanguardInstaller` project (`VanguardInstaller/VanguardInstaller.csproj`) is built by GitHub Actions alongside the main agent. The stub EXE is uploaded to Supabase Storage (`vanguard-agents/VanguardInstaller.exe`).

## Installer Features

- **Professional GUI**: Dark-themed WinForms installer with progress bar and status updates
- **Auto-elevate UAC**: Uses `app.manifest` to require administrator at launch
- **Token redemption**: Fetches credentials from `agent-provision` edge function
- **MSI download**: Downloads `VanguardAgent.msi` from Supabase Storage
- **Silent install**: Runs `msiexec /qn` with embedded credentials
- **Service verification**: Confirms VanguardAgent service is running
- **Tray launch**: Starts the system tray application if enabled

## Fallback Behavior

If the EXE download fails, the system falls back to generating a `.cmd` wrapper with Base64-encoded PowerShell (UTF-16LE) for environments where the EXE isn't available.

## Key Files

- `VanguardInstaller/VanguardInstaller.csproj` - Project configuration
- `VanguardInstaller/InstallerEngine.cs` - Core installation logic
- `VanguardInstaller/InstallerForm.cs` - WinForms GUI
- `VanguardInstaller/app.manifest` - UAC elevation requirement
- `src/utils/generateWindowsMsiInstaller.ts` - Frontend ZIP generation
