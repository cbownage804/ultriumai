import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Captures a screenshot of compiled HTML and uploads it as a project thumbnail.
 * 
 * STABILITY: This hook has been hardened to prevent browser freezes:
 * - No retries (single attempt only)
 * - 8-second hard abort timer kills the iframe if capture hangs
 * - Reduced canvas scale (0.25) to minimize main-thread work
 * - 90-second throttle between captures
 * - Content-hash deduplication
 * - Yields to main thread via setTimeout(0) before heavy work
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
  ): Promise<string | null> => {
    if (!compiledHtml || !projectId || captureInProgress.current) return null;

    // Throttle: max one capture per 90s
    const now = Date.now();
    if (now - lastCaptureTime.current < THROTTLE_MS) {
      console.log('Thumbnail: throttled (last capture was %ds ago)', Math.round((now - lastCaptureTime.current) / 1000));
      return null;
    }

    // Deduplicate
    const hash = quickHash(compiledHtml);
    if (hash === lastCapturedHash.current) {
      console.log('Thumbnail: skipping duplicate capture');
      return null;
    }

    captureInProgress.current = true;

    // Yield to main thread before starting heavy work
    await new Promise(resolve => setTimeout(resolve, 0));

    let iframe: HTMLIFrameElement | null = null;
    let abortTimer: ReturnType<typeof setTimeout> | null = null;
    let aborted = false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:1280px;height:800px;border:none;z-index:-1;opacity:0;pointer-events:none;';
      iframe.sandbox.add('allow-same-origin');
      iframe.sandbox.add('allow-scripts');
      document.body.appendChild(iframe);

      // Hard abort timer — kills iframe after 8s to prevent freeze
      abortTimer = setTimeout(() => {
        aborted = true;
        console.warn('Thumbnail: hard abort after 8s');
        if (iframe?.parentNode) {
          document.body.removeChild(iframe);
          iframe = null;
        }
      }, 8000);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return null;

      iframeDoc.open();
      iframeDoc.write(compiledHtml);
      iframeDoc.close();

      // Wait for content to render — single attempt, 3s max
      await new Promise(resolve => setTimeout(resolve, 3000));

      if (aborted || !iframe?.parentNode) return null;

      const bodyContent = iframeDoc.body?.innerHTML || '';
      if (bodyContent.length < 50) {
        console.warn('Thumbnail: iframe body is empty, skipping');
        return null;
      }

      // Yield again before html2canvas
      await new Promise(resolve => setTimeout(resolve, 0));
      if (aborted) return null;

      const html2canvas = (await import('html2canvas')).default;
      
      if (aborted || !iframe?.parentNode) return null;

      const canvas = await html2canvas(iframeDoc.body, {
        width: 1280,
        height: 800,
        scale: 0.25, // Reduced from 0.5 to minimize main-thread work
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0a0a0a',
        logging: false,
        windowWidth: 1280,
        windowHeight: 800,
      });

      if (aborted) return null;

      const blob = await new Promise<Blob | null>(resolve =>
        canvas.toBlob(resolve, 'image/webp', 0.6)
      );
      if (!blob) return null;

      const filePath = `${user.id}/${projectId}.webp`;
      const { error } = await supabase.storage
        .from('project-thumbnails')
        .upload(filePath, blob, {
          upsert: true,
          contentType: 'image/webp',
        });

      if (error) {
        console.error('Thumbnail upload failed:', error);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from('project-thumbnails')
        .getPublicUrl(filePath);

      const thumbnailUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      await supabase
        .from('builder_projects')
        .update({ thumbnail_url: thumbnailUrl } as any)
        .eq('id', projectId);

      lastCapturedHash.current = hash;
      lastCaptureTime.current = Date.now();
      console.log('Thumbnail captured successfully');
      return thumbnailUrl;
    } catch (err) {
      console.error('Preview capture error:', err);
      return null;
    } finally {
      if (abortTimer) clearTimeout(abortTimer);
      if (iframe?.parentNode) {
        document.body.removeChild(iframe);
      }
      captureInProgress.current = false;
    }
  }, []);

  return { captureAndUpload };
}
