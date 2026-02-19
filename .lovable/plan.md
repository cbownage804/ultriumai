

# Phases 104–153: The Ultimate App Builder Expansion

50 new features organized into 10 themed sprints that push the builder from "impressive tool" into "complete development platform" territory.

---

## Sprint A: Intelligence Upgrades (Phases 104–108)

### Phase 104: Multi-Model Switcher with Cost Estimator
Let users pick between AI models (GPT-4o, Claude, Gemini, Llama) per-prompt with a live cost/speed/quality comparison card. Add a "Best for this task" auto-selector.

### Phase 105: Prompt Chains (Multi-Step Workflows)
Define reusable prompt sequences: e.g., "1. Generate schema, 2. Build CRUD UI, 3. Add auth, 4. Write tests." Save and share chains as recipes.

### Phase 106: AI Code Review Agent
After every build, an AI reviewer scores the output (security, performance, accessibility, best practices) and leaves inline comments like a senior dev PR review.

### Phase 107: Test Generation Engine
One-click generation of unit tests (Vitest) and integration tests for every component and hook. Show coverage percentage in the toolbar.

### Phase 108: Natural Language Database Queries
Type "show me all users who signed up last week" and the AI converts it to SQL, runs it against the connected Supabase, and displays results in a table.

---

## Sprint B: Editor Power Tools (Phases 109–113)

### Phase 109: Multi-Cursor Editing in Monaco
Enable Ctrl+D multi-cursor, column selection, and find-and-replace-all across the entire project (not just current file).

### Phase 110: Minimap with Heat Zones
Show a code minimap with colored heat zones indicating recently changed areas, error-prone sections, and AI-modified blocks.

