

# Phase 14-18: True Lovable Operational Parity

After reviewing the full codebase, here are the remaining gaps between your builder and how Lovable actually operates. These focus on **operational behavior** -- not more tools/panels, but how the core build loop works.

---

## Phase 14: Supabase Database Migrations from Chat ✅ COMPLETED

**Gap**: Lovable executes real SQL migrations against Supabase directly from the conversation. Your builder generates SQL in chat and tells the user to copy-paste it into the Supabase dashboard manually.

**Changes**:

1. **Migration Execution Edge Function** (`supabase/functions/ai-builder-migrate/index.ts`)
   - Accept SQL statements + the user's connected Supabase project URL/service role key
   - Execute migrations using the Supabase Management API or direct `pg` connection
   - Return success/error with affected tables and row counts
   - Support rollback by generating inverse migration SQL

2. **Migration Approval UI** (`src/components/ai-builder/MigrationApprovalCard.tsx`)
   - When the AI outputs `===MIGRATION:===` blocks, show a styled approval card in chat
   - Display the SQL with syntax highlighting and a plain-English summary
   - "Apply" and "Skip" buttons -- never auto-execute DDL
   - After approval, call the migration edge function and show success/failure inline

3. **System Prompt Update** (`supabase/functions/ai-app-builder/index.ts`)
   - Add `===MIGRATION: description===` delimiter to the output format
   - Instruct the AI to emit migration blocks whenever it detects database schema needs
   - Include the connected Supabase schema context (table names, columns, RLS policies) so the AI generates correct ALTER/CREATE statements

---

## Phase 15: Real Supabase Type Generation and Client Wiring ✅ COMPLETED

**Gap**: Lovable auto-generates TypeScript types from the database schema and wires them into `supabase.from('table').select()` calls. Your builder uses raw `supabase` globals and generic queries without type safety.

**Changes**:

1. **Schema Introspection** (`supabase/functions/ai-builder-schema/index.ts`)
   - Query `information_schema.tables` and `information_schema.columns` from the connected project
   - Return a JSON schema definition with table names, column names, types, nullability, defaults, and foreign keys
   - Cache results for 5 minutes to avoid repeated queries

2. **Type Generation** (client-side in `useAIAppBuilder.ts`)
   - After migration approval or on first build, fetch the schema
   - Generate a `types.ts` file with TypeScript interfaces matching the database tables
   - Auto-inject into the project file system
   - Include the schema summary in the AI system prompt so generated code uses correct column names and types

3. **Query Builder Context**
   - When the AI detects database intent, inject the real schema as context
   - The AI generates `supabase.from('todos').select('id, title, completed')` with actual column names
   - No more guessing or generic placeholder queries

---

## Phase 16: Edge Function Generation and Deployment ✅ COMPLETED

**Gap**: Lovable generates and deploys Edge Functions as part of the build. Your builder has the concept but the AI just outputs JS files -- it doesn't create actual deployable Deno edge functions.

**Changes**:

1. **Edge Function File Convention**
   - When the AI detects server-side needs (email, webhooks, scheduled jobs, API proxies), emit files with a `===EDGE_FUNCTION: function-name===` delimiter
   - Parse these into a separate `supabase/functions/{name}/index.ts` structure
   - Show them in a dedicated "Edge Functions" section of the file tree

2. **Deploy Pipeline** (`supabase/functions/ai-builder-deploy-fn/index.ts`)
   - Accept the function source code + connected Supabase project credentials
   - Use the Supabase Management API to deploy the function
   - Return deployment status, logs URL, and invocation URL
   - Show deployment status in the build summary card

3. **Secrets Injection**
   - When an edge function references `Deno.env.get('SOME_KEY')`, detect the required secrets
   - Prompt the user to add missing secrets via the Secrets Manager panel
   - Block deployment until required secrets are configured

---

## Phase 17: Authentication Flow Generation ✅ COMPLETED

**Gap**: Lovable generates complete auth flows (signup, login, password reset, OAuth, protected routes, session management) that work immediately. Your builder generates auth UI but it's disconnected -- no real session management or route protection.

**Changes**:

