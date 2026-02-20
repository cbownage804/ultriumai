import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import { useReactCompiler, detectReactProject } from '@/hooks/useReactCompiler';
import type { SupabaseConfig, StripeConfig, ServiceKey, EnvVar } from './ProjectSettings';
import type { CDNPackage } from './PackageManager';
import type { LinkedGPTConfig } from './GPTConnectorPanel';
import { useLivePreviewSync } from '@/hooks/useLivePreviewSync';

interface CompilationBridgeProps {
  files: ProjectFile[];
  isGenerating: boolean;
  supabaseConfig: SupabaseConfig | null;
  stripeConfig: StripeConfig | null;
  envVars: EnvVar[];
  serviceKeys: ServiceKey[];
  cdnPackages: CDNPackage[];
  bundleForBrowser: (files: ProjectFile[]) => string;
  linkedGPT: LinkedGPTConfig | null;
  getCompiledHTML: (...args: any[]) => string | null;
  partialFilesRef: React.MutableRefObject<ProjectFile[]>;
  completedFileCountRef: React.MutableRefObject<number>;
  previewIframeRef: React.RefObject<HTMLIFrameElement>;
  previewSlug: string | null;
  uploadPreview: (slug: string, html: string) => void;
  clearPreviewTimer: () => void;
  onStableHTML: (html: string | null) => void;
  onCompiledForHosting: (html: string | null) => void;
}

/**
 * CompilationBridge — isolated child component for all compilation hooks.
 *
 * If this component crashes, PanelErrorBoundary catches it without
 * affecting the parent workspace's hook count (fixes React Error #310).
 * Renders nothing — communicates results via callbacks.
 */
