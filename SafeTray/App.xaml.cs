using System;
using System.Windows;
using SafeTray.Services;

namespace SafeTray
{
    public partial class App : Application
    {
        private TrayIconService? _tray;

        protected override void OnStartup(StartupEventArgs e)
        {
            base.OnStartup(e);
            _tray = new TrayIconService();
            _tray.Initialize();
        }

        protected override void OnExit(ExitEventArgs e)
        {
            _tray?.Dispose();
            base.OnExit(e);
        }
    }
}