### Phase 111: Breadcrumb Symbol Navigator
Click any function/component name in the breadcrumb bar to jump to its definition. Show a symbol outline panel (like VS Code's outline view).

### Phase 112: Snippet Library (User-Defined)
Users save code snippets with tags and descriptions. Type a trigger prefix (like `/btn`) to expand a saved snippet inline.

### Phase 113: Split Diff Editor
Side-by-side diff view for any two versions of a file. Drag a slider to compare "before AI edit" vs "after."

---

## Sprint C: Collaboration & Teams (Phases 114–118)

### Phase 114: Commenting System
Click any line of code or UI element to leave a comment. Comments are threaded and resolve-able, like Figma annotations.

### Phase 115: Role-Based Project Access
Define roles (Owner, Editor, Viewer) with granular permissions: who can edit code, who can only prompt, who can only view the preview.

### Phase 116: Team Activity Feed
Real-time feed showing "Alice edited Header.tsx", "Bob ran a prompt", "Carol deployed v2.3" with timestamps and diffs.

### Phase 117: Approval Workflows
Require approval before deploying to production. An Editor submits, an Owner reviews the diff and approves or rejects.

### Phase 118: Project Transfer & Forking
One-click fork a project (with or without history). Transfer ownership between team members with audit trail.

---

## Sprint D: Design & Visual Tools (Phases 119–123)

### Phase 119: Figma Import (Design-to-Code)
Paste a Figma frame URL or upload a Figma JSON export. The AI maps layers to React components with proper hierarchy and Tailwind styles.

### Phase 120: Color Palette Extractor
Upload any image or paste a URL -- the system extracts dominant colors and generates a matching Tailwind color palette.

### Phase 121: Icon Picker with Search
Searchable icon browser for Lucide, Heroicons, and Phosphor. Click to insert the import and JSX at the cursor position.

### Phase 122: Responsive Breakpoint Editor
Visual editor showing the app at all breakpoints simultaneously. Click any breakpoint to add responsive overrides.

### Phase 123: Animation Builder (Visual)
Timeline-based keyframe editor for Framer Motion animations. Drag curves, set durations, preview in real-time, and export as code.

---

## Sprint E: Data & Backend (Phases 124–128)

### Phase 124: Visual Schema Builder (ERD)
Drag-and-drop entity relationship diagram. Draw lines between tables to create foreign keys. Auto-generates Supabase migrations.

### Phase 125: Seed Data Generator (AI-Powered)
Describe your data ("50 realistic user profiles with US addresses") and the AI generates INSERT statements or JSON seed files.

### Phase 126: API Endpoint Tester (Postman-lite)
Built-in HTTP client to test Edge Functions. Save request collections, set auth headers, view formatted responses.

### Phase 127: Webhook Builder
Visual webhook configuration: trigger on database change, transform payload with AI, send to external URL. Test with mock events.

### Phase 128: Cron Job Scheduler
Schedule Edge Functions to run on intervals (hourly backups, daily reports, weekly cleanups). Visual cron expression builder.

---

## Sprint F: DevOps & Deployment (Phases 129–133)

### Phase 129: Environment Manager (Dev/Staging/Prod)
Separate environment configs with one-click promotion: Dev -> Staging -> Production. Each has its own env vars and database.

### Phase 130: Rollback with One Click
Deploy history with instant rollback to any previous version. Shows a diff of what will change before confirming.

### Phase 131: Uptime Monitoring Dashboard
Ping the published URL every 5 minutes. Show uptime percentage, response time graph, and alert on downtime.

### Phase 132: Build Cache & Incremental Compilation
Cache compiled modules so only changed files recompile. Show "Compiled in 120ms (3 files changed)" instead of full rebuilds.

### Phase 133: Custom Build Scripts (Pre/Post Hooks)
Run user-defined scripts before or after compilation: lint, format, validate env vars, generate types, etc.

---

## Sprint G: Content & Media (Phases 134–138)

### Phase 134: CMS Mode (Content Management)
Toggle any page into "CMS mode" where non-developers can edit text, images, and content blocks without touching code.

### Phase 135: Markdown Blog Engine
Generate a complete blog system: markdown files, frontmatter parsing, tag/category pages, RSS feed, SEO meta tags.

### Phase 136: Image Optimization Pipeline
Auto-compress, resize, and convert images to WebP on upload. Generate srcset attributes for responsive images.

### Phase 137: Video Embed Manager
Paste YouTube/Vimeo/Loom URLs and get responsive, lazy-loaded embed components with thumbnail previews.

### Phase 138: Internationalization (i18n) Generator
Detect all user-facing strings, extract them into locale JSON files, and generate a language switcher component.

---

## Sprint H: Analytics & Insights (Phases 139–143)

### Phase 139: Built-in Analytics Dashboard
Track page views, unique visitors, top pages, referrers, and device types -- all without external services. Uses Edge Functions + Supabase.

### Phase 140: Error Tracking (Sentry-lite)
Capture runtime errors from the published app with stack traces, user context, and occurrence frequency. Alert via email.

### Phase 141: User Session Replay
Record anonymized user sessions (clicks, scrolls, navigation) and replay them to understand UX issues.

### Phase 142: A/B Testing Framework
Define variants for any component, split traffic, and measure conversion rates. Visual editor for variant configuration.

### Phase 143: AI Usage Analytics
Dashboard showing prompt count, token usage, cost per session, most common prompt categories, and generation success rate.

---

## Sprint I: Security & Compliance (Phases 144–148)

### Phase 144: Dependency Vulnerability Scanner
Scan all npm packages for known CVEs. Show severity badges and one-click updates to patched versions.

### Phase 145: Content Security Policy Generator
Analyze the app's external resources and auto-generate a CSP header. Test in report-only mode before enforcing.

### Phase 146: GDPR Compliance Kit
Generate cookie consent banner, privacy policy page, data export endpoint, and account deletion flow.

### Phase 147: Rate Limiter for Edge Functions
Visual rate limit configuration per Edge Function: requests per minute, per IP, with customizable error responses.

### Phase 148: Secret Rotation Reminders
Track when secrets were last rotated. Show warnings for stale API keys and provide one-click rotation guides.

---

## Sprint J: Platform & Ecosystem (Phases 149–153)

### Phase 149: CLI Companion Tool
Generate a `npx ultrium-cli` package that syncs the cloud project locally. Run `ultrium dev` for local development.

### Phase 150: GitHub Actions Generator
Auto-generate CI/CD workflows: test on PR, deploy on merge, run lighthouse audits, notify on Slack.

### Phase 151: Slack/Discord Bot Integration
Send build notifications, error alerts, and deployment confirmations to a Slack or Discord channel.

### Phase 152: White-Label Export
Strip all branding and generate a fully white-labeled version of the app with custom logos, colors, and domain.

### Phase 153: Plugin SDK (Third-Party Extensions)
Publish an SDK so external developers can build plugins: custom panels, code transforms, AI prompt modifiers, and deploy hooks.

---

## Implementation Priority

```text
IMMEDIATE IMPACT (everyone benefits):
  Phase 104 (Multi-Model Switcher)
  Phase 107 (Test Generation)
  Phase 108 (NL Database Queries)
  Phase 113 (Split Diff Editor)
  Phase 130 (One-Click Rollback)

POWER USERS:
  Phase 105 (Prompt Chains)
  Phase 106 (Code Review Agent)
  Phase 124 (Visual Schema Builder)
  Phase 132 (Build Cache)
  Phase 138 (i18n Generator)

TEAM / ENTERPRISE:
  Phase 115 (Role-Based Access)
  Phase 117 (Approval Workflows)
  Phase 129 (Environment Manager)
  Phase 146 (GDPR Kit)

ECOSYSTEM GROWTH:
  Phase 149 (CLI Tool)
  Phase 150 (GitHub Actions)
  Phase 153 (Plugin SDK)
```

---

## Technical Notes

**Phase 104 -- Model Switcher**: Store model preference in project settings. Pass `model` field to the edge function which routes to the appropriate provider API.

**Phase 107 -- Test Gen**: Send component source to AI with prompt "Generate Vitest unit tests for this component. Use @testing-library/react. Cover happy path, edge cases, and error states."

**Phase 124 -- ERD Builder**: Use `@xyflow/react` (already installed) to render draggable table nodes with column lists. Connections = foreign keys. Export as SQL migration.

**Phase 132 -- Build Cache**: Hash each file's content. Store compiled output in IndexedDB keyed by hash. On recompile, skip files whose hash hasn't changed.

**Phase 138 -- i18n**: Regex scan for string literals in JSX (`>{text}<`). Extract to `en.json`. Generate `useTranslation` hook wrapper and `<LanguageSwitcher>` component.

