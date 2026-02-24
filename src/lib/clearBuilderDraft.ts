/**
 * Clears all App Builder draft data from localStorage and IndexedDB.
 * Call this BEFORE navigating to the workspace with ?new=true
 * to guarantee no stale project is restored.
 *
 * Uses a sessionStorage flag ('ai-builder-new-session') that survives
 * across React component unmount/mount boundaries and is immune to
 * effect ordering issues.
 */
const DRAFT_KEY = 'ai-builder-draft';
const IDB_DB_NAME = 'ai-builder-db';
const NEW_SESSION_FLAG = 'ai-builder-new-session';

/**
 * Returns true if a "new project" intent is active.
 * Checked by flushDraft (to suppress re-persisting stale data)
 * and by all restore paths (to skip hydrating old data).
 */
export function isNewSessionPending(): boolean {
  try {
    return sessionStorage.getItem(NEW_SESSION_FLAG) === '1';
  } catch {
    return false;
  }
}

/**
 * Clear the new-session flag once the new workspace has fully mounted
 * and cleared its state. After this, saves and restores work normally.
 */
export function consumeNewSessionFlag(): void {
  try {
    sessionStorage.removeItem(NEW_SESSION_FLAG);
  } catch { /* */ }
}

export function clearBuilderDraft() {
  // Set a durable flag in sessionStorage — survives across component
  // boundaries and React lifecycle ordering
  try {
    sessionStorage.setItem(NEW_SESSION_FLAG, '1');
  } catch { /* */ }

  // Clear localStorage draft and cached compiled HTML
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* */ }
  try { localStorage.removeItem('ai-builder-compiled-html'); } catch { /* */ }

  // Clear IndexedDB session
  try {
    const req = indexedDB.deleteDatabase(IDB_DB_NAME);
    req.onerror = () => {};
    req.onsuccess = () => {};
  } catch { /* */ }
}
