using System;
using System.Drawing;
using System.Windows.Forms;
using VanguardAgent.Services;

namespace VanguardAgent.Forms;

/// <summary>
/// Portal login form for the agent tray
/// </summary>
public class PortalLoginForm : Form
{
    private readonly PortalAuthService _authService;
    private readonly Action<PortalSession> _onLoginSuccess;
    
    private TextBox _emailInput = null!;
    private TextBox _passwordInput = null!;
    private Button _loginButton = null!;
    private Label _errorLabel = null!;
    private Label _statusLabel = null!;
    private bool _isLoading = false;

    public PortalLoginForm(PortalAuthService authService, Action<PortalSession> onLoginSuccess)
    {
        _authService = authService;
        _onLoginSuccess = onLoginSuccess;
        
        InitializeComponent();
    }

    private void InitializeComponent()
    {
        Text = "Portal Login";
        Size = new Size(350, 300);
        StartPosition = FormStartPosition.CenterScreen;
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        MinimizeBox = false;
        BackColor = Color.FromArgb(15, 23, 42);
        
        // Title
        var titleLabel = new Label
        {
            Text = "Customer Portal Login",
            ForeColor = Color.White,
            Font = new Font("Segoe UI", 14, FontStyle.Bold),
            AutoSize = true,
            Location = new Point(30, 25)
        };
        Controls.Add(titleLabel);

        // Email label
        var emailLabel = new Label
        {
            Text = "Email",
            ForeColor = Color.FromArgb(180, 180, 180),
            Font = new Font("Segoe UI", 9),
            Location = new Point(30, 70),
            AutoSize = true
        };
        Controls.Add(emailLabel);

        // Email input
        _emailInput = new TextBox
        {
            Location = new Point(30, 90),
            Size = new Size(270, 30),
            Font = new Font("Segoe UI", 10),
            BackColor = Color.FromArgb(30, 41, 59),
            ForeColor = Color.White,
            BorderStyle = BorderStyle.FixedSingle
        };
        Controls.Add(_emailInput);

        // Password label
        var passwordLabel = new Label
        {
            Text = "Password",
            ForeColor = Color.FromArgb(180, 180, 180),
            Font = new Font("Segoe UI", 9),
            Location = new Point(30, 125),
            AutoSize = true
        };
        Controls.Add(passwordLabel);

        // Password input
        _passwordInput = new TextBox
        {
            Location = new Point(30, 145),
            Size = new Size(270, 30),
            Font = new Font("Segoe UI", 10),
            BackColor = Color.FromArgb(30, 41, 59),
            ForeColor = Color.White,
            BorderStyle = BorderStyle.FixedSingle,
            UseSystemPasswordChar = true
        };
        _passwordInput.KeyDown += (s, e) => { if (e.KeyCode == Keys.Enter) OnLoginClick(s, e); };
        Controls.Add(_passwordInput);

        // Error label
        _errorLabel = new Label
        {
            Text = "",
            ForeColor = Color.FromArgb(248, 113, 113),
            Font = new Font("Segoe UI", 9),
            Location = new Point(30, 180),
            Size = new Size(270, 20),
            Visible = false
        };
        Controls.Add(_errorLabel);

        // Login button
        _loginButton = new Button
        {
            Text = "Sign In",
            Location = new Point(30, 205),
            Size = new Size(270, 38),
            FlatStyle = FlatStyle.Flat,
            BackColor = Color.FromArgb(8, 145, 178),
            ForeColor = Color.White,
            Font = new Font("Segoe UI", 10, FontStyle.Bold),
            Cursor = Cursors.Hand
        };
        _loginButton.FlatAppearance.BorderSize = 0;
        _loginButton.Click += OnLoginClick;
        Controls.Add(_loginButton);

        // Status label
        _statusLabel = new Label
        {
            Text = "Enter your portal credentials",
            ForeColor = Color.FromArgb(140, 140, 140),
            Font = new Font("Segoe UI", 8),
            Location = new Point(30, 250),
            Size = new Size(270, 20),
            TextAlign = ContentAlignment.MiddleCenter
        };
        Controls.Add(_statusLabel);
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
