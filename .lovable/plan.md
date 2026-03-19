

# Builder Improvements — Wave 14

Four improvements covering smarter error recovery, prompt templates, AI memory, and export/deployment polish.

---

## 1. Cascading Error Recovery with Root-Cause Analysis

**Problem**: The current auto-fix loop (3 retries) sends the raw error message back to the AI, but doesn't analyze whether the error is a symptom of a deeper issue (e.g., a missing import causes 3 different "undefined" errors).

**What it does**: Before retrying, group related errors by file and deduplicate. Extract the root cause (e.g., "missing import" vs "undefined variable") and send a single consolidated fix prompt instead of fixing symptoms one-by-one. On the 2nd retry, include a diff of what changed since the last working state (from `useLKGDiff`) so the AI can see exactly what broke.

**Files**: `useAutoFixLoop.ts` (add error grouping + LKG diff injection), `useErrorPatternLearning.ts` (feed successful fixes back as positive patterns)

---

## 2. Expanded Prompt Templates with Context-Aware Suggestions

**Problem**: The slash command templates exist but are static — they don't adapt to what's already in the project (e.g., suggesting "Add Auth" when auth is already implemented).

**What it does**: Before showing templates, scan the project files to detect which features already exist (auth, routing, dark mode, etc.). Mark implemented templates as "✓ Done" and surface only relevant ones. Add new template categories: "Optimize" (performance, SEO, accessibility), "Polish" (animations, loading states, error boundaries), and "Scale" (pagination, caching, lazy loading).

**Files**: `promptTemplates.ts` (add new templates + feature detection), `BuilderChatPanel.tsx` (wire context-aware filtering into slash menu)

---

## 3. Persistent AI Memory with Correction Learning

**Problem**: `useAgentMemory` tracks conventions and preferences in localStorage, but doesn't learn from user corrections (e.g., "I told you not to change the background" should permanently stick).

**What it does**: After each generation, detect correction patterns in user follow-ups ("don't change X", "always use Y", "keep Z"). Auto-extract these as hard rules and inject them into future system prompts as `[USER RULES]`. Show a "Memory" indicator in the chat header with a count of learned rules, and let users view/edit/delete them.

**Files**: `useAgentMemory.ts` (add correction detection + rule extraction), `useAIAppBuilder.ts` (inject rules into system prompt), `BuilderChatPanel.tsx` (add memory indicator UI)

---

## 4. One-Click GitHub Export with Production Config

**Problem**: Export exists but produces a raw ZIP. Users who want to push to GitHub and deploy still need to manually add package.json scripts, environment configs, and build settings.

**What it does**: Enhance the "Full-Stack" export to generate a production-ready repository with: proper `package.json` (with `build`, `dev`, `preview` scripts), `.env.example` with all required variables listed, a GitHub Actions CI/CD workflow file (`.github/workflows/deploy.yml`), and a `netlify.toml` / `vercel.json` for one-click platform deploys. Add a "Push to GitHub" button that uses the existing GitHub sync to create a repo with these files included.

**Files**: `exportProject.ts` (add CI/CD config generation, .env.example, platform configs), `PublishPanel.tsx` (add GitHub export button)

---

## Priority

| Step | Area | Impact | Effort |
|------|------|--------|--------|
| 3 — Correction learning | AI memory | High | Low |
| 1 — Root-cause recovery | Error recovery | High | Medium |
| 2 — Context-aware templates | Prompt shortcuts | Medium | Low |
| 4 — GitHub export | Deployment | Medium | Medium |

