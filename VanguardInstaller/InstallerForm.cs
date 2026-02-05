using System;
using System.Drawing;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace VanguardInstaller
{
    public class InstallerForm : Form
    {
        private readonly InstallerEngine _engine;
        private Label _titleLabel = null!;
        private Label _subtitleLabel = null!;
        private Label _clientLabel = null!;
        private ProgressBar _progressBar = null!;
        private Label _statusLabel = null!;
        private Button _installButton = null!;
        private Button _closeButton = null!;
        private Panel _headerPanel = null!;
        private PictureBox _logoPictureBox = null!;
        private bool _isInstalling;
        private bool _isComplete;
        
        public InstallerForm(InstallerEngine engine)
        {
            _engine = engine;
            
            _engine.OnProgress += msg => Invoke(() => _statusLabel.Text = msg);
            _engine.OnProgressPercent += pct => Invoke(() => _progressBar.Value = pct);
            _engine.OnError += msg => Invoke(() => ShowError(msg));
            _engine.OnComplete += () => Invoke(() => OnInstallComplete());
            
            InitializeComponent();
        }
        
        private void InitializeComponent()
        {
            // Form settings
            Text = "Ultrium Vanguard Agent";
            Size = new Size(500, 340);
            FormBorderStyle = FormBorderStyle.FixedDialog;
            StartPosition = FormStartPosition.CenterScreen;
            MaximizeBox = false;
            MinimizeBox = true;
            BackColor = Color.White;
            
            // Header panel with gradient-like dark background
            _headerPanel = new Panel
            {
                Dock = DockStyle.Top,
                Height = 80,
                BackColor = Color.FromArgb(30, 30, 30)
            };
            
            _titleLabel = new Label
            {
                Text = "VANGUARD AGENT",
                Font = new Font("Segoe UI", 18, FontStyle.Bold),
                ForeColor = Color.White,
                Location = new Point(24, 16),
                AutoSize = true
            };
            
            _subtitleLabel = new Label
            {
                Text = "Enterprise RMM + XDR Agent",
                Font = new Font("Segoe UI", 10),
                ForeColor = Color.FromArgb(180, 180, 180),
                Location = new Point(26, 48),
                AutoSize = true
            };
            
            _headerPanel.Controls.Add(_titleLabel);
            _headerPanel.Controls.Add(_subtitleLabel);
            
            // Logo on the right side of header
            _logoPictureBox = new PictureBox
            {
                Size = new Size(50, 50),
                Location = new Point(430, 15),
                SizeMode = PictureBoxSizeMode.Zoom,
                BackColor = Color.Transparent
            };
            
            // Try to load the application icon as the logo
            try
            {
                _logoPictureBox.Image = Icon.ExtractAssociatedIcon(Application.ExecutablePath)?.ToBitmap();
            }
            catch
            {
                // If icon extraction fails, create a simple "U" logo
                var bmp = new Bitmap(50, 50);
                using (var g = Graphics.FromImage(bmp))
                {
                    g.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
                    g.Clear(Color.FromArgb(0, 122, 204));
                    using var font = new Font("Segoe UI", 24, FontStyle.Bold);
                    using var brush = new SolidBrush(Color.White);
                    var size = g.MeasureString("U", font);
                    g.DrawString("U", font, brush, (50 - size.Width) / 2, (50 - size.Height) / 2);
                }
                _logoPictureBox.Image = bmp;
            }
            
            _headerPanel.Controls.Add(_logoPictureBox);
            // Client name label
            _clientLabel = new Label
            {
                Text = $"Installing for: {_engine.ClientName}",
                Font = new Font("Segoe UI", 11),
                ForeColor = Color.FromArgb(60, 60, 60),
                Location = new Point(24, 100),
                AutoSize = true
            };
            
            // Progress bar
            _progressBar = new ProgressBar
            {
                Location = new Point(24, 140),
                Size = new Size(435, 28),
                Style = ProgressBarStyle.Continuous,
                Value = 0
            };
            
            // Status label
            _statusLabel = new Label
            {
                Text = "Ready to install",
                Font = new Font("Segoe UI", 10),
                ForeColor = Color.FromArgb(100, 100, 100),
                Location = new Point(24, 176),
                Size = new Size(435, 24)
            };
            
            // Install button
            _installButton = new Button
            {
                Text = "Install",
                Font = new Font("Segoe UI", 11, FontStyle.Bold),
                Location = new Point(260, 240),
                Size = new Size(100, 40),
                BackColor = Color.FromArgb(0, 122, 204),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            _installButton.FlatAppearance.BorderSize = 0;
            _installButton.Click += OnInstallClick;
            
            // Close button
            _closeButton = new Button
            {
                Text = "Cancel",
                Font = new Font("Segoe UI", 10),
                Location = new Point(370, 240),
                Size = new Size(90, 40),
                BackColor = Color.FromArgb(240, 240, 240),
                ForeColor = Color.FromArgb(60, 60, 60),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            _closeButton.FlatAppearance.BorderColor = Color.FromArgb(200, 200, 200);
            _closeButton.Click += (_, _) => Close();
            
            // Add controls
            Controls.Add(_headerPanel);
            Controls.Add(_clientLabel);
            Controls.Add(_progressBar);
            Controls.Add(_statusLabel);
            Controls.Add(_installButton);
            Controls.Add(_closeButton);
        }
        
        private async void OnInstallClick(object? sender, EventArgs e)
        {
            if (_isInstalling) return;
            
            _isInstalling = true;
            _installButton.Enabled = false;
            _installButton.Text = "Installing...";
            _closeButton.Enabled = false;
            
            try
            {
                await _engine.RunInstallation();
            }
            catch (Exception ex)
            {
                ShowError($"Unexpected error: {ex.Message}");
            }
            
            _isInstalling = false;
        }
        
        private void ShowError(string message)
        {
            _statusLabel.Text = "Installation failed";
            _statusLabel.ForeColor = Color.FromArgb(200, 50, 50);
            
            MessageBox.Show(
                message,
                "Installation Error",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error
            );
            
            _installButton.Enabled = true;
            _installButton.Text = "Retry";
            _closeButton.Enabled = true;
        }
        
        private void OnInstallComplete()
        {
            _isComplete = true;
            _statusLabel.Text = "Installation complete!";
            _statusLabel.ForeColor = Color.FromArgb(0, 150, 50);
            
            _installButton.Visible = false;
            _closeButton.Text = "Finish";
            _closeButton.Enabled = true;
            _closeButton.BackColor = Color.FromArgb(0, 150, 50);
            _closeButton.ForeColor = Color.White;
            _closeButton.Size = new Size(100, 40);
            _closeButton.Location = new Point(330, 240);
        }
        
        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            if (_isInstalling)
            {
                var result = MessageBox.Show(
                    "Installation is in progress. Are you sure you want to cancel?",
                    "Cancel Installation",
                    MessageBoxButtons.YesNo,
                    MessageBoxIcon.Warning
                );
                
                if (result == DialogResult.No)
                {
                    e.Cancel = true;
                    return;
                }
            }
            
            base.OnFormClosing(e);
        }
    }
}
