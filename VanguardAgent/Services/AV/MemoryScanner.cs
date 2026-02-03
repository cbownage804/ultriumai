// =============================================================================
// Memory Scanner - Advanced Threat Detection
// =============================================================================
// Detects fileless malware, injected code, and in-memory threats
// Scans process memory for malicious patterns and anomalies

using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;

namespace VanguardAgent.Services.AV;

public class MemoryScanner
{
    private readonly ApiClient _apiClient;
    private readonly List<MemorySignature> _signatures = new();
    private readonly HashSet<int> _whitelistedPids = new();
    // Removed unused _isRunning field - scanner lifecycle managed by AVEngine

    // Memory scanning statistics
    private long _processesScanned;
    private long _threatsDetected;
    private long _suspiciousRegions;

    public event EventHandler<MemoryThreatEventArgs>? OnThreatDetected;

    // P/Invoke declarations for memory reading
    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern IntPtr OpenProcess(uint dwDesiredAccess, bool bInheritHandle, int dwProcessId);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool CloseHandle(IntPtr hObject);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool ReadProcessMemory(IntPtr hProcess, IntPtr lpBaseAddress, 
        byte[] lpBuffer, int dwSize, out int lpNumberOfBytesRead);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern int VirtualQueryEx(IntPtr hProcess, IntPtr lpAddress, 
        out MEMORY_BASIC_INFORMATION lpBuffer, int dwLength);

    [DllImport("psapi.dll", SetLastError = true)]
    private static extern bool EnumProcessModulesEx(IntPtr hProcess, IntPtr[] lphModule, 
        int cb, out int lpcbNeeded, int dwFilterFlag);

    private const uint PROCESS_QUERY_INFORMATION = 0x0400;
    private const uint PROCESS_VM_READ = 0x0010;
    private const uint MEM_COMMIT = 0x1000;
    private const uint PAGE_EXECUTE_READWRITE = 0x40;
    private const uint PAGE_EXECUTE_READ = 0x20;
    private const uint PAGE_EXECUTE_WRITECOPY = 0x80;

    [StructLayout(LayoutKind.Sequential)]
    private struct MEMORY_BASIC_INFORMATION
    {
        public IntPtr BaseAddress;
        public IntPtr AllocationBase;
        public uint AllocationProtect;
        public IntPtr RegionSize;
        public uint State;
        public uint Protect;
        public uint Type;
    }

    public MemoryScanner(ApiClient apiClient)
    {
        _apiClient = apiClient;
    }

    public async Task InitializeAsync()
    {
        await LoadSignaturesAsync();
        LoadWhitelistedProcesses();
        Console.WriteLine($"[Memory Scanner] Initialized with {_signatures.Count} signatures");
    }

    private async Task LoadSignaturesAsync()
    {
        try
        {
            // Load memory-specific signatures from backend
            var response = await _apiClient.GetMemorySignaturesAsync();
            if (response?.Signatures != null)
            {
                _signatures.AddRange(response.Signatures);
            }
        }
        catch { }

        // Add built-in signatures for common threats
        AddBuiltInSignatures();
    }

