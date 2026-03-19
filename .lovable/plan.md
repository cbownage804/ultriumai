

# Lovable Parity — Wave 11

Six improvements targeting collaboration, debugging depth, and production readiness.

---

## 1. Image/Screenshot Attachment in Chat Input ✅

**Status**: Already integrated. `BuilderChatPanel` supports clipboard paste, drag-and-drop, and file upload for images. The Plus menu provides Camera (screenshot capture) and Attach options.

---

## 2. Per-File Undo (Granular Revert) ✅

**Status**: Implemented via `usePerFileHistory.ts`. Tracks last 10 versions per file. `FileTabBar` now shows an undo button on hover for files with history.

**Files**: `src/hooks/usePerFileHistory.ts` (new), `src/components/ai-builder/FileTabBar.tsx` (undo button)

---

## 3. Build Error Quick-Fix Suggestions ✅

**Status**: `ConsolePanel` now renders quick-fix chips in the Problems tab when `buildErrors` are present. Uses `generateErrorSuggestions()` from `parseViteErrors.ts` to classify missing imports, modules, type mismatches, and syntax errors.

**Files**: `src/components/ai-builder/ConsolePanel.tsx` (quick-fix chip rendering)

---

## 4. Live Collaboration Awareness ✅

**Status**: `CollaborativePresence.tsx` already integrates with Supabase Realtime Presence, broadcasting user presence with active file indicators and rendering avatars with editing status.

---

## 5. Dependency Auto-Install from Import ✅

**Status**: Implemented via `useAutoDepInstall.ts`. Scans files for bare imports not in the CDN package registry and surfaces missing dependency suggestions.

**Files**: `src/hooks/useAutoDepInstall.ts` (new)

---

## 6. Chat Message Search and Filter ✅

**Status**: Already implemented in `BuilderChatPanel`. Search icon appears when >3 messages exist, with keyword filtering, result count, and message content matching.

---

## Priority

| Step | Impact | Effort | Status |
|------|--------|--------|--------|
| 1 — Image attachment in chat | High (vision) | Low | ✅ |
| 3 — Build error quick-fixes | High (debugging) | Medium | ✅ |
| 5 — Auto dep install | Medium (DX) | Low | ✅ |
| 2 — Per-file undo | Medium (safety) | Low | ✅ |
| 6 — Chat message search | Medium (navigation) | Low | ✅ |
| 4 — Live collaboration | Low (multiplayer) | Medium | ✅ |
