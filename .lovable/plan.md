# One-Click Remediation Engine — Phase 1

Turn every Ray recommendation into a real, auditable **Fix Now** action across
two providers: the **Wrayth Windows Agent** and **Microsoft 365 / Entra ID /
Defender**. Architecture is provider-pluggable so Meraki, Huntress, Datto,
SentinelOne, etc. can drop in later without UI changes.

## What already exists (foundation we build on)

- `src/lib/ray/remediations/catalog.ts` — 17 Windows agent actions, typed and grouped
- `src/components/ray/RemediationDispatchButton.tsx` — device picker + dispatch
- `supabase/functions/agent-action-request` + `agent-action-poll` + `agent-action-result` — full dispatch/ack loop
- `supabase/functions/ms-graph-oauth-*` + `ms-graph-sync` — M365 tenant linking works
- `RayFixPanel`, `FixWithRayButton`, `PlaybookRunner` — existing execution UIs to extend
- `wrayth_device_actions` table — action queue + audit source of truth

## Architecture

### Unified `Remediation` model (extended)

Rewrite `Remediation` as a **provider-agnostic** contract. Existing agent items keep working; M365 items plug into the same shape.

```ts
type ProviderId = 'agent' | 'ms365' | 'defender'; // future: meraki | huntress | ...
type ConfirmMode = 'none' | 'confirm' | 'typed_name' | 'two_person';

interface Remediation {
  slug: string;
  title: string;
  summary: string;
  why: string;
  category: RemediationCategory;      // extended with 'identity' | 'mail' | 'session_cloud'
  risk: 'low' | 'medium' | 'high';
  provider: ProviderId;
  action_type: string;                // provider-native action id
  requiredPermissions: string[];      // e.g. 'ms365:User.ReadWrite.All'
  requiresConfirmation: ConfirmMode;
  requiresReboot?: boolean;
  reversible: boolean;
  reverseSlug?: string;
  estimatedSeconds: number;
  successRate?: number;               // shown as "99%" on the card
  target: 'device' | 'user' | 'tenant' | 'message';
  platforms?: Array<'windows' | 'macos' | 'linux'>;
  paramsSchema?: JSONSchema;          // preview UI renders from this
  previewLines: (ctx) => string[];    // "Ray will: ..." bullets
}
```

### Executor registry (`src/lib/ray/remediations/providers/`)

- `agent.ts` — wraps existing `agent-action-request` dispatcher
- `ms365.ts` — calls new `ms-graph-remediate` edge function
- `index.ts` — `executeRemediation(remediation, target, params)` picks executor by `provider`

### New Microsoft 365 edge function: `ms-graph-remediate`

Single endpoint, action-router style (same pattern as `admin-api`). Uses stored tenant tokens from `ms-graph-oauth-callback` output. Actions:

| slug | Graph call |
|---|---|
| `force-password-reset` | `POST /users/{id}/authentication/methods/{id}/resetPassword` |
| `revoke-sessions` | `POST /users/{id}/revokeSignInSessions` |
| `block-signin` | `PATCH /users/{id}` `accountEnabled:false` |
| `unblock-signin` | `PATCH /users/{id}` `accountEnabled:true` |
| `require-mfa` | `PATCH /policies/authenticationMethodsPolicy/...` per-user |
| `reset-mfa-methods` | `DELETE /users/{id}/authentication/methods/{id}` (loop) |
| `disable-legacy-auth` | Conditional Access policy patch (block legacy auth) |
| `enable-security-defaults` | `PATCH /policies/identitySecurityDefaultsEnforcementPolicy` |
| `remove-inbox-rules` | `GET/DELETE /users/{id}/mailFolders/inbox/messageRules` |
| `remove-forwarding` | `PATCH /users/{id}/mailboxSettings` |
| `quarantine-message` | Defender for O365 `/security/threatSubmission` |
| `block-sender` | Tenant allow/block list `/security/tenantAllowBlockLists` |
| `disable-user` / `enable-user` | `PATCH /users/{id}` accountEnabled |
| `dismiss-risky-signin` | `POST /identityProtection/riskyUsers/dismiss` |

Every call records to `wrayth_device_actions` (target_type = `user|tenant|message`) with `previous_state` snapshot for rollback awareness.

### Confirmation & preview flow

`<RemediationPreviewDialog>` — single dialog shared by all providers. Renders:

```text
Ray will:
  ✓ line 1
  ✓ line 2
Estimated time: 2m   Restart: not required   Reversible: yes
[Cancel]  [Fix Now]
```

For `typed_name` risk, requires user to type target device/user. For `two_person`, dispatches a pending approval record (deferred to Phase 2 — Phase 1 stubs the UI and records intent).

### Execution progress

