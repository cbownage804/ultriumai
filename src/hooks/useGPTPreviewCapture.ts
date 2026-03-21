import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Captures a screenshot of the GPT preview widget and uploads it as a thumbnail.
 * Targets a DOM element by ref rather than compiled HTML.
 * 
 * Hardened with:
 * - Lazy-loaded html2canvas (not in critical bundle)
 * - 8s abort timer to prevent freezes
 * - 60s throttle between captures
 * - Reduced scale (0.25) for minimal main-thread work
 * - Single-flight guard
 */
const THROTTLE_MS = 60_000;

export function useGPTPreviewCapture() {
  const captureInProgress = useRef(false);
  const lastCaptureTime = useRef(0);

  const captureGPTThumbnail = useCallback(async (
    previewElement: HTMLElement | null,
    gptId: string,
  ): Promise<string | null> => {
    if (!previewElement || !gptId || captureInProgress.current) return null;

    // Throttle
    const now = Date.now();
    if (now - lastCaptureTime.current < THROTTLE_MS) {
      console.log('GPT Thumbnail: throttled');
      return null;
    }

    captureInProgress.current = true;

    let abortTimer: ReturnType<typeof setTimeout> | null = null;
    let aborted = false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Hard abort after 8s
      abortTimer = setTimeout(() => {
        aborted = true;
        console.warn('GPT Thumbnail: hard abort after 8s');
      }, 8000);

      // Yield to main thread
      await new Promise(resolve => setTimeout(resolve, 0));
      if (aborted) return null;

      // Lazy import
      const html2canvas = (await import('html2canvas')).default;
      if (aborted) return null;

      const canvas = await html2canvas(previewElement, {
        width: previewElement.offsetWidth,
        height: previewElement.offsetHeight,
        scale: 0.25,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0a0a0c',
        logging: false,
      });

      if (aborted) return null;

      const blob = await new Promise<Blob | null>(resolve =>
        canvas.toBlob(resolve, 'image/webp', 0.6)
      );
      if (!blob || aborted) return null;

      const filePath = `${user.id}/gpt-${gptId}.webp`;
      const { error } = await supabase.storage
        .from('project-thumbnails')
        .upload(filePath, blob, {
          upsert: true,
          contentType: 'image/webp',
        });

      if (error) {
        console.error('GPT thumbnail upload failed:', error);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from('project-thumbnails')
        .getPublicUrl(filePath);

      const thumbnailUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      await supabase
        .from('custom_gpts')
        .update({ logo_url: thumbnailUrl })
        .eq('id', gptId);

      lastCaptureTime.current = Date.now();
      console.log('GPT thumbnail captured successfully');
      return thumbnailUrl;
    } catch (err) {
      console.error('GPT preview capture error:', err);
      return null;
    } finally {
      if (abortTimer) clearTimeout(abortTimer);
      captureInProgress.current = false;
    }
  }, []);

  return { captureGPTThumbnail };
}
