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
    
    private const string RUSTDESK_VERSION = "1.2.6";
    private const string RUSTDESK_DOWNLOAD_URL = $"https://github.com/rustdesk/rustdesk/releases/download/{RUSTDESK_VERSION}/rustdesk-{RUSTDESK_VERSION}-x86_64.exe";
    
    public RustDeskInstaller(ConfigService configService)
    {
        _configService = configService;
        _httpClient = new HttpClient();
        _httpClient.Timeout = TimeSpan.FromMinutes(10);
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
    /// </summary>
    public async Task<bool> FetchRelayConfigAsync(string apiBaseUrl)
    {
        try
        {
            var response = await _httpClient.GetAsync($"{apiBaseUrl}/functions/v1/vanguard-relay-config");
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
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
                    
                    return _relayServers.Count > 0;
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[RustDesk] Failed to fetch relay config: {ex.Message}");
        }

        return false;
    }

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
        
        var tempPath = Path.Combine(Path.GetTempPath(), $"rustdesk-{RUSTDESK_VERSION}.exe");
        
        try
        {
            // Download installer
            Console.WriteLine($"[RustDesk] Downloading from {RUSTDESK_DOWNLOAD_URL}...");
            
            using var response = await _httpClient.GetAsync(RUSTDESK_DOWNLOAD_URL, HttpCompletionOption.ResponseHeadersRead);
            response.EnsureSuccessStatusCode();
            
            await using var contentStream = await response.Content.ReadAsStreamAsync();
            await using var fileStream = new FileStream(tempPath, FileMode.Create, FileAccess.Write, FileShare.None);
            await contentStream.CopyToAsync(fileStream);
            
            Console.WriteLine($"[RustDesk] Downloaded to {tempPath}");
            
            // Run silent install
            Console.WriteLine("[RustDesk] Running silent installation...");
            
            var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = tempPath,
                    Arguments = "--silent-install",
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                }
            };
            
            process.Start();
            await process.WaitForExitAsync();
            
            if (process.ExitCode == 0)
            {
                Console.WriteLine("[RustDesk] Installation completed successfully");
                
                // Wait for installation to complete
                await Task.Delay(3000);
                
                // Configure for Vanguard relay
                await ConfigureForVanguardAsync();
                
                return true;
            }
            else
            {
                var error = await process.StandardError.ReadToEndAsync();
                Console.WriteLine($"[RustDesk] Installation failed with exit code {process.ExitCode}: {error}");
                return false;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[RustDesk] Installation error: {ex.Message}");
            return false;
        }
        finally
        {
            // Cleanup
            try { File.Delete(tempPath); } catch { }
        }
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
            
            // Create config directory
            var configDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "RustDesk", "config"
            );
            Directory.CreateDirectory(configDir);
            
            // Generate RustDesk.toml configuration
            var configPath = Path.Combine(configDir, "RustDesk.toml");
            var config = GenerateConfig();
            
            await File.WriteAllTextAsync(configPath, config);
            Console.WriteLine($"[RustDesk] Configuration written to {configPath}");
            
            // Also write to RustDesk2.toml for newer versions
            var config2Path = Path.Combine(configDir, "RustDesk2.toml");
            await File.WriteAllTextAsync(config2Path, config);
            
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
    /// Generate RustDesk TOML configuration with dual-relay support
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

        // Enable unattended access and failover settings
        config += @"
allow-auto-disconnect = 'N'
enable-lan-discovery = 'N'
allow-remote-config-modification = 'N'
";

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
    /// Get the current RustDesk ID
    /// </summary>
    public string? GetRustDeskId()
    {
        try
        {
            var configPaths = new[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "RustDesk", "config", "RustDesk.toml"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "RustDesk", "config", "RustDesk2.toml"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "RustDesk", "config", "RustDesk.toml"),
            };

            foreach (var path in configPaths)
            {
                if (File.Exists(path))
                {
                    var content = File.ReadAllText(path);
                    var match = System.Text.RegularExpressions.Regex.Match(content, @"id\s*=\s*""?(\d{9,})""?");
                    if (match.Success)
                    {
                        return match.Groups[1].Value;
                    }
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

        // Wait for RustDesk to generate ID
        await Task.Delay(2000);
        
        var rustDeskId = GetRustDeskId();
        Console.WriteLine($"[RustDesk] Current ID: {rustDeskId ?? "Not yet generated"}");
        
        return (true, rustDeskId);
    }
}

/// <summary>
/// Individual relay server configuration
/// </summary>
public class RelayServerConfig
{
    public string Server { get; set; } = "";
    public string PublicKey { get; set; } = "";
    public int Priority { get; set; } = 1;
    public string Region { get; set; } = "primary";
}

/// <summary>
/// Relay server configuration response from Vanguard API
/// </summary>
public class RelayConfigResponse
{
    // Legacy single-server format
    public string? RelayServer { get; set; }
    public string? PublicKey { get; set; }
    public string? ApiServer { get; set; }
    
    // New dual-relay format
    public List<RelayServerConfig>? RelayServers { get; set; }
    public bool FailoverEnabled { get; set; }
}
