

## Plan: Fail-Closed Preview Pipeline + Circuit Breaker

Five tasks implementing strict parsing, preview gating, circuit breaker, and prompt hardening to eliminate tab freezes.

---

### Task 1: Strict state-machine parser in `useAIAppBuilder.ts`

**File: `src/hooks/useAIAppBuilder.ts` (lines 539–682)**

Replace the main file-parsing loop and post-processing with a strict state machine. Keep pre-parse logic (migrations, edge functions, mode, edits, deletions) unchanged.

**Changes:**
- Add `const END_RE = /^===END===\s*$/;` constant
- Replace the `for (const line of lines)` loop (lines 593–645) with strict state machine:
  - Only collect content between `===FILE:` delimiters
  - `===END===` flushes current file + breaks loop (stream complete)
  - Content outside any file block goes into `ignored[]` array (returned alongside files)
  - Remove `isConversationalLine` from file loop (keep function exported for edit block parsing)
  - Remove `blankLineStreak` prose-detection logic
- Replace `flush()` (lines 571–591): use `stripOuterMarkdownFenceOnly()` instead of aggressive per-line fence stripping — only strip if a single outer fence wraps the entire file content
- Remove post-process trailing prose loop (lines 652–671)
- **Incomplete flag**: mark last open file `incomplete: true` ONLY when stream ends inside a file block AND `===END===` was not seen. Files closed by a subsequent `===FILE:` delimiter are NOT incomplete.
- Keep the HTML fallback (lines 673–680) for backward compat
- Return `ignored` in result object

**File: `src/hooks/useProjectFileSystem.ts` (line 4–8)**

Add `incomplete?: boolean` to `ProjectFile` interface. This is transient (in-memory only) — ensure it doesn't affect localStorage persistence or any serialization.

### Task 2: Update parser tests

**File: `src/hooks/__tests__/parseMultiFileOutput.test.ts`**

- Update `parseFiles` helper to match strict behavior (no `isConversationalLine` in file loop)
- Update "strips conversational prose after 2+ blank lines" test — prose inside file blocks is now kept
- Add tests:
  - `===END===` prevents `incomplete` flag on last file
  - Without `===END===`, last file is `incomplete: true`
  - Content after `===END===` is ignored (not in `ignored[]` either — parsing stops)
  - File closed by next `===FILE:` is NOT incomplete
  - Outer markdown fence stripping (single wrapping fence removed; inner fences preserved)
  - `ignored[]` contains pre-file-block text

### Task 3: Fail-closed preview gating in CompilationBridge

**File: `src/components/ai-builder/CompilationBridge.tsx` (lines 302–329)**

After `runCompile()` returns result (line 316), add a validation gate before setting stableHTML:

1. Snapshot files into a local const BEFORE compiling: `const filesToCompile = filesRef.current.map(f => ({...f}))`
2. Pass same snapshot to both `runCompile()` and validation
3. Import and call `useOutputValidation().validate(filesToCompile)`
4. Check `filesToCompile.some(f => (f as any).incomplete)`
5. **Gate conditions** — if validation has errors OR incomplete files exist:
   - Do NOT call `setStableHTML` or `setLiveCompiledHTML`
   - Keep previous LKG preview
   - `window.postMessage({ type: '__BUILD_GATED__', payload: { reason, errors } }, '*')`
   - Log gated reason
6. `ignored[]` is NOT a gate — only warn if it contains >200 non-whitespace chars
7. Only proceed to `setStableHTML(result)` if gate passes

**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

- Add `useState<boolean>` for `buildGated`
- Add `useEffect` listener for `__BUILD_GATED__` messages → set `buildGated = true`
- Clear `buildGated` when `__PREVIEW_READY__` or `__SOFT_RELOAD__` arrives
- Show "Build failed — fixing…" text in GeneratingOverlay or small banner when gated

### Task 4: Circuit breaker + session guard in BuilderPreviewPanel

**File: `src/components/ai-builder/BuilderPreviewPanel.tsx` (lines 336–383)**

Replace the rate limiter with a full circuit breaker:

1. **Circuit breaker**: `errorTimestampsRef = useRef<number[]>([])`, `breakerOpenRef = useRef(false)`
   - Trip if >30 errors of types `__PREVIEW_ERROR__` or `__PREVIEW_CRITICAL_ERROR__` within 2 seconds
   - Do NOT trip on benign messages (ready/reload/heartbeat)
   - When tripped: replace `iframe.srcdoc` with static crash page HTML (no scripts), detach listener for 5s cooldown
   - After cooldown: reattach listener, restore previous stableHTML, reset timestamps

2. **Session guard**:
   - `sessionIdRef = useRef<string>("")` — generate new random ID whenever new HTML is set on iframe
   - Helper `injectSessionId(html, id)` — inject `<meta name="preview-session" content="...">` into `<head>`
   - Helper `newSessionId()` — `Math.random().toString(36).slice(2) + Date.now().toString(36)`
   - Message handler ignores messages where `data.previewSessionId` exists but doesn't match `sessionIdRef.current`
   - Messages WITHOUT `previewSessionId` are ignored once session guard is active (prevents zombie iframes)

3. Update the `useEffect` that sets `html` on iframe (line 385) to always generate + inject session ID

### Task 5: Prompt hardening — enforce `===END===`

**File: `supabase/functions/ai-app-builder/index.ts` (line 17–18)**

Add to `BASE_SYSTEM_PROMPT` OUTPUT FORMAT section:
```
Finish ALL file output with ===END=== on its own line. No prose after ===END===.
```

**File: `supabase/functions/ai-builder-background/index.ts` (line 557)**

Update continuation prompt to include:
```
When you have output all remaining files, end with ===END=== on its own line.
```

---

### Technical Details

**Strict parser state machine:**
```text
for each line:
  if ===END===     → flush current file (NOT incomplete), break
  if ===EDIT:===   → flush, enter edit-skip mode
  if ===DELETE:=== → flush, record deletion
  if ===FILE:===   → flush current (NOT incomplete — closed by delimiter), start new
  if in edit block → skip
  if in file block → append to content
  if outside       → add to ignored[]

After loop:
  if current file open AND no ===END=== seen → mark incomplete: true
```

**Circuit breaker states:**
```text
CLOSED  → errors < 30 in 2s window → pass through
OPEN    → replace srcdoc with crash page, detach listener
RECOVER → after 5s cooldown, reattach, restore LKG, reset
```

**Preview gating flow:**
```text
filesToCompile = snapshot(filesRef.current)
result = await runCompile(filesToCompile)
validation = validate(filesToCompile)
hasIncomplete = filesToCompile.some(f => f.incomplete)

if (validation.errors.length > 0 || hasIncomplete):
  keep LKG preview
  postMessage(__BUILD_GATED__)
  trigger auto-fix
else:
  setStableHTML(result)
  postMessage(__PREVIEW_READY__)
```

