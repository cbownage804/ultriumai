// =============================================================================
// Configuration Service
// =============================================================================

using Newtonsoft.Json;

namespace VanguardAgent.Services;

public class AgentConfig
{
    [JsonProperty("user_id")]
    public string UserId { get; set; } = "";

    [JsonProperty("secret_key")]
    public string SecretKey { get; set; } = "";

    [JsonProperty("device_id")]
    public string? DeviceId { get; set; }

    [JsonProperty("device_name")]
    public string DeviceName { get; set; } = Environment.MachineName;

    [JsonProperty("api_endpoint")]
    public string ApiEndpoint { get; set; } = "https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/vanguard-agent-api";

    [JsonProperty("client_id")]
    public string? ClientId { get; set; }

    [JsonProperty("heartbeat_interval")]
    public int HeartbeatInterval { get; set; } = 60;

    [JsonProperty("command_poll_interval")]
    public int CommandPollInterval { get; set; } = 30;

    [JsonProperty("telemetry_interval")]
    public int TelemetryInterval { get; set; } = 300;

    [JsonProperty("features")]
    public FeatureConfig Features { get; set; } = new();
}

public class FeatureConfig
{
    [JsonProperty("collect_processes")]
    public bool CollectProcesses { get; set; } = true;

    [JsonProperty("collect_services")]
    public bool CollectServices { get; set; } = true;

    [JsonProperty("collect_network")]
    public bool CollectNetwork { get; set; } = true;

    [JsonProperty("collect_installed_software")]
    public bool CollectInstalledSoftware { get; set; } = true;

    [JsonProperty("execute_commands")]
    public bool ExecuteCommands { get; set; } = true;
}

public class ConfigService
{
    private AgentConfig _config;
    private readonly string _configPath;

    public ConfigService()
    {
        _configPath = Path.Combine(AppContext.BaseDirectory, "config.json");
        _config = LoadConfig();
    }

    public AgentConfig Config => _config;

    private AgentConfig LoadConfig()
    {
        try
        {
            if (File.Exists(_configPath))
            {
                var json = File.ReadAllText(_configPath);
                return JsonConvert.DeserializeObject<AgentConfig>(json) ?? new AgentConfig();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to load config: {ex.Message}");
        }

        return new AgentConfig();
    }

    public void SaveConfig()
    {
        try
        {
            var json = JsonConvert.SerializeObject(_config, Formatting.Indented);
            File.WriteAllText(_configPath, json);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to save config: {ex.Message}");
        }
    }

    public void SetDeviceId(string deviceId)
    {
        _config.DeviceId = deviceId;
        SaveConfig();
    }
}
