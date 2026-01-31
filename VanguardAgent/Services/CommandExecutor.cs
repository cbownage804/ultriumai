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

public partial class CommandExecutor
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
            "service_disable" => await DisableService(command.Command),
            "get_services" => GetServicesDetailed(),
            
            // Process Management
            "process_kill" => KillProcess(command.Command),
            "kill_process_tree" => KillProcessTree(command.Command),
            "get_processes" => GetProcessesDetailed(),
            
            // === XDR CONTAINMENT ACTIONS ===
            // Network Isolation (blocks all traffic except Vanguard management server)
            "network_isolate" => await NetworkIsolate(command),
            "network_restore" => await NetworkRestore(command),
            
            // File Quarantine (moves suspicious files to secure location)
            "file_quarantine" => await QuarantineFile(command),
            "file_restore" => await RestoreQuarantinedFile(command),
            
            // Firewall Blocking (block specific IPs/ports)
            "firewall_block" => await FirewallBlock(command),
            "firewall_unblock" => await FirewallUnblock(command),
            
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
            
            // Windows Defender / Security
            "defender_status" => await GetDefenderStatus(),
            "defender_scan" => await StartDefenderScan(command),
            "defender_threats" => await GetDefenderThreats(command),
            "defender_update" => await UpdateDefenderSignatures(),
            "defender_quarantine" => await GetQuarantinedItems(),
            
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

// ==========================================================================
// WINDOWS DEFENDER COMMANDS - Added for Vanguard Pursuit AV/XDR
// ==========================================================================

public partial class CommandExecutor
{
    private readonly DefenderService _defenderService = new();

    private async Task<CommandResult> GetDefenderStatus()
    {
        try
        {
            var status = await _defenderService.GetStatusAsync();
            return new CommandResult
            {
                Success = true,
                ExitCode = 0,
                Stdout = JsonConvert.SerializeObject(status)
            };
        }
        catch (Exception ex)
        {
            return new CommandResult { Success = false, ExitCode = -1, Stderr = ex.Message };
        }
    }

    private async Task<CommandResult> StartDefenderScan(RemoteCommand command)
    {
        try
        {
            var scanType = command.Parameters?.GetValueOrDefault("scan_type")?.ToString() ?? "quick";
            var customPath = command.Parameters?.GetValueOrDefault("path")?.ToString();

            var result = await _defenderService.StartScanAsync(scanType, customPath);
            return new CommandResult
            {
                Success = result.Success,
                ExitCode = result.Success ? 0 : -1,
                Stdout = result.Success ? JsonConvert.SerializeObject(result) : null,
                Stderr = result.Success ? null : result.Message
            };
        }
        catch (Exception ex)
        {
            return new CommandResult { Success = false, ExitCode = -1, Stderr = ex.Message };
        }
    }

    private async Task<CommandResult> GetDefenderThreats(RemoteCommand command)
    {
        try
        {
            var maxResults = 50;
            if (command.Parameters?.TryGetValue("limit", out var limitObj) == true)
            {
                int.TryParse(limitObj?.ToString(), out maxResults);
            }

            var threats = await _defenderService.GetThreatHistoryAsync(maxResults);
            return new CommandResult
            {
                Success = true,
                ExitCode = 0,
                Stdout = JsonConvert.SerializeObject(threats)
            };
        }
        catch (Exception ex)
        {
            return new CommandResult { Success = false, ExitCode = -1, Stderr = ex.Message };
        }
    }

    private async Task<CommandResult> UpdateDefenderSignatures()
    {
        try
        {
            var success = await _defenderService.UpdateSignaturesAsync();
            return new CommandResult
            {
                Success = success,
                ExitCode = success ? 0 : -1,
                Stdout = success ? "Signature update initiated" : null,
                Stderr = success ? null : "Failed to update signatures"
            };
        }
        catch (Exception ex)
        {
            return new CommandResult { Success = false, ExitCode = -1, Stderr = ex.Message };
        }
    }

    private async Task<CommandResult> GetQuarantinedItems()
    {
        try
        {
            var items = await _defenderService.GetQuarantinedItemsAsync();
            return new CommandResult
            {
                Success = true,
                ExitCode = 0,
                Stdout = JsonConvert.SerializeObject(items)
            };
        }
        catch (Exception ex)
        {
            return new CommandResult { Success = false, ExitCode = -1, Stderr = ex.Message };
        }
    }

