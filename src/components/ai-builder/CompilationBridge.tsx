import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import { detectReactProject } from '@/hooks/useReactCompiler';
import { useWorkerCompiler } from '@/hooks/useWorkerCompiler';
import type { SupabaseConfig, StripeConfig, ServiceKey, EnvVar } from './ProjectSettings';
import type { CDNPackage } from './PackageManager';
import type { LinkedGPTConfig } from './GPTConnectorPanel';
import { useLivePreviewSync } from '@/hooks/useLivePreviewSync';
import type { ProjectAsset } from './AssetManager';

const COMPILE_TIMEOUT_MS = 40_000;
const COMPILE_SAFETY_TIMEOUT_MS = 50_000; // Hard safety net — if isCompiling stays true longer, force reset

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
  onForceCompile?: (fn: () => void) => void;
  assets?: ProjectAsset[];
  validateFiles?: (files: ProjectFile[]) => { isValid: boolean; issues: { severity: string; message: string; file: string }[] };
}

export const ERROR_FALLBACK_HTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Compilation Error</title><style>*{margin:0;padding:0;box-sizing:border-box}body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a14;color:#fff;font-family:system-ui,sans-serif}.card{text-align:center;max-width:440px;padding:2rem}h1{font-size:1.5rem;margin-bottom:1rem;color:#f87171}p{color:#ffffff90;line-height:1.6;margin-bottom:0.5rem}code{background:#1e1e2e;padding:2px 6px;border-radius:4px;font-size:0.85em}</style></head><body><div class="card"><h1>⚠️ Compilation Error</h1><p>Your project files were generated but could not be compiled into a preview.</p><p>Check that your project has an <code>index.html</code> file and try regenerating.</p></div></body></html>`;

export const VALIDATING_FALLBACK_HTML = `<!doctype html><html><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /><meta name="ai-builder-fallback" content="validating" /><title>Validating…</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a14;color:#fff;font-family:system-ui,sans-serif}.card{max-width:520px;padding:24px;text-align:center}.spinner{width:22px;height:22px;border:2px solid #ffffff2a;border-top-color:#a78bfa;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 12px}@keyframes spin{to{transform:rotate(360deg)}}h1{font-size:18px;margin:0 0 8px;color:#a78bfa}p{margin:0;color:#ffffff80;line-height:1.5}</style></head><body><div class="card"><div class="spinner"></div><h1>Validating generated code…</h1><p>Syntax issues were detected. We're preparing an automatic repair.</p></div></body></html>`;

