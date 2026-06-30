/**
 * Browser-native voice input for Ray.
 *
 * Uses the Web Speech API (SpeechRecognition) — no external deps, no audio
 * upload. Falls back gracefully when unavailable (Firefox, older browsers).
 */

type SpeechRecognitionCtor = new () => SpeechRecognition;

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((this: SpeechRecognition, ev: any) => void) | null;
  onerror: ((this: SpeechRecognition, ev: any) => void) | null;
  onend: ((this: SpeechRecognition, ev: any) => void) | null;
}

export function isVoiceSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition,
  );
}

export interface VoiceSession {
  stop: () => void;
}

export function startVoiceCapture(opts: {
  onInterim?: (text: string) => void;
  onFinal: (text: string) => void;
  onError?: (msg: string) => void;
  onEnd?: () => void;
}): VoiceSession | null {
  const Ctor =
    ((window as any).SpeechRecognition as SpeechRecognitionCtor | undefined) ||
    ((window as any).webkitSpeechRecognition as SpeechRecognitionCtor | undefined);
  if (!Ctor) {
    opts.onError?.('Voice input is not supported in this browser.');
    return null;
  }

  const rec = new Ctor();
  rec.lang = 'en-US';
  rec.continuous = false;
  rec.interimResults = true;
  rec.maxAlternatives = 1;

  rec.onresult = (event: any) => {
    let interim = '';
    let final = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const text = result[0]?.transcript ?? '';
      if (result.isFinal) final += text;
      else interim += text;
    }
    if (interim) opts.onInterim?.(interim);
    if (final) opts.onFinal(final.trim());
  };
  rec.onerror = (event: any) => {
    opts.onError?.(event?.error || 'Voice capture failed.');
  };
  rec.onend = () => opts.onEnd?.();

  try {
    rec.start();
  } catch (err) {
    opts.onError?.(String(err));
    return null;
  }

  return {
    stop: () => {
      try { rec.stop(); } catch { /* noop */ }
    },
  };
}
