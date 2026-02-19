

# Phase 84-90: Completion Sprint -- Ship-Ready Polish

After an exhaustive audit of 5,000+ lines across the core pipeline (compiler, edge function, workspace, context management), here is what remains to make the App Builder truly production-complete. Phases 71-83 landed successfully -- this is the final stretch.

---

## What's Already Working Well

The following are DONE and solid:
- React compiler with Babel try-catch, import maps, UMD shims, anonymous export handling
- Type stripping with bracket-depth counter
- Console deduplication with `__builderInjected` guard
- Context budget trimming (`trimForContext` wired into `buildFileContext`)
- System prompt consolidation (single message, 20K cap)
- Prose leak prevention (2-blank-line threshold, expanded patterns)
- CDN registry with tailwind-merge, class-variance-authority, radix, cmdk
- 26 passing tests for compiler and parser
- Edge function system prompt with strict `===FILE:` format enforcement
- URL bar sync, refresh button, Cmd+I keybinding

---

## Category A: Critical Bugs Found During Audit

### Phase 84: Fix `trimForContext` Signature Mismatch

**Problem**: `useContextBudget.trimForContext` expects `(files, activeFilePath, userInput)` where `userInput` is a string. But in `useAIAppBuilder.ts` line 888, it's called correctly. However, `trimForContext` is declared inside `useCallback` with `[maxChars]` in the dependency array -- this means `sendMessage` (which captures `trimForContext`) has it in its closure, but `sendMessage` itself lists `[messages, isGenerating, mode, totalRemaining, deductCredits]` as deps (line 1549). **`trimForContext` is NOT in `sendMessage`'s dependency array**, so it will always use the initial closure value. This is technically fine since `maxChars` never changes, but it's a latent bug if maxChars ever becomes dynamic.

**Fix**: No code change needed -- just a note. The current implementation is safe because `maxChars: 120_000` is a constant.

### Phase 85: Fix Default Model Mismatch Between Client and Server

**Problem**: The client defaults to `google/gemini-3-flash-preview` (line 301 of workspace) but the edge function defaults to `google/gemini-3-pro-preview` (line 1086 of edge function). When `selectedModel` is sent as `undefined` (which happens on first load), the server uses Pro, but the UI shows "Flash" in the model selector. This is confusing -- the user thinks they're using Flash but they're actually using Pro (which may be slower/more expensive).

**Fix**:
- Align the default model: change the edge function's fallback model to match the client's default (`google/gemini-3-flash-preview`)
- OR: Change the client default to match the server (`google/gemini-3-pro-preview`)
- Recommendation: Use Flash as default everywhere (faster, cheaper, good enough for most code gen)

### Phase 86: Fix Edge Function Schema Detection Injection

**Problem**: The edge function adds `SUPABASE_ADDON` to the system prompt when `supabaseConfig` is truthy. But the schema context (table names, columns, RLS policies) is only sent from the client as a system message -- it's NOT injected server-side. This means the AI sees the Supabase integration instructions but not the actual database schema, leading to hallucinated table names.

**Fix**:
- The client's `schemaIntrospection` already fetches the schema and generates a `types.ts` file that gets included in the file context
- Verify that schema information flows through: client fetches schema, generates types.ts, types.ts is included in file context sent to AI
- Add a `[DATABASE SCHEMA]` block to the system prompt consolidation when `supabaseConfig` is present and schema is available

---

## Category B: UX Polish for Production

### Phase 87: Streaming Feedback on Preview Tab

**Problem**: When the user is on the Preview tab (default) and sends a build request, they see a stale preview with no indication that files are being written. The `GeneratingOverlay` component exists and shows file count, but it only renders when `isGenerating` is true -- it disappears immediately when streaming ends, before the new preview compiles.

**Fix**:
- Add a brief "Compiling preview..." state after streaming ends but before the new HTML is ready
- Show the `GeneratingOverlay` during compilation (not just during AI streaming)
- Add a smooth transition: overlay fades out as new preview fades in

### Phase 88: Error Recovery UX Improvements

**Problem**: When auto-fix exhausts its 3 attempts, the user sees a toast but no clear call-to-action in the preview panel. The `onStartOver` prop exists on `BuilderPreviewPanel` but is only shown when `fixAttemptCount >= maxFixAttempts` AND there's an error. The error console shows errors but the "Try to Fix" button doesn't indicate how many attempts remain.