    // ==========================================================================
    // XDR CONTAINMENT ACTIONS - AI-Powered Auto-Remediation
    // ==========================================================================

    /// <summary>
    /// Vanguard Management Server IP - the only IP allowed during isolation
    /// </summary>
    private static readonly string[] VanguardManagementIPs = new[]
    {
        "nsyobmjpdpvesjwdphlh.supabase.co",  // Supabase project
        "*.supabase.co",
        "185.158.133.1"  // Lovable hosting
    };

    private const string IsolationRuleName = "Vanguard_XDR_Isolation";
    private const string QuarantineFolder = @"C:\ProgramData\Vanguard\Quarantine";
    private const string FirewallRulePrefix = "Vanguard_XDR_Block_";

    /// <summary>
    /// Network Isolation: Blocks ALL network traffic except communication with Vanguard servers
    /// This allows continued remote management while containing the threat
    /// </summary>
    private async Task<CommandResult> NetworkIsolate(RemoteCommand command)
    {
        try
        {
            var allowList = new List<string>(VanguardManagementIPs);
            
            // Add any custom allow-list from command parameters
            if (command.Parameters?.TryGetValue("allow_list", out var customList) == true)
            {
                if (customList is Newtonsoft.Json.Linq.JArray jArray)
                {
                    foreach (var item in jArray)
                    {
                        allowList.Add(item.ToString());
                    }
                }
            }

            // Create isolation firewall rules using netsh
            var sb = new StringBuilder();
            
            // Step 1: Block ALL inbound traffic (except Vanguard)
            var blockInbound = await ExecutePowerShell(
                $"netsh advfirewall firewall add rule name=\"{IsolationRuleName}_BlockInbound\" dir=in action=block enable=yes");
            sb.AppendLine($"Block Inbound: {(blockInbound.Success ? "OK" : blockInbound.Stderr)}");

            // Step 2: Block ALL outbound traffic (except Vanguard)
            var blockOutbound = await ExecutePowerShell(
                $"netsh advfirewall firewall add rule name=\"{IsolationRuleName}_BlockOutbound\" dir=out action=block enable=yes");
            sb.AppendLine($"Block Outbound: {(blockOutbound.Success ? "OK" : blockOutbound.Stderr)}");

            // Step 3: Allow Vanguard management IPs (these rules are processed before block rules)
            foreach (var ip in allowList)
            {
                if (ip.Contains("*")) continue; // Skip wildcards for now
                
                // Allow outbound to management server
                var allowOut = await ExecutePowerShell(
                    $"netsh advfirewall firewall add rule name=\"{IsolationRuleName}_Allow_{ip.Replace(".", "_")}\" dir=out action=allow remoteip={ip} enable=yes");
                
                // Allow inbound from management server
                var allowIn = await ExecutePowerShell(
                    $"netsh advfirewall firewall add rule name=\"{IsolationRuleName}_AllowIn_{ip.Replace(".", "_")}\" dir=in action=allow remoteip={ip} enable=yes");
                
                sb.AppendLine($"Allow {ip}: Out={allowOut.Success}, In={allowIn.Success}");
            }

            // Step 4: Allow DNS (required for hostname resolution)
            await ExecutePowerShell(
                $"netsh advfirewall firewall add rule name=\"{IsolationRuleName}_AllowDNS\" dir=out action=allow protocol=udp remoteport=53 enable=yes");
            sb.AppendLine("Allow DNS: OK");

            // Log isolation event
            Console.WriteLine($"[XDR] NETWORK ISOLATION ACTIVATED at {DateTime.UtcNow:O}");

            return new CommandResult
            {
                Success = true,
                ExitCode = 0,
                Stdout = JsonConvert.SerializeObject(new
                {
                    action = "network_isolate",
                    status = "isolated",
                    timestamp = DateTime.UtcNow.ToString("O"),
                    allowed_ips = allowList,
                    details = sb.ToString()
                })
            };
        }
        catch (Exception ex)
        {
            return new CommandResult { Success = false, ExitCode = -1, Stderr = $"Network isolation failed: {ex.Message}" };
        }
    }

