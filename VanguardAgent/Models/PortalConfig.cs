using System.Text.Json.Serialization;

namespace VanguardAgent.Models;

public class PortalConfig
{
    [JsonPropertyName("portal_key")]
    public string PortalKey { get; set; } = string.Empty;
    
    [JsonPropertyName("portal_name")]
    public string PortalName { get; set; } = "Vanguard";
    
    [JsonPropertyName("portal_url")]
    public string PortalUrl { get; set; } = "https://ultriumai.app/customer-portal";
    
    [JsonPropertyName("api_endpoint")]
    public string ApiEndpoint { get; set; } = string.Empty;
    
    [JsonPropertyName("logo_url")]
    public string? LogoUrl { get; set; }
    
    [JsonPropertyName("primary_color")]
    public string PrimaryColor { get; set; } = "#0891b2";
    
    [JsonPropertyName("client_id")]
    public string? ClientId { get; set; }
    
    [JsonPropertyName("msp_user_id")]
    public string MspUserId { get; set; } = string.Empty;
    
    [JsonPropertyName("show_portal")]
    public bool ShowPortal { get; set; } = true;
}
