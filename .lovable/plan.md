

# Phase 24-40: Ultimate Lovable Parity -- The Complete Feature Matrix

Phases 1-23 established core builder functionality. These 17 remaining phases close every observable gap between your builder and Lovable's production IDE, organized from highest-impact to polish-tier.

---

## Tier 1: Core Builder Gaps (Phases 24-28)

### Phase 24: NPM Package Support in Preview

**Gap**: Lovable supports `npm install` and resolves real npm packages in generated code. Your builder only supports CDN script tags and a limited `PackageManager` UI -- generated React code that `import`s from `lucide-react`, `recharts`, `date-fns`, etc. fails silently in preview.

**Changes**:
1. Add an **ESM CDN resolver** to the React compiler that maps bare module specifiers (e.g., `import { Button } from 'lucide-react'`) to `https://esm.sh/lucide-react` at compile time.
2. Maintain a **package registry** of commonly used packages with known-working ESM CDN URLs (esm.sh, skypack, unpkg).
3. Update `useReactCompiler.ts` to inject an import map `<script type="importmap">` into the preview HTML, mapping installed packages to their CDN equivalents.
4. Update `PackageManager.tsx` to auto-detect packages used in code but not yet registered, and show "Install" prompts.
5. Update the system prompt to tell the AI which packages are available and to use import statements normally.

### Phase 25: Multi-File React Router Support

**Gap**: Lovable generates multi-page React apps with react-router-dom that work in preview. Your builder's React compiler only supports basic component imports -- there is no router, no `<BrowserRouter>`, and no page-based navigation in the preview.

**Changes**:
1. Add `react-router-dom` to the ESM CDN import map from Phase 24.
2. Update the React compiler to detect `react-router-dom` usage and wrap the app in `<BrowserRouter>` with `<MemoryRouter>` for iframe compatibility.
3. Add a **route-aware preview** that intercepts navigation within the iframe and updates the URL bar in `BuilderPreviewPanel`.
4. Update the system prompt to instruct the AI to scaffold React Router apps with proper `<Routes>`, `<Route>`, and `<Link>` when multi-page is needed.

### Phase 26: Streaming Code Display (Lovable-Style Typing Effect)

**Gap**: Lovable shows code being written in real-time with a file-by-file typing animation in the code editor. Your builder streams the AI response text but only updates the preview after the full response completes.

**Changes**:
1. Implement **progressive file extraction** in `useStreamingPreview` -- as the streamed response crosses `===FILE:` boundaries, extract and apply completed files immediately.
2. Add a **live file tab indicator** -- show which file is currently being generated with a pulsing dot in the `FileTabBar`.
3. Auto-switch the code editor to show the file currently being streamed, with a cursor animation at the insertion point.
4. Update the preview to incrementally recompile after each file completes (not just at end of stream).

### Phase 27: Supabase Types Auto-Generation in Preview

**Gap**: Lovable auto-generates TypeScript types from the connected database schema and makes them available for type-safe queries. Your builder has `ai-builder-schema` for introspection but the generated `types.ts` isn't integrated into the React compiler's module resolution.

**Changes**:
1. After any migration is applied, auto-invoke `ai-builder-schema` to fetch the latest schema and regenerate a `types.ts` file.
2. Inject the generated `types.ts` into the project's virtual file system so the React compiler can resolve `import type { Todo } from './types'`.
3. Include the types in the AI context so generated code references correct column names and types.
4. Show a "Types updated" toast when schema changes are detected.

### Phase 28: GitHub Integration (Push/Pull/Sync)

**Gap**: Lovable has native GitHub integration -- users connect their repo, and every AI change is committed. Your builder has `GithubSyncButton` and `GithubPushButton` components but they appear to be stub UIs without real sync logic.

**Changes**:
1. Complete the `github-push` and `github-pull` edge functions to handle actual Git operations via the GitHub API (create/update files, create commits, pull file trees).
2. Implement `useGithubSync` hook with: connect repo (OAuth or PAT), push changes (create commit with changed files), pull latest (fetch file tree and merge), conflict detection.
3. Add a "Connected to GitHub" indicator in the header with last sync time.
4. Auto-push on publish (optional setting).

---

## Tier 2: Intelligence & UX (Phases 29-33)

### Phase 29: Inline AI Chat in Code Editor (Cmd+I)

