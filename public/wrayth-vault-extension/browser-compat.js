// Wrayth browser-compat helpers
// Detects the host browser and exposes safe wrappers around APIs that differ
// between Chromium and Firefox. Import via <script src="browser-compat.js"> in
// HTML pages, or `importScripts('browser-compat.js')` in classic workers.
// In MV3 module workers, use dynamic import or inline the guards.
(function (root) {
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
  const isFirefox = /Firefox\//.test(ua) || (typeof browser !== 'undefined' && !!browser.runtime && typeof chrome !== 'undefined' && chrome !== browser);
  const isEdge = /Edg\//.test(ua);
  const isChrome = !isFirefox && !isEdge && /Chrome\//.test(ua);

  const api = (typeof chrome !== 'undefined' ? chrome : (typeof browser !== 'undefined' ? browser : {}));

  const WraythBrowser = {
    isFirefox,
    isChrome,
    isEdge,
    isChromium: !isFirefox,
    name: isFirefox ? 'firefox' : isEdge ? 'edge' : isChrome ? 'chrome' : 'chromium',

    hasSidePanel: !!(api && api.sidePanel && typeof api.sidePanel.open === 'function'),
    hasSidebarAction: !!(api && api.sidebarAction && typeof api.sidebarAction.open === 'function'),
    hasOpenPopup: !!(api && api.action && typeof api.action.openPopup === 'function'),

    async openSidePanel(windowId) {
      try {
        if (this.hasSidePanel && windowId != null) {
          await api.sidePanel.open({ windowId });
          return true;
        }
        if (this.hasSidebarAction) {
          await api.sidebarAction.open();
          return true;
        }
      } catch (_) { /* swallow */ }
      return false;
    },

    openPopup() {
      try {
        if (this.hasOpenPopup) { api.action.openPopup(); return true; }
      } catch (_) {}
      return false;
    },
  };

  root.WraythBrowser = WraythBrowser;
})(typeof self !== 'undefined' ? self : this);
