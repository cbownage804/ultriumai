using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace VanguardInstaller
{
    public class InstallerConfig
    {
        [JsonProperty("token")]
        public string Token { get; set; } = "";
        
        [JsonProperty("client_name")]
        public string ClientName { get; set; } = "Vanguard Device";
        
        [JsonProperty("enable_tray")]
        public bool EnableTray { get; set; } = true;
        
        [JsonProperty("msi_url")]
        public string MsiUrl { get; set; } = "https://nsyobmjpdpvesjwdphlh.supabase.co/storage/v1/object/public/vanguard-agents/VanguardAgent.msi";
        
        [JsonProperty("provision_url")]
        public string ProvisionUrl { get; set; } = "https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/agent-provision";
    }
    
    public class ProvisionResponse
    {
        [JsonProperty("user_id")]
        public string? UserId { get; set; }
        
        [JsonProperty("secret_key")]
        public string? SecretKey { get; set; }
        
        [JsonProperty("client_id")]
        public string? ClientId { get; set; }
        
        [JsonProperty("enable_tray")]
        public bool EnableTray { get; set; }
    }
    
    public class InstallerEngine
    {
        private InstallerConfig? _config;
        private readonly HttpClient _http;
        
        public string ClientName => _config?.ClientName ?? "Vanguard Device";
        public bool EnableTray => _config?.EnableTray ?? true;
        
        public event Action<string>? OnProgress;
        public event Action<int>? OnProgressPercent;
        public event Action<string>? OnError;
        public event Action? OnComplete;
        
        public InstallerEngine()
        {
            _http = new HttpClient();
            _http.Timeout = TimeSpan.FromMinutes(5);
        }
        
        private const string CONFIG_MARKER = "---VANGUARD_CONFIG_START---";
        
        public bool LoadEmbeddedConfig()
        {
            try
            {
                // First, try to read config appended to the EXE itself
                var exePath = Environment.ProcessPath ?? Process.GetCurrentProcess().MainModule?.FileName;
                if (!string.IsNullOrEmpty(exePath) && File.Exists(exePath))
                {
                    var config = ReadAppendedConfig(exePath);
                    if (config != null)
                    {
                        _config = config;
                        return true;
                    }
                }
                
                // Fallback: Look for config.json next to the exe
                var exeDir = AppContext.BaseDirectory;
                var configPath = Path.Combine(exeDir, "installer_config.json");
                
                if (File.Exists(configPath))
                {
                    var json = File.ReadAllText(configPath);
                    _config = JsonConvert.DeserializeObject<InstallerConfig>(json);
                    return _config != null && !string.IsNullOrEmpty(_config.Token);
                }
                
                return false;
            }
            catch
            {
                return false;
            }
        }
        
        /// <summary>
        /// Reads JSON config appended after a marker at the end of the EXE
        /// This allows creating a single self-contained installer with embedded config
        /// </summary>
        private InstallerConfig? ReadAppendedConfig(string exePath)
        {
            try
            {
                // Read the last 10KB of the file (config should be small)
                const int tailSize = 10 * 1024;
                var fileBytes = File.ReadAllBytes(exePath);
                
                var searchStart = Math.Max(0, fileBytes.Length - tailSize);
                var searchBytes = new byte[fileBytes.Length - searchStart];
                Array.Copy(fileBytes, searchStart, searchBytes, 0, searchBytes.Length);
                
                var tail = Encoding.UTF8.GetString(searchBytes);
                var markerIndex = tail.IndexOf(CONFIG_MARKER, StringComparison.Ordinal);
                
                if (markerIndex >= 0)
                {
                    var jsonStart = markerIndex + CONFIG_MARKER.Length;
                    var json = tail.Substring(jsonStart).Trim();
                    
                    // Parse the JSON
                    var config = JsonConvert.DeserializeObject<InstallerConfig>(json);
                    if (config != null && !string.IsNullOrEmpty(config.Token))
                    {
                        return config;
                    }
                }
                
                return null;
            }
            catch
            {
                return null;
            }
        }
        
        public void SetConfig(string token, string clientName, bool enableTray)
        {
            _config = new InstallerConfig
            {
                Token = token,
                ClientName = clientName,
                EnableTray = enableTray
            };
        }
        
        public async Task<bool> RunInstallation()
        {
            if (_config == null || string.IsNullOrEmpty(_config.Token))
            {
                OnError?.Invoke("No configuration loaded");
                return false;
            }
            
            var tempDir = Path.Combine(Path.GetTempPath(), $"VanguardInstall-{Guid.NewGuid():N}");
            Directory.CreateDirectory(tempDir);
            
            try
            {
                // Step 1: Redeem provisioning token
                OnProgress?.Invoke("Fetching credentials...");
                OnProgressPercent?.Invoke(10);
                
                var creds = await RedeemToken();
                if (creds == null || string.IsNullOrEmpty(creds.SecretKey))
                {
                    OnError?.Invoke("Failed to fetch credentials. Token may be expired.\nPlease download a new installer from your dashboard.");
                    return false;
                }
                
                OnProgressPercent?.Invoke(25);
                
                // Step 2: Download MSI
                OnProgress?.Invoke("Downloading agent...");
                var msiPath = Path.Combine(tempDir, "VanguardAgent.msi");
                
                var downloadSuccess = await DownloadFile(_config.MsiUrl, msiPath);
                if (!downloadSuccess)
                {
                    OnError?.Invoke("Failed to download agent installer.");
                    return false;
                }
                
                var fileInfo = new FileInfo(msiPath);
                OnProgress?.Invoke($"Downloaded: {fileInfo.Length / 1024 / 1024:F1} MB");
                OnProgressPercent?.Invoke(60);
                
                // Step 3: Install MSI
                OnProgress?.Invoke("Installing agent...");
                
                var enableTray = creds.EnableTray || _config.EnableTray ? "1" : "0";
                var msiArgs = $"/i \"{msiPath}\" /qn /norestart USERID=\"{creds.UserId}\" SECRETKEY=\"{creds.SecretKey}\" ENABLETRAY={enableTray}";
                
                if (!string.IsNullOrEmpty(creds.ClientId))
                {
                    msiArgs += $" CLIENTID=\"{creds.ClientId}\"";
                }
                
                // Portal configuration - always enable for customer portal access
                msiArgs += $" PORTALKEY=\"{creds.ClientId ?? ""}\"";
                msiArgs += $" PORTALNAME=\"{_config.ClientName} Portal\"";
                msiArgs += " PORTALURL=\"https://ultriumai.com/customer-portal\"";
                
                var installResult = await RunProcess("msiexec.exe", msiArgs);
                
                if (installResult != 0 && installResult != 3010) // 3010 = reboot required, still success
                {
                    OnError?.Invoke($"Installation failed (exit code: {installResult})");
                    return false;
                }
                
                OnProgressPercent?.Invoke(85);
                
                // Step 4: Verify service
                OnProgress?.Invoke("Verifying installation...");
                await Task.Delay(3000); // Wait for service to start
                
                var serviceRunning = await CheckServiceStatus();
                
                if (serviceRunning)
                {
                    OnProgress?.Invoke("Service is running!");
                }
                else
                {
                    OnProgress?.Invoke("Service installed (may need restart)");
                }
                
                // Step 5: Launch tray if enabled
                if (_config.EnableTray)
                {
                    OnProgress?.Invoke("Starting tray application...");
                    await LaunchTrayApp();
                }
                
                OnProgressPercent?.Invoke(100);
                OnComplete?.Invoke();
                
                return true;
            }
            finally
            {
                // Cleanup
                try
                {
                    if (Directory.Exists(tempDir))
                    {
                        Directory.Delete(tempDir, true);
                    }
                }
                catch { }
            }
        }
        
        private async Task<ProvisionResponse?> RedeemToken()
        {
            try
            {
                var body = JsonConvert.SerializeObject(new
                {
                    token = _config!.Token,
                    device_id = Environment.MachineName
                });
                
                var content = new StringContent(body, Encoding.UTF8, "application/json");
                var response = await _http.PostAsync($"{_config.ProvisionUrl}?action=redeem", content);
                
                if (!response.IsSuccessStatusCode)
                {
                    var errorText = await response.Content.ReadAsStringAsync();
                    OnError?.Invoke($"Token redemption failed: {errorText}");
                    return null;
                }
                
                var json = await response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<ProvisionResponse>(json);
            }
            catch (Exception ex)
            {
                OnError?.Invoke($"Network error: {ex.Message}");
                return null;
            }
        }
        
        private async Task<bool> DownloadFile(string url, string destPath)
        {
            try
            {
                using var response = await _http.GetAsync(url, HttpCompletionOption.ResponseHeadersRead);
                response.EnsureSuccessStatusCode();
                
                await using var fs = File.Create(destPath);
                await response.Content.CopyToAsync(fs);
                
                return true;
            }
            catch (Exception ex)
            {
                OnError?.Invoke($"Download error: {ex.Message}");
                return false;
            }
        }
        
        private async Task<int> RunProcess(string fileName, string arguments)
        {
            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = fileName,
                    Arguments = arguments,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true
                };
                
                using var process = Process.Start(psi);
                if (process == null) return -1;
                
                await process.WaitForExitAsync();
                return process.ExitCode;
            }
            catch (Exception ex)
            {
                OnError?.Invoke($"Process error: {ex.Message}");
                return -1;
            }
        }
        
        private async Task<bool> CheckServiceStatus()
        {
            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = "sc.exe",
                    Arguments = "query VanguardAgent",
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    RedirectStandardOutput = true
                };
                
                using var process = Process.Start(psi);
                if (process == null) return false;
                
                var output = await process.StandardOutput.ReadToEndAsync();
                await process.WaitForExitAsync();
                
                return output.Contains("RUNNING");
            }
            catch
            {
                return false;
            }
        }
        
        private async Task LaunchTrayApp()
        {
            try
            {
                // Find the VanguardAgent.exe path from the install location
                var installPath = @"C:\Program Files\Vanguard\VanguardAgent.exe";
                
                // Try to get exact path from registry
                try
                {
                    using var key = Microsoft.Win32.Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Ultrium\Vanguard");
                    if (key != null)
                    {
                        var regPath = key.GetValue("InstallPath")?.ToString();
                        if (!string.IsNullOrEmpty(regPath))
                        {
                            installPath = Path.Combine(regPath, "VanguardAgent.exe");
                        }
                    }
                }
                catch { }
                
                if (!File.Exists(installPath))
                {
                    OnProgress?.Invoke("Tray app will start after reboot");
                    return;
                }
                
                // Use explorer.exe to launch as the interactive user (not as admin)
                // This works even when the installer is running elevated
                var psi = new ProcessStartInfo
                {
                    FileName = "explorer.exe",
                    Arguments = $"\"{installPath}\"",
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                
                using var process = Process.Start(psi);
                if (process != null)
                {
                    await Task.Delay(500);
                    OnProgress?.Invoke("Tray application started");
                }
            }
            catch (Exception ex)
            {
                // If we can't launch, it will start on next login via registry auto-start
                OnProgress?.Invoke($"Tray will start on next login: {ex.Message}");
            }
        }
    }
}
