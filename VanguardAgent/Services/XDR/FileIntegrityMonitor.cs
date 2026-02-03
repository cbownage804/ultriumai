// =============================================================================
// File Integrity Monitor (FIM) - XDR Threat Detection
// =============================================================================
// Monitors critical system files, registry keys, and directories for changes
// that could indicate compromise or persistence mechanisms

using System.Security.Cryptography;
using System.Text;
using Newtonsoft.Json;

namespace VanguardAgent.Services.XDR;

public class FileIntegrityMonitor : IDisposable
{
    private readonly ConfigService _configService;
    private readonly ApiClient _apiClient;
    private readonly List<FileSystemWatcher> _watchers = new();
    private readonly Dictionary<string, FileBaseline> _baseline = new();
    private readonly string _baselinePath;
    private bool _isRunning;
    private readonly object _lock = new();

    // Critical paths to monitor
    private static readonly string[] MonitoredPaths = new[]
    {
        @"C:\Windows\System32\drivers\etc\hosts",
        @"C:\Windows\System32\config",
        @"C:\Windows\System32\Tasks",
        @"C:\Windows\System32\GroupPolicy",
        @"C:\Windows\Prefetch",
        @"C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Startup",
        @"C:\Users\*\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup",
    };

    // Critical directories for recursive monitoring
    private static readonly string[] MonitoredDirectories = new[]
    {
        @"C:\Windows\System32\drivers",
        @"C:\Windows\System32\wbem",
        @"C:\Windows\System32\WindowsPowerShell\v1.0",
    };

    // File extensions to monitor
    private static readonly string[] SensitiveExtensions = new[]
    {
        ".exe", ".dll", ".sys", ".ps1", ".bat", ".cmd", ".vbs", ".js",
        ".hta", ".scr", ".pif", ".msi", ".msp", ".msc"
    };

