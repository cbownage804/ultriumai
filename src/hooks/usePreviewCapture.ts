import { useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';

/**
 * Captures a screenshot of compiled HTML and uploads it as a project thumbnail.
 * Uses a blob URL iframe approach for reliable same-origin rendering + html2canvas.
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

      // Create an offscreen container div to render HTML
      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;left:-9999px;top:0;width:1280px;height:800px;overflow:hidden;z-index:-1;';
      document.body.appendChild(container);

      // Use a shadow DOM to isolate styles
      const shadow = container.attachShadow({ mode: 'open' });
      
      // Parse and inject HTML content
      const parser = new DOMParser();
      const parsed = parser.parseFromString(compiledHtml, 'text/html');
      
      // Create a wrapper div inside shadow DOM
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'width:1280px;height:800px;overflow:hidden;background:#0a0a0a;';
      
      // Copy styles from parsed HTML
      const styles = parsed.querySelectorAll('style, link[rel="stylesheet"]');
      styles.forEach(s => {
        shadow.appendChild(s.cloneNode(true));
      });
      
      // Copy body content
      wrapper.innerHTML = parsed.body.innerHTML;
      shadow.appendChild(wrapper);

      // Wait for content to render
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Capture with html2canvas
      const canvas = await html2canvas(wrapper, {
        width: 1280,
        height: 800,
        scale: 0.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0a0a0a',
        logging: false,
      });

      document.body.removeChild(container);

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
