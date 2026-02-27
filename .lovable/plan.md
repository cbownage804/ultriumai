

## Plan: Harden Validation Fallback (4 edits, 2 files)

Scope: `CompilationBridge.tsx` and `AIAppBuilderWorkspace.tsx` only. No other files touched.

---

### Edit 1 — Sentinel marker in VALIDATING_FALLBACK_HTML

**File:** `src/components/ai-builder/CompilationBridge.tsx` — line 43

Add `<meta name="ai-builder-fallback" content="validating" />` in the `<head>` after the viewport meta tag. The rest of the HTML stays identical.

---

### Edit 2 — Render-only fallback (no stableHTMLRef, no onStableHTML)

**File:** `src/components/ai-builder/CompilationBridge.tsx` — line 316

```diff
- setStableHTML(VALIDATING_FALLBACK_HTML);
+ // Render-only: show fallback in iframe WITHOUT updating stableHTMLRef or calling onStableHTML
+ setStableHTMLLocal(VALIDATING_FALLBACK_HTML);
```

`setStableHTMLLocal` (line 125) is the raw `useState` setter — it renders the spinner in the iframe but does NOT touch `stableHTMLRef.current` (stays `null`) and does NOT call `onStableHTML`. Safety nets continue to detect "no preview."

---

### Edit 3 — forceCompileTrigger state

**File:** `src/components/ai-builder/CompilationBridge.tsx`

A. After line 142 (`liveCompiledHTML` state), add:
```typescript
const [forceCompileTrigger, setForceCompileTrigger] = useState(0);
```

B. In `forceCompile` callback (line 435, after `setLiveCompiledHTML(null)`), add:
```typescript
setForceCompileTrigger(c => c + 1);
```

C. Add to compile effect deps (line 424):
```diff
- }, [filesDigest, isGenerating, supabaseConfig, stripeConfig, isReactProject, setStableHTML, runCompile]);
+ }, [filesDigest, isGenerating, supabaseConfig, stripeConfig, isReactProject, setStableHTML, runCompile, forceCompileTrigger]);
```

---

### Edit 4 — Sentinel-based cache guard

**File:** `src/components/ai-builder/AIAppBuilderWorkspace.tsx` — lines 2529-2534

```diff
  try {
-   if (html) {
-     localStorage.setItem(COMPILED_CACHE_KEY, html);
-   }
+   const isFallback = html?.includes('name="ai-builder-fallback"') ?? false;
+   if (html && !isFallback) {
+     localStorage.setItem(COMPILED_CACHE_KEY, html);
+   }
  } catch { /* quota exceeded — non-critical */ }
```

---

### Existing guards confirmed intact

- 15s safety net (line 2552): already has `&& !pendingValidationFixRef.current` — no change needed.
- 20s safety net: already guarded — no change needed.

