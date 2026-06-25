/**
 * Sandbox Health Probe — lightweight check before each compile to detect
 * a degraded warm pool. Cached for 5s so we don't ping on every call.
 */
import { SUPABASE_URL } from '@/integrations/supabase/client';

interface HealthState {
  healthy: boolean;
  checkedAt: number;
  reason?: string;
}

const PROBE_TTL_MS = 5_000;
const PROBE_TIMEOUT_MS = 3_500;
let lastProbe: HealthState | null = null;
let inFlight: Promise<HealthState> | null = null;

async function doProbe(): Promise<HealthState> {
  const t0 = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    const probePromise = fetch(`${SUPABASE_URL}/functions/v1/compile-vite`, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      // compile-vite is public (verify_jwt=false). Keep the probe a CORS simple
      // request so a flaky browser preflight cannot falsely mark the sandbox down.
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ __healthcheck: true }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));
    const timeoutPromise = new Promise<Response | { error: { message: string } }>(resolve =>
      setTimeout(() => resolve({ error: { message: 'health probe timeout' } }), PROBE_TIMEOUT_MS + 50),
    );
    const response = (await Promise.race([probePromise, timeoutPromise])) as any;
    const elapsed = Date.now() - t0;
    // Even if the function returns an error JSON we still consider it reachable.
    // Only network/fetch failures are treated as unhealthy.
    const error = response?.error || null;
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
