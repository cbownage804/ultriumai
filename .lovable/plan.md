

# AI Studio App Builder -- Lovable Parity Phase 5: Authentication, Database UI, and Platform Shell

## Overview

The builder now has a mature IDE experience: streaming preview, split view, multi-tab console, chat persistence, error recovery loops, visual edits, collaborative presence, model selector, forking, conflict resolution, and deployment. What's still missing are the **platform-level features** that make Lovable a complete product -- not just a code generator, but a full development platform. This phase addresses the biggest remaining gaps.

---

## Gap Analysis: What Lovable Has That We Don't

| Lovable Feature | Current Status |
|---|---|
| Supabase Cloud (auto-provision DB) | We inject SDK manually -- no DB UI |
| Database table viewer/editor | Missing entirely |
| Auth UI (sign up, login, OAuth) | Missing -- users must code it |
| Edge function editor/deployment | Missing -- only the AI builder's own edge fn exists |
| Storage bucket browser | Missing |
| Real-time log viewer (backend) | Missing |
| GitHub sync (bi-directional) | One-way push only |
| Custom domain management | Missing |
| Project-level access control | Missing |
| Billing/credits integration | Missing from builder context |
| Knowledge/memory management | Missing |
| Undo/redo per-message (revert to any message) | We have undo/redo but not message-level rollback |

---

## Phase 5 Scope (Highest Impact)

### 1. Database Table Viewer and Editor

Lovable's "Cloud > Database" lets users view tables, add rows, edit data, and export -- all without SQL. This is a massive differentiator.

**Changes:**
- Create `DatabasePanel.tsx`: A slide-out panel (like VersionHistory) with a table list sidebar and a data grid. Connects via the injected Supabase client. Supports viewing rows, adding/editing/deleting rows inline, and basic column type display.
- `AIAppBuilderWorkspace.tsx`: Add a Database icon to the toolbar that opens the panel. Only enabled when `supabaseConfig` is set.

### 2. Auth Configuration Panel

Lovable auto-generates auth pages and lets users configure providers. Add an auth setup wizard that generates login/signup HTML.

**Changes:**
- Create `AuthConfigPanel.tsx`: A panel showing available auth methods (Email/Password, Google, GitHub). When a provider is toggled on, auto-generate the corresponding HTML forms and inject them into the project via a "Generate Auth Pages" button that sends a structured prompt to the AI.
- `AIAppBuilderWorkspace.tsx`: Add Auth icon to toolbar, gate behind `supabaseConfig`.

### 3. Message-Level Rollback (Revert to Any Message)

Lovable lets users click any previous message and "revert to this point," restoring the project to the state it was in after that message. We have undo/redo but it's a flat stack, not message-anchored.

**Changes:**
- `useAIAppBuilder.ts`: Attach a `filesSnapshot` to each assistant message after generation completes -- a copy of the project files at that point.
- `BuilderChatPanel.tsx`: Add a "Revert to here" action on assistant messages (alongside existing Fork). Clicking it restores the files from that message's snapshot.
- `AIAppBuilderWorkspace.tsx`: Wire `handleRevertToMessage(messageId)` that looks up the snapshot and calls `setFiles`.

### 4. Knowledge/Memory Panel

Lovable lets users add custom instructions and context that persist across all prompts (project knowledge). We have nothing equivalent.

**Changes:**
- Create `KnowledgePanel.tsx`: A panel with a textarea for "Custom Instructions" (e.g., "Always use Tailwind", "The brand color is #06b6d4") and a list of "Context Files" that are always included in AI prompts.
- `useAIAppBuilder.ts`: Prepend the knowledge/instructions to the system prompt when sending messages.
- `AIAppBuilderWorkspace.tsx`: Add a Brain icon to toolbar for the knowledge panel. Persist knowledge in project settings.

### 5. Storage Bucket Browser

Lovable's Cloud includes a file storage browser. Add a simple panel for viewing and uploading files to Supabase Storage.

**Changes:**
- Create `StorageBrowser.tsx`: Lists buckets and files from the connected Supabase project. Supports upload (drag-and-drop), delete, and copy public URL. Shows file previews for images.
- `AIAppBuilderWorkspace.tsx`: Add Storage icon to toolbar, gate behind `supabaseConfig`.

### 6. Edge Function Editor

Lovable lets users create and deploy edge functions from the UI. Add a dedicated section for writing server-side Deno functions.

**Changes:**
- Create `EdgeFunctionEditor.tsx`: A panel listing edge functions with a code editor (reusing Monaco). Functions are stored as special VFS files under `functions/` prefix. Includes a "Deploy" button that simulates deployment status.
- `AIAppBuilderWorkspace.tsx`: Add a Functions icon to toolbar. Edge functions appear in the file tree under a `functions/` virtual folder.

### 7. GitHub Bi-Directional Sync

Currently we only push to GitHub. Lovable syncs both ways -- pulling changes from GitHub back into the project.

**Changes:**
- `GithubPushButton.tsx`: Rename to `GithubSyncButton.tsx`. Add a "Pull from GitHub" action that fetches the repo contents via the GitHub API and merges them into the VFS. Show sync status (ahead/behind/synced).

### 8. Custom Domain Management

Lovable lets users connect custom domains to published projects. Add a domain configuration UI.

**Changes:**
- `DeployDialog.tsx`: Add a "Custom Domain" section in the Production tab. Users can enter a domain, see DNS configuration instructions (CNAME record), and check verification status.

---

## Technical Details

| File | Changes |
|---|---|
| `DatabasePanel.tsx` | New -- table viewer/editor with inline CRUD |
| `AuthConfigPanel.tsx` | New -- auth provider configuration and page generation |
| `KnowledgePanel.tsx` | New -- custom instructions and persistent context |
| `StorageBrowser.tsx` | New -- Supabase Storage file browser |
| `EdgeFunctionEditor.tsx` | New -- server-side function editor |
| `GithubSyncButton.tsx` | Renamed from GithubPushButton -- add pull/sync |
| `DeployDialog.tsx` | Add custom domain configuration section |
| `AIAppBuilderWorkspace.tsx` | Wire all new panels to toolbar, add revert handler |
| `useAIAppBuilder.ts` | Attach file snapshots to messages, prepend knowledge to prompts |
| `BuilderChatPanel.tsx` | Add "Revert to here" action on assistant messages |

### Estimated scope
- 5 new files created, 5 files modified
- Focuses on platform-level features that transform the builder from a code generator into a full development platform

