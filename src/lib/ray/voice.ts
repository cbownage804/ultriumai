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

/* -------------------------------------------------------------------------- */
/* Voice capture — thin Web Speech API wrapper used by AskRayPalette.         */
/* Kept in this module so anything Ray "speaks" or "hears" lives in one file. */
/* -------------------------------------------------------------------------- */

export interface VoiceSession {
  stop: () => void;
}

interface VoiceCallbacks {
  onInterim?: (text: string) => void;
  onFinal?: (text: string) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
  resultIndex: number;
}

function resolveRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isVoiceSupported(): boolean {
  return resolveRecognitionCtor() !== null;
}

/**
 * Start a short-form voice capture session. Returns null if the browser
 * doesn't support the Web Speech API. Ray never blocks on voice — callers
 * should keep the keyboard path fully functional either way.
 */
export function startVoiceCapture(cb: VoiceCallbacks): VoiceSession | null {
  const Ctor = resolveRecognitionCtor();
  if (!Ctor) {
    cb.onError?.("Voice isn't available in this browser.");
    return null;
  }

  const rec = new Ctor();
  rec.continuous = false;
  rec.interimResults = true;
  rec.lang = typeof navigator !== 'undefined' ? navigator.language || 'en-US' : 'en-US';

  rec.onresult = (event) => {
    let interim = '';
    let final = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const chunk = event.results[i];
      const transcript = chunk[0]?.transcript ?? '';
      if (chunk.isFinal) final += transcript;
      else interim += transcript;
    }
    if (interim) cb.onInterim?.(interim.trim());
    if (final) cb.onFinal?.(final.trim());
  };

  rec.onerror = (event) => {
    const code = event.error ?? 'unknown';
    const msg =
      code === 'not-allowed' || code === 'service-not-allowed'
        ? 'Microphone access was blocked.'
        : code === 'no-speech'
          ? "I didn't catch that."
          : "Voice input didn't work. Try typing instead.";
    cb.onError?.(msg);
  };

  rec.onend = () => {
    cb.onEnd?.();
  };

  try {
    rec.start();
  } catch {
    cb.onError?.("Voice input didn't start.");
    return null;
  }

  return {
    stop: () => {
      try {
        rec.stop();
      } catch {
        /* no-op */
      }
    },
  };
}

