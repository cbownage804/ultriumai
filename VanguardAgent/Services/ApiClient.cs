// =============================================================================
// Vanguard API Client
// =============================================================================

using System.Net.Http.Json;
using System.Text;
using Newtonsoft.Json;
using VanguardAgent.Services.XDR;
using AV = VanguardAgent.Services.AV;

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

    public async Task<bool> SendHeartbeatAsync(HeartbeatPayload heartbeat, string? rustdeskId = null, string? rustdeskStatus = null, string? meshcentralNodeId = null, string? meshcentralMeshId = null)
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
                agent_version = "1.1.0",
                rustdesk_id = rustdeskId,
                rustdesk_status = rustdeskStatus,
                meshcentral_node_id = meshcentralNodeId,
                meshcentral_mesh_id = meshcentralMeshId
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
    public async Task<bool> LogUSBEventAsync(AV.USBDevice device, string eventType, string? reason = null)
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

    /// <summary>
    /// Report a threat from RealTimeScanner
    /// </summary>
    public async Task<bool> ReportThreatAsync(AV.ScanResult threat)
    {
        try
        {
            SetHeaders();
            var payload = new
            {
                device_id = Config.DeviceId,
                file_path = threat.FilePath,
                threat_name = threat.ThreatName,
                detection_source = threat.DetectionSource,
                confidence = threat.Confidence,
                sha256 = threat.SHA256,
                file_size = threat.FileSize,
                yara_rule_id = threat.YaraRuleId
            };
            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync(Config.ApiEndpoint + "?action=report_threat", content);
            return response.IsSuccessStatusCode;
        }
        catch { return false; }
    }

    /// <summary>
    /// Report script threat from ScriptAnalyzer
    /// </summary>
    public async Task<bool> ReportScriptThreatAsync(AV.ScriptAnalysisResult result)
    {
        try
        {
            SetHeaders();
            var payload = new
            {
                device_id = Config.DeviceId,
                script_type = result.ScriptType.ToString(),
                file_path = result.FilePath,
                is_malicious = result.IsMalicious,
                is_suspicious = result.IsSuspicious,
                suspicion_score = result.SuspicionScore,
                threat_level = result.ThreatLevel.ToString(),
                matched_rules = result.MatchedRules?.Select(r => r.Id).ToList(),
                extracted_iocs = result.ExtractedIOCs,
                was_obfuscated = result.WasObfuscated
            };
            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync(Config.ApiEndpoint + "?action=script_threat", content);
            return response.IsSuccessStatusCode;
        }
        catch { return false; }
    }

    /// <summary>
    /// Get YARA rules from cloud
    /// </summary>
    public async Task<YaraRulesResponse?> GetYaraRulesAsync()
    {
        try
        {
            SetHeaders();
            var payload = new { device_id = Config.DeviceId };
            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync(Config.ApiEndpoint + "?action=get_yara_rules", content);
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<YaraRulesResponse>(json);
            }
        }
        catch { }
        return null;
    }

    /// <summary>
    /// Get custom signatures from cloud
    /// </summary>
    public async Task<CustomSignaturesResponse?> GetCustomSignaturesAsync()
    {
        try
        {
            SetHeaders();
            var payload = new { device_id = Config.DeviceId };
            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync(Config.ApiEndpoint + "?action=get_custom_signatures", content);
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<CustomSignaturesResponse>(json);
            }
        }
        catch { }
        return null;
    }
}

// Response Models
public class MemorySignaturesResponse
{
    [JsonProperty("signatures")] public List<VanguardAgent.Services.AV.MemorySignature>? Signatures { get; set; }
}

public class YaraRulesResponse
{
    [JsonProperty("rules")] public List<AV.YaraRule>? Rules { get; set; }
}

public class CustomSignaturesResponse
{
    [JsonProperty("signatures")] public List<AV.CustomSignature>? Signatures { get; set; }
}

// USB Policy Response - uses AV.USBPolicy enum
public class USBPolicyResponse
{
    [JsonProperty("policy")] public AV.USBPolicy Policy { get; set; }
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
    
