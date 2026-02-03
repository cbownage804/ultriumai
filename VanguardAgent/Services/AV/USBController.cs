// =============================================================================
// USB/Removable Media Controller
// =============================================================================
// Block, scan, or whitelist USB devices and auto-run prevention
// Monitors device connections and enforces security policies

using System.Management;
using Microsoft.Win32;

namespace VanguardAgent.Services.AV;

public class USBController : IDisposable
{
    private readonly ConfigService _configService;
    private readonly ApiClient _apiClient;
    private readonly RealTimeScanner _scanner;
    private ManagementEventWatcher? _insertWatcher;
    private ManagementEventWatcher? _removeWatcher;
    
    private readonly Dictionary<string, USBDevice> _connectedDevices = new();
    private readonly HashSet<string> _whitelistedDevices = new();
    private readonly HashSet<string> _blockedDevices = new();
    
    private bool _isRunning;
    private USBPolicy _currentPolicy = USBPolicy.ScanAndAllow;

    // Statistics
    private long _devicesConnected;
    private long _devicesBlocked;
    private long _threatsStopped;

    public event EventHandler<USBEventArgs>? OnDeviceConnected;
    public event EventHandler<USBEventArgs>? OnDeviceBlocked;
    public event EventHandler<USBThreatEventArgs>? OnThreatDetected;

    public USBController(
        ConfigService configService,
        ApiClient apiClient,
        RealTimeScanner scanner)
    {
        _configService = configService;
        _apiClient = apiClient;
        _scanner = scanner;
    }

    public async Task StartAsync()
    {
        if (_isRunning) return;
        _isRunning = true;

        Console.WriteLine("[USB Controller] Starting USB monitoring...");

        // Load policy and whitelists
        await LoadPolicyAsync();
        await LoadWhitelistsAsync();

        // Disable AutoRun globally
        DisableAutoRun();

        // Start WMI event watchers
        StartDeviceWatchers();

        // Enumerate existing devices
        EnumerateExistingDevices();

        Console.WriteLine($"[USB Controller] Policy: {_currentPolicy}, Whitelisted: {_whitelistedDevices.Count}");
    }

    public void Stop()
    {
        _isRunning = false;
        _insertWatcher?.Stop();
        _removeWatcher?.Stop();
        Console.WriteLine("[USB Controller] Stopped");
    }

    private async Task LoadPolicyAsync()
    {
        try
        {
            var response = await _apiClient.GetUSBPolicyAsync();
            if (response != null)
            {
                _currentPolicy = response.Policy;
            }
        }
        catch { }
    }

    private async Task LoadWhitelistsAsync()
    {
        try
        {
            var response = await _apiClient.GetUSBWhitelistAsync();
            if (response?.Devices != null)
            {
                foreach (var device in response.Devices)
                {
                    _whitelistedDevices.Add(device.DeviceId);
                }
            }
        }
        catch { }
    }

    private void DisableAutoRun()
    {
        try
        {
            // Disable AutoRun for all drive types
            using var key = Registry.LocalMachine.OpenSubKey(
                @"SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer", true);
            
            if (key != null)
            {
                // NoDriveTypeAutoRun = 0xFF disables all
                key.SetValue("NoDriveTypeAutoRun", 0xFF, RegistryValueKind.DWord);
                key.SetValue("NoAutorun", 1, RegistryValueKind.DWord);
            }

            // Also set per-user
            using var userKey = Registry.CurrentUser.OpenSubKey(
                @"SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer", true);
            
            if (userKey != null)
            {
                userKey.SetValue("NoDriveTypeAutoRun", 0xFF, RegistryValueKind.DWord);
            }

            Console.WriteLine("[USB Controller] AutoRun disabled");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[USB Controller] Failed to disable AutoRun: {ex.Message}");
        }
    }

    private void StartDeviceWatchers()
    {
        try
        {
            // Watch for USB device insertion
            var insertQuery = new WqlEventQuery(
                "SELECT * FROM __InstanceCreationEvent WITHIN 2 " +
                "WHERE TargetInstance ISA 'Win32_USBControllerDevice'");
            
            _insertWatcher = new ManagementEventWatcher(insertQuery);
            _insertWatcher.EventArrived += OnDeviceInserted;
            _insertWatcher.Start();

            // Watch for USB device removal
            var removeQuery = new WqlEventQuery(
                "SELECT * FROM __InstanceDeletionEvent WITHIN 2 " +
                "WHERE TargetInstance ISA 'Win32_USBControllerDevice'");
            
            _removeWatcher = new ManagementEventWatcher(removeQuery);
            _removeWatcher.EventArrived += OnDeviceRemoved;
            _removeWatcher.Start();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[USB Controller] Failed to start watchers: {ex.Message}");
        }
    }

