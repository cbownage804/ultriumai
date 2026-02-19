

# Phase 91–97: Game-Changing Features Sprint

With the core compiler, context engine, and UX polish complete (Phases 71–90), the App Builder is now a solid code generation tool. These next phases add **differentiation-level features** that transform it from "good AI builder" into a category-defining product.

---

## Phase 91: Screenshot-to-Code (Vision-Powered Cloning)

**What it does**: Users drag-and-drop a screenshot (or paste from clipboard) and the AI generates a pixel-accurate React + Tailwind implementation. This is the single most requested feature in AI builder tools.

**How it works**:
- Add a drop zone to the chat panel that accepts images (PNG, JPG, WebP)
- Convert the image to a base64 data URL and send it to the edge function alongside a specialized vision system prompt
- The edge function forwards the image to a vision-capable model (Gemini Flash supports multimodal) as an image content part
- The AI returns `===FILE:` blocks as usual, but guided by the visual reference
- Works with the existing compiler pipeline -- no changes needed downstream

**Technical scope**:
- New `ScreenshotDropZone` component in the chat panel
- Update `ai-app-builder` edge function to accept `imageData` in the request body and format it as a multimodal message
- Add a vision-specific system prompt addon: "Recreate this UI exactly using React and Tailwind CSS..."
- Clipboard paste support via `onPaste` event handler

---

## Phase 92: Real-Time Collaboration (Multiplayer Editing)

**What it does**: Multiple users can edit the same project simultaneously with live cursors, presence indicators, and conflict-free merging -- like Google Docs for code.

**How it works**:
- Use Supabase Realtime's Presence and Broadcast channels
- Each user joins a channel keyed by `project_id`
- Cursor positions, file selections, and edits are broadcast in real-time
- The existing `CollaborativePresence` and `LiveCursors` components are already scaffolded but not connected to a real backend
- `ConflictResolver` (three-way merge) already exists for handling simultaneous edits

**Technical scope**:
- Wire `CollaborativePresence.tsx` to Supabase Realtime Presence (track user, cursor position, active file)
- Wire `LiveCursors.tsx` to render remote cursors from presence state
- Add Broadcast channel for file edit operations (operational transform or last-write-wins with conflict dialog)
- Add a `ProjectShareDialog` integration that generates invite links with access levels
- New database table: `project_collaborators` (project_id, user_id, role, invited_at)

---

## Phase 93: AI Design System Generator

**What it does**: Users describe their brand (or paste a URL) and the AI generates a complete, consistent design system -- color palette, typography scale, spacing tokens, component variants -- that all subsequent generations follow.

**How it works**:
- New `DesignSystemWizard` component: asks for brand colors, font preferences, style direction (corporate, playful, minimal, etc.)
- Optionally scrape a URL (using the existing `firecrawl-scrape` edge function) to extract brand colors and fonts
- Generate a `design-tokens.ts` file with CSS variables and Tailwind theme extensions
- Inject the design system into the AI's system prompt so all generated components automatically use the correct tokens
- The existing `DesignSystemPanel.tsx` is scaffolded but lacks the generation logic

**Technical scope**:
- Enhance `DesignSystemPanel.tsx` with a wizard flow (brand input, preview, apply)
- Generate `tailwind.config.ts` overrides and a `design-tokens.css` file
- Add design system context to the consolidated system prompt (Phase 76 infrastructure)
- Color contrast validation (WCAG AA/AAA) built into the palette generator

---

## Phase 94: One-Click Backend Generation (Full-Stack from Prompt)

**What it does**: When the user describes an app that needs a backend (e.g., "build a todo app with user accounts"), the builder automatically generates Supabase migrations, RLS policies, edge functions, AND the frontend -- all in one shot.

**How it works**:
- The existing `detectSupabaseIntents` already identifies backend needs (auth, database, storage)
- Currently, migrations and edge functions appear as approval cards, but the user must manually connect Supabase first
- This phase adds an **auto-provisioning flow**: if no Supabase config exists, prompt the user to connect, then auto-generate the full stack
- The `SchemaDesigner`, `MigrationApprovalCard`, and `EdgeFunctionCard` components already exist

**Technical scope**:
- Add a `BackendAutoDetector` that analyzes the user's prompt and generates a migration plan before code generation starts
- Chain the workflow: (1) generate schema, (2) auto-apply migrations, (3) generate frontend with correct table references
- Use the Phase 86 schema injection so the frontend code references real tables
- Add a "Full-Stack Mode" toggle that enables this behavior

---

## Phase 95: Component Marketplace (Share and Reuse)

**What it does**: Users can save components they've built, share them publicly, and browse/install components from other users. Think npm, but for AI-generated React components.

**How it works**:
- The existing `ComponentLibrary.tsx` and `PluginMarketplace.tsx` are scaffolded with UI but no persistence
- Add a `shared_components` table in Supabase (user_id, name, description, code, tags, downloads, rating)
- Users click "Publish" on any component to share it
- The marketplace shows trending, popular, and category-filtered components
- "Install" copies the component files into the user's project

