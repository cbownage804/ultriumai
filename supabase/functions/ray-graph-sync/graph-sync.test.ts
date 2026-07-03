/**
 * ray-graph-sync unit tests — verify dedup_key shape stability. Idempotency
 * of the projection is enforced upstream by the (org_id, type, external_id)
 * uniqueness index on ray_entities and the dedup_key partial unique index on
 * ray_events; here we just guarantee the keys we mint are deterministic.
 */
import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";

function recOpenedKey(recId: string) {
  return `rec:${recId}:opened`;
}
function recResolvedKey(recId: string, completedAt: string) {
  return `rec:${recId}:resolved:${completedAt}`;
}
function legacyKey(id: string) {
  return `legacy:${id}`;
}

Deno.test("dedup keys are deterministic", () => {
  const id = "abc-123";
  assertEquals(recOpenedKey(id), "rec:abc-123:opened");
  assertEquals(recOpenedKey(id), recOpenedKey(id));
  assertEquals(recResolvedKey(id, "2026-07-03T00:00:00Z"), "rec:abc-123:resolved:2026-07-03T00:00:00Z");
  assertEquals(legacyKey(id), "legacy:abc-123");
});

Deno.test("rec resolved key changes only when completion time changes", () => {
  const a = recResolvedKey("x", "2026-07-03T00:00:00Z");
  const b = recResolvedKey("x", "2026-07-03T00:00:00Z");
  const c = recResolvedKey("x", "2026-07-04T00:00:00Z");
  assertEquals(a, b);
  assertEquals(a === c, false);
});
