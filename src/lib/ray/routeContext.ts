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

export function getRouteContext(pathname: string): RouteContext {
  const p = pathname.toLowerCase();

  if (p.startsWith('/app/threats')) {
    return {
      area: 'threats',
      areaLabel: 'Threat Center',
      subline: "You're reviewing Threat Center. I've been watching the feeds — I'll flag anything unusual here.",
      statusPool: ['Watching threats', 'Scanning feeds', 'Reviewing verdicts', 'Comparing IOCs'],
    };
  }
  if (p.startsWith('/app/exposure')) {
    return {
      area: 'exposure',
      areaLabel: 'Exposure',
      subline: "You're on Exposure. I've been comparing your identifiers against fresh breach feeds.",
      statusPool: ['Comparing breach feeds', 'Checking exposures', 'Scanning identities', 'Watching leaks'],
    };
  }
  if (p.startsWith('/app/passwords')) {
    return {
      area: 'passwords',
      areaLabel: 'Password Health',
      subline: "You're in Password Health. I'll help you find weak, reused or exposed credentials.",
      statusPool: ['Reviewing passwords', 'Comparing breach feeds', 'Checking reuse', 'Watching vault'],
    };
  }
  if (p.startsWith('/app/identity')) {
    return {
      area: 'identity',
      areaLabel: 'Identity',
      subline: "You're on Identity. I've been mapping who has access to what across your tenant.",
      statusPool: ['Reviewing identity graph', 'Checking sessions', 'Watching sign-ins'],
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
      };
    }
    return {
      area: 'devices',
      areaLabel: 'Devices',
      subline: "You're on Devices. I've checked every enrolled endpoint since your last visit.",
      statusPool: ['Reviewing devices', 'Checking endpoints', 'Comparing baselines', 'Watching agents'],
    };
  }
  if (p.startsWith('/app/integrations') || p.includes('microsoft') || p.includes('m365') || p.includes('/365')) {
    return {
      area: 'microsoft365',
      areaLabel: 'Microsoft 365',
      subline: "You're in Microsoft 365. I've reviewed your tenant — here's what changed since yesterday.",
      statusPool: ['Scanning M365', 'Reviewing tenant', 'Checking sign-ins', 'Watching Entra'],
    };
  }
  if (p.startsWith('/app/reports')) {
    return {
      area: 'reports',
      areaLabel: 'Reports',
      subline: "You're on Reports. Ask me to summarize any timeframe or export a briefing.",
      statusPool: ['Preparing reports', 'Summarizing posture', 'Watching trends'],
    };
  }
  if (p.startsWith('/app/trends')) {
    return {
      area: 'trends',
      areaLabel: 'Trends',
      subline: "You're on Trends. I can explain what's moving your score up or down.",
      statusPool: ['Comparing week over week', 'Reviewing trend lines', 'Watching drift'],
    };
  }
  if (p.startsWith('/app/trust')) {
    return {
      area: 'trust',
      areaLabel: 'Trust Center',
      subline: "You're in Trust Center. Ask me anything about audit readiness or evidence.",
      statusPool: ['Reviewing controls', 'Checking evidence', 'Watching compliance'],
    };
  }
  if (p.startsWith('/app/timeline') || p.startsWith('/app/graph')) {
    return {
      area: 'timeline',
      areaLabel: 'Activity Timeline',
      subline: "You're viewing the timeline. Ask me why anything on this page happened.",
      statusPool: ['Reviewing events', 'Correlating activity', 'Watching graph'],
    };
  }
  if (p.startsWith('/app/ray')) {
    return {
      area: 'ray',
      areaLabel: 'Ray',
      subline: "You're already with me. Ask anything — I have your full environment loaded.",
      statusPool: ['Ready', 'Watching', 'Listening', 'Thinking'],
    };
  }
  if (p.startsWith('/app/dashboard') || p === '/app' || p === '/') {
    return {
      area: 'dashboard',
      areaLabel: 'your dashboard',
      subline: "I've been reviewing your environment while you were away. Here's what I found.",
      statusPool: ['Watching', 'Reviewing devices', 'Scanning M365', 'Comparing passwords', 'Checking exposures'],
    };
  }

  return {
    area: 'other',
    areaLabel: 'Wrayth',
    subline: "I've been keeping watch. Ask me anything about your environment.",
    statusPool: ['Watching', 'Listening', 'Ready'],
  };
}
