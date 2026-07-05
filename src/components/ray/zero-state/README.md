# Wrayth Three-State UI Standard

**Every data-driven page or section in Wrayth renders EXACTLY ONE of three states. There is never a fourth "placeholder / sample / demo" state.**

| State | When | Renders |
|---|---|---|
| **Loading** | Query in flight OR Ray is actively working (scan/investigation/skill running server-side) | `<Skeleton>` or spinner + optional Ray-voice status ("I'm analyzing that now…") |
| **Empty** | Query resolved with **zero rows** AND nothing in progress | `<RayZeroState>` — Ray-voice explanation of what will appear + concrete next-action CTA |
| **Active** | Query resolved with **≥1 real row** | Real data. Charts, tables, metrics — every value bound to a live query |

Full rule: `mem://preferences/wrayth-three-state-ui`
Zero-fake-data policy: `mem://constraints/wrayth-no-fake-data`

---

## The primitives

All under `src/components/ray/zero-state/` and `src/components/ui/page-state.tsx`.

```tsx
import { PageState } from '@/components/ui/page-state';
import { RayZeroState, useHasAnyData } from '@/components/ray/zero-state';
```

- **`<PageState state? isLoading? isProcessing? hasData? loading empty>{active}</PageState>`** — the switch. Renders exactly one branch.
- **`usePageState({ isLoading, hasData, isProcessing })`** — the discriminant, when you need it without JSX composition.
- **`<RayZeroState title body expectations action secondaryAction icon size>`** — the canonical empty state.
- **`<RaySetupChecklist steps? />`** — real setup progress (probes `wrayth_devices`, `safeweb_assets`, `safepass_entries` with `count/head`).
- **`<RayNextAction />`** — the single highest-value next step, computed live. Renders nothing when everything is done — never fake activity to fill space.
- **`useHasAnyData(table, { filters, enabled })`** — cheap `count: 'exact', head: true` probe.

---

## ✅ Correct — using PageState

```tsx
export default function Devices() {
  const { user } = useAuth();
  const { hasData, isLoading } = useHasAnyData('wrayth_devices', {
    filters: [{ column: 'user_id', op: 'eq', value: user?.id }],
    enabled: !!user?.id,
  });

  return (
    <PageState
      isLoading={isLoading}
      hasData={hasData}
      loading={<Skeleton className="h-48 w-full" />}
      empty={
        <RayZeroState
          title="I'm waiting for your first device to check in."
          body="Install the Wrayth agent on a machine and it will report posture and findings here automatically."
          expectations={[
            'Real-time device posture (OS, encryption, EDR).',
            'A live per-device security score you can drill into.',
          ]}
          action={{ label: 'Download the agent', href: '/app/devices/download' }}
        />
      }
    >
      <EnrolledDevicesList />
    </PageState>
  );
}
```

## ✅ Correct — a metric card with no signal

```tsx
const hasSignal = mrr > 0 || paidSubs > 0 || Object.keys(planMix).length > 0;

<PageState
  isLoading={loading}
  hasData={hasSignal}
  loading={<SkeletonGrid />}
  empty={
    <RayZeroState
      title="No billing activity yet."
      body="This dashboard populates from real Stripe events. Wrayth won't pretend otherwise with a wall of '$0' tiles."
    />
  }
>
  <MetricGrid mrr={mrr} arr={arr} paidSubs={paidSubs} />
</PageState>
```

---

## ❌ Forbidden

### Fake row fixtures rendered as if real

```tsx
// NEVER DO THIS
{[
  { name: 'Alice Johnson', email: 'alice@company.com', mfa: true },
  { name: 'Bob Williams', email: 'bob@company.com', mfa: false },
].map((u) => <UserRow key={u.email} user={u} />)}
```

### Zero-valued metrics rendered as meaningful

```tsx
// NEVER DO THIS — a $0 MRR tile in production looks like a real number
<MetricCard label="MRR" value={`$${mrr.toLocaleString()}`} />
```

Wrap it in `<PageState>` with `hasData={mrr > 0}`.

### Random/hardcoded telemetry

```tsx
// NEVER DO THIS — Math.random() is not "sample data", it's fake data
const cpu = Math.round(Math.random() * 100);
<Sparkline data={Array.from({ length: 30 }, () => Math.random())} />
```

### Skeleton left visible after data resolves

```tsx
// WRONG — Loading and Empty are DIFFERENT states. Distinguish them.
{loading || !data.length ? <Skeleton /> : <List data={data} />}

// RIGHT
<PageState isLoading={loading} hasData={data.length > 0} loading={<Skeleton />} empty={<RayZeroState … />}>
  <List data={data} />
</PageState>
```

### Lorem ipsum, "Acme Corp Inc", "John Doe" rendered as data

Placeholder text inside `<input placeholder="…">` is fine — that's UX hint text.
Rendering those strings as if they were the customer's actual data is not.

---

## Grep checklist — run before every PR

```bash
# 1. No hardcoded fixture arrays in product surfaces.
rg -n --multiline "const \w+(Data|List|Items|Threats|Devices|Alerts|Reports|Investigations|Policies|Findings|Users|Identities|Malware|AttackPaths)\s*[:=]\s*\[\s*\{" \
   src/pages/safesuite src/pages/admin src/components/ray src/components/intelligence

# 2. No random telemetry.
rg -n "Math\.random\(\)" src/pages src/components/ray src/components/admin src/components/intelligence

# 3. No obvious fake names/emails outside marketing and input placeholders.
rg -n "john\.?doe|jane\.?doe|alice@company|bob@company|acme corp" \
   src/pages/safesuite src/pages/admin src/components/ray

# 4. No lorem ipsum.
rg -in "lorem ipsum|dolor sit amet" src/pages src/components

# 5. No skeletons rendered without a hasData branch.
#    Manually check each new usage of <Skeleton/> pairs with a PageState empty prop.
rg -n "<Skeleton" src/pages src/components/admin
```

Any hit outside `src/dev/`, `src/components/demos/`, or public marketing routes (`src/pages/*.tsx` at the top level: WraythLanding, WraythResources, WraythEnterprise, etc.) is a bug. Fix or move to `src/dev/`.

---

## PR checklist

Copy this into every PR that touches a Wrayth product surface:

- [ ] **Every data-driven section renders Loading, Empty, and Active** — no fourth state.
- [ ] **Empty branch uses `<RayZeroState>`** with Ray-voice copy and a concrete next-action CTA.
- [ ] **No fake rows, fake metrics, fake charts, fake users, fake threats, fake devices, or fake activity** anywhere in the diff.
- [ ] **Skeletons disappear** the moment data is confirmed empty (they don't linger as pseudo-data).
- [ ] **Zero-valued metrics** are not displayed as meaningful — wrapped in `<PageState>` with a `hasData` check.
- [ ] `Math.random()` used only for animation/UI (confetti, progress ticks) — never for telemetry.
- [ ] Grep checklist above returned zero hits (or all hits are inside `src/dev/` / marketing routes).

---

## Where to file exceptions

Storybook, dev tools, and marketing-only surfaces may use illustrative data. They must live under one of:

- `src/dev/**` — dev-only utilities, never imported by product routes.
- `src/components/demos/**` — marketing-page demonstrations only.
- Public marketing pages (`WraythLanding`, `WraythFeatures`, `WraythEnterprise`, `WraythResources`, `/pricing`, `/products/*`).

Product routes (`/app/**`, `/admin/**`) — no exceptions.
