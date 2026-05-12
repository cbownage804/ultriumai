/**
 * Sandbox Health Probe — lightweight check before each compile to detect
 * a degraded warm pool. Cached for 5s so we don't ping on every call.
 */
import { supabase } from '@/integrations/supabase/client';

interface HealthState {
  healthy: boolean;
  checkedAt: number;
  reason?: string;
}

const PROBE_TTL_MS = 5_000;
const PROBE_TIMEOUT_MS = 2_000;
let lastProbe: HealthState | null = null;
let inFlight: Promise<HealthState> | null = null;

async function doProbe(): Promise<HealthState> {
  const t0 = Date.now();
  try {
    const probePromise = supabase.functions.invoke('compile-vite', {
      body: { __healthcheck: true },
    });
    const timeoutPromise = new Promise<{ data: null; error: { message: string } }>(resolve =>
      setTimeout(() => resolve({ data: null, error: { message: 'health probe timeout' } }), PROBE_TIMEOUT_MS),
    );
    const { error } = (await Promise.race([probePromise, timeoutPromise])) as any;
    const elapsed = Date.now() - t0;
    // Even if the function returns an error JSON we still consider it reachable.
    // Only network/fetch failures are treated as unhealthy.
    if (error && /fetch|network|timeout|unavailable|503|502|504/i.test(error.message || '')) {
      return { healthy: false, checkedAt: Date.now(), reason: error.message };
    }
    return { healthy: true, checkedAt: Date.now(), reason: `ok in ${elapsed}ms` };
  } catch (err) {
    return { healthy: false, checkedAt: Date.now(), reason: (err as Error).message };
  }
}

export async function probeSandboxHealth(): Promise<HealthState> {
  const now = Date.now();
  if (lastProbe && now - lastProbe.checkedAt < PROBE_TTL_MS) return lastProbe;
  if (inFlight) return inFlight;
  inFlight = doProbe().then(state => {
    lastProbe = state;
    inFlight = null;
    return state;
  });
  return inFlight;
}

export function invalidateHealthProbe(): void {
  lastProbe = null;
}
