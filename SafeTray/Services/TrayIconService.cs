using System;
using System.Drawing;
using System.Threading.Tasks;
using System.Windows.Forms;
using SafeTray.Models;

namespace SafeTray.Services
{
    public class TrayIconService : IDisposable
    {
        private readonly NotifyIcon _icon;
        private readonly PipeClient _pipe;
        private readonly ApiClient _api;
        private readonly ToastService _toast;
        private System.Threading.Timer? _statusTimer;
        private bool _disposed = false;

        public TrayIconService()
        {
            _icon = new NotifyIcon();
            _pipe = new PipeClient("UltriumSafeNet");
            _api = new ApiClient();
            _toast = new ToastService();

            _icon.Icon = Icons.Gray; // Start with gray until we get status
            _icon.Visible = true;
            _icon.Text = "Ultrium SafeNet";
            BuildMenu();
        }

        public async void Initialize()
        {
            // Initial status check
            await UpdateStatus();
            
            // Poll status every 2 minutes
            _statusTimer = new System.Threading.Timer(async _ =>
            {
                try
                {
                    await UpdateStatus();
                }
                catch
                {
                    // Swallow exceptions to prevent timer from stopping
                }
            }, null, TimeSpan.Zero, TimeSpan.FromMinutes(2));
        }

        private async Task UpdateStatus()
        {
            try
            {
                var status = await _api.GetTrayStatusAsync();
                SetIcon(status);
                
                // Show toast for critical alerts
                if (status.HasCriticalAlert)
                {
                    _toast.Show("SafeNet Critical Alert", 
                               status.Message ?? "Critical security issue detected", 
                               () => OpenAlerts());
                }
            }
            catch
            {
                // If API fails, set offline status
                _icon.Icon = Icons.Red;
                _icon.Text = "Ultrium SafeNet - Connection Error";
            }
        }

        private void BuildMenu()
        {
            var menu = new ContextMenuStrip();
            menu.Items.Add("Open SafePass", null, async (_, __) => await OpenSafePass());
            menu.Items.Add("Run Network Scan", null, (_, __) => RunNetworkScan());
            menu.Items.Add("View Alerts", null, (_, __) => OpenAlerts());
            menu.Items.Add("Open Dashboard", null, (_, __) => OpenDashboard());
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add("Settings", null, (_, __) => OpenSettings());
            menu.Items.Add("Exit", null, (_, __) => ExitApplication());
            _icon.ContextMenuStrip = menu;
        }

        private void SetIcon(TrayStatus status)
        {
            _icon.Icon = status.State switch
            {
                TrayState.Green => Icons.Green,
                TrayState.Yellow => Icons.Yellow,
                TrayState.Red => Icons.Red,
                _ => Icons.Gray
            };
            _icon.Text = $"Ultrium SafeNet - {status.Message}";
        }

        private async Task OpenSafePass()
        {
            try
            {
                var jwt = await _api.GetTrayTokenAsync("safepass");
                System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                {
                    FileName = $"https://nsyobmjpdpvesjwdphlh.supabase.co/safepass?token={jwt}",
                    UseShellExecute = true
                });
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to open SafePass: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void RunNetworkScan()
        {
            try
            {
                var result = _pipe.Send<dynamic>(new { action = "run_scan" });
                if (result?.ok == true)
                {
                    _toast.Show("Network Scan", "Scan started successfully", null);
                }
                else
                {
                    MessageBox.Show("Failed to start network scan. Service may not be running.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to communicate with service: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void OpenAlerts()
        {
            System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
            {
                FileName = "https://nsyobmjpdpvesjwdphlh.supabase.co/dashboard/safeshield",
                UseShellExecute = true
            });
        }

        private void OpenDashboard()
        {
            System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
            {
                FileName = "https://nsyobmjpdpvesjwdphlh.supabase.co/dashboard",
                UseShellExecute = true
            });
        }

        private void OpenSettings()
        {
            // TODO: Implement settings window
            MessageBox.Show("Settings window not yet implemented", "Info", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private void ExitApplication()
        {
            System.Windows.Application.Current.Shutdown();
        }

        public void Dispose()
        {
            if (!_disposed)
            {
                _statusTimer?.Dispose();
                _icon.Dispose();
                _toast.Dispose();
                _disposed = true;
            }
        }
    }

    static class Icons
    {
        // Default system icons for now - replace with custom ICO files later
        public static Icon Green => SystemIcons.Information;
        public static Icon Yellow => SystemIcons.Warning;
        public static Icon Red => SystemIcons.Error;
        public static Icon Gray => SystemIcons.Question;
    }
}