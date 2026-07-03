/**
 * Dynamic "you might ask" questions.
 *
 * Synthesized from the actual RayContext (score, top recommendation,
 * findings, onboarding gaps) and the current route. The chip labels are
 * short; the `prompt` we send Ray is the full sentence.
 */
import type { RayContext } from '@/lib/ray';
import type { RouteContext } from '@/lib/ray/routeContext';
import { dedupeRecs } from '@/components/ray/recDedupe';

export type SuggestedQuestion = {
  id: string;
  label: string;   // chip label
  prompt: string;  // what to send Ray
};

export function buildSuggestedQuestions(
  ctx: RayContext | null,
  route: RouteContext,
): SuggestedQuestion[] {
  const out: SuggestedQuestion[] = [];
  const score = ctx?.latestScore?.score ?? null;
  const recs = dedupeRecs(ctx?.recommendations ?? []);
  const top = recs[0];
  const findings = ctx?.findings ?? [];

  // 1. Score reality-check — always relevant when we have one.
  if (score != null && score < 100) {
    out.push({
      id: 'score-gap',
      label: `Why isn't my score ${score < 60 ? 'higher' : '100'}?`,
      prompt: `My current score is ${score}. Walk me through exactly what's keeping it there and the fastest way to raise it.`,
    });
  } else if (score != null) {
    out.push({
      id: 'score-keep',
      label: 'How do I keep my score at 100?',
      prompt: 'My score is perfect right now. What should I watch for so it stays there?',
    });
  }

  // 2. Top open recommendation — the concrete thing to fix.
  if (top) {
    out.push({
      id: `rec-${top.id}`,
      label: `Explain "${truncate(top.title, 34)}"`,
      prompt: `Explain in detail why "${top.title}" matters and what happens if I ignore it.`,
    });
  }

  // 3. Route-specific — the question a user on this page would ask.
  const routeQ = routeQuestion(route);
  if (routeQ) out.push(routeQ);

  // 4. Change / recency — "what moved?"
  out.push({
    id: 'what-changed',
    label: "What changed today?",
    prompt: "Summarize everything that changed in my environment in the last 24 hours — new findings, remediations, score movement, device check-ins.",
  });

  // 5. Findings triage if there are any.
  if (findings.length > 0) {
    out.push({
      id: 'findings-triage',
      label: findings.length === 1 ? 'Walk me through my finding' : `Triage my ${findings.length} findings`,
      prompt: findings.length === 1
        ? 'I have one open finding. Walk me through it and how to resolve it.'
        : `I have ${findings.length} open findings. Group them by priority and tell me which one to fix first.`,
    });
  }

  // 6. Vulnerable devices — always useful for MSP-shaped users.
  if (route.area === 'devices' || route.area === 'device' || route.area === 'dashboard') {
    out.push({
      id: 'vuln-devices',
      label: 'Which devices are most vulnerable?',
      prompt: 'Rank my devices from most to least vulnerable right now and tell me why for the top three.',
    });
  }

  return dedupeById(out).slice(0, 5);
}

function routeQuestion(route: RouteContext): SuggestedQuestion | null {
  switch (route.area) {
    case 'threats':
      return {
        id: 'threats-summary',
        label: 'Any active campaigns targeting me?',
        prompt: 'Summarize the threat feeds you monitor and tell me whether any active campaign is likely to affect my environment.',
      };
    case 'exposure':
      return {
        id: 'exposure-worst',
        label: 'Which exposure is the worst?',
        prompt: 'Of my exposed identifiers, which single exposure is the highest risk and what should I do about it first?',
      };
    case 'passwords':
      return {
        id: 'passwords-worst',
        label: 'Which passwords should I rotate first?',
        prompt: 'Rank my passwords by risk (reused, weak, breached) and tell me which ones to rotate first.',
      };
    case 'identity':
      return {
        id: 'identity-privilege',
        label: 'Who has too much access?',
        prompt: 'Show me identities with excessive or unused privilege and explain which ones to trim first.',
      };
    case 'microsoft365':
      return {
        id: 'm365-changed',
        label: 'What changed in my tenant?',
        prompt: "Summarize what's changed in my Microsoft 365 tenant since yesterday — sign-ins, MFA coverage, admin activity, new consent grants.",
      };
    case 'device':
      return {
        id: 'device-audit',
        label: `Is ${route.areaLabel} audit-compliant?`,
        prompt: `Compare ${route.areaLabel} against a common security baseline (BitLocker, Defender, updates, screen lock, firewall) and tell me what's missing.`,
      };
    case 'devices':
      return {
        id: 'devices-diff',
        label: 'What differs between my devices?',
        prompt: 'Compare my enrolled devices and highlight the meaningful differences in posture — the outliers I should look at.',
      };
    case 'trust':
      return {
        id: 'trust-audit',
        label: 'Am I audit ready?',
        prompt: "Give me an honest read on whether I'm audit-ready right now, and list the gaps I'd fail on.",
      };
    default:
      return null;
  }
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function dedupeById(qs: SuggestedQuestion[]): SuggestedQuestion[] {
  const seen = new Set<string>();
  const out: SuggestedQuestion[] = [];
  for (const q of qs) {
    if (seen.has(q.id)) continue;
    seen.add(q.id);
    out.push(q);
  }
  return out;
}
