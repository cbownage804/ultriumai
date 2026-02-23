/**
 * Clears all App Builder draft data from localStorage and IndexedDB.
 * Call this BEFORE navigating to the workspace with ?new=true
 * to guarantee no stale project is restored.
 *
 * Also sets a module-level flag that prevents the old workspace's
 * unmount `flushDraft()` from re-persisting stale files.
 */
const DRAFT_KEY = 'ai-builder-draft';
const IDB_DB_NAME = 'ai-builder-db';

/** When true, draft saves are suppressed. Reset on next workspace mount. */
let _draftCleared = false;

export function isDraftCleared(): boolean {
  return _draftCleared;
}

export function resetDraftClearedFlag(): void {
  _draftCleared = false;
}

export function clearBuilderDraft() {
  _draftCleared = true;

  // Clear localStorage draft
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* */ }

  // Clear IndexedDB session
  try {
    const req = indexedDB.deleteDatabase(IDB_DB_NAME);
    req.onerror = () => {};
    req.onsuccess = () => {};
  } catch { /* */ }
}
