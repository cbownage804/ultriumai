using System;
using System.Drawing;
using System.Windows.Forms;
using Microsoft.Web.WebView2.WinForms;
using Microsoft.Web.WebView2.Core;
using VanguardPortal.Models;

namespace VanguardPortal.Forms;

public class PortalWindow : Form
{
    private readonly PortalConfig _config;
    private readonly WebView2 _webView;
    private bool _isInitialized = false;
    private string? _pendingNavigation = null;

    public PortalWindow(PortalConfig config)
    {
        _config = config;
        
        // Window setup
        Text = _config.PortalName;
        Size = new Size(450, 700);
        StartPosition = FormStartPosition.Manual;
        FormBorderStyle = FormBorderStyle.None;
        ShowInTaskbar = false;
        TopMost = true;
        BackColor = Color.FromArgb(15, 23, 42); // Slate-900
        
        // Position near system tray
        PositionNearTray();
        
        // Create WebView2
        _webView = new WebView2
        {
            Dock = DockStyle.Fill,
            DefaultBackgroundColor = Color.FromArgb(15, 23, 42)
        };
        
        Controls.Add(_webView);
        
        // Add title bar
        CreateTitleBar();
        
        // Initialize WebView2
        InitializeWebView();
        
        // Handle deactivation - hide when clicking outside
        Deactivate += (s, e) => 
        {
            if (Visible) Hide();
        };
    }

    private void PositionNearTray()
    {
        var workingArea = Screen.PrimaryScreen?.WorkingArea ?? new Rectangle(0, 0, 1920, 1080);
        
        // Position in bottom-right corner above taskbar
        Left = workingArea.Right - Width - 10;
        Top = workingArea.Bottom - Height - 10;
    }

    private void CreateTitleBar()
    {
        var titleBar = new Panel
        {
            Dock = DockStyle.Top,
            Height = 40,
            BackColor = Color.FromArgb(15, 23, 42)
        };
        
        // Title label
        var titleLabel = new Label
        {
            Text = _config.PortalName,
            ForeColor = Color.White,
            Font = new Font("Segoe UI", 10, FontStyle.Bold),
            AutoSize = false,
            TextAlign = ContentAlignment.MiddleLeft,
            Location = new Point(12, 0),
            Size = new Size(Width - 80, 40)
        };
        
        // Close button
        var closeBtn = new Button
        {
            Text = "×",
            FlatStyle = FlatStyle.Flat,
            ForeColor = Color.White,
            BackColor = Color.Transparent,
            Font = new Font("Segoe UI", 14),
            Size = new Size(40, 40),
            Location = new Point(Width - 50, 0),
            Cursor = Cursors.Hand
        };
        closeBtn.FlatAppearance.BorderSize = 0;
        closeBtn.FlatAppearance.MouseOverBackColor = Color.FromArgb(239, 68, 68);
        closeBtn.Click += (s, e) => Hide();
        
        // Drag to move
        bool dragging = false;
        Point dragStart = Point.Empty;
        
        titleBar.MouseDown += (s, e) => { dragging = true; dragStart = e.Location; };
        titleBar.MouseMove += (s, e) => 
        {
            if (dragging)
            {
                Left += e.X - dragStart.X;
                Top += e.Y - dragStart.Y;
            }
        };
        titleBar.MouseUp += (s, e) => dragging = false;
        
        titleLabel.MouseDown += (s, e) => { dragging = true; dragStart = e.Location; };
        titleLabel.MouseMove += (s, e) => 
        {
            if (dragging)
            {
                Left += e.X - dragStart.X;
                Top += e.Y - dragStart.Y;
            }
        };
        titleLabel.MouseUp += (s, e) => dragging = false;
        
        titleBar.Controls.Add(titleLabel);
        titleBar.Controls.Add(closeBtn);
        
        Controls.Add(titleBar);
        titleBar.BringToFront();
    }

    private async void InitializeWebView()
    {
        try
        {
            var userDataFolder = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "VanguardPortal",
                "WebView2"
            );
            
            var env = await CoreWebView2Environment.CreateAsync(null, userDataFolder);
            await _webView.EnsureCoreWebView2Async(env);
            
            // Configure WebView2
            _webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
            _webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
            
            // Navigate to portal with key
            var url = $"{_config.PortalUrl}?portal_key={_config.PortalKey}&embedded=true";
            _webView.CoreWebView2.Navigate(url);
            
            _isInitialized = true;
            
            // Process pending navigation
            if (_pendingNavigation != null)
            {
                NavigateTo(_pendingNavigation);
                _pendingNavigation = null;
            }
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                $"Failed to initialize web view: {ex.Message}\n\nPlease ensure WebView2 Runtime is installed.",
                "Error",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error
            );
        }
    }

    public void NavigateTo(string tab)
    {
        if (!_isInitialized)
        {
            _pendingNavigation = tab;
            return;
        }
        
        var url = $"{_config.PortalUrl}?portal_key={_config.PortalKey}&tab={tab}&embedded=true";
        _webView.CoreWebView2.Navigate(url);
    }

    protected override void OnShown(EventArgs e)
    {
        base.OnShown(e);
        PositionNearTray();
    }

    protected override CreateParams CreateParams
    {
        get
        {
            // Add drop shadow
            var cp = base.CreateParams;
            cp.ClassStyle |= 0x00020000; // CS_DROPSHADOW
            return cp;
        }
    }
}
