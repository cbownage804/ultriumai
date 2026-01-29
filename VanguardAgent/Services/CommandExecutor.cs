// =============================================================================
// Remote Command Executor
// =============================================================================

using System.Diagnostics;
using System.ServiceProcess;

namespace VanguardAgent.Services;

public class CommandExecutor
{
    private readonly ConfigService _configService;

    public CommandExecutor(ConfigService configService)
    {
        _configService = configService;
    }

    public async Task<CommandResult> ExecuteAsync(RemoteCommand command)
    {
        if (!_configService.Config.Features.ExecuteCommands)
        {
            return new CommandResult
            {
                Success = false,
                ExitCode = -1,
                Stderr = "Command execution is disabled in agent configuration"
            };
        }

        return command.CommandType.ToLower() switch
        {
            "shell" => await ExecuteShellCommand(command.Command),
            "powershell" => await ExecutePowerShell(command.Command),
            "service_start" => await ControlService(command.Command, ServiceControllerStatus.Running),
            "service_stop" => await ControlService(command.Command, ServiceControllerStatus.Stopped),
            "service_restart" => await RestartService(command.Command),
            "process_kill" => KillProcess(command.Command),
            "file_download" => await DownloadFile(command),
            "reboot" => ScheduleReboot(command),
            _ => new CommandResult
            {
                Success = false,
                ExitCode = -1,
                Stderr = $"Unknown command type: {command.CommandType}"
            }
        };
    }

    private async Task<CommandResult> ExecuteShellCommand(string command)
    {
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "cmd.exe",
                Arguments = $"/c {command}",
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true
            };

            using var process = Process.Start(psi);
            if (process == null)
            {
                return new CommandResult { Success = false, ExitCode = -1, Stderr = "Failed to start process" };
            }

            var stdout = await process.StandardOutput.ReadToEndAsync();
            var stderr = await process.StandardError.ReadToEndAsync();
            await process.WaitForExitAsync();

            return new CommandResult
            {
                Success = process.ExitCode == 0,
                ExitCode = process.ExitCode,
                Stdout = stdout,
                Stderr = stderr
            };
        }
        catch (Exception ex)
        {
            return new CommandResult
            {
                Success = false,
                ExitCode = -1,
                Stderr = ex.Message
            };
        }
    }

    private async Task<CommandResult> ExecutePowerShell(string script)
    {
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "powershell.exe",
                Arguments = $"-NoProfile -ExecutionPolicy Bypass -Command \"{script}\"",
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true
            };

            using var process = Process.Start(psi);
            if (process == null)
            {
                return new CommandResult { Success = false, ExitCode = -1, Stderr = "Failed to start PowerShell" };
            }

            var stdout = await process.StandardOutput.ReadToEndAsync();
            var stderr = await process.StandardError.ReadToEndAsync();
            await process.WaitForExitAsync();

            return new CommandResult
            {
                Success = process.ExitCode == 0,
                ExitCode = process.ExitCode,
                Stdout = stdout,
                Stderr = stderr
            };
        }
        catch (Exception ex)
        {
            return new CommandResult
            {
                Success = false,
                ExitCode = -1,
                Stderr = ex.Message
            };
        }
    }

    private Task<CommandResult> ControlService(string serviceName, ServiceControllerStatus targetStatus)
    {
        try
        {
            using var service = new ServiceController(serviceName);

            if (targetStatus == ServiceControllerStatus.Running)
            {
                service.Start();
                service.WaitForStatus(ServiceControllerStatus.Running, TimeSpan.FromSeconds(30));
            }
            else if (targetStatus == ServiceControllerStatus.Stopped)
            {
                service.Stop();
                service.WaitForStatus(ServiceControllerStatus.Stopped, TimeSpan.FromSeconds(30));
            }

            return Task.FromResult(new CommandResult
            {
                Success = true,
                ExitCode = 0,
                Stdout = $"Service '{serviceName}' is now {service.Status}"
            });
        }
        catch (Exception ex)
        {
            return Task.FromResult(new CommandResult
            {
                Success = false,
                ExitCode = -1,
                Stderr = ex.Message
            });
        }
    }

    private async Task<CommandResult> RestartService(string serviceName)
    {
        var stopResult = await ControlService(serviceName, ServiceControllerStatus.Stopped);
        if (!stopResult.Success)
        {
            return stopResult;
        }

        await Task.Delay(1000); // Brief pause

        return await ControlService(serviceName, ServiceControllerStatus.Running);
    }

    private CommandResult KillProcess(string processIdOrName)
    {
        try
        {
            Process? process = null;

            if (int.TryParse(processIdOrName, out var pid))
            {
                process = Process.GetProcessById(pid);
            }
            else
            {
                process = Process.GetProcessesByName(processIdOrName).FirstOrDefault();
            }

            if (process == null)
            {
                return new CommandResult
                {
                    Success = false,
                    ExitCode = -1,
                    Stderr = $"Process not found: {processIdOrName}"
                };
            }

            var processName = process.ProcessName;
            process.Kill(true);

            return new CommandResult
            {
                Success = true,
                ExitCode = 0,
                Stdout = $"Process '{processName}' terminated"
            };
        }
        catch (Exception ex)
        {
            return new CommandResult
            {
                Success = false,
                ExitCode = -1,
                Stderr = ex.Message
            };
        }
    }

    private async Task<CommandResult> DownloadFile(RemoteCommand command)
    {
        try
        {
            var url = command.Parameters?.GetValueOrDefault("url")?.ToString();
            var path = command.Parameters?.GetValueOrDefault("path")?.ToString();

            if (string.IsNullOrEmpty(url) || string.IsNullOrEmpty(path))
            {
                return new CommandResult
                {
                    Success = false,
                    ExitCode = -1,
                    Stderr = "Missing url or path parameters"
                };
            }

            using var http = new HttpClient();
            var bytes = await http.GetByteArrayAsync(url);
            await File.WriteAllBytesAsync(path, bytes);

            return new CommandResult
            {
                Success = true,
                ExitCode = 0,
                Stdout = $"Downloaded {bytes.Length} bytes to {path}"
            };
        }
        catch (Exception ex)
        {
            return new CommandResult
            {
                Success = false,
                ExitCode = -1,
                Stderr = ex.Message
            };
        }
    }

    private CommandResult ScheduleReboot(RemoteCommand command)
    {
        try
        {
            var delaySeconds = 60;
            if (command.Parameters?.TryGetValue("delay_seconds", out var delay) == true)
            {
                int.TryParse(delay?.ToString(), out delaySeconds);
            }

            var psi = new ProcessStartInfo
            {
                FileName = "shutdown.exe",
                Arguments = $"/r /t {delaySeconds} /c \"Scheduled reboot by Vanguard Agent\"",
                UseShellExecute = false,
                CreateNoWindow = true
            };

            Process.Start(psi);

            return new CommandResult
            {
                Success = true,
                ExitCode = 0,
                Stdout = $"System will reboot in {delaySeconds} seconds"
            };
        }
        catch (Exception ex)
        {
            return new CommandResult
            {
                Success = false,
                ExitCode = -1,
                Stderr = ex.Message
            };
        }
    }
}
