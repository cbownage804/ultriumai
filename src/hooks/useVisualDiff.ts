import { devLog } from '@/lib/logger';
import { useState, useCallback, useRef } from 'react';

/**
 * Wave 16: Visual Diff — Before/After Overlay
 * Captures preview snapshots before and after generation,
 * enabling a slider-based visual comparison.
 */

export interface VisualSnapshot {
  dataUrl: string;
  timestamp: number;
  label: string;
}

export function useVisualDiff() {
  const [beforeSnapshot, setBeforeSnapshot] = useState<VisualSnapshot | null>(null);
  const [afterSnapshot, setAfterSnapshot] = useState<VisualSnapshot | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const captureInProgress = useRef(false);

  /**
   * Capture the current state of the preview iframe as a "before" snapshot.
   * Call this BEFORE sending a generation request.
   */
  const captureBeforeSnapshot = useCallback(async (
    iframeRef: React.RefObject<HTMLIFrameElement | null>,
  ): Promise<boolean> => {
    if (captureInProgress.current || !iframeRef.current) return false;
    captureInProgress.current = true;
    setIsCapturing(true);

    try {
      const iframe = iframeRef.current;
      const html2canvas = (await import('html2canvas')).default;

      let canvas: HTMLCanvasElement;
      try {
        const doc = iframe.contentDocument;
        if (doc?.body) {
          canvas = await html2canvas(doc.body, {
            scale: 0.5,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: iframe.clientWidth,
            height: iframe.clientHeight,
            logging: false,
          });
        } else {
          throw new Error('No content document');
        }
      } catch {
        canvas = await html2canvas(iframe, { scale: 0.5, useCORS: true, allowTaint: true, logging: false });
      }

      const dataUrl = canvas.toDataURL('image/webp', 0.7);
      setBeforeSnapshot({ dataUrl, timestamp: Date.now(), label: 'Before' });
      return true;
    } catch (err) {
      devLog('[VisualDiff] Before capture failed:', err);
      return false;
    } finally {
      captureInProgress.current = false;
      setIsCapturing(false);
    }
  }, []);

  /**
   * Capture the current state as an "after" snapshot.
   * Call this AFTER generation completes and preview renders.
   */
  const captureAfterSnapshot = useCallback(async (
    iframeRef: React.RefObject<HTMLIFrameElement | null>,
  ): Promise<boolean> => {
    if (captureInProgress.current || !iframeRef.current) return false;
    captureInProgress.current = true;
    setIsCapturing(true);

    try {
      const iframe = iframeRef.current;
      const html2canvas = (await import('html2canvas')).default;

      let canvas: HTMLCanvasElement;
      try {
        const doc = iframe.contentDocument;
        if (doc?.body) {
          canvas = await html2canvas(doc.body, {
            scale: 0.5,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: iframe.clientWidth,
            height: iframe.clientHeight,
            logging: false,
          });
        } else {
          throw new Error('No content document');
        }
      } catch {
        canvas = await html2canvas(iframe, { scale: 0.5, useCORS: true, allowTaint: true, logging: false });
      }

      const dataUrl = canvas.toDataURL('image/webp', 0.7);
      setAfterSnapshot({ dataUrl, timestamp: Date.now(), label: 'After' });
      return true;
    } catch (err) {
      devLog('[VisualDiff] After capture failed:', err);
      return false;
    } finally {
      captureInProgress.current = false;
      setIsCapturing(false);
    }
  }, []);

  const clearSnapshots = useCallback(() => {
    setBeforeSnapshot(null);
    setAfterSnapshot(null);
  }, []);

  const hasDiff = Boolean(beforeSnapshot && afterSnapshot);

  return {
    beforeSnapshot,
    afterSnapshot,
    isCapturing,
    hasDiff,
    captureBeforeSnapshot,
    captureAfterSnapshot,
    clearSnapshots,
  };
}
