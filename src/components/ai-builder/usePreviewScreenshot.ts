import { useCallback } from 'react';

/**
 * usePreviewScreenshot — One-click screenshot or PDF export of the
 * current preview iframe state. Uses html2canvas for rendering.
 */

export function usePreviewScreenshot() {
  /**
   * Capture a screenshot of the preview iframe as a PNG blob.
   * Falls back to creating an image from the srcdoc HTML if
   * cross-origin restrictions prevent canvas capture.
   */
  const captureScreenshot = useCallback(async (
    iframeRef: React.RefObject<HTMLIFrameElement | null>,
    options: { format?: 'png' | 'jpeg'; quality?: number; scale?: number } = {}
  ): Promise<Blob | null> => {
    const iframe = iframeRef.current;
    if (!iframe) return null;

    const { format = 'png', quality = 0.92, scale = 2 } = options;

    try {
      // Attempt 1: Use html2canvas on the iframe's document
      const html2canvas = (await import('html2canvas')).default;
      const doc = iframe.contentDocument;
      if (doc?.body) {
        const canvas = await html2canvas(doc.body, {
          scale,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: iframe.clientWidth,
          height: iframe.clientHeight,
          windowWidth: iframe.clientWidth,
          windowHeight: iframe.clientHeight,
        });
        return new Promise((resolve) => {
          canvas.toBlob(
            (blob) => resolve(blob),
            `image/${format}`,
            quality
          );
        });
      }
    } catch (err) {
      console.warn('[Screenshot] html2canvas failed, trying fallback:', err);
    }

    try {
      // Attempt 2: Capture the iframe element itself from the parent document
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(iframe, {
        scale,
        useCORS: true,
        allowTaint: true,
      });
      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => resolve(blob),
          `image/${format}`,
          quality
        );
      });
    } catch (err) {
      console.warn('[Screenshot] Fallback capture also failed:', err);
      return null;
    }
  }, []);

  /**
   * Download a screenshot of the preview as a file.
   */
  const downloadScreenshot = useCallback(async (
    iframeRef: React.RefObject<HTMLIFrameElement | null>,
    filename: string = 'preview-screenshot.png'
  ): Promise<boolean> => {
    const blob = await captureScreenshot(iframeRef);
    if (!blob) return false;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  }, [captureScreenshot]);

  /**
   * Copy screenshot to clipboard.
   */
  const copyScreenshot = useCallback(async (
    iframeRef: React.RefObject<HTMLIFrameElement | null>,
  ): Promise<boolean> => {
    const blob = await captureScreenshot(iframeRef, { format: 'png' });
    if (!blob) return false;

    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      return true;
    } catch (err) {
      console.warn('[Screenshot] Clipboard write failed:', err);
      return false;
    }
  }, [captureScreenshot]);

  /**
   * Export preview as a standalone HTML file.
   */
  const exportAsHTML = useCallback((
    iframeRef: React.RefObject<HTMLIFrameElement | null>,
    html: string | null,
    filename: string = 'preview-export.html'
  ): boolean => {
    const content = html || iframeRef.current?.srcdoc;
    if (!content) return false;

    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  }, []);

  return {
    captureScreenshot,
    downloadScreenshot,
    copyScreenshot,
    exportAsHTML,
  };
}
