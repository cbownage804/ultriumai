

# AI Studio App Builder -- Lovable Parity Phase 7: Billing, Access Control, and User Experience

## Overview

The builder now has a complete platform shell with IDE intelligence, database/auth/storage panels, edge functions, knowledge management, deployment, and GitHub sync. This phase targets the **commercial and user experience layer** -- the features that make the platform viable as a product: billing integration, project-level access control, a polished onboarding experience, and several UX refinements that Lovable ships by default.

---

## Remaining Gap Analysis

| Lovable Feature | Current Status |
|---|---|
| Credit/billing system in builder | Missing -- no usage tracking or plan gating |
| Project-level access control (share with roles) | Missing -- no per-project permissions |
| Real-time preview URL (actually functional) | We show a slug URL but it's not live |
| Responsive preview with URL bar | Preview exists but no address bar simulation |
| Prompt suggestions after AI response | We generate suggestions but don't show them as clickable chips |
| Chat image attachments with analysis | Image upload exists but no visual feedback in chat |
| Loading skeleton for preview | SkeletonPreview exists but isn't wired consistently |
| Project templates gallery (curated) | TemplateLibrary exists but needs richer categories and thumbnails |
| Settings: Danger Zone | Missing delete/reset project actions |
| SEO/meta tag editor | Missing |
| Notification system for build events | Missing -- only toast notifications |

---

## Phase 7 Scope

### 1. Credits and Usage Billing Panel

Lovable shows credit usage per message and remaining credits in the builder. Add a billing awareness layer.

**Changes:**
- Create `BillingPanel.tsx`: A slide-out panel showing current plan, credits used/remaining, per-message cost history, and an upgrade CTA. Reads from the existing Vanguard subscription context.
- `AIAppBuilderWorkspace.tsx`: Add a credits indicator in the top bar (compact pill showing remaining credits). Wire to billing panel on click.
- `BuilderChatPanel.tsx`: Show credit cost badge on each sent message (e.g., "1 credit").

### 2. Project Sharing and Access Control

Lovable lets users share projects with teammates and set roles (viewer, editor, admin). Currently there's no per-project access model.

**Changes:**
- Create `ProjectShareDialog.tsx`: A dialog to invite users by email, set roles (Viewer/Editor/Admin), list current collaborators, and revoke access. Uses a new `project_collaborators` concept stored in project settings.
- `ProjectManager.tsx`: Add a "Share" button on each project card.
- `AIAppBuilderWorkspace.tsx`: Show collaborator avatars in the top bar next to the presence indicator.

### 3. Clickable Follow-Up Suggestions

Lovable shows clickable suggestion chips after each AI response. We generate suggestions in `useAIAppBuilder.ts` but they aren't rendered as interactive elements.

**Changes:**
- `BuilderChatPanel.tsx`: After each assistant message with `suggestions`, render them as styled clickable chips. Clicking a suggestion auto-sends it as the next user message.

### 4. Preview Address Bar with Navigation

Lovable's preview has a URL-like address bar showing the current page path, with back/forward navigation for multi-page apps. Our preview is a bare iframe.

**Changes:**
- `BuilderPreviewPanel.tsx`: Add a simulated browser address bar above the iframe showing the current page URL. Include back/forward/refresh buttons. Track iframe navigation via `postMessage` and update the displayed URL.

### 5. SEO and Meta Tag Editor

Lovable lets users edit page title, description, and social preview (OG tags) visually. We have no equivalent.

**Changes:**
- Create `SEOEditor.tsx`: A panel that reads the current `<title>`, `<meta>` tags from the project's HTML files and lets users edit them in a form. Changes are written back to the HTML file directly.
- `AIAppBuilderWorkspace.tsx`: Add SEO icon to toolbar.

### 6. Settings Danger Zone

The tabbed settings redesign (Phase 4) planned a Danger Zone but it wasn't implemented. Add destructive project actions.

**Changes:**
- `ProjectSettings.tsx`: Add a "Danger Zone" tab with: Delete Project (with confirmation), Reset to Blank (clears all files), and Export & Delete. Each action requires typing the project name to confirm.

### 7. Enhanced Template Gallery

The current `TemplateLibrary` is functional but basic. Lovable has rich categorized templates with preview thumbnails.

**Changes:**
- `TemplateLibrary.tsx`: Add category tabs (Landing Pages, Dashboards, E-Commerce, SaaS, Portfolio, Mobile), preview thumbnail cards with hover animation, and a "Use Template" flow that populates the project with template files.

### 8. Build Notification Center

Lovable shows persistent notifications for build completions, errors, and deployment status. We only use ephemeral toasts.

**Changes:**
- Create `BuildNotificationCenter.tsx`: A dropdown in the top bar that accumulates build events (generation complete, deploy success, error detected) with timestamps. Badge shows unread count. Clicking a notification navigates to the relevant context (e.g., opens the file with the error).
- `AIAppBuilderWorkspace.tsx`: Wire build events to the notification center.

---

## Technical Details

| File | Changes |
|---|---|
| `BillingPanel.tsx` | New -- credits/usage display with plan info |
| `ProjectShareDialog.tsx` | New -- invite collaborators with role management |
| `SEOEditor.tsx` | New -- meta tag and OG tag visual editor |
| `BuildNotificationCenter.tsx` | New -- persistent build event notifications |
| `BuilderChatPanel.tsx` | Render suggestion chips, show credit cost per message |
| `BuilderPreviewPanel.tsx` | Add browser-like address bar with navigation |
| `ProjectSettings.tsx` | Add Danger Zone tab with delete/reset actions |
| `TemplateLibrary.tsx` | Enhanced categories, thumbnails, hover previews |
| `AIAppBuilderWorkspace.tsx` | Wire billing panel, notification center, SEO editor, share dialog |
| `ProjectManager.tsx` | Add share button per project |

### Estimated scope
- 4 new files created, 6 files modified
- Focuses on commercial viability and user experience polish

