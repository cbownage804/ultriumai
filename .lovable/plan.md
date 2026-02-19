

# Phase 9-13: Next-Generation App Builder Evolution

All 8 original phases are complete. This plan introduces 5 new phases that address the remaining critical gaps and push the builder toward true production parity with Lovable.

---

## Phase 9: Real AI Image Generation (Replace Placeholder SVGs) ✅ COMPLETED

**Status**: ✅ Complete — Edge function rewired to Lovable AI Gateway (`gemini-2.5-flash-image` / `gemini-3-pro-image-preview`), AIImageGenPanel calls real API, image optimization pipeline created (`compressImage`, `convertToWebP`, `injectLazyLoading`).

**Problem**: The `AIImageGenPanel` previously generated placeholder SVG gradients instead of real images.

**Changes**:

1. **Wire AIImageGenPanel to the Lovable AI Gateway** (`src/components/ai-builder/AIImageGenPanel.tsx`)
   - Replace the `setTimeout` + SVG placeholder with a real API call to the Lovable AI Gateway using `google/gemini-2.5-flash-image` (or `gemini-3-pro-image-preview` for high quality)
   - Call the gateway at `https://ai.gateway.lovable.dev/v1/chat/completions` with `modalities: ["image", "text"]`
   - Extract base64 image from `response.choices[0].message.images[0].image_url.url`
   - Store generated images as project assets automatically

2. **Image-to-Code Pipeline** (`src/hooks/useAIAppBuilder.ts`)
   - When a user uploads an image with intent like "use as hero", "use as background", detect asset placement intent
   - Auto-compress large images client-side (max 1200px, JPEG 80% quality) before embedding
   - For images intended as assets: store the data URL in the asset manager, inject `<img src="...">` into the generated code referencing the asset
   - Add `===ASSET: filename.png===` delimiter for the AI to emit base64 image data that gets auto-saved to assets

3. **Image Optimization Pipeline** (`src/utils/imageOptimization.ts` -- new file)
   - Client-side image compression using canvas resize
   - WebP conversion when supported
   - Lazy-load `loading="lazy"` injection into all generated `<img>` tags
   - Responsive `srcset` generation for different viewport sizes

---

## Phase 10: Persistent File System & Project Continuity ✅ COMPLETED

**Status**: ✅ Complete — IndexedDB persistence via `useIndexedDBPersistence` hook with 500ms debounced auto-save, session recovery dialog (`SessionRecoveryDialog`), and sync status indicator (`SyncStatusIndicator`) in header. Falls back to localStorage draft. Recovery dialog shows file/message counts and time-ago.

**Problem**: Files live only in React state. Refreshing the page or closing the tab loses everything unless manually saved. Projects should auto-persist and restore seamlessly.

**Changes**:

1. **IndexedDB File Storage** (`src/hooks/useProjectFileSystem.ts`)
   - Add `idb-keyval` or raw IndexedDB wrapper to persist all project files locally
   - Auto-save on every file change with debouncing (500ms)
   - Load from IndexedDB on mount if a project ID is in the URL
   - Keep the in-memory state as the source of truth, with IndexedDB as the persistence layer

2. **Cloud Sync** (`src/hooks/useProjectPersistence.ts`)
   - Auto-save project files to Supabase `builder_projects` table every 30 seconds (if changed)
   - Store files as a JSONB array in the project record
   - Add a `last_synced_at` timestamp for conflict detection
   - Show a sync indicator in the header (synced / syncing / offline)

3. **Session Recovery** (`src/components/ai-builder/AIAppBuilderWorkspace.tsx`)
   - On mount, check for unsaved changes in IndexedDB
   - If found, show a recovery dialog: "You have unsaved changes from your last session. Restore?"
   - Include the conversation history in the recovery payload

---

## Phase 11: Component Framework Support (React/Tailwind in Preview)

**Problem**: The builder generates vanilla HTML/CSS/JS only. Modern apps need component-based architecture.

**Changes**:

1. **In-Browser React Compiler** (`src/hooks/useReactCompiler.ts` -- new file)
   - Use `@babel/standalone` loaded from CDN to transpile JSX/TSX in the browser
   - Transform `import` statements to resolve against project files
   - Bundle React + ReactDOM via CDN injection into the preview iframe
   - Support Tailwind CSS via the Play CDN (`<script src="https://cdn.tailwindcss.com">`)

2. **Framework Detection** (`src/hooks/useProjectFileSystem.ts`)
   - Auto-detect when AI generates `.tsx` or `.jsx` files
   - Switch the compiler pipeline from concatenation to React bundling
   - Inject `React.createElement` runtime for JSX
   - Support `useState`, `useEffect`, and other hooks

3. **System Prompt Enhancement** (`supabase/functions/ai-app-builder/index.ts`)
   - Add a `===MODE: react===` directive the AI can emit to signal React output
   - When detected, switch the preview pipeline to React mode
   - Update file scaffolding to create `App.tsx`, `main.tsx`, `index.html` with React bootstrap

---

