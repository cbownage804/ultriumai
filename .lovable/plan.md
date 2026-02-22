
# Fix: Color Persistence + Browser Freeze (Root Causes Found)

## Problem 1: Colors Don't Persist — Root Cause

The `buildSelector()` in `VisualEditOverlay.tsx` generates CSS path selectors like:
```
html > body > div > section:nth-child(2) > h1
```

The `handleVisualEdit` color path has three fallbacks, and ALL THREE fail:

1. **Regex match (lines 1944-1969):** Looks for the selector string inside `class`/`id` attributes. A CSS path selector never appears in class/id attributes. Always fails.

2. **DOMParser fallback (lines 1971-1991):** Parses the **source HTML file** and runs `querySelector(selector)`. But the source HTML has a different DOM structure than the iframe DOM — the iframe has injected shim scripts, style tags, and wrapper elements that shift `nth-child` indices. So the selector that matches in the iframe doesn't match the same element in the source. Fails silently or matches the wrong element.

3. **Last resort iframe serialization (lines 1992-2005):** Serializes the iframe DOM (which DOES have the color applied visually at line 186). This should work — BUT the serialized iframe DOM includes all injected elements (shim scripts, style tags, overlay CSS). Saving this bloated HTML as the source file corrupts it for future builds.

**Fix:** Instead of trying to map iframe CSS path selectors back to source HTML, use **element content matching**. The VisualEditOverlay already captures `el.textContent` and `el.tagName`. Use these to find the matching element in the source HTML by matching tag + text content, which is stable regardless of DOM structure differences.

**Changes in `AIAppBuilderWorkspace.tsx` (`handleVisualEdit` for `color` and `text`):**
- Replace the DOMParser `querySelector(selector)` fallback with a **text-content-based element finder**: parse the source HTML, walk all elements matching the tag name, and find the one whose `textContent` matches the selected element's text.
- Also pass the element's `tagName` and `textContent` from VisualEditOverlay alongside the selector (they're already available in `selectedElement`).
- Update the `onEditApply` callback signature to include `tagName` and `textContent` for robust matching.

**Changes in `VisualEditOverlay.tsx`:**
- Pass `selectedElement.tagName` and `selectedElement.text` through the `onEditApply` callback so `handleVisualEdit` can use content-based matching.

---

## Problem 2: Browser Freeze — Root Cause

The deferred steps were split (Phase 2 of previous fix), but the delays are only **0ms, 50ms, 100ms** apart. The browser doesn't get meaningful time to process events between steps. More critically:

- **`deferStep1`** runs smoke test + conflict detection + TS validation synchronously on ALL files — for 623 files this alone can take 1-2 seconds.
- **`deferStep2`** runs `lighthouseAudit.runAudit()` which does `files.map(f => f.content).join('\n')` creating a multi-MB string, then runs 15+ regex matches on it. Plus `bundleSize.analyzeBundle()` which runs `new TextEncoder().encode(f.content)` on every file AND `findEmbeddedImages()` which runs a regex on every file. For 623 files this blocks the main thread for seconds.
- **`deferStep3`** runs auto-patching + companion file generation — scanning all files again.

The `requestIdleCallback` with short timeouts doesn't help because each individual step is itself a multi-second synchronous operation.

**Fix in `AIAppBuilderWorkspace.tsx`:**
- **Skip heavy analysis for small projects**: Gate lighthouse audit and bundle analysis behind a file count threshold (only run for projects with < 100 files). For larger projects, skip them entirely — these are nice-to-have diagnostics, not critical.
- **Increase delays between steps**: Change from 0/50/100ms to 0/500/1500ms so the browser has time to paint and process events.
- **Add early-exit in lighthouse and bundle hooks**: If file count exceeds 200, return immediately with a default "skipped" result.

---

## Technical Summary

| Issue | File(s) | Change |
|-------|---------|--------|
| Color/text edits can't find element in source | `VisualEditOverlay.tsx` | Pass `tagName` + `text` through `onEditApply` |
| Color/text edits can't find element in source | `AIAppBuilderWorkspace.tsx` | Replace `querySelector(selector)` with text-content-based matching in DOMParser fallback |
| Browser freeze during "Verifying output" | `AIAppBuilderWorkspace.tsx` | Skip heavy analysis for projects > 100 files, increase inter-step delays |
| Browser freeze from lighthouse/bundle | `useLighthouseAudit.ts`, `useBundleSizeTracking.ts` | Early-exit when file count > 200 |

## Expected Result

- Visual edit color and text changes reliably persist to source HTML files using content-based element matching
- Post-build analysis no longer freezes the browser for large projects
