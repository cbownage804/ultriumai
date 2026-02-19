import { useState, useCallback, useRef } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface CacheEntry {
  hash: string;
  compiled: string;
  timestamp: number;
}

function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

export function useBuildCacheManager() {
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const [stats, setStats] = useState({ hits: 0, misses: 0, totalTime: 0, cachedFiles: 0 });

  const getCached = useCallback((path: string, content: string): string | null => {
    const entry = cacheRef.current.get(path);
    const hash = hashContent(content);
    if (entry && entry.hash === hash) {
      setStats(prev => ({ ...prev, hits: prev.hits + 1 }));
      return entry.compiled;
    }
    setStats(prev => ({ ...prev, misses: prev.misses + 1 }));
    return null;
  }, []);

  const setCache = useCallback((path: string, content: string, compiled: string) => {
    cacheRef.current.set(path, { hash: hashContent(content), compiled, timestamp: Date.now() });
    setStats(prev => ({ ...prev, cachedFiles: cacheRef.current.size }));
  }, []);

  const compileWithCache = useCallback((files: ProjectFile[], compiler: (file: ProjectFile) => string) => {
    const start = performance.now();
    let changedCount = 0;
    const results: { path: string; compiled: string }[] = [];

    for (const file of files) {
      const cached = getCached(file.path, file.content);
      if (cached) {
        results.push({ path: file.path, compiled: cached });
      } else {
        changedCount++;
        const compiled = compiler(file);
        setCache(file.path, file.content, compiled);
        results.push({ path: file.path, compiled });
      }
    }

    const totalTime = Math.round(performance.now() - start);
    setStats(prev => ({ ...prev, totalTime }));

    return { results, changedCount, totalFiles: files.length, timeMs: totalTime };
  }, [getCached, setCache]);

  const invalidate = useCallback((path?: string) => {
    if (path) cacheRef.current.delete(path);
    else cacheRef.current.clear();
    setStats(prev => ({ ...prev, cachedFiles: cacheRef.current.size }));
  }, []);

  return { stats, compileWithCache, invalidate, getCached, setCache };
}
