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

    public TelemetryCollector(ConfigService configService)
    {
        _configService = configService;

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

    public DeviceInfo CollectDeviceInfo()
    {
        var info = new DeviceInfo
        {
            Hostname = Environment.MachineName,
            OsName = RuntimeInformation.OSDescription,
            OsVersion = Environment.OSVersion.VersionString,
            AgentVersion = "1.1.0"
        };

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

        // Get CPU info
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT Name FROM Win32_Processor");
            foreach (var obj in searcher.Get())
            {
                info.CpuInfo = obj["Name"]?.ToString() ?? "";
                break;
            }
        }
        catch { }

        // Get total memory
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT TotalPhysicalMemory FROM Win32_ComputerSystem");
            foreach (var obj in searcher.Get())
            {
                var bytes = Convert.ToInt64(obj["TotalPhysicalMemory"]);
                info.TotalMemoryGb = Math.Round(bytes / 1024.0 / 1024.0 / 1024.0, 2);
                break;
            }
        }
        catch { }

        return info;
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
        }

        if (features.CollectInstalledSoftware)
        {
            telemetry.InstalledSoftware = CollectInstalledSoftware();
        }

        return telemetry;
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
}
