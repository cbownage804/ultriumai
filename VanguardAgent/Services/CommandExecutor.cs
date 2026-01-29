// =============================================================================
// Remote Command Executor - Extended for Full Console Support
// =============================================================================

using System.Diagnostics;
using System.Management;
using System.ServiceProcess;
using System.Text;
using Microsoft.Win32;
using Newtonsoft.Json;

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
            // Shell Commands
            "shell" => await ExecuteShellCommand(command.Command),
            "powershell" => await ExecutePowerShell(command.Command),
            "run_script" => await ExecuteScript(command),
            
            // Service Management
            "service_start" => await ControlService(command.Command, ServiceControllerStatus.Running),
            "service_stop" => await ControlService(command.Command, ServiceControllerStatus.Stopped),
            "service_restart" => await RestartService(command.Command),
            "get_services" => GetServicesDetailed(),
            
            // Process Management
            "process_kill" => KillProcess(command.Command),
            "kill_process_tree" => KillProcessTree(command.Command),
            "get_processes" => GetProcessesDetailed(),
            
            // Software Management
            "install_software" => await InstallSoftware(command),
            "uninstall_software" => await UninstallSoftware(command),
            
            // Registry
            "read_registry" => ReadRegistry(command.Command),
            
            // Event Logs
            "get_event_logs" => GetEventLogs(command),
            
            // File Operations
            "list_directory" => ListDirectory(command.Command),
            "file_download" => await DownloadFile(command),
            "upload_file" => ReceiveFile(command),
            
            // System
            "reboot" => ScheduleReboot(command),
            
            _ => new CommandResult
            {
                Success = false,
                ExitCode = -1,
                Stderr = $"Unknown command type: {command.CommandType}"
            }
        };
    }

    // ==========================================================================
    // SHELL COMMANDS
    // ==========================================================================

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
            return new CommandResult { Success = false, ExitCode = -1, Stderr = ex.Message };
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
            return new CommandResult { Success = false, ExitCode = -1, Stderr = ex.Message };
        }
    }

    private async Task<CommandResult> ExecuteScript(RemoteCommand command)
    {
        var shellType = command.Parameters?.GetValueOrDefault("shell")?.ToString()?.ToLower() ?? "powershell";
        var script = command.Command;

        return shellType switch
        {
            "cmd" or "shell" => await ExecuteShellCommand(script),
            "powershell" or "ps" => await ExecutePowerShell(script),
            "bash" => await ExecuteBash(script),
            _ => await ExecutePowerShell(script)
        };
    }

    private async Task<CommandResult> ExecuteBash(string script)
    {
        try
        {
            // Try WSL bash first, then Git Bash
            var bashPaths = new[] { "wsl.exe", @"C:\Program Files\Git\bin\bash.exe", @"C:\Git\bin\bash.exe" };
            string? bashPath = null;

            foreach (var path in bashPaths)
            {
                if (path == "wsl.exe" || File.Exists(path))
                {
                    bashPath = path;
                    break;
                }
            }

            if (bashPath == null)
            {
                return new CommandResult { Success = false, ExitCode = -1, Stderr = "Bash not found (WSL or Git Bash)" };
            }

            var args = bashPath == "wsl.exe" ? $"-e bash -c \"{script.Replace("\"", "\\\"")}\"" : $"-c \"{script.Replace("\"", "\\\"")}\"";

            var psi = new ProcessStartInfo
            {
                FileName = bashPath,
                Arguments = args,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true
            };

            using var process = Process.Start(psi);
            if (process == null)
            {
                return new CommandResult { Success = false, ExitCode = -1, Stderr = "Failed to start bash" };
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
            return new CommandResult { Success = false, ExitCode = -1, Stderr = ex.Message };
        }
    }

    // ==========================================================================
    // SERVICE MANAGEMENT
    // ==========================================================================

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
            return Task.FromResult(new CommandResult { Success = false, ExitCode = -1, Stderr = ex.Message });
        }
    }

    private async Task<CommandResult> RestartService(string serviceName)
    {
        var stopResult = await ControlService(serviceName, ServiceControllerStatus.Stopped);
        if (!stopResult.Success) return stopResult;

        await Task.Delay(1000);
        return await ControlService(serviceName, ServiceControllerStatus.Running);
    }

    private CommandResult GetServicesDetailed()
    {
        try
        {
            var services = new List<ServiceDetailedInfo>();

            foreach (var svc in ServiceController.GetServices())
            {
                try
                {
                    string startType = "Unknown";
                    string description = "";

                    // Get additional info from WMI
                    try
                    {
                        using var searcher = new ManagementObjectSearcher($"SELECT StartMode, Description FROM Win32_Service WHERE Name = '{svc.ServiceName}'");
                        foreach (var obj in searcher.Get())
                        {
                            startType = obj["StartMode"]?.ToString() ?? "Unknown";
                            description = obj["Description"]?.ToString() ?? "";
                            break;
                        }
                    }
                    catch { }

                    services.Add(new ServiceDetailedInfo
                    {
                        Name = svc.ServiceName,
                        DisplayName = svc.DisplayName,
                        Status = svc.Status.ToString(),
                        StartType = startType,
                        Description = description,
                        CanStop = svc.CanStop,
                        CanPauseAndContinue = svc.CanPauseAndContinue
                    });
                }
                catch { }
            }

            return new CommandResult
            {
                Success = true,
                ExitCode = 0,
                Stdout = JsonConvert.SerializeObject(services.OrderBy(s => s.DisplayName).ToList())
            };
        }
        catch (Exception ex)
        {
            return new CommandResult { Success = false, ExitCode = -1, Stderr = ex.Message };
        }
    }

    // ==========================================================================
    // PROCESS MANAGEMENT
    // ==========================================================================

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
                return new CommandResult { Success = false, ExitCode = -1, Stderr = $"Process not found: {processIdOrName}" };
            }

            var processName = process.ProcessName;
            process.Kill();

            return new CommandResult
            {
                Success = true,
                ExitCode = 0,
                Stdout = $"Process '{processName}' terminated"
            };
        }
        catch (Exception ex)
        {
            return new CommandResult { Success = false, ExitCode = -1, Stderr = ex.Message };
        }
    }

    private CommandResult KillProcessTree(string processIdOrName)
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
                return new CommandResult { Success = false, ExitCode = -1, Stderr = $"Process not found: {processIdOrName}" };
            }

            var processName = process.ProcessName;
            process.Kill(entireProcessTree: true);

            return new CommandResult
            {
                Success = true,
                ExitCode = 0,
                Stdout = $"Process tree '{processName}' terminated"
            };
        }
        catch (Exception ex)
        {
            return new CommandResult { Success = false, ExitCode = -1, Stderr = ex.Message };
        }
    }

    private CommandResult GetProcessesDetailed()
    {
        try
        {
            var processes = new List<ProcessDetailedInfo>();
            var cpuCounters = new Dictionary<int, PerformanceCounter>();

            foreach (var proc in Process.GetProcesses())
            {
                try
                {
                    double cpuPercent = 0;
                    string? userName = null;
                    string? path = null;

                    try
                    {
                        // Get user via WMI
                        using var searcher = new ManagementObjectSearcher($"SELECT ExecutablePath FROM Win32_Process WHERE ProcessId = {proc.Id}");
                        foreach (var obj in searcher.Get())
                        {
                            path = obj["ExecutablePath"]?.ToString();
                            break;
                        }
                    }
                    catch { }

                    processes.Add(new ProcessDetailedInfo
                    {
                        Name = proc.ProcessName,
                        Pid = proc.Id,
                        CpuPercent = cpuPercent,
                        MemoryMb = Math.Round(proc.WorkingSet64 / 1024.0 / 1024.0, 2),
                        ThreadCount = proc.Threads.Count,
                        HandleCount = proc.HandleCount,
                        UserName = userName,
                        Path = path,
                        StartTime = proc.StartTime.ToString("O")
                    });
                }
                catch { }
            }

            // Sort by memory usage, take top 100
            var result = processes.OrderByDescending(p => p.MemoryMb).Take(100).ToList();

            return new CommandResult
            {
                Success = true,
                ExitCode = 0,
                Stdout = JsonConvert.SerializeObject(result)
            };
        }
        catch (Exception ex)
        {
            return new CommandResult { Success = false, ExitCode = -1, Stderr = ex.Message };
        }
    }

    // ==========================================================================
    // SOFTWARE MANAGEMENT (Chocolatey/WinGet)
    // ==========================================================================

    private async Task<CommandResult> InstallSoftware(RemoteCommand command)
    {
        var packageName = command.Command;
        var manager = command.Parameters?.GetValueOrDefault("manager")?.ToString()?.ToLower() ?? "chocolatey";

        try
        {
            string fileName, arguments;

            if (manager == "winget")
            {
                fileName = "winget";
                arguments = $"install --silent --accept-package-agreements --accept-source-agreements {packageName}";
            }
            else // chocolatey
            {
                fileName = "choco";
                arguments = $"install {packageName} -y --no-progress";
            }

            var psi = new ProcessStartInfo
            {
                FileName = fileName,
                Arguments = arguments,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true
            };

            using var process = Process.Start(psi);
            if (process == null)
            {
                return new CommandResult { Success = false, ExitCode = -1, Stderr = $"Failed to start {manager}" };
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
            return new CommandResult { Success = false, ExitCode = -1, Stderr = ex.Message };
        }
    }

    private async Task<CommandResult> UninstallSoftware(RemoteCommand command)
    {
        var packageName = command.Command;
        var manager = command.Parameters?.GetValueOrDefault("manager")?.ToString()?.ToLower() ?? "chocolatey";

        try
        {
            string fileName, arguments;

            if (manager == "winget")
            {
                fileName = "winget";
                arguments = $"uninstall --silent {packageName}";
            }
            else // chocolatey
            {
                fileName = "choco";
                arguments = $"uninstall {packageName} -y --no-progress";
            }

            var psi = new ProcessStartInfo
            {
                FileName = fileName,
                Arguments = arguments,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true
            };

            using var process = Process.Start(psi);
            if (process == null)
            {
                return new CommandResult { Success = false, ExitCode = -1, Stderr = $"Failed to start {manager}" };
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
            return new CommandResult { Success = false, ExitCode = -1, Stderr = ex.Message };
        }
    }

    // ==========================================================================
    // REGISTRY
    // ==========================================================================

    private CommandResult ReadRegistry(string path)
    {
        try
        {
            // Parse path like "HKLM\SOFTWARE\Microsoft"
            var parts = path.Split('\\', 2);
            if (parts.Length < 2)
            {
                return new CommandResult { Success = false, ExitCode = -1, Stderr = "Invalid registry path format" };
            }

            var hive = parts[0].ToUpper();
            var subPath = parts[1];

            RegistryKey? baseKey = hive switch
            {
                "HKLM" or "HKEY_LOCAL_MACHINE" => Registry.LocalMachine,
                "HKCU" or "HKEY_CURRENT_USER" => Registry.CurrentUser,
                "HKCR" or "HKEY_CLASSES_ROOT" => Registry.ClassesRoot,
                "HKU" or "HKEY_USERS" => Registry.Users,
                "HKCC" or "HKEY_CURRENT_CONFIG" => Registry.CurrentConfig,
                _ => null
            };

            if (baseKey == null)
            {
                return new CommandResult { Success = false, ExitCode = -1, Stderr = $"Unknown registry hive: {hive}" };
            }

            using var key = baseKey.OpenSubKey(subPath);
            if (key == null)
            {
                return new CommandResult { Success = false, ExitCode = -1, Stderr = $"Registry key not found: {path}" };
            }

            var response = new RegistryKeyResponse
            {
                Path = path,
                SubKeys = key.GetSubKeyNames().ToList(),
                Values = new List<RegistryValueInfo>()
            };

            foreach (var valueName in key.GetValueNames())
            {
                try
                {
                    var value = key.GetValue(valueName);
                    var kind = key.GetValueKind(valueName);

                    response.Values.Add(new RegistryValueInfo
                    {
                        Name = string.IsNullOrEmpty(valueName) ? "(Default)" : valueName,
                        Type = kind.ToString(),
                        Data = value?.ToString() ?? ""
                    });
                }
                catch { }
            }

            return new CommandResult
            {
                Success = true,
                ExitCode = 0,
                Stdout = JsonConvert.SerializeObject(response)
            };
        }
        catch (Exception ex)
        {
            return new CommandResult { Success = false, ExitCode = -1, Stderr = ex.Message };
        }
    }

    // ==========================================================================
    // EVENT LOGS
    // ==========================================================================

    private CommandResult GetEventLogs(RemoteCommand command)
    {
        try
        {
            var logName = command.Parameters?.GetValueOrDefault("log_name")?.ToString() ?? "Application";
            var levelFilter = command.Parameters?.GetValueOrDefault("level")?.ToString()?.ToLower();
            var limit = 100;
            if (command.Parameters?.TryGetValue("limit", out var limitObj) == true)
            {
                int.TryParse(limitObj?.ToString(), out limit);
            }

            var eventLog = new EventLog(logName);
            var entries = new List<EventLogEntryInfo>();

            // Read entries in reverse order (newest first)
            for (int i = eventLog.Entries.Count - 1; i >= 0 && entries.Count < limit; i--)
            {
                try
                {
                    var entry = eventLog.Entries[i];
                    var entryType = entry.EntryType.ToString().ToLower();

                    // Filter by level if specified
                    if (!string.IsNullOrEmpty(levelFilter))
                    {
                        if (levelFilter == "error" && entry.EntryType != EventLogEntryType.Error) continue;
                        if (levelFilter == "warning" && entry.EntryType != EventLogEntryType.Warning) continue;
                        if (levelFilter == "information" && entry.EntryType != EventLogEntryType.Information) continue;
                    }

                    entries.Add(new EventLogEntryInfo
                    {
                        Source = entry.Source,
                        EventId = entry.InstanceId,
                        Level = entry.EntryType.ToString(),
                        Message = entry.Message.Length > 500 ? entry.Message.Substring(0, 500) + "..." : entry.Message,
                        TimeGenerated = entry.TimeGenerated.ToString("O"),
                        Category = entry.Category
                    });
                }
                catch { }
            }

            return new CommandResult
            {
                Success = true,
                ExitCode = 0,
                Stdout = JsonConvert.SerializeObject(entries)
            };
        }
        catch (Exception ex)
        {
            return new CommandResult { Success = false, ExitCode = -1, Stderr = ex.Message };
        }
    }

    // ==========================================================================
    // FILE OPERATIONS
    // ==========================================================================

    private CommandResult ListDirectory(string path)
    {
        try
        {
            if (string.IsNullOrEmpty(path))
            {
                path = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            }

            if (!Directory.Exists(path))
            {
                return new CommandResult { Success = false, ExitCode = -1, Stderr = $"Directory not found: {path}" };
            }

            var dirInfo = new DirectoryInfo(path);
            var listing = new DirectoryListing
            {
                Path = dirInfo.FullName,
                Parent = dirInfo.Parent?.FullName,
                Items = new List<FileSystemEntry>()
            };

            // Add directories
            foreach (var dir in dirInfo.GetDirectories())
            {
                try
                {
                    listing.Items.Add(new FileSystemEntry
                    {
                        Name = dir.Name,
                        Type = "directory",
                        Size = 0,
                        Modified = dir.LastWriteTimeUtc.ToString("O"),
                        Created = dir.CreationTimeUtc.ToString("O"),
                        IsHidden = (dir.Attributes & FileAttributes.Hidden) == FileAttributes.Hidden,
                        IsSystem = (dir.Attributes & FileAttributes.System) == FileAttributes.System
                    });
                }
                catch { }
            }

            // Add files
            foreach (var file in dirInfo.GetFiles())
            {
                try
                {
                    listing.Items.Add(new FileSystemEntry
                    {
                        Name = file.Name,
                        Type = "file",
                        Size = file.Length,
                        Modified = file.LastWriteTimeUtc.ToString("O"),
                        Created = file.CreationTimeUtc.ToString("O"),
                        IsHidden = (file.Attributes & FileAttributes.Hidden) == FileAttributes.Hidden,
                        IsSystem = (file.Attributes & FileAttributes.System) == FileAttributes.System,
                        Extension = file.Extension
                    });
                }
                catch { }
            }

            return new CommandResult
            {
                Success = true,
                ExitCode = 0,
                Stdout = JsonConvert.SerializeObject(listing)
            };
        }
        catch (Exception ex)
        {
            return new CommandResult { Success = false, ExitCode = -1, Stderr = ex.Message };
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
                return new CommandResult { Success = false, ExitCode = -1, Stderr = "Missing url or path parameters" };
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
            return new CommandResult { Success = false, ExitCode = -1, Stderr = ex.Message };
        }
    }

    private CommandResult ReceiveFile(RemoteCommand command)
    {
        try
        {
            var path = command.Parameters?.GetValueOrDefault("path")?.ToString();
            var contentBase64 = command.Parameters?.GetValueOrDefault("content")?.ToString();

            if (string.IsNullOrEmpty(path) || string.IsNullOrEmpty(contentBase64))
            {
                return new CommandResult { Success = false, ExitCode = -1, Stderr = "Missing path or content parameters" };
            }

            var bytes = Convert.FromBase64String(contentBase64);
            
            // Ensure directory exists
            var dir = Path.GetDirectoryName(path);
            if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
            {
                Directory.CreateDirectory(dir);
            }

            File.WriteAllBytes(path, bytes);

            return new CommandResult
            {
                Success = true,
                ExitCode = 0,
                Stdout = $"Wrote {bytes.Length} bytes to {path}"
            };
        }
        catch (Exception ex)
        {
            return new CommandResult { Success = false, ExitCode = -1, Stderr = ex.Message };
        }
    }

    // ==========================================================================
    // SYSTEM
    // ==========================================================================

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
            return new CommandResult { Success = false, ExitCode = -1, Stderr = ex.Message };
        }
    }
}

