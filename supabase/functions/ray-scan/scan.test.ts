import { assertEquals, assertNotEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { fingerprintOf } from "./index.ts";

const baseRec = {
  category: "device" as const,
  severity: "warn" as const,
  rule_slug: "bitlocker_off",
  subject_type: "device",
  subject_id: "dev-1",
  title: "irrelevant to fingerprint",
  body: "irrelevant",
};

Deno.test("fingerprintOf — deterministic across identical inputs", async () => {
  const a = await fingerprintOf("user-1", "org-1", baseRec);
  const b = await fingerprintOf("user-1", "org-1", baseRec);
  assertEquals(a, b);
});

Deno.test("fingerprintOf — changes when subject changes", async () => {
  const a = await fingerprintOf("user-1", "org-1", baseRec);
  const b = await fingerprintOf("user-1", "org-1", { ...baseRec, subject_id: "dev-2" });
  assertNotEquals(a, b);
});

Deno.test("fingerprintOf — changes when rule changes", async () => {
  const a = await fingerprintOf("user-1", "org-1", baseRec);
  const b = await fingerprintOf("user-1", "org-1", { ...baseRec, rule_slug: "defender_off" });
  assertNotEquals(a, b);
});

Deno.test("fingerprintOf — ignores title/body/severity churn", async () => {
  const a = await fingerprintOf("user-1", "org-1", baseRec);
  const b = await fingerprintOf("user-1", "org-1", {
    ...baseRec,
    severity: "danger" as const,
    title: "different title",
    body: "different body",
  });
  assertEquals(a, b);
});

Deno.test("fingerprintOf — differs across users and orgs", async () => {
  const a = await fingerprintOf("user-1", "org-1", baseRec);
  const b = await fingerprintOf("user-2", "org-1", baseRec);
  const c = await fingerprintOf("user-1", "org-2", baseRec);
  assertNotEquals(a, b);
  assertNotEquals(a, c);
});

Deno.test("fingerprintOf — null org treated as literal placeholder", async () => {
  const a = await fingerprintOf("user-1", null, baseRec);
  const b = await fingerprintOf("user-1", "-", baseRec);
  // '-' collides with null placeholder — this is by design (documented) but
  // guarded here so any future divergence is intentional.
  assertEquals(a, b);
});
