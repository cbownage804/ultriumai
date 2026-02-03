// =============================================================================
// Real-Time File Scanner - Hybrid AV Engine
// =============================================================================
// On-access scanning with custom signatures and YARA rules beyond Defender
// Integrates with Windows Defender while adding custom detection layers

using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using VanguardAgent.Services.XDR;

namespace VanguardAgent.Services.AV;

public class RealTimeScanner : IDisposable
{
    private readonly ConfigService _configService;
    private readonly ApiClient _apiClient;
    private readonly ThreatIntelligenceService _threatIntel;
    private readonly List<FileSystemWatcher> _watchers = new();
    private readonly ConcurrentDictionary<string, DateTime> _recentScans = new();
    private readonly ConcurrentQueue<ScanResult> _threatQueue = new();
    private readonly List<YaraRule> _yaraRules = new();
    private readonly List<CustomSignature> _customSignatures = new();
    
    private bool _isRunning;
    private readonly TimeSpan _scanCooldown = TimeSpan.FromSeconds(5);
    private readonly SemaphoreSlim _scanSemaphore = new(10); // Max concurrent scans
    
    // Statistics
    private long _filesScanned;
    private long _threatsDetected;
    private long _filesQuarantined;
    private DateTime _startTime;

    public event EventHandler<ThreatDetectedEventArgs>? OnThreatDetected;

    public RealTimeScanner(
        ConfigService configService, 
        ApiClient apiClient,
        ThreatIntelligenceService threatIntel)
    {
        _configService = configService;
        _apiClient = apiClient;
        _threatIntel = threatIntel;
    }

    public async Task StartAsync()
    {
        if (_isRunning) return;
        _isRunning = true;
        _startTime = DateTime.UtcNow;

        Console.WriteLine("[AV Scanner] Starting real-time file scanner...");

        // Load signatures and rules
        await LoadSignaturesAsync();
        await LoadYaraRulesAsync();

        // Monitor critical paths
        var monitoredPaths = new[]
        {
            Environment.GetFolderPath(Environment.SpecialFolder.UserProfile) + @"\Downloads",
            Environment.GetFolderPath(Environment.SpecialFolder.UserProfile) + @"\Desktop",
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            @"C:\Windows\Temp",
            Path.GetTempPath(),
            @"C:\ProgramData",
        };

        foreach (var path in monitoredPaths)
        {
            if (Directory.Exists(path))
            {
                CreateWatcher(path);
            }
        }

        // Start background threat processor
        _ = ProcessThreatQueueAsync();

        Console.WriteLine($"[AV Scanner] Monitoring {_watchers.Count} directories");
    }

    public void Stop()
    {
        _isRunning = false;
        foreach (var watcher in _watchers)
        {
            watcher.EnableRaisingEvents = false;
            watcher.Dispose();
        }
        _watchers.Clear();
        Console.WriteLine("[AV Scanner] Stopped");
    }

    private void CreateWatcher(string path)
    {
        try
        {
            var watcher = new FileSystemWatcher(path)
            {
                NotifyFilter = NotifyFilters.FileName | NotifyFilters.LastWrite | NotifyFilters.CreationTime,
                IncludeSubdirectories = true,
                EnableRaisingEvents = true
            };

            // High-risk extensions
            var extensions = new[] { "*.exe", "*.dll", "*.ps1", "*.bat", "*.cmd", "*.vbs", 
                                     "*.js", "*.msi", "*.scr", "*.pif", "*.com", "*.hta",
                                     "*.jar", "*.wsf", "*.lnk", "*.iso", "*.img" };

            foreach (var ext in extensions)
            {
                watcher.Filters.Add(ext);
            }

            watcher.Created += OnFileEvent;
            watcher.Changed += OnFileEvent;
            watcher.Renamed += OnFileRenamed;

            _watchers.Add(watcher);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[AV Scanner] Failed to watch {path}: {ex.Message}");
        }
    }

    private void OnFileEvent(object sender, FileSystemEventArgs e)
    {
        _ = ScanFileAsync(e.FullPath, e.ChangeType.ToString());
    }

    private void OnFileRenamed(object sender, RenamedEventArgs e)
    {
        _ = ScanFileAsync(e.FullPath, "Renamed");
    }

