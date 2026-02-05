using System;
using System.Windows.Forms;

namespace VanguardInstaller
{
    static class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            
            try
            {
                // Check for embedded config or command line args
                var installer = new InstallerEngine();
                
                // Try to load embedded config first
                if (!installer.LoadEmbeddedConfig())
                {
                    // If no embedded config, show error
                    MessageBox.Show(
                        "This installer is not configured. Please download a pre-configured installer from your Vanguard dashboard.",
                        "Configuration Required",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Warning
                    );
                    return;
                }
                
                // Run the installation with GUI
                Application.Run(new InstallerForm(installer));
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    $"Installer error: {ex.Message}",
                    "Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
            }
        }
    }
}
