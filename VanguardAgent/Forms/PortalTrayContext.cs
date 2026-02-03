using System;
using System.Drawing;
using System.IO;
using System.Text.Json;
using System.Windows.Forms;
using VanguardAgent.Models;

namespace VanguardAgent.Forms;

public class PortalTrayContext : ApplicationContext
{
    private readonly NotifyIcon _trayIcon;
    private readonly PortalConfig _config;
    private PortalWindow? _portalWindow;
    private Icon? _customIcon;
    private readonly CancellationTokenSource _serviceCts;
    private Task? _serviceTask;

    public PortalTrayContext(PortalConfig config, Func<CancellationToken, Task>? serviceRunner = null)
    {
        _config = config;
        _serviceCts = new CancellationTokenSource();
        
        // Start the RMM service in background if provided
        if (serviceRunner != null)
        {
            _serviceTask = Task.Run(() => serviceRunner(_serviceCts.Token));
        }
        
        // Create tray icon
        _trayIcon = new NotifyIcon
        {
            Icon = LoadIcon(),
            Text = $"Vanguard - {_config.PortalName}",
            Visible = true,
            ContextMenuStrip = CreateContextMenu()
        };
        
        _trayIcon.DoubleClick += OnTrayIconDoubleClick;
        _trayIcon.Click += OnTrayIconClick;
        
        // Show startup notification
        _trayIcon.ShowBalloonTip(
            3000,
            "Vanguard Agent Active",
            $"System monitoring active. Click to access {_config.PortalName}.",
            ToolTipIcon.Info
        );
    }

    private Icon LoadIcon()
    {
        // Try loading vanguard.ico from app directory
        var iconPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "vanguard.ico");
        if (File.Exists(iconPath))
        {
            try
            {
                _customIcon = new Icon(iconPath);
                return _customIcon;
            }
            catch { }
        }
        