export function CompilationBridge({
  files,
  isGenerating,
  supabaseConfig,
  stripeConfig,
  envVars,
  serviceKeys,
  cdnPackages,
  bundleForBrowser,
  linkedGPT,
  getCompiledHTML,
  partialFilesRef,
  completedFileCountRef,
  previewIframeRef,
  previewSlug,
  uploadPreview,
  clearPreviewTimer,
  onStableHTML,
  onCompiledForHosting,
}: CompilationBridgeProps) {
  // ── React Compiler integration ──
  const { compileReactProject } = useReactCompiler();

  const isReactProject = useMemo(() => {
    try {
      return detectReactProject(files);
    } catch (e) {
      console.error('[detectReactProject] crashed:', e);
      return false;
    }
  }, [files]);

  // ── stableHTML state ──
  const [stableHTML, setStableHTMLLocal] = useState<string | null>(null);
  const stableHTMLRef = useRef<string | null>(null);

  const setStableHTML = useCallback((html: string | null) => {
    setStableHTMLLocal(html);
    stableHTMLRef.current = html;
    onStableHTML(html);
  }, [onStableHTML]);

  // Reset stableHTML when a new generation starts
  const prevIsGeneratingForReset = useRef(false);
  useEffect(() => {
    if (isGenerating && !prevIsGeneratingForReset.current) {
      setStableHTML(null);
    }
    prevIsGeneratingForReset.current = isGenerating;
  }, [isGenerating, setStableHTML]);

  // ── compiledForHosting ──
  const compiledForHosting = useMemo(() => {
    try {
      if (isGenerating) return null;
      return getCompiledHTML(supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowser);
    } catch (e) {
      console.error('[compiledForHosting] Compilation crashed:', e);
      return null;
    }
  }, [files, supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowser, isGenerating]);

  // Report compiledForHosting upstream
  useEffect(() => {
    onCompiledForHosting(compiledForHosting);
  }, [compiledForHosting, onCompiledForHosting]);

  // Upload preview when ready
  useEffect(() => {
    if (previewSlug && compiledForHosting) {
      uploadPreview(previewSlug, compiledForHosting);
    }
    return () => clearPreviewTimer();
  }, [compiledForHosting, previewSlug, uploadPreview, clearPreviewTimer]);

  // ── Timer-based compilation during generation ──
  useEffect(() => {
    if (!isGenerating) return;
    let attempted = false;
    const interval = setInterval(() => {
      if (attempted) return;
      const pFiles = partialFilesRef.current;
      const pCount = completedFileCountRef.current;
      if (pCount < 3 || pFiles.length === 0) return;

      console.log(`[Preview] Timer-based compile: ${pCount} completed files of ${pFiles.length}`);
      const isReact = pFiles.some(f => f.path.endsWith('.tsx') || f.path.endsWith('.jsx'));
      try {
        if (isReact) {
          try {
            const result = compileReactProject(pFiles, {
              supabaseConfig: supabaseConfig || undefined,
              stripeConfig: stripeConfig || undefined,
              envVars,
            });
            if (result.html) {
              setStableHTML(result.html);
            }
            attempted = true;
          } catch (compileErr) {
            console.warn('[Preview] React compilation crashed on partial files:', compileErr);
            attempted = true;
          }
        } else {
          const indexFile = pFiles.find(f => f.path === 'index.html' || f.path.endsWith('/index.html'));
          if (indexFile) {
            let html = indexFile.content;
            const cssFiles = pFiles.filter(f => f.path.endsWith('.css'));
            if (cssFiles.length > 0) {
              const cssInline = cssFiles.map(f => `<style>/* ${f.path} */\n${f.content}</style>`).join('\n');
              html = html.replace('</head>', `${cssInline}\n</head>`);
            }
            const jsFiles = pFiles.filter(f => f.path.endsWith('.js') && !f.path.endsWith('.config.js'));
            if (jsFiles.length > 0) {
              const jsInline = jsFiles.map(f => `<script>/* ${f.path} */\n${f.content}</script>`).join('\n');
              html = html.replace('</body>', `${jsInline}\n</body>`);
            }
            setStableHTML(html);
            attempted = true;
          }
        }
      } catch (e) {
        console.warn('[Preview] Timer-based compilation failed:', e);
        attempted = true;
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isGenerating, partialFilesRef, completedFileCountRef, compileReactProject, supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowser, linkedGPT, getCompiledHTML, setStableHTML]);

  // ── liveCompiledHTML (post-generation) ──
  const liveCompiledHTML = useMemo(() => {
    try {
      if (isGenerating) return null;
      if (files.length === 0) return null;
      if (stableHTMLRef.current) return null;

      if (isReactProject) {
        const result = compileReactProject(files, {
          supabaseConfig: supabaseConfig || undefined,
          stripeConfig: stripeConfig || undefined,
          envVars,
        });
        if (result.errors.length > 0) {
          console.warn('[ReactCompiler] Warnings:', result.errors);
        }
        return result.html || null;
      }
      return getCompiledHTML(supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowser, linkedGPT);
    } catch (e) {
      console.error('[ReactCompiler] Compilation crashed:', e);
      return null;
    }
  }, [files, supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowser, linkedGPT, isReactProject, compileReactProject, isGenerating]);

  const liveSync = useLivePreviewSync();

  // ── Preview update effects ──
  useEffect(() => {
    if (liveCompiledHTML) {
      if (stableHTML && stableHTML.length > 0) return;
      const patched = liveSync.applyPatches(previewIframeRef, files);
      if (!patched) {
        setStableHTML(liveCompiledHTML);
        liveSync.resetSnapshot(files);
      }
    }
    if (!isGenerating && !liveCompiledHTML && files.length > 0 && stableHTML === null) {
      console.warn('[Preview] Generation complete but compilation returned null — showing error fallback');
      setStableHTML(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Compilation Error</title><style>*{margin:0;padding:0;box-sizing:border-box}body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a14;color:#fff;font-family:system-ui,sans-serif}.card{text-align:center;max-width:440px;padding:2rem}h1{font-size:1.5rem;margin-bottom:1rem;color:#f87171}p{color:#ffffff90;line-height:1.6;margin-bottom:0.5rem}code{background:#1e1e2e;padding:2px 6px;border-radius:4px;font-size:0.85em}</style></head><body><div class="card"><h1>⚠️ Compilation Error</h1><p>Your project files were generated but could not be compiled into a preview.</p><p>Check that your project has an <code>index.html</code> file and try regenerating.</p></div></body></html>`);
    }
  }, [isGenerating, liveCompiledHTML, files, stableHTML, setStableHTML]);

  // Hot-patch during manual edits
  useEffect(() => {
    if (!isGenerating && stableHTML && files.length > 0) {
      liveSync.applyPatches(previewIframeRef, files);
    }
  }, [files, isGenerating, stableHTML]);

  // Force compile after 120s timeout
  useEffect(() => {
    if (!isGenerating) return;
    const timer = setTimeout(() => {
      const pFiles = partialFilesRef.current;
      if (pFiles.length > 0 && !stableHTML) {
        console.warn('[Preview] Generation exceeded 120s — force-compiling partial files for preview');
        const isPartialReact = pFiles.some(f => f.path.endsWith('.tsx') || f.path.endsWith('.jsx'));
        if (isPartialReact) {
          try {
            const result = compileReactProject(pFiles, {
              supabaseConfig: supabaseConfig || undefined,
              stripeConfig: stripeConfig || undefined,
              envVars,
            });
            if (result.html) {
              setStableHTML(result.html);
              return;
            }
          } catch (e) {
            console.warn('[Preview] Partial React compilation failed:', e);
          }
        }
        try {
          const htmlFile = pFiles.find(f => f.path.endsWith('.html'));
          if (htmlFile) {
            let html = htmlFile.content;
            const cssFiles = pFiles.filter(f => f.path.endsWith('.css'));
            if (cssFiles.length > 0) {
              const cssInline = cssFiles.map(f => `<style>/* ${f.path} */\n${f.content}</style>`).join('\n');
              html = html.replace('</head>', `${cssInline}\n</head>`);
            }
            const jsFiles = pFiles.filter(f => f.path.endsWith('.js') && !f.path.endsWith('.config.js'));
            if (jsFiles.length > 0) {
              const jsInline = jsFiles.map(f => `<script>/* ${f.path} */\n${f.content}</script>`).join('\n');
              html = html.replace('</body>', `${jsInline}\n</body>`);
            }
            setStableHTML(html);
          }
        } catch (e) {
          console.warn('[Preview] Partial vanilla compilation failed:', e);
        }
      }
    }, 120_000);
    return () => clearTimeout(timer);
  }, [isGenerating, partialFilesRef, stableHTML, setStableHTML]);

  // This component renders nothing — it only manages compilation state
  return null;
}