**Gap**: Lovable allows selecting code in the editor, pressing Cmd+I, and getting an inline AI suggestion that can be accepted or rejected. Your builder has `AICodeIntelligence` but it only provides hover suggestions, not inline editing.

**Changes**:
1. Add a `Cmd+I` / `Ctrl+I` keybinding to the Monaco editor that opens an inline prompt popover at the cursor position.
2. The popover accepts a natural language instruction ("refactor this function", "add error handling", "convert to TypeScript").
3. Send the selected code + instruction to the AI, receive a diff, and show it as an inline ghost-text suggestion (green for additions, red for deletions).
4. Accept (Tab) applies the change, Reject (Escape) dismisses.

### Phase 30: AI-Powered Error Auto-Fix Loop

**Gap**: Lovable's "Try to fix" button automatically sends error context back to the AI and applies the fix -- users never need to copy error messages. Your builder has `useAutoErrorRecovery` and error capture, but the auto-fix loop is not fully automated end-to-end.

**Changes**:
1. Wire the "Try to fix" button in `ErrorConsole` to automatically: (a) capture the error + stack trace + relevant source file, (b) send it to the AI with a structured fix prompt, (c) apply the returned patch, (d) re-render the preview.
2. Implement a **fix attempt counter** with exponential backoff (max 3 auto-fixes before asking the user to intervene).
3. Add a "Fix History" panel showing what was tried and what worked.
4. The fix prompt should include the error, the source file content, and the last 2 user messages for context.

### Phase 31: Image Upload & Drag-to-Canvas

**Gap**: Lovable lets users drag images directly into the chat or onto the preview canvas, and the AI incorporates them into the generated UI. Your builder has `ChatFileUpload` for chat attachments but no drag-to-preview or image-to-code pipeline.

**Changes**:
1. Add a **drop zone overlay** on the preview panel that accepts image drops. Dropped images are uploaded to the project's asset store.
2. When an image is dropped onto a specific element in the preview (while Visual Edit is active), replace that element's background or `<img>` src with the uploaded image.
3. For chat-attached images, send them as vision blocks to the AI so it can reference them in generated code (already partially working via data URLs).
4. Add an "Assets" tab in the file tree showing all uploaded images with copy-path buttons.

### Phase 32: Responsive Preview Simulator

**Gap**: Lovable has a polished device simulator with pixel-accurate frames (iPhone, iPad, MacBook). Your builder has `ResponsivePreviewBar` with viewport modes but no device frames or rotation.

**Changes**:
1. Add device frame overlays (iPhone 15, iPad Pro, MacBook) as SVG/CSS masks around the iframe when a device preset is selected.
2. Add rotation toggle (portrait/landscape) for mobile and tablet presets.
3. Add a "Responsive audit" indicator that flags layout issues at each breakpoint.
4. Show the current viewport dimensions as a badge.

### Phase 33: Keyboard Shortcuts Parity

**Gap**: Lovable has extensive keyboard shortcuts for navigation, file switching, and actions. Your builder has a `KeyboardShortcutsPanel` and some shortcuts via the command palette, but many common shortcuts are missing.

**Changes**:
1. Implement: `Cmd+S` (save/snapshot), `Cmd+Z/Shift+Cmd+Z` (undo/redo via version timeline), `Cmd+P` (quick file open), `Cmd+Shift+F` (global search), `Cmd+B` (toggle sidebar), `Cmd+J` (toggle console), `Cmd+Enter` (send message), `Cmd+.` (toggle preview).
2. Show a floating shortcut hint when the user hovers over buttons that have shortcuts.
3. Make all shortcuts discoverable via the `?` shortcut (opens shortcuts panel).

---

## Tier 3: Data & Backend (Phases 34-36)

### Phase 34: Database Seed Data Generator

**Gap**: Lovable can generate realistic seed data for new tables so the preview shows populated UIs instead of empty states. Your builder creates tables but leaves them empty.

**Changes**:
1. After a migration creates a new table, offer a "Generate sample data" button on the migration card.
2. Use the AI to generate 5-10 realistic rows based on the table schema (column names, types, constraints).
3. Insert the data via the connected Supabase client.
4. Auto-refresh the preview so data-driven UIs render immediately.

### Phase 35: SQL Query Runner in Chat