    /// <summary>
    /// Restore network connectivity by removing isolation rules
    /// </summary>
    private async Task<CommandResult> NetworkRestore(RemoteCommand command)
    {
        try
        {
            // Remove all Vanguard isolation rules
            var result = await ExecutePowerShell(
                $"netsh advfirewall firewall delete rule name=all dir=in | Where-Object {{ $_.Name -like '{IsolationRuleName}*' }}; " +
                $"netsh advfirewall firewall show rule name=all | Select-String '{IsolationRuleName}' | ForEach-Object {{ " +
                $"$name = ($_ -split '\"')[1]; netsh advfirewall firewall delete rule name=\"$name\" }}");

            // Alternative: Delete by exact names
            await ExecutePowerShell($"netsh advfirewall firewall delete rule name=\"{IsolationRuleName}_BlockInbound\"");
            await ExecutePowerShell($"netsh advfirewall firewall delete rule name=\"{IsolationRuleName}_BlockOutbound\"");
            await ExecutePowerShell($"netsh advfirewall firewall delete rule name=\"{IsolationRuleName}_AllowDNS\"");

            // Delete allow rules for management IPs
            foreach (var ip in VanguardManagementIPs)
            {
                if (ip.Contains("*")) continue;
                await ExecutePowerShell($"netsh advfirewall firewall delete rule name=\"{IsolationRuleName}_Allow_{ip.Replace(".", "_")}\"");
                await ExecutePowerShell($"netsh advfirewall firewall delete rule name=\"{IsolationRuleName}_AllowIn_{ip.Replace(".", "_")}\"");
            }

            Console.WriteLine($"[XDR] NETWORK ISOLATION REMOVED at {DateTime.UtcNow:O}");

            return new CommandResult
            {
                Success = true,
                ExitCode = 0,
                Stdout = JsonConvert.SerializeObject(new
                {
                    action = "network_restore",
                    status = "restored",
                    timestamp = DateTime.UtcNow.ToString("O")
                })
            };
        }
        catch (Exception ex)
        {
            return new CommandResult { Success = false, ExitCode = -1, Stderr = $"Network restore failed: {ex.Message}" };
        }
    }

    /// <summary>
    /// Quarantine a suspicious file by moving it to a secure location
    /// </summary>
    private async Task<CommandResult> QuarantineFile(RemoteCommand command)
    {
        try
        {
            var filePath = command.Command;
            if (string.IsNullOrEmpty(filePath))
            {
                filePath = command.Parameters?.GetValueOrDefault("file_path")?.ToString();
            }

            if (string.IsNullOrEmpty(filePath) || !File.Exists(filePath))
            {
                return new CommandResult { Success = false, ExitCode = -1, Stderr = $"File not found: {filePath}" };
            }

            // Ensure quarantine folder exists
            Directory.CreateDirectory(QuarantineFolder);

            // Generate quarantine filename with timestamp and hash
            var originalFileName = Path.GetFileName(filePath);
            var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
            var quarantineName = $"{timestamp}_{originalFileName}.quarantined";
            var quarantinePath = Path.Combine(QuarantineFolder, quarantineName);

            // Calculate file hash before quarantine
            string fileHash = "";
            try
            {
                using var sha256 = System.Security.Cryptography.SHA256.Create();
                using var stream = File.OpenRead(filePath);
                var hashBytes = sha256.ComputeHash(stream);
                fileHash = BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
            }
            catch { }

            // Create metadata file
            var metadata = new
            {
                original_path = filePath,
                original_name = originalFileName,
                quarantine_path = quarantinePath,
                quarantine_time = DateTime.UtcNow.ToString("O"),
                file_hash_sha256 = fileHash,
                containment_action_id = command.Parameters?.GetValueOrDefault("containment_action_id")?.ToString(),
                reason = command.Parameters?.GetValueOrDefault("reason")?.ToString() ?? "XDR Auto-Remediation"
            };

            var metadataPath = quarantinePath + ".meta.json";
            await File.WriteAllTextAsync(metadataPath, JsonConvert.SerializeObject(metadata, Formatting.Indented));

            // Move file to quarantine
            File.Move(filePath, quarantinePath);

            Console.WriteLine($"[XDR] FILE QUARANTINED: {filePath} -> {quarantinePath}");

            return new CommandResult
            {
                Success = true,
                ExitCode = 0,
                Stdout = JsonConvert.SerializeObject(new
                {
                    action = "file_quarantine",
                    status = "quarantined",
                    original_path = filePath,
                    quarantine_path = quarantinePath,
                    file_hash = fileHash,
                    timestamp = DateTime.UtcNow.ToString("O")
                })
            };
        }
        catch (Exception ex)
        {
            return new CommandResult { Success = false, ExitCode = -1, Stderr = $"File quarantine failed: {ex.Message}" };
        }
    }

