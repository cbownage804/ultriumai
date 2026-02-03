// =============================================================================
// AV Engine Orchestrator - Unified Security Engine
// =============================================================================
// Coordinates all AV/XDR components for unified threat detection and response
// Integrates with Windows Defender while adding advanced detection layers

using VanguardAgent.Services.XDR;

namespace VanguardAgent.Services.AV;

public class AVEngine : IDisposable
{
    private readonly ConfigService _configService;
    private readonly ApiClient _apiClient;
    
    // Core AV Components
    public RealTimeScanner FileScanner { get; }
    public MemoryScanner MemoryScanner { get; }
    public ScriptAnalyzer ScriptAnalyzer { get; }
    public USBController USBController { get; }
    
    // XDR Components
    public ThreatIntelligenceService ThreatIntel { get; }
    public FileIntegrityMonitor FIMMonitor { get; }
    public RegistryMonitor RegistryMonitor { get; }
    public NetworkMonitor NetworkMonitor { get; }
    public RansomwareDefense RansomwareDefense { get; }
    public ForensicsCollector ForensicsCollector { get; }
    
    private bool _isRunning;
    private readonly CancellationTokenSource _cts = new();
    
    // Unified threat queue
    private readonly System.Collections.Concurrent.ConcurrentQueue<UnifiedThreat> _threatQueue = new();

    public event EventHandler<UnifiedThreat>? OnThreatDetected;
    public event EventHandler<string>? OnStatusChanged;

    public AVEngine(ConfigService configService, ApiClient apiClient)
    {
        _configService = configService;
        _apiClient = apiClient;

        // Initialize threat intelligence first (used by other components)
        ThreatIntel = new ThreatIntelligenceService(configService, apiClient);

        // Initialize AV components
        FileScanner = new RealTimeScanner(configService, apiClient, ThreatIntel);
        MemoryScanner = new MemoryScanner(apiClient);
        ScriptAnalyzer = new ScriptAnalyzer(apiClient);
        USBController = new USBController(configService, apiClient, FileScanner);

        // Initialize XDR components
        FIMMonitor = new FileIntegrityMonitor(configService, apiClient);
        RegistryMonitor = new RegistryMonitor(configService, apiClient);
        NetworkMonitor = new NetworkMonitor(configService, apiClient, ThreatIntel);
        RansomwareDefense = new RansomwareDefense(configService, apiClient);
        ForensicsCollector = new ForensicsCollector(configService, apiClient);

        // Wire up events
        WireEvents();
    }