// =============================================================================
// New Command Response Models
// =============================================================================

public class ProcessDetailedInfo
{
    [JsonProperty("name")]
    public string Name { get; set; } = "";

    [JsonProperty("pid")]
    public int Pid { get; set; }

    [JsonProperty("cpu_percent")]
    public double CpuPercent { get; set; }

    [JsonProperty("memory_mb")]
    public double MemoryMb { get; set; }

    [JsonProperty("thread_count")]
    public int ThreadCount { get; set; }

    [JsonProperty("handle_count")]
    public int HandleCount { get; set; }

    [JsonProperty("user_name")]
    public string? UserName { get; set; }

    [JsonProperty("path")]
    public string? Path { get; set; }

    [JsonProperty("start_time")]
    public string? StartTime { get; set; }
}

public class ServiceDetailedInfo
{
    [JsonProperty("name")]
    public string Name { get; set; } = "";

    [JsonProperty("display_name")]
    public string DisplayName { get; set; } = "";

    [JsonProperty("status")]
    public string Status { get; set; } = "";

    [JsonProperty("start_type")]
    public string StartType { get; set; } = "";

    [JsonProperty("description")]
    public string Description { get; set; } = "";

    [JsonProperty("can_stop")]
    public bool CanStop { get; set; }

    [JsonProperty("can_pause")]
    public bool CanPauseAndContinue { get; set; }
}

