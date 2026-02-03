using System;
using System.Drawing;
using System.IO;
using System.Windows.Forms;
using Microsoft.Web.WebView2.WinForms;
using Microsoft.Web.WebView2.Core;
using VanguardAgent.Models;

namespace VanguardAgent.Forms;

public class PortalWindow : Form
{
    private readonly PortalConfig _config;
    private readonly WebView2 _webView;
    private bool _isInitialized = false;
    private string? _pendingNavigation = null;

    public PortalWindow(PortalConfig config)
    {
        _config = config;
        
        // Window setup - frameless popup style
        Text = _config.PortalName;
        Size = new Size(450, 700);
        StartPosition = FormStartPosition.Manual;
        FormBorderStyle = FormBorderStyle.None;
        ShowInTaskbar = false;
        TopMost = true;
        BackColor = Color.FromArgb(15, 23, 42); // Dark slate
        
        PositionNearTray();
        
        // WebView2 for portal content
        _webView = new WebView2
        {
            Dock = DockStyle.Fill,
            DefaultBackgroundColor = Color.FromArgb(15, 23, 42)
        };
        Controls.Add(_webView);
        
        // Custom title bar
        CreateTitleBar();
        
        InitializeWebView();
        
        // Hide when clicking outside
        Deactivate += (s, e) => 
        {
            if (Visible) Hide();
        };
    }

    private void PositionNearTray()
    {
        var workingArea = Screen.PrimaryScreen?.WorkingArea ?? new Rectangle(0, 0, 1920, 1080);
        Left = workingArea.Right - Width - 10;
        Top = workingArea.Bottom - Height - 10;
    }

    private void CreateTitleBar()
    {
        var titleBar = new Panel
        {
            Dock = DockStyle.Top,
            Height = 44,
            BackColor = Color.FromArgb(8, 145, 178) // Cyan-600
        };
        
        // Vanguard logo/branding
        var titleLabel = new Label
        {
            Text = $"  ⬡ {_config.PortalName}",
            ForeColor = Color.White,
            Font = new Font("Segoe UI", 11, FontStyle.Bold),
            AutoSize = false,
            TextAlign = ContentAlignment.MiddleLeft,
            Location = new Point(0, 0),
            Size = new Size(Width - 50, 44)
        };
        
        // Close button
        var closeBtn = new Button
        {
            Text = "×",
            FlatStyle = FlatStyle.Flat,
            ForeColor = Color.White,
            BackColor = Color.Transparent,
            Font = new Font("Segoe UI", 16),
            Size = new Size(44, 44),
            Location = new Point(Width - 54, 0),
            Cursor = Cursors.Hand
        };
        closeBtn.FlatAppearance.BorderSize = 0;
        closeBtn.FlatAppearance.MouseOverBackColor = Color.FromArgb(220, 38, 38); // Red
        closeBtn.Click += (s, e) => Hide();
        
        // Drag to move window
        bool dragging = false;
        Point dragStart = Point.Empty;
        
        void StartDrag(object? s, MouseEventArgs e) { dragging = true; dragStart = e.Location; }
        void Drag(object? s, MouseEventArgs e)
        {
            if (dragging) { Left += e.X - dragStart.X; Top += e.Y - dragStart.Y; }
        }
        void EndDrag(object? s, MouseEventArgs e) => dragging = false;
        
        titleBar.MouseDown += StartDrag;
        titleBar.MouseMove += Drag;
        titleBar.MouseUp += EndDrag;
        titleLabel.MouseDown += StartDrag;
        titleLabel.MouseMove += Drag;
        titleLabel.MouseUp += EndDrag;
        
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
                "VanguardAgent",
                "WebView2"
            );
            
            var env = await CoreWebView2Environment.CreateAsync(null, userDataFolder);
            await _webView.EnsureCoreWebView2Async(env);
            
            // Security settings
            _webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
            _webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
            _webView.CoreWebView2.Settings.IsZoomControlEnabled = false;
            
            // Navigate to customer portal
            var url = $"{_config.PortalUrl}?portal_key={_config.PortalKey}&embedded=true";
            _webView.CoreWebView2.Navigate(url);
            
            _isInitialized = true;
            
            if (_pendingNavigation != null)
            {
                NavigateTo(_pendingNavigation);
                _pendingNavigation = null;
            }
        }
        catch (Exception ex)
        {
            // Show fallback if WebView2 not available
            var errorLabel = new Label
            {
                Text = $"Please install Microsoft WebView2 Runtime\n\n{ex.Message}",
                ForeColor = Color.White,
                TextAlign = ContentAlignment.MiddleCenter,
                Dock = DockStyle.Fill,
                Font = new Font("Segoe UI", 10)
            };
            
            var linkLabel = new LinkLabel
            {
                Text = "Download WebView2 Runtime",
                LinkColor = Color.FromArgb(34, 211, 238), // Cyan
                Dock = DockStyle.Bottom,
                Height = 40,
                TextAlign = ContentAlignment.MiddleCenter,
                Font = new Font("Segoe UI", 10)
            };
            linkLabel.Click += (s, e) =>
            {
                System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                {
                    FileName = "https://developer.microsoft.com/en-us/microsoft-edge/webview2/",
                    UseShellExecute = true
                });
            };
            
            Controls.Add(errorLabel);
            Controls.Add(linkLabel);
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
            var cp = base.CreateParams;
            cp.ClassStyle |= 0x00020000; // CS_DROPSHADOW
            return cp;
        }
    }
}
