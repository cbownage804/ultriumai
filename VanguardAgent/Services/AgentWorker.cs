// =============================================================================
// Vanguard Agent Worker Service
// =============================================================================

using System.Threading;
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
    private readonly MeshCentralInstaller _meshCentralInstaller;

    private DateTime _lastHeartbeat = DateTime.MinValue;
    private DateTime _lastTelemetry = DateTime.MinValue;
    private DateTime _lastSecurityTelemetry = DateTime.MinValue;
    private DateTime _lastCommandPoll = DateTime.MinValue;
    private DateTime _lastMeshCentralRetry = DateTime.MinValue;
    #pragma warning disable CS0414 // Field is assigned but never used - tracks registration state for future use
    private bool _isRegistered = false;
    #pragma warning restore CS0414
    private bool _meshCentralSetupComplete = false;
    private int _meshCentralSetupRunning = 0;

    // Security telemetry interval (5 minutes by default)
    private const int SecurityTelemetryIntervalSeconds = 300;
    
    // MeshCentral retry interval (60 seconds)
    private const int MeshCentralRetryIntervalSeconds = 60;

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
        _meshCentralInstaller = new MeshCentralInstaller(configService);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Vanguard Agent starting...");

        // Ensure device is registered
        await EnsureRegisteredAsync();

        // Setup MeshCentral for remote access (non-blocking)
        _ = Task.Run(async () =>
        {
            try
            {
                await EnsureMeshCentralAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "MeshCentral setup failed with exception");
            }
        }, stoppingToken);

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

                // MeshCentral auto-retry every 60 seconds until successful
                if (!_meshCentralSetupComplete && (now - _lastMeshCentralRetry).TotalSeconds >= MeshCentralRetryIntervalSeconds)
                {
                    _lastMeshCentralRetry = now;
                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            await EnsureMeshCentralAsync();
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "MeshCentral retry failed, will retry");
                        }
                    }, stoppingToken);
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
            
            // If server returned MeshCentral config, pre-load it into the installer
            if (response.MeshCentralConfig != null && response.MeshCentralConfig.Deploy &&
                !string.IsNullOrEmpty(response.MeshCentralConfig.ServerUrl))
            {
                _logger.LogInformation("Server provided MeshCentral config during registration: {Server}", 
                    response.MeshCentralConfig.ServerUrl);
                _meshCentralInstaller.SetServerConfig(
                    response.MeshCentralConfig.ServerUrl,
                    response.MeshCentralConfig.MeshId ?? "");
            }
        }
        else
        {
            _logger.LogWarning("Device registration failed. Will retry on next startup.");
        }
    }

    /// <summary>
    /// Ensure MeshCentral MeshAgent is installed and configured for remote access
    /// </summary>
    private async Task EnsureMeshCentralAsync()
    {
        if (_meshCentralSetupComplete) return;

        if (Interlocked.Exchange(ref _meshCentralSetupRunning, 1) == 1)
        {
            _logger.LogDebug("MeshCentral setup already running, skipping this tick");
            return;
        }

        try
        {
            _logger.LogInformation("Checking MeshCentral MeshAgent installation...");

            var apiBaseUrl = _configService.Config.ApiEndpoint?.Replace("/vanguard-agent-api", "") ?? "";

            var success = await _meshCentralInstaller.EnsureInstalledAndConfiguredAsync(apiBaseUrl);

            if (success)
            {
                var nodeId = _meshCentralInstaller.GetNodeId();
                _logger.LogInformation("MeshCentral setup complete. Node ID: {NodeId}", nodeId ?? "pending");

                if (!string.IsNullOrEmpty(nodeId))
                {
                    _meshCentralSetupComplete = true;
                    _logger.LogInformation("MeshCentral node ID will be reported in next heartbeat");
                }
                else
                {
                    // Schedule a delayed retry to read the node ID
                    _ = Task.Run(async () =>
                    {
                        await Task.Delay(30000);
                        await _meshCentralInstaller.ReadNodeIdFromAgent();
                        var delayedNodeId = _meshCentralInstaller.GetNodeId();
                        if (!string.IsNullOrEmpty(delayedNodeId))
                        {
                            _logger.LogInformation("MeshCentral node ID obtained after delay: {NodeId}", delayedNodeId);
                            _meshCentralSetupComplete = true;
                        }
                    });
                }
            }
            else
            {
                _logger.LogWarning("MeshCentral setup failed or not configured");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting up MeshCentral");
        }
        finally
        {
            Interlocked.Exchange(ref _meshCentralSetupRunning, 0);
        }
    }

    private async Task SendHeartbeatAsync()
    {
        try
        {
            var heartbeat = _telemetry.CollectHeartbeat();
            
            // Include MeshCentral node ID in heartbeat
            var meshcentralNodeId = _meshCentralInstaller.GetNodeId();
            var meshcentralMeshId = _meshCentralInstaller.GetMeshId();
            
            var success = await _api.SendHeartbeatAsync(heartbeat, meshcentralNodeId, meshcentralMeshId);

            if (success)
            {
                _logger.LogDebug("Heartbeat sent: CPU={Cpu}%, RAM={Ram}%, MeshCentral={NodeId}", 
                    heartbeat.CpuPercent, heartbeat.MemoryPercent, meshcentralNodeId ?? "none");
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
