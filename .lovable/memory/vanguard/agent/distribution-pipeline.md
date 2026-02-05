# Memory: vanguard/agent/distribution-pipeline
Updated: now

Vanguard agents are distributed via a single self-contained EXE installer. The frontend downloads a stub EXE from Supabase Storage and appends the provisioning config (JSON) after a marker (`---VANGUARD_CONFIG_START---`). The C# installer reads its own tail to extract the embedded config.

## How It Works

1. User clicks "Download" in the dashboard
2. Frontend fetches `VanguardInstaller.exe` stub from storage
3. Frontend appends `---VANGUARD_CONFIG_START---` + JSON config to the EXE bytes
4. User receives a single `Install-CustomerName.exe` file
5. EXE reads its own tail to find the config, then runs the installation

## Installer Features

- **Self-contained EXE**: No ZIP extraction, no config files needed
- **Professional GUI**: Dark-themed WinForms installer with progress bar
- **Auto-elevate UAC**: Uses `app.manifest` to require administrator at launch
- **Token redemption**: Fetches credentials from `agent-provision` edge function
- **MSI download**: Downloads `VanguardAgent.msi` from Supabase Storage
- **Silent install**: Runs `msiexec /qn` with embedded credentials
- **Service verification**: Confirms VanguardAgent service is running
- **Tray launch**: Starts the system tray application if enabled

## Fallback Behavior

If the EXE download fails, the system falls back to generating a `.cmd` wrapper with Base64-encoded PowerShell (UTF-16LE).

## Key Files

- `VanguardInstaller/InstallerEngine.cs` - Reads config from EXE tail via `ReadAppendedConfig()`
- `src/utils/generateWindowsMsiInstaller.ts` - Appends config to EXE via `generateSelfContainedExe()`
