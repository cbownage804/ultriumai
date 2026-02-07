import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ProjectFile } from './useProjectFileSystem';

const DEBOUNCE_MS = 5000; // Upload at most every 5s

export function usePreviewHosting() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHtml = useRef<string | null>(null);

  const uploadPreview = useCallback((slug: string, compiledHtml: string | null) => {
    if (!compiledHtml || !slug) return;
    // Skip if unchanged
    if (compiledHtml === lastHtml.current) return;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setIsUploading(true);
        lastHtml.current = compiledHtml;

        const filePath = `previews/${user.id}/${slug}/index.html`;

        const { error } = await supabase.storage
          .from('published-apps')
          .upload(filePath, new Blob([compiledHtml], { type: 'text/html' }), {
            upsert: true,
            contentType: 'text/html',
          });

        if (error) {
          console.error('Preview upload failed:', error);
          return;
        }

        const { data: urlData } = supabase.storage
          .from('published-apps')
          .getPublicUrl(filePath);

        setPreviewUrl(urlData.publicUrl);
      } catch (err) {
        console.error('Preview hosting error:', err);
      } finally {
        setIsUploading(false);
      }
    }, DEBOUNCE_MS);
  }, []);

  const clearPreviewTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { previewUrl, isUploading, uploadPreview, clearPreviewTimer };
}
