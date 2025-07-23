using System;
using System.Windows;
using SafeTray.Services;
using SafeTray.Helpers;

namespace SafeTray.Views
{
    public partial class SettingsWindow : Window
    {
        private readonly PipeClient _pipeClient;

        public SettingsWindow()
        {
            InitializeComponent();
            _pipeClient = new PipeClient("UltriumSafeNet");
            LoadDeviceInfo();
        }

        private void LoadDeviceInfo()
        {
            try
            {
                // Get device ID from registry
                var deviceId = RegistryHelper.ReadDeviceId() ?? "Not configured";
                DeviceIdTextBox.Text = deviceId;

                // Get service status via pipe
                var statusResponse = _pipeClient.Send&lt;dynamic&gt;(new { action = "get_status" });
                if (statusResponse != null)
                {
                    ServiceStatusTextBox.Text = "Running";
                    LastCheckinTextBox.Text = statusResponse.last_checkin?.ToString() ?? "Unknown";
                }
                else
                {
                    ServiceStatusTextBox.Text = "Not responding";
                    LastCheckinTextBox.Text = "Unknown";
                }

                AppendLog("Settings loaded successfully");
            }
            catch (Exception ex)
            {
                ServiceStatusTextBox.Text = "Error";
                AppendLog($"Error loading device info: {ex.Message}");
            }
        }

        private void RunScanButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                AppendLog("Initiating network scan...");
                var response = _pipeClient.Send&lt;dynamic&gt;(new { action = "run_scan" });
                
                if (response != null)
                {
                    AppendLog("Network scan initiated successfully");
                }
                else
                {
                    AppendLog("Failed to initiate network scan - service not responding");
                }
            }
            catch (Exception ex)
            {
                AppendLog($"Error running scan: {ex.Message}");
            }
        }

        private void SendCheckinButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                AppendLog("Sending check-in...");
                var response = _pipeClient.Send&lt;dynamic&gt;(new { action = "send_checkin" });
                
                if (response != null)
                {
                    AppendLog("Check-in sent successfully");
                    LoadDeviceInfo(); // Refresh info
                }
                else
                {
                    AppendLog("Failed to send check-in - service not responding");
                }
            }
            catch (Exception ex)
            {
                AppendLog($"Error sending check-in: {ex.Message}");
            }
        }

        private void ReconnectButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                AppendLog("Attempting to reconnect to service...");
                var response = _pipeClient.Send&lt;dynamic&gt;(new { action = "reconnect" });
                
                if (response != null)
                {
                    AppendLog("Reconnected to service successfully");
                    LoadDeviceInfo(); // Refresh info
                }
                else
                {
                    AppendLog("Failed to reconnect - service may be stopped");
                }
            }
            catch (Exception ex)
            {
                AppendLog($"Error reconnecting: {ex.Message}");
            }
        }

        private void RefreshButton_Click(object sender, RoutedEventArgs e)
        {
            AppendLog("Refreshing device information...");
            LoadDeviceInfo();
        }

        private void CloseButton_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }

        private void AppendLog(string message)
        {
            var timestamp = DateTime.Now.ToString("HH:mm:ss");
            StatusLogTextBox.Text += $"[{timestamp}] {message}\n";
            StatusLogTextBox.ScrollToEnd();
        }
    }
}