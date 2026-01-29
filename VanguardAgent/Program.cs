// =============================================================================
// Ultrium Vanguard Agent - Entry Point
// =============================================================================
// Enterprise RMM agent for Windows systems
// Runs as Windows Service or console application
// =============================================================================

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using VanguardAgent.Services;

namespace VanguardAgent;

public class Program
{
    public static async Task Main(string[] args)
    {
        // Check for command-line flags
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

        // Build and run the host
        var builder = Host.CreateApplicationBuilder(args);

        // Register services
        builder.Services.AddSingleton<ConfigService>();
        builder.Services.AddSingleton<ApiClient>();
        builder.Services.AddSingleton<TelemetryCollector>();
        builder.Services.AddSingleton<CommandExecutor>();
        builder.Services.AddHostedService<AgentWorker>();

        // Enable Windows Service
        builder.Services.AddWindowsService(options =>
        {
            options.ServiceName = "VanguardAgent";
        });

        var host = builder.Build();
        await host.RunAsync();
    }

    private static async Task InstallService()
    {
        Console.WriteLine("Installing Vanguard Agent as Windows Service...");
        var exePath = Environment.ProcessPath ?? "VanguardAgent.exe";
        
        var psi = new System.Diagnostics.ProcessStartInfo
        {
            FileName = "sc.exe",
            Arguments = $"create VanguardAgent binPath= \"{exePath}\" start= auto DisplayName= \"Ultrium Vanguard Agent\"",
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
                    Arguments = "description VanguardAgent \"Ultrium Vanguard RMM Agent - Monitors system health and executes remote commands\"",
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                using var descProcess = System.Diagnostics.Process.Start(descPsi);
                descProcess?.WaitForExit();

                Console.WriteLine("Service installed successfully!");
                Console.WriteLine("Run 'net start VanguardAgent' to start the service.");
            }
        }
    }

    private static async Task UninstallService()
    {
        Console.WriteLine("Stopping and removing Vanguard Agent service...");
        
        // Stop service first
        var stopPsi = new System.Diagnostics.ProcessStartInfo
        {
            FileName = "net",
            Arguments = "stop VanguardAgent",
            UseShellExecute = false,
            CreateNoWindow = true
        };
        using var stopProcess = System.Diagnostics.Process.Start(stopPsi);
        stopProcess?.WaitForExit();

        // Delete service
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

        // Parse arguments
        string? userId = null;
        string? secretKey = null;
        string? deviceName = null;

        for (int i = 0; i < args.Length - 1; i++)
        {
            switch (args[i])
            {
                case "--user-id":
                    userId = args[i + 1];
                    break;
                case "--secret-key":
                    secretKey = args[i + 1];
                    break;
                case "--device-name":
                    deviceName = args[i + 1];
                    break;
            }
        }

        if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(secretKey))
        {
            Console.WriteLine("Usage: VanguardAgent.exe --register --user-id <UUID> --secret-key <KEY> [--device-name <NAME>]");
            Console.WriteLine();
            Console.WriteLine("Get your credentials from: https://ultriumai.com/vanguard/settings");
            return;
        }

        deviceName ??= Environment.MachineName;

        // Create config
        var config = new
        {
            user_id = userId,
            secret_key = secretKey,
            device_name = deviceName,
            api_endpoint = "https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/vanguard-agent-api",
            heartbeat_interval = 60,
            command_poll_interval = 30,
            telemetry_interval = 300
        };

        var configPath = Path.Combine(AppContext.BaseDirectory, "config.json");
        await File.WriteAllTextAsync(configPath, Newtonsoft.Json.JsonConvert.SerializeObject(config, Newtonsoft.Json.Formatting.Indented));

        Console.WriteLine($"Configuration saved to: {configPath}");
        Console.WriteLine();

        // Test connection
        Console.WriteLine("Testing API connection...");
        var client = new ApiClient(new ConfigService());
        var success = await client.TestConnectionAsync();

        if (success)
        {
            Console.WriteLine("✓ Connection successful!");
            Console.WriteLine();
            Console.WriteLine("Next steps:");
            Console.WriteLine("  1. Install as service: VanguardAgent.exe --install");
            Console.WriteLine("  2. Start service: net start VanguardAgent");
        }
        else
        {
            Console.WriteLine("✗ Connection failed. Please check your credentials.");
        }
    }
}
