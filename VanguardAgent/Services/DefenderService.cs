// =============================================================================
// Windows Defender Integration Service
// =============================================================================
// Queries Windows Security Center for Defender status, threats, and scan control
// =============================================================================

using System.Diagnostics;
using System.Management;
using Newtonsoft.Json;

namespace VanguardAgent.Services;

public class DefenderService
{
    /// <summary>
    /// Get comprehensive Windows Defender status using PowerShell
    /// </summary>
    public async Task<DefenderStatus> GetStatusAsync()
    {
        var status = new DefenderStatus();

        try
        {
            // Use PowerShell to get Defender status (more reliable than WMI)
            var script = @"
                $status = Get-MpComputerStatus | Select-Object -Property `
                    AMServiceEnabled, `
                    AntispywareEnabled, `
                    AntivirusEnabled, `
                    BehaviorMonitorEnabled, `
                    IoavProtectionEnabled, `
                    NISEnabled, `
                    OnAccessProtectionEnabled, `
                    RealTimeProtectionEnabled, `
                    AMProductVersion, `
                    AMEngineVersion, `
                    AntispywareSignatureVersion, `
                    AntispywareSignatureLastUpdated, `
                    AntivirusSignatureVersion, `
                    AntivirusSignatureLastUpdated, `
                    FullScanEndTime, `
                    QuickScanEndTime, `
                    ComputerState
                $status | ConvertTo-Json -Depth 1
            ";

            var result = await ExecutePowerShellAsync(script);
            if (!string.IsNullOrEmpty(result))
            {
                var defenderData = JsonConvert.DeserializeObject<Dictionary<string, object>>(result);
                if (defenderData != null)
                {
                    status.IsEnabled = GetBool(defenderData, "AntivirusEnabled");
                    status.RealTimeProtection = GetBool(defenderData, "RealTimeProtectionEnabled");
                    status.BehaviorMonitor = GetBool(defenderData, "BehaviorMonitorEnabled");
                    status.OnAccessProtection = GetBool(defenderData, "OnAccessProtectionEnabled");
                    status.NetworkProtection = GetBool(defenderData, "NISEnabled");
                    status.ProductVersion = GetString(defenderData, "AMProductVersion");
                    status.EngineVersion = GetString(defenderData, "AMEngineVersion");
                    status.SignatureVersion = GetString(defenderData, "AntivirusSignatureVersion");
                    status.SignatureLastUpdated = GetDateTime(defenderData, "AntivirusSignatureLastUpdated");
                    status.LastFullScan = GetDateTime(defenderData, "FullScanEndTime");
                    status.LastQuickScan = GetDateTime(defenderData, "QuickScanEndTime");
                    status.ComputerState = GetInt(defenderData, "ComputerState");
                }
            }
        }
        catch (Exception ex)
        {
            status.Error = ex.Message;
        }

        return status;
    }

    /// <summary>
    /// Get recent threat detection history
    /// </summary>
    public async Task<List<ThreatDetection>> GetThreatHistoryAsync(int maxResults = 50)
    {
        var threats = new List<ThreatDetection>();

        try
        {
            var script = $@"
                Get-MpThreatDetection | Select-Object -First {maxResults} -Property `
                    ThreatID, `
                    ThreatName, `
                    ProcessName, `
                    DomainUser, `
                    InitialDetectionTime, `
                    LastThreatStatusChangeTime, `
                    RemediationTime, `
                    Resources, `
                    ActionSuccess, `
                    CurrentThreatExecutionStatusID, `
                    ThreatStatusID | ConvertTo-Json -Depth 2
            ";

            var result = await ExecutePowerShellAsync(script);
            if (!string.IsNullOrEmpty(result))
            {
                // Handle both single object and array
                if (result.TrimStart().StartsWith("["))
                {
                    threats = JsonConvert.DeserializeObject<List<ThreatDetection>>(result) ?? new List<ThreatDetection>();
                }
                else
                {
                    var single = JsonConvert.DeserializeObject<ThreatDetection>(result);
                    if (single != null) threats.Add(single);
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error getting threat history: {ex.Message}");
        }

        return threats;
    }

    /// <summary>
    /// Get quarantined items
    /// </summary>
    public async Task<List<QuarantinedItem>> GetQuarantinedItemsAsync()
    {
        var items = new List<QuarantinedItem>();

        try
        {
            var script = @"
                Get-MpThreat | Where-Object { $_.ThreatStatus -eq 4 } | Select-Object -Property `
                    ThreatID, `
                    ThreatName, `
                    SeverityID, `
                    CategoryID, `
                    TypeID, `
                    Resources | ConvertTo-Json -Depth 2
            ";

            var result = await ExecutePowerShellAsync(script);
            if (!string.IsNullOrEmpty(result))
            {
                if (result.TrimStart().StartsWith("["))
                {
                    items = JsonConvert.DeserializeObject<List<QuarantinedItem>>(result) ?? new List<QuarantinedItem>();
                }
                else
                {
                    var single = JsonConvert.DeserializeObject<QuarantinedItem>(result);
                    if (single != null) items.Add(single);
                }
            }
        }
        catch { }

        return items;
    }

    /// <summary>
    /// Start a scan (quick, full, or custom path)
    /// </summary>
    public async Task<ScanResult> StartScanAsync(string scanType = "quick", string? customPath = null)
    {
        try
        {
            string script;

            switch (scanType.ToLower())
            {
                case "quick":
                    script = "Start-MpScan -ScanType QuickScan";
                    break;
                case "full":
                    script = "Start-MpScan -ScanType FullScan";
                    break;
                case "custom" when !string.IsNullOrEmpty(customPath):
                    script = $"Start-MpScan -ScanType CustomScan -ScanPath '{customPath}'";
                    break;
                default:
                    return new ScanResult { Success = false, Message = "Invalid scan type" };
            }

            await ExecutePowerShellAsync(script);

            return new ScanResult
            {
                Success = true,
                Message = $"{scanType} scan started",
                ScanType = scanType,
                StartedAt = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            return new ScanResult { Success = false, Message = ex.Message };
        }
    }

    /// <summary>
    /// Update Defender signatures
    /// </summary>
    public async Task<bool> UpdateSignaturesAsync()
    {
        try
        {
            await ExecutePowerShellAsync("Update-MpSignature");
            return true;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Remove threat from quarantine (restore or delete)
    /// </summary>
    public async Task<bool> RemoveQuarantinedThreatAsync(string threatId, bool restore = false)
    {
        try
        {
            var action = restore ? "Remove-MpThreat" : "Remove-MpThreat -ThreatID $threatId";
            var script = $"Get-MpThreat | Where-Object {{ $_.ThreatID -eq '{threatId}' }} | {action}";
            await ExecutePowerShellAsync(script);
            return true;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Get protection history (events from Event Log)
    /// </summary>
    public async Task<List<ProtectionEvent>> GetProtectionHistoryAsync(int hours = 24, int maxEvents = 100)
    {
        var events = new List<ProtectionEvent>();

        try
        {
            var script = $@"
                $startTime = (Get-Date).AddHours(-{hours})
                Get-WinEvent -FilterHashtable @{{
                    LogName = 'Microsoft-Windows-Windows Defender/Operational'
                    StartTime = $startTime
                }} -MaxEvents {maxEvents} -ErrorAction SilentlyContinue | 
                Select-Object TimeCreated, Id, LevelDisplayName, Message | 
                ConvertTo-Json -Depth 1
            ";

            var result = await ExecutePowerShellAsync(script);
            if (!string.IsNullOrEmpty(result))
            {
                if (result.TrimStart().StartsWith("["))
                {
                    events = JsonConvert.DeserializeObject<List<ProtectionEvent>>(result) ?? new List<ProtectionEvent>();
                }
                else
                {
                    var single = JsonConvert.DeserializeObject<ProtectionEvent>(result);
                    if (single != null) events.Add(single);
                }
            }
        }
        catch { }

        return events;
    }

    // Helper methods
    private async Task<string> ExecutePowerShellAsync(string script)
    {
        var psi = new ProcessStartInfo
        {
            FileName = "powershell.exe",
            Arguments = $"-NoProfile -ExecutionPolicy Bypass -Command \"{script}\"",
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true
        };

        using var process = Process.Start(psi);
        if (process == null) return "";

        var stdout = await process.StandardOutput.ReadToEndAsync();
        await process.WaitForExitAsync();

        return stdout.Trim();
    }

    private static bool GetBool(Dictionary<string, object> data, string key) =>
        data.TryGetValue(key, out var value) && value is bool b && b;

    private static string GetString(Dictionary<string, object> data, string key) =>
        data.TryGetValue(key, out var value) ? value?.ToString() ?? "" : "";

    private static int GetInt(Dictionary<string, object> data, string key) =>
        data.TryGetValue(key, out var value) && int.TryParse(value?.ToString(), out var i) ? i : 0;

    private static DateTime? GetDateTime(Dictionary<string, object> data, string key)
    {
        if (!data.TryGetValue(key, out var value)) return null;
        
        // PowerShell returns dates in a specific format
        var dateStr = value?.ToString();
        if (string.IsNullOrEmpty(dateStr)) return null;

        // Try parsing various formats
        if (DateTime.TryParse(dateStr, out var dt)) return dt;
        
        // Handle PowerShell /Date()/ format
        if (dateStr.Contains("/Date("))
        {
            var match = System.Text.RegularExpressions.Regex.Match(dateStr, @"/Date\((\d+)\)/");
            if (match.Success && long.TryParse(match.Groups[1].Value, out var ms))
            {
                return DateTimeOffset.FromUnixTimeMilliseconds(ms).UtcDateTime;
            }
        }

        return null;
    }
}

// =============================================================================
// Defender Data Models
// =============================================================================

public class DefenderStatus
{
    [JsonProperty("is_enabled")]
    public bool IsEnabled { get; set; }

    [JsonProperty("real_time_protection")]
    public bool RealTimeProtection { get; set; }

    [JsonProperty("behavior_monitor")]
    public bool BehaviorMonitor { get; set; }

    [JsonProperty("on_access_protection")]
    public bool OnAccessProtection { get; set; }

    [JsonProperty("network_protection")]
    public bool NetworkProtection { get; set; }

    [JsonProperty("product_version")]
    public string ProductVersion { get; set; } = "";

    [JsonProperty("engine_version")]
    public string EngineVersion { get; set; } = "";

    [JsonProperty("signature_version")]
    public string SignatureVersion { get; set; } = "";

    [JsonProperty("signature_last_updated")]
    public DateTime? SignatureLastUpdated { get; set; }

    [JsonProperty("last_full_scan")]
    public DateTime? LastFullScan { get; set; }

    [JsonProperty("last_quick_scan")]
    public DateTime? LastQuickScan { get; set; }

    [JsonProperty("computer_state")]
    public int ComputerState { get; set; } // 0=Clean, 1=Pending full scan, 2=Pending reboot, 4=Pending offline scan, 8=Pending critical failure

    [JsonProperty("error")]
    public string? Error { get; set; }

    [JsonProperty("timestamp")]
    public string Timestamp { get; set; } = DateTime.UtcNow.ToString("O");
}

public class ThreatDetection
{
    [JsonProperty("ThreatID")]
    public long ThreatId { get; set; }

    [JsonProperty("ThreatName")]
    public string ThreatName { get; set; } = "";

    [JsonProperty("ProcessName")]
    public string? ProcessName { get; set; }

    [JsonProperty("DomainUser")]
    public string? DomainUser { get; set; }

    [JsonProperty("InitialDetectionTime")]
    public DateTime? DetectedAt { get; set; }

    [JsonProperty("RemediationTime")]
    public DateTime? RemediatedAt { get; set; }

    [JsonProperty("Resources")]
    public string[]? Resources { get; set; }

    [JsonProperty("ActionSuccess")]
    public bool ActionSuccess { get; set; }

    [JsonProperty("ThreatStatusID")]
    public int ThreatStatusId { get; set; } // 0=Unknown, 1=Detected, 2=Cleaned, 3=Quarantined, 4=Removed, 5=Allowed, 6=Blocked
}

public class QuarantinedItem
{
    [JsonProperty("ThreatID")]
    public long ThreatId { get; set; }

    [JsonProperty("ThreatName")]
    public string ThreatName { get; set; } = "";

    [JsonProperty("SeverityID")]
    public int SeverityId { get; set; } // 1=Low, 2=Medium, 4=High, 5=Severe

    [JsonProperty("CategoryID")]
    public int CategoryId { get; set; }

    [JsonProperty("TypeID")]
    public int TypeId { get; set; }

    [JsonProperty("Resources")]
    public string[]? Resources { get; set; }
}

public class ScanResult
{
    [JsonProperty("success")]
    public bool Success { get; set; }

    [JsonProperty("message")]
    public string Message { get; set; } = "";

    [JsonProperty("scan_type")]
    public string? ScanType { get; set; }

    [JsonProperty("started_at")]
    public DateTime? StartedAt { get; set; }
}

public class ProtectionEvent
{
    [JsonProperty("TimeCreated")]
    public DateTime TimeCreated { get; set; }

    [JsonProperty("Id")]
    public int EventId { get; set; }

    [JsonProperty("LevelDisplayName")]
    public string Level { get; set; } = "";

    [JsonProperty("Message")]
    public string Message { get; set; } = "";
}
