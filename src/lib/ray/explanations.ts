/**
 * Ray explanations — small helpers that turn Ray signals (a recommendation,
 * a severity, a score) into the title/body/bullets shape ExplainThis wants.
 * Pure functions so any surface can wire in "Explain" without duplicating
 * the same phrasing.
 */

export interface ExplainPayload {
  title: string;
  body?: string;
  bullets?: string[];
}

export interface RecommendationLike {
  title: string;
  body?: string | null;
  priority?: number | null;
  objective?: string | null;
  page_context?: string | null;
}

export function explainRecommendation(rec: RecommendationLike): ExplainPayload {
  const priority = rec.priority ?? 0;
  const priorityLine =
    priority >= 70
      ? "I ranked this critical — it protects an account, identity, or device that's already exposed."
      : priority >= 40
        ? 'This is a warning. Not urgent tonight, but I want it off your plate this week.'
        : 'This is a stable-quality nudge. Handle it when you have a moment.';

  const bullets = [priorityLine];
  if (rec.objective) {
    bullets.push(`I only surface one recommendation per objective (${rec.objective.replace(/_/g, ' ')}), so this one replaces every duplicate.`);
  }
  if (rec.page_context) {
    bullets.push(`"Open" jumps you to ${rec.page_context.replace(/^\//, '').replace(/[/-]/g, ' ')} where the fix lives.`);
  }
  bullets.push('Start hands it to me and I run the playbook. Mark handled if you fixed it yourself.');

  return {
    title: `Why I'm recommending this`,
    body: rec.body ?? undefined,
    bullets,
  };
}

export function explainSeverity(severity: 'critical' | 'high' | 'medium' | 'low' | 'info' | string): ExplainPayload {
  switch (severity) {
    case 'critical':
    case 'high':
      return {
        title: 'Why this is critical',
        body: "Ray only flags something critical when it can be exploited today with data or tooling already in the wild.",
        bullets: [
          'A credential, identity, or device is exposed right now.',
          'Every hour of delay increases the blast radius.',
          "I'll walk you through the fix if you tap Start.",
        ],
      };
    case 'medium':
      return {
        title: 'Why this is a warning',
        body: "This isn't an active incident, but Ray sees a pattern that usually precedes one.",
        bullets: [
          'The signal is real but the risk hasn\u2019t materialized.',
          'Fix it this week to keep it from escalating.',
        ],
      };
    default:
      return {
        title: 'Why Ray is watching this',
        body: 'Ray notes low-signal events so you have context if the picture changes later.',
      };
  }
}

export function explainScore(score: number): ExplainPayload {
  const band = score >= 85 ? 'strong' : score >= 65 ? 'stable' : score >= 40 ? 'watch' : 'at risk';
  return {
    title: `Your score is ${band}`,
    body: 'Ray blends password health, identity exposure, and device posture into a single 0-100 view.',
    bullets: [
      'Password health is entropy, reuse, breach hits, and age.',
      'Identity exposure counts breaches tied to emails and domains Ray watches.',
      'Device posture reflects agent check-ins, patch level, and antivirus state.',
      band === 'at risk'
        ? "I'll always show the fastest fix that moves this number up."
        : "I only move the number when a real signal changes — not just noise.",
    ],
  };
}
