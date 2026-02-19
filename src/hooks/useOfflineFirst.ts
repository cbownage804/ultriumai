import { useState, useCallback } from 'react';

export interface SyncQueue {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, any>;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  createdAt: string;
  retries: number;
}

export interface OfflineConfig {
  enableServiceWorker: boolean;
  cacheTTL: number;
  syncInterval: number;
  conflictResolution: 'client-wins' | 'server-wins' | 'manual';
  offlineTables: string[];
  maxRetries: number;
}

const DEFAULT_CONFIG: OfflineConfig = {
  enableServiceWorker: true,
  cacheTTL: 3600,
  syncInterval: 30,
  conflictResolution: 'server-wins',
  offlineTables: [],
  maxRetries: 3,
};

export function useOfflineFirst() {
  const [config, setConfig] = useState<OfflineConfig>(DEFAULT_CONFIG);
  const [syncQueue, setSyncQueue] = useState<SyncQueue[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  const updateConfig = useCallback((partial: Partial<OfflineConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }));
  }, []);

  const addOfflineTable = useCallback((table: string) => {
    setConfig(prev => ({
      ...prev,
      offlineTables: prev.offlineTables.includes(table) ? prev.offlineTables : [...prev.offlineTables, table],
    }));
  }, []);

  const removeOfflineTable = useCallback((table: string) => {
    setConfig(prev => ({
      ...prev,
      offlineTables: prev.offlineTables.filter(t => t !== table),
    }));
  }, []);

  const toggleOnline = useCallback(() => setIsOnline(prev => !prev), []);

  const generateServiceWorker = useCallback(() => {
    return `// sw.js - Service Worker for Offline-First
const CACHE_NAME = 'app-cache-v1';
const TTL = ${config.cacheTTL};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(['/', '/index.html', '/manifest.json'])
    )
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetched = fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      });
      return cached || fetched;
    })
  );
});
`;
  }, [config.cacheTTL]);

  const generateSyncHook = useCallback(() => {
    return `import { useEffect, useState, useCallback } from 'react';

interface SyncItem {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

export function useOfflineSync() {
  const [queue, setQueue] = useState<SyncItem[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const onOnline = () => { setIsOnline(true); syncQueue(); };
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  const enqueue = useCallback((table: string, operation: SyncItem['operation'], data: any) => {
    const item: SyncItem = { id: crypto.randomUUID(), table, operation, data, timestamp: Date.now() };
    setQueue(prev => [...prev, item]);
    // Persist to IndexedDB
    localStorage.setItem('sync_queue', JSON.stringify([...queue, item]));
  }, [queue]);

  const syncQueue = useCallback(async () => {
    // Process queue items with conflict resolution: ${config.conflictResolution}
    for (const item of queue) {
      try {
        // await supabase.from(item.table)[item.operation](item.data);
        setQueue(prev => prev.filter(q => q.id !== item.id));
      } catch (e) { console.error('Sync failed:', e); }
    }
  }, [queue]);

  return { queue, isOnline, enqueue, syncQueue, queueLength: queue.length };
}
`;
  }, [config.conflictResolution]);

  return {
    config, updateConfig, syncQueue, isOnline,
    addOfflineTable, removeOfflineTable, toggleOnline,
    generateServiceWorker, generateSyncHook,
  };
}
