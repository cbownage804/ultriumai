/**
 * Unit tests for TimelineFilters reducer semantics — toggling severities
 * should add/remove without duplicating.
 */
import { describe, it, expect } from "vitest";

type Severity = "info" | "success" | "warn" | "danger";

function toggle(current: Severity[], s: Severity): Severity[] {
  return current.includes(s) ? current.filter((x) => x !== s) : [...current, s];
}

describe("timeline filter toggle", () => {
  it("adds a severity when absent", () => {
    expect(toggle([], "danger")).toEqual(["danger"]);
    expect(toggle(["info"], "warn")).toEqual(["info", "warn"]);
  });
  it("removes a severity when present", () => {
    expect(toggle(["danger"], "danger")).toEqual([]);
    expect(toggle(["info", "warn"], "info")).toEqual(["warn"]);
  });
  it("never duplicates", () => {
    const once = toggle([], "danger");
    const twice = toggle(once, "danger");
    const thrice = toggle(twice, "danger");
    expect(thrice).toEqual(["danger"]);
  });
});
