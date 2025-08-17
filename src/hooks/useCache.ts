import { useState, useEffect, useCallback } from 'react';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  isStale: boolean;
}

class CacheManager {
  private static instance: CacheManager;
  private cache = new Map<string, CacheEntry<any>>();

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      isStale: false
    });

    // Set expiration timer
    setTimeout(() => {
      const entry = this.cache.get(key);
      if (entry) {
        entry.isStale = true;
      }
    }, ttl);
  }

  get<T>(key: string): CacheEntry<T> | null {
    return this.cache.get(key) || null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }
}

export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) {
  const { ttl = 5 * 60 * 1000, staleWhileRevalidate = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);

  const cacheManager = CacheManager.getInstance();

  const fetchData = useCallback(async (forceRefresh = false) => {
    const cached = cacheManager.get<T>(key);
    
    // Return cached data if available and not forcing refresh
    if (cached && !forceRefresh) {
      setData(cached.data);
      setIsStale(cached.isStale);
      
      // If stale and staleWhileRevalidate is enabled, fetch in background
      if (cached.isStale && staleWhileRevalidate) {
        fetchData(true);
      }
      return cached.data;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      cacheManager.set(key, result, ttl);
      setData(result);
      setIsStale(false);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      
      // Return stale data if available on error
      if (cached && staleWhileRevalidate) {
        setData(cached.data);
        setIsStale(true);
        return cached.data;
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, ttl, staleWhileRevalidate]);

  const mutate = useCallback((newData: T) => {
    cacheManager.set(key, newData, ttl);
    setData(newData);
    setIsStale(false);
  }, [key, ttl]);

  const invalidate = useCallback(() => {
    cacheManager.delete(key);
    setData(null);
    setIsStale(false);
  }, [key]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    isStale,
    refetch: () => fetchData(true),
    mutate,
    invalidate
  };
}

export default useCache;