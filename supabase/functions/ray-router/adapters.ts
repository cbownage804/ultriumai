// Delivery adapters: RayResponse -> Teams Adaptive Cards / Slack Block Kit.
// Pure functions, no I/O. External delivery limits actions to navigate/external only.
import type { RayResponse, RayAction, RayCard } from "./_lib.ts";

const SEVERITY_COLORS: Record<string, string> = {
  info: "default",
  success: "good",
  warn: "warning",
  danger: "attention",
};

const SEVERITY_EMOJI: Record<string, string> = {
  info: "ℹ️",
  success: "✅",
  warn: "⚠️",
  danger: "🚨",
};

/** Only navigate + external actions are safe for external delivery.
 *  run_action and open_playbook require in-app confirmation, so we drop them. */
export function filterExternalActions(actions: RayAction[] | undefined): RayAction[] {
  return (actions ?? []).filter(
    (a) => a.intent === "navigate" || a.intent === "external",
  );
}

function resolveActionUrl(action: RayAction, appBaseUrl: string): string {
  if (action.intent === "external" || /^https?:\/\//.test(action.target)) {
    return action.target;
  }
  const base = appBaseUrl.replace(/\/+$/, "");
  const path = action.target.startsWith("/") ? action.target : `/${action.target}`;
  return `${base}${path}`;
}

// ---------------- Teams Adaptive Card ----------------
export function toTeamsAdaptiveCard(
  r: RayResponse,
  opts: { appBaseUrl: string },
): Record<string, unknown> {
  const body: Record<string, unknown>[] = [
    {
      type: "TextBlock",
      text: `Ray · ${r.skill}`,
      weight: "Bolder",
      size: "Small",
      color: "Accent",
      isSubtle: true,
    },
    { type: "TextBlock", text: r.message, wrap: true, size: "Medium" },
  ];

  for (const card of r.cards ?? []) {
    body.push(...renderTeamsCard(card));
  }

  if (r.sources?.length) {
    body.push({
      type: "TextBlock",
      text: "Sources",
      weight: "Bolder",
      spacing: "Medium",
      size: "Small",
    });
    body.push({
      type: "TextBlock",
      text: r.sources
        .map((s) => (s.url ? `[${s.label}](${s.url})` : `• ${s.label}`))
        .join("\n"),
      wrap: true,
      size: "Small",
      isSubtle: true,
    });
  }

  const actions = filterExternalActions(r.actions).map((a) => ({
    type: "Action.OpenUrl",
    title: a.label,
    url: resolveActionUrl(a, opts.appBaseUrl),
  }));

  return {
    type: "AdaptiveCard",
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    version: "1.4",
    body,
    ...(actions.length ? { actions } : {}),
  };
}

function renderTeamsCard(card: RayCard): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const color = SEVERITY_COLORS[card.severity ?? "info"] ?? "default";
  if (card.title) {
    out.push({
      type: "TextBlock",
      text: `${SEVERITY_EMOJI[card.severity ?? "info"]} ${card.title}`,
      weight: "Bolder",
      color,
      spacing: "Medium",
      wrap: true,
    });
  }
  if (card.body) {
    out.push({ type: "TextBlock", text: card.body, wrap: true, size: "Small" });
  }
  if (card.fields?.length) {
    out.push({
      type: "FactSet",
      facts: card.fields.map((f) => ({ title: f.label, value: f.value })),
    });
  }
  return out;
}

// ---------------- Slack Block Kit ----------------
export function toSlackBlocks(
  r: RayResponse,
  opts: { appBaseUrl: string },
): Record<string, unknown>[] {
  const blocks: Record<string, unknown>[] = [
    {
      type: "context",
      elements: [{ type: "mrkdwn", text: `*Ray* · _${r.skill}_` }],
    },
    { type: "section", text: { type: "mrkdwn", text: escapeMrkdwn(r.message) } },
  ];

  for (const card of r.cards ?? []) {
    blocks.push({ type: "divider" });
    const emoji = SEVERITY_EMOJI[card.severity ?? "info"];
    if (card.title) {
      blocks.push({
        type: "section",
        text: { type: "mrkdwn", text: `${emoji} *${escapeMrkdwn(card.title)}*` },
      });
    }
    if (card.body) {
      blocks.push({
        type: "section",
        text: { type: "mrkdwn", text: escapeMrkdwn(card.body) },
      });
    }
    if (card.fields?.length) {
      blocks.push({
        type: "section",
        fields: card.fields.slice(0, 10).map((f) => ({
          type: "mrkdwn",
          text: `*${escapeMrkdwn(f.label)}*\n${escapeMrkdwn(f.value)}`,
        })),
      });
    }
  }

  if (r.sources?.length) {
    blocks.push({ type: "divider" });
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text:
            "*Sources:* " +
            r.sources
              .map((s) => (s.url ? `<${s.url}|${escapeMrkdwn(s.label)}>` : escapeMrkdwn(s.label)))
              .join(" · "),
        },
      ],
    });
  }

  const actions = filterExternalActions(r.actions);
  if (actions.length) {
    blocks.push({
      type: "actions",
      elements: actions.slice(0, 5).map((a) => ({
        type: "button",
        text: { type: "plain_text", text: a.label },
        url: resolveActionUrl(a, opts.appBaseUrl),
        action_id: `ray_${a.id}`,
      })),
    });
  }

  if (r.follow_ups?.length) {
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "_Try: " + r.follow_ups.slice(0, 3).map(escapeMrkdwn).join(" · ") + "_",
        },
      ],
    });
  }

  return blocks;
}

function escapeMrkdwn(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
