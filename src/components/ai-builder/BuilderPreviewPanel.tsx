import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import {
  RefreshCw,
  ArrowLeft, ArrowRight, Lock, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import previewBgNeon from '@/assets/preview-bg-neon.jpg';
import { VisualEditOverlay } from './VisualEditOverlay';
interface PreviewError {
  id: string;
  message: string;
  source?: string;
  line?: number;
  timestamp: Date;
  type: 'error' | 'warning';
  fixAttempts?: number;
}
import { ResponsivePreviewBar, type ViewportMode, getViewportWidth } from './ResponsivePreviewBar';
import { SkeletonPreview } from './SkeletonPreview';
import { CompilationProgress } from './CompilationProgress';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import { usePreviewServiceWorker } from '@/hooks/usePreviewServiceWorker';

interface BuilderPreviewPanelProps {
  html: string | null;
  compileState?: 'idle' | 'compiling' | 'success' | 'error';
  showConsole?: boolean;
  isGenerating: boolean;
  onFixError?: (errorMessage: string) => void;
  onSmartFixError?: (error: PreviewError, context: string) => void;
  onAIEditRequest?: (selector: string, elementContext: string, prompt: string) => void;
  isProcessingAIEdit?: boolean;
  projectFiles?: ProjectFile[];
  isStreamingPreview?: boolean;
  completedFileCount?: number;
  children?: React.ReactNode;
  onErrorUpdate?: (errors: PreviewError[]) => void;
  fixAttemptCount?: number;
  maxFixAttempts?: number;
  isVisualEditActive?: boolean;
  onToggleVisualEdit?: () => void;
  onVisualEdit?: (selector: string, property: string, value: string) => void;
  /** Called when a new error is detected — for auto-fix pipeline */
  onAutoFixError?: (error: PreviewError) => void;
  /** External iframe ref for hot-patching */
  externalIframeRef?: React.RefObject<HTMLIFrameElement | null>;
  /** External viewport mode control */
  externalViewportMode?: ViewportMode;
  onExternalViewportChange?: (mode: ViewportMode) => void;
  /** Called when user wants to regenerate after exhausted fix attempts */
  onStartOver?: () => void;
  /** Called when the preview URL changes (for syncing with parent) */
  onUrlChange?: (url: string) => void;
  /** When true, health checks are paused (iframe expected blank during compilation) */
  isCompiling?: boolean;
  /** Forces iframe remount (e.g. on tab return) without triggering recompilation */
  refreshKey?: number;
  /** Transactional build: repair failed terminal state */
  repairFailed?: boolean;
  repairErrors?: { file: string; message: string }[];
  onRetryRepair?: () => void;
  onDiscardChanges?: () => void;
  /** Compile error info from state machine */
  compileError?: { message: string; errors: string[] } | null;
  onRetryCompile?: () => void;
  /** Whether this is a brand-new project with no user-generated files */
  isGoldenProject?: boolean;
  /** Reset to golden template */
  onResetToGolden?: () => void;
  /** Whether the preview is showing LKG fallback instead of latest */
  isUsingLKG?: boolean;
  /** Auto-heal summary info */
  autoHealSummary?: { attempts: number; maxAttempts: number; lastError?: string; resolved: boolean } | null;
}
/**
 * Externalize ONLY risky inline <script> blocks into JS Blob URLs.
 *
 * Why selective? Fully externalizing every inline script changes module-base
 * resolution to blob: URLs, which can break relative imports and produce
 * a black/blank preview. We now keep normal scripts inline and only
 * externalize when the script body itself contains a literal "</script"
 * sequence that would break HTML parsing.
 */
function externalizeModuleScript(html: string): { html: string; jsBlobUrls: string[] } {
  const jsBlobUrls: string[] = [];
  const lower = html.toLowerCase();
  let out = '';
  let cursor = 0;

  while (cursor < html.length) {
    const scriptStart = lower.indexOf('<script', cursor);
    if (scriptStart === -1) {
      out += html.slice(cursor);
      break;
    }

    out += html.slice(cursor, scriptStart);

    const tagEnd = html.indexOf('>', scriptStart);
    if (tagEnd === -1) {
      out += html.slice(scriptStart);
      break;
    }

    const openTag = html.slice(scriptStart, tagEnd + 1);
    const hasSrc = /\bsrc\s*=\s*['"][^'"]*['"]/i.test(openTag);

    const contentStart = tagEnd + 1;
    const closeStart = findRealScriptClose(html, contentStart);
    if (closeStart === -1) {
      // Malformed HTML; pass through remaining content untouched.
      out += html.slice(scriptStart);
      break;
    }

    const closeEnd = html.indexOf('>', closeStart);
    if (closeEnd === -1) {
      out += html.slice(scriptStart);
      break;
    }

    const scriptBody = html.slice(contentStart, closeStart);
    const closeTag = html.slice(closeStart, closeEnd + 1);

    // Keep normal scripts inline so module-base URLs remain stable.
    const isRiskyInlineScript = !hasSrc && /<\/script/i.test(scriptBody);
    if (!isRiskyInlineScript) {
      out += openTag + scriptBody + closeTag;
      cursor = closeEnd + 1;
      continue;
    }

    const jsBlob = new Blob([scriptBody], { type: 'text/javascript' });
    const jsUrl = URL.createObjectURL(jsBlob);
    jsBlobUrls.push(jsUrl);

    // Preserve existing attributes (type/nomodule/etc.), append src.
    let openNoGt = openTag.slice(0, -1).trimEnd();
    if (openNoGt.endsWith('/')) openNoGt = openNoGt.slice(0, -1).trimEnd();
    out += `${openNoGt} src="${jsUrl}"></script>`;

    cursor = closeEnd + 1;
  }

  return { html: out, jsBlobUrls };
}

function findRealScriptClose(html: string, start: number): number {
  let i = start;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escaped = false;

  while (i < html.length) {
    const ch = html[i];
    const next = html[i + 1] || '';

    if (inLineComment) {
      if (ch === '\n' || ch === '\r') inLineComment = false;
      i++;
      continue;
    }

    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i += 2;
      } else {
        i++;
      }
      continue;
    }

    if (inSingle) {
      if (!escaped && ch === "'") inSingle = false;
      escaped = !escaped && ch === '\\';
      i++;
      continue;
    }

    if (inDouble) {
      if (!escaped && ch === '"') inDouble = false;
      escaped = !escaped && ch === '\\';
      i++;
      continue;
    }

    if (inTemplate) {
      if (!escaped && ch === '`') inTemplate = false;
      escaped = !escaped && ch === '\\';
      i++;
      continue;
    }

    // Outside strings/comments
    escaped = false;

    if (ch === '/' && next === '/') {
      inLineComment = true;
      i += 2;
      continue;
    }
    if (ch === '/' && next === '*') {
      inBlockComment = true;
      i += 2;
      continue;
    }
    if (ch === "'") {
      inSingle = true;
      i++;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      i++;
      continue;
    }
    if (ch === '`') {
      inTemplate = true;
      i++;
      continue;
    }

    if (html.slice(i, i + 9).toLowerCase() === '</script>') {
      return i;
    }

    i++;
  }

  return -1;
}

