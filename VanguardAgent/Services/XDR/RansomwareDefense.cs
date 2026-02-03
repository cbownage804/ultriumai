// =============================================================================
// Ransomware Defense - XDR Protection
// =============================================================================
// Provides ransomware-specific protections including:
// - Honeypot files for early detection
// - Rapid file encryption detection
// - Shadow copy protection
// - Auto-rollback capability

using System.Diagnostics;
using System.Security.Cryptography;

namespace VanguardAgent.Services.XDR;

public class RansomwareDefense : IDisposable
{
    private readonly ConfigService _configService;
    private readonly ApiClient _apiClient;
    private readonly List<FileSystemWatcher> _honeypotWatchers = new();
    private readonly Dictionary<string, EncryptionMetrics> _encryptionMetrics = new();
    private System.Threading.Timer? _metricsTimer;
    private bool _isRunning;
    private readonly object _lock = new();

    // Event for ransomware detection
    public event EventHandler<RansomwareEventArgs>? OnRansomwareDetected;

    // Honeypot file names (placed in user folders)
    private static readonly string[] HoneypotNames = new[]
    {
        "!IMPORTANT_BACKUP.docx",
        "_CONFIDENTIAL_DATA.xlsx",
        "~$FINANCIAL_RECORDS.pdf",
        "PASSWORDS_MASTER.txt",
        "BITCOIN_WALLET.dat"
    };

    // Ransomware file extensions
    private static readonly string[] RansomwareExtensions = new[]
    {
        ".encrypted", ".locked", ".crypto", ".crypt", ".enc",
        ".locky", ".cerber", ".zepto", ".thor", ".aesir",
        ".zzzzz", ".micro", ".wncry", ".wcry", ".wanna",
        ".cryptowall", ".exx", ".ecc", ".vvv", ".ccc",
        ".abc", ".aaa", ".xxx", ".ttt", ".odin", ".shit",
        ".rdmk", ".rmd", ".RDM", ".lockbit", ".BlackByte"
    };

    // Ransomware note patterns
    private static readonly string[] RansomNotePatterns = new[]
    {
        "README.*DECRYPT.*",
        "HOW.*RECOVER.*",
        "HOW.*DECRYPT.*",
        "DECRYPT.*INSTRUCTION.*",
        "_readme.txt",
        "HELP_DECRYPT.*",
        "!.*READ.*ME.*",
        "RESTORE.*FILES.*"
    };

    private readonly string _honeypotDir;
    private int _recentFileChanges = 0;
    private DateTime _metricsWindowStart = DateTime.UtcNow;

