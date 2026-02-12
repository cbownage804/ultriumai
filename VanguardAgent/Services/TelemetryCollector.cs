// =============================================================================
// System Telemetry Collector
// =============================================================================

using System.Diagnostics;
using System.Management;
using System.Net.NetworkInformation;
using System.Runtime.InteropServices;
using System.ServiceProcess;
using Microsoft.Win32;

namespace VanguardAgent.Services;

public class TelemetryCollector
{
    private readonly PerformanceCounter? _cpuCounter;
    private readonly ConfigService _configService;
    private readonly DefenderService _defenderService;

    public TelemetryCollector(ConfigService configService)
    {
        _configService = configService;
        _defenderService = new DefenderService();

        try
        {
            _cpuCounter = new PerformanceCounter("Processor", "% Processor Time", "_Total");
            _cpuCounter.NextValue(); // First call returns 0
        }
        catch
        {
            // Performance counters may not be available
        }
    }

    /// <summary>
    /// Collect Windows Defender security status
    /// </summary>
    public async Task<SecurityTelemetry> CollectSecurityTelemetryAsync()
    {
        var telemetry = new SecurityTelemetry
        {
            Timestamp = DateTime.UtcNow.ToString("O")
        };

        try
        {
            telemetry.DefenderStatus = await _defenderService.GetStatusAsync();
            telemetry.RecentThreats = await _defenderService.GetThreatHistoryAsync(10);
            telemetry.QuarantinedItems = await _defenderService.GetQuarantinedItemsAsync();
        }
        catch (Exception ex)
        {
            telemetry.Error = ex.Message;
        }

        return telemetry;
    }

    public DeviceInfo CollectDeviceInfo()
    {
        var info = new DeviceInfo
        {
            Hostname = Environment.MachineName,
            OsName = RuntimeInformation.OSDescription,
            OsVersion = Environment.OSVersion.VersionString,
            AgentVersion = "1.1.0"
        };

        // Detect device type (Server vs Workstation) and form factor (Laptop vs Desktop)
        info.DeviceType = DetectDeviceType();
        info.FormFactor = DetectFormFactor();
        info.IsVirtualMachine = DetectVirtualMachine();

        // Get IP and MAC
        try
        {
            var networkInterface = NetworkInterface.GetAllNetworkInterfaces()
                .FirstOrDefault(n => n.OperationalStatus == OperationalStatus.Up &&
                                     n.NetworkInterfaceType != NetworkInterfaceType.Loopback);

            if (networkInterface != null)
            {
                var ipProps = networkInterface.GetIPProperties();
                var ipAddress = ipProps.UnicastAddresses
                    .FirstOrDefault(a => a.Address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork);

                info.IpAddress = ipAddress?.Address.ToString() ?? "";
                info.MacAddress = networkInterface.GetPhysicalAddress().ToString();
            }
        }
        catch { }

        // Get CPU info with cores and threads
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT Name, NumberOfCores, NumberOfLogicalProcessors FROM Win32_Processor");
            foreach (var obj in searcher.Get())
            {
                info.CpuInfo = obj["Name"]?.ToString() ?? "";
                info.CpuCores = Convert.ToInt32(obj["NumberOfCores"] ?? 0);
                info.CpuThreads = Convert.ToInt32(obj["NumberOfLogicalProcessors"] ?? 0);
                break;
            }
        }
        catch { }

