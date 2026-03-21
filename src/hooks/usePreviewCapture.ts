import { useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';

const MAX_RETRIES = 2;
const RETRY_DELAYS = [2000, 4000]; // exponential backoff

/**
 * Captures a screenshot of compiled HTML and uploads it as a project thumbnail.
 * Uses an offscreen iframe for reliable same-origin rendering + html2canvas.
 * Includes retry with exponential backoff and deduplication.
 */
const THROTTLE_MS = 60_000; // Only allow one capture per 60s to protect main thread

export function usePreviewCapture() {
  const captureInProgress = useRef(false);
  const lastCapturedHash = useRef<string | null>(null);
  const lastCaptureTime = useRef(0);

  /** Simple hash to deduplicate identical captures — sample more of the content */
  const quickHash = (str: string): string => {
    let hash = 0;
    const len = str.length;
    // Sample start, middle, and end for better differentiation
    const sampleSize = Math.min(len, 3000);
    const startEnd = Math.min(1500, Math.floor(sampleSize / 2));
    for (let i = 0; i < startEnd; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    // Also sample from the middle/end of the document
    const midStart = Math.max(0, Math.floor(len / 2) - 500);
    for (let i = midStart; i < Math.min(len, midStart + 1000); i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    // Include length in hash for extra differentiation
    hash = ((hash << 5) - hash) + len;
    hash |= 0;
    return Math.abs(hash).toString(36);
  };

  const attemptCapture = async (
    compiledHtml: string,
    projectId: string,
    userId: string,
    attempt = 0,
  ): Promise<string | null> => {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:1280px;height:800px;border:none;z-index:-1;opacity:0;pointer-events:none;';
    iframe.sandbox.add('allow-same-origin');
    iframe.sandbox.add('allow-scripts');
    document.body.appendChild(iframe);

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return null;

      iframeDoc.open();
      iframeDoc.write(compiledHtml);
      iframeDoc.close();

      // Wait for content to render — longer on retries
      const waitMs = 4000 + (attempt * 2000);
      await new Promise(resolve => setTimeout(resolve, waitMs));

      const bodyContent = iframeDoc.body?.innerHTML || '';
      if (bodyContent.length < 50) {
        if (attempt < MAX_RETRIES) {
          document.body.removeChild(iframe);
          await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt] || 2000));
          return attemptCapture(compiledHtml, projectId, userId, attempt + 1);
        }
        console.warn('Thumbnail: iframe body is empty after retries, skipping');
        return null;
      }

      const canvas = await html2canvas(iframeDoc.body, {
        width: 1280,
        height: 800,
        scale: 0.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0a0a0a',
        logging: false,
        windowWidth: 1280,
        windowHeight: 800,
      });

      // Verify canvas isn't blank
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const samplePoints = [
          [canvas.width / 2, canvas.height / 3],
          [canvas.width / 3, canvas.height / 2],
          [canvas.width * 2 / 3, canvas.height / 4],
        ];
        const allBlank = samplePoints.every(([x, y]) => {
          const pixel = ctx.getImageData(x, y, 1, 1).data;
          return pixel[0] <= 15 && pixel[1] <= 15 && pixel[2] <= 15;
        });
        if (allBlank) {
          if (attempt < MAX_RETRIES) {
            document.body.removeChild(iframe);
            await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt] || 2000));
            return attemptCapture(compiledHtml, projectId, userId, attempt + 1);
          }
          console.warn('Thumbnail: canvas blank after retries, skipping');
          return null;
        }
      }

      const blob = await new Promise<Blob | null>(resolve =>
        canvas.toBlob(resolve, 'image/webp', 0.75)
      );
      if (!blob) return null;

      const filePath = `${userId}/${projectId}.webp`;
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

      console.log(`Thumbnail captured successfully (attempt ${attempt + 1})`);
      return thumbnailUrl;
    } finally {
      if (iframe.parentNode) {
        document.body.removeChild(iframe);
      }
    }
  };

  const captureAndUpload = useCallback(async (
    compiledHtml: string | null,
    projectId: string,
  ): Promise<string | null> => {
    if (!compiledHtml || !projectId || captureInProgress.current) return null;

    // Deduplicate: skip if same content was just captured
    const hash = quickHash(compiledHtml);
    if (hash === lastCapturedHash.current) {
      console.log('Thumbnail: skipping duplicate capture');
      return null;
    }

    captureInProgress.current = true;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const result = await attemptCapture(compiledHtml, projectId, user.id);
      if (result) {
        lastCapturedHash.current = hash;
      }
      return result;
    } catch (err) {
      console.error('Preview capture error:', err);
      return null;
    } finally {
      captureInProgress.current = false;
    }
  }, []);

  return { captureAndUpload };
}