**Gap**: Lovable allows running SQL queries directly in the chat with results displayed inline. Your builder has `DatabaseExplorer` as a separate panel but no inline SQL execution in the conversation.

**Changes**:
1. Detect SQL blocks in the AI's response (```sql ... ```) and add a "Run Query" button below them.
2. Execute queries via the connected Supabase client (using `supabase.rpc` or the management API for DDL).
3. Display results as an inline data table within the chat message.
4. For SELECT queries, show row count and allow CSV export.

### Phase 36: Scheduled Functions (Cron Jobs)

**Gap**: Lovable supports `pg_cron` for scheduled tasks. Your builder can generate edge functions but has no cron scheduling UI.

**Changes**:
1. Add a `===CRON:===` delimiter format for the AI to specify cron schedules alongside edge functions.
2. Create a "Schedules" section in the edge function management UI showing active cron jobs.
3. Generate the `pg_cron` SQL via migration blocks: `SELECT cron.schedule('job-name', '0 * * * *', $$ SELECT ... $$);`
4. Show next run time and execution history.

---

## Tier 4: Collaboration & Social (Phases 37-38)

### Phase 37: Project Templates Gallery

**Gap**: Lovable has a curated template gallery (SaaS starter, blog, landing page, dashboard) that users can fork. Your builder has `StarterTemplatePicker` and `TemplateLibrary` but the template selection is limited and not community-driven.

**Changes**:
1. Expand `AppStarterTemplates.ts` with 15+ production-quality templates covering: SaaS dashboard, blog/CMS, e-commerce storefront, portfolio, admin panel, social app, recipe app, project management, chat app, landing page, documentation site, booking system, fitness tracker, finance dashboard, AI chatbot.
2. Each template includes a preview screenshot thumbnail, a description, and a tag list (React, Vanilla, Supabase, Stripe).
3. Add a "Community Templates" section backed by a database table where users can publish their projects as templates.
4. Add "Use Template" buttons that pre-populate the file system and conversation context.

### Phase 38: Real-Time Multiplayer Editing

**Gap**: Lovable supports multiple users editing the same project simultaneously with presence indicators. Your builder has `useCollaborationEngine` with presence tracking and OT conflict resolution, but it needs to be wired to the actual editing flow.

**Changes**:
1. Wire `useCollaborationEngine` into `AIAppBuilderWorkspace` so changes from other collaborators are applied in real-time via Supabase Realtime channels.
2. Show live cursor positions in the code editor (colored by user).
3. Show "User X is editing file Y" indicators in the file tree.
4. Implement conflict resolution: if two users change the same file, show a merge dialog.

---

## Tier 5: Polish & Production (Phases 39-40)

### Phase 39: Preview Performance Monitoring

**Gap**: Lovable shows Lighthouse-style performance scores for generated apps. Your builder has `useLighthouseAudit` and `useWebVitals` hooks but they are not surfaced prominently.

**Changes**:
1. Add a "Performance" tab in the preview DevTools panel showing: page load time, bundle size, DOM node count, memory usage, and Core Web Vitals (LCP, CLS, INP).
2. After each build, auto-run a lightweight audit and show a score badge (green/yellow/red) in the preview header.
3. When the score is poor, auto-suggest optimizations to the AI ("lazy load images", "reduce bundle size", "minimize re-renders").

### Phase 40: Accessibility Audit & Auto-Fix

**Gap**: Lovable flags accessibility issues and can auto-fix them. Your builder generates accessible code by default (via system prompt) but has no runtime audit.

**Changes**:
1. Inject an axe-core audit script into the preview iframe that runs after each render.
2. Surface violations in a dedicated "Accessibility" tab in the DevTools panel.
3. Each violation shows: element, rule, impact level, and a "Fix with AI" button.
4. The "Fix with AI" button sends the violation context to the AI and applies the returned patch (e.g., adding ARIA labels, fixing contrast, adding alt text).

---

## Implementation Priority