## Phase 12: Smart Error Resolution & Self-Healing

**Problem**: While "Try to Fix" exists, it often fails because the AI lacks sufficient error context. The fix loop needs to be smarter.

**Changes**:

1. **Error Context Enrichment** (`src/hooks/useAIAppBuilder.ts`)
   - When a preview error occurs, capture: the full error message, the exact source file + line, the 20 lines surrounding the error, all console warnings, any failed network requests
   - Build a structured error report that gets injected as system context for the fix request
   - Include the previous fix attempt (if any) to prevent loops

2. **Fix Strategy Escalation** (`src/hooks/useAutoErrorRecovery.ts`)
   - Attempt 1: Targeted line fix (send only the broken file + error)
   - Attempt 2: Function rewrite (send the broken function + its dependencies)
   - Attempt 3: Full file regeneration (regenerate the entire file from scratch)
   - Attempt 4: Rollback + notify user ("I couldn't fix this automatically. Here's what went wrong...")

3. **Error Pattern Learning** (`src/components/ai-builder/SupabaseConversational.tsx`)
   - Track common error patterns across builds (e.g., "unclosed template literal", "undefined variable")
   - Inject anti-patterns into the system prompt: "AVOID these common errors: [list]"
   - Reduce repeat errors by 80%+ through preventive prompting

---

## Phase 13: Production Export & Real Hosting

**Problem**: Published apps are just HTML uploaded to Supabase Storage. Need real deployment with proper hosting, performance optimization, and export for external platforms.

**Changes**:

1. **Optimized Build Output** (`src/components/ai-builder/exportProject.ts`)
   - Minify HTML, CSS, and JS before publishing
   - Inline critical CSS, defer non-critical
   - Add `<meta>` tags for SEO (title, description, og:image)
   - Generate a `manifest.json` for PWA support
   - Create a `robots.txt` and `sitemap.xml`

2. **One-Click Platform Export** (`src/components/ai-builder/ExportGuidePanel.tsx`)
   - Vercel: Generate `vercel.json` + project structure, provide deploy command
   - Netlify: Generate `netlify.toml`, provide drag-and-drop deploy instructions
   - Docker: Generate `Dockerfile` + `nginx.conf` for containerized deployment
   - GitHub Pages: Generate `.github/workflows/deploy.yml`

3. **Performance Budget** (`src/components/ai-builder/BuilderPreviewPanel.tsx`)
   - After each build, run a lightweight performance audit
   - Check: total bundle size, number of DOM nodes, image sizes, unused CSS
   - Show a performance score (0-100) in the build summary card
   - Flag issues: "3 images over 500KB -- consider compressing"

---

## Implementation Priority

```text
Phase 9  (Real Image Generation)     -- Highest value, fixes a broken feature
Phase 10 (Persistent File System)    -- Prevents data loss, critical UX
Phase 12 (Smart Error Resolution)    -- Reduces frustration, improves reliability
Phase 13 (Production Export)         -- Enables real-world use
Phase 11 (React/Component Support)   -- Most complex, highest long-term impact
```

---

## Technical Details

### Phase 9 -- Key Code Changes

**AIImageGenPanel.tsx**: Replace the placeholder generation with:
```typescript
const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'google/gemini-2.5-flash-image',
    messages: [{ role: 'user', content: fullPrompt }],
    modalities: ['image', 'text'],
  }),
});
const data = await response.json();
const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
```

**New file -- imageOptimization.ts**:
- `compressImage(dataUrl, maxWidth, quality)` -- canvas-based resize
- `convertToWebP(dataUrl)` -- format conversion
- `injectLazyLoading(html)` -- add `loading="lazy"` to all img tags

### Phase 10 -- IndexedDB Schema

- Key: `project:{projectId}:files` -- stores `ProjectFile[]`
- Key: `project:{projectId}:messages` -- stores `BuilderMessage[]`
- Key: `project:{projectId}:meta` -- stores name, timestamps, settings
- Auto-cleanup: delete projects older than 30 days with no cloud sync

### Phase 11 -- React Pipeline

The React compiler pipeline will:
1. Detect `.tsx`/`.jsx` files in the project
2. Load `@babel/standalone` from CDN (cached)
3. Transform each file: JSX to createElement, strip TypeScript types
4. Resolve inter-file imports using a virtual module map
5. Bundle into a single IIFE injected into the preview iframe
6. Inject React 18 + ReactDOM from CDN into the iframe `<head>`

### Phase 12 -- Error Report Structure

```typescript
interface ErrorReport {
  message: string;
  sourceFile: string;
  sourceLine: number;
  surroundingCode: string; // 20 lines around the error
  consoleWarnings: string[];
  failedRequests: { url: string; status: number }[];
  previousFixAttempt?: string;
  attemptNumber: number;
}
```

### Phase 13 -- Performance Budget Thresholds

- Total HTML + CSS + JS: warn > 500KB, error > 1MB
- Individual images: warn > 200KB, error > 1MB
- DOM nodes: warn > 1500, error > 3000
- Unused CSS rules: warn > 30%

