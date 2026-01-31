// =============================================================================
// Real-Time Behavioral Monitor - XDR Threat Detection
// =============================================================================
// Uses WMI event subscriptions for lightweight process/service monitoring
// and reports suspicious activity to the XDR auto-remediation engine

using System.Diagnostics;
using System.Management;
using System.Text.RegularExpressions;
using Newtonsoft.Json;

namespace VanguardAgent.Services;

public class BehavioralMonitor : IDisposable
{
    private readonly ConfigService _configService;
    private readonly ApiClient _apiClient;
    private ManagementEventWatcher? _processCreateWatcher;
    private ManagementEventWatcher? _processDeleteWatcher;
    private bool _isRunning = false;
    private readonly object _lock = new();

    // Suspicious indicators
    private static readonly string[] SuspiciousProcessNames = new[]
    {
        "powershell.exe", "cmd.exe", "wscript.exe", "cscript.exe", "mshta.exe",
        "regsvr32.exe", "rundll32.exe", "certutil.exe", "bitsadmin.exe", "msiexec.exe"
    };

    private static readonly string[] SuspiciousCommandPatterns = new[]
    {
        @"-enc\s+", @"-encodedcommand", @"invoke-expression", @"iex\s*\(",
        @"downloadstring", @"downloadfile", @"webclient", @"net\.webclient",
        @"bypass", @"hidden", @"-nop", @"-noprofile", @"-windowstyle\s+hidden",
        @"base64", @"frombase64", @"reflection\.assembly", @"load\s*\("
    };

    private static readonly string[] C2Ports = new[] { "4444", "5555", "6666", "7777", "8888", "9999", "1337" };

    // Parent-child process relationships that are suspicious
    private static readonly Dictionary<string, string[]> UnusualParentChild = new()
    {
        ["winword.exe"] = new[] { "powershell.exe", "cmd.exe", "wscript.exe", "mshta.exe" },
        ["excel.exe"] = new[] { "powershell.exe", "cmd.exe", "wscript.exe", "mshta.exe" },
        ["outlook.exe"] = new[] { "powershell.exe", "cmd.exe", "wscript.exe" },
        ["explorer.exe"] = new[] { "powershell.exe" }, // Only if command is suspicious
        ["services.exe"] = new[] { "powershell.exe", "cmd.exe" },
        ["wmiprvse.exe"] = new[] { "powershell.exe", "cmd.exe" }
    };

