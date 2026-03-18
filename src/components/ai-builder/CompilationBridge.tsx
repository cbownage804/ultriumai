import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import { detectReactProject } from '@/hooks/useReactCompiler';
import { useWorkerCompiler } from '@/hooks/useWorkerCompiler';
import type { SupabaseConfig, StripeConfig, ServiceKey, EnvVar } from './ProjectSettings';
import type { CDNPackage } from './PackageManager';
import type { LinkedGPTConfig } from './GPTConnectorPanel';
import { useLivePreviewSync } from '@/hooks/useLivePreviewSync';
import type { ProjectAsset } from './AssetManager';
import { isPreviewValid, previewDebugSummary } from './previewValidation';
import { autoRepairFiles } from './autoRepairFiles';
import { generateMissingImportStubs } from './generateMissingImportStubs';
import { scaffoldTailwindConfig } from './scaffoldTailwindConfig';
import { preCompileValidate } from './preCompileValidation';
import { parseViteErrors, mergeErrorSources } from './parseViteErrors';
import type { ParsedViteError } from './parseViteErrors';
import { useCompileTelemetry, classifyFailure } from '@/hooks/useCompileTelemetry';
import { useRuntimeErrorOverlay } from './useRuntimeErrorOverlay';
import { usePreviewHealthMonitor } from './usePreviewHealthMonitor';
import { useConsoleForwarding } from './useConsoleForwarding';
import { useTypescriptSoftening } from './useTypescriptSoftening';
import { useIncrementalCompileCache } from './useIncrementalCompileCache';
import { useDependencyCache } from './useDependencyCache';
import { useHMRStatePreservation } from './useHMRStatePreservation';
import { useViteErrorOverlay } from './useViteErrorOverlay';
import { useCSSHotReload } from './useCSSHotReload';
import { useAutoDepResolver } from './useAutoDepResolver';
import { useAutoTestGenerator } from './useAutoTestGenerator';
import { useDeployGate } from './useDeployGate';

/** Compile State Machine — single source of truth for compilation phase */
export type CompileState = 'idle' | 'compiling' | 'success' | 'error';

export interface CompileErrorInfo {
  message: string;
  errors: string[];
}

