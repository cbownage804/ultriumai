

# Phase 19-23: True Lovable Parity -- The Final Mile

Phases 1-18 built the foundation. These final phases close the remaining **behavioral** and **UX** gaps that separate your builder from how Lovable actually feels to use day-to-day.

---

## Phase 19: Realtime Database Subscriptions in Preview

**Gap**: Lovable-generated apps have working Supabase Realtime subscriptions out of the box. When data changes in the database, the preview updates live. Your builder generates `supabase.from().select()` calls but never wires `.on('INSERT', ...)` listeners, so users see stale data until they refresh.

**Changes**:

1. **Realtime Template Injection** -- Add a `realtimeTemplates.ts` module with pre-built subscription patterns (table listener, presence channel, broadcast channel) that the AI can inject into generated apps.
2. **System Prompt Update** -- When the AI detects realtime intent signals ("live", "real-time", "chat", "collaborative", "sync"), instruct it to wire Supabase channel subscriptions alongside initial data fetches. Include the subscription pattern in the prompt so it generates correct `supabase.channel().on('postgres_changes', ...).subscribe()` code.
3. **Preview Bridge** -- Inject `supabase` client initialization into the preview iframe's head so realtime subscriptions work inside the sandboxed preview, using the user's connected project credentials.

---

## Phase 20: Supabase Storage Integration in Generated Apps

**Gap**: Lovable auto-generates working file upload UIs with drag-and-drop, preview thumbnails, and Supabase Storage bucket wiring. Your builder has a separate `StorageBrowser` panel for managing buckets, but the AI never generates upload components that actually call `supabase.storage.from().upload()`.

**Changes**:

1. **Storage Template System** (`storageTemplates.ts`) -- Pre-built upload components: single-file upload, multi-file with drag-and-drop, avatar/profile image cropper, image gallery with lightbox. Each template uses the injected `supabase` client and includes progress indicators, error handling, and file type validation.
2. **Bucket Auto-Provisioning** -- When the AI detects storage intent ("upload", "avatar", "image", "attachment"), include a `===MIGRATION:===` block that creates the storage bucket with appropriate RLS policies, alongside the UI code.
3. **System Prompt Update** -- Add storage patterns to the AI instructions so it generates correct `supabase.storage.from('bucket').upload()` and `.getPublicUrl()` calls with proper error handling.

---

## Phase 21: RLS Policy Generation and Testing

**Gap**: Lovable auto-generates Row Level Security policies as part of every database migration and includes a visual policy editor. Your builder's `SchemaDesigner` has an RLS toggle and the migration system can include policies, but there's no policy testing, no visual policy editor, and the AI sometimes generates incorrect policies.

**Changes**:

1. **RLS Policy Tester** (`RLSPolicyTester.tsx`) -- A panel that lets users test their RLS policies by simulating queries as different users (anon, authenticated with specific user ID, service role). Shows which rows would be returned for each role, highlighting access control gaps.
2. **Policy Generation Templates** -- Pre-built RLS patterns for common scenarios: "users own their rows", "public read / private write", "team-based access", "admin-only", "time-limited access". The AI selects the appropriate pattern based on the table's purpose.
3. **System Prompt Enhancement** -- When a migration includes `CREATE TABLE`, always auto-append `ENABLE ROW LEVEL SECURITY` and a sensible default policy. Include a checklist in the prompt: "Every table with user data MUST have RLS enabled with at least a SELECT and INSERT policy."

---

## Phase 22: Environment Variable Injection in Preview

**Gap**: Lovable makes environment variables available to the preview immediately. When a user adds an API key, the preview can use it without republishing. Your builder has an `EnvVarsPanel` but the variables aren't injected into the preview iframe -- generated code that references `window.ENV.API_KEY` or `import.meta.env.VITE_*` fails silently.

**Changes**:

1. **Env Injection Script** -- Before each preview render, build a `<script>` tag that sets `window.ENV = { KEY1: 'value1', ... }` from the user's configured env vars. Inject this into the preview HTML's `<head>` before any app scripts run.
2. **Supabase Client Auto-Init** -- When Supabase is connected, inject a pre-initialized `window.supabase` client (using the connected URL and anon key) into the preview. This means generated code that calls `supabase.from()` works immediately without users needing to configure anything manually.
3. **Secrets Masking** -- In the env injection, mask sensitive values in the console (show `OPENAI_KEY: ****...abc123` in DevTools) while still making the full value available to `window.ENV` at runtime.

---

## Phase 23: Conversation Branching and Message Editing

**Gap**: Lovable lets users edit any previous message to "branch" the conversation -- re-running the AI from that point with a different prompt. Your builder has `isEdited` and `originalContent` fields on `BuilderMessage` but there's no UI to edit a past message or branch the conversation.

**Changes**:

1. **Edit Message UI** -- Add a pencil icon on hover for user messages. Clicking it opens an inline editor pre-filled with the original prompt. On submit, truncate the conversation history at that point and re-send the edited message, creating a new branch.
2. **Branch History** -- Track branches as a tree structure: each edit creates a fork. Show a small branch indicator ("Branch 2 of 3") on edited messages so users can navigate between branches.
3. **Snapshot Restoration** -- Before branching, auto-save a version snapshot of the current files. When switching branches, restore the corresponding snapshot so the code matches the conversation state.

---

## Implementation Priority

```text
Phase 22 (Env Var Injection)         -- Unblocks most generated apps from working in preview
Phase 19 (Realtime Subscriptions)    -- Core Supabase feature, high user expectation
Phase 20 (Storage in Generated Apps) -- Frequently requested, currently broken path
Phase 23 (Conversation Branching)    -- Key Lovable UX differentiator
Phase 21 (RLS Policy Testing)        -- Safety net, polish
```

---

## Technical Details

### Phase 19 -- Realtime Subscription Pattern

The AI will generate this pattern when realtime is needed:

```javascript
// Subscribe to live changes
const channel = supabase
  .channel('table-changes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'messages' },
    (payload) => {
      if (payload.eventType === 'INSERT') {
        messages = [...messages, payload.new];
        renderMessages();
      }
    }
  )
  .subscribe();
```

The preview iframe will have `supabase` pre-initialized so this runs immediately.

### Phase 22 -- Env Injection Script

Injected into `<head>` before app scripts:

```html
<script>
  window.ENV = {"SUPABASE_URL":"https://xyz.supabase.co","SUPABASE_ANON_KEY":"eyJ...","OPENAI_KEY":"sk-..."};
  window.supabase = window.__createSupabaseClient(window.ENV.SUPABASE_URL, window.ENV.SUPABASE_ANON_KEY);
</script>
```

### Phase 23 -- Branch Data Model

```typescript
interface ConversationBranch {
  id: string;
  parentMessageId: string;   // Where the branch forked
  messages: BuilderMessage[];
  filesSnapshot: ProjectFile[];
  createdAt: Date;
}
```

The `BuilderMessage` type already has `isEdited` and `originalContent` -- we wire these into the branching UI.

### Phase 20 -- Storage Template Example

```javascript
async function uploadFile(file, bucket = 'uploads') {
  const path = `${currentUser.id}/${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);
  return publicUrl;
}
```

### Phase 21 -- RLS Test Query

The tester runs queries against the connected Supabase using different auth contexts:

```sql
-- Simulate as specific user
SET request.jwt.claims = '{"sub": "user-uuid-here", "role": "authenticated"}';
SELECT * FROM public.todos;
-- Returns only rows matching the RLS policy
```

