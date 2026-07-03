/**
 * Route-aware context for Ray.
 *
 * Maps the current pathname to:
 *  - `area`: a coarse label used for switch-style logic elsewhere
 *  - `greetingSubline(name)`: the second line Ray says when the panel opens
 *    ("You're reviewing Threat Center…", "You're looking at R15…", etc.)
 *  - `statusPool`: the rotating verbs the floating launcher cycles through
 *    ("Watching", "Reviewing devices", "Scanning M365"…)
 *
 * The goal is that Ray always sounds like it knows where the user is,
 * without requiring the user to tell it.
 */

export type RayArea =
  | 'dashboard'
  | 'threats'
  | 'exposure'
  | 'devices'
  | 'device'
  | 'passwords'
  | 'identity'
  | 'microsoft365'
  | 'reports'
  | 'trends'
  | 'trust'
  | 'integrations'
  | 'ray'
  | 'timeline'
  | 'other';

export type QuickAction = {
  label: string;
  emoji: string;
  prompt: string;
};

export type RouteContext = {
  area: RayArea;
  /** Short human name of the area, e.g. "Threat Center". */
  areaLabel: string;
  /** Second line under the greeting. */
  subline: string;
  /** Verbs the floating launcher cycles through while idle. */
  statusPool: string[];
  /** Route-specific quick action chips shown above suggested questions. */
  quickActions: QuickAction[];
};

function pickDeviceHost(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    // Common patterns: ?device=R15, ?hostname=R15, #R15
    const url = new URL(window.location.href);
    const q =
      url.searchParams.get('device') ||
      url.searchParams.get('hostname') ||
      url.searchParams.get('host');
    if (q) return q;
    if (url.hash && url.hash.length > 1 && /^[A-Za-z0-9._-]+$/.test(url.hash.slice(1))) {
      return url.hash.slice(1);
    }
  } catch {
    /* noop */
  }
  return null;
}

/** Small helper so per-area blocks stay short. */
const qa = (label: string, emoji: string, prompt: string): QuickAction => ({ label, emoji, prompt });

/** Fallback shown when a route doesn't declare its own quick actions. */
const GLOBAL_QUICK_ACTIONS: QuickAction[] = [
  qa('Explain my score', '📊', 'Explain my security score and how to improve it.'),
  qa('Fix safe issues', '✨', "Fix every safe, low-risk issue on my environment now."),
  qa('Security check', '🔍', "Run a security check across everything you can reach and summarize what needs attention."),
  qa('Compare devices', '💻', "Compare my enrolled devices and highlight the meaningful differences in posture."),
];

