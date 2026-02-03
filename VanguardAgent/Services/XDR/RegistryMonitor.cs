// =============================================================================
// Registry Monitor - XDR Threat Detection
// =============================================================================
// Monitors critical registry keys for persistence mechanisms and malware

using Microsoft.Win32;

namespace VanguardAgent.Services.XDR;

public class RegistryMonitor : IDisposable
{
    private readonly ConfigService _configService;
    private readonly ApiClient _apiClient;
    private readonly Dictionary<string, string> _baseline = new();
    private System.Threading.Timer? _scanTimer;
    private bool _isRunning;
    private readonly object _lock = new();

    // Critical registry paths for persistence
    private static readonly RegistryKeyInfo[] MonitoredKeys = new[]
    {
        // Run keys - Most common persistence
        new RegistryKeyInfo(RegistryHive.LocalMachine, @"SOFTWARE\Microsoft\Windows\CurrentVersion\Run", "T1547.001"),
        new RegistryKeyInfo(RegistryHive.LocalMachine, @"SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce", "T1547.001"),
        new RegistryKeyInfo(RegistryHive.CurrentUser, @"SOFTWARE\Microsoft\Windows\CurrentVersion\Run", "T1547.001"),
        new RegistryKeyInfo(RegistryHive.CurrentUser, @"SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce", "T1547.001"),
        
        // WoW64 Run keys
        new RegistryKeyInfo(RegistryHive.LocalMachine, @"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Run", "T1547.001"),
        
        // Services
        new RegistryKeyInfo(RegistryHive.LocalMachine, @"SYSTEM\CurrentControlSet\Services", "T1543.003"),
        
        // Winlogon
        new RegistryKeyInfo(RegistryHive.LocalMachine, @"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon", "T1547.004"),
        
        // Shell extensions
        new RegistryKeyInfo(RegistryHive.LocalMachine, @"SOFTWARE\Microsoft\Windows\CurrentVersion\Shell Extensions\Approved", "T1546.015"),
        
        // Image File Execution Options (Debugger hijacking)
        new RegistryKeyInfo(RegistryHive.LocalMachine, @"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Image File Execution Options", "T1546.012"),
        
        // AppInit DLLs
        new RegistryKeyInfo(RegistryHive.LocalMachine, @"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Windows", "T1546.010"),
        
        // COM Objects
        new RegistryKeyInfo(RegistryHive.LocalMachine, @"SOFTWARE\Classes\CLSID", "T1546.015"),
        
        // Scheduled Tasks (via registry)
        new RegistryKeyInfo(RegistryHive.LocalMachine, @"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Schedule\TaskCache\Tasks", "T1053.005"),
        
        // PowerShell profiles
        new RegistryKeyInfo(RegistryHive.LocalMachine, @"SOFTWARE\Microsoft\PowerShell\1\ShellIds\Microsoft.PowerShell", "T1546.013"),
        
        // Security settings
        new RegistryKeyInfo(RegistryHive.LocalMachine, @"SYSTEM\CurrentControlSet\Control\SecurityProviders", "T1556"),
        
        // LSA
        new RegistryKeyInfo(RegistryHive.LocalMachine, @"SYSTEM\CurrentControlSet\Control\Lsa", "T1547.002"),
    };

    // Event for AV Engine integration
    public event EventHandler<RegistryChangeEventArgs>? OnRegistryChanged;

    public RegistryMonitor(ConfigService configService, ApiClient apiClient)
    {
        _configService = configService;
        _apiClient = apiClient;
    }

