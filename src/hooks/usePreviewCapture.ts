import { useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';

/**
 * Captures a screenshot of compiled HTML and uploads it as a project thumbnail.
 * Uses an offscreen iframe + html2canvas for reliable cross-origin capture.
 */
export function usePreviewCapture() {
  const captureInProgress = useRef(false);

  const captureAndUpload = useCallback(async (
    compiledHtml: string | null,
    projectId: string,
  ): Promise<string | null> => {
    if (!compiledHtml || !projectId || captureInProgress.current) return null;
    captureInProgress.current = true;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Create an offscreen iframe to render the HTML
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:1280px;height:800px;border:none;opacity:0;pointer-events:none;';
      document.body.appendChild(iframe);

      // Write the HTML content
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) {
        document.body.removeChild(iframe);
        return null;
      }
      doc.open();
      doc.write(compiledHtml);
      doc.close();

      // Wait for content to render
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Capture with html2canvas
      const canvas = await html2canvas(doc.body, {
        width: 1280,
        height: 800,
        scale: 0.5, // 640x400 output — small enough for thumbnails
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0a0a0a',
        logging: false,
      });

      document.body.removeChild(iframe);

      // Convert to blob
      const blob = await new Promise<Blob | null>(resolve =>
        canvas.toBlob(resolve, 'image/webp', 0.75)
      );
      if (!blob) return null;

      // Upload to Supabase Storage
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

      const thumbnailUrl = `${urlData.publicUrl}?t=${Date.now()}`; // cache bust

      // Update project record
      await supabase
        .from('builder_projects')
        .update({ thumbnail_url: thumbnailUrl } as any)
        .eq('id', projectId);

      return thumbnailUrl;
    } catch (err) {
      console.error('Preview capture error:', err);
      return null;
    } finally {
      captureInProgress.current = false;
    }
  }, []);

  return { captureAndUpload };
}