    private void WireEvents()
    {
        // File scanner threats
        FileScanner.OnThreatDetected += (s, e) =>
        {
            var threat = new UnifiedThreat
            {
                Source = "File Scanner",
                Type = ThreatType.Malware,
                Severity = MapSeverity(e.Result.Confidence),
                Title = e.Result.ThreatName ?? "Unknown Malware",
                Description = $"Malicious file detected: {e.Result.FileName}",
                FilePath = e.Result.FilePath,
                SHA256 = e.Result.SHA256,
                DetectionSource = e.Result.DetectionSource,
                MitreId = null,
                Timestamp = DateTime.UtcNow
            };
            HandleThreat(threat);
        };

        // Memory scanner threats
        MemoryScanner.OnThreatDetected += (s, e) =>
        {
            var threat = new UnifiedThreat
            {
                Source = "Memory Scanner",
                Type = ThreatType.InMemoryThreat,
                Severity = MapSeverity(e.Threat.Severity),
                Title = e.Threat.ThreatName,
                Description = $"In-memory threat in process {e.Threat.ProcessName} (PID: {e.Threat.ProcessId})",
                ProcessId = e.Threat.ProcessId,
                ProcessName = e.Threat.ProcessName,
                MemoryAddress = e.Threat.MemoryAddress,
                MitreId = e.Threat.MitreId,
                Timestamp = DateTime.UtcNow
            };
            HandleThreat(threat);
        };

        // Script analyzer threats
        ScriptAnalyzer.OnThreatDetected += (s, e) =>
        {
            var threat = new UnifiedThreat
            {
                Source = "Script Analyzer",
                Type = ThreatType.MaliciousScript,
                Severity = MapSeverity(e.Result.ThreatLevel),
                Title = e.Result.MatchedRules.FirstOrDefault()?.Name ?? "Malicious Script",
                Description = $"Malicious script detected with {e.Result.MatchedRules.Count} rule matches",
                FilePath = e.Result.FilePath,
                PredictedBehaviors = e.Result.PredictedBehaviors,
                ExtractedIOCs = e.Result.ExtractedIOCs.Select(i => i.Value).ToList(),
                MitreId = e.Result.MatchedRules.FirstOrDefault()?.MitreId,
                Timestamp = DateTime.UtcNow
            };
            HandleThreat(threat);
        };

        // USB threats
        USBController.OnThreatDetected += (s, e) =>
        {
            var threat = new UnifiedThreat
            {
                Source = "USB Controller",
                Type = ThreatType.RemovableMedia,
                Severity = UnifiedSeverity.High,
                Title = $"USB Threat: {e.Threat.ThreatName}",
                Description = $"Malware found on USB device: {e.Device.FriendlyName}",
                FilePath = e.Threat.FilePath,
                SHA256 = e.Threat.SHA256,
                DeviceInfo = $"{e.Device.VendorId}:{e.Device.ProductId}",
                Timestamp = DateTime.UtcNow
            };
            HandleThreat(threat);
        };

        // FIM alerts
        FIMMonitor.FileChanged += (s, e) =>
        {
            if (e.IsSuspicious)
            {
                var threat = new UnifiedThreat
                {
                    Source = "File Integrity Monitor",
                    Type = ThreatType.FileIntegrity,
                    Severity = UnifiedSeverity.Medium,
                    Title = "Critical File Modified",
                    Description = $"Critical file {e.FileName} was modified",
                    FilePath = e.FilePath,
                    ChangeType = e.ChangeType,
                    OldHash = e.OldHash,
                    NewHash = e.NewHash,
                    MitreId = "T1565",
                    Timestamp = DateTime.UtcNow
                };
                HandleThreat(threat);
            }
        };

        // Registry monitor alerts
        RegistryMonitor.OnRegistryChanged += (s, e) =>
        {
            var threat = new UnifiedThreat
            {
                Source = "Registry Monitor",
                Type = ThreatType.RegistryModification,
                Severity = MapSeverity(e.ThreatLevel),
                Title = e.ThreatType ?? "Suspicious Registry Change",
                Description = $"Registry key modified: {e.KeyPath}\\{e.ValueName}",
                RegistryKey = e.KeyPath,
                RegistryValue = e.ValueName,
                OldValue = e.OldValue,
                NewValue = e.NewValue,
                MitreId = e.MitreId,
                Timestamp = DateTime.UtcNow
            };
            HandleThreat(threat);
        };

        // Network monitor alerts
        NetworkMonitor.OnSuspiciousConnection += (s, e) =>
        {
            var threat = new UnifiedThreat
            {
                Source = "Network Monitor",
                Type = ThreatType.NetworkThreat,
                Severity = MapSeverity(e.Severity),
                Title = e.ThreatType ?? "Suspicious Network Activity",
                Description = $"Suspicious connection to {e.RemoteAddress}:{e.RemotePort}",
                ProcessId = e.ProcessId,
                ProcessName = e.ProcessName,
                RemoteAddress = e.RemoteAddress,
                RemotePort = e.RemotePort,
                MitreId = e.MitreId,
                Timestamp = DateTime.UtcNow
            };
            HandleThreat(threat);
        };

        // Ransomware defense alerts
        RansomwareDefense.OnRansomwareDetected += (s, e) =>
        {
            var threat = new UnifiedThreat
            {
                Source = "Ransomware Defense",
                Type = ThreatType.Ransomware,
                Severity = UnifiedSeverity.Critical,
                Title = "RANSOMWARE DETECTED",
                Description = e.Description,
                ProcessId = e.ProcessId,
                ProcessName = e.ProcessName,
                FilesAffected = e.FilesAffected,
                MitreId = "T1486",
                Timestamp = DateTime.UtcNow
            };
            HandleThreat(threat);
        };
    }

    public async Task StartAsync()
    {
        if (_isRunning) return;
        _isRunning = true;

        Console.WriteLine("[AV Engine] Starting Vanguard Pursuit AV/XDR Engine...");
        OnStatusChanged?.Invoke(this, "Starting");

        try
        {
            // Initialize in parallel where possible
            await ThreatIntel.InitializeAsync();

            var tasks = new List<Task>
            {
                FileScanner.StartAsync(),
                MemoryScanner.InitializeAsync(),
                USBController.StartAsync(),
                FIMMonitor.StartAsync(),
                RegistryMonitor.StartAsync(),
                NetworkMonitor.StartAsync(),
                RansomwareDefense.StartAsync()
            };

            await Task.WhenAll(tasks);

            // Start background processing
            _ = ProcessThreatQueueAsync(_cts.Token);
            _ = PeriodicMemoryScanAsync(_cts.Token);

            Console.WriteLine("[AV Engine] All components started successfully");
            OnStatusChanged?.Invoke(this, "Running");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[AV Engine] Startup failed: {ex.Message}");
            OnStatusChanged?.Invoke(this, "Error");
            throw;
        }
    }

