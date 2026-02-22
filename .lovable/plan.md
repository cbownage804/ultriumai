
# Fix: Visual Edit Color Persistence + Browser Freeze

## Problem 1: Color Changes Don't Persist

The `buildSelector()` in `VisualEditOverlay.tsx` generates CSS path selectors like:
```
html > body > div > footer:nth-child(5) > p
```

But `handleVisualEdit` in `AIAppBuilderWorkspace.tsx` tries to match these selectors inside `class` or `id` attributes using regex:
```regex
/<[^>]*(?:class|id)=["'][^"']*ESCAPED_SELECTOR[^"']*["']...>/
```

A CSS path selector will **never** appear inside a class/id attribute. The regex never matches, so the color edit falls through to the DOM serialization fallback. The serialized DOM may not preserve the color because `el.style.color` was set on the iframe element but the serialized `outerHTML` captures the original source attributes, not computed styles.

**Root cause:** The visual edit pipeline assumes the selector is a class/id name, but it's actually a CSS path.

**Fix:** Rewrite the color and text edit logic to use the selector to locate the element in the source by matching its **tag structure** (parent > child position) rather than looking for the selector string inside attributes. As a simpler immediate fix: when the regex-based approach fails, apply the edit by directly modifying the matched element's inline style in the source HTML using a DOM parser approach (parse the HTML, querySelector, modify, serialize back).

**Changes in `AIAppBuilderWorkspace.tsx` (`handleVisualEdit`):**
- For both `text` and `color` properties: after the current regex fails, add a new fallback that parses the HTML source with DOMParser, uses `querySelector(selector)` to find the element, applies the edit, and serializes back.
- This correctly handles CSS path selectors because DOMParser.querySelector supports them natively.

---

## Problem 2: Browser Freeze During "Verifying output"

The `deferPostGen` callback runs ALL post-build analysis synchronously within a single `requestIdleCallback`:
1. `smokeTest.runSmokeTest` -- scans all files
2. `conflictDetection.detectConflicts` -- scans all files
3. `tsValidator.validate` -- scans all files with regex
4. `lighthouseAudit.runAudit` -- joins ALL file content into one string, runs 15+ regex matches
5. `bundleSize.analyzeBundle` -- scans all files
6. `deleteAutoPatcher.patchDeleteButtons` -- scans all files
7. `fileScaffolding.generateCompanionFiles` -- scans all files

For a 623-file project, step 4 alone creates a multi-MB string and runs heavy regex operations. All 7 steps run back-to-back on the main thread, blocking the UI for potentially seconds.

**Fix in `AIAppBuilderWorkspace.tsx`:**
- Break `deferPostGen` into individual `requestIdleCallback` / `setTimeout` calls so the browser can process events between each step.
- Specifically: run smoke test + conflict detection first (needed for error annotations), then schedule lighthouse, bundle analysis, and auto-patching as separate deferred callbacks.

---

## Technical Summary

| Issue | File | Change |
|-------|------|--------|
| Color/text edits don't persist | `AIAppBuilderWorkspace.tsx` | Add DOMParser-based fallback for CSS path selectors in `handleVisualEdit` |
| Browser freeze on large projects | `AIAppBuilderWorkspace.tsx` | Split `deferPostGen` into individual deferred callbacks to yield to the main thread between heavy operations |

## Expected Result

- Visual edit color and text changes persist correctly to source files regardless of selector format
- Post-build analysis runs without freezing the browser, even for 600+ file projects
