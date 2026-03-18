import { useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';

/**
 * Captures a screenshot of compiled HTML and uploads it as a project thumbnail.
 * Uses an offscreen iframe for reliable same-origin rendering + html2canvas.
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

      // Create an offscreen iframe for isolated rendering
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:1280px;height:800px;border:none;z-index:-1;opacity:0;pointer-events:none;';
      iframe.sandbox.add('allow-same-origin');
      iframe.sandbox.add('allow-scripts'); // Required for React/CSS to render
      document.body.appendChild(iframe);

      // Write compiled HTML into iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        document.body.removeChild(iframe);
        return null;
      }

      iframeDoc.open();
      iframeDoc.write(compiledHtml);
      iframeDoc.close();

      // Wait for content to render (scripts, images, fonts, styles)
      await new Promise(resolve => setTimeout(resolve, 4000));

      // Verify iframe body has content before capturing
      const bodyContent = iframeDoc.body?.innerHTML || '';
      if (bodyContent.length < 50) {
        console.warn('Thumbnail: iframe body is nearly empty, skipping capture');
        document.body.removeChild(iframe);
        return null;
      }

      // Capture with html2canvas from the iframe body
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

      document.body.removeChild(iframe);

      // Verify canvas isn't just a solid color (empty render)
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 3, 1, 1).data;
        const isBlank = pixel[0] <= 15 && pixel[1] <= 15 && pixel[2] <= 15;
        if (isBlank) {
          console.warn('Thumbnail: captured canvas appears blank, skipping upload');
          return null;
        }
      }

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

      const thumbnailUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update project record
      await supabase
        .from('builder_projects')
        .update({ thumbnail_url: thumbnailUrl } as any)
        .eq('id', projectId);

      console.log('Thumbnail captured and uploaded successfully');
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
