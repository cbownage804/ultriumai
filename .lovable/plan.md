

# True Parity Plan: Match Lovable's Builder Experience

## Problem Summary

Your App Builder has a recurring "Compiling preview..." infinite loop caused by **two competing compilation paths** in `CompilationBridge.tsx` that race against each other. Additionally, the UX during generation doesn't match Lovable's polished experience shown in your screenshots.

## Part 1: Fix the Compilation Loop (Critical)

### Root Cause

`CompilationBridge.tsx` has TWO compilation triggers that fight:
1. **Generation-ending effect** (line 146-186): Sets locks, waits 100ms, calls `compileNowRef()`
2. **Main useEffect** (line 284-537): Watches `filesDigest` + `isGenerating`, does 500ms debounced compile

When generation ends, BOTH fire because their shared dependencies (`isGenerating`, `filesDigest`) change simultaneously. The locking mechanism (`compilationLockRef`, `compilationAttemptedRef`, `prevFilesDigestRef`) tries to coordinate them but frequently fails due to React batching and timer ordering.

### Solution: Single Compilation Path

Replace both paths with ONE simple trigger:

- **Remove** the generation-ending direct compile (the 100ms timer path)
- **Remove** all lock/attempted/digest coordination refs
- **Simplify** the main effect to: "When `isGenerating` transitions false and files exist, compile after 150ms"
- Use a single `compilationInFlightRef` boolean (set synchronously in the effect, cleared in finally block) to prevent double-entry

### Technical Changes

**File: `src/components/ai-builder/CompilationBridge.tsx`**

- Remove `compilationLockRef`, `compilationAttemptedRef`, `prevFilesDigestRef`, `immediateCompileNeededRef`, `justSyncedFromExternalRef`, `compilationCleanupRef`
- Replace the generation start/end effect (lines 137-189) with a simple reset on generation start
- Replace the main effect (lines 284-537) with a clean single-path compiler:

```text
useEffect:
  if isGenerating or files.length === 0 -> return
  if stableHTMLRef.current -> check for hot-patch, return
  if compilationInFlightRef.current -> return (already compiling)
  
  // Single 150ms debounce, then compile
  timer = setTimeout(() => {
    compilationInFlightRef.current = true
    onCompilingChange(true)
    try {
      result = await compile(files)
      setStableHTML(result || ERROR_FALLBACK)
    } finally {
      compilationInFlightRef.current = false
      onCompilingChange(false)
    }
  }, 150)
  
  return () => clearTimeout(timer) // only cancel debounce, not in-flight
```

- Keep the external sync logic (if `externalStableHTMLRef` has a value, use it immediately)
- Keep hot-patch logic for CSS-only changes during manual edits

---

## Part 2: Lovable-Style "Getting Ready" Feature Carousel

In Lovable's screenshots, while the AI is generating, the right-side preview shows a **rotating carousel of feature cards** (Edit visually, Revert and edit messages, Ecommerce included, Measure performance, Custom rules, Lovable Cloud, Publish your project) with screenshots and descriptions.

### Technical Changes

**File: `src/components/ai-builder/SkeletonPreview.tsx`**

Replace the static shimmer skeleton with a feature carousel:

- Auto-rotating cards (every 4 seconds) with smooth transitions
- Each card shows: a screenshot/illustration, a title, and a one-line description
- Cards highlight your platform's features:
  - "Edit visually" - Click to edit directly or describe changes
  - "Revert and edit messages" - Go back to any point in history
  - "Full-stack included" - Data, hosting, auth, AI included
  - "Publish your project" - Instantly publish to your domain
  - "Measure performance" - Track visitors, views, and trends
- "Getting ready..." spinner at the top center
- Dark background matching the current theme

---

## Part 3: Progress Steps in Chat (DONE / WORKING / NEXT)

Lovable shows build progress as a checklist in the chat with status indicators:
- Green check = DONE
- Spinning loader = WORKING  
- Empty circle = NEXT

### Technical Changes

**File: `src/components/ai-builder/BuilderChatPanel.tsx`**

Add a `BuildProgressCard` component that renders when the AI's response includes progress markers. The edge function already sends progress phases via the streaming content - parse `[PROGRESS]` markers or use the existing `phase` detection to show steps like:
- Set up design system
- Build homepage sections
- Add interactivity

**File: `src/hooks/useBackgroundGeneration.ts`** (or the edge function prompt)

Update the system prompt to emit structured progress markers that the chat can parse and display as the checklist UI.

---

## Part 4: Scraping Preview Card in Chat

When the AI scrapes a website (clone/replicate intent), Lovable shows an expandable card with:
- "Reading" / "Fetching [url]" header
- A screenshot or preview of the scraped site
- Description like "Gathering content and branding details now"

### Technical Changes

**File: `src/components/ai-builder/BuilderChatPanel.tsx`**

Add a `ScrapingCard` component that appears when the `firecrawl-scrape` response returns branding/screenshot data. Parse the assistant message for scraping activity markers and display:
- Collapsible card with the site URL
- Screenshot from the scrape response (if `formats: ['screenshot']` was used)
- Status text ("Gathering content and branding details")

---

## Implementation Order

1. **Part 1 first** - Fix the compilation loop (this is the blocker)
2. **Part 2** - Feature carousel (visual polish, quick win)
3. **Part 3** - Progress steps in chat
4. **Part 4** - Scraping preview card

## Summary of Files Changed

| File | Change |
|------|--------|
| `CompilationBridge.tsx` | Rewrite to single compilation path |
| `SkeletonPreview.tsx` | Replace with Lovable-style feature carousel |
| `BuilderChatPanel.tsx` | Add BuildProgressCard + ScrapingCard components |
| `GeneratingOverlay.tsx` | Minor: change "Generating..." to "Getting ready..." |

