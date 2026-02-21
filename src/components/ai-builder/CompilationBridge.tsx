import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import { useReactCompiler, detectReactProject } from '@/hooks/useReactCompiler';
import type { SupabaseConfig, StripeConfig, ServiceKey, EnvVar } from './ProjectSettings';
import type { CDNPackage } from './PackageManager';
import type { LinkedGPTConfig } from './GPTConnectorPanel';
import { useLivePreviewSync } from '@/hooks/useLivePreviewSync';

const COMPILE_TIMEOUT_MS = 10_000;

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
  onCompilingChange?: (compiling: boolean) => void;
}

const ERROR_FALLBACK_HTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Compilation Error</title><style>*{margin:0;padding:0;box-sizing:border-box}body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a14;color:#fff;font-family:system-ui,sans-serif}.card{text-align:center;max-width:440px;padding:2rem}h1{font-size:1.5rem;margin-bottom:1rem;color:#f87171}p{color:#ffffff90;line-height:1.6;margin-bottom:0.5rem}code{background:#1e1e2e;padding:2px 6px;border-radius:4px;font-size:0.85em}</style></head><body><div class="card"><h1>⚠️ Compilation Error</h1><p>Your project files were generated but could not be compiled into a preview.</p><p>Check that your project has an <code>index.html</code> file and try regenerating.</p></div></body></html>`;

/**
 * CompilationBridge — isolated child component for all compilation hooks.
 *
 * If this component crashes, PanelErrorBoundary catches it without
 * affecting the parent workspace's hook count (fixes React Error #310).
 * Renders nothing — communicates results via callbacks.
 *
 * Both compilations are deferred via useEffect + setTimeout to prevent
 * blocking the main thread after generation completes.
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
  onCompilingChange,
}: CompilationBridgeProps) {
  // ── React Compiler integration ──
  const { compileReactProject } = useReactCompiler();

  // Stabilize function refs to prevent effect re-fires
  const compileReactProjectRef = useRef(compileReactProject);
  compileReactProjectRef.current = compileReactProject;
  const getCompiledHTMLRef = useRef(getCompiledHTML);
  getCompiledHTMLRef.current = getCompiledHTML;
  const bundleForBrowserRef = useRef(bundleForBrowser);
  bundleForBrowserRef.current = bundleForBrowser;
  const onCompilingChangeRef = useRef(onCompilingChange);
  onCompilingChangeRef.current = onCompilingChange;

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

  // ── liveCompiledHTML (async, post-generation) ──
  const [liveCompiledHTML, setLiveCompiledHTML] = useState<string | null>(null);
  const compilationAttemptedRef = useRef(false);
  const compilationLockRef = useRef(false);

  // Reset compilation attempted flag when generation starts
  useEffect(() => {
    if (isGenerating) {
      compilationAttemptedRef.current = false;
      compilationLockRef.current = false;
    }
  }, [isGenerating]);

  // Serialize file identity to prevent effect re-fires from reference changes
  const filesDigest = useMemo(() => {
    if (files.length === 0) return '';
    return files.map(f => f.path + ':' + f.content.length).join('|');
  }, [files]);

  useEffect(() => {
    if (isGenerating || files.length === 0 || stableHTMLRef.current) {
      setLiveCompiledHTML(null);
      return;
    }

    // Prevent re-entry — only compile once per generation cycle
    if (compilationLockRef.current) return;
    compilationLockRef.current = true;

    onCompilingChangeRef.current?.(true);

    let cancelled = false;
    const safetyTimeout = setTimeout(() => {
      if (!cancelled) {
        console.error('[Compilation] Safety timeout reached (10s) — showing error fallback');
        onCompilingChangeRef.current?.(false);
        compilationAttemptedRef.current = true;
        setLiveCompiledHTML(ERROR_FALLBACK_HTML);
      }
    }, COMPILE_TIMEOUT_MS);

    // Use requestAnimationFrame → setTimeout to yield to browser before heavy work
    const rafId = requestAnimationFrame(() => {
      if (cancelled) return;
      const compileTimer = setTimeout(() => {
        if (cancelled) return;
        try {
          console.time('[liveCompiledHTML]');
          let result: string | null = null;
          if (isReactProject) {
            const compiled = compileReactProjectRef.current(files, {
              supabaseConfig: supabaseConfig || undefined,
              stripeConfig: stripeConfig || undefined,
              envVars,
            });
            if (compiled.errors.length > 0) {
              console.warn('[ReactCompiler] Warnings:', compiled.errors);
            }
            result = compiled.html || null;
          } else {
            result = getCompiledHTMLRef.current(supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowserRef.current, linkedGPT);
          }
          console.timeEnd('[liveCompiledHTML]');
          if (!cancelled) {
            clearTimeout(safetyTimeout);
            onCompilingChangeRef.current?.(false);
            compilationAttemptedRef.current = true;
            setLiveCompiledHTML(result);
          }
        } catch (e) {
          console.error('[ReactCompiler] Compilation crashed:', e);
          if (!cancelled) {
            clearTimeout(safetyTimeout);
            onCompilingChangeRef.current?.(false);
            compilationAttemptedRef.current = true;
            setLiveCompiledHTML(null);
          }
        }
      }, 50);

      // Store for cleanup
      (rafId as any).__compileTimer = compileTimer;
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      clearTimeout((rafId as any)?.__compileTimer);
      clearTimeout(safetyTimeout);
      onCompilingChangeRef.current?.(false);
    };
  }, [filesDigest, supabaseConfig, stripeConfig, isReactProject, isGenerating]);

  // ── compiledForHosting (deferred until live preview is done) ──
  const [compiledForHosting, setCompiledForHosting] = useState<string | null>(null);

  // Only compile for hosting AFTER liveCompiledHTML is settled to avoid
  // two heavy synchronous compilations running back-to-back and freezing the page.
  useEffect(() => {
    if (isGenerating) {
      setCompiledForHosting(null);
      return;
    }
    if (files.length === 0) return;
    // Wait until the live preview compilation is done
    if (!compilationAttemptedRef.current) return;

    const timer = setTimeout(() => {
      try {
        console.time('[compiledForHosting]');
        const result = getCompiledHTMLRef.current(supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowserRef.current);
        console.timeEnd('[compiledForHosting]');
        setCompiledForHosting(result);
      } catch (e) {
        console.error('[compiledForHosting] Compilation crashed:', e);
        setCompiledForHosting(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [files, supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, isGenerating, liveCompiledHTML]);

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
    if (!isGenerating && !liveCompiledHTML && files.length > 0 && stableHTML === null && compilationAttemptedRef.current) {
      console.warn('[Preview] Generation complete but compilation returned null — showing error fallback');
      setStableHTML(ERROR_FALLBACK_HTML);
    }
  }, [isGenerating, liveCompiledHTML, files, stableHTML, setStableHTML]);

  // Hot-patch during manual edits
  useEffect(() => {
    if (!isGenerating && stableHTML && files.length > 0) {
      liveSync.applyPatches(previewIframeRef, files);
    }
  }, [files, isGenerating, stableHTML]);


  // This component renders nothing — it only manages compilation state
  return null;
}
