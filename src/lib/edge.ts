/**
 * edgeInvoke — single, typed entry point for every Supabase edge function call.
 * Normalizes network / timeout / auth / rate-limit failures into a shape the UI
 * can render as calm, Ray-voiced copy instead of a raw stack trace.
 */
import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js';
import { rayError } from '@/lib/ray/voice';

export type EdgeResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; code: 'offline' | 'timeout' | 'auth' | 'rate' | 'server' | 'unknown'; status?: number };

export interface EdgeOptions {
  body?: unknown;
  headers?: Record<string, string>;
  /** Timeout in ms — default 20s. Ray responses can be slow but never forever. */
  timeoutMs?: number;
}

export async function edgeInvoke<T = unknown>(name: string, opts: EdgeOptions = {}): Promise<EdgeResult<T>> {
  const { body, headers, timeoutMs = 20_000 } = opts;

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { ok: false, code: 'offline', message: rayError('offline') };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const { data, error } = await supabase.functions.invoke<T>(name, {
      body,
      headers,
    });

    if (error) {
      if (error instanceof FunctionsHttpError) {
        const status = (error.context as Response | undefined)?.status ?? 500;
        if (status === 401 || status === 403) return { ok: false, code: 'auth', message: rayError('auth'), status };
        if (status === 429) return { ok: false, code: 'rate', message: rayError('rate'), status };
        return { ok: false, code: 'server', message: rayError('server'), status };
      }
      if (error instanceof FunctionsRelayError || error instanceof FunctionsFetchError) {
        return { ok: false, code: 'server', message: rayError('server') };
      }
      return { ok: false, code: 'unknown', message: rayError('unknown') };
    }

    return { ok: true, data: data as T };
  } catch (err: unknown) {
    if ((err as { name?: string })?.name === 'AbortError') {
      return { ok: false, code: 'timeout', message: rayError('timeout') };
    }
    return { ok: false, code: 'unknown', message: rayError('unknown') };
  } finally {
    clearTimeout(timer);
  }
}
