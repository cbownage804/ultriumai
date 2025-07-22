using Newtonsoft.Json;

namespace SafeTray.Models
{
    public enum TrayState { Green, Yellow, Red, Gray }

    public class TrayStatus
    {
        [JsonProperty("online")]
        public bool Online { get; set; }

        [JsonProperty("hasCriticalAlert")]
        public bool HasCriticalAlert { get; set; }

        [JsonProperty("hasHighAlert")]
        public bool HasHighAlert { get; set; }

        [JsonProperty("state")]
        public TrayState State { get; set; }

        [JsonProperty("message")]
        public string? Message { get; set; }

        [JsonProperty("device")]
        public DeviceInfo? Device { get; set; }

        [JsonProperty("detailed")]
        public DetailedStatus? Detailed { get; set; }

        [JsonProperty("timestamp")]
        public string? Timestamp { get; set; }
    }

    public class DeviceInfo
    {
        [JsonProperty("id")]
        public string? Id { get; set; }

        [JsonProperty("hostname")]
        public string? Hostname { get; set; }

        [JsonProperty("ip_address")]
        public string? IpAddress { get; set; }

        [JsonProperty("status")]
        public string? Status { get; set; }

        [JsonProperty("last_heartbeat")]
        public string? LastHeartbeat { get; set; }
    }

    public class DetailedStatus
    {
        [JsonProperty("alerts")]
        public AlertCounts? Alerts { get; set; }

        [JsonProperty("vulnerabilities")]
        public object? Vulnerabilities { get; set; }

        [JsonProperty("last_scan")]
        public object? LastScan { get; set; }

        [JsonProperty("pending_commands")]
        public int PendingCommands { get; set; }
    }

    public class AlertCounts
    {
        [JsonProperty("critical")]
        public int Critical { get; set; }

        [JsonProperty("high")]
        public int High { get; set; }

        [JsonProperty("medium")]
        public int Medium { get; set; }

        [JsonProperty("low")]
        public int Low { get; set; }

        [JsonProperty("info")]
        public int Info { get; set; }
    }
}