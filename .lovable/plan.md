

# Final Lovable Build Parity: Remaining Issues

## Overview

After reviewing the full compilation pipeline post-16 phases of fixes, I've identified 5 remaining issues that break true Lovable parity. These are subtle but impactful: a stale `extractHead` function, a missing `lastMainEffectDigestRef` sync, visual edit recompile waste on React projects, an error overlay that blocks interaction, and a redundant nuclear fallback that should be removed entirely.

---

## Phase 1: Remove Dead `extractHead` Function in `BuilderPreviewPanel.tsx`

**Problem:** Lines 731-734 contain an unused `extractHead` helper function left over from the old iframe remount logic (removed in Phase 4 of a previous fix). This is dead code that adds confusion.

**Fix in `BuilderPreviewPanel.tsx`:**
- Delete the `extractHead` function (lines 731-734).

---

## Phase 2: `lastMainEffectDigestRef` Not Updated in Main Compilation Effect

**Problem:** In `CompilationBridge.tsx`, the hot-patch guard at line 416-424 uses `lastMainEffectDigestRef` to skip redundant patches when the main compilation effect already handled a digest. However, the main compilation effect (lines 178-328) never sets `lastMainEffectDigestRef.current = filesDigest`. This means the guard is ineffective -- every digest change still triggers a hot-patch comparison.

**Fix in `CompilationBridge.tsx`:**
- At the top of the main compilation effect (after the `isGenerating` / `justSyncedFromExternal` guards), set `lastMainEffectDigestRef.current = filesDigest` so the hot-patch effect correctly skips already-processed digests.

---

## Phase 3: Visual Edits on React Projects Trigger Full Recompile Instead of Iframe-Only Update

**Problem:** When `handleVisualEdit` applies a text or color change for React projects, `upsertFile()` changes `filesDigest`. Even though `skipNextCompileRef` is set for the serialized-HTML fallback path (lines 1905, 1953), the primary regex-match path (lines 1890-1893 for text, 1937-1941 for color) does NOT set `skipNextCompileRef`. This means successful regex-based visual edits on React projects still trigger a full recompile in CompilationBridge, even though the visual edit was already applied to the iframe.

**Fix in `AIAppBuilderWorkspace.tsx`:**
- In `handleVisualEdit`, set `skipNextCompileRef.current = true` before calling `upsertFile()` in the regex-match success paths for both `text` (line 1891) and `color` (line 1938) edits.

---

## Phase 4: Error Overlay Banner Blocks Bottom of Preview Content

**Problem:** The error overlay at line 628-681 in `BuilderPreviewPanel.tsx` is `absolute bottom-0` with `z-20`, permanently covering the bottom portion of the preview iframe when errors exist. In Lovable, the error banner is dismissible AND the preview content shifts up to accommodate it (not overlapped). Currently, users cannot see or interact with the bottom of their preview when errors are present.

**Fix in `BuilderPreviewPanel.tsx`:**
- Change the error overlay from `absolute` to a flex-layout element that pushes the iframe up. Alternatively, add bottom padding to the iframe container when errors are visible, so no content is hidden behind the overlay.

---

## Phase 5: Nuclear Fallback Should Be Fully Guarded Against Stale Closure Configs

**Problem:** The nuclear fallback at lines 2190-2226 still uses direct `supabaseConfig`, `stripeConfig`, etc. from the closure (not from refs). If the user changed integrations since the effect captured these values, the nuclear compile uses stale config -- producing incorrect preview HTML. This is the same stale closure issue fixed in Phase 6 for `handleBgComplete`, but the nuclear fallback was missed.

**Fix in `AIAppBuilderWorkspace.tsx`:**
- Read from `supabaseConfigRef.current`, `stripeConfigRef.current`, `envVarsRef.current`, `serviceKeysRef.current`, `cdnPackagesRef.current`, and `linkedGPTRef.current` inside the nuclear fallback, matching what was done for `handleBgComplete`.

---

## Technical Summary

| Phase | File | Change |
|-------|------|--------|
| 1 | `BuilderPreviewPanel.tsx` | Remove dead `extractHead` function |
| 2 | `CompilationBridge.tsx` | Set `lastMainEffectDigestRef` in main compilation effect |
| 3 | `AIAppBuilderWorkspace.tsx` | Set `skipNextCompileRef` for regex-match visual edits |
| 4 | `BuilderPreviewPanel.tsx` | Fix error overlay blocking preview content |
| 5 | `AIAppBuilderWorkspace.tsx` | Use config refs in nuclear fallback |

## Expected Result

After all 5 phases:
- No dead code in preview panel
- Hot-patch guard actually prevents redundant work
- Visual edits (text/color) don't trigger unnecessary React recompilations
- Error overlay doesn't hide preview content
- Nuclear fallback uses fresh config values