    public RansomwareDefense(ConfigService configService, ApiClient apiClient)
    {
        _configService = configService;
        _apiClient = apiClient;
        _honeypotDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
            "VanguardAgent", "Honeypots"
        );
    }

    public async Task StartAsync()
    {
        lock (_lock)
        {
            if (_isRunning) return;
            _isRunning = true;
        }

        try
        {
            // Protect shadow copies
            await ProtectShadowCopiesAsync();

            // Deploy honeypot files
            DeployHoneypots();

            // Start monitoring
            SetupHoneypotWatchers();
            SetupUserFolderWatchers();

            // Metrics timer - check for rapid encryption every 5 seconds
            _metricsTimer = new System.Threading.Timer(CheckEncryptionMetrics, null, 
                TimeSpan.FromSeconds(5), TimeSpan.FromSeconds(5));

            Console.WriteLine("[XDR Ransomware] Defense active");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR Ransomware] Failed to start: {ex.Message}");
        }
    }

    public void Stop()
    {
        lock (_lock)
        {
            _isRunning = false;
        }

        _metricsTimer?.Dispose();
        _metricsTimer = null;

        foreach (var watcher in _honeypotWatchers)
        {
            watcher.EnableRaisingEvents = false;
            watcher.Dispose();
        }
        _honeypotWatchers.Clear();

        Console.WriteLine("[XDR Ransomware] Defense stopped");
    }

    private async Task ProtectShadowCopiesAsync()
    {
        try
        {
            // Create a protective shadow copy
            var psi = new ProcessStartInfo
            {
                FileName = "wmic",
                Arguments = "shadowcopy call create Volume=C:\\",
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true
            };

            using var process = Process.Start(psi);
            await process!.WaitForExitAsync();

            Console.WriteLine("[XDR Ransomware] Shadow copy protection enabled");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR Ransomware] Shadow copy creation failed: {ex.Message}");
        }
    }

    private void DeployHoneypots()
    {
        try
        {
            // Create honeypot directory
            if (!Directory.Exists(_honeypotDir))
                Directory.CreateDirectory(_honeypotDir);

            // Deploy to common locations
            var locations = new[]
            {
                Environment.GetFolderPath(Environment.SpecialFolder.Desktop),
                Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                _honeypotDir
            };

            foreach (var location in locations)
            {
                if (string.IsNullOrEmpty(location) || !Directory.Exists(location)) continue;

                foreach (var name in HoneypotNames)
                {
                    var honeypotPath = Path.Combine(location, name);
                    
                    try
                    {
                        if (!File.Exists(honeypotPath))
                        {
                            // Create honeypot with decoy content
                            var content = GenerateHoneypotContent(name);
                            File.WriteAllText(honeypotPath, content);
                            
                            // Hide the file
                            File.SetAttributes(honeypotPath, 
                                FileAttributes.Hidden | FileAttributes.System | FileAttributes.ReadOnly);
                        }
                    }
                    catch { }
                }
            }

            Console.WriteLine($"[XDR Ransomware] Honeypot files deployed");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR Ransomware] Honeypot deployment failed: {ex.Message}");
        }
    }

    private string GenerateHoneypotContent(string filename)
    {
        // Generate realistic-looking but fake content
        var random = new Random();
        var sb = new System.Text.StringBuilder();

        if (filename.Contains("WALLET"))
        {
            sb.AppendLine("Bitcoin Wallet Backup");
            sb.AppendLine($"Address: 1{GenerateRandomString(33)}");
            sb.AppendLine($"Private Key: 5{GenerateRandomString(50)}");
        }
        else if (filename.Contains("PASSWORD"))
        {
            sb.AppendLine("Master Password List - CONFIDENTIAL");
            for (int i = 0; i < 20; i++)
            {
                sb.AppendLine($"Service{i}: user{random.Next(1000)} / {GenerateRandomString(16)}");
            }
        }
        else
        {
            sb.AppendLine("CONFIDENTIAL DOCUMENT");
            sb.AppendLine("Do not distribute without authorization");
            for (int i = 0; i < 100; i++)
            {
                sb.AppendLine(GenerateRandomString(80));
            }
        }

        return sb.ToString();
    }

    private string GenerateRandomString(int length)
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, length)
            .Select(s => s[random.Next(s.Length)]).ToArray());
    }

    private void SetupHoneypotWatchers()
    {
        var locations = new[]
        {
            Environment.GetFolderPath(Environment.SpecialFolder.Desktop),
            Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
            _honeypotDir
        };

        foreach (var location in locations)
        {
            if (string.IsNullOrEmpty(location) || !Directory.Exists(location)) continue;

            try
            {
                foreach (var name in HoneypotNames)
                {
                    var honeypotPath = Path.Combine(location, name);
                    if (!File.Exists(honeypotPath)) continue;

                    var watcher = new FileSystemWatcher(location, name)
                    {
                        NotifyFilter = NotifyFilters.LastWrite | NotifyFilters.Size | 
                                      NotifyFilters.FileName | NotifyFilters.Security,
                        EnableRaisingEvents = true
                    };

                    watcher.Changed += OnHoneypotAccessed;
                    watcher.Deleted += OnHoneypotAccessed;
                    watcher.Renamed += OnHoneypotRenamed;

                    _honeypotWatchers.Add(watcher);
                }
            }
            catch { }
        }
    }

    private void SetupUserFolderWatchers()
    {
        // Monitor user folders for rapid encryption
        var userFolders = new[]
        {
            Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
            Environment.GetFolderPath(Environment.SpecialFolder.Desktop),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Downloads")
        };

        foreach (var folder in userFolders)
        {
            if (string.IsNullOrEmpty(folder) || !Directory.Exists(folder)) continue;

            try
            {
                var watcher = new FileSystemWatcher(folder)
                {
                    IncludeSubdirectories = true,
                    NotifyFilter = NotifyFilters.FileName | NotifyFilters.LastWrite,
                    EnableRaisingEvents = true
                };

                watcher.Changed += OnUserFileChanged;
                watcher.Created += OnUserFileCreated;
                watcher.Renamed += OnUserFileRenamed;

                _honeypotWatchers.Add(watcher);
            }
            catch { }
        }
    }

    private async void OnHoneypotAccessed(object sender, FileSystemEventArgs e)
    {
        Console.WriteLine($"[XDR Ransomware] ALERT: Honeypot accessed - {e.FullPath}");

        await ReportRansomwareActivityAsync(new RansomwareAlert
        {
            AlertType = "honeypot_triggered",
            Severity = "critical",
            Description = $"Honeypot file was {e.ChangeType.ToString().ToLower()}",
            FilePath = e.FullPath,
            MitreTechnique = "T1486" // Data Encrypted for Impact
        });

        // Initiate emergency response
        await InitiateEmergencyResponseAsync("Honeypot file accessed - possible ransomware");
    }

    private async void OnHoneypotRenamed(object sender, RenamedEventArgs e)
    {
        Console.WriteLine($"[XDR Ransomware] ALERT: Honeypot renamed - {e.OldFullPath} -> {e.FullPath}");

        await ReportRansomwareActivityAsync(new RansomwareAlert
        {
            AlertType = "honeypot_triggered",
            Severity = "critical",
            Description = "Honeypot file was renamed (encryption indicator)",
            FilePath = e.FullPath,
            PreviousPath = e.OldFullPath,
            MitreTechnique = "T1486"
        });

        await InitiateEmergencyResponseAsync("Honeypot file renamed - active ransomware detected");
    }

    private void OnUserFileChanged(object sender, FileSystemEventArgs e)
    {
        Interlocked.Increment(ref _recentFileChanges);
        
        // Check for ransomware extension
        var ext = Path.GetExtension(e.FullPath).ToLowerInvariant();
        if (RansomwareExtensions.Contains(ext))
        {
            _ = ReportRansomwareActivityAsync(new RansomwareAlert
            {
                AlertType = "ransomware_extension",
                Severity = "critical",
                Description = $"File with known ransomware extension detected: {ext}",
                FilePath = e.FullPath,
                MitreTechnique = "T1486"
            });
        }
    }

    private void OnUserFileCreated(object sender, FileSystemEventArgs e)
    {
        var fileName = Path.GetFileName(e.FullPath);

        // Check for ransom notes
        foreach (var pattern in RansomNotePatterns)
        {
            if (System.Text.RegularExpressions.Regex.IsMatch(fileName, pattern, 
                System.Text.RegularExpressions.RegexOptions.IgnoreCase))
            {
                _ = ReportRansomwareActivityAsync(new RansomwareAlert
                {
                    AlertType = "ransom_note",
                    Severity = "critical",
                    Description = "Ransom note file detected",
                    FilePath = e.FullPath,
                    MitreTechnique = "T1486"
                });

                _ = InitiateEmergencyResponseAsync("Ransom note detected");
                break;
            }
        }
    }

    private void OnUserFileRenamed(object sender, RenamedEventArgs e)
    {
        Interlocked.Increment(ref _recentFileChanges);

        // Check if renamed to ransomware extension
        var newExt = Path.GetExtension(e.FullPath).ToLowerInvariant();
        if (RansomwareExtensions.Contains(newExt))
        {
            _ = ReportRansomwareActivityAsync(new RansomwareAlert
            {
                AlertType = "file_encrypted",
                Severity = "critical",
                Description = $"File encrypted with extension: {newExt}",
                FilePath = e.FullPath,
                PreviousPath = e.OldFullPath,
                MitreTechnique = "T1486"
            });
        }
    }

    private async void CheckEncryptionMetrics(object? state)
    {
        if (!_isRunning) return;

        try
        {
            var elapsed = (DateTime.UtcNow - _metricsWindowStart).TotalSeconds;

            if (elapsed >= 10)
            {
                var changesPerSecond = _recentFileChanges / elapsed;

                // Alert if more than 20 file changes per second (indicates mass encryption)
                if (changesPerSecond > 20)
                {
                    Console.WriteLine($"[XDR Ransomware] CRITICAL: Rapid file modification detected ({changesPerSecond:F1}/sec)");

                    await ReportRansomwareActivityAsync(new RansomwareAlert
                    {
                        AlertType = "rapid_encryption",
                        Severity = "critical",
                        Description = $"Mass file modification detected: {changesPerSecond:F1} files/sec",
                        MitreTechnique = "T1486"
                    });

                    await InitiateEmergencyResponseAsync($"Rapid encryption detected: {changesPerSecond:F1} files/sec");
                }

                // Reset metrics window
                _recentFileChanges = 0;
                _metricsWindowStart = DateTime.UtcNow;
            }
        }
        catch { }
    }

    private async Task InitiateEmergencyResponseAsync(string reason)
    {
        try
        {
            Console.WriteLine($"[XDR Ransomware] EMERGENCY RESPONSE: {reason}");

            // Raise event for AVEngine
            OnRansomwareDetected?.Invoke(this, new RansomwareEventArgs
            {
                Description = reason,
                FilesAffected = _recentFileChanges
            });

            // Attempt to create emergency shadow copy
            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = "wmic",
                    Arguments = "shadowcopy call create Volume=C:\\",
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                using var process = Process.Start(psi);
                await process!.WaitForExitAsync();
            }
            catch { }

            // Request AI analysis for remediation decision
            await _apiClient.SendSecurityEventAsync(new
            {
                action = "ransomware_emergency",
                emergency = new
                {
                    agent_id = _configService.Config.DeviceId,
                    user_id = _configService.Config.UserId,
                    reason = reason,
                    requires_immediate_action = true,
                    suggested_actions = new[]
                    {
                        "network_isolate",
                        "kill_suspicious_processes",
                        "create_forensic_snapshot"
                    },
                    timestamp = DateTime.UtcNow
                }
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR Ransomware] Emergency response failed: {ex.Message}");
        }
    }

    /// <summary>
    /// Terminate a process by ID
    /// </summary>
    public async Task TerminateProcessAsync(int processId)
    {
        try
        {
            using var process = Process.GetProcessById(processId);
            process.Kill(true);
            Console.WriteLine($"[XDR Ransomware] Terminated process {processId}");
            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR Ransomware] Failed to terminate process {processId}: {ex.Message}");
        }
    }

    public async Task RollbackFromShadowCopyAsync(string targetPath)
    {
        try
        {
            Console.WriteLine($"[XDR Ransomware] Initiating rollback for: {targetPath}");

            // Get available shadow copies
            var psi = new ProcessStartInfo
            {
                FileName = "vssadmin",
                Arguments = "list shadows",
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true
            };

            using var process = Process.Start(psi);
            var output = await process!.StandardOutput.ReadToEndAsync();
            await process.WaitForExitAsync();

            // Parse shadow copy paths and restore
            // This is a simplified version - production would need more robust parsing
            Console.WriteLine($"[XDR Ransomware] Available shadow copies:\n{output}");

            await _apiClient.SendSecurityEventAsync(new
            {
                action = "ransomware_rollback",
                rollback = new
                {
                    agent_id = _configService.Config.DeviceId,
                    target_path = targetPath,
                    status = "initiated",
                    timestamp = DateTime.UtcNow
                }
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR Ransomware] Rollback failed: {ex.Message}");
        }
    }

    private async Task ReportRansomwareActivityAsync(RansomwareAlert alert)
    {
        try
        {
            await _apiClient.SendSecurityEventAsync(new
            {
                action = "ransomware_alert",
                alert = new
                {
                    agent_id = _configService.Config.DeviceId,
                    user_id = _configService.Config.UserId,
                    event_type = alert.AlertType,
                    severity = alert.Severity,
                    description = alert.Description,
                    file_path = alert.FilePath,
                    previous_path = alert.PreviousPath,
                    mitre_technique = alert.MitreTechnique,
                    timestamp = DateTime.UtcNow
                }
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR Ransomware] Failed to report: {ex.Message}");
        }
    }

    public void Dispose()
    {
        Stop();
    }
}

public class RansomwareAlert
{
    public string AlertType { get; set; } = "";
    public string Severity { get; set; } = "medium";
    public string Description { get; set; } = "";
    public string? FilePath { get; set; }
    public string? PreviousPath { get; set; }
    public string? MitreTechnique { get; set; }
}

public class EncryptionMetrics
{
    public int FileChanges { get; set; }
    public DateTime WindowStart { get; set; }
}

public class RansomwareEventArgs : EventArgs
{
    public string Description { get; set; } = "";
    public int? ProcessId { get; set; }
    public string? ProcessName { get; set; }
    public int FilesAffected { get; set; }
}