    public async Task<ScanResult> ScanFileAsync(string filePath, string trigger = "Manual")
    {
        var result = new ScanResult
        {
            FilePath = filePath,
            ScanTime = DateTime.UtcNow,
            Trigger = trigger
        };

        // Cooldown check
        if (_recentScans.TryGetValue(filePath, out var lastScan))
        {
            if (DateTime.UtcNow - lastScan < _scanCooldown)
            {
                result.Status = ScanStatus.Skipped;
                return result;
            }
        }
        _recentScans[filePath] = DateTime.UtcNow;

        await _scanSemaphore.WaitAsync();
        try
        {
            if (!File.Exists(filePath))
            {
                result.Status = ScanStatus.FileNotFound;
                return result;
            }

            Interlocked.Increment(ref _filesScanned);
            result.FileName = Path.GetFileName(filePath);

            // 1. Compute hashes
            result.SHA256 = await ComputeSHA256Async(filePath);
            result.MD5 = await ComputeMD5Async(filePath);
            result.FileSize = new FileInfo(filePath).Length;

            // 2. Check threat intelligence
            var tiResult = await _threatIntel.CheckHashAsync(result.SHA256, filePath);
            if (tiResult != null && tiResult.IsMalicious)
            {
                result.IsThreat = true;
                result.ThreatName = tiResult.ThreatType ?? "Malware";
                result.ThreatFamily = tiResult.ThreatFamily;
                result.Confidence = tiResult.Confidence;
                result.DetectionSource = "Threat Intelligence";
            }

            // 3. Check custom signatures
            if (!result.IsThreat)
            {
                var sigMatch = await CheckCustomSignaturesAsync(filePath, result.SHA256);
                if (sigMatch != null)
                {
                    result.IsThreat = true;
                    result.ThreatName = sigMatch.ThreatName;
                    result.DetectionSource = "Custom Signature";
                    result.Confidence = sigMatch.Confidence;
                }
            }

            // 4. YARA rules scan
            if (!result.IsThreat)
            {
                var yaraMatch = await ScanWithYaraAsync(filePath);
                if (yaraMatch != null)
                {
                    result.IsThreat = true;
                    result.ThreatName = yaraMatch.RuleName;
                    result.DetectionSource = "YARA Rule";
                    result.YaraRuleId = yaraMatch.RuleId;
                    result.Confidence = 85;
                }
            }

            // 5. Heuristic analysis
            if (!result.IsThreat)
            {
                var heuristic = await AnalyzeHeuristicsAsync(filePath);
                if (heuristic.IsSuspicious)
                {
                    result.IsThreat = heuristic.Confidence > 70;
                    result.IsSuspicious = true;
                    result.ThreatName = heuristic.Reason;
                    result.DetectionSource = "Heuristic Analysis";
                    result.Confidence = heuristic.Confidence;
                }
            }

            // 6. Check Defender status (integration)
            var defenderStatus = await CheckDefenderAsync(filePath);
            if (defenderStatus.IsThreat)
            {
                result.IsThreat = true;
                result.ThreatName = defenderStatus.ThreatName ?? result.ThreatName;
                result.DetectionSource = "Windows Defender";
                result.Confidence = Math.Max(result.Confidence, 95);
            }

            result.Status = result.IsThreat ? ScanStatus.ThreatFound : ScanStatus.Clean;

            if (result.IsThreat)
            {
                Interlocked.Increment(ref _threatsDetected);
                _threatQueue.Enqueue(result);
                OnThreatDetected?.Invoke(this, new ThreatDetectedEventArgs { Result = result });
            }

            return result;
        }
        catch (Exception ex)
        {
            result.Status = ScanStatus.Error;
            result.ErrorMessage = ex.Message;
            return result;
        }
        finally
        {
            _scanSemaphore.Release();
        }
    }

    public async Task<List<ScanResult>> ScanDirectoryAsync(string path, bool recursive = true)
    {
        var results = new List<ScanResult>();
        var options = recursive ? SearchOption.AllDirectories : SearchOption.TopDirectoryOnly;

        var extensions = new[] { ".exe", ".dll", ".ps1", ".bat", ".cmd", ".vbs", 
                                 ".js", ".msi", ".scr", ".pif", ".com", ".hta",
                                 ".jar", ".wsf", ".lnk" };

        try
        {
            var files = Directory.EnumerateFiles(path, "*.*", options)
                .Where(f => extensions.Contains(Path.GetExtension(f).ToLowerInvariant()));

            foreach (var file in files)
            {
                var result = await ScanFileAsync(file, "DirectoryScan");
                results.Add(result);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[AV Scanner] Directory scan error: {ex.Message}");
        }

        return results;
    }

    private async Task<string> ComputeSHA256Async(string filePath)
    {
        using var sha256 = SHA256.Create();
        using var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read, 81920, true);
        var hash = await Task.Run(() => sha256.ComputeHash(stream));
        return Convert.ToHexString(hash);
    }

