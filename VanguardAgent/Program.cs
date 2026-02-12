// =============================================================================
// Ultrium Vanguard Agent - Combined RMM + Customer Portal
// =============================================================================
// Enterprise RMM agent with integrated customer self-service portal
// Runs as: Windows Service (--service) OR Tray Application (default)
// =============================================================================

using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using VanguardAgent.Forms;
using VanguardAgent.Models;
using VanguardAgent.Services;

namespace VanguardAgent;

public class Program
{
    [STAThread]
    public static async Task Main(string[] args)
    {
        // Command-line operations
        if (args.Contains("--install"))
        {
            await InstallService();
            return;
        }

        if (args.Contains("--uninstall"))
        {
            await UninstallService();
            return;
        }

        if (args.Contains("--register"))
        {
            await RegisterAgent(args);
            return;
        }

        // Service mode (when run by Windows Service Control Manager)
        if (args.Contains("--service") || !Environment.UserInteractive)
        {
            await RunAsService(args);
            return;
        }

        // Default: Run as tray application with integrated RMM
        RunAsTrayApp();
    }

    /// <summary>
    /// Run as Windows Tray Application with RMM monitoring in background
    /// </summary>
    private static void RunAsTrayApp()
    {
        Application.SetHighDpiMode(HighDpiMode.SystemAware);
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);

        // Load configuration
        var config = LoadPortalConfig();

        // Start RMM monitoring in background thread
        Func<CancellationToken, Task> rmmRunner = async (ct) =>
        {
            try
            {
                var builder = Host.CreateApplicationBuilder();
                builder.Services.AddSingleton<ConfigService>();
                builder.Services.AddSingleton<ApiClient>();
                builder.Services.AddSingleton<TelemetryCollector>();
                builder.Services.AddSingleton<CommandExecutor>();
                builder.Services.AddHostedService<AgentWorker>();

                var host = builder.Build();
                await host.RunAsync(ct);
            }
            catch (OperationCanceledException)
            {
                // Expected on shutdown
            }
            catch (Exception ex)
            {
                Console.WriteLine($"RMM Service error: {ex.Message}");
            }
        };