**Technical scope**:
- New database table: `shared_components` with RLS policies
- Enhance `ComponentLibrary.tsx` with publish/browse/install flows
- Add component preview rendering (compile and render in an iframe)
- Search and filtering by tags, category, and popularity
- Version tracking for published components

---

## Phase 96: AI-Powered Debugging Assistant

**What it does**: When the preview crashes, instead of just showing the error, the AI analyzes the error, the relevant code, the recent changes, and provides a detailed root cause analysis with a one-click fix.

**How it works**:
- The existing auto-fix loop (Phase 88) retries blindly up to 3 times
- This phase adds **intelligent diagnosis**: send the error, the stack trace, the failing file, and the last 3 edits to the AI with a specialized debugging prompt
- Show a "Debug Report" card in the chat with: root cause, affected files, suggested fix, and confidence level
- The user can approve the fix or request an alternative approach

**Technical scope**:
- New `DebugReportCard` component showing structured diagnosis
- Enhance `buildEnhancedErrorContext` (already exists in SupabaseConversational) with edit history diff
- Add a debugging-specific system prompt to the edge function
- Track fix success rate to improve future suggestions

---

## Phase 97: Progressive Web App Auto-Configuration

**What it does**: One-click PWA conversion -- the builder automatically generates a service worker, web manifest, offline fallback page, and install prompt for any generated app.

**How it works**:
- The export system already supports PWA mode (`exportProject` has a `pwa` option)
- This phase brings PWA support INTO the live preview, not just export
- Auto-generate `manifest.json`, `service-worker.js`, and meta tags
- Add an install prompt component that detects `beforeinstallprompt`
- The existing `MobilePWAInstall.tsx` component is scaffolded

**Technical scope**:
- Generate PWA files as project files (not just at export time)
- Add PWA meta tags to the compiled HTML output in `useReactCompiler`
- Wire `MobilePWAInstall.tsx` to detect and trigger the install prompt
- Add offline-first caching strategy configuration

---

## Implementation Priority

```text
HIGHEST IMPACT (viral features):
Phase 91 (Screenshot-to-Code)         -- "Drop a screenshot, get an app"
Phase 93 (Design System Generator)    -- Consistent, branded outputs
Phase 94 (Full-Stack Auto-Gen)        -- One prompt = complete app

HIGH IMPACT (retention features):
Phase 96 (AI Debugging Assistant)     -- Smarter error recovery
Phase 92 (Real-Time Collaboration)    -- Multiplayer editing

MEDIUM IMPACT (ecosystem features):
Phase 95 (Component Marketplace)      -- Community and reuse
Phase 97 (PWA Auto-Config)            -- Mobile-ready outputs
```

---

## Technical Details

### Phase 91 -- Screenshot-to-Code Edge Function Update

Add multimodal support to `ai-app-builder/index.ts`:

```typescript
// In the message construction:
if (imageData) {
  userMessages.push({
    role: 'user',
    content: [
      { type: 'image_url', image_url: { url: imageData } },
      { type: 'text', text: userMessage || 'Recreate this UI exactly using React and Tailwind CSS.' },
    ],
  });
} else {
  userMessages.push({ role: 'user', content: userMessage });
}
```

### Phase 93 -- Design Token Generation

The generated `design-tokens.ts` structure:

```typescript
export const tokens = {
  colors: {
    primary: { 50: '#eff6ff', 500: '#3b82f6', 900: '#1e3a5f' },
    accent: { 500: '#8b5cf6' },
    neutral: { 100: '#f5f5f5', 900: '#171717' },
  },
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
  spacing: { xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem' },
  radii: { sm: '0.375rem', md: '0.5rem', lg: '0.75rem', full: '9999px' },
};
```

### Phase 94 -- Full-Stack Detection Flow

```text
User prompt: "Build a task manager with teams and assignments"

Step 1 - Backend Detection:
  -> Tables needed: tasks, teams, team_members, assignments
  -> Auth needed: yes (user accounts)
  -> RLS needed: yes (team-scoped access)

Step 2 - Migration Generation:
  -> CREATE TABLE tasks (...)
  -> CREATE TABLE teams (...)
  -> RLS policies auto-generated

Step 3 - Frontend Generation:
  -> Uses exact table/column names from Step 2
  -> Supabase client queries match schema
  -> Auth flow included
```

### Phase 96 -- Debug Report Structure

```typescript
interface DebugReport {
  rootCause: string;           // "TypeError: Cannot read property 'map' of undefined"
  affectedFile: string;        // "src/components/TodoList.tsx"
  affectedLine: number;        // 42
  explanation: string;         // "The `todos` state is initially null but .map() expects an array"
  suggestedFix: string;        // "Initialize state as empty array: useState<Todo[]>([])"
  confidence: 'high' | 'medium' | 'low';
  alternativeFixes: string[];  // Other approaches
}
```