    private void EnumerateExistingDevices()
    {
        try
        {
            using var searcher = new ManagementObjectSearcher(
                "SELECT * FROM Win32_DiskDrive WHERE InterfaceType='USB'");
            
            foreach (ManagementObject drive in searcher.Get())
            {
                var device = CreateDeviceFromWMI(drive);
                if (device != null)
                {
                    _connectedDevices[device.DeviceId] = device;
                }
            }

            Console.WriteLine($"[USB Controller] Found {_connectedDevices.Count} existing USB storage devices");
        }
        catch { }
    }

    private async void OnDeviceInserted(object sender, EventArrivedEventArgs e)
    {
        try
        {
            await Task.Delay(1000); // Wait for device to initialize

            var usbDevices = GetNewlyConnectedDevices();
            foreach (var device in usbDevices)
            {
                await HandleDeviceConnectionAsync(device);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[USB Controller] Error handling device insertion: {ex.Message}");
        }
    }

    private void OnDeviceRemoved(object sender, EventArrivedEventArgs e)
    {
        try
        {
            // Find which device was removed
            var currentDevices = new HashSet<string>();
            using var searcher = new ManagementObjectSearcher(
                "SELECT * FROM Win32_DiskDrive WHERE InterfaceType='USB'");
            
            foreach (ManagementObject drive in searcher.Get())
            {
                var deviceId = drive["DeviceID"]?.ToString();
                if (!string.IsNullOrEmpty(deviceId))
                {
                    currentDevices.Add(deviceId);
                }
            }

            var removedDevices = _connectedDevices.Keys.Except(currentDevices).ToList();
            foreach (var deviceId in removedDevices)
            {
                if (_connectedDevices.TryGetValue(deviceId, out var device))
                {
                    Console.WriteLine($"[USB Controller] Device removed: {device.FriendlyName}");
                    _connectedDevices.Remove(deviceId);
                }
            }
        }
        catch { }
    }

    private List<USBDevice> GetNewlyConnectedDevices()
    {
        var newDevices = new List<USBDevice>();

        try
        {
            using var searcher = new ManagementObjectSearcher(
                "SELECT * FROM Win32_DiskDrive WHERE InterfaceType='USB'");
            
            foreach (ManagementObject drive in searcher.Get())
            {
                var device = CreateDeviceFromWMI(drive);
                if (device != null && !_connectedDevices.ContainsKey(device.DeviceId))
                {
                    newDevices.Add(device);
                }
            }
        }
        catch { }

        return newDevices;
    }

    private USBDevice? CreateDeviceFromWMI(ManagementObject drive)
    {
        try
        {
            var deviceId = drive["DeviceID"]?.ToString() ?? "";
            var pnpDeviceId = drive["PNPDeviceID"]?.ToString() ?? "";
            
            // Parse VID/PID from PnP Device ID
            var vidMatch = System.Text.RegularExpressions.Regex.Match(pnpDeviceId, @"VID_([0-9A-F]{4})", 
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            var pidMatch = System.Text.RegularExpressions.Regex.Match(pnpDeviceId, @"PID_([0-9A-F]{4})", 
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            var serialMatch = System.Text.RegularExpressions.Regex.Match(pnpDeviceId, @"\\([^\\]+)$");

            var device = new USBDevice
            {
                DeviceId = deviceId,
                PnPDeviceId = pnpDeviceId,
                FriendlyName = drive["Caption"]?.ToString() ?? "Unknown USB Device",
                Manufacturer = drive["Manufacturer"]?.ToString(),
                Model = drive["Model"]?.ToString(),
                SerialNumber = serialMatch.Success ? serialMatch.Groups[1].Value : null,
                VendorId = vidMatch.Success ? vidMatch.Groups[1].Value : null,
                ProductId = pidMatch.Success ? pidMatch.Groups[1].Value : null,
                Size = Convert.ToInt64(drive["Size"] ?? 0),
                ConnectedAt = DateTime.UtcNow
            };

            // Get drive letter
            device.DriveLetter = GetDriveLetter(deviceId);

            return device;
        }
        catch
        {
            return null;
        }
    }

    private string? GetDriveLetter(string deviceId)
    {
        try
        {
            // Query partitions for this disk
            using var partitions = new ManagementObjectSearcher(
                $"ASSOCIATORS OF {{Win32_DiskDrive.DeviceID='{deviceId.Replace("\\", "\\\\")}'}} " +
                "WHERE AssocClass=Win32_DiskDriveToDiskPartition");
            
            foreach (ManagementObject partition in partitions.Get())
            {
                // Query logical disks for this partition
                using var logicalDisks = new ManagementObjectSearcher(
                    $"ASSOCIATORS OF {{Win32_DiskPartition.DeviceID='{partition["DeviceID"]}'}} " +
                    "WHERE AssocClass=Win32_LogicalDiskToPartition");
                
                foreach (ManagementObject disk in logicalDisks.Get())
                {
                    return disk["DeviceID"]?.ToString(); // Returns like "E:"
                }
            }
        }
        catch { }

        return null;
    }

    private async Task HandleDeviceConnectionAsync(USBDevice device)
    {
        Interlocked.Increment(ref _devicesConnected);
        _connectedDevices[device.DeviceId] = device;

        Console.WriteLine($"[USB Controller] Device connected: {device.FriendlyName} ({device.VendorId}:{device.ProductId})");

        OnDeviceConnected?.Invoke(this, new USBEventArgs { Device = device });

        // Apply policy
        switch (_currentPolicy)
        {
            case USBPolicy.BlockAll:
                await BlockDeviceAsync(device, "Policy: Block All USB");
                break;

            case USBPolicy.WhitelistOnly:
                if (!IsWhitelisted(device))
                {
                    await BlockDeviceAsync(device, "Device not whitelisted");
                }
                else
                {
                    await ScanDeviceAsync(device);
                }
                break;

            case USBPolicy.ScanAndAllow:
                var threats = await ScanDeviceAsync(device);
                if (threats.Count > 0)
                {
                    await HandleThreatsAsync(device, threats);
                }
                break;

            case USBPolicy.ReadOnly:
                await SetReadOnlyAsync(device);
                await ScanDeviceAsync(device);
                break;

            case USBPolicy.AllowAll:
                // Log only
                await _apiClient.LogUSBEventAsync(device, "connected");
                break;
        }
    }

    private bool IsWhitelisted(USBDevice device)
    {
        // Check by device ID
        if (_whitelistedDevices.Contains(device.DeviceId))
            return true;

        // Check by VID:PID combination
        if (!string.IsNullOrEmpty(device.VendorId) && !string.IsNullOrEmpty(device.ProductId))
        {
            var vidPid = $"{device.VendorId}:{device.ProductId}";
            if (_whitelistedDevices.Contains(vidPid))
                return true;
        }

        // Check by serial number
        if (!string.IsNullOrEmpty(device.SerialNumber))
        {
            if (_whitelistedDevices.Contains(device.SerialNumber))
                return true;
        }

        return false;
    }

    private async Task BlockDeviceAsync(USBDevice device, string reason)
    {
        Interlocked.Increment(ref _devicesBlocked);
        device.IsBlocked = true;
        device.BlockReason = reason;

        _blockedDevices.Add(device.DeviceId);

        Console.WriteLine($"[USB Controller] BLOCKED: {device.FriendlyName} - {reason}");

        // Eject the device
        await EjectDeviceAsync(device);

        OnDeviceBlocked?.Invoke(this, new USBEventArgs { Device = device });
        await _apiClient.LogUSBEventAsync(device, "blocked", reason);
    }

    private async Task<List<ScanResult>> ScanDeviceAsync(USBDevice device)
    {
        var threats = new List<ScanResult>();

        if (string.IsNullOrEmpty(device.DriveLetter))
        {
            Console.WriteLine($"[USB Controller] Cannot scan device without drive letter");
            return threats;
        }

        Console.WriteLine($"[USB Controller] Scanning {device.DriveLetter}...");

        try
        {
            // Scan root directory
            var results = await _scanner.ScanDirectoryAsync(device.DriveLetter + "\\", recursive: true);
            threats = results.Where(r => r.IsThreat).ToList();

            device.LastScanned = DateTime.UtcNow;
            device.ThreatsFound = threats.Count;

            if (threats.Count > 0)
            {
                Console.WriteLine($"[USB Controller] Found {threats.Count} threats on {device.FriendlyName}");
            }
            else
            {
                Console.WriteLine($"[USB Controller] Scan complete - no threats found");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[USB Controller] Scan failed: {ex.Message}");
        }

        return threats;
    }

    private async Task HandleThreatsAsync(USBDevice device, List<ScanResult> threats)
    {
        Interlocked.Increment(ref _threatsStopped);

        foreach (var threat in threats)
        {
            OnThreatDetected?.Invoke(this, new USBThreatEventArgs 
            { 
                Device = device, 
                Threat = threat 
            });

            // Quarantine the threat
            await _scanner.QuarantineFileAsync(threat.FilePath);
        }

        await _apiClient.LogUSBEventAsync(device, "threats_found", 
            $"Found {threats.Count} threats");
    }

    private async Task SetReadOnlyAsync(USBDevice device)
    {
        try
        {
            // Enable write protection via registry
            using var key = Registry.LocalMachine.CreateSubKey(
                @"SYSTEM\CurrentControlSet\Control\StorageDevicePolicies");
            
            if (key != null)
            {
                key.SetValue("WriteProtect", 1, RegistryValueKind.DWord);
            }

            Console.WriteLine($"[USB Controller] Set read-only: {device.FriendlyName}");
            device.IsReadOnly = true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[USB Controller] Failed to set read-only: {ex.Message}");
        }

        await Task.CompletedTask;
    }

    private async Task EjectDeviceAsync(USBDevice device)
    {
        try
        {
            if (!string.IsNullOrEmpty(device.DriveLetter))
            {
                // Use WMI to eject
                using var searcher = new ManagementObjectSearcher(
                    $"SELECT * FROM Win32_Volume WHERE DriveLetter='{device.DriveLetter}'");
                
                foreach (ManagementObject volume in searcher.Get())
                {
                    volume.InvokeMethod("Dismount", new object[] { false, false });
                }
            }

            Console.WriteLine($"[USB Controller] Ejected: {device.FriendlyName}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[USB Controller] Eject failed: {ex.Message}");
        }

        await Task.CompletedTask;
    }

    public void SetPolicy(USBPolicy policy)
    {
        _currentPolicy = policy;
        Console.WriteLine($"[USB Controller] Policy changed to: {policy}");
    }

    public void AddToWhitelist(string deviceIdentifier)
    {
        _whitelistedDevices.Add(deviceIdentifier);
        Console.WriteLine($"[USB Controller] Added to whitelist: {deviceIdentifier}");
    }

    public void RemoveFromWhitelist(string deviceIdentifier)
    {
        _whitelistedDevices.Remove(deviceIdentifier);
        Console.WriteLine($"[USB Controller] Removed from whitelist: {deviceIdentifier}");
    }

    public List<USBDevice> GetConnectedDevices()
    {
        return _connectedDevices.Values.ToList();
    }

    public USBControllerStats GetStats()
    {
        return new USBControllerStats
        {
            DevicesConnected = _devicesConnected,
            DevicesBlocked = _devicesBlocked,
            ThreatsStopped = _threatsStopped,
            CurrentlyConnected = _connectedDevices.Count,
            WhitelistedDevices = _whitelistedDevices.Count,
            CurrentPolicy = _currentPolicy
        };
    }

    public void Dispose()
    {
        Stop();
        _insertWatcher?.Dispose();
        _removeWatcher?.Dispose();
    }
}

// Supporting classes

public enum USBPolicy
{
    AllowAll,       // Log connections only
    ScanAndAllow,   // Scan for malware, allow if clean
    ReadOnly,       // Force read-only mode + scan
    WhitelistOnly,  // Only allow whitelisted devices
    BlockAll        // Block all USB storage devices
}

public class USBDevice
{
    public string DeviceId { get; set; } = "";
    public string PnPDeviceId { get; set; } = "";
    public string FriendlyName { get; set; } = "";
    public string? Manufacturer { get; set; }
    public string? Model { get; set; }
    public string? SerialNumber { get; set; }
    public string? VendorId { get; set; }
    public string? ProductId { get; set; }
    public string? DriveLetter { get; set; }
    public long Size { get; set; }
    public DateTime ConnectedAt { get; set; }
    public DateTime? LastScanned { get; set; }
    public int ThreatsFound { get; set; }
    public bool IsBlocked { get; set; }
    public string? BlockReason { get; set; }
    public bool IsReadOnly { get; set; }
}

public class USBControllerStats
{
    public long DevicesConnected { get; set; }
    public long DevicesBlocked { get; set; }
    public long ThreatsStopped { get; set; }
    public int CurrentlyConnected { get; set; }
    public int WhitelistedDevices { get; set; }
    public USBPolicy CurrentPolicy { get; set; }
}

public class USBEventArgs : EventArgs
{
    public USBDevice Device { get; set; } = new();
}

public class USBThreatEventArgs : EventArgs
{
    public USBDevice Device { get; set; } = new();
    public ScanResult Threat { get; set; } = new();
}
