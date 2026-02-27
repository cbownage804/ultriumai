/**
 * usePreviewServiceWorker — Gap 4 + Gap 5 (HMR)
 * 
 * Manages the preview Service Worker lifecycle.
 * DISABLED for srcdoc previews — SW cannot control sandboxed iframes.
 * Returns no-op state when useSrcdoc is true (default).
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const PREVIEW_PATH = '/__preview__/index.html';

const noop = () => {};

export interface PreviewSWState {
  /** Whether the SW is ready to serve content */
  isReady: boolean;
  /** The URL to use as iframe src (or null if SW unavailable — use srcdoc fallback) */
  previewUrl: string | null;
  /** Send new compiled HTML to the SW */
  updatePreview: (html: string, options?: { softReload?: boolean }) => void;
  /** Force the iframe to reload from the SW */
  refreshPreview: () => void;
  /** Current content version */
  version: number;
  /** Trigger a soft reload of the iframe (preserves scroll/form state) */
  softReload: (iframeRef: React.RefObject<HTMLIFrameElement | null>) => void;
}

/** No-op state returned when SW is disabled (srcdoc mode) */
const DISABLED_STATE: PreviewSWState = {
  isReady: false,
  previewUrl: null,
  updatePreview: noop,
  refreshPreview: noop,
  version: 0,
  softReload: noop,
};

export function usePreviewServiceWorker(options?: { useSrcdoc?: boolean }): PreviewSWState {
  const useSrcdoc = options?.useSrcdoc ?? true;

  const [isReady, setIsReady] = useState(false);
  const [version, setVersion] = useState(0);
  const swRef = useRef<ServiceWorker | null>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  // ── Guard: skip SW entirely for srcdoc previews ──
  useEffect(() => {
    if (useSrcdoc) return;
    if (!('serviceWorker' in navigator)) {
      console.info('[PreviewSW] Service Workers not supported — using srcdoc fallback');
      return;
    }

    let cancelled = false;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/preview-sw.js', {
          scope: '/__preview__/',
        });
        
        if (cancelled) return;
        registrationRef.current = registration;

        const sw = registration.active || registration.installing || registration.waiting;
        if (sw) {
          if (sw.state === 'activated') {
            swRef.current = sw;
            setIsReady(true);
            console.info('[PreviewSW] Service Worker ready');
          } else {
            sw.addEventListener('statechange', () => {
              if (sw.state === 'activated' && !cancelled) {
                swRef.current = sw;
                setIsReady(true);
                console.info('[PreviewSW] Service Worker activated');
              }
            });
          }
        }

        registration.addEventListener('updatefound', () => {
          const newSw = registration.installing;
          if (newSw) {
            newSw.addEventListener('statechange', () => {
              if (newSw.state === 'activated' && !cancelled) {
                swRef.current = newSw;
                setIsReady(true);
              }
            });
          }
        });
      } catch (err) {
        console.warn('[PreviewSW] Registration failed — using srcdoc fallback:', err);
      }
    };

    register();

    const messageHandler = (event: MessageEvent) => {
      if (event.data?.type === 'PREVIEW_UPDATED') {
        setVersion(event.data.version);
      }
    };
    navigator.serviceWorker.addEventListener('message', messageHandler);

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener('message', messageHandler);
    };
  }, [useSrcdoc]);

  const updatePreview = useCallback((html: string, _options?: { softReload?: boolean }) => {
    if (useSrcdoc) return; // no-op in srcdoc mode
    const sw = swRef.current || navigator.serviceWorker?.controller;
    if (!sw) return;
    
    const newVersion = Date.now();
    sw.postMessage({ 
      type: 'UPDATE_PREVIEW', 
      html, 
      version: newVersion,
      softReload: !!_options?.softReload,
    });
    setVersion(newVersion);
  }, [useSrcdoc]);

  const refreshPreview = useCallback(() => {
    if (useSrcdoc) return;
    setVersion(Date.now());
  }, [useSrcdoc]);

  const doSoftReload = useCallback((_iframeRef: React.RefObject<HTMLIFrameElement | null>) => {
    if (useSrcdoc) return; // no-op — caller handles srcdoc reload
  }, [useSrcdoc]);

  // Return disabled state for srcdoc mode
  if (useSrcdoc) return DISABLED_STATE;

  return {
    isReady,
    previewUrl: isReady ? PREVIEW_PATH : null,
    updatePreview,
    refreshPreview,
    version,
    softReload: doSoftReload,
  };
}
