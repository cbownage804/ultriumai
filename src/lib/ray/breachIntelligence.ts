/**
 * Breach Intelligence — k-anonymity check against HIBP via the
 * `ray-breach-check` edge function. Returns the set of credential ids that
 * matched a known breach. If the lookup fails, returns an empty set with
 * `degraded: true` — Ray will say so rather than fabricate.
 */
import { supabase } from '@/integrations/supabase/client';
import type { RawCredential } from './passwordIntelligence';

export interface BreachCheckResult {
  breachedIds: Set<string>;
  degraded: boolean;
  message?: string;
}

async function sha1Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-1', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

export async function checkBreaches(
  creds: RawCredential[],
  onProgress?: (done: number, total: number) => void,
): Promise<BreachCheckResult> {
  const ids = new Set<string>();
  if (!creds.length) return { breachedIds: ids, degraded: false };

  // Hash all passwords client-side. We only ever transmit 5-char SHA-1 prefixes.
  const idByHash = new Map<string, string[]>();
  const hashes: string[] = [];
  for (const c of creds) {
    if (!c.password) continue;
    const h = await sha1Hex(c.password);
    hashes.push(h);
    const arr = idByHash.get(h) ?? [];
    arr.push(c.id);
    idByHash.set(h, arr);
  }
  const prefixes = Array.from(new Set(hashes.map((h) => h.slice(0, 5))));

  let done = 0;
  try {
    for (const prefix of prefixes) {
      const { data, error } = await supabase.functions.invoke('ray-breach-check', {
        body: { prefix },
      });
      if (error) throw error;
      const suffixes: string[] = data?.suffixes ?? [];
      for (const suffix of suffixes) {
        const full = (prefix + suffix).toUpperCase();
        const matches = idByHash.get(full);
        if (matches) for (const id of matches) ids.add(id);
      }
      done++;
      onProgress?.(done, prefixes.length);
    }
    return { breachedIds: ids, degraded: false };
  } catch (e) {
    return {
      breachedIds: ids,
      degraded: true,
      message: 'Breach lookup unavailable right now — I\'ll retry later.',
    };
  }
}
