// =============================================================================
// Vanguard API Client
// =============================================================================

using System.Net.Http.Json;
using System.Text;
using Newtonsoft.Json;

namespace VanguardAgent.Services;

public class ApiClient
{
    private readonly HttpClient _http;
    private readonly ConfigService _configService;

    public ApiClient(ConfigService configService)
    {
        _configService = configService;
        _http = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
    }

    private AgentConfig Config => _configService.Config;

    private void SetHeaders()
    {
        _http.DefaultRequestHeaders.Clear();
        _http.DefaultRequestHeaders.Add("X-VANGUARD-KEY", Config.SecretKey);
        _http.DefaultRequestHeaders.Add("X-USER-ID", Config.UserId);
        if (!string.IsNullOrEmpty(Config.DeviceId))
        {
            _http.DefaultRequestHeaders.Add("X-DEVICE-ID", Config.DeviceId);
        }
    }

    public async Task<bool> TestConnectionAsync()
    {
        try
        {
            SetHeaders();
            var payload = new { action = "ping" };
            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync(Config.ApiEndpoint, content);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    public async Task<RegistrationResponse?> RegisterDeviceAsync(DeviceInfo deviceInfo)
    {
        try
        {
            SetHeaders();
            
            // Generate a device_id if not already set
            var deviceId = Config.DeviceId;
            if (string.IsNullOrEmpty(deviceId))
            {
                deviceId = $"vanguard-{Guid.NewGuid().ToString("N").Substring(0, 8)}";
            }
            
            // Build flat payload as expected by backend
            // Always use actual hostname for device name (Config.DeviceName may be a placeholder)
            var deviceName = deviceInfo.Hostname;
            if (!string.IsNullOrEmpty(Config.DeviceName) && 
                Config.DeviceName != Environment.MachineName &&
                !Config.DeviceName.Contains("Ultrium") &&
                !Config.DeviceName.Contains("Device"))
            {
                // Only use config name if it was explicitly customized
                deviceName = Config.DeviceName;
            }
            
            var payload = new
            {
                device_id = deviceId,
                user_id = Config.UserId,
                client_id = Config.ClientId,
                hostname = deviceInfo.Hostname,
                name = deviceName,
                ip_address = deviceInfo.IpAddress,
                agent_version = deviceInfo.AgentVersion,
                system_info = new
                {
                    os_name = deviceInfo.OsName,
                    os_version = deviceInfo.OsVersion,
                    cpu_info = deviceInfo.CpuInfo,
                    cpu_cores = deviceInfo.CpuCores,
                    cpu_threads = deviceInfo.CpuThreads,
                    total_memory_gb = deviceInfo.TotalMemoryGb,
                    mac_address = deviceInfo.MacAddress,
                    manufacturer = deviceInfo.Manufacturer,
                    model = deviceInfo.Model,
                    serial_number = deviceInfo.SerialNumber,
                    device_type = deviceInfo.DeviceType,
                    form_factor = deviceInfo.FormFactor,
                    is_virtual_machine = deviceInfo.IsVirtualMachine,
                    bios_manufacturer = deviceInfo.BiosManufacturer,
                    bios_version = deviceInfo.BiosVersion,
                    video_card = deviceInfo.VideoCard,
                    sound_card = deviceInfo.SoundCard
                },
                rustdesk_id = deviceInfo.RustDeskId
            };
            
            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync(Config.ApiEndpoint + "?action=register", content);

            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<RegistrationResponse>(json);
                
                // Save the device_id to config if registration succeeded
                if (result != null && !string.IsNullOrEmpty(result.AgentId))
                {
                    _configService.SetDeviceId(deviceId);
                }
                else if (result != null)
                {
                    // Backend returns agent_id, but we use device_id for future requests
                    _configService.SetDeviceId(deviceId);
                }
                
                return result;
            }
            else
            {
                var errorJson = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"Registration failed with status {response.StatusCode}: {errorJson}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Registration failed: {ex.Message}");
        }
        return null;
    }

    public async Task<bool> SendHeartbeatAsync(HeartbeatPayload heartbeat)
    {
        try
        {
            SetHeaders();
            var payload = new
            {
                action = "heartbeat",
                device_id = Config.DeviceId,
                cpu_percent = heartbeat.CpuPercent,
                memory_percent = heartbeat.MemoryPercent,
                disk_percent = heartbeat.DiskPercent,
                uptime_seconds = heartbeat.UptimeSeconds,
                timestamp = heartbeat.Timestamp,
                agent_version = "1.1.0"
            };
            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync(Config.ApiEndpoint + "?action=heartbeat", content);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    public async Task<bool> SendTelemetryAsync(TelemetryPayload telemetry)
    {
        try
        {
            SetHeaders();
            var payload = new
            {
                device_id = Config.DeviceId,
                processes = telemetry.Processes,
                services = telemetry.Services,
                network_adapters = telemetry.NetworkAdapters,
                installed_software = telemetry.InstalledSoftware,
                disks = telemetry.Disks,
                timestamp = telemetry.Timestamp
            };
            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync(Config.ApiEndpoint + "?action=telemetry", content);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    public async Task<bool> SendSecurityTelemetryAsync(SecurityTelemetry securityData)
    {
        try
        {
            SetHeaders();
            var payload = new
            {
                device_id = Config.DeviceId,
                defender_status = securityData.DefenderStatus,
                recent_threats = securityData.RecentThreats,
                quarantined_items = securityData.QuarantinedItems,
                timestamp = DateTime.UtcNow.ToString("O")
            };
            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync(Config.ApiEndpoint + "?action=security_telemetry", content);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    public async Task<List<RemoteCommand>?> PollCommandsAsync()
    {
        try
        {
            SetHeaders();
            var payload = new { device_id = Config.DeviceId };
            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync(Config.ApiEndpoint + "?action=get_commands", content);

            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<CommandPollResponse>(json);
                return result?.Commands;
            }
        }
        catch
        {
            // Silently fail - will retry next poll
        }
        return null;
    }

    public async Task<bool> ReportCommandResultAsync(string commandId, CommandResult result)
    {
        try
        {
            SetHeaders();
            var payload = new
            {
                action = "command_result",
                command_id = commandId,
                result = result
            };
            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync(Config.ApiEndpoint, content);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Update the device's RustDesk ID
    /// </summary>
    public async Task<bool> UpdateDeviceRustDeskIdAsync(string rustDeskId)
    {
        try
        {
            SetHeaders();
            var payload = new
            {
                device_id = Config.DeviceId,
                rustdesk_id = rustDeskId
            };
            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync(Config.ApiEndpoint + "?action=update_rustdesk_id", content);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Send security event to XDR engine (from BehavioralMonitor)
    /// </summary>
    public async Task<bool> SendSecurityEventAsync(object threatData)
    {
        try
        {
            SetHeaders();
            var content = new StringContent(JsonConvert.SerializeObject(threatData), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync(Config.ApiEndpoint + "?action=xdr_threat", content);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Send YARA match to XDR engine
    /// </summary>
    public async Task<XdrThreatResponse?> SendYaraMatchAsync(string ruleName, string filePath, string fileHash, long fileSize, List<string>? matchedStrings = null)
    {
        try
        {
            SetHeaders();
            var payload = new
            {
                device_id = Config.DeviceId,
                rule_name = ruleName,
                file_path = filePath,
                file_hash = fileHash,
                file_size = fileSize,
                matched_strings = matchedStrings ?? new List<string>()
            };
            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync(Config.ApiEndpoint + "?action=xdr_yara_match", content);
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<XdrThreatResponse>(json);
            }
        }
        catch { }
        return null;
    }

    /// <summary>
    /// Send memory scan results to XDR engine
    /// </summary>
    public async Task<bool> SendMemoryScanAsync(string processName, int processId, List<object> detections)
    {
        try
        {
            SetHeaders();
            var payload = new
            {
                device_id = Config.DeviceId,
                process_name = processName,
                process_id = processId,
                detections
            };
            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync(Config.ApiEndpoint + "?action=xdr_memory_scan", content);
            return response.IsSuccessStatusCode;
        }
        catch { return false; }
    }

    /// <summary>
    /// Send script analysis results to XDR engine
    /// </summary>
    public async Task<XdrScriptResponse?> SendScriptAnalysisAsync(string scriptType, string scriptHash, string verdict, List<object>? indicators = null)
    {
        try
        {
            SetHeaders();
            var payload = new
            {
                device_id = Config.DeviceId,
                script_type = scriptType,
                script_hash = scriptHash,
                verdict,
                indicators = indicators ?? new List<object>()
            };
            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync(Config.ApiEndpoint + "?action=xdr_script_analysis", content);
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<XdrScriptResponse>(json);
            }
        }
        catch { }
        return null;
    }

    /// <summary>
    /// Get XDR rules (YARA, IOCs, policies) from cloud
    /// </summary>
    public async Task<XdrRulesResponse?> GetXdrRulesAsync(string? ruleType = null, string? lastSync = null)
    {
        try
        {
            SetHeaders();
            var payload = new { device_id = Config.DeviceId, rule_type = ruleType, last_sync = lastSync };
            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync(Config.ApiEndpoint + "?action=xdr_get_rules", content);
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<XdrRulesResponse>(json);
            }
        }
        catch { }
        return null;
    }

    /// <summary>
    /// Poll for XDR response actions to execute
    /// </summary>
    public async Task<List<XdrAction>?> PollXdrActionsAsync()
    {
        try
        {
            SetHeaders();
            var payload = new { device_id = Config.DeviceId };
            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync(Config.ApiEndpoint + "?action=xdr_poll_actions", content);
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<XdrActionsResponse>(json);
                return result?.Actions;
            }
        }
        catch { }
        return null;
    }

    /// <summary>
    /// Report XDR action execution result
    /// </summary>
    public async Task<bool> ReportXdrActionResultAsync(string actionId, bool success, object? result = null, string? errorMessage = null)
    {
        try
        {
            SetHeaders();
            var payload = new
            {
                device_id = Config.DeviceId,
                action_id = actionId,
                success,
                result,
                error_message = errorMessage
            };
            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync(Config.ApiEndpoint + "?action=xdr_action_result", content);
            return response.IsSuccessStatusCode;
        }
        catch { return false; }
    }

    /// <summary>
    /// Log USB device event
    /// </summary>
    public async Task<bool> LogUSBEventAsync(USBDevice device, string eventType, string? reason = null)
    {
        try
        {
            SetHeaders();
            var payload = new
            {
                device_id = Config.DeviceId,
                usb_device = new
                {
                    device_id = device.DeviceId,
                    friendly_name = device.FriendlyName,
                    vendor_id = device.VendorId,
                    product_id = device.ProductId,
                    serial_number = device.SerialNumber,
                    drive_letter = device.DriveLetter
                },
                event_type = eventType,
                reason
            };
            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync(Config.ApiEndpoint + "?action=usb_event", content);
            return response.IsSuccessStatusCode;
        }
        catch { return false; }
    }

    /// <summary>
    /// Get USB policy from cloud
    /// </summary>
    public async Task<USBPolicyResponse?> GetUSBPolicyAsync()
    {
        try
        {
            SetHeaders();
            var payload = new { device_id = Config.DeviceId };
            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync(Config.ApiEndpoint + "?action=get_usb_policy", content);
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<USBPolicyResponse>(json);
            }
        }
        catch { }
        return null;
    }

    /// <summary>
    /// Get USB whitelist from cloud
    /// </summary>
    public async Task<USBWhitelistResponse?> GetUSBWhitelistAsync()
    {
        try
        {
            SetHeaders();
            var payload = new { device_id = Config.DeviceId };
            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync(Config.ApiEndpoint + "?action=get_usb_whitelist", content);
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<USBWhitelistResponse>(json);
            }
        }
        catch { }
        return null;
    }

    /// <summary>
    /// Lookup file hash against threat intelligence
    /// </summary>
    public async Task<HashLookupResponse?> LookupHashAsync(string hash)
    {
        try
        {
            SetHeaders();
            var payload = new { device_id = Config.DeviceId, hash };
            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync(Config.ApiEndpoint + "?action=lookup_hash", content);
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<HashLookupResponse>(json);
            }
        }
        catch { }
        return null;
    }

    /// <summary>
    /// Get threat feeds from cloud
    /// </summary>
    public async Task<ThreatFeedResponse?> GetThreatFeedsAsync()
    {
        try
        {
            SetHeaders();
            var payload = new { device_id = Config.DeviceId };
            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync(Config.ApiEndpoint + "?action=get_threat_feeds", content);
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<ThreatFeedResponse>(json);
            }
        }
        catch { }
        return null;
    }

    /// <summary>
    /// Report a critical threat
    /// </summary>
    public async Task<bool> ReportCriticalThreatAsync(object threat)
    {
        try
        {
            SetHeaders();
            var payload = new
            {
                device_id = Config.DeviceId,
                threat
            };
            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync(Config.ApiEndpoint + "?action=critical_threat", content);
            return response.IsSuccessStatusCode;
        }
        catch { return false; }
    }

    /// <summary>
    /// Report a unified threat from AV engine
    /// </summary>
    public async Task<bool> ReportUnifiedThreatAsync(object threat)
    {
        try
        {
            SetHeaders();
            var payload = new
            {
                device_id = Config.DeviceId,
                threat
            };
            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync(Config.ApiEndpoint + "?action=unified_threat", content);
            return response.IsSuccessStatusCode;
        }
        catch { return false; }
    }

    /// <summary>
    /// Get memory signatures from cloud
    /// </summary>
    public async Task<MemorySignaturesResponse?> GetMemorySignaturesAsync()
    {
        try
        {
            SetHeaders();
            var payload = new { device_id = Config.DeviceId };
            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync(Config.ApiEndpoint + "?action=get_memory_signatures", content);
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<MemorySignaturesResponse>(json);
            }
        }
        catch { }
        return null;
    }
}

// Memory Signatures Response
public class MemorySignaturesResponse
{
    [JsonProperty("signatures")] public List<VanguardAgent.Services.AV.MemorySignature>? Signatures { get; set; }
}

// USB Models
public class USBDevice
{
    public string DeviceId { get; set; } = "";
    public string PnPDeviceId { get; set; } = "";
    public string FriendlyName { get; set; } = "";
    public string? Manufacturer { get; set; }
    public string? Model { get; set; }
    public string? SerialNumber { get; set; }
    public string? VendorId { get; set; }
    public string? ProductId { get; set; }
    public long Size { get; set; }
    public string? DriveLetter { get; set; }
    public DateTime ConnectedAt { get; set; }
    public DateTime? LastScanned { get; set; }
    public int ThreatsFound { get; set; }
    public bool IsBlocked { get; set; }
    public string? BlockReason { get; set; }
    public bool IsReadOnly { get; set; }
}

public enum USBPolicy
{
    AllowAll,
    ScanAndAllow,
    WhitelistOnly,
    ReadOnly,
    BlockAll
}

public class USBPolicyResponse
{
    [JsonProperty("policy")] public USBPolicy Policy { get; set; }
}

public class USBWhitelistResponse
{
    [JsonProperty("devices")] public List<WhitelistedDevice>? Devices { get; set; }
}

public class WhitelistedDevice
{
    [JsonProperty("device_id")] public string DeviceId { get; set; } = "";
    [JsonProperty("name")] public string? Name { get; set; }
}

// XDR Response Models
public class XdrThreatResponse
{
    [JsonProperty("success")] public bool Success { get; set; }
    [JsonProperty("threat_id")] public string? ThreatId { get; set; }
    [JsonProperty("severity")] public string? Severity { get; set; }
    [JsonProperty("action")] public string? Action { get; set; }
}

public class XdrScriptResponse
{
    [JsonProperty("success")] public bool Success { get; set; }
    [JsonProperty("threat_id")] public string? ThreatId { get; set; }
    [JsonProperty("action")] public string? Action { get; set; }
}

public class XdrRulesResponse
{
    [JsonProperty("yara_rules")] public List<YaraRuleInfo>? YaraRules { get; set; }
    [JsonProperty("iocs")] public List<IocInfo>? Iocs { get; set; }
    [JsonProperty("policies")] public List<object>? Policies { get; set; }
    [JsonProperty("sync_time")] public string? SyncTime { get; set; }
}

public class YaraRuleInfo
{
    [JsonProperty("id")] public string? Id { get; set; }
    [JsonProperty("name")] public string? Name { get; set; }
    [JsonProperty("content")] public string? Content { get; set; }
    [JsonProperty("category")] public string? Category { get; set; }
    [JsonProperty("severity")] public string? Severity { get; set; }
}

public class IocInfo
{
    [JsonProperty("id")] public string? Id { get; set; }
    [JsonProperty("ioc_type")] public string? IocType { get; set; }
    [JsonProperty("ioc_value")] public string? IocValue { get; set; }
    [JsonProperty("confidence")] public int Confidence { get; set; }
}

public class XdrActionsResponse
{
    [JsonProperty("actions")] public List<XdrAction>? Actions { get; set; }
}

public class XdrAction
{
    [JsonProperty("id")] public string? Id { get; set; }
    [JsonProperty("action_type")] public string? ActionType { get; set; }
    [JsonProperty("parameters")] public Dictionary<string, object>? Parameters { get; set; }
    [JsonProperty("priority")] public string? Priority { get; set; }
}

// API Models
public class RegistrationResponse
{
    [JsonProperty("status")]
    public string? Status { get; set; }

    [JsonProperty("agent_id")]
    public string? AgentId { get; set; }

    [JsonProperty("device_id")]
    public string? DeviceId { get; set; }

    [JsonProperty("success")]
    public bool Success { get; set; }

    [JsonProperty("error")]
    public string? Error { get; set; }
}

public class DeviceInfo
{
    [JsonProperty("hostname")]
    public string Hostname { get; set; } = "";

    [JsonProperty("os_name")]
    public string OsName { get; set; } = "";

    [JsonProperty("os_version")]
    public string OsVersion { get; set; } = "";

    [JsonProperty("ip_address")]
    public string IpAddress { get; set; } = "";

    [JsonProperty("mac_address")]
    public string MacAddress { get; set; } = "";

    [JsonProperty("cpu_info")]
    public string CpuInfo { get; set; } = "";

    [JsonProperty("cpu_cores")]
    public int CpuCores { get; set; }

    [JsonProperty("cpu_threads")]
    public int CpuThreads { get; set; }

    [JsonProperty("total_memory_gb")]
    public double TotalMemoryGb { get; set; }

    [JsonProperty("agent_version")]
    public string AgentVersion { get; set; } = "1.1.0";

    // Device Classification - Auto-detected
    [JsonProperty("device_type")]
    public string DeviceType { get; set; } = "Workstation"; // Server, Workstation, Domain Controller

    [JsonProperty("form_factor")]
    public string FormFactor { get; set; } = "Desktop"; // Laptop, Desktop, Tablet, All-in-One, Rack Server

    [JsonProperty("is_virtual_machine")]
    public bool IsVirtualMachine { get; set; } = false;

    // Hardware Details
    [JsonProperty("manufacturer")]
    public string Manufacturer { get; set; } = "";

    [JsonProperty("model")]
    public string Model { get; set; } = "";

    [JsonProperty("serial_number")]
    public string SerialNumber { get; set; } = "";

    // BIOS Information
    [JsonProperty("bios_manufacturer")]
    public string BiosManufacturer { get; set; } = "";

    [JsonProperty("bios_version")]
    public string BiosVersion { get; set; } = "";

    // Video Card
    [JsonProperty("video_card")]
    public string VideoCard { get; set; } = "";

    // Sound Card
    [JsonProperty("sound_card")]
    public string SoundCard { get; set; } = "";

    // Remote Access - Auto-detected
    [JsonProperty("rustdesk_id")]
    public string? RustDeskId { get; set; }

    [JsonProperty("rustdesk_relay_server")]
    public string? RustDeskRelayServer { get; set; }

    [JsonProperty("anydesk_id")]
    public string? AnyDeskId { get; set; }

    [JsonProperty("teamviewer_id")]
    public string? TeamViewerId { get; set; }
}

public class HeartbeatPayload
{
    [JsonProperty("cpu_percent")]
    public double CpuPercent { get; set; }

    [JsonProperty("memory_percent")]
    public double MemoryPercent { get; set; }

    [JsonProperty("disk_percent")]
    public double DiskPercent { get; set; }

    [JsonProperty("uptime_seconds")]
    public long UptimeSeconds { get; set; }

    [JsonProperty("timestamp")]
    public string Timestamp { get; set; } = DateTime.UtcNow.ToString("O");
}

public class TelemetryPayload
{
    [JsonProperty("processes")]
    public List<ProcessInfo>? Processes { get; set; }

    [JsonProperty("services")]
    public List<ServiceInfo>? Services { get; set; }

    [JsonProperty("network_adapters")]
    public List<NetworkAdapterInfo>? NetworkAdapters { get; set; }

    [JsonProperty("installed_software")]
    public List<SoftwareInfo>? InstalledSoftware { get; set; }

    [JsonProperty("disks")]
    public List<DiskInfo>? Disks { get; set; }

    [JsonProperty("timestamp")]
    public string Timestamp { get; set; } = DateTime.UtcNow.ToString("O");
}

public class DiskInfo
{
    [JsonProperty("drive")]
    public string Drive { get; set; } = "";

    [JsonProperty("label")]
    public string Label { get; set; } = "";

    [JsonProperty("type")]
    public string Type { get; set; } = "";

    [JsonProperty("filesystem")]
    public string FileSystem { get; set; } = "";

    [JsonProperty("total_gb")]
    public double TotalGb { get; set; }

    [JsonProperty("used_gb")]
    public double UsedGb { get; set; }

    [JsonProperty("free_gb")]
    public double FreeGb { get; set; }

    [JsonProperty("percent_used")]
    public double PercentUsed { get; set; }

    [JsonProperty("status")]
    public string Status { get; set; } = "Healthy";
}

public class ProcessInfo
{
    [JsonProperty("name")]
    public string Name { get; set; } = "";

    [JsonProperty("pid")]
    public int Pid { get; set; }

    [JsonProperty("cpu_percent")]
    public double CpuPercent { get; set; }

    [JsonProperty("memory_mb")]
    public double MemoryMb { get; set; }
}

public class ServiceInfo
{
    [JsonProperty("name")]
    public string Name { get; set; } = "";

    [JsonProperty("display_name")]
    public string DisplayName { get; set; } = "";

    [JsonProperty("status")]
    public string Status { get; set; } = "";

    [JsonProperty("start_type")]
    public string StartType { get; set; } = "";
}

public class NetworkAdapterInfo
{
    [JsonProperty("name")]
    public string Name { get; set; } = "";

    [JsonProperty("ip_address")]
    public string IpAddress { get; set; } = "";

    [JsonProperty("mac_address")]
    public string MacAddress { get; set; } = "";

    [JsonProperty("status")]
    public string Status { get; set; } = "";
}

public class SoftwareInfo
{
    [JsonProperty("name")]
    public string Name { get; set; } = "";

    [JsonProperty("version")]
    public string Version { get; set; } = "";

    [JsonProperty("publisher")]
    public string Publisher { get; set; } = "";

    [JsonProperty("install_date")]
    public string? InstallDate { get; set; }
}

public class CommandPollResponse
{
    [JsonProperty("commands")]
    public List<RemoteCommand>? Commands { get; set; }
}

public class RemoteCommand
{
    [JsonProperty("id")]
    public string Id { get; set; } = "";

    [JsonProperty("command_type")]
    public string CommandType { get; set; } = "";

    [JsonProperty("command")]
    public string Command { get; set; } = "";

    [JsonProperty("parameters")]
    public Dictionary<string, object>? Parameters { get; set; }
}

public class CommandResult
{
    [JsonProperty("success")]
    public bool Success { get; set; }

    [JsonProperty("exit_code")]
    public int ExitCode { get; set; }

    [JsonProperty("stdout")]
    public string? Stdout { get; set; }

    [JsonProperty("stderr")]
    public string? Stderr { get; set; }

    [JsonProperty("executed_at")]
    public string ExecutedAt { get; set; } = DateTime.UtcNow.ToString("O");
}
