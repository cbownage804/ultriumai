import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import { detectReactProject } from '@/hooks/useReactCompiler';
import { useWorkerCompiler } from '@/hooks/useWorkerCompiler';
import type { SupabaseConfig, StripeConfig, ServiceKey, EnvVar } from './ProjectSettings';
import type { CDNPackage } from './PackageManager';
import type { LinkedGPTConfig } from './GPTConnectorPanel';
import { useLivePreviewSync } from '@/hooks/useLivePreviewSync';

const COMPILE_TIMEOUT_MS = 30_000;

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
  skipNextCompileRef?: React.MutableRefObject<boolean>;
  externalStableHTMLRef?: React.RefObject<string | null>;
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
  skipNextCompileRef,
  externalStableHTMLRef,
}: CompilationBridgeProps) {
  // ── Worker-based React Compiler (off main thread) ──
  const { compileReactProject } = useWorkerCompiler();

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
    return files.map(f => {
      let hash = 5381;
      for (let i = 0; i < f.content.length; i++) {
        hash = ((hash << 5) + hash + f.content.charCodeAt(i)) & 0x7fffffff;
      }
      return f.path + ':' + hash;
    }).join('|');
  }, [files]);

  const isReactProject = useMemo(() => {
    try {
      return detectReactProject(filesRef.current);
    } catch (e) {
      console.error('[detectReactProject] crashed:', e);
      return false;
    }
  }, [filesDigest]);

  // Gap 5 HMR: track when a soft reload should be used instead of iframe remount
  const softReloadPendingRef = useRef(false);

  // ── stableHTML state ──
  const [stableHTML, setStableHTMLLocal] = useState<string | null>(null);
  const stableHTMLRef = useRef<string | null>(null);
  // compileTrigger removed — direct compilation in handleBgComplete replaces the effect-chain approach
  const setStableHTML = useCallback((html: string | null) => {
    console.info('[CompilationBridge] setStableHTML:', html ? `${html.length} chars` : 'null');
    setStableHTMLLocal(html);
    stableHTMLRef.current = html;
    onStableHTML(html);
  }, [onStableHTML]);

  // Phase 2: Guard flag to prevent main compilation effect from redundant recompile
  // after we sync from external HTML in the generation-ending effect.
  const justSyncedFromExternalRef = useRef(false);

  // Reset stableHTML when a new generation starts
  const prevIsGeneratingForReset = useRef(false);
  useEffect(() => {
    if (isGenerating && !prevIsGeneratingForReset.current) {
      // Generation STARTING — keep the current preview visible (don't null stableHTML).
      // Only reset liveCompiledHTML so the fresh compilation result will be accepted.
      setLiveCompiledHTML(null);
      compilationAttemptedRef.current = false;
      compilationLockRef.current = false;
    } else if (!isGenerating && prevIsGeneratingForReset.current) {
      // Generation ENDING — check if handleBgComplete already compiled
      const externalHasPreview = externalStableHTMLRef?.current;
      if (!stableHTMLRef.current && externalHasPreview) {
        // handleBgComplete already compiled and set the preview externally.
        // Sync our internal state to match, skip redundant recompile.
        stableHTMLRef.current = externalHasPreview;
        setStableHTMLLocal(externalHasPreview);
        prevFilesDigestRef.current = filesDigest;
        compilationLockRef.current = true;
        compilationAttemptedRef.current = true;
        justSyncedFromExternalRef.current = true; // Phase 2: prevent main effect recompile
        console.info('[CompilationBridge] Synced external stableHTML, skipping redundant recompile');
      } else if (!stableHTMLRef.current) {
        // handleBgComplete's direct compilation failed — let main effect handle it.
        // The main effect will also fire because isGenerating is in its dependency array.
        // Just clear the guards so it can proceed.
        compilationLockRef.current = false;
        compilationAttemptedRef.current = false;
        prevFilesDigestRef.current = '';
        immediateCompileNeededRef.current = true;
        console.info('[CompilationBridge] Generation ended with no preview — main effect will compile as fallback');
      } else {
        // stableHTML already set (from handleBgComplete direct compile),
        // sync the digest so we don't trigger a redundant recompile
        prevFilesDigestRef.current = filesDigest;
        compilationLockRef.current = true;
        compilationAttemptedRef.current = true;
      }
    }
    prevIsGeneratingForReset.current = isGenerating;
  }, [isGenerating, setStableHTML]);

  // ── liveCompiledHTML (async, post-generation) ──
  const [liveCompiledHTML, setLiveCompiledHTML] = useState<string | null>(null);
  const compilationAttemptedRef = useRef(false);
  const compilationLockRef = useRef(false);
  const compilationRetryCountRef = useRef(0);

  // Phase 3: Removed duplicate reset effect — already handled by the generation start/end effect above.


  // Phase 5: Debounce compilation — 500ms delay so rapid setFiles calls consolidate
  // Post-generation uses 0ms (immediate) to avoid being cancelled by rapid re-renders
  const compilationDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const compilationCleanupRef = useRef<(() => void) | null>(null);
  const immediateCompileNeededRef = useRef(false);

  // Track previous filesDigest to detect actual file changes
  const prevFilesDigestRef = useRef<string>('');

   useEffect(() => {
    console.info('[CompilationBridge] Main effect triggered — isGenerating:', isGenerating, 'files:', filesRef.current.length, 'stableHTML:', !!stableHTMLRef.current, 'lock:', compilationLockRef.current);
    if (isGenerating || filesRef.current.length === 0) {
      return;
    }

    // Phase 2: Sync lastMainEffectDigestRef so hot-patch effect skips this digest
    lastMainEffectDigestRef.current = filesDigest;

    // Phase 2: Skip if we just synced from external in the same render cycle
    if (justSyncedFromExternalRef.current) {
      justSyncedFromExternalRef.current = false;
      prevFilesDigestRef.current = filesDigest;
      console.info('[CompilationBridge] Effect: skipping — just synced from external');
      return;
    }

    // If stableHTML already exists but filesDigest changed, reset it so
    // recompilation can run with the new files
    if (stableHTMLRef.current && filesDigest !== prevFilesDigestRef.current) {
      // Check if this file change should skip recompilation (e.g. visual edit already applied to iframe)
      if (skipNextCompileRef?.current) {
        skipNextCompileRef.current = false;
        prevFilesDigestRef.current = filesDigest;
        liveSync.resetSnapshot(filesRef.current);
        console.info('[CompilationBridge] Skipping recompile (visual edit — iframe already correct)');
        return;
      }
      // Files changed while preview exists — try hot-patching first
      prevFilesDigestRef.current = filesDigest;
      const patched = liveSync.applyPatches(previewIframeRef, filesRef.current);
      if (patched === true) {
        console.info('[CompilationBridge] Effect: hot-patched CSS successfully, skipping full recompile');
        return;
      }
      if (patched === 'soft-reload') {
        // Gap 5 HMR: JS/TS changed — recompile but do a soft reload instead of iframe remount
        console.info('[CompilationBridge] Effect: JS changed, will recompile + soft-reload (preserving state)');
        compilationLockRef.current = false;
        compilationAttemptedRef.current = false;
        softReloadPendingRef.current = true;
        // Fall through to start recompilation
      } else {
        console.info('[CompilationBridge] Effect: hot-patch failed, doing full recompile (keeping old preview visible)');
      }
      compilationLockRef.current = false;
      compilationAttemptedRef.current = false; // Phase 1: enable recompilation after hot-patch fail
      // Fall through to start recompilation
    } else if (stableHTMLRef.current) {
      console.info('[CompilationBridge] Effect: stableHTML already set, skipping');
      return;
    }
    prevFilesDigestRef.current = filesDigest;

    // CRITICAL FIX: Always unlock when we have no preview.
    // This handles auto-restore where files exist but stableHTML is null
    // and compilationLockRef is still true from a previous session.
    if (!stableHTMLRef.current) {
      compilationLockRef.current = false;
    }

    // Prevent re-entry — only compile once per generation cycle
    if (compilationLockRef.current) {
      console.info('[CompilationBridge] Effect: compilationLock is true, skipping');
      return;
    }

    const debounceMs = immediateCompileNeededRef.current ? 0 : 500;
    immediateCompileNeededRef.current = false;
    console.info(`[CompilationBridge] Effect: starting ${debounceMs}ms debounce for compilation`);
    // Debounce: wait for rapid file changes to settle (0ms for post-generation)
    if (compilationDebounceRef.current) clearTimeout(compilationDebounceRef.current);
    compilationDebounceRef.current = setTimeout(() => {
      if (compilationLockRef.current) {
        console.info('[CompilationBridge] Debounce fired but lock acquired by another, skipping');
        return;
      }
      // Skip if handleBgComplete already compiled and set the preview
      if (externalStableHTMLRef?.current && !stableHTMLRef.current) {
        console.info('[CompilationBridge] Debounce fired but external preview already set, syncing');
        stableHTMLRef.current = externalStableHTMLRef.current;
        setStableHTMLLocal(externalStableHTMLRef.current);
        compilationLockRef.current = true;
        compilationAttemptedRef.current = true;
        onCompilingChangeRef.current?.(false);
        return;
      }
      console.info('[CompilationBridge] Debounce fired, starting compilation');
      compilationLockRef.current = true;
      compilationRetryCountRef.current = 0;

      onCompilingChangeRef.current?.(true);

      let cancelled = false;
      let compileTimerId: ReturnType<typeof setTimeout>;
      let safetyTimeout: ReturnType<typeof setTimeout>;

      // Phase 1: Async compilation with yield points to keep browser responsive
      const runCompilation = async () => {
        if (cancelled) return;
        console.info('[CompilationBridge] runCompilation starting, isReact:', isReactProject, 'files:', filesRef.current.length);
        // Start safety timeout NOW (when compilation actually begins), not before
        safetyTimeout = setTimeout(() => {
          if (cancelled) return;
          if (compilationRetryCountRef.current < 1) {
            compilationRetryCountRef.current++;
            console.warn('[Compilation] Safety timeout reached — retrying once after 2s cooldown');
            clearTimeout(safetyTimeout);
            setTimeout(() => {
              if (cancelled) return;
              console.info('[Compilation] Retry: calling runCompilation() directly');
              runCompilation();
            }, 2000);
          } else {
            console.error('[Compilation] Safety timeout reached on retry — showing error fallback');
            onCompilingChangeRef.current?.(false);
            compilationAttemptedRef.current = true;
            setLiveCompiledHTML(ERROR_FALLBACK_HTML);
          }
        }, COMPILE_TIMEOUT_MS);

        // Bail if external compilation (handleBgComplete) already provided a preview
        if (externalStableHTMLRef?.current) {
          console.info('[CompilationBridge] runCompilation: external preview arrived, bailing');
          clearTimeout(safetyTimeout);
          onCompilingChangeRef.current?.(false);
          compilationAttemptedRef.current = true;
          if (!stableHTMLRef.current) {
            stableHTMLRef.current = externalStableHTMLRef.current;
            setStableHTMLLocal(externalStableHTMLRef.current);
          }
          return;
        }
        try {
          console.time('[liveCompiledHTML]');
          let result: string | null = null;
          // Yield to browser before heavy work
          await new Promise(r => setTimeout(r, 0));
          if (cancelled) return;
          if (isReactProject) {
            // Race the worker against a 30s timeout — if worker hangs (e.g. esbuild WASM init),
            // fall back to the vanilla compiler which always works
            const workerTimeout = new Promise<null>((resolve) =>
              setTimeout(() => {
                console.warn('[CompilationBridge] Worker compilation timed out after 30s — trying vanilla fallback');
                resolve(null);
              }, 30_000)
            );
            const workerResult = compileReactProjectRef.current(filesRef.current, {
              supabaseConfig: supabaseConfig || undefined,
              stripeConfig: stripeConfig || undefined,
              envVars,
            }).then(compiled => {
              if (compiled.errors.length > 0) {
                console.warn('[ReactCompiler] Warnings:', compiled.errors);
              }
              return compiled.html || null;
            }).catch((err: Error) => {
              console.warn('[ReactCompiler] Worker failed:', err.message);
              return null;
            });

            result = await Promise.race([workerResult, workerTimeout]);

            // If worker failed/timed out, try vanilla compiler as fallback
            if (!result && !cancelled) {
              console.info('[CompilationBridge] Attempting vanilla fallback compilation');
              try {
                result = getCompiledHTMLRef.current(supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowserRef.current, linkedGPT);
              } catch (fallbackErr) {
                console.warn('[CompilationBridge] Vanilla fallback also failed:', fallbackErr);
              }
            }
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
            if (result) {
              setLiveCompiledHTML(result);
              setStableHTML(result);
              liveSync.resetSnapshot(filesRef.current);
              if (softReloadPendingRef.current) {
                softReloadPendingRef.current = false;
                window.postMessage({ type: '__SOFT_RELOAD__', source: 'compilation-bridge' }, '*');
              }
              window.postMessage({ type: '__PREVIEW_READY__', source: 'compilation-bridge' }, '*');
            } else {
              console.warn('[CompilationBridge] Both worker and vanilla compilation returned null — showing error fallback');
              setLiveCompiledHTML(ERROR_FALLBACK_HTML);
              setStableHTML(ERROR_FALLBACK_HTML);
            }
          }
        } catch (e) {
          console.error('[ReactCompiler] Compilation crashed:', e);
          if (!cancelled) {
            clearTimeout(safetyTimeout);
            onCompilingChangeRef.current?.(false);
            compilationAttemptedRef.current = true;
            setLiveCompiledHTML(ERROR_FALLBACK_HTML);
            setStableHTML(ERROR_FALLBACK_HTML);
          }
        }
      };
      // Defer start with a short setTimeout (removed rAF which Firefox
      // throttles under load, preventing compilation from ever starting)
      compileTimerId = setTimeout(runCompilation, 50);

      compilationCleanupRef.current = () => {
        cancelled = true;
        clearTimeout(compileTimerId);
        clearTimeout(safetyTimeout);
        onCompilingChangeRef.current?.(false);
      };
    }, debounceMs);

    return () => {
      // Only cancel the debounce timer — do NOT cancel in-progress compilation.
      // When compileTrigger increments, the effect re-runs and this cleanup fires.
      // Cancelling the running compilation here was the root cause of blank previews:
      // the generation-ending effect incremented compileTrigger, which cancelled
      // the compilation that was just started in the same render cycle.
      if (compilationDebounceRef.current) clearTimeout(compilationDebounceRef.current);
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
      if (stableHTML === liveCompiledHTML) return;
      // If we have no current preview (stableHTML is null), always do a full
      // srcdoc load — hot-patching can't work on an empty iframe.
      if (stableHTML === null) {
        setStableHTML(liveCompiledHTML);
        liveSync.resetSnapshot(filesRef.current);
        return;
      }
      // Always replace stableHTML with the new compilation result.
      // Hot-patching fails for full regenerations (JS/TS changes),
      // so just do a direct replacement to ensure the new preview shows.
      setStableHTML(liveCompiledHTML);
      liveSync.resetSnapshot(filesRef.current);
    }
    if (!isGenerating && !liveCompiledHTML && filesRef.current.length > 0 && stableHTML === null && compilationAttemptedRef.current) {
      console.warn('[Preview] Generation complete but compilation returned null — showing error fallback');
      setStableHTML(ERROR_FALLBACK_HTML);
    }
  }, [isGenerating, liveCompiledHTML, filesDigest, stableHTML, setStableHTML]);

  // Hot-patch during manual edits — guarded to skip when main effect already handled this digest
  const lastMainEffectDigestRef = useRef<string>('');
  useEffect(() => {
    // Phase 5: Skip if no preview, during compilation, or if main effect already processed this digest
    if (!stableHTML || isGenerating || compilationLockRef.current) return;
    if (filesDigest === lastMainEffectDigestRef.current) return;
    lastMainEffectDigestRef.current = filesDigest;
    if (filesRef.current.length > 0) {
      liveSync.applyPatches(previewIframeRef, filesRef.current);
    }
  }, [filesDigest, isGenerating, stableHTML]);


  // This component renders nothing — it only manages compilation state
  return null;
}
