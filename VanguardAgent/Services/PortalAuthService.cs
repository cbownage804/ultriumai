// =============================================================================
// Portal Authentication Service for Windows Agent
// =============================================================================

using Newtonsoft.Json;
using System.Net.Http.Json;
using System.Text;

namespace VanguardAgent.Services;

/// <summary>
/// Handles portal authentication for the agent tray app
/// </summary>
public class PortalAuthService
{
    private readonly HttpClient _http;
    private readonly ConfigService _configService;
    private PortalSession? _currentSession;
    
    private const string AUTH_ENDPOINT = "https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/portal-auth";

    public PortalAuthService(ConfigService configService)
    {
        _configService = configService;
        _http = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
    }

    public bool IsLoggedIn => _currentSession != null && !_currentSession.IsExpired;
    public PortalSession? CurrentSession => _currentSession;

    /// <summary>
    /// Login to the customer portal
    /// </summary>
    public async Task<PortalLoginResult> LoginAsync(string email, string password)
    {
        try
        {
            var payload = new
            {
                email,
                password,
                deviceInfo = new
                {
                    hostname = Environment.MachineName,
                    os = Environment.OSVersion.ToString(),
                    agent_version = "1.2.0"
                }
            };

            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync($"{AUTH_ENDPOINT}?action=agent-login", content);
            var json = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                var result = JsonConvert.DeserializeObject<PortalLoginResponse>(json);
                if (result != null && result.Success)
                {
                    _currentSession = new PortalSession
                    {
                        SessionToken = result.SessionToken,
                        UserId = result.User.Id,
                        Email = result.User.Email,
                        FullName = result.User.FullName,
                        Role = result.User.Role,
                        ClientId = result.User.ClientId,
                        SafeSuiteAccess = result.SafeSuiteAccess,
                        LoginTime = DateTime.UtcNow,
                        MustChangePassword = result.User.MustChangePassword
                    };

                    // Store session token in config
                    _configService.SetPortalSessionToken(result.SessionToken);

                    return new PortalLoginResult
                    {
                        Success = true,
                        Session = _currentSession
                    };
                }
            }

            // Parse error
            var errorResponse = JsonConvert.DeserializeObject<ErrorResponse>(json);
            return new PortalLoginResult
            {
                Success = false,
                ErrorMessage = errorResponse?.Error ?? "Login failed"
            };
        }
        catch (Exception ex)
        {
            return new PortalLoginResult
            {
                Success = false,
                ErrorMessage = $"Connection error: {ex.Message}"
            };
        }
    }

    /// <summary>
    /// Logout and clear session
    /// </summary>
    public void Logout()
    {
        _currentSession = null;
        _configService.ClearPortalSession();
    }

    /// <summary>
    /// Change password
    /// </summary>
    public async Task<bool> ChangePasswordAsync(string currentPassword, string newPassword)
    {
        if (_currentSession == null) return false;

        try
        {
            var payload = new
            {
                portalUserId = _currentSession.UserId,
                currentPassword,
                newPassword
            };

            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync($"{AUTH_ENDPOINT}?action=change-password", content);

            if (response.IsSuccessStatusCode)
            {
                _currentSession.MustChangePassword = false;
                return true;
            }
        }
        catch { }
        return false;
    }

    /// <summary>
    /// Try to restore session from stored token
    /// </summary>
    public async Task<bool> TryRestoreSessionAsync()
    {
        var storedToken = _configService.GetPortalSessionToken();
        if (string.IsNullOrEmpty(storedToken)) return false;

        try
        {
            var payload = new { sessionToken = storedToken };
            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _http.PostAsync($"{AUTH_ENDPOINT}?action=validate-session", content);

            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<ValidateSessionResponse>(json);
                
                if (result?.Valid == true)
                {
                    // Session is still valid - would need to fetch user info
                    // For now, just mark as logged in
                    return true;
                }
            }

            // Session invalid, clear it
            _configService.ClearPortalSession();
        }
        catch { }
        return false;
    }
}

#region DTOs

public class PortalSession
{
    public string SessionToken { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = "user";
    public string ClientId { get; set; } = string.Empty;
    public SafeSuiteAccess SafeSuiteAccess { get; set; } = new();
    public DateTime LoginTime { get; set; }
    public bool MustChangePassword { get; set; }

    // Session expires after 24 hours
    public bool IsExpired => DateTime.UtcNow - LoginTime > TimeSpan.FromHours(24);
}

public class SafeSuiteAccess
{
    [JsonProperty("safepass_enabled")]
    public bool SafePassEnabled { get; set; }
    
    [JsonProperty("safescan_enabled")]
    public bool SafeScanEnabled { get; set; }
    
    [JsonProperty("safeweb_enabled")]
    public bool SafeWebEnabled { get; set; }
    
    [JsonProperty("safetrack_enabled")]
    public bool SafeTrackEnabled { get; set; }
}

public class PortalLoginResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public PortalSession? Session { get; set; }
}

public class PortalLoginResponse
{
    [JsonProperty("success")]
    public bool Success { get; set; }
    
    [JsonProperty("sessionToken")]
    public string SessionToken { get; set; } = string.Empty;
    
    [JsonProperty("user")]
    public PortalUserInfo User { get; set; } = new();
    
    [JsonProperty("safeSuiteAccess")]
    public SafeSuiteAccess SafeSuiteAccess { get; set; } = new();
}

public class PortalUserInfo
{
    [JsonProperty("id")]
    public string Id { get; set; } = string.Empty;
    
    [JsonProperty("email")]
    public string Email { get; set; } = string.Empty;
    
    [JsonProperty("fullName")]
    public string FullName { get; set; } = string.Empty;
    
    [JsonProperty("role")]
    public string Role { get; set; } = "user";
    
    [JsonProperty("clientId")]
    public string ClientId { get; set; } = string.Empty;
    
    [JsonProperty("mustChangePassword")]
    public bool MustChangePassword { get; set; }
}

public class ValidateSessionResponse
{
    [JsonProperty("valid")]
    public bool Valid { get; set; }
}

public class ErrorResponse
{
    [JsonProperty("error")]
    public string? Error { get; set; }
}

#endregion
