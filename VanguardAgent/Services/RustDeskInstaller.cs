// =============================================================================
// RustDesk Auto-Installer Service
// Automatically installs and configures RustDesk for built-in remote access
// Supports dual-relay failover for high availability
// =============================================================================

using System.Diagnostics;
using System.Net.Http;
using System.Text.Json;
using Microsoft.Win32;

namespace VanguardAgent.Services;

public class RustDeskInstaller
{
    private readonly ConfigService _configService;
    private readonly HttpClient _httpClient;
    
    // Vanguard-hosted relay server configuration (supports dual-relay)
    private List<RelayServerConfig> _relayServers = new();
    private bool _failoverEnabled = false;
    
    // Unattended access password (received from server on first config fetch)
    private string? _unattendedPassword = null;
    
    private const string RUSTDESK_VERSION = "1.2.6";
    private const string RUSTDESK_DOWNLOAD_URL = $"https://github.com/rustdesk/rustdesk/releases/download/{RUSTDESK_VERSION}/rustdesk-{RUSTDESK_VERSION}-x86_64.exe";
    
    // Local password cache file path
    private string PasswordCachePath => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
        "VanguardAgent", "rustdesk_pwd.dat"
    );
    
    public RustDeskInstaller(ConfigService configService)
    {
        _configService = configService;
        _httpClient = new HttpClient();
        _httpClient.Timeout = TimeSpan.FromMinutes(10);
        
        // Load cached password if exists
        LoadCachedPassword();
    }
    
    /// <summary>
    /// Load previously cached unattended password
    /// </summary>
    private void LoadCachedPassword()
    {
        try
        {
            if (File.Exists(PasswordCachePath))
            {
                _unattendedPassword = File.ReadAllText(PasswordCachePath).Trim();
                if (!string.IsNullOrEmpty(_unattendedPassword))
                {
                    Console.WriteLine("[RustDesk] Loaded cached unattended password");
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[RustDesk] Failed to load cached password: {ex.Message}");
        }
    }
    
    /// <summary>
    /// Save unattended password to local cache
    /// </summary>
    private void SavePasswordCache(string password)
    {
        try
        {
            var dir = Path.GetDirectoryName(PasswordCachePath);
            if (!string.IsNullOrEmpty(dir))
            {
                Directory.CreateDirectory(dir);
            }
            File.WriteAllText(PasswordCachePath, password);
            Console.WriteLine("[RustDesk] Cached unattended password");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[RustDesk] Failed to cache password: {ex.Message}");
        }
    }

    /// <summary>
    /// Check if RustDesk is installed and properly configured
    /// </summary>
    public bool IsRustDeskInstalled()
    {
        // Check common installation paths
        var installPaths = new[]
        {
            @"C:\Program Files\RustDesk\rustdesk.exe",
            @"C:\Program Files (x86)\RustDesk\rustdesk.exe",
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "RustDesk", "rustdesk.exe"),
        };

        foreach (var path in installPaths)
        {
            if (File.Exists(path))
            {
                Console.WriteLine($"[RustDesk] Found installation at: {path}");
                return true;
            }
        }

        // Check registry for installation
        try
        {
            using var key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\RustDesk");
            if (key != null)
            {
                var installLocation = key.GetValue("InstallLocation")?.ToString();
                if (!string.IsNullOrEmpty(installLocation))
                {
                    Console.WriteLine($"[RustDesk] Found via registry at: {installLocation}");
                    return true;
                }
            }
        }
        catch { }

        return false;
    }

    /// <summary>
    /// Check if RustDesk is configured for Vanguard relay
    /// </summary>
    public bool IsConfiguredForVanguard()
    {
        if (_relayServers.Count == 0)
            return false;

        try
        {
            var configPath = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "RustDesk", "config", "RustDesk.toml"
            );

            if (File.Exists(configPath))
            {
                var content = File.ReadAllText(configPath);
                // Check if any of our relay servers are configured
                return _relayServers.Any(r => content.Contains(r.Server, StringComparison.OrdinalIgnoreCase));
            }
        }
        catch { }

        return false;
    }

    /// <summary>
    /// Fetch relay server configuration from Vanguard API (supports dual-relay)
    /// Also retrieves unattended access password on first request
    /// </summary>
    public async Task<bool> FetchRelayConfigAsync(string apiBaseUrl)
    {
        try
        {
            // Build the relay config URL - handle both base URL formats
            string relayConfigUrl;
            if (apiBaseUrl.Contains("/functions/v1"))
            {
                relayConfigUrl = $"{apiBaseUrl.TrimEnd('/')}/vanguard-relay-config";
            }
            else
            {
                relayConfigUrl = $"{apiBaseUrl.TrimEnd('/')}/functions/v1/vanguard-relay-config";
            }
            
            Console.WriteLine($"[RustDesk] Fetching relay config from: {relayConfigUrl}");
            
            // Create request with device ID and auth headers for password generation
            var request = new HttpRequestMessage(HttpMethod.Get, relayConfigUrl);
            request.Headers.Add("X-Device-Id", _configService.Config.DeviceId ?? "");
            request.Headers.Add("X-Vanguard-Key", _configService.Config.SecretKey);
            
            var response = await _httpClient.SendAsync(request);
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"[RustDesk] Relay config response: {json.Substring(0, Math.Min(200, json.Length))}...");
                
                var config = JsonSerializer.Deserialize<RelayConfigResponse>(json, new JsonSerializerOptions 
                { 
                    PropertyNameCaseInsensitive = true 
                });
                
                if (config != null)
                {
                    _relayServers.Clear();
                    
                    // Check for new dual-relay format
                    if (config.RelayServers != null && config.RelayServers.Count > 0)
                    {
                        _relayServers = config.RelayServers.OrderBy(r => r.Priority).ToList();
                        _failoverEnabled = config.FailoverEnabled;
                        Console.WriteLine($"[RustDesk] Dual-relay config loaded: {_relayServers.Count} servers, failover: {_failoverEnabled}");
                    }
                    // Fall back to legacy single-server format
                    else if (!string.IsNullOrEmpty(config.RelayServer))
                    {
                        _relayServers.Add(new RelayServerConfig
                        {
                            Server = config.RelayServer,
                            PublicKey = config.PublicKey ?? "",
                            Priority = 1,
                            Region = "primary"
                        });
                        Console.WriteLine($"[RustDesk] Legacy relay config loaded: {config.RelayServer}");
                    }
                    
                    // Store unattended password if provided (only on first request)
                    if (!string.IsNullOrEmpty(config.UnattendedPassword))
                    {
                        _unattendedPassword = config.UnattendedPassword;
                        SavePasswordCache(_unattendedPassword);
                        Console.WriteLine("[RustDesk] Received unattended access password from server");
                    }
                    
                    return _relayServers.Count > 0;
                }
            }
            else
            {
                Console.WriteLine($"[RustDesk] Relay config request failed: HTTP {(int)response.StatusCode}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[RustDesk] Failed to fetch relay config: {ex.Message}");
        }

        return false;
    }
    
    /// <summary>
    /// Get the current unattended password (if available)
    /// </summary>
    public string? GetUnattendedPassword() => _unattendedPassword;

    /// <summary>
    /// Set relay configuration manually (for offline scenarios)
    /// </summary>
    public void SetRelayConfig(string relayServer, string publicKey, string? secondaryServer = null, string? secondaryKey = null)
    {
        _relayServers.Clear();
        
        _relayServers.Add(new RelayServerConfig
        {
            Server = relayServer,
            PublicKey = publicKey,
            Priority = 1,
            Region = "primary"
        });
        
        if (!string.IsNullOrEmpty(secondaryServer))
        {
            _relayServers.Add(new RelayServerConfig
            {
                Server = secondaryServer,
                PublicKey = secondaryKey ?? publicKey,
                Priority = 2,
                Region = "secondary"
            });
            _failoverEnabled = true;
        }
    }

    /// <summary>
    /// Download and install RustDesk silently
    /// </summary>
    public async Task<bool> InstallRustDeskAsync()
    {
        Console.WriteLine("[RustDesk] Starting installation...");
        
        // When running as Windows Service, we already have SYSTEM privileges
        // Use ProgramData instead of user's LocalApplicationData for service context
        var uniqueId = Guid.NewGuid().ToString("N");
        var localTempPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), 
            "VanguardAgent", 
            "Downloads",
            uniqueId
        );
        
        try
        {
            Directory.CreateDirectory(localTempPath);
            Console.WriteLine($"[RustDesk] Download directory: {localTempPath}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[RustDesk] Failed to create download directory: {ex.Message}");
            return false;
        }
        
        var installerPath = Path.Combine(localTempPath, $"rustdesk-{RUSTDESK_VERSION}.exe");
        
        try
        {
            // Download installer to ProgramData (accessible by SYSTEM account)
            Console.WriteLine($"[RustDesk] Downloading from {RUSTDESK_DOWNLOAD_URL}...");
            
            using var response = await _httpClient.GetAsync(RUSTDESK_DOWNLOAD_URL, HttpCompletionOption.ResponseHeadersRead);
            
            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"[RustDesk] Download failed: HTTP {(int)response.StatusCode}");
                return false;
            }
            
            // Download to unique local path
            await using (var contentStream = await response.Content.ReadAsStreamAsync())
            await using (var fileStream = new FileStream(installerPath, FileMode.Create, FileAccess.Write, FileShare.None))
            {
                await contentStream.CopyToAsync(fileStream);
            }
            
            Console.WriteLine($"[RustDesk] Downloaded to {installerPath}");
            
            // Wait for file system to fully release the file handle
            await Task.Delay(2000);
            
            // Verify file exists and get size
            var fileInfo = new FileInfo(installerPath);
            if (!fileInfo.Exists || fileInfo.Length == 0)
            {
                Console.WriteLine("[RustDesk] Downloaded file not found or empty");
                return false;
            }
            Console.WriteLine($"[RustDesk] File size: {fileInfo.Length} bytes");
            
            // Wait for Windows Defender to finish scanning (common cause of file locks)
            await WaitForFileUnlockAsync(installerPath, maxWaitSeconds: 30);
            
            // Run silent install - when running as SYSTEM service, we already have admin rights
            // Use CreateNoWindow and don't use ShellExecute (services can't interact with desktop)
            Console.WriteLine("[RustDesk] Running silent installation...");
            
            var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = installerPath,
                    Arguments = "--silent-install",
                    UseShellExecute = false, // Must be false for services (no desktop interaction)
                    CreateNoWindow = true,
                    WorkingDirectory = localTempPath,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                }
            };
            
            process.Start();
            
            // Capture output for debugging
            var stdout = await process.StandardOutput.ReadToEndAsync();
            var stderr = await process.StandardError.ReadToEndAsync();
            
            await process.WaitForExitAsync();
            
            if (!string.IsNullOrEmpty(stdout))
                Console.WriteLine($"[RustDesk] Installer output: {stdout}");
            if (!string.IsNullOrEmpty(stderr))
                Console.WriteLine($"[RustDesk] Installer errors: {stderr}");
            
            if (process.ExitCode == 0)
            {
                Console.WriteLine("[RustDesk] Installation completed successfully");
                
                // Wait for installation to fully complete
                await Task.Delay(5000);
                
                // Configure for Vanguard relay
                await ConfigureForVanguardAsync();
                
                return true;
            }
            else
            {
                Console.WriteLine($"[RustDesk] Installation failed with exit code {process.ExitCode}");
                return false;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[RustDesk] Installation error: {ex.Message}");
            Console.WriteLine($"[RustDesk] Stack trace: {ex.StackTrace}");
            return false;
        }
        finally
        {
            // Cleanup with delay - don't block on cleanup failures
            _ = Task.Run(async () =>
            {
                await Task.Delay(30000); // Wait 30s before cleanup
                try 
                { 
                    if (Directory.Exists(localTempPath)) 
                        Directory.Delete(localTempPath, true);
                    Console.WriteLine("[RustDesk] Cleaned up temp files");
                } 
                catch { /* Ignore cleanup failures */ }
            });
        }
    }
    
    /// <summary>
    /// Wait for a file to become unlocked (not in use by another process)
    /// </summary>
    private async Task WaitForFileUnlockAsync(string filePath, int maxWaitSeconds = 30)
    {
        var waited = 0;
        while (waited < maxWaitSeconds)
        {
            try
            {
                // Try to open the file with exclusive access
                using var fs = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.None);
                fs.Close();
                Console.WriteLine($"[RustDesk] File is unlocked after {waited}s");
                return;
            }
            catch (IOException)
            {
                // File is still locked, wait and retry
                await Task.Delay(1000);
                waited++;
                if (waited % 5 == 0)
                {
                    Console.WriteLine($"[RustDesk] Waiting for file unlock... ({waited}s)");
                }
            }
        }
        Console.WriteLine($"[RustDesk] File may still be locked after {maxWaitSeconds}s, proceeding anyway");
    }

    /// <summary>
    /// Configure RustDesk to use Vanguard relay server(s)
    /// </summary>
    public async Task<bool> ConfigureForVanguardAsync()
    {
        if (_relayServers.Count == 0)
        {
            Console.WriteLine("[RustDesk] No relay servers configured, skipping configuration");
            return false;
        }

        try
        {
            var primaryRelay = _relayServers.First();
            Console.WriteLine($"[RustDesk] Configuring for Vanguard relay: {primaryRelay.Server}" + 
                (_failoverEnabled ? $" (failover to {_relayServers[1].Server})" : ""));
            
            var config = GenerateConfig();
            
            // Write to multiple config locations to ensure RustDesk finds it
            var configDirs = new[]
            {
                // ProgramData - most reliable for service-based installs
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "RustDesk", "config"),
                // User AppData - for per-user installs
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "RustDesk", "config"),
                // Program Files install location
                @"C:\Program Files\RustDesk\config",
            };
            
            foreach (var configDir in configDirs)
            {
                try
                {
                    Directory.CreateDirectory(configDir);
                    
                    var configPath = Path.Combine(configDir, "RustDesk.toml");
                    await File.WriteAllTextAsync(configPath, config);
                    Console.WriteLine($"[RustDesk] Configuration written to {configPath}");
                    
                    // Also write to RustDesk2.toml for newer versions
                    var config2Path = Path.Combine(configDir, "RustDesk2.toml");
                    await File.WriteAllTextAsync(config2Path, config);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[RustDesk] Skipped {configDir}: {ex.Message}");
                }
            }
            
            // Restart RustDesk service if running
            await RestartRustDeskServiceAsync();
            
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[RustDesk] Configuration error: {ex.Message}");
            return false;
        }
    }

    /// <summary>
    /// Generate RustDesk TOML configuration with dual-relay support and unattended access
    /// </summary>
    private string GenerateConfig()
    {
        var primaryRelay = _relayServers.First();
        
        // Build comma-separated relay server list for failover
        var relayServerList = string.Join(",", _relayServers.Select(r => r.Server));
        
        var config = $@"
rendezvous_server = '{primaryRelay.Server}'
nat_type = 1
serial = 0

[options]
custom-rendezvous-server = '{relayServerList}'
relay-server = '{relayServerList}'
api-server = ''
direct-server = ''
";

        // Add public key from primary server
        if (!string.IsNullOrEmpty(primaryRelay.PublicKey))
        {
            config += $"key = '{primaryRelay.PublicKey}'\n";
        }

        // Enable unattended access settings
        config += @"
allow-auto-disconnect = 'N'
enable-lan-discovery = 'N'
allow-remote-config-modification = 'N'
direct-access-port = ''
";

        // Add permanent password for unattended access
        if (!string.IsNullOrEmpty(_unattendedPassword))
        {
            // RustDesk uses 'permanent_password' in config
            config += $"permanent-password = '{_unattendedPassword}'\n";
            config += "allow-linux-headless = 'Y'\n";
            Console.WriteLine("[RustDesk] Permanent password configured for unattended access");
        }

        // Add failover-specific settings
        if (_failoverEnabled && _relayServers.Count > 1)
        {
            config += $@"
# Dual-relay failover configuration
# Primary: {_relayServers[0].Server} ({_relayServers[0].Region})
# Secondary: {_relayServers[1].Server} ({_relayServers[1].Region})
";
        }

        return config.Trim();
    }

    /// <summary>
    /// Restart RustDesk service to apply configuration
    /// </summary>
    private async Task RestartRustDeskServiceAsync()
    {
        try
        {
            // Try to restart the service
            var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "net",
                    Arguments = "stop RustDesk",
                    UseShellExecute = false,
                    CreateNoWindow = true,
                }
            };
            process.Start();
            await process.WaitForExitAsync();
            
            await Task.Delay(1000);
            
            process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "net",
                    Arguments = "start RustDesk",
                    UseShellExecute = false,
                    CreateNoWindow = true,
                }
            };
            process.Start();
            await process.WaitForExitAsync();
            
            Console.WriteLine("[RustDesk] Service restarted");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[RustDesk] Service restart skipped: {ex.Message}");
        }
    }

    /// <summary>
    /// Get the current RustDesk ID - checks multiple locations since path varies based on install method
    /// </summary>
    public string? GetRustDeskId()
    {
        // Method 1: Check Windows Registry (most reliable)
        try
        {
            using var key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\RustDesk");
            if (key != null)
            {
                var id = key.GetValue("id")?.ToString();
                if (!string.IsNullOrEmpty(id) && id.Length >= 9)
                {
                    Console.WriteLine($"[RustDesk] Found ID in registry: {id}");
                    return id;
                }
            }
        }
        catch { }

        // Method 2: Check ProgramData location (common for service installs)
        try
        {
            var programDataPaths = new[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "RustDesk", "config", "RustDesk.toml"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "RustDesk", "config", "RustDesk2.toml"),
                @"C:\ProgramData\RustDesk\config\RustDesk.toml",
                @"C:\ProgramData\RustDesk\config\RustDesk2.toml",
            };

            foreach (var path in programDataPaths)
            {
                var id = ExtractIdFromConfig(path);
                if (!string.IsNullOrEmpty(id)) return id;
            }
        }
        catch { }

        // Method 3: Check user AppData locations (per-user installs)
        try
        {
            var userPaths = new[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "RustDesk", "config", "RustDesk.toml"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "RustDesk", "config", "RustDesk2.toml"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "RustDesk", "config", "RustDesk.toml"),
            };

            foreach (var path in userPaths)
            {
                var id = ExtractIdFromConfig(path);
                if (!string.IsNullOrEmpty(id)) return id;
            }
        }
        catch { }

        // Method 4: Check SYSTEM account's AppData (when running as service)
        try
        {
            var systemPaths = new[]
            {
                @"C:\Windows\System32\config\systemprofile\AppData\Roaming\RustDesk\config\RustDesk.toml",
                @"C:\Windows\System32\config\systemprofile\AppData\Roaming\RustDesk\config\RustDesk2.toml",
            };

            foreach (var path in systemPaths)
            {
                var id = ExtractIdFromConfig(path);
                if (!string.IsNullOrEmpty(id)) return id;
            }
        }
        catch { }

        // Method 5: Check installation folder
        try
        {
            var installPaths = new[]
            {
                @"C:\Program Files\RustDesk\config\RustDesk.toml",
                @"C:\Program Files\RustDesk\config\RustDesk2.toml",
            };

            foreach (var path in installPaths)
            {
                var id = ExtractIdFromConfig(path);
                if (!string.IsNullOrEmpty(id)) return id;
            }
        }
        catch { }

        Console.WriteLine("[RustDesk] ID not found in any location");
        return null;
    }
    
    /// <summary>
    /// Extract RustDesk ID from a config file
    /// </summary>
    private string? ExtractIdFromConfig(string path)
    {
        try
        {
            if (File.Exists(path))
            {
                var content = File.ReadAllText(path);
                // Match patterns: id = 123456789 or id = "123456789" or id = '123456789'
                var match = System.Text.RegularExpressions.Regex.Match(content, @"^id\s*=\s*['""]?(\d{9,})['""]?", System.Text.RegularExpressions.RegexOptions.Multiline);
                if (match.Success)
                {
                    Console.WriteLine($"[RustDesk] Found ID in {path}: {match.Groups[1].Value}");
                    return match.Groups[1].Value;
                }
            }
        }
        catch { }
        return null;
    }

    /// <summary>
    /// Get relay server status for diagnostics
    /// </summary>
    public (int ServerCount, bool FailoverEnabled, string PrimaryServer) GetRelayStatus()
    {
        return (
            _relayServers.Count,
            _failoverEnabled,
            _relayServers.FirstOrDefault()?.Server ?? "Not configured"
        );
    }

    /// <summary>
    /// Full installation and configuration workflow
    /// </summary>
    public async Task<(bool Success, string? RustDeskId)> EnsureInstalledAndConfiguredAsync(string apiBaseUrl)
    {
        // Fetch relay configuration
        await FetchRelayConfigAsync(apiBaseUrl);
        
        var status = GetRelayStatus();
        Console.WriteLine($"[RustDesk] Relay status: {status.ServerCount} server(s), failover: {status.FailoverEnabled}");
        
        // Check if already installed
        if (!IsRustDeskInstalled())
        {
            Console.WriteLine("[RustDesk] Not installed, initiating installation...");
            var installed = await InstallRustDeskAsync();
            if (!installed)
            {
                return (false, null);
            }
        }
        else
        {
            Console.WriteLine("[RustDesk] Already installed");
            
            // Ensure it's configured for Vanguard
            if (!IsConfiguredForVanguard() && _relayServers.Count > 0)
            {
                Console.WriteLine("[RustDesk] Not configured for Vanguard, applying configuration...");
                await ConfigureForVanguardAsync();
            }
        }

        // Wait for RustDesk to generate ID with retry logic
        var rustDeskId = await WaitForRustDeskIdAsync(maxWaitSeconds: 30);
        Console.WriteLine($"[RustDesk] Current ID: {rustDeskId ?? "Not yet generated"}");
        
        return (true, rustDeskId);
    }
    
    /// <summary>
    /// Wait for RustDesk to generate its ID (may take time after fresh install)
    /// </summary>
    public async Task<string?> WaitForRustDeskIdAsync(int maxWaitSeconds = 30)
    {
        var waited = 0;
        while (waited < maxWaitSeconds)
        {
            var id = GetRustDeskId();
            if (!string.IsNullOrEmpty(id))
            {
                Console.WriteLine($"[RustDesk] ID found after {waited}s: {id}");
                return id;
            }
            
            await Task.Delay(2000);
            waited += 2;
            
            if (waited % 10 == 0)
            {
                Console.WriteLine($"[RustDesk] Waiting for ID generation... ({waited}s)");
            }
        }
        
        Console.WriteLine($"[RustDesk] ID not generated after {maxWaitSeconds}s");
        return null;
    }
}

