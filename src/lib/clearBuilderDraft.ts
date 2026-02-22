/**
 * Clears all App Builder draft data from localStorage and IndexedDB.
 * Call this BEFORE navigating to the workspace with ?new=true
 * to guarantee no stale project is restored.
 */
const DRAFT_KEY = 'ai-builder-draft';
const IDB_DB_NAME = 'ai-builder-db';

export function clearBuilderDraft() {
  // Clear localStorage draft
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* */ }

  // Clear IndexedDB session
  try {
    const req = indexedDB.deleteDatabase(IDB_DB_NAME);
    req.onerror = () => {};
    req.onsuccess = () => {};
  } catch { /* */ }
}
