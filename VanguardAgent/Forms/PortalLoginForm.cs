using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Windows.Forms;
using VanguardAgent.Services;

namespace VanguardAgent.Forms;

/// <summary>
/// Portal login form for the agent tray - Vanguard branded
/// </summary>
public class PortalLoginForm : Form
{
    private readonly PortalAuthService _authService;
    private readonly Action<PortalSession> _onLoginSuccess;
    private readonly string _portalName;
    
    private TextBox _emailInput = null!;
    private TextBox _passwordInput = null!;
    private Button _loginButton = null!;
    private Label _errorLabel = null!;
    private Label _statusLabel = null!;
    private bool _isLoading = false;

    // Vanguard brand colors
    private static readonly Color VanguardCyan = Color.FromArgb(8, 145, 178);
    private static readonly Color VanguardCyanLight = Color.FromArgb(34, 211, 238);
    private static readonly Color VanguardPurple = Color.FromArgb(139, 92, 246);
    private static readonly Color DarkBg = Color.FromArgb(5, 10, 10);
    private static readonly Color CardBg = Color.FromArgb(15, 23, 35);
    private static readonly Color InputBg = Color.FromArgb(25, 35, 50);
    private static readonly Color TextMuted = Color.FromArgb(148, 163, 184);

    public PortalLoginForm(PortalAuthService authService, Action<PortalSession> onLoginSuccess, string? portalName = null)
    {
        _authService = authService;
        _onLoginSuccess = onLoginSuccess;
        _portalName = string.IsNullOrWhiteSpace(portalName) ? "Vanguard" : portalName;
        
        InitializeComponent();
    }

    private void InitializeComponent()
    {
        // Form setup
        Text = $"{_portalName} Portal";
        Size = new Size(400, 480);
        StartPosition = FormStartPosition.CenterScreen;
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        MinimizeBox = true;
        BackColor = DarkBg;
        
        // Main container panel with gradient border effect
        var mainPanel = new Panel
        {
            Location = new Point(20, 20),
            Size = new Size(344, 420),
            BackColor = CardBg
        };
        mainPanel.Paint += (s, e) =>
        {
            using var pen = new Pen(Color.FromArgb(40, VanguardCyan), 1);
            e.Graphics.DrawRectangle(pen, 0, 0, mainPanel.Width - 1, mainPanel.Height - 1);
        };
        Controls.Add(mainPanel);

        // Logo icon (hexagon with V)
        var logoPanel = new Panel
        {
            Location = new Point(132, 25),
            Size = new Size(80, 80),
            BackColor = Color.Transparent
        };
        logoPanel.Paint += DrawVanguardLogo;
        mainPanel.Controls.Add(logoPanel);

        // Title - Vanguard Portal
        var titleLabel = new Label
        {
            Text = $"{_portalName} Portal",
            ForeColor = Color.White,
            Font = new Font("Segoe UI", 18, FontStyle.Bold),
            AutoSize = false,
            Size = new Size(344, 35),
            Location = new Point(0, 115),
            TextAlign = ContentAlignment.MiddleCenter
        };
        mainPanel.Controls.Add(titleLabel);

        // Subtitle with gradient-like effect
        var subtitleLabel = new Label
        {
            Text = "Sign in to your account",
            ForeColor = TextMuted,
            Font = new Font("Segoe UI", 10),
            AutoSize = false,
            Size = new Size(344, 25),
            Location = new Point(0, 150),
            TextAlign = ContentAlignment.MiddleCenter
        };
        mainPanel.Controls.Add(subtitleLabel);

        // Email label
        var emailLabel = new Label
        {
            Text = "Email",
            ForeColor = TextMuted,
            Font = new Font("Segoe UI", 9),
            Location = new Point(30, 190),
            AutoSize = true
        };
        mainPanel.Controls.Add(emailLabel);

        // Email input with styled border
        _emailInput = CreateStyledInput(new Point(30, 212), 284);
        mainPanel.Controls.Add(_emailInput);

        // Password label
        var passwordLabel = new Label
        {
            Text = "Password",
            ForeColor = TextMuted,
            Font = new Font("Segoe UI", 9),
            Location = new Point(30, 260),
            AutoSize = true
        };
        mainPanel.Controls.Add(passwordLabel);

        // Password input
        _passwordInput = CreateStyledInput(new Point(30, 282), 284);
        _passwordInput.UseSystemPasswordChar = true;
        _passwordInput.KeyDown += (s, e) => { if (e.KeyCode == Keys.Enter) OnLoginClick(s, e); };
        mainPanel.Controls.Add(_passwordInput);

        // Error label
        _errorLabel = new Label
        {
            Text = "",
            ForeColor = Color.FromArgb(248, 113, 113),
            Font = new Font("Segoe UI", 9),
            Location = new Point(30, 326),
            Size = new Size(284, 20),
            Visible = false
        };
        mainPanel.Controls.Add(_errorLabel);

        // Login button with gradient
        _loginButton = new Button
        {
            Text = "Sign In",
            Location = new Point(30, 350),
            Size = new Size(284, 44),
            FlatStyle = FlatStyle.Flat,
            BackColor = VanguardCyan,
            ForeColor = Color.White,
            Font = new Font("Segoe UI", 11, FontStyle.Bold),
            Cursor = Cursors.Hand
        };
        _loginButton.FlatAppearance.BorderSize = 0;
        _loginButton.FlatAppearance.MouseOverBackColor = VanguardCyanLight;
        _loginButton.Click += OnLoginClick;
        mainPanel.Controls.Add(_loginButton);

        // Bottom powered by text
        _statusLabel = new Label
        {
            Text = "Powered by Ultrium Vanguard",
            ForeColor = Color.FromArgb(80, 80, 90),
            Font = new Font("Segoe UI", 8),
            Location = new Point(0, 400),
            Size = new Size(344, 18),
            TextAlign = ContentAlignment.MiddleCenter
        };
        mainPanel.Controls.Add(_statusLabel);
    }

