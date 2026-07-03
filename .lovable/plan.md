# v0.5 — Security Graph foundation + Incident Timeline UI

One foundation, not four features. Everything future (recommendations, memory, incidents, reporting) becomes a view over the same graph.

---

## Phase A — Security Graph foundation

Three normalized tables in Postgres. No graph DB, no over-engineering.

### `ray_entities`
The nodes. Anything Ray reasons about.

- `id` uuid pk
- `org_id` uuid (nullable — some entities are user-scoped)
- `user_id` uuid (nullable — owner when applicable)
- `type` text — `user | device | account | mailbox | organization | breach | recommendation | incident | memory | password | extension | policy | threat`
- `external_id` text — stable id in source system (e.g. device serial, M365 UPN, breach id)
- `name` text
- `attributes` jsonb — type-specific facts (OS, tenant, provider, severity, etc.)
- `first_seen_at`, `last_seen_at`, `created_at`, `updated_at`
- Unique: `(org_id, type, external_id)` when `external_id` is set

### `ray_relationships`
The edges. Directional, typed.

- `id` uuid pk
- `org_id` uuid
- `source_entity_id` → `ray_entities.id`
- `target_entity_id` → `ray_entities.id`
- `relationship_type` text — `owns | uses | member_of | affects | resolves | detected_on | linked_to | derived_from | targets`
- `attributes` jsonb, `created_at`
- Unique: `(source_entity_id, target_entity_id, relationship_type)`

### `ray_events`
The timeline. Timestamped facts about a single entity (or pair).

- `id` uuid pk
- `org_id` uuid
- `entity_id` → `ray_entities.id` (primary subject)
- `related_entity_id` uuid nullable (secondary subject when the event links two entities)
- `event_type` text — `posture_changed | recommendation_opened | recommendation_resolved | breach_detected | password_rotated | mfa_enabled | device_isolated | patch_installed | threat_detected | incident_opened | incident_closed | memory_learned | login_anomaly | agent_action`
- `severity` text — `info | success | warn | danger`
- `title` text, `body` text
- `payload` jsonb — full evidence
- `source` text — `ray-scan | agent | user | edge-fn:<name>`
- `occurred_at` timestamptz, `created_at` timestamptz

### RLS, grants, indexes
- Every table `org_id`-scoped via `has_role`/org membership (never `auth.uid()` alone — per MSP data isolation rule).
- `service_role` full access; `authenticated` scoped SELECT via org membership; INSERT restricted to org admins for entities/relationships; events insert-only from edge functions (service role).
- Indexes: `(org_id, type)`, `(entity_id, occurred_at desc)`, `(org_id, occurred_at desc)`, `(source_entity_id)`, `(target_entity_id)`.

### Backfill adapters (no data migration, just projection)
A single edge function `ray-graph-sync` that idempotently upserts entities/relationships/events from existing tables:

- Users → `ray_entities(type=user)` from `profiles`
- Devices → `ray_entities(type=device)` from `rmm_agents`, relationship `user owns device`
- Recommendations → entity + relationships to their subject; event on create/resolve
- Breaches → entity + `affects` relationship to user/account; event
- Incidents → entity; events on state changes
- Memory → `ray_entities(type=memory)` from `ray_org_memory`
- Timeline history → replay `ray_org_timeline` into `ray_events` on first run only (guarded flag)

Cron: reuse existing 6h `ray-scan` schedule, add a light hourly `ray-graph-sync` for deltas.

### Write-through hooks (make the graph live)
- `ray-scan`: on recommendation upsert → also insert an event.
- `ray-router` skills: whenever a skill produces a finding, emit an event.
- Agent action pipeline: on action result → event.
- No new API surface for consumers yet — everything reads from the three tables.

---

## Phase B — Incident Timeline UI

First consumer of the graph. Trivial once Phase A ships.

### Route
`/app/timeline/:entityType?/:entityId?` — with the current `/app/timeline` becoming the org-wide feed by default.

### Data
```
SELECT * FROM ray_events
WHERE org_id = $org
  AND ($entity_id IS NULL OR entity_id = $entity_id OR related_entity_id = $entity_id)
ORDER BY occurred_at DESC LIMIT 200
```
Cursor pagination on `occurred_at`.

### UI
- Filter bar: entity type (user/device/incident/all), severity, source, date range, free-text search.
- Vertical timeline with severity-colored dots, grouped by day.
- Each event card: title, subject entity chip (clickable → filter to that entity), evidence expand, "Ask Ray" button that seeds the existing floating chat with the event as context (reuses the `ray:panel-send` event bus already wired in `RaySkillsPanel`).
- Sidebar "Related" panel: for a selected entity, list connected entities from `ray_relationships` — clicking one refocuses the timeline.
- Empty state directs to run `ray-graph-sync` (dev tool) or "come back after Ray's next scan".

### Components
- `src/components/ray/timeline/EventList.tsx`
- `src/components/ray/timeline/EventCard.tsx`
- `src/components/ray/timeline/EntityChip.tsx`
- `src/components/ray/timeline/RelatedEntitiesPanel.tsx`
- `src/components/ray/timeline/TimelineFilters.tsx`
- Update `src/pages/safesuite/RayTimelinePage.tsx` to compose them and read graph events instead of the current `ray_org_timeline` direct query.

### Legacy `ray_org_timeline`
Keep the table (used by digest). Backfill it once into `ray_events`; going forward, new writes go through `ray_events` and a small trigger mirrors to `ray_org_timeline` for the digest builder until the digest is refactored in a later slice.

---

## Explicit non-goals (per your prompt)
- No graph database.
- No auto-remediation beyond what's already gated.
- No conversational polish pass.
- No cross-skill reasoning yet — that's Phase C, next milestone.
- No Relationship Explorer visualization — Phase D.

---

## Technical section

- Fingerprint entities via `(org_id, type, external_id)` uniqueness so adapters are idempotent.
- Relationships are dedup'd via the composite unique; adapters use `on conflict do nothing`.
- Events are append-only (no update path exposed). A `dedup_key` text column with a partial unique index prevents duplicate replay during backfill.
- All new edge functions: `verify_jwt = false`, invoked by pg_cron with service role, following existing `ray-scan`/`ray-digest-*` pattern.
- Tests:
  - Deno unit test for adapter idempotency (double-run leaves table stable).
  - Deno unit test for event insert dedup.
  - Vitest for `EventList` filter reducer.
- Indexes chosen for the two hot queries: entity-scoped timeline and org-wide recent feed.
- No changes to agent, no new device-side code, no changes to existing skill contracts.

---

## Order of build

1. Migration: three tables + RLS + grants + indexes.
2. `ray-graph-sync` edge function with adapters + one-time backfill flag.
3. Write-through hooks in `ray-scan` and `ray-router`.
4. Timeline UI reading `ray_events`.
5. Related entities panel + entity-scoped route param.
6. Tests + a short QA note appended to `docs/v0.4-qa-report.md` (or a new `v0.5-*` file).

Approve and I'll start with the migration.