    private void AddBuiltInSignatures()
    {
        // Cobalt Strike beacon patterns
        _signatures.Add(new MemorySignature
        {
            Id = "cs_beacon_1",
            Name = "Cobalt Strike Beacon",
            Pattern = "4D5A.*?This program cannot be run in DOS mode.*?ReflectiveLoader",
            PatternType = PatternType.Regex,
            Severity = ThreatSeverity.Critical,
            MitreId = "T1055"
        });

        // Mimikatz patterns
        _signatures.Add(new MemorySignature
        {
            Id = "mimikatz_1",
            Name = "Mimikatz In-Memory",
            Pattern = "6D696D696B61747A", // "mimikatz" in hex
            PatternType = PatternType.Hex,
            Severity = ThreatSeverity.Critical,
            MitreId = "T1003"
        });

        _signatures.Add(new MemorySignature
        {
            Id = "mimikatz_2",
            Name = "Mimikatz Sekurlsa",
            Pattern = "sekurlsa::logonpasswords",
            PatternType = PatternType.String,
            Severity = ThreatSeverity.Critical,
            MitreId = "T1003.001"
        });

        // PowerShell Empire
        _signatures.Add(new MemorySignature
        {
            Id = "empire_1",
            Name = "PowerShell Empire",
            Pattern = "Invoke-Empire|Empire agent",
            PatternType = PatternType.Regex,
            Severity = ThreatSeverity.High,
            MitreId = "T1059.001"
        });

        // Metasploit Meterpreter
        _signatures.Add(new MemorySignature
        {
            Id = "meterpreter_1",
            Name = "Meterpreter Payload",
            Pattern = "metsrv|stdapi|priv|kiwi",
            PatternType = PatternType.Regex,
            Severity = ThreatSeverity.Critical,
            MitreId = "T1055"
        });

        // Sliver C2
        _signatures.Add(new MemorySignature
        {
            Id = "sliver_1",
            Name = "Sliver C2 Implant",
            Pattern = "sliver|bishopfox",
            PatternType = PatternType.Regex,
            Severity = ThreatSeverity.Critical,
            MitreId = "T1071"
        });

        // Generic shellcode patterns
        _signatures.Add(new MemorySignature
        {
            Id = "shellcode_1",
            Name = "x64 Shellcode Stub",
            Pattern = "FC4883E4F0E8",
            PatternType = PatternType.Hex,
            Severity = ThreatSeverity.High,
            MitreId = "T1055"
        });

        // Process hollowing indicators
        _signatures.Add(new MemorySignature
        {
            Id = "hollow_1",
            Name = "NtUnmapViewOfSection Call",
            Pattern = "4E74556E6D6170",
            PatternType = PatternType.Hex,
            Severity = ThreatSeverity.High,
            MitreId = "T1055.012"
        });
    }

    private void LoadWhitelistedProcesses()
    {
        // System processes that should not be scanned
        var systemProcesses = new[] { "System", "Idle", "smss", "csrss", "wininit", 
                                       "services", "lsass", "svchost", "dwm" };
        
        foreach (var proc in Process.GetProcesses())
        {
            try
            {
                if (systemProcesses.Contains(proc.ProcessName, StringComparer.OrdinalIgnoreCase))
                {
                    _whitelistedPids.Add(proc.Id);
                }
            }
            catch { }
        }
    }

    public async Task<MemoryScanReport> ScanAllProcessesAsync()
    {
        var report = new MemoryScanReport { StartTime = DateTime.UtcNow };
        var threats = new List<MemoryThreat>();

        foreach (var process in Process.GetProcesses())
        {
            if (_whitelistedPids.Contains(process.Id)) continue;

            try
            {
                var result = await ScanProcessAsync(process);
                if (result.HasThreats)
                {
                    threats.AddRange(result.Threats);
                }
                Interlocked.Increment(ref _processesScanned);
            }
            catch { }
        }

        report.EndTime = DateTime.UtcNow;
        report.ProcessesScanned = (int)_processesScanned;
        report.Threats = threats;
        report.TotalThreats = threats.Count;

        return report;
    }