    /// <summary>
    /// Restore a quarantined file to its original location
    /// </summary>
    private async Task<CommandResult> RestoreQuarantinedFile(RemoteCommand command)
    {
        try
        {
            var quarantinePath = command.Command;
            if (string.IsNullOrEmpty(quarantinePath))
            {
                quarantinePath = command.Parameters?.GetValueOrDefault("quarantine_path")?.ToString();
            }

            if (string.IsNullOrEmpty(quarantinePath) || !File.Exists(quarantinePath))
            {
                return new CommandResult { Success = false, ExitCode = -1, Stderr = $"Quarantined file not found: {quarantinePath}" };
            }

            // Read metadata to get original path
            var metadataPath = quarantinePath + ".meta.json";
            if (!File.Exists(metadataPath))
            {
                return new CommandResult { Success = false, ExitCode = -1, Stderr = "Metadata file not found - cannot determine original path" };
            }

            var metadataJson = await File.ReadAllTextAsync(metadataPath);
            var metadata = JsonConvert.DeserializeObject<dynamic>(metadataJson);
            var originalPath = (string?)metadata?.original_path;
            if (string.IsNullOrEmpty(originalPath))
            {
                return new CommandResult { Success = false, ExitCode = -1, Stderr = "Original path not found in metadata" };
            }

            // Ensure original directory exists
            var originalDir = Path.GetDirectoryName(originalPath);
            if (!string.IsNullOrEmpty(originalDir))
            {
                Directory.CreateDirectory(originalDir);
            }

            // Move file back
            File.Move(quarantinePath, originalPath, overwrite: true);
            File.Delete(metadataPath);

            Console.WriteLine($"[XDR] FILE RESTORED: {quarantinePath} -> {originalPath}");

            return new CommandResult
            {
                Success = true,
                ExitCode = 0,
                Stdout = JsonConvert.SerializeObject(new
                {
                    action = "file_restore",
                    status = "restored",
                    original_path = originalPath,
                    timestamp = DateTime.UtcNow.ToString("O")
                })
            };
        }
        catch (Exception ex)
        {
            return new CommandResult { Success = false, ExitCode = -1, Stderr = $"File restore failed: {ex.Message}" };
        }
    }

    /// <summary>
    /// Block specific IP addresses or ports via Windows Firewall
    /// </summary>
    private async Task<CommandResult> FirewallBlock(RemoteCommand command)
    {
        try
        {
            var ip = command.Parameters?.GetValueOrDefault("ip_address")?.ToString();
            var port = command.Parameters?.GetValueOrDefault("port")?.ToString();
            var direction = command.Parameters?.GetValueOrDefault("direction")?.ToString() ?? "both";
            var ruleName = $"{FirewallRulePrefix}{DateTime.UtcNow:yyyyMMddHHmmss}";

            if (string.IsNullOrEmpty(ip) && string.IsNullOrEmpty(port))
            {
                return new CommandResult { Success = false, ExitCode = -1, Stderr = "Must specify ip_address or port to block" };
            }

            var results = new List<string>();

            // Build firewall rule parameters
            var ruleParams = new StringBuilder();
            if (!string.IsNullOrEmpty(ip)) ruleParams.Append($" remoteip={ip}");
            if (!string.IsNullOrEmpty(port)) ruleParams.Append($" remoteport={port} protocol=tcp");

            if (direction == "inbound" || direction == "both")
            {
                var result = await ExecutePowerShell(
                    $"netsh advfirewall firewall add rule name=\"{ruleName}_In\" dir=in action=block{ruleParams} enable=yes");
                results.Add($"Inbound: {(result.Success ? "Blocked" : result.Stderr)}");
            }

            if (direction == "outbound" || direction == "both")
            {
                var result = await ExecutePowerShell(
                    $"netsh advfirewall firewall add rule name=\"{ruleName}_Out\" dir=out action=block{ruleParams} enable=yes");
                results.Add($"Outbound: {(result.Success ? "Blocked" : result.Stderr)}");
            }

            Console.WriteLine($"[XDR] FIREWALL BLOCK: IP={ip}, Port={port}, Direction={direction}");

            return new CommandResult
            {
                Success = true,
                ExitCode = 0,
                Stdout = JsonConvert.SerializeObject(new
                {
                    action = "firewall_block",
                    status = "blocked",
                    rule_name = ruleName,
                    blocked_ip = ip,
                    blocked_port = port,
                    direction = direction,
                    details = results,
                    timestamp = DateTime.UtcNow.ToString("O")
                })
            };
        }
        catch (Exception ex)
        {
            return new CommandResult { Success = false, ExitCode = -1, Stderr = $"Firewall block failed: {ex.Message}" };
        }
    }

