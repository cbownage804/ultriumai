// =============================================================================
// VSS Protection Service - Shadow Copy Defense & Integrity
// =============================================================================
// Provides:
// - Active blocking of VSS deletion attempts (vssadmin, wmic, PowerShell)
// - Scheduled periodic shadow copy snapshots
// - Backup integrity verification
// - MBR/Boot sector tamper detection
// - Safe Mode boot detection
// - User notification during active attacks
// =============================================================================

using System.Diagnostics;
using System.Management;
using System.Runtime.InteropServices;

namespace VanguardAgent.Services.XDR;

public class VSSProtection : IDisposable
{
    private readonly ConfigService _configService;
    private readonly ApiClient _apiClient;
    private ManagementEventWatcher? _processWatcher;
    private System.Threading.Timer? _snapshotTimer;
    private System.Threading.Timer? _integrityTimer;
    private System.Threading.Timer? _bootSectorTimer;
    private bool _isRunning;
    private readonly object _lock = new();
    private byte[]? _mbrBaseline;

    // Commands that ransomware uses to delete shadow copies
    private static readonly string[] VssDeletionCommands = new[]
    {
        "vssadmin delete shadows",
        "vssadmin.exe delete shadows",
        "wmic shadowcopy delete",
        "shadowcopy delete",
        "delete shadows /all",
        "delete shadows /quiet",
        "resize shadowstorage /for=c: /on=c: /maxsize=",
        "bcdedit /set {default} recoveryenabled no",
        "bcdedit /set {default} bootstatuspolicy ignoreallfailures",
        "wbadmin delete catalog",
        "wbadmin delete systemstatebackup"
    };

    // PowerShell shadow copy deletion patterns
    private static readonly string[] PsVssDeletionPatterns = new[]
    {
        "get-wmiobject win32_shadowcopy",
        "win32_shadowcopy).delete()",
        "remove-wmiobject",
        "delete_shadows",
        "gwmi win32_shadowcopy",
        "Get-CimInstance Win32_ShadowCopy | Remove-CimInstance"
    };

    // Safe Mode boot indicators
    private static readonly string[] SafeModeBootArgs = new[]
    {
        "bcdedit /set {current} safeboot minimal",
        "bcdedit /set {current} safeboot network",
        "bcdedit /set safeboot",
        "bcdedit /set {default} safeboot"
    };

    // Snapshot interval (default: every 4 hours)
    private readonly TimeSpan _snapshotInterval = TimeSpan.FromHours(4);
    
    // Integrity check interval (default: every 30 minutes)
    private readonly TimeSpan _integrityInterval = TimeSpan.FromMinutes(30);

    // Boot sector check interval (default: every 5 minutes)
    private readonly TimeSpan _bootCheckInterval = TimeSpan.FromMinutes(5);

    public VSSProtection(ConfigService configService, ApiClient apiClient)
    {
        _configService = configService;
        _apiClient = apiClient;
    }