    /// <summary>
    /// RustDesk relay configuration returned by server during registration.
    /// When present, the agent should auto-configure RustDesk with these settings
    /// instead of making a separate relay-config fetch.
    /// </summary>
    [JsonProperty("rustdesk_config")]
    public RustDeskDeployConfig? RustDeskConfig { get; set; }

    /// <summary>
    /// MeshCentral deployment configuration returned by server during registration.
    /// When present, the agent should auto-install MeshAgent with these settings.
    /// </summary>
    [JsonProperty("meshcentral_config")]
    public MeshCentralDeployConfig? MeshCentralConfig { get; set; }
}

/// <summary>
/// RustDesk deployment configuration returned during agent registration
/// </summary>
public class RustDeskDeployConfig
{
    [JsonProperty("deploy")]
    public bool Deploy { get; set; }
    
    [JsonProperty("relay_server")]
    public string? RelayServer { get; set; }
    
    [JsonProperty("public_key")]
    public string? PublicKey { get; set; }
    
    [JsonProperty("api_server")]
    public string? ApiServer { get; set; }
    
    [JsonProperty("version")]
    public string? Version { get; set; }
}

/// <summary>
/// MeshCentral deployment configuration returned during agent registration
/// </summary>
public class MeshCentralDeployConfig
{
    [JsonProperty("deploy")]
    public bool Deploy { get; set; }
    
    [JsonProperty("server_url")]
    public string? ServerUrl { get; set; }
    
    [JsonProperty("mesh_url")]
    public string? MeshUrl { get; set; }
    
    [JsonProperty("mesh_id")]
    public string? MeshId { get; set; }
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

    [JsonProperty("startup_programs")]
    public List<StartupProgramInfo>? StartupPrograms { get; set; }

    [JsonProperty("local_users")]
    public List<LocalUserInfo>? LocalUsers { get; set; }

    [JsonProperty("network_connections")]
    public List<NetworkConnectionInfo>? NetworkConnections { get; set; }

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

public class StartupProgramInfo
{
    [JsonProperty("name")]
    public string Name { get; set; } = "";

    [JsonProperty("command")]
    public string Command { get; set; } = "";

    [JsonProperty("location")]
    public string Location { get; set; } = "";

    [JsonProperty("enabled")]
    public bool Enabled { get; set; } = true;

    [JsonProperty("publisher")]
    public string? Publisher { get; set; }

    [JsonProperty("startup_type")]
    public string StartupType { get; set; } = "Registry";
}

public class LocalUserInfo
{
    [JsonProperty("name")]
    public string Name { get; set; } = "";

    [JsonProperty("full_name")]
    public string? FullName { get; set; }

    [JsonProperty("description")]
    public string? Description { get; set; }

    [JsonProperty("enabled")]
    public bool Enabled { get; set; } = true;

    [JsonProperty("is_admin")]
    public bool IsAdmin { get; set; }

    [JsonProperty("is_local")]
    public bool IsLocal { get; set; } = true;

    [JsonProperty("last_logon")]
    public string? LastLogon { get; set; }

    [JsonProperty("sid")]
    public string? Sid { get; set; }

    [JsonProperty("groups")]
    public List<string>? Groups { get; set; }
}

public class NetworkConnectionInfo
{
    [JsonProperty("local_address")]
    public string LocalAddress { get; set; } = "";

    [JsonProperty("local_port")]
    public int LocalPort { get; set; }

    [JsonProperty("remote_address")]
    public string RemoteAddress { get; set; } = "";

    [JsonProperty("remote_port")]
    public int RemotePort { get; set; }

    [JsonProperty("state")]
    public string State { get; set; } = "";

    [JsonProperty("protocol")]
    public string Protocol { get; set; } = "TCP";

    [JsonProperty("process_name")]
    public string? ProcessName { get; set; }

    [JsonProperty("process_id")]
    public int? ProcessId { get; set; }
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
