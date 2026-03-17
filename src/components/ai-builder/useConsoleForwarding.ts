import { useCallback, useEffect, useRef } from 'react';

/**
 * useConsoleForwarding — Captures console.error/warn from the preview iframe
 * and surfaces them in the parent build log panel.
 *
 * Works via postMessage: a small script injected into the iframe intercepts
 * console.error/warn/log and forwards them to the parent window.
 */

export interface ForwardedConsoleEntry {
  level: 'error' | 'warn' | 'log';
  message: string;
  timestamp: number;
  source?: string;
}

/** Script injected into compiled HTML to forward console messages */
const CONSOLE_FORWARDING_SCRIPT = `
<script data-console-forward>
(function(){
  var MAX_MESSAGES = 50;
  var msgCount = 0;
  var origError = console.error;
  var origWarn = console.warn;

  function forward(level, args) {
    if (msgCount >= MAX_MESSAGES) return;
    msgCount++;
    var msg;
    try {
      msg = Array.prototype.map.call(args, function(a) {
        if (a instanceof Error) return a.message + (a.stack ? '\\n' + a.stack.split('\\n').slice(0, 3).join('\\n') : '');
        if (typeof a === 'object') try { return JSON.stringify(a).slice(0, 200); } catch(e) { return String(a); }
        return String(a);
      }).join(' ');
    } catch(e) { msg = 'Error formatting console message'; }

    window.parent.postMessage({
      type: '__CONSOLE_FORWARD__',
      level: level,
      message: msg.slice(0, 500),
      timestamp: Date.now(),
      source: 'preview-iframe'
    }, '*');
  }

  console.error = function() { forward('error', arguments); origError.apply(console, arguments); };
  console.warn = function() { forward('warn', arguments); origWarn.apply(console, arguments); };
})();
</script>`;

export function useConsoleForwarding(
  onEntry?: (entry: ForwardedConsoleEntry) => void,
) {
  const entriesRef = useRef<ForwardedConsoleEntry[]>([]);
  const callbackRef = useRef(onEntry);
  callbackRef.current = onEntry;

  /** Listen for forwarded console messages from the iframe */
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type !== '__CONSOLE_FORWARD__') return;
      if (event.data?.source !== 'preview-iframe') return;

      const entry: ForwardedConsoleEntry = {
        level: event.data.level,
        message: event.data.message,
        timestamp: event.data.timestamp,
      };

      entriesRef.current.push(entry);
      // Cap stored entries
      if (entriesRef.current.length > 100) {
        entriesRef.current = entriesRef.current.slice(-50);
      }

      callbackRef.current?.(entry);
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  /** Inject the console forwarding script into compiled HTML */
  const injectConsoleForwarding = useCallback((html: string): string => {
    if (html.includes('data-console-forward')) return html;
    if (html.includes('ai-builder-fallback') || html.includes('Compilation Error')) return html;

    const headIdx = html.indexOf('<head>');
    if (headIdx !== -1) {
      return html.slice(0, headIdx + 6) + CONSOLE_FORWARDING_SCRIPT + html.slice(headIdx + 6);
    }
    return html;
  }, []);

  const getEntries = useCallback(() => [...entriesRef.current], []);
  const clearEntries = useCallback(() => { entriesRef.current = []; }, []);

  return {
    injectConsoleForwarding,
    getEntries,
    clearEntries,
  };
}
