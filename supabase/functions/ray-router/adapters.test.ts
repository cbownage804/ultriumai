import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { filterExternalActions, toSlackBlocks, toTeamsAdaptiveCard } from "./adapters.ts";
import type { RayResponse } from "./_lib.ts";

const sample: RayResponse = {
  skill: "device",
  message: "Your fleet has 2 unencrypted devices.",
  cards: [
    {
      title: "Encryption",
      body: "BitLocker off on 2 endpoints",
      severity: "warn",
      fields: [{ label: "Total", value: "5" }, { label: "At risk", value: "2" }],
    },
  ],
  actions: [
    { id: "open", label: "Open fleet", intent: "navigate", target: "/app/vanguard/devices" },
    { id: "run", label: "Enable BitLocker", intent: "run_action", target: "enable_bitlocker", risk: "high" },
    { id: "docs", label: "Docs", intent: "external", target: "https://wrayth.ai/docs" },
  ],
  sources: [{ kind: "kb_wrayth", label: "BitLocker guide", url: "https://wrayth.ai/kb/bl" }],
  follow_ups: ["show weak passwords"],
};

Deno.test("filterExternalActions strips run_action / open_playbook", () => {
  const kept = filterExternalActions(sample.actions);
  assertEquals(kept.length, 2);
  assert(kept.every((a) => a.intent === "navigate" || a.intent === "external"));
});

Deno.test("teams adaptive card is v1.4 with resolved navigate URL", () => {
  const card = toTeamsAdaptiveCard(sample, { appBaseUrl: "https://wrayth.ai" });
  assertEquals(card.type, "AdaptiveCard");
  assertEquals(card.version, "1.4");
  const actions = card.actions as Array<{ type: string; url: string; title: string }>;
  assertEquals(actions.length, 2);
  assertEquals(actions[0].url, "https://wrayth.ai/app/vanguard/devices");
  assertEquals(actions[1].url, "https://wrayth.ai/docs");
  assert(actions.every((a) => a.type === "Action.OpenUrl"));
});

Deno.test("slack blocks include header, cards, sources, actions", () => {
  const blocks = toSlackBlocks(sample, { appBaseUrl: "https://wrayth.ai" });
  const types = blocks.map((b) => b.type);
  assert(types.includes("section"));
  assert(types.includes("actions"));
  assert(types.includes("context"));
  const actionsBlock = blocks.find((b) => b.type === "actions") as {
    elements: Array<{ url: string; action_id: string }>;
  };
  assertEquals(actionsBlock.elements.length, 2);
  assertEquals(actionsBlock.elements[0].url, "https://wrayth.ai/app/vanguard/devices");
  assert(actionsBlock.elements[0].action_id.startsWith("ray_"));
});

Deno.test("empty response still renders minimal card/blocks", () => {
  const r: RayResponse = { skill: "knowledge", message: "No answer available." };
  const card = toTeamsAdaptiveCard(r, { appBaseUrl: "https://wrayth.ai" });
  assert(Array.isArray((card as { body: unknown[] }).body));
  assert(!("actions" in card));
  const blocks = toSlackBlocks(r, { appBaseUrl: "https://wrayth.ai" });
  assert(blocks.length >= 2);
});