        // Get total memory
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT TotalPhysicalMemory, Model, Manufacturer FROM Win32_ComputerSystem");
            foreach (var obj in searcher.Get())
            {
                var bytes = Convert.ToInt64(obj["TotalPhysicalMemory"]);
                info.TotalMemoryGb = Math.Round(bytes / 1024.0 / 1024.0 / 1024.0, 2);
                info.Model = obj["Model"]?.ToString() ?? "";
                info.Manufacturer = obj["Manufacturer"]?.ToString() ?? "";
                break;
            }
        }
        catch { }

        // Get serial number and BIOS info
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT SerialNumber, Manufacturer, SMBIOSBIOSVersion FROM Win32_BIOS");
            foreach (var obj in searcher.Get())
            {
                info.SerialNumber = obj["SerialNumber"]?.ToString() ?? "";
                info.BiosManufacturer = obj["Manufacturer"]?.ToString() ?? "";
                info.BiosVersion = obj["SMBIOSBIOSVersion"]?.ToString() ?? "";
                break;
            }
        }
        catch { }

        // Get video card info
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT Name FROM Win32_VideoController");
            var videoCards = new List<string>();
            foreach (var obj in searcher.Get())
            {
                var name = obj["Name"]?.ToString();
                if (!string.IsNullOrEmpty(name)) videoCards.Add(name);
            }
            info.VideoCard = videoCards.Count > 0 ? string.Join(", ", videoCards) : "";
        }
        catch { }

        // Get sound card info
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT Name FROM Win32_SoundDevice");
            var soundCards = new List<string>();
            foreach (var obj in searcher.Get())
            {
                var name = obj["Name"]?.ToString();
                if (!string.IsNullOrEmpty(name)) soundCards.Add(name);
            }
            info.SoundCard = soundCards.Count > 0 ? soundCards[0] : ""; // Just first one to avoid clutter
        }
        catch { }

        // Auto-detect remote access tools
        DetectRemoteAccessTools(info);

        return info;
    }

    /// <summary>
    /// Detect installed remote access tools and their IDs
    /// </summary>
    private void DetectRemoteAccessTools(DeviceInfo info)
    {
        // Detect AnyDesk
        info.AnyDeskId = DetectAnyDeskId();

        // Detect TeamViewer
        info.TeamViewerId = DetectTeamViewerId();
    }

    /// <summary>
    /// Detect AnyDesk ID from config
    /// </summary>
    private string? DetectAnyDeskId()
    {
        try
        {
            // AnyDesk stores ID in system.conf or service.conf
            var anydeskPaths = new[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "AnyDesk", "system.conf"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "AnyDesk", "system.conf"),
            };

            foreach (var path in anydeskPaths)
            {
                if (File.Exists(path))
                {
                    var content = File.ReadAllText(path);
                    // Look for ad.anynet.id= pattern
                    var match = System.Text.RegularExpressions.Regex.Match(content, @"ad\.anynet\.id=(\d+)");
                    if (match.Success)
                    {
                        return match.Groups[1].Value;
                    }
                }
            }
        }
        catch { }

        return null;
    }

    /// <summary>
    /// Detect TeamViewer ID from registry
    /// </summary>
    private string? DetectTeamViewerId()
    {
        try
        {
            // TeamViewer stores ClientID in registry
            var regPaths = new[]
            {
                @"SOFTWARE\TeamViewer",
                @"SOFTWARE\WOW6432Node\TeamViewer"
            };

            foreach (var regPath in regPaths)
            {
                using var key = Registry.LocalMachine.OpenSubKey(regPath);
                var clientId = key?.GetValue("ClientID")?.ToString();
                if (!string.IsNullOrEmpty(clientId)) return clientId;
            }

            // Try current user
            using var userKey = Registry.CurrentUser.OpenSubKey(@"SOFTWARE\TeamViewer");
            var userId = userKey?.GetValue("ClientID")?.ToString();
            if (!string.IsNullOrEmpty(userId)) return userId;
        }
        catch { }

        return null;
    }

    /// <summary>
    /// Detect if this is a Server or Workstation OS
    /// </summary>
    private string DetectDeviceType()
    {
        try
        {
            // Method 1: Check ProductType from Win32_OperatingSystem
            // ProductType: 1 = Workstation, 2 = Domain Controller, 3 = Server
            using var searcher = new ManagementObjectSearcher("SELECT ProductType, Caption FROM Win32_OperatingSystem");
            foreach (var obj in searcher.Get())
            {
                var productType = Convert.ToInt32(obj["ProductType"]);
                var caption = obj["Caption"]?.ToString() ?? "";

                if (productType == 2) return "Domain Controller";
                if (productType == 3) return "Server";
                
                // Double-check with OS name for edge cases
                if (caption.Contains("Server", StringComparison.OrdinalIgnoreCase)) return "Server";
            }
            
            return "Workstation";
        }
        catch
        {
            // Fallback: check OS description
            var osDesc = RuntimeInformation.OSDescription;
            if (osDesc.Contains("Server", StringComparison.OrdinalIgnoreCase)) return "Server";
            return "Workstation";
        }
    }

    /// <summary>
    /// Detect form factor: Laptop, Desktop, Tablet, or Virtual Machine
    /// </summary>
    private string DetectFormFactor()
    {
        try
        {
            // Method 1: Check chassis type from Win32_SystemEnclosure
            // ChassisTypes: 3,4,5,6,7,15,16 = Desktop; 8,9,10,11,12,14,18,21 = Laptop/Portable; 30,31,32 = Tablet
            using var searcher = new ManagementObjectSearcher("SELECT ChassisTypes FROM Win32_SystemEnclosure");
            foreach (var obj in searcher.Get())
            {
                var chassisTypes = obj["ChassisTypes"] as ushort[];
                if (chassisTypes != null && chassisTypes.Length > 0)
                {
                    var chassisType = chassisTypes[0];
                    
                    // Laptop/Notebook/Portable
                    if (new ushort[] { 8, 9, 10, 11, 12, 14, 18, 21 }.Contains(chassisType))
                        return "Laptop";
                    
                    // Desktop/Tower/Mini Tower
                    if (new ushort[] { 3, 4, 5, 6, 7, 15, 16 }.Contains(chassisType))
                        return "Desktop";
                    
                    // Tablet
                    if (new ushort[] { 30, 31, 32 }.Contains(chassisType))
                        return "Tablet";
                    
                    // All-in-One
                    if (chassisType == 13)
                        return "All-in-One";
                    
                    // Blade server or rack mount
                    if (new ushort[] { 17, 23 }.Contains(chassisType))
                        return "Rack Server";
                }
            }
            
            // Method 2: Check for battery (laptops have batteries)
            using var batterySearcher = new ManagementObjectSearcher("SELECT * FROM Win32_Battery");
            var batteries = batterySearcher.Get();
            if (batteries.Count > 0)
            {
                return "Laptop";
            }
            
            return "Desktop";
        }
        catch
        {
            return "Unknown";
        }
    }

    /// <summary>
    /// Detect if running in a virtual machine
    /// </summary>
    private bool DetectVirtualMachine()
    {
        try
        {
            // Check Win32_ComputerSystem Model
            using var searcher = new ManagementObjectSearcher("SELECT Model, Manufacturer FROM Win32_ComputerSystem");
            foreach (var obj in searcher.Get())
            {
                var model = obj["Model"]?.ToString()?.ToLower() ?? "";
                var manufacturer = obj["Manufacturer"]?.ToString()?.ToLower() ?? "";
                
                // VMware
                if (model.Contains("vmware") || manufacturer.Contains("vmware"))
                    return true;
                
                // Hyper-V
                if (model.Contains("virtual machine") || manufacturer.Contains("microsoft corporation"))
                {
                    // Check if it's actually Hyper-V
                    using var baseboardSearcher = new ManagementObjectSearcher("SELECT Product FROM Win32_BaseBoard");
                    foreach (var bb in baseboardSearcher.Get())
                    {
                        var product = bb["Product"]?.ToString()?.ToLower() ?? "";
                        if (product.Contains("virtual"))
                            return true;
                    }
                }
                
                // VirtualBox
                if (model.Contains("virtualbox") || manufacturer.Contains("innotek"))
                    return true;
                
                // KVM/QEMU
                if (model.Contains("kvm") || model.Contains("qemu") || manufacturer.Contains("qemu"))
                    return true;
                
                // Xen
                if (manufacturer.Contains("xen"))
                    return true;
                
                // Parallels
                if (model.Contains("parallels") || manufacturer.Contains("parallels"))
                    return true;
            }
            
            return false;
        }
        catch
        {
            return false;
        }
    }

    public HeartbeatPayload CollectHeartbeat()
    {
        var heartbeat = new HeartbeatPayload
        {
            Timestamp = DateTime.UtcNow.ToString("O")
        };

        // CPU Usage
        try
        {
            heartbeat.CpuPercent = Math.Round(_cpuCounter?.NextValue() ?? 0, 2);
        }
        catch { }

        // Memory Usage
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT FreePhysicalMemory, TotalVisibleMemorySize FROM Win32_OperatingSystem");
            foreach (var obj in searcher.Get())
            {
                var total = Convert.ToDouble(obj["TotalVisibleMemorySize"]);
                var free = Convert.ToDouble(obj["FreePhysicalMemory"]);
                heartbeat.MemoryPercent = Math.Round((total - free) / total * 100, 2);
                break;
            }
        }
        catch { }

        // Disk Usage
        try
        {
            var drive = DriveInfo.GetDrives()
                .FirstOrDefault(d => d.IsReady && d.DriveType == DriveType.Fixed);

            if (drive != null)
            {
                var usedSpace = drive.TotalSize - drive.AvailableFreeSpace;
                heartbeat.DiskPercent = Math.Round((double)usedSpace / drive.TotalSize * 100, 2);
            }
        }
        catch { }

        // Uptime
        try
        {
            heartbeat.UptimeSeconds = (long)TimeSpan.FromMilliseconds(Environment.TickCount64).TotalSeconds;
        }
        catch { }

        return heartbeat;
    }

    public TelemetryPayload CollectTelemetry()
    {
        var telemetry = new TelemetryPayload
        {
            Timestamp = DateTime.UtcNow.ToString("O")
        };

        var features = _configService.Config.Features;

        if (features.CollectProcesses)
        {
            telemetry.Processes = CollectProcesses();
        }

        if (features.CollectServices)
        {
            telemetry.Services = CollectServices();
        }

        if (features.CollectNetwork)
        {
            telemetry.NetworkAdapters = CollectNetworkAdapters();
            telemetry.NetworkConnections = CollectNetworkConnections();
        }

        if (features.CollectInstalledSoftware)
        {
            telemetry.InstalledSoftware = CollectInstalledSoftware();
        }

        // Always collect disk information
        telemetry.Disks = CollectDisks();

        // Always collect startup programs and local users
        telemetry.StartupPrograms = CollectStartupPrograms();
        telemetry.LocalUsers = CollectLocalUsers();

        return telemetry;
    }

    private List<DiskInfo> CollectDisks()
    {
        var disks = new List<DiskInfo>();

        try
        {
            foreach (var drive in DriveInfo.GetDrives())
            {
                try
                {
                    if (!drive.IsReady) continue;
                    
                    var totalGb = Math.Round(drive.TotalSize / 1024.0 / 1024.0 / 1024.0, 2);
                    var freeGb = Math.Round(drive.AvailableFreeSpace / 1024.0 / 1024.0 / 1024.0, 2);
                    var usedGb = Math.Round(totalGb - freeGb, 2);
                    var percentUsed = totalGb > 0 ? Math.Round(usedGb / totalGb * 100, 1) : 0;

                    disks.Add(new DiskInfo
                    {
                        Drive = drive.Name.TrimEnd('\\'),
                        Label = drive.VolumeLabel ?? "",
                        Type = drive.DriveType.ToString(),
                        FileSystem = drive.DriveFormat ?? "",
                        TotalGb = totalGb,
                        UsedGb = usedGb,
                        FreeGb = freeGb,
                        PercentUsed = percentUsed,
                        Status = "Healthy"
                    });
                }
                catch { }
            }
        }
        catch { }

        return disks;
    }

    private List<ProcessInfo> CollectProcesses()
    {
        var processes = new List<ProcessInfo>();

        try
        {
            foreach (var proc in Process.GetProcesses().Take(50)) // Limit to top 50
            {
                try
                {
                    processes.Add(new ProcessInfo
                    {
                        Name = proc.ProcessName,
                        Pid = proc.Id,
                        MemoryMb = Math.Round(proc.WorkingSet64 / 1024.0 / 1024.0, 2)
                    });
                }
                catch { }
            }
        }
        catch { }

        return processes.OrderByDescending(p => p.MemoryMb).ToList();
    }

    private List<ServiceInfo> CollectServices()
    {
        var services = new List<ServiceInfo>();

        try
        {
            foreach (var svc in ServiceController.GetServices().Take(100))
            {
                try
                {
                    string startType = "Unknown";

                    // Get start type from WMI
                    try
                    {
                        using var searcher = new ManagementObjectSearcher($"SELECT StartMode FROM Win32_Service WHERE Name = '{svc.ServiceName}'");
                        foreach (var obj in searcher.Get())
                        {
                            startType = obj["StartMode"]?.ToString() ?? "Unknown";
                            break;
                        }
                    }
                    catch { }

                    services.Add(new ServiceInfo
                    {
                        Name = svc.ServiceName,
                        DisplayName = svc.DisplayName,
                        Status = svc.Status.ToString(),
                        StartType = startType
                    });
                }
                catch { }
            }
        }
        catch { }

        return services;
    }

    private List<NetworkAdapterInfo> CollectNetworkAdapters()
    {
        var adapters = new List<NetworkAdapterInfo>();

        try
        {
            foreach (var nic in NetworkInterface.GetAllNetworkInterfaces())
            {
                if (nic.NetworkInterfaceType == NetworkInterfaceType.Loopback) continue;

                var ipProps = nic.GetIPProperties();
                var ipAddress = ipProps.UnicastAddresses
                    .FirstOrDefault(a => a.Address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork);

                adapters.Add(new NetworkAdapterInfo
                {
                    Name = nic.Name,
                    IpAddress = ipAddress?.Address.ToString() ?? "",
                    MacAddress = nic.GetPhysicalAddress().ToString(),
                    Status = nic.OperationalStatus.ToString()
                });
            }
        }
        catch { }

        return adapters;
    }

    private List<SoftwareInfo> CollectInstalledSoftware()
    {
        var software = new List<SoftwareInfo>();
        var keys = new[]
        {
            @"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
            @"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"
        };

        try
        {
            foreach (var keyPath in keys)
            {
                using var key = Registry.LocalMachine.OpenSubKey(keyPath);
                if (key == null) continue;

                foreach (var subKeyName in key.GetSubKeyNames())
                {
                    try
                    {
                        using var subKey = key.OpenSubKey(subKeyName);
                        var name = subKey?.GetValue("DisplayName")?.ToString();
                        if (string.IsNullOrEmpty(name)) continue;

                        software.Add(new SoftwareInfo
                        {
                            Name = name,
                            Version = subKey?.GetValue("DisplayVersion")?.ToString() ?? "",
                            Publisher = subKey?.GetValue("Publisher")?.ToString() ?? "",
                            InstallDate = subKey?.GetValue("InstallDate")?.ToString()
                        });
                    }
                    catch { }
                }
            }
        }
        catch { }

        return software.DistinctBy(s => s.Name).OrderBy(s => s.Name).ToList();
    }

    private List<StartupProgramInfo> CollectStartupPrograms()
    {
        var programs = new List<StartupProgramInfo>();
        
        // Registry Run keys for startup programs
        var runKeys = new[]
        {
            (@"SOFTWARE\Microsoft\Windows\CurrentVersion\Run", "HKLM"),
            (@"SOFTWARE\Microsoft\Windows\CurrentVersion\Run", "HKCU"),
            (@"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Run", "HKLM"),
            (@"SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce", "HKLM"),
        };

        try
        {
            foreach (var (keyPath, root) in runKeys)
            {
                RegistryKey? baseKey = root == "HKLM" ? Registry.LocalMachine : Registry.CurrentUser;
                using var key = baseKey.OpenSubKey(keyPath);
                if (key == null) continue;

                foreach (var valueName in key.GetValueNames())
                {
                    try
                    {
                        var command = key.GetValue(valueName)?.ToString() ?? "";
                        if (string.IsNullOrEmpty(valueName) || string.IsNullOrEmpty(command)) continue;

                        programs.Add(new StartupProgramInfo
                        {
                            Name = valueName,
                            Command = command,
                            Location = $"{root}\\{keyPath}",
                            Enabled = true,
                            StartupType = "Registry"
                        });
                    }
                    catch { }
                }
            }
        }
        catch { }

        // Also check Task Scheduler for startup tasks
        try
        {
            using var searcher = new ManagementObjectSearcher(
                "SELECT Name, State, Command FROM Win32_ScheduledJob");
            // Note: Win32_ScheduledJob might not list all tasks, but catches some
        }
        catch { }

        return programs.DistinctBy(p => p.Name).OrderBy(p => p.Name).ToList();
    }

    private List<LocalUserInfo> CollectLocalUsers()
    {
        var users = new List<LocalUserInfo>();

        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_UserAccount WHERE LocalAccount=True");
            foreach (var obj in searcher.Get())
            {
                try
                {
                    var userName = obj["Name"]?.ToString() ?? "";
                    var sid = obj["SID"]?.ToString();
                    var disabled = Convert.ToBoolean(obj["Disabled"]);
                    var fullName = obj["FullName"]?.ToString();
                    var description = obj["Description"]?.ToString();
                    var domain = obj["Domain"]?.ToString() ?? Environment.MachineName;

                    // Collect all group memberships for this user
                    var groups = new List<string>();
                    bool isAdmin = false;
                    try
                    {
                        // Query all groups this user belongs to
                        using var groupSearcher = new ManagementObjectSearcher(
                            $"ASSOCIATORS OF {{Win32_UserAccount.Domain='{domain}',Name='{userName}'}} WHERE AssocClass=Win32_GroupUser ResultRole=GroupComponent");
                        foreach (var group in groupSearcher.Get())
                        {
                            var groupName = group["Name"]?.ToString() ?? "";
                            if (!string.IsNullOrEmpty(groupName))
                            {
                                groups.Add(groupName);
                                if (groupName.Equals("Administrators", StringComparison.OrdinalIgnoreCase))
                                {
                                    isAdmin = true;
                                }
                            }
                        }
                    }
                    catch 
                    {
                        // Fallback: check directly if user is in Administrators group
                        try
                        {
                            using var adminSearcher = new ManagementObjectSearcher(
                                $"SELECT * FROM Win32_GroupUser WHERE GroupComponent=\"Win32_Group.Domain='{Environment.MachineName}',Name='Administrators'\"");
                            foreach (var groupMember in adminSearcher.Get())
                            {
                                var partComponent = groupMember["PartComponent"]?.ToString() ?? "";
                                if (partComponent.Contains($"Name=\"{userName}\"", StringComparison.OrdinalIgnoreCase))
                                {
                                    isAdmin = true;
                                    groups.Add("Administrators");
                                    break;
                                }
                            }
                        }
                        catch { }
                    }

                    users.Add(new LocalUserInfo
                    {
                        Name = userName,
                        FullName = fullName,
                        Description = description,
                        Enabled = !disabled,
                        IsAdmin = isAdmin,
                        IsLocal = true,
                        Sid = sid,
                        Groups = groups.Count > 0 ? groups : null
                    });
                }
                catch { }
            }
        }
        catch { }

        return users.OrderBy(u => u.Name).ToList();
    }

    private List<NetworkConnectionInfo> CollectNetworkConnections()
    {
        var connections = new List<NetworkConnectionInfo>();

        try
        {
            // Use netstat-like approach via WMI or IPGlobalProperties
            var ipProps = System.Net.NetworkInformation.IPGlobalProperties.GetIPGlobalProperties();
            
            // Get active TCP connections
            foreach (var conn in ipProps.GetActiveTcpConnections())
            {
                try
                {
                    // Try to get process name
                    string? processName = null;
                    int? processId = null;

                    // Get process ID via netstat parsing or P/Invoke would be more accurate
                    // For now, we'll use what's available

                    connections.Add(new NetworkConnectionInfo
                    {
                        LocalAddress = conn.LocalEndPoint.Address.ToString(),
                        LocalPort = conn.LocalEndPoint.Port,
                        RemoteAddress = conn.RemoteEndPoint.Address.ToString(),
                        RemotePort = conn.RemoteEndPoint.Port,
                        State = conn.State.ToString(),
                        Protocol = "TCP",
                        ProcessName = processName,
                        ProcessId = processId
                    });
                }
                catch { }
            }

            // Get TCP listeners
            foreach (var listener in ipProps.GetActiveTcpListeners())
            {
                connections.Add(new NetworkConnectionInfo
                {
                    LocalAddress = listener.Address.ToString(),
                    LocalPort = listener.Port,
                    RemoteAddress = "*",
                    RemotePort = 0,
                    State = "Listening",
                    Protocol = "TCP"
                });
            }

            // Get UDP listeners
            foreach (var listener in ipProps.GetActiveUdpListeners())
            {
                connections.Add(new NetworkConnectionInfo
                {
                    LocalAddress = listener.Address.ToString(),
                    LocalPort = listener.Port,
                    RemoteAddress = "*",
                    RemotePort = 0,
                    State = "Listening",
                    Protocol = "UDP"
                });
            }
        }
        catch { }

        // Limit to 200 connections to avoid huge payloads
        return connections.Take(200).ToList();
    }
}

// Security Telemetry for Windows Defender integration
public class SecurityTelemetry
{
    [Newtonsoft.Json.JsonProperty("defender_status")]
    public DefenderStatus? DefenderStatus { get; set; }

    [Newtonsoft.Json.JsonProperty("recent_threats")]
    public List<ThreatDetection>? RecentThreats { get; set; }

    [Newtonsoft.Json.JsonProperty("quarantined_items")]
    public List<QuarantinedItem>? QuarantinedItems { get; set; }

    [Newtonsoft.Json.JsonProperty("error")]
    public string? Error { get; set; }

    [Newtonsoft.Json.JsonProperty("timestamp")]
    public string Timestamp { get; set; } = DateTime.UtcNow.ToString("O");
}
