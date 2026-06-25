/**
 * useWorkerCompiler — Hook that compiles projects via server-side Vite Sandbox.
 * 
 * SINGLE PATH: Calls the `compile-vite` edge function → Vite Sandbox droplet.
 * On failure: returns a clear error. No browser fallbacks.
 */

import { useCallback, useRef } from 'react';
import type { ProjectFile } from './useProjectFileSystem';
import type { CDNPackageEntry } from '@/workers/packageData';
import { supabase, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/integrations/supabase/client';
import { hashFileSet, getCachedCompile, setCachedCompile } from '@/components/ai-builder/sandboxResponseCache';
import { probeSandboxHealth, invalidateHealthProbe } from '@/components/ai-builder/sandboxHealth';
import { getOrCreateSession, rotateSession } from '@/lib/ai-builder/sandboxSession';
import { recordFailure } from '@/lib/ai-builder/failureTelemetry';

export interface WorkerCompilerResult {
  html: string;
  isReactProject: boolean;
  componentCount: number;
  errors: string[];
  errorMessage?: string;
}

// Keep this above the Edge Function's worst-case sandbox path (30s + retry/backoff).
// The old 25s budget could abort a healthy build while the sandbox was still working,
// which surfaced in-browser as "Failed to send a request to the Edge Function".
const VITE_TIMEOUT_MS = 75_000;
const MAX_TRANSIENT_RETRIES = 1; // Retry once on transient failures

type CompileVitePayload = {
  files: { path: string; content: string; language?: string }[];
  sessionId?: string;
  projectId?: string;
  options?: {
    supabaseConfig?: { url: string; anonKey: string };
    stripeConfig?: { publishableKey: string };
    envVars?: { key: string; value: string }[];
    userPackages?: CDNPackageEntry[];
  };
};

function isTransientError(err: Error): boolean {
  const msg = err.message?.toLowerCase() || '';
  return (
    msg.includes('timeout') ||
    msg.includes('network') ||
    msg.includes('fetch') ||
    msg.includes('failed to fetch') ||
    msg.includes('unavailable') ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('504') ||
    msg.includes('econnrefused')
  );
}

function hasUnmappedBareImportsInModuleScripts(html: string): boolean {
  const hasImportMap = /<script\b[^>]*type\s*=\s*["']importmap["'][^>]*>/i.test(html);
  if (hasImportMap) return false;

  const moduleScriptRegex = /<script\b[^>]*type\s*=\s*["']module["'][^>]*>([\s\S]*?)<\/script>/gi;
  // Match both spaced `from "react"` and minified `from"react"` bare imports
  const staticBareImportRegex = /\b(?:import|export)\s+(?:[^'"]*?\s+from\s*)?['"]([^'"./][^'"]*)['"]/;
  // Also catch minified `from"pkg"` without any space (Vite minifier output)
  const minifiedFromRegex = /\bfrom\s*['"]([^'"./][^'"]*)['"]/;
  const dynamicBareImportRegex = /\bimport\s*\(\s*['"]([^'"./][^'"]*)['"]\s*\)/;

  let match: RegExpExecArray | null;
  while ((match = moduleScriptRegex.exec(html)) !== null) {
    const moduleCode = match[1] || '';
    if (
      staticBareImportRegex.test(moduleCode) ||
      minifiedFromRegex.test(moduleCode) ||
      dynamicBareImportRegex.test(moduleCode)
    ) {
      console.warn('[ViteSandbox] Detected bare imports in module script — sandbox did not bundle dependencies');
      return true;
    }
  }

  return false;
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { error: text.slice(0, 1000), fallback: true };
  }
}

async function fetchCompileVite(
  payload: CompileVitePayload,
  signal: AbortSignal | undefined,
  authenticated: boolean,
): Promise<unknown> {
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', abortFromCaller, { once: true });

  const timeout = setTimeout(() => controller.abort(), VITE_TIMEOUT_MS);
  try {
    const body = JSON.stringify(payload);
    const response = await fetch(`${SUPABASE_URL}/functions/v1/compile-vite`, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      // Primary path intentionally uses a CORS "simple request" (text/plain + no
      // auth headers) because compile-vite has verify_jwt=false. This avoids the
      // browser preflight request that was failing for some Firefox sessions.
      headers: authenticated
        ? {
            'Content-Type': 'application/json',
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          }
        : { 'Content-Type': 'text/plain' },
      body,
      signal: controller.signal,
    });

    const json = await readJsonResponse(response);
    if (!response.ok && !authenticated && (response.status === 401 || response.status === 403)) {
      throw new Error(`compile-vite auth required (${response.status})`);
    }
    if (!response.ok) {
      const message = typeof (json as any)?.error === 'string'
        ? (json as any).error
        : `compile-vite returned HTTP ${response.status}`;
      return { error: message, fallback: true };
    }
    return json;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abortFromCaller);
  }
}

async function directCompileViteFetch(payload: CompileVitePayload, signal?: AbortSignal): Promise<unknown> {
  try {
    return await fetchCompileVite(payload, signal, false);
  } catch (publicErr) {
    const publicMessage = publicErr instanceof Error ? publicErr.message : String(publicErr);
    console.warn('[ViteSandbox] Public simple compile request failed; retrying authenticated direct fetch:', publicMessage);
    try {
      return await fetchCompileVite(payload, signal, true);
    } catch (authErr) {
      const authMessage = authErr instanceof Error ? authErr.message : String(authErr);
      throw new Error(`${publicMessage}; authenticated retry failed: ${authMessage}`);
    }
  }
}

// ── Vite Sandbox compilation (true Vite on Droplet) ──
async function compileViaViteSandbox(
  files: ProjectFile[],
  options?: {
    supabaseConfig?: { url: string; anonKey: string } | null;
    stripeConfig?: { publishableKey: string } | null;
    envVars?: { key: string; value: string }[];
    userPackages?: CDNPackageEntry[];
    projectId?: string;
    sessionId?: string;
  },
  signal?: AbortSignal,
): Promise<WorkerCompilerResult> {
  const t0 = Date.now();
  console.info('[ViteSandbox] Calling compile-vite edge function with', files.length, 'files');

  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const payload: CompileVitePayload = {
    files: files.map(f => ({ path: f.path, content: f.content, language: f.language })),
    // #9 — persistent sandbox session; server may keep dev-server warm per session
    sessionId: options?.sessionId,
    projectId: options?.projectId,
    options: options ? {
      supabaseConfig: options.supabaseConfig || undefined,
      stripeConfig: options.stripeConfig || undefined,
      envVars: options.envVars,
      userPackages: options.userPackages,
    } : undefined,
  };

  let data: unknown = null;
  let error: { message?: string } | null = null;

  try {
    // Use a direct fetch first. The Supabase SDK invoke path can fail in-browser
    // when auth/cookie state is stale even though the Edge Function is healthy.
    data = await directCompileViteFetch(payload, signal);
  } catch (directErr) {
    const directMessage = directErr instanceof Error ? directErr.message : String(directErr);
    error = { message: directMessage };
  }

  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');


  if (error) {
    const directMessage = error.message || 'Direct compile request failed';
    console.warn('[ViteSandbox] Direct compile request failed; retrying through Supabase SDK:', directMessage);
    try {
      const sdkResult = await supabase.functions.invoke('compile-vite', { body: payload });
      data = sdkResult.data;
      error = sdkResult.error ? { message: sdkResult.error.message } : null;
      if (error) throw new Error(error.message || 'Supabase SDK invoke failed');
      error = null;
    } catch (sdkErr) {
      const sdkMessage = sdkErr instanceof Error ? sdkErr.message : String(sdkErr);
      throw new Error(`Vite sandbox request failed: ${directMessage}; SDK retry failed: ${sdkMessage}`);
    }
  }

  // Handle case where data is a raw string (Supabase SDK parsing issue)
  let parsedData: any = data;
  if (typeof data === 'string') {
    try {
      parsedData = JSON.parse(data);
      console.info('[ViteSandbox] Parsed string data to object, html length:', parsedData?.html?.length || 0);
    } catch {
      console.error('[ViteSandbox] Failed to parse string response');
      throw new Error('Vite sandbox returned unparseable response');
    }
  }

  if (parsedData?.fallback) {
    const errText: string = parsedData.error || 'Vite sandbox unavailable';
    // Some "fallback" responses actually carry a user-code build error in the message
    // (legacy compile-vite behavior). If the text looks like a real build diagnostic,
    // promote it to a normal sandbox error so the user sees it and auto-heal can act.
    const looksLikeBuildError =
      /\.(?:tsx?|jsx?|css|html)\b/i.test(errText) ||
      /\b(?:ERROR:|error TS|Unexpected|Unterminated|Cannot find|Module not found|is not exported|Transform failed|Expected|SyntaxError)\b/i.test(errText);
    if (looksLikeBuildError) {
      const processed = extractActionableError(errText);
      return {
        html: '',
        isReactProject: true,
        componentCount: 0,
        errors: [processed],
        errorMessage: processed,
      };
    }
    throw new Error(errText);
  }

  const sandboxErrors = Array.isArray(parsedData?.errors)
    ? parsedData.errors.filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0)
    : [];
  
  // Extract actionable error messages from esbuild crash logs
  // esbuild crashes produce `failureErrorWithLog` with the real error buried in the log
  const processedErrors = sandboxErrors.map(extractActionableError);
  
  const html = typeof parsedData?.html === 'string' ? parsedData.html : '';

  if (!html) {
    if (processedErrors.length > 0) {
      return {
        html: '',
        isReactProject: true,
        componentCount: parsedData?.componentCount || 0,
        errors: processedErrors,
        errorMessage: processedErrors[0],
      };
    }

    throw new Error('Vite sandbox returned empty result');
  }

  if (hasUnmappedBareImportsInModuleScripts(html)) {
    throw new Error('Vite sandbox returned unresolved bare imports');
  }

  console.info('[ViteSandbox] ✅ Compiled via real Vite in', Date.now() - t0, 'ms, HTML:', html.length, 'chars');

  return {
    html,
    isReactProject: true,
    componentCount: parsedData?.componentCount || 0,
    errors: processedErrors,
  };
}

/**
 * Extract actionable error info from raw esbuild crash logs.
 * esbuild's `failureErrorWithLog` wraps the real error in a verbose log.
 * This extracts the relevant file:line:col + message for auto-heal.
 */
function extractActionableError(raw: string): string {
  const locMatch = raw.match(/([\w/.-]+\.(?:tsx?|jsx?)):(\d+):(\d+)/);
  const formatWithLocation = (message: string) => {
    const clean = message.trim();
    if (!clean) return locMatch ? `${locMatch[1]}:${locMatch[2]}:${locMatch[3]} - error` : 'Compilation failed';
    return locMatch
      ? `${locMatch[1]}:${locMatch[2]}:${locMatch[3]} - error: ${clean}`
      : clean;
  };

  // Pattern: "ERROR: ..." buried in the log
  const esbuildErrorMatch = raw.match(/ERROR:\s*(.+?)(?:\n|$)/i);
  if (esbuildErrorMatch) {
    return formatWithLocation(esbuildErrorMatch[1]);
  }

  // Pattern: esbuild code frame snippets like "96 | ... 97 | ..."
  const codeFrameMatch = raw.match(/((?:\d+\s*\|.*(?:\n|$)){1,5})/);
  if (codeFrameMatch) {
    const snippet = codeFrameMatch[1]
      .trim()
      .split('\n')
      .map(line => line.trim())
      .join('\n');
    return formatWithLocation(`Syntax error near:\n${snippet}`);
  }

  // Pattern: "Transform failed with X error(s):" + first visible code line
  const transformMatch = raw.match(/Transform failed[\s\S]*?\n\s*>\s*\d+\s*\|(.+)/);
  if (transformMatch) {
    return formatWithLocation(`Syntax error near: ${transformMatch[1].trim()}`);
  }

  // Strip noisy stack traces even when they are inline on a single line
  const beforeStackMatch = raw.match(/^(.*?)(?=\s+at\s+(?:failureErrorWithLog|responseCallbacks|handleIncomingPacket|Socket|Pipe\.onStreamRead|Readable\.)\b)/s);
  if (beforeStackMatch?.[1]?.trim()) {
    return beforeStackMatch[1].trim();
  }

  // Pattern: multiline stack traces with newlines
  const failureMatch = raw.match(/^(.+?)(?:\n\s+at\s)/s);
  if (failureMatch?.[1]?.trim()) {
    return failureMatch[1].trim();
  }

  const firstLine = raw.split('\n').find(line => line.trim());
  if (firstLine) {
    return firstLine.trim();
  }

  return raw.trim();
}

export function useWorkerCompiler() {
  /** AbortController for the primary compile lane */
  const activeAbortRef = useRef<AbortController | null>(null);
  /** AbortController for best-effort local/streaming compiles */
  const localAbortRef = useRef<AbortController | null>(null);

  /**
   * Single compilation path — Vite Sandbox only.
   * On failure: throws with a descriptive error. No fallbacks.
   */
  const compileReactProject = useCallback(async (
    files: ProjectFile[],
    options?: {
      supabaseConfig?: { url: string; anonKey: string } | null;
      stripeConfig?: { publishableKey: string } | null;
      envVars?: { key: string; value: string }[];
      userPackages?: CDNPackageEntry[];
      localOnly?: boolean;
      projectId?: string;
    }
  ): Promise<WorkerCompilerResult> => {
    const useLocalLane = options?.localOnly === true;
    // #9 — derive a stable per-project sandbox session id
    const sessionId = options?.projectId ? getOrCreateSession(options.projectId) : undefined;
    const abortRef = useLocalLane ? localAbortRef : activeAbortRef;

    // Abort only prior work on the same lane.
    if (abortRef.current) {
      console.info('[Compiler] Aborting prior in-flight compilation', { lane: useLocalLane ? 'local' : 'primary' });
      abortRef.current.abort();
    }
    const ac = new AbortController();
    abortRef.current = ac;
    const { signal } = ac;

    // ── Sandbox response cache: skip round-trip if same file set was just compiled ──
    const cacheKey = hashFileSet(files);
    const cached = getCachedCompile(cacheKey);
    if (cached) {
      return cached;
    }

    let lastError: Error | null = null;

    try {
      for (let attempt = 0; attempt <= MAX_TRANSIENT_RETRIES; attempt++) {
        try {
          if (attempt > 0) {
            console.info(`[Compiler] 🔄 Retry attempt ${attempt}/${MAX_TRANSIENT_RETRIES}`);
            // Brief backoff before retry
            await new Promise(r => setTimeout(r, 1000 * attempt));
            if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
          }

          // ── Pre-flight health probe (cached 5s) — skip if known degraded ──
          if (attempt === 0) {
            const health = await probeSandboxHealth();
            if (!health.healthy) {
              console.warn('[Compiler] ⚠️ Sandbox unhealthy — will still attempt:', health.reason);
            }
          }

          console.info('[Compiler] ⏱ Compiling via Vite Sandbox', {
            fileCount: files.length,
            attempt,
            lane: useLocalLane ? 'local' : 'primary',
          });
          const result = await Promise.race([
            compileViaViteSandbox(files, { ...options, sessionId }, signal),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error(`Vite sandbox timeout (${VITE_TIMEOUT_MS / 1000}s)`)), VITE_TIMEOUT_MS)
            ),
          ]);
          console.info('[Compiler] ✅ Vite Sandbox compiled:', result.html?.length, 'chars');
          setCachedCompile(cacheKey, result);
          return result;
        } catch (err: any) {
          if (signal.aborted && ac !== abortRef.current) {
            throw new DOMException('Aborted', 'AbortError');
          }
          lastError = err instanceof Error ? err : new Error(String(err));

          // #9 — rotate the persistent session if the server reports it is gone
          if (/session[_ ]?expired|unknown[_ ]?session/i.test(lastError.message) && options?.projectId) {
            console.warn('[Compiler] 🔁 Sandbox session expired — rotating');
            rotateSession(options.projectId);
            continue;
          }
          // Only retry on transient errors
          if (attempt < MAX_TRANSIENT_RETRIES && isTransientError(lastError)) {
            console.warn(`[Compiler] ⚠️ Transient failure (attempt ${attempt + 1}):`, lastError.message);
            invalidateHealthProbe();
            continue;
          }
          // #10 — record terminal failure
          recordFailure({
            projectId: options?.projectId,
            phase: 'compile',
            category: 'compile_failed',
            errorMessage: lastError.message.slice(0, 500),
            attempt,
          });
          break;
        }
      }

      const message = lastError?.message || 'Unknown compilation error';
      console.error('[Compiler] ❌ Compilation failed after retries:', message);
      throw new Error(`Compilation failed: ${message}`);
    } finally {
      if (abortRef.current === ac) {
        abortRef.current = null;
      }
    }
  }, []);

  /** Lock to prevent spurious aborts during critical post-generation compiles */
  const compileLockRef = useRef(false);

  /** Lock compilation — prevents abortCompilation from cancelling in-flight work */
  const lockCompile = useCallback(() => { compileLockRef.current = true; }, []);
  /** Unlock compilation */
  const unlockCompile = useCallback(() => { compileLockRef.current = false; }, []);

  /** Abort any in-flight compilation (skipped if compile is locked) */
  const abortCompilation = useCallback((force = false) => {
    if (compileLockRef.current && !force) {
      console.info('[Compiler] abortCompilation SKIPPED — compile is locked (post-generation critical path)');
      return;
    }
    if (activeAbortRef.current) {
      console.info('[Compiler] abortCompilation called — cancelling primary in-flight requests');
      activeAbortRef.current.abort();
      activeAbortRef.current = null;
    }
    if (localAbortRef.current) {
      console.info('[Compiler] abortCompilation called — cancelling local in-flight requests');
      localAbortRef.current.abort();
      localAbortRef.current = null;
    }
  }, []);

  return { compileReactProject, abortCompilation, lockCompile, unlockCompile };
}
