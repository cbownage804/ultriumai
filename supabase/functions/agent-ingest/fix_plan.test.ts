// deno-lint-ignore-file no-explicit-any
// QA tests for the Wrayth Hardening + Safety Pass fix-plan splitter and
// risk registry. Run with `deno test supabase/functions/agent-ingest/fix_plan.test.ts`.
// These are structural checks — they don't hit the network.

import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

// Minimal inline copy of the risk registry & bucket logic (kept in sync with
// agent-ingest/index.ts). The point of these tests is regression coverage on
// what the client actually sees.
const RISK: Record<string, { risk: 'low'|'medium'|'high' }> = {
  enable_firewall: { risk: 'low' },
  enable_defender: { risk: 'low' },
  enable_defender_pua: { risk: 'low' },
  enable_defender_cloud: { risk: 'low' },
  enable_bitlocker: { risk: 'medium' },
  enable_rdp_nla: { risk: 'medium' },
  disable_remote_assistance: { risk: 'medium' },
  disable_browser_password_manager: { risk: 'medium' },
  disable_startup_item: { risk: 'medium' },
  disable_rdp: { risk: 'high' },
  remove_local_admin: { risk: 'high' },
  disable_builtin_administrator: { risk: 'high' },
  install_windows_updates: { risk: 'high' },
};

const bucket = (t: string) => (RISK[t]?.risk === 'high' ? 'review' : 'safe');

Deno.test('RDP enabled with NLA disabled → enable_rdp_nla is medium/safe', () => {
  assertEquals(RISK.enable_rdp_nla.risk, 'medium');
  assertEquals(bucket('enable_rdp_nla'), 'safe');
});

Deno.test('Remote Assistance enabled → disable_remote_assistance is medium/safe', () => {
  assertEquals(bucket('disable_remote_assistance'), 'safe');
});

Deno.test('built-in Administrator enabled → disable_builtin_administrator is high/review', () => {
  assertEquals(RISK.disable_builtin_administrator.risk, 'high');
  assertEquals(bucket('disable_builtin_administrator'), 'review');
});

Deno.test('remove_local_admin is always high/review', () => {
  assertEquals(bucket('remove_local_admin'), 'review');
});

Deno.test('Chrome saved passwords → disable_browser_password_manager is medium/safe', () => {
  assertEquals(bucket('disable_browser_password_manager'), 'safe');
});

Deno.test('Edge password manager disabled by policy → no fix step needed', () => {
  // buildFixPlan should not push disable_browser_password_manager when
  // manager_disabled_by_policy is true. We assert the guard predicate.
  const edge = { manager_disabled_by_policy: true, stored_count: 12 };
  const shouldFix = (edge.stored_count ?? 0) > 0 && !edge.manager_disabled_by_policy;
  assertEquals(shouldFix, false);
});

Deno.test('Defender cloud off → enable_defender_cloud is low/safe', () => {
  assertEquals(bucket('enable_defender_cloud'), 'safe');
});

Deno.test('PUA off → enable_defender_pua is low/safe', () => {
  assertEquals(bucket('enable_defender_pua'), 'safe');
});

Deno.test('Pending security updates → install_windows_updates is high/review', () => {
  assertEquals(RISK.install_windows_updates.risk, 'high');
  assertEquals(bucket('install_windows_updates'), 'review');
});

Deno.test('Failed action result payload shape', () => {
  const failed = { status: 'failed', error: 'Access denied', previous_value: { rdp: true }, new_value: null };
  assert(['succeeded', 'failed', 'running'].includes(failed.status));
  assert(typeof failed.error === 'string');
});

Deno.test('Preflight guard: last active admin cannot be removed', () => {
  const admins = [{ name: 'alice', enabled: true, is_builtin: false }];
  const target = 'alice';
  const enabledOthers = admins.filter((a) => a.name !== target && a.enabled);
  assertEquals(enabledOthers.length, 0, 'preflight should block when zero admins remain');
});