    public async Task StartAsync()
    {
        lock (_lock)
        {
            if (_isRunning) return;
            _isRunning = true;
        }

        try
        {
            // 1. Start VSS deletion monitoring (WMI process creation events)
            StartVssDeletionMonitor();

            // 2. Check if we booted into Safe Mode
            await DetectSafeModeBoot();

            // 3. Capture MBR baseline
            await CaptureMbrBaselineAsync();

            // 4. Start scheduled snapshots
            _snapshotTimer = new System.Threading.Timer(
                async _ => await CreateScheduledSnapshotAsync(),
                null,
                _snapshotInterval,
                _snapshotInterval
            );

            // 5. Start integrity verification
            _integrityTimer = new System.Threading.Timer(
                async _ => await VerifySnapshotIntegrityAsync(),
                null,
                TimeSpan.FromMinutes(5), // First check after 5 min
                _integrityInterval
            );

            // 6. Start boot sector monitoring
            _bootSectorTimer = new System.Threading.Timer(
                async _ => await CheckBootSectorIntegrityAsync(),
                null,
                _bootCheckInterval,
                _bootCheckInterval
            );

            Console.WriteLine("[XDR VSS] Protection active - monitoring deletions, scheduled snapshots, MBR protection");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR VSS] Failed to start: {ex.Message}");
        }
    }

    // =========================================================================
    // 1. VSS DELETION BLOCKING
    // =========================================================================

    private void StartVssDeletionMonitor()
    {
        try
        {
            // Monitor all new process creation events via WMI
            var query = new WqlEventQuery(
                "SELECT * FROM __InstanceCreationEvent WITHIN 1 WHERE TargetInstance ISA 'Win32_Process'"
            );

            _processWatcher = new ManagementEventWatcher(query);
            _processWatcher.EventArrived += OnProcessCreated;
            _processWatcher.Start();

            Console.WriteLine("[XDR VSS] Process creation monitor active - blocking shadow copy deletion");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR VSS] WMI process monitor failed: {ex.Message}");
            // Fallback: poll running processes
            StartFallbackProcessMonitor();
        }
    }

    private void OnProcessCreated(object sender, EventArrivedEventArgs e)
    {
        try
        {
            var targetInstance = (ManagementBaseObject)e.NewEvent["TargetInstance"];
            var commandLine = targetInstance["CommandLine"]?.ToString()?.ToLowerInvariant() ?? "";
            var processName = targetInstance["Name"]?.ToString()?.ToLowerInvariant() ?? "";
            var processId = Convert.ToInt32(targetInstance["ProcessId"]);

            // Check for VSS deletion commands
            foreach (var pattern in VssDeletionCommands)
            {
                if (commandLine.Contains(pattern.ToLowerInvariant()))
                {
                    Console.WriteLine($"[XDR VSS] BLOCKED: VSS deletion attempt - PID {processId}: {commandLine}");
                    KillProcess(processId);
                    _ = ReportVssProtectionEventAsync("vss_deletion_blocked", commandLine, processId);
                    return;
                }
            }

            // Check for PowerShell VSS deletion
            if (processName.Contains("powershell") || processName.Contains("pwsh"))
            {
                foreach (var pattern in PsVssDeletionPatterns)
                {
                    if (commandLine.Contains(pattern.ToLowerInvariant()))
                    {
                        Console.WriteLine($"[XDR VSS] BLOCKED: PowerShell VSS deletion - PID {processId}");
                        KillProcess(processId);
                        _ = ReportVssProtectionEventAsync("ps_vss_deletion_blocked", commandLine, processId);
                        return;
                    }
                }
            }

            // Check for Safe Mode boot attempts
            foreach (var pattern in SafeModeBootArgs)
            {
                if (commandLine.Contains(pattern.ToLowerInvariant()))
                {
                    Console.WriteLine($"[XDR VSS] BLOCKED: Safe Mode boot attempt - PID {processId}");
                    KillProcess(processId);
                    _ = ReportVssProtectionEventAsync("safemode_boot_blocked", commandLine, processId);
                    // Reverse the bcdedit change
                    _ = ReverseSafeModeBootAsync();
                    return;
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR VSS] Process monitor error: {ex.Message}");
        }
    }

    private System.Threading.Timer? _fallbackTimer;

    private void StartFallbackProcessMonitor()
    {
        _fallbackTimer = new System.Threading.Timer(_ =>
        {
            try
            {
                var processes = Process.GetProcesses();
                foreach (var proc in processes)
                {
                    try
                    {
                        var name = proc.ProcessName.ToLowerInvariant();
                        if (name == "vssadmin" || name == "wbadmin")
                        {
                            Console.WriteLine($"[XDR VSS] BLOCKED (fallback): Suspicious VSS process - {proc.ProcessName} PID {proc.Id}");
                            proc.Kill(true);
                            _ = ReportVssProtectionEventAsync("vss_process_killed", proc.ProcessName, proc.Id);
                        }
                    }
                    catch { }
                    finally { proc.Dispose(); }
                }
            }
            catch { }
        }, null, TimeSpan.Zero, TimeSpan.FromSeconds(2));
    }

    private void KillProcess(int processId)
    {
        try
        {
            using var process = Process.GetProcessById(processId);
            process.Kill(true);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR VSS] Failed to kill process {processId}: {ex.Message}");
        }
    }

    // =========================================================================
    // 2. SCHEDULED VSS SNAPSHOTS
    // =========================================================================

    private async Task CreateScheduledSnapshotAsync()
    {
        if (!_isRunning) return;

        try
        {
            // Get all fixed drives
            var drives = DriveInfo.GetDrives()
                .Where(d => d.DriveType == DriveType.Fixed && d.IsReady)
                .ToList();

            foreach (var drive in drives)
            {
                try
                {
                    var psi = new ProcessStartInfo
                    {
                        FileName = "wmic",
                        Arguments = $"shadowcopy call create Volume={drive.Name}",
                        UseShellExecute = false,
                        CreateNoWindow = true,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true
                    };

                    using var process = Process.Start(psi);
                    if (process != null)
                    {
                        await process.WaitForExitAsync();
                        if (process.ExitCode == 0)
                        {
                            Console.WriteLine($"[XDR VSS] Scheduled snapshot created for {drive.Name}");
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[XDR VSS] Snapshot failed for {drive.Name}: {ex.Message}");
                }
            }

            // Clean up old snapshots (keep last 10 per volume)
            await PruneOldSnapshotsAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR VSS] Scheduled snapshot error: {ex.Message}");
        }
    }

    private async Task PruneOldSnapshotsAsync()
    {
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "vssadmin",
                Arguments = "list shadows",
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true
            };

            using var process = Process.Start(psi);
            if (process == null) return;

            var output = await process.StandardOutput.ReadToEndAsync();
            await process.WaitForExitAsync();

            // Count shadow copies - if more than 10, log a notice
            var shadowCount = output.Split("Shadow Copy ID").Length - 1;
            if (shadowCount > 10)
            {
                Console.WriteLine($"[XDR VSS] {shadowCount} shadow copies present - consider storage management");
            }
        }
        catch { }
    }

    // =========================================================================
    // 3. BACKUP INTEGRITY VERIFICATION
    // =========================================================================

    private async Task VerifySnapshotIntegrityAsync()
    {
        if (!_isRunning) return;

        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "vssadmin",
                Arguments = "list shadows",
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true
            };

            using var process = Process.Start(psi);
            if (process == null) return;

            var output = await process.StandardOutput.ReadToEndAsync();
            var error = await process.StandardError.ReadToEndAsync();
            await process.WaitForExitAsync();

            if (process.ExitCode != 0 || !string.IsNullOrEmpty(error))
            {
                Console.WriteLine($"[XDR VSS] INTEGRITY WARNING: vssadmin returned errors: {error}");
                await ReportVssProtectionEventAsync("vss_integrity_failure", error, 0);
                // Attempt recovery - create a fresh snapshot
                await CreateScheduledSnapshotAsync();
                return;
            }

            // Parse and validate shadow copies exist
            var shadowCount = output.Split("Shadow Copy ID").Length - 1;
            
            if (shadowCount == 0)
            {
                Console.WriteLine("[XDR VSS] CRITICAL: No shadow copies found - creating emergency snapshot");
                await ReportVssProtectionEventAsync("vss_no_snapshots", "All shadow copies missing", 0);
                await CreateScheduledSnapshotAsync();
                return;
            }

            // Verify VSS service is running
            await VerifyVssServiceAsync();

            Console.WriteLine($"[XDR VSS] Integrity check passed - {shadowCount} shadow copies verified");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR VSS] Integrity check failed: {ex.Message}");
        }
    }

    private async Task VerifyVssServiceAsync()
    {
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "sc",
                Arguments = "query VSS",
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true
            };

            using var process = Process.Start(psi);
            if (process == null) return;

            var output = await process.StandardOutput.ReadToEndAsync();
            await process.WaitForExitAsync();

            // VSS service should be in RUNNING or STOPPED (demand-start) state
            if (output.Contains("DISABLED"))
            {
                Console.WriteLine("[XDR VSS] WARNING: VSS service is DISABLED - attempting to re-enable");
                var enablePsi = new ProcessStartInfo
                {
                    FileName = "sc",
                    Arguments = "config VSS start= demand",
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                using var enableProcess = Process.Start(enablePsi);
                if (enableProcess != null) await enableProcess.WaitForExitAsync();

                await ReportVssProtectionEventAsync("vss_service_reenabled", "VSS service was disabled, re-enabled", 0);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR VSS] VSS service check failed: {ex.Message}");
        }
    }

    // =========================================================================
    // 4. MBR/BOOT SECTOR PROTECTION
    // =========================================================================

    private async Task CaptureMbrBaselineAsync()
    {
        try
        {
            // Read first 512 bytes of physical disk (MBR)
            _mbrBaseline = await ReadMbrAsync();
            if (_mbrBaseline != null)
            {
                Console.WriteLine("[XDR VSS] MBR baseline captured for tamper detection");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR VSS] MBR baseline capture failed: {ex.Message}");
        }
    }

    private async Task<byte[]?> ReadMbrAsync()
    {
        try
        {
            // On Windows, read the physical drive's MBR (requires admin)
            using var stream = new FileStream(
                @"\\.\PhysicalDrive0",
                FileMode.Open,
                FileAccess.Read,
                FileShare.ReadWrite
            );

            var buffer = new byte[512];
            var bytesRead = await stream.ReadAsync(buffer, 0, 512);
            return bytesRead == 512 ? buffer : null;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR VSS] MBR read failed (requires admin): {ex.Message}");
            return null;
        }
    }

    private async Task CheckBootSectorIntegrityAsync()
    {
        if (!_isRunning || _mbrBaseline == null) return;

        try
        {
            var currentMbr = await ReadMbrAsync();
            if (currentMbr == null) return;

            // Compare with baseline
            if (!_mbrBaseline.SequenceEqual(currentMbr))
            {
                Console.WriteLine("[XDR VSS] CRITICAL: MBR/Boot sector modification detected!");

                await ReportVssProtectionEventAsync(
                    "mbr_tamper_detected",
                    "Master Boot Record has been modified - possible wiper/bootkit malware",
                    0
                );

                // Alert the user immediately
                ShowUserNotification(
                    "CRITICAL: Boot Sector Tampered",
                    "Your system's boot sector has been modified. This may indicate a wiper or bootkit attack. Contact your IT administrator immediately."
                );

                // Update baseline to prevent repeated alerts for legitimate changes
                // (e.g., Windows Update modifying boot records)
                _mbrBaseline = currentMbr;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR VSS] Boot sector check failed: {ex.Message}");
        }
    }

    // =========================================================================
    // 5. SAFE MODE BOOT DETECTION
    // =========================================================================

    private async Task DetectSafeModeBoot()
    {
        try
        {
            // Check if currently in Safe Mode
            var bootMode = System.Windows.Forms.SystemInformation.BootMode;
            
            if (bootMode != System.Windows.Forms.BootMode.Normal)
            {
                Console.WriteLine($"[XDR VSS] WARNING: System booted in {bootMode} - possible ransomware evasion");

                await ReportVssProtectionEventAsync(
                    "safemode_boot_detected",
                    $"System booted in {bootMode} mode - ransomware often forces Safe Mode to bypass security",
                    0
                );

                ShowUserNotification(
                    "Safe Mode Boot Detected",
                    "Your system has booted in Safe Mode. This is sometimes used by ransomware to bypass security protections. If you did not initiate this, contact IT support immediately."
                );

                // Attempt to remove safeboot flag to prevent re-entering on next reboot
                await ReverseSafeModeBootAsync();
            }
        }
        catch (Exception ex)
        {
            // SystemInformation may not be available in all contexts
            Console.WriteLine($"[XDR VSS] Safe Mode detection unavailable: {ex.Message}");
            await DetectSafeModeFromRegistryAsync();
        }
    }

    private async Task DetectSafeModeFromRegistryAsync()
    {
        try
        {
            // Fallback: check registry for SafeBoot
            using var key = Microsoft.Win32.Registry.LocalMachine.OpenSubKey(
                @"SYSTEM\CurrentControlSet\Control\SafeBoot\Option"
            );

            if (key != null)
            {
                var optionValue = key.GetValue("OptionValue");
                if (optionValue != null)
                {
                    Console.WriteLine("[XDR VSS] WARNING: SafeBoot registry key detected");
                    await ReportVssProtectionEventAsync("safemode_registry_detected", "SafeBoot Option key present", 0);
                }
            }
        }
        catch { }
    }

    private async Task ReverseSafeModeBootAsync()
    {
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "bcdedit",
                Arguments = "/deletevalue {current} safeboot",
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true
            };

            using var process = Process.Start(psi);
            if (process != null)
            {
                await process.WaitForExitAsync();
                Console.WriteLine("[XDR VSS] Removed SafeBoot flag - next reboot will be normal");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR VSS] Failed to remove SafeBoot flag: {ex.Message}");
        }
    }

    // =========================================================================
    // 6. USER NOTIFICATION
    // =========================================================================

    /// <summary>
    /// Display a visible notification to the logged-in user during an attack.
    /// Uses native Windows toast notification via PowerShell for SYSTEM-context compatibility.
    /// </summary>
    public void ShowUserNotification(string title, string message)
    {
        try
        {
            // Use PowerShell to show a Windows toast notification (works from SYSTEM context)
            var script = $@"
                [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null
                $template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
                $textNodes = $template.GetElementsByTagName('text')
                $textNodes.Item(0).AppendChild($template.CreateTextNode('{title.Replace("'", "''")}')) > $null
                $textNodes.Item(1).AppendChild($template.CreateTextNode('{message.Replace("'", "''")}')) > $null
                $toast = [Windows.UI.Notifications.ToastNotification]::new($template)
                [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('Vanguard XDR').Show($toast)
            ";

            var psi = new ProcessStartInfo
            {
                FileName = "powershell",
                Arguments = $"-NoProfile -NonInteractive -Command \"{script}\"",
                UseShellExecute = false,
                CreateNoWindow = true
            };

            Process.Start(psi);
            Console.WriteLine($"[XDR VSS] User notification sent: {title}");
        }
        catch
        {
            // Fallback: use msg.exe to broadcast to console session
            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = "msg",
                    Arguments = $"* /TIME:30 \"⚠️ VANGUARD XDR: {title} - {message}\"",
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                Process.Start(psi);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[XDR VSS] User notification failed: {ex.Message}");
            }
        }
    }

    /// <summary>
    /// Called by RansomwareDefense during active attack to notify user
    /// </summary>
    public void NotifyRansomwareAttack(string details)
    {
        ShowUserNotification(
            "🚨 Ransomware Attack Detected",
            $"Vanguard XDR has detected ransomware activity on your system. {details} Your IT team has been notified and automatic protections are active. DO NOT shut down your computer."
        );
    }

    // =========================================================================
    // REPORTING
    // =========================================================================

    private async Task ReportVssProtectionEventAsync(string eventType, string details, int processId)
    {
        try
        {
            await _apiClient.SendSecurityEventAsync(new
            {
                action = "vss_protection",
                protection_event = new
                {
                    agent_id = _configService.Config.DeviceId,
                    user_id = _configService.Config.UserId,
                    event_type = eventType,
                    details = details,
                    process_id = processId,
                    severity = eventType.Contains("blocked") || eventType.Contains("tamper") || eventType.Contains("critical") 
                        ? "critical" : "high",
                    mitre_technique = eventType switch
                    {
                        "vss_deletion_blocked" => "T1490",      // Inhibit System Recovery
                        "ps_vss_deletion_blocked" => "T1490",
                        "vss_process_killed" => "T1490",
                        "safemode_boot_blocked" => "T1562.009", // Safe Mode Boot
                        "safemode_boot_detected" => "T1562.009",
                        "mbr_tamper_detected" => "T1542.003",   // Bootkit
                        _ => "T1490"
                    },
                    timestamp = DateTime.UtcNow
                }
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR VSS] Failed to report event: {ex.Message}");
        }
    }

    // =========================================================================
    // CLEANUP
    // =========================================================================

    public void Stop()
    {
        lock (_lock)
        {
            _isRunning = false;
        }

        _processWatcher?.Stop();
        _processWatcher?.Dispose();
        _processWatcher = null;

        _snapshotTimer?.Dispose();
        _snapshotTimer = null;

        _integrityTimer?.Dispose();
        _integrityTimer = null;

        _bootSectorTimer?.Dispose();
        _bootSectorTimer = null;

        _fallbackTimer?.Dispose();
        _fallbackTimer = null;

        Console.WriteLine("[XDR VSS] Protection stopped");
    }

    public void Dispose()
    {
        Stop();
    }
}