    public async Task<ProcessScanResult> ScanProcessAsync(Process process)
    {
        var result = new ProcessScanResult
        {
            ProcessId = process.Id,
            ProcessName = process.ProcessName,
            ScanTime = DateTime.UtcNow
        };

        IntPtr hProcess = IntPtr.Zero;
        try
        {
            hProcess = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, false, process.Id);
            if (hProcess == IntPtr.Zero)
            {
                result.AccessDenied = true;
                return result;
            }

            // 1. Check for suspicious memory regions
            var suspiciousRegions = await FindSuspiciousRegionsAsync(hProcess);
            result.SuspiciousRegions = suspiciousRegions.Count;

            // 2. Scan executable memory for signatures
            foreach (var region in suspiciousRegions)
            {
                var threats = await ScanMemoryRegionAsync(hProcess, region, process.ProcessName);
                result.Threats.AddRange(threats);
            }

            // 3. Check for hollowed processes
            var hollowCheck = await CheckProcessHollowingAsync(process, hProcess);
            if (hollowCheck.IsHollowed)
            {
                result.Threats.Add(new MemoryThreat
                {
                    ProcessId = process.Id,
                    ProcessName = process.ProcessName,
                    ThreatName = "Process Hollowing Detected",
                    DetectionType = "Anomaly",
                    Severity = ThreatSeverity.Critical,
                    MitreId = "T1055.012",
                    Details = hollowCheck.Details
                });
            }

            // 4. Check for injected threads
            var injectedThreads = await DetectInjectedThreadsAsync(process);
            foreach (var thread in injectedThreads)
            {
                result.Threats.Add(new MemoryThreat
                {
                    ProcessId = process.Id,
                    ProcessName = process.ProcessName,
                    ThreatName = "Thread Injection Detected",
                    DetectionType = "Anomaly",
                    Severity = ThreatSeverity.High,
                    MitreId = "T1055.003",
                    ThreadId = thread.ThreadId,
                    Details = thread.Details
                });
            }

            // 5. Check for unbacked executable memory
            var unbackedRegions = await FindUnbackedExecutableMemoryAsync(hProcess);
            foreach (var region in unbackedRegions)
            {
                result.Threats.Add(new MemoryThreat
                {
                    ProcessId = process.Id,
                    ProcessName = process.ProcessName,
                    ThreatName = "Unbacked Executable Memory",
                    DetectionType = "Anomaly",
                    Severity = ThreatSeverity.Medium,
                    MitreId = "T1055",
                    MemoryAddress = region.BaseAddress.ToString("X"),
                    MemorySize = (long)region.RegionSize
                });
            }

            result.HasThreats = result.Threats.Count > 0;

            if (result.HasThreats)
            {
                Interlocked.Increment(ref _threatsDetected);
                foreach (var threat in result.Threats)
                {
                    OnThreatDetected?.Invoke(this, new MemoryThreatEventArgs { Threat = threat });
                }
            }
        }
        finally
        {
            if (hProcess != IntPtr.Zero)
                CloseHandle(hProcess);
        }

