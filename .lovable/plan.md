

## Fix: Tab-Switch State Loss (Round 2)

### Root Cause

The previous fix added synchronous localStorage save + restore, which is the right approach. However, it still fails for real projects because:

1. **localStorage quota overflow**: The `writeDraft` function serializes the entire project (files + messages) into a single JSON string. A real generated site with 4 files of HTML/CSS/JS plus AI chat messages easily exceeds localStorage's ~5MB limit. The `catch {}` block silently swallows the `QuotaExceededError`, so the save never actually persists -- but the code thinks it did.

2. **Messages bloat**: The `messages` array contains full AI responses with embedded code blocks, which are the largest contributor to storage size.

### Solution

**A. Make localStorage save resilient to quota limits** (`useDraftPersistence.ts`)

- Add a tiered save strategy inside `writeDraft`:
  1. Try saving everything (files + messages)
  2. If that throws (quota exceeded), retry with messages trimmed to just metadata (role, timestamp) -- strip the large `content` field
  3. If that still fails, retry with files only (no messages at all)
  4. If even that fails, silently give up (truly out of space)
- This ensures the most important data (the generated files) survives even when localStorage is tight.

**B. Add a console warning on save failure** (`useDraftPersistence.ts`)

- Instead of completely silent failure, log a `console.warn` so developers can diagnose issues. Still no user-facing error since it's a background save.

**C. Harden the restore effect** (`AIAppBuilderWorkspace.tsx`)

- Use a `mounted` ref guard to prevent the IDB async callback from applying state after the component unmounts or after localStorage already restored successfully.
- Add a `hasRestoredRef` to prevent double-restoration if both localStorage and IDB succeed.

### Changes

**File 1: `src/hooks/useDraftPersistence.ts`**

Update `writeDraft` with tiered fallback:

```typescript
const writeDraft = useCallback((name: string, files: ProjectFile[], messages: any[]) => {
  const trySet = (data: DraftData): boolean => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  };

  const baseDraft: DraftData = {
    name,
    files: files.map(f => ({ path: f.path, content: f.content, language: f.language })),
    messages,
    savedAt: new Date().toISOString(),
  };

  // Tier 1: Full save (files + messages)
  if (trySet(baseDraft)) return;

  // Tier 2: Files + slim messages (strip large content)
  console.warn('[Draft] localStorage quota exceeded, saving without message content');
  const slimMessages = messages.map((m: any) => ({
    role: m.role, timestamp: m.timestamp,
    content: typeof m.content === 'string' ? m.content.slice(0, 200) : '',
  }));
  if (trySet({ ...baseDraft, messages: slimMessages })) return;

  // Tier 3: Files only (no messages)
  console.warn('[Draft] localStorage still full, saving files only');
  if (trySet({ ...baseDraft, messages: [] })) return;

  // Tier 4: Give up
  console.warn('[Draft] localStorage completely full, draft not saved');
}, []);
```

**File 2: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

Add a `hasRestoredRef` guard to the restore effect to prevent race conditions:

```typescript
const hasRestoredRef = useRef(false);

useEffect(() => {
  if (initialProjectId || isNewProject) return;
  if (project.files.length > 0 || messages.length > 0) return;
  if (hasRestoredRef.current) return;

  // SYNC FIRST: Try localStorage immediately
  const lsDraft = loadDraft();
  if (lsDraft && (lsDraft.files.length > 0 || lsDraft.messages.length > 0)) {
    hasRestoredRef.current = true;
    setFiles(lsDraft.files);
    renameProject(lsDraft.name);
    if (lsDraft.messages.length > 0) {
      setMessages(lsDraft.messages.map((m: any) => ({
        ...m, timestamp: new Date(m.timestamp)
      })));
    }
  }

  // ASYNC SECOND: Check IDB for more complete data
  let cancelled = false;
  (async () => {
    try {
      const idbSession = await idbPersistence.checkRecovery();
      if (cancelled || !idbSession) return;
      const idbTotal = (idbSession.files?.length || 0) + (idbSession.messages?.length || 0);
      const lsTotal = (lsDraft?.files?.length || 0) + (lsDraft?.messages?.length || 0);
      if (idbTotal > lsTotal) {
        hasRestoredRef.current = true;
        setFiles(idbSession.files);
        renameProject(idbSession.name);
        if (idbSession.messages.length > 0) {
          setMessages(idbSession.messages.map((m: any) => ({
            ...m, timestamp: new Date(m.timestamp)
          })));
        }
      }
    } catch { /* IDB unavailable */ }
  })();

  return () => { cancelled = true; };
}, []);
```

### Summary

| Problem | Cause | Fix |
|---------|-------|-----|
| State lost on tab switch | localStorage save silently fails due to 5MB quota | Tiered save: full -> slim messages -> files only |
| Potential double-restore race | IDB async callback applies after LS already restored | `hasRestoredRef` guard + cancellation token |

