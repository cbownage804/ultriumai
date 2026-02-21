

## Permanent Fix: Project State Loss on Tab Switch

### Root Cause Found

There is a **data-destroying bug** in the localStorage save logic. The `trySet` helper calls `localStorage.removeItem(DRAFT_KEY)` before every write attempt. When the write fails (quota exceeded), the old draft has already been deleted. Each fallback tier repeats this, so if all tiers fail, the project data is permanently lost.

This means switching tabs actually **deletes** the user's work instead of saving it.

### Fix Strategy

Three changes to make persistence bulletproof:

---

### Change 1: Fix the destructive save in `useDraftPersistence.ts`

- Move `localStorage.removeItem` to happen only ONCE, at the top of `writeDraft`, but ONLY after confirming the new data can be serialized successfully
- Use a "write-then-swap" pattern: serialize the data first, remove old, then write. If the write fails, keep a backup of the old data and restore it
- This prevents the "delete old, fail to write new" data loss scenario

### Change 2: Make IDB the primary persistence, localStorage as backup

- In the `visibilitychange` handler, the IDB immediate save is wrapped in a `try/catch` that silently ignores failures. Since IDB has no size limit (unlike localStorage's 5MB), it should be treated as the primary storage
- Make the flushDraft function `await` the IDB save (using a sync-compatible approach for `beforeunload`)
- On tab return, check IDB first (it has no quota issues), then fall back to localStorage

### Change 3: Always re-hydrate on tab return, not just when state is empty

- The current guard `if (current.files.length === 0 && current.messages.length === 0)` is too strict. If React state was partially corrupted or the component re-rendered with defaults, this check might not trigger
- Change to: always read from storage on visibility change to `visible`, and compare timestamps. If storage is newer, restore from it. If React state is current, do nothing

---

### Technical Details

**File 1: `src/hooks/useDraftPersistence.ts`**

Replace the `writeDraft` function:

```text
writeDraft flow (before - BROKEN):
  trySet(full):   removeItem -> setItem FAILS -> data GONE
  trySet(slim):   removeItem -> setItem FAILS -> data GONE
  trySet(files):  removeItem -> setItem FAILS -> data GONE
  Result: complete data loss

writeDraft flow (after - SAFE):
  backup = getItem(key)        // save old draft in memory
  removeItem(key)              // free quota
  try setItem(full)            // attempt write
  try setItem(slim)            // fallback 1
  try setItem(files)           // fallback 2
  if all failed: setItem(backup)  // RESTORE old draft
  Result: at worst, old draft survives
```

**File 2: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

Update the `handleVisibility` function in the `visibilitychange` effect:
- On `visible`: always compare storage draft timestamp vs React state. If storage is newer or React state looks empty/stale, re-hydrate
- On `hidden`: flush to both localStorage and IDB (unchanged, but with safe write logic)

### Summary

| Problem | Root Cause | Fix |
|---------|-----------|-----|
| Data lost on tab switch | `removeItem` before `setItem` destroys old draft when write fails | Backup old draft in memory, restore if write fails |
| Large projects can't save to localStorage | 5MB quota limit | IDB as primary (no limit), localStorage as fallback with safe writes |
| Re-hydration doesn't always trigger | Guard too strict (both files AND messages must be empty) | Always compare timestamps on tab return |