        return result;
    }

    private async Task<List<MemoryRegionInfo>> FindSuspiciousRegionsAsync(IntPtr hProcess)
    {
        var regions = new List<MemoryRegionInfo>();
        IntPtr address = IntPtr.Zero;

        await Task.Run(() =>
        {
            while (true)
            {
                if (VirtualQueryEx(hProcess, address, out MEMORY_BASIC_INFORMATION mbi, 
                    Marshal.SizeOf<MEMORY_BASIC_INFORMATION>()) == 0)
                    break;

                // Check for executable memory
                if (mbi.State == MEM_COMMIT && 
                    (mbi.Protect == PAGE_EXECUTE_READWRITE || 
                     mbi.Protect == PAGE_EXECUTE_READ ||
                     mbi.Protect == PAGE_EXECUTE_WRITECOPY))
                {
                    regions.Add(new MemoryRegionInfo
                    {
                        BaseAddress = mbi.BaseAddress,
                        RegionSize = mbi.RegionSize,
                        Protect = mbi.Protect,
                        Type = mbi.Type
                    });
                    Interlocked.Increment(ref _suspiciousRegions);
                }

                // Move to next region
                address = new IntPtr(mbi.BaseAddress.ToInt64() + mbi.RegionSize.ToInt64());
            }
        });

        return regions;
    }

    private async Task<List<MemoryThreat>> ScanMemoryRegionAsync(IntPtr hProcess, 
        MemoryRegionInfo region, string processName)
    {
        var threats = new List<MemoryThreat>();

        try
        {
            // Limit region size to prevent memory issues
            var size = Math.Min((int)region.RegionSize.ToInt64(), 10 * 1024 * 1024); // 10MB max
            var buffer = new byte[size];

            if (ReadProcessMemory(hProcess, region.BaseAddress, buffer, size, out int bytesRead))
            {
                var hexContent = Convert.ToHexString(buffer, 0, bytesRead);
                var stringContent = System.Text.Encoding.ASCII.GetString(buffer, 0, bytesRead);

                await Task.Run(() =>
                {
                    foreach (var sig in _signatures)
                    {
                        bool matched = sig.PatternType switch
                        {
                            PatternType.String => stringContent.Contains(sig.Pattern, StringComparison.OrdinalIgnoreCase),
                            PatternType.Hex => hexContent.Contains(sig.Pattern, StringComparison.OrdinalIgnoreCase),
                            PatternType.Regex => Regex.IsMatch(stringContent, sig.Pattern, RegexOptions.IgnoreCase),
                            _ => false
                        };

                        if (matched)
                        {
                            threats.Add(new MemoryThreat
                            {
                                ProcessName = processName,
                                ThreatName = sig.Name,
                                SignatureId = sig.Id,
                                DetectionType = "Signature",
                                Severity = sig.Severity,
                                MitreId = sig.MitreId,
                                MemoryAddress = region.BaseAddress.ToString("X"),
                                MemorySize = bytesRead
                            });
                        }
                    }
                });
            }
        }
        catch { }

        return threats;
    }

    private async Task<HollowCheckResult> CheckProcessHollowingAsync(Process process, IntPtr hProcess)
    {
        var result = new HollowCheckResult();

        try
        {
            await Task.Run(() =>
            {
                // Check if main module's memory differs from disk image
                var mainModule = process.MainModule;
                if (mainModule == null) return;

                var diskPath = mainModule.FileName;
                if (string.IsNullOrEmpty(diskPath) || !File.Exists(diskPath)) return;

                // Read first bytes from disk
                var diskBytes = new byte[4096];
                using (var fs = new FileStream(diskPath, FileMode.Open, FileAccess.Read, FileShare.Read))
                {
                    fs.Read(diskBytes, 0, diskBytes.Length);
                }

                // Read first bytes from memory
                var memBytes = new byte[4096];
                if (ReadProcessMemory(hProcess, mainModule.BaseAddress, memBytes, memBytes.Length, out _))
                {
                    // Check for MZ header mismatch
                    if (memBytes[0] != 0x4D || memBytes[1] != 0x5A)
                    {
                        result.IsHollowed = true;
                        result.Details = "Missing MZ header in memory";
                        return;
                    }

                    // Check for significant differences in PE header
                    int differences = 0;
                    for (int i = 0; i < 512; i++)
                    {
                        if (diskBytes[i] != memBytes[i]) differences++;
                    }

                    if (differences > 50)
                    {
                        result.IsHollowed = true;
                        result.Details = $"Significant PE header mismatch ({differences} bytes differ)";
                    }
                }
            });
        }
        catch { }

        return result;
    }

    private async Task<List<InjectedThreadInfo>> DetectInjectedThreadsAsync(Process process)
    {
        var injected = new List<InjectedThreadInfo>();

        try
        {
            await Task.Run(() =>
            {
                foreach (ProcessThread thread in process.Threads)
                {
                    try
                    {
                        // Check for threads with suspicious start addresses
                        // This is a simplified check - real implementation would be more comprehensive
                        var startAddress = thread.StartAddress;
                        
                        // Check if start address is outside known modules
                        bool inKnownModule = false;
                        foreach (ProcessModule module in process.Modules)
                        {
                            var moduleStart = module.BaseAddress.ToInt64();
                            var moduleEnd = moduleStart + module.ModuleMemorySize;
                            var threadStart = startAddress.ToInt64();

                            if (threadStart >= moduleStart && threadStart < moduleEnd)
                            {
                                inKnownModule = true;
                                break;
                            }
                        }

                        if (!inKnownModule && startAddress != IntPtr.Zero)
                        {
                            injected.Add(new InjectedThreadInfo
                            {
                                ThreadId = thread.Id,
                                StartAddress = startAddress,
                                Details = "Thread start address outside known modules"
                            });
                        }
                    }
                    catch { }
                }
            });
        }
        catch { }

        return injected;
    }

    private async Task<List<MemoryRegionInfo>> FindUnbackedExecutableMemoryAsync(IntPtr hProcess)
    {
        var unbacked = new List<MemoryRegionInfo>();
        IntPtr address = IntPtr.Zero;

        await Task.Run(() =>
        {
            while (true)
            {
                if (VirtualQueryEx(hProcess, address, out MEMORY_BASIC_INFORMATION mbi,
                    Marshal.SizeOf<MEMORY_BASIC_INFORMATION>()) == 0)
                    break;

                // Type 0x20000 = MEM_PRIVATE (not backed by file)
                // With execute permissions
                if (mbi.State == MEM_COMMIT && mbi.Type == 0x20000 &&
                    (mbi.Protect == PAGE_EXECUTE_READWRITE || 
                     mbi.Protect == PAGE_EXECUTE_READ))
                {
                    unbacked.Add(new MemoryRegionInfo
                    {
                        BaseAddress = mbi.BaseAddress,
                        RegionSize = mbi.RegionSize,
                        Protect = mbi.Protect,
                        Type = mbi.Type
                    });
                }

                address = new IntPtr(mbi.BaseAddress.ToInt64() + mbi.RegionSize.ToInt64());
            }
        });

        return unbacked;
    }

    public async Task<bool> TerminateInfectedProcessAsync(int processId)
    {
        try
        {
            var process = Process.GetProcessById(processId);
            process.Kill();
            await process.WaitForExitAsync();
            Console.WriteLine($"[Memory Scanner] Terminated infected process: {processId}");
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Memory Scanner] Failed to terminate process {processId}: {ex.Message}");
            return false;
        }
    }

    public MemoryScannerStats GetStats()
    {
        return new MemoryScannerStats
        {
            ProcessesScanned = _processesScanned,
            ThreatsDetected = _threatsDetected,
            SuspiciousRegionsFound = _suspiciousRegions,
            SignaturesLoaded = _signatures.Count
        };
    }
}

