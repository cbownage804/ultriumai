/**
 * Build Completion Chime — Web Audio API oscillator
 * Plays a subtle two-tone chime when generation finishes.
 */
import { useEffect, useRef, useCallback } from 'react';

export function useBuildChime(enabled: boolean = true) {
  const prevGeneratingRef = useRef(false);
  const ctxRef = useRef<AudioContext | null>(null);

  const playChime = useCallback(() => {
    if (!enabled) return;
    try {
      const ctx = ctxRef.current || new AudioContext();
      ctxRef.current = ctx;
      const now = ctx.currentTime;

      // First tone: C5 (523 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.value = 523;
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc1.connect(gain1).connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Second tone: E5 (659 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.value = 659;
      gain2.gain.setValueAtTime(0.06, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2).connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.45);
    } catch {
      // AudioContext not available — silent fail
    }
  }, [enabled]);

  const onGeneratingChange = useCallback((isGenerating: boolean) => {
    if (prevGeneratingRef.current && !isGenerating) {
      playChime();
    }
    prevGeneratingRef.current = isGenerating;
  }, [playChime]);

  return { onGeneratingChange, playChime };
}
