import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

const DB_NAME = 'ai-builder-db';
const DB_VERSION = 1;
const FILES_STORE = 'project-files';
const MESSAGES_STORE = 'project-messages';
const META_STORE = 'project-meta';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'unsaved';

export interface RecoverableSession {
  projectId: string;
  name: string;
  files: ProjectFile[];
  messages: any[];
  savedAt: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(FILES_STORE)) db.createObjectStore(FILES_STORE);
      if (!db.objectStoreNames.contains(MESSAGES_STORE)) db.createObjectStore(MESSAGES_STORE);
      if (!db.objectStoreNames.contains(META_STORE)) db.createObjectStore(META_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(store: string, key: string, value: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function idbGet<T>(store: string, key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => { db.close(); resolve(req.result as T | undefined); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

async function idbDelete(store: string, key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

const SAVE_DEBOUNCE_MS = 500;
const SESSION_KEY = 'current-session';

export function useIndexedDBPersistence() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [hasRecoverableSession, setHasRecoverableSession] = useState(false);
  const [recoverableSession, setRecoverableSession] = useState<RecoverableSession | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedHash = useRef<string>('');

  const hashState = useCallback((files: ProjectFile[], messages: any[]): string => {
    let h = 0;
    for (const f of files) {
      for (let i = 0; i < f.content.length; i++) h = ((h << 5) - h + f.content.charCodeAt(i)) | 0;
      for (let i = 0; i < f.path.length; i++) h = ((h << 5) - h + f.path.charCodeAt(i)) | 0;
    }
    h = ((h << 5) - h + messages.length) | 0;
    return h.toString(36);
  }, []);

  const saveToIDB = useCallback((projectId: string, name: string, files: ProjectFile[], messages: any[]) => {
    if (files.length === 0 && messages.length === 0) return;

    const hash = hashState(files, messages);
    if (hash === lastSavedHash.current) return;

    setSyncStatus('unsaved');
    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(async () => {
      try {
        setSyncStatus('syncing');
        const timestamp = new Date().toISOString();
        await Promise.all([
          idbSet(FILES_STORE, projectId, files.map(f => ({ path: f.path, content: f.content, language: f.language }))),
          idbSet(MESSAGES_STORE, projectId, messages),
          idbSet(META_STORE, projectId, { name, savedAt: timestamp }),
          idbSet(META_STORE, SESSION_KEY, { projectId, name, savedAt: timestamp }),
        ]);
        lastSavedHash.current = hash;
        setSyncStatus('synced');
      } catch (err) {
        console.warn('IndexedDB save failed:', err);
        setSyncStatus('offline');
      }
    }, SAVE_DEBOUNCE_MS);
  }, [hashState]);

  /** Phase 82: Compare timestamps — only offer recovery if IDB is more recent than cloud data */
  const checkRecovery = useCallback(async (cloudTimestamp?: string): Promise<RecoverableSession | null> => {
    try {
      const sessionMeta = await idbGet<{ projectId: string; name: string; savedAt: string }>(META_STORE, SESSION_KEY);
      if (!sessionMeta?.projectId) return null;

      const files = await idbGet<ProjectFile[]>(FILES_STORE, sessionMeta.projectId);
      const messages = await idbGet<any[]>(MESSAGES_STORE, sessionMeta.projectId);

      if ((!files || files.length === 0) && (!messages || messages.length === 0)) return null;

      // Phase 82: If cloud data is more recent, skip recovery
      if (cloudTimestamp && sessionMeta.savedAt) {
        const idbTime = new Date(sessionMeta.savedAt).getTime();
        const cloudTime = new Date(cloudTimestamp).getTime();
        if (cloudTime >= idbTime) {
          // Cloud is newer or same — don't offer recovery
          return null;
        }
      }

      const session: RecoverableSession = {
        projectId: sessionMeta.projectId,
        name: sessionMeta.name,
        files: files || [],
        messages: messages || [],
        savedAt: sessionMeta.savedAt,
      };
      setRecoverableSession(session);
      setHasRecoverableSession(true);
      return session;
    } catch {
      return null;
    }
  }, []);

  const clearSession = useCallback(async (projectId?: string) => {
    try {
      const id = projectId || (await idbGet<{ projectId: string }>(META_STORE, SESSION_KEY))?.projectId;
      if (id) {
        await Promise.all([
          idbDelete(FILES_STORE, id),
          idbDelete(MESSAGES_STORE, id),
          idbDelete(META_STORE, id),
        ]);
      }
      await idbDelete(META_STORE, SESSION_KEY);
      setHasRecoverableSession(false);
      setRecoverableSession(null);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  /** Immediate (non-debounced) save — use on visibilitychange / beforeunload */
  const saveToIDBImmediate = useCallback(async (
    projectId: string, name: string, files: ProjectFile[], messages: any[]
  ) => {
    if (files.length === 0 && messages.length === 0) return;
    try {
      const timestamp = new Date().toISOString();
      await Promise.all([
        idbSet(FILES_STORE, projectId, files.map(f => ({ path: f.path, content: f.content, language: f.language }))),
        idbSet(MESSAGES_STORE, projectId, messages),
        idbSet(META_STORE, projectId, { name, savedAt: timestamp }),
        idbSet(META_STORE, SESSION_KEY, { projectId, name, savedAt: timestamp }),
      ]);
    } catch (err) {
      console.warn('IndexedDB immediate save failed:', err);
    }
  }, []);

  return {
    syncStatus,
    hasRecoverableSession,
    recoverableSession,
    saveToIDB,
    saveToIDBImmediate,
    checkRecovery,
    clearSession,
  };
}