`<RemediationRunner>` — streams the same 6 phases used in the spec: Connecting → Sending → Acknowledged → Applying → Verifying → Completed. Subscribes to `wrayth_device_actions` row via Supabase Realtime and updates from `status` transitions written by the executors.

### Activity Timeline

New page `src/pages/safesuite/RayRemediationTimeline.tsx` — reverse-chronological feed of every remediation across all providers. Filter by device, user, tenant, category, risk. Row layout:

```text
2:31 PM   Ray enabled Windows Firewall on R15         ok        [details]
2:34 PM   Ray revoked 3 Azure sessions for jane@…     ok        [details]
2:36 PM   Ray enabled BitLocker on R15                pending   [details]
```

Backed by `wrayth_device_actions` — no schema change beyond what's below.

### Audit log

Existing `wrayth_device_actions` already stores initiator, target, timestamps, status, error. Add columns:
- `previous_state jsonb` (snapshot before change)
- `new_state jsonb` (snapshot after)
- `duration_ms int`
- `provider text` (agent | ms365 | defender)
- `permission_scopes text[]` (which scopes were used)

### Where "Fix Now" appears (Phase 1 surfaces)

1. **Ray Recommendations** (`RayRecommendationsCard`) — swap the generic CTA for `<FixNowButton remediation={…}>` when a rec maps to a catalog slug.
2. **Device pages** — DeviceSecurityTabs posture rows get inline Fix Now.
3. **Morning Brief / Home** — `TodayPriorityCard` upgrades to actionable Fix Now for top rec.
4. **Threat Center** — findings with a mapped remediation.

Compliance failures + identity findings ride on the same component; no per-surface work beyond wiring the remediation slug.

## File map

**New**
- `src/lib/ray/remediations/types.ts` — provider-agnostic types
- `src/lib/ray/remediations/ms365.ts` — M365 catalog entries
- `src/lib/ray/remediations/providers/agent.ts`
- `src/lib/ray/remediations/providers/ms365.ts`
- `src/lib/ray/remediations/providers/index.ts` — executor registry
- `src/lib/ray/remediations/preview.ts` — preview line builders
- `src/components/ray/remediation/RemediationPreviewDialog.tsx`
- `src/components/ray/remediation/RemediationRunner.tsx`
- `src/components/ray/remediation/FixNowButton.tsx` — new unified entry point (wraps preview + runner)
- `src/components/ray/remediation/TargetPicker.tsx` — picks device / user / tenant based on `target`
- `src/pages/safesuite/RayRemediationTimeline.tsx`
- `supabase/functions/ms-graph-remediate/index.ts`

**Edited**
- `src/lib/ray/remediations/catalog.ts` — migrate to new types, keep existing slugs
- `src/components/ray/RemediationDispatchButton.tsx` — thin wrapper over `FixNowButton`
- `src/components/ray/RayRecommendationsCard.tsx` — inline Fix Now
- `src/pages/safesuite/RayRemediationLibrary.tsx` — provider filter chip
- `src/App.tsx` — route for `/app/ray/remediation-timeline`
- `src/layouts/WraythLayout.tsx` — nav entry

**Migration**
- Add `previous_state`, `new_state`, `duration_ms`, `provider`, `permission_scopes` to `wrayth_device_actions`
- Extend `target_type` check to include `user | tenant | message`

## Delivery order

1. Types + catalog migration + executor registry (no behavior change)
2. Preview dialog + runner + FixNowButton (Windows agent flows use it end-to-end)
3. `ms-graph-remediate` edge function (Entra actions first: reset password, revoke sessions, block signin, disable user)
4. M365 catalog entries + executor + target picker for users
5. Remediation Timeline page + audit column migration
6. Wire into Ray Recommendations + Device pages + Morning Brief
7. Mail actions (inbox rules, forwarding, quarantine, block sender) — last, largest Graph surface

## Explicitly out of scope for Phase 1

- Browser extension deployment / policy push (Phase 2)
- Third-party integrations (Meraki / Huntress / Datto / SentinelOne / CrowdStrike)
- Two-person approval workflow (stub UI only, records intent)
- Automated rollback runner (schema supports it, no UI yet)
- macOS / Linux agent actions

## Risks & gotchas

- **Graph token freshness**: `ms-graph-remediate` must refresh access tokens using stored refresh tokens; add helper `getFreshGraphToken(tenantId)`.
- **Permission escalation**: every M365 action declares required scopes; the executor 403s early if the tenant token lacks them and surfaces "Reconnect Microsoft 365 with these scopes: …" instead of a raw Graph error.
- **Idempotency**: dispatch keys must dedupe rapid double-clicks — reuse `wrayth_device_actions.id` UNIQUE on `(target, action_type, in-flight)`.
- **Realtime billing**: Runner subscribes per active action; unsubscribe on unmount to avoid the Realtime cost spiral called out in project memory.
