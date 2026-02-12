// =============================================================================
// MeshCentral Agent Installer Service
// Automatically installs and configures MeshAgent for zero-touch remote access
// Primary remote access solution for Vanguard
// =============================================================================

using System.Diagnostics;
using System.Net.Http;
using System.Text.Json;
using Microsoft.Win32;

namespace VanguardAgent.Services;

public class MeshCentralInstaller
{
    private readonly ConfigService _configService;
    private readonly HttpClient _httpClient;

    // MeshCentral server config (fetched from Vanguard API)
    private string? _meshServerUrl;
    private string? _meshId;
    private string? _nodeId;

    // Paths
    private const string MESHAGENT_SERVICE_NAME = "Mesh Agent";
    private static readonly string MeshAgentDir = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),
        "Mesh Agent"
    );
    private static readonly string MeshAgentExe = Path.Combine(MeshAgentDir, "MeshAgent.exe");

    // Cached node ID path
    private string NodeIdCachePath => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
        "VanguardAgent", "meshcentral_node_id.dat"
    );

    public MeshCentralInstaller(ConfigService configService)
    {
        _configService = configService;
        _httpClient = new HttpClient();
        _httpClient.Timeout = TimeSpan.FromMinutes(10);

        // Load cached node ID
        LoadCachedNodeId();
    }

    /// <summary>
    /// Get the MeshCentral node ID for this device (reported in heartbeat)
    /// </summary>
    public string? GetNodeId() => _nodeId;

    /// <summary>
    /// Pre-load MeshCentral server config from registration response
    /// </summary>
    public void SetServerConfig(string serverUrl, string meshId)
    {
        _meshServerUrl = serverUrl;
        _meshId = meshId;
        Console.WriteLine($"[MeshCentral] Server config pre-loaded: server={serverUrl}, meshId={meshId}");
    }

    /// <summary>
    /// Get the MeshCentral mesh/group ID
    /// </summary>
    public string? GetMeshId() => _meshId;

    /// <summary>
    /// Check if MeshAgent is installed
    /// </summary>
    public bool IsMeshAgentInstalled()
    {
        // Check if exe exists
        if (File.Exists(MeshAgentExe))
        {
            Console.WriteLine($"[MeshCentral] Found MeshAgent at: {MeshAgentExe}");
            return true;
        }

        // Check registry for service
        try
        {
            using var key = Registry.LocalMachine.OpenSubKey(
                @"SYSTEM\CurrentControlSet\Services\Mesh Agent");
            if (key != null)
            {
                var imagePath = key.GetValue("ImagePath")?.ToString();
                if (!string.IsNullOrEmpty(imagePath) && File.Exists(imagePath.Trim('"')))
                {
                    Console.WriteLine($"[MeshCentral] Found MeshAgent via registry: {imagePath}");
                    return true;
                }
            }
        }
        catch { }

        return false;
    }

    /// <summary>
    /// Fetch MeshCentral configuration from Vanguard API
    /// Returns the mesh server URL and mesh group ID
    /// </summary>
    public async Task<bool> FetchMeshConfigAsync(string apiBaseUrl)
    {
        try
        {
            string configUrl;
            if (apiBaseUrl.Contains("/functions/v1"))
            {
                configUrl = $"{apiBaseUrl.TrimEnd('/')}/vanguard-agent-config";
            }
            else
            {
                configUrl = $"{apiBaseUrl.TrimEnd('/')}/functions/v1/vanguard-agent-config";
            }

            Console.WriteLine($"[MeshCentral] Fetching mesh config from: {configUrl}");

            var request = new HttpRequestMessage(HttpMethod.Get, configUrl);
            request.Headers.Add("X-Device-Id", _configService.Config.DeviceId ?? "");
            request.Headers.Add("X-Vanguard-Key", _configService.Config.SecretKey);
            request.Headers.Add("X-Config-Type", "meshcentral");

            var response = await _httpClient.SendAsync(request);
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"[MeshCentral] Config response: {json.Substring(0, Math.Min(200, json.Length))}...");

                var config = JsonSerializer.Deserialize<MeshCentralConfigResponse>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (config != null)
                {
                    _meshServerUrl = config.MeshServerUrl;
                    _meshId = config.MeshId;

                    if (!string.IsNullOrEmpty(config.NodeId))
                    {
                        _nodeId = config.NodeId;
                        SaveNodeIdCache(_nodeId);
                    }

                    Console.WriteLine($"[MeshCentral] Config loaded: server={_meshServerUrl}, meshId={_meshId}");
                    return !string.IsNullOrEmpty(_meshServerUrl) && !string.IsNullOrEmpty(_meshId);
                }
            }
            else
            {
                Console.WriteLine($"[MeshCentral] Config request failed: HTTP {(int)response.StatusCode}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[MeshCentral] Failed to fetch config: {ex.Message}");
        }

        return false;
    }

    /// <summary>
    /// Download and install MeshAgent silently
    /// </summary>
    public async Task<bool> InstallMeshAgentAsync()
    {
        if (string.IsNullOrEmpty(_meshServerUrl) || string.IsNullOrEmpty(_meshId))
        {
            Console.WriteLine("[MeshCentral] Cannot install: no server URL or mesh ID configured");
            return false;
        }

        Console.WriteLine("[MeshCentral] Starting MeshAgent installation...");

        try
        {
            // Build the MSI download URL from MeshCentral server
            // MeshCentral provides agent installers at /meshagents?id=3 (Windows x64)
            var msiUrl = $"{_meshServerUrl.TrimEnd('/')}/meshagents?id=3&meshid={Uri.EscapeDataString(_meshId)}&installflags=0";

            Console.WriteLine($"[MeshCentral] Downloading agent from: {msiUrl}");

            // Download MSI
            var tempDir = Path.Combine(Path.GetTempPath(), "VanguardMeshCentral");
            Directory.CreateDirectory(tempDir);
            var msiPath = Path.Combine(tempDir, "meshagent.msi");

            using (var downloadStream = await _httpClient.GetStreamAsync(msiUrl))
            using (var fileStream = File.Create(msiPath))
            {
                await downloadStream.CopyToAsync(fileStream);
            }

            Console.WriteLine($"[MeshCentral] Downloaded MSI to: {msiPath}");

            // Install MSI silently
            var (exitCode, stdout, stderr) = await RunProcessAsync(
                "msiexec.exe",
                $"/i \"{msiPath}\" /qn /norestart",
                Environment.SystemDirectory,
                120
            );

            Console.WriteLine($"[MeshCentral] MSI install exit code: {exitCode}");
            if (!string.IsNullOrEmpty(stdout)) Console.WriteLine($"[MeshCentral] stdout: {stdout}");
            if (!string.IsNullOrEmpty(stderr)) Console.WriteLine($"[MeshCentral] stderr: {stderr}");

            if (exitCode == 0 || exitCode == 3010) // 3010 = reboot required but install succeeded
            {
                Console.WriteLine("[MeshCentral] MSI install succeeded");

                // Wait for service to start and read node ID
                await Task.Delay(5000);
                await ReadNodeIdFromAgent();

                // Clean up
                try { File.Delete(msiPath); } catch { }

                return true;
            }

            Console.WriteLine($"[MeshCentral] MSI install failed with exit code {exitCode}");

            // Fallback: try direct exe install
            return await TryExeInstallAsync(tempDir);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[MeshCentral] Installation error: {ex.Message}");
            return false;
        }
    }

    /// <summary>
    /// Fallback: download and run the exe installer
    /// </summary>
    private async Task<bool> TryExeInstallAsync(string tempDir)
    {
        try
        {
            var exeUrl = $"{_meshServerUrl!.TrimEnd('/')}/meshagents?id=4&meshid={Uri.EscapeDataString(_meshId!)}&installflags=0";
            var exePath = Path.Combine(tempDir, "meshagent.exe");

            Console.WriteLine($"[MeshCentral] Trying EXE install from: {exeUrl}");

            using (var downloadStream = await _httpClient.GetStreamAsync(exeUrl))
            using (var fileStream = File.Create(exePath))
            {
                await downloadStream.CopyToAsync(fileStream);
            }

            var (exitCode, _, _) = await RunProcessAsync(
                exePath,
                "-fullinstall",
                tempDir,
                120
            );

            Console.WriteLine($"[MeshCentral] EXE install exit code: {exitCode}");

            if (exitCode == 0)
            {
                await Task.Delay(5000);
                await ReadNodeIdFromAgent();
                try { File.Delete(exePath); } catch { }
                return true;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[MeshCentral] EXE install error: {ex.Message}");
        }

        return false;
    }

    /// <summary>
    /// Read the node ID from MeshAgent's configuration after install
    /// </summary>
    public async Task ReadNodeIdFromAgent()
    {
        // MeshAgent stores its node ID in the .msh file or registry
        try
        {
            // Check registry first
            using var key = Registry.LocalMachine.OpenSubKey(
                @"SOFTWARE\Open Source\MeshAgent2");
            if (key != null)
            {
                var nodeId = key.GetValue("NodeId")?.ToString();
                if (!string.IsNullOrEmpty(nodeId))
                {
                    _nodeId = nodeId;
                    SaveNodeIdCache(nodeId);
                    Console.WriteLine($"[MeshCentral] Node ID from registry: {nodeId}");
                    return;
                }
            }
        }
        catch { }

        // Check .msh file
        try
        {
            var mshPath = Path.Combine(MeshAgentDir, "meshagent.msh");
            if (File.Exists(mshPath))
            {
                var content = await File.ReadAllTextAsync(mshPath);
                foreach (var line in content.Split('\n'))
                {
                    if (line.Trim().StartsWith("NodeId=", StringComparison.OrdinalIgnoreCase))
                    {
                        _nodeId = line.Trim().Substring("NodeId=".Length).Trim();
                        SaveNodeIdCache(_nodeId);
                        Console.WriteLine($"[MeshCentral] Node ID from .msh file: {_nodeId}");
                        return;
                    }
                }
            }
        }
        catch { }

        // Check db.json (some versions use this)
        try
        {
            var dbPath = Path.Combine(MeshAgentDir, "meshagent.db");
            if (File.Exists(dbPath))
            {
                var content = await File.ReadAllTextAsync(dbPath);
                if (content.Contains("\"_id\""))
                {
                    var doc = JsonSerializer.Deserialize<JsonElement>(content);
                    if (doc.TryGetProperty("_id", out var idProp))
                    {
                        _nodeId = idProp.GetString();
                        if (!string.IsNullOrEmpty(_nodeId))
                        {
                            SaveNodeIdCache(_nodeId);
                            Console.WriteLine($"[MeshCentral] Node ID from db: {_nodeId}");
                            return;
                        }
                    }
                }
            }
        }
        catch { }

        Console.WriteLine("[MeshCentral] Could not read node ID — will retry on next heartbeat");
    }

    /// <summary>
    /// Full installation and configuration flow
    /// </summary>
    public async Task<bool> EnsureInstalledAndConfiguredAsync(string apiBaseUrl)
    {
        // 1. Use pre-loaded config from registration if available, otherwise fetch
        var hasConfig = !string.IsNullOrEmpty(_meshServerUrl) && !string.IsNullOrEmpty(_meshId);
        
        if (hasConfig)
        {
            Console.WriteLine("[MeshCentral] Using pre-loaded config from registration");
        }
        else
        {
            hasConfig = await FetchMeshConfigAsync(apiBaseUrl);
        }
        
        if (!hasConfig)
        {
            Console.WriteLine("[MeshCentral] No MeshCentral config available — skipping install");
            return false;
        }

        // 2. Check if already installed
        if (IsMeshAgentInstalled())
        {
            Console.WriteLine("[MeshCentral] MeshAgent already installed");

            // Try to read node ID if we don't have one
            if (string.IsNullOrEmpty(_nodeId))
            {
                await ReadNodeIdFromAgent();
            }

            return true;
        }

        // 3. Install
        Console.WriteLine("[MeshCentral] MeshAgent not found — installing...");
        var installed = await InstallMeshAgentAsync();

        if (installed)
        {
            Console.WriteLine("[MeshCentral] ✓ MeshAgent installed successfully");
        }
        else
        {
            Console.WriteLine("[MeshCentral] ✗ MeshAgent installation failed");
        }

        return installed;
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private void LoadCachedNodeId()
    {
        try
        {
            if (File.Exists(NodeIdCachePath))
            {
                _nodeId = File.ReadAllText(NodeIdCachePath).Trim();
                if (!string.IsNullOrEmpty(_nodeId))
                {
                    Console.WriteLine($"[MeshCentral] Loaded cached node ID: {_nodeId}");
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[MeshCentral] Failed to load cached node ID: {ex.Message}");
        }
    }

    private void SaveNodeIdCache(string nodeId)
    {
        try
        {
            var dir = Path.GetDirectoryName(NodeIdCachePath);
            if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);
            File.WriteAllText(NodeIdCachePath, nodeId);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[MeshCentral] Failed to cache node ID: {ex.Message}");
        }
    }

    private static async Task<(int ExitCode, string? StdOut, string? StdErr)> RunProcessAsync(
        string fileName, string arguments, string workingDir, int timeoutSeconds)
    {
        using var process = new Process();
        process.StartInfo = new ProcessStartInfo
        {
            FileName = fileName,
            Arguments = arguments,
            WorkingDirectory = workingDir,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true,
        };

        process.Start();

        var stdoutTask = process.StandardOutput.ReadToEndAsync();
        var stderrTask = process.StandardError.ReadToEndAsync();

        var completed = process.WaitForExit(timeoutSeconds * 1000);
        if (!completed)
        {
            try { process.Kill(true); } catch { }
            return (-1, null, "Process timed out");
        }

        return (process.ExitCode, await stdoutTask, await stderrTask);
    }

    // =========================================================================
    // Config Models
    // =========================================================================

    private class MeshCentralConfigResponse
    {
        public string? MeshServerUrl { get; set; }
        public string? MeshId { get; set; }
        public string? NodeId { get; set; }
    }
}
