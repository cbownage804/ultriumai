import { useCallback } from 'react';

/**
 * Step 13: Asset Loading Resilience
 * 
 * Injects a script into compiled HTML that:
 * 1. Catches broken image/asset URLs with onerror handlers
 * 2. Replaces broken images with a graceful placeholder SVG
 * 3. Retries failed asset loads once with cache-busting
 * 4. Reports asset failures via postMessage for the console panel
 */

const ASSET_RESILIENCE_SCRIPT = `
<script>
(function() {
  var PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150">' +
    '<rect fill="#1a1a2e" width="200" height="150" rx="8"/>' +
    '<text x="100" y="70" text-anchor="middle" fill="#ffffff30" font-family="system-ui" font-size="12">Image unavailable</text>' +
    '<path d="M85 90 L100 75 L115 90 L130 70 L145 90" stroke="#ffffff15" fill="none" stroke-width="1.5"/>' +
    '</svg>'
  );
  var retried = new Set();

  function handleError(el) {
    var src = el.getAttribute('src') || el.getAttribute('href') || '';
    if (!src || src === PLACEHOLDER) return;

    // Report to parent
    try {
      window.parent.postMessage({
        type: '__ASSET_ERROR__',
        path: src,
        tagName: el.tagName,
      }, '*');
    } catch(e) {}

    // Retry once with cache-busting
    if (!retried.has(src)) {
      retried.add(src);
      var bust = src + (src.includes('?') ? '&' : '?') + '_r=' + Date.now();
      if (el.tagName === 'IMG') {
        el.src = bust;
      } else if (el.tagName === 'LINK') {
        el.href = bust;
      }
      return;
    }

    // Replace with placeholder
    if (el.tagName === 'IMG') {
      el.src = PLACEHOLDER;
      el.alt = el.alt || 'Image unavailable';
      el.style.opacity = '0.5';
    }
  }

  // Capture errors on existing and future elements
  document.addEventListener('error', function(e) {
    var t = e.target;
    if (t && (t.tagName === 'IMG' || t.tagName === 'LINK' || t.tagName === 'SCRIPT')) {
      handleError(t);
    }
  }, true);
})();
</script>`;

export function useAssetResilience() {
  /**
   * Inject asset resilience script into compiled HTML.
   * Should be called as part of the post-compile injection chain.
   */
  const injectAssetResilience = useCallback((html: string): string => {
    if (!html) return html;
    // Inject before </head> if present, else before </body>
    if (html.includes('</head>')) {
      return html.replace('</head>', ASSET_RESILIENCE_SCRIPT + '</head>');
    }
    if (html.includes('</body>')) {
      return html.replace('</body>', ASSET_RESILIENCE_SCRIPT + '</body>');
    }
    return html + ASSET_RESILIENCE_SCRIPT;
  }, []);

  return { injectAssetResilience };
}