    private TextBox CreateStyledInput(Point location, int width)
    {
        var input = new TextBox
        {
            Location = location,
            Size = new Size(width, 34),
            Font = new Font("Segoe UI", 11),
            BackColor = InputBg,
            ForeColor = Color.White,
            BorderStyle = BorderStyle.FixedSingle
        };
        return input;
    }

    private void DrawVanguardLogo(object? sender, PaintEventArgs e)
    {
        var g = e.Graphics;
        g.SmoothingMode = SmoothingMode.AntiAlias;
        
        var panel = sender as Panel;
        if (panel == null) return;
        
        var centerX = panel.Width / 2f;
        var centerY = panel.Height / 2f;
        var radius = 35f;

        // Draw hexagon
        var hexPoints = new PointF[6];
        for (int i = 0; i < 6; i++)
        {
            var angle = (float)(Math.PI / 3 * i - Math.PI / 2);
            hexPoints[i] = new PointF(
                centerX + radius * (float)Math.Cos(angle),
                centerY + radius * (float)Math.Sin(angle)
            );
        }

        // Gradient fill for hexagon
        using var gradientBrush = new LinearGradientBrush(
            new Rectangle(0, 0, panel.Width, panel.Height),
            VanguardCyan,
            VanguardPurple,
            LinearGradientMode.ForwardDiagonal
        );
        g.FillPolygon(gradientBrush, hexPoints);

        // Draw hexagon border
        using var borderPen = new Pen(Color.FromArgb(100, VanguardCyanLight), 2);
        g.DrawPolygon(borderPen, hexPoints);

        // Draw "V" in center
        using var vFont = new Font("Segoe UI", 24, FontStyle.Bold);
        using var vBrush = new SolidBrush(Color.White);
        var vSize = g.MeasureString("V", vFont);
        g.DrawString("V", vFont, vBrush, 
            centerX - vSize.Width / 2 + 1, 
            centerY - vSize.Height / 2 + 2);
    }

    private async void OnLoginClick(object? sender, EventArgs e)
    {
        if (_isLoading) return;
        
        var email = _emailInput.Text.Trim();
        var password = _passwordInput.Text;

        if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
        {
            ShowError("Please enter email and password");
            return;
        }

        _isLoading = true;
        _loginButton.Text = "Signing in...";
        _loginButton.Enabled = false;
        _errorLabel.Visible = false;

        try
        {
            var result = await _authService.LoginAsync(email, password);

            if (result.Success && result.Session != null)
            {
                _onLoginSuccess(result.Session);
                Close();
            }
            else
            {
                // Check for MSP admin error
                var errorMsg = result.ErrorMessage ?? "Login failed";
                if (errorMsg.Contains("MSP_ADMIN") || errorMsg.Contains("MSP administrator"))
                {
                    ShowMspAdminMessage();
                }
                else
                {
                    ShowError(errorMsg);
                }
            }
        }
        catch (Exception ex)
        {
            ShowError($"Error: {ex.Message}");
        }
        finally
        {
            _isLoading = false;
            _loginButton.Text = "Sign In";
            _loginButton.Enabled = true;
        }
    }

    private void ShowError(string message)
    {
        _errorLabel.Text = message;
        _errorLabel.Visible = true;
    }

    private void ShowMspAdminMessage()
    {
        var result = MessageBox.Show(
            "This is an MSP administrator account.\n\n" +
            "The Customer Portal is for your end-user clients. " +
            "As an MSP admin, please use the Vanguard dashboard instead.\n\n" +
            "Would you like to open the dashboard now?",
            "Administrator Account Detected",
            MessageBoxButtons.YesNo,
            MessageBoxIcon.Information
        );

        if (result == DialogResult.Yes)
        {
            System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
            {
                FileName = "https://ultriumai.com/vanguard",
                UseShellExecute = true
            });
        }
    }
}
