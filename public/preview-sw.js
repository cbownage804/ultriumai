/**
 * Preview Service Worker — Gap 4 + Gap 5 (HMR)
 * 
 * Intercepts fetch requests under /__preview__/ scope and serves
 * compiled HTML from an in-memory store. Supports state-preserving
 * soft reloads for JS/TS changes (Gap 5 HMR).
 */

const PREVIEW_SCOPE = '/__preview__/';
let currentHTML = '';
let currentVersion = 0;

// Listen for HTML updates from the main thread
self.addEventListener('message', (event) => {
  const { type, html, version, softReload } = event.data || {};
  
  if (type === 'UPDATE_PREVIEW') {
    currentHTML = html || '';
    currentVersion = version || Date.now();
    
    // Notify all clients that new content is available
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ 
          type: 'PREVIEW_UPDATED', 
          version: currentVersion,
          softReload: !!softReload,
        });
      });
    });
  }
  
  if (type === 'PING') {
    event.source?.postMessage({ type: 'PONG', hasContent: !!currentHTML, version: currentVersion });
  }
});

// Intercept fetch requests under the preview scope
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only intercept requests under /__preview__/
  if (!url.pathname.startsWith(PREVIEW_SCOPE)) return;
  
  const subPath = url.pathname.slice(PREVIEW_SCOPE.length);
  
  // Serve the main preview page
  if (!subPath || subPath === 'index.html') {
    event.respondWith(
      new Response(currentHTML || fallbackHTML(), {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Preview-Version': String(currentVersion),
        },
      })
    );
    return;
  }
  
  // For any other paths under /__preview__/, return 404
  event.respondWith(
    new Response('Not Found', { status: 404, headers: { 'Content-Type': 'text/plain' } })
  );
});

// Activate immediately — take control of all matching clients
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

function fallbackHTML() {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
  body { display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;
         font-family: system-ui; background: #0a0a12; color: #888; }
  .loader { text-align: center; }
  .spinner { width: 24px; height: 24px; border: 2px solid #8882; border-top-color: #888;
             border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 12px; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style></head><body>
  <div class="loader"><div class="spinner"></div><p style="font-size:13px">Waiting for preview...</p></div>
</body></html>`;
}
