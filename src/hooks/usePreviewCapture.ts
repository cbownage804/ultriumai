import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

import { devLog } from '@/lib/logger';
/**
 * Captures a project thumbnail via a server-side edge function.
 * 
 * ZERO main-thread work — no iframe, no html2canvas, no canvas rendering.
 * The edge function generates a branded SVG thumbnail and uploads it.
 * 
 * Protections:
 * - 90-second throttle between captures
 * - Content-hash deduplication
 * - Single-flight guard (no concurrent captures)
 */
const THROTTLE_MS = 90_000;

export function usePreviewCapture() {
  const captureInProgress = useRef(false);
  const lastCapturedHash = useRef<string | null>(null);
  const lastCaptureTime = useRef(0);

  const quickHash = (str: string): string => {
    let hash = 0;
    const len = str.length;
    const sampleSize = Math.min(len, 3000);
    const startEnd = Math.min(1500, Math.floor(sampleSize / 2));
    for (let i = 0; i < startEnd; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    const midStart = Math.max(0, Math.floor(len / 2) - 500);
    for (let i = midStart; i < Math.min(len, midStart + 1000); i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    hash = ((hash << 5) - hash) + len;
    hash |= 0;
    return Math.abs(hash).toString(36);
  };

  const captureAndUpload = useCallback(async (
    compiledHtml: string | null,
    projectId: string,
    projectName?: string,
    slug?: string,
  ): Promise<string | null> => {
    if (!compiledHtml || !projectId || captureInProgress.current) return null;

    // Throttle: max one capture per 90s
    const now = Date.now();
    if (now - lastCaptureTime.current < THROTTLE_MS) {
      devLog.log('Thumbnail: throttled (last capture was %ds ago)', Math.round((now - lastCaptureTime.current) / 1000));
      return null;
    }

    // Deduplicate by content hash
    const hash = quickHash(compiledHtml);
    if (hash === lastCapturedHash.current) {
      devLog.log('Thumbnail: skipping duplicate capture');
      return null;
    }

    captureInProgress.current = true;

    try {
      const { data, error } = await supabase.functions.invoke('capture-thumbnail', {
        body: { projectId, projectName, slug },
      });

      if (error) {
        console.error('Thumbnail edge function error:', error);
        return null;
      }

      if (data?.success && data?.thumbnailUrl) {
        lastCapturedHash.current = hash;
        lastCaptureTime.current = Date.now();
        devLog.log('Thumbnail captured via edge function');
        return data.thumbnailUrl;
      }

      return null;
    } catch (err) {
      console.error('Preview capture error:', err);
      return null;
    } finally {
      captureInProgress.current = false;
    }
  }, []);

  return { captureAndUpload };
}
