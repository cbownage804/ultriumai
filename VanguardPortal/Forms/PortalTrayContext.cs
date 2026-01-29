using System;
using System.Drawing;
using System.IO;
using System.Net.Http;
using System.Text.Json;
using System.Windows.Forms;
using VanguardPortal.Models;

namespace VanguardPortal.Forms;

public class PortalTrayContext : ApplicationContext
{
    private readonly NotifyIcon _trayIcon;
    private readonly PortalConfig _config;
    private PortalWindow? _portalWindow;
    private Icon? _customIcon;

    public PortalTrayContext()
    {
        _config = LoadConfig();
        
        // Create tray icon with custom or default icon
        _trayIcon = new NotifyIcon
        {
            Icon = LoadIcon(),
            Text = _config.PortalName, // This shows on hover
            Visible = true,
            ContextMenuStrip = CreateContextMenu()
        };
        
        _trayIcon.DoubleClick += OnTrayIconDoubleClick;
        _trayIcon.Click += OnTrayIconClick;
        
        // Show balloon tip on first launch
        _trayIcon.ShowBalloonTip(
            3000,
            _config.PortalName,
            "Click the tray icon to access your support portal.",
            ToolTipIcon.Info
        );
    }

    private PortalConfig LoadConfig()
    {
        var configPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "config.json");
        var json = File.ReadAllText(configPath);
        return JsonSerializer.Deserialize<PortalConfig>(json) ?? new PortalConfig();
    }

    private Icon LoadIcon()
    {
        // Try to load custom logo from URL or file
        if (!string.IsNullOrEmpty(_config.LogoUrl))
        {
            try
            {
                var iconPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "custom-icon.ico");
                if (File.Exists(iconPath))
                {
                    _customIcon = new Icon(iconPath);
                    return _customIcon;
                }
            }
            catch { }
        }
        
        // Fall back to embedded resource
        using var stream = GetType().Assembly.GetManifestResourceStream("VanguardPortal.Resources.portal.ico");
        if (stream != null)
        {
            return new Icon(stream);
        }
        
        // Ultimate fallback to system icon
        return SystemIcons.Application;
    }

    private ContextMenuStrip CreateContextMenu()
    {
        var menu = new ContextMenuStrip();
        
        // Header with portal name
        var header = new ToolStripMenuItem(_config.PortalName)
        {
            Enabled = false,
            Font = new Font(menu.Font, FontStyle.Bold)
        };
        menu.Items.Add(header);
        menu.Items.Add(new ToolStripSeparator());
        
        // Open Portal
        var openItem = new ToolStripMenuItem("Open Portal", null, OnOpenPortal);
        openItem.Font = new Font(menu.Font, FontStyle.Bold);
        menu.Items.Add(openItem);
        
        menu.Items.Add(new ToolStripSeparator());
        
        // Quick Actions
        menu.Items.Add(new ToolStripMenuItem("New Support Ticket", null, OnNewTicket));
        menu.Items.Add(new ToolStripMenuItem("Check System Health", null, OnCheckHealth));
        menu.Items.Add(new ToolStripMenuItem("View My Tickets", null, OnViewTickets));
        
        menu.Items.Add(new ToolStripSeparator());
        
        // SafeSuite Integration (if enabled)
        var safesuiteMenu = new ToolStripMenuItem("SafeSuite");
        safesuiteMenu.DropDownItems.Add(new ToolStripMenuItem("SafePass", null, OnOpenSafePass));
        safesuiteMenu.DropDownItems.Add(new ToolStripMenuItem("SafeScan", null, OnOpenSafeScan));
        safesuiteMenu.DropDownItems.Add(new ToolStripMenuItem("SafeWeb", null, OnOpenSafeWeb));
        safesuiteMenu.DropDownItems.Add(new ToolStripMenuItem("SafeTrack", null, OnOpenSafeTrack));
        menu.Items.Add(safesuiteMenu);
        
        menu.Items.Add(new ToolStripSeparator());
        
        // Open in Browser
        menu.Items.Add(new ToolStripMenuItem("Open in Browser", null, OnOpenInBrowser));
        
        menu.Items.Add(new ToolStripSeparator());
        
        // Exit
        menu.Items.Add(new ToolStripMenuItem("Exit", null, OnExit));
        
        return menu;
    }

    private void OnTrayIconClick(object? sender, EventArgs e)
    {
        if (e is MouseEventArgs mouseEvent && mouseEvent.Button == MouseButtons.Left)
        {
            ShowPortalWindow();
        }
    }

    private void OnTrayIconDoubleClick(object? sender, EventArgs e)
    {
        ShowPortalWindow();
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

    private void OnOpenPortal(object? sender, EventArgs e)
    {
        ShowPortalWindow();
    }

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
        System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
        {
            FileName = $"{_config.PortalUrl}?tab=safeweb&portal_key={_config.PortalKey}",
            UseShellExecute = true
        });
    }

    private void OnOpenSafeTrack(object? sender, EventArgs e)
    {
        System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
        {
            FileName = $"{_config.PortalUrl}?tab=safetrack&portal_key={_config.PortalKey}",
            UseShellExecute = true
        });
    }

    private void OnOpenInBrowser(object? sender, EventArgs e)
    {
        System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
        {
            FileName = $"{_config.PortalUrl}?portal_key={_config.PortalKey}",
            UseShellExecute = true
        });
    }

    private void OnExit(object? sender, EventArgs e)
    {
        _trayIcon.Visible = false;
        _customIcon?.Dispose();
        _portalWindow?.Close();
        Application.Exit();
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            _trayIcon.Dispose();
            _customIcon?.Dispose();
        }
        base.Dispose(disposing);
    }
}
