
# Vanguard Agent Enhancement Plan

## Current State Analysis

After reviewing the codebase, I've identified the architecture:

**Windows Agent (C#/.NET 8):**
- Located in `VanguardAgent/` directory
- Compiled via GitHub Actions workflow to EXE
- Current capabilities:
  - Shell/PowerShell command execution
  - Service control (start/stop/restart)
  - Process kill
  - File download
  - System reboot
  - Heartbeat with CPU/Memory/Disk metrics
  - Telemetry (processes, services, network adapters, installed software)

**Frontend Console Features (expecting agent commands):**

| Feature | Expected Command | Agent Support |
|---------|-----------------|---------------|
| Terminal | `run_script` | Partial (needs shell type handling) |
| Service Manager | `get_services`, `service_action` | Partial (needs get_services) |
| Process Manager | `get_processes`, `kill_process`, `kill_process_tree` | Partial (needs get_processes) |
| Software Inventory | `get_installed_software`, `install_software`, `uninstall_software` | Missing install/uninstall |
| Registry Editor | `read_registry` | Missing |
| Event Viewer | `get_event_logs` | Missing |
| File Transfer | `list_directory`, file upload/download | Partial |

---

## Implementation Plan

### Phase 1: Extend CommandExecutor.cs

Add new command handlers to support all frontend console features:

```text
CommandExecutor.cs additions:
├── get_services      → List all Windows services with status
├── get_processes     → List processes with CPU/memory stats
├── kill_process_tree → Kill process and children
├── run_script        → Enhanced with shell type (cmd/powershell/bash)
├── install_software  → Chocolatey integration
├── uninstall_software→ Silent uninstall via registry
├── read_registry     → Read registry keys/values
├── get_event_logs    → Query Windows Event Log
├── list_directory    → List files/folders at path
└── upload_file       → Receive file from dashboard
```

### Phase 2: Update TelemetryCollector.cs

Enhance data collection for richer frontend display:

```text
TelemetryCollector.cs additions:
├── GetProcessesWithCpu()    → Include per-process CPU %
├── GetServicesDetailed()    → Include start type, description
├── GetNetworkAdaptersEx()   → Include speed, IPv6
├── GetDiskVolumes()         → Per-volume info (BitLocker status)
└── GetSystemTemperature()   → CPU temp if available (WMI)
```

### Phase 3: Update ApiClient.cs Models

Add request/response models for new commands:

```text
New Models:
├── RegistryKeyResponse
├── EventLogEntry
├── DirectoryListing
├── SoftwareInstallRequest
├── ProcessDetailedInfo
└── ServiceDetailedInfo
```

### Phase 4: Update Agent API Handler

Modify `vanguard-agent-api/index.ts` to handle new command types from dashboard:

```text
Dashboard → API command routing:
├── get_services      → Passed to agent
├── get_processes     → Passed to agent
├── run_script        → Script + shell type
├── install_software  → Package name + manager
├── read_registry     → Registry path
├── get_event_logs    → Log name + level + limit
└── list_directory    → Directory path
```

### Phase 5: Version Bump & GitHub Release

Update version in:
- `VanguardAgent.csproj` → `<Version>1.1.0</Version>`
- Agent API `AGENT_VERSION` constant
- Trigger GitHub Actions build

---

## Technical Details

### New Command Implementations

**1. Get Processes with CPU (ProcessManager support)**
```csharp
// Uses System.Diagnostics.PerformanceCounter for per-process CPU
private List<ProcessDetailedInfo> GetProcessesWithCpu()
{
    var result = new List<ProcessDetailedInfo>();
    foreach (var proc in Process.GetProcesses())
    {
        // CPU sampling over 100ms
        // Memory from WorkingSet64
        // Thread count, Handle count
    }
    return result.OrderByDescending(p => p.CpuPercent).Take(100).ToList();
}
```

**2. Registry Reader**
```csharp
private RegistryResponse ReadRegistry(string path)
{
    // Parse HKLM, HKCU, etc from path
    // Read subkeys and values
    // Return structured response with type info
}
```

**3. Event Log Query**
```csharp
private List<EventLogEntry> GetEventLogs(string logName, string level, int limit)
{
    // Use System.Diagnostics.EventLog
    // Filter by Application/System/Security
    // Filter by level (Error, Warning, Information)
}
```

**4. Chocolatey Integration**
```csharp
private async Task<CommandResult> InstallSoftware(string package, string manager)
{
    if (manager == "chocolatey")
    {
        // choco install {package} -y
    }
    else if (manager == "winget")
    {
        // winget install --silent {package}
    }
}
```

**5. Directory Listing**
```csharp
private DirectoryListing ListDirectory(string path)
{
    var info = new DirectoryInfo(path);
    return new DirectoryListing
    {
        Path = path,
        Files = info.GetFileSystemInfos()
            .Select(f => new FileEntry { 
                Name = f.Name, 
                Type = f is DirectoryInfo ? "directory" : "file",
                Size = f is FileInfo fi ? fi.Length : 0,
                Modified = f.LastWriteTimeUtc
            }).ToList()
    };
}
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `VanguardAgent/Services/CommandExecutor.cs` | Modify | Add 10+ new command handlers |
| `VanguardAgent/Services/TelemetryCollector.cs` | Modify | Enhanced process/service collection |
| `VanguardAgent/Services/ApiClient.cs` | Modify | Add new model classes |
| `VanguardAgent/VanguardAgent.csproj` | Modify | Version bump to 1.1.0 |
| `supabase/functions/vanguard-agent-api/index.ts` | Modify | Route new commands from dashboard |
| `.github/workflows/build-vanguard-agent.yml` | No change | Will auto-build on push |

---

## Build & Distribution

The existing GitHub Actions workflow will automatically:
1. Detect changes in `VanguardAgent/**`
2. Build for win-x64 and win-arm64
3. Create release artifacts with checksums
4. Publish to GitHub Releases (manual trigger)

After implementation, trigger a release:
```
gh workflow run build-vanguard-agent.yml -f version=1.1.0 -f create_release=true
```

---

## Summary

This plan bridges the gap between the rich frontend console UI and the Windows agent capabilities. After implementation:

- Terminal: Full PowerShell/CMD/Bash support with proper shell switching
- Service Manager: Live service list with start/stop/restart
- Process Manager: Real-time CPU/memory stats with kill functionality
- Software Inventory: Chocolatey install/uninstall integration
- Registry Editor: Read-only registry browsing
- Event Viewer: Windows Event Log querying with export
- File Transfer: Directory browsing with upload/download

All changes maintain the existing authentication flow (X-VANGUARD-KEY) and command queue architecture.
