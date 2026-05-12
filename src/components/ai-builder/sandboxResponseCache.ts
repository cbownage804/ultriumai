/**
 * Sandbox Response Cache — caches compile results by file-set hash for 60s.
 * Avoids redundant sandbox round-trips when the same file set is recompiled
 * (e.g. spurious re-renders, undo+redo, repeated abort+retry).
 */
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import type { WorkerCompilerResult } from '@/hooks/useWorkerCompiler';

const TTL_MS = 60_000;
const MAX_ENTRIES = 12;

interface CacheEntry {
  hash: string;
  result: WorkerCompilerResult;
  expiresAt: number;
}

const cache: CacheEntry[] = [];

function fnv1a(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(16);
}

export function hashFileSet(files: ProjectFile[]): string {
  // Sort by path for deterministic hash regardless of insertion order
  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));
  let combined = '';
  for (const f of sorted) {
    combined += f.path + ':' + f.content.length + ':' + fnv1a(f.content) + '|';
  }
  return fnv1a(combined);
}

export function getCachedCompile(hash: string): WorkerCompilerResult | null {
  const now = Date.now();
  // Purge expired
  for (let i = cache.length - 1; i >= 0; i--) {
    if (cache[i].expiresAt < now) cache.splice(i, 1);
  }
  const hit = cache.find(e => e.hash === hash);
  if (hit) {
    console.info('[SandboxCache] ✅ Cache HIT — skipping sandbox call');
    return hit.result;
  }
  return null;
}

export function setCachedCompile(hash: string, result: WorkerCompilerResult): void {
  // Don't cache failures (they may be transient and retrying is desired)
  if (!result.html || result.errors?.length > 0) return;
  cache.push({ hash, result, expiresAt: Date.now() + TTL_MS });
  // LRU eviction
  while (cache.length > MAX_ENTRIES) cache.shift();
}

export function clearSandboxCache(): void {
  cache.length = 0;
}