1. **Auth Template System** (`src/components/ai-builder/authTemplates.ts`)
   - Pre-built, tested auth patterns: email/password, magic link, Google OAuth, GitHub OAuth
   - Each template includes: login page, signup page, password reset, session listener, protected route wrapper, logout button
   - All templates use the injected `supabase` client for real auth calls

2. **Session Management in Preview**
   - Inject `supabase.auth.onAuthStateChange()` listener into the preview iframe
   - Store session in the preview's localStorage
   - Route protection: redirect to `/login` when accessing protected routes without a session
   - Pass auth state to all components via a global `currentUser` variable

3. **Auth State Detection in AI Prompt**
   - When the user says "add login", "user accounts", "protected", or "my data", auto-detect auth intent
   - Inject the full auth template into the build rather than generating it from scratch each time
   - Reduce errors by using tested, known-good auth code

---

## Phase 18: Real-time Preview URL Sharing (Like Lovable's "Share" Button) ✅ COMPLETED

**Gap**: Lovable lets you share a live preview URL that anyone can open and see the current state of the app. Your builder uploads to Supabase Storage, but it's debounced at 5 seconds and uses a static file -- not a live-updating preview.

**Changes**:

1. **Instant Preview Deployment** (improve `usePreviewHosting.ts`)
   - Reduce debounce from 5s to 1s for faster sharing
   - Use content-hashing for the file path to enable CDN caching
   - Add a "Copy Share Link" button that instantly uploads and copies the URL
   - Show a toast with the shareable URL

2. **Live Preview via Edge Function** (enhance `supabase/functions/serve-preview/index.ts`)
   - Store the latest compiled HTML in a fast key-value store (Supabase table with a single row per project)
   - The serve-preview function reads from this store and serves the latest version
   - Updates are near-instant since it's a database read, not a storage fetch
   - Add cache headers for performance while ensuring freshness

3. **QR Code for Mobile Testing**
   - Generate a QR code for the preview URL (already have `qrcode` package installed)
   - Show it in a popover when hovering the share button
   - Makes mobile testing frictionless

---

## Implementation Priority

```text
Phase 14 (Database Migrations)      -- Core Lovable behavior, highest parity value
Phase 15 (Type Gen & Schema Wiring) -- Makes generated code actually work with real DB
Phase 17 (Auth Flow Generation)     -- Most-requested feature for real apps
Phase 16 (Edge Function Deploy)     -- Enables true full-stack apps
Phase 18 (Live Preview Sharing)     -- Polish feature, good UX
```

---

## Technical Details

### Phase 14 -- Migration Delimiter Format

The AI will output migration blocks inline with file blocks:

```text
===MIGRATION: Create todos table===
CREATE TABLE public.todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own todos"
  ON public.todos FOR ALL
  USING (auth.uid() = user_id);
===END_MIGRATION===
```

The chat UI renders this as an approval card, not raw text.

### Phase 15 -- Schema Context Injection

Before each build, if Supabase is connected, the system prompt will include:

```text
[DATABASE SCHEMA]
Table: todos (id: uuid PK, user_id: uuid FK->auth.users, title: text, completed: bool, created_at: timestamptz)
Table: profiles (id: uuid PK FK->auth.users, display_name: text, avatar_url: text)
RLS: todos -- users can CRUD own rows
[/DATABASE SCHEMA]
```

This ensures the AI generates queries that match the real schema.

### Phase 16 -- Edge Function Detection

The AI emits:
```text
===EDGE_FUNCTION: send-welcome-email===
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// ... function code
===END_EDGE_FUNCTION===
```

The parser extracts this into a deployable function and triggers the deploy pipeline.

### Phase 17 -- Auth Template Structure

Each auth template is a self-contained module with:
- `renderLoginPage()` -- login form with email/password or OAuth buttons
- `renderSignupPage()` -- registration with validation
- `setupAuthListener()` -- `onAuthStateChange` wired to the router
- `requireAuth(callback)` -- wrapper that redirects unauthenticated users
- `getCurrentUser()` -- returns the current session user or null

### Phase 18 -- Preview Storage Schema

A new `app_builder_live_previews` table:
- `project_id` (UUID, PK)
- `compiled_html` (TEXT) -- the full HTML output
- `updated_at` (TIMESTAMPTZ)
- `version_hash` (TEXT) -- for cache busting

The serve-preview function queries this table instead of Storage for faster reads.