```text
HIGH IMPACT (do first):
Phase 24 (NPM Packages)      -- Unblocks real React apps in preview
Phase 26 (Streaming Code)     -- Core UX differentiator
Phase 25 (React Router)       -- Multi-page apps broken without it
Phase 30 (Auto-Fix Loop)      -- Reduces user friction dramatically

MEDIUM IMPACT:
Phase 27 (Types Auto-Gen)     -- Type safety for Supabase queries
Phase 28 (GitHub Integration) -- Essential for production users
Phase 29 (Inline AI Edit)     -- Power user feature
Phase 34 (Seed Data)          -- Better first-run experience
Phase 31 (Image Drag-Drop)    -- Creative workflow enhancement

POLISH:
Phase 32 (Device Simulator)   -- Visual polish
Phase 33 (Keyboard Shortcuts) -- Power user QoL
Phase 35 (SQL in Chat)        -- Convenience
Phase 36 (Cron Jobs)          -- Backend completeness
Phase 37 (Templates Gallery)  -- Growth/onboarding
Phase 38 (Multiplayer)        -- Team feature
Phase 39 (Performance)        -- Production readiness
Phase 40 (Accessibility)      -- Compliance & quality
```

---

## Technical Details

### Phase 24 -- Import Map Injection

The React compiler will inject this into the preview HTML head:

```html
<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@18.3.1",
    "react-dom": "https://esm.sh/react-dom@18.3.1",
    "lucide-react": "https://esm.sh/lucide-react@0.462.0",
    "date-fns": "https://esm.sh/date-fns@3.6.0",
    "recharts": "https://esm.sh/recharts@3.1.0",
    "framer-motion": "https://esm.sh/framer-motion@12.23.0",
    "react-router-dom": "https://esm.sh/react-router-dom@6.26.2"
  }
}
</script>
```

### Phase 26 -- Progressive File Extraction

```typescript
// During streaming, extract completed files incrementally
const FILE_BOUNDARY = /===FILE:\s*(.+?)===/g;
let lastExtractedIndex = 0;

function extractCompletedFiles(streamSoFar: string): ProjectFile[] {
  const boundaries = [...streamSoFar.matchAll(FILE_BOUNDARY)];
  const completed: ProjectFile[] = [];
  for (let i = 0; i < boundaries.length - 1; i++) {
    const path = boundaries[i][1].trim();
    const start = boundaries[i].index! + boundaries[i][0].length;
    const end = boundaries[i + 1].index!;
    if (start > lastExtractedIndex) {
      completed.push({ path, content: streamSoFar.slice(start, end).trim() });
      lastExtractedIndex = end;
    }
  }
  return completed;
}
```

### Phase 29 -- Inline AI Edit Flow

```text
User selects code --> Cmd+I --> Inline popover appears
  |
  User types: "add error handling"
  |
  Selected code + instruction --> AI endpoint
  |
  AI returns diff --> Show as ghost text (green/red)
  |
  Tab = Accept (apply changes)
  Escape = Reject (dismiss)
```

### Phase 30 -- Auto-Fix Loop

```typescript
async function autoFixError(error: PreviewError, attempt: number) {
  if (attempt > 3) { showManualFixUI(); return; }
  
  const sourceFile = files.find(f => f.path === error.source);
  const fixPrompt = `[AUTO-FIX ATTEMPT ${attempt}]
Error: ${error.message}
File: ${error.source}:${error.line}
Source: ${sourceFile?.content?.slice(0, 2000)}
Fix this error. Output only the corrected ===FILE: block.`;
  
  const response = await sendToAI(fixPrompt);
  applyPatch(response);
  // Preview re-renders, if error persists, loop increments attempt
}
```

### Phase 34 -- Seed Data Generation

```typescript
// After migration applied, AI generates realistic data
const seedPrompt = `Generate 8 realistic rows for this table:
${migrationSQL}
Output as a JSON array. Use realistic names, emails, dates.
Follow NOT NULL constraints and foreign key relationships.`;

const rows = await sendToAI(seedPrompt);
await supabase.from(tableName).insert(JSON.parse(rows));
```

### Phase 37 -- Template Schema

```typescript
interface AppTemplate {
  id: string;
  name: string;
  description: string;
  category: 'saas' | 'landing' | 'dashboard' | 'ecommerce' | 'social' | 'productivity' | 'ai';
  tags: string[];
  thumbnail: string;
  files: ProjectFile[];
  mode: 'vanilla' | 'react';
  requiresSupabase: boolean;
  requiresStripe: boolean;
  author?: { name: string; avatar: string };
  forkCount: number;
}
```