    private async Task<string> ComputeMD5Async(string filePath)
    {
        using var md5 = MD5.Create();
        using var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read, 81920, true);
        var hash = await Task.Run(() => md5.ComputeHash(stream));
        return Convert.ToHexString(hash);
    }

    private async Task<CustomSignature?> CheckCustomSignaturesAsync(string filePath, string hash)
    {
        // Check hash-based signatures
        var hashSig = _customSignatures.FirstOrDefault(s => 
            s.Type == SignatureType.Hash && 
            (s.Value.Equals(hash, StringComparison.OrdinalIgnoreCase)));

        if (hashSig != null) return hashSig;

        // Check byte pattern signatures
        var patternSigs = _customSignatures.Where(s => s.Type == SignatureType.BytePattern);
        if (patternSigs.Any())
        {
            try
            {
                var fileBytes = await File.ReadAllBytesAsync(filePath);
                foreach (var sig in patternSigs)
                {
                    if (!string.IsNullOrEmpty(sig.Value))
                    {
                        var pattern = Convert.FromHexString(sig.Value.Replace(" ", ""));
                        if (ContainsPattern(fileBytes, pattern))
                        {
                            return sig;
                        }
                    }
                }
            }
            catch { }
        }

        return null;
    }

    private bool ContainsPattern(byte[] source, byte[] pattern)
    {
        for (int i = 0; i <= source.Length - pattern.Length; i++)
        {
            bool match = true;
            for (int j = 0; j < pattern.Length; j++)
            {
                if (source[i + j] != pattern[j])
                {
                    match = false;
                    break;
                }
            }
            if (match) return true;
        }
        return false;
    }

    private async Task<YaraMatch?> ScanWithYaraAsync(string filePath)
    {
        if (_yaraRules.Count == 0) return null;

        try
        {
            var content = await File.ReadAllTextAsync(filePath);
            var bytes = await File.ReadAllBytesAsync(filePath);
            var hexContent = Convert.ToHexString(bytes);

            foreach (var rule in _yaraRules.Where(r => r.IsActive))
            {
                // Simple pattern matching (real YARA would use libyara)
                foreach (var pattern in rule.Patterns)
                {
                    bool matched = pattern.Type switch
                    {
                        "string" => content.Contains(pattern.Value, StringComparison.OrdinalIgnoreCase),
                        "hex" => hexContent.Contains(pattern.Value.Replace(" ", ""), StringComparison.OrdinalIgnoreCase),
                        "regex" => Regex.IsMatch(content, pattern.Value, RegexOptions.IgnoreCase),
                        _ => false
                    };

                    if (matched)
                    {
                        return new YaraMatch
                        {
                            RuleId = rule.Id,
                            RuleName = rule.Name,
                            MatchedPattern = pattern.Value
                        };
                    }
                }
            }
        }
        catch { }

        return null;
    }

    private async Task<HeuristicResult> AnalyzeHeuristicsAsync(string filePath)
    {
        var result = new HeuristicResult();
        var suspicionScore = 0;
        var reasons = new List<string>();

        try
        {
            var ext = Path.GetExtension(filePath).ToLowerInvariant();

            // Check for double extensions
            var fileName = Path.GetFileName(filePath);
            if (Regex.IsMatch(fileName, @"\.(jpg|png|pdf|doc|txt)\.(exe|scr|bat|cmd|ps1)$", RegexOptions.IgnoreCase))
            {
                suspicionScore += 50;
                reasons.Add("Double extension disguise");
            }

            // Check for suspicious locations
            var tempPaths = new[] { Path.GetTempPath(), Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData) };
            if (ext == ".exe" && tempPaths.Any(t => filePath.StartsWith(t, StringComparison.OrdinalIgnoreCase)))
            {
                suspicionScore += 20;
                reasons.Add("Executable in temp/AppData");
            }

            // Read file content for analysis
            if (ext == ".ps1" || ext == ".bat" || ext == ".cmd" || ext == ".vbs")
            {
                var content = await File.ReadAllTextAsync(filePath);
                
                // Check for obfuscation patterns
                var obfuscationPatterns = new[]
                {
                    @"-[eE]nc(odedCommand)?", // Encoded PowerShell
                    @"FromBase64String",
                    @"\$\{.*\}", // Variable obfuscation
                    @"iex|Invoke-Expression",
                    @"Net\.WebClient",
                    @"DownloadString|DownloadFile",
                    @"Start-Process.*-WindowStyle\s*Hidden",
                    @"bypass|unrestricted", // Execution policy bypass
                };

                foreach (var pattern in obfuscationPatterns)
                {
                    if (Regex.IsMatch(content, pattern, RegexOptions.IgnoreCase))
                    {
                        suspicionScore += 15;
                        reasons.Add($"Suspicious pattern: {pattern.Replace(@"\", "")}");
                    }
                }

                // Check for high entropy (possible encoding/encryption)
                var entropy = CalculateEntropy(content);
                if (entropy > 5.5)
                {
                    suspicionScore += 25;
                    reasons.Add($"High entropy ({entropy:F2}) - possible obfuscation");
                }
            }

            // Check PE characteristics for executables
            if (ext == ".exe" || ext == ".dll")
            {
                var bytes = await File.ReadAllBytesAsync(filePath);
                
                // Check for packed/encrypted sections (high entropy)
                var entropy = CalculateEntropy(bytes);
                if (entropy > 7.0)
                {
                    suspicionScore += 30;
                    reasons.Add("Packed/encrypted executable");
                }

                // Check for suspicious imports
                var content = System.Text.Encoding.ASCII.GetString(bytes);
                var suspiciousImports = new[] { "VirtualAlloc", "WriteProcessMemory", "CreateRemoteThread", 
                                                "NtUnmapViewOfSection", "RtlCopyMemory" };
                foreach (var import in suspiciousImports)
                {
                    if (content.Contains(import))
                    {
                        suspicionScore += 10;
                        reasons.Add($"Suspicious import: {import}");
                    }
                }
            }

            result.IsSuspicious = suspicionScore > 30;
            result.Confidence = Math.Min(suspicionScore, 100);
            result.Reason = string.Join("; ", reasons);
        }
        catch (Exception ex)
        {
            result.ErrorMessage = ex.Message;
        }

        return result;
    }

    private double CalculateEntropy(string text) => CalculateEntropy(System.Text.Encoding.UTF8.GetBytes(text));

    private double CalculateEntropy(byte[] data)
    {
        if (data.Length == 0) return 0;

        var freq = new int[256];
        foreach (var b in data) freq[b]++;

        double entropy = 0;
        foreach (var f in freq)
        {
            if (f > 0)
            {
                double p = (double)f / data.Length;
                entropy -= p * Math.Log2(p);
            }
        }
        return entropy;
    }

    private async Task<DefenderResult> CheckDefenderAsync(string filePath)
    {
        var result = new DefenderResult();
        try
        {
            // Use MpCmdRun to scan file
            var psi = new System.Diagnostics.ProcessStartInfo
            {
                FileName = @"C:\Program Files\Windows Defender\MpCmdRun.exe",
                Arguments = $"-Scan -ScanType 3 -File \"{filePath}\"",
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = System.Diagnostics.Process.Start(psi);
            if (process != null)
            {
                var output = await process.StandardOutput.ReadToEndAsync();
                await process.WaitForExitAsync();

                result.IsThreat = output.Contains("found") || process.ExitCode == 2;
                if (result.IsThreat)
                {
                    // Extract threat name from output
                    var match = Regex.Match(output, @"Threat\s*:\s*(.+)");
                    result.ThreatName = match.Success ? match.Groups[1].Value.Trim() : "Detected by Defender";
                }
            }
        }
        catch { }

        return result;
    }

    private async Task LoadSignaturesAsync()
    {
        try
        {
            var response = await _apiClient.GetCustomSignaturesAsync();
            if (response?.Signatures != null)
            {
                _customSignatures.Clear();
                _customSignatures.AddRange(response.Signatures);
                Console.WriteLine($"[AV Scanner] Loaded {_customSignatures.Count} custom signatures");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[AV Scanner] Failed to load signatures: {ex.Message}");
        }
    }

    private async Task LoadYaraRulesAsync()
    {
        try
        {
            var response = await _apiClient.GetYaraRulesAsync();
            if (response?.Rules != null)
            {
                _yaraRules.Clear();
                _yaraRules.AddRange(response.Rules);
                Console.WriteLine($"[AV Scanner] Loaded {_yaraRules.Count} YARA rules");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[AV Scanner] Failed to load YARA rules: {ex.Message}");
        }
    }

    private async Task ProcessThreatQueueAsync()
    {
        while (_isRunning)
        {
            try
            {
                while (_threatQueue.TryDequeue(out var threat))
                {
                    await _apiClient.ReportThreatAsync(threat);
                }

                await Task.Delay(1000);
            }
            catch { }
        }
    }

    public async Task<bool> QuarantineFileAsync(string filePath)
    {
        try
        {
            var quarantinePath = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
                "VanguardAgent", "Quarantine"
            );
            Directory.CreateDirectory(quarantinePath);

            var quarantineFile = Path.Combine(quarantinePath, 
                $"{Path.GetFileName(filePath)}.{DateTime.UtcNow:yyyyMMddHHmmss}.vgq");

            // Encrypt and move to quarantine
            var fileBytes = await File.ReadAllBytesAsync(filePath);
            var encrypted = EncryptForQuarantine(fileBytes);
            await File.WriteAllBytesAsync(quarantineFile, encrypted);

            // Write metadata
            var metadata = new QuarantineMetadata
            {
                OriginalPath = filePath,
                QuarantineTime = DateTime.UtcNow,
                FileName = Path.GetFileName(filePath)
            };
            var metadataPath = quarantineFile + ".meta";
            await File.WriteAllTextAsync(metadataPath, System.Text.Json.JsonSerializer.Serialize(metadata));

            // Delete original
            File.Delete(filePath);

            Interlocked.Increment(ref _filesQuarantined);
            Console.WriteLine($"[AV Scanner] Quarantined: {filePath}");

            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[AV Scanner] Quarantine failed: {ex.Message}");
            return false;
        }
    }

    private byte[] EncryptForQuarantine(byte[] data)
    {
        // XOR with static key (real implementation would use proper encryption)
        var key = System.Text.Encoding.UTF8.GetBytes("VanguardQuarantine2024!");
        var result = new byte[data.Length];
        for (int i = 0; i < data.Length; i++)
        {
            result[i] = (byte)(data[i] ^ key[i % key.Length]);
        }
        return result;
    }

    public ScannerStats GetStats()
    {
        return new ScannerStats
        {
            FilesScanned = _filesScanned,
            ThreatsDetected = _threatsDetected,
            FilesQuarantined = _filesQuarantined,
            ActiveWatchers = _watchers.Count,
            YaraRulesLoaded = _yaraRules.Count,
            SignaturesLoaded = _customSignatures.Count,
            Uptime = DateTime.UtcNow - _startTime
        };
    }

    public void Dispose()
    {
        Stop();
        _scanSemaphore.Dispose();
    }
}

// Supporting classes

public class ScanResult
{
    public string FilePath { get; set; } = "";
    public string FileName { get; set; } = "";
    public DateTime ScanTime { get; set; }
    public string Trigger { get; set; } = "";
    public ScanStatus Status { get; set; }
    public bool IsThreat { get; set; }
    public bool IsSuspicious { get; set; }
    public string? ThreatName { get; set; }
    public string? ThreatFamily { get; set; }
    public string? DetectionSource { get; set; }
    public int Confidence { get; set; }
    public string SHA256 { get; set; } = "";
    public string MD5 { get; set; } = "";
    public long FileSize { get; set; }
    public string? YaraRuleId { get; set; }
    public string? ErrorMessage { get; set; }
}

public enum ScanStatus
{
    Clean,
    ThreatFound,
    Suspicious,
    Skipped,
    Error,
    FileNotFound
}

public class CustomSignature
{
    public string Id { get; set; } = "";
    public string ThreatName { get; set; } = "";
    public SignatureType Type { get; set; }
    public string Value { get; set; } = "";
    public int Confidence { get; set; } = 90;
}

public enum SignatureType
{
    Hash,
    BytePattern,
    String
}

public class YaraRule
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public bool IsActive { get; set; } = true;
    public List<YaraPattern> Patterns { get; set; } = new();
}

public class YaraPattern
{
    public string Type { get; set; } = "string"; // string, hex, regex
    public string Value { get; set; } = "";
}

public class YaraMatch
{
    public string RuleId { get; set; } = "";
    public string RuleName { get; set; } = "";
    public string MatchedPattern { get; set; } = "";
}

public class HeuristicResult
{
    public bool IsSuspicious { get; set; }
    public int Confidence { get; set; }
    public string Reason { get; set; } = "";
    public string? ErrorMessage { get; set; }
}

public class DefenderResult
{
    public bool IsThreat { get; set; }
    public string? ThreatName { get; set; }
}

public class QuarantineMetadata
{
    public string OriginalPath { get; set; } = "";
    public DateTime QuarantineTime { get; set; }
    public string FileName { get; set; } = "";
}

public class ScannerStats
{
    public long FilesScanned { get; set; }
    public long ThreatsDetected { get; set; }
    public long FilesQuarantined { get; set; }
    public int ActiveWatchers { get; set; }
    public int YaraRulesLoaded { get; set; }
    public int SignaturesLoaded { get; set; }
    public TimeSpan Uptime { get; set; }
}

public class ThreatDetectedEventArgs : EventArgs
{
    public ScanResult Result { get; set; } = new();
}