        // Run the tray application with RMM service
        Application.Run(new PortalTrayContext(config, rmmRunner));
    }

    /// <summary>
    /// Run as Windows Service (headless, no tray icon)
    /// </summary>
    private static async Task RunAsService(string[] args)
    {
        var builder = Host.CreateApplicationBuilder(args);

        builder.Services.AddSingleton<ConfigService>();
        builder.Services.AddSingleton<ApiClient>();
        builder.Services.AddSingleton<TelemetryCollector>();
        builder.Services.AddSingleton<CommandExecutor>();
        builder.Services.AddHostedService<AgentWorker>();

        builder.Services.AddWindowsService(options =>
        {
            options.ServiceName = "VanguardAgent";
        });

        var host = builder.Build();
        await host.RunAsync();
    }

    private static PortalConfig LoadPortalConfig()
    {
        try
        {
            var configPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "config.json");
            if (File.Exists(configPath))
            {
                var json = File.ReadAllText(configPath);
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                return new PortalConfig
                {
                    PortalKey = root.TryGetProperty("portal_key", out var pk) ? pk.GetString() ?? "" : "",
                    PortalName = root.TryGetProperty("portal_name", out var pn) ? pn.GetString() ?? "Vanguard" : "Vanguard",
                    PortalUrl = root.TryGetProperty("portal_url", out var pu) ? pu.GetString() ?? "https://ultriumai.app/customer-portal" : "https://ultriumai.app/customer-portal",
                    ApiEndpoint = root.TryGetProperty("api_endpoint", out var ae) ? ae.GetString() ?? "" : "",
                    ClientId = root.TryGetProperty("client_id", out var ci) ? ci.GetString() : null,
                    ShowPortal = root.TryGetProperty("show_portal", out var sp) && sp.GetBoolean()
                };
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading config: {ex.Message}");
        }

        return new PortalConfig();
    }

    private static async Task InstallService()
    {
        Console.WriteLine("Installing Vanguard Agent as Windows Service...");
        var exePath = Environment.ProcessPath ?? "VanguardAgent.exe";
        
        var psi = new System.Diagnostics.ProcessStartInfo
        {
            FileName = "sc.exe",
            Arguments = $"create VanguardAgent binPath= \"\\\"{exePath}\\\" --service\" start= auto DisplayName= \"Ultrium Vanguard Agent\"",
            UseShellExecute = false,
            RedirectStandardOutput = true,
            CreateNoWindow = true
        };

        using var process = System.Diagnostics.Process.Start(psi);
        if (process != null)
        {
            await process.WaitForExitAsync();
            var output = await process.StandardOutput.ReadToEndAsync();
            Console.WriteLine(output);

            if (process.ExitCode == 0)
            {
                // Set description
                var descPsi = new System.Diagnostics.ProcessStartInfo
                {
                    FileName = "sc.exe",
                    Arguments = "description VanguardAgent \"Ultrium Vanguard RMM Agent - Enterprise monitoring and remote management\"",
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                using var descProcess = System.Diagnostics.Process.Start(descPsi);
                descProcess?.WaitForExit();

                Console.WriteLine("Service installed successfully!");
                Console.WriteLine("Note: For tray icon + portal, run VanguardAgent.exe directly (without --service)");
                Console.WriteLine("For headless service: net start VanguardAgent");
            }
        }
    }

    private static async Task UninstallService()
    {
        Console.WriteLine("Stopping and removing Vanguard Agent service...");
        
        var stopPsi = new System.Diagnostics.ProcessStartInfo
        {
            FileName = "net",
            Arguments = "stop VanguardAgent",
            UseShellExecute = false,
            CreateNoWindow = true
        };
        using var stopProcess = System.Diagnostics.Process.Start(stopPsi);
        stopProcess?.WaitForExit();

        var psi = new System.Diagnostics.ProcessStartInfo
        {
            FileName = "sc.exe",
            Arguments = "delete VanguardAgent",
            UseShellExecute = false,
            RedirectStandardOutput = true,
            CreateNoWindow = true
        };

        using var process = System.Diagnostics.Process.Start(psi);
        if (process != null)
        {
            await process.WaitForExitAsync();
            var output = await process.StandardOutput.ReadToEndAsync();
            Console.WriteLine(output);
            Console.WriteLine("Service removed.");
        }
    }

    private static async Task RegisterAgent(string[] args)
    {
        Console.WriteLine("=== Vanguard Agent Registration ===");
        Console.WriteLine();

        string? userId = null;
        string? secretKey = null;
        string? clientId = null;
        string? deviceName = null;
        string? portalKey = null;
        string? portalName = null;
        string? portalUrl = null;
        bool showPortal = true;

        // Helper: get next arg value, skipping if it looks like another flag or is empty
        string? GetArgValue(string[] a, int idx)
        {
            if (idx + 1 >= a.Length) return null;
            var val = a[idx + 1].Trim('"'); // Strip quotes from msiexec properties
            // If the "value" starts with "--", it's actually the next flag (empty value case)
            if (val.StartsWith("--")) return null;
            // If msiexec passed an empty property, skip it
            if (string.IsNullOrWhiteSpace(val)) return null;
            return val;
        }

        for (int i = 0; i < args.Length; i++)
        {
            switch (args[i])
            {
                case "--user-id":
                    userId = GetArgValue(args, i);
                    if (userId != null) i++;
                    break;
                case "--secret-key":
                    secretKey = GetArgValue(args, i);
                    if (secretKey != null) i++;
                    break;
                case "--client-id":
                    clientId = GetArgValue(args, i);
                    if (clientId != null) i++;
                    break;
                case "--device-name":
                    deviceName = GetArgValue(args, i);
                    if (deviceName != null) i++;
                    break;
                case "--portal-key":
                    portalKey = GetArgValue(args, i);
                    if (portalKey != null) i++;
                    break;
                case "--portal-name":
                    portalName = GetArgValue(args, i);
                    if (portalName != null) i++;
                    break;
                case "--portal-url":
                    portalUrl = GetArgValue(args, i);
                    if (portalUrl != null) i++;
                    break;
                case "--show-portal":
                    var spVal = GetArgValue(args, i);
                    if (spVal != null) { showPortal = spVal == "1" || spVal.ToLower() == "true"; i++; }
                    break;
            }
        }

        if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(secretKey))
        {
            Console.WriteLine("Usage: VanguardAgent.exe --register --user-id <UUID> --secret-key <KEY> [options]");
            Console.WriteLine();
            Console.WriteLine("Options:");
            Console.WriteLine("  --client-id <ID>      Client ID for multi-tenant");
            Console.WriteLine("  --device-name <NAME>  Device name (default: hostname)");
            Console.WriteLine("  --portal-key <KEY>    Portal branding key");
            Console.WriteLine("  --portal-name <NAME>  Portal display name");
            Console.WriteLine("  --portal-url <URL>    Portal URL");
            Console.WriteLine("  --show-portal <1|0>   Enable portal (default: 1)");
            Console.WriteLine();
            Console.WriteLine("Get your credentials from: https://ultriumai.app/vanguard/settings");
            return;
        }

        deviceName ??= Environment.MachineName;

        var config = new
        {
            user_id = userId,
            secret_key = secretKey,
            client_id = clientId,
            device_name = deviceName,
            api_endpoint = "https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/vanguard-agent-api",
            heartbeat_interval = 60,
            command_poll_interval = 30,
            telemetry_interval = 300,
            portal_key = portalKey ?? "",
            portal_name = portalName ?? "Vanguard",
            portal_url = portalUrl ?? "https://ultriumai.app/customer-portal",
            show_portal = showPortal
        };

        var configPath = Path.Combine(AppContext.BaseDirectory, "config.json");
        await File.WriteAllTextAsync(configPath, JsonSerializer.Serialize(config, new JsonSerializerOptions { WriteIndented = true }));

        Console.WriteLine($"Configuration saved to: {configPath}");
        Console.WriteLine();

        Console.WriteLine("Testing API connection...");
        var client = new ApiClient(new ConfigService());
        var success = await client.TestConnectionAsync();

        if (success)
        {
            Console.WriteLine("✓ Connection successful!");
            Console.WriteLine();
            Console.WriteLine("Deployment options:");
            Console.WriteLine("  1. Tray App (recommended): Just run VanguardAgent.exe");
            Console.WriteLine("  2. Service only: VanguardAgent.exe --install && net start VanguardAgent");
        }
        else
        {
            Console.WriteLine("✗ Connection failed. Please check your credentials.");
        }
    }
}
