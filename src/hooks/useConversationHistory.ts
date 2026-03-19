import { useState, useCallback, useEffect, useRef } from 'react';
import type { BuilderMessage } from '@/hooks/useAIAppBuilder';

export interface ConversationRecord {
  id: string;
  title: string;
  messages: BuilderMessage[];
  createdAt: Date;
  updatedAt: Date;
  projectId?: string;
}

const IDB_NAME = 'ai-builder-conversations';
const IDB_STORE = 'conversations';
const IDB_VERSION = 1;
const MAX_CONVERSATIONS = 50;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function loadAll(): Promise<ConversationRecord[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).getAll();
      req.onsuccess = () => {
        db.close();
        const results = (req.result || []).map((r: any) => ({
          ...r,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
          messages: (r.messages || []).map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
        }));
        results.sort((a: ConversationRecord, b: ConversationRecord) => b.updatedAt.getTime() - a.updatedAt.getTime());
        resolve(results.slice(0, MAX_CONVERSATIONS));
      };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  } catch {
    return [];
  }
}

async function saveConversation(conv: ConversationRecord): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put({
      ...conv,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
      messages: conv.messages.map(m => ({
        ...m,
        timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
      })),
    });
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  } catch (err) {
    console.warn('[ConversationHistory] Save failed:', err);
  }
}

async function deleteConv(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  } catch {}
}

function generateTitle(messages: BuilderMessage[]): string {
  const firstUser = messages.find(m => m.role === 'user');
  if (!firstUser) return 'New conversation';
  const clean = firstUser.content.replace(/\[.*?\]/g, '').replace(/\n/g, ' ').trim();
  return clean.length > 60 ? clean.slice(0, 57) + '...' : clean || 'New conversation';
}

export function useConversationHistory() {
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadAll().then(setConversations);
  }, []);

  const saveCurrentConversation = useCallback((messages: BuilderMessage[], projectId?: string) => {
    if (messages.length === 0) return;
    const id = activeConversationId || crypto.randomUUID();
    const conv: ConversationRecord = {
      id,
      title: generateTitle(messages),
      messages,
      createdAt: conversations.find(c => c.id === id)?.createdAt || new Date(),
      updatedAt: new Date(),
      projectId,
    };
    saveConversation(conv);
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== id);
      return [conv, ...filtered].slice(0, MAX_CONVERSATIONS);
    });
    if (!activeConversationId) setActiveConversationId(id);
  }, [activeConversationId, conversations]);

  const switchToConversation = useCallback((id: string): BuilderMessage[] | null => {
    const conv = conversations.find(c => c.id === id);
    if (!conv) return null;
    setActiveConversationId(id);
    return conv.messages;
  }, [conversations]);

  const startNewConversation = useCallback((currentMessages: BuilderMessage[], projectId?: string) => {
    if (currentMessages.length > 0) {
      saveCurrentConversation(currentMessages, projectId);
    }
    setActiveConversationId(null);
    return [];
  }, [saveCurrentConversation]);

  const deleteConversation = useCallback((id: string) => {
    deleteConv(id);
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) setActiveConversationId(null);
  }, [activeConversationId]);

  return {
    conversations,
    activeConversationId,
    saveCurrentConversation,
    switchToConversation,
    startNewConversation,
    deleteConversation,
  };
}