export function BuilderPreviewPanel({ html, compileState = 'idle', showConsole = false, isGenerating, onFixError, onSmartFixError, onAIEditRequest, isProcessingAIEdit, projectFiles, isStreamingPreview, completedFileCount, children, fixAttemptCount, maxFixAttempts, isVisualEditActive: externalVisualEdit, onToggleVisualEdit: externalToggleVisualEdit, onVisualEdit, onAutoFixError, externalIframeRef, externalViewportMode, onExternalViewportChange, onStartOver, onUrlChange, isCompiling, refreshKey, repairFailed, repairErrors, onRetryRepair, onDiscardChanges, compileError, onRetryCompile, isGoldenProject, onResetToGolden, isUsingLKG, autoHealSummary }: BuilderPreviewPanelProps) {
  const [internalViewportMode, setInternalViewportMode] = useState<ViewportMode>('desktop');
  const viewportMode = externalViewportMode ?? internalViewportMode;
  const setViewportMode = onExternalViewportChange ?? setInternalViewportMode;
  const [iframeKey, setIframeKey] = useState(0);

  // Sandpack compiles internally — no need to remount on external compile state changes.
  // Only remount on explicit refreshKey change (user-triggered refresh).
  const [errors, setErrors] = useState<PreviewError[]>([]);
  const [currentUrl, setCurrentUrl] = useState('/');
  const [urlHistory, setUrlHistory] = useState<string[]>(['/']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isUrlEditing, setIsUrlEditing] = useState(false);
  const [urlDraft, setUrlDraft] = useState('/');
  const [showRouteDropdown, setShowRouteDropdown] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const internalIframeRef = useRef<HTMLIFrameElement>(null);
  const iframeRef = externalIframeRef || internalIframeRef;

  // Gap 4: Service Worker preview — real browsing context
  const { isReady: swReady, previewUrl, updatePreview, version: swVersion, softReload: swSoftReload } = usePreviewServiceWorker();

  const [isLandscape, setIsLandscape] = useState(false);
  const [customWidth, setCustomWidth] = useState(400);
  const [customHeight, setCustomHeight] = useState(700);
  const viewportWidth = getViewportWidth(viewportMode, customWidth, isLandscape);

  // Phase 4: Never remount iframe on HTML content changes.
  // Browser handles srcdoc updates natively — no need to force remount via key.
  // iframeKey only changes from: user Refresh button, health check recovery, refreshKey prop.
  const prevHtmlRef = useRef<string | null>(null);
  const hasEverHadHtmlRef = useRef(false);
  const lastGoodPreviewHtmlRef = useRef<string | null>(null);
  useEffect(() => {
    if (html) hasEverHadHtmlRef.current = true;
    prevHtmlRef.current = html;
  }, [html]);


  // Phase 69: Skip double console injection when compiler already injected interceptors
  // Only inject hot-patch listener and navigation guards (no console/error interceptors)
  // Ensure html is always a full document — wrap if compiler returned JS-only or partial
  const ensureFullDocument = useCallback((rawHtml: string): string => {
    const trimmed = rawHtml.trim();
    // Already a full document
    if (/<!doctype|<html/i.test(trimmed)) {
      return rawHtml;
    }
    // Looks like just JS code — wrap in full document
    console.warn('[PreviewPanel] HTML missing doctype — wrapping as full document');
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module">
      ${rawHtml}
    </script>
  </body>
</html>`;
  }, []);

  const normalizedHtml = html ? ensureFullDocument(html) : null;

  // Debug: log actual HTML length to diagnose blank previews
  useEffect(() => {
    console.info('[PreviewPanel] html prop updated:', {
      htmlLength: html?.length ?? 0,
      normalizedLength: normalizedHtml?.length ?? 0,
      hasDoctype: normalizedHtml ? /<!doctype|<html/i.test(normalizedHtml) : false,
      hasMount: normalizedHtml ? /id\s*=\s*["'](root|app)["']/i.test(normalizedHtml) : false,
      isCompiling,
      compileError: compileError?.message ?? null,
    });
  }, [html, normalizedHtml, isCompiling, compileError]);

  const htmlWithInjections = normalizedHtml ? (
    normalizedHtml.includes('__builderInjected')
      ? normalizedHtml.replace(
          '</head>',
          `<script>
// === WEBSOCKET SUPPRESSION: Block Vite HMR websockets inherited from parent origin ===
var __wsBlockCount = 0;
var OrigWebSocket = window.WebSocket;
window.WebSocket = function(url, protocols) {
  var urlStr = String(url || '');
  if (/vite|hmr|__vite|hot-update|localhost:\d{4}/i.test(urlStr)) {
    __wsBlockCount++;
    if (__wsBlockCount <= 5) {
      console.info('[Preview] Blocked inherited HMR websocket (' + __wsBlockCount + '/5): ' + urlStr);
    }
    var dummy = { readyState: 3, send: function(){}, close: function(){},
                  addEventListener: function(){}, removeEventListener: function(){},
                  dispatchEvent: function(){ return false; },
                  onopen: null, onclose: null, onerror: null, onmessage: null,
                  CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3,
                  url: urlStr, protocol: '', extensions: '', bufferedAmount: 0, binaryType: 'blob' };
    return dummy;
  }
  if (protocols !== undefined) return new OrigWebSocket(url, protocols);
  return new OrigWebSocket(url);
};
window.WebSocket.prototype = OrigWebSocket.prototype;
window.WebSocket.CONNECTING = 0;
window.WebSocket.OPEN = 1;
window.WebSocket.CLOSING = 2;
window.WebSocket.CLOSED = 3;
// === LIVE PREVIEW HOT-PATCH LISTENER ===
window.addEventListener('message', function(e) {
  if (!e.data || e.data.type !== '__LIVE_PATCH__') return;
  var patches = e.data.patches || [];
  for (var i = 0; i < patches.length; i++) {
    var p = patches[i];
    if (p.kind === 'css') {
      var styleId = '__hotcss_' + p.path.replace(/[^a-z0-9]/gi, '_');
      var existing = document.getElementById(styleId);
      if (existing) { existing.textContent = p.content; }
      else { var style = document.createElement('style'); style.id = styleId; style.textContent = p.content; document.head.appendChild(style); }
    } else if (p.kind === 'html-body') { document.body.innerHTML = p.content; }
  }
  window.parent.postMessage({ type: '__LIVE_PATCH_ACK__', count: patches.length }, '*');
});
// Phase 20: Capture unhandled promise rejections (also in __builderInjected path)
window.addEventListener('unhandledrejection', function(e) {
  window.parent.postMessage({ type: '__PREVIEW_ERROR__', message: 'Unhandled Promise: ' + (e.reason?.message || e.reason || 'Unknown'), source: '', line: 0, critical: false }, '*');
});
// === IFRAME NAVIGATION GUARD ===
document.addEventListener('click', function(e) {
  var anchor = e.target.closest ? e.target.closest('a') : null;
  if (!anchor) return;
  var href = anchor.getAttribute('href');
  if (!href) return;
  if (href.startsWith('javascript:') || href.startsWith('blob:') || href.startsWith('data:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
  if (href.startsWith('#')) { e.preventDefault(); try { var target = document.querySelector(href); if (target) target.scrollIntoView({ behavior: 'smooth' }); } catch(err) {} return; }
  e.preventDefault();
  window.parent.postMessage({ type: '__PREVIEW_NAV__', href: href }, '*');
});
document.addEventListener('submit', function(e) { var form = e.target; if (form && form.tagName === 'FORM' && form.getAttribute('action')) { e.preventDefault(); } });
window.open = function(url) { window.parent.postMessage({ type: '__PREVIEW_NAV__', href: url, newTab: true }, '*'); return null; };
// === HMR STATE PRESERVATION (Gap 5) ===
window.addEventListener('message', function(e) {
  if (!e.data || e.data.type !== '__SAVE_STATE_FOR_HMR__') return;
  try {
    var state = { scrollX: window.scrollX, scrollY: window.scrollY, inputs: [], openDetails: [] };
    document.querySelectorAll('input, textarea, select').forEach(function(el, i) {
      var sel = el.id ? '#' + el.id : (el.name ? '[name="' + el.name + '"]' : el.tagName.toLowerCase() + ':nth-of-type(' + (i+1) + ')');
      if (el.type === 'checkbox' || el.type === 'radio') { state.inputs.push({ selector: sel, type: el.type, checked: el.checked }); }
      else { state.inputs.push({ selector: sel, type: el.type || 'text', value: el.value }); }
    });
    document.querySelectorAll('details[open]').forEach(function(el, i) {
      state.openDetails.push(el.id ? '#' + el.id : 'details:nth-of-type(' + (i+1) + ')');
    });
    sessionStorage.setItem('__hmr_state__', JSON.stringify(state));
  } catch(err) {}
});
</script>
</head>`
        )
      : normalizedHtml.replace(
          '</head>',
          `<script>
// === WEBSOCKET SUPPRESSION: Block Vite HMR websockets inherited from parent origin ===
var __wsBlockCount = 0;
var OrigWebSocket = window.WebSocket;
window.WebSocket = function(url, protocols) {
  var urlStr = String(url || '');
  if (/vite|hmr|__vite|hot-update|localhost:\d{4}/i.test(urlStr)) {
    __wsBlockCount++;
    if (__wsBlockCount <= 5) {
      console.info('[Preview] Blocked inherited HMR websocket (' + __wsBlockCount + '/5): ' + urlStr);
    }
    var dummy = { readyState: 3, send: function(){}, close: function(){},
                  addEventListener: function(){}, removeEventListener: function(){},
                  dispatchEvent: function(){ return false; },
                  onopen: null, onclose: null, onerror: null, onmessage: null,
                  CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3,
                  url: urlStr, protocol: '', extensions: '', bufferedAmount: 0, binaryType: 'blob' };
    return dummy;
  }
  if (protocols !== undefined) return new OrigWebSocket(url, protocols);
  return new OrigWebSocket(url);
};
window.WebSocket.prototype = OrigWebSocket.prototype;
window.WebSocket.CONNECTING = 0;
window.WebSocket.OPEN = 1;
window.WebSocket.CLOSING = 2;
window.WebSocket.CLOSED = 3;
window.addEventListener('error', function(e) {
  window.parent.postMessage({ type: '__PREVIEW_ERROR__', message: e.message, source: e.filename, line: e.lineno, col: e.colno }, '*');
});
window.addEventListener('message', function(e) {
  if (!e.data || e.data.type !== '__LIVE_PATCH__') return;
  var patches = e.data.patches || [];
  for (var i = 0; i < patches.length; i++) {
    var p = patches[i];
    if (p.kind === 'css') {
      var styleId = '__hotcss_' + p.path.replace(/[^a-z0-9]/gi, '_');
      var existing = document.getElementById(styleId);
      if (existing) { existing.textContent = p.content; }
      else { var style = document.createElement('style'); style.id = styleId; style.textContent = p.content; document.head.appendChild(style); }
    } else if (p.kind === 'html-body') { document.body.innerHTML = p.content; }
  }
  window.parent.postMessage({ type: '__LIVE_PATCH_ACK__', count: patches.length }, '*');
});
window.addEventListener('unhandledrejection', function(e) {
  window.parent.postMessage({ type: '__PREVIEW_ERROR__', message: 'Unhandled Promise: ' + (e.reason?.message || e.reason || 'Unknown'), source: '', line: 0 }, '*');
});
['log','info','warn','error'].forEach(function(level) {
  var orig = console[level];
  console[level] = function() {
    var msg = Array.from(arguments).map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
    window.parent.postMessage({ type: '__CONSOLE_LOG__', level: level, message: msg, source: 'console.' + level, line: 0 }, '*');
    if (level === 'error' || level === 'warn') {
      window.parent.postMessage({ type: '__PREVIEW_ERROR__', message: msg, source: 'console.' + level, line: 0, isWarning: level === 'warn' }, '*');
    }
    orig.apply(console, arguments);
  };
});
document.addEventListener('click', function(e) {
  var anchor = e.target.closest ? e.target.closest('a') : null;
  if (!anchor) return;
  var href = anchor.getAttribute('href');
  if (!href) return;
  if (href.startsWith('javascript:') || href.startsWith('blob:') || href.startsWith('data:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
  if (href.startsWith('#')) { e.preventDefault(); try { var target = document.querySelector(href); if (target) target.scrollIntoView({ behavior: 'smooth' }); } catch(err) {} return; }
  e.preventDefault();
  window.parent.postMessage({ type: '__PREVIEW_NAV__', href: href }, '*');
});
document.addEventListener('submit', function(e) { var form = e.target; if (form && form.tagName === 'FORM' && form.getAttribute('action')) { e.preventDefault(); } });
window.open = function(url) { window.parent.postMessage({ type: '__PREVIEW_NAV__', href: url, newTab: true }, '*'); return null; };
window.addEventListener('beforeunload', function(e) { /* no-op: prevent iframe from triggering parent leave dialog */ });
(function() {
  var origFetch = window.fetch;
  window.fetch = function() {
    var url = arguments[0]; if (typeof url === 'object' && url.url) url = url.url;
    var method = (arguments[1] && arguments[1].method) || 'GET';
    var start = performance.now();
    return origFetch.apply(this, arguments).then(function(resp) {
      var body = ''; try { body = (arguments[1] && arguments[1].body) ? String(arguments[1].body).slice(0, 500) : ''; } catch(e){}
      window.parent.postMessage({ type: '__NETWORK_LOG__', method: method, url: String(url), status: resp.status, duration: Math.round(performance.now() - start), body }, '*');
      return resp;
    }).catch(function(err) {
      window.parent.postMessage({ type: '__NETWORK_LOG__', method: method, url: String(url), status: 0, duration: Math.round(performance.now() - start) }, '*');
      throw err;
    });
  };
})();
// === HMR STATE PRESERVATION (Gap 5) ===
window.addEventListener('message', function(e) {
  if (!e.data || e.data.type !== '__SAVE_STATE_FOR_HMR__') return;
  try {
    var state = { scrollX: window.scrollX, scrollY: window.scrollY, inputs: [], openDetails: [] };
    document.querySelectorAll('input, textarea, select').forEach(function(el, i) {
      var sel = el.id ? '#' + el.id : (el.name ? '[name="' + el.name + '"]' : el.tagName.toLowerCase() + ':nth-of-type(' + (i+1) + ')');
      if (el.type === 'checkbox' || el.type === 'radio') { state.inputs.push({ selector: sel, type: el.type, checked: el.checked }); }
      else { state.inputs.push({ selector: sel, type: el.type || 'text', value: el.value }); }
    });
    document.querySelectorAll('details[open]').forEach(function(el, i) {
      state.openDetails.push(el.id ? '#' + el.id : 'details:nth-of-type(' + (i+1) + ')');
    });
    sessionStorage.setItem('__hmr_state__', JSON.stringify(state));
  } catch(err) {}
});
</script>
</head>`
        )
  ) : null;

  // === Preview document rendering: externalize inline scripts to avoid </script> parser breakout ===
  const jsBlobUrlsRef = useRef<string[]>([]);
  const htmlWithErrorCapture = htmlWithInjections; // alias for downstream refs

  const previewDocumentHtml = useMemo(() => {
    // Revoke previously externalized JS blobs
    jsBlobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    jsBlobUrlsRef.current = [];

    if (!htmlWithInjections) return null;

    const { html: safeHtml, jsBlobUrls } = externalizeModuleScript(htmlWithInjections);
    jsBlobUrlsRef.current = jsBlobUrls;
    return safeHtml;
  }, [htmlWithInjections]);

  // Hold last good preview: keep showing the previous successful render while compiling/generating
  // Never store fallback/error HTML — only real app renders
  useEffect(() => {
    if (previewDocumentHtml && !previewDocumentHtml.includes('ai-builder-fallback') && !previewDocumentHtml.includes('Compilation Error')) {
      lastGoodPreviewHtmlRef.current = previewDocumentHtml;
    }
  }, [previewDocumentHtml]);

  // The HTML to actually render: current if available, otherwise last good preview
  // Retain last good during: generation, compilation, or compile errors (so the user always sees something)
  // If current HTML is a fallback/error page but we have a real last-good, prefer showing the real one
  const isCurrentFallback = previewDocumentHtml && (previewDocumentHtml.includes('ai-builder-fallback') || previewDocumentHtml.includes('Compilation Error'));
  const effectiveCurrentHtml = isCurrentFallback ? null : previewDocumentHtml;
  const displayHtml = effectiveCurrentHtml ?? (
    lastGoodPreviewHtmlRef.current && (isGenerating || isCompiling || compileState === 'error' || isCurrentFallback)
      ? lastGoodPreviewHtmlRef.current
      : previewDocumentHtml // fall back to whatever we have, including fallback HTML
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      jsBlobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      jsBlobUrlsRef.current = [];
    };
  }, []);

  // Only reload iframe for SUBSEQUENT updates — initial load is handled by src attribute
  // Gap 4: Push compiled HTML to Service Worker (for soft reloads/HMR)
  // Always use srcDoc for rendering — no src switch to avoid race conditions
  const prevSwHtmlRef = useRef<string | null>(null);
  useEffect(() => {
    if (swReady && htmlWithErrorCapture) {
      updatePreview(htmlWithErrorCapture);
      prevSwHtmlRef.current = htmlWithErrorCapture;
    }
  }, [swReady, htmlWithErrorCapture, updatePreview]);

  // Gap 5 HMR: Listen for soft reload signals from CompilationBridge
  // SW is disabled for srcdoc — fall back to full srcdoc update (preserves CSS hot-patch)
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === '__SOFT_RELOAD__') {
        if (htmlWithErrorCapture) {
          console.info('[HMR] Soft reload: remounting iframe via srcDoc update');
          setIframeKey(k => k + 1);
        }
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [htmlWithErrorCapture]);

  // ── Preview Health Monitor (Phase 1C) ──
  const healthCheckRef = useRef<NodeJS.Timeout | null>(null);
  const consecutiveFailsRef = useRef(0);
  const lastGoodHtmlRef = useRef<string | null>(null);
  const lastHealthToastRef = useRef(0);
  // Phase 8: Cap iframe reloads to 2 per compilation cycle
  const reloadCountRef = useRef(0);
  const lastCompilationCycleRef = useRef(0);
  const HEALTH_CHECK_INTERVAL = 2000;
  const MAX_CONSECUTIVE_FAILS = 3;
  const MAX_RELOADS_PER_CYCLE = 2;

  // Track last good HTML for rollback
  useEffect(() => {
    if (html && !isGenerating) {
      lastGoodHtmlRef.current = html;
      // Reset reload counter when we get new good HTML (new compilation cycle)
      reloadCountRef.current = 0;
    }
  }, [html, isGenerating]);

  // Periodic health check
  useEffect(() => {
    if (!html || isGenerating || isCompiling) {
      if (healthCheckRef.current) clearInterval(healthCheckRef.current);
      consecutiveFailsRef.current = 0;
      return;
    }

    // White-screen recovery: periodically check if iframe has content
    healthCheckRef.current = setInterval(() => {
      const iframe = iframeRef.current;
      if (!iframe || isCompiling || isGenerating) return;

      try {
        // Check if iframe has loaded — use contentWindow existence as proxy
        // (contentDocument access throws on cross-origin Blob URLs)
        if (!iframe.contentWindow) {
          consecutiveFailsRef.current++;
        } else {
          // Try to postMessage and listen for response to verify iframe is responsive
          consecutiveFailsRef.current = 0;
          return;
        }
      } catch {
        // SecurityError — iframe is cross-origin, assume it's alive
        consecutiveFailsRef.current = 0;
        return;
      }

      if (consecutiveFailsRef.current >= MAX_CONSECUTIVE_FAILS) {
        // Cap reloads per compilation cycle
        if (reloadCountRef.current >= MAX_RELOADS_PER_CYCLE) {
          console.warn('[HealthCheck] Max reloads reached for this cycle — stopping');
          if (healthCheckRef.current) clearInterval(healthCheckRef.current);
          return;
        }

        console.warn('[HealthCheck] Iframe appears unresponsive — remounting');
        consecutiveFailsRef.current = 0;
        reloadCountRef.current++;
        setIframeKey(k => k + 1);

        // Show a non-intrusive toast (throttled)
        const now = Date.now();
        if (now - lastHealthToastRef.current > 10_000) {
          lastHealthToastRef.current = now;
          toast.info('Preview recovered from a blank state', { duration: 3000 });
        }
      }
    }, HEALTH_CHECK_INTERVAL);

    return () => {
      if (healthCheckRef.current) clearInterval(healthCheckRef.current);
    };
  }, [html, isGenerating, iframeRef, isCompiling]);

  // ── Circuit breaker + session guard ──
  const errorTimestampsRef = useRef<number[]>([]);
  const breakerOpenRef = useRef(false);
  const sessionIdRef = useRef<string>('');
  const listenerAttachedRef = useRef(false);

  const newSessionId = useCallback(() => Math.random().toString(36).slice(2) + Date.now().toString(36), []);

  const injectSessionId = useCallback((htmlStr: string, sid: string): string => {
    const meta = `<meta name="preview-session" content="${sid}">`;
    if (htmlStr.includes('<head>')) return htmlStr.replace('<head>', `<head>${meta}`);
    return `${meta}\n${htmlStr}`;
  }, []);

  const crashPageHtml = useCallback((message: string) => {
    return `<!doctype html><html><head><meta charset="utf-8"></head><body style="font-family:system-ui;padding:24px;background:#111;color:#eee"><h2>⚠️ Preview crashed</h2><p>${message}</p><p style="color:#888">Reverting to last stable build…</p></body></html>`;
  }, []);

  // Store handler in ref so detach/attach work correctly
  const handlerRef = useRef<((e: MessageEvent) => void) | null>(null);

  const detachListener = useCallback(() => {
    if (listenerAttachedRef.current && handlerRef.current) {
      window.removeEventListener('message', handlerRef.current);
      listenerAttachedRef.current = false;
    }
  }, []);

  const attachListener = useCallback(() => {
    if (!listenerAttachedRef.current && handlerRef.current) {
      window.addEventListener('message', handlerRef.current);
      listenerAttachedRef.current = true;
    }
  }, []);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === '__PREVIEW_ERROR__' || e.data?.type === '__PREVIEW_CRITICAL_ERROR__') {
        // Session guard: ignore messages from stale iframes
        const msgSession = e.data?.previewSessionId;
        if (sessionIdRef.current) {
          // Once session guard is active, reject messages without session id or with wrong id
          if (!msgSession || msgSession !== sessionIdRef.current) return;
        }

        // Circuit breaker: track error timestamps
        const now = Date.now();
        const WINDOW_MS = 2000;
        const TRIP_THRESHOLD = 30;
        const arr = errorTimestampsRef.current;
        arr.push(now);
        while (arr.length && arr[0] < now - WINDOW_MS) arr.shift();

        if (!breakerOpenRef.current && arr.length > TRIP_THRESHOLD) {
          breakerOpenRef.current = true;
          console.warn('[PreviewPanel] Circuit breaker TRIPPED — too many errors');

          // Show crash page
          if (iframeRef.current) {
            iframeRef.current.srcdoc = crashPageHtml('Too many errors in a short time.');
          }

          // Detach for cooldown
          detachListener();

          setTimeout(() => {
            breakerOpenRef.current = false;
            errorTimestampsRef.current = [];
            attachListener();
            // Restore LKG
            if (iframeRef.current && previewDocumentHtml) {
              const sid = newSessionId();
              sessionIdRef.current = sid;
              iframeRef.current.srcdoc = injectSessionId(previewDocumentHtml, sid);
            }
          }, 5000);

          return;
        }

        // Normal error handling (existing logic)
        const isForcedCritical = e.data?.type === '__PREVIEW_CRITICAL_ERROR__';
        const msg = e.data.message || '';
        // Filter CSP Report-Only and analytics noise
        const isCSPNoise = /Content Security Policy|connect-src|report-only|__csp_report/i.test(msg);
        const isAnalyticsNoise = /google-analytics|googletagmanager|gtag|fbevents|hotjar/i.test(msg);
        if (isCSPNoise || isAnalyticsNoise) return;

        const isHostDevError = /react.refresh|@react-refresh|preamble was not loaded|@vite\/client|vite\/hmr|devserver_websocket|__vite_|import\.meta\.hot|hmr.*connection|websocket.*vite/i.test(msg);
        if (isHostDevError) return;
        const isNetworkNoise = /Failed to load|ERR_BLOCKED|ERR_CONNECTION|favicon\.ico|404/i.test(msg);
        const isSyntaxError = /SyntaxError|Unexpected token|Unterminated/i.test(msg);
        const isUncaughtException = e.data.source && !e.data.source.includes('console.');
        const isCritical = isForcedCritical || (!isNetworkNoise && (isSyntaxError || isUncaughtException));

        const newError: PreviewError = {
          id: crypto.randomUUID(),
          message: msg,
          source: e.data.source || undefined,
          line: e.data.line || undefined,
          timestamp: new Date(),
          type: e.data.isWarning ? 'warning' : 'error',
        };
        setErrors(prev => {
          if (prev.some(p => p.message === msg && (Date.now() - p.timestamp.getTime()) < 2000)) return prev;
          const updated = [...prev.slice(-19), newError];
          if (!e.data.isWarning && isCritical && onAutoFixError && !isGenerating) {
            setTimeout(() => onAutoFixError(newError), 500);
          }
          return updated;
        });
      }
    };

    handlerRef.current = handler;
    window.addEventListener('message', handler);
    listenerAttachedRef.current = true;

    return () => {
      window.removeEventListener('message', handler);
      listenerAttachedRef.current = false;
    };
  }, [onAutoFixError, isGenerating, previewDocumentHtml, crashPageHtml, detachListener, attachListener, newSessionId, injectSessionId]);

  useEffect(() => {
    if (!htmlWithErrorCapture) {
      // Clear stale runtime errors when preview HTML is absent (e.g. between failed repair attempts)
      if (!isGenerating && !isCompiling) setErrors([]);
      return;
    }
    setErrors([]); setCurrentUrl('/'); setUrlHistory(['/']); setHistoryIndex(0);
    // Phase 36: Reset scroll position on new build
    if (iframeRef.current?.contentWindow) iframeRef.current.contentWindow.scrollTo(0, 0);
    // srcDoc handles rendering — just log for diagnostics
    console.info('[PreviewPanel] HTML updated for srcDoc rendering', {
      htmlLength: htmlWithErrorCapture.length,
      hasDoctype: /<!doctype|<html/i.test(htmlWithErrorCapture),
    });
  }, [htmlWithErrorCapture, isGenerating, isCompiling]);

  // Phase 2: Also clear stale errors when generation completes (isGenerating: true→false)
  const prevIsGeneratingRef = useRef(isGenerating);
  useEffect(() => {
    if (prevIsGeneratingRef.current && !isGenerating) {
      setErrors([]);
    }
    prevIsGeneratingRef.current = isGenerating;
  }, [isGenerating]);

  // Listen for navigation messages from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === '__NAV_CHANGE__' && e.data.url) {
        setCurrentUrl(e.data.url);
        onUrlChange?.(e.data.url);
        setUrlHistory(prev => [...prev.slice(0, historyIndex + 1), e.data.url]);
        setHistoryIndex(prev => prev + 1);
      }
      // Handle blocked navigation attempts — update URL bar to show intent
      if (e.data?.type === '__PREVIEW_NAV__' && e.data.href) {
        const href = e.data.href;
        // For hash links, update the URL bar
        if (href.startsWith('#')) {
          setCurrentUrl('/' + href);
          onUrlChange?.('/' + href);
        } else if (href.startsWith('/')) {
          setCurrentUrl(href);
          onUrlChange?.(href);
          setUrlHistory(prev => [...prev.slice(0, historyIndex + 1), href]);
          setHistoryIndex(prev => prev + 1);
        } else if (href.startsWith('http://') || href.startsWith('https://')) {
          // External URLs — open in a new tab
          window.open(href, '_blank', 'noopener,noreferrer');
        }
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [historyIndex, onUrlChange]);

  // Extract routes from project files for the route dropdown
  const detectedRoutes = useMemo(() => {
    if (!projectFiles || projectFiles.length === 0) return ['/'];
    const routes = new Set<string>(['/']);
    for (const file of projectFiles) {
      // Match React Router <Route path="..." /> patterns
      const routeMatches = file.content.matchAll(/<Route\s[^>]*path=["']([^"']+)["']/g);
      for (const m of routeMatches) {
        const path = m[1];
        if (path && !path.includes(':') && !path.includes('*')) routes.add(path);
      }
      // Match hash-based routes: case '#/about': or '#about'
      const hashMatches = file.content.matchAll(/['"]#\/?([a-zA-Z0-9_/-]+)['"]/g);
      for (const m of hashMatches) {
        routes.add('/#' + m[1]);
      }
      // Match window.location.hash assignments
      const hashAssign = file.content.matchAll(/location\.hash\s*=\s*['"]#?\/?([a-zA-Z0-9_/-]+)['"]/g);
      for (const m of hashAssign) {
        routes.add('/#' + m[1]);
      }
      // Match href="#..." links
      const hrefHash = file.content.matchAll(/href=["']#([a-zA-Z0-9_/-]+)["']/g);
      for (const m of hrefHash) {
        routes.add('/#' + m[1]);
      }
      // Match href="/..." links (non-external)
      const hrefPath = file.content.matchAll(/href=["'](\/[a-zA-Z0-9_/-]*)["']/g);
      for (const m of hrefPath) {
        if (!m[1].startsWith('//')) routes.add(m[1]);
      }
    }
    return Array.from(routes).sort();
  }, [projectFiles]);

  const navigateToRoute = useCallback((route: string) => {
    setCurrentUrl(route);
    onUrlChange?.(route);
    setUrlHistory(prev => [...prev.slice(0, historyIndex + 1), route]);
    setHistoryIndex(prev => prev + 1);
    // Send navigation message to iframe
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: '__NAVIGATE__',
        url: route,
      }, '*');
    }
    setShowRouteDropdown(false);
    setIsUrlEditing(false);
  }, [historyIndex, onUrlChange, iframeRef]);

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < urlHistory.length - 1;

  // Close route dropdown on outside click
  useEffect(() => {
    if (!showRouteDropdown) return;
    const handler = () => setShowRouteDropdown(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showRouteDropdown]);

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-[#0d0d14] relative">
      {children}
      {/* Toolbar */}
      {(html || displayHtml) && (
        <div className="flex flex-col border-b border-white/[0.06] bg-[#0a0a10] shrink-0">
          {/* Address bar — Lovable-style single row */}
          <div className="flex items-center gap-1.5 px-2 h-9">
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => { if (canGoBack) { setHistoryIndex(i => i - 1); setCurrentUrl(urlHistory[historyIndex - 1]); } }}
                disabled={!canGoBack}
                className={cn("h-6 w-6 rounded-md flex items-center justify-center transition-colors", canGoBack ? "text-white/40 hover:text-white/70 hover:bg-white/5" : "text-white/[0.08]")}
              >
                <ArrowLeft className="h-3 w-3" />
              </button>
              <button
                onClick={() => { if (canGoForward) { setHistoryIndex(i => i + 1); setCurrentUrl(urlHistory[historyIndex + 1]); } }}
                disabled={!canGoForward}
                className={cn("h-6 w-6 rounded-md flex items-center justify-center transition-colors", canGoForward ? "text-white/40 hover:text-white/70 hover:bg-white/5" : "text-white/[0.08]")}
              >
                <ArrowRight className="h-3 w-3" />
              </button>
              <button
                onClick={() => setIframeKey(k => k + 1)}
                className="h-6 w-6 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>

            {/* Editable URL bar with route dropdown */}
            <div className="flex-1 relative" onClick={(e) => e.stopPropagation()}>
              <div
                className={cn(
                  "flex items-center gap-1.5 bg-white/[0.04] border rounded-lg h-7 px-2.5 cursor-text transition-colors",
                  isUrlEditing ? "border-cyan-500/40 bg-white/[0.06]" : "border-white/[0.06] hover:border-white/10"
                )}
                onClick={() => {
                  if (!isUrlEditing) {
                    setIsUrlEditing(true);
                    setUrlDraft(currentUrl);
                    setTimeout(() => urlInputRef.current?.select(), 0);
                  }
                }}
              >
                <Lock className="h-2.5 w-2.5 text-emerald-400/60 shrink-0" />
                {isUrlEditing ? (
                  <input
                    ref={urlInputRef}
                    value={urlDraft}
                    onChange={(e) => setUrlDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        navigateToRoute(urlDraft.startsWith('/') ? urlDraft : '/' + urlDraft);
                      } else if (e.key === 'Escape') {
                        setIsUrlEditing(false);
                      }
                    }}
                    onBlur={() => setTimeout(() => setIsUrlEditing(false), 200)}
                    autoFocus
                    className="flex-1 bg-transparent text-[11px] text-white/60 font-mono outline-none min-w-0"
                    spellCheck={false}
                  />
                ) : (
                  <span className="text-[11px] text-white/30 font-mono truncate flex-1">
                    {currentUrl}
                  </span>
                )}
                {detectedRoutes.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRouteDropdown(prev => !prev);
                      setIsUrlEditing(false);
                    }}
                    className="h-4 w-4 rounded flex items-center justify-center text-white/20 hover:text-white/50 transition-colors shrink-0"
                    title={`${detectedRoutes.length} pages detected`}
                  >
                    <ChevronDown className={cn("h-3 w-3 transition-transform", showRouteDropdown && "rotate-180")} />
                  </button>
                )}
              </div>

              {/* Route dropdown */}
              {showRouteDropdown && detectedRoutes.length > 1 && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#12121a] border border-white/[0.08] rounded-lg shadow-2xl overflow-hidden">
                  <div className="px-2.5 py-1.5 text-[9px] text-white/25 uppercase tracking-wider font-medium border-b border-white/[0.06]">
                    Pages ({detectedRoutes.length})
                  </div>
                  <div className="max-h-48 overflow-y-auto py-1">
                    {detectedRoutes.map(route => (
                      <button
                        key={route}
                        onClick={() => navigateToRoute(route)}
                        className={cn(
                          "w-full text-left px-3 py-1.5 text-[11px] font-mono transition-colors",
                          route === currentUrl
                            ? "text-cyan-400 bg-cyan-500/10"
                            : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
                        )}
                      >
                        {route}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right toolbar — responsive only */}
            <div className="flex items-center gap-0.5">
              <ResponsivePreviewBar
                active={viewportMode}
                onChange={setViewportMode}
                customWidth={customWidth}
                customHeight={customHeight}
                onCustomSize={(w, h) => { setCustomWidth(w); setCustomHeight(h); }}
                isLandscape={isLandscape}
                onToggleLandscape={() => setIsLandscape(prev => !prev)}
              />
              {/* Visual Edit toggle */}
              <VisualEditOverlay
                isActive={!!externalVisualEdit}
                onToggle={() => externalToggleVisualEdit?.()}
                onEditApply={(selector, property, value, meta) => {
                  onVisualEdit?.(selector, property, value);
                }}
                onAIEditRequest={onAIEditRequest}
                iframeRef={iframeRef as React.RefObject<HTMLIFrameElement | null>}
                isProcessingAIEdit={isProcessingAIEdit}
              />
            </div>

            {/* Streaming indicator */}
            {(isGenerating || isStreamingPreview) && (
              <div className="flex items-center gap-1.5 text-[10px] text-amber-400/60 shrink-0">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>{isStreamingPreview && completedFileCount ? `${completedFileCount} files` : 'building'}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview */}
      <div className="flex-1 min-h-0 flex items-stretch justify-center bg-[#0a0a10]">
        {displayHtml ? (
          <div
            className={cn(
              "h-full transition-all duration-300 mx-auto relative",
              viewportWidth > 0 ? "shadow-[0_0_0_1px_rgba(255,255,255,0.06)]" : "w-full"
            )}
            style={{
              width: viewportWidth > 0 ? `${viewportWidth}px` : '100%',
              maxWidth: '100%',
            }}
          >
            {/* Device frame chrome for mobile/tablet */}
            {viewportWidth > 0 && viewportWidth <= 834 && (
              <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                <div className={cn(
                  "bg-black/80 rounded-b-lg",
                  viewportWidth <= 430 ? "w-20 h-4" : "w-10 h-3"
                )} />
              </div>
            )}
            <iframe
              ref={iframeRef as React.RefObject<HTMLIFrameElement>}
              key={`iframe-${iframeKey}-${refreshKey ?? 0}`}
              title="App Preview"
              srcDoc={displayHtml}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
              className={cn(
                "w-full h-full border-0 bg-white",
                viewportWidth > 0 && viewportWidth <= 834 && "rounded-lg"
              )}
              style={{ colorScheme: 'light' }}
            />

            {/* LKG fallback banner — subtle, non-blocking */}
            {isUsingLKG && !isGenerating && !isCompiling && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/25 backdrop-blur-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[10px] text-amber-300/80 font-medium">Showing previous working version</span>
              </div>
            )}
          </div>
        ) : compileState === 'error' ? (
          <div className="relative flex flex-col items-center justify-center h-full w-full text-center select-none overflow-hidden">
            <img
              src={previewBgNeon}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-20"
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative z-10 space-y-4 px-6 max-w-md">
              <div className="h-3 w-3 rounded-full bg-red-400 mx-auto animate-pulse" />
              <h3 className="font-semibold text-lg text-red-300/90 tracking-tight">
                Preview failed to compile
              </h3>
              <p className="text-sm text-white/60 leading-relaxed">
                {compileError?.message || 'The latest changes could not be compiled into a preview.'}
              </p>
              {compileError?.errors?.length ? (
                <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-left text-xs text-white/45 max-h-32 overflow-auto">
                  {compileError.errors.slice(0, 4).map((errorLine, index) => (
                    <div key={`${index}-${errorLine}`} className="font-mono leading-relaxed">
                      {errorLine}
                    </div>
                  ))}
                </div>
              ) : null}
              <button
                onClick={onRetryCompile}
                className="px-4 py-2 rounded-lg bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-medium transition-colors"
              >
                <RefreshCw className="h-3 w-3 inline mr-1.5" />
                Retry compile
              </button>
            </div>
          </div>
        ) : (isGenerating || isCompiling) ? (
          <SkeletonPreview
            projectFiles={projectFiles}
            completedFileCount={completedFileCount}
            isGenerating={isGenerating}
            isCompiling={isCompiling}
          />
        ) : projectFiles.length > 0 && !isGoldenProject ? (
          <div className="relative flex flex-col items-center justify-center h-full w-full text-center select-none overflow-hidden">
            <img
              src={previewBgNeon}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-20"
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative z-10 space-y-4 px-6 max-w-md">
              <div className="h-3 w-3 rounded-full bg-amber-400 mx-auto animate-pulse" />
              <h3 className="font-semibold text-lg text-amber-300/90 tracking-tight">
                Preview unavailable
              </h3>
              <p className="text-sm text-white/50 leading-relaxed">
                We have project files, but no compiled preview is available yet.
              </p>
              <button
                onClick={onRetryCompile}
                className="px-4 py-2 rounded-lg bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-medium transition-colors"
              >
                <RefreshCw className="h-3 w-3 inline mr-1.5" />
                Retry compile
              </button>
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col items-center justify-center h-full w-full text-center select-none overflow-hidden">
            <img
              src={previewBgNeon}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-30"
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 space-y-4 px-6">
              <h3 className="font-semibold text-xl text-cyan-300/90 tracking-tight drop-shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                Live Preview
              </h3>
              <p className="text-sm text-white/40 max-w-[300px] mx-auto">
                Describe what you want to build
              </p>
              <p className="text-xs text-white/25 max-w-[260px] mx-auto">
                Pick a template on the left to start, or type a prompt in the chat.
              </p>
            </div>
          </div>
        )}
      </div>


    </div>
  );
}