public class RegistryKeyResponse
{
    [JsonProperty("path")]
    public string Path { get; set; } = "";

    [JsonProperty("sub_keys")]
    public List<string> SubKeys { get; set; } = new();

    [JsonProperty("values")]
    public List<RegistryValueInfo> Values { get; set; } = new();
}

public class RegistryValueInfo
{
    [JsonProperty("name")]
    public string Name { get; set; } = "";

    [JsonProperty("type")]
    public string Type { get; set; } = "";

    [JsonProperty("data")]
    public string Data { get; set; } = "";
}

public class EventLogEntryInfo
{
    [JsonProperty("source")]
    public string Source { get; set; } = "";

    [JsonProperty("event_id")]
    public long EventId { get; set; }

    [JsonProperty("level")]
    public string Level { get; set; } = "";

    [JsonProperty("message")]
    public string Message { get; set; } = "";

    [JsonProperty("time_generated")]
    public string TimeGenerated { get; set; } = "";

    [JsonProperty("category")]
    public string Category { get; set; } = "";
}

public class DirectoryListing
{
    [JsonProperty("path")]
    public string Path { get; set; } = "";

    [JsonProperty("parent")]
    public string? Parent { get; set; }

    [JsonProperty("items")]
    public List<FileSystemEntry> Items { get; set; } = new();
}

public class FileSystemEntry
{
    [JsonProperty("name")]
    public string Name { get; set; } = "";

    [JsonProperty("type")]
    public string Type { get; set; } = "";

    [JsonProperty("size")]
    public long Size { get; set; }

    [JsonProperty("modified")]
    public string Modified { get; set; } = "";

    [JsonProperty("created")]
    public string Created { get; set; } = "";

    [JsonProperty("is_hidden")]
    public bool IsHidden { get; set; }

    [JsonProperty("is_system")]
    public bool IsSystem { get; set; }

    [JsonProperty("extension")]
    public string? Extension { get; set; }
}