const COMPILE_TIMEOUT_MS = 30_000; // Single-path Vite Sandbox budget
const COMPILE_SAFETY_TIMEOUT_MS = 40_000; // Hard safety net beyond normal timeout
const COMPILE_HARD_TIMEOUT_MS = COMPILE_TIMEOUT_MS;
interface CompilationBridgeProps {
  files: ProjectFile[];
  isGenerating: boolean;
  isGoldenProject?: boolean;
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
  onCompileStateChange?: (state: CompileState, error?: CompileErrorInfo) => void;
  skipNextCompileRef?: React.MutableRefObject<boolean>;
  externalStableHTMLRef?: React.RefObject<string | null>;
  onForceCompile?: (fn: () => void) => void;
  assets?: ProjectAsset[];
  validateFiles?: (files: ProjectFile[]) => { isValid: boolean; issues: { severity: string; message: string; file: string }[] };
  /** Callback to surface structured error annotations to the editor */
  onErrorAnnotations?: (annotations: ParsedViteError[]) => void;
  /** Callback on successful build with current files (for LKG snapshot) */
  onBuildSuccess?: (files: ProjectFile[]) => void;
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
  onCompileStateChange,
  skipNextCompileRef,
  externalStableHTMLRef,
  onForceCompile,
  assets = [],
  validateFiles,
  isGoldenProject = false,
  onErrorAnnotations,
  onBuildSuccess,
}: CompilationBridgeProps) {
  // ── Worker-based React Compiler (off main thread) ──
  const { compileReactProject, abortCompilation, lockCompile, unlockCompile } = useWorkerCompiler();

  // ── Runtime error overlay ──
  const { injectOverlay } = useRuntimeErrorOverlay();
  const injectOverlayRef = useRef(injectOverlay);
  injectOverlayRef.current = injectOverlay;

  // ── Preview health monitor ──
  const { injectHealthMonitor, startMonitoring, onHealthIssue } = usePreviewHealthMonitor();
  const injectHealthMonitorRef = useRef(injectHealthMonitor);
  injectHealthMonitorRef.current = injectHealthMonitor;

  // ── Console error forwarding from iframe ──
  const { injectConsoleForwarding } = useConsoleForwarding((entry) => {
    if (entry.level === 'error') {
      console.warn('[ConsoleForward] iframe error:', entry.message);
    }
  });
  const injectConsoleForwardingRef = useRef(injectConsoleForwarding);
  injectConsoleForwardingRef.current = injectConsoleForwarding;

  // ── TypeScript error softening ──
  const { softenErrors } = useTypescriptSoftening();
  const softenErrorsRef = useRef(softenErrors);
  softenErrorsRef.current = softenErrors;

  // ── Incremental compile cache (HMR-style delta detection) ──
  const { computeDelta, snapshotBuild: snapshotIncrementalBuild, resetCache: resetIncrementalCache } = useIncrementalCompileCache();
  const computeDeltaRef = useRef(computeDelta);
  computeDeltaRef.current = computeDelta;

  // ── Dependency cache (skip re-resolution when imports unchanged) ──
  const { checkDependencies, recordBuild: recordDepBuild, resetCache: resetDepCache } = useDependencyCache();

  // ── HMR state preservation (save/restore UI state across reloads) ──
  const { injectHMRScript, saveState: saveHMRState, restoreState: restoreHMRState } = useHMRStatePreservation();
  const injectHMRScriptRef = useRef(injectHMRScript);
  injectHMRScriptRef.current = injectHMRScript;

  // ── Vite-style error overlay (clickable stack traces in preview) ──
  const { injectErrorOverlay, showOverlay: showErrorOverlay, clearOverlay: clearErrorOverlay } = useViteErrorOverlay();
  const injectErrorOverlayRef = useRef(injectErrorOverlay);
  injectErrorOverlayRef.current = injectErrorOverlay;

  // ── CSS hot reload (sub-100ms style injection) ──
  const { detectCSSOnlyChange, hotInjectCSS, snapshotCSS } = useCSSHotReload();

  // ── Auto dependency resolver (bare import → esm.sh) ──
  const { resolveImports, injectImportMap, resetResolver: resetDepResolver } = useAutoDepResolver();

  // ── Auto test generator (AI-powered post-build tests) ──
  const { injectTestHarness, runAutoTests } = useAutoTestGenerator();
  const injectTestHarnessRef = useRef(injectTestHarness);
  injectTestHarnessRef.current = injectTestHarness;

  // ── Deploy gate (smoke tests before deploy) ──
  const { injectSmokeTests, runSmokeTests } = useDeployGate();
  const injectSmokeTestsRef = useRef(injectSmokeTests);
  injectSmokeTestsRef.current = injectSmokeTests;
  // Start monitoring on mount
  useEffect(() => {
    const cleanup = startMonitoring();
    onHealthIssue((issue) => {
      console.warn('[CompilationBridge] Preview health issue:', issue.type, issue.message);
      if (issue.type === 'blank_screen') {
        onCompileStateChangeRef.current?.('error', {
          message: 'Blank screen detected — app rendered but nothing is visible',
          errors: [issue.message],
        });
      } else if (issue.type === 'infinite_loop') {
        onCompileStateChangeRef.current?.('error', {
          message: 'Possible infinite re-render loop detected',
          errors: [issue.message],
        });
      }
    });
    return cleanup;
  }, [startMonitoring, onHealthIssue]);

  // Stabilize function refs to prevent effect re-fires
  // ── Compile telemetry ──
  const { recordCompile } = useCompileTelemetry();
  const recordCompileRef = useRef(recordCompile);
  recordCompileRef.current = recordCompile;

  const compileReactProjectRef = useRef(compileReactProject);
  compileReactProjectRef.current = compileReactProject;
  const getCompiledHTMLRef = useRef(getCompiledHTML);
  getCompiledHTMLRef.current = getCompiledHTML;
  const bundleForBrowserRef = useRef(bundleForBrowser);
  bundleForBrowserRef.current = bundleForBrowser;
  const onCompilingChangeRef = useRef(onCompilingChange);
  onCompilingChangeRef.current = onCompilingChange;
  const onCompileStateChangeRef = useRef(onCompileStateChange);
  onCompileStateChangeRef.current = onCompileStateChange;

  // Helper to transition compile state machine
  const transitionCompileState = useCallback((state: CompileState, error?: CompileErrorInfo) => {
    onCompilingChangeRef.current?.(state === 'compiling');
    onCompileStateChangeRef.current?.(state, error);
  }, []);

  // Store files in a ref so effects can read latest data without depending on the array reference
  const filesRef = useRef(files);
  filesRef.current = files;

  // Serialize file identity to prevent effect re-fires from reference changes.
  // PERF: Skip expensive hashing during generation — files change frequently via
  // streaming setFiles calls, but compilation is blocked anyway.
  const prevDigestRef = useRef('');
  const forceCompileRequestedRef = useRef(false);
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
  const goldenIdleAppliedRef = useRef(false);
  // Once generation has started at least once, never force golden idle again.
  // This prevents valid compile errors (from failed generations) from being cleared
  // back to idle + placeholder when files are still golden/default.
  const hasEverGeneratedRef = useRef(false);

  // ── LKG sessionStorage persistence ──
  const LKG_STORAGE_KEY = 'ai-builder-lkg-preview';
  
  // On mount: restore LKG from sessionStorage
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(LKG_STORAGE_KEY);
      if (cached && isPreviewValid(cached) && !stableHTMLRef.current) {
        console.info('[CompilationBridge] Restored LKG from sessionStorage:', cached.length, 'chars');
        setStableHTMLLocal(cached);
        stableHTMLRef.current = cached;
        onStableHTML(cached);
        onCompileStateChangeRef.current?.('success');
        onCompilingChangeRef.current?.(false);
      }
    } catch {}
  }, []);

  // ── stableHTML state ──
  const [stableHTML, setStableHTMLLocal] = useState<string | null>(null);
  const stableHTMLRef = useRef<string | null>(null);
  const setStableHTML = useCallback((html: string | null) => {
    console.info('[CompilationBridge] setStableHTML:', html ? `${html.length} chars` : 'null');
    setStableHTMLLocal(html);
    stableHTMLRef.current = html;
    onStableHTML(html);
    
    // Persist to sessionStorage on success (skip fallback/error HTML)
    if (html && isPreviewValid(html) && !html.includes('ai-builder-fallback')) {
      try {
        sessionStorage.setItem(LKG_STORAGE_KEY, html);
      } catch {}
    }
  }, [onStableHTML]);

  // ── SINGLE in-flight guard — replaces all previous lock/attempted/digest refs ──
  const compilationInFlightRef = useRef(false);
  // ── Compile run-ID guard — monotonically incrementing to prevent stale results ──
  const compileRunIdRef = useRef(0);
  // Track whether the next compile is an incremental edit (not first generation)
  const isIncrementalEditRef = useRef(false);
  // Track the filesDigest at compile start — if it changed by the time compile finishes, retrigger
  const compiledDigestRef = useRef<string>('');
  const recompileNeededRef = useRef(false);

  // ── liveCompiledHTML (async, post-generation) ──
  const [liveCompiledHTML, setLiveCompiledHTML] = useState<string | null>(null);
  const [forceCompileTrigger, setForceCompileTrigger] = useState(0);

  const liveSync = useLivePreviewSync();

  // Track previous filesDigest for hot-patch detection
  const prevFilesDigestRef = useRef<string>('');

  const isAbortError = useCallback((error: unknown) => {
    if (!(error instanceof Error)) return false;
    return error.name === 'AbortError' || /\babort(ed)?\b/i.test(error.message);
  }, []);

  const prepareFilesForCompile = useCallback((inputFiles: ProjectFile[]) => {
    let preparedFiles = inputFiles;

    const { files: repairedFiles, repairs } = autoRepairFiles(preparedFiles);
    if (repairs.length > 0) {
      preparedFiles = repairedFiles;
    }

    const { files: stubbedFiles, stubs } = generateMissingImportStubs(preparedFiles);
    if (stubs.length > 0) {
      preparedFiles = stubbedFiles;
    }

    const { files: twFiles, scaffolded } = scaffoldTailwindConfig(preparedFiles);
    if (scaffolded.length > 0) {
      preparedFiles = twFiles;
    }

    return {
      files: preparedFiles,
      repairs,
      stubs,
      scaffolded,
    };
  }, []);

  // ── Core compile function (with auto-repair) ──
  const runCompile = useCallback(async () => {
    let currentFiles = filesRef.current;
    console.info('[CompilationBridge] runCompile — isReact:', isReactProject, 'files:', currentFiles.length);

    // ── Incremental delta detection (HMR-style) ──
    const delta = computeDeltaRef.current(currentFiles);
    if (!delta.isFullRebuild && delta.changed.length > 0) {
      console.info('[CompilationBridge] 🔄 Incremental build:', delta.changed.length, 'changed,', delta.unchangedCount, 'unchanged,', delta.deleted.length, 'deleted');
    }

    // ── Dependency cache check ──
    const depCheck = checkDependencies(currentFiles);
    if (depCheck.cacheHit) {
      console.info('[CompilationBridge] 📦 Dep cache hit — imports unchanged, reusing warm pool slot');
    } else if (!delta.isFullRebuild) {
      console.info('[CompilationBridge] 📦 Dep cache miss —', depCheck.imports.length, 'imports to resolve');
    }

    const { files: preparedFiles, repairs, stubs, scaffolded } = prepareFilesForCompile(currentFiles);
    if (repairs.length > 0) {
      console.info('[CompilationBridge] Auto-repaired', repairs.length, 'issues:', repairs);
    }
    if (stubs.length > 0) {
      console.info('[CompilationBridge] Generated', stubs.length, 'import stubs:', stubs);
    }
    if (scaffolded.length > 0) {
      console.info('[CompilationBridge] Scaffolded Tailwind config:', scaffolded);
    }
    currentFiles = preparedFiles;

    // ── Pre-compile validation: catch syntax errors instantly (<1ms) ──
    const preIssues = preCompileValidate(currentFiles);
    const preErrors = preIssues.filter(i => i.severity === 'error');
    if (preErrors.length > 0) {
      const errorMessages = preErrors.map(e => `${e.file}: ${e.message}`);
      console.warn('[CompilationBridge] Pre-compile validation caught', preErrors.length, 'errors:', errorMessages);
      const annotations = mergeErrorSources(preErrors, []);
      onErrorAnnotations?.(annotations);
      throw new Error(errorMessages.join('\n'));
    }
    if (preIssues.length > 0) {
      console.info('[CompilationBridge] Pre-compile warnings:', preIssues.map(e => `${e.file}: ${e.message}`));
      const warnAnnotations = mergeErrorSources(preIssues.filter(i => i.severity === 'warning'), []);
      if (warnAnnotations.length > 0) onErrorAnnotations?.(warnAnnotations);
    }

    let result: string | null = null;
    let compileError: Error | null = null;
    const compileT0 = performance.now();
    const BRIDGE_TIMEOUT = 30_000;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
      const workerTimeout = new Promise<null>((resolve) => {
        timeoutId = setTimeout(() => {
          console.warn(`[CompilationBridge] Compilation timed out after ${BRIDGE_TIMEOUT / 1000}s`);
          resolve(null);
        }, BRIDGE_TIMEOUT);
      });

      const workerResult = compileReactProjectRef.current(currentFiles, {
        supabaseConfig: supabaseConfig || undefined,
        stripeConfig: stripeConfig || undefined,
        envVars,
      }).then(compiled => {
        if (compiled.errors.length > 0) {
          const { blocking, warnings, shouldBlockPreview } = softenErrorsRef.current(compiled.errors);
          if (warnings.length > 0) {
            console.info('[TS-Soften] Downgraded', warnings.length, 'non-critical errors to warnings');
            console.warn('[ViteCompiler] Warnings (non-blocking):', warnings.map(w => w.message));
          }
          const parsed = parseViteErrors(compiled.errors);
          if (parsed.length > 0) onErrorAnnotations?.(parsed);
          if (shouldBlockPreview && blocking.length > 0) {
            throw new Error(blocking.map(error => error.message).join('\n'));
          }
        }

        if (!compiled.html && compiled.errorMessage) {
          throw new Error(compiled.errorMessage);
        }

        return compiled.html || null;
      }).catch((err: Error) => {
        if (isAbortError(err)) {
          throw err;
        }
        console.error('[ViteCompiler] Failed:', err.message);
        const parsed = parseViteErrors([err.message]);
        if (parsed.length > 0) onErrorAnnotations?.(parsed);
        throw err;
      });

      result = await Promise.race([workerResult, workerTimeout]);
    } catch (err) {
      if (isAbortError(err)) {
        throw err;
      }
      compileError = err instanceof Error ? err : new Error(String(err));
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }

    if (compileError) {
      const compileDuration = Math.round(performance.now() - compileT0);
      recordCompileRef.current({
        tier: 'vite',
        success: false,
        durationMs: compileDuration,
        htmlLength: 0,
        fileCount: currentFiles.length,
        errorMessage: compileError.message,
        failureReason: classifyFailure(compileError.message),
      });
      throw compileError;
    }

    if (!result && !isReactProject) {
      try {
        result = getCompiledHTMLRef.current(supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowserRef.current, linkedGPT);
      } catch {
        result = null;
      }
    }

    const compileDuration = Math.round(performance.now() - compileT0);
    recordCompileRef.current({
      tier: 'vite',
      success: !!result,
      durationMs: compileDuration,
      htmlLength: result?.length || 0,
      fileCount: currentFiles.length,
      errorMessage: result ? undefined : 'Compilation returned null',
      failureReason: result ? undefined : 'unknown',
    });

    isIncrementalEditRef.current = false;

    if (result && assets.length > 0) {
      const assetScript = assets.map(a =>
        `window.__ASSETS__=window.__ASSETS__||{};window.__ASSETS__[${JSON.stringify(a.name)}]=${JSON.stringify(a.dataUrl)};`
      ).join('');
      const assetCSS = assets
        .filter(a => a.type.startsWith('image/'))
        .map(a => `--asset-${a.name.replace(/[^a-zA-Z0-9]/g, '-')}:url(${a.dataUrl});`)
        .join('');
      const injection = `<script>${assetScript}</script>${assetCSS ? `<style>:root{${assetCSS}}</style>` : ''}`;
      result = result.replace('</head>', `${injection}</head>`);
    }

    if (result) {
      result = injectOverlayRef.current(result);
      result = injectHealthMonitorRef.current(result);
      result = injectConsoleForwardingRef.current(result);
      result = injectHMRScriptRef.current(result);
      result = injectErrorOverlayRef.current(result);
      result = injectTestHarnessRef.current(result);
      result = injectSmokeTestsRef.current(result);
    }

    if (result) {
      snapshotIncrementalBuild(currentFiles);
      recordDepBuild(currentFiles);
      snapshotCSS(currentFiles);
    }

    return result;
  }, [isAbortError, isReactProject, prepareFilesForCompile, supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, linkedGPT, assets]);

  // ── Streaming preview: compile partial files during generation ──
  // Shows progressive UI without promoting partial output to persistent LKG preview.
  const streamingCompileTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastStreamingCompileCountRef = useRef(0);
  const streamingCompileInFlightRef = useRef(false);
  const lastStreamingHTMLRef = useRef('');

  // Track streaming compile failures to cap attempts
  const streamingFailCountRef = useRef(0);
  const MAX_STREAMING_FAILURES = 2;

  useEffect(() => {
    if (!isGenerating) {
      // Clean up when generation ends
      if (streamingCompileTimerRef.current) {
        clearInterval(streamingCompileTimerRef.current);
        streamingCompileTimerRef.current = null;
      }
      lastStreamingCompileCountRef.current = 0;
      streamingCompileInFlightRef.current = false;
      lastStreamingHTMLRef.current = '';
      streamingFailCountRef.current = 0;
      return;
    }

    // Skip streaming compiles for golden (untouched) projects
    if (isGoldenProject) return;

    // Poll every 8s during generation to reduce droplet pressure
    streamingCompileTimerRef.current = setInterval(async () => {
      const partial = partialFilesRef.current;
      const completedCount = completedFileCountRef.current;

      // Need at least 4 completed files and a change since last compile
      if (completedCount < 4 || completedCount === lastStreamingCompileCountRef.current) return;
      if (streamingCompileInFlightRef.current) return;
      // Stop polling after too many failures
      if (streamingFailCountRef.current >= MAX_STREAMING_FAILURES) return;

      // Must have a mountable app (main.tsx + App.tsx or index.html)
      const hasMain = partial.some(f => f.path === 'src/main.tsx' || f.path === 'main.tsx');
      const hasApp = partial.some(f => f.path === 'src/App.tsx' || f.path === 'App.tsx');
      const hasIndex = partial.some(f => f.path === 'index.html');
      if (!(hasIndex || (hasMain && hasApp))) return;

      const { files: preparedPartial } = prepareFilesForCompile(partial);

      // Skip streaming compile if partial files are already known invalid
      if (validateFiles) {
        const vResult = validateFiles(preparedPartial);
        const syntaxErrors = vResult.issues.filter(i => i.severity === 'error');
        if (syntaxErrors.length > 0) return;
      }

      streamingCompileInFlightRef.current = true;
      lastStreamingCompileCountRef.current = completedCount;

      console.info('[StreamingPreview] Compiling %d partial files (%d completed)', preparedPartial.length, completedCount);

      try {
        const result = await Promise.race([
          compileReactProjectRef.current(preparedPartial, {
            supabaseConfig: supabaseConfig || undefined,
            stripeConfig: stripeConfig || undefined,
            envVars,
            localOnly: true,
          }).then(r => r.html || null).catch(() => null),
          new Promise<null>(r => setTimeout(() => r(null), 20_000)),
        ]);

        if (result && isPreviewValid(result) && result !== lastStreamingHTMLRef.current) {
          lastStreamingHTMLRef.current = result;
          console.info('[StreamingPreview] ✅ Intermediate preview ready (%d chars)', result.length);
          setStableHTMLLocal(result);
          transitionCompileState('success');
        } else if (!result) {
          streamingFailCountRef.current++;
          console.warn('[StreamingPreview] Compile failed (%d/%d)', streamingFailCountRef.current, MAX_STREAMING_FAILURES);
        }
      } finally {
        streamingCompileInFlightRef.current = false;
      }
    }, 8000);

    return () => {
      if (streamingCompileTimerRef.current) {
        clearInterval(streamingCompileTimerRef.current);
        streamingCompileTimerRef.current = null;
      }
    };
  }, [isGenerating, isGoldenProject, prepareFilesForCompile, supabaseConfig, stripeConfig, envVars, transitionCompileState, validateFiles]);

  // ── Reset stableHTML when a new generation starts ──
  const prevIsGeneratingRef = useRef(false);
  useEffect(() => {
    const wasGenerating = prevIsGeneratingRef.current;
    prevIsGeneratingRef.current = isGenerating;

    if (isGenerating && !wasGenerating) {
      // Generation STARTING — reset ALL internal state
      abortCompilation(); // Cancel any in-flight network requests to free droplet concurrency
      stableHTMLRef.current = null;
      setStableHTMLLocal(null);
      setLiveCompiledHTML(null);
      compilationInFlightRef.current = false;
      compileRunIdRef.current++; // Invalidate prior runs while keeping run-id monotonic (never reset to 0)
      prevFilesDigestRef.current = '';
      prevDigestRef.current = ''; // Reset memo cache so filesDigest recalculates on generation end
      goldenIdleAppliedRef.current = false;
      // Clear sessionStorage LKG so stale golden template doesn't persist
      try { sessionStorage.removeItem(LKG_STORAGE_KEY); } catch {}
      // Reset incremental + dependency + CSS + dep resolver caches for fresh generation
      resetIncrementalCache();
      resetDepCache();
      resetDepResolver();
      // Safety: force-clear isCompiling in case it was stuck from previous cycle
      transitionCompileState('idle');
      // Notify parent immediately so preview panel clears
      onStableHTML(null);
    } else if (!isGenerating && wasGenerating) {
      // Generation ENDING — do NOT abort here. The compile effect will start
      // a fresh compile after debounce. Aborting here would kill it immediately
      // due to React effect batching (the compile and this effect fire in the same cycle).
      console.info('[CompilationBridge] Generation ended — compile will start after debounce');
    }
  }, [isGenerating]);

  // Keep fresh/golden projects in a clean idle state (prevents stale "Compiling..." loops).
  // IMPORTANT: Do NOT abort if a compilation is already in flight — this effect can fire
  // during the brief window between file commit and compile start, causing "Aborted" errors.
  useEffect(() => {
    if (isGenerating) {
      hasEverGeneratedRef.current = true;
      goldenIdleAppliedRef.current = false;
      return;
    }
    if (!isGoldenProject) {
      goldenIdleAppliedRef.current = false;
      return;
    }
    // After at least one generation attempt, preserve downstream error states.
    if (hasEverGeneratedRef.current) return;
    if (goldenIdleAppliedRef.current) return;
    // Guard: if a compile is running, don't interfere
    if (compilationInFlightRef.current) return;

    abortCompilation();
    compileRunIdRef.current++;
    forceCompileRequestedRef.current = false;
    recompileNeededRef.current = false;
    softReloadPendingRef.current = false;
    transitionCompileState('idle');

    goldenIdleAppliedRef.current = true;
  }, [isGenerating, isGoldenProject, abortCompilation, transitionCompileState]);

  // ── SINGLE COMPILATION PATH ──
  // Fires when: isGenerating becomes false, files exist, and no preview yet.
  // Also fires when filesDigest changes (manual edits after generation).
  useEffect(() => {
    if (isGenerating || filesRef.current.length === 0) return;
    // Skip compilation for untouched golden template — no need to compile placeholder content
    if (isGoldenProject) return;

    // Sync from external if handleBgComplete already compiled
    if (!stableHTMLRef.current && externalStableHTMLRef?.current) {
      console.info('[CompilationBridge] Syncing existing external preview');
      const externalHtml = externalStableHTMLRef.current;
      setStableHTML(externalHtml);
      transitionCompileState(isPreviewValid(externalHtml) ? 'success' : 'error',
        isPreviewValid(externalHtml)
          ? undefined
          : { message: 'Invalid external preview HTML', errors: ['External compiled HTML failed preview validation'] }
      );
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
      console.info('[CompilationBridge] Compilation already in flight — marking recompile needed');
      recompileNeededRef.current = true;
      return;
    }

    // Shorter debounce for incremental edits (50ms) vs initial generation (150ms)
    // Use longer debounce after generation ends to avoid race with React effect batching
    const debounceMs = isIncrementalEditRef.current ? 50 : 300;
    let safetyTimer: ReturnType<typeof setTimeout> | undefined;
    const timer = setTimeout(async () => {
      // Double-check guards after debounce
      if (compilationInFlightRef.current) return;
      if (stableHTMLRef.current && !softReloadPendingRef.current) return;

      // ── Early validation gate — skip compile if syntax errors ──
      if (validateFiles) {
        const currentFiles = filesRef.current;
        const { files: preparedFiles } = prepareFilesForCompile(currentFiles);
        const vResult = validateFiles(preparedFiles);
        const syntaxErrors = vResult.issues.filter(i => i.severity === 'error');
        if (syntaxErrors.length > 0) {
          console.warn('[CompilationBridge] VALIDATION GATE: skipping compile', {
            errorCount: syntaxErrors.length,
            errors: syntaxErrors.slice(0, 3).map(e => ({ file: e.file, message: e.message })),
          });
          window.postMessage({
            type: '__BUILD_GATED__',
            payload: {
              reason: 'syntax_errors',
              errors: syntaxErrors.map(e => `${e.file}: ${e.message}`),
            },
            source: 'compilation-bridge',
          }, '*');
          // IMPORTANT: stop "compiling" state immediately
          transitionCompileState('error', { message: 'Syntax errors in source files', errors: syntaxErrors.map(e => `${e.file}: ${e.message}`) });
          compilationInFlightRef.current = false;

          if (stableHTMLRef.current) {
            // Preserve last-known-good preview — don't overwrite
            return;
          }
          // No LKG: promote validating fallback so parent preview never goes blank.
          setStableHTML(VALIDATING_FALLBACK_HTML);
          console.info('[CompilationBridge] Showing validation fallback', {
            htmlLength: VALIDATING_FALLBACK_HTML.length,
            stableHTMLRef: stableHTMLRef.current ? 'truthy' : 'null',
          });
          return;
        }
      }

      // ── Compile run-ID guard — increment to tag this run ──
      const thisRunId = ++compileRunIdRef.current;
      const t0 = performance.now();

      const trigger = forceCompileRequestedRef.current ? 'forceCompile' : 'filesDigest';
      forceCompileRequestedRef.current = false;
      console.info('[CompilationBridge] Starting compile', {
        runId: thisRunId,
        trigger,
        fileCount: filesRef.current.length,
      });
      compilationInFlightRef.current = true;
      compiledDigestRef.current = filesDigest;
      recompileNeededRef.current = false;
      transitionCompileState('compiling');

      // Safety net: force-reset isCompiling if compilation hangs
      safetyTimer = setTimeout(() => {
        if (compilationInFlightRef.current) {
          console.warn('[CompilationBridge] safety timeout', { runId: thisRunId, ms: Math.round(performance.now() - t0) });
          // Invalidate any in-flight promise so late results are discarded
          compileRunIdRef.current++;
          compilationInFlightRef.current = false;
          transitionCompileState('error', { message: 'Compile safety timeout exceeded', errors: ['Compilation took too long and was aborted'] });
          if (!stableHTMLRef.current || !isPreviewValid(stableHTMLRef.current)) {
            setLiveCompiledHTML(ERROR_FALLBACK_HTML);
            setStableHTML(ERROR_FALLBACK_HTML);
          }
          // else: LKG is valid, keep it
        }
      }, COMPILE_SAFETY_TIMEOUT_MS);

      try {
        // Yield to browser
        await new Promise(r => setTimeout(r, 0));

        // Bail if external arrived during debounce
        if (externalStableHTMLRef?.current && !stableHTMLRef.current) {
          const externalHtml = externalStableHTMLRef.current;
          setStableHTML(externalHtml);
          transitionCompileState(isPreviewValid(externalHtml) ? 'success' : 'error',
            isPreviewValid(externalHtml)
              ? undefined
              : { message: 'Invalid external preview HTML', errors: ['External compiled HTML failed preview validation'] }
          );
          return;
        }

        console.info('[CompilationBridge] compile tier start', { runId: thisRunId, ms: Math.round(performance.now() - t0) });
        
        // ── Hard timeout: prevent infinite "Compiling…" ──
        const result = await Promise.race([
          runCompile(),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('Compile timeout — exceeded ' + COMPILE_HARD_TIMEOUT_MS + 'ms')), COMPILE_HARD_TIMEOUT_MS)
          ),
        ]);
        console.info('[CompilationBridge] compile resolved', { runId: thisRunId, ms: Math.round(performance.now() - t0) });

        // ── Stale run-ID check — discard if a newer compile was started ──
        if (thisRunId !== compileRunIdRef.current) {
          console.info('[CompilationBridge] Stale compile run', thisRunId, '— discarding (current:', compileRunIdRef.current, ')');
          // Don't reset to 'idle' — a newer compile is running, let it set the final state.
          // Only clear the in-flight flag for THIS run (the newer run manages its own flag).
          return;
        }

        if (result) {
          // ── Dev-client detection gate ──
          const looksLikeViteDev = /\/@vite\/client|import\.meta\.hot\b|__vite_plugin_react_preamble_installed__/.test(result);
          if (looksLikeViteDev) {
            console.warn('[CompilationBridge] BUILD GATED: dev client detected in output');
            if (!stableHTMLRef.current || !isPreviewValid(stableHTMLRef.current)) {
              setLiveCompiledHTML(ERROR_FALLBACK_HTML);
              setStableHTML(ERROR_FALLBACK_HTML);
            }
            transitionCompileState('error', { message: 'Dev client detected in output', errors: ['Compiled output contains Vite dev/HMR client'] });
            return; // Keep LKG when available
          }

          // ── Fail-closed preview gate ──
          const filesToValidate = filesRef.current;
          const hasIncomplete = filesToValidate.some(f => (f as any).incomplete === true);
          const partialFilesHaveIncomplete = partialFilesRef.current.some(f => (f as any).incomplete === true);

          if (hasIncomplete || partialFilesHaveIncomplete) {
            console.warn('[CompilationBridge] BUILD GATED: incomplete_files');
            if (!stableHTMLRef.current || !isPreviewValid(stableHTMLRef.current)) {
              setLiveCompiledHTML(ERROR_FALLBACK_HTML);
              setStableHTML(ERROR_FALLBACK_HTML);
            }
            transitionCompileState('error', { message: 'Incomplete files detected', errors: ['One or more files are incomplete (stream truncated)'] });
          } else if (isPreviewValid(result)) {
            // ── Preview Success Contract: only promote valid HTML ──
            setLiveCompiledHTML(result);
            console.info('[CompilationBridge] ✅ Preview valid — committing', {
              runId: thisRunId,
              ms: Math.round(performance.now() - t0),
              ...previewDebugSummary(result),
            });
            setStableHTML(result);
            transitionCompileState('success');
            onErrorAnnotations?.([]); // Clear annotations on success
            onBuildSuccess?.(filesRef.current); // Snapshot for LKG diff
            liveSync.resetSnapshot(filesRef.current);
            if (softReloadPendingRef.current) {
              softReloadPendingRef.current = false;
              window.postMessage({ type: '__SOFT_RELOAD__', source: 'compilation-bridge' }, '*');
            }
            window.postMessage({ type: '__PREVIEW_READY__', source: 'compilation-bridge' }, '*');
          } else {
            // Compiled but invalid HTML — keep LKG when present, otherwise show fallback HTML.
            console.warn('[CompilationBridge] ❌ Compile produced invalid preview HTML — keeping LKG', previewDebugSummary(result));
            const summary = previewDebugSummary(result);
            const reasons: string[] = [];
            if (!summary.hasDoctype) reasons.push('Missing <!DOCTYPE> or <html> tag');
            if (!summary.hasRoot) reasons.push('Missing <div id="root"> mount point');
            if (summary.isFallback) reasons.push('Output contains error/fallback sentinel');
            if (!stableHTMLRef.current || !isPreviewValid(stableHTMLRef.current)) {
              setLiveCompiledHTML(ERROR_FALLBACK_HTML);
              setStableHTML(ERROR_FALLBACK_HTML);
            }
            transitionCompileState('error', { message: 'Invalid preview HTML', errors: reasons.length ? reasons : ['Compiled HTML failed validation'] });
          }
        } else {
          // Compilation returned null — keep LKG if we have one, otherwise show error
          if (stableHTMLRef.current && isPreviewValid(stableHTMLRef.current)) {
            console.warn('[CompilationBridge] Compilation returned null — preserving LKG preview');
          } else {
            console.warn('[CompilationBridge] Compilation returned null, no LKG — showing error fallback');
            setLiveCompiledHTML(ERROR_FALLBACK_HTML);
            setStableHTML(ERROR_FALLBACK_HTML);
          }
          transitionCompileState('error', { message: 'Compilation returned empty result', errors: ['Compiler produced no output'] });
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (isAbortError(err)) {
          console.info('[CompilationBridge] Compile aborted — ignoring stale/cancelled run');
        } else {
          console.error('[CompilationBridge] Compilation crashed:', errMsg);
          if (thisRunId === compileRunIdRef.current) {
            if (stableHTMLRef.current && isPreviewValid(stableHTMLRef.current)) {
              console.warn('[CompilationBridge] Compile crashed — preserving LKG preview');
            } else {
              setLiveCompiledHTML(ERROR_FALLBACK_HTML);
              setStableHTML(ERROR_FALLBACK_HTML);
            }
            transitionCompileState('error', { message: errMsg, errors: [errMsg] });
          }
        }
      } finally {

        clearTimeout(safetyTimer);
        compilationInFlightRef.current = false;
        // If files changed during this compile, retrigger
        if (recompileNeededRef.current) {
          console.info('[CompilationBridge] Files changed during compile — retriggering');
          recompileNeededRef.current = false;
          stableHTMLRef.current = null;
          prevFilesDigestRef.current = '';
          setForceCompileTrigger(c => c + 1);
        }
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
      abortCompilation(); // Cancel in-flight network requests
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
