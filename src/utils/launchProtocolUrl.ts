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

/**
 * Launch a protocol URL and show a fallback warning after a delay
 * if the app didn't appear to open (page is still visible/focused).
 * 
 * @param url - The protocol URL to launch (e.g. rustdesk://123456)
 * @param onPossibleFailure - Called after ~3s if the page is still focused,
 *                            indicating the protocol handler likely didn't fire.
 */
export function launchProtocolWithFallback(
  url: string,
  onPossibleFailure: () => void,
): void {
  let blurred = false;

  const onBlur = () => { blurred = true; };
  window.addEventListener('blur', onBlur);

  launchProtocolUrl(url);

  // After 3 seconds, if the window never lost focus the protocol handler
  // probably didn't launch an external app.
  setTimeout(() => {
    window.removeEventListener('blur', onBlur);
    if (!blurred && document.visibilityState === 'visible') {
      onPossibleFailure();
    }
  }, 3000);
}
