// =============================================================================
// Vanguard Agent Worker Service
// =============================================================================

using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace VanguardAgent.Services;

public class AgentWorker : BackgroundService
{
    private readonly ILogger<AgentWorker> _logger;
    private readonly ConfigService _configService;
    private readonly ApiClient _api;
    private readonly TelemetryCollector _telemetry;
    private readonly CommandExecutor _commandExecutor;
    private readonly RustDeskInstaller _rustDeskInstaller;

    private DateTime _lastHeartbeat = DateTime.MinValue;
    private DateTime _lastTelemetry = DateTime.MinValue;
    private DateTime _lastSecurityTelemetry = DateTime.MinValue;
    private DateTime _lastCommandPoll = DateTime.MinValue;
    private bool _isRegistered = false;
    private bool _rustDeskSetupComplete = false;

    // Security telemetry interval (5 minutes by default)
    private const int SecurityTelemetryIntervalSeconds = 300;

    public AgentWorker(
        ILogger<AgentWorker> logger,
        ConfigService configService,
        ApiClient api,
        TelemetryCollector telemetry,
        CommandExecutor commandExecutor)
    {
        _logger = logger;
        _configService = configService;
        _api = api;
        _telemetry = telemetry;
        _commandExecutor = commandExecutor;
        _rustDeskInstaller = new RustDeskInstaller(configService);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Vanguard Agent starting...");

        // Ensure device is registered
        await EnsureRegisteredAsync();

        // Setup RustDesk for remote access (non-blocking)
        _ = Task.Run(async () => await EnsureRustDeskAsync(), stoppingToken);

        _logger.LogInformation("Agent registered. Starting monitoring loop.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var now = DateTime.UtcNow;
                var config = _configService.Config;

                // Heartbeat
                if ((now - _lastHeartbeat).TotalSeconds >= config.HeartbeatInterval)
                {
                    await SendHeartbeatAsync();
                    _lastHeartbeat = now;
                }

                // Command polling
                if ((now - _lastCommandPoll).TotalSeconds >= config.CommandPollInterval)
                {
                    await PollAndExecuteCommandsAsync();
                    _lastCommandPoll = now;
                }

                // Full telemetry
                if ((now - _lastTelemetry).TotalSeconds >= config.TelemetryInterval)
                {
                    await SendTelemetryAsync();
                    _lastTelemetry = now;
                }

                // Security telemetry (Defender status)
                if ((now - _lastSecurityTelemetry).TotalSeconds >= SecurityTelemetryIntervalSeconds)
                {
                    await SendSecurityTelemetryAsync();
                    _lastSecurityTelemetry = now;
                }

                // Sleep for a bit before next loop
                await Task.Delay(5000, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in agent loop");
                await Task.Delay(10000, stoppingToken); // Backoff on error
            }
        }

        _logger.LogInformation("Vanguard Agent stopped.");
    }

    private async Task EnsureRegisteredAsync()
    {
        var config = _configService.Config;

        if (!string.IsNullOrEmpty(config.DeviceId))
        {
            _logger.LogInformation("Device already registered: {DeviceId}", config.DeviceId);
            _isRegistered = true;
            return;
        }

        _logger.LogInformation("Registering device...");

        var deviceInfo = _telemetry.CollectDeviceInfo();
        var response = await _api.RegisterDeviceAsync(deviceInfo);

        if (response?.Success == true && !string.IsNullOrEmpty(response.DeviceId))
        {
            _configService.SetDeviceId(response.DeviceId);
            _logger.LogInformation("Device registered successfully: {DeviceId}", response.DeviceId);
            _isRegistered = true;
        }
        else
        {
            _logger.LogWarning("Device registration failed. Will retry on next startup.");
        }
    }

    /// <summary>
    /// Ensure RustDesk is installed and configured for remote access
    /// </summary>
    private async Task EnsureRustDeskAsync()
    {
        if (_rustDeskSetupComplete) return;

        try
        {
            _logger.LogInformation("Checking RustDesk installation...");
            
            var apiBaseUrl = _configService.Config.ApiEndpoint?.Replace("/vanguard-agent-api", "") ?? "";
            
            var (success, rustDeskId) = await _rustDeskInstaller.EnsureInstalledAndConfiguredAsync(apiBaseUrl);
            
            if (success)
            {
                _logger.LogInformation("RustDesk setup complete. ID: {RustDeskId}", rustDeskId ?? "pending");
                
                // Update device info with RustDesk ID if we got one
                if (!string.IsNullOrEmpty(rustDeskId))
                {
                    await _api.UpdateDeviceRustDeskIdAsync(rustDeskId);
                }
            }
            else
            {
                _logger.LogWarning("RustDesk setup failed or relay not configured");
            }
            
            _rustDeskSetupComplete = true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting up RustDesk");
            _rustDeskSetupComplete = true; // Don't retry immediately
        }
    }

    private async Task SendHeartbeatAsync()
    {
        try
        {
            var heartbeat = _telemetry.CollectHeartbeat();
            var success = await _api.SendHeartbeatAsync(heartbeat);

            if (success)
            {
                _logger.LogDebug("Heartbeat sent: CPU={Cpu}%, RAM={Ram}%", heartbeat.CpuPercent, heartbeat.MemoryPercent);
            }
            else
            {
                _logger.LogWarning("Failed to send heartbeat");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending heartbeat");
        }
    }

    private async Task SendTelemetryAsync()
    {
        try
        {
            var telemetry = _telemetry.CollectTelemetry();
            var success = await _api.SendTelemetryAsync(telemetry);

            if (success)
            {
                _logger.LogInformation("Telemetry sent: {Processes} processes, {Services} services",
                    telemetry.Processes?.Count ?? 0, telemetry.Services?.Count ?? 0);
            }
            else
            {
                _logger.LogWarning("Failed to send telemetry");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending telemetry");
        }
    }

    private async Task SendSecurityTelemetryAsync()
    {
        try
        {
            var securityData = await _telemetry.CollectSecurityTelemetryAsync();
            var success = await _api.SendSecurityTelemetryAsync(securityData);

            if (success)
            {
                var defenderEnabled = securityData.DefenderStatus?.IsEnabled ?? false;
                var threatCount = securityData.RecentThreats?.Count ?? 0;
                _logger.LogInformation("Security telemetry sent: Defender={Enabled}, Threats={Count}",
                    defenderEnabled ? "ON" : "OFF", threatCount);
            }
            else
            {
                _logger.LogWarning("Failed to send security telemetry");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending security telemetry");
        }
    }

    private async Task PollAndExecuteCommandsAsync()
    {
        try
        {
            var commands = await _api.PollCommandsAsync();

            if (commands == null || commands.Count == 0) return;

            _logger.LogInformation("Received {Count} command(s)", commands.Count);

            foreach (var command in commands)
            {
                _logger.LogInformation("Executing command: {Type} - {Id}", command.CommandType, command.Id);

                var result = await _commandExecutor.ExecuteAsync(command);
                await _api.ReportCommandResultAsync(command.Id, result);

                if (result.Success)
                {
                    _logger.LogInformation("Command {Id} completed successfully", command.Id);
                }
                else
                {
                    _logger.LogWarning("Command {Id} failed: {Error}", command.Id, result.Stderr);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error polling/executing commands");
        }
    }
}
