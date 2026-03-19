

# Lovable Parity — Wave 8

Six improvements targeting the final remaining gaps between the builder and Lovable's production UX.

---

## 1. AI-Generated Commit Messages on Save

**Gap**: When saving or publishing, there's no auto-generated description of what changed. Lovable generates meaningful commit messages summarizing the changes made in each generation.

**Fix**: After each AI generation, auto-generate a one-line commit message from the diff summary (files added/modified/deleted + key patterns detected). Display it in the version history timeline and deployment history. Allow user editing before save.

**Files**: `AIAppBuilderWorkspace.tsx` (auto-generate on generation complete), `VersionHistoryPanel.tsx` (display commit messages)

---

## 2. Guided Onboarding Tour for New Projects

**Gap**: New users land in the workspace with no guidance beyond quick-action chips. Lovable walks first-time users through the key UI areas (chat, preview, code editor, file tree) with a step-by-step tooltip tour.

**Fix**: Create a lightweight onboarding tour that highlights 5-6 key areas on first project creation. Use a `hasSeenTour` localStorage flag. Each step positions a tooltip near the relevant UI element with a brief explanation and Next/Skip buttons.

**Files**: New `OnboardingTour.tsx`, `AIAppBuilderWorkspace.tsx` (mount on first visit)

---

## 3. Smart File Creation from Chat

**Gap**: Users must manually create files or rely on the AI to generate them. Lovable supports "create a new component called X" as a chat command that scaffolds the file instantly without a full generation cycle.

**Fix**: Detect file-creation intent in chat messages (e.g., "create a component called UserCard", "add a hook for authentication"). For simple scaffolding requests, instantly create the file from templates (reusing `useSmartScaffolding`) without invoking the AI model, saving tokens and time.

**Files**: `AIAppBuilderWorkspace.tsx` (intent detection in handleSend), `useSmartScaffolding.ts` (expose quick-create)

---

## 4. Inline Error Annotations in Code Editor

**Gap**: Build errors show in the console and auto-heal triggers, but the code editor doesn't highlight the exact error lines with inline annotations. Lovable shows red squiggly underlines and hover tooltips on error lines.

**Fix**: After a failed build, parse error locations from `ParsedViteError` (file + line) and set Monaco editor markers (red underline + hover message) on the affected lines. Clear markers on next successful build. This complements the existing `preCompileValidate` lint markers.

**Files**: `CodeEditor.tsx` (add build error markers), `CompilationBridge.tsx` (expose parsed errors to editor)

---

## 5. Quick Settings Toggle Bar

**Gap**: Common settings (auto-save, auto-compile, sound effects, AI model) require navigating to the settings panel. Lovable surfaces frequently-toggled options in a compact bar.

**Fix**: Add a slim collapsible settings strip below the top bar or in the status area with toggles for: auto-compile on/off, sound effects, auto-heal on/off, and the current AI model badge. Each toggle updates the corresponding state immediately.

**Files**: New `QuickSettingsBar.tsx`, `AIAppBuilderWorkspace.tsx` (wire toggles)

---

## 6. Export as Standalone ZIP with README

**Gap**: Export exists but doesn't include setup instructions. Lovable generates a README.md with install/run instructions, tech stack summary, and environment variable documentation alongside the exported files.

**Fix**: When exporting, auto-generate a `README.md` that lists: project name, tech stack (React + Vite + Tailwind), install commands (`npm install && npm run dev`), environment variables needed, and Supabase setup instructions if connected. Bundle into the ZIP.

**Files**: `ExportButton.tsx` (add README generation to ZIP export)

---

## Priority

| Step | Impact | Effort |
|------|--------|--------|
| 4 — Inline error annotations | High (debugging) | Low |
| 1 — Auto commit messages | High (version clarity) | Low |
| 6 — Export with README | Medium (onboarding) | Low |
| 3 — Smart file creation | Medium (speed) | Low |
| 2 — Onboarding tour | Medium (new users) | Medium |
| 5 — Quick settings bar | Low (convenience) | Low |

