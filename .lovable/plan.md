

# Lovable Parity — Wave 4

Six improvements targeting remaining experience gaps around collaboration, navigation, and generation quality.

---

## 1. Chat Image Attachment with AI Vision Context

**Current state**: Image paste/upload exists in `BuilderChatPanel.tsx` but images are stored as previews only — they aren't sent as context to the AI model for vision-based understanding.

**Fix**: When images are attached, include them as base64 data URLs in the AI prompt payload (within the user message content array). This enables "build this from my screenshot" and "match this design" workflows that Lovable supports.

**Files**: `BuilderChatPanel.tsx` (pass image data in message), `useAIAppBuilder.ts` (include images in API payload)

---

## 2. Go-to-Definition and Symbol Navigation

**Gap**: Monaco editor has minimap and basic IntelliSense but no cross-file go-to-definition. Lovable supports clicking on imports/components to jump to their definition.

**Fix**: Register a Monaco `DefinitionProvider` in `CodeEditor.tsx` that resolves import paths against the project's file list. Clicking an import (Cmd+Click) or pressing F12 opens the target file via `setActiveFile`. Also register a `DocumentSymbolProvider` for outline/breadcrumb support.

**Files**: `CodeEditor.tsx` (register providers on mount)

---

## 3. Smarter Package Management via AI Prompt

**Gap**: `NPMPackageManagerPanel` tracks packages in local state but the AI doesn't know what's installed. When it generates code using a library, it may fail because the dependency wasn't declared.

**Fix**: Inject the list of `installedPackages` into the system prompt context so the AI knows available dependencies. When the AI references a new package in generated code, auto-detect it from import statements and add it to `installedPackages` + `package.json`.

**Files**: `AIAppBuilderWorkspace.tsx` (inject packages into context), `useAIAppBuilder.ts` (auto-detect new imports)

---

## 4. Conversation Search and Pin

**Gap**: Long chat histories become hard to navigate. Lovable lets users search through messages and pin important ones for quick reference.

**Fix**: Add a search input above the message list in `BuilderChatPanel.tsx` that filters messages by content. Add a pin toggle on each message that keeps pinned messages in a collapsible section at the top. Persist pins in the message object.

**Files**: `BuilderChatPanel.tsx` (search filter + pin UI)

---

## 5. Responsive Preview Sync with Chat

**Gap**: The responsive preview bar exists but switching device modes doesn't inform the AI. When users ask "make this work on mobile", the AI doesn't know what viewport they're looking at.

**Fix**: Include the current viewport mode (e.g., "iPhone 16 Pro — 393×852") in the AI prompt context when the user sends a message. This gives the AI precise knowledge of what the user is testing against.

**Files**: `AIAppBuilderWorkspace.tsx` (pass viewport to sendMessage context)

---

## 6. Quick Actions from Empty State

**Gap**: When a new project starts, the empty chat shows starter templates but no quick-action prompts. Lovable shows contextual suggestions like "Add a landing page", "Set up authentication", "Connect a database".

**Fix**: Enhance `WelcomeOverlay.tsx` with 6-8 quick-action chips that pre-fill the chat input with common first prompts. Show these below the template picker. Chips should be contextual — if Supabase is connected, show DB-related actions.

**Files**: `WelcomeOverlay.tsx` (quick action chips), `BuilderChatPanel.tsx` (accept pre-fill from welcome)

---

## Priority

| Step | Impact | Effort |
|------|--------|--------|
| 1 — Image vision context | High (unlock design-to-code) | Low |
| 2 — Go-to-definition | High (daily DX) | Medium |
| 3 — Package auto-detection | High (fewer build errors) | Medium |
| 5 — Viewport in AI context | Medium (accuracy) | Low |
| 6 — Quick actions empty state | Medium (onboarding) | Low |
| 4 — Chat search & pin | Medium (long sessions) | Low |