        // Fallback to embedded resource or system icon
        return SystemIcons.Shield;
    }

    private ContextMenuStrip CreateContextMenu()
    {
        var menu = new ContextMenuStrip();
        
        // Header
        var header = new ToolStripMenuItem("Vanguard Agent")
        {
            Enabled = false,
            Font = new Font(menu.Font, FontStyle.Bold)
        };
        menu.Items.Add(header);
        menu.Items.Add(new ToolStripSeparator());
        
        // Status indicator
        var statusItem = new ToolStripMenuItem("● System Healthy")
        {
            Enabled = false,
            ForeColor = Color.FromArgb(34, 197, 94) // Green
        };
        menu.Items.Add(statusItem);
        menu.Items.Add(new ToolStripSeparator());
        
        // Open Portal (if enabled)
        if (_config.ShowPortal)
        {
            var openItem = new ToolStripMenuItem("Open Support Portal", null, OnOpenPortal);
            openItem.Font = new Font(menu.Font, FontStyle.Bold);
            menu.Items.Add(openItem);
            
            menu.Items.Add(new ToolStripSeparator());
            
            // Quick Actions
            menu.Items.Add(new ToolStripMenuItem("New Support Ticket", null, OnNewTicket));
            menu.Items.Add(new ToolStripMenuItem("View My Tickets", null, OnViewTickets));
            menu.Items.Add(new ToolStripMenuItem("Check System Health", null, OnCheckHealth));
            
            menu.Items.Add(new ToolStripSeparator());
            
            // SafeSuite submenu
            var safesuiteMenu = new ToolStripMenuItem("SafeSuite Tools");
            safesuiteMenu.DropDownItems.Add(new ToolStripMenuItem("SafePass - Passwords", null, OnOpenSafePass));
            safesuiteMenu.DropDownItems.Add(new ToolStripMenuItem("SafeScan - Breach Check", null, OnOpenSafeScan));
            safesuiteMenu.DropDownItems.Add(new ToolStripMenuItem("SafeWeb - VPN", null, OnOpenSafeWeb));
            safesuiteMenu.DropDownItems.Add(new ToolStripMenuItem("SafeTrack - Privacy", null, OnOpenSafeTrack));
            menu.Items.Add(safesuiteMenu);
            
            menu.Items.Add(new ToolStripSeparator());
            
            menu.Items.Add(new ToolStripMenuItem("Open in Browser", null, OnOpenInBrowser));
        }
        else
        {
            menu.Items.Add(new ToolStripMenuItem("View System Info", null, OnViewSystemInfo));
        }
        
        menu.Items.Add(new ToolStripSeparator());
        
        // About
        menu.Items.Add(new ToolStripMenuItem("About Vanguard", null, OnAbout));
        
        menu.Items.Add(new ToolStripSeparator());
        
        // Exit
        menu.Items.Add(new ToolStripMenuItem("Exit", null, OnExit));
        
        return menu;
    }

    private void OnTrayIconClick(object? sender, EventArgs e)
    {
        if (e is MouseEventArgs mouseEvent && mouseEvent.Button == MouseButtons.Left)
        {
            if (_config.ShowPortal)
            {
                ShowPortalWindow();
            }
        }
    }

    private void OnTrayIconDoubleClick(object? sender, EventArgs e)
    {
        if (_config.ShowPortal)
        {
            ShowPortalWindow();
        }
    }

    private void ShowPortalWindow()
    {
        if (_portalWindow == null || _portalWindow.IsDisposed)
        {
            _portalWindow = new PortalWindow(_config);
        }
        
        _portalWindow.Show();
        _portalWindow.BringToFront();
        _portalWindow.Activate();
    }

    private void OnOpenPortal(object? sender, EventArgs e) => ShowPortalWindow();

    private void OnNewTicket(object? sender, EventArgs e)
    {
        ShowPortalWindow();
        _portalWindow?.NavigateTo("new-ticket");
    }

    private void OnCheckHealth(object? sender, EventArgs e)
    {
        ShowPortalWindow();
        _portalWindow?.NavigateTo("health");
    }

    private void OnViewTickets(object? sender, EventArgs e)
    {
        ShowPortalWindow();
        _portalWindow?.NavigateTo("tickets");
    }

    private void OnOpenSafePass(object? sender, EventArgs e)
    {
        ShowPortalWindow();
        _portalWindow?.NavigateTo("safepass");
    }

    private void OnOpenSafeScan(object? sender, EventArgs e)
    {
        ShowPortalWindow();
        _portalWindow?.NavigateTo("safescan");
    }

    private void OnOpenSafeWeb(object? sender, EventArgs e)
    {
        OpenUrl($"{_config.PortalUrl}?tab=safeweb&portal_key={_config.PortalKey}");
    }

    private void OnOpenSafeTrack(object? sender, EventArgs e)
    {
        OpenUrl($"{_config.PortalUrl}?tab=safetrack&portal_key={_config.PortalKey}");
    }

    private void OnOpenInBrowser(object? sender, EventArgs e)
    {
        OpenUrl($"{_config.PortalUrl}?portal_key={_config.PortalKey}");
    }

    private void OnViewSystemInfo(object? sender, EventArgs e)
    {
        var info = $"Vanguard Agent v1.2.0\n\n" +
                   $"Computer: {Environment.MachineName}\n" +
                   $"User: {Environment.UserName}\n" +
                   $"OS: {Environment.OSVersion}\n" +
                   $"Status: Active & Monitoring";
        
        MessageBox.Show(info, "System Information", MessageBoxButtons.OK, MessageBoxIcon.Information);
    }

    private void OnAbout(object? sender, EventArgs e)
    {
        MessageBox.Show(
            "Vanguard Agent v1.2.0\n\n" +
            "Enterprise RMM & Customer Portal\n" +
            "© 2024 Ultrium AI\n\n" +
            "https://ultriumai.com/vanguard",
            "About Vanguard",
            MessageBoxButtons.OK,
            MessageBoxIcon.Information
        );
    }

    private void OpenUrl(string url)
    {
        System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
        {
            FileName = url,
            UseShellExecute = true
        });
    }

    private void OnExit(object? sender, EventArgs e)
    {
        // Stop the RMM service
        _serviceCts.Cancel();
        
        _trayIcon.Visible = false;
        _customIcon?.Dispose();
        _portalWindow?.Close();
        Application.Exit();
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            _serviceCts.Cancel();
            _trayIcon.Dispose();
            _customIcon?.Dispose();
        }
        base.Dispose(disposing);
    }
}
