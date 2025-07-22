using System;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace SafeTray.Services
{
    public class ToastService : IDisposable
    {
        private NotifyIcon? _toastIcon;

        public void Show(string title, string text, Action? onClick = null)
        {
            try
            {
                // Create a temporary notify icon for the toast
                _toastIcon = new NotifyIcon
                {
                    Visible = true,
                    Icon = System.Drawing.SystemIcons.Information,
                    BalloonTipTitle = title,
                    BalloonTipText = text,
                    BalloonTipIcon = ToolTipIcon.Info
                };

                if (onClick != null)
                {
                    _toastIcon.BalloonTipClicked += (_, __) => onClick();
                }

                _toastIcon.ShowBalloonTip(5000);

                // Dispose after 6 seconds
                Task.Delay(6000).ContinueWith(_ => 
                {
                    _toastIcon?.Dispose();
                    _toastIcon = null;
                });
            }
            catch
            {
                // Fail silently for toast notifications
            }
        }

        public void Dispose()
        {
            _toastIcon?.Dispose();
        }
    }
}