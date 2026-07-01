/**
 * Ray Voice — single source of truth for anything Ray says.
 *
 * Tone rules:
 *  - Calm. Confident. Plain English.
 *  - Speak in first person ("I'll…", "I noticed…").
 *  - Never dramatic. Never robotic. Never repeat the same phrase twice in a row.
 *  - Prefer outcomes over features ("I'll take care of your passwords",
 *    not "Vault module enabled").
 */

export type VoiceKey =
  | 'greetingMorning'
  | 'greetingAfternoon'
  | 'greetingEvening'
  | 'thinking'
  | 'briefReady'
  | 'briefBuilding'
  | 'briefAskAgain'
  | 'emptyPasswords'
  | 'emptyThreats'
  | 'emptyExposure'
  | 'emptyTimeline'
  | 'emptyIntegrations'
  | 'emptyDevices'
  | 'errorOffline'
  | 'errorTimeout'
  | 'errorAuth'
  | 'errorRate'
  | 'errorServer'
  | 'errorUnknown';

type Phrase = string | ((v: Record<string, string | number>) => string);

const RAY_PHRASES: Record<VoiceKey, Phrase> = {
  greetingMorning: ({ name = 'there' }) => `Good morning, ${name}. I've been keeping watch.`,
  greetingAfternoon: ({ name = 'there' }) => `Good afternoon, ${name}. Here's where things stand.`,
  greetingEvening: ({ name = 'there' }) => `Evening, ${name}. Let's close out the day.`,

  thinking: 'Working on it.',
  briefReady: "Today's briefing is ready.",
  briefBuilding: "Building today's assessment…",
  briefAskAgain: 'Ask Ray to check again',

  emptyPasswords: "No passwords yet. Let's secure your first account together.",
  emptyThreats: "Nothing suspicious detected. That's exactly what we want.",
  emptyExposure: "You're not monitoring any identities yet. Let's add one.",
  emptyTimeline: 'No activity yet. Once I start protecting you, everything will appear here.',
  emptyIntegrations: 'No accounts connected. Connect one and I can start protecting it.',
  emptyDevices: "No devices linked yet. Add one and I'll keep an eye on it.",

  errorOffline: "I can't reach the internet right now. I'll pick this back up as soon as you're online.",
  errorTimeout: 'That took longer than expected. Give it another try in a moment.',
  errorAuth: 'Your session expired. Sign back in and I\'ll pick up where we left off.',
  errorRate: 'A lot of activity happening at once. Give it a few seconds, then try again.',
  errorServer: "Something on my side isn't responding. I'll be back shortly — try again in a minute.",
  errorUnknown: "Something didn't go through. Try that again and I'll take another look.",
};

/**
 * Look up a Ray phrase. Never renders anything else — if a key is missing,
 * returns an empty string so the UI never leaks internal identifiers.
 */
export function say(key: VoiceKey, vars: Record<string, string | number> = {}): string {
  const phrase = RAY_PHRASES[key];
  if (!phrase) return '';
  return typeof phrase === 'function' ? phrase(vars) : phrase;
}

/** Convenience: pick the right greeting based on local time. */
export function rayGreeting(name?: string): string {
  const hour = new Date().getHours();
  const vars = { name: name ?? 'there' };
  if (hour < 12) return say('greetingMorning', vars);
  if (hour < 18) return say('greetingAfternoon', vars);
  return say('greetingEvening', vars);
}

/** Convenience: map an EdgeResult error code to a Ray sentence. */
export function rayError(code: 'offline' | 'timeout' | 'auth' | 'rate' | 'server' | 'unknown'): string {
  const map = {
    offline: 'errorOffline',
    timeout: 'errorTimeout',
    auth: 'errorAuth',
    rate: 'errorRate',
    server: 'errorServer',
    unknown: 'errorUnknown',
  } as const;
  return say(map[code]);
}
