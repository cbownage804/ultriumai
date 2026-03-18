/**
 * Preview Success Contract — single source of truth for whether compiled HTML
 * is valid enough to render a working preview.
 *
 * A preview is valid when ALL of:
 *  1. html is non-empty
 *  2. contains <!DOCTYPE or <html
 *  3. contains a mount node (id="root" OR id="app")
 *  4. is NOT an error/fallback page (no ai-builder-fallback sentinel)
 */
export function isPreviewValid(html: string | null | undefined): boolean {
  if (!html || html.trim().length === 0) return false;

  const lower = html.toLowerCase();

  // Must be a real HTML document
  const hasDoctype = lower.includes('<!doctype') || lower.includes('<html');
  if (!hasDoctype) return false;

  // Must contain a mount point — support both id="root" (React) and id="app" (vanilla)
  const hasMount = /id\s*=\s*["'](root|app)["']/i.test(html);
  if (!hasMount) return false;

  // Must NOT be a fallback/error sentinel page
  if (html.includes('name="ai-builder-fallback"')) return false;
  if (html.includes('⚠️ Compilation Error')) return false;

  return true;
}

/**
 * Debug summary of preview HTML for logging.
 */
export function previewDebugSummary(html: string | null | undefined): Record<string, unknown> {
  if (!html) return { htmlLength: 0, hasDoctype: false, hasMount: false, isFallback: false };
  return {
    htmlLength: html.length,
    hasDoctype: /<!doctype|<html/i.test(html),
    hasMount: /id\s*=\s*["'](root|app)["']/i.test(html),
    isFallback: html.includes('name="ai-builder-fallback"') || html.includes('⚠️ Compilation Error'),
    first80: html.slice(0, 80),
  };
}
