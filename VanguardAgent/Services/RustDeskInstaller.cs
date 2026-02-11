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

    // Prefer MSI for reliable machine-wide installs; EXE as fallback
    private const string RUSTDESK_MSI_DOWNLOAD_URL = $"https://github.com/rustdesk/rustdesk/releases/download/{RUSTDESK_VERSION}/rustdesk-{RUSTDESK_VERSION}-x86_64.msi";
    private const string RUSTDESK_EXE_DOWNLOAD_URL = $"https://github.com/rustdesk/rustdesk/releases/download/{RUSTDESK_VERSION}/rustdesk-{RUSTDESK_VERSION}-x86_64.exe";

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
    /// Paths considered "proper" machine-wide installs (Program Files).
    /// RustDesk in user/system profiles is a portable install and won't survive properly.
    /// </summary>
    private static readonly string[] ProperInstallPaths = new[]
    {
        @"C:\Program Files\RustDesk\rustdesk.exe",
        @"C:\Program Files (x86)\RustDesk\rustdesk.exe",
    };

    /// <summary>
    /// Get the installed RustDesk executable path (checks multiple locations).
    /// Prefers Program Files paths first, then falls back to other locations.
    /// </summary>
    private string? FindRustDeskExePath()
    {
        // Check proper install paths first
        foreach (var path in ProperInstallPaths)
        {
            if (File.Exists(path))
            {
                Console.WriteLine($"[RustDesk] Found proper install at: {path}");
                return path;
            }
        }

        // Registry hint (MSI installs use this)
        try
        {
            using var key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\RustDesk");
            var installLocation = key?.GetValue("InstallLocation")?.ToString();
            if (!string.IsNullOrEmpty(installLocation))
            {
                var candidate = Path.Combine(installLocation, "rustdesk.exe");
                if (File.Exists(candidate))
                {
                    Console.WriteLine($"[RustDesk] Found install via registry: {candidate}");
                    return candidate;
                }
            }
        }
        catch { }

        // Fallback: per-user / system profile paths (these are typically portable installs)
        var fallbackPaths = new[]
        {
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "RustDesk", "rustdesk.exe"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "RustDesk", "rustdesk.exe"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "RustDesk", "rustdesk.exe"),
            @"C:\ProgramData\RustDesk\rustdesk.exe",
            @"C:\Windows\System32\config\systemprofile\AppData\Local\RustDesk\rustdesk.exe",
            @"C:\Windows\System32\config\systemprofile\AppData\Local\Programs\RustDesk\rustdesk.exe",
            @"C:\Windows\ServiceProfiles\LocalService\AppData\Local\Programs\RustDesk\rustdesk.exe",
        };

        foreach (var path in fallbackPaths)
        {
            if (File.Exists(path))
            {
                Console.WriteLine($"[RustDesk] Found PORTABLE/user-profile install at: {path}");
                return path;
            }
        }

        return null;
    }

    /// <summary>
    /// Check if RustDesk is installed in a proper machine-wide location (Program Files).
    /// Returns false for portable/user-profile installs.
    /// </summary>
    private bool IsProperlyInstalled()
    {
        foreach (var path in ProperInstallPaths)
        {
            if (File.Exists(path))
            {
                Console.WriteLine($"[RustDesk] Properly installed at: {path}");
                return true;
            }
        }

        // Also check registry for MSI-based installs
        try
        {
            using var key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\RustDesk");
            var installLocation = key?.GetValue("InstallLocation")?.ToString();
            if (!string.IsNullOrEmpty(installLocation))
            {
                var candidate = Path.Combine(installLocation, "rustdesk.exe");
                if (File.Exists(candidate) && candidate.Contains("Program Files", StringComparison.OrdinalIgnoreCase))
                {
                    Console.WriteLine($"[RustDesk] Properly installed (via registry): {candidate}");
                    return true;
                }
            }
        }
        catch { }

        return false;
    }

    /// <summary>
    /// Check if RustDesk exists anywhere (including portable installs)
    /// </summary>
    public bool IsRustDeskInstalled()
    {
        var exePath = FindRustDeskExePath();
        if (!string.IsNullOrEmpty(exePath))
        {
            Console.WriteLine($"[RustDesk] Found installation at: {exePath}");
            return true;
        }

        return false;
    }

    /// <summary>
    /// Kill all running RustDesk processes and remove portable installs from
    /// user/system profile directories. This is necessary because running under
    /// SYSTEM context, --silent-install often puts RustDesk in the SYSTEM profile
    /// instead of Program Files, resulting in a non-functional portable install.
    /// </summary>
    private async Task CleanupPortableInstall()
    {
        Console.WriteLine("[RustDesk] Cleaning up portable/user-profile install...");

        // 1. Kill all RustDesk processes
        try
        {
            var (exit, _, _) = await RunProcessAsync("taskkill.exe", "/F /IM rustdesk.exe", Environment.SystemDirectory, 15);
            Console.WriteLine($"[RustDesk] taskkill rustdesk.exe: exit={exit}");
        }
        catch { }
        await Task.Delay(2000);

        // 2. Try to uninstall via --uninstall first (cleans up properly)
        var portablePaths = new[]
        {
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "RustDesk", "rustdesk.exe"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "RustDesk", "rustdesk.exe"),
            @"C:\Windows\System32\config\systemprofile\AppData\Local\RustDesk\rustdesk.exe",
            @"C:\Windows\System32\config\systemprofile\AppData\Local\Programs\RustDesk\rustdesk.exe",
            @"C:\Windows\ServiceProfiles\LocalService\AppData\Local\Programs\RustDesk\rustdesk.exe",
        };

        foreach (var exePath in portablePaths)
        {
            if (File.Exists(exePath))
            {
                Console.WriteLine($"[RustDesk] Removing portable install at: {exePath}");
                try
                {
                    var dir = Path.GetDirectoryName(exePath);
                    // Try --uninstall first
                    await RunProcessAsync(exePath, "--uninstall", dir ?? Environment.SystemDirectory, 30);
                    await Task.Delay(2000);
                    
                    // Force-remove directory if still there
                    if (dir != null && Directory.Exists(dir))
                    {
                        Directory.Delete(dir, true);
                        Console.WriteLine($"[RustDesk] Removed directory: {dir}");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[RustDesk] Cleanup error for {exePath}: {ex.Message}");
                }
            }
        }

        // 3. Remove any lingering RustDesk service pointing to portable path
        try
        {
            var (scExit, scOut, _) = await RunProcessAsync("sc.exe", "qc RustDesk", Environment.SystemDirectory, 10);
            if (scExit == 0 && scOut != null && !scOut.Contains("Program Files", StringComparison.OrdinalIgnoreCase))
            {
                Console.WriteLine("[RustDesk] Service points to non-Program Files path, removing...");
                await RunProcessAsync("sc.exe", "stop RustDesk", Environment.SystemDirectory, 15);
                await Task.Delay(2000);
                await RunProcessAsync("sc.exe", "delete RustDesk", Environment.SystemDirectory, 15);
                await Task.Delay(2000);
            }
        }
        catch { }

        Console.WriteLine("[RustDesk] Portable cleanup complete");
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
    /// Priority: 1) Winget 2) Chocolatey 3) MSI 4) EXE
    /// </summary>
    public async Task<bool> InstallRustDeskAsync()
    {
        Console.WriteLine("[RustDesk] Starting installation...");

        // Pre-check: if a portable install exists (user/system profile), clean it up first.
        // Under SYSTEM context, --silent-install often puts RustDesk in the wrong location.
        if (IsRustDeskInstalled() && !IsProperlyInstalled())
        {
            Console.WriteLine("[RustDesk] Detected portable/user-profile install — cleaning up before proper install...");
            await CleanupPortableInstall();
        }

        // Method 1: Try winget first (most reliable on modern Windows)
        if (await TryInstallViaWingetAsync())
        {
            if (IsProperlyInstalled()) return true;
            Console.WriteLine("[RustDesk] winget succeeded but installed portably, cleaning up...");
            await CleanupPortableInstall();
        }

        // Method 2: Try Chocolatey
        if (await TryInstallViaChocolateyAsync())
        {
            if (IsProperlyInstalled()) return true;
            Console.WriteLine("[RustDesk] choco succeeded but installed portably, cleaning up...");
            await CleanupPortableInstall();
        }

        // Method 3: Direct MSI/EXE download as fallback
        return await TryInstallViaDirectDownloadAsync();
    }

    private async Task<bool> TryInstallViaWingetAsync()
    {
        try
        {
            Console.WriteLine("[RustDesk] Trying winget installation...");
            
            // Check if winget is available
            var (checkExit, checkOut, _) = await RunProcessAsync(
                "where.exe", "winget", Environment.SystemDirectory, 10);
            
            if (checkExit != 0)
            {
                Console.WriteLine("[RustDesk] winget not available on this system");
                return false;
            }

            // Run winget install
            var (exit, stdout, stderr) = await RunProcessAsync(
                "winget", "install --id RustDesk.RustDesk --accept-package-agreements --accept-source-agreements --silent",
                Environment.SystemDirectory, 600);

            Console.WriteLine($"[RustDesk] winget exit: {exit}");
            if (!string.IsNullOrEmpty(stdout)) Console.WriteLine($"[RustDesk] winget output: {stdout.Substring(0, Math.Min(500, stdout.Length))}");
            if (!string.IsNullOrEmpty(stderr)) Console.WriteLine($"[RustDesk] winget errors: {stderr}");

            if (exit == 0)
            {
                await Task.Delay(5000);
            if (IsRustDeskInstalled())
                {
                    Console.WriteLine("[RustDesk] winget installation successful");
                    var serviceOk = await EnsureRustDeskServiceInstalledAsync();
                    if (serviceOk)
                    {
                        await ConfigureForVanguardAsync();
                        await VerifyUnattendedAccessConfigured();
                    }
                    return true;
                }
            }
            
            Console.WriteLine("[RustDesk] winget installation failed or RustDesk not detected after install");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[RustDesk] winget error: {ex.Message}");
        }
        
        return false;
    }

    private async Task<bool> TryInstallViaChocolateyAsync()
    {
        try
        {
            Console.WriteLine("[RustDesk] Trying Chocolatey installation...");
            
            // Check if choco is available
            var (checkExit, _, _) = await RunProcessAsync(
                "where.exe", "choco", Environment.SystemDirectory, 10);
            
            if (checkExit != 0)
            {
                Console.WriteLine("[RustDesk] Chocolatey not available on this system");
                return false;
            }

            // Run choco install
            var (exit, stdout, stderr) = await RunProcessAsync(
                "choco", "install rustdesk -y --no-progress",
                Environment.SystemDirectory, 600);

            Console.WriteLine($"[RustDesk] choco exit: {exit}");
            if (!string.IsNullOrEmpty(stdout)) Console.WriteLine($"[RustDesk] choco output: {stdout.Substring(0, Math.Min(500, stdout.Length))}");
            if (!string.IsNullOrEmpty(stderr)) Console.WriteLine($"[RustDesk] choco errors: {stderr}");

            if (exit == 0)
            {
                await Task.Delay(5000);
            if (IsRustDeskInstalled())
                {
                    Console.WriteLine("[RustDesk] Chocolatey installation successful");
                    var serviceOk = await EnsureRustDeskServiceInstalledAsync();
                    if (serviceOk)
                    {
                        await ConfigureForVanguardAsync();
                        await VerifyUnattendedAccessConfigured();
                    }
                    return true;
                }
            }
            
            Console.WriteLine("[RustDesk] Chocolatey installation failed or RustDesk not detected after install");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[RustDesk] Chocolatey error: {ex.Message}");
        }
        
        return false;
    }

    private async Task<bool> TryInstallViaDirectDownloadAsync()
    {
        Console.WriteLine("[RustDesk] Trying direct download installation...");

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

        var msiPath = Path.Combine(localTempPath, $"rustdesk-{RUSTDESK_VERSION}-x86_64.msi");
        var exePath = Path.Combine(localTempPath, $"rustdesk-{RUSTDESK_VERSION}-x86_64.exe");
        var msiLogPath = Path.Combine(localTempPath, "rustdesk-msi-install.log");

        try
        {
            // 1) Prefer MSI for reliable machine-wide installs
            Console.WriteLine($"[RustDesk] Attempting MSI install from {RUSTDESK_MSI_DOWNLOAD_URL}...");
            var msiDownloaded = await DownloadFileAsync(RUSTDESK_MSI_DOWNLOAD_URL, msiPath);

            if (msiDownloaded)
            {
                await WaitForFileUnlockAsync(msiPath, maxWaitSeconds: 30);

                Console.WriteLine($"[RustDesk] Running msiexec silent install (log: {msiLogPath})...");
                var (exitCode, stdout, stderr) = await RunProcessAsync(
                    fileName: "msiexec.exe",
                    arguments: $"/i \"{msiPath}\" /qn /norestart /l*v \"{msiLogPath}\"",
                    workingDirectory: localTempPath,
                    timeoutSeconds: 900
                );

                if (!string.IsNullOrEmpty(stdout)) Console.WriteLine($"[RustDesk] MSI output: {stdout}");
                if (!string.IsNullOrEmpty(stderr)) Console.WriteLine($"[RustDesk] MSI errors: {stderr}");

                // 0 = success, 3010 = success but reboot required
                if (exitCode == 0 || exitCode == 3010)
                {
                    Console.WriteLine($"[RustDesk] MSI install completed (exit {exitCode})");
                    await Task.Delay(5000);

                    if (IsRustDeskInstalled())
                    {
                        var msiServiceOk = await EnsureRustDeskServiceInstalledAsync();
                        if (msiServiceOk)
                        {
                            await ConfigureForVanguardAsync();
                            await VerifyUnattendedAccessConfigured();
                        }
                        return true;
                    }
                    else
                    {
                        Console.WriteLine("[RustDesk] MSI install reported success but RustDesk not detected; checking log...");
                        // Try to read the MSI log for diagnostics
                        try
                        {
                            if (File.Exists(msiLogPath))
                            {
                                var logContent = await File.ReadAllTextAsync(msiLogPath);
                                var lastLines = string.Join("\n", logContent.Split('\n').TakeLast(30));
                                Console.WriteLine($"[RustDesk] MSI log (last 30 lines):\n{lastLines}");
                            }
                        }
                        catch { }
                    }
                }
                else
                {
                    Console.WriteLine($"[RustDesk] MSI install failed with exit code {exitCode}");
                    // Try to read the MSI log for diagnostics
                    try
                    {
                        if (File.Exists(msiLogPath))
                        {
                            var logContent = await File.ReadAllTextAsync(msiLogPath);
                            var lastLines = string.Join("\n", logContent.Split('\n').TakeLast(30));
                            Console.WriteLine($"[RustDesk] MSI log (last 30 lines):\n{lastLines}");
                        }
                    }
                    catch { }
                }
            }
            else
            {
                Console.WriteLine("[RustDesk] MSI download failed");
            }

            // 2) Fallback to EXE installer
            Console.WriteLine($"[RustDesk] Downloading EXE from {RUSTDESK_EXE_DOWNLOAD_URL}...");
            var exeDownloaded = await DownloadFileAsync(RUSTDESK_EXE_DOWNLOAD_URL, exePath);
            if (!exeDownloaded)
            {
                Console.WriteLine("[RustDesk] EXE download also failed - check network/firewall");
                return false;
            }

            await WaitForFileUnlockAsync(exePath, maxWaitSeconds: 30);

            Console.WriteLine("[RustDesk] Running EXE silent install...");
            var (exeExit, exeStdout, exeStderr) = await RunProcessAsync(
                fileName: exePath,
                arguments: "--silent-install",
                workingDirectory: localTempPath,
                timeoutSeconds: 900
            );

            if (!string.IsNullOrEmpty(exeStdout)) Console.WriteLine($"[RustDesk] EXE output: {exeStdout}");
            if (!string.IsNullOrEmpty(exeStderr)) Console.WriteLine($"[RustDesk] EXE errors: {exeStderr}");

            if (exeExit != 0)
            {
                Console.WriteLine($"[RustDesk] EXE install failed with exit code {exeExit}");
                return false;
            }

            Console.WriteLine("[RustDesk] EXE install completed successfully");
            await Task.Delay(5000);

            // Critical: verify it installed to Program Files (not portably)
            if (IsProperlyInstalled())
            {
                Console.WriteLine("[RustDesk] EXE installed to Program Files — proper install confirmed");
                var serviceOk = await EnsureRustDeskServiceInstalledAsync();
                if (serviceOk)
                {
                    await ConfigureForVanguardAsync();
                    await VerifyUnattendedAccessConfigured();
                }
                return true;
            }
            else if (IsRustDeskInstalled())
            {
                // EXE installed portably (likely in SYSTEM profile) — clean up and retry MSI only
                Console.WriteLine("[RustDesk] WARNING: EXE installed portably (not in Program Files). Cleaning up...");
                await CleanupPortableInstall();

                // Last resort: copy the downloaded EXE to Program Files and manually register
                // DO NOT use --silent-install here — it doesn't work under SYSTEM context
                Console.WriteLine("[RustDesk] Attempting manual install to Program Files...");
                var targetDir = @"C:\Program Files\RustDesk";
                var targetExe = Path.Combine(targetDir, "rustdesk.exe");
                try
                {
                    Directory.CreateDirectory(targetDir);
                    File.Copy(exePath, targetExe, true);
                    Console.WriteLine($"[RustDesk] Copied EXE to {targetExe}");

                    // Step 1: Directly create the Windows service (skip --silent-install)
                    var serviceBinPath = $"\"{targetExe}\" --service";
                    Console.WriteLine($"[RustDesk] Creating service with binPath: {serviceBinPath}");
                    
                    var (createExit, createOut, createErr) = await RunProcessAsync(
                        "sc.exe",
                        $"create RustDesk binPath= \"{serviceBinPath}\" start= auto DisplayName= \"RustDesk Service\"",
                        Environment.SystemDirectory, 30);
                    Console.WriteLine($"[RustDesk] sc create: exit={createExit} out={createOut?.Trim()} err={createErr?.Trim()}");

                    // Step 2: Set service description
                    await RunProcessAsync("sc.exe",
                        "description RustDesk \"RustDesk remote desktop service\"",
                        Environment.SystemDirectory, 10);

                    // Step 3: Start the service
                    var (startExit, startOut, startErr) = await RunProcessAsync(
                        "sc.exe", "start RustDesk", Environment.SystemDirectory, 30);
                    Console.WriteLine($"[RustDesk] sc start: exit={startExit} out={startOut?.Trim()}");
                    await Task.Delay(5000);

                    // Step 4: Add uninstall registry entry so Windows sees it as "installed"
                    try
                    {
                        using var uninstallKey = Registry.LocalMachine.CreateSubKey(
                            @"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\RustDesk");
                        if (uninstallKey != null)
                        {
                            uninstallKey.SetValue("DisplayName", "RustDesk");
                            uninstallKey.SetValue("DisplayVersion", RUSTDESK_VERSION);
                            uninstallKey.SetValue("Publisher", "Purslane Ltd.");
                            uninstallKey.SetValue("InstallLocation", targetDir);
                            uninstallKey.SetValue("DisplayIcon", targetExe);
                            uninstallKey.SetValue("UninstallString", $"\"{targetExe}\" --uninstall");
                            uninstallKey.SetValue("NoModify", 1, RegistryValueKind.DWord);
                            uninstallKey.SetValue("NoRepair", 1, RegistryValueKind.DWord);
                            Console.WriteLine("[RustDesk] Added uninstall registry entry");
                        }
                    }
                    catch (Exception regEx)
                    {
                        Console.WriteLine($"[RustDesk] Registry entry warning: {regEx.Message}");
                    }

                    // Verify service is running
                    var (scExit2, scOut2, _) = await RunProcessAsync("sc.exe", "query RustDesk", Environment.SystemDirectory, 10);
                    var running = scExit2 == 0 && (scOut2?.Contains("RUNNING") ?? false);
                    Console.WriteLine($"[RustDesk] Service running after manual install: {running}");

                    if (running)
                    {
                        await ConfigureForVanguardAsync();
                        await VerifyUnattendedAccessConfigured();
                    }
                    return true;
                }
                catch (Exception copyEx)
                {
                    Console.WriteLine($"[RustDesk] Manual install failed: {copyEx.Message}");
                }
            }
            else
            {
                Console.WriteLine("[RustDesk] EXE installer exited successfully but RustDesk was not detected");
            }
            return false;
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

    private async Task<bool> DownloadFileAsync(string url, string destinationPath)
    {
        try
        {
            using var response = await _httpClient.GetAsync(url, HttpCompletionOption.ResponseHeadersRead);

            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"[RustDesk] Download failed: {url} HTTP {(int)response.StatusCode}");
                return false;
            }

            await using var contentStream = await response.Content.ReadAsStreamAsync();
            await using var fileStream = new FileStream(destinationPath, FileMode.Create, FileAccess.Write, FileShare.None);
            await contentStream.CopyToAsync(fileStream);

            var fileInfo = new FileInfo(destinationPath);
            if (!fileInfo.Exists || fileInfo.Length == 0)
            {
                Console.WriteLine($"[RustDesk] Downloaded file missing/empty: {destinationPath}");
                return false;
            }

            Console.WriteLine($"[RustDesk] Downloaded to {destinationPath} ({fileInfo.Length} bytes)");
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[RustDesk] Download error for {url}: {ex.Message}");
            return false;
        }
    }

    private async Task<(int ExitCode, string StdOut, string StdErr)> RunProcessAsync(
        string fileName,
        string arguments,
        string workingDirectory,
        int timeoutSeconds)
    {
        using var process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = fileName,
                Arguments = arguments,
                UseShellExecute = false,
                CreateNoWindow = true,
                WorkingDirectory = workingDirectory,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
            }
        };

        process.Start();

        var stdoutTask = process.StandardOutput.ReadToEndAsync();
        var stderrTask = process.StandardError.ReadToEndAsync();

        var waitTask = process.WaitForExitAsync();
        var completed = await Task.WhenAny(waitTask, Task.Delay(TimeSpan.FromSeconds(timeoutSeconds)));

        if (completed != waitTask)
        {
            try { process.Kill(); } catch { }
            Console.WriteLine($"[RustDesk] Process timed out: {fileName} {arguments}");
        }
        else
        {
            await waitTask;
        }

        var stdout = await stdoutTask;
        var stderr = await stderrTask;

        return (process.HasExited ? process.ExitCode : -1, stdout, stderr);
    }

    /// <summary>
    /// Ensure RustDesk is installed as a Windows service and running.
    /// Returns true if the service is confirmed running.
    /// Includes a 60-second polling loop and multiple fallback strategies.
    /// </summary>
    private async Task<bool> EnsureRustDeskServiceInstalledAsync()
    {
        try
        {
            var installedExe = FindRustDeskExePath();
            if (string.IsNullOrEmpty(installedExe))
            {
                Console.WriteLine("[RustDesk] Cannot install service: rustdesk.exe not found");
                return false;
            }

            Console.WriteLine($"[RustDesk] Using installed exe for service setup: {installedExe}");
            var dir = Path.GetDirectoryName(installedExe) ?? Environment.CurrentDirectory;

            // Step 1: Check if service already exists and is running
            var (scExit, scOut, _) = await RunProcessAsync("sc.exe", "query RustDesk", Environment.SystemDirectory, 10);
            Console.WriteLine($"[RustDesk] sc query RustDesk exit={scExit}, output={scOut?.Trim()}");

            bool serviceExists = scExit == 0 && (scOut?.Contains("RustDesk") ?? false);
            bool serviceRunning = serviceExists && (scOut?.Contains("RUNNING") ?? false);

            if (serviceRunning)
            {
                Console.WriteLine("[RustDesk] Service already running");
                return true;
            }

            // Step 2: Try --silent-install first (registers service + starts it)
            if (!serviceExists)
            {
                Console.WriteLine("[RustDesk] Running --silent-install to register service...");
                var (siExit, siOut, siErr) = await RunProcessAsync(
                    installedExe, "--silent-install", dir, 120);
                Console.WriteLine($"[RustDesk] --silent-install exit={siExit} stdout={siOut?.Trim()} stderr={siErr?.Trim()}");

                // Poll for up to 60 seconds for service to appear
                Console.WriteLine("[RustDesk] Polling for service registration (up to 60s)...");
                for (int i = 0; i < 12; i++)
                {
                    await Task.Delay(5000);
                    (scExit, scOut, _) = await RunProcessAsync("sc.exe", "query RustDesk", Environment.SystemDirectory, 10);
                    serviceExists = scExit == 0 && scOut.Contains("RustDesk");
                    serviceRunning = serviceExists && scOut.Contains("RUNNING");
                    Console.WriteLine($"[RustDesk] Poll {i + 1}/12: exists={serviceExists}, running={serviceRunning}");
                    if (serviceExists) break;
                }
            }

            // Step 3: If --silent-install didn't create the service, try --install-service
            if (!serviceExists)
            {
                Console.WriteLine("[RustDesk] --silent-install did not register service, trying --install-service...");
                var (exit, stdout, stderr) = await RunProcessAsync(
                    installedExe, "--install-service", dir, 120);
                Console.WriteLine($"[RustDesk] --install-service exit={exit} stdout={stdout?.Trim()} stderr={stderr?.Trim()}");
                
                await Task.Delay(5000);
                (scExit, scOut, _) = await RunProcessAsync("sc.exe", "query RustDesk", Environment.SystemDirectory, 10);
                serviceExists = scExit == 0 && scOut.Contains("RustDesk");
            }

            // Step 4: Final fallback - manually create service via sc.exe
            if (!serviceExists)
            {
                Console.WriteLine("[RustDesk] Service still not found, creating manually via sc.exe...");
                var binPath = $"\"{installedExe}\" --service";
                var (createExit, createOut, createErr) = await RunProcessAsync(
                    "sc.exe",
                    $"create RustDesk binPath= {binPath} start= auto DisplayName= \"RustDesk Service\"",
                    Environment.SystemDirectory, 30);
                Console.WriteLine($"[RustDesk] sc create exit={createExit} out={createOut?.Trim()} err={createErr?.Trim()}");
                
                if (createExit == 0)
                {
                    serviceExists = true;
                }
            }

            // Step 5: Start the service if it exists but isn't running
            if (serviceExists)
            {
                (scExit, scOut, _) = await RunProcessAsync("sc.exe", "query RustDesk", Environment.SystemDirectory, 10);
                serviceRunning = scExit == 0 && scOut.Contains("RUNNING");

                if (!serviceRunning)
                {
                    Console.WriteLine("[RustDesk] Starting RustDesk service...");
                    var (startExit, startOut, startErr) = await RunProcessAsync(
                        "sc.exe", "start RustDesk", Environment.SystemDirectory, 30);
                    Console.WriteLine($"[RustDesk] sc start exit={startExit} out={startOut?.Trim()} err={startErr?.Trim()}");

                    // Wait and verify it's running
                    await Task.Delay(5000);
                    (scExit, scOut, _) = await RunProcessAsync("sc.exe", "query RustDesk", Environment.SystemDirectory, 10);
                    serviceRunning = scExit == 0 && scOut.Contains("RUNNING");
                }
            }

            Console.WriteLine($"[RustDesk] Service setup result: exists={serviceExists}, running={serviceRunning}");

            if (!serviceRunning)
            {
                // Last resort: launch rustdesk.exe directly to at least generate an ID
                Console.WriteLine("[RustDesk] WARNING: Service failed to start. Launching rustdesk.exe directly as fallback...");
                _ = Task.Run(async () =>
                {
                    try
                    {
                        var (rdExit, rdOut, rdErr) = await RunProcessAsync(
                            installedExe, "", dir, 30);
                        Console.WriteLine($"[RustDesk] Direct launch exit={rdExit}");
                    }
                    catch { }
                });
                await Task.Delay(10000);
                return false;
            }

            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[RustDesk] Service install error: {ex.Message}\n{ex.StackTrace}");
            return false;
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
                @"C:\Program Files (x86)\RustDesk\config",
                @"C:\Program Files\RustDesk\config",
                // Service profile paths (RustDesk service runs as LocalService or SYSTEM)
                @"C:\Windows\ServiceProfiles\LocalService\AppData\Roaming\RustDesk\config",
                @"C:\Windows\ServiceProfiles\LocalService\AppData\Local\RustDesk\config",
                @"C:\Windows\System32\config\systemprofile\AppData\Roaming\RustDesk\config",
                @"C:\Windows\System32\config\systemprofile\AppData\Local\RustDesk\config",
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
                    var config2Content = GenerateConfig2();
                    await File.WriteAllTextAsync(config2Path, config2Content);
                    Console.WriteLine($"[RustDesk] RustDesk2.toml written to {config2Path}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[RustDesk] Skipped {configDir}: {ex.Message}");
                }
            }
            
            // Set the permanent password via CLI (RustDesk ignores password in config files)
            if (!string.IsNullOrEmpty(_unattendedPassword))
            {
                await SetPasswordViaCli(_unattendedPassword);
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
    /// Set the RustDesk permanent password via CLI command.
    /// RustDesk does NOT read passwords from config files — the CLI is the only reliable method.
    /// </summary>
    private async Task SetPasswordViaCli(string password)
    {
        var exePath = FindRustDeskExePath();
        if (string.IsNullOrEmpty(exePath))
        {
            Console.WriteLine("[RustDesk] Cannot set password: rustdesk.exe not found");
            return;
        }

        try
        {
            var dir = Path.GetDirectoryName(exePath) ?? Environment.CurrentDirectory;
            
            // Stop service first so we can modify the password
            await RunProcessAsync("sc.exe", "stop RustDesk", Environment.SystemDirectory, 15);
            await Task.Delay(2000);

            // Set permanent password via CLI
            var (exit, stdout, stderr) = await RunProcessAsync(
                exePath, $"--password \"{password}\"", dir, 30);
            
            Console.WriteLine($"[RustDesk] Set password via CLI: exit={exit} stdout={stdout?.Trim()} stderr={stderr?.Trim()}");

            if (exit == 0)
            {
                Console.WriteLine("[RustDesk] Permanent password set successfully via CLI");
            }
            else
            {
                Console.WriteLine($"[RustDesk] Password CLI returned exit code {exit}, trying alternative method...");
                
                // Alternative: try --permanent-password flag (some versions)
                var (exit2, stdout2, stderr2) = await RunProcessAsync(
                    exePath, $"--permanent-password \"{password}\"", dir, 30);
                Console.WriteLine($"[RustDesk] Alternative password set: exit={exit2}");
            }

            // Restart service
            await RunProcessAsync("sc.exe", "start RustDesk", Environment.SystemDirectory, 15);
            await Task.Delay(3000);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[RustDesk] Failed to set password via CLI: {ex.Message}");
        }
    }

    /// <summary>
    /// Generate RustDesk2.toml with approve-mode settings for true unattended access
    /// </summary>
    private string GenerateConfig2()
    {
        // RustDesk2.toml controls security/approval settings
        var config2 = @"[options]
# Allow unattended access with password only — no click-to-approve dialog
approve-mode = 'password'
# Verification uses the permanent password set via CLI
verification-method = 'use-permanent-password'
";
        return config2.Trim();
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

        // Note: permanent password is set via CLI (--password), NOT via config file.
        // RustDesk ignores permanent-password in TOML config files.
        if (!string.IsNullOrEmpty(_unattendedPassword))
        {
            Console.WriteLine("[RustDesk] Permanent password will be set via CLI after config write");
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
            Console.WriteLine("[RustDesk] Restarting RustDesk service...");
            
            // Use sc.exe which is more reliable than net commands
            var (stopExit, _, _) = await RunProcessAsync("sc.exe", "stop RustDesk", Environment.SystemDirectory, 15);
            Console.WriteLine($"[RustDesk] sc stop exit={stopExit}");
            
            await Task.Delay(2000);
            
            var (startExit, startOut, startErr) = await RunProcessAsync("sc.exe", "start RustDesk", Environment.SystemDirectory, 15);
            Console.WriteLine($"[RustDesk] sc start exit={startExit} out={startOut?.Trim()} err={startErr?.Trim()}");
            
            if (startExit == 0)
            {
                Console.WriteLine("[RustDesk] Service restarted successfully");
            }
            else
            {
                Console.WriteLine("[RustDesk] Service restart may have failed");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[RustDesk] Service restart error: {ex.Message}");
        }
    }

    /// <summary>
    /// Verify that unattended access is fully configured: service running, approve-mode set, password applied.
    /// Logs all findings for remote diagnostics.
    /// </summary>
    private async Task<bool> VerifyUnattendedAccessConfigured()
    {
        Console.WriteLine("[RustDesk] === Post-Install Verification ===");
        var allGood = true;

        // 1. Verify service exists and is running
        var (scExit, scOut, _) = await RunProcessAsync("sc.exe", "query RustDesk", Environment.SystemDirectory, 10);
        var serviceRunning = scExit == 0 && scOut.Contains("RUNNING");
        Console.WriteLine($"[RustDesk] [Verify] Service running: {serviceRunning}");
        if (!serviceRunning)
        {
            Console.WriteLine($"[RustDesk] [Verify] Service state: {scOut?.Trim()}");
            allGood = false;
        }

        // 2. Verify RustDesk2.toml has approve-mode = 'password' in the service profile paths
        var serviceConfigPaths = new[]
        {
            @"C:\Windows\ServiceProfiles\LocalService\AppData\Roaming\RustDesk\config\RustDesk2.toml",
            @"C:\Windows\ServiceProfiles\LocalService\AppData\Local\RustDesk\config\RustDesk2.toml",
            @"C:\Windows\System32\config\systemprofile\AppData\Roaming\RustDesk\config\RustDesk2.toml",
            @"C:\Windows\System32\config\systemprofile\AppData\Local\RustDesk\config\RustDesk2.toml",
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "RustDesk", "config", "RustDesk2.toml"),
            @"C:\Program Files (x86)\RustDesk\config\RustDesk2.toml",
            @"C:\Program Files\RustDesk\config\RustDesk2.toml",
        };

        bool foundApproveMode = false;
        bool foundVerificationMethod = false;
        foreach (var configPath in serviceConfigPaths)
        {
            try
            {
                if (File.Exists(configPath))
                {
                    var content = File.ReadAllText(configPath);
                    if (content.Contains("approve-mode") && content.Contains("password"))
                    {
                        foundApproveMode = true;
                        Console.WriteLine($"[RustDesk] [Verify] approve-mode=password FOUND in {configPath}");
                    }
                    if (content.Contains("verification-method") && content.Contains("use-permanent-password"))
                    {
                        foundVerificationMethod = true;
                        Console.WriteLine($"[RustDesk] [Verify] verification-method=use-permanent-password FOUND in {configPath}");
                    }
                }
            }
            catch { }
        }

        if (!foundApproveMode)
        {
            Console.WriteLine("[RustDesk] [Verify] WARNING: approve-mode='password' not found in any service profile config");
            allGood = false;
        }
        if (!foundVerificationMethod)
        {
            Console.WriteLine("[RustDesk] [Verify] WARNING: verification-method='use-permanent-password' not found in any service profile config");
            allGood = false;
        }

        // 3. Verify password is cached locally
        var passwordCached = !string.IsNullOrEmpty(_unattendedPassword);
        Console.WriteLine($"[RustDesk] [Verify] Unattended password cached: {passwordCached}");
        if (!passwordCached)
        {
            allGood = false;
        }

        // 4. Get the RustDesk ID to confirm end-to-end
        var rustDeskId = GetRustDeskId();
        Console.WriteLine($"[RustDesk] [Verify] RustDesk ID: {rustDeskId ?? "NOT FOUND"}");
        if (string.IsNullOrEmpty(rustDeskId))
        {
            allGood = false;
        }

        Console.WriteLine($"[RustDesk] === Verification Result: {(allGood ? "ALL CHECKS PASSED" : "SOME CHECKS FAILED")} ===");
        return allGood;
    }


    /// Only returns plain numeric IDs (6+ digits). Rejects encoded/base64 values.
    /// </summary>
    public string? GetRustDeskId()
    {
        // Strategy 1: Windows Registry (fastest, most reliable when service has run)
        try
        {
            foreach (var regPath in new[] { @"SOFTWARE\RustDesk", @"SOFTWARE\WOW6432Node\RustDesk" })
            {
                using var key = Registry.LocalMachine.OpenSubKey(regPath);
                var id = key?.GetValue("id")?.ToString()?.Replace(" ", "");
                if (!string.IsNullOrEmpty(id) && id.Length >= 6 && System.Text.RegularExpressions.Regex.IsMatch(id, @"^\d+$"))
                {
                    Console.WriteLine($"[RustDesk] Found numeric ID in registry ({regPath}): {id}");
                    return id;
                }
                else if (!string.IsNullOrEmpty(id))
                {
                    Console.WriteLine($"[RustDesk] Ignoring non-numeric registry ID ({regPath}): {id.Substring(0, Math.Min(20, id.Length))}...");
                }
            }
        }
        catch { }

        // Strategy 2: Check ALL known config file locations (including service profiles)
        var configPaths = new List<string>
        {
            // ProgramData (machine-wide, most common for MSI installs)
            @"C:\ProgramData\RustDesk\config\RustDesk.toml",
            @"C:\ProgramData\RustDesk\config\RustDesk2.toml",
            
            // Program Files install dir
            @"C:\Program Files (x86)\RustDesk\RustDesk.toml",
            @"C:\Program Files (x86)\RustDesk\RustDesk2.toml",
            @"C:\Program Files\RustDesk\RustDesk.toml",
            @"C:\Program Files\RustDesk\RustDesk2.toml",
            
            // LocalService profile (RustDesk service often runs as LocalService)
            @"C:\Windows\ServiceProfiles\LocalService\AppData\Roaming\RustDesk\config\RustDesk.toml",
            @"C:\Windows\ServiceProfiles\LocalService\AppData\Roaming\RustDesk\config\RustDesk2.toml",
            @"C:\Windows\ServiceProfiles\LocalService\AppData\Local\RustDesk\config\RustDesk.toml",
            @"C:\Windows\ServiceProfiles\LocalService\AppData\Local\RustDesk\config\RustDesk2.toml",
            
            // NetworkService profile
            @"C:\Windows\ServiceProfiles\NetworkService\AppData\Roaming\RustDesk\config\RustDesk.toml",
            @"C:\Windows\ServiceProfiles\NetworkService\AppData\Roaming\RustDesk\config\RustDesk2.toml",
            
            // SYSTEM profile (our agent runs as SYSTEM)
            @"C:\Windows\System32\config\systemprofile\AppData\Roaming\RustDesk\config\RustDesk.toml",
            @"C:\Windows\System32\config\systemprofile\AppData\Roaming\RustDesk\config\RustDesk2.toml",
            @"C:\Windows\System32\config\systemprofile\AppData\Local\RustDesk\config\RustDesk.toml",
            @"C:\Windows\System32\config\systemprofile\AppData\Local\RustDesk\config\RustDesk2.toml",
        };
        
        // Add environment-resolved paths (may overlap but deduplication is cheap)
        try
        {
            var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            var localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            var commonAppData = Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData);
            
            configPaths.Add(Path.Combine(appData, "RustDesk", "config", "RustDesk.toml"));
            configPaths.Add(Path.Combine(appData, "RustDesk", "config", "RustDesk2.toml"));
            configPaths.Add(Path.Combine(localAppData, "RustDesk", "config", "RustDesk.toml"));
            configPaths.Add(Path.Combine(localAppData, "RustDesk", "config", "RustDesk2.toml"));
            configPaths.Add(Path.Combine(commonAppData, "RustDesk", "config", "RustDesk.toml"));
            configPaths.Add(Path.Combine(commonAppData, "RustDesk", "config", "RustDesk2.toml"));
        }
        catch { }

        // Also enumerate user profiles to find per-user installs
        try
        {
            var usersDir = @"C:\Users";
            if (Directory.Exists(usersDir))
            {
                foreach (var userDir in Directory.GetDirectories(usersDir))
                {
                    configPaths.Add(Path.Combine(userDir, "AppData", "Roaming", "RustDesk", "config", "RustDesk.toml"));
                    configPaths.Add(Path.Combine(userDir, "AppData", "Roaming", "RustDesk", "config", "RustDesk2.toml"));
                    configPaths.Add(Path.Combine(userDir, "AppData", "Local", "RustDesk", "config", "RustDesk.toml"));
                    configPaths.Add(Path.Combine(userDir, "AppData", "Local", "RustDesk", "config", "RustDesk2.toml"));
                }
            }
        }
        catch { }

        foreach (var path in configPaths.Distinct())
        {
            var id = ExtractIdFromConfig(path);
            if (!string.IsNullOrEmpty(id)) return id;
        }

        // Strategy 3: Ask RustDesk via --get-id (last resort - can hang in SYSTEM context)
        try
        {
            var exePath = FindRustDeskExePath();
            if (!string.IsNullOrEmpty(exePath))
            {
                var dir = Path.GetDirectoryName(exePath) ?? Environment.CurrentDirectory;

                using var p = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = exePath,
                        Arguments = "--get-id",
                        UseShellExecute = false,
                        CreateNoWindow = true,
                        WorkingDirectory = dir,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        // Prevent GUI initialization in headless context
                        EnvironmentVariables = { ["DISPLAY"] = "" },
                    }
                };

                p.Start();

                // Use short timeout - --get-id can hang trying to init GUI in SYSTEM context
                if (p.WaitForExit(5000))
                {
                    var output = (p.StandardOutput.ReadToEnd() + "\n" + p.StandardError.ReadToEnd()).Trim();
                    Console.WriteLine($"[RustDesk] --get-id raw output: '{output}'");
                    var match = System.Text.RegularExpressions.Regex.Match(output, @"(\d[\d\s]{5,})");
                    if (match.Success)
                    {
                        var id = match.Groups[1].Value.Replace(" ", "").Trim();
                        Console.WriteLine($"[RustDesk] Found ID via --get-id: {id}");
                        return id;
                    }
                }
                else
                {
                    Console.WriteLine("[RustDesk] --get-id timed out (SYSTEM context GUI hang), killing process");
                    try { p.Kill(true); } catch { }
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[RustDesk] --get-id failed: {ex.Message}");
        }

        Console.WriteLine("[RustDesk] ID not found in any location (registry, config files, --get-id)");
        return null;
    }
    
    /// <summary>
    /// Collect comprehensive RustDesk diagnostics for remote troubleshooting
    /// </summary>
    public string CollectDiagnostics()
    {
        var diag = new System.Text.StringBuilder();
        diag.AppendLine("=== RustDesk Diagnostics ===");
        diag.AppendLine($"Timestamp: {DateTime.UtcNow:O}");
        diag.AppendLine();
        
        // 1. Binary detection
        var exePath = FindRustDeskExePath();
        diag.AppendLine($"Binary found: {(exePath != null ? exePath : "NOT FOUND")}");
        if (exePath != null)
        {
            try { diag.AppendLine($"Binary size: {new FileInfo(exePath).Length} bytes"); } catch { }
            try
            {
                var fvi = FileVersionInfo.GetVersionInfo(exePath);
                diag.AppendLine($"Binary version: {fvi.FileVersion}");
            }
            catch { }
        }
        diag.AppendLine();
        
        // 2. Service status
        try
        {
            using var p = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "sc.exe", Arguments = "query RustDesk",
                    UseShellExecute = false, CreateNoWindow = true,
                    RedirectStandardOutput = true, RedirectStandardError = true,
                    WorkingDirectory = Environment.SystemDirectory
                }
            };
            p.Start();
            var scOut = p.StandardOutput.ReadToEnd();
            p.WaitForExit(5000);
            diag.AppendLine($"Service status:\n{scOut.Trim()}");
        }
        catch (Exception ex) { diag.AppendLine($"Service query failed: {ex.Message}"); }
        diag.AppendLine();
        
        // 3. Registry
        diag.AppendLine("Registry entries:");
        foreach (var regPath in new[] { @"SOFTWARE\RustDesk", @"SOFTWARE\WOW6432Node\RustDesk" })
        {
            try
            {
                using var key = Registry.LocalMachine.OpenSubKey(regPath);
                if (key != null)
                {
                    foreach (var name in key.GetValueNames())
                    {
                        diag.AppendLine($"  HKLM\\{regPath}\\{name} = {key.GetValue(name)}");
                    }
                }
                else
                {
                    diag.AppendLine($"  HKLM\\{regPath}: not found");
                }
            }
            catch { }
        }
        diag.AppendLine();
        
        // 4. Config files
        diag.AppendLine("Config file scan:");
        var searchDirs = new[]
        {
            @"C:\ProgramData\RustDesk",
            @"C:\Program Files (x86)\RustDesk",
            @"C:\Program Files\RustDesk",
            @"C:\Windows\ServiceProfiles\LocalService\AppData\Roaming\RustDesk",
            @"C:\Windows\ServiceProfiles\LocalService\AppData\Local\RustDesk",
            @"C:\Windows\System32\config\systemprofile\AppData\Roaming\RustDesk",
            @"C:\Windows\System32\config\systemprofile\AppData\Local\RustDesk",
        };
        
        // Also add user profile dirs
        try
        {
            foreach (var userDir in Directory.GetDirectories(@"C:\Users"))
            {
                var rdDir = Path.Combine(userDir, "AppData", "Roaming", "RustDesk");
                if (Directory.Exists(rdDir))
                {
                    searchDirs = searchDirs.Append(rdDir).ToArray();
                }
            }
        }
        catch { }
        
        foreach (var dir in searchDirs)
        {
            if (Directory.Exists(dir))
            {
                diag.AppendLine($"  [{dir}]");
                try
                {
                    foreach (var file in Directory.GetFiles(dir, "*", SearchOption.AllDirectories))
                    {
                        var fi = new FileInfo(file);
                        diag.AppendLine($"    {fi.Name} ({fi.Length}b, modified {fi.LastWriteTimeUtc:u})");
                        
                        // Show content of TOML files (they're small)
                        if (fi.Extension.Equals(".toml", StringComparison.OrdinalIgnoreCase) && fi.Length < 10240)
                        {
                            try
                            {
                                var content = File.ReadAllText(file);
                                foreach (var line in content.Split('\n').Take(20))
                                {
                                    diag.AppendLine($"      | {line.TrimEnd()}");
                                }
                                if (content.Split('\n').Length > 20)
                                    diag.AppendLine($"      | ... ({content.Split('\n').Length} lines total)");
                            }
                            catch { }
                        }
                    }
                }
                catch (Exception ex) { diag.AppendLine($"    (access error: {ex.Message})"); }
            }
        }
        diag.AppendLine();
        
        // 5. Current ID retrieval attempt
        var currentId = GetRustDeskId();
        diag.AppendLine($"Current ID: {currentId ?? "NULL"}");
        
        // 6. Relay config
        var relayStatus = GetRelayStatus();
        diag.AppendLine($"Relay servers: {relayStatus.ServerCount}, Failover: {relayStatus.FailoverEnabled}, Primary: {relayStatus.PrimaryServer}");
        diag.AppendLine($"Unattended password cached: {(_unattendedPassword != null ? "YES" : "NO")}");
        
        return diag.ToString();
    }
    
    /// <summary>
    /// Extract RustDesk ID from a config file.
    /// IMPORTANT: Only returns plain numeric IDs (6+ digits). 
    /// enc_id values are base64-encoded and must NOT be used as the machine ID.
    /// </summary>
    private string? ExtractIdFromConfig(string path)
    {
        try
        {
            if (File.Exists(path))
            {
                var content = File.ReadAllText(path);
                // Match patterns: id = 123456789 or id = "123456789" or id = '123456789'
                var match = System.Text.RegularExpressions.Regex.Match(content, @"^id\s*=\s*['""]?([\d\s]{6,})['""]?", System.Text.RegularExpressions.RegexOptions.Multiline);
                if (match.Success)
                {
                    var rawId = match.Groups[1].Value.Replace(" ", "").Trim();
                    if (rawId.Length >= 6 && System.Text.RegularExpressions.Regex.IsMatch(rawId, @"^\d+$"))
                    {
                        Console.WriteLine($"[RustDesk] Found numeric ID in {path}: {rawId}");
                        return rawId;
                    }
                    else
                    {
                        Console.WriteLine($"[RustDesk] Ignoring non-numeric id value in {path}: {rawId}");
                    }
                }
                // NOTE: enc_id is intentionally NOT used - it contains a base64-encoded value
                // that is NOT the machine's RustDesk ID. The plain numeric 'id' field or
                // the registry value is the correct source.
                var encMatch = System.Text.RegularExpressions.Regex.Match(content, @"^enc_id\s*=\s*['""]?(.+?)['""]?\s*$", System.Text.RegularExpressions.RegexOptions.Multiline);
                if (encMatch.Success)
                {
                    Console.WriteLine($"[RustDesk] Skipping enc_id in {path} (encoded, not usable as machine ID): {encMatch.Groups[1].Value.Substring(0, Math.Min(20, encMatch.Groups[1].Value.Length))}...");
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
        // Fetch relay configuration (optional - RustDesk works with public relays too)
        await FetchRelayConfigAsync(apiBaseUrl);
        
        var status = GetRelayStatus();
        Console.WriteLine($"[RustDesk] Relay status: {status.ServerCount} server(s), failover: {status.FailoverEnabled}");
        
        // Check if already properly installed (in Program Files)
        if (IsProperlyInstalled())
        {
            Console.WriteLine("[RustDesk] Already properly installed in Program Files");
            
            // Always ensure service is running
            var serviceOk = await EnsureRustDeskServiceInstalledAsync();
            
            // Ensure it's configured for Vanguard relay (if relay is set up)
            if (serviceOk && !IsConfiguredForVanguard() && _relayServers.Count > 0)
            {
                Console.WriteLine("[RustDesk] Not configured for Vanguard, applying configuration...");
                await ConfigureForVanguardAsync();
                await VerifyUnattendedAccessConfigured();
            }
        }
        else if (IsRustDeskInstalled())
        {
            // Exists but in a portable location — clean up and reinstall properly
            Console.WriteLine("[RustDesk] Found portable install, cleaning up and reinstalling properly...");
            await CleanupPortableInstall();
            
            var installed = await InstallRustDeskAsync();
            if (!installed)
            {
                Console.WriteLine("[RustDesk] REINSTALLATION FAILED after portable cleanup");
                return (false, null);
            }
        }
        else
        {
            Console.WriteLine("[RustDesk] Not installed, initiating installation...");
            var installed = await InstallRustDeskAsync();
            if (!installed)
            {
                // Log diagnostic info
                Console.WriteLine("[RustDesk] INSTALLATION FAILED - Diagnostics:");
                var (scExit, scOut, _) = await RunProcessAsync("sc.exe", "query RustDesk", Environment.SystemDirectory, 5);
                Console.WriteLine($"[RustDesk]   sc query: exit={scExit} output={scOut?.Trim()}");
                var (whereExit, whereOut, _) = await RunProcessAsync("where.exe", "rustdesk", Environment.SystemDirectory, 5);
                Console.WriteLine($"[RustDesk]   where rustdesk: exit={whereExit} output={whereOut?.Trim()}");
                return (false, null);
            }
        }

        // Wait for RustDesk to generate ID - use longer timeout for fresh installs
        var rustDeskId = await WaitForRustDeskIdAsync(maxWaitSeconds: 90);
        Console.WriteLine($"[RustDesk] Current ID: {rustDeskId ?? "NOT GENERATED"}");
        
        if (string.IsNullOrEmpty(rustDeskId))
        {
            // Extra diagnostics when ID fails
            Console.WriteLine("[RustDesk] ID RETRIEVAL FAILED - Diagnostics:");
            var (scExit, scOut, _) = await RunProcessAsync("sc.exe", "query RustDesk", Environment.SystemDirectory, 5);
            Console.WriteLine($"[RustDesk]   Service: {scOut?.Trim()}");
            
            var exePath = FindRustDeskExePath();
            Console.WriteLine($"[RustDesk]   Exe path: {exePath ?? "NOT FOUND"}");
            
            // List config directories to see what exists
            var configDirs = new[] {
                @"C:\ProgramData\RustDesk\config",
                @"C:\Program Files (x86)\RustDesk",
                @"C:\Program Files\RustDesk",
                @"C:\Windows\ServiceProfiles\LocalService\AppData\Roaming\RustDesk\config",
            };
            foreach (var d in configDirs)
            {
                if (Directory.Exists(d))
                {
                    var files = Directory.GetFiles(d);
                    Console.WriteLine($"[RustDesk]   {d}: [{string.Join(", ", files.Select(Path.GetFileName))}]");
                }
            }
        }
        
        return (true, rustDeskId);
    }
    
    /// <summary>
    /// Wait for RustDesk to generate its ID (may take time after fresh install)
    /// </summary>
    public async Task<string?> WaitForRustDeskIdAsync(int maxWaitSeconds = 60)
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
            
            await Task.Delay(3000);
            waited += 3;
            
            if (waited % 15 == 0)
            {
                Console.WriteLine($"[RustDesk] Waiting for ID generation... ({waited}s)");
                // Re-check service status periodically
                var (scExit, scOut, _) = await RunProcessAsync("sc.exe", "query RustDesk", Environment.SystemDirectory, 5);
                Console.WriteLine($"[RustDesk] Service status: {scOut?.Trim()}");
                
                // If service stopped, try starting it again
                if (scExit == 0 && (scOut?.Contains("STOPPED") ?? false))
                {
                    Console.WriteLine("[RustDesk] Service stopped, restarting...");
                    await RunProcessAsync("sc.exe", "start RustDesk", Environment.SystemDirectory, 10);
                }
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
