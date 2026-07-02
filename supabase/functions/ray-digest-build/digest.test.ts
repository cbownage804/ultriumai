import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { weekBounds } from "./index.ts";

// Deterministic Mon-Sun window for the previously completed week (UTC).
Deno.test("weekBounds — from a Monday returns previous Mon-Sun", () => {
  // 2026-06-29 is a Monday (UTC)
  const w = weekBounds(new Date("2026-06-29T00:00:00Z"));
  assertEquals(w.week_start, "2026-06-22");
  assertEquals(w.week_end, "2026-06-28");
});

Deno.test("weekBounds — from a Thursday returns previous Mon-Sun", () => {
  // 2026-07-02 is a Thursday (UTC)
  const w = weekBounds(new Date("2026-07-02T12:34:00Z"));
  assertEquals(w.week_start, "2026-06-22");
  assertEquals(w.week_end, "2026-06-28");
});

Deno.test("weekBounds — from a Sunday returns previous Mon-Sun (not that week)", () => {
  // 2026-07-05 is a Sunday (UTC)
  const w = weekBounds(new Date("2026-07-05T00:00:00Z"));
  assertEquals(w.week_start, "2026-06-22");
  assertEquals(w.week_end, "2026-06-28");
});

Deno.test("weekBounds — start is always Monday, end is always Sunday", () => {
  for (let d = 0; d < 30; d++) {
    const dt = new Date(Date.UTC(2026, 5, 1) + d * 86400000);
    const w = weekBounds(dt);
    assertEquals(new Date(w.week_start + "T00:00:00Z").getUTCDay(), 1, `start ${w.week_start}`);
    assertEquals(new Date(w.week_end + "T00:00:00Z").getUTCDay(), 0, `end ${w.week_end}`);
  }
});
