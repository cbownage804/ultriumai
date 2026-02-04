using System;
using System.Drawing;
using System.IO;
using System.Text.Json;
using System.Windows.Forms;
using VanguardAgent.Models;
using VanguardAgent.Services;

namespace VanguardAgent.Forms;

/// <summary>
/// System tray context for Vanguard Agent - always visible with login/portal access
/// </summary>
public class PortalTrayContext : ApplicationContext
{
    private readonly NotifyIcon _trayIcon;
    private readonly PortalConfig _config;
    private readonly PortalAuthService _authService;
    private readonly ConfigService _configService;
    private PortalWindow? _portalWindow;
    private PortalLoginForm? _loginForm;
    private Icon? _customIcon;
    private readonly CancellationTokenSource _serviceCts;
    private Task? _serviceTask;

    public PortalTrayContext(PortalConfig config, Func<CancellationToken, Task>? serviceRunner = null)
    {
        _config = config;
        _serviceCts = new CancellationTokenSource();
        _configService = new ConfigService();
        _authService = new PortalAuthService(_configService);
        
        // Start the RMM service in background if provided
        if (serviceRunner != null)
        {
            _serviceTask = Task.Run(() => serviceRunner(_serviceCts.Token));
        }
        
        // Create tray icon - ALWAYS visible
        _trayIcon = new NotifyIcon
        {
            Icon = LoadIcon(),
            Text = "Vanguard Agent",
            Visible = true,
            ContextMenuStrip = CreateContextMenu()
        };
        
        _trayIcon.DoubleClick += OnTrayIconDoubleClick;
        _trayIcon.MouseClick += OnTrayIconClick;
        
        // Try to restore previous session
        _ = TryRestoreSession();
        
        // Show startup notification
        _trayIcon.ShowBalloonTip(
            3000,
            "Vanguard Agent Active",
            "System monitoring active. Right-click to access portal.",
            ToolTipIcon.Info
        );
    }

    private async Task TryRestoreSession()
    {
        try
        {
            var restored = await _authService.TryRestoreSessionAsync();
            if (restored)
            {
                UpdateTrayForLoggedIn();
            }
        }
        catch { /* Ignore session restore failures */ }
    }