    public FileIntegrityMonitor(ConfigService configService, ApiClient apiClient)
    {
        _configService = configService;
        _apiClient = apiClient;
        _baselinePath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
            "VanguardAgent", "fim_baseline.json"
        );
    }

    public void Start()
    {
        lock (_lock)
        {
            if (_isRunning) return;
            _isRunning = true;
        }

        try
        {
            LoadBaseline();
            SetupWatchers();
            Console.WriteLine("[XDR FIM] File Integrity Monitoring started");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR FIM] Failed to start: {ex.Message}");
        }
    }

    public void Stop()
    {
        lock (_lock)
        {
            _isRunning = false;
        }

        foreach (var watcher in _watchers)
        {
            watcher.EnableRaisingEvents = false;
            watcher.Dispose();
        }
        _watchers.Clear();

        SaveBaseline();
        Console.WriteLine("[XDR FIM] Monitoring stopped");
    }

    private void LoadBaseline()
    {
        try
        {
            if (File.Exists(_baselinePath))
            {
                var json = File.ReadAllText(_baselinePath);
                var data = JsonConvert.DeserializeObject<Dictionary<string, FileBaseline>>(json);
                if (data != null)
                {
                    foreach (var kvp in data)
                        _baseline[kvp.Key] = kvp.Value;
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR FIM] Failed to load baseline: {ex.Message}");
        }
    }

    private void SaveBaseline()
    {
        try
        {
            var dir = Path.GetDirectoryName(_baselinePath);
            if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
                Directory.CreateDirectory(dir);

            var json = JsonConvert.SerializeObject(_baseline, Formatting.Indented);
            File.WriteAllText(_baselinePath, json);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR FIM] Failed to save baseline: {ex.Message}");
        }
    }

    private void SetupWatchers()
    {
        // Monitor critical directories
        foreach (var dirPath in MonitoredDirectories)
        {
            if (Directory.Exists(dirPath))
            {
                SetupDirectoryWatcher(dirPath, true);
            }
        }

        // Monitor startup locations
        var userProfiles = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
        var usersDir = Directory.GetParent(userProfiles)?.FullName;
        if (usersDir != null && Directory.Exists(usersDir))
        {
            foreach (var userDir in Directory.GetDirectories(usersDir))
            {
                var startupPath = Path.Combine(userDir, 
                    @"AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup");
                if (Directory.Exists(startupPath))
                {
                    SetupDirectoryWatcher(startupPath, false);
                }
            }
        }

        // Common startup location
        var commonStartup = @"C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Startup";
        if (Directory.Exists(commonStartup))
        {
            SetupDirectoryWatcher(commonStartup, false);
        }

        // Monitor hosts file specifically
        var hostsDir = @"C:\Windows\System32\drivers\etc";
        if (Directory.Exists(hostsDir))
        {
            SetupDirectoryWatcher(hostsDir, false);
        }
    }

    private void SetupDirectoryWatcher(string path, bool includeSubdirectories)
    {
        try
        {
            var watcher = new FileSystemWatcher(path)
            {
                NotifyFilter = NotifyFilters.FileName | NotifyFilters.LastWrite | 
                              NotifyFilters.Size | NotifyFilters.CreationTime,
                IncludeSubdirectories = includeSubdirectories,
                EnableRaisingEvents = true
            };

            watcher.Created += OnFileChanged;
            watcher.Changed += OnFileChanged;
            watcher.Deleted += OnFileDeleted;
            watcher.Renamed += OnFileRenamed;

            _watchers.Add(watcher);
            Console.WriteLine($"[XDR FIM] Watching: {path}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR FIM] Failed to watch {path}: {ex.Message}");
        }
    }

    private async void OnFileChanged(object sender, FileSystemEventArgs e)
    {
        if (!ShouldMonitorFile(e.FullPath)) return;

        try
        {
            var newHash = await ComputeFileHashAsync(e.FullPath);
            var changeType = "created";
            string? previousHash = null;

            if (_baseline.TryGetValue(e.FullPath.ToLowerInvariant(), out var existing))
            {
                if (existing.Hash == newHash) return; // No actual change
                changeType = "modified";
                previousHash = existing.Hash;
            }

            // Update baseline
            _baseline[e.FullPath.ToLowerInvariant()] = new FileBaseline
            {
                Path = e.FullPath,
                Hash = newHash,
                LastModified = DateTime.UtcNow,
                Size = new FileInfo(e.FullPath).Length
            };

            // Determine severity
            var severity = DetermineChangeSeverity(e.FullPath, changeType);

            await ReportFileChangeAsync(new FileIntegrityEvent
            {
                Path = e.FullPath,
                ChangeType = changeType,
                NewHash = newHash,
                PreviousHash = previousHash,
                Severity = severity,
                Timestamp = DateTime.UtcNow,
                MitreTechnique = GetMitreTechniqueForPath(e.FullPath)
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR FIM] Error processing {e.FullPath}: {ex.Message}");
        }
    }

    private async void OnFileDeleted(object sender, FileSystemEventArgs e)
    {
        if (!ShouldMonitorFile(e.FullPath)) return;

        try
        {
            var key = e.FullPath.ToLowerInvariant();
            _baseline.Remove(key);

            await ReportFileChangeAsync(new FileIntegrityEvent
            {
                Path = e.FullPath,
                ChangeType = "deleted",
                Severity = DetermineChangeSeverity(e.FullPath, "deleted"),
                Timestamp = DateTime.UtcNow,
                MitreTechnique = GetMitreTechniqueForPath(e.FullPath)
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR FIM] Error processing deletion: {ex.Message}");
        }
    }

    private async void OnFileRenamed(object sender, RenamedEventArgs e)
    {
        if (!ShouldMonitorFile(e.FullPath) && !ShouldMonitorFile(e.OldFullPath)) return;

        try
        {
            await ReportFileChangeAsync(new FileIntegrityEvent
            {
                Path = e.FullPath,
                PreviousPath = e.OldFullPath,
                ChangeType = "renamed",
                Severity = "medium",
                Timestamp = DateTime.UtcNow,
                MitreTechnique = "T1036.003" // Rename System Utilities
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR FIM] Error processing rename: {ex.Message}");
        }
    }

    private bool ShouldMonitorFile(string path)
    {
        var ext = Path.GetExtension(path).ToLowerInvariant();
        return SensitiveExtensions.Contains(ext) || 
               path.ToLowerInvariant().Contains("hosts") ||
               path.ToLowerInvariant().Contains("startup");
    }

    private async Task<string> ComputeFileHashAsync(string path)
    {
        try
        {
            // Wait for file to be unlocked
            await Task.Delay(100);
            
            using var sha256 = SHA256.Create();
            using var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
            var hash = await Task.Run(() => sha256.ComputeHash(stream));
            return Convert.ToHexString(hash);
        }
        catch
        {
            return "UNREADABLE";
        }
    }

    private string DetermineChangeSeverity(string path, string changeType)
    {
        var pathLower = path.ToLowerInvariant();

        // Critical: System drivers, hosts file
        if (pathLower.Contains(@"\drivers\") || pathLower.Contains("hosts"))
            return "critical";

        // High: Startup locations, PowerShell profiles
        if (pathLower.Contains("startup") || pathLower.Contains("powershell"))
            return "high";

        // High: New executables
        if (changeType == "created" && SensitiveExtensions.Contains(Path.GetExtension(path).ToLowerInvariant()))
            return "high";

        return "medium";
    }

    private string GetMitreTechniqueForPath(string path)
    {
        var pathLower = path.ToLowerInvariant();

        if (pathLower.Contains("startup"))
            return "T1547.001"; // Registry Run Keys / Startup Folder
        if (pathLower.Contains(@"\drivers\"))
            return "T1543.003"; // Windows Service
        if (pathLower.Contains("hosts"))
            return "T1565.001"; // Stored Data Manipulation
        if (pathLower.Contains("tasks"))
            return "T1053.005"; // Scheduled Task
        if (pathLower.Contains("grouppolicy"))
            return "T1484"; // Group Policy Modification

        return "T1565"; // Data Manipulation
    }

    private async Task ReportFileChangeAsync(FileIntegrityEvent fimEvent)
    {
        try
        {
            Console.WriteLine($"[XDR FIM] {fimEvent.Severity.ToUpper()}: {fimEvent.ChangeType} - {fimEvent.Path}");

            await _apiClient.SendSecurityEventAsync(new
            {
                action = "fim_alert",
                alert = new
                {
                    agent_id = _configService.Config.DeviceId,
                    user_id = _configService.Config.UserId,
                    event_type = "file_integrity",
                    severity = fimEvent.Severity,
                    path = fimEvent.Path,
                    previous_path = fimEvent.PreviousPath,
                    change_type = fimEvent.ChangeType,
                    new_hash = fimEvent.NewHash,
                    previous_hash = fimEvent.PreviousHash,
                    mitre_technique = fimEvent.MitreTechnique,
                    timestamp = fimEvent.Timestamp
                }
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR FIM] Failed to report: {ex.Message}");
        }
    }

    public async Task<int> CreateBaselineAsync()
    {
        int count = 0;
        _baseline.Clear();

        foreach (var dirPath in MonitoredDirectories)
        {
            if (!Directory.Exists(dirPath)) continue;

            try
            {
                foreach (var file in Directory.EnumerateFiles(dirPath, "*.*", SearchOption.AllDirectories))
                {
                    if (!ShouldMonitorFile(file)) continue;

                    try
                    {
                        var hash = await ComputeFileHashAsync(file);
                        var info = new FileInfo(file);
                        
                        _baseline[file.ToLowerInvariant()] = new FileBaseline
                        {
                            Path = file,
                            Hash = hash,
                            LastModified = info.LastWriteTimeUtc,
                            Size = info.Length
                        };
                        count++;
                    }
                    catch { }
                }
            }
            catch { }
        }

        SaveBaseline();
        Console.WriteLine($"[XDR FIM] Baseline created with {count} files");
        return count;
    }

    public void Dispose()
    {
        Stop();
    }
}

public class FileBaseline
{
    public string Path { get; set; } = "";
    public string Hash { get; set; } = "";
    public DateTime LastModified { get; set; }
    public long Size { get; set; }
}

public class FileIntegrityEvent
{
    public string Path { get; set; } = "";
    public string? PreviousPath { get; set; }
    public string ChangeType { get; set; } = "";
    public string? NewHash { get; set; }
    public string? PreviousHash { get; set; }
    public string Severity { get; set; } = "medium";
    public string? MitreTechnique { get; set; }
    public DateTime Timestamp { get; set; }
}
