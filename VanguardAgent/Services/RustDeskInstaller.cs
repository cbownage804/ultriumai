// =============================================================================
// RustDesk Auto-Installer Service
// Automatically installs and configures RustDesk for built-in remote access
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
    
    // Vanguard-hosted relay server configuration
    // These will be fetched from the API or config
    private string _relayServer = "";
    private string _publicKey = "";
    
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
        if (string.IsNullOrEmpty(_relayServer))
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
                return content.Contains(_relayServer, StringComparison.OrdinalIgnoreCase);
            }
        }
        catch { }

        return false;
    }

    /// <summary>
    /// Fetch relay server configuration from Vanguard API
    /// </summary>
    public async Task<bool> FetchRelayConfigAsync(string apiBaseUrl)
    {
        try
        {
            var response = await _httpClient.GetAsync($"{apiBaseUrl}/functions/v1/vanguard-relay-config");
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                var config = JsonSerializer.Deserialize<RelayConfig>(json, new JsonSerializerOptions 
                { 
                    PropertyNameCaseInsensitive = true 
                });
                
                if (config != null)
                {
                    _relayServer = config.RelayServer ?? "";
                    _publicKey = config.PublicKey ?? "";
                    Console.WriteLine($"[RustDesk] Relay config loaded: {_relayServer}");
                    return true;
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
    public void SetRelayConfig(string relayServer, string publicKey)
    {
        _relayServer = relayServer;
        _publicKey = publicKey;
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
    /// Configure RustDesk to use Vanguard relay server
    /// </summary>
    public async Task<bool> ConfigureForVanguardAsync()
    {
        if (string.IsNullOrEmpty(_relayServer))
        {
            Console.WriteLine("[RustDesk] No relay server configured, skipping configuration");
            return false;
        }

        try
        {
            Console.WriteLine($"[RustDesk] Configuring for Vanguard relay: {_relayServer}");
            
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
    /// Generate RustDesk TOML configuration
    /// </summary>
    private string GenerateConfig()
    {
        var config = $@"
rendezvous_server = '{_relayServer}'
nat_type = 1
serial = 0

[options]
custom-rendezvous-server = '{_relayServer}'
relay-server = '{_relayServer}'
api-server = ''
direct-server = ''
";

        // Add public key if provided
        if (!string.IsNullOrEmpty(_publicKey))
        {
            config += $"key = '{_publicKey}'\n";
        }

        // Enable unattended access
        config += @"
allow-auto-disconnect = 'N'
enable-lan-discovery = 'N'
allow-remote-config-modification = 'N'
";

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
    /// Full installation and configuration workflow
    /// </summary>
    public async Task<(bool Success, string? RustDeskId)> EnsureInstalledAndConfiguredAsync(string apiBaseUrl)
    {
        // Fetch relay configuration
        await FetchRelayConfigAsync(apiBaseUrl);
        
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
            if (!IsConfiguredForVanguard() && !string.IsNullOrEmpty(_relayServer))
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
/// Relay server configuration from Vanguard API
/// </summary>
public class RelayConfig
{
    public string? RelayServer { get; set; }
    public string? PublicKey { get; set; }
    public string? ApiServer { get; set; }
}