    private Icon LoadIcon()
    {
        // Try loading vanguard.ico from app directory with full size (256x256 for Windows toasts)
        var iconPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "vanguard.ico");
        if (File.Exists(iconPath))
        {
            try
            {
                // Load the icon at largest available size for proper toast display
                // Windows 10/11 toasts display the NotifyIcon's icon - need 256x256 for crisp display
                _customIcon = new Icon(iconPath, new Size(256, 256));
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
        RebuildMenu(menu);
        return menu;
    }

    private void RebuildMenu(ContextMenuStrip? menu = null)
    {
        menu ??= _trayIcon.ContextMenuStrip;
        if (menu == null) return;
        
        menu.Items.Clear();
        
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

        if (_authService.IsLoggedIn)
        {
            // LOGGED IN: Show full portal menu
            var session = _authService.CurrentSession;
            
            // User info
            var userItem = new ToolStripMenuItem($"Logged in as {session?.Email ?? "User"}")
            {
                Enabled = false,
                ForeColor = Color.FromArgb(100, 200, 255)
            };
            menu.Items.Add(userItem);
            menu.Items.Add(new ToolStripSeparator());
            
            // Open Portal
            var openItem = new ToolStripMenuItem("Open Support Portal", null, OnOpenPortal);
            openItem.Font = new Font(menu.Font, FontStyle.Bold);
            menu.Items.Add(openItem);
            
            menu.Items.Add(new ToolStripSeparator());
            
            // Quick Actions
            menu.Items.Add(new ToolStripMenuItem("New Support Ticket", null, OnNewTicket));
            menu.Items.Add(new ToolStripMenuItem("View My Tickets", null, OnViewTickets));
            menu.Items.Add(new ToolStripMenuItem("Check System Health", null, OnCheckHealth));
            
            menu.Items.Add(new ToolStripSeparator());
            
            // SafeSuite submenu (if enabled)
            var safeSuite = session?.SafeSuiteAccess;
            if (safeSuite != null && (safeSuite.SafePassEnabled || safeSuite.SafeScanEnabled || 
                                       safeSuite.SafeWebEnabled || safeSuite.SafeTrackEnabled))
            {
                var safesuiteMenu = new ToolStripMenuItem("SafeSuite Tools");
                if (safeSuite.SafePassEnabled)
                    safesuiteMenu.DropDownItems.Add(new ToolStripMenuItem("SafePass - Passwords", null, OnOpenSafePass));
                if (safeSuite.SafeScanEnabled)
                    safesuiteMenu.DropDownItems.Add(new ToolStripMenuItem("SafeScan - Breach Check", null, OnOpenSafeScan));
                if (safeSuite.SafeWebEnabled)
                    safesuiteMenu.DropDownItems.Add(new ToolStripMenuItem("SafeWeb - VPN", null, OnOpenSafeWeb));
                if (safeSuite.SafeTrackEnabled)
                    safesuiteMenu.DropDownItems.Add(new ToolStripMenuItem("SafeTrack - Privacy", null, OnOpenSafeTrack));
                menu.Items.Add(safesuiteMenu);
                menu.Items.Add(new ToolStripSeparator());
            }
            
            menu.Items.Add(new ToolStripMenuItem("Open in Browser", null, OnOpenInBrowser));
            menu.Items.Add(new ToolStripSeparator());
            
            // Logout
            menu.Items.Add(new ToolStripMenuItem("Logout", null, OnLogout));
        }
        else
        {
            // NOT LOGGED IN: Show login option
            var loginItem = new ToolStripMenuItem("Login to Portal");
            loginItem.Font = new Font(menu.Font, FontStyle.Bold);
            loginItem.Click += (s, e) => ShowLoginForm();
            menu.Items.Add(loginItem);
            
            menu.Items.Add(new ToolStripSeparator());
            
            // Basic system info available without login
            var sysInfoItem = new ToolStripMenuItem("View System Info");
            sysInfoItem.Click += OnViewSystemInfo;
            menu.Items.Add(sysInfoItem);
        }
        
        menu.Items.Add(new ToolStripSeparator());
        
        // About
        menu.Items.Add(new ToolStripMenuItem("About Vanguard", null, OnAbout));
        
        menu.Items.Add(new ToolStripSeparator());
        
        // Exit (only closes tray app, not the service)
        menu.Items.Add(new ToolStripMenuItem("Exit", null, OnExit));
    }

    private void UpdateTrayForLoggedIn()
    {
        var session = _authService.CurrentSession;
        _trayIcon.Text = $"Vanguard - {session?.FullName ?? session?.Email ?? "Logged In"}";
        RebuildMenu();
    }

    private void UpdateTrayForLoggedOut()
    {
        _trayIcon.Text = "Vanguard Agent";
        RebuildMenu();
    }

    private void OnTrayIconClick(object? sender, MouseEventArgs e)
    {
        if (e.Button == MouseButtons.Left)
        {
            // Left-click: show portal if logged in, otherwise show login
            if (_authService.IsLoggedIn)
            {
                ShowPortalWindow();
            }
            else
            {
                ShowLoginForm();
            }
        }
        // Right-click is handled automatically by ContextMenuStrip
    }

    private void OnTrayIconDoubleClick(object? sender, EventArgs e)
    {
        if (_authService.IsLoggedIn)
        {
            ShowPortalWindow();
        }
        else
        {
            ShowLoginForm();
        }
    }

    private void ShowLoginForm()
    {
        if (_loginForm == null || _loginForm.IsDisposed)
        {
            _loginForm = new PortalLoginForm(_authService, OnLoginSuccess);
        }
        
        _loginForm.Show();
        _loginForm.BringToFront();
        _loginForm.Activate();
    }

    private void OnLoginSuccess(PortalSession session)
    {
        UpdateTrayForLoggedIn();
        
        _trayIcon.ShowBalloonTip(
            2000,
            "Logged In",
            $"Welcome, {session.FullName ?? session.Email}!",
            ToolTipIcon.Info
        );
        
        // Optionally open portal after login
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

    private void OnShowLogin(object? sender, EventArgs e) => ShowLoginForm();
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
                   $"Status: Active & Monitoring\n\n" +
                   $"Right-click the tray icon to login.";
        
        MessageBox.Show(info, "System Information", MessageBoxButtons.OK, MessageBoxIcon.Information);
    }

    private void OnLogout(object? sender, EventArgs e)
    {
        _authService.Logout();
        _portalWindow?.Close();
        _portalWindow = null;
        
        UpdateTrayForLoggedOut();
        
        _trayIcon.ShowBalloonTip(
            2000,
            "Logged Out",
            "You have been logged out of the portal.",
            ToolTipIcon.Info
        );
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
        _loginForm?.Close();
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
