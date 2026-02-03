// =============================================================================
// Forensics Collector - XDR Evidence Preservation
// =============================================================================
// Collects forensic data for incident investigation including:
// - Memory dumps
// - Process snapshots
// - Network state
// - Registry exports
// - Event log exports

using System.Diagnostics;
using System.IO.Compression;

namespace VanguardAgent.Services.XDR;

public class ForensicsCollector
{
    private readonly ConfigService _configService;
    private readonly ApiClient _apiClient;
    private readonly string _evidenceDir;

    public ForensicsCollector(ConfigService configService, ApiClient apiClient)
    {
        _configService = configService;
        _apiClient = apiClient;
        _evidenceDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
            "VanguardAgent", "Evidence"
        );

        if (!Directory.Exists(_evidenceDir))
            Directory.CreateDirectory(_evidenceDir);
    }

    public async Task<ForensicPackage> CollectIncidentPackageAsync(string incidentId)
    {
        var package = new ForensicPackage
        {
            IncidentId = incidentId,
            DeviceId = _configService.Config.DeviceId ?? Environment.MachineName,
            CollectionTime = DateTime.UtcNow
        };

        var incidentDir = Path.Combine(_evidenceDir, $"{incidentId}_{DateTime.UtcNow:yyyyMMdd_HHmmss}");
        Directory.CreateDirectory(incidentDir);

        Console.WriteLine($"[XDR Forensics] Collecting evidence for incident {incidentId}");

        try
        {
            // Collect various artifacts in parallel
            var tasks = new List<Task>
            {
                CollectProcessListAsync(incidentDir, package),
                CollectNetworkStateAsync(incidentDir, package),
                CollectEventLogsAsync(incidentDir, package),
                CollectStartupItemsAsync(incidentDir, package),
                CollectScheduledTasksAsync(incidentDir, package),
                CollectServiceListAsync(incidentDir, package),
                CollectSystemInfoAsync(incidentDir, package)
            };

            await Task.WhenAll(tasks);

            // Create evidence package
            var zipPath = await CreateEvidenceArchiveAsync(incidentDir, incidentId);
            package.ArchivePath = zipPath;
            package.ArchiveSize = new FileInfo(zipPath).Length;

            Console.WriteLine($"[XDR Forensics] Evidence collected: {package.ArchivePath}");

            // Report to backend
            await ReportCollectionAsync(package);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR Forensics] Collection failed: {ex.Message}");
            package.Errors.Add(ex.Message);
        }

        return package;
    }

    private async Task CollectProcessListAsync(string outputDir, ForensicPackage package)
    {
        try
        {
            var output = new List<ProcessSnapshot>();

            foreach (var proc in Process.GetProcesses())
            {
                try
                {
                    output.Add(new ProcessSnapshot
                    {
                        PID = proc.Id,
                        Name = proc.ProcessName,
                        StartTime = TryGetStartTime(proc),
                        MemoryMB = proc.WorkingSet64 / (1024 * 1024),
                        CommandLine = TryGetCommandLine(proc.Id),
                        ParentPID = TryGetParentPID(proc.Id)
                    });
                }
                catch { }
            }

            var json = Newtonsoft.Json.JsonConvert.SerializeObject(output, Newtonsoft.Json.Formatting.Indented);
            await File.WriteAllTextAsync(Path.Combine(outputDir, "processes.json"), json);

            package.ProcessCount = output.Count;
            package.Artifacts.Add("processes.json");
        }
        catch (Exception ex)
        {
            package.Errors.Add($"Process collection failed: {ex.Message}");
        }
    }

    private async Task CollectNetworkStateAsync(string outputDir, ForensicPackage package)
    {
        try
        {
            // netstat
            var netstat = await RunCommandAsync("netstat", "-ano");
            await File.WriteAllTextAsync(Path.Combine(outputDir, "netstat.txt"), netstat);

            // arp cache
            var arp = await RunCommandAsync("arp", "-a");
            await File.WriteAllTextAsync(Path.Combine(outputDir, "arp.txt"), arp);

            // DNS cache
            var dns = await RunCommandAsync("ipconfig", "/displaydns");
            await File.WriteAllTextAsync(Path.Combine(outputDir, "dns_cache.txt"), dns);

            // Network config
            var ipconfig = await RunCommandAsync("ipconfig", "/all");
            await File.WriteAllTextAsync(Path.Combine(outputDir, "ipconfig.txt"), ipconfig);

            package.Artifacts.Add("netstat.txt");
            package.Artifacts.Add("arp.txt");
            package.Artifacts.Add("dns_cache.txt");
            package.Artifacts.Add("ipconfig.txt");
        }
        catch (Exception ex)
        {
            package.Errors.Add($"Network collection failed: {ex.Message}");
        }
    }

    private async Task CollectEventLogsAsync(string outputDir, ForensicPackage package)
    {
        try
        {
            var logs = new[] { "Security", "System", "Application" };

            foreach (var logName in logs)
            {
                try
                {
                    var output = await RunCommandAsync("wevtutil", 
                        $"qe {logName} /c:1000 /f:text /rd:true");
                    await File.WriteAllTextAsync(
                        Path.Combine(outputDir, $"eventlog_{logName.ToLower()}.txt"), 
                        output);
                    package.Artifacts.Add($"eventlog_{logName.ToLower()}.txt");
                }
                catch { }
            }
        }
        catch (Exception ex)
        {
            package.Errors.Add($"Event log collection failed: {ex.Message}");
        }
    }

    private async Task CollectStartupItemsAsync(string outputDir, ForensicPackage package)
    {
        try
        {
            var startupInfo = new
            {
                RunKeys = GetRegistryRunKeys(),
                StartupFolders = GetStartupFolderItems(),
                Services = GetAutoStartServices()
            };

            var json = Newtonsoft.Json.JsonConvert.SerializeObject(startupInfo, Newtonsoft.Json.Formatting.Indented);
            await File.WriteAllTextAsync(Path.Combine(outputDir, "startup_items.json"), json);

            package.Artifacts.Add("startup_items.json");
        }
        catch (Exception ex)
        {
            package.Errors.Add($"Startup collection failed: {ex.Message}");
        }
    }

    private async Task CollectScheduledTasksAsync(string outputDir, ForensicPackage package)
    {
        try
        {
            var output = await RunCommandAsync("schtasks", "/query /v /fo csv");
            await File.WriteAllTextAsync(Path.Combine(outputDir, "scheduled_tasks.csv"), output);

            package.Artifacts.Add("scheduled_tasks.csv");
        }
        catch (Exception ex)
        {
            package.Errors.Add($"Scheduled task collection failed: {ex.Message}");
        }
    }

    private async Task CollectServiceListAsync(string outputDir, ForensicPackage package)
    {
        try
        {
            var output = await RunCommandAsync("sc", "query type= all state= all");
            await File.WriteAllTextAsync(Path.Combine(outputDir, "services.txt"), output);

            package.Artifacts.Add("services.txt");
        }
        catch (Exception ex)
        {
            package.Errors.Add($"Service collection failed: {ex.Message}");
        }
    }

    private async Task CollectSystemInfoAsync(string outputDir, ForensicPackage package)
    {
        try
        {
            var output = await RunCommandAsync("systeminfo", "");
            await File.WriteAllTextAsync(Path.Combine(outputDir, "systeminfo.txt"), output);

            package.Artifacts.Add("systeminfo.txt");
        }
        catch (Exception ex)
        {
            package.Errors.Add($"System info collection failed: {ex.Message}");
        }
    }

    public async Task<string?> CollectProcessMemoryDumpAsync(int processId, string reason)
    {
        try
        {
            var dumpPath = Path.Combine(_evidenceDir, $"dump_{processId}_{DateTime.UtcNow:yyyyMMdd_HHmmss}.dmp");

            // Use procdump if available, otherwise use comsvcs.dll
            var output = await RunCommandAsync("powershell", 
                $"-Command \"$proc = Get-Process -Id {processId}; " +
                $"[System.Diagnostics.Process]::Start('rundll32.exe', " +
                $"'C:\\Windows\\System32\\comsvcs.dll, MiniDump {processId} {dumpPath} full')\"");

            if (File.Exists(dumpPath))
            {
                Console.WriteLine($"[XDR Forensics] Memory dump created: {dumpPath}");

                await _apiClient.SendSecurityEventAsync(new
                {
                    action = "forensic_artifact",
                    artifact = new
                    {
                        agent_id = _configService.Config.DeviceId,
                        artifact_type = "memory_dump",
                        process_id = processId,
                        reason = reason,
                        path = dumpPath,
                        size = new FileInfo(dumpPath).Length,
                        timestamp = DateTime.UtcNow
                    }
                });

                return dumpPath;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR Forensics] Memory dump failed: {ex.Message}");
        }

        return null;
    }

    private async Task<string> CreateEvidenceArchiveAsync(string sourceDir, string incidentId)
    {
        var zipPath = Path.Combine(_evidenceDir, $"evidence_{incidentId}_{DateTime.UtcNow:yyyyMMdd_HHmmss}.zip");

        await Task.Run(() =>
        {
            ZipFile.CreateFromDirectory(sourceDir, zipPath, CompressionLevel.Optimal, false);
        });

        // Clean up source directory
        try
        {
            Directory.Delete(sourceDir, true);
        }
        catch { }

        return zipPath;
    }

    private async Task ReportCollectionAsync(ForensicPackage package)
    {
        try
        {
            await _apiClient.SendSecurityEventAsync(new
            {
                action = "forensic_collection",
                collection = new
                {
                    agent_id = _configService.Config.DeviceId,
                    incident_id = package.IncidentId,
                    collection_time = package.CollectionTime,
                    process_count = package.ProcessCount,
                    artifact_count = package.Artifacts.Count,
                    archive_size = package.ArchiveSize,
                    errors = package.Errors
                }
            });
        }
        catch { }
    }

    private async Task<string> RunCommandAsync(string command, string args)
    {
        var psi = new ProcessStartInfo
        {
            FileName = command,
            Arguments = args,
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true
        };

        using var process = Process.Start(psi);
        var output = await process!.StandardOutput.ReadToEndAsync();
        await process.WaitForExitAsync();

        return output;
    }

    private DateTime? TryGetStartTime(Process proc)
    {
        try { return proc.StartTime; }
        catch { return null; }
    }

    private string? TryGetCommandLine(int pid)
    {
        try
        {
            using var searcher = new System.Management.ManagementObjectSearcher(
                $"SELECT CommandLine FROM Win32_Process WHERE ProcessId = {pid}");
            foreach (System.Management.ManagementObject obj in searcher.Get())
            {
                return obj["CommandLine"]?.ToString();
            }
        }
        catch { }
        return null;
    }

    private int? TryGetParentPID(int pid)
    {
        try
        {
            using var searcher = new System.Management.ManagementObjectSearcher(
                $"SELECT ParentProcessId FROM Win32_Process WHERE ProcessId = {pid}");
            foreach (System.Management.ManagementObject obj in searcher.Get())
            {
                return Convert.ToInt32(obj["ParentProcessId"]);
            }
        }
        catch { }
        return null;
    }

    private Dictionary<string, string> GetRegistryRunKeys()
    {
        var result = new Dictionary<string, string>();

        try
        {
            using var key = Microsoft.Win32.Registry.LocalMachine.OpenSubKey(
                @"SOFTWARE\Microsoft\Windows\CurrentVersion\Run");
            if (key != null)
            {
                foreach (var valueName in key.GetValueNames())
                {
                    result[valueName] = key.GetValue(valueName)?.ToString() ?? "";
                }
            }
        }
        catch { }

        return result;
    }

    private List<string> GetStartupFolderItems()
    {
        var items = new List<string>();

        try
        {
            var startupPath = Environment.GetFolderPath(Environment.SpecialFolder.Startup);
            if (Directory.Exists(startupPath))
            {
                items.AddRange(Directory.GetFiles(startupPath));
            }

            var commonStartup = @"C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Startup";
            if (Directory.Exists(commonStartup))
            {
                items.AddRange(Directory.GetFiles(commonStartup));
            }
        }
        catch { }

        return items;
    }

    private List<string> GetAutoStartServices()
    {
        var services = new List<string>();

        try
        {
            foreach (var svc in System.ServiceProcess.ServiceController.GetServices())
            {
                if (svc.StartType == System.ServiceProcess.ServiceStartMode.Automatic)
                {
                    services.Add(svc.ServiceName);
                }
            }
        }
        catch { }

        return services;
    }
}

public class ForensicPackage
{
    public string IncidentId { get; set; } = "";
    public string DeviceId { get; set; } = "";
    public DateTime CollectionTime { get; set; }
    public int ProcessCount { get; set; }
    public List<string> Artifacts { get; set; } = new();
    public string? ArchivePath { get; set; }
    public long ArchiveSize { get; set; }
    public List<string> Errors { get; set; } = new();
}

public class ProcessSnapshot
{
    public int PID { get; set; }
    public string Name { get; set; } = "";
    public DateTime? StartTime { get; set; }
    public long MemoryMB { get; set; }
    public string? CommandLine { get; set; }
    public int? ParentPID { get; set; }
}