export function getRouteContext(pathname: string): RouteContext {
  const p = pathname.toLowerCase();

  if (p.startsWith('/app/threats')) {
    return {
      area: 'threats',
      areaLabel: 'Threat Center',
      subline: "You're reviewing Threat Center. I've been watching the feeds — I'll flag anything unusual here.",
      statusPool: ['Watching threats', 'Scanning feeds', 'Reviewing verdicts', 'Comparing IOCs'],
      quickActions: [
        qa('Any active campaigns?', '🛡', 'Summarize the threat feeds you monitor and tell me whether any active campaign is likely to affect me.'),
        qa('Scan a URL', '🌐', 'I want to scan a URL. What do you need from me?'),
        qa('Analyze an email', '✉️', 'I want to analyze a suspicious email. What do you need from me?'),
        qa('Explain latest verdict', '🔎', 'Explain the most recent threat verdict you produced and what I should do about it.'),
      ],
    };
  }
  if (p.startsWith('/app/exposure')) {
    return {
      area: 'exposure',
      areaLabel: 'Identity Monitoring',
      subline: "You're on Identity Monitoring. I've been comparing your monitored identities against fresh breach feeds.",
      statusPool: ['Comparing breach feeds', 'Checking monitored identities', 'Scanning for breaches', 'Watching leaks'],
      quickActions: [
        qa('Highest-risk breach', '⚠️', 'Of my monitored identities, which single breach is the highest risk and what should I do about it first?'),
        qa('What changed this week?', '📅', 'Summarize new breaches on my monitored identities in the last 7 days.'),
        qa('Add an identifier', '➕', 'Walk me through adding a new identifier (email, domain, phone) for you to monitor.'),
      ],
    };
  }
  if (p.startsWith('/app/passwords')) {
    return {
      area: 'passwords',
      areaLabel: 'Password Health',
      subline: "You're in Password Health. I'll help you find weak, reused or exposed credentials.",
      statusPool: ['Reviewing passwords', 'Comparing breach feeds', 'Checking reuse', 'Watching vault'],
      quickActions: [
        qa('Rotate first', '🔑', 'Rank my passwords by risk (reused, weak, breached) and tell me which ones to rotate first.'),
        qa('Any breached?', '🚨', "List any of my passwords that have appeared in a known breach and how to respond."),
        qa('Reused passwords', '♻️', 'Show me every password I reuse across accounts, ordered by blast radius.'),
      ],
    };
  }
  if (p.startsWith('/app/identity')) {
    return {
      area: 'identity',
      areaLabel: 'Identity',
      subline: "You're on Identity. I've been mapping who has access to what across your tenant.",
      statusPool: ['Reviewing identity graph', 'Checking sessions', 'Watching sign-ins'],
      quickActions: [
        qa('Too much access', '👤', 'Show me identities with excessive or unused privilege and explain which ones to trim first.'),
        qa('MFA coverage', '🛡', 'Give me the current MFA coverage across my identities and who is still missing it.'),
        qa('Recent sign-ins', '📥', 'Summarize unusual sign-in activity in the last 24 hours.'),
      ],
    };
  }
  if (p.startsWith('/app/devices')) {
    const host = pickDeviceHost();
    if (host) {
      return {
        area: 'device',
        areaLabel: host,
        subline: `You're looking at ${host}. I've reviewed its posture — ask me anything about this machine.`,
        statusPool: [`Reviewing ${host}`, 'Checking updates', 'Comparing baseline', 'Watching endpoint'],
        quickActions: [
          qa('Harden this PC', '⚙️', `Harden ${host}: walk me through every safe change you'd apply and what it would raise my score by.`),
          qa('Audit compliant?', '📋', `Compare ${host} against a common security baseline and tell me what's missing.`),
          qa("What's dangerous here?", '⚠️', `List what's genuinely dangerous on ${host} right now, ordered by severity.`),
          qa('Compare vs others', '🔀', `Compare ${host} against my other devices and highlight what's different.`),
        ],
      };
    }
    return {
      area: 'devices',
      areaLabel: 'Devices',
      subline: "You're on Devices. I've checked every enrolled endpoint since your last visit.",
      statusPool: ['Reviewing devices', 'Checking endpoints', 'Comparing baselines', 'Watching agents'],
      quickActions: [
        qa('Most vulnerable', '💻', 'Rank my devices from most to least vulnerable right now and tell me why for the top three.'),
        qa('Compare devices', '🔀', 'Compare my enrolled devices and highlight the meaningful differences in posture.'),
        qa('Anything offline?', '🕒', 'List any devices that have not checked in recently and how long they have been offline.'),
      ],
    };
  }
  if (p.startsWith('/app/integrations') || p.includes('microsoft') || p.includes('m365') || p.includes('/365')) {
    return {
      area: 'microsoft365',
      areaLabel: 'Microsoft 365',
      subline: "You're in Microsoft 365. I've reviewed your tenant — here's what changed since yesterday.",
      statusPool: ['Scanning M365', 'Reviewing tenant', 'Checking sign-ins', 'Watching Entra'],
      quickActions: [
        qa('What changed?', '📅', "Summarize what's changed in my Microsoft 365 tenant since yesterday — sign-ins, MFA coverage, admin activity, new consent grants."),
        qa('Tenant risks', '🛡', 'Give me the top risks in my Microsoft 365 tenant right now and how to address each.'),
        qa('Admin activity', '👑', 'Summarize privileged admin activity in the last 24 hours.'),
      ],
    };
  }
  if (p.startsWith('/app/reports')) {
    return {
      area: 'reports',
      areaLabel: 'Reports',
      subline: "You're on Reports. Ask me to summarize any timeframe or export a briefing.",
      statusPool: ['Preparing reports', 'Summarizing posture', 'Watching trends'],
      quickActions: [
        qa('This week', '🗓', 'Summarize my security posture over the last 7 days as an executive briefing.'),
        qa('Cyber insurance', '📑', 'Prepare an evidence summary I could hand to a cyber-insurance underwriter today.'),
        qa('Board update', '📢', 'Write a two-paragraph board update on my current security posture.'),
      ],
    };
  }
  if (p.startsWith('/app/trends')) {
    return {
      area: 'trends',
      areaLabel: 'Trends',
      subline: "You're on Trends. I can explain what's moving your score up or down.",
      statusPool: ['Comparing week over week', 'Reviewing trend lines', 'Watching drift'],
      quickActions: [
        qa('What moved my score?', '📈', 'Explain which specific changes moved my score up or down in the last 30 days.'),
        qa('Drift over time', '📉', 'Show me where my posture is drifting negatively over time and why.'),
      ],
    };
  }
  if (p.startsWith('/app/trust')) {
    return {
      area: 'trust',
      areaLabel: 'Trust Center',
      subline: "You're in Trust Center. Ask me anything about audit readiness or evidence.",
      statusPool: ['Reviewing controls', 'Checking evidence', 'Watching compliance'],
      quickActions: [
        qa('Audit ready?', '📋', "Give me an honest read on whether I'm audit-ready right now, and list the gaps I'd fail on."),
        qa('Missing evidence', '📎', 'List controls that are missing evidence and what evidence you would collect for each.'),
      ],
    };
  }
  if (p.startsWith('/app/timeline') || p.startsWith('/app/graph')) {
    return {
      area: 'timeline',
      areaLabel: 'Activity Timeline',
      subline: "You're viewing the timeline. Ask me why anything on this page happened.",
      statusPool: ['Reviewing events', 'Correlating activity', 'Watching graph'],
      quickActions: [
        qa('Explain this window', '🔎', 'Explain what happened in the currently visible timeline window and whether any of it is concerning.'),
        qa('Correlate events', '🧩', 'Correlate the events on screen and tell me if any pattern is worth investigating.'),
      ],
    };
  }
  if (p.startsWith('/app/ray')) {
    return {
      area: 'ray',
      areaLabel: 'Ray',
      subline: "You're already with me. Ask anything — I have your full environment loaded.",
      statusPool: ['Ready', 'Watching', 'Listening', 'Thinking'],
      quickActions: GLOBAL_QUICK_ACTIONS,
    };
  }
  if (p.startsWith('/app/dashboard') || p === '/app' || p === '/') {
    return {
      area: 'dashboard',
      areaLabel: 'your dashboard',
      subline: "I've been reviewing your environment while you were away. Here's what I found.",
      statusPool: ['Watching', 'Reviewing devices', 'Scanning M365', 'Comparing passwords', 'Checking exposures'],
      quickActions: GLOBAL_QUICK_ACTIONS,
    };
  }

  return {
    area: 'other',
    areaLabel: 'Wrayth',
    subline: "I've been keeping watch. Ask me anything about your environment.",
    statusPool: ['Watching', 'Listening', 'Ready'],
    quickActions: GLOBAL_QUICK_ACTIONS,
  };
}
