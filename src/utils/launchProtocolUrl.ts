/**
 * Launch a custom protocol URL (e.g., rustdesk://, anydesk:, teamviewer10://)
 * 
 * This handles the tricky case of launching protocol handlers from inside
 * iframe-sandboxed environments (like Lovable preview). When inside an iframe,
 * we open a new top-level window to trigger the protocol handler.
 */
export function launchProtocolUrl(url: string): void {
  const isInIframe = window !== window.top;

  if (isInIframe) {
    // Inside an iframe: window.location.href and anchor clicks are intercepted.
    // Open a tiny popup window that immediately navigates to the protocol URL.
    // The popup will either launch the app and close, or show the browser's
    // "open app?" dialog.
    const popup = window.open('', '_blank', 'width=1,height=1,left=0,top=0');
    if (popup) {
      popup.location.href = url;
      // Close the empty popup after giving the OS time to handle the protocol
      setTimeout(() => {
        try { popup.close(); } catch (_) { /* cross-origin, ignore */ }
      }, 3000);
    } else {
      // Popup blocked — fall back to direct navigation
      window.location.href = url;
    }
  } else {
    // Not in an iframe: direct navigation works for protocol handlers
    window.location.href = url;
  }
}