/// <summary>
/// Individual relay server configuration
/// </summary>
public class RelayServerConfig
{
    [System.Text.Json.Serialization.JsonPropertyName("server")]
    public string Server { get; set; } = "";
    
    [System.Text.Json.Serialization.JsonPropertyName("public_key")]
    public string PublicKey { get; set; } = "";
    
    [System.Text.Json.Serialization.JsonPropertyName("priority")]
    public int Priority { get; set; } = 1;
    
    [System.Text.Json.Serialization.JsonPropertyName("region")]
    public string Region { get; set; } = "primary";
}

/// <summary>
/// Relay server configuration response from Vanguard API
/// </summary>
public class RelayConfigResponse
{
    // Legacy single-server format
    [System.Text.Json.Serialization.JsonPropertyName("relay_server")]
    public string? RelayServer { get; set; }
    
    [System.Text.Json.Serialization.JsonPropertyName("public_key")]
    public string? PublicKey { get; set; }
    
    [System.Text.Json.Serialization.JsonPropertyName("api_server")]
    public string? ApiServer { get; set; }
    
    // New dual-relay format
    [System.Text.Json.Serialization.JsonPropertyName("relay_servers")]
    public List<RelayServerConfig>? RelayServers { get; set; }
    
    [System.Text.Json.Serialization.JsonPropertyName("failover_enabled")]
    public bool FailoverEnabled { get; set; }
    
    // Unattended access password (only returned on first request)
    [System.Text.Json.Serialization.JsonPropertyName("unattended_password")]
    public string? UnattendedPassword { get; set; }
}
