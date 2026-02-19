import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DEBOUNCE_MS = 1000; // Upload at most every 1s for near-instant sharing

/** Simple content hash for cache busting */
function hashContent(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function usePreviewHosting() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHash = useRef<string | null>(null);

  const uploadPreview = useCallback((slug: string, compiledHtml: string | null) => {
    if (!compiledHtml || !slug) return;

    const contentHash = hashContent(compiledHtml);
    // Skip if unchanged
    if (contentHash === lastHash.current) return;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setIsUploading(true);
        lastHash.current = contentHash;

        // 1. Upsert into live_previews table for fast DB-based serving
        const { error: dbError } = await supabase
          .from('app_builder_live_previews')
          .upsert({
            user_id: user.id,
            project_slug: slug,
            compiled_html: compiledHtml,
            version_hash: contentHash,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,project_slug' });

        if (dbError) {
          console.error('Live preview DB upsert failed:', dbError);
        }

        // 2. Also upload to storage as fallback
        const filePath = `${user.id}/previews/${slug}/index.html`;
        const { error } = await supabase.storage
          .from('published-apps')
          .upload(filePath, new Blob([compiledHtml], { type: 'text/html' }), {
            upsert: true,
            contentType: 'text/html',
          });

        if (error) {
          console.error('Preview storage upload failed:', error);
        }

        // Set the shareable URL
        const shareUrl = `https://${slug}.apps.ultriumai.com`;
        setPreviewUrl(shareUrl);
      } catch (err) {
        console.error('Preview hosting error:', err);
      } finally {
        setIsUploading(false);
      }
    }, DEBOUNCE_MS);
  }, []);

  /** Instantly upload and return the URL (no debounce) */
  const uploadPreviewNow = useCallback(async (slug: string, compiledHtml: string | null): Promise<string | null> => {
    if (!compiledHtml || !slug) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const contentHash = hashContent(compiledHtml);
      lastHash.current = contentHash;

      // Upsert to DB
      await supabase
        .from('app_builder_live_previews')
        .upsert({
          user_id: user.id,
          project_slug: slug,
          compiled_html: compiledHtml,
          version_hash: contentHash,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,project_slug' });

      // Upload to storage
      const filePath = `${user.id}/previews/${slug}/index.html`;
      await supabase.storage
        .from('published-apps')
        .upload(filePath, new Blob([compiledHtml], { type: 'text/html' }), {
          upsert: true,
          contentType: 'text/html',
        });

      const shareUrl = `https://${slug}.apps.ultriumai.com`;
      setPreviewUrl(shareUrl);
      return shareUrl;
    } catch (err) {
      console.error('Instant preview upload error:', err);
      return null;
    }
  }, []);

  const clearPreviewTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { previewUrl, isUploading, uploadPreview, uploadPreviewNow, clearPreviewTimer };
}
