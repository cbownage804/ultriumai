using System;
using System.Windows.Forms;
using VanguardPortal.Forms;

namespace VanguardPortal;

static class Program
{
    [STAThread]
    static void Main(string[] args)
    {
        Application.SetHighDpiMode(HighDpiMode.SystemAware);
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        
        // Check for config file
        var configPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "config.json");
        if (!File.Exists(configPath))
        {
            MessageBox.Show(
                "Configuration file not found. Please ensure config.json is in the same directory as the application.",
                "Configuration Error",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error
            );
            return;
        }

        Application.Run(new PortalTrayContext());
    }
}
