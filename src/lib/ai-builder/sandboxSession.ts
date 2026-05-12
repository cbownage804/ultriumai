/**
 * #9 — Persistent sandbox session per project.
 * The compile-vite edge function accepts a `sessionId`; the droplet keeps
 * a long-lived Vite dev server bound to that id and only re-applies
 * changed files (HMR-style) on subsequent compiles. Reduces compile time
 * from 3-8s to <500ms for incremental edits.
 *
 * If a session goes stale or the droplet evicts it, the sandbox returns
 * `session_expired` and the client transparently starts a new session.
 */

const SESSION_KEY = 'ai-builder-sandbox-session';
const TTL_MS = 30 * 60 * 1000; // 30 min idle

interface StoredSession {
  projectId: string;
  sessionId: string;
  createdAt: number;
  lastUsedAt: number;
}

function load(): Record<string, StoredSession> {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function save(map: Record<string, StoredSession>): void {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(map)); } catch { /* quota */ }
}

function newId(): string {
  return 'sb_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function getOrCreateSession(projectId: string): string {
  const map = load();
  const now = Date.now();
  const existing = map[projectId];
  if (existing && now - existing.lastUsedAt < TTL_MS) {
    existing.lastUsedAt = now;
    save(map);
    return existing.sessionId;
  }
  const session: StoredSession = {
    projectId,
    sessionId: newId(),
    createdAt: now,
    lastUsedAt: now,
  };
  map[projectId] = session;
  save(map);
  return session.sessionId;
}

export function invalidateSession(projectId: string): void {
  const map = load();
  delete map[projectId];
  save(map);
}

export function rotateSession(projectId: string): string {
  invalidateSession(projectId);
  return getOrCreateSession(projectId);
}