    public void Stop()
    {
        if (!_isRunning) return;
        _isRunning = false;

        Console.WriteLine("[AV Engine] Stopping...");
        OnStatusChanged?.Invoke(this, "Stopping");

        _cts.Cancel();

        FileScanner.Stop();
        USBController.Stop();
        FIMMonitor.Stop();
        RegistryMonitor.Stop();
        NetworkMonitor.Stop();
        RansomwareDefense.Stop();

        Console.WriteLine("[AV Engine] Stopped");
        OnStatusChanged?.Invoke(this, "Stopped");
    }

    private void HandleThreat(UnifiedThreat threat)
    {
        _threatQueue.Enqueue(threat);
        OnThreatDetected?.Invoke(this, threat);

        // Critical threats get immediate action
        if (threat.Severity == UnifiedSeverity.Critical)
        {
            _ = HandleCriticalThreatAsync(threat);
        }
    }

    private async Task HandleCriticalThreatAsync(UnifiedThreat threat)
    {
        Console.WriteLine($"[AV Engine] CRITICAL: {threat.Title}");

        // Collect forensics immediately
        await ForensicsCollector.CollectSnapshotAsync("Critical threat detected");

        // Report to backend
        await _apiClient.ReportCriticalThreatAsync(threat);

        // Take automated action based on threat type
        switch (threat.Type)
        {
            case ThreatType.Ransomware:
                // Kill process immediately
                if (threat.ProcessId.HasValue)
                {
                    await RansomwareDefense.TerminateProcessAsync(threat.ProcessId.Value);
                }
                break;

            case ThreatType.InMemoryThreat:
                // Terminate infected process
                if (threat.ProcessId.HasValue)
                {
                    await MemoryScanner.TerminateInfectedProcessAsync(threat.ProcessId.Value);
                }
                break;

            case ThreatType.NetworkThreat:
                // Block connection
                if (!string.IsNullOrEmpty(threat.RemoteAddress))
                {
                    await NetworkMonitor.BlockIPAsync(threat.RemoteAddress);
                }
                break;
        }
    }

    private async Task ProcessThreatQueueAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                while (_threatQueue.TryDequeue(out var threat))
                {
                    await _apiClient.ReportUnifiedThreatAsync(threat);
                }

                await Task.Delay(1000, ct);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AV Engine] Queue processing error: {ex.Message}");
            }
        }
    }

    private async Task PeriodicMemoryScanAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                // Wait for 30 minutes between scans
                await Task.Delay(TimeSpan.FromMinutes(30), ct);

                Console.WriteLine("[AV Engine] Starting periodic memory scan...");
                var report = await MemoryScanner.ScanAllProcessesAsync();
                Console.WriteLine($"[AV Engine] Memory scan complete: {report.ProcessesScanned} processes, {report.TotalThreats} threats");
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AV Engine] Periodic scan error: {ex.Message}");
            }
        }
    }

    public async Task<FullScanReport> RunFullScanAsync()
    {
        Console.WriteLine("[AV Engine] Starting full system scan...");
        OnStatusChanged?.Invoke(this, "Full Scan");

        var report = new FullScanReport
        {
            StartTime = DateTime.UtcNow
        };

        // Scan all drives
        var drives = DriveInfo.GetDrives()
            .Where(d => d.DriveType == DriveType.Fixed && d.IsReady);

        foreach (var drive in drives)
        {
            var results = await FileScanner.ScanDirectoryAsync(drive.RootDirectory.FullName, recursive: true);
            report.FileThreats.AddRange(results.Where(r => r.IsThreat));
            report.FilesScanned += results.Count;
        }

        // Full memory scan
        var memoryReport = await MemoryScanner.ScanAllProcessesAsync();
        report.MemoryThreats.AddRange(memoryReport.Threats);
        report.ProcessesScanned = memoryReport.ProcessesScanned;

        report.EndTime = DateTime.UtcNow;
        report.TotalThreats = report.FileThreats.Count + report.MemoryThreats.Count;

        Console.WriteLine($"[AV Engine] Full scan complete: {report.FilesScanned} files, {report.TotalThreats} threats");
        OnStatusChanged?.Invoke(this, "Running");

        return report;
    }

    public async Task<QuickScanReport> RunQuickScanAsync()
    {
        Console.WriteLine("[AV Engine] Starting quick scan...");
        OnStatusChanged?.Invoke(this, "Quick Scan");

        var report = new QuickScanReport
        {
            StartTime = DateTime.UtcNow
        };

        // Scan high-risk locations
        var paths = new[]
        {
            Environment.GetFolderPath(Environment.SpecialFolder.UserProfile) + @"\Downloads",
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            Environment.GetFolderPath(Environment.SpecialFolder.Startup),
            Path.GetTempPath()
        };

        foreach (var path in paths.Where(Directory.Exists))
        {
            var results = await FileScanner.ScanDirectoryAsync(path, recursive: true);
            report.Threats.AddRange(results.Where(r => r.IsThreat));
            report.FilesScanned += results.Count;
        }

        report.EndTime = DateTime.UtcNow;

        Console.WriteLine($"[AV Engine] Quick scan complete: {report.FilesScanned} files, {report.Threats.Count} threats");
        OnStatusChanged?.Invoke(this, "Running");

        return report;
    }

    public AVEngineStats GetStats()
    {
        return new AVEngineStats
        {
            IsRunning = _isRunning,
            FileScanner = FileScanner.GetStats(),
            MemoryScanner = MemoryScanner.GetStats(),
            ScriptAnalyzer = ScriptAnalyzer.GetStats(),
            USBController = USBController.GetStats(),
            ThreatIntel = ThreatIntel.GetStats()
        };
    }

    private UnifiedSeverity MapSeverity(int confidence)
    {
        return confidence switch
        {
            >= 90 => UnifiedSeverity.Critical,
            >= 70 => UnifiedSeverity.High,
            >= 50 => UnifiedSeverity.Medium,
            _ => UnifiedSeverity.Low
        };
    }

    private UnifiedSeverity MapSeverity(ThreatSeverity severity)
    {
        return severity switch
        {
            ThreatSeverity.Critical => UnifiedSeverity.Critical,
            ThreatSeverity.High => UnifiedSeverity.High,
            ThreatSeverity.Medium => UnifiedSeverity.Medium,
            _ => UnifiedSeverity.Low
        };
    }

    private UnifiedSeverity MapSeverity(ScriptSeverity severity)
    {
        return severity switch
        {
            ScriptSeverity.Critical => UnifiedSeverity.Critical,
            ScriptSeverity.High => UnifiedSeverity.High,
            ScriptSeverity.Medium => UnifiedSeverity.Medium,
            _ => UnifiedSeverity.Low
        };
    }

    private UnifiedSeverity MapSeverity(string severity)
    {
        return severity?.ToLower() switch
        {
            "critical" => UnifiedSeverity.Critical,
            "high" => UnifiedSeverity.High,
            "medium" => UnifiedSeverity.Medium,
            "low" => UnifiedSeverity.Low,
            _ => UnifiedSeverity.Medium
        };
    }

    public void Dispose()
    {
        Stop();
        _cts.Dispose();
        FileScanner.Dispose();
        USBController.Dispose();
    }
}

