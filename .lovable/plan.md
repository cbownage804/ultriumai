

# Reaching Lovable Parity: Next Feature Wave

## What You Already Have
Your AI App Builder already includes: command palette, file tree, Monaco editor, version history, branching, visual edit overlay, device preview presets, console panel, env vars, asset manager, deploy dialog, templates, export (ZIP/Docker), collaborative presence, undo/redo, file search, breadcrumbs, and code diff viewer. That's impressive.

## What's Still Missing vs. Lovable

Here are the remaining high-impact gaps, grouped into three implementation phases:

---

### Phase 1: Smart Editing and Iteration (Core UX)

**1. Select-to-Edit in Preview ("Visual Edits 2.0")**
Your current visual edit overlay only supports text and color changes. Lovable lets users click any element and type a natural language prompt like "make this button bigger and blue" which the AI then applies surgically. This means:
- When an element is selected in the preview, show a prompt input (not just text/color buttons)
- Send the element's selector + surrounding HTML context to the AI so it rewrites just that section
- Apply the diff back into the file system automatically

**2. Streaming Preview (Hot Reload)**
Currently, the preview only updates after the full AI response finishes. Lovable updates the preview as code streams in. This means:
- Parse `===FILE:` blocks incrementally during streaming
- Recompile and refresh the iframe as each file completes
- Show a subtle "updating..." badge on the preview during partial renders

**3. "Try to Fix" Error Loop**
Your error console has a "Fix" button, but it just sends a generic prompt. A smarter version would:
- Automatically include the erroring file's content, the stack trace, and the line number
- Add a "Try to Fix" button directly on errors that auto-sends a precisely scoped fix request
- Track fix attempts to avoid infinite loops (max 3 retries)

---

### Phase 2: Multi-File Intelligence

**4. Dependency Graph and Import Resolution**
When the AI generates multiple files, imports between them don't actually resolve in the sandbox iframe. This is the biggest fidelity gap. Implementation:
- Build a simple bundler that concatenates JS/CSS from the file system into the HTML
- Resolve `import` and `<link>` references between project files
- Inject all resolved code into the iframe's `srcdoc`

**5. Package/CDN Manager**
Let users add npm packages (loaded via CDN like esm.sh or unpkg) with a UI panel:
- Search for packages
- Auto-inject `<script>` tags or ESM imports into the compiled HTML
- Track which packages are used per project

**6. Multi-File Awareness in Chat**
When the user says "update the header component", the AI should know which file contains the header without the user specifying. This means:
- Index all files by their exported component/function names
- When a user references a component name, auto-include that file's content in the prompt
- Show which files were sent as context in the chat UI

---

### Phase 3: Collaboration and Polish

**7. Real-Time Collaborative Editing**
Your `CollaborativePresence` shows who's online, but there's no shared editing. Add:
- Broadcast file changes via Supabase Realtime channels
- Show other users' cursor positions in the Monaco editor
- Conflict resolution (last-write-wins with toast notification)

**8. Project Forking / Remixing**
Let users duplicate any saved project as a starting point:
- "Remix" button on saved projects that creates a deep copy
- New project gets a "Remixed from [original]" badge
- Useful for templates and sharing

**9. Publish with Custom Subdomain**
Your deploy dialog publishes HTML but doesn't give users a persistent, branded URL. Add:
- Let users pick a subdomain (e.g., `myapp.ultriumai.app`)
- Store published projects in Supabase storage with a slug
- Serve via an edge function that looks up the slug and returns the HTML

**10. Onboarding Tour**
First-time users see the empty builder and don't know what's possible. Add:
- A step-by-step overlay tour highlighting: chat input, mode toggle, preview, code editor, command palette
- Dismissible, stored in localStorage so it only shows once
- Optional "Show me around" button in the empty state

---

## Technical Details

### Phase 1 File Changes
| File | Change |
|------|--------|
| `VisualEditOverlay.tsx` | Add prompt input mode alongside text/color; send element context to AI |
| `useAIAppBuilder.ts` | Parse files incrementally during stream; expose partial file updates |
| `BuilderPreviewPanel.tsx` | Subscribe to partial file updates for hot-reload; add retry tracking to error fix |
| `ErrorConsole.tsx` | Enhanced "Try to Fix" with file content + stack trace auto-injection |

### Phase 2 File Changes
| File | Change |
|------|--------|
| New: `useProjectBundler.ts` | Simple bundler that resolves imports between VFS files and compiles to single HTML |
| New: `PackageManager.tsx` | CDN package search + install UI panel |
| `useProjectFileSystem.ts` | Add file indexing by exports/component names |
| `useAIAppBuilder.ts` | Auto-detect referenced components and include their files in context |

### Phase 3 File Changes
| File | Change |
|------|--------|
| `CollaborativePresence.tsx` | Add Realtime channel for file change broadcast + cursor sync |
| `CodeEditor.tsx` | Render remote cursors with colored indicators |
| `ProjectManager.tsx` | Add "Remix" button and fork logic |
| `DeployDialog.tsx` | Custom subdomain input + Supabase storage publishing |
| New: `OnboardingTour.tsx` | Step-by-step overlay tour component |

### Estimated scope per phase
- Phase 1: 4 files modified -- highest impact, most visible improvement
- Phase 2: 2 new files, 2 modified -- makes multi-file projects actually work
- Phase 3: 5 files modified, 1 new -- collaboration and growth features

### Recommended order
Start with Phase 1 (streaming preview + smart visual edits + better error fixing) since these are the features users interact with every session. Phase 2 makes the builder genuinely useful for real projects. Phase 3 adds viral/growth mechanics.

