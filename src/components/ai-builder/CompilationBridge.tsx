import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import { useReactCompiler, detectReactProject } from '@/hooks/useReactCompiler';
import type { SupabaseConfig, StripeConfig, ServiceKey, EnvVar } from './ProjectSettings';
import type { CDNPackage } from './PackageManager';
import type { LinkedGPTConfig } from './GPTConnectorPanel';
import { useLivePreviewSync } from '@/hooks/useLivePreviewSync';

const COMPILE_TIMEOUT_MS = 20_000;

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

  // Store files in a ref so effects can read latest data without depending on the array reference
  const filesRef = useRef(files);
  filesRef.current = files;

  // Serialize file identity to prevent effect re-fires from reference changes
  const filesDigest = useMemo(() => {
    if (files.length === 0) return '';
    return files.map(f => f.path + ':' + f.content.length).join('|');
  }, [files]);

  const isReactProject = useMemo(() => {
    try {
      return detectReactProject(filesRef.current);
    } catch (e) {
      console.error('[detectReactProject] crashed:', e);
      return false;
    }
  }, [filesDigest]);

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


  // Phase 5: Debounce compilation — 500ms delay so rapid setFiles calls consolidate
  const compilationDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const compilationCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isGenerating || filesRef.current.length === 0 || stableHTMLRef.current) {
      setLiveCompiledHTML(null);
      return;
    }

    // Prevent re-entry — only compile once per generation cycle
    if (compilationLockRef.current) return;

    // Debounce: wait 500ms for rapid file changes to settle
    if (compilationDebounceRef.current) clearTimeout(compilationDebounceRef.current);
    compilationDebounceRef.current = setTimeout(() => {
      if (compilationLockRef.current) return;
      compilationLockRef.current = true;

      onCompilingChangeRef.current?.(true);

      let cancelled = false;
      let compileTimerId: ReturnType<typeof setTimeout>;
      const safetyTimeout = setTimeout(() => {
        if (!cancelled) {
          console.error('[Compilation] Safety timeout reached (10s) — showing error fallback');
          onCompilingChangeRef.current?.(false);
          compilationAttemptedRef.current = true;
          setLiveCompiledHTML(ERROR_FALLBACK_HTML);
        }
      }, COMPILE_TIMEOUT_MS);

      // Phase 1: Async compilation with yield points to keep browser responsive
      const runCompilation = async () => {
        if (cancelled) return;
        try {
          console.time('[liveCompiledHTML]');
          let result: string | null = null;
          // Yield to browser before heavy work
          await new Promise(r => setTimeout(r, 0));
          if (cancelled) return;
          if (isReactProject) {
            const compiled = await compileReactProjectRef.current(filesRef.current, {
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
          // Yield to browser after heavy work before state update
          await new Promise(r => setTimeout(r, 0));
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
      };
      // Defer start with rAF + short timeout for a paint frame
      const rafId = requestAnimationFrame(() => {
        if (cancelled) return;
        const compileTimer = setTimeout(() => {
          runCompilation();
        }, 100);
        compileTimerId = compileTimer;
      });

      compilationCleanupRef.current = () => {
        cancelled = true;
        cancelAnimationFrame(rafId);
        clearTimeout(compileTimerId);
        clearTimeout(safetyTimeout);
        onCompilingChangeRef.current?.(false);
      };
    }, 500);

    return () => {
      if (compilationDebounceRef.current) clearTimeout(compilationDebounceRef.current);
      compilationCleanupRef.current?.();
    };
  }, [filesDigest, supabaseConfig, stripeConfig, isReactProject, isGenerating]);

  // ── compiledForHosting (deferred until live preview is done) ──
  const [compiledForHosting, setCompiledForHosting] = useState<string | null>(null);

  // Only compile for hosting AFTER liveCompiledHTML is settled to avoid
  // two heavy synchronous compilations running back-to-back and freezing the page.
  const hostingLockRef = useRef(false);
  useEffect(() => {
    if (isGenerating) {
      setCompiledForHosting(null);
      hostingLockRef.current = false;
      return;
    }
    if (filesRef.current.length === 0) return;
    // Wait until the live preview compilation is done
    if (!compilationAttemptedRef.current) return;
    // Prevent re-entry
    if (hostingLockRef.current) return;
    hostingLockRef.current = true;

    const doCompile = () => {
      try {
        console.time('[compiledForHosting]');
        // Phase 2: Reuse live preview result for React projects to eliminate double compilation
        if (isReactProject && liveCompiledHTML) {
          console.timeEnd('[compiledForHosting]');
          setCompiledForHosting(liveCompiledHTML);
          return;
        }
        const result = getCompiledHTMLRef.current(supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowserRef.current);
        console.timeEnd('[compiledForHosting]');
        setCompiledForHosting(result);
      } catch (e) {
        console.error('[compiledForHosting] Compilation crashed:', e);
        setCompiledForHosting(null);
      }
    };
    // Defer hosting compilation 2s + requestIdleCallback to avoid main-thread contention
    const timer = setTimeout(() => {
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(() => doCompile(), { timeout: 5000 });
      } else {
        setTimeout(doCompile, 100);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [filesDigest, isGenerating, liveCompiledHTML, isReactProject]);

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
      const patched = liveSync.applyPatches(previewIframeRef, filesRef.current);
      if (!patched) {
        setStableHTML(liveCompiledHTML);
        liveSync.resetSnapshot(filesRef.current);
      }
    }
    if (!isGenerating && !liveCompiledHTML && filesRef.current.length > 0 && stableHTML === null && compilationAttemptedRef.current) {
      console.warn('[Preview] Generation complete but compilation returned null — showing error fallback');
      setStableHTML(ERROR_FALLBACK_HTML);
    }
  }, [isGenerating, liveCompiledHTML, filesDigest, stableHTML, setStableHTML]);

  // Hot-patch during manual edits
  useEffect(() => {
    if (!isGenerating && stableHTML && filesRef.current.length > 0) {
      liveSync.applyPatches(previewIframeRef, filesRef.current);
    }
  }, [filesDigest, isGenerating, stableHTML]);


  // This component renders nothing — it only manages compilation state
  return null;
}
