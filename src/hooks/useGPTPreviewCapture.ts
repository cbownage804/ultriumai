import { useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';

/**
 * Captures a screenshot of the GPT preview widget and uploads it as a thumbnail.
 * Targets a DOM element by ref rather than compiled HTML.
 */
export function useGPTPreviewCapture() {
  const captureInProgress = useRef(false);

  const captureGPTThumbnail = useCallback(async (
    previewElement: HTMLElement | null,
    gptId: string,
  ): Promise<string | null> => {
    if (!previewElement || !gptId || captureInProgress.current) return null;
    captureInProgress.current = true;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const canvas = await html2canvas(previewElement, {
        width: previewElement.offsetWidth,
        height: previewElement.offsetHeight,
        scale: 0.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0a0a0c',
        logging: false,
      });

      const blob = await new Promise<Blob | null>(resolve =>
        canvas.toBlob(resolve, 'image/webp', 0.75)
      );
      if (!blob) return null;

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

      // Store in logo_url field (avatar_url is user-configured)
      await supabase
        .from('custom_gpts')
        .update({ logo_url: thumbnailUrl })
        .eq('id', gptId);

      console.log('GPT thumbnail captured and uploaded successfully');
      return thumbnailUrl;
    } catch (err) {
      console.error('GPT preview capture error:', err);
      return null;
    } finally {
      captureInProgress.current = false;
    }
  }, []);

  return { captureGPTThumbnail };
}