    public BehavioralMonitor(ConfigService configService, ApiClient apiClient)
    {
        _configService = configService;
        _apiClient = apiClient;
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
            // Monitor process creation events
            var processCreateQuery = new WqlEventQuery(
                "__InstanceCreationEvent",
                TimeSpan.FromSeconds(1),
                "TargetInstance ISA 'Win32_Process'"
            );

            _processCreateWatcher = new ManagementEventWatcher(processCreateQuery);
            _processCreateWatcher.EventArrived += OnProcessCreated;
            _processCreateWatcher.Start();

            Console.WriteLine("[XDR Behavioral] Process monitoring started");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR Behavioral] Failed to start: {ex.Message}");
        }
    }

    public void Stop()
    {
        lock (_lock)
        {
            _isRunning = false;
        }

        _processCreateWatcher?.Stop();
        _processCreateWatcher?.Dispose();
        _processCreateWatcher = null;

        Console.WriteLine("[XDR Behavioral] Monitoring stopped");
    }

    private async void OnProcessCreated(object sender, EventArrivedEventArgs e)
    {
        try
        {
            var targetInstance = (ManagementBaseObject)e.NewEvent["TargetInstance"];
            
            var processInfo = new ProcessCreationEvent
            {
                ProcessId = Convert.ToInt32(targetInstance["ProcessId"]),
                ProcessName = targetInstance["Name"]?.ToString() ?? "",
                CommandLine = targetInstance["CommandLine"]?.ToString() ?? "",
                ExecutablePath = targetInstance["ExecutablePath"]?.ToString() ?? "",
                ParentProcessId = Convert.ToInt32(targetInstance["ParentProcessId"]),
                CreationTime = DateTime.UtcNow
            };

            // Get parent process name
            try
            {
                using var parentProc = Process.GetProcessById(processInfo.ParentProcessId);
                processInfo.ParentProcessName = parentProc.ProcessName + ".exe";
            }
            catch { }

            // Analyze the process for threats
            var analysis = AnalyzeProcess(processInfo);

            if (analysis.ThreatScore > 30) // Threshold for reporting
            {
                Console.WriteLine($"[XDR Behavioral] Suspicious: {processInfo.ProcessName} (Score: {analysis.ThreatScore})");
                
                // Report to XDR engine
                await ReportThreatAsync(processInfo, analysis);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR Behavioral] Error processing event: {ex.Message}");
        }
    }

    private ProcessAnalysis AnalyzeProcess(ProcessCreationEvent process)
    {
        var analysis = new ProcessAnalysis
        {
            Indicators = new List<ThreatIndicator>()
        };

        var processNameLower = process.ProcessName.ToLower();
        var commandLineLower = process.CommandLine?.ToLower() ?? "";
        var parentNameLower = process.ParentProcessName?.ToLower() ?? "";

        // Check for suspicious process names
        if (SuspiciousProcessNames.Any(p => processNameLower == p))
        {
            analysis.ThreatScore += 15;
            analysis.Indicators.Add(new ThreatIndicator
            {
                Type = "suspicious_process",
                Description = $"Known LOLBin: {process.ProcessName}",
                Severity = "medium",
                MitreTechnique = "T1059"
            });
        }

        // Check command line for suspicious patterns
        foreach (var pattern in SuspiciousCommandPatterns)
        {
            if (Regex.IsMatch(commandLineLower, pattern, RegexOptions.IgnoreCase))
            {
                analysis.ThreatScore += 25;
                analysis.Indicators.Add(new ThreatIndicator
                {
                    Type = "suspicious_command",
                    Description = $"Pattern match: {pattern}",
                    Severity = "high",
                    MitreTechnique = "T1059.001"
                });
                break; // Only count once
            }
        }

        // Check for base64 encoded commands
        if (commandLineLower.Contains("-enc") || commandLineLower.Contains("-encodedcommand"))
        {
            analysis.ThreatScore += 35;
            analysis.Indicators.Add(new ThreatIndicator
            {
                Type = "encoded_command",
                Description = "Base64 encoded PowerShell command detected",
                Severity = "high",
                MitreTechnique = "T1027"
            });
        }

        // Check for unusual parent-child relationships
        if (!string.IsNullOrEmpty(parentNameLower) && UnusualParentChild.ContainsKey(parentNameLower))
        {
            if (UnusualParentChild[parentNameLower].Any(c => processNameLower == c))
            {
                analysis.ThreatScore += 30;
                analysis.Indicators.Add(new ThreatIndicator
                {
                    Type = "unusual_parent_child",
                    Description = $"Suspicious spawn: {process.ParentProcessName} -> {process.ProcessName}",
                    Severity = "high",
                    MitreTechnique = "T1055"
                });
            }
        }

        // Check for process masquerading (wrong path for system process)
        if (processNameLower == "svchost.exe" && 
            !process.ExecutablePath?.ToLower().Contains(@"windows\system32") == true)
        {
            analysis.ThreatScore += 50;
            analysis.Indicators.Add(new ThreatIndicator
            {
                Type = "process_masquerading",
                Description = "svchost.exe running from non-system location",
                Severity = "critical",
                MitreTechnique = "T1036"
            });
        }

        // Check for very long command lines (potential payload)
        if (process.CommandLine?.Length > 1000)
        {
            analysis.ThreatScore += 15;
            analysis.Indicators.Add(new ThreatIndicator
            {
                Type = "long_command_line",
                Description = $"Unusually long command ({process.CommandLine.Length} chars)",
                Severity = "medium",
                MitreTechnique = "T1059"
            });
        }

        // Determine overall severity and confidence
        analysis.Severity = analysis.ThreatScore switch
        {
            >= 80 => "critical",
            >= 60 => "high",
            >= 40 => "medium",
            _ => "low"
        };

        analysis.Confidence = Math.Min(95, 50 + analysis.ThreatScore);

        return analysis;
    }

    private async Task ReportThreatAsync(ProcessCreationEvent process, ProcessAnalysis analysis)
    {
        try
        {
            var threatData = new
            {
                action = "process_threat",
                threat = new
                {
                    agent_id = _configService.Config.DeviceId,
                    user_id = _configService.Config.UserId,
                    threat_type = GetThreatType(analysis),
                    severity = analysis.Severity,
                    confidence = analysis.Confidence,
                    affected_process = new
                    {
                        name = process.ProcessName,
                        pid = process.ProcessId,
                        path = process.ExecutablePath,
                        command_line = process.CommandLine?.Length > 500 
                            ? process.CommandLine.Substring(0, 500) + "..." 
                            : process.CommandLine,
                        parent_process = process.ParentProcessName,
                        parent_pid = process.ParentProcessId
                    },
                    mitre_tactics = analysis.Indicators
                        .Where(i => !string.IsNullOrEmpty(i.MitreTechnique))
                        .Select(i => i.MitreTechnique)
                        .Distinct()
                        .ToArray(),
                    raw_indicators = analysis.Indicators
                }
            };

            // Send to XDR auto-remediation engine
            await _apiClient.SendSecurityEventAsync(threatData);
            
            Console.WriteLine($"[XDR Behavioral] Threat reported: {analysis.Severity} - {GetThreatType(analysis)}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR Behavioral] Failed to report threat: {ex.Message}");
        }
    }

    private string GetThreatType(ProcessAnalysis analysis)
    {
        if (analysis.Indicators.Any(i => i.Type == "process_masquerading"))
            return "Process Masquerading";
        if (analysis.Indicators.Any(i => i.Type == "encoded_command"))
            return "Encoded Command Execution";
        if (analysis.Indicators.Any(i => i.Type == "unusual_parent_child"))
            return "Suspicious Process Chain";
        if (analysis.Indicators.Any(i => i.Type == "suspicious_command"))
            return "Suspicious Command Pattern";
        return "Suspicious Process Activity";
    }

    public void Dispose()
    {
        Stop();
    }
}

public class ProcessCreationEvent
{
    public int ProcessId { get; set; }
    public string ProcessName { get; set; } = "";
    public string? CommandLine { get; set; }
    public string? ExecutablePath { get; set; }
    public int ParentProcessId { get; set; }
    public string? ParentProcessName { get; set; }
    public DateTime CreationTime { get; set; }
}

public class ProcessAnalysis
{
    public int ThreatScore { get; set; }
    public string Severity { get; set; } = "low";
    public int Confidence { get; set; }
    public List<ThreatIndicator> Indicators { get; set; } = new();
}

public class ThreatIndicator
{
    public string Type { get; set; } = "";
    public string Description { get; set; } = "";
    public string Severity { get; set; } = "low";
    public string? MitreTechnique { get; set; }
}
