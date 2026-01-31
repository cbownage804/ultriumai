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
            var payload = new
            {
                action = "register",
                device = deviceInfo
            };
            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync(Config.ApiEndpoint, content);

            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<RegistrationResponse>(json);
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
                data = heartbeat
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

    public async Task<bool> SendTelemetryAsync(TelemetryPayload telemetry)
    {
        try
        {
            SetHeaders();
            var payload = new
            {
                action = "telemetry",
                data = telemetry
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

    public async Task<bool> SendSecurityTelemetryAsync(SecurityTelemetry securityData)
    {
        try
        {
            SetHeaders();
            var payload = new
            {
                action = "security_telemetry",
                data = securityData
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

    public async Task<List<RemoteCommand>?> PollCommandsAsync()
    {
        try
        {
            SetHeaders();
            var payload = new { action = "poll_commands" };
            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync(Config.ApiEndpoint, content);

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
}

// API Models
public class RegistrationResponse
{
    [JsonProperty("device_id")]
    public string? DeviceId { get; set; }

    [JsonProperty("success")]
    public bool Success { get; set; }
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

    [JsonProperty("timestamp")]
    public string Timestamp { get; set; } = DateTime.UtcNow.ToString("O");
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