/**
 * CompilationBridge — isolated child component for all compilation hooks.
 *
 * SINGLE COMPILATION PATH: One effect triggers compilation when isGenerating
 * transitions to false. A single `compilationInFlightRef` prevents double-entry.
 * No more competing timers or lock coordination.
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
  onForceCompile,
  assets = [],
  validateFiles,
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

  // Serialize file identity to prevent effect re-fires from reference changes.
  // PERF: Skip expensive hashing during generation — files change frequently via
  // streaming setFiles calls, but compilation is blocked anyway.
  const prevDigestRef = useRef('');
  const filesDigest = useMemo(() => {
    if (isGenerating || files.length === 0) return prevDigestRef.current || '';
    const digest = files.map(f => {
      let hash = 5381;
      for (let i = 0; i < f.content.length; i++) {
        hash = ((hash << 5) + hash + f.content.charCodeAt(i)) & 0x7fffffff;
      }
      return f.path + ':' + hash;
    }).join('|');
    prevDigestRef.current = digest;
    return digest;
  }, [files, isGenerating]);

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
  const setStableHTML = useCallback((html: string | null) => {
    console.info('[CompilationBridge] setStableHTML:', html ? `${html.length} chars` : 'null');
    setStableHTMLLocal(html);
    stableHTMLRef.current = html;
    onStableHTML(html);
  }, [onStableHTML]);

  // ── SINGLE in-flight guard — replaces all previous lock/attempted/digest refs ──
  const compilationInFlightRef = useRef(false);
  // ── Compile run-ID guard — monotonically incrementing to prevent stale results ──
  const compileRunIdRef = useRef(0);
  // Track whether the next compile is an incremental edit (not first generation)
  const isIncrementalEditRef = useRef(false);

  // ── liveCompiledHTML (async, post-generation) ──
  const [liveCompiledHTML, setLiveCompiledHTML] = useState<string | null>(null);
  const [forceCompileTrigger, setForceCompileTrigger] = useState(0);

  const liveSync = useLivePreviewSync();

  // Track previous filesDigest for hot-patch detection
  const prevFilesDigestRef = useRef<string>('');

  // ── Core compile function ──
  const runCompile = useCallback(async () => {
    const currentFiles = filesRef.current;
    const useLocalOnly = isIncrementalEditRef.current;
    console.info('[CompilationBridge] runCompile — isReact:', isReactProject, 'files:', currentFiles.length, 'localOnly:', useLocalOnly);

    let result: string | null = null;

    if (isReactProject) {
      try {
        const timeout = useLocalOnly ? 15_000 : 30_000;
        const workerTimeout = new Promise<null>((resolve) =>
          setTimeout(() => {
            console.warn(`[CompilationBridge] Compilation timed out after ${timeout / 1000}s`);
            resolve(null);
          }, timeout)
        );
        const workerResult = compileReactProjectRef.current(currentFiles, {
          supabaseConfig: supabaseConfig || undefined,
          stripeConfig: stripeConfig || undefined,
          envVars,
          localOnly: useLocalOnly,
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
      } catch {
        result = null;
      }

      // Vanilla fallback if worker failed
      if (!result) {
        try {
          result = getCompiledHTMLRef.current(supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowserRef.current, linkedGPT);
        } catch { /* noop */ }
      }
    } else {
      try {
        result = getCompiledHTMLRef.current(supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowserRef.current, linkedGPT);
      } catch { result = null; }
    }

    // Reset flag after use
    isIncrementalEditRef.current = false;

    // Inject uploaded assets into the compiled HTML so images render in preview
    if (result && assets.length > 0) {
      const assetScript = assets.map(a => 
        `window.__ASSETS__=window.__ASSETS__||{};window.__ASSETS__[${JSON.stringify(a.name)}]=${JSON.stringify(a.dataUrl)};`
      ).join('');
      // Also inject CSS custom properties for each asset
      const assetCSS = assets
        .filter(a => a.type.startsWith('image/'))
        .map(a => `--asset-${a.name.replace(/[^a-zA-Z0-9]/g, '-')}:url(${a.dataUrl});`)
        .join('');
      const injection = `<script>${assetScript}</script>${assetCSS ? `<style>:root{${assetCSS}}</style>` : ''}`;
      result = result.replace('</head>', `${injection}</head>`);
    }

    return result;
  }, [isReactProject, supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, linkedGPT, assets]);

  // ── Reset stableHTML when a new generation starts ──
  const prevIsGeneratingRef = useRef(false);
  useEffect(() => {
    if (isGenerating && !prevIsGeneratingRef.current) {
      // Generation STARTING — reset ALL internal state
      stableHTMLRef.current = null;
      setLiveCompiledHTML(null);
      compilationInFlightRef.current = false;
      compileRunIdRef.current = 0; // Reset run-ID guard
      prevFilesDigestRef.current = '';
      prevDigestRef.current = ''; // Reset memo cache so filesDigest recalculates on generation end
      // Safety: force-clear isCompiling in case it was stuck from previous cycle
      onCompilingChangeRef.current?.(false);
    }
    prevIsGeneratingRef.current = isGenerating;
  }, [isGenerating]);

  // ── SINGLE COMPILATION PATH ──
  // Fires when: isGenerating becomes false, files exist, and no preview yet.
  // Also fires when filesDigest changes (manual edits after generation).
  useEffect(() => {
    if (isGenerating || filesRef.current.length === 0) return;

    // Sync from external if handleBgComplete already compiled
    if (!stableHTMLRef.current && externalStableHTMLRef?.current) {
      console.info('[CompilationBridge] Syncing existing external preview');
      setStableHTML(externalStableHTMLRef.current);
      prevFilesDigestRef.current = filesDigest;
      return;
    }

    // If stableHTML exists and files changed — try hot-patching
    if (stableHTMLRef.current) {
      if (filesDigest === prevFilesDigestRef.current) return; // No change
      
      // Skip if visual edit already applied to iframe
      if (skipNextCompileRef?.current) {
        skipNextCompileRef.current = false;
        prevFilesDigestRef.current = filesDigest;
        liveSync.resetSnapshot(filesRef.current);
        console.info('[CompilationBridge] Skipping recompile (visual edit)');
        return;
      }

      prevFilesDigestRef.current = filesDigest;
      const patched = liveSync.applyPatches(previewIframeRef, filesRef.current);
      if (patched === true) {
        console.info('[CompilationBridge] Hot-patched CSS successfully');
        return;
      }
      if (patched === 'soft-reload') {
        softReloadPendingRef.current = true;
      }
      // Fall through to full recompile — but mark as incremental edit for local-only compilation
      isIncrementalEditRef.current = true;
      stableHTMLRef.current = null; // Allow recompile
    }

    prevFilesDigestRef.current = filesDigest;

    // Already compiling? Skip.
    if (compilationInFlightRef.current) {
      console.info('[CompilationBridge] Compilation already in flight, skipping');
      return;
    }

    // Shorter debounce for incremental edits (50ms) vs initial generation (150ms)
    const debounceMs = isIncrementalEditRef.current ? 50 : 150;
    let safetyTimer: ReturnType<typeof setTimeout> | undefined;
    const timer = setTimeout(async () => {
      // Double-check guards after debounce
      if (compilationInFlightRef.current) return;
      if (stableHTMLRef.current && !softReloadPendingRef.current) return;

      // ── Early validation gate — skip compile if syntax errors ──
      if (validateFiles) {
        const currentFiles = filesRef.current;
        const vResult = validateFiles(currentFiles);
        const syntaxErrors = vResult.issues.filter(i => i.severity === 'error');
        if (syntaxErrors.length > 0) {
          console.warn('[CompilationBridge] VALIDATION GATE: skipping compile —', syntaxErrors.length, 'errors');
          window.postMessage({
            type: '__BUILD_GATED__',
            payload: {
              reason: 'syntax_errors',
              errors: syntaxErrors.map(e => `${e.file}: ${e.message}`),
            },
            source: 'compilation-bridge',
          }, '*');
          // IMPORTANT: stop "compiling" state immediately
          onCompilingChangeRef.current?.(false);
          compilationInFlightRef.current = false;

          if (stableHTMLRef.current) {
            // Preserve last-known-good preview — don't overwrite
            return;
          }
          // No LKG: show validating placeholder so preview is never blank
          // Render-only: show fallback in iframe WITHOUT updating stableHTMLRef or calling onStableHTML
          setStableHTMLLocal(VALIDATING_FALLBACK_HTML);
          console.info('[CompilationBridge] Showing validation fallback (render-only)', {
            htmlLength: VALIDATING_FALLBACK_HTML.length,
            stableHTMLRef: stableHTMLRef.current ? 'truthy' : 'null',
          });
          return;
        }
      }

      // ── Compile run-ID guard — increment to tag this run ──
      const thisRunId = ++compileRunIdRef.current;
      const t0 = performance.now();

      compilationInFlightRef.current = true;
      onCompilingChangeRef.current?.(true);
      console.info('[CompilationBridge] compile start', { runId: thisRunId, t0 });

      // Safety net: force-reset isCompiling if compilation hangs
      safetyTimer = setTimeout(() => {
        if (compilationInFlightRef.current) {
          console.warn('[CompilationBridge] safety timeout', { runId: thisRunId, ms: Math.round(performance.now() - t0) });
          // Invalidate any in-flight promise so late results are discarded
          compileRunIdRef.current++;
          compilationInFlightRef.current = false;
          onCompilingChangeRef.current?.(false);
          if (!stableHTMLRef.current) {
            setLiveCompiledHTML(ERROR_FALLBACK_HTML);
            setStableHTML(ERROR_FALLBACK_HTML);
          }
        }
      }, COMPILE_SAFETY_TIMEOUT_MS);

      try {
        // Yield to browser
        await new Promise(r => setTimeout(r, 0));

        // Bail if external arrived during debounce
        if (externalStableHTMLRef?.current && !stableHTMLRef.current) {
          setStableHTML(externalStableHTMLRef.current);
          return;
        }

        console.info('[CompilationBridge] compile tier start', { runId: thisRunId, ms: Math.round(performance.now() - t0) });
        const result = await runCompile();
        console.info('[CompilationBridge] compile resolved', { runId: thisRunId, ms: Math.round(performance.now() - t0) });

        // ── Stale run-ID check — discard if a newer compile was started ──
        if (thisRunId !== compileRunIdRef.current) {
          console.info('[CompilationBridge] Stale compile run', thisRunId, '— discarding (current:', compileRunIdRef.current, ')');
          return;
        }

        if (result) {
          // ── Dev-client detection gate ──
          const looksLikeViteDev = /\/@vite\/client|import\.meta\.hot\b|__vite_plugin_react_preamble_installed__/.test(result);
          if (looksLikeViteDev) {
            console.warn('[CompilationBridge] BUILD GATED: dev client detected in output');
            window.postMessage({
              type: '__BUILD_GATED__',
              payload: { reason: 'dev_client_detected', errors: ['Compiled output contains Vite dev/HMR client'] },
              source: 'compilation-bridge',
            }, '*');
            return; // Keep LKG
          }

          // ── Fail-closed preview gate ──
          const filesToValidate = filesRef.current;
          const hasIncomplete = filesToValidate.some(f => (f as any).incomplete === true);

          if (hasIncomplete) {
            const reason = 'incomplete_files';
            console.warn('[CompilationBridge] BUILD GATED:', reason);
            window.postMessage({
              type: '__BUILD_GATED__',
              payload: { reason, errors: ['One or more files are incomplete (stream truncated)'] },
              source: 'compilation-bridge',
            }, '*');
            // Keep previous LKG preview — do NOT set stableHTML
          } else {
            setLiveCompiledHTML(result);
            console.info('[CompilationBridge] setStableHTML applied', { runId: thisRunId, ms: Math.round(performance.now() - t0) });
            setStableHTML(result);
            console.info('[CompilationBridge] Compile success', {
              runId: thisRunId,
              htmlLength: result?.length ?? 0,
              first80: result?.slice(0, 80) ?? '',
              hasDoctype: (result?.includes('<!') ?? false),
            });
            liveSync.resetSnapshot(filesRef.current);
            if (softReloadPendingRef.current) {
              softReloadPendingRef.current = false;
              window.postMessage({ type: '__SOFT_RELOAD__', source: 'compilation-bridge' }, '*');
            }
            window.postMessage({ type: '__PREVIEW_READY__', source: 'compilation-bridge' }, '*');
          }
        } else {
          console.warn('[CompilationBridge] Compilation returned null — showing error fallback');
          setLiveCompiledHTML(ERROR_FALLBACK_HTML);
          setStableHTML(ERROR_FALLBACK_HTML);
        }
      } catch (err) {
        console.error('[CompilationBridge] Compilation crashed:', err);
        // Only apply fallback if this run is still current
        if (thisRunId === compileRunIdRef.current) {
          setLiveCompiledHTML(ERROR_FALLBACK_HTML);
          setStableHTML(ERROR_FALLBACK_HTML);
        }
      } finally {
        clearTimeout(safetyTimer);
        compilationInFlightRef.current = false;
        onCompilingChangeRef.current?.(false);
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      clearTimeout(safetyTimer);
    };
  }, [filesDigest, isGenerating, supabaseConfig, stripeConfig, isReactProject, setStableHTML, runCompile, forceCompileTrigger]);

  // Expose forceCompile to parent
  useEffect(() => {
    onForceCompile?.(() => {
      console.info('[CompilationBridge] forceCompile invoked — invalidating in-flight run');
      compileRunIdRef.current++; // Invalidate any in-flight compile
      compilationInFlightRef.current = false;
      stableHTMLRef.current = null;
      prevFilesDigestRef.current = '';
      // Trigger recompile by resetting — the main effect will pick it up
      setLiveCompiledHTML(null);
      setForceCompileTrigger(c => c + 1);
    });
  }, [onForceCompile]);

  // ── compiledForHosting (deferred until live preview is done) ──
  const [compiledForHosting, setCompiledForHosting] = useState<string | null>(null);
  const hostingLockRef = useRef(false);

  useEffect(() => {
    if (isGenerating) {
      setCompiledForHosting(null);
      hostingLockRef.current = false;
      return;
    }
    if (filesRef.current.length === 0) return;
    if (!stableHTMLRef.current) return; // Wait until preview is ready
    if (hostingLockRef.current) return;
    hostingLockRef.current = true;

    const doCompile = () => {
      try {
        console.time('[compiledForHosting]');
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

  // ── Preview update effects ──
  useEffect(() => {
    if (liveCompiledHTML) {
      if (stableHTML === liveCompiledHTML) return;
      if (stableHTML === null) {
        setStableHTML(liveCompiledHTML);
        liveSync.resetSnapshot(filesRef.current);
        return;
      }
      setStableHTML(liveCompiledHTML);
      liveSync.resetSnapshot(filesRef.current);
    }
    // Removed: premature error fallback that fired before the 150ms compilation debounce.
    // The main compilation effect (line 202) handles error fallback after actual compile failure.
  }, [isGenerating, liveCompiledHTML, filesDigest, stableHTML, setStableHTML]);

  // Hot-patch during manual edits
  useEffect(() => {
    if (!stableHTML || isGenerating || compilationInFlightRef.current) return;
    if (filesRef.current.length > 0) {
      liveSync.applyPatches(previewIframeRef, filesRef.current);
    }
  }, [filesDigest, isGenerating, stableHTML]);

  // This component renders nothing
  return null;
}
