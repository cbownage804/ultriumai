

# Phase 98-103: Next-Level App Builder Enhancements

With 97 phases complete, the builder is feature-rich. This next sprint focuses on **quality-of-life improvements** and **power-user capabilities** that make the difference between a demo and a daily-driver tool.

---

## Phase 98: Prompt History and Favorites

**Problem**: Users can't revisit or reuse past prompts. Every session starts from scratch. There's no way to "star" a great prompt that produced excellent results.

**What it adds**:
- Searchable prompt history panel (persisted to IndexedDB or Supabase)
- Star/favorite prompts for quick reuse
- "Re-run this prompt" button on any history entry
- Prompt categories: UI, backend, fix, refactor
- Export/import prompt collections

**Scope**: New `PromptHistoryPanel.tsx`, updates to `BuilderChatPanel.tsx` to log prompts on send

---

## Phase 99: Live Preview Hot-Linking (Deep Link to Any Route)

**Problem**: The preview URL bar exists but there's no way to bookmark or share a specific preview route with query params. Multi-page apps require manual navigation every time the preview refreshes.

**What it adds**:
- Persist the current preview route across rebuilds (don't reset to `/` on every compile)
- Route picker dropdown showing all detected routes from React Router config
- "Open in new tab" for the current preview route
- Query param editor in the URL bar

**Scope**: Updates to `BuilderPreviewPanel.tsx` and `useReactCompiler.ts` to preserve route state across recompiles

---

## Phase 100: AI-Powered Code Refactoring Suggestions

**Problem**: The code intelligence panel exists but suggestions are static. There's no proactive refactoring advice based on actual code patterns.

**What it adds**:
- After each build, scan generated code for common anti-patterns (inline styles instead of Tailwind, repeated code blocks, missing error boundaries, missing loading states)
- Show non-intrusive "suggestion chips" in the code editor gutter
- One-click "Apply refactor" that sends a targeted prompt to the AI
- Track which suggestions were accepted vs dismissed to improve future suggestions

**Scope**: New `useCodeSmellDetector.ts` hook, updates to `AICodeIntelligence.tsx`

---

## Phase 101: Project Templates with Live Preview

**Problem**: `StarterTemplatePicker` and `AppStarterTemplates.ts` exist but templates are just file arrays -- users can't preview what they'll get before committing.

**What it adds**:
- Thumbnail previews for each starter template (pre-rendered screenshots)
- "Preview before use" -- compile and show the template in a mini iframe
- Template categories: Landing Page, Dashboard, E-commerce, Blog, SaaS, Portfolio
- "Customize before starting" -- let users pick color scheme and layout variant before template injection
- Community template submissions (links to Component Marketplace)

**Scope**: Updates to `StarterTemplatePicker.tsx` and `AppStarterTemplates.ts`, new template preview compilation logic

---

## Phase 102: Inline Documentation Generator

**Problem**: AI-generated code often lacks comments and documentation. There's no way to auto-generate JSDoc, README, or component documentation.

**What it adds**:
- "Document this file" button in the code editor toolbar
- Auto-generates JSDoc comments for all exported functions/components
- Generates a `README.md` for the project based on file structure and component tree
- Component storybook-style documentation: props table, usage examples
- API documentation for edge functions

**Scope**: New `useDocGenerator.ts` hook, toolbar button in `CodeEditor.tsx`, README generation in export flow

---

## Phase 103: Smart Undo with Diff Preview

**Problem**: Undo/redo exists but is opaque -- users don't know what will change when they click undo. There's no way to preview the diff before committing to an undo.

**What it adds**:
- Hover over the undo button to see a mini diff preview of what will change
- "Selective undo" -- undo changes to a specific file without reverting others
- Undo history panel showing timestamped entries with file-level granularity
- "Undo last AI change" shortcut that reverts only the most recent AI generation

**Scope**: Updates to `useUndoRedo.ts` to store per-file diffs, new `UndoPreviewPopover.tsx` component

---

## Implementation Priority

```text
HIGH IMPACT (daily frustrations):
Phase 98 (Prompt History)              -- "I had a great prompt yesterday..."
Phase 99 (Preview Route Persistence)   -- Stop losing route state on rebuild
Phase 103 (Smart Undo)                 -- "What did undo just do?"

MEDIUM IMPACT (power users):
Phase 100 (Refactoring Suggestions)    -- Proactive code quality
Phase 102 (Doc Generator)              -- Ship-ready documentation

NICE-TO-HAVE (polish):
Phase 101 (Template Previews)          -- Better onboarding experience
```

---

## Technical Details

### Phase 98 -- Prompt History Storage

```typescript
interface PromptHistoryEntry {
  id: string;
  prompt: string;
  timestamp: Date;
  category: 'ui' | 'backend' | 'fix' | 'refactor' | 'general';
  isFavorite: boolean;
  resultFileCount: number;
  model: string;
}
```

Persisted via the existing `useIndexedDBPersistence` hook (already wired in the workspace).

### Phase 99 -- Route Preservation

In `useReactCompiler`, detect the current MemoryRouter `initialEntries` and preserve across recompiles:

```typescript
// Extract routes from generated code
const routeRegex = /<Route\s+path=["']([^"']+)["']/g;
const detectedRoutes = [...code.matchAll(routeRegex)].map(m => m[1]);

// Inject last-known route as initialEntries
const routerCode = `<MemoryRouter initialEntries={['${lastRoute}']}>`
```

### Phase 100 -- Code Smell Patterns

```typescript
const CODE_SMELLS = [
  { pattern: /style=\{\{/g, message: 'Inline style detected -- consider using Tailwind classes', severity: 'info' },
  { pattern: /catch\s*\(\s*\)\s*\{/g, message: 'Empty catch block -- errors are silently swallowed', severity: 'warn' },
  { pattern: /any(?=\s|;|,|\))/g, message: 'TypeScript "any" type -- consider a specific type', severity: 'info' },
  { pattern: /console\.log/g, message: 'Console.log left in code -- remove before production', severity: 'info' },
];
```

### Phase 102 -- Doc Generation Prompt

The doc generator sends a targeted prompt to the AI:

```typescript
const docPrompt = `Generate JSDoc comments for all exported functions and components in this file. 
Do NOT modify any logic. Only add documentation comments above each export.
Return the full file with comments added using ===FILE: format.

${fileContent}`;
```

### Phase 103 -- Smart Undo Data Structure

```typescript
interface UndoEntry {
  label: string;
  timestamp: Date;
  fileDiffs: Array<{
    path: string;
    before: string;  // content before change
    after: string;   // content after change
    isNew: boolean;
    isDeleted: boolean;
  }>;
}
```