// Unified threat model

public enum ThreatType
{
    Malware,
    InMemoryThreat,
    MaliciousScript,
    RemovableMedia,
    FileIntegrity,
    RegistryModification,
    NetworkThreat,
    Ransomware
}

public enum UnifiedSeverity
{
    Low,
    Medium,
    High,
    Critical
}

public class UnifiedThreat
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Source { get; set; } = "";
    public ThreatType Type { get; set; }
    public UnifiedSeverity Severity { get; set; }
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public DateTime Timestamp { get; set; }

    // File-related
    public string? FilePath { get; set; }
    public string? SHA256 { get; set; }
    public string? DetectionSource { get; set; }

    // Process-related
    public int? ProcessId { get; set; }
    public string? ProcessName { get; set; }
    public string? MemoryAddress { get; set; }

    // Registry-related
    public string? RegistryKey { get; set; }
    public string? RegistryValue { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }

    // Network-related
    public string? RemoteAddress { get; set; }
    public int? RemotePort { get; set; }

    // Device-related
    public string? DeviceInfo { get; set; }

    // File integrity
    public string? ChangeType { get; set; }
    public string? OldHash { get; set; }
    public string? NewHash { get; set; }

    // Script-related
    public List<string>? PredictedBehaviors { get; set; }
    public List<string>? ExtractedIOCs { get; set; }

    // Ransomware-related
    public int? FilesAffected { get; set; }

    // MITRE ATT&CK
    public string? MitreId { get; set; }
}

public class FullScanReport
{
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public long FilesScanned { get; set; }
    public int ProcessesScanned { get; set; }
    public int TotalThreats { get; set; }
    public List<ScanResult> FileThreats { get; set; } = new();
    public List<MemoryThreat> MemoryThreats { get; set; } = new();
}

public class QuickScanReport
{
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public long FilesScanned { get; set; }
    public List<ScanResult> Threats { get; set; } = new();
}

public class AVEngineStats
{
    public bool IsRunning { get; set; }
    public ScannerStats FileScanner { get; set; } = new();
    public MemoryScannerStats MemoryScanner { get; set; } = new();
    public ScriptAnalyzerStats ScriptAnalyzer { get; set; } = new();
    public USBControllerStats USBController { get; set; } = new();
    public ThreatIntelStats ThreatIntel { get; set; } = new();
}