    public Task StartAsync()
    {
        Start();
        return Task.CompletedTask;
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
            // Initial baseline
            CreateBaseline();

            // Periodic scan every 30 seconds
            _scanTimer = new System.Threading.Timer(ScanForChanges, null, TimeSpan.FromSeconds(30), TimeSpan.FromSeconds(30));

            Console.WriteLine("[XDR Registry] Registry monitoring started");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR Registry] Failed to start: {ex.Message}");
        }
    }

    public void Stop()
    {
        lock (_lock)
        {
            _isRunning = false;
        }

        _scanTimer?.Dispose();
        _scanTimer = null;

        Console.WriteLine("[XDR Registry] Monitoring stopped");
    }

    private void CreateBaseline()
    {
        _baseline.Clear();

        foreach (var keyInfo in MonitoredKeys)
        {
            try
            {
                var values = ReadRegistryValues(keyInfo.Hive, keyInfo.Path);
                foreach (var kvp in values)
                {
                    var key = $"{keyInfo.Hive}|{keyInfo.Path}|{kvp.Key}";
                    _baseline[key] = kvp.Value;
                }
            }
            catch { }
        }

        Console.WriteLine($"[XDR Registry] Baseline created with {_baseline.Count} values");
    }

    private async void ScanForChanges(object? state)
    {
        if (!_isRunning) return;

        try
        {
            var newValues = new Dictionary<string, string>();

            foreach (var keyInfo in MonitoredKeys)
            {
                try
                {
                    var values = ReadRegistryValues(keyInfo.Hive, keyInfo.Path);
                    foreach (var kvp in values)
                    {
                        var key = $"{keyInfo.Hive}|{keyInfo.Path}|{kvp.Key}";
                        newValues[key] = kvp.Value;

                        // Check for changes
                        if (_baseline.TryGetValue(key, out var oldValue))
                        {
                            if (oldValue != kvp.Value)
                            {
                                await ReportRegistryChangeAsync(new RegistryChangeEvent
                                {
                                    Hive = keyInfo.Hive.ToString(),
                                    Path = keyInfo.Path,
                                    ValueName = kvp.Key,
                                    OldValue = oldValue,
                                    NewValue = kvp.Value,
                                    ChangeType = "modified",
                                    MitreTechnique = keyInfo.MitreTechnique,
                                    Severity = DetermineSeverity(keyInfo.Path, kvp.Key)
                                });
                            }
                        }
                        else
                        {
                            // New value
                            await ReportRegistryChangeAsync(new RegistryChangeEvent
                            {
                                Hive = keyInfo.Hive.ToString(),
                                Path = keyInfo.Path,
                                ValueName = kvp.Key,
                                NewValue = kvp.Value,
                                ChangeType = "created",
                                MitreTechnique = keyInfo.MitreTechnique,
                                Severity = DetermineSeverity(keyInfo.Path, kvp.Key)
                            });
                        }
                    }
                }
                catch { }
            }

            // Check for deleted values
            foreach (var kvp in _baseline)
            {
                if (!newValues.ContainsKey(kvp.Key))
                {
                    var parts = kvp.Key.Split('|');
                    if (parts.Length == 3)
                    {
                        await ReportRegistryChangeAsync(new RegistryChangeEvent
                        {
                            Hive = parts[0],
                            Path = parts[1],
                            ValueName = parts[2],
                            OldValue = kvp.Value,
                            ChangeType = "deleted",
                            Severity = "medium"
                        });
                    }
                }
            }

            // Update baseline
            _baseline.Clear();
            foreach (var kvp in newValues)
                _baseline[kvp.Key] = kvp.Value;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR Registry] Scan error: {ex.Message}");
        }
    }

    private Dictionary<string, string> ReadRegistryValues(RegistryHive hive, string path)
    {
        var result = new Dictionary<string, string>();

        try
        {
            using var baseKey = RegistryKey.OpenBaseKey(hive, RegistryView.Registry64);
            using var key = baseKey.OpenSubKey(path);

            if (key == null) return result;

            // For services and other complex keys, we limit depth
            if (path.Contains("Services") || path.Contains("CLSID"))
            {
                // Just monitor subkey names for these large hives
                foreach (var subKeyName in key.GetSubKeyNames().Take(100))
                {
                    try
                    {
                        using var subKey = key.OpenSubKey(subKeyName);
                        var imagePath = subKey?.GetValue("ImagePath")?.ToString();
                        if (!string.IsNullOrEmpty(imagePath))
                        {
                            result[$"{subKeyName}\\ImagePath"] = imagePath;
                        }
                    }
                    catch { }
                }
            }
            else
            {
                foreach (var valueName in key.GetValueNames())
                {
                    try
                    {
                        var value = key.GetValue(valueName)?.ToString() ?? "";
                        result[valueName] = value.Length > 500 ? value.Substring(0, 500) : value;
                    }
                    catch { }
                }
            }
        }
        catch { }

        return result;
    }

    private string DetermineSeverity(string path, string valueName)
    {
        var pathLower = path.ToLowerInvariant();
        var valueNameLower = valueName.ToLowerInvariant();

        // Critical: Image File Execution Options, LSA
        if (pathLower.Contains("image file execution") || pathLower.Contains("\\lsa"))
            return "critical";

        // High: Run keys, Winlogon, Services with suspicious names
        if (pathLower.Contains("\\run") || pathLower.Contains("winlogon"))
            return "high";

        // Check for suspicious value content (done later when we have the value)
        return "medium";
    }

    private async Task ReportRegistryChangeAsync(RegistryChangeEvent regEvent)
    {
        try
        {
            Console.WriteLine($"[XDR Registry] {regEvent.Severity.ToUpper()}: {regEvent.ChangeType} - {regEvent.Path}\\{regEvent.ValueName}");

            // Raise event for AVEngine
            OnRegistryChanged?.Invoke(this, new RegistryChangeEventArgs
            {
                KeyPath = $"{regEvent.Hive}\\{regEvent.Path}",
                ValueName = regEvent.ValueName,
                OldValue = regEvent.OldValue,
                NewValue = regEvent.NewValue,
                ThreatType = $"Registry {regEvent.ChangeType}",
                MitreId = regEvent.MitreTechnique,
                ThreatLevel = regEvent.Severity switch
                {
                    "critical" => 100,
                    "high" => 75,
                    "medium" => 50,
                    _ => 25
                }
            });

            await _apiClient.SendSecurityEventAsync(new
            {
                action = "registry_alert",
                alert = new
                {
                    agent_id = _configService.Config.DeviceId,
                    user_id = _configService.Config.UserId,
                    event_type = "registry_change",
                    severity = regEvent.Severity,
                    hive = regEvent.Hive,
                    path = regEvent.Path,
                    value_name = regEvent.ValueName,
                    old_value = regEvent.OldValue,
                    new_value = regEvent.NewValue,
                    change_type = regEvent.ChangeType,
                    mitre_technique = regEvent.MitreTechnique,
                    timestamp = DateTime.UtcNow
                }
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR Registry] Failed to report: {ex.Message}");
        }
    }

    public void Dispose()
    {
        Stop();
    }
}

public class RegistryKeyInfo
{
    public RegistryHive Hive { get; }
    public string Path { get; }
    public string MitreTechnique { get; }

    public RegistryKeyInfo(RegistryHive hive, string path, string mitreTechnique)
    {
        Hive = hive;
        Path = path;
        MitreTechnique = mitreTechnique;
    }
}

public class RegistryChangeEvent
{
    public string Hive { get; set; } = "";
    public string Path { get; set; } = "";
    public string ValueName { get; set; } = "";
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string ChangeType { get; set; } = "";
    public string? MitreTechnique { get; set; }
    public string Severity { get; set; } = "medium";
}

public class RegistryChangeEventArgs : EventArgs
{
    public string KeyPath { get; set; } = "";
    public string ValueName { get; set; } = "";
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string? ThreatType { get; set; }
    public string? MitreId { get; set; }
    public int ThreatLevel { get; set; }
}