// Supporting classes

public class MemorySignature
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Pattern { get; set; } = "";
    public PatternType PatternType { get; set; }
    public ThreatSeverity Severity { get; set; }
    public string? MitreId { get; set; }
}

public enum PatternType
{
    String,
    Hex,
    Regex
}

public enum ThreatSeverity
{
    Low,
    Medium,
    High,
    Critical
}

public class MemoryRegionInfo
{
    public IntPtr BaseAddress { get; set; }
    public IntPtr RegionSize { get; set; }
    public uint Protect { get; set; }
    public uint Type { get; set; }
}

public class MemoryThreat
{
    public int ProcessId { get; set; }
    public string ProcessName { get; set; } = "";
    public string ThreatName { get; set; } = "";
    public string? SignatureId { get; set; }
    public string DetectionType { get; set; } = "";
    public ThreatSeverity Severity { get; set; }
    public string? MitreId { get; set; }
    public string? MemoryAddress { get; set; }
    public long MemorySize { get; set; }
    public int? ThreadId { get; set; }
    public string? Details { get; set; }
}

public class ProcessScanResult
{
    public int ProcessId { get; set; }
    public string ProcessName { get; set; } = "";
    public DateTime ScanTime { get; set; }
    public bool AccessDenied { get; set; }
    public bool HasThreats { get; set; }
    public int SuspiciousRegions { get; set; }
    public List<MemoryThreat> Threats { get; set; } = new();
}

public class MemoryScanReport
{
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public int ProcessesScanned { get; set; }
    public int TotalThreats { get; set; }
    public List<MemoryThreat> Threats { get; set; } = new();
}

public class HollowCheckResult
{
    public bool IsHollowed { get; set; }
    public string? Details { get; set; }
}

public class InjectedThreadInfo
{
    public int ThreadId { get; set; }
    public IntPtr StartAddress { get; set; }
    public string? Details { get; set; }
}

public class MemoryScannerStats
{
    public long ProcessesScanned { get; set; }
    public long ThreatsDetected { get; set; }
    public long SuspiciousRegionsFound { get; set; }
    public int SignaturesLoaded { get; set; }
}

public class MemoryThreatEventArgs : EventArgs
{
    public MemoryThreat Threat { get; set; } = new();
}