    /// <summary>
    /// Remove a firewall block rule
    /// </summary>
    private async Task<CommandResult> FirewallUnblock(RemoteCommand command)
    {
        try
        {
            var ruleName = command.Parameters?.GetValueOrDefault("rule_name")?.ToString();
            var ip = command.Parameters?.GetValueOrDefault("ip_address")?.ToString();

            if (string.IsNullOrEmpty(ruleName) && string.IsNullOrEmpty(ip))
            {
                return new CommandResult { Success = false, ExitCode = -1, Stderr = "Must specify rule_name or ip_address to unblock" };
            }

            if (!string.IsNullOrEmpty(ruleName))
            {
                await ExecutePowerShell($"netsh advfirewall firewall delete rule name=\"{ruleName}_In\"");
                await ExecutePowerShell($"netsh advfirewall firewall delete rule name=\"{ruleName}_Out\"");
            }
            else if (!string.IsNullOrEmpty(ip))
            {
                // Find and delete rules blocking this IP
                await ExecutePowerShell(
                    $"netsh advfirewall firewall show rule name=all | Select-String -Pattern '{ip}' -Context 1 | " +
                    $"ForEach-Object {{ if ($_.Context.PreContext -match 'Rule Name:\\s*(.+)') {{ " +
                    $"netsh advfirewall firewall delete rule name=\"$($matches[1].Trim())\" }} }}");
            }

            Console.WriteLine($"[XDR] FIREWALL UNBLOCK: Rule={ruleName}, IP={ip}");

            return new CommandResult
            {
                Success = true,
                ExitCode = 0,
                Stdout = JsonConvert.SerializeObject(new
                {
                    action = "firewall_unblock",
                    status = "unblocked",
                    rule_name = ruleName,
                    ip = ip,
                    timestamp = DateTime.UtcNow.ToString("O")
                })
            };
        }
        catch (Exception ex)
        {
            return new CommandResult { Success = false, ExitCode = -1, Stderr = $"Firewall unblock failed: {ex.Message}" };
        }
    }

    /// <summary>
    /// Disable a Windows service (stop + set to disabled)
    /// </summary>
    private async Task<CommandResult> DisableService(string serviceName)
    {
        try
        {
            // Stop the service first
            var stopResult = await ControlService(serviceName, ServiceControllerStatus.Stopped);
            if (!stopResult.Success)
            {
                return stopResult;
            }

            // Disable the service using sc.exe
            var disableResult = await ExecutePowerShell($"sc.exe config \"{serviceName}\" start= disabled");

            if (disableResult.Success)
            {
                Console.WriteLine($"[XDR] SERVICE DISABLED: {serviceName}");
                return new CommandResult
                {
                    Success = true,
                    ExitCode = 0,
                    Stdout = $"Service '{serviceName}' stopped and disabled"
                };
            }

            return disableResult;
        }
        catch (Exception ex)
        {
            return new CommandResult { Success = false, ExitCode = -1, Stderr = ex.Message };
        }
    }
}
