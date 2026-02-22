/**
 * usePreviewServiceWorker — Gap 4
 * 
 * Manages the preview Service Worker lifecycle:
 * - Registers the SW on mount
 * - Sends compiled HTML to the SW via postMessage
 * - Provides a stable preview URL for the iframe src
 * - Falls back to srcdoc if SW registration fails
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const PREVIEW_PATH = '/__preview__/index.html';

export interface PreviewSWState {
  /** Whether the SW is ready to serve content */
  isReady: boolean;
  /** The URL to use as iframe src (or null if SW unavailable — use srcdoc fallback) */
  previewUrl: string | null;
  /** Send new compiled HTML to the SW */
  updatePreview: (html: string) => void;
  /** Force the iframe to reload from the SW */
  refreshPreview: () => void;
  /** Current content version */
  version: number;
}

export function usePreviewServiceWorker(): PreviewSWState {
  const [isReady, setIsReady] = useState(false);
  const [version, setVersion] = useState(0);
  const swRef = useRef<ServiceWorker | null>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  // Register the Service Worker
  useEffect(() => {
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

        // Wait for the SW to activate
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

        // Listen for updates
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

    // Listen for messages from the SW
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
  }, []);

  const updatePreview = useCallback((html: string) => {
    const sw = swRef.current || navigator.serviceWorker?.controller;
    if (!sw) return;
    
    const newVersion = Date.now();
    sw.postMessage({ type: 'UPDATE_PREVIEW', html, version: newVersion });
    setVersion(newVersion);
  }, []);

  const refreshPreview = useCallback(() => {
    // Bump version to trigger iframe reload
    setVersion(Date.now());
  }, []);

  return {
    isReady,
    previewUrl: isReady ? PREVIEW_PATH : null,
    updatePreview,
    refreshPreview,
    version,
  };
}