**Fix**:
- Show attempt count on the "Try to Fix" button: "Try to Fix (2/3)"
- After exhausting attempts, show a prominent "Regenerate" button in the preview panel
- Add a "Revert to last working version" option using the version timeline

### Phase 89: Missing `storageTemplates.ts` Import

**Problem**: The memory mentions `storageTemplates.ts` for auto-provisioning storage buckets, but searching the codebase shows this file doesn't exist in `src/components/ai-builder/`. The storage bucket creation is handled entirely through the AI's system prompt (which generates `===MIGRATION:` blocks). This is actually fine -- it's prompt-driven rather than template-driven.

**Status**: No fix needed. The system prompt approach is sufficient.

---

## Category C: Edge Function Hardening

### Phase 90: Add Request Size Validation to Edge Function

**Problem**: The edge function at line 930 does `await req.json()` on the full request body without size validation. A malicious or buggy client could send a multi-GB payload that exhausts the function's memory limit (150MB default on Supabase Edge Functions).

**Fix**:
- Add a Content-Length check before parsing: reject requests over 10MB
- Add error handling around `req.json()` in case the body is malformed
- Return a clear 413 status code for oversized requests

---

## Implementation Priority

```text
CRITICAL (user-facing confusion):
Phase 85 (Default Model Mismatch)     -- UI says Flash, server uses Pro
Phase 86 (Schema Context Gap)         -- AI halluccinates table names

HIGH (UX gaps):
Phase 87 (Streaming Preview Feedback) -- No visual feedback during build
Phase 88 (Error Recovery UX)          -- Dead-end after 3 fix attempts

NICE-TO-HAVE (hardening):
Phase 84 (trimForContext deps)         -- Latent bug, safe for now
Phase 89 (storageTemplates)            -- Not needed
Phase 90 (Request Size Validation)     -- Defense in depth
```

---

## Technical Details

### Phase 85 -- Model Alignment

In `supabase/functions/ai-app-builder/index.ts` line 1086, change:
```typescript
model: model || "google/gemini-3-pro-preview",
```
to:
```typescript
model: model || "google/gemini-3-flash-preview",
```

### Phase 86 -- Schema Context Injection

In `useAIAppBuilder.ts`, within the system prompt consolidation block (around line 776), add:
```typescript
// Inject schema context if Supabase is connected and schema is available
if (supabaseConfig && currentFiles.some(f => f.path === 'types.ts' || f.path === 'src/types.ts')) {
  const typesFile = currentFiles.find(f => f.path.endsWith('types.ts'));
  if (typesFile && typesFile.content.length > 50) {
    systemParts.push(`[DATABASE SCHEMA]\nThe following TypeScript types represent the connected Supabase database schema:\n${typesFile.content.slice(0, 5000)}\n\nUse these EXACT table and column names in all queries.`);
  }
}
```

### Phase 87 -- Compilation State

In `AIAppBuilderWorkspace.tsx`, track a `isCompiling` state:
```typescript
const [isCompiling, setIsCompiling] = useState(false);

// In the useEffect that syncs latestFiles:
useEffect(() => {
  if (latestFiles.length > 0) {
    setIsCompiling(true);
    // ... existing file sync logic ...
    // After files are applied, briefly show compiling state
    requestAnimationFrame(() => {
      setTimeout(() => setIsCompiling(false), 500);
    });
  }
}, [latestFiles]);
```

Pass `isCompiling` to `GeneratingOverlay` or `BuilderPreviewPanel` to show a brief "Compiling..." indicator.

### Phase 88 -- Error Recovery Button

In `ErrorConsole.tsx` or `BuilderPreviewPanel.tsx`, update the fix button:
```typescript
<button onClick={onFixError}>
  Try to Fix {fixAttemptCount && maxFixAttempts 
    ? `(${fixAttemptCount}/${maxFixAttempts})` 
    : ''}
</button>
{fixAttemptCount >= maxFixAttempts && (
  <button onClick={onStartOver}>Regenerate from scratch</button>
)}
```

### Phase 90 -- Request Size Guard

At the top of the edge function's serve handler:
```typescript
const contentLength = parseInt(req.headers.get('content-length') || '0');
if (contentLength > 10_000_000) {
  return new Response(JSON.stringify({ error: "Request too large (max 10MB)" }), {
    status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```